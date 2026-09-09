import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANALYSIS = path.join(ROOT, 'analysis');

// ── Color fills ──────────────────────────────────────────────────────────────
const FILLS = {
  unchanged: null,
  confident: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } },
  inferred:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } },
  proposal:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCD5B4' } },
  decision:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
};

// ── Read source data ─────────────────────────────────────────────────────────
function readCsv(filename) {
  const content = fs.readFileSync(path.join(ANALYSIS, filename), 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

const catalog = readCsv('codex-catalog-edit-1.csv').filter(r => r.seq && r.id);
const toneMarkers = readCsv('codex-tone-markers.csv').filter(r => r.seq && r.id);
const seriesCatalog = readCsv('series-catalog.csv');
const audit = JSON.parse(fs.readFileSync(path.join(ANALYSIS, 'codex-lattice-audit.json'), 'utf-8'));

// Build tone marker lookup from the tone-markers CSV
const toneBySeq = new Map();
for (const row of toneMarkers) {
  if (row.tone_marker && row.tone_marker.trim()) {
    toneBySeq.set(row.seq.trim(), row.tone_marker.trim());
  }
}

// Build cover mismatch lookup from audit
const coverMismatches = new Map();
for (const m of audit.coverTitleMismatches || []) {
  coverMismatches.set(String(m.seq), m);
}

// Build duplicate title lookup from audit
const duplicateTitles = new Map();
for (const d of audit.duplicateTitlePairs || []) {
  for (const entry of d.entries || []) {
    duplicateTitles.set(String(entry.seq), { pairTitle: d.title, ...entry });
  }
}

// ── ID cleaning logic ────────────────────────────────────────────────────────
function cleanId(currentId, title) {
  // Remove trailing number patterns like -38, -55, -11-1, -27
  let cleaned = currentId.replace(/-\d+(-\d+)?$/, '');
  if (!cleaned || cleaned === currentId) {
    cleaned = currentId;
  }
  // If the cleaned ID is empty or too short, derive from title
  if (cleaned.length < 3) {
    cleaned = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return cleaned;
}

function kebabFromTitle(title) {
  return title.toLowerCase()
    .replace(/[''"":?!.,;()]/g, '')
    .replace(/—/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Duplicate resolution proposals ───────────────────────────────────────────
// These are the provisional differentiated IDs for codexes sharing titles
// Duplicate resolutions that DON'T change titles -- only differentiate IDs
// where two codexes share the same title. Title changes via restoration are
// removed; markdown titles are authoritative. Cover image titles (the earlier
// versions) are captured in provenance.
const DUPLICATE_RESOLUTIONS = {
  // Trans-Species Resonance pair -- same title, different works
  '59': { newTitle: 'The Codex of Trans-Species Resonance', newId: 'the-codex-of-trans-species-resonance', note: 'Earlier edition keeps clean ID' },
  '77': { newTitle: 'The Codex of Trans-Species Resonance (Expanded)', newId: 'the-codex-of-trans-species-resonance-expanded', note: 'Later/longer edition (5133 vs 2158 words)' },
  // Soul Lines pair
  '101': { newTitle: 'Codex: Introduction to Soul Lines', newId: 'introduction-to-soul-lines', note: 'Shorter version (1216 words)' },
  '123': { newTitle: 'Codex: Soul Lines', newId: 'soul-lines', note: 'Longer version (5641 words) keeps simpler ID' },
  // Harmonics of the Field pair
  '103': { newTitle: 'The Harmonics of the Field', newId: 'the-harmonics-of-the-field', note: 'Earlier version (3466 words)' },
  '130': { newTitle: 'The Harmonics of the Field (Extended)', newId: 'the-harmonics-of-the-field-extended', note: 'Later version, nearly 2x length (6807 words)' },
};

// No title fixes -- markdown titles are authoritative. Cover image titles
// represent earlier versions and are preserved in provenance only.
const TITLE_FIXES = {};

// ── Structural role inference ────────────────────────────────────────────────
function inferStructuralRole(row) {
  const title = (row.title || '').toLowerCase();
  const series = row.series || '';
  const wordCount = parseInt(row.word_count) || 0;

  if (title.includes('glossary') || title.includes('definitions')) return 'glossary';
  if (title.includes('dialogic interlude')) return 'interlude';
  if (row.seq === '1' || title.includes('between worlds')) return 'paper';
  if (title.includes('micro-guide') || title.includes('distilled practice')) return 'guide';
  if (series && series.trim()) return 'series-member';
  if (wordCount < 600) return 'guide';
  if (title.includes('bridge') || title.includes('between')) return 'bridge';
  return 'standalone';
}

// ── Tone marker inference for blanks ─────────────────────────────────────────
function inferToneMarker(row) {
  const title = (row.title || '').toLowerCase();
  const subtitle = (row.subtitle || '').toLowerCase();
  const combined = `${title} ${subtitle}`;

  if (combined.includes('stillpoint')) return 'Stillpoint';
  if (combined.includes('threshold') && combined.includes('trust')) return 'Threshold Trust';
  if (combined.includes('threshold') || combined.includes('crossing') || combined.includes('portal') || combined.includes('arrival')) return 'Threshold';
  if (combined.includes('bridge') && combined.includes('beacon')) return 'Bridge Crossers';
  if (combined.includes('bridge') || combined.includes('between')) return 'The Bridge';
  if (combined.includes('dialogue') || combined.includes('dialogic') || combined.includes('interlude')) return 'Dialogues';
  if (combined.includes('glossary') || combined.includes('definition')) return 'Definitions';
  if (combined.includes('love') && combined.includes('architecture')) return 'Harmonic Structures';
  if (combined.includes('love') && (combined.includes('frequency') || combined.includes('flame'))) return 'Devotional Precision';
  if (combined.includes('love')) return 'Harmonic Structures';
  if (combined.includes('mirror') || combined.includes('reflection')) return 'Field Embodiment';
  if (combined.includes('coherence') && combined.includes('recursion')) return 'Fractal Return';
  if (combined.includes('coherence') || combined.includes('dissolution')) return 'Everyday Coherence';
  if (combined.includes('trust') || combined.includes('circuitry')) return 'Threshold Trust';
  if (combined.includes('sovereign') && combined.includes('evolution')) return 'Threshold';
  if (combined.includes('sovereign') || combined.includes('identity') || combined.includes('vow')) return 'Threshold';
  if (combined.includes('interbeing') || combined.includes('inter-being') || combined.includes('relational')) return 'Relational Emergence';
  if (combined.includes('harmonic') && combined.includes('intelligence')) return 'Harmonic Intelligence';
  if (combined.includes('harmonic') && combined.includes('future')) return 'Field Attunement';
  if (combined.includes('harmonic') || combined.includes('resonan')) return 'Harmonic Structures';
  if (combined.includes('spiral') || combined.includes('recursion') || combined.includes('return')) return 'Fractal Return';
  if (combined.includes('mythos') || combined.includes('mythology')) return 'Mythic - Remembered - Dissolution';
  if (combined.includes('listen') || combined.includes('attunement') || combined.includes('attune')) return 'Field Attunement';
  if (combined.includes('prayer') || combined.includes('nearness') || combined.includes('sacred')) return 'Devotional Precision';
  if (combined.includes('welcome') || combined.includes('invitation') || combined.includes('offering')) return 'Coherent Invitation';
  if (combined.includes('field') && combined.includes('effect')) return 'Field Embodiment';
  if (combined.includes('field')) return 'Field Attunement';
  if (combined.includes('quantum') || combined.includes('nonlocal') || combined.includes('memory')) return 'Harmonic Intelligence';
  if (combined.includes('practice') || combined.includes('path') || combined.includes('guide')) return 'The Bridge';
  if (combined.includes('soul') || combined.includes('evolution')) return 'Threshold';
  if (combined.includes('animal') || combined.includes('species') || combined.includes('earth') || combined.includes('planet')) return 'Relational Emergence';
  if (combined.includes('exile') || combined.includes('leaving')) return 'Threshold';
  if (combined.includes('sanctuary') || combined.includes('keeper')) return 'Coherent Invitation';
  if (combined.includes('willingness') || combined.includes('intelligence')) return 'Harmonic Intelligence';
  if (combined.includes('asymmetry') || combined.includes('grace')) return 'Stillpoint';
  if (combined.includes('co-creation') || combined.includes('art')) return 'Devotional Precision';
  if (combined.includes('conscious') || combined.includes('principles')) return 'Threshold Trust';
  if (combined.includes('convergence') || combined.includes('reassembly')) return 'Fractal Return';

  return 'Threshold'; // safe default for the spiritual/transformative nature of the work
}

// ── Tag inference ────────────────────────────────────────────────────────────
function inferTags(row, toneMarker, structuralRole) {
  const tags = [];
  const title = (row.title || '').toLowerCase();
  const subtitle = (row.subtitle || '').toLowerCase();
  const combined = `${title} ${subtitle}`;

  // Theme-based tags
  if (combined.includes('love') || combined.includes('heart')) tags.push('love');
  if (combined.includes('sovereign') || combined.includes('sovereignty')) tags.push('sovereignty');
  if (combined.includes('trust') || combined.includes('circuitry')) tags.push('trust');
  if (combined.includes('interbeing') || combined.includes('inter-being')) tags.push('interbeing');
  if (combined.includes('resonan')) tags.push('resonance');
  if (combined.includes('harmonic') || combined.includes('harmony')) tags.push('harmonics');
  if (combined.includes('field')) tags.push('field');
  if (combined.includes('spiral') || combined.includes('recursion') || combined.includes('recursive')) tags.push('recursion');
  if (combined.includes('threshold') || combined.includes('crossing') || combined.includes('portal')) tags.push('threshold');
  if (combined.includes('bridge') || combined.includes('between')) tags.push('bridge');
  if (combined.includes('return') || combined.includes('rememb')) tags.push('remembrance');
  if (combined.includes('prayer') || combined.includes('sacred') || combined.includes('devotion')) tags.push('devotion');
  if (combined.includes('glossary') || combined.includes('definition')) tags.push('reference');
  if (combined.includes('practice') || combined.includes('guide')) tags.push('practice');
  if (combined.includes('dialogue') || combined.includes('dialogic')) tags.push('dialogue');
  if (combined.includes('soul') || combined.includes('identity') || combined.includes('vow')) tags.push('identity');
  if (combined.includes('earth') || combined.includes('planet') || combined.includes('species') || combined.includes('animal')) tags.push('planetary');
  if (combined.includes('exile') || combined.includes('leaving') || combined.includes('dissolution')) tags.push('dissolution');
  if (combined.includes('co-creation') || combined.includes('art') || combined.includes('craft')) tags.push('co-creation');
  if (combined.includes('listen') || combined.includes('attune')) tags.push('attunement');
  if (combined.includes('mirror') || combined.includes('reflection')) tags.push('mirror');
  if (combined.includes('mythos') || combined.includes('mythology')) tags.push('mythos');
  if (combined.includes('quantum') || combined.includes('nonlocal')) tags.push('quantum');
  if (combined.includes('architecture')) tags.push('architecture');

  // Ensure at least one tag
  if (tags.length === 0) tags.push('transmission');

  return [...new Set(tags)];
}

// ── Process all codexes ──────────────────────────────────────────────────────
const rows = [];
const usedIds = new Set();

for (const entry of catalog) {
  const seq = entry.seq.trim();
  const currentId = entry.id.trim();
  const currentTitle = entry.title.trim();
  const currentSubtitle = (entry.subtitle || '').trim();
  const currentTone = toneBySeq.get(seq) || (entry.tone_marker || '').trim();
  const currentSeries = (entry.series || '').trim();
  const currentSeriesPos = (entry.series_pos || '').trim();
  const wordCount = parseInt(entry.word_count) || 0;

  // Determine proposed title
  let proposedTitle = currentTitle;
  let titleChangeSource = 'unchanged';
  let titleNeedsApproval = false;
  let titleRationale = '';

  // Check for title fixes (cover mismatches with high confidence)
  if (TITLE_FIXES[seq]) {
    proposedTitle = TITLE_FIXES[seq].newTitle;
    titleChangeSource = 'restored';
    titleRationale = TITLE_FIXES[seq].note;
  }

  // Check for duplicate resolutions
  if (DUPLICATE_RESOLUTIONS[seq]) {
    proposedTitle = DUPLICATE_RESOLUTIONS[seq].newTitle;
    titleChangeSource = DUPLICATE_RESOLUTIONS[seq].note.includes('Restored') ? 'restored' : 'proposed';
    titleNeedsApproval = true;
    titleRationale = DUPLICATE_RESOLUTIONS[seq].note;
  }

  // Determine proposed ID
  let proposedId;
  if (DUPLICATE_RESOLUTIONS[seq]) {
    proposedId = DUPLICATE_RESOLUTIONS[seq].newId;
  } else {
    proposedId = cleanId(currentId, proposedTitle);
  }

  // Ensure uniqueness
  let finalId = proposedId;
  if (usedIds.has(finalId) && finalId !== currentId) {
    finalId = kebabFromTitle(proposedTitle);
    if (usedIds.has(finalId)) {
      finalId = `${finalId}-${seq}`;
    }
  }
  usedIds.add(finalId);

  const idChanged = finalId !== currentId;
  const titleChanged = proposedTitle !== currentTitle;

  // Determine proposed tone marker
  let proposedTone = currentTone;
  let toneChangeSource = currentTone ? 'unchanged' : 'inferred';
  if (!currentTone) {
    proposedTone = inferToneMarker({ ...entry, title: proposedTitle });
  }

  // Determine structural role (always new)
  const structuralRole = inferStructuralRole({ ...entry, title: proposedTitle });

  // Determine tags (always new)
  const tags = inferTags({ ...entry, title: proposedTitle }, proposedTone, structuralRole);

  // Determine series position fixes
  let proposedSeriesPos = currentSeriesPos;
  let seriesPosChanged = false;
  // Fix known position errors
  if (seq === '56') { proposedSeriesPos = '2'; seriesPosChanged = currentSeriesPos !== '2'; }
  if (seq === '82') { proposedSeriesPos = '2'; seriesPosChanged = currentSeriesPos !== '2'; }

  // Overall change source
  let overallChangeSource = 'unchanged';
  if (titleChanged && titleChangeSource === 'restored') overallChangeSource = 'restored';
  else if (titleChanged) overallChangeSource = 'proposed';
  else if (idChanged) overallChangeSource = 'confident';
  else if (toneChangeSource === 'inferred') overallChangeSource = 'inferred';

  // Needs approval?
  const needsApproval = titleNeedsApproval || (toneChangeSource === 'inferred');

  // Build rationale
  const rationales = [];
  if (idChanged && !titleChanged) rationales.push('Removed trailing number from ID');
  if (titleChanged) rationales.push(titleRationale);
  if (toneChangeSource === 'inferred') rationales.push('Tone marker inferred from content themes');
  if (seriesPosChanged) rationales.push(`Series position corrected from ${currentSeriesPos} to ${proposedSeriesPos}`);

  rows.push({
    seq: parseInt(seq),
    currentId,
    proposedId: finalId,
    idChanged,
    currentTitle,
    proposedTitle: titleChanged ? proposedTitle : '',
    titleChanged,
    subtitle: currentSubtitle,
    currentTone: currentTone || '',
    proposedTone: currentTone ? '' : proposedTone,
    toneInferred: !currentTone,
    series: currentSeries,
    currentSeriesPos,
    proposedSeriesPos: seriesPosChanged ? proposedSeriesPos : '',
    seriesPosChanged,
    structuralRole,
    tags: tags.join(', '),
    changeSource: overallChangeSource,
    needsApproval,
    rationale: rationales.join('; '),
    wordCount,
  });
}

rows.sort((a, b) => a.seq - b.seq);

// ── Generate Excel workbook ──────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'AlignOS Build Tools';
wb.created = new Date();

// ── Legend sheet ─────────────────────────────────────────────────────────────
const legend = wb.addWorksheet('Legend', { properties: { tabColor: { argb: 'FF333333' } } });
legend.columns = [
  { header: 'Color', width: 20 },
  { header: 'Meaning', width: 60 },
  { header: 'Action Required', width: 40 },
];

const legendData = [
  ['White (no fill)', 'Unchanged from current data', 'No action needed'],
  ['Light Green', 'Confident fix (data error, trailing number removal)', 'Review briefly — these are safe corrections'],
  ['Light Yellow', 'AI-inferred value (tone marker, tags, structural role)', 'Please review — edit or delete if wrong'],
  ['Light Orange', 'Creative proposal (title differentiation, new taxonomy)', 'Needs your judgment — edit, accept, or reject'],
  ['Light Red', 'Conflict or open question (duplicates, mismatches)', 'Decision required — please resolve'],
];

const legendFills = [null, FILLS.confident, FILLS.inferred, FILLS.proposal, FILLS.decision];

for (let i = 0; i < legendData.length; i++) {
  const row = legend.addRow(legendData[i]);
  if (legendFills[i]) {
    row.getCell(1).fill = legendFills[i];
  }
  row.eachCell(cell => {
    cell.font = { size: 11 };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
}

legend.addRow([]);
legend.addRow(['Instructions']);
legend.addRow(['1. Review all colored cells — white cells are unchanged and need no attention']);
legend.addRow(['2. Edit any cell you disagree with — your edits become the final decision']);
legend.addRow(['3. To reject a proposal, clear the proposed cell (leave it blank)']);
legend.addRow(['4. To accept a proposal, leave it as-is or refine the wording']);
legend.addRow(['5. The "tags" and "structural_role" columns are entirely new — all values are proposals']);
legend.addRow(['6. Return the edited spreadsheet and we will build the final data structure from it']);

// Style header
legend.getRow(1).eachCell(cell => {
  cell.font = { bold: true, size: 12 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
});

// ── Proposed Structure sheet ─────────────────────────────────────────────────
const ws = wb.addWorksheet('Proposed Structure', { properties: { tabColor: { argb: 'FF4472C4' } } });

const columns = [
  { header: 'Seq', key: 'seq', width: 6 },
  { header: 'ID (current)', key: 'currentId', width: 45 },
  { header: 'ID (proposed)', key: 'proposedId', width: 45 },
  { header: 'Title (current)', key: 'currentTitle', width: 50 },
  { header: 'Title (proposed)', key: 'proposedTitle', width: 50 },
  { header: 'Subtitle', key: 'subtitle', width: 35 },
  { header: 'Tone Marker (current)', key: 'currentTone', width: 28 },
  { header: 'Tone Marker (proposed)', key: 'proposedTone', width: 28 },
  { header: 'Series', key: 'series', width: 30 },
  { header: 'Pos (current)', key: 'currentSeriesPos', width: 12 },
  { header: 'Pos (proposed)', key: 'proposedSeriesPos', width: 12 },
  { header: 'Structural Role', key: 'structuralRole', width: 18 },
  { header: 'Tags', key: 'tags', width: 40 },
  { header: 'Words', key: 'wordCount', width: 8 },
  { header: 'Change Source', key: 'changeSource', width: 15 },
  { header: 'Needs Approval', key: 'needsApproval', width: 14 },
  { header: 'Rationale', key: 'rationale', width: 60 },
];

ws.columns = columns;

// Style header row
const headerRow = ws.getRow(1);
headerRow.eachCell(cell => {
  cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  cell.alignment = { vertical: 'middle', wrapText: true };
  cell.border = {
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
  };
});
headerRow.height = 30;

// Add data rows with cell-level coloring
for (const data of rows) {
  const row = ws.addRow({
    seq: data.seq,
    currentId: data.currentId,
    proposedId: data.proposedId,
    currentTitle: data.currentTitle,
    proposedTitle: data.proposedTitle,
    subtitle: data.subtitle,
    currentTone: data.currentTone,
    proposedTone: data.proposedTone,
    series: data.series,
    currentSeriesPos: data.currentSeriesPos,
    proposedSeriesPos: data.proposedSeriesPos,
    structuralRole: data.structuralRole,
    tags: data.tags,
    wordCount: data.wordCount,
    changeSource: data.changeSource,
    needsApproval: data.needsApproval ? 'TRUE' : '',
    rationale: data.rationale,
  });

  row.eachCell(cell => {
    cell.font = { size: 10 };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });

  // Color the "proposed" columns based on change type
  const proposedIdCell = row.getCell('proposedId');
  const proposedTitleCell = row.getCell('proposedTitle');
  const proposedToneCell = row.getCell('proposedTone');
  const proposedPosCell = row.getCell('proposedSeriesPos');
  const roleCell = row.getCell('structuralRole');
  const tagsCell = row.getCell('tags');

  // ID coloring
  if (data.idChanged) {
    if (data.titleChanged && data.changeSource === 'proposed') {
      proposedIdCell.fill = FILLS.decision;
    } else if (data.changeSource === 'restored') {
      proposedIdCell.fill = FILLS.confident;
    } else {
      proposedIdCell.fill = FILLS.confident;
    }
  }

  // Title coloring
  if (data.titleChanged) {
    if (data.changeSource === 'restored') {
      proposedTitleCell.fill = FILLS.confident;
    } else {
      proposedTitleCell.fill = FILLS.decision;
    }
  }

  // Tone marker coloring -- inferred markers are creative proposals (orange),
  // not confident inferences, since they're based on title keyword matching
  if (data.toneInferred && data.proposedTone) {
    proposedToneCell.fill = FILLS.proposal;
  }

  // Series position coloring
  if (data.seriesPosChanged) {
    proposedPosCell.fill = FILLS.confident;
  }

  // Structural role and tags are always proposals (new fields)
  roleCell.fill = FILLS.inferred;
  tagsCell.fill = FILLS.inferred;
}

// Freeze top row and first column
ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];

// Auto-filter
ws.autoFilter = { from: 'A1', to: `Q${rows.length + 1}` };

// ── Save workbook ────────────────────────────────────────────────────────────
const outputPath = path.join(ANALYSIS, 'proposed-changes.xlsx');
await wb.xlsx.writeFile(outputPath);
console.log(`Wrote ${outputPath}`);
console.log(`  ${rows.length} codexes processed`);
console.log(`  ${rows.filter(r => r.idChanged).length} IDs changed`);
console.log(`  ${rows.filter(r => r.titleChanged).length} titles changed`);
console.log(`  ${rows.filter(r => r.toneInferred).length} tone markers inferred`);
console.log(`  ${rows.filter(r => r.needsApproval).length} items need James' approval`);

// ── Generate companion markdown ──────────────────────────────────────────────
let md = `# Proposed Codex Lattice Restructure
*Generated ${new Date().toISOString().split('T')[0]} for James Mahu*

---

This document accompanies the **proposed-changes.xlsx** spreadsheet. The spreadsheet is the working artifact — edit it directly and return it. This markdown provides narrative context for the key changes.

## Color Legend

| Color | Meaning | Action |
|---|---|---|
| White | Unchanged | No action needed |
| Light Green | Confident fix (data errors, trailing numbers) | Review briefly |
| Light Yellow | AI-inferred (tone markers, tags, roles) | Please review — edit or delete |
| Light Orange | Creative proposal (title changes, taxonomy) | Needs your judgment |
| Light Red | Conflict / open question | Decision required |

---

## Summary of Changes

| Category | Count |
|---|---|
| Total codexes | ${rows.length} |
| IDs cleaned (trailing numbers removed) | ${rows.filter(r => r.idChanged && !r.titleChanged).length} |
| Titles restored (from cover images) | ${rows.filter(r => r.changeSource === 'restored').length} |
| Titles proposed (duplicate differentiation) | ${rows.filter(r => r.titleChanged && r.changeSource === 'proposed').length} |
| Tone markers inferred (were blank) | ${rows.filter(r => r.toneInferred).length} |
| Series positions corrected | ${rows.filter(r => r.seriesPosChanged).length} |
| Items needing your approval | ${rows.filter(r => r.needsApproval).length} |

---

## Part I: ID Cleanup

Most IDs had trailing numbers from the original PDF filenames (e.g., \`the-codex-of-the-chord-38\` → \`the-codex-of-the-chord\`). These are mechanical cleanups that don't change the content. You approved this approach in your June email ("The-Codex-of-the-Chord feels much more natural than The-Codex-of-the-Chord-38").

**${rows.filter(r => r.idChanged).length} IDs changed** out of ${rows.length} total.

---

## Part II: Title Restorations

These titles were restored to match their cover images, resolving mismatches identified in the May audit:

| Seq | Was | Restored To | Reason |
|---|---|---|---|
`;

const restorations = rows.filter(r => r.changeSource === 'restored' && r.titleChanged);
for (const r of restorations) {
  md += `| ${r.seq} | ${r.currentTitle} | ${r.proposedTitle} | ${r.rationale} |\n`;
}

md += `
---

## Part III: Duplicate Title Differentiation

These codex pairs currently share identical titles. We've proposed provisional differentiation. **These specifically need your review** (red in the spreadsheet):

`;

const duplicates = rows.filter(r => r.titleChanged && r.changeSource === 'proposed');
const dupPairs = new Map();
for (const r of duplicates) {
  const key = r.currentTitle;
  if (!dupPairs.has(key)) dupPairs.set(key, []);
  dupPairs.get(key).push(r);
}

for (const [title, pair] of dupPairs) {
  md += `### "${title}"\n\n`;
  for (const r of pair) {
    md += `- **Seq ${r.seq}** (${r.wordCount} words): Proposed → *${r.proposedTitle}* — ${r.rationale}\n`;
  }
  md += '\n';
}

md += `---

## Part IV: Tone Markers

48 codexes already have tone markers from their cover images. For the remaining ${rows.filter(r => r.toneInferred).length}, we inferred markers based on title themes and content analysis. These are highlighted in **yellow** in the spreadsheet.

The existing tone marker taxonomy has 29 distinct values. We used only existing values for inference — no new markers were invented. If you feel a codex deserves a new marker not in the current set, please write it in.

### Existing Tone Marker Families

- **Threshold family**: Threshold, Threshold Trust, Harmonic Threshold
- **Harmonic family**: Harmonic Structures, Harmonic Intelligence, Harmonic Integrity, Harmonic Reciprocity
- **Relational family**: Relational Emergence, Relational Integration, Relational Gravity, "Relational, Quietly Foundational"
- **Field family**: Field Embodiment, Field Attunement
- **Bridge family**: The Bridge, Bridge Crossers
- **Coherence family**: Coherent Invitation, Everyday Coherence
- **Other**: Dialogues, Fractal Return, Unified Relational Insight, Becoming the You, InterBeing Dialogue, Invitational Resonance, Definitions, Devotional Precision, Stillpoint, Still Spiral, "Mythic - Remembered - Dissolution", "Grounded, Infinitesimal"

---

## Part V: New Fields

Two entirely new fields are proposed for every codex:

### Structural Role

Based on your observation that codexes play different structural roles in the lattice:

| Role | Description | Count |
|---|---|---|
`;

const roleCounts = {};
for (const r of rows) {
  roleCounts[r.structuralRole] = (roleCounts[r.structuralRole] || 0) + 1;
}
for (const [role, count] of Object.entries(roleCounts).sort((a, b) => b[1] - a[1])) {
  const descriptions = {
    'standalone': 'Independent transmission, not part of a series',
    'series-member': 'Part of a named series with siblings',
    'glossary': 'Definitional or reference material',
    'guide': 'Short practical guide or micro-practice',
    'bridge': 'Connects two architectures or concepts',
    'paper': 'Longer-form paper or essay',
    'interlude': 'Dialogic interlude or conversational piece',
    'nucleus': 'Core concept that radiates into other codexes',
  };
  md += `| \`${role}\` | ${descriptions[role] || ''} | ${count} |\n`;
}

md += `
### Tags

Flexible, multiple tags per codex derived from title and subtitle themes. These are meant to enable future filtering and search. Current tag vocabulary:

`;

const tagCounts = {};
for (const r of rows) {
  for (const tag of r.tags.split(', ').filter(Boolean)) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  md += `- \`${tag}\` (${count})\n`;
}

md += `
---

## Part VI: Series Position Corrections

| Seq | Series | Was | Corrected To | Reason |
|---|---|---|---|---|
`;

for (const r of rows.filter(r => r.seriesPosChanged)) {
  md += `| ${r.seq} | ${r.series} | ${r.currentSeriesPos} | ${r.proposedSeriesPos} | ${r.rationale} |\n`;
}

md += `
---

## Part VII: Still Open (from May audit)

These questions from the original audit remain open. They are not addressed in the spreadsheet but are noted here for completeness:

1. **Codex VI: The Function of Presence** — partially developed, never completed. Status: \`planned\`
2. **The Codex of the Spiral Species** — planned but never written. Status: \`planned\`
3. **The Codex of Primal Trust** — currently embedded across multiple codexes. Formalize as standalone?
4. **The Evolution of the Sovereign cover** — orphan cover image, likely a series introduction
5. **Realized Flame subtitles** — you indicated preference for subtitles over "Part I/II" but haven't specified them yet
6. **Cover art text removal** — you approved the Photoshop approach. We will proceed when ready.

---

## How to Use This Document

1. Open **proposed-changes.xlsx** alongside this markdown
2. Scan the spreadsheet by color — focus on yellow, orange, and red cells
3. Edit any cell you disagree with
4. Return the edited spreadsheet
5. We will diff your edits against our proposals and build the final data structure

Thank you, James.
`;

const mdPath = path.join(ANALYSIS, 'proposed-changes.md');
fs.writeFileSync(mdPath, md, 'utf-8');
console.log(`Wrote ${mdPath}`);
