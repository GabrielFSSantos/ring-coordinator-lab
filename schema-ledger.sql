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

CREATE INDEX IF NOT EXISTS idx_timeline_events_request_id ON timeline_events(request_id);
