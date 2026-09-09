import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));
const SRC_COVERS = path.join(ROOT, 'blobs', 'covers');
const DEST_COVERS = path.join(ROOT, 'client', 'public', 'covers');
const MD_DIR = path.join(ROOT, 'client', 'public', 'md');

const LEADING_IMG = /^(?:\uFEFF)?<img\s+src="[^"]+"[^>]*\/?>\s*/i;

function slug(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

fs.mkdirSync(DEST_COVERS, { recursive: true });

const srcFiles = fs.existsSync(SRC_COVERS)
  ? fs.readdirSync(SRC_COVERS).filter((f) => f.toLowerCase().endsWith('.jpg'))
  : [];

const missing = [];
let copied = 0;

for (const entry of CATALOG) {
  const destName = `${entry.id}.jpg`;
  const dest = path.join(DEST_COVERS, destName);
  let srcName = srcFiles.find((f) => f === destName)
    || srcFiles.find((f) => slug(f) === entry.id)
    || srcFiles.find((f) => slug(f) === entry.provenance?.old_id)
    || (entry.provenance?.old_cover_filename && srcFiles.find((f) => f === entry.provenance.old_cover_filename));

  if (!srcName) {
    missing.push(entry.id);
    continue;
  }
  fs.copyFileSync(path.join(SRC_COVERS, srcName), dest);
  copied += 1;
}

let stripped = 0;
const mdFiles = fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md'));
for (const file of mdFiles) {
  const p = path.join(MD_DIR, file);
  const raw = fs.readFileSync(p, 'utf-8');
  if (!LEADING_IMG.test(raw)) continue;
  fs.writeFileSync(p, raw.replace(LEADING_IMG, '').replace(/^\s+/, ''), 'utf-8');
  stripped += 1;
}

console.log(`Covers copied to public/covers: ${copied}/${CATALOG.length}`);
if (missing.length) {
  console.log(`  missing: ${missing.join(', ')}`);
  process.exitCode = 1;
}
console.log(`Markdown cover tags stripped: ${stripped}/${mdFiles.length}`);
