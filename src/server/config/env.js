const path = require("path");
const { buildPeerMap } = require("../../shared/peers");

function boolEnv(name, defaultVal) {
  const v = process.env[name];
  if (v === undefined) return defaultVal;
  return v === "true" || v === "1";
}

const LOG_STDOUT_MODES = new Set([
  "direct",
  "off",
  "timeline_self",
  "timeline_all",
]);

function parseLogStdoutMode(raw) {
  const mode = (raw || "direct").toLowerCase();
  return LOG_STDOUT_MODES.has(mode) ? mode : "direct";
}

/** Segundos por índice (port - ADVERTISE_PORT_BASE) para demo orgânica */
const ORGANIC_TX_INTERVAL_SEC_BY_INDEX = [10, 5, 8, 7];

function resolveSimTxIntervalMs(env, nodePort, advertisePortBase) {
  if (env.SIM_TX_INTERVAL_MS !== undefined && env.SIM_TX_INTERVAL_MS !== "") {
    return parseInt(env.SIM_TX_INTERVAL_MS, 10);
  }
  if (nodePort && !Number.isNaN(nodePort)) {
    const index = nodePort - advertisePortBase;
    if (index >= 0 && index < ORGANIC_TX_INTERVAL_SEC_BY_INDEX.length) {
      return ORGANIC_TX_INTERVAL_SEC_BY_INDEX[index] * 1000;
    }
  }
  return 30000;
}

function resolveSimTxInitialStaggerMs(env, nodePort, advertisePortBase) {
  if (
    env.SIM_TX_INITIAL_STAGGER_MS !== undefined &&
    env.SIM_TX_INITIAL_STAGGER_MS !== ""
  ) {
    return parseInt(env.SIM_TX_INITIAL_STAGGER_MS, 10);
  }
  if (nodePort && !Number.isNaN(nodePort) && advertisePortBase) {
    return Math.max(0, (nodePort - advertisePortBase) * 1000);
  }
  return 0;
}

function loadConfig() {
  const discoveryMode = (process.env.DISCOVERY_MODE || "off").toLowerCase();
  const port = parseInt(process.env.NODE_PORT, 10);
  const peerMap = buildPeerMap(
    process.env.CLUSTER_PEERS,
    process.env.IP_LIST || ""
  );
  const advertiseHost = process.env.ADVERTISE_HOST || process.env.IP_LOCAL;
  const localHost = process.env.IP_LOCAL || advertiseHost || "127.0.0.1";

  return {
    hostname: process.env.HOSTNAME || "node",
    labHostName: process.env.LAB_HOST_NAME || process.env.HOSTNAME || "host",
    localIp: localHost,
    advertiseHost,
    port,
    peerMap,
    ipListCsv: process.env.IP_LIST || "",
    clusterPeers: process.env.CLUSTER_PEERS || "",
    bootstrapPeer: process.env.BOOTSTRAP_PEER || "",

    storageUrl: (process.env.STORAGE_URL || "").replace(/\/$/, ""),
    storageWriteToken: process.env.STORAGE_WRITE_TOKEN || "lab-write-token",

    databasePath: process.env.DATABASE_PATH || "./data/log.db",
    schemaPath: process.env.SCHEMA_PATH || "/app/schema.sql",
    useStorageHttp:
      process.env.USE_STORAGE_HTTP === "false"
        ? false
        : boolEnv("USE_STORAGE_HTTP", !!process.env.STORAGE_URL),
    advertisePortBase: parseInt(process.env.ADVERTISE_PORT_BASE || "3002", 10),

    peerConnectTimeoutMs: parseInt(
      process.env.PEER_CONNECT_TIMEOUT_MS || "3000",
      10
    ),
    peerConnectRetries: parseInt(process.env.PEER_CONNECT_RETRIES || "3", 10),
    requestTimeoutMs: parseInt(
      process.env.REQUEST_TIMEOUT_MS || process.env.TIMEOUT_LIMIT || "10000",
      10
    ),
    queueLimit: parseInt(process.env.QUEUE_LIMIT || "6", 10),
    electionDebounceMs: parseInt(
      process.env.ELECTION_DEBOUNCE_MS || "500",
      10
    ),

    labProfile: process.env.LAB_PROFILE || "",
    discoveryMode,
    discoveryServiceType:
      process.env.DISCOVERY_SERVICE_TYPE || "_ring-coordinator-lab._tcp.local",
    discoveryStorageType:
      process.env.DISCOVERY_STORAGE_TYPE || "_ring-storage-lab._tcp.local",
    discoveryPollMs: parseInt(process.env.DISCOVERY_POLL_MS || "5000", 10),
    discoveryTtlS: parseInt(process.env.DISCOVERY_TTL_S || "30", 10),
    storageUrlRequired: boolEnv(
      "STORAGE_URL_REQUIRED",
      discoveryMode === "mdns" || discoveryMode === "manual"
    ),

    simMode: (process.env.SIM_MODE || "manual").toLowerCase(),
    simTxBurst: Math.min(
      1,
      Math.max(1, parseInt(process.env.SIM_TX_BURST || "1", 10))
    ),
    simTxIntervalMs: resolveSimTxIntervalMs(
      process.env,
      port,
      parseInt(process.env.ADVERTISE_PORT_BASE || "3002", 10)
    ),
    simTxJitterMs: parseInt(process.env.SIM_TX_JITTER_MS || "0", 10),
    simTxInitialStaggerMs: resolveSimTxInitialStaggerMs(
      process.env,
      port,
      parseInt(process.env.ADVERTISE_PORT_BASE || "3002", 10)
    ),
    simDeltaMin: parseFloat(process.env.SIM_DELTA_MIN || "-500"),
    simDeltaMax: parseFloat(process.env.SIM_DELTA_MAX || "500"),
    simLeaderKillIntervalMs: parseInt(
      process.env.SIM_LEADER_KILL_INTERVAL_MS || "120000",
      10
    ),
    simLeaderKillInitiator: process.env.SIM_LEADER_KILL_INITIATOR || "",

    clientBufferOnLeaderLoss: boolEnv("CLIENT_BUFFER_ON_LEADER_LOSS", true),
    discardOnStorageDown: boolEnv("DISCARD_ON_STORAGE_DOWN", true),
    clientBufferLimit: parseInt(process.env.CLIENT_BUFFER_LIMIT || "50", 10),

    logEnabled: boolEnv("LOG_ENABLED", true),
    logWrites: boolEnv("LOG_WRITES", true),
    logReads: boolEnv("LOG_READS", false),
    logElection: boolEnv("LOG_ELECTION", true),
    logQueue: boolEnv("LOG_QUEUE", true),
    logStorage: boolEnv("LOG_STORAGE", true),
    logSim: boolEnv("LOG_SIM", true),
    logFormat: (process.env.LOG_FORMAT || "human").toLowerCase(),
    logStyle: (process.env.LOG_STYLE || "box").toLowerCase(),
    logDetail: boolEnv("LOG_DETAIL", false),
    logTxStory: boolEnv("LOG_TX_STORY", true),
    logRingViewIntervalMs: parseInt(
      process.env.LOG_RING_VIEW_INTERVAL_MS || "0",
      10
    ),
    logTimelinePersist: boolEnv("LOG_TIMELINE_PERSIST", true),
    logTimelineSkipCodes: process.env.LOG_TIMELINE_SKIP_CODES || "",
    logStdoutMode: parseLogStdoutMode(process.env.LOG_STDOUT_MODE),
    logTimelinePollMs: parseInt(process.env.LOG_TIMELINE_POLL_MS || "400", 10),
    logDockerOps:
      process.env.LOG_DOCKER_OPS !== undefined
        ? boolEnv("LOG_DOCKER_OPS", false)
        : parseLogStdoutMode(process.env.LOG_STDOUT_MODE) !== "direct",

    nodeControlToken: process.env.NODE_CONTROL_TOKEN || "",

    nodeHttpPort:
      parseInt(process.env.NODE_HTTP_PORT, 10) ||
      port + parseInt(process.env.NODE_HTTP_PORT_OFFSET || "1000", 10),

    nodeCount: parseInt(process.env.NODE_COUNT || "1", 10),
  };
}

module.exports = {
  loadConfig,
  parseLogStdoutMode,
  LOG_STDOUT_MODES,
  ORGANIC_TX_INTERVAL_SEC_BY_INDEX,
  resolveSimTxIntervalMs,
  resolveSimTxInitialStaggerMs,
};
