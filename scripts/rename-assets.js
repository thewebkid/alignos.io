import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));

const DIRS = {
  md: path.join(ROOT, 'client', 'public', 'md'),
  pdf: path.join(ROOT, 'client', 'public', 'pdf'),
  covers: path.join(ROOT, 'blobs', 'covers'),
};

function slug(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext));
}

function findSource(files, entry, kind) {
  const destBase = `${entry.id}${kind === 'md' ? '.md' : kind === 'pdf' ? '.pdf' : '.jpg'}`;
  const exact = files.find((f) => f === destBase);
  if (exact) return { file: exact, alreadyRenamed: true };

  const oldCover = entry.provenance?.old_cover_filename;
  if (kind === 'covers' && oldCover) {
    const hit = files.find((f) => f === oldCover);
    if (hit) return { file: hit, alreadyRenamed: false };
  }

  const oldId = entry.provenance?.old_id;
  const byOldId = files.find((f) => slug(f) === oldId);
  if (byOldId) return { file: byOldId, alreadyRenamed: false };

  const byNewId = files.find((f) => slug(f) === entry.id);
  if (byNewId) return { file: byNewId, alreadyRenamed: false };

  return null;
}

function renameOne(dir, source, dest) {
  const from = path.join(dir, source);
  const to = path.join(dir, dest);
  if (source === dest) return 'exists';
  if (source.toLowerCase() === dest.toLowerCase()) {
    const tmp = path.join(dir, `${dest}.tmp-rename`);
    fs.renameSync(from, tmp);
    fs.renameSync(tmp, to);
    return 'renamed-case';
  }
  if (fs.existsSync(to) && !fs.existsSync(from)) return 'exists';
  if (fs.existsSync(to) && fs.existsSync(from)) {
    return 'dest-exists';
  }
  fs.renameSync(from, to);
  return 'renamed';
}

const missing = { md: [], pdf: [], covers: [] };
const destExists = [];
const renamed = { md: 0, pdf: 0, covers: 0 };
const skipped = { md: 0, pdf: 0, covers: 0 };

const files = {
  md: listFiles(DIRS.md, '.md'),
  pdf: listFiles(DIRS.pdf, '.pdf'),
  covers: listFiles(DIRS.covers, '.jpg'),
};

for (const entry of CATALOG) {
  for (const kind of ['md', 'pdf', 'covers']) {
    const ext = kind === 'md' ? '.md' : kind === 'pdf' ? '.pdf' : '.jpg';
    const dest = `${entry.id}${ext}`;
    const found = findSource(files[kind], entry, kind);
    if (!found) {
      missing[kind].push({ seq: entry.sequence, id: entry.id, old: entry.provenance?.old_id });
      continue;
    }
    const result = renameOne(DIRS[kind], found.file, dest);
    if (result === 'renamed' || result === 'renamed-case') renamed[kind] += 1;
    else if (result === 'exists') skipped[kind] += 1;
    else destExists.push({ kind, seq: entry.sequence, id: entry.id, source: found.file });
  }
}

const seq71 = catalogNote(71);
function catalogNote(seq) {
  const entry = CATALOG.find((c) => c.sequence === seq);
  if (!entry) return `seq ${seq}: not in catalog`;
  const coverDest = path.join(DIRS.covers, `${entry.id}.jpg`);
  const present = fs.existsSync(coverDest);
  return `seq ${seq} ${entry.id} (${entry.title}) cover ${present ? 'present' : 'MISSING'} at ${path.basename(coverDest)}`;
}

console.log('Asset rename complete');
console.log(`  md:     renamed ${renamed.md}, already ${skipped.md}, missing ${missing.md.length}`);
console.log(`  pdf:    renamed ${renamed.pdf}, already ${skipped.pdf}, missing ${missing.pdf.length}`);
console.log(`  covers: renamed ${renamed.covers}, already ${skipped.covers}, missing ${missing.covers.length}`);
console.log(`  ${seq71}`);

if (destExists.length) {
  console.log(`  dest already existed (${destExists.length}):`);
  for (const row of destExists.slice(0, 8)) {
    console.log(`    ${row.kind} seq ${row.seq} ${row.id} leftover ${row.source}`);
  }
}

for (const kind of ['md', 'pdf', 'covers']) {
  if (!missing[kind].length) continue;
  console.log(`  missing ${kind}:`);
  for (const row of missing[kind]) {
    console.log(`    seq ${row.seq} ${row.id} (old ${row.old})`);
  }
}

if (missing.md.length || missing.pdf.length) {
  process.exitCode = 1;
}
