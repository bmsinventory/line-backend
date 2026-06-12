const supabase = require('./supabase');

const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// gemini-2.0-flash-lite: เร็ว, ฟรี, รองรับ Google AI Studio
// เปลี่ยนได้ผ่าน env GEMMA_MODEL เช่น gemini-2.0-flash, gemini-1.5-flash
const DEFAULT_MODEL = 'gemini-2.0-flash-lite';

/**
 * จัดหมวดหมู่ issue โดย Gemma ผ่าน Google AI Studio API
 * @param {{ title: string, thread?: Array }} param
 * @returns {Promise<string|null>} category id หรือ null ถ้าจัดไม่ได้
 */
async function classifyIssue({ title, thread = [] }) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMMA_MODEL || DEFAULT_MODEL;

  const { data: cats } = await supabase
    .from('categories').select('id, label').order('sort_order');
  if (!cats || cats.length === 0) return null;

  const catList = cats.map(c => `${c.id}: ${c.label}`).join('\n');
  const customerMsgs = (thread || [])
    .filter(m => m.from_type === 'customer')
    .slice(0, 4)
    .map(m => m.text)
    .filter(Boolean)
    .join('\n');

  const prompt =
    `คุณคือระบบจัดหมวดหมู่ปัญหาของลูกค้า จงแยกหมวดหมู่ปัญหาต่อไปนี้\n\n` +
    `หัวข้อ: ${title}` +
    (customerMsgs ? `\nข้อความลูกค้า:\n${customerMsgs}` : '') +
    `\n\nหมวดหมู่ที่มี:\n${catList}\n\n` +
    `ตอบเฉพาะ ID หมวดหมู่เท่านั้น (เช่น "bug" หรือ "repair") ไม่ต้องอธิบาย`;

  const res = await fetch(`${GOOGLE_AI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 30, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    console.error(`[Classify] Google AI error ${res.status} (model=${model}): ${errText.slice(0, 300)}`);
    throw new Error(`Google AI ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const suggested = raw.split(/[\s\n]/)[0].toLowerCase();
  const validIds = cats.map(c => c.id);
  return validIds.includes(suggested) ? suggested : null;
}

module.exports = { classifyIssue };
