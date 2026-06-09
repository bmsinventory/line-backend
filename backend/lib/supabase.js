const { createClient } = require('@supabase/supabase-js');
// node-fetch v2: ใช้แทน native fetch ของ Node.js 18 ที่คำนวณ Content-Length
// เป็น character count แทน byte count ทำให้ Thai text ใน JSON body truncate → PGRST102
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, // service role key — ใช้เฉพาะ backend
  { global: { fetch } },
);

module.exports = supabase;
