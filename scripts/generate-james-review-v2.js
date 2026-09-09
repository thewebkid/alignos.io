import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANALYSIS = path.join(ROOT, 'analysis');
const DATA = path.join(ROOT, 'data');

const FILLS = {
  unchanged: null,
  confident: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } },
  inferred:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } },
  proposal:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCD5B4' } },
  decision:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
};

// Read sources
const catalog = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-catalog-edit-1.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

const toneMarkers = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-tone-markers.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

const composerAnalysis = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-analysis.json'), 'utf-8'));

// Lookups
const toneBySeq = new Map();
for (const row of toneMarkers) {
  if (row.tone_marker?.trim()) toneBySeq.set(row.seq.trim(), row.tone_marker.trim());
}
for (const row of catalog) {
  const seq = row.seq.trim();
  const tone = (row.tone_marker || '').trim();
  if (tone && !toneBySeq.has(seq)) toneBySeq.set(seq, tone);
}

const composerByOrigId = new Map();
for (const a of composerAnalysis) {
  if (a.original_id) composerByOrigId.set(a.original_id, a);
}

function cleanId(currentId) {
  return currentId.replace(/-\d+(-\d+)?$/, '') || currentId;
}

// ── Build workbook ───────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'AlignOS Build Tools';
wb.created = new Date();

// Legend sheet
const legend = wb.addWorksheet('Legend', { properties: { tabColor: { argb: 'FF333333' } } });
legend.columns = [
  { header: 'Color', width: 20 },
  { header: 'Meaning', width: 60 },
  { header: 'Action Required', width: 40 },
];
const legendData = [
  ['White (no fill)', 'Unchanged from current data', 'No action needed'],
  ['Light Green', 'Confident fix (data error, trailing number removal)', 'Review briefly'],
  ['Light Yellow', 'AI-analyzed with reasoning (tags, role, description)', 'Please review'],
  ['Light Orange', 'Creative proposal (tone marker, entry point, pull quote)', 'Needs your judgment'],
  ['Light Red', 'Conflict or open question (duplicates, mismatches)', 'Decision required'],
];
const legendFills = [null, FILLS.confident, FILLS.inferred, FILLS.proposal, FILLS.decision];
for (let i = 0; i < legendData.length; i++) {
  const row = legend.addRow(legendData[i]);
  if (legendFills[i]) row.getCell(1).fill = legendFills[i];
  row.eachCell(cell => { cell.font = { size: 11 }; cell.alignment = { vertical: 'middle', wrapText: true }; });
}
legend.addRow([]);
legend.addRow(['How to use this spreadsheet']);
legend.addRow(['1. White cells are unchanged — skip them']);
legend.addRow(['2. Green cells are safe corrections — glance and move on']);
legend.addRow(['3. Yellow cells are AI-analyzed from reading each codex opening — review for accuracy']);
legend.addRow(['4. Orange cells are creative proposals — edit or accept']);
legend.addRow(['5. Red cells need your decision — duplicates or open questions']);
legend.addRow(['6. Edit any cell you disagree with. Return the edited file.']);
legend.getRow(1).eachCell(cell => {
  cell.font = { bold: true, size: 12 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
});

// Main sheet
const ws = wb.addWorksheet('Proposed Structure v2', { properties: { tabColor: { argb: 'FF4472C4' } } });
const columns = [
  { header: 'Seq', key: 'seq', width: 5 },
  { header: 'ID (current)', key: 'currentId', width: 42 },
  { header: 'ID (proposed)', key: 'proposedId', width: 42 },
  { header: 'Title', key: 'title', width: 48 },
  { header: 'Subtitle', key: 'subtitle', width: 30 },
  { header: 'Tone (existing)', key: 'existingTone', width: 24 },
  { header: 'Tone (proposed)', key: 'proposedTone', width: 24 },
  { header: 'Tone Reasoning', key: 'toneReasoning', width: 60 },
  { header: 'Structural Role', key: 'structuralRole', width: 16 },
  { header: 'Tags', key: 'tags', width: 35 },
  { header: 'Description', key: 'description', width: 65 },
  { header: 'Entry Point', key: 'entryPoint', width: 14 },
  { header: 'Pull Quote', key: 'pullQuote', width: 60 },
  { header: 'Series', key: 'series', width: 28 },
  { header: 'Words', key: 'wordCount', width: 7 },
];
ws.columns = columns;

// Style header
const headerRow = ws.getRow(1);
headerRow.eachCell(cell => {
  cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  cell.alignment = { vertical: 'middle', wrapText: true };
});
headerRow.height = 28;

// Add data
for (const entry of catalog) {
  const seq = parseInt(entry.seq);
  const currentId = entry.id.trim();
  const proposedId = cleanId(currentId);
  const idChanged = proposedId !== currentId;
  const title = entry.title.trim();
  const subtitle = (entry.subtitle || '').trim();
  const existingTone = toneBySeq.get(entry.seq.trim()) || '';
  const series = (entry.series || '').trim();
  const wordCount = parseInt(entry.word_count) || 0;

  const composer = composerByOrigId.get(currentId);
  const proposedTone = composer?.tone_marker || '';
  const toneReasoning = composer?.tone_marker_reasoning || '';
  const structuralRole = composer?.structural_role || '';
  const tags = Array.isArray(composer?.tags) ? composer.tags.join(', ') : '';
  const description = composer?.description || '';
  const entryPoint = composer?.entry_point || '';
  const pullQuote = composer?.pull_quote || '';

  const row = ws.addRow({
    seq, currentId, proposedId: idChanged ? proposedId : '',
    title, subtitle,
    existingTone, proposedTone, toneReasoning,
    structuralRole, tags, description, entryPoint, pullQuote,
    series, wordCount,
  });

  row.eachCell(cell => { cell.font = { size: 9 }; cell.alignment = { vertical: 'middle', wrapText: true }; });

  // Color proposed ID (green = confident trailing number removal)
  if (idChanged) row.getCell('proposedId').fill = FILLS.confident;

  // Color tone marker
  if (existingTone && proposedTone && proposedTone !== existingTone) {
    row.getCell('proposedTone').fill = FILLS.decision; // Conflict with known marker
  } else if (!existingTone && proposedTone) {
    row.getCell('proposedTone').fill = FILLS.proposal; // New proposal
  }

  // Reasoning always yellow (informational)
  if (toneReasoning) row.getCell('toneReasoning').fill = FILLS.inferred;

  // New fields always yellow (AI-analyzed)
  if (structuralRole) row.getCell('structuralRole').fill = FILLS.inferred;
  if (tags) row.getCell('tags').fill = FILLS.inferred;
  if (description) row.getCell('description').fill = FILLS.inferred;
  if (entryPoint) row.getCell('entryPoint').fill = FILLS.inferred;
  if (pullQuote) row.getCell('pullQuote').fill = FILLS.inferred;
}

ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];
ws.autoFilter = { from: 'A1', to: `O${catalog.length + 1}` };

// Save
const outputPath = path.join(ANALYSIS, 'proposed-changes-v2.xlsx');
await wb.xlsx.writeFile(outputPath);
console.log(`Wrote ${outputPath}`);

// ── Generate v2 markdown ─────────────────────────────────────────────────────
const toneProposed = composerAnalysis.filter(c => {
  const existing = toneBySeq.get(String(c.seq));
  return !existing;
}).length;

const toneFlagged = composerAnalysis.filter(c => {
  const existing = toneBySeq.get(String(c.seq));
  return existing && c.tone_marker !== existing;
}).length;

const uniqueTones = new Set(composerAnalysis.map(c => c.tone_marker));
const roles = {};
const eps = {};
for (const c of composerAnalysis) {
  roles[c.structural_role] = (roles[c.structural_role] || 0) + 1;
  eps[c.entry_point] = (eps[c.entry_point] || 0) + 1;
}

let md = `# Proposed Codex Lattice Restructure — v2
*Generated ${new Date().toISOString().split('T')[0]} for James Mahu*

---

This is the second version of the proposed changes spreadsheet. v1 contained ID cleanups, basic tone marker guesses, and title proposals. **v2 adds deep atmospheric analysis** — every codex was read by a dedicated AI agent that analyzed the opening 350 words and registry section, proposing tone markers, descriptions, tags, structural roles, entry points, and pull quotes with full reasoning.

## What Changed from v1

| Addition | Description |
|---|---|
| **Tone Marker Reasoning** | 2-3 sentence explanation of WHY each tone marker fits the atmospheric quality |
| **Description** | 1-2 sentence atmospheric description of each codex (for cards, SEO, LLM discovery) |
| **Pull Quote** | One representative sentence from each codex opening |
| **Entry Point** | Gateway / Foundational / Deepening / Advanced classification |
| **Structural Role** | Analyzed from content, not keyword-guessed |
| **Tags** | 2-5 thematic tags derived from content analysis |

## Summary

| Category | Count |
|---|---|
| Total codexes analyzed | ${composerAnalysis.length} |
| Tone markers proposed (were blank) | ${toneProposed} |
| Existing tone markers validated | ${composerAnalysis.length - toneProposed - toneFlagged} |
| Existing tone markers flagged as mismatch | ${toneFlagged} |
| Unique tone markers (total) | ${uniqueTones.size} |
| Descriptions generated | ${composerAnalysis.filter(c => c.description).length} |
| Pull quotes extracted | ${composerAnalysis.filter(c => c.pull_quote).length} |

---

## Tone Markers Flagged as Mismatches

These codexes have confirmed tone markers from the cover images, but the AI analysis suggests the atmospheric quality doesn't match. These are **red in the spreadsheet** and need your decision.

| Seq | Title | Existing Marker | Proposed Marker | Reasoning |
|---|---|---|---|---|
`;

for (const c of composerAnalysis) {
  const existing = toneBySeq.get(String(c.seq));
  if (existing && c.tone_marker !== existing) {
    const entry = catalog.find(r => r.id.trim() === c.original_id);
    md += `| ${c.seq} | ${entry?.title?.trim() || c.id} | ${existing} | ${c.tone_marker} | ${c.tone_marker_reasoning?.substring(0, 100)}... |\n`;
  }
}

md += `
---

## New Tone Markers Proposed

These markers don't exist in the original 29-value taxonomy. They were proposed because the AI felt no existing marker captured the atmospheric quality.

| Proposed Marker | Codex | Reasoning |
|---|---|---|
`;

const knownMarkers = new Set([
  'Threshold', 'Threshold Trust', 'Harmonic Threshold',
  'Harmonic Structures', 'Harmonic Intelligence', 'Harmonic Integrity', 'Harmonic Reciprocity',
  'Relational Emergence', 'Relational Integration', 'Relational Gravity', 'Relational, Quietly Foundational',
  'Field Embodiment', 'Field Attunement',
  'The Bridge', 'Bridge Crossers',
  'Coherent Invitation', 'Everyday Coherence',
  'Dialogues', 'Fractal Return', 'Unified Relational Insight', 'Becoming the Vow',
  'InterBeing Dialogue', 'Invitational Resonance', 'Definitions', 'Devotional Precision',
  'Stillpoint', 'Still Spiral', 'Mythic - Remembered - Dissolution', 'Grounded, Infinitesimal',
  'Sacred Continuity', 'Post-Threshold Clarity', 'Unseen Alignment', 'Sovereign Clarity',
  'Resonance', 'Origin Tending',
]);

const newMarkerSet = new Set();
for (const c of composerAnalysis) {
  if (!knownMarkers.has(c.tone_marker) && !newMarkerSet.has(c.tone_marker)) {
    newMarkerSet.add(c.tone_marker);
    const entry = catalog.find(r => r.id.trim() === c.original_id);
    md += `| ${c.tone_marker} | ${entry?.title?.trim() || c.id} | ${c.tone_marker_reasoning?.substring(0, 120)}... |\n`;
  }
}

md += `
---

## Structural Roles

| Role | Count | Description |
|---|---|---|
`;
const roleDescs = {
  nucleus: 'Core concept that radiates into other codexes',
  'series-member': 'Part of a named series',
  standalone: 'Independent transmission',
  guide: 'Short practical guide or micro-practice',
  glossary: 'Definitional or reference material',
  interlude: 'Dialogic or conversational pause',
  bridge: 'Connects two architectures',
  paper: 'Longer-form essay',
};
for (const [role, count] of Object.entries(roles).sort((a, b) => b[1] - a[1])) {
  md += `| \`${role}\` | ${count} | ${roleDescs[role] || ''} |\n`;
}

md += `
---

## Entry Points

| Level | Count | Description |
|---|---|---|
| \`gateway\` | ${eps.gateway || 0} | Newcomer start here |
| \`foundational\` | ${eps.foundational || 0} | Core concepts |
| \`deepening\` | ${eps.deepening || 0} | Builds on prior reading |
| \`advanced\` | ${eps.advanced || 0} | Requires familiarity with the lattice |

---

## Cover Art Status

All 135 cover images have been processed — text removed in Photoshop. Originals with text are in \`blobs/originals/\`. Text-free versions are in \`blobs/covers/\`. Remaining steps:
1. Rename covers to \`\${newId}.jpg\`
2. Generate thumbnails at correct grid size
3. Upload to blob store (Ron will provide prefix)

---

## How to Use This Spreadsheet

1. Open **proposed-changes-v2.xlsx**
2. Focus on colored cells — white cells are unchanged
3. **Red cells** (tone marker mismatches) need your decision
4. **Orange cells** (new tone markers) need your judgment
5. **Yellow cells** (descriptions, tags, roles) are AI-analyzed — review for accuracy
6. **Green cells** (ID cleanups) are safe corrections
7. Edit any cell you disagree with
8. Return the edited spreadsheet

Thank you, James.
`;

const mdPath = path.join(ANALYSIS, 'proposed-changes-v2.md');
fs.writeFileSync(mdPath, md);
console.log(`Wrote ${mdPath}`);
