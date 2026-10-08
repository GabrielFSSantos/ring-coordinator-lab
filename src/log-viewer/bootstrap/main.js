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

const { loadLogViewerConfig } = require("../config");
const { StorageHttpClient } = require("../../server/infrastructure/storage/StorageHttpClient");
const { TimelineStdoutPoller } = require("../../server/infrastructure/logging/TimelineStdoutPoller");
const { writeOpsLine } = require("../../server/infrastructure/logging/dockerOpsLog");

const config = loadLogViewerConfig();
const mode = config.logStdoutMode === "timeline_all"
  ? "timeline_all"
  : config.logStdoutMode;

if (!config.storageUrl) {
  console.error("lab-tail: defina STORAGE_URL no lab.env");
  process.exit(1);
}

const storageClient = new StorageHttpClient(
  config.storageUrl,
  config.storageWriteToken
);

const poller = new TimelineStdoutPoller({
  storageClient,
  mode,
  labHostName: config.labHostName,
  hostname: config.hostname,
  port: config.port,
  logFormat: config.logFormat,
  logStyle: config.logStyle,
  pollMs: config.logTimelinePollMs,
  logTimelinePersist: config.logTimelinePersist,
});

poller.start();

writeOpsLine(config.logDockerOps, {
  labHostName: config.labHostName,
  service: "lab-tail",
  message: `seguindo timeline (${config.storageUrl}) — use: docker compose --profile local logs -f lab-tail`,
});

process.on("SIGINT", () => {
  poller.stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  poller.stop();
  process.exit(0);
});
