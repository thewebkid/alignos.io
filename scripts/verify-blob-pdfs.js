/**
 * Verify every catalog PDF is downloadable from the public alignos-blob store.
 *
 * The PDFs are not in Git. If the store and the catalog ids drift apart, readers
 * get "Blob not found" on download. This is the check that would have caught it.
 *
 *   node scripts/verify-blob-pdfs.js                      blob store only
 *   node scripts/verify-blob-pdfs.js --site https://alignos.io   also the /pdf rewrite
 *
 * Exits 1 if any PDF is missing, not application/pdf, or suspiciously small.
 * VITE_BLOB_BASE_URL overrides the store host, same as the client.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));
const BLOB_BASE = (process.env.VITE_BLOB_BASE_URL || 'https://qahh5hlfi6v2odz8.public.blob.vercel-storage.com').replace(/\/$/, '');
const siteArg = process.argv.indexOf('--site');
const SITE = siteArg > -1 ? process.argv[siteArg + 1].replace(/\/$/, '') : null;
const MIN_BYTES = 10_000;

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    const size = Number(res.headers.get('content-length') || 0);
    if (res.status !== 200) return `HTTP ${res.status}`;
    if (!type.includes('pdf')) return `content-type ${type || 'missing'}`;
    if (size < MIN_BYTES) return `only ${size} bytes`;
    return null;
  } catch (err) {
    return `fetch failed: ${err.message}`;
  }
}

const targets = CATALOG.map((c) => ({ id: c.id, rel: c.assets?.pdf }));
const noPath = targets.filter((t) => !t.rel);
const failures = noPath.map((t) => `${t.id}: catalog has no assets.pdf`);

let next = 0;
async function worker() {
  while (next < targets.length) {
    const t = targets[next++];
    if (!t.rel) continue;
    const blob = await check(`${BLOB_BASE}/${t.rel}`);
    if (blob) failures.push(`${t.id}: blob ${blob}  (${BLOB_BASE}/${t.rel})`);
    if (SITE) {
      const site = await check(`${SITE}/${t.rel}`);
      if (site) failures.push(`${t.id}: site ${site}  (${SITE}/${t.rel})`);
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker));

const checked = targets.length - noPath.length;
if (failures.length) {
  console.error(`${failures.length} problem(s) across ${checked} catalog PDFs:`);
  failures.sort().forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log(`OK: ${checked} catalog PDFs resolve on ${BLOB_BASE}${SITE ? ` and through ${SITE}` : ''}`);
