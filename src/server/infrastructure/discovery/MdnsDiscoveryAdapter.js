const { Bonjour } = require("bonjour-service");

function serviceHost(service) {
  return (
    service.referer?.address ||
    (service.addresses && service.addresses[0]) ||
    service.host ||
    ""
  );
}

function parseTxt(service) {
  const txt = service.txt || {};
  return {
    labHostName: txt.labHostName || "",
    nodeName: txt.nodeName || "",
    role: txt.role || "node",
    httpPort: parseInt(txt.httpPort || "0", 10) || null,
    advertiseHost: txt.advertiseHost || "",
  };
}

class MdnsDiscoveryAdapter {
  constructor(config, onUpdate) {
    this.config = config;
    this.onUpdate = onUpdate;
    this.bonjour = null;
    this.publish = null;
    this.peers = new Map();
    this.storageRecord = null;
    this.browser = null;
    this.storageBrowser = null;
    this.timer = null;
  }

  serviceType() {
    const raw = this.config.discoveryServiceType || "_ring-coordinator-lab._tcp.local";
    return raw.replace("._tcp.local", "").replace(/^\./, "");
  }

  storageServiceType() {
    const raw = this.config.discoveryStorageType || "_ring-storage-lab._tcp.local";
    return raw.replace("._tcp.local", "").replace(/^\./, "");
  }

  start() {
    if (this.config.discoveryMode !== "mdns") return;
    this.bonjour = new Bonjour();
    const host = this.config.advertiseHost || this.config.localIp;
    this.publish = this.bonjour.publish({
      name: `${this.config.labHostName}-${this.config.hostname}`,
      type: this.serviceType(),
      port: this.config.port,
      host,
      txt: {
        labHostName: this.config.labHostName,
        nodeName: this.config.hostname,
        role: "node",
        httpPort: String(this.config.nodeHttpPort),
        advertiseHost: host,
      },
    });

    this.browser = this.bonjour.find({ type: this.serviceType() });
    this.browser.on("up", (service) => this.upsertNode(service));
    this.browser.on("down", (service) => this.removeNode(service));

    this.storageBrowser = this.bonjour.find({ type: this.storageServiceType() });
    this.storageBrowser.on("up", (service) => {
      const h = serviceHost(service);
      this.storageRecord = { host: h, port: service.port };
    });

    this.timer = setInterval(() => this.emitPeers(), this.config.discoveryPollMs);
    setTimeout(() => this.emitPeers(), 500);
  }

  upsertNode(service) {
    const host = parseTxt(service).advertiseHost || serviceHost(service);
    const port = service.port;
    if (!host || !port) return;
    if (
      port === this.config.port &&
      host === (this.config.advertiseHost || this.config.localIp)
    ) {
      return;
    }
    const txt = parseTxt(service);
    const key = `${host}:${port}`;
    this.peers.set(key, {
      port,
      host,
      labHostName: txt.labHostName || service.name,
      nodeName: txt.nodeName || service.name,
      httpPort: txt.httpPort,
    });
    this.emitPeers();
  }

  removeNode(service) {
    const host = parseTxt(service).advertiseHost || serviceHost(service);
    const key = `${host}:${service.port}`;
    if (this.peers.delete(key)) this.emitPeers();
  }

  emitPeers() {
    this.onUpdate(Array.from(this.peers.values()), this.storageRecord);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.browser?.stop?.();
    this.storageBrowser?.stop?.();
    this.publish?.stop?.();
    this.bonjour?.destroy?.();
  }
}

module.exports = { MdnsDiscoveryAdapter };
