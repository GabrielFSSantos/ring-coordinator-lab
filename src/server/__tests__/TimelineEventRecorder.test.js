const { TimelineEventRecorder } = require("../infrastructure/logging/TimelineEventRecorder");
const { parseSkipCodes } = require("../infrastructure/logging/timelinePersistPolicy");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");

describe("TimelineEventRecorder", () => {
  it("skips RING_VIEW by default", async () => {
    const appended = [];
    const recorder = new TimelineEventRecorder({
      appendLocal: (p) => appended.push(p),
      skipSet: parseSkipCodes(""),
      labHostName: "lab",
      hostname: "n1",
      port: 3002,
    });
    recorder.enqueue("ELECTION", LogEventCodes.RING_VIEW, "", {
      ringView: { peerCount: 1, peers: [], storageUp: true },
    });
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setTimeout(r, 20));
    expect(appended).toHaveLength(0);
  });

  it("enqueues TX_SEND asynchronously", async () => {
    const appended = [];
    const recorder = new TimelineEventRecorder({
      appendLocal: (p) => appended.push(p),
      skipSet: parseSkipCodes(""),
      labHostName: "lab",
      hostname: "ubuntu-node-2",
      port: 3002,
    });
    recorder.enqueue(
      "FOLLOWER",
      LogEventCodes.TX_SEND,
      "delta=-10.00 req=sim-1"
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(appended.length).toBe(1);
    expect(appended[0].eventCode).toBe("TX_SEND");
    expect(appended[0].requestId).toBe("sim-1");
  });

  it("drain waits for queue to empty", async () => {
    const appended = [];
    const recorder = new TimelineEventRecorder({
      appendLocal: (p) => appended.push(p),
      skipSet: parseSkipCodes(""),
      labHostName: "lab",
      hostname: "n1",
      port: 3002,
    });
    recorder.enqueue("FOLLOWER", LogEventCodes.TX_SEND, "delta=1 req=r1");
    await recorder.drain(500);
    expect(appended.length).toBe(1);
  });
});
