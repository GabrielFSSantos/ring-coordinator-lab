const { LabLogger } = require("../infrastructure/logging/LabLogger");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");

function printEnvironmentVariables(allInfos, config = {}) {
  const logger = new LabLogger({
    labHostName: config.labHostName || allInfos.labHostName || "-",
    hostname: allInfos.hostname || "-",
    port: allInfos.port,
    logEnabled: true,
    logFormat: config.logFormat || "human",
  });
  const lines = [
    `IP local: ${allInfos.localIp}`,
    `Porta do nó: ${allInfos.port}`,
    `IP do sucessor: ${allInfos.successorIp}`,
    `IP do coordenador: ${allInfos.coordinatorIp}`,
    `É coordenador: ${allInfos.isCoordinator}`,
    `Lista de peers: ${JSON.stringify(allInfos.ipList)}`,
  ];
  logger.boot(LogEventCodes.ENV_SUMMARY, "", { lines });
}

module.exports = printEnvironmentVariables;
