const { Bonjour } = require("bonjour-service");

function serviceTypeName(raw) {
  return (raw || "_ring-storage-lab._tcp.local")
    .replace("._tcp.local", "")
    .replace(/^\./, "");
}

class StorageMdnsPublisher {
  constructor(config) {
    this.config = config;
    this.bonjour = null;
    this.publish = null;
  }

  start(baseUrl) {
    if ((this.config.discoveryMode || "off") !== "mdns") return;
    if (this.config.storageMode !== "primary") return;

    this.bonjour = new Bonjour();
    const host = this.config.advertiseHost || "127.0.0.1";
    const type = serviceTypeName(this.config.discoveryStorageType);
    const url = (baseUrl || "").replace(/\/$/, "");

    this.publish = this.bonjour.publish({
      name: `${this.config.labHostName}-storage`,
      type,
      port: this.config.storageHttpPort,
      host,
      txt: {
        labHostName: this.config.labHostName,
        advertiseHost: host,
        baseUrl: url,
      },
    });
  }

  stop() {
    this.publish?.stop?.();
    this.bonjour?.destroy?.();
    this.publish = null;
    this.bonjour = null;
  }
}

module.exports = { StorageMdnsPublisher };
