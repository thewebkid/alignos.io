/**
 * Build the machine-facing layer: what an AI reader needs to find, read, and cite Alignos.
 *
 * Writes into public/ (all git-ignored):
 *   bundles/{collection-id}.md       one file per lattice collection, codexes in collection order
 *   bundles/series/{series-id}.md    one file per series with published members, in position order
 *   pages/{slug}.md                  guidance pages, prompts as quotes and collections as linked lists
 *   llms.txt, llms-full.txt, llms.json
 *
 * Everything about the work itself is James' text (home lines, pull quotes, notes, codex bodies).
 * Our words are limited to navigation and the fixed orientation below. Bundles never carry the
 * AI-written catalog descriptions; llms.json carries them with metadataStatus.
 *
 * Runs after build-lattice.js, which produces the generated files read here.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripLeadingCoverImage } from '../src/lib/markdown-export.js';
import { CANONICAL_BASE, codexUrl } from './canonical.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(__dirname, '..');
const GENERATED = path.join(CLIENT, 'src', 'generated');
const PAGES_SRC = path.join(CLIENT, 'src', 'content', 'pages');
const PUBLIC = path.join(CLIENT, 'public');
const MD_DIR = path.join(PUBLIC, 'md');
const BUNDLE_DIR = path.join(PUBLIC, 'bundles');
const PAGES_OUT = path.join(PUBLIC, 'pages');

const AUTHOR_LINE = 'James Mahu with Lumina';
const CONTACT = 'info@alignos.io';
const SUMMARY = 'Alignos is a field of remembrance. Not a system to follow, but a resonance to return to.';
const ATTRIBUTION = `Texts by ${AUTHOR_LINE}. The canonical source is ${CANONICAL_BASE}; each codex below links to its page there.`;

// Guidance pages in reading order. Titles match the site's page titles.
const PAGES = [
  { slug: 'before-you-begin', title: 'Before You Begin…', start: true },
  { slug: 'return-room', title: 'Begin a Return Room', start: true },
  { slug: 'faq', title: 'Return Room FAQ', start: true },
  { slug: 'between-worlds', title: 'Between Worlds' },
  { slug: 'arc-of-difference', title: 'The Arc of Difference' },
  { slug: 'papers', title: 'Papers' },
];

const url = (p) => `${CANONICAL_BASE}${p}`;
const corridorUrl = (id) => url(`/lattice?series=${id}`);
const bundleUrl = (id) => url(`/bundles/${id}.md`);
const seriesBundleUrl = (id) => url(`/bundles/series/${id}.md`);
const mdUrl = (id) => url(`/md/${id}.md`);
const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(GENERATED, file), 'utf-8'));
const write = (rel, text) => {
  const file = path.join(PUBLIC, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return Buffer.byteLength(text);
};

function orientation(codexCount) {
  return [
    `The codex texts are by ${AUTHOR_LINE}. The live site, ${CANONICAL_BASE}, is the canonical source.`,
    'Tone markers, descriptions, tags, structural roles, and series placements are AI-assisted readings of the texts. They are hypotheses, not source truth. The texts themselves are the source.',
    'Entries with metadataStatus "draft" in llms.json have not yet been reviewed by the author.',
    `When pointing a person to a codex, give its reader link (${CANONICAL_BASE}/codex/{id}) and attribute quotations to ${AUTHOR_LINE}.`,
    `There are ${codexCount} published codexes. For focused reading, fetch single codexes at /md/{id}.md or a reading bundle; llms-full.txt holds everything in one large file.`,
  ];
}

// --- Data -------------------------------------------------------------------

const codexes = readJson('codex-lattice-meta.json');
const codexById = new Map(codexes.map((c) => [c.id, c]));
const allSeries = readJson('series.json');
const collections = readJson('collections.json').filter((c) => c.showInLattice);

const bodyCache = new Map();
function codexBody(codex) {
  if (!bodyCache.has(codex.id)) {
    const file = path.join(MD_DIR, codex.originalFileName);
    if (!fs.existsSync(file)) throw new Error(`Missing markdown for ${codex.id} (${file})`);
    bodyCache.set(codex.id, stripLeadingCoverImage(fs.readFileSync(file, 'utf-8')).trim());
  }
  return bodyCache.get(codex.id);
}

// Members in position order, with planned positions in place and unplaced members last.
function seriesEntries(s) {
  const placed = [
    ...s.members.map((m) => ({ position: m.position, codex: codexById.get(m.id) })),
    ...s.planned.map((p) => ({ position: p.position, planned: p })),
  ].sort((a, b) => a.position - b.position);
  return [...placed, ...s.unplacedIds.map((id) => ({ position: null, codex: codexById.get(id) }))];
}

const collectionIdsByCodex = new Map();
for (const col of collections) {
  for (const item of col.items) {
    const ids = item.kind === 'series' ? item.memberIds : [item.id];
    for (const id of ids) {
      if (!collectionIdsByCodex.has(id)) collectionIdsByCodex.set(id, []);
      if (!collectionIdsByCodex.get(id).includes(col.id)) collectionIdsByCodex.get(id).push(col.id);
    }
  }
}

const publishedSeries = allSeries.filter((s) => s.members.length || s.unplacedIds.length);
const seriesLabel = (s) => (s.total ? `${s.written} of ${s.total} written` : `${s.written} written`);

// --- Bundles ----------------------------------------------------------------

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

function codexSection(codex, { note = null, label = null, prefix = '' } = {}) {
  const body = demoteHeadings(codexBody(codex));
  // A page label that extends the title ("… (optional)") is James' guidance and stays in the heading.
  const suffix = label?.startsWith(codex.title) ? label.slice(codex.title.length) : '';
  const [first, ...rest] = body.split('\n');
  const head = /^##\s/.test(first)
    ? [`## ${prefix}${first.replace(/^##\s+/, '')}${suffix}`]
    : [`## ${prefix}${codex.title}${suffix}`, '', first];
  return [...head, '', `<${codexUrl(codex.id)}>`, '', ...(note ? [`> ${note}`, ''] : []), ...rest]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function collectionBundle(collection) {
  const parts = [`# ${collection.title}`];
  if (collection.subtitle) parts.push(collection.subtitle);
  if (collection.intro) parts.push(collection.intro);
  parts.push(ATTRIBUTION);

  for (const item of collection.items) {
    if (item.kind === 'series') {
      parts.push('---', `## ${item.title} (series)\n\n<${corridorUrl(item.id)}>${item.note ? `\n\n> ${item.note}` : ''}`);
      for (const id of item.memberIds) parts.push('---', codexSection(codexById.get(id)));
    } else {
      parts.push('---', codexSection(codexById.get(item.id), { note: item.note, label: item.label }));
    }
  }
  return `${parts.join('\n\n')}\n`;
}

function seriesBundle(s) {
  const parts = [`# ${s.name}`, `<${corridorUrl(s.id)}>`, `${seriesLabel(s)}.`, ATTRIBUTION];
  for (const entry of seriesEntries(s)) {
    const prefix = entry.position ? `${entry.position}. ` : '';
    if (entry.planned) {
      parts.push('---', `## ${prefix}${entry.planned.title} (not yet written)`);
    } else {
      parts.push('---', codexSection(entry.codex, { prefix }));
    }
  }
  return `${parts.join('\n\n')}\n`;
}

// --- Pages ------------------------------------------------------------------

function collectionAsMarkdown(col) {
  const styles = new Map(col.groups.map((g) => [g.id, g.style]));
  const lines = [];
  let n = 0;
  let lastGroup;
  for (const item of col.items) {
    if (item.group !== lastGroup) {
      if (lines.length) lines.push('');
      n = 0;
      lastGroup = item.group;
    }
    const numbered = (styles.get(item.group) ?? 'numbered') === 'numbered';
    const marker = numbered ? `${++n}.` : '-';
    const link = item.kind === 'series' ? corridorUrl(item.id) : codexUrl(item.id);
    lines.push(`${marker} [${item.label}](${link})${item.kind === 'series' ? ' (series)' : ''}`);
    const pad = ' '.repeat(marker.length + 1);
    if (item.series) lines.push(`${pad}${item.series.name}${item.series.position ? `, part ${item.series.position} of ${item.series.total}` : ''}`);
    if (item.tagline) lines.push(`${pad}*${item.tagline}*`);
    for (const p of (item.note ?? '').split('\n\n').filter(Boolean)) lines.push('', `${pad}${p}`);
  }
  if (col.offerBundle) lines.push('', `All of these readings in one file: <${bundleUrl(col.id)}>`);
  return lines.join('\n');
}

function pageForMachines(slug) {
  const src = fs.readFileSync(path.join(PAGES_SRC, `${slug}.md`), 'utf-8').replace(/\r\n/g, '\n');
  const colById = new Map(readJson('collections.json').map((c) => [c.id, c]));
  return src
    .replace(/```prompt\n([\s\S]*?)\n```/g, (_, text) =>
      `“${text}”`.split('\n').map((l) => `> ${l}`).join('\n'))
    .replace(/```collection\n\s*([\w-]+)\s*\n```/g, (_, id) => {
      const col = colById.get(id);
      if (!col) throw new Error(`pages/${slug}.md: unknown collection "${id}"`);
      return collectionAsMarkdown(col);
    })
    .replace(/\]\((\/[^)\s]*)\)/g, (_, p) => `](${url(p)})`)
    .replace(/^(# .+)$/m, `$1\n\n<${url(`/${slug}`)}>`)
    .trim() + `\n\n---\n\nContact (shown in the site footer): ${CONTACT}\n`;
}

// --- Write ------------------------------------------------------------------

fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
fs.rmSync(PAGES_OUT, { recursive: true, force: true });

const bundleSizes = [];
for (const col of collections) {
  bundleSizes.push([`bundles/${col.id}.md`, write(`bundles/${col.id}.md`, collectionBundle(col))]);
}
for (const s of publishedSeries) {
  bundleSizes.push([`bundles/series/${s.id}.md`, write(`bundles/series/${s.id}.md`, seriesBundle(s))]);
}

const pageTexts = new Map();
for (const page of PAGES) {
  const text = pageForMachines(page.slug);
  pageTexts.set(page.slug, text);
  write(`pages/${page.slug}.md`, text);
}

const orient = orientation(codexes.length);
const seriesMembership = (codex) => (codex.series ? { id: codex.series.id, name: codex.series.name, position: codex.series.position ?? null, total: codex.series.total ?? null } : null);

// llms-full.txt
const seriesListing = publishedSeries.map((s) => [
  `## ${s.name} (${seriesLabel(s)})`,
  '',
  `<${corridorUrl(s.id)}>`,
  '',
  ...seriesEntries(s).map((e) => {
    const pos = e.position ? `${e.position}. ` : '- ';
    return e.planned ? `${pos}${e.planned.title} (not yet written)` : `${pos}${e.codex.title} <${codexUrl(e.codex.id)}>`;
  }),
].join('\n'));

const fullParts = [
  '# Alignos',
  `> ${SUMMARY}`,
  orient.join('\n\n'),
  '---',
  '# Guidance pages',
  ...PAGES.map((p) => demoteHeadings(pageTexts.get(p.slug).trim())),
  '---',
  '# Series',
  ...seriesListing,
  '---',
  `# Codexes (${codexes.length})`,
  ...codexes.map((c) => {
    const s = c.series;
    const context = s ? `Series: ${s.name}${s.position ? `, part ${s.position} of ${s.total ?? '?'}` : ''}` : null;
    return [
      '---',
      `## ${c.title}`,
      `${AUTHOR_LINE} · ${codexUrl(c.id)}`,
      ...(context ? [context] : []),
      '',
      demoteHeadings(codexBody(c).replace(/^#\s.*\n+/, '')),
    ].join('\n');
  }),
];
const fullSize = write('llms-full.txt', `${fullParts.join('\n\n')}\n`);

// llms.json
const metaSize = fs.statSync(path.join(GENERATED, 'codex-lattice-meta.json')).size;
const latticeSize = fs.statSync(path.join(GENERATED, 'codex-lattice.json')).size;
const llmsJson = {
  name: 'Alignos',
  baseUrl: CANONICAL_BASE,
  generatedAt: new Date().toISOString(),
  summary: SUMMARY,
  orientation: orient,
  endpoints: {
    llms_txt: { url: '/llms.txt', description: 'Start here: orientation and links to every page, codex, series, collection, and bundle.' },
    llms_full: { url: '/llms-full.txt', size: kb(fullSize), description: 'Guidance pages, series listing, and the full text of every published codex in one file.' },
    metadata: { url: '/api/codex-lattice-meta', method: 'GET', size: kb(metaSize), description: `Index of all ${codexes.length} codexes: titles, series, keywords, tone markers, metadata status.` },
    full_lattice: { url: '/api/codex-lattice', method: 'GET', size: kb(latticeSize), description: `All ${codexes.length} codexes with full markdown.` },
    single_codex: { url: '/api/codex/{id}', method: 'GET', description: 'One codex with full markdown.' },
    codex_markdown: { url: '/md/{id}.md', description: 'Markdown of one codex, headed by its title, author, and canonical URL.' },
    page_markdown: { url: '/pages/{slug}.md', description: 'Markdown of a guidance page, with prompts as quotes and reading lists as links.' },
    bundles: { url: '/bundles/{collection-id}.md and /bundles/series/{series-id}.md', description: 'Several codexes in one attributed markdown file.' },
  },
  human_links: {
    pattern: `${CANONICAL_BASE}/codex/{id}`,
    with_section: `${CANONICAL_BASE}/codex/{id}#{section-anchor}`,
    note: 'Give people these reader links, not API URLs. Section anchors come from markdown headings (lowercase, hyphenated).',
  },
  pages: PAGES.map((p) => ({ slug: p.slug, title: p.title, url: url(`/${p.slug}`), markdownUrl: url(`/pages/${p.slug}.md`) })),
  codexes: codexes.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    author: c.author,
    sequence: c.sequence,
    toneMarker: c.toneMarker,
    structuralRole: c.structuralRole,
    series: seriesMembership(c),
    collections: collectionIdsByCodex.get(c.id) ?? [],
    tags: c.tags,
    pullQuote: c.pullQuote,
    description: c.description,
    metadataStatus: c.metadataStatus,
    readerUrl: codexUrl(c.id),
    markdownUrl: mdUrl(c.id),
  })),
  series: allSeries.map((s) => ({
    id: s.id,
    name: s.name,
    total: s.total,
    written: s.written,
    corridorUrl: corridorUrl(s.id),
    bundleUrl: publishedSeries.includes(s) ? seriesBundleUrl(s.id) : null,
    members: seriesEntries(s).map((e) =>
      e.planned
        ? { position: e.position, title: e.planned.title, status: 'not yet written' }
        : { position: e.position, id: e.codex.id, title: e.codex.title, status: 'published', readerUrl: codexUrl(e.codex.id) }),
    companionIds: s.companionIds,
  })),
  collections: collections.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    bundleUrl: bundleUrl(c.id),
    codexIds: c.items.flatMap((i) => (i.kind === 'series' ? i.memberIds : [i.id])),
  })),
  bundles: bundleSizes.map(([rel, size]) => ({ url: url(`/${rel}`), size: kb(size) })),
};
write('llms.json', `${JSON.stringify(llmsJson, null, 2)}\n`);

// llms.txt
const link = (title, href, note) => `- [${title}](${href})${note ? `: ${note}` : ''}`;
const txt = [
  '# Alignos',
  '',
  `> ${SUMMARY}`,
  '',
  ...orient.flatMap((l) => [l, '']),
  '## Start here',
  '',
  ...PAGES.filter((p) => p.start).map((p) => link(p.title, url(`/pages/${p.slug}.md`), `page at ${url(`/${p.slug}`)}`)),
  '',
  '## Pages',
  '',
  link('Home', url('/'), 'the three invitations: Story, Sanctuary, Library'),
  ...PAGES.filter((p) => !p.start).map((p) => link(p.title, url(`/pages/${p.slug}.md`), `page at ${url(`/${p.slug}`)}`)),
  link('Codex Lattice', url('/lattice'), 'browse every codex by series and collection'),
  '',
  `## Codexes (${codexes.length})`,
  '',
  `Each link is the codex as markdown; the reader page is ${CANONICAL_BASE}/codex/{id}. Notes are the codex's own words.`,
  '',
  ...codexes.map((c) => link(c.title, mdUrl(c.id), [c.pullQuote ? `“${c.pullQuote.replace(/\s+/g, ' ').trim()}”` : null, `reader: ${codexUrl(c.id)}`].filter(Boolean).join(' · '))),
  '',
  '## Series',
  '',
  ...publishedSeries.flatMap((s) => [
    link(s.name, corridorUrl(s.id), `${seriesLabel(s)} · bundle: ${seriesBundleUrl(s.id)}`),
    ...seriesEntries(s).map((e) => {
      const pos = e.position ? `${e.position}. ` : '';
      return e.planned
        ? `  - ${pos}${e.planned.title} (not yet written)`
        : `  - ${pos}[${e.codex.title}](${mdUrl(e.codex.id)})`;
    }),
  ]),
  '',
  '## Collections and bundles',
  '',
  ...collections.map((c) => link(c.title, bundleUrl(c.id), `${c.subtitle ? `${c.subtitle} · ` : ''}one file · browse: ${url(`/lattice?collection=${c.id}`)}`)),
  '',
  '## API',
  '',
  link('llms.json', url('/llms.json'), 'everything here as JSON, with per-codex tone, series, collections, and metadata status'),
  link('Codex index', url('/api/codex-lattice-meta'), `JSON, ${kb(metaSize)}`),
  link('Full lattice', url('/api/codex-lattice'), `JSON with full markdown, ${kb(latticeSize)}`),
  link('Single codex', url('/api/codex/{id}'), 'JSON'),
  '',
  '## Optional',
  '',
  link('llms-full.txt', url('/llms-full.txt'), `guidance pages and the full text of all ${codexes.length} codexes, ${kb(fullSize)}`),
  '',
].join('\n');
write('llms.txt', txt);

console.log(`AI layer: ${bundleSizes.length} bundles, ${PAGES.length} pages, llms.txt, llms.json, llms-full.txt (${kb(fullSize)})`);
for (const [rel, size] of bundleSizes) console.log(`  ${rel}: ${kb(size)}`);
