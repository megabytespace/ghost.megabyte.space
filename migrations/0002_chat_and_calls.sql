-- Chat messages from the website AI chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id, created_at);

-- Call transmissions from the Twilio hotline
CREATE TABLE IF NOT EXISTS call_transmissions (
  id TEXT PRIMARY KEY,
  call_sid TEXT NOT NULL,
  caller_number TEXT,
  transcript TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  turn_number INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_call_sid ON call_transmissions(call_sid, turn_number);
CREATE INDEX IF NOT EXISTS idx_call_created ON call_transmissions(created_at DESC);
