import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const provenance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-provenance.json'), 'utf-8'));
const vercelPath = path.join(ROOT, 'vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));

const seen = new Set();
const idRedirects = [];

for (const row of provenance) {
  if (row.change_type !== 'id_change') continue;
  if (!row.old_value || !row.new_value || row.old_value === row.new_value) continue;
  const key = `${row.old_value}→${row.new_value}`;
  if (seen.has(key)) continue;
  seen.add(key);
  idRedirects.push({
    source: `/codex/${row.old_value}`,
    destination: `/codex/${row.new_value}`,
    statusCode: 301,
  });
}

idRedirects.sort((a, b) => a.source.localeCompare(b.source));

const staticRedirects = [
  { source: '/about', destination: '/' },
];

vercel.redirects = [...staticRedirects, ...idRedirects];
fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n', 'utf-8');

console.log(`Wrote ${idRedirects.length} id redirects to vercel.json (${vercel.redirects.length} total)`);
