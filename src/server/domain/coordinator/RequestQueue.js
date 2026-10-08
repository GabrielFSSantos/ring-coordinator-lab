class RequestQueue {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
    this.processing = false;
  }

  tryEnqueue(item) {
    if (this.items.length >= this.limit) {
      return { accepted: false, reason: "queue_full" };
    }
    this.items.push(item);
    return { accepted: true };
  }

  dequeue() {
    return this.items.shift();
  }

  get size() {
    return this.items.length;
  }

  setProcessing(value) {
    this.processing = value;
  }

  get isProcessing() {
    return this.processing;
  }

  clear() {
    this.items = [];
    this.processing = false;
  }
}

module.exports = { RequestQueue };
