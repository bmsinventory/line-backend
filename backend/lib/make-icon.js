// Generate PNG icons on-the-fly using only Node.js built-ins (no extra deps)
// Produces a dark-green rounded-square icon with LINE green circle + white chat bubble
const zlib = require('zlib');

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length, 0);
  const crcVal = Buffer.allocUnsafe(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, d])), 0);
  return Buffer.concat([len, t, d, crcVal]);
}

function makeIconPng(size) {
  // Colors
  const BG  = [11, 61, 46];    // #0B3D2E
  const CIR = [6, 199, 85];    // #06C755
  const WHT = [255, 255, 255];

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize, 0);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      // Normalised coords -1..1
      const nx = (x + 0.5) / size * 2 - 1;
      const ny = (y + 0.5) / size * 2 - 1;
      const r2 = nx * nx + ny * ny;

      // Rounded-square background: use smooth corner mask
      const ax = Math.abs(nx), ay = Math.abs(ny);
      const corner = Math.max(0, ax - 0.72) ** 2 + Math.max(0, ay - 0.72) ** 2;
      const inRoundedSquare = corner < 0.09 ** 2 + (ax <= 0.72 || ay <= 0.72 ? 1 : 0);

      // Green circle (radius ~0.6)
      const inCircle = r2 <= 0.6 * 0.6;

      // Simple chat-bubble white shape inside circle
      // bubble: upper half oval
      const bx = nx * 1.5, by = ny * 1.5 + 0.15;
      const inBubble = bx * bx + by * by <= 0.75 && ny < 0.35;
      // small tail
      const inTail = nx > 0.18 && nx < 0.45 && ny > 0.22 && ny < 0.50;

      let rgb;
      if (!inRoundedSquare && (ax > 0.72 || ay > 0.72)) {
        // Outside rounded corners → transparent-ish (use BG colour)
        rgb = BG;
      } else if (inCircle && (inBubble || inTail)) {
        rgb = WHT;
      } else if (inCircle) {
        rgb = CIR;
      } else {
        rgb = BG;
      }

      const off = y * rowSize + 1 + x * 3;
      raw[off] = rgb[0]; raw[off + 1] = rgb[1]; raw[off + 2] = rgb[2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Pre-build & cache both sizes at module load time
const icon192 = makeIconPng(192);
const icon512 = makeIconPng(512);

module.exports = { icon192, icon512 };
