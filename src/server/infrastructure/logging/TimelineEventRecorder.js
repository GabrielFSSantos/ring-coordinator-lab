const { randomUUID } = require("crypto");
const { buildTimelineMessage, parseDetail } = require("./humanLogFormatter");
const { shouldPersistTimelineEvent } = require("./timelinePersistPolicy");

const MAX_QUEUE = 200;
const MAX_RETRIES = 2;

class TimelineEventRecorder {
  constructor(options) {
    this.storageClient = options.storageClient || null;
    this.appendLocal = options.appendLocal || null;
    this.skipSet = options.skipSet;
    this.identity = {
      labHostName: options.labHostName || "-",
      hostname: options.hostname || "-",
      port: options.port,
    };
    this.queue = [];
    this.draining = false;
    this.dropped = 0;
  }

  enqueue(roleKey, eventCode, detail, extra = {}) {
    if (!shouldPersistTimelineEvent(eventCode, this.skipSet)) return;
    const context = {
      labHostName: this.identity.labHostName,
      hostname: this.identity.hostname,
      port: this.identity.port,
    };
    const message = buildTimelineMessage(context, roleKey, eventCode, detail, extra);
    if (!message) return;

    const kv = parseDetail(detail);
    const payload = {
      clientEventId: randomUUID(),
      eventCode,
      role: roleKey,
      labHostName: context.labHostName,
      nodeName: context.hostname,
      nodePort: context.port,
      message,
      detail: detail || null,
      requestId: kv.req || extra.requestId || null,
    };

    if (this.queue.length >= MAX_QUEUE) {
      this.queue.shift();
      this.dropped += 1;
    }
    this.queue.push(payload);
    if (!this.draining) {
      this.draining = true;
      setImmediate(() => this.drainQueue());
    }
  }

  async drainQueue() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      let ok = false;
      for (let attempt = 0; attempt <= MAX_RETRIES && !ok; attempt += 1) {
        try {
          if (this.appendLocal) {
            this.appendLocal({
              clientEventId: item.clientEventId,
              eventCode: item.eventCode,
              role: item.role,
              labHostName: item.labHostName,
              nodeName: item.nodeName,
              nodePort: item.nodePort,
              message: item.message,
              detail: item.detail,
              requestId: item.requestId,
            });
            ok = true;
          } else if (this.storageClient) {
            await this.storageClient.appendTimelineEvent(item);
            ok = true;
          }
        } catch {
          await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
        }
      }
      if (!ok) this.dropped += 1;
    }
    this.draining = false;
    if (this.queue.length > 0) {
      this.draining = true;
      setImmediate(() => this.drainQueue());
    }
  }

  async drain(timeoutMs = 2000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.queue.length === 0 && !this.draining) return;
      if (!this.draining && this.queue.length > 0) {
        this.draining = true;
        await this.drainQueue();
      } else {
        await new Promise((r) => setTimeout(r, 5));
      }
    }
  }
}

module.exports = { TimelineEventRecorder };
