const { SimulationPolicy } = require("../application/SimulationPolicy");

describe("SimulationPolicy", () => {
  const base = {
    simMode: "manual",
    simTxEnabled: false,
    simLeaderSelfTermEnabled: false,
    simLeaderTenureMs: 90_000,
    simTxBurst: 2,
    simTxIntervalMs: 5000,
    simTxJitterMs: 0,
    simLeaderKillIntervalMs: 25000,
    simDeltaMin: -10,
    simDeltaMax: 10,
  };

  it("manual desliga TX e renúncia automática", () => {
    const p = SimulationPolicy.fromConfig(base);
    expect(p.txEnabled).toBe(false);
    expect(p.leaderSelfTermEnabled).toBe(false);
    expect(p.killEnabled).toBe(false);
  });

  it("simTxEnabled liga TX sem kill remoto", () => {
    const p = SimulationPolicy.fromConfig({
      ...base,
      simTxEnabled: true,
      simLeaderSelfTermEnabled: true,
    });
    expect(p.txEnabled).toBe(true);
    expect(p.leaderSelfTermEnabled).toBe(true);
    expect(p.killEnabled).toBe(false);
  });

  it("aplica burst mínimo 1 e máximo 1", () => {
    const p = SimulationPolicy.fromConfig(base);
    p.applyPatch({ txBurst: 0 });
    expect(p.txBurst).toBe(1);
    p.applyPatch({ txBurst: 5 });
    expect(p.txBurst).toBe(1);
  });

  it("txIntervalSec converte para ms no snapshot", () => {
    const p = SimulationPolicy.fromConfig(base);
    p.applyPatch({ txIntervalSec: 10 });
    expect(p.txIntervalMs).toBe(10000);
    expect(p.snapshot().txIntervalSec).toBe(10);
  });

  it("snapshot reflete patch", () => {
    const p = SimulationPolicy.fromConfig(base);
    p.applyPatch({ txIntervalMs: 8000, txEnabled: true });
    expect(p.snapshot().txIntervalMs).toBe(8000);
    expect(p.snapshot().txEnabled).toBe(true);
  });
});
