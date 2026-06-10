const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const supabase = require('../lib/supabase');
const lineClient = require('../lib/line');
const sse = require('../lib/sse');

const SETTINGS_PATH = path.join(__dirname, '..', 'app-settings.json');
const DEFAULT_SETTINGS = {
  autoReplyEnabled: true,
  autoReplyMode: 'flex',        // 'flex' | 'text'
  autoReplyTemplate: '✅ รับเรื่องแล้วครับ คุณ{{name}}\n📋 "{{title}}"\nทีมงานจะติดต่อกลับเร็ว ๆ นี้',
  autoReplyFlexJson: '',        // custom flex contents JSON (bubble/carousel)
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
// BOOTSTRAP — ดึง reference data ทั้งหมดในครั้งเดียว
// =====================================================
const _refCache = { data: null, at: 0 };
const REF_TTL = 60_000; // 60 วินาที
function invalidateRefCache() { _refCache.at = 0; }

router.get('/bootstrap', async (_req, res) => {
  const now = Date.now();
  if (_refCache.data && now - _refCache.at < REF_TTL) {
    return res.json(_refCache.data);
  }
  const [g, m, c, q, t] = await Promise.all([
    supabase.from('groups').select('*').order('name'),
    supabase.from('members').select('*, member_team_types(team_type_id)').order('name'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('quick_replies').select('*').order('sort_order'),
    supabase.from('team_types').select('*').order('team_name'),
  ]);
  const members = (m.data || []).map(({ member_team_types, ...mem }) => ({
    ...mem, team_type_ids: (member_team_types || []).map(x => x.team_type_id),
  }));
  _refCache.data = {
    groups:       g.data || [],
    members,
    categories:   c.data || [],
    quickReplies: q.data || [],
    teamTypes:    t.data || [],
  };
  _refCache.at = now;
  res.json(_refCache.data);
});

// =====================================================
// SSE — realtime event stream
// =====================================================
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write('event: connected\ndata: {}\n\n');
  sse.subscribe(res);

  // Heartbeat ทุก 25 วินาที เพื่อป้องกัน proxy timeout
  const heartbeat = setInterval(() => {
    try { res.write(':ping\n\n'); } catch { clearInterval(heartbeat); sse.unsubscribe(res); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.unsubscribe(res);
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
  invalidateRefCache();
  res.json(data);
});

// =====================================================
// MEMBERS
// =====================================================
router.get('/members', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*, member_team_types(team_type_id)')
      .order('name');
    if (error) return res.status(500).json({ error: error.message });
    const result = (data || []).map(({ member_team_types, ...m }) => ({
      ...m,
      team_type_ids: (member_team_types || []).map(t => t.team_type_id),
    }));
    res.json(result);
  } catch (err) {
    // fallback ถ้า member_team_types ยังไม่มี (ก่อนรัน migration)
    const { data, error } = await supabase.from('members').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map(m => ({ ...m, team_type_ids: [] })));
  }
});

router.post('/members', async (req, res) => {
  const { id, name, role, color, initials, email, phone, team_type_ids } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const row = { id, name, role, color: color || '#64748B', initials: initials || name.slice(0, 2) };
  if (email) row.email = email.trim().toLowerCase();
  if (phone) row.phone = phone.trim();
  const { data, error } = await supabase.from('members').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  const ids = Array.isArray(team_type_ids) ? team_type_ids : [];
  if (ids.length > 0) {
    await supabase.from('member_team_types').insert(ids.map(team_type_id => ({ member_id: id, team_type_id })));
  }
  invalidateRefCache();
  res.json({ ...data, team_type_ids: ids });
});

router.patch('/members/:id', async (req, res) => {
  const { id } = req.params;
  const patch = {};
  ['name','role','color','initials','line_user_id','email','phone'].forEach(k => {
    if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
  });
  if (patch.email) patch.email = patch.email.toLowerCase();
  const { data, error } = await supabase.from('members').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  // อัปเดต team_type_ids ถ้ามีการส่งมา
  if (req.body.team_type_ids !== undefined) {
    await supabase.from('member_team_types').delete().eq('member_id', id);
    const ids = Array.isArray(req.body.team_type_ids) ? req.body.team_type_ids : [];
    if (ids.length > 0) {
      await supabase.from('member_team_types').insert(ids.map(team_type_id => ({ member_id: id, team_type_id })));
    }
  }
  const { data: tt } = await supabase.from('member_team_types').select('team_type_id').eq('member_id', id);
  invalidateRefCache();
  res.json({ ...data, team_type_ids: (tt || []).map(t => t.team_type_id) });
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
  invalidateRefCache();
  res.json({ ok: true });
});

// =====================================================
// ME — current user profile
// =====================================================
router.get('/me', async (req, res) => {
  const { memberId } = req.admin;
  const [{ data, error }, { data: tt }] = await Promise.all([
    supabase.from('members').select('id,name,role,email,phone,color,initials,line_user_id').eq('id', memberId).single(),
    supabase.from('member_team_types').select('team_type_id').eq('member_id', memberId),
  ]);
  if (error) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
  res.json({ ...data, team_type_ids: (tt || []).map(t => t.team_type_id) });
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

// GET /api/issues — ดึง issues พร้อม messages (กรองตามทีมถ้าไม่ใช่ Admin)
router.get('/issues', async (req, res) => {
  const { role, memberId } = req.admin;
  let query = supabase
    .from('issues')
    .select(`*, messages(*)`)
    .order('created_at', { ascending: false });

  // Support role: กรองเฉพาะ issue ของทีม (เว้นแต่ show_all=true)
  if (role !== 'แอดมิน' && req.query.show_all !== 'true') {
    const { data: memberTeams } = await supabase
      .from('member_team_types').select('team_type_id').eq('member_id', memberId);
    if (memberTeams && memberTeams.length > 0) {
      // strict filter: เห็นเฉพาะ issue ที่ team_type_id ตรงกับทีมของตัวเอง
      const orFilter = memberTeams.map(t => `team_type_id.eq.${t.team_type_id}`).join(',');
      query = query.or(orFilter);
    }
    // ถ้าสมาชิกไม่มีทีม → ดูได้ทั้งหมด (fallback)
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/issues — สร้าง issue ด้วยมือ (ไม่ผ่าน Line)
router.post('/issues', async (req, res) => {
  const { title, group_id, category, priority, reporter_name, team_type_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const { data, error } = await supabase
    .from('issues')
    .insert({
      title,
      group_id:          group_id || null,
      category:          category || 'howto',
      priority:          priority || 'normal',
      team_type_id:      team_type_id || null,
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

// PATCH /api/issues/:id — อัปเดตสถานะ / ผู้รับผิดชอบ / priority / category / team_type
router.patch('/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { status, assignee_id, priority, category, tags, team_type_id } = req.body;

  const patch = {};
  if (status        !== undefined) patch.status        = status;
  if (assignee_id   !== undefined) patch.assignee_id   = assignee_id;
  if (priority      !== undefined) patch.priority      = priority;
  if (category      !== undefined) patch.category      = category;
  if (tags          !== undefined) patch.tags          = tags;
  if (team_type_id  !== undefined) patch.team_type_id  = team_type_id;
  if (status === 'resolved')       patch.closed_at     = new Date().toISOString();

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

  sse.broadcast();
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

  sse.broadcast();
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
  invalidateRefCache();
  res.json(data);
});

router.patch('/categories/:id', async (req, res) => {
  const patch = {};
  ['label', 'color'].forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  const { data, error } = await supabase.from('categories').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
  res.json(data);
});

router.delete('/categories/:id', async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
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
  invalidateRefCache();
  res.status(201).json(data);
});

router.patch('/quick-replies/:id', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const { data, error } = await supabase.from('quick_replies').update({ text }).eq('id', parseInt(req.params.id)).select().single();
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
  res.json(data);
});

router.delete('/quick-replies/:id', async (req, res) => {
  const { error } = await supabase.from('quick_replies').delete().eq('id', parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
  res.json({ ok: true });
});

// =====================================================
// TEAM TYPES
// =====================================================
router.get('/team-types', async (_req, res) => {
  const { data, error } = await supabase.from('team_types').select('*').order('team_name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.post('/team-types', async (req, res) => {
  const { team_name, description, color } = req.body;
  if (!team_name?.trim()) return res.status(400).json({ error: 'team_name required' });
  const { data, error } = await supabase.from('team_types').insert({
    team_name: team_name.trim(),
    description: description?.trim() || null,
    color: color || '#64748B',
    is_active: true,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
  res.status(201).json(data);
});

router.patch('/team-types/:id', async (req, res) => {
  const patch = {};
  if (req.body.team_name   !== undefined) patch.team_name   = req.body.team_name;
  if (req.body.description !== undefined) patch.description = req.body.description;
  if (req.body.color       !== undefined) patch.color       = req.body.color;
  if (req.body.is_active   !== undefined) patch.is_active   = req.body.is_active;
  patch.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('team_types').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
  res.json(data);
});

router.delete('/team-types/:id', async (req, res) => {
  const { id } = req.params;
  const [{ data: usedByIssues }, { data: usedByMembers }] = await Promise.all([
    supabase.from('issues').select('id').eq('team_type_id', id).limit(1),
    supabase.from('member_team_types').select('member_id').eq('team_type_id', id).limit(1),
  ]);
  if ((usedByIssues?.length > 0) || (usedByMembers?.length > 0)) {
    // มีการใช้งานอยู่ → deactivate แทนการลบ
    const { data, error } = await supabase.from('team_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ...data, deactivated: true });
  }
  const { error } = await supabase.from('team_types').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  invalidateRefCache();
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
