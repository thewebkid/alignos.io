import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANALYSIS = path.join(ROOT, 'analysis');
const DATA = path.join(ROOT, 'data');
const CONTENT = path.join(ROOT, 'client', 'public', 'codex-content');

// Read source data
const catalogEdit = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-catalog-edit-1.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

const toneMarkers = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-tone-markers.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

// Build tone marker lookup (from both sources)
const toneBySeq = new Map();
for (const row of toneMarkers) {
  if (row.tone_marker?.trim()) toneBySeq.set(row.seq.trim(), row.tone_marker.trim());
}
for (const row of catalogEdit) {
  const seq = row.seq.trim();
  const tone = (row.tone_marker || '').trim();
  if (tone && !toneBySeq.has(seq)) toneBySeq.set(seq, tone);
}

function getExcerpt(id, maxWords = 350) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(CONTENT, id + '.json'), 'utf-8'));
    const md = data.markdown || '';
    const clean = md.replace(/<img[^>]*\/?>/g, '').trim();
    const words = clean.split(/\s+/);
    let opening = words.slice(0, maxWords).join(' ');
    let registry = '';
    for (const marker of ['## Registry', '## Codex Registry']) {
      const idx = md.indexOf(marker);
      if (idx > -1) { registry = md.substring(idx, Math.min(idx + 600, md.length)); break; }
    }
    return opening + (registry ? '\n\n' + registry : '');
  } catch (e) { return null; }
}

// Build all codex entries with excerpts
const allCodexes = [];
for (const row of catalogEdit) {
  const seq = row.seq.trim();
  const id = row.id.trim();
  const title = row.title.trim();
  const wordCount = parseInt(row.word_count) || 0;
  const knownTone = toneBySeq.get(seq) || null;
  const excerpt = getExcerpt(id);

  if (!excerpt) {
    console.error(`No content found for seq ${seq} id ${id}`);
    continue;
  }

  allCodexes.push({ seq: parseInt(seq), id, title, wordCount, knownTone, excerpt });
}

// Sort by sequence
allCodexes.sort((a, b) => a.seq - b.seq);

// Group into batches of 5
const BATCH_SIZE = 5;
const batches = [];
for (let i = 0; i < allCodexes.length; i += BATCH_SIZE) {
  batches.push(allCodexes.slice(i, i + BATCH_SIZE));
}

// Write batches
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

const batchMeta = batches.map((batch, idx) => ({
  batchIndex: idx,
  codexes: batch.map(c => ({ seq: c.seq, id: c.id, title: c.title, wordCount: c.wordCount, knownTone: c.knownTone })),
}));

fs.writeFileSync(path.join(DATA, 'composer-batches.json'), JSON.stringify(batches, null, 2));
fs.writeFileSync(path.join(DATA, 'composer-batch-meta.json'), JSON.stringify(batchMeta, null, 2));

console.log(`Prepared ${batches.length} batches from ${allCodexes.length} codexes`);
console.log(`  Known tone markers: ${allCodexes.filter(c => c.knownTone).length}`);
console.log(`  Need tone proposals: ${allCodexes.filter(c => !c.knownTone).length}`);
for (let i = 0; i < batches.length; i++) {
  const b = batches[i];
  const known = b.filter(c => c.knownTone).length;
  const unknown = b.filter(c => !c.knownTone).length;
  console.log(`  Batch ${i}: ${b.map(c => 'seq' + c.seq).join(', ')} (${known} known, ${unknown} unknown)`);
}
