const fs = require("fs");
const os = require("os");
const path = require("path");
const { LedgerDatabase } = require("../../storage/LedgerDatabase");

describe("LedgerDatabase", () => {
  let dbPath;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `ledger-${Date.now()}.db`);
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 20));
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it("aplica transação e idempotência", () => {
    const db = new LedgerDatabase(dbPath, null, "1000.00");
    db.open();
    const r1 = db.applyTransaction({
      requestId: "r1",
      hostName: "h",
      nodeName: "n",
      nodePort: 3002,
      deltaCents: 500,
    });
    expect(r1.entry.balance_after_cents).toBe(100500);
    const r2 = db.applyTransaction({
      requestId: "r1",
      hostName: "h",
      nodeName: "n",
      nodePort: 3002,
      deltaCents: 500,
    });
    expect(r2.duplicate).toBe(true);
    db.close();
  });

  it("timeline events idempotent and paginated", () => {
    const db = new LedgerDatabase(dbPath, null, "1000.00");
    db.open();
    const a = db.appendTimelineEvent({
      clientEventId: "evt-1",
      eventCode: "TX_SEND",
      role: "FOLLOWER",
      labHostName: "lab",
      nodeName: "n1",
      nodePort: 3002,
      message: "pedido",
      detail: "req=r1",
      requestId: "r1",
    });
    expect(a.duplicate).toBe(false);
    const b = db.appendTimelineEvent({
      clientEventId: "evt-1",
      eventCode: "TX_SEND",
      role: "FOLLOWER",
      labHostName: "lab",
      nodeName: "n1",
      nodePort: 3002,
      message: "pedido",
      detail: "req=r1",
      requestId: "r1",
    });
    expect(b.duplicate).toBe(true);
    const page = db.listTimelineEvents(10, 0);
    expect(page.length).toBe(1);
    const byReq = db.listTimelineEvents(10, 0, "r1");
    expect(byReq[0].request_id).toBe("r1");
    db.close();
  });

  it("resetLabData clears timeline and restores initial balance", () => {
    const db = new LedgerDatabase(dbPath, null, "1000.00");
    db.open();
    db.applyTransaction({
      requestId: "r-reset",
      hostName: "h",
      nodeName: "n",
      nodePort: 3002,
      deltaCents: 100,
    });
    db.appendTimelineEvent({
      clientEventId: "evt-reset",
      eventCode: "BOOT",
      role: "BOOT",
      message: "x",
    });
    expect(db.getBalance()).toBe(100100);
    expect(db.listTimelineEvents(10, 0).length).toBe(1);
    db.resetLabData();
    expect(db.getBalance()).toBe(100000);
    expect(db.listTimelineEvents(10, 0).length).toBe(0);
    db.close();
  });
});
