const { StorageHttpClient } = require("../infrastructure/storage/StorageHttpClient");

/**
 * Adota URL canônica do banco (mDNS / peers) com debounce.
 */
class NodeStorageBinding {
  constructor(nodeApp, debounceMs = 2500) {
    this.node = nodeApp;
    this.debounceMs = debounceMs;
    this.pendingUrl = null;
    this.timer = null;
    this.localDockerUrl =
      (process.env.STORAGE_URL || "").replace(/\/$/, "") || null;
  }

  scheduleAdopt(url) {
    const normalized = (url || "").replace(/\/$/, "");
    if (!normalized) return;
    const current = (this.node.config.storageUrl || "").replace(/\/$/, "");
    if (normalized === current) return;
    this.pendingUrl = normalized;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      const target = this.pendingUrl;
      this.pendingUrl = null;
      if (target) this.applyStorageUrl(target);
    }, this.debounceMs);
  }

  considerMdnsRecord(storageRecord) {
    if (!storageRecord?.host) return;
    const port = storageRecord.port || 4000;
    this.scheduleAdopt(`http://${storageRecord.host}:${port}`);
  }

  considerPeerClusterState(state) {
    const url = state?.storageUrl;
    if (!url) return;
    this.scheduleAdopt(url.replace(/\/$/, ""));
  }

  async applyStorageUrl(url) {
    const normalized = url.replace(/\/$/, "");
    const current = (this.node.config.storageUrl || "").replace(/\/$/, "");
    if (normalized === current) return;
    this.node.config.storageUrl = normalized;
    this.node.storageClient = new StorageHttpClient(
      normalized,
      this.node.config.storageWriteToken
    );
    await this.node.refreshStorageHealth();
    this.node.logger.storage(
      "UP",
      `url=${normalized} (adotado na rede)`
    );
  }
}

module.exports = { NodeStorageBinding };
