const {
  boxTitle,
  defaultNodeNameForPort,
} = require("../infrastructure/logging/friendlyNames");

describe("boxTitle", () => {
  it("prefixes lab host name for multi-PC", () => {
    const title = boxTitle(
      { labHostName: "docker-lab", hostname: "ubuntu-node-2", port: 3002 },
      "FOLLOWER",
      { FOLLOWER: "participante" }
    );
    expect(title).toBe("docker-lab · ubuntu-node-2 · participante");
  });

  it("maps ring port 3005 to ubuntu-node-5", () => {
    expect(defaultNodeNameForPort(3005)).toBe("ubuntu-node-5");
  });

  it("omits empty or lab-tail host prefix", () => {
    expect(
      boxTitle(
        { labHostName: "-", hostname: "ubuntu-node-2", port: 3002 },
        "FOLLOWER",
        { FOLLOWER: "participante" }
      )
    ).toBe("ubuntu-node-2 · participante");
  });
});
