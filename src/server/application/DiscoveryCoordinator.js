const { MdnsDiscoveryAdapter } = require("../infrastructure/discovery/MdnsDiscoveryAdapter");

class DiscoveryCoordinator {
  constructor(nodeApp) {
    this.nodeApp = nodeApp;
    this.adapter = null;
  }

  start() {
    const config = this.nodeApp.config;
    if (config.discoveryMode === "mdns") {
      this.adapter = new MdnsDiscoveryAdapter(config, (peers, storage) => {
        this.nodeApp.onDiscoveryUpdate(peers, storage);
      });
      this.adapter.start();
    } else if (config.discoveryMode === "manual" && config.clusterPeers) {
      this.nodeApp.onDiscoveryUpdate([], null);
    }
  }

  stop() {
    this.adapter?.stop();
  }
}

module.exports = { DiscoveryCoordinator };
