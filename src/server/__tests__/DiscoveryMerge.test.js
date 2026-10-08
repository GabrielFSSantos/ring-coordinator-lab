const { RingTopology } = require("../domain/ring/RingTopology");

describe("RingTopology.mergeDiscoveredPeers", () => {
  it("deduplicates by port and sorts", () => {
    const ring = RingTopology.fromCluster("", "", 3002, "10.0.0.1");
    ring.addPeer(3002, "10.0.0.1", { labHostName: "a", nodeName: "n1" });
    const changed = ring.mergeDiscoveredPeers([
      { port: 3006, host: "10.0.0.2", labHostName: "b", nodeName: "n2" },
      { port: 3006, host: "10.0.0.2", labHostName: "b", nodeName: "n2" },
      { port: 3003, host: "10.0.0.1", labHostName: "a", nodeName: "n3" },
    ]);
    expect(changed).toBe(true);
    expect(ring.portsInOrder).toEqual([3002, 3003, 3006]);
    expect(ring.metaForPort(3006).labHostName).toBe("b");
  });
});
