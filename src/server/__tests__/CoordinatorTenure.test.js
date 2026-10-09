const { CoordinatorTenure } = require("../application/CoordinatorTenure");

describe("CoordinatorTenure", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("dispara renúncia após tenure no coordenador", () => {
    const resign = jest.fn();
    const node = {
      isCoordinator: true,
      inElection: false,
      simulationPolicy: {
        leaderSelfTermEnabled: true,
        leaderTenureMs: 10_000,
      },
      requestLeaderSelfResignation: resign,
    };
    const tenure = new CoordinatorTenure(node);
    tenure.startIfEnabled();
    jest.advanceTimersByTime(10_000);
    expect(resign).toHaveBeenCalledWith("leader-tenure");
  });

  it("não agenda se self-term desligado", () => {
    const resign = jest.fn();
    const node = {
      isCoordinator: true,
      inElection: false,
      simulationPolicy: { leaderSelfTermEnabled: false, leaderTenureMs: 5000 },
      requestLeaderSelfResignation: resign,
    };
    const tenure = new CoordinatorTenure(node);
    tenure.startIfEnabled();
    jest.advanceTimersByTime(20_000);
    expect(resign).not.toHaveBeenCalled();
  });
});
