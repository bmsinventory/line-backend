-- =====================================================
-- Migration v2 — เพิ่ม categories, quick_replies, app_settings
-- รัน SQL นี้ใน Supabase SQL Editor (สำหรับ DB ที่รัน schema v1 ไปแล้ว)
-- =====================================================

-- ลบ constraint category แบบ hard-coded ออก (รองรับ dynamic categories)
ALTER TABLE issues DROP CONSTRAINT IF EXISTS chk_category;

-- ลบ constraint members.line_user_id ถ้ายังไม่มี column
ALTER TABLE members ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- categories
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

-- quick_replies
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

-- app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('sla',           '{"urgent": 15, "high": 60, "normal": 240}'),
  ('notifications', '{"newIssue": true, "urgent": true, "assigned": true, "daily": false, "sound": true}')
ON CONFLICT (key) DO NOTHING;
