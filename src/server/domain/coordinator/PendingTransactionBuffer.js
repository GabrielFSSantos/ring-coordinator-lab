class PendingTransactionBuffer {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
  }

  push(item) {
    if (this.items.length >= this.limit) {
      return { accepted: false, reason: "client_buffer_full" };
    }
    this.items.push(item);
    return { accepted: true };
  }

  drain() {
    const copy = [...this.items];
    this.items = [];
    return copy;
  }

  get size() {
    return this.items.length;
  }
}

module.exports = { PendingTransactionBuffer };
