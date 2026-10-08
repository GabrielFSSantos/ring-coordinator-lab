const { writeBlock } = require("./LabLogger");
const { wrapInBox } = require("./logBoxRenderer");
const { boxTitle } = require("./friendlyNames");
const { ROLE_LABELS } = require("./humanLogFormatter");

function matchesIdentity(row, identity) {
  const labHost = row.lab_host_name ?? row.labHostName;
  const nodeName = row.node_name ?? row.nodeName;
  const nodePort = row.node_port ?? row.nodePort;
  return (
    labHost === identity.labHostName &&
    nodeName === identity.hostname &&
    Number(nodePort) === Number(identity.port)
  );
}

function linesForTimelineRow(row, opts) {
  const message = row.message || "";
  if (!message) return [];

  const logFormat = (opts.logFormat || "human").toLowerCase();
  const logStyle = (opts.logStyle || "box").toLowerCase();

  if (logFormat === "structured") {
    const code = row.event_code ?? row.eventCode ?? "EVENT";
    return [`[${code}] ${message}`];
  }

  if (logStyle === "plain") {
    return message.split("\n").filter((l) => l.length > 0);
  }

  const roleKey = row.role || "BOOT";
  const context = {
    labHostName: row.lab_host_name ?? row.labHostName,
    hostname: row.node_name ?? row.nodeName ?? "lab",
    port: row.node_port ?? row.nodePort,
  };
  const title = boxTitle(context, roleKey, ROLE_LABELS);
  const bodyLines = message.split("\n").filter((l) => l.length > 0);
  return wrapInBox(title, bodyLines, { port: context.port });
}

class TimelineStdoutPoller {
  constructor(options) {
    this.storageClient = options.storageClient;
    this.mode = options.mode;
    this.identity = {
      labHostName: options.labHostName,
      hostname: options.hostname,
      port: options.port,
    };
    this.logFormat = options.logFormat || "human";
    this.logStyle = options.logStyle || "box";
    this.pollMs = Math.max(100, options.pollMs || 400);
    this.afterId = 0;
    this.timer = null;
    this.warnedNoPersist = options.warnedNoPersist === true;
    this.logTimelinePersist = options.logTimelinePersist !== false;
    this._tickInFlight = false;
  }

  start() {
    if (this.mode !== "timeline_self" && this.mode !== "timeline_all") {
      return;
    }
    if (!this.storageClient) {
      console.warn(
        "[lab-tail] LOG_STDOUT_MODE timeline_* exige STORAGE_URL configurado."
      );
      return;
    }
    if (!this.logTimelinePersist && !this.warnedNoPersist) {
      console.warn(
        "[lab-tail] LOG_TIMELINE_PERSIST=false — stdout via timeline ficará vazio."
      );
      this.warnedNoPersist = true;
    }
    this.timer = setInterval(() => this.tick(), this.pollMs);
    this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    if (this._tickInFlight) return;
    this._tickInFlight = true;
    try {
      let batch;
      try {
        batch = await this.storageClient.listTimelineEvents({
          afterId: this.afterId,
          limit: 50,
        });
      } catch {
        return;
      }
      if (!Array.isArray(batch) || batch.length === 0) return;

      for (const row of batch) {
        const id = row.id;
        if (id == null) continue;

        const shouldPrint =
          this.mode === "timeline_all" ||
          (this.mode === "timeline_self" &&
            matchesIdentity(row, this.identity));

        if (shouldPrint) {
          const lines = linesForTimelineRow(row, {
            logFormat: this.logFormat,
            logStyle: this.logStyle,
          });
          writeBlock(lines);
        }
        this.afterId = id;
      }
    } finally {
      this._tickInFlight = false;
    }
  }
}

module.exports = { TimelineStdoutPoller, matchesIdentity, linesForTimelineRow };
