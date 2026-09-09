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

const existing = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-analysis.json'), 'utf-8'));
const existingOrigIds = new Set(existing.map(r => r.original_id));
const batchMeta = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-batch-meta.json'), 'utf-8'));

// Extract all JSON arrays
const allArrays = [];
const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl'));
const codeBlockRe = /```json\s*([\s\S]*?)```/g;

for (const file of files) {
  const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.role !== 'assistant' || !entry.message?.content) continue;
      for (const block of entry.message.content) {
        if (block.type !== 'text' || !block.text) continue;
        let match;
        codeBlockRe.lastIndex = 0;
        while ((match = codeBlockRe.exec(block.text)) !== null) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tone_marker) {
              allArrays.push(parsed);
            }
          } catch (e) { /* skip */ }
        }
      }
    } catch (e) { /* skip */ }
  }
}

console.log(`Total JSON arrays found: ${allArrays.length}`);

// For each batch with missing codexes, try to find matching arrays
for (const bm of batchMeta) {
  const hasMissing = bm.codexes.some(c => !existingOrigIds.has(c.id));
  if (!hasMissing) continue;

  const expectedLen = bm.codexes.length;
  console.log(`\nBatch ${bm.batchIndex}: looking for ${expectedLen} results (missing: ${bm.codexes.filter(c => !existingOrigIds.has(c.id)).map(c => 'seq' + c.seq).join(', ')})`);

  for (const arr of allArrays) {
    if (arr.length !== expectedLen) continue;

    // Check if positionally assigning would conflict with existing
    let conflicts = false;
    let newEntries = 0;
    for (let i = 0; i < arr.length; i++) {
      if (existingOrigIds.has(bm.codexes[i].id)) {
        // Already have this one -- check if it's the same data
        conflicts = false; // Allow overwrite check
      } else {
        newEntries++;
      }
    }

    if (newEntries > 0) {
      // Verify this is the right array by checking first result ID against first batch title
      const firstResultId = arr[0].id.toLowerCase().replace(/[-_]/g, '');
      const firstBatchTitle = bm.codexes[0].title.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check if there's reasonable overlap
      const shorter = firstResultId.length < firstBatchTitle.length ? firstResultId : firstBatchTitle;
      const longer = firstResultId.length >= firstBatchTitle.length ? firstResultId : firstBatchTitle;

      if (longer.includes(shorter.substring(0, Math.min(10, shorter.length)))) {
        console.log(`  Matched via first-entry check`);
        for (let i = 0; i < arr.length; i++) {
          const origId = bm.codexes[i].id;
          if (!existingOrigIds.has(origId)) {
            existing.push({ ...arr[i], original_id: origId, seq: bm.codexes[i].seq });
            existingOrigIds.add(origId);
            console.log(`    Added seq ${bm.codexes[i].seq}: ${origId}`);
          }
        }
        break;
      }
    }
  }
}

existing.sort((a, b) => a.seq - b.seq);
fs.writeFileSync(path.join(DATA, 'composer-analysis.json'), JSON.stringify(existing, null, 2));
console.log(`\nFinal count: ${existing.length} of 134`);

const stillMissing = [];
for (const bm of batchMeta) {
  for (const c of bm.codexes) {
    if (!existingOrigIds.has(c.id)) stillMissing.push(c);
  }
}
if (stillMissing.length > 0) {
  console.log(`Still missing ${stillMissing.length}:`);
  for (const m of stillMissing) console.log(`  seq ${m.seq}: ${m.id}`);
}
