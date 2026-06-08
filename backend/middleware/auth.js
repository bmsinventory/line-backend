const { verify, parseCookies, COOKIE_NAME } = require('../lib/auth');

module.exports = function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const payload = verify(cookies[COOKIE_NAME]);
  if (!payload) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  req.admin = payload;
  next();
};
