const {
  resolveDiscoveryMode,
  resolveStorageUrl,
} = require("../config/env");

describe("resolveDiscoveryMode", () => {
  it("defaults to mdns without CLUSTER_PEERS", () => {
    expect(resolveDiscoveryMode({})).toBe("mdns");
  });

  it("uses manual when CLUSTER_PEERS set", () => {
    expect(
      resolveDiscoveryMode({ CLUSTER_PEERS: "10.0.0.1:3002" })
    ).toBe("manual");
  });

  it("respects explicit DISCOVERY_MODE", () => {
    expect(resolveDiscoveryMode({ DISCOVERY_MODE: "off" })).toBe("off");
  });
});

describe("resolveStorageUrl", () => {
  it("host role uses localhost", () => {
    expect(
      resolveStorageUrl({ LAB_ROLE: "host", STORAGE_URL: "" })
    ).toBe("http://127.0.0.1:4000");
  });

  it("start role uses localhost for ./lab logs on host", () => {
    expect(
      resolveStorageUrl({ LAB_ROLE: "start", STORAGE_URL: "" })
    ).toBe("http://127.0.0.1:4000");
  });

  it("node without url uses LAB_STORAGE_HOST when set", () => {
    expect(
      resolveStorageUrl({
        LAB_ROLE: "node",
        STORAGE_URL: "",
        LAB_STORAGE_HOST: "192.168.3.10",
      })
    ).toBe("http://192.168.3.10:4000");
  });

  it("node without url stays empty", () => {
    expect(resolveStorageUrl({ LAB_ROLE: "node", STORAGE_URL: "" })).toBe("");
  });

  it("keeps explicit STORAGE_URL", () => {
    expect(
      resolveStorageUrl({
        STORAGE_URL: "http://192.168.1.5:4000/",
      })
    ).toBe("http://192.168.1.5:4000");
  });
});
