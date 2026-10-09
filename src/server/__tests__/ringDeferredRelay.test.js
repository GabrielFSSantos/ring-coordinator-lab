const { NodeApplication } = require("../application/NodeApplication");
const { SocketEvents } = require("../domain/protocol/socketEvents");

function minimalConfig(overrides = {}) {
  return {
    hostname: "ubuntu-node-3005",
    labHostName: "lab",
    localIp: "172.25.0.5",
    advertiseHost: "172.25.0.5",
    port: 3005,
    advertisePortBase: 3002,
    clusterPeers: "",
    ipListCsv: "172.25.0.2,172.25.0.3,172.25.0.4,172.25.0.5",
    storageUrl: "",
    useStorageHttp: false,
    discoveryMode: "off",
    nodeCount: 4,
    leaderBootGraceMs: 10_000,
    leaderCooldownMs: 20_000,
    logEnabled: false,
    logStdoutMode: "off",
    clientBufferOnLeaderLoss: true,
    clientBufferLimit: 10,
    queueLimit: 6,
    electionDebounceMs: 500,
    peerConnectTimeoutMs: 1000,
    peerConnectRetries: 0,
    requestTimeoutMs: 5000,
    simulationPolicy: { paused: true, txEnabled: false },
    ...overrides,
  };
}

describe("ringJoinDeferred relay", () => {
  it("repassa election_round sem startElection", async () => {
    const app = new NodeApplication(minimalConfig());
    app.ringJoinDeferred = true;
    app.startElection = jest.fn();
    app.relayAlongRing = jest.fn().mockResolvedValue(true);

    const handlers = {};
    const socket = {
      on: (event, fn) => {
        handlers[event] = fn;
      },
    };
    NodeApplication.prototype.onPeerConnection.call(app, socket);
    await handlers[SocketEvents.ELECTION_ROUND]([3002, 3003]);

    expect(app.relayAlongRing).toHaveBeenCalledWith(
      SocketEvents.ELECTION_ROUND,
      [3002, 3003]
    );
    expect(app.startElection).not.toHaveBeenCalled();
  });
});

describe("electSuccessor walk", () => {
  it("usa connectAlongRing para escolher sucessor vivo", async () => {
    const ringRelay = require("../domain/ring/ringRelay");
    const hop = { ok: true, port: 3002, socket: { connected: true } };
    const spy = jest.spyOn(ringRelay, "connectAlongRing").mockResolvedValue(hop);

    const app = new NodeApplication(minimalConfig({ port: 3004 }));
    const socket = await app.electSuccessor();

    expect(spy).toHaveBeenCalled();
    expect(socket).toBe(hop.socket);
    expect(app.successorSocket).toBe(hop.socket);
    spy.mockRestore();
  });
});
