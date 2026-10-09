const { resolveWritablePrimary } = require("../domain/StoragePrimaryResolver");

jest.mock("../../shared/mdnsStorageBrowse", () => ({
  browseStoragePrimary: jest.fn(),
}));

const { browseStoragePrimary } = require("../../shared/mdnsStorageBrowse");

describe("resolveWritablePrimary", () => {
  const base = {
    storageMode: "primary",
    advertiseHost: "192.168.1.10",
    storageHttpPort: 4000,
    discoveryMode: "mdns",
    discoveryStorageType: "_ring-storage-lab._tcp.local",
    storageDiscoveryUrl: "",
    storagePrimaryBrowseMs: 100,
  };

  beforeEach(() => {
    browseStoragePrimary.mockReset();
  });

  it("permanece primary se não há outro na rede", async () => {
    browseStoragePrimary.mockResolvedValue(null);
    const r = await resolveWritablePrimary(base);
    expect(r.isWritable).toBe(true);
    expect(r.mode).toBe("primary");
  });

  it("vira standby se mDNS encontra outro primário", async () => {
    browseStoragePrimary.mockResolvedValue({
      baseUrl: "http://192.168.1.20:4000",
      host: "192.168.1.20",
      port: 4000,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ baseUrl: "http://192.168.1.20:4000" }),
    });
    const r = await resolveWritablePrimary(base);
    expect(r.mode).toBe("standby");
    expect(r.isWritable).toBe(false);
    expect(r.primaryBaseUrl).toBe("http://192.168.1.20:4000");
  });
});
