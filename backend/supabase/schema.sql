-- =====================================================
-- LINE Issue Tracker — Supabase Schema
-- รัน SQL นี้ใน Supabase SQL Editor
-- =====================================================

-- UUID extension (มีอยู่แล้วใน Supabase แต่ใส่ไว้เผื่อ)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- groups: กลุ่ม Line / OpenChat ที่เชื่อมต่อกับระบบ
-- =====================================================
CREATE TABLE IF NOT EXISTS groups (
  id              TEXT        PRIMARY KEY,
  line_group_id   TEXT        UNIQUE,           -- C... จาก Line API (NULL จนกว่าจะเชื่อมต่อ)
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL DEFAULT 'group', -- 'group' | 'openchat'
  color           TEXT        NOT NULL DEFAULT '#06C755',
  initials        TEXT        NOT NULL DEFAULT '??',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- members: ทีมงานภายใน
-- =====================================================
CREATE TABLE IF NOT EXISTS members (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  role            TEXT,
  color           TEXT        NOT NULL DEFAULT '#64748B',
  initials        TEXT        NOT NULL DEFAULT '??',
  line_user_id    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- issues: ปัญหา / ticket
-- =====================================================
CREATE TABLE IF NOT EXISTS issues (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT        UNIQUE,               -- LINE-XXXX (auto-generated)
  group_id          TEXT        REFERENCES groups(id) ON DELETE SET NULL,
  reporter_name     TEXT        NOT NULL DEFAULT 'ไม่ระบุ',
  reporter_color    TEXT        NOT NULL DEFAULT '#64748B',
  reporter_initials TEXT        NOT NULL DEFAULT '??',
  line_user_id      TEXT,                            -- userId จาก Line
  line_group_id     TEXT,                            -- groupId จาก Line (สำหรับ push reply)
  title             TEXT        NOT NULL,
  category          TEXT        NOT NULL DEFAULT 'howto',
  tags              TEXT[]      NOT NULL DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'new',
  priority          TEXT        NOT NULL DEFAULT 'normal',
  assignee_id       TEXT        REFERENCES members(id) ON DELETE SET NULL,
  unread            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,

  CONSTRAINT chk_status   CHECK (status   IN ('new','in_progress','waiting','resolved')),
  CONSTRAINT chk_priority CHECK (priority IN ('urgent','high','normal','low')),
  CONSTRAINT chk_category CHECK (category IN ('bug','repair','billing','howto','complaint','feature'))
);

-- Auto-generate issue code: LINE-1001, LINE-1002, ...
CREATE SEQUENCE IF NOT EXISTS issue_code_seq START 1001;

CREATE OR REPLACE FUNCTION set_issue_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := 'LINE-' || nextval('issue_code_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_code ON issues;
CREATE TRIGGER trg_issue_code
  BEFORE INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION set_issue_code();

-- =====================================================
-- messages: ข้อความใน thread ของแต่ละ issue
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID        NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  from_type       TEXT        NOT NULL,   -- 'customer' | 'agent' | 'system'
  who             TEXT,                   -- ชื่อผู้ส่ง (NULL สำหรับ system)
  text            TEXT        NOT NULL DEFAULT '',
  attachment      TEXT,                   -- 'image' | 'video' | NULL
  line_message_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_from_type CHECK (from_type IN ('customer','agent','system'))
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_issues_group_id    ON issues(group_id);
CREATE INDEX IF NOT EXISTS idx_issues_status       ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at   ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_line_user    ON issues(line_user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_messages_issue_id   ON messages(issue_id, created_at);

-- =====================================================
-- Realtime: เปิด realtime สำหรับ issues + messages
-- =====================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE issues;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
