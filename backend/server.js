require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const requireAuth = require('./middleware/auth');

const app = express();

// Line webhook ต้องการ raw body สำหรับตรวจ HMAC signature
app.use('/webhook/line', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Serve frontend (HTML + JSX files อยู่ใน ./public)
app.use(express.static(path.join(__dirname, 'public')));

// Webhook (ไม่ต้อง auth — LINE ส่งมา)
app.use('/webhook', require('./routes/webhook'));

// Auth routes (public — login, logout, verify)
app.use('/api/auth', require('./routes/auth'));

// Protected API — ยกเว้น /api/config (ต้องดึงก่อน login เพื่อ init Supabase)
app.use('/api', (req, res, next) => {
  if (req.path === '/config') return next();
  requireAuth(req, res, next);
}, require('./routes/api'));

// Fallback: ส่ง HTML สำหรับทุก route อื่น
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ระบบติดตามปัญหาจาก Line.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[LINE Tracker] Server → http://localhost:${PORT}`);
  console.log(`[LINE Tracker] Webhook → http://localhost:${PORT}/webhook/line`);
});
