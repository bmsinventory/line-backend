-- =====================================================
-- Migration: Team Types System
-- รัน SQL นี้ใน Supabase SQL Editor
-- =====================================================

-- เพิ่มคอลัมน์ที่ยังขาดใน members (ถ้ายังไม่มี)
ALTER TABLE members ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- =====================================================
-- team_types: ประเภททีม
-- =====================================================
CREATE TABLE IF NOT EXISTS team_types (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name   TEXT        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#64748B',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO team_types (team_name, description, color) VALUES
  ('ทีม IT',        'โครงสร้างพื้นฐาน IT และระบบเครือข่าย', '#3B82F6'),
  ('ทีม HOSxP',     'ระบบ HOSxP HIS',                        '#8B5CF6'),
  ('ทีมคลังสินค้า', 'จัดการสินค้าและคลังสินค้า',               '#F59E0B'),
  ('ทีมบัญชี',      'ระบบบัญชีและการเงิน',                    '#EC4899'),
  ('ทีมอื่น ๆ',     'ทีมงานอื่นๆ ที่ไม่ได้ระบุ',               '#64748B')
ON CONFLICT DO NOTHING;

-- =====================================================
-- member_team_types: สมาชิก ↔ ประเภททีม (many-to-many)
-- =====================================================
CREATE TABLE IF NOT EXISTS member_team_types (
  member_id    TEXT NOT NULL REFERENCES members(id)     ON DELETE CASCADE,
  team_type_id UUID NOT NULL REFERENCES team_types(id)  ON DELETE CASCADE,
  PRIMARY KEY (member_id, team_type_id)
);

-- =====================================================
-- เพิ่ม team_type_id ใน issues (nullable, FK → team_types)
-- =====================================================
ALTER TABLE issues ADD COLUMN IF NOT EXISTS team_type_id UUID REFERENCES team_types(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_issues_team_type ON issues(team_type_id);

-- =====================================================
-- Realtime สำหรับตารางใหม่
-- =====================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE team_types;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE member_team_types;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE members;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
