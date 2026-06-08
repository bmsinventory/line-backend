-- =====================================================
-- LINE Issue Tracker — Seed Data
-- รัน SQL นี้หลังจาก schema.sql
-- =====================================================

-- ทีมงาน
INSERT INTO members (id, name, role, color, initials) VALUES
  ('m0', 'คุณ (แอดมิน)',  'แอดมิน',       '#06C755', 'ME'),
  ('m1', 'พิมพ์ชนก ว.',   'ซัพพอร์ต',     '#F472B6', 'พช'),
  ('m2', 'ธนกร ส.',        'ทีมเทคนิค',    '#3B82F6', 'ธก'),
  ('m3', 'ณัฐวุฒิ ม.',     'ช่างซ่อม',     '#F59E0B', 'ณว'),
  ('m4', 'สุชาดา ก.',      'การเงิน',      '#8B5CF6', 'สช'),
  ('m5', 'อนุชา พ.',       'ทีมเทคนิค',    '#0EA5E9', 'อช')
ON CONFLICT (id) DO NOTHING;

-- กลุ่ม Line (line_group_id = NULL จนกว่าจะเชื่อมต่อจริง)
-- วิธีอัปเดต line_group_id: UPDATE groups SET line_group_id = 'Cxxx' WHERE id = 'g1';
INSERT INTO groups (id, line_group_id, name, type, color, initials) VALUES
  ('g1', NULL, 'ลูกค้า VIP · โครงการ The Park', 'group',    '#06C755', 'VP'),
  ('g2', NULL, 'แจ้งซ่อม หมู่บ้านสุขใจ',        'group',    '#F59E0B', 'สข'),
  ('g3', NULL, 'Support ระบบ POS ร้านค้า',      'group',    '#3B82F6', 'PS'),
  ('g4', NULL, 'OpenChat · ผู้ใช้แอป FoodGo',    'openchat', '#EF4444', 'FG'),
  ('g5', NULL, 'นิติบุคคล คอนโด Riverside',     'group',    '#8B5CF6', 'RS'),
  ('g6', NULL, 'OpenChat · ตัวแทนจำหน่าย',       'openchat', '#0EA5E9', 'ตจ')
ON CONFLICT (id) DO NOTHING;
