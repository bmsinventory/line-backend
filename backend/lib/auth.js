const crypto = require('crypto');

const SECRET       = process.env.JWT_SECRET    || 'line-tracker-secret-change-in-env';
const COOKIE_NAME  = 'lt_sess';
const COOKIE_MAXAGE = 30 * 24 * 60 * 60 * 1000; // 30 วัน (ms)

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token) return null;
  const dot  = token.lastIndexOf('.');
  if (dot < 1) return null;
  const data = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > 0) cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  });
  return cookies;
}

module.exports = { sign, verify, parseCookies, COOKIE_NAME, COOKIE_MAXAGE };
