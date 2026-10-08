const {
  formatHumanBlock,
  formatStructuredLine,
  buildTimelineMessage,
} = require("../infrastructure/logging/humanLogFormatter");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");

describe("humanLogFormatter", () => {
  const context = {
    labHostName: "docker-lab",
    hostname: "ubuntu-node-3",
    port: 3003,
  };

  const formatOpts = { logStyle: "box", logDetail: false, logTxStory: true };

  it("renders boxed PT-BR narrative for TX_SEND", () => {
    const lines = formatHumanBlock(
      context,
      "FOLLOWER",
      LogEventCodes.TX_SEND,
      "delta=-12.50 req=abc-1",
      { formatOpts }
    );
    const out = lines.join("\n");
    expect(out).toContain("┌");
    expect(out).toContain("movimentação");
    expect(out).not.toContain("[TX_SEND]");
    expect(out).not.toContain("req=abc");
  });

  it("suppresses leader TX_ENQUEUE when logTxStory is true", () => {
    const lines = formatHumanBlock(
      context,
      "LEADER",
      LogEventCodes.TX_ENQUEUE,
      "req=abc-1",
      { formatOpts, queue: "1/2" }
    );
    expect(lines).toHaveLength(0);
  });

  it("renders multiline RING_VIEW summary", () => {
    const lines = formatHumanBlock(context, "ELECTION", LogEventCodes.RING_VIEW, "", {
      formatOpts,
      ringView: {
        peerCount: 2,
        leaderPort: 3005,
        leaderLabHost: "docker-lab",
        leaderNodeName: "ubuntu-node-5",
        storageUrl: "http://172.25.0.10:4000",
        storageUp: true,
        selfPort: 3003,
        selfLabHost: "docker-lab",
        selfNodeName: "ubuntu-node-3",
        peers: [{ port: 3002, labHostName: "docker-lab", nodeName: "n2", host: "172.25.0.2" }],
      },
    });
    const out = lines.join("\n");
    expect(out).toContain("Resumo do grupo");
    expect(out).toContain("ubuntu-node-5");
  });

  it("buildTimelineMessage includes leader TX steps when logDetail is false", () => {
    const msg = buildTimelineMessage(
      { ...context, hostname: "ubuntu-node-5" },
      "LEADER",
      LogEventCodes.TX_ENQUEUE,
      "req=sim-1",
      { queue: "1/1" }
    );
    expect(msg).toContain("fila");
  });

  it("keeps structured single line", () => {
    const lines = formatStructuredLine(
      context,
      "LEADER",
      LogEventCodes.TX_APPLY,
      "req=x balance=10.00",
      {}
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("TX_APPLY");
  });
});
