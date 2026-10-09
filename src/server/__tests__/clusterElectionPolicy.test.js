const {
  shouldScheduleClusterElection,
} = require("../domain/election/clusterElectionPolicy");

describe("shouldScheduleClusterElection", () => {
  const base = {
    clusterInitiatorPort: 3002,
    advertisePortBase: 3002,
    coordinatorPort: null,
    inElection: false,
    nodeCount: 4,
    peerCount: 4,
  };

  it("só a menor porta do anel dispara", () => {
    expect(
      shouldScheduleClusterElection({ ...base, port: 3002 })
    ).toBe(true);
    expect(
      shouldScheduleClusterElection({ ...base, port: 3005 })
    ).toBe(false);
  });

  it("espera o conjunto local completo", () => {
    expect(
      shouldScheduleClusterElection({ ...base, port: 3002, peerCount: 2 })
    ).toBe(false);
  });

  it("NODE_COUNT=1 dispara com um peer visível", () => {
    expect(
      shouldScheduleClusterElection({
        ...base,
        port: 3002,
        nodeCount: 1,
        peerCount: 1,
      })
    ).toBe(true);
  });

  it("não dispara com líder já eleito", () => {
    expect(
      shouldScheduleClusterElection({
        ...base,
        port: 3002,
        coordinatorPort: 3005,
      })
    ).toBe(false);
  });
});
