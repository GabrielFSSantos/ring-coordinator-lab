const { TransactionStoryLogger } = require("../infrastructure/logging/TransactionStoryLogger");

describe("TransactionStoryLogger", () => {
  it("emits one story block on success", () => {
    const blocks = [];
    const logger = {
      config: { logTxStory: true },
      story: (_role, lines) => blocks.push(lines),
    };
    const nodeApp = { config: { hostname: "ubuntu-node-5", port: 3005 } };
    const story = new TransactionStoryLogger(logger, nodeApp);
    story.onEnqueue(
      { requestId: "r1", nodeName: "ubuntu-node-2", delta: "-10.00" },
      1,
      1
    );
    story.onSuccess(
      { requestId: "r1", nodeName: "ubuntu-node-2", delta: "-10.00" },
      999000
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].join(" ")).toContain("ubuntu-node-2");
    expect(blocks[0].join(" ")).toContain("Gravado no banco");
  });
});
