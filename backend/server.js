require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Line webhook ต้องการ raw body สำหรับตรวจ HMAC signature
app.use('/webhook/line', express.raw({ type: '*/*' }));

app.use(express.json());
app.use(cors());

// Serve frontend (HTML + JSX files อยู่ใน ./public)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/webhook', require('./routes/webhook'));
app.use('/api', require('./routes/api'));

// Fallback: ส่ง index.html สำหรับทุก route ที่ไม่ใช่ /api หรือ /webhook
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ระบบติดตามปัญหาจาก Line.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[LINE Tracker] Server → http://localhost:${PORT}`);
  console.log(`[LINE Tracker] Webhook → http://localhost:${PORT}/webhook/line`);
});
