class StorageReachabilityMonitor {
  constructor(nodeApp) {
    this.nodeApp = nodeApp;
    this.timer = null;
    this.wasUp = null;
  }

  start() {
    if (!this.nodeApp.config.useStorageHttp || !this.nodeApp.config.storageUrl) {
      return;
    }
    const interval = Math.max(3000, this.nodeApp.config.discoveryPollMs);
    this.timer = setInterval(() => this.tick(), interval);
  }

  async tick() {
    const up = await this.nodeApp.refreshStorageHealth();
    if (this.wasUp === false && up) {
      this.nodeApp.logger.storage(
        "RECOVERED",
        `url=${this.nodeApp.config.storageUrl}`
      );
    }
    if (this.wasUp === true && !up) {
      this.nodeApp.logger.storage("DOWN", this.nodeApp.config.storageUrl);
    }
    this.wasUp = up;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = { StorageReachabilityMonitor };
