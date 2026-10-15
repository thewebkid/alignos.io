import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const provenance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-provenance.json'), 'utf-8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));
const legacy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'legacy-urls.json'), 'utf-8'));
const PUBLIC_DIR = path.join(ROOT, 'client', 'public');
const vercelPath = path.join(ROOT, 'vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));

const catalogIds = new Set(catalog.map((e) => e.id));
const errors = [];

// vercel.json has trailingSlash: false, so requests arrive without the trailing slash.
const normalizeSource = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
// Vercel sources are path-to-regexp patterns.
const escapeSource = (p) => p.replace(/[()[\]{}*+?:]/g, (c) => `\\${c}`);

function checkDestination(row) {
  const dest = row.destination.split('?')[0];
  const codex = dest.match(/^\/codex\/([^/]+)$/);
  if (codex && !catalogIds.has(codex[1])) errors.push(`${row.source}: unknown catalog id "${codex[1]}"`);
  if (dest.startsWith('/pdf/') && !fs.existsSync(path.join(PUBLIC_DIR, dest))) errors.push(`${row.source}: missing file ${dest}`);
  if (row.id && !catalogIds.has(row.id)) errors.push(`${row.source}: unknown catalog id "${row.id}"`);
}

const staticRedirects = [{ source: '/about', destination: '/', statusCode: 301 }];

if (legacy.unmatched?.length) {
  for (const u of legacy.unmatched) errors.push(`unmatched legacy URL: ${u.source}`);
}

const legacyRedirects = [];
let skippedSelf = 0;
for (const row of legacy.rows) {
  if (!row.destination) {
    errors.push(`${row.source}: no destination`);
    continue;
  }
  checkDestination(row);
  const source = normalizeSource(row.source);
  if (source === row.destination) {
    skippedSelf++;
    continue;
  }
  legacyRedirects.push({ source: escapeSource(source), destination: row.destination, statusCode: 301 });
}

const idRedirects = [];
for (const row of provenance) {
  if (row.change_type !== 'id_change') continue;
  if (!row.old_value || !row.new_value || row.old_value === row.new_value) continue;
  idRedirects.push({ source: `/codex/${row.old_value}`, destination: `/codex/${row.new_value}`, statusCode: 301 });
}
idRedirects.sort((a, b) => a.source.localeCompare(b.source));

const bySource = new Map();
let duplicates = 0;
for (const r of [...staticRedirects, ...legacyRedirects, ...idRedirects]) {
  const prev = bySource.get(r.source);
  if (!prev) {
    bySource.set(r.source, r);
  } else if (prev.destination === r.destination) {
    duplicates++;
  } else {
    errors.push(`conflicting redirects for ${r.source}: ${prev.destination} vs ${r.destination}`);
  }
}

if (errors.length) {
  console.error(`Redirect generation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

vercel.redirects = [...bySource.values()];
fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n', 'utf-8');

const kinds = legacy.rows.reduce((acc, r) => ((acc[r.kind] = (acc[r.kind] || 0) + 1), acc), {});
console.log(
  `Wrote ${vercel.redirects.length} redirects to vercel.json: ` +
    `${staticRedirects.length} static, ${legacyRedirects.length} legacy (${JSON.stringify(kinds)}; ${skippedSelf} same-path pages left to trailingSlash), ` +
    `${idRedirects.length} codex id, ${duplicates} duplicate${duplicates === 1 ? '' : 's'} dropped`
);
