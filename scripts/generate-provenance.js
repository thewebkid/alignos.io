import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANALYSIS = path.join(ROOT, 'analysis');
const DATA = path.join(ROOT, 'data');

// edit-1 has the metadata, original has cover_url
const catalogEdit = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-catalog-edit-1.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

const catalogOriginal = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-catalog.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

// Build cover URL lookup from original catalog
const coverUrlBySeq = new Map();
for (const row of catalogOriginal) {
  if (row.cover_url?.trim()) coverUrlBySeq.set(row.seq.trim(), row.cover_url.trim());
}

const catalog = catalogEdit;

function cleanId(currentId) {
  return currentId.replace(/-\d+(-\d+)?$/, '') || currentId;
}

// Markdown titles are authoritative. No title restorations from cover images.
// Only duplicate differentiations where the current title is being modified.
const TITLE_CHANGES = {
  '77':  'The Codex of Trans-Species Resonance (Expanded)',
  '123': 'Codex: Soul Lines',
  '130': 'The Harmonics of the Field (Extended)',
};

const ID_OVERRIDES = {
  '59':  'the-codex-of-trans-species-resonance',
  '77':  'the-codex-of-trans-species-resonance-expanded',
  '101': 'introduction-to-soul-lines',
  '123': 'soul-lines',
  '103': 'the-harmonics-of-the-field',
  '130': 'the-harmonics-of-the-field-extended',
};

const today = new Date().toISOString().split('T')[0];
const provenance = [];

for (const entry of catalog) {
  const seq = entry.seq.trim();
  const currentId = entry.id.trim();
  const currentTitle = entry.title.trim();

  const proposedId = ID_OVERRIDES[seq] || cleanId(currentId);
  const proposedTitle = TITLE_CHANGES[seq] || currentTitle;

  // Record ID changes
  if (proposedId !== currentId) {
    provenance.push({
      codex_id: proposedId,
      change_type: 'id_change',
      old_value: currentId,
      new_value: proposedId,
      date: today,
      reason: ID_OVERRIDES[seq]
        ? 'Duplicate resolution or title restoration'
        : 'Removed trailing number artifact from original PDF filename',
    });
  }

  // Record title changes
  if (proposedTitle !== currentTitle) {
    const wasRenamed = entry.was_renamed === 'TRUE';
    const originalTitle = (entry.original_title || '').trim();
    provenance.push({
      codex_id: proposedId,
      change_type: 'title_change',
      old_value: currentTitle,
      new_value: proposedTitle,
      date: today,
      reason: wasRenamed
        ? `Restored from original title "${originalTitle}" per cover image verification`
        : 'Differentiated from duplicate title pair',
    });
  }

  // Record cover filename changes
  const coverUrl = coverUrlBySeq.get(seq) || '';
  if (coverUrl && coverUrl.includes('/')) {
    const oldCoverFilename = decodeURIComponent(coverUrl.split('/').pop());
    const newCoverFilename = `${proposedId}.jpg`;
    if (oldCoverFilename && oldCoverFilename !== newCoverFilename) {
      provenance.push({
        codex_id: proposedId,
        change_type: 'cover_rename',
        old_value: oldCoverFilename,
        new_value: newCoverFilename,
        date: today,
        reason: 'Unified asset naming under codex ID',
      });
    }
  }

  // Record cover image title as provenance (the earlier version of the title)
  const imageTitle = (entry.image_title || '').trim();
  if (imageTitle && imageTitle !== currentTitle) {
    provenance.push({
      codex_id: proposedId,
      change_type: 'title_evolution',
      old_value: imageTitle,
      new_value: proposedTitle,
      date: today,
      reason: 'Cover image preserves the earlier title; markdown title represents the evolved, authoritative version',
    });
  }
}

// Sort by codex_id for readability
provenance.sort((a, b) => a.codex_id.localeCompare(b.codex_id));

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
const outputPath = path.join(DATA, 'codex-provenance.json');
fs.writeFileSync(outputPath, JSON.stringify(provenance, null, 2), 'utf-8');

console.log(`Wrote ${outputPath}`);
console.log(`  ${provenance.length} change records`);
console.log(`  ${provenance.filter(r => r.change_type === 'id_change').length} ID changes`);
console.log(`  ${provenance.filter(r => r.change_type === 'title_change').length} title changes`);
console.log(`  ${provenance.filter(r => r.change_type === 'cover_rename').length} cover renames`);
