const { centsToMoney } = require("../../../shared/money");

class StorageHttpClient {
  constructor(baseUrl, writeToken) {
    this.baseUrl = (baseUrl || "").replace(/\/$/, "");
    this.writeToken = writeToken || "";
  }

  async health() {
    try {
      const res = await fetch(`${this.baseUrl}/v1/health`);
      if (!res.ok) return { ok: false };
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async getBalance() {
    const res = await fetch(`${this.baseUrl}/v1/balance`);
    if (!res.ok) throw new Error("storage_down");
    const data = await res.json();
    return data.balanceCents;
  }

  async applyTransaction(payload) {
    const res = await fetch(`${this.baseUrl}/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-storage-token": this.writeToken,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "storage_apply_failed");
    }
    return res.json();
  }

  async listTimelineEvents({ afterId = 0, limit = 100, requestId } = {}) {
    const params = new URLSearchParams({
      limit: String(limit),
      afterId: String(afterId),
    });
    if (requestId) params.set("requestId", requestId);
    const res = await fetch(
      `${this.baseUrl}/v1/timeline-events?${params.toString()}`
    );
    if (!res.ok) throw new Error("timeline_list_failed");
    const data = await res.json();
    return data.events || [];
  }

  async appendTimelineEvent(payload) {
    const res = await fetch(`${this.baseUrl}/v1/timeline-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-storage-token": this.writeToken,
      },
      body: JSON.stringify({
        clientEventId: payload.clientEventId,
        eventCode: payload.eventCode,
        role: payload.role,
        labHostName: payload.labHostName,
        nodeName: payload.nodeName,
        nodePort: payload.nodePort,
        message: payload.message,
        detail: payload.detail,
        requestId: payload.requestId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "timeline_append_failed");
    }
    return res.json();
  }

  async appendAdmin(payload) {
    const res = await fetch(`${this.baseUrl}/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-storage-token": this.writeToken,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("admin_failed");
    return res.json();
  }

  formatBalance(cents) {
    return centsToMoney(cents);
  }
}

module.exports = { StorageHttpClient };
