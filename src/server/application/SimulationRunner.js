const { randomDeltaCents } = require("../../shared/money");

class SimulationRunner {
  constructor(nodeApp) {
    this.node = nodeApp;
    this.timers = [];
    this.killEpoch = 0;
  }

  start() {
    if (this.node.isCoordinator) return;
    this.scheduleTxLoop();
    this.scheduleLeaderKillIfNeeded();
  }

  scheduleLeaderKillIfNeeded() {
    const policy = this.node.simulationPolicy;
    if (policy.mode === "auto" && policy.killEnabled) {
      this.scheduleLeaderKill();
    }
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  isKillInitiator() {
    const spec = this.node.config.simLeaderKillInitiator;
    if (!spec) {
      return this.node.topology.minPort === this.node.config.port;
    }
    const key = `${this.node.config.labHostName}:${this.node.config.hostname}`;
    return spec === key || spec === this.node.config.labHostName;
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

  scheduleLeaderKill() {
    if (!this.isKillInitiator()) return;
    const interval = this.node.simulationPolicy.killIntervalMs;
    const t = setInterval(() => {
      if (!this.node.simulationPolicy.killEnabled) return;
      this.node.requestLeaderKill(`auto-kill-${++this.killEpoch}`);
    }, interval);
    this.timers.push(t);
  }
}

module.exports = { SimulationRunner };
