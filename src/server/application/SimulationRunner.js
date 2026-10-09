class SimulationRunner {
  constructor(nodeApp) {
    this.node = nodeApp;
    this.timers = [];
  }

  start() {
    this.stop();
    if (this.node.isCoordinator) return;
    this.scheduleTxLoop();
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  scheduleTxLoop() {
    let firstCycle = true;
    const scheduleNext = () => {
      const policy = this.node.simulationPolicy;
      const jitter = policy.txJitterMs ? Math.random() * policy.txJitterMs : 0;
      let delay = policy.txIntervalMs + jitter;
      if (firstCycle) {
        firstCycle = false;
        const stagger = this.node.config.simTxInitialStaggerMs || 0;
        delay = stagger + policy.txIntervalMs + jitter;
      }
      const t = setTimeout(runCycle, delay);
      this.timers.push(t);
    };
    const runCycle = () => {
      const policy = this.node.simulationPolicy;
      if (
        this.node.isCoordinator ||
        this.node.simulatedDown ||
        policy.paused ||
        !policy.txEnabled
      ) {
        scheduleNext();
        return;
      }
      this.node.sendSimulatedTransaction(0);
      scheduleNext();
    };
    scheduleNext();
  }
}

module.exports = { SimulationRunner };
