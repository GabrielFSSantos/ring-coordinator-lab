const { RingTopology } = require("../domain/ring/RingTopology");

describe("RingTopology", () => {
  const csv = "172.25.0.2,172.25.0.3,172.25.0.4,172.25.0.5";

  it("sorts ports and resolves successor with wrap", () => {
    const ring = RingTopology.fromEnv(csv, 3005, "172.25.0.5");
    expect(ring.successorPort()).toBe(3002);
    expect(ring.successorIp()).toBe("172.25.0.2");
  });

  it("ringPortsAfterLocal walks the ring from successor", () => {
    const ring = RingTopology.fromEnv(csv, 3004, "172.25.0.4");
    expect(ring.ringPortsAfterLocal()).toEqual([3005, 3002, 3003]);
  });

  it("ringPortsAfterLocal from initiator wraps through all peers", () => {
    const ring = RingTopology.fromEnv(csv, 3002, "172.25.0.2");
    expect(ring.ringPortsAfterLocal()).toEqual([3003, 3004, 3005]);
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

  it("uses loopback for socket connect on same host (WSL)", () => {
    const lan = "192.168.3.131";
    const ring = RingTopology.fromEnv("", 3002, lan);
    ring.addPeer(3002, lan);
    ring.addPeer(3003, lan);
    ring.addPeer(3004, lan);
    expect(ring.peerAddressForPort(3003)).toBe("127.0.0.1:3003");
    expect(ring.allPeerAddressesExceptSelf()).toEqual([
      "127.0.0.1:3003",
      "127.0.0.1:3004",
    ]);
  });

  it("keeps LAN IP for remote peer connect", () => {
    const local = "192.168.3.131";
    const remote = "192.168.3.125";
    const ring = RingTopology.fromEnv("", 3005, local);
    ring.addPeer(3005, local);
    ring.addPeer(3006, remote);
    expect(ring.peerAddressForPort(3006)).toBe("192.168.3.125:3006");
  });
});
