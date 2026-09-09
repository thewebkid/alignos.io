import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));
const COVERS = path.join(ROOT, 'client', 'public', 'covers');
const THUMBS = path.join(ROOT, 'client', 'public', 'thumb');

const WIDTH = 400;
const HEIGHT = 520;

fs.mkdirSync(THUMBS, { recursive: true });
for (const file of fs.readdirSync(THUMBS)) {
  if (file.toLowerCase().endsWith('.jpg')) {
    fs.unlinkSync(path.join(THUMBS, file));
  }
}

const missing = [];
let written = 0;

for (const entry of CATALOG) {
  const src = path.join(COVERS, `${entry.id}.jpg`);
  const dest = path.join(THUMBS, `${entry.id}.jpg`);
  if (!fs.existsSync(src)) {
    missing.push({ seq: entry.sequence, id: entry.id });
    continue;
  }
  await sharp(src)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80, progressive: true })
    .toFile(dest);
  written += 1;
}

console.log(`Thumbs: wrote ${written} (${WIDTH}×${HEIGHT}, q80 progressive) → ${THUMBS}`);
if (missing.length) {
  console.log(`  missing covers: ${missing.length}`);
  for (const row of missing) console.log(`    seq ${row.seq} ${row.id}`);
  process.exitCode = 1;
}
