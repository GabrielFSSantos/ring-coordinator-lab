const Database = require("better-sqlite3");
const { readFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
class SqliteLogRepository {
  constructor(databasePath, schemaPath) {
    this.databasePath = databasePath;
    this.schemaPath = schemaPath;
    this.db = null;
  }

  open() {
    if (this.db) return;
    const dir = path.dirname(path.resolve(this.databasePath));
    if (dir && dir !== ".") {
      mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(this.databasePath);
    this.db.pragma("journal_mode = WAL");
    this.applySchema();
  }

  applySchema() {
    const inline = `
CREATE TABLE IF NOT EXISTS log_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostname TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  request_id TEXT UNIQUE
);`;
    if (this.schemaPath && existsSync(this.schemaPath)) {
      const sql = readFileSync(this.schemaPath, "utf8");
      this.db.exec(sql);
    } else {
      this.db.exec(inline);
    }
  }

  append({ hostname, timestampMs, requestId }) {
    this.open();
    const stmt = this.db.prepare(
      `INSERT INTO log_entries (hostname, timestamp_ms, request_id)
       VALUES (@hostname, @timestampMs, @requestId)
       RETURNING id, hostname, timestamp_ms, request_id`
    );
    return stmt.get({
      hostname,
      timestampMs,
      requestId,
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = { SqliteLogRepository };
