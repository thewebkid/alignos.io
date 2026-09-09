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

const allResults = [];
const errors = [];

// Read all subagent transcript files
const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl'));
console.log(`Found ${files.length} transcript files`);

for (const file of files) {
  const filepath = path.join(TRANSCRIPTS_DIR, file);
  const lines = fs.readFileSync(filepath, 'utf-8').split('\n').filter(Boolean);

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      // Look for assistant messages containing JSON arrays
      if (entry.role === 'assistant' && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === 'text' && block.text) {
            // Extract JSON arrays from code blocks or raw text
            const jsonMatches = block.text.match(/```json\s*([\s\S]*?)```/g);
            if (jsonMatches) {
              for (const match of jsonMatches) {
                const jsonStr = match.replace(/```json\s*/, '').replace(/```/, '').trim();
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                      if (item.id && item.tone_marker) {
                        allResults.push(item);
                      }
                    }
                  }
                } catch (e) {
                  // Not valid JSON, skip
                }
              }
            }
            // Also try to find raw JSON arrays (without code blocks)
            const rawMatch = block.text.match(/^\s*\[[\s\S]*\]\s*$/m);
            if (rawMatch) {
              try {
                const parsed = JSON.parse(rawMatch[0]);
                if (Array.isArray(parsed)) {
                  for (const item of parsed) {
                    if (item.id && item.tone_marker && !allResults.find(r => r.id === item.id)) {
                      allResults.push(item);
                    }
                  }
                }
              } catch (e) { /* skip */ }
            }
          }
        }
      }
    } catch (e) {
      // Skip malformed lines
    }
  }
}

// Deduplicate by id (keep last occurrence)
const deduped = new Map();
for (const result of allResults) {
  deduped.set(result.id, result);
}

const finalResults = [...deduped.values()];
finalResults.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

const outputPath = path.join(DATA, 'composer-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));

console.log(`Collected ${finalResults.length} unique codex analyses`);
console.log(`Wrote ${outputPath}`);

// Summary stats
const newMarkers = new Set();
const existingMarkers = new Set();
const roles = {};
const entryPoints = {};

for (const r of finalResults) {
  if (r.structural_role) roles[r.structural_role] = (roles[r.structural_role] || 0) + 1;
  if (r.entry_point) entryPoints[r.entry_point] = (entryPoints[r.entry_point] || 0) + 1;
}

console.log('\nStructural roles:', JSON.stringify(roles));
console.log('Entry points:', JSON.stringify(entryPoints));
console.log(`Total tone markers: ${new Set(finalResults.map(r => r.tone_marker)).size} unique values`);
