const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { sign, verify, parseCookies, COOKIE_NAME, COOKIE_MAXAGE } = require('../lib/auth');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@line-track.co.th';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

// LINE Login channel config
const LINE_CHANNEL_ID     = process.env.LINE_LOGIN_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
const LINE_REDIRECT_URI   = process.env.LINE_LOGIN_REDIRECT_URI;
// LINE user IDs ที่อนุญาตให้ login (คั่นด้วย comma) — ว่างหมายถึงอนุญาตทุก LINE account
const ALLOWED_LINE_IDS = (process.env.ADMIN_LINE_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

// ข้อความ error ที่แสดงบนหน้า login
const LINE_ERROR_MSGS = {
  line_not_configured: 'LINE Login ยังไม่ได้ตั้งค่า (ตรวจสอบ LINE_LOGIN_CHANNEL_ID)',
  unauthorized:        'LINE ID นี้ไม่มีสิทธิ์เข้าระบบ กรุณาติดต่อผู้ดูแล',
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

// =====================================================
// Email / Password login
// =====================================================
router.post('/login', (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passOk  = password === ADMIN_PASSWORD;
  if (!emailOk || !passOk)
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  setCookieHeader(res, sign({ email: ADMIN_EMAIL, exp: Date.now() + COOKIE_MAXAGE }));
  res.json({ ok: true });
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

  if (error) return res.redirect('/?auth_error=' + encodeURIComponent(error === 'access_denied' ? 'access_denied' : 'server_error'));
  if (!code) return res.redirect('/?auth_error=server_error');

  // ตรวจ CSRF state
  const cookies = parseCookies(req);
  if (!state || state !== cookies['lt_oauth_state']) {
    return res.redirect('/?auth_error=invalid_state');
  }
  res.clearCookie('lt_oauth_state', { path: '/' });

  try {
    // 1. แลก code เป็น access_token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  LINE_REDIRECT_URI,
        client_id:     LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Auth LINE] token exchange failed:', tokenData);
      return res.redirect('/?auth_error=token_failed');
    }

    // 2. ดึง profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token },
    });
    const profile = await profileRes.json();
    if (!profile.userId) {
      console.error('[Auth LINE] profile failed:', profile);
      return res.redirect('/?auth_error=profile_failed');
    }

    // 3. ตรวจสิทธิ์ — ถ้าตั้ง ADMIN_LINE_USER_IDS ต้องอยู่ใน list
    if (ALLOWED_LINE_IDS.length > 0 && !ALLOWED_LINE_IDS.includes(profile.userId)) {
      console.warn('[Auth LINE] unauthorized userId:', profile.userId);
      return res.redirect('/?auth_error=unauthorized');
    }

    // 4. สร้าง session cookie → redirect กลับแอป
    setCookieHeader(res, sign({
      lineUserId:  profile.userId,
      displayName: profile.displayName,
      exp:         Date.now() + COOKIE_MAXAGE,
    }));
    console.log(`[Auth LINE] logged in: ${profile.displayName} (${profile.userId})`);
    res.redirect('/');

  } catch (err) {
    console.error('[Auth LINE] callback error:', err);
    res.redirect('/?auth_error=server_error');
  }
});

// GET /api/auth/line/errors — ส่ง error messages ให้ frontend ใช้
router.get('/line/errors', (_req, res) => res.json(LINE_ERROR_MSGS));

// =====================================================
// Logout
// =====================================================
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// =====================================================
// Verify session
// =====================================================
router.get('/verify', (req, res) => {
  const cookies = parseCookies(req);
  const payload = verify(cookies[COOKIE_NAME]);
  if (!payload) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  res.json({ ok: true, email: payload.email, displayName: payload.displayName });
});

module.exports = router;
