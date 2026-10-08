const {
  resolveSimTxIntervalMs,
  resolveSimTxInitialStaggerMs,
} = require("../config/env");

describe("resolveSimTxIntervalMs", () => {
  it("uses explicit SIM_TX_INTERVAL_MS when set", () => {
    expect(
      resolveSimTxIntervalMs({ SIM_TX_INTERVAL_MS: "12000" }, 3003, 3002)
    ).toBe(12000);
  });

  it("falls back to organic preset by port index", () => {
    expect(resolveSimTxIntervalMs({}, 3002, 3002)).toBe(10000);
    expect(resolveSimTxIntervalMs({}, 3003, 3002)).toBe(5000);
    expect(resolveSimTxIntervalMs({}, 3004, 3002)).toBe(8000);
    expect(resolveSimTxIntervalMs({}, 3005, 3002)).toBe(7000);
  });
});

describe("resolveSimTxInitialStaggerMs", () => {
  it("staggers by port index when env unset", () => {
    expect(resolveSimTxInitialStaggerMs({}, 3002, 3002)).toBe(0);
    expect(resolveSimTxInitialStaggerMs({}, 3005, 3002)).toBe(3000);
  });
});
