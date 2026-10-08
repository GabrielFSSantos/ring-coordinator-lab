const { SimulationRunner } = require("../application/SimulationRunner");

describe("SimulationRunner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends one simulated transaction per cycle", () => {
    const sends = [];
    const nodeApp = {
      isCoordinator: false,
      simulatedDown: false,
      config: { simTxInitialStaggerMs: 0 },
      simulationPolicy: {
        paused: false,
        txEnabled: true,
        txIntervalMs: 5000,
        txJitterMs: 0,
        mode: "manual",
        killEnabled: false,
      },
      getSimTxBurst: () => 1,
      sendSimulatedTransaction: (i) => sends.push(i),
    };
    const runner = new SimulationRunner(nodeApp);
    runner.start();
    jest.advanceTimersByTime(1);
    expect(sends).toHaveLength(0);
    jest.advanceTimersByTime(5000);
    expect(sends).toEqual([0]);
    jest.advanceTimersByTime(5000);
    expect(sends).toEqual([0, 0]);
    runner.stop();
  });

  it("delays first cycle by initial stagger", () => {
    const sends = [];
    const nodeApp = {
      isCoordinator: false,
      simulatedDown: false,
      config: { simTxInitialStaggerMs: 3000 },
      simulationPolicy: {
        paused: false,
        txEnabled: true,
        txIntervalMs: 5000,
        txJitterMs: 0,
        mode: "manual",
        killEnabled: false,
      },
      getSimTxBurst: () => 1,
      sendSimulatedTransaction: () => sends.push(1),
    };
    const runner = new SimulationRunner(nodeApp);
    runner.start();
    jest.advanceTimersByTime(5000);
    expect(sends).toHaveLength(0);
    jest.advanceTimersByTime(3000);
    expect(sends).toHaveLength(1);
    runner.stop();
  });
});
