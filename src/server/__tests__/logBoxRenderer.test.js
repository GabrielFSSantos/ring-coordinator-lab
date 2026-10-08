const { wrapInBox } = require("../infrastructure/logging/logBoxRenderer");

describe("logBoxRenderer", () => {
  it("wraps content in box borders", () => {
    const lines = wrapInBox("ubuntu-node-3 · participante", ["Olá mundo"], {
      port: 3003,
    });
    expect(lines[0]).toMatch(/┌/);
    expect(lines[lines.length - 1]).toMatch(/└/);
    expect(lines.some((l) => l.includes("Olá mundo"))).toBe(true);
  });
});
