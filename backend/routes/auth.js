const express = require('express');
const router  = express.Router();
const { sign, verify, parseCookies, COOKIE_NAME, COOKIE_MAXAGE } = require('../lib/auth');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@line-track.co.th';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passOk  = password === ADMIN_PASSWORD;
  if (!emailOk || !passOk)
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  const token = sign({ email: ADMIN_EMAIL, exp: Date.now() + COOKIE_MAXAGE });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   COOKIE_MAXAGE,
    path:     '/',
  });
  res.json({ ok: true });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const cookies = parseCookies(req);
  const payload = verify(cookies[COOKIE_NAME]);
  if (!payload) return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  res.json({ ok: true, email: payload.email });
});

module.exports = router;
