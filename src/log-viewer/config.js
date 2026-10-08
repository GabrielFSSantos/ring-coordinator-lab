const { parseLogStdoutMode } = require("../server/config/env");

function boolEnv(name, defaultVal) {
  const v = process.env[name];
  if (v === undefined) return defaultVal;
  return v === "true" || v === "1";
}

function loadLogViewerConfig() {
  const storageUrl = (process.env.STORAGE_URL || "").replace(/\/$/, "");
  return {
    labHostName: process.env.LAB_HOST_NAME || "lab-tail",
    hostname: process.env.HOSTNAME || "lab-tail",
    port: parseInt(process.env.NODE_PORT || "0", 10) || 0,
    storageUrl,
    storageWriteToken: process.env.STORAGE_WRITE_TOKEN || "lab-write-token",
    logStdoutMode: parseLogStdoutMode(
      process.env.LOG_STDOUT_MODE || "timeline_all"
    ),
    logTimelinePollMs: parseInt(process.env.LOG_TIMELINE_POLL_MS || "400", 10),
    logTimelinePersist: boolEnv("LOG_TIMELINE_PERSIST", true),
    logFormat: (process.env.LOG_FORMAT || "human").toLowerCase(),
    logStyle: (process.env.LOG_STYLE || "box").toLowerCase(),
    logDockerOps: boolEnv("LOG_DOCKER_OPS", true),
  };
}

module.exports = { loadLogViewerConfig };
