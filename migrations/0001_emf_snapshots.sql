CREATE TABLE IF NOT EXISTS emf_snapshots (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  state TEXT NOT NULL,
  numeric_value REAL NOT NULL,
  unit TEXT,
  last_changed TEXT NOT NULL,
  last_updated TEXT NOT NULL,
  sampled_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'home_assistant'
);

CREATE INDEX IF NOT EXISTS idx_emf_snapshots_entity_sampled_at
ON emf_snapshots (entity_id, sampled_at DESC);
