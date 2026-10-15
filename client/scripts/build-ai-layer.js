/**
 * Build files for bringing Alignos texts to an AI.
 *
 * Writes public/bundles/{collection-id}.md for every collection shown in the lattice:
 * the collection title and intro, an attribution line, then each codex's full markdown in
 * collection order (series items expand to their published members), each preceded by
 * James' note and its canonical reader URL. Bundles carry James' text only, never the
 * AI-written catalog descriptions.
 *
 * Runs after build-lattice.js, which produces the generated files read here.
 * Machine outputs cite canonical URLs (ALIGNOS_CANONICAL_BASE, default https://alignos.io)
 * even on preview deployments, so the live site stays the canonical source.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(__dirname, '..');
const GENERATED = path.join(CLIENT, 'src', 'generated');
const MD_DIR = path.join(CLIENT, 'public', 'md');
const BUNDLE_DIR = path.join(CLIENT, 'public', 'bundles');
const CANONICAL_BASE = (process.env.ALIGNOS_CANONICAL_BASE || 'https://alignos.io').replace(/\/$/, '');

const ATTRIBUTION = `Texts by James Mahu with Lumina. The canonical source is ${CANONICAL_BASE}; each codex below links to its page there.`;

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(GENERATED, file), 'utf-8'));

// Codex files start at h1; inside a bundle they sit one level below the bundle title.
function demoteHeadings(markdown) {
  let inFence = false;
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (inFence) return line;
      return line.replace(/^(#{1,5})(?=\s)/, '#$1');
    })
    .join('\n');
}

function codexSection(codex, note, label) {
  const file = path.join(MD_DIR, codex.originalFileName.endsWith('.md') ? codex.originalFileName : `${codex.originalFileName}.md`);
  if (!fs.existsSync(file)) throw new Error(`Bundle: missing markdown for ${codex.id} (${file})`);
  const body = demoteHeadings(fs.readFileSync(file, 'utf-8').trim());
  const url = `${CANONICAL_BASE}/codex/${codex.id}`;
  // The codex's own title heading leads the section; the URL and James' note follow it.
  // A page label that extends the title ("… (optional)") is James' guidance and stays in the heading.
  const suffix = label?.startsWith(codex.title) ? label.slice(codex.title.length) : '';
  const [first, ...rest] = body.split('\n');
  const head = /^##\s/.test(first) ? [`${first}${suffix}`] : [`## ${codex.title}${suffix}`, '', first];
  return [...head, '', `<${url}>`, '', ...(note ? [`> ${note}`, ''] : []), ...rest]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildBundle(collection, codexById) {
  const parts = [`# ${collection.title}`];
  if (collection.subtitle) parts.push(collection.subtitle);
  if (collection.intro) parts.push(collection.intro);
  parts.push(ATTRIBUTION);

  for (const item of collection.items) {
    if (item.kind === 'series') {
      parts.push('---', `## ${item.title} (series)\n\n<${CANONICAL_BASE}/lattice?series=${item.id}>${item.note ? `\n\n> ${item.note}` : ''}`);
      for (const id of item.memberIds) parts.push('---', codexSection(codexById.get(id), null, null));
    } else {
      parts.push('---', codexSection(codexById.get(item.id), item.note, item.label));
    }
  }
  return `${parts.join('\n\n')}\n`;
}

const codexById = new Map(readJson('codex-lattice-meta.json').map((c) => [c.id, c]));
const collections = readJson('collections.json').filter((c) => c.showInLattice);

fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
fs.mkdirSync(BUNDLE_DIR, { recursive: true });
for (const collection of collections) {
  const text = buildBundle(collection, codexById);
  fs.writeFileSync(path.join(BUNDLE_DIR, `${collection.id}.md`), text);
  console.log(`Bundle ${collection.id}.md: ${Math.round(Buffer.byteLength(text) / 1024)} KB`);
}
