const path = require("path");
const { parseLogStdoutMode } = require("../server/config/env");

function boolEnv(name, defaultVal) {
  const v = process.env[name];
  if (v === undefined) return defaultVal;
  return v === "true" || v === "1";
}

function loadStorageConfig() {
  return {
    labHostName: process.env.LAB_HOST_NAME || "storage-host",
    advertiseHost: process.env.ADVERTISE_HOST || "127.0.0.1",
    storageMode: (process.env.STORAGE_MODE || "primary").toLowerCase(),
    storageHttpPort: parseInt(process.env.STORAGE_HTTP_PORT || "4000", 10),
    storageUrl: process.env.STORAGE_URL || "",
    storageDiscoveryUrl: process.env.STORAGE_DISCOVERY_URL || "",
    bootstrapPeer: process.env.BOOTSTRAP_PEER || "",
    databasePath: process.env.DATABASE_PATH || "./data/ledger.db",
    ledgerSchemaPath:
      process.env.LEDGER_SCHEMA_PATH ||
      path.resolve(__dirname, "../../schema-ledger.sql"),
    ledgerInitialBalance: process.env.LEDGER_INITIAL_BALANCE || "10000.00",
    ledgerResetOnStart: boolEnv("LEDGER_RESET_ON_START", true),
    storageWriteToken: process.env.STORAGE_WRITE_TOKEN || "lab-write-token",
    logEnabled: boolEnv("LOG_ENABLED", true),
    logStorage: boolEnv("LOG_STORAGE", true),
    logFormat: (process.env.LOG_FORMAT || "human").toLowerCase(),
    logStyle: (process.env.LOG_STYLE || "box").toLowerCase(),
    logDetail: boolEnv("LOG_DETAIL", false),
    logTxStory: boolEnv("LOG_TX_STORY", true),
    logTimelinePersist: boolEnv("LOG_TIMELINE_PERSIST", true),
    logTimelineSkipCodes: process.env.LOG_TIMELINE_SKIP_CODES || "",
    logStdoutMode: parseLogStdoutMode(process.env.LOG_STDOUT_MODE),
    logTimelinePollMs: parseInt(process.env.LOG_TIMELINE_POLL_MS || "400", 10),
    logDockerOps:
      process.env.LOG_DOCKER_OPS !== undefined
        ? boolEnv("LOG_DOCKER_OPS", false)
        : parseLogStdoutMode(process.env.LOG_STDOUT_MODE) !== "direct",
  };
}

module.exports = { loadStorageConfig };
