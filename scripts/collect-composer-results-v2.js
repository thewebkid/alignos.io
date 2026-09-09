import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const TRANSCRIPTS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.cursor', 'projects', 'c-src-alignos-io', 'agent-transcripts',
  '6dd3ca22-52b4-4cb6-8c69-4b679aacb4ad', 'subagents'
);

// Load batch metadata to map positions back to original IDs
const batchMeta = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-batch-meta.json'), 'utf-8'));

// Build a flat ordered list of all codexes as they appear in batches
const orderedCodexes = [];
for (const batch of batchMeta) {
  for (const codex of batch.codexes) {
    orderedCodexes.push(codex);
  }
}

// Extract all JSON arrays from all transcripts
const allArrays = [];
const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl'));

for (const file of files) {
  const filepath = path.join(TRANSCRIPTS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.role === 'assistant' && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === 'text' && block.text) {
            // Extract JSON from code blocks
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

console.log(`Found ${allArrays.length} JSON arrays from transcripts`);

// Now match each result to the original catalog ID using title matching
const { parse } = await import('csv-parse/sync');
const catalog = parse(
  fs.readFileSync(path.join(ROOT, 'analysis', 'codex-catalog-edit-1.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, relax_column_count: true }
).filter(r => r.seq && r.id);

// Build title -> catalog entry lookup
const titleToEntry = new Map();
for (const entry of catalog) {
  titleToEntry.set(entry.title.trim().toLowerCase(), entry);
}

// Build seq -> catalog entry lookup
const seqToEntry = new Map();
for (const entry of catalog) {
  seqToEntry.set(entry.seq.trim(), entry);
}

// Flatten all results and match to original IDs
const finalResults = new Map();

for (const arr of allArrays) {
  for (const result of arr) {
    // Try to match by finding the catalog entry
    let catalogEntry = null;

    // Try matching by the seq if embedded in the batch data
    for (const oc of orderedCodexes) {
      // Match by checking if the result id is derived from the catalog title
      const cleanTitle = oc.title.toLowerCase()
        .replace(/[''""":?!.,;()]/g, '')
        .replace(/—/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (result.id === cleanTitle || result.id === oc.id ||
          result.id.includes(cleanTitle.substring(0, 20)) ||
          cleanTitle.includes(result.id.substring(0, 20))) {
        catalogEntry = seqToEntry.get(String(oc.seq));
        break;
      }
    }

    if (!catalogEntry) {
      // Try fuzzy title match
      for (const [title, entry] of titleToEntry) {
        const resultIdNorm = result.id.replace(/-/g, ' ');
        if (title.includes(resultIdNorm.substring(0, 15)) ||
            resultIdNorm.includes(title.substring(0, 15))) {
          catalogEntry = entry;
          break;
        }
      }
    }

    if (catalogEntry) {
      const origId = catalogEntry.id.trim();
      const seq = parseInt(catalogEntry.seq);
      finalResults.set(origId, {
        ...result,
        original_id: origId,
        seq,
      });
    } else {
      // Keep with composer-generated ID, mark as unmatched
      if (!finalResults.has(result.id)) {
        finalResults.set(result.id, { ...result, original_id: null, seq: null });
      }
    }
  }
}

const sorted = [...finalResults.values()].sort((a, b) => (a.seq || 999) - (b.seq || 999));

const outputPath = path.join(DATA, 'composer-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));

const matched = sorted.filter(r => r.original_id);
const unmatched = sorted.filter(r => !r.original_id);

console.log(`\nTotal results: ${sorted.length}`);
console.log(`Matched to catalog: ${matched.length}`);
console.log(`Unmatched: ${unmatched.length}`);
if (unmatched.length > 0) {
  console.log('Unmatched IDs:');
  for (const u of unmatched) console.log('  ', u.id);
}

// Stats
const roles = {};
const entryPoints = {};
for (const r of sorted) {
  if (r.structural_role) roles[r.structural_role] = (roles[r.structural_role] || 0) + 1;
  if (r.entry_point) entryPoints[r.entry_point] = (entryPoints[r.entry_point] || 0) + 1;
}
console.log('\nStructural roles:', JSON.stringify(roles));
console.log('Entry points:', JSON.stringify(entryPoints));
console.log(`Unique tone markers: ${new Set(sorted.map(r => r.tone_marker)).size}`);
