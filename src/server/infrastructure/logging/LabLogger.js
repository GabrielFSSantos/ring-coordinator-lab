const {
  formatHumanBlock,
  formatStructuredLine,
} = require("./humanLogFormatter");
const { LogEventCodes } = require("./logEventCodes");

const stdoutMutex = { locked: false, queue: [] };

function writeBlock(lines) {
  if (!lines || lines.length === 0) return;
  const text = lines.map((l) => `${l}\n`).join("") + "\n";
  stdoutMutex.queue.push(text);
  if (stdoutMutex.locked) return;
  stdoutMutex.locked = true;
  while (stdoutMutex.queue.length) {
    const chunk = stdoutMutex.queue.shift();
    process.stdout.write(chunk);
  }
  stdoutMutex.locked = false;
}

class LabLogger {
  constructor(config) {
    this.config = config;
    this.logFormat = (config.logFormat || "human").toLowerCase();
    this.logStdoutMode = (config.logStdoutMode || "direct").toLowerCase();
    this.timelineRecorder = config.timelineRecorder || null;
  }

  setTimelineRecorder(recorder) {
    this.timelineRecorder = recorder;
  }

  formatOpts() {
    return {
      logStyle: (this.config.logStyle || "box").toLowerCase(),
      logDetail: this.config.logDetail === true,
      logTxStory: this.config.logTxStory !== false,
    };
  }

  enabled(flag) {
    if (!this.config.logEnabled) return false;
    return flag;
  }

  emit(roleKey, eventCode, detail, extra = {}) {
    const context = {
      labHostName: this.config.labHostName,
      hostname: this.config.hostname,
      port: this.config.port,
    };
    const mergedExtra = { ...extra, formatOpts: this.formatOpts() };
    const lines =
      this.logFormat === "structured"
        ? formatStructuredLine(context, roleKey, eventCode, detail, mergedExtra)
        : formatHumanBlock(context, roleKey, eventCode, detail, mergedExtra);
    if (this.logStdoutMode === "direct") {
      writeBlock(lines);
    }
    if (this.config.logTimelinePersist && this.timelineRecorder && eventCode) {
      this.timelineRecorder.enqueue(roleKey, eventCode, detail, extra);
    }
  }

  async drainTimeline(timeoutMs = 2000) {
    if (!this.timelineRecorder?.drain) return;
    await this.timelineRecorder.drain(timeoutMs);
  }

  line(role, event, detail, extra = {}) {
    this.emit(role, event, detail, extra);
  }

  write(event, detail, extra) {
    if (!this.enabled(this.config.logWrites)) return;
    this.emit("LEADER", event, detail, extra);
  }

  read(event, detail) {
    if (!this.enabled(this.config.logReads)) return;
    this.emit("FOLLOWER", event, detail);
  }

  election(event, detail, extra) {
    if (!this.enabled(this.config.logElection)) return;
    this.emit("ELECTION", event, detail, extra);
  }

  ringView(ringViewData) {
    if (!this.enabled(this.config.logElection)) return;
    this.emit("ELECTION", LogEventCodes.RING_VIEW, "", {
      ringView: ringViewData,
    });
  }

  story(roleKey, storyLines) {
    if (!this.enabled(this.config.logWrites)) return;
    this.emit(roleKey, LogEventCodes.TX_STORY, "", { storyLines });
  }

  queue(event, detail, pos, total) {
    if (!this.enabled(this.config.logQueue)) return;
    this.emit("LEADER", event, detail, { queue: `${pos}/${total}` });
  }

  storage(event, detail) {
    if (!this.enabled(this.config.logStorage)) return;
    const code =
      event === "WARN"
        ? LogEventCodes.STORAGE_WARN
        : event === "DISCARD"
          ? LogEventCodes.STORAGE_DISCARD
          : event === "DEFER"
            ? LogEventCodes.STORAGE_DEFER
            : event === "UP"
            ? LogEventCodes.STORAGE_UP
            : event === "DOWN"
              ? LogEventCodes.STORAGE_DOWN
              : event === "RECOVERED"
                ? LogEventCodes.STORAGE_UP
                : event;
    this.emit("STORAGE", code, detail);
  }

  sim(event, detail) {
    if (!this.enabled(this.config.logSim)) return;
    this.emit("SIM", event, detail);
  }

  boot(event, detail, extra) {
    if (!this.config.logEnabled) return;
    this.emit("BOOT", event, detail, extra);
  }
}

module.exports = { LabLogger, writeBlock };
