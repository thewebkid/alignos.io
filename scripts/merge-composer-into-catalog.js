import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');
const CATALOG_PATH = path.join(DATA, 'codex-catalog.json');
const COMPOSER_PATH = path.join(DATA, 'composer-analysis.json');

const EXPECTED_TONES = {
  38: 'Open Trust',
  130: 'Field Attunement',
};

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
const composer = JSON.parse(fs.readFileSync(COMPOSER_PATH, 'utf-8'));

const composerBySeq = new Map(composer.map((row) => [Number(row.seq), row]));
const idMismatches = [];
const missingComposer = [];

for (const entry of catalog) {
  const analysis = composerBySeq.get(entry.sequence);
  if (!analysis) {
    missingComposer.push(entry.sequence);
    continue;
  }

  if (analysis.id !== entry.id) {
    idMismatches.push({
      seq: entry.sequence,
      catalogId: entry.id,
      composerId: analysis.id,
    });
  }

  entry.tone_marker = analysis.tone_marker;
  entry.structural_role = analysis.structural_role;
  entry.tags = analysis.tags;
  entry.description = analysis.description;
  entry.entry_point = analysis.entry_point;
  entry.pull_quote = analysis.pull_quote;

  entry.cover = entry.cover || {};
  entry.cover.url = `covers/${entry.id}.jpg`;
  entry.cover.thumb_url = `thumb/${entry.id}.jpg`;
  entry.cover.title_overlay = true;

  entry.needs_review = false;
}

if (missingComposer.length) {
  throw new Error(`Composer analysis missing for sequences: ${missingComposer.join(', ')}`);
}

for (const [seq, expected] of Object.entries(EXPECTED_TONES)) {
  const entry = catalog.find((c) => c.sequence === Number(seq));
  if (!entry) {
    throw new Error(`Catalog missing sequence ${seq}`);
  }
  if (entry.tone_marker !== expected) {
    throw new Error(
      `Seq ${seq} tone_marker is "${entry.tone_marker}", expected "${expected}" (pre-v2 marker must not remain)`
    );
  }
}

const ids = catalog.map((c) => c.id);
const seqs = catalog.map((c) => c.sequence);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
const dupSeqs = seqs.filter((s, i) => seqs.indexOf(s) !== i);
if (dupIds.length || dupSeqs.length) {
  throw new Error(`Duplicate ids=${dupIds.join(', ') || 'none'} seqs=${dupSeqs.join(', ') || 'none'}`);
}
if (catalog.length !== 134) {
  throw new Error(`Expected 134 catalog entries, got ${catalog.length}`);
}

catalog.sort((a, b) => a.sequence - b.sequence);
fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');

console.log(`Merged composer-analysis into ${CATALOG_PATH}`);
console.log(`  entries: ${catalog.length}`);
console.log(`  unique ids: ${new Set(ids).size}`);
console.log(`  unique sequences: ${new Set(seqs).size}`);
console.log(`  seq 38 tone: ${catalog.find((c) => c.sequence === 38).tone_marker}`);
console.log(`  seq 130 tone: ${catalog.find((c) => c.sequence === 130).tone_marker}`);
console.log(`  id mismatches (catalog id kept): ${idMismatches.length}`);
if (idMismatches.length) {
  for (const row of idMismatches.slice(0, 12)) {
    console.log(`    seq ${row.seq}: catalog=${row.catalogId} composer=${row.composerId}`);
  }
  if (idMismatches.length > 12) {
    console.log(`    … ${idMismatches.length - 12} more`);
  }
}
