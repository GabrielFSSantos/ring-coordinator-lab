const Database = require("better-sqlite3");
const { readFileSync, existsSync } = require("fs");
const { parseMoneyToCents, centsToMoney } = require("../shared/money");

class LedgerDatabase {
  constructor(dbPath, schemaPath, initialBalance) {
    this.dbPath = dbPath;
    this.schemaPath = schemaPath;
    this.initialBalance = initialBalance;
    this.db = null;
  }

  open(options = {}) {
    if (this.db) return;
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");
    this.applySchema();
    this.ensureAccount();
    if (options.resetOnStart) {
      this.resetLabData();
    }
  }

  resetLabData() {
    this.db.exec("DELETE FROM timeline_events");
    this.db.exec("DELETE FROM ledger_entries");
    const cents = parseMoneyToCents(this.initialBalance);
    this.db.prepare("UPDATE account SET balance_cents = ? WHERE id = 1").run(cents);
    const row = this.db.prepare("SELECT id FROM account WHERE id = 1").get();
    if (!row) {
      this.db.prepare("INSERT INTO account (id, balance_cents) VALUES (1, ?)").run(cents);
    }
  }

  applySchema() {
    const inline = `
CREATE TABLE IF NOT EXISTS storage_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  primary_id TEXT NOT NULL,
  owner_host TEXT NOT NULL,
  base_url TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  balance_cents INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_type TEXT NOT NULL,
  request_id TEXT UNIQUE,
  host_name TEXT,
  node_name TEXT,
  node_port INTEGER,
  delta_cents INTEGER,
  balance_after_cents INTEGER,
  message TEXT,
  created_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at_ms INTEGER NOT NULL,
  event_code TEXT NOT NULL,
  role TEXT NOT NULL,
  lab_host_name TEXT,
  node_name TEXT,
  node_port INTEGER,
  message TEXT NOT NULL,
  detail TEXT,
  request_id TEXT,
  client_event_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_timeline_events_request_id ON timeline_events(request_id);`;
    if (this.schemaPath && existsSync(this.schemaPath)) {
      this.db.exec(readFileSync(this.schemaPath, "utf8"));
    } else {
      this.db.exec(inline);
    }
    this.ensureTimelineTable();
  }

  ensureTimelineTable() {
    this.db.exec(`
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at_ms INTEGER NOT NULL,
  event_code TEXT NOT NULL,
  role TEXT NOT NULL,
  lab_host_name TEXT,
  node_name TEXT,
  node_port INTEGER,
  message TEXT NOT NULL,
  detail TEXT,
  request_id TEXT,
  client_event_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_timeline_events_request_id ON timeline_events(request_id);`);
  }

  ensureAccount() {
    const row = this.db.prepare("SELECT balance_cents FROM account WHERE id = 1").get();
    if (!row) {
      const cents = parseMoneyToCents(this.initialBalance);
      this.db.prepare("INSERT INTO account (id, balance_cents) VALUES (1, ?)").run(cents);
    }
  }

  getPrimaryMeta() {
    return this.db.prepare("SELECT * FROM storage_meta WHERE id = 1").get();
  }

  setPrimaryMeta({ primaryId, ownerHost, baseUrl, epoch }) {
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO storage_meta (id, primary_id, owner_host, base_url, epoch, updated_at_ms)
         VALUES (1, @primaryId, @ownerHost, @baseUrl, @epoch, @now)
         ON CONFLICT(id) DO UPDATE SET
           primary_id = excluded.primary_id,
           owner_host = excluded.owner_host,
           base_url = excluded.base_url,
           epoch = excluded.epoch,
           updated_at_ms = excluded.updated_at_ms`
      )
      .run({ primaryId, ownerHost, baseUrl, epoch, now });
  }

  getBalance() {
    const row = this.db.prepare("SELECT balance_cents FROM account WHERE id = 1").get();
    return row ? row.balance_cents : 0;
  }

  listLedger(limit = 50, afterId = 0) {
    return this.db
      .prepare(
        `SELECT * FROM ledger_entries WHERE id > ? ORDER BY id ASC LIMIT ?`
      )
      .all(afterId, limit);
  }

  appendEntry(entry) {
    const stmt = this.db.prepare(
      `INSERT INTO ledger_entries (
        entry_type, request_id, host_name, node_name, node_port,
        delta_cents, balance_after_cents, message, created_at_ms
      ) VALUES (
        @entryType, @requestId, @hostName, @nodeName, @nodePort,
        @deltaCents, @balanceAfterCents, @message, @createdAtMs
      ) RETURNING *`
    );
    return stmt.get(entry);
  }

  applyTransaction({ requestId, hostName, nodeName, nodePort, deltaCents }) {
    const existing = this.db
      .prepare("SELECT * FROM ledger_entries WHERE request_id = ?")
      .get(requestId);
    if (existing) {
      return { duplicate: true, entry: existing };
    }

    const tx = this.db.transaction(() => {
      const account = this.db
        .prepare("SELECT balance_cents FROM account WHERE id = 1")
        .get();
      const newBalance = account.balance_cents + deltaCents;
      this.db
        .prepare("UPDATE account SET balance_cents = ? WHERE id = 1")
        .run(newBalance);
      const entry = this.appendEntry({
        entryType: "txn",
        requestId,
        hostName,
        nodeName,
        nodePort,
        deltaCents,
        balanceAfterCents: newBalance,
        message: `txn ${centsToMoney(deltaCents)} balance=${centsToMoney(newBalance)}`,
        createdAtMs: Date.now(),
      });
      return entry;
    });
    return { duplicate: false, entry: tx() };
  }

  appendTimelineEvent({
    clientEventId,
    eventCode,
    role,
    labHostName,
    nodeName,
    nodePort,
    message,
    detail,
    requestId,
  }) {
    const existing = this.db
      .prepare("SELECT id FROM timeline_events WHERE client_event_id = ?")
      .get(clientEventId);
    if (existing) {
      return { duplicate: true, id: existing.id };
    }
    const createdAtMs = Date.now();
    const row = this.db
      .prepare(
        `INSERT INTO timeline_events (
          created_at_ms, event_code, role, lab_host_name, node_name, node_port,
          message, detail, request_id, client_event_id
        ) VALUES (
          @createdAtMs, @eventCode, @role, @labHostName, @nodeName, @nodePort,
          @message, @detail, @requestId, @clientEventId
        ) RETURNING id`
      )
      .get({
        createdAtMs,
        eventCode,
        role,
        labHostName: labHostName || null,
        nodeName: nodeName || null,
        nodePort: nodePort ?? null,
        message: message || "",
        detail: detail || null,
        requestId: requestId || null,
        clientEventId,
      });
    return { duplicate: false, id: row.id };
  }

  listTimelineEvents(limit = 100, afterId = 0, requestId = null) {
    if (requestId) {
      return this.db
        .prepare(
          `SELECT * FROM timeline_events WHERE request_id = ? ORDER BY id ASC LIMIT ?`
        )
        .all(requestId, limit);
    }
    return this.db
      .prepare(
        `SELECT * FROM timeline_events WHERE id > ? ORDER BY id ASC LIMIT ?`
      )
      .all(afterId, limit);
  }

  appendAdmin({ requestId, hostName, nodeName, message }) {
    const balance = this.getBalance();
    return this.appendEntry({
      entryType: "admin",
      requestId: requestId || `admin-${Date.now()}`,
      hostName,
      nodeName,
      nodePort: null,
      deltaCents: null,
      balanceAfterCents: balance,
      message,
      createdAtMs: Date.now(),
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = { LedgerDatabase };
