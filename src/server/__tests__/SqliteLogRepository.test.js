const fs = require("fs");
const os = require("os");
const path = require("path");
const { SqliteLogRepository } = require("../infrastructure/persistence/SqliteLogRepository");

describe("SqliteLogRepository", () => {
  let dbPath;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `ring-lab-${Date.now()}.db`);
  });

  afterEach(() => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it("insere e retorna linha", () => {
    const repo = new SqliteLogRepository(dbPath, null);
    const row = repo.append({
      hostname: "test-node",
      timestampMs: 123456,
      requestId: "req-1",
    });
    expect(row.hostname).toBe("test-node");
    expect(row.request_id).toBe("req-1");
    repo.close();
  });
});
