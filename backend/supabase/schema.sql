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

-- =====================================================
-- categories: หมวดหมู่ปัญหา (dynamic)
-- =====================================================
ALTER TABLE issues DROP CONSTRAINT IF EXISTS chk_category;

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT        PRIMARY KEY,
  label      TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#64748B',
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (id, label, color, sort_order) VALUES
  ('bug',       'บั๊กระบบ',        '#EF4444', 1),
  ('repair',    'แจ้งซ่อม',        '#F59E0B', 2),
  ('billing',   'การเงิน/บิล',     '#8B5CF6', 3),
  ('howto',     'สอบถามการใช้งาน', '#0EA5E9', 4),
  ('complaint', 'ร้องเรียนบริการ', '#EC4899', 5),
  ('feature',   'ขอฟีเจอร์',       '#10B981', 6)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- quick_replies: ข้อความตอบกลับด่วน
-- =====================================================
CREATE TABLE IF NOT EXISTS quick_replies (
  id         SERIAL      PRIMARY KEY,
  text       TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO quick_replies (text, sort_order) VALUES
  ('รับเรื่องแล้วครับ กำลังตรวจสอบให้นะครับ 🙏', 1),
  ('ขออภัยในความไม่สะดวกค่ะ', 2),
  ('ดำเนินการเรียบร้อยแล้วครับ', 3),
  ('รบกวนแจ้งรายละเอียดเพิ่มเติมหน่อยได้ไหมคะ', 4),
  ('ขอบคุณที่แจ้งเข้ามานะคะ 😊', 5);

-- =====================================================
-- app_settings: การตั้งค่าระบบ (SLA, notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('sla',           '{"urgent": 15, "high": 60, "normal": 240}'),
  ('notifications', '{"newIssue": true, "urgent": true, "assigned": true, "daily": false, "sound": true}')
ON CONFLICT (key) DO NOTHING;
