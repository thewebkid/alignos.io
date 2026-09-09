import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const ANALYSIS = path.join(ROOT, 'analysis');
const TRANSCRIPTS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.cursor', 'projects', 'c-src-alignos-io', 'agent-transcripts',
  '6dd3ca22-52b4-4cb6-8c69-4b679aacb4ad', 'subagents'
);

// Load catalog
const catalog = parse(
  fs.readFileSync(path.join(ANALYSIS, 'codex-catalog-edit-1.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

// Load batch metadata for positional matching
const batches = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-batches.json'), 'utf-8'));
const batchMeta = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-batch-meta.json'), 'utf-8'));

// Extract all JSON arrays from transcripts
const allArrays = [];
const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl'));

for (const file of files) {
  const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.role === 'assistant' && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === 'text' && block.text) {
            const jsonMatches = block.text.match(/```json\s*([\s\S]*?)```/g);
            if (jsonMatches) {
              for (const match of jsonMatches) {
                const jsonStr = match.replace(/```json\s*/, '').replace(/```/, '').trim();
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tone_marker) {
                    allArrays.push(parsed);
                  }
                } catch (e) { /* skip */ }
              }
            }
          }
        }
      }
    } catch (e) { /* skip */ }
  }
}

console.log(`Found ${allArrays.length} result arrays from ${files.length} transcripts`);

// Match results to catalog entries using batch position
// Each batch array should have exactly 4-5 entries matching the batch metadata
const resultsByOrigId = new Map();

for (const arr of allArrays) {
  // Find which batch this array corresponds to by matching array length and checking IDs
  let matchedBatch = null;

  for (let bi = 0; bi < batchMeta.length; bi++) {
    const bm = batchMeta[bi];
    if (bm.codexes.length === arr.length) {
      // Check if at least one ID roughly matches
      let matchScore = 0;
      for (let i = 0; i < arr.length; i++) {
        const resultId = arr[i].id.toLowerCase().replace(/-/g, '');
        const batchTitle = bm.codexes[i].title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const batchId = bm.codexes[i].id.toLowerCase().replace(/-/g, '');
        if (resultId.includes(batchTitle.substring(0, 12)) ||
            batchTitle.includes(resultId.substring(0, 12)) ||
            resultId.includes(batchId.substring(0, 12)) ||
            batchId.includes(resultId.substring(0, 12))) {
          matchScore++;
        }
      }
      if (matchScore >= Math.floor(arr.length / 2)) {
        matchedBatch = bi;
        break;
      }
    }
  }

  if (matchedBatch !== null) {
    const bm = batchMeta[matchedBatch];
    for (let i = 0; i < arr.length && i < bm.codexes.length; i++) {
      const origId = bm.codexes[i].id;
      const seq = bm.codexes[i].seq;
      resultsByOrigId.set(origId, {
        ...arr[i],
        original_id: origId,
        seq,
      });
    }
  } else {
    // Fallback: try individual title matching
    for (const result of arr) {
      for (const entry of catalog) {
        const resultId = result.id.toLowerCase().replace(/-/g, ' ');
        const entryTitle = entry.title.trim().toLowerCase();
        const entryId = entry.id.trim().toLowerCase().replace(/-/g, ' ');
        if (resultId.includes(entryTitle.substring(0, 15)) ||
            entryTitle.includes(resultId.substring(0, 15)) ||
            resultId.includes(entryId.substring(0, 15)) ||
            entryId.includes(resultId.substring(0, 15))) {
          if (!resultsByOrigId.has(entry.id.trim())) {
            resultsByOrigId.set(entry.id.trim(), {
              ...result,
              original_id: entry.id.trim(),
              seq: parseInt(entry.seq),
            });
          }
          break;
        }
      }
    }
  }
}

const sorted = [...resultsByOrigId.values()].sort((a, b) => a.seq - b.seq);
console.log(`\nMatched ${sorted.length} of ${catalog.length} codexes`);

// Find any still missing
const matchedIds = new Set(sorted.map(r => r.original_id));
const missing = catalog.filter(r => !matchedIds.has(r.id.trim()));
if (missing.length > 0) {
  console.log(`Missing ${missing.length}:`);
  for (const m of missing) console.log(`  seq ${m.seq}: ${m.id.trim()}`);
}

// Write final analysis
const outputPath = path.join(DATA, 'composer-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
console.log(`\nWrote ${outputPath} (${sorted.length} entries)`);

// Stats
const toneMarkers = new Set(sorted.map(r => r.tone_marker));
const roles = {};
const entryPoints = {};
for (const r of sorted) {
  roles[r.structural_role] = (roles[r.structural_role] || 0) + 1;
  entryPoints[r.entry_point] = (entryPoints[r.entry_point] || 0) + 1;
}
console.log(`Unique tone markers: ${toneMarkers.size}`);
console.log('Structural roles:', JSON.stringify(roles));
console.log('Entry points:', JSON.stringify(entryPoints));
console.log('With descriptions:', sorted.filter(r => r.description).length);
console.log('With pull_quotes:', sorted.filter(r => r.pull_quote).length);
