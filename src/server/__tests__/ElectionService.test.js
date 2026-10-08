const { ElectionService } = require("../domain/election/ElectionService");

describe("ElectionService", () => {
  it("joins first wave when election list is empty", () => {
    expect(ElectionService.shouldParticipateFirstWave(3002, [])).toBe(true);
    expect(ElectionService.shouldParticipateFirstWave(3005, [3002])).toBe(false);
  });

  it("restarts election when initiator port is lower than local", () => {
    expect(
      ElectionService.shouldRestartElection(3005, [3002, 3003], false)
    ).toBe(true);
    expect(
      ElectionService.shouldRestartElection(3002, [3002, 3003], false)
    ).toBe(false);
  });

  it("picks coordinator as max port", () => {
    expect(ElectionService.pickCoordinatorPort([3002, 3003, 3005])).toBe(3005);
  });
});
