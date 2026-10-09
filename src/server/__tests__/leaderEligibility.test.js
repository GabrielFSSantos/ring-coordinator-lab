const { NodeApplication } = require("../application/NodeApplication");

function minimalConfig(overrides = {}) {
  return {
    hostname: "ubuntu-node-3005",
    labHostName: "lab",
    localIp: "127.0.0.1",
    advertiseHost: "127.0.0.1",
    port: 3005,
    advertisePortBase: 3002,
    clusterPeers: "",
    ipListCsv: "",
    storageUrl: "http://127.0.0.1:4000",
    useStorageHttp: true,
    discoveryMode: "off",
    nodeCount: 1,
    leaderBootGraceMs: 10_000,
    leaderCooldownMs: 20_000,
    logEnabled: false,
    logStdoutMode: "off",
    clientBufferOnLeaderLoss: true,
    clientBufferLimit: 10,
    queueLimit: 6,
    electionDebounceMs: 500,
    peerConnectTimeoutMs: 1000,
    peerConnectRetries: 1,
    requestTimeoutMs: 5000,
    simulationPolicy: { paused: false, txEnabled: false },
    ...overrides,
  };
}

describe("isEligibleForCoordinatorRole", () => {
  it("allows fresh node", () => {
    const app = new NodeApplication(minimalConfig());
    expect(app.isEligibleForCoordinatorRole()).toBe(true);
  });

  it("blocks when simulatedDown", () => {
    const app = new NodeApplication(minimalConfig());
    app.simulatedDown = true;
    expect(app.isEligibleForCoordinatorRole()).toBe(false);
  });

  it("blocks during post-resign cooldown", () => {
    const app = new NodeApplication(minimalConfig());
    app.coordinatorCooldownUntil = Date.now() + 15_000;
    expect(app.isEligibleForCoordinatorRole()).toBe(false);
  });

  it("blocks while ring join is deferred after resigning as leader", () => {
    const app = new NodeApplication(minimalConfig());
    app.ringJoinDeferred = true;
    expect(app.isEligibleForCoordinatorRole()).toBe(false);
  });
});

describe("getPublicState recovery flags", () => {
  it("exposes ringJoinDeferred and eligibleForCoordinator", () => {
    const app = new NodeApplication(minimalConfig());
    app.ringJoinDeferred = true;
    app.coordinatorCooldownUntil = Date.now() + 10_000;
    const state = app.getPublicState();
    expect(state.ringJoinDeferred).toBe(true);
    expect(state.eligibleForCoordinator).toBe(false);
  });
});

describe("electionListForCoordinatorPick", () => {
  it("removes self from candidacy during cooldown", () => {
    const app = new NodeApplication(minimalConfig());
    app.coordinatorCooldownUntil = Date.now() + 15_000;
    expect(app.electionListForCoordinatorPick([3002, 3005])).toEqual([3002]);
    expect(app.electionListForCoordinatorPick([3005])).toEqual([]);
  });
});
