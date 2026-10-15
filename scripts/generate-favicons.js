/**
 * Builds favicon.ico, apple-touch-icon.png, and header-size spiral derivatives
 * from the high-res brand master (client/public/alignos-spiral.png).
 * Outputs are committed; rerun only when the master changes.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'client', 'public');
const MASTER = path.join(PUBLIC, 'alignos-spiral.png');
const BRAND_DIR = path.join(PUBLIC, 'brand');

const ICO_SIZES = [16, 32, 48];
const HEADER_SIZES = [72, 108];
const APPLE_SIZE = 180;
// iOS renders transparent touch icons on black; use the light theme background (--cl-bg, $warm-100).
const APPLE_BG = '#f8f6f3';

const squarePng = (size) =>
  sharp(MASTER)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

// ICO container with PNG-encoded entries (supported by all current browsers).
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  await fs.mkdir(BRAND_DIR, { recursive: true });

  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, data: await squarePng(size) });
  }
  const ico = buildIco(icoImages);
  await fs.writeFile(path.join(PUBLIC, 'favicon.ico'), ico);
  console.log(`favicon.ico (${ICO_SIZES.join('/')}) ${ico.length} bytes`);

  const inner = Math.round(APPLE_SIZE * 0.8);
  const apple = await sharp({
    create: { width: APPLE_SIZE, height: APPLE_SIZE, channels: 4, background: APPLE_BG },
  })
    .composite([{ input: await squarePng(inner), gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(path.join(PUBLIC, 'apple-touch-icon.png'), apple);
  console.log(`apple-touch-icon.png (${APPLE_SIZE}) ${apple.length} bytes`);

  for (const size of HEADER_SIZES) {
    const out = path.join(BRAND_DIR, `alignos-spiral-${size}.png`);
    const data = await squarePng(size);
    await fs.writeFile(out, data);
    console.log(`brand/alignos-spiral-${size}.png ${data.length} bytes`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
