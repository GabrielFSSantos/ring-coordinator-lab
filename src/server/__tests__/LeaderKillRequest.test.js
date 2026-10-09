const { NodeApplication } = require("../application/NodeApplication");
const { SocketEvents } = require("../domain/protocol/socketEvents");

describe("requestLeaderKill", () => {
  function makeApp(overrides = {}) {
    const app = Object.create(NodeApplication.prototype);
    app.inElection = false;
    app.config = { labHostName: "lab-a", hostname: "node-1" };
    app.lastProcessedKillEpoch = null;
    app.getSuccessor = jest.fn();
    app.onLeaderKillRequest = jest.fn().mockResolvedValue(undefined);
    Object.assign(app, overrides);
    return app;
  }

  it("emite uma vez ao sucessor sem processar localmente", async () => {
    const emit = jest.fn();
    const app = makeApp({
      getSuccessor: jest.fn().mockResolvedValue({ emit }),
    });
    NodeApplication.prototype.requestLeaderKill.call(app, "test");
    await Promise.resolve();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0][0]).toBe(SocketEvents.LEADER_KILL_REQUEST);
    expect(app.onLeaderKillRequest).not.toHaveBeenCalled();
  });

  it("processa localmente se não há sucessor", async () => {
    const app = makeApp({
      getSuccessor: jest.fn().mockResolvedValue(null),
    });
    NodeApplication.prototype.requestLeaderKill.call(app, "solo");
    await Promise.resolve();
    expect(app.onLeaderKillRequest).toHaveBeenCalledTimes(1);
    expect(app.onLeaderKillRequest.mock.calls[0][0].reason).toBe("solo");
  });
});

describe("onCoordinatorSuspectRing", () => {
  it("deduplica mesma wave e encaminha ao sucessor", async () => {
    const app = Object.create(NodeApplication.prototype);
    app.lastSuspectWave = null;
    app.onCoordinatorSuspect = jest.fn().mockResolvedValue(undefined);
    app.relayAlongRing = jest.fn().mockResolvedValue(true);

    await NodeApplication.prototype.onCoordinatorSuspectRing.call(app, {
      wave: 99,
    });
    expect(app.onCoordinatorSuspect).toHaveBeenCalledTimes(1);
    expect(app.relayAlongRing).toHaveBeenCalledWith(
      SocketEvents.COORDINATOR_SUSPECT,
      { wave: 99 }
    );

    await NodeApplication.prototype.onCoordinatorSuspectRing.call(app, {
      wave: 99,
    });
    expect(app.onCoordinatorSuspect).toHaveBeenCalledTimes(1);
  });
});

describe("onLeaderKillRequest dedup", () => {
  it("ignora killEpoch repetido", async () => {
    const app = Object.create(NodeApplication.prototype);
    app.inElection = false;
    app.lastProcessedKillEpoch = 42;
    app.storageUp = true;
    app.refreshStorageHealth = jest.fn().mockResolvedValue(undefined);
    app.logger = { sim: jest.fn() };
    app.isCoordinator = false;
    app.getSuccessor = jest.fn().mockResolvedValue(null);

    await NodeApplication.prototype.onLeaderKillRequest.call(app, {
      killEpoch: 42,
      initiatorHost: "a",
      initiatorNode: "b",
    });
    expect(app.logger.sim).not.toHaveBeenCalled();
  });
});
