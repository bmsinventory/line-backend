const express = require('express');
const { validateSignature } = require('@line/bot-sdk');
const router = express.Router();
const supabase = require('../lib/supabase');
const lineClient = require('../lib/line');

// ฟังก์ชันสร้าง initials จากชื่อ
function makeInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2);
}

// สีสุ่มสำหรับผู้ใช้ใหม่
const COLORS = ['#3B82F6','#EF4444','#F59E0B','#10B981','#8B5CF6','#EC4899','#0EA5E9','#F97316'];
function pickColor(userId) {
  let hash = 0;
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

router.post('/line', async (req, res) => {
  // ตรวจสอบ signature ก่อนทำอะไรทั้งนั้น
  const sig = req.headers['x-line-signature'];
  const body = req.body; // Buffer (raw)

  if (!sig || !validateSignature(body, process.env.LINE_CHANNEL_SECRET, sig)) {
    return res.status(401).send('Invalid signature');
  }

  // ตอบ Line ทันที (ต้องตอบภายใน 1 วินาที)
  res.sendStatus(200);

  let events;
  try {
    events = JSON.parse(body.toString()).events;
  } catch {
    return;
  }

  for (const event of events) {
    // รองรับแค่ข้อความ text จากกลุ่ม
    if (event.type !== 'message') continue;
    if (event.source.type !== 'group') continue;

    const lineGroupId = event.source.groupId;
    const lineUserId  = event.source.userId;
    const timestamp   = new Date(event.timestamp).toISOString();
    const msgType     = event.message.type; // 'text' | 'image' | 'video' | ...

    const text       = msgType === 'text' ? event.message.text : `[${msgType}]`;
    const attachment = msgType === 'image' ? 'image' : msgType === 'video' ? 'video' : null;

    try {
      // 1. หา group จาก DB
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('line_group_id', lineGroupId)
        .maybeSingle();

      let groupId;
      if (!group) {
        // กลุ่มยังไม่มีในระบบ — ดึงชื่อจาก Line แล้วสร้างอัตโนมัติ
        let groupName = lineGroupId;
        try {
          const summary = await lineClient.getGroupSummary(lineGroupId);
          groupName = summary.groupName || groupName;
        } catch { /* ถ้าดึงไม่ได้ ใช้ groupId แทนชื่อ */ }

        const initials = groupName.slice(0, 2);
        const colors = ['#06C755','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#0EA5E9'];
        let h = 0;
        for (const c of lineGroupId) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
        const color = colors[Math.abs(h) % colors.length];

        const { data: newGroup, error: gErr } = await supabase
          .from('groups')
          .insert({ line_group_id: lineGroupId, name: groupName, color, initials })
          .select('id')
          .single();

        if (gErr) { console.error('[Webhook] insert group:', gErr); continue; }
        console.log(`[Webhook] Auto-created group: ${groupName} (${lineGroupId})`);
        groupId = newGroup.id;
      } else {
        groupId = group.id;
      }

      // 2. ดึงชื่อผู้ส่งจาก Line
      let reporterName = lineUserId;
      let reporterColor = pickColor(lineUserId);
      try {
        const profile = await lineClient.getGroupMemberProfile(lineGroupId, lineUserId);
        reporterName = profile.displayName;
      } catch { /* ถ้าดึงไม่ได้ ใช้ userId แทน */ }

      const reporterInitials = makeInitials(reporterName);

      // 3. ตรวจสอบว่ามี issue ที่ยังเปิดอยู่ของผู้ใช้คนนี้ในกลุ่มนี้ไหม
      const { data: existingIssue } = await supabase
        .from('issues')
        .select('id')
        .eq('group_id', groupId)
        .eq('line_user_id', lineUserId)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingIssue) {
        // เพิ่มข้อความในกระทู้เดิม
        await supabase.from('messages').insert({
          issue_id:   existingIssue.id,
          from_type:  'customer',
          who:        reporterName,
          text,
          attachment,
          line_message_id: event.message.id,
          created_at: timestamp,
        });
        await supabase.from('issues')
          .update({ unread: true })
          .eq('id', existingIssue.id);
      } else {
        // สร้าง issue ใหม่ (ใช้ข้อความแรกเป็น title)
        const title = text.length > 80 ? text.slice(0, 79) + '…' : text;

        const { data: newIssue, error } = await supabase
          .from('issues')
          .insert({
            group_id:          groupId,
            reporter_name:     reporterName,
            reporter_color:    reporterColor,
            reporter_initials: reporterInitials,
            line_user_id:      lineUserId,
            line_group_id:     lineGroupId,
            title,
            status:   'new',
            priority: 'normal',
            unread:   true,
            created_at: timestamp,
          })
          .select('id')
          .single();

        if (error) { console.error('[Webhook] insert issue:', error); continue; }

        await supabase.from('messages').insert({
          issue_id:   newIssue.id,
          from_type:  'customer',
          who:        reporterName,
          text,
          attachment,
          line_message_id: event.message.id,
          created_at: timestamp,
        });
      }
    } catch (err) {
      console.error('[Webhook] Error processing event:', err);
    }
  }
});

module.exports = router;
