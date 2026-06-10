/* ===== ระบบติดตามปัญหาจาก Line — Static config (ไม่มี mock data) ===== */
(function () {
  const CATEGORIES = {
    bug:       { label: 'บั๊กระบบ',         color: '#EF4444' },
    repair:    { label: 'แจ้งซ่อม',         color: '#F59E0B' },
    billing:   { label: 'การเงิน/บิล',      color: '#8B5CF6' },
    howto:     { label: 'สอบถามการใช้งาน',  color: '#0EA5E9' },
    complaint: { label: 'ร้องเรียนบริการ',  color: '#EC4899' },
    feature:   { label: 'ขอฟีเจอร์',        color: '#10B981' },
  };

  const STATUSES = {
    new:         { label: 'ใหม่',       color: '#3B82F6', dot: '#3B82F6' },
    in_progress: { label: 'กำลังแก้',   color: '#F59E0B', dot: '#F59E0B' },
    waiting:     { label: 'รอข้อมูล',   color: '#8B5CF6', dot: '#8B5CF6' },
    resolved:    { label: 'เสร็จแล้ว',  color: '#16A34A', dot: '#16A34A' },
  };

  const PRIORITIES = {
    urgent: { label: 'ด่วนมาก', color: '#DC2626', rank: 3 },
    high:   { label: 'ด่วน',    color: '#F59E0B', rank: 2 },
    normal: { label: 'ปกติ',    color: '#64748B', rank: 1 },
    low:    { label: 'ต่ำ',     color: '#94A3B8', rank: 0 },
  };

  // GROUPS, MEMBERS และ TEAM_TYPES จะถูกโหลดจาก API ตอน boot ใน app.jsx
  window.LINE_DATA = {
    CATEGORIES,
    STATUSES,
    PRIORITIES,
    GROUPS:      [], // โหลดจาก /api/groups
    MEMBERS:     [], // โหลดจาก /api/members
    TEAM_TYPES:  [], // โหลดจาก /api/team-types
    QUICK_REPLIES: [],
  };
})();
