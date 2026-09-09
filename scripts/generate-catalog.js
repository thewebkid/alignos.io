import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANALYSIS = path.join(ROOT, 'analysis');
const DATA = path.join(ROOT, 'data');

// ── Read source data ─────────────────────────────────────────────────────────
function readCsv(filename) {
  return parse(
    fs.readFileSync(path.join(ANALYSIS, filename), 'utf-8'),
    { columns: true, skip_empty_lines: true, relax_column_count: true }
  ).filter(r => r.seq && r.id);
}

const catalogEdit = readCsv('codex-catalog-edit-1.csv');
const catalogOriginal = readCsv('codex-catalog.csv');
const toneMarkers = readCsv('codex-tone-markers.csv');

const toneBySeq = new Map();
for (const row of toneMarkers) {
  if (row.tone_marker?.trim()) toneBySeq.set(row.seq.trim(), row.tone_marker.trim());
}

const coverUrlBySeq = new Map();
for (const row of catalogOriginal) {
  if (row.cover_url?.trim()) coverUrlBySeq.set(row.seq.trim(), row.cover_url.trim());
}

// ── Same logic as the review script ──────────────────────────────────────────
function cleanId(currentId) {
  return currentId.replace(/-\d+(-\d+)?$/, '') || currentId;
}

function inferStructuralRole(title, series, wordCount) {
  const t = title.toLowerCase();
  if (t.includes('glossary') || t.includes('definitions')) return 'glossary';
  if (t.includes('dialogic interlude')) return 'interlude';
  if (t.includes('between worlds')) return 'paper';
  if (t.includes('micro-guide') || t.includes('distilled practice')) return 'guide';
  if (series) return 'series-member';
  if (wordCount < 600) return 'guide';
  if (t.includes('bridge') || t.includes('between')) return 'bridge';
  return 'standalone';
}

function inferToneMarker(title, subtitle) {
  const c = `${title} ${subtitle}`.toLowerCase();
  if (c.includes('stillpoint')) return 'Stillpoint';
  if (c.includes('threshold') && c.includes('trust')) return 'Threshold Trust';
  if (c.includes('threshold') || c.includes('crossing') || c.includes('portal') || c.includes('arrival')) return 'Threshold';
  if (c.includes('bridge') && c.includes('beacon')) return 'Bridge Crossers';
  if (c.includes('bridge') || c.includes('between')) return 'The Bridge';
  if (c.includes('dialogue') || c.includes('dialogic')) return 'Dialogues';
  if (c.includes('glossary') || c.includes('definition')) return 'Definitions';
  if (c.includes('love') && c.includes('architecture')) return 'Harmonic Structures';
  if (c.includes('love')) return 'Harmonic Structures';
  if (c.includes('mirror') || c.includes('reflection')) return 'Field Embodiment';
  if (c.includes('coherence') && c.includes('recursion')) return 'Fractal Return';
  if (c.includes('coherence')) return 'Everyday Coherence';
  if (c.includes('trust') || c.includes('circuitry')) return 'Threshold Trust';
  if (c.includes('sovereign')) return 'Threshold';
  if (c.includes('interbeing') || c.includes('relational')) return 'Relational Emergence';
  if (c.includes('harmonic') && c.includes('intelligence')) return 'Harmonic Intelligence';
  if (c.includes('harmonic')) return 'Harmonic Structures';
  if (c.includes('spiral') || c.includes('recursion') || c.includes('return')) return 'Fractal Return';
  if (c.includes('mythos')) return 'Mythic - Remembered - Dissolution';
  if (c.includes('listen') || c.includes('attune')) return 'Field Attunement';
  if (c.includes('prayer') || c.includes('sacred')) return 'Devotional Precision';
  if (c.includes('welcome') || c.includes('offering')) return 'Coherent Invitation';
  if (c.includes('field')) return 'Field Attunement';
  if (c.includes('quantum') || c.includes('memory')) return 'Harmonic Intelligence';
  if (c.includes('practice') || c.includes('path')) return 'The Bridge';
  if (c.includes('soul') || c.includes('evolution')) return 'Threshold';
  if (c.includes('animal') || c.includes('species') || c.includes('earth')) return 'Relational Emergence';
  if (c.includes('exile') || c.includes('leaving')) return 'Threshold';
  if (c.includes('sanctuary') || c.includes('keeper')) return 'Coherent Invitation';
  if (c.includes('willingness') || c.includes('intelligence')) return 'Harmonic Intelligence';
  if (c.includes('asymmetry') || c.includes('grace')) return 'Stillpoint';
  if (c.includes('co-creation') || c.includes('art')) return 'Devotional Precision';
  if (c.includes('conscious') || c.includes('principles')) return 'Threshold Trust';
  if (c.includes('convergence')) return 'Fractal Return';
  return 'Threshold';
}

function inferTags(title, subtitle) {
  const tags = [];
  const c = `${title} ${subtitle}`.toLowerCase();
  if (c.includes('love') || c.includes('heart')) tags.push('love');
  if (c.includes('sovereign')) tags.push('sovereignty');
  if (c.includes('trust')) tags.push('trust');
  if (c.includes('interbeing')) tags.push('interbeing');
  if (c.includes('resonan')) tags.push('resonance');
  if (c.includes('harmonic')) tags.push('harmonics');
  if (c.includes('field')) tags.push('field');
  if (c.includes('spiral') || c.includes('recursion')) tags.push('recursion');
  if (c.includes('threshold') || c.includes('crossing') || c.includes('portal')) tags.push('threshold');
  if (c.includes('bridge') || c.includes('between')) tags.push('bridge');
  if (c.includes('return') || c.includes('rememb')) tags.push('remembrance');
  if (c.includes('prayer') || c.includes('sacred')) tags.push('devotion');
  if (c.includes('glossary') || c.includes('definition')) tags.push('reference');
  if (c.includes('practice') || c.includes('guide')) tags.push('practice');
  if (c.includes('dialogue') || c.includes('dialogic')) tags.push('dialogue');
  if (c.includes('soul') || c.includes('identity') || c.includes('vow')) tags.push('identity');
  if (c.includes('earth') || c.includes('planet') || c.includes('species') || c.includes('animal')) tags.push('planetary');
  if (c.includes('exile') || c.includes('dissolution')) tags.push('dissolution');
  if (c.includes('co-creation') || c.includes('art')) tags.push('co-creation');
  if (c.includes('listen') || c.includes('attune')) tags.push('attunement');
  if (c.includes('mirror') || c.includes('reflection')) tags.push('mirror');
  if (c.includes('mythos')) tags.push('mythos');
  if (c.includes('quantum') || c.includes('nonlocal')) tags.push('quantum');
  if (c.includes('architecture')) tags.push('architecture');
  if (tags.length === 0) tags.push('transmission');
  return [...new Set(tags)];
}

// ── ID and title overrides ───────────────────────────────────────────────────
// Markdown titles are authoritative -- no title restorations from cover images.
// Only duplicate differentiations and series position fixes.
const OVERRIDES = {
  '59':  { id: 'the-codex-of-trans-species-resonance' },
  '77':  { title: 'The Codex of Trans-Species Resonance (Expanded)', id: 'the-codex-of-trans-species-resonance-expanded' },
  '101': { id: 'introduction-to-soul-lines' },
  '123': { title: 'Codex: Soul Lines', id: 'soul-lines' },
  '103': { id: 'the-harmonics-of-the-field' },
  '130': { title: 'The Harmonics of the Field (Extended)', id: 'the-harmonics-of-the-field-extended' },
  '56':  { seriesPos: 2 },
  '82':  { seriesPos: 2 },
};

// ── Build catalog ────────────────────────────────────────────────────────────
const catalog = [];
const usedIds = new Set();

for (const entry of catalogEdit) {
  const seq = parseInt(entry.seq);
  const currentId = entry.id.trim();
  const override = OVERRIDES[String(seq)] || {};

  const title = override.title || entry.title.trim();
  const id = override.id || cleanId(currentId);
  const subtitle = (entry.subtitle || '').trim() || null;
  const wordCount = parseInt(entry.word_count) || 0;
  const readingTime = parseInt(entry.reading_time_min) || 0;
  const glossaryCount = parseInt(entry.glossary_term_count) || 0;
  const seriesName = (entry.series || '').trim() || null;
  const seriesPos = override.seriesPos || (entry.series_pos ? parseInt(entry.series_pos) : null);
  const seriesTotal = entry.series_total ? parseInt(entry.series_total) : null;

  // Ensure unique ID
  let finalId = id;
  if (usedIds.has(finalId)) finalId = `${finalId}-${seq}`;
  usedIds.add(finalId);

  const existingTone = toneBySeq.get(String(seq)) || (entry.tone_marker || '').trim() || null;
  const toneMarker = existingTone || inferToneMarker(title, subtitle || '');
  const structuralRole = inferStructuralRole(title, seriesName, wordCount);
  const tags = inferTags(title, subtitle || '');

  const wasRenamed = entry.was_renamed === 'TRUE';
  const originalTitle = (entry.original_title || '').trim() || null;
  const coverUrl = coverUrlBySeq.get(String(seq)) || null;
  const oldCoverFilename = coverUrl ? decodeURIComponent(coverUrl.split('/').pop()) : null;

  catalog.push({
    id: finalId,
    title,
    subtitle,
    sequence: seq,
    author: 'James Mahu',

    series: seriesName ? {
      name: seriesName,
      position: seriesPos,
      total: seriesTotal,
    } : null,

    structural_role: structuralRole,
    tone_marker: toneMarker,
    tags,

    cover: {
      url: `covers/${finalId}.jpg`,
      thumb_url: `thumbs/${finalId}.jpg`,
      title_overlay: true,
    },

    assets: {
      markdown: `md/${finalId}.md`,
      pdf: `pdf/${finalId}.pdf`,
    },

    metrics: {
      word_count: wordCount,
      reading_time_min: readingTime,
      glossary_term_count: glossaryCount,
    },

    provenance: {
      old_id: currentId,
      old_sequence: seq,
      was_renamed: wasRenamed,
      original_title: originalTitle,
      old_cover_filename: oldCoverFilename,
    },

    status: 'published',
    needs_review: !!(override.title && override.title !== entry.title.trim()) || !existingTone,
    review_notes: null,
  });
}

catalog.sort((a, b) => a.sequence - b.sequence);

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
const outputPath = path.join(DATA, 'codex-catalog.json');
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');

console.log(`Wrote ${outputPath}`);
console.log(`  ${catalog.length} codexes`);
console.log(`  ${catalog.filter(c => c.series).length} in series`);
console.log(`  ${catalog.filter(c => c.needs_review).length} flagged for review`);
console.log(`  ${new Set(catalog.map(c => c.structural_role)).size} structural roles`);
console.log(`  ${new Set(catalog.flatMap(c => c.tags)).size} unique tags`);
