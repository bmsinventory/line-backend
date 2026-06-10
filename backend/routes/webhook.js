const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { validateSignature } = require('@line/bot-sdk');
const { randomUUID } = require('crypto');
const router = express.Router();
const supabase = require('../lib/supabase');
const lineClient = require('../lib/line');
const sse = require('../lib/sse');

// INSERT โดยตรงผ่าน https.request() เพื่อหลีกเลี่ยงปัญหา fetch/Content-Length
function dbInsert(table, data) {
  const jsonStr = JSON.stringify(data);
  const bodyBuf = Buffer.from(jsonStr, 'utf8');
  const urlBase = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const urlObj = new URL(`${urlBase}/rest/v1/${table}`);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      port:     443,
      path:     urlObj.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': bodyBuf.length,
        'apikey':         process.env.SUPABASE_SERVICE_KEY,
        'Authorization':  `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer':         'return=minimal',
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ error: null });
        } else {
          let err;
          try { err = JSON.parse(text); } catch { err = { message: text, status: res.statusCode }; }
          resolve({ error: err });
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

const SETTINGS_PATH = path.join(__dirname, '..', 'app-settings.json');

// แทนที่ {{name}} / {{title}} ใน Flex JSON tree แบบ recursive (ปลอดภัยกับ special chars)
function replaceFlex(node, name, title) {
  if (typeof node === 'string') return node.replace(/\{\{name\}\}/g, name).replace(/\{\{title\}\}/g, title);
  if (Array.isArray(node)) return node.map(n => replaceFlex(n, name, title));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = replaceFlex(v, name, title);
    return out;
  }
  return node;
}

function getAutoReply(name, title) {
  let s = {};
  try { s = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { /* use defaults */ }
  if (s.autoReplyEnabled === false) return null;

  const displayTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;

  // โหมด text
  if (s.autoReplyMode === 'text') {
    const tmpl = (s.autoReplyTemplate || '✅ รับเรื่องแล้วครับ คุณ{{name}}\n📋 "{{title}}"\nทีมงานจะติดต่อกลับเร็ว ๆ นี้')
      .replace(/\{\{name\}\}/g, name).replace(/\{\{title\}\}/g, displayTitle);
    return { type: 'text', text: tmpl };
  }

  // โหมด flex + custom JSON
  if (s.autoReplyFlexJson && s.autoReplyFlexJson.trim()) {
    try {
      const parsed = JSON.parse(s.autoReplyFlexJson);
      return { type: 'flex', altText: `✅ รับเรื่องแล้วครับ คุณ${name}`, contents: replaceFlex(parsed, name, displayTitle) };
    } catch { /* ถ้า JSON เสีย ใช้ default */ }
  }

  // โหมด flex + default template
  return {
    type: 'flex',
    altText: `✅ รับเรื่องแล้วครับ คุณ${name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '✅  รับเรื่องแล้วครับ', color: '#ffffff', size: 'md', weight: 'bold', align: 'center' },
        ],
        backgroundColor: '#06C755',
        paddingAll: '18px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '18px',
        contents: [
          {
            type: 'box', layout: 'horizontal', alignItems: 'center',
            contents: [
              { type: 'text', text: '👤 ผู้แจ้ง', size: 'sm', color: '#888888', flex: 3 },
              { type: 'text', text: name, size: 'sm', color: '#111111', weight: 'bold', flex: 7, wrap: true },
            ],
          },
          { type: 'separator' },
          {
            type: 'box', layout: 'horizontal', alignItems: 'flex-start',
            contents: [
              { type: 'text', text: '📋 ปัญหา', size: 'sm', color: '#888888', flex: 3 },
              { type: 'text', text: displayTitle, size: 'sm', color: '#111111', flex: 7, wrap: true },
            ],
          },
          { type: 'separator' },
          {
            type: 'box', layout: 'horizontal', alignItems: 'center',
            contents: [
              { type: 'text', text: '🔵 สถานะ', size: 'sm', color: '#888888', flex: 3 },
              { type: 'text', text: 'รอดำเนินการ', size: 'sm', color: '#3B82F6', weight: 'bold', flex: 7 },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          { type: 'text', text: 'ทีมงานจะติดต่อกลับเร็ว ๆ นี้', size: 'xs', color: '#aaaaaa', align: 'center' },
        ],
      },
      styles: { footer: { separator: true } },
    },
  };
}  // end getAutoReply

// ตัด @mention ออกจากข้อความโดยใช้ตำแหน่ง index+length จาก LINE API
// ครอบคลุมชื่อที่มีเว้นวรรค เช่น @Thiraphong Chekwong (length=21 ไม่ใช่แค่ @Thiraphong)
function stripMentions(rawText, mentionees) {
  if (!mentionees || mentionees.length === 0) {
    return rawText.replace(/@\S+/g, '').replace(/\s+/g, ' ').trim();
  }
  const chars = Array.from(rawText); // ใช้ Array.from เพื่อ handle Unicode/emoji
  const sorted = [...mentionees].sort((a, b) => b.index - a.index); // ลบจากท้ายก่อนเพื่อรักษา index
  for (const m of sorted) {
    chars.splice(m.index, m.length);
  }
  return chars.join('').replace(/\s+/g, ' ').trim();
}

// ฟังก์ชันสร้าง initials จากชื่อ
// ใช้ Array.from() เพื่อ iterate Unicode code points (ป้องกัน emoji surrogate pair)
function makeInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    const c1 = Array.from(words[0])[0] || '';
    const c2 = Array.from(words[1])[0] || '';
    return (c1 + c2).toUpperCase();
  }
  return Array.from(name).slice(0, 2).join('');
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
    console.error('[Webhook] Invalid signature — ตรวจสอบ LINE_CHANNEL_SECRET');
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

  console.log(`[Webhook] รับ ${events.length} event(s)`);

  for (const event of events) {
    // ---- JOIN: bot ถูกเชิญเข้ากลุ่ม → สร้าง group อัตโนมัติ ----
    if (event.type === 'join' && event.source.type === 'group') {
      const lineGroupId = event.source.groupId;
      try {
        const { data: existingGroup } = await supabase
          .from('groups').select('id').eq('line_group_id', lineGroupId).maybeSingle();

        if (!existingGroup) {
          let groupName = lineGroupId;
          try {
            const summary = await lineClient.getGroupSummary(lineGroupId);
            groupName = summary.groupName || groupName;
          } catch { /* ใช้ groupId แทน */ }

          const initials = Array.from(groupName).slice(0, 2).join('');
          const colors = ['#06C755','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#0EA5E9'];
          let h = 0;
          for (const c of lineGroupId) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
          const color = colors[Math.abs(h) % colors.length];

          const { error: gErr } = await supabase.from('groups').insert({
            id: randomUUID(), line_group_id: lineGroupId, name: groupName, color, initials,
          });

          if (!gErr) {
            console.log(`[Webhook] Bot joined → auto-created group: ${groupName} (${lineGroupId})`);
            sse.broadcast();
            try {
              await lineClient.pushMessage({
                to: lineGroupId,
                messages: [{ type: 'text', text: `👋 สวัสดีครับ! บอทพร้อมรับแจ้งปัญหาแล้ว\n\n📌 วิธีแจ้งปัญหา:\nพิมพ์ INV ตามด้วยปัญหาของคุณ\nตัวอย่าง: INV อินเตอร์เน็ตไม่เชื่อมต่อ` }],
              });
            } catch { /* ignore */ }
          } else {
            console.error('[Webhook] insert group on join:', gErr);
          }
        } else {
          console.log(`[Webhook] Bot joined group ที่มีอยู่แล้ว: ${lineGroupId}`);
        }
      } catch (err) {
        console.error('[Webhook] Error handling join event:', err);
      }
      continue;
    }

    // รองรับแค่ข้อความ text จากกลุ่ม
    if (event.type !== 'message') { console.log(`[Webhook] ข้าม event type: ${event.type}`); continue; }
    if (event.source.type !== 'group') { console.log(`[Webhook] ข้าม source type: ${event.source.type}`); continue; }

    const lineGroupId = event.source.groupId;
    const lineUserId  = event.source.userId;
    const timestamp   = new Date(event.timestamp).toISOString();
    const msgType     = event.message.type; // 'text' | 'image' | 'video' | ...

    const rawText   = msgType === 'text' ? event.message.text : '';
    const mentionees = event.message?.mention?.mentionees || [];
    // strip mentions จาก rawText ก่อนเพื่อให้ตำแหน่ง index ถูกต้อง
    const cleanText = rawText ? stripMentions(rawText, mentionees) : '';
    const text      = cleanText || `[${msgType}]`;
    const attachment = msgType === 'image' ? 'image' : msgType === 'video' ? 'video' : null;

    // โหมด 2: คีย์เวิร์ด INV ตามด้วยปัญหา (ใช้ได้ทุกกลุ่ม ทุกโหมด)
    const TRIGGERS = ['inv', 'แจ้งปัญหา'];
    const triggerMatch = TRIGGERS.find((t) => rawText.toLowerCase().startsWith(t.toLowerCase()));

    console.log(`[Webhook] ข้อความจาก group=${lineGroupId} user=${lineUserId}`);

    // คำสั่งพิเศษ: myid → บอท reply Line User ID ให้ผู้ส่ง
    if (rawText.trim().toLowerCase() === 'myid') {
      try {
        await lineClient.pushMessage({
          to: lineGroupId,
          messages: [{ type: 'text', text: `🆔 Line User ID ของคุณ:\n${lineUserId}\n\n(แจ้ง admin เพื่อลงทะเบียนเป็นทีมงาน)` }],
        });
      } catch { /* ignore */ }
      continue;
    }

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
          .insert({ id: randomUUID(), line_group_id: lineGroupId, name: groupName, color, initials })
          .select('id')
          .single();

        if (gErr) { console.error('[Webhook] insert group:', gErr); continue; }
        console.log(`[Webhook] Auto-created group: ${groupName} (${lineGroupId})`);
        groupId = newGroup.id;
      } else {
        groupId = group.id;
      }

      // 2. ตรวจสอบว่าผู้ส่งเป็นทีมงานไหม
      const { data: memberMatch } = await supabase
        .from('members')
        .select('id, name, color, initials')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      // ถ้าเป็นทีมงาน → บันทึกเป็น agent message ใน issue ล่าสุดของกลุ่ม แล้วข้ามไป
      if (memberMatch) {
        const { data: latestIssue } = await supabase
          .from('issues')
          .select('id')
          .eq('group_id', groupId)
          .neq('status', 'resolved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestIssue) {
          await supabase.from('messages').insert({
            issue_id:   latestIssue.id,
            from_type:  'agent',
            who:        memberMatch.name,
            text,
            attachment,
            line_message_id: event.message.id,
            created_at: timestamp,
          });
          sse.broadcast();
          console.log(`[Webhook] ทีมงาน ${memberMatch.name} ตอบใน issue ${latestIssue.id}`);
        }
        continue;
      }

      // 3. ดึงชื่อผู้ส่งจาก Line (ลูกค้า)
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
        // มี issue เปิดอยู่ → เพิ่มข้อความเข้า thread เดิมเสมอ (ไม่ต้องใช้ keyword)
        await supabase.from('messages').insert({
          issue_id:   existingIssue.id,
          from_type:  'customer',
          who:        reporterName,
          text,
          attachment,
          line_message_id: event.message.id,
          quote_token:     event.message.quoteToken || null,
          created_at: timestamp,
        });
        await supabase.from('issues')
          .update({ unread: true })
          .eq('id', existingIssue.id);
        sse.broadcast();
        console.log(`[Webhook] เพิ่มข้อความใน issue ${existingIssue.id}`);

      } else {
        // ไม่มี issue เปิด — สร้าง issue เฉพาะเมื่อ:
        //   1. @mention ทีมงาน (LINE mention API)
        //   2. ข้อความขึ้นต้นด้วย INV หรือ แจ้งปัญหา
        // ตรวจว่ามีการ @mention ทีมงานใน LINE (event.message.mention.mentionees)
        const mentionedUserIds = (event.message.mention?.mentionees || [])
          .filter(m => m.type === 'user' && m.userId)
          .map(m => m.userId);

        let hasMemberMention = false;
        if (mentionedUserIds.length > 0) {
          const { data: mentionedMembers } = await supabase
            .from('members')
            .select('id')
            .in('line_user_id', mentionedUserIds);
          hasMemberMention = (mentionedMembers || []).length > 0;
        }

        const shouldCreate = hasMemberMention || !!triggerMatch;
        if (!shouldCreate) {
          console.log(`[Webhook] ข้อความทั่วไป ละเว้น — ต้อง @mention ทีมงาน หรือขึ้นต้นด้วย INV/แจ้งปัญหา`);
        } else {
        // สร้าง issue ใหม่
        // ใช้ cleanText (mentions ถูก strip แล้ว) เป็นฐาน — ไม่ต้องเรียก stripMentions อีกรอบ
        // เพราะ mentionees.index ชี้ไปที่ rawText ต้นฉบับ การเอาไปใช้กับ substring ทำให้ offset ผิด
        let title;
        if (triggerMatch) {
          // โหมด 2: trigger (inv/แจ้งปัญหา) อยู่ต้น rawText
          // ตรวจว่า cleanText ยังขึ้นต้นด้วย trigger หรือไม่
          // (อาจไม่ขึ้นต้น ถ้า mention อยู่ก่อน trigger เช่น "@mention inv ทดสอบ")
          if (cleanText.toLowerCase().startsWith(triggerMatch.toLowerCase())) {
            const titleRaw = cleanText.slice(triggerMatch.length).replace(/^[:\s]+/, '').trim();
            title = (titleRaw || cleanText).slice(0, 80);
          } else {
            title = cleanText.slice(0, 80);
          }
        } else {
          // โหมด 1: @mention trigger — ใช้ cleanText ทั้งหมดเป็น title
          title = cleanText.slice(0, 80);
        }

        const newIssueId = randomUUID();
        const issueData = {
          id:                newIssueId,
          group_id:          groupId,
          reporter_name:     reporterName,
          reporter_color:    reporterColor,
          reporter_initials: reporterInitials,
          line_user_id:      lineUserId,
          line_group_id:     lineGroupId,
          title,
          category:          'howto',
          status:            'new',
          priority:          'normal',
          unread:            true,
          created_at:        timestamp,
        };
        const { error: issueErr } = await dbInsert('issues', issueData);
        if (issueErr) { console.error('[Webhook] insert issue failed:', JSON.stringify(issueErr)); continue; }

        await supabase.from('messages').insert({
          issue_id:        newIssueId,
          from_type:       'customer',
          who:             reporterName,
          text,
          attachment,
          line_message_id: event.message.id,
          quote_token:     event.message.quoteToken || null,
          created_at:      timestamp,
        });
        sse.broadcast();
        console.log(`[Webhook] สร้าง issue ใหม่: ${title}`);

        // แจ้งยืนยันกลับในกลุ่ม (Flex หรือ text ตาม settings)
        try {
          const autoReply = getAutoReply(reporterName, title);
          if (autoReply) {
            await lineClient.pushMessage({ to: lineGroupId, messages: [autoReply] });
          }
        } catch { /* ถ้าส่งไม่ได้ ไม่ต้อง block */ }
        } // end if shouldCreate
      } // end else (no existing issue)
    } catch (err) {
      console.error('[Webhook] Error processing event:', err);
    }
  }
});

module.exports = router;
