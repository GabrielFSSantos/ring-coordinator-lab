const http = require("http");
const { URL } = require("url");
const { LedgerDatabase } = require("./LedgerDatabase");
const { LabLogger } = require("../server/infrastructure/logging/LabLogger");
const { LogEventCodes } = require("../server/infrastructure/logging/logEventCodes");
const { TimelineEventRecorder } = require("../server/infrastructure/logging/TimelineEventRecorder");
const { parseSkipCodes } = require("../server/infrastructure/logging/timelinePersistPolicy");
const { StorageHttpClient } = require("../server/infrastructure/storage/StorageHttpClient");
const { TimelineStdoutPoller } = require("../server/infrastructure/logging/TimelineStdoutPoller");
const { writeOpsLine } = require("../server/infrastructure/logging/dockerOpsLog");
const { StorageMdnsPublisher } = require("./infrastructure/StorageMdnsPublisher");
const { resolveWritablePrimary } = require("./domain/StoragePrimaryResolver");

async function fetchJson(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

class StorageServer {
  constructor(config) {
    this.config = config;
    this.logger = new LabLogger({
      labHostName: config.labHostName,
      hostname: "storage",
      port: config.storageHttpPort,
      logEnabled: config.logEnabled,
      logStorage: config.logStorage,
      logFormat: config.logFormat,
      logStyle: config.logStyle,
      logDetail: config.logDetail,
      logTxStory: config.logTxStory,
      logTimelinePersist: config.logTimelinePersist,
      logStdoutMode: config.logStdoutMode,
    });
    this.mode = config.storageMode;
    this.timelineStdoutPoller = null;
    this.primaryBaseUrl = null;
    this.isWritable = false;
    this.db = null;
    this.server = null;
    this.mdnsPublisher = null;
  }

  async start() {
    await this.resolvePrimaryMode();
    if (this.isWritable) {
      this.db = new LedgerDatabase(
        this.config.databasePath,
        this.config.ledgerSchemaPath,
        this.config.ledgerInitialBalance
      );
      this.db.open({ resetOnStart: this.config.ledgerResetOnStart });
      if (this.config.logTimelinePersist) {
        const skipSet = parseSkipCodes(this.config.logTimelineSkipCodes);
        const recorder = new TimelineEventRecorder({
          appendLocal: (payload) => this.db.appendTimelineEvent(payload),
          skipSet,
          labHostName: this.config.labHostName,
          hostname: "storage",
          port: this.config.storageHttpPort,
        });
        this.logger.setTimelineRecorder(recorder);
      }
      const primaryId = `${this.config.labHostName}-${this.config.storageHttpPort}`;
      this.primaryBaseUrl = `http://${this.config.advertiseHost}:${this.config.storageHttpPort}`;
      this.db.setPrimaryMeta({
        primaryId,
        ownerHost: this.config.labHostName,
        baseUrl: this.primaryBaseUrl,
        epoch: Date.now(),
      });
      this.logger.boot(
        LogEventCodes.STORAGE_PRIMARY,
        `url=${this.primaryBaseUrl} db=${this.config.databasePath}`
      );
    } else if (this.mode === "standby") {
      this.logger.boot(
        LogEventCodes.STORAGE_STANDBY,
        `Modo standby — primário remoto em ${this.primaryBaseUrl}`
      );
    } else {
      this.logger.boot(
        LogEventCodes.STORAGE_NONE,
        "Modo none — sem servidor HTTP de ledger neste processo."
      );
      return;
    }

    this.server = http.createServer((req, res) => this.handle(req, res));
    await new Promise((resolve) => {
      this.server.listen(this.config.storageHttpPort, () => {
        this.logger.boot(
          LogEventCodes.STORAGE_HTTP_READY,
          `port=${this.config.storageHttpPort}`
        );
        writeOpsLine(this.config.logDockerOps, {
          labHostName: this.config.labHostName,
          service: "banco",
          message: `ativo (${this.primaryBaseUrl || `porta=${this.config.storageHttpPort}`})`,
        });
        resolve();
      });
    });

    if (
      this.config.logStdoutMode === "timeline_self" &&
      this.primaryBaseUrl
    ) {
      const client = new StorageHttpClient(
        this.primaryBaseUrl,
        this.config.storageWriteToken
      );
      this.timelineStdoutPoller = new TimelineStdoutPoller({
        storageClient: client,
        mode: "timeline_self",
        labHostName: this.config.labHostName,
        hostname: "storage",
        port: this.config.storageHttpPort,
        logFormat: this.config.logFormat,
        logStyle: this.config.logStyle,
        pollMs: this.config.logTimelinePollMs,
        logTimelinePersist: this.config.logTimelinePersist,
      });
      this.timelineStdoutPoller.start();
    }

    if (this.isWritable && this.primaryBaseUrl) {
      this.mdnsPublisher = new StorageMdnsPublisher(this.config);
      this.mdnsPublisher.start(this.primaryBaseUrl);
    }
  }

  stop() {
    this.mdnsPublisher?.stop();
    this.timelineStdoutPoller?.stop();
    this.server?.close();
  }

  async resolvePrimaryMode() {
    if (this.mode !== "primary") {
      if (this.config.storageUrl) {
        this.primaryBaseUrl = this.config.storageUrl.replace(/\/$/, "");
      }
      return;
    }
    const discovery =
      this.config.storageDiscoveryUrl ||
      (this.config.bootstrapPeer
        ? `http://${this.config.bootstrapPeer.split(":")[0]}:${this.config.storageHttpPort}`
        : null);
    const resolved = await resolveWritablePrimary({
      ...this.config,
      storageDiscoveryUrl: discovery,
    });
    this.mode = resolved.mode;
    this.isWritable = resolved.isWritable;
    if (resolved.primaryBaseUrl) {
      this.primaryBaseUrl = resolved.primaryBaseUrl;
    }
  }

  applyCors(res, req) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-storage-token");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return true;
    }
    return false;
  }

  json(res, status, body) {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(body));
  }

  async proxyGet(path) {
    const url = `${this.primaryBaseUrl}${path}`;
    const res = await fetch(url);
    return { status: res.status, body: await res.json() };
  }

  handle(req, res) {
    if (this.applyCors(res, req)) return;
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/v1/health") {
      return this.json(res, 200, {
        ok: true,
        writable: this.isWritable,
        mode: this.mode,
      });
    }
    if (url.pathname === "/v1/storage/primary") {
      if (!this.isWritable) {
        return this.json(res, 200, {
          primaryId: "remote",
          baseUrl: this.primaryBaseUrl,
          ownerHost: "remote",
          epoch: 0,
        });
      }
      const meta = this.db.getPrimaryMeta();
      return this.json(res, 200, {
        primaryId: meta.primary_id,
        baseUrl: meta.base_url,
        ownerHost: meta.owner_host,
        epoch: meta.epoch,
      });
    }

    if (!this.isWritable) {
      if (req.method === "GET") {
        this.proxyGet(url.pathname + url.search)
          .then((p) => this.json(res, p.status, p.body))
          .catch(() => this.json(res, 502, { error: "storage_unreachable" }));
        return;
      }
      return this.json(res, 503, { error: "not_primary" });
    }

    if (url.pathname === "/v1/balance" && req.method === "GET") {
      const cents = this.db.getBalance();
      return this.json(res, 200, { balanceCents: cents });
    }

    if (url.pathname === "/v1/ledger" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const afterId = parseInt(url.searchParams.get("afterId") || "0", 10);
      const rows = this.db.listLedger(limit, afterId);
      return this.json(res, 200, { entries: rows });
    }

    if (url.pathname === "/v1/timeline-events" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "100", 10);
      const afterId = parseInt(url.searchParams.get("afterId") || "0", 10);
      const requestId = url.searchParams.get("requestId") || null;
      const events = this.db.listTimelineEvents(limit, afterId, requestId);
      return this.json(res, 200, { events });
    }

    if (url.pathname === "/v1/timeline-events" && req.method === "POST") {
      const token = req.headers["x-storage-token"];
      if (token !== this.config.storageWriteToken) {
        return this.json(res, 401, { error: "unauthorized" });
      }
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const result = this.db.appendTimelineEvent({
            clientEventId: data.clientEventId,
            eventCode: data.eventCode,
            role: data.role,
            labHostName: data.labHostName,
            nodeName: data.nodeName,
            nodePort: data.nodePort,
            message: data.message,
            detail: data.detail,
            requestId: data.requestId,
          });
          this.json(res, 200, result);
        } catch (err) {
          this.json(res, 400, { error: err.message });
        }
      });
      return;
    }

    if (url.pathname === "/v1/transactions" && req.method === "POST") {
      const token = req.headers["x-storage-token"];
      if (token !== this.config.storageWriteToken) {
        return this.json(res, 401, { error: "unauthorized" });
      }
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const result = this.db.applyTransaction({
            requestId: data.requestId,
            hostName: data.hostName,
            nodeName: data.nodeName,
            nodePort: data.nodePort,
            deltaCents: data.deltaCents,
          });
          this.json(res, 200, result);
        } catch (err) {
          this.json(res, 400, { error: err.message });
        }
      });
      return;
    }

    if (url.pathname === "/v1/admin" && req.method === "POST") {
      const token = req.headers["x-storage-token"];
      if (token !== this.config.storageWriteToken) {
        return this.json(res, 401, { error: "unauthorized" });
      }
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const entry = this.db.appendAdmin({
            requestId: data.requestId,
            hostName: data.hostName,
            nodeName: data.nodeName,
            message: data.message,
          });
          this.json(res, 200, { entry });
        } catch (err) {
          this.json(res, 400, { error: err.message });
        }
      });
      return;
    }

    this.json(res, 404, { error: "not_found" });
  }
}

module.exports = { StorageServer };
