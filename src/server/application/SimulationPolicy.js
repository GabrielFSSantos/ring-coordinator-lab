class SimulationPolicy {
  constructor(config) {
    this.mode = config.simMode;
    this.txEnabled =
      config.simTxEnabled !== undefined
        ? config.simTxEnabled
        : config.simMode === "auto";
    this.txBurst = config.simTxBurst;
    this.txIntervalMs = config.simTxIntervalMs;
    this.txJitterMs = config.simTxJitterMs;
    this.leaderSelfTermEnabled = !!config.simLeaderSelfTermEnabled;
    this.leaderTenureMs = config.simLeaderTenureMs || 0;
    this.killEnabled = false;
    this.killIntervalMs = config.simLeaderKillIntervalMs;
    this.deltaMode = "random";
    this.deltaFixed = null;
    this.deltaMin = config.simDeltaMin;
    this.deltaMax = config.simDeltaMax;
    this.paused = false;
  }

  static fromConfig(config) {
    return new SimulationPolicy(config);
  }

  snapshot() {
    return {
      mode: this.mode,
      txEnabled: this.txEnabled,
      txBurst: this.txBurst,
      txIntervalMs: this.txIntervalMs,
      txIntervalSec: Math.max(1, Math.round(this.txIntervalMs / 1000)),
      txJitterMs: this.txJitterMs,
      leaderSelfTermEnabled: this.leaderSelfTermEnabled,
      leaderTenureMs: this.leaderTenureMs,
      killEnabled: this.killEnabled,
      killIntervalMs: this.killIntervalMs,
      deltaMode: this.deltaMode,
      deltaFixed: this.deltaFixed,
      deltaMin: this.deltaMin,
      deltaMax: this.deltaMax,
      paused: this.paused,
    };
  }

  applyPatch(body) {
    if (body.mode != null) this.mode = String(body.mode).toLowerCase();
    if (body.txEnabled != null) this.txEnabled = !!body.txEnabled;
    if (body.txBurst != null) {
      this.txBurst = Math.min(1, Math.max(1, parseInt(body.txBurst, 10)));
    }
    if (body.txIntervalSec != null) {
      this.txIntervalMs = Math.max(1000, parseInt(body.txIntervalSec, 10) * 1000);
    }
    if (body.txIntervalMs != null) {
      this.txIntervalMs = Math.max(1000, parseInt(body.txIntervalMs, 10));
    }
    if (body.leaderSelfTermEnabled != null) {
      this.leaderSelfTermEnabled = !!body.leaderSelfTermEnabled;
    }
    if (body.leaderTenureMs != null) {
      this.leaderTenureMs = Math.max(0, parseInt(body.leaderTenureMs, 10));
    }
    if (body.killEnabled != null) this.killEnabled = !!body.killEnabled;
    if (body.killIntervalMs != null) {
      this.killIntervalMs = Math.max(5000, parseInt(body.killIntervalMs, 10));
    }
    if (body.deltaMode != null) this.deltaMode = body.deltaMode;
    if (body.deltaFixed != null) this.deltaFixed = body.deltaFixed;
    if (body.deltaMin != null) this.deltaMin = parseFloat(body.deltaMin);
    if (body.deltaMax != null) this.deltaMax = parseFloat(body.deltaMax);
    if (body.paused != null) this.paused = !!body.paused;
    return this.snapshot();
  }
}

module.exports = { SimulationPolicy };
