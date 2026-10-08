const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

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

const { loadConfig } = require("../config/env");
const { NodeApplication } = require("../application/NodeApplication");
const { LabLogger } = require("../infrastructure/logging/LabLogger");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");
const { writeOpsLine } = require("../infrastructure/logging/dockerOpsLog");

function logBootstrapFailure(err) {
  const config = loadConfig();
  writeOpsLine(true, {
    labHostName: config.labHostName,
    service: config.hostname,
    message: `erro: ${err.message || String(err)}`,
  });
  const logger = new LabLogger({ ...config, logEnabled: true });
  logger.boot(LogEventCodes.BOOTSTRAP_FAIL, err.message || String(err));
}

function startSingleNode() {
  const config = loadConfig();
  if (config.storageUrlRequired && !config.storageUrl) {
    console.error(
      "STORAGE_URL é obrigatório (defina no lab.env; em LAN use o IP do PC do banco)."
    );
    process.exit(1);
  }
  if (!config.useStorageHttp) {
    const localSchema = path.resolve(__dirname, "../../../schema.sql");
    config.schemaPath = config.schemaPath || localSchema;
  }
  const app = new NodeApplication(config);
  return app.start();
}

function startMultiNodeSupervisor() {
  const baseConfig = loadConfig();
  const count = Math.min(Math.max(baseConfig.nodeCount, 1), 4);
  const basePort = baseConfig.advertisePortBase;
  const children = [];

  for (let i = 0; i < count; i++) {
    const port = basePort + i;
    const httpPort =
      port + parseInt(process.env.NODE_HTTP_PORT_OFFSET || "1000", 10);
    const child = fork(__filename, [], {
      env: {
        ...process.env,
        NODE_COUNT: "1",
        NODE_PORT: String(port),
        NODE_HTTP_PORT: String(httpPort),
        HOSTNAME: `ubuntu-node-${port}`,
        LAB_WORKER_INDEX: String(i),
      },
      stdio: "inherit",
    });
    children.push(child);
  }

  const shutdown = () => {
    children.forEach((c) => c.kill("SIGTERM"));
    setTimeout(() => process.exit(0), 500);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.env.LAB_WORKER_INDEX !== undefined) {
  startSingleNode().catch((err) => {
    logBootstrapFailure(err);
    process.exit(1);
  });
} else {
  const supervisorConfig = loadConfig();
  if (supervisorConfig.nodeCount > 1) {
    startMultiNodeSupervisor();
  } else {
    startSingleNode().catch((err) => {
      logBootstrapFailure(err);
      process.exit(1);
    });
  }
}
