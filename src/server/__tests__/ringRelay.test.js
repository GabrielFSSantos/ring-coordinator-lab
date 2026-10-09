const { RingTopology } = require("../domain/ring/RingTopology");
const { emitAlongRing, connectAlongRing } = require("../domain/ring/ringRelay");
const { SocketEvents } = require("../domain/protocol/socketEvents");

describe("ringRelay", () => {
  const csv = "172.25.0.2,172.25.0.3,172.25.0.4,172.25.0.5";

  it("connectAlongRing skips unreachable hop and uses next port", async () => {
    const ring = RingTopology.fromEnv(csv, 3004, "172.25.0.4");
    const connect = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ connected: true, emit: jest.fn() });

    const hop = await connectAlongRing(ring, { connect, timeoutMs: 100, retries: 0 });
    expect(hop.ok).toBe(true);
    expect(hop.port).toBe(3002);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("emitAlongRing delivers event on first live hop", async () => {
    const ring = RingTopology.fromEnv(csv, 3003, "172.25.0.3");
    const emit = jest.fn();
    const disconnect = jest.fn();
    const connect = jest.fn().mockResolvedValue({
      connected: true,
      emit,
      disconnect,
    });

    const result = await emitAlongRing(
      ring,
      SocketEvents.ELECTION_ROUND,
      [3002, 3003],
      { connect, timeoutMs: 100, retries: 0 }
    );

    expect(result.ok).toBe(true);
    expect(result.port).toBe(3004);
    expect(emit).toHaveBeenCalledWith(SocketEvents.ELECTION_ROUND, [3002, 3003]);
    expect(disconnect).toHaveBeenCalled();
  });
});
