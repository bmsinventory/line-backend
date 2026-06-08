const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const supabase = require('../lib/supabase');
const { sign, verify, parseCookies, COOKIE_NAME, COOKIE_MAXAGE, verifyPassword } = require('../lib/auth');

// LINE Login channel config
const LINE_CHANNEL_ID     = process.env.LINE_LOGIN_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
const LINE_REDIRECT_URI   = process.env.LINE_LOGIN_REDIRECT_URI;
// LINE user IDs เพิ่มเติม (env var) ที่ได้รับสิทธิ์แอดมิน (นอกเหนือจาก members table)
const EXTRA_ADMIN_IDS = (process.env.ADMIN_LINE_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

// super-admin fallback (env vars) สำหรับ bootstrap ระบบครั้งแรก
const SA_EMAIL    = (process.env.ADMIN_EMAIL    || 'admin@line-track.co.th').toLowerCase();
const SA_PASSWORD =  process.env.ADMIN_PASSWORD || 'admin1234';

const LINE_ERROR_MSGS = {
  line_not_configured: 'LINE Login ยังไม่ได้ตั้งค่า (ตรวจสอบ LINE_LOGIN_CHANNEL_ID)',
  unauthorized:        'LINE ID นี้ไม่มีสิทธิ์เข้าระบบ กรุณาให้แอดมินเพิ่มใน Members และผูก Line ID',
  invalid_state:       'เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่',
  token_failed:        'แลก token จาก LINE ไม่สำเร็จ',
  profile_failed:      'ดึงข้อมูล LINE profile ไม่สำเร็จ',
  server_error:        'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่',
  access_denied:       'ยกเลิกการเข้าสู่ระบบ',
};

function setCookieHeader(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   COOKIE_MAXAGE,
    path:     '/',
  });
}

function makeToken(memberId, name, role) {
  return sign({ memberId, name, role, exp: Date.now() + COOKIE_MAXAGE });
}

// =====================================================
// POST /api/auth/login — อีเมล / เบอร์โทร + รหัสผ่าน
// =====================================================
router.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body;
  const identifier = email.trim().toLowerCase();
  if (!identifier || !password)
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });

  // 1. ค้นหาใน members table (email หรือ phone ตรงกัน)
  try {
    const { data: members } = await supabase
      .from('members')
      .select('id, name, role, password_hash, email, phone');

    const member = (members || []).find(m =>
      (m.email && m.email.toLowerCase() === identifier) ||
      (m.phone && m.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
    );

    if (member && verifyPassword(password, member.password_hash)) {
      setCookieHeader(res, makeToken(member.id, member.name, member.role));
      return res.json({ ok: true, name: member.name, role: member.role });
    }
  } catch (err) {
    console.error('[Auth login] DB error:', err.message);
  }

  // 2. super-admin fallback (env vars) — สำหรับ bootstrap ครั้งแรก
  if (identifier === SA_EMAIL && password === SA_PASSWORD) {
    setCookieHeader(res, makeToken('__admin__', 'Super Admin', 'แอดมิน'));
    return res.json({ ok: true, name: 'Super Admin', role: 'แอดมิน' });
  }

  res.status(401).json({ error: 'อีเมล/เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง' });
});

// =====================================================
// LINE Login OAuth
// =====================================================

// GET /api/auth/line — redirect ไป LINE consent screen
router.get('/line', (req, res) => {
  if (!LINE_CHANNEL_ID || !LINE_REDIRECT_URI) {
    return res.redirect('/?auth_error=line_not_configured');
  }
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('lt_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, path: '/', sameSite: 'lax' });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     LINE_CHANNEL_ID,
    redirect_uri:  LINE_REDIRECT_URI,
    state,
    scope:         'profile openid',
  });
  res.redirect('https://access.line.me/oauth2/v2.1/authorize?' + params.toString());
});

// GET /api/auth/line/callback — LINE redirect กลับมาพร้อม code
router.get('/line/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect('/?auth_error=' + (error === 'access_denied' ? 'access_denied' : 'server_error'));
  if (!code) return res.redirect('/?auth_error=server_error');

  // ตรวจ CSRF state
  const cookies = parseCookies(req);
  if (!state || state !== cookies['lt_oauth_state']) {
    return res.redirect('/?auth_error=invalid_state');
  }
  res.clearCookie('lt_oauth_state', { path: '/' });

  try {
    // แลก code เป็น access_token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID, client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Auth LINE] token failed:', tokenData);
      return res.redirect('/?auth_error=token_failed');
    }

    // ดึง profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token },
    });
    const profile = await profileRes.json();
    if (!profile.userId) return res.redirect('/?auth_error=profile_failed');

    // ตรวจ members table ก่อน
    const { data: member } = await supabase
      .from('members')
      .select('id, name, role')
      .eq('line_user_id', profile.userId)
      .maybeSingle();

    let loginPayload;
    if (member) {
      // พบใน members table → login ตาม role นั้น
      loginPayload = { memberId: member.id, name: member.name, role: member.role };
    } else if (EXTRA_ADMIN_IDS.includes(profile.userId)) {
      // อยู่ใน env var whitelist → super-admin
      loginPayload = { memberId: 'line:' + profile.userId, name: profile.displayName, role: 'แอดมิน' };
    } else {
      console.warn('[Auth LINE] unauthorized userId:', profile.userId);
      return res.redirect('/?auth_error=unauthorized');
    }

    setCookieHeader(res, makeToken(loginPayload.memberId, loginPayload.name, loginPayload.role));
    console.log(`[Auth LINE] logged in: ${loginPayload.name} (${loginPayload.role})`);
    res.redirect('/');

  } catch (err) {
    console.error('[Auth LINE] callback error:', err);
    res.redirect('/?auth_error=server_error');
  }
});

// GET /api/auth/line/errors
router.get('/line/errors', (_req, res) => res.json(LINE_ERROR_MSGS));

// =====================================================
// POST /api/auth/logout
// =====================================================
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// =====================================================
// GET /api/auth/verify — ตรวจสอบ session และคืน role
// =====================================================
router.get('/verify', (req, res) => {
  const cookies = parseCookies(req);
  const payload = verify(cookies[COOKIE_NAME]);
  if (!payload) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  res.json({ ok: true, memberId: payload.memberId, name: payload.name, role: payload.role });
});

module.exports = router;
