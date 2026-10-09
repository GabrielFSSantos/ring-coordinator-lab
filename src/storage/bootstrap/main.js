const path = require("path");
const fs = require("fs");

function resolveLabEnvPath() {
  const candidates = [
    path.resolve(process.cwd(), "lab.env"),
    path.resolve(process.cwd(), "..", "lab.env"),
    path.resolve(__dirname, "../../../lab.env"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const labEnvPath = resolveLabEnvPath();
if (labEnvPath) {
  require("dotenv").config({ path: labEnvPath });
}
require("dotenv").config();

const { loadStorageConfig } = require("../config");
const { StorageServer } = require("../StorageServer");
const { LabLogger } = require("../../server/infrastructure/logging/LabLogger");
const { LogEventCodes } = require("../../server/infrastructure/logging/logEventCodes");
const { writeOpsLine } = require("../../server/infrastructure/logging/dockerOpsLog");

const config = loadStorageConfig();
const server = new StorageServer(config);
const shutdown = () => {
  server.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.start().catch((err) => {
  writeOpsLine(true, {
    labHostName: config.labHostName,
    service: "banco",
    message: `erro: ${err.message || String(err)}`,
  });
  const logger = new LabLogger({
    labHostName: config.labHostName,
    hostname: "storage",
    port: config.storageHttpPort,
    logEnabled: true,
    logFormat: config.logFormat,
  });
  logger.boot(LogEventCodes.BOOTSTRAP_FAIL, err.message || String(err));
  process.exit(1);
});
