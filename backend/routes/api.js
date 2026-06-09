const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const supabase = require('../lib/supabase');
const lineClient = require('../lib/line');

const SETTINGS_PATH = path.join(__dirname, '..', 'app-settings.json');
const DEFAULT_SETTINGS = {
  autoReplyEnabled: true,
  autoReplyTemplate: '✅ รับเรื่องแล้วครับ คุณ{{name}}\n📋 "{{title}}"\nทีมงานจะติดต่อกลับเร็ว ๆ นี้',
};
function loadAppSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}

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
  const { id, name, role, color, initials, email, phone } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const row = { id, name, role, color: color || '#64748B', initials: initials || name.slice(0, 2) };
  if (email) row.email = email.trim().toLowerCase();
  if (phone) row.phone = phone.trim();
  const { data, error } = await supabase.from('members').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/members/:id', async (req, res) => {
  const { id } = req.params;
  const patch = {};
  ['name','role','color','initials','line_user_id','email','phone'].forEach(k => {
    if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
  });
  // normalize email lowercase
  if (patch.email) patch.email = patch.email.toLowerCase();
  const { data, error } = await supabase
    .from('members').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/members/:id/password — ตั้ง/เปลี่ยนรหัสผ่านสมาชิก
router.post('/members/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  const { hashPassword } = require('../lib/auth');
  const password_hash = hashPassword(password);
  const { error } = await supabase.from('members').update({ password_hash }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.delete('/members/:id', async (req, res) => {
  const { error } = await supabase.from('members').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// =====================================================
// ME — current user profile
// =====================================================
router.get('/me', async (req, res) => {
  const { memberId } = req.admin;
  const { data, error } = await supabase
    .from('members').select('id,name,role,email,phone,color,initials,line_user_id').eq('id', memberId).single();
  if (error) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
  res.json(data);
});

router.patch('/me', async (req, res) => {
  const { memberId } = req.admin;
  const patch = {};
  ['name', 'email', 'phone'].forEach(k => {
    if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
  });
  if (patch.name) patch.initials = patch.name.slice(0, 2);
  if (patch.email) patch.email = patch.email.toLowerCase();
  const { data, error } = await supabase
    .from('members').update(patch).eq('id', memberId).select('id,name,role,email,phone').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/me/password', async (req, res) => {
  const { memberId } = req.admin;
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  const { hashPassword } = require('../lib/auth');
  const { error } = await supabase.from('members').update({ password_hash: hashPassword(password) }).eq('id', memberId);
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

// POST /api/issues/:id/classify — ให้ AI แนะนำหมวดหมู่ (ไม่เขียน DB — frontend apply ผ่าน PATCH)
router.post('/issues/:id/classify', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY ไม่ได้ตั้งค่า — เพิ่มในไฟล์ .env' });

  const { id } = req.params;
  const [{ data: issue, error: issueErr }, { data: cats }] = await Promise.all([
    supabase.from('issues').select('title, messages(from_type, text)').eq('id', id).single(),
    supabase.from('categories').select('id, label').order('sort_order'),
  ]);
  if (issueErr || !issue) return res.status(404).json({ error: 'ไม่พบเรื่อง' });

  const catList = (cats || []).map((c) => `${c.id}: ${c.label}`).join('\n');
  const customerMsgs = (issue.messages || [])
    .filter((m) => m.from_type === 'customer')
    .slice(0, 4)
    .map((m) => m.text)
    .filter(Boolean)
    .join('\n');

  const prompt = `คุณคือระบบจัดหมวดหมู่ปัญหาของลูกค้า จงแยกหมวดหมู่ปัญหาต่อไปนี้

หัวข้อ: ${issue.title}${customerMsgs ? `\nข้อความลูกค้า:\n${customerMsgs}` : ''}

หมวดหมู่ที่มี:
${catList}

ตอบเฉพาะ ID หมวดหมู่เท่านั้น (เช่น "bug" หรือ "repair") ไม่ต้องอธิบาย`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!aiRes.ok) {
      const errData = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'AI error: ' + (errData.error?.message || aiRes.statusText) });
    }
    const aiData = await aiRes.json();
    const suggested = aiData.content?.[0]?.text?.trim().split(/\s/)[0].toLowerCase();
    const validIds = (cats || []).map((c) => c.id);
    const category = validIds.includes(suggested) ? suggested : validIds[0] || 'howto';
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    // ดึง quote_token ของข้อความลูกค้าล่าสุด เพื่อ reply แบบอ้างอิง
    const { data: lastCustomerMsg } = await supabase
      .from('messages')
      .select('quote_token')
      .eq('issue_id', id)
      .eq('from_type', 'customer')
      .not('quote_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lineMsg = { type: 'text', text };
    if (lastCustomerMsg?.quote_token) lineMsg.quoteToken = lastCustomerMsg.quote_token;

    try {
      await lineClient.pushMessage({
        to: issue.line_group_id,
        messages: [lineMsg],
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

// =====================================================
// CATEGORIES
// =====================================================
router.get('/categories', async (_req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/categories', async (req, res) => {
  const { id, label, color } = req.body;
  if (!id || !label) return res.status(400).json({ error: 'id and label required' });
  const { data: maxRow } = await supabase.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const sort_order = (maxRow?.sort_order || 0) + 1;
  const { data, error } = await supabase.from('categories').insert({ id, label, color: color || '#64748B', sort_order }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/categories/:id', async (req, res) => {
  const patch = {};
  ['label', 'color'].forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  const { data, error } = await supabase.from('categories').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/categories/:id', async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// =====================================================
// QUICK REPLIES
// =====================================================
router.get('/quick-replies', async (_req, res) => {
  const { data, error } = await supabase.from('quick_replies').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/quick-replies', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const { data: maxRow } = await supabase.from('quick_replies').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const sort_order = (maxRow?.sort_order || 0) + 1;
  const { data, error } = await supabase.from('quick_replies').insert({ text, sort_order }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/quick-replies/:id', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const { data, error } = await supabase.from('quick_replies').update({ text }).eq('id', parseInt(req.params.id)).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/quick-replies/:id', async (req, res) => {
  const { error } = await supabase.from('quick_replies').delete().eq('id', parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// =====================================================
// APP SETTINGS (SLA, notifications)
// =====================================================
router.get('/settings', async (_req, res) => {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) return res.status(500).json({ error: error.message });
  const obj = {};
  (data || []).forEach(row => { obj[row.key] = row.value; });
  res.json(obj);
});

router.put('/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  const { data, error } = await supabase.from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// =====================================================
// APP SETTINGS (file-based: backend/app-settings.json)
// =====================================================
router.get('/app-settings', (req, res) => res.json(loadAppSettings()));

router.patch('/app-settings', (req, res) => {
  const updated = { ...loadAppSettings(), ...req.body };
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
