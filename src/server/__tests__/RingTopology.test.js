const { RingTopology } = require("../domain/ring/RingTopology");

describe("RingTopology", () => {
  const csv = "172.25.0.2,172.25.0.3,172.25.0.4,172.25.0.5";

  it("sorts ports and resolves successor with wrap", () => {
    const ring = RingTopology.fromEnv(csv, 3005, "172.25.0.5");
    expect(ring.successorPort()).toBe(3002);
    expect(ring.successorIp()).toBe("172.25.0.2");
  });

  it("exposes cluster minimum port", () => {
    const ring = RingTopology.fromEnv(csv, 3004, "172.25.0.4");
    expect(ring.minPort).toBe(3002);
  });

  it("adds peer on reconnect", () => {
    const ring = RingTopology.fromEnv("172.25.0.2,172.25.0.3", 3002, "172.25.0.2");
    ring.addPeer(3004, "172.25.0.4");
    expect(ring.ipListByPort[3004]).toBe("172.25.0.4");
  });
});
