const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const lineClient = require('../lib/line');

const STATUSES = {
  new:         'ใหม่',
  in_progress: 'กำลังแก้',
  waiting:     'รอข้อมูล',
  resolved:    'เสร็จแล้ว',
};

// =====================================================
// Config — ส่ง Supabase Anon key ให้ frontend (realtime)
// =====================================================
router.get('/config', (_req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// =====================================================
// GROUPS
// =====================================================
router.get('/groups', async (_req, res) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// เพิ่มกลุ่มใหม่ (หรืออัปเดต line_group_id ของกลุ่มที่มีอยู่)
router.patch('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { line_group_id, name, color, initials } = req.body;
  const patch = {};
  if (line_group_id !== undefined) patch.line_group_id = line_group_id;
  if (name)     patch.name     = name;
  if (color)    patch.color    = color;
  if (initials) patch.initials = initials;

  const { data, error } = await supabase
    .from('groups').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// =====================================================
// MEMBERS
// =====================================================
router.get('/members', async (_req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/members', async (req, res) => {
  const { id, name, role, color, initials } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const { data, error } = await supabase
    .from('members')
    .insert({ id, name, role, color: color || '#64748B', initials: initials || name.slice(0, 2) })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/members/:id', async (req, res) => {
  const { id } = req.params;
  const patch = {};
  ['name','role','color','initials'].forEach(k => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  const { data, error } = await supabase
    .from('members').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/members/:id', async (req, res) => {
  const { error } = await supabase.from('members').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// =====================================================
// ISSUES
// =====================================================

// GET /api/issues — ดึงทุก issue พร้อม messages
router.get('/issues', async (_req, res) => {
  const { data, error } = await supabase
    .from('issues')
    .select(`*, messages(*)`)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/issues — สร้าง issue ด้วยมือ (ไม่ผ่าน Line)
router.post('/issues', async (req, res) => {
  const { title, group_id, category, priority, reporter_name } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const { data, error } = await supabase
    .from('issues')
    .insert({
      title,
      group_id:          group_id || null,
      category:          category || 'howto',
      priority:          priority || 'normal',
      reporter_name:     reporter_name || 'แอดมิน',
      reporter_color:    '#06C755',
      reporter_initials: 'ME',
      status: 'new',
      unread: false,
    })
    .select(`*, messages(*)`)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/issues/:id — อัปเดตสถานะ / ผู้รับผิดชอบ / priority / category
router.patch('/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { status, assignee_id, priority, category, tags } = req.body;

  const patch = {};
  if (status      !== undefined) patch.status      = status;
  if (assignee_id !== undefined) patch.assignee_id = assignee_id;
  if (priority    !== undefined) patch.priority    = priority;
  if (category    !== undefined) patch.category    = category;
  if (tags        !== undefined) patch.tags        = tags;
  if (status === 'resolved')     patch.closed_at   = new Date().toISOString();

  const { data: issue, error } = await supabase
    .from('issues').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // เพิ่ม system message บันทึกการเปลี่ยนแปลง
  const systemMsgs = [];
  if (status !== undefined) {
    systemMsgs.push({
      issue_id: id,
      from_type: 'system',
      text: `เปลี่ยนสถานะเป็น "${STATUSES[status] || status}"`,
    });
  }
  if (assignee_id !== undefined) {
    let who = 'ไม่มีผู้รับผิดชอบ';
    if (assignee_id) {
      const { data: mem } = await supabase
        .from('members').select('name').eq('id', assignee_id).single();
      if (mem) who = mem.name;
    }
    systemMsgs.push({
      issue_id: id,
      from_type: 'system',
      text: `มอบหมายงานให้ ${who}`,
    });
  }
  if (systemMsgs.length) await supabase.from('messages').insert(systemMsgs);

  res.json(issue);
});

// POST /api/issues/:id/reply — ตอบกลับ (ส่งไป Line + บันทึก DB)
router.post('/issues/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { text, internal, agentName } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  // ดึง issue เพื่อหา line_group_id
  const { data: issue, error: fetchErr } = await supabase
    .from('issues').select('line_group_id').eq('id', id).single();
  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  // ส่งไป Line (ถ้าไม่ใช่ internal note และมี group ที่เชื่อมต่อ)
  if (!internal && issue.line_group_id) {
    try {
      await lineClient.pushMessage({
        to: issue.line_group_id,
        messages: [{ type: 'text', text }],
      });
    } catch (lineErr) {
      console.error('[API] Line push error:', lineErr.message);
      // ไม่ return error — บันทึก DB ต่อได้แม้ Line ล้มเหลว
    }
  }

  // บันทึก message ลง DB
  const msgText = internal ? `📝 โน้ตภายใน: ${text}` : text;
  const { error: insertErr } = await supabase.from('messages').insert({
    issue_id:  id,
    from_type: internal ? 'system' : 'agent',
    who:       internal ? null : (agentName || 'คุณ (แอดมิน)'),
    text:      msgText,
  });
  if (insertErr) return res.status(500).json({ error: insertErr.message });

  // อัปเดต unread = false (agent ดูแล้ว)
  await supabase.from('issues').update({ unread: false }).eq('id', id);

  res.json({ ok: true });
});

// DELETE /api/issues/:id
router.delete('/issues/:id', async (req, res) => {
  const { error } = await supabase.from('issues').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
