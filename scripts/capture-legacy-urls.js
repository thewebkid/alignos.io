/**
 * Capture every known legacy WordPress alignos.io URL and map it to its new home.
 *
 * Sources:
 *   - page-sitemap.xml (live) + pages known only from captures (e.g. /lostpassword/)
 *   - wp-content/uploads/**.pdf links on every legacy page (live) and in analysis/legacy-pages/*.md
 *   - ripple-sitemap.xml (live), using each post's cover image to identify the codex
 *
 * Writes data/legacy-urls.json. Rows that cannot be matched land in `unmatched`;
 * resolve them by adding entries to MANUAL below and re-running.
 *
 * Usage: node scripts/capture-legacy-urls.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://alignos.io';
const CAPTURES_DIR = path.join(ROOT, 'analysis', 'legacy-pages');
const PUBLIC_PDF_DIR = path.join(ROOT, 'client', 'public', 'pdf');
const OUT_PATH = path.join(ROOT, 'data', 'legacy-urls.json');

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));

const PAGE_DESTINATIONS = {
  '/': null,
  '/codex-lattice/': { destination: '/lattice', kind: 'page' },
  '/contact/': { destination: '/faq', kind: 'page' },
  '/newsletter/': { destination: '/', kind: 'retired', note: 'Newsletter discontinued' },
  '/login/': { destination: '/', kind: 'retired', note: 'No accounts on the new site' },
  '/lostpassword/': { destination: '/', kind: 'retired', note: 'No accounts on the new site' },
  '/return-room/': { destination: '/return-room', kind: 'page' },
  '/before-you-begin/': { destination: '/before-you-begin', kind: 'page' },
  '/between-worlds/': { destination: '/between-worlds', kind: 'page' },
  '/papers/': { destination: '/papers', kind: 'page' },
  '/faq/': { destination: '/faq', kind: 'page' },
  '/arc-of-difference/': { destination: '/arc-of-difference', kind: 'page' },
};

const EXTRA_PAGES = ['/lostpassword/'];

/** Hand resolutions keyed by legacy source path: { destination, kind, note? } or { id, kind, note? }. */
const MANUAL = {
  '/ripple/living-glossary/': { id: 'the-living-glossary-of-the-field', kind: 'ripple' },
  '/ripple/codex-of-the-agency-of-one-vol-2/': { id: 'the-codex-of-the-agency-of-one-vol-ii', kind: 'ripple' },
  '/ripple/the-evolution-of-the-sovereign/': {
    destination: '/lattice?series=the-evolution-of-the-sovereign',
    kind: 'ripple',
    note: 'Series compilation post; no single codex',
  },
};

const kebab = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stripExt = (name) => name.replace(/\.[a-z0-9]+$/i, '');
const stripSizeSuffix = (name) => name.replace(/-\d+x\d+$/, '');
const stripTrailingNumber = (key) => key.replace(/-\d+$/, '');
const stripLeadingArticle = (key) => key.replace(/^the-/, '');

function keyVariants(raw) {
  const base = kebab(raw);
  const out = new Set([base]);
  for (const k of [...out]) out.add(stripTrailingNumber(k));
  for (const k of [...out]) out.add(stripTrailingNumber(k));
  for (const k of [...out]) out.add(stripLeadingArticle(k));
  out.delete('');
  return [...out];
}

function buildIndex() {
  const index = new Map();
  const add = (key, target) => {
    if (!index.has(key)) index.set(key, new Map());
    index.get(key).set(target.ref, target);
  };
  for (const entry of catalog) {
    const target = { ref: `codex:${entry.id}`, id: entry.id, pdf: entry.assets?.pdf ? `/${entry.assets.pdf}` : null };
    const p = entry.provenance || {};
    const names = [entry.id, entry.title, p.old_id, p.original_title, p.old_cover_filename && stripExt(p.old_cover_filename)];
    for (const name of names.filter(Boolean)) for (const k of keyVariants(name)) add(k, target);
  }
  const catalogPdfs = new Set(catalog.map((e) => e.assets?.pdf && path.basename(e.assets.pdf)).filter(Boolean));
  for (const file of fs.readdirSync(PUBLIC_PDF_DIR)) {
    if (!file.endsWith('.pdf') || catalogPdfs.has(file)) continue;
    const target = { ref: `file:${file}`, id: null, pdf: `/pdf/${file}` };
    for (const k of keyVariants(stripExt(file))) add(k, target);
  }
  return index;
}

function lookup(index, rawNames) {
  for (const raw of rawNames) {
    for (const key of keyVariants(raw)) {
      const hits = index.get(key);
      if (!hits) continue;
      const targets = [...hits.values()];
      if (targets.length === 1) return { target: targets[0], key };
      return { ambiguous: targets.map((t) => t.id || t.pdf), key };
    }
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'alignos-legacy-capture/1.0' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim(),
    images: [...block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1].trim()),
  }));
}

const toPath = (url) => {
  const u = new URL(url, ORIGIN);
  return decodeURIComponent(u.pathname);
};

const PDF_RE = /(?:https?:\/\/(?:www\.)?alignos\.io)?\/wp-content\/uploads\/[^\s"'<>()]+?\.pdf/gi;

function pdfLinks(text) {
  return [...text.matchAll(PDF_RE)].map((m) => toPath(m[0]));
}

/** Legacy lattice grid cards: <li ... data-title="{ripple slug, truncated ~30 chars}"> … first PDF href. */
function latticeCards(html) {
  const cards = [];
  for (const part of html.split(/<li\s/).slice(1)) {
    const title = part.match(/^[^>]*data-title="([^"]+)"/)?.[1];
    const pdf = pdfLinks(part)[0];
    if (title && pdf) cards.push({ title, pdf });
  }
  return cards;
}

function cardPdfFor(cards, slug) {
  const exact = cards.filter((c) => c.title === slug);
  const hits = exact.length ? exact : cards.filter((c) => slug.startsWith(c.title));
  const pdfs = [...new Set(hits.map((c) => c.pdf))];
  return pdfs.length === 1 ? pdfs[0] : null;
}

async function main() {
  const index = buildIndex();
  const rows = new Map();
  const unmatched = [];
  const fuzzy = [];
  const pdfSeenOn = new Map();

  const resolveManual = (source) => {
    const m = MANUAL[source];
    if (!m) return null;
    if (m.id) {
      const entry = catalog.find((e) => e.id === m.id);
      if (!entry) throw new Error(`MANUAL ${source}: unknown catalog id ${m.id}`);
      return { destination: m.kind === 'pdf' ? `/${entry.assets.pdf}` : `/codex/${m.id}`, kind: m.kind, id: m.id, note: m.note };
    }
    return { destination: m.destination, kind: m.kind, note: m.note };
  };

  const addRow = (row) => {
    const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v != null));
    rows.set(row.source, clean);
  };

  // Pages
  const pageXml = await fetchText(`${ORIGIN}/page-sitemap.xml`);
  const pagePaths = [...new Set([...sitemapEntries(pageXml).map((e) => toPath(e.loc)), ...EXTRA_PAGES])];
  for (const source of pagePaths) {
    const manual = resolveManual(source);
    const mapped = manual || PAGE_DESTINATIONS[source];
    if (mapped === null) continue;
    if (!mapped) {
      unmatched.push({ source, kind: 'page', reason: 'No destination in PAGE_DESTINATIONS' });
      continue;
    }
    addRow({ source, destination: mapped.destination, kind: mapped.kind, note: mapped.note });
  }

  // PDFs: live pages + saved captures
  let cards = [];
  for (const source of pagePaths) {
    try {
      const html = await fetchText(`${ORIGIN}${source}`);
      if (source === '/codex-lattice/') cards = latticeCards(html);
      for (const p of pdfLinks(html)) pdfSeenOn.set(p, pdfSeenOn.get(p) || `live ${source}`);
    } catch (err) {
      console.warn(`  ! could not fetch ${source}: ${err.message}`);
    }
  }
  for (const file of fs.readdirSync(CAPTURES_DIR).filter((f) => f.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(CAPTURES_DIR, file), 'utf-8');
    for (const p of pdfLinks(text)) pdfSeenOn.set(p, pdfSeenOn.get(p) || `capture ${file}`);
  }

  for (const [source, seenOn] of [...pdfSeenOn].sort(([a], [b]) => a.localeCompare(b))) {
    const manual = resolveManual(source);
    if (manual) {
      addRow({ source, ...manual });
      continue;
    }
    const name = stripExt(path.posix.basename(source));
    const hit = lookup(index, [name]);
    if (hit?.target?.pdf) {
      addRow({ source, destination: hit.target.pdf, kind: 'pdf', id: hit.target.id });
      if (hit.key !== kebab(name)) fuzzy.push(`  ${name}  →  ${hit.target.id || hit.target.pdf}  (via "${hit.key}")`);
    } else {
      unmatched.push({
        source,
        kind: 'pdf',
        seen_on: seenOn,
        reason: hit?.ambiguous ? `Ambiguous key "${hit.key}"` : hit?.target ? 'Matched codex has no PDF' : 'No catalog match',
        candidates: hit?.ambiguous,
      });
    }
  }

  // Ripple posts
  const rippleXml = await fetchText(`${ORIGIN}/ripple-sitemap.xml`);
  for (const { loc, images } of sitemapEntries(rippleXml)) {
    const source = toPath(loc);
    const manual = resolveManual(source);
    if (manual) {
      addRow({ source, ...manual });
      continue;
    }
    const slug = source.replace(/^\/ripple\//, '').replace(/\/$/, '');
    const cardPdf = cardPdfFor(cards, slug);
    const cardId = cardPdf && rows.get(cardPdf)?.id;
    if (cardId) {
      addRow({ source, destination: `/codex/${cardId}`, kind: 'ripple', id: cardId });
      continue;
    }
    const imageNames = images.map((u) => stripSizeSuffix(stripExt(path.posix.basename(toPath(u)))));
    const hit = lookup(index, [...imageNames, slug]);
    if (hit?.target?.id) fuzzy.push(`  ${source}  →  ${hit.target.id}  (no lattice card; via "${hit.key}")`);
    if (hit?.target?.id) {
      addRow({ source, destination: `/codex/${hit.target.id}`, kind: 'ripple', id: hit.target.id });
    } else {
      unmatched.push({
        source,
        kind: 'ripple',
        images: imageNames,
        reason: hit?.ambiguous ? `Ambiguous key "${hit.key}"` : 'No catalog match',
        candidates: hit?.ambiguous,
      });
    }
  }

  const kindOrder = { page: 0, retired: 1, pdf: 2, ripple: 3 };
  const sorted = [...rows.values()].sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.source.localeCompare(b.source));
  const out = { rows: sorted };
  if (unmatched.length) out.unmatched = unmatched;
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf-8');

  const counts = sorted.reduce((acc, r) => ((acc[r.kind] = (acc[r.kind] || 0) + 1), acc), {});
  console.log(`Wrote ${sorted.length} rows to ${path.relative(ROOT, OUT_PATH)}`, counts, `(${cards.length} lattice cards)`);
  if (fuzzy.length) console.log(`${fuzzy.length} non-exact matches (review):\n${fuzzy.join('\n')}`);
  if (unmatched.length) {
    console.log(`${unmatched.length} unmatched:`);
    for (const u of unmatched) console.log(`  [${u.kind}] ${u.source} — ${u.reason}${u.candidates ? ` (${u.candidates.join(', ')})` : ''}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
