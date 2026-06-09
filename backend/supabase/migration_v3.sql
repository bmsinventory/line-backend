-- Migration v3 — สร้าง messages table (ถ้ายังไม่มี) + เพิ่ม quote_token
-- รัน SQL นี้ใน Supabase SQL Editor

-- สร้าง messages table ถ้ายังไม่มี
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID        NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  from_type       TEXT        NOT NULL,
  who             TEXT,
  text            TEXT        NOT NULL DEFAULT '',
  attachment      TEXT,
  line_message_id TEXT,
  quote_token     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_from_type CHECK (from_type IN ('customer','agent','system'))
);

-- ถ้า messages มีอยู่แล้วแต่ยังไม่มี quote_token ให้เพิ่ม
ALTER TABLE messages ADD COLUMN IF NOT EXISTS quote_token TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_issue_id ON messages(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_quote_token
  ON messages(issue_id, from_type, created_at DESC)
  WHERE quote_token IS NOT NULL;

-- เปิด Realtime สำหรับ messages (ถ้ายังไม่ได้เปิด)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
