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

function resolveDiscoveryMode(env = process.env) {
  const explicit = (env.DISCOVERY_MODE || "").toLowerCase().trim();
  if (explicit) return explicit;
  if ((env.CLUSTER_PEERS || "").trim()) return "manual";
  return "mdns";
}

function resolveSimTxEnabled(env = process.env) {
  if (env.SIM_TX_ENABLED !== undefined && env.SIM_TX_ENABLED !== "") {
    return env.SIM_TX_ENABLED === "true" || env.SIM_TX_ENABLED === "1";
  }
  return (env.SIM_MODE || "auto").toLowerCase() === "auto";
}

function resolveLeaderTenureMs(env = process.env) {
  if (env.SIM_LEADER_TENURE_MS !== undefined && env.SIM_LEADER_TENURE_MS !== "") {
    return parseInt(env.SIM_LEADER_TENURE_MS, 10);
  }
  if (
    env.SIM_LEADER_KILL_INTERVAL_MS !== undefined &&
    env.SIM_LEADER_KILL_INTERVAL_MS !== ""
  ) {
    return parseInt(env.SIM_LEADER_KILL_INTERVAL_MS, 10);
  }
  return 90_000;
}

function resolveLeaderSelfTermEnabled(env = process.env) {
  if (env.SIM_LEADER_SELF_TERM !== undefined && env.SIM_LEADER_SELF_TERM !== "") {
    return env.SIM_LEADER_SELF_TERM === "true" || env.SIM_LEADER_SELF_TERM === "1";
  }
  const tenure = resolveLeaderTenureMs(env);
  return (env.SIM_MODE || "auto").toLowerCase() === "auto" && tenure > 0;
}

function resolveStorageUrl(env = process.env) {
  const raw = (env.STORAGE_URL || "").replace(/\/$/, "");
  if (raw) return raw;
  const role = (env.LAB_ROLE || "").toLowerCase();
  const port = env.STORAGE_HTTP_PORT || "4000";
  const localRoles = new Set(["host", "start", "storage"]);
  if (localRoles.has(role)) {
    return `http://127.0.0.1:${port}`;
  }
  const lanHost = (env.LAB_STORAGE_HOST || "").trim();
  if (lanHost) {
    return `http://${lanHost}:${port}`.replace(/\/$/, "");
  }
  return "";
}

function loadConfig() {
  const discoveryMode = resolveDiscoveryMode(process.env);
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

    storageUrl: resolveStorageUrl(process.env),
    labRole: (process.env.LAB_ROLE || "").toLowerCase(),
    storageWriteToken: process.env.STORAGE_WRITE_TOKEN || "lab-write-token",

    databasePath: process.env.DATABASE_PATH || "./data/log.db",
    schemaPath: process.env.SCHEMA_PATH || "/app/schema.sql",
    useStorageHttp:
      process.env.USE_STORAGE_HTTP === "false"
        ? false
        : boolEnv(
            "USE_STORAGE_HTTP",
            !!resolveStorageUrl(process.env) || discoveryMode === "mdns"
          ),
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
      process.env.ELECTION_DEBOUNCE_MS || "2000",
      10
    ),
    leaderCooldownMs: parseInt(process.env.LEADER_COOLDOWN_MS || "25000", 10),

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

    simMode: (process.env.SIM_MODE || "auto").toLowerCase(),
    simTxEnabled: resolveSimTxEnabled(process.env),
    simLeaderSelfTermEnabled: resolveLeaderSelfTermEnabled(process.env),
    simLeaderTenureMs: resolveLeaderTenureMs(process.env),
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
    discardOnStorageDown: boolEnv("DISCARD_ON_STORAGE_DOWN", false),
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
  resolveDiscoveryMode,
  resolveStorageUrl,
  resolveSimTxEnabled,
  resolveLeaderTenureMs,
  resolveLeaderSelfTermEnabled,
};
