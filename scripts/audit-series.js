/**
 * Audit series and editions against James' own text, and write the question list.
 *
 * Reads data/codex-catalog.json, data/series.json and client/public/md/*.md.
 * Prints findings and writes docs/review/james-questions.md (overwrites it; hand edits
 * belong after generation).
 *
 * Usage: node scripts/audit-series.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSeries, kebab } from '../client/scripts/series-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codex-catalog.json'), 'utf-8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'series.json'), 'utf-8'));
const MD_DIR = path.join(ROOT, 'client', 'public', 'md');
const OUT_PATH = path.join(ROOT, 'docs', 'review', 'james-questions.md');

const bySeq = [...catalog].sort((a, b) => a.sequence - b.sequence);
const byId = new Map(catalog.map((e) => [e.id, e]));
const markdown = new Map(catalog.map((e) => [e.id, fs.readFileSync(path.join(MD_DIR, `${e.id}.md`), 'utf-8')]));
const { errors, published } = resolveSeries(catalog, registry);
const seriesById = new Map(published.map((s) => [s.id, s]));

const labelIndex = new Map();
for (const rec of registry) for (const label of [rec.name, ...(rec.aliases || [])]) labelIndex.set(kebab(label), rec.id);

const WORD_NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
const toNum = (t) => {
  const s = String(t).toLowerCase();
  return WORD_NUMS[s] ?? ROMAN[s] ?? (/^\d+$/.test(s) ? Number(s) : null);
};

/** Series claims printed in a codex: registry "Series:" lines and "Series Preface:" headings. */
function seriesClaims(md) {
  const claims = [];
  const all = md.split('\n');
  const nextValue = (i) => all.slice(i + 1, i + 4).find((l) => l.trim())?.trim() ?? '';
  all.forEach((line, i) => {
    const reg = line.match(/^\s*(?:[-*]\s*)?\*\*(?:Codex\s+)?(Series|Type)(?::\*\*|\*\*:)\s*(.*?)\s*$/i);
    const pre = line.match(/^#{2,3}\s*Series Preface:\s*(.+?)\s*$/i);
    let raw = pre?.[1];
    if (reg) {
      raw = reg[2] || nextValue(i);
      if (/^type$/i.test(reg[1]) && !/series/i.test(raw)) return;
    }
    if (!raw) return;
    const text = raw.replace(/\*+/g, '').trim();
    const numbering = text.match(/\b(?:codex|part|entry)?\s*([ivx]+|\d+|one|two|three|four|five|six|seven|eight)\s+of\s+([ivx]+|\d+|one|two|three|four|five|six|seven|eight)\b/i);
    const entry = text.match(/\(Entry\s+([ivx]+)\)/i);
    const name = text.replace(/\s*[—–-]\s*Codex\s+\w+\s+of\s+\w+.*$/i, '').replace(/\s*\(.*?\)\s*$/, '').replace(/\s*[—–-]\s*Volume\s+\w+$/i, '').trim();
    claims.push({
      line: i + 1,
      kind: pre ? 'preface' : 'registry',
      text,
      name,
      seriesId: labelIndex.get(kebab(name)) ?? null,
      position: numbering ? toNum(numbering[1]) : entry ? toNum(entry[1]) : null,
      total: numbering ? toNum(numbering[2]) : null,
    });
  });
  return claims;
}

const headingSet = (md) =>
  new Set(md.split('\n').filter((l) => /^#{2,3} /.test(l)).map((l) => kebab(l.replace(/^#+\s*/, ''))).filter((h) => h && !/^(codex-)?registry/.test(h)));
const h1 = (md) => kebab(md.split('\n').find((l) => l.startsWith('# '))?.slice(2) ?? '');
const paragraphSet = (md) => new Set(md.split(/\n\s*\n/).map((p) => kebab(p)).filter((p) => p.length > 40));
const overlap = (a, b) => {
  const inter = [...a].filter((x) => b.has(x)).length;
  return Math.min(a.size, b.size) ? inter / Math.min(a.size, b.size) : 0;
};
const jaccard = (a, b) => {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
};

// Claims vs. placements
const conflicts = [];
const unknownSeries = new Map();
for (const e of bySeq) {
  const own = e.series ? labelIndex.get(kebab(e.series.name)) : null;
  for (const c of seriesClaims(markdown.get(e.id))) {
    const where = `seq ${e.sequence} *${e.title}* L${c.line}`;
    if (!c.seriesId) {
      if (!unknownSeries.has(c.name)) unknownSeries.set(c.name, []);
      unknownSeries.get(c.name).push(`${where} (${c.kind}: "${c.text}")`);
      continue;
    }
    const isCompanion = (seriesById.get(c.seriesId)?.companionIds || []).includes(e.id);
    if (c.seriesId !== own && !isCompanion) {
      conflicts.push(`${where}: ${c.kind} names "${c.text}" (→ ${seriesById.get(c.seriesId).name}); catalog places it in ${e.series ? `${e.series.name}` : 'no series'}${e.later_edition_id ? ` (earlier edition of ${e.later_edition_id})` : ''}.`);
    } else if (c.seriesId === own && c.kind === 'registry') {
      if (c.position != null && e.series.position != null && c.position !== e.series.position) {
        conflicts.push(`${where}: registry numbering "${c.text}" says position ${c.position}; catalog has ${e.series.position} of ${e.series.total ?? '?'}.`);
      }
      if (c.total != null && e.series.total != null && c.total !== e.series.total) {
        conflicts.push(`${where}: registry numbering "${c.text}" says ${c.total} parts; registry total is ${e.series.total}.`);
      }
    }
  }
}

// Edition candidates
const linked = new Set(catalog.filter((e) => e.later_edition_id).map((e) => [e.id, e.later_edition_id].sort().join('|')));
const editionCandidates = [];
const headingsById = new Map(catalog.map((e) => [e.id, headingSet(markdown.get(e.id))]));
const paragraphsById = new Map(catalog.map((e) => [e.id, paragraphSet(markdown.get(e.id))]));
for (let i = 0; i < bySeq.length; i++) {
  for (let j = i + 1; j < bySeq.length; j++) {
    const a = bySeq[i], b = bySeq[j];
    const sameH1 = h1(markdown.get(a.id)) && h1(markdown.get(a.id)) === h1(markdown.get(b.id));
    const sameTitle = kebab(a.title) === kebab(b.title);
    const ha = headingsById.get(a.id), hb = headingsById.get(b.id);
    const jac = ha.size >= 4 && hb.size >= 4 ? jaccard(ha, hb) : 0;
    if (sameH1 || sameTitle || jac >= 0.8) {
      const textOverlap = overlap(paragraphsById.get(a.id), paragraphsById.get(b.id));
      editionCandidates.push({ a, b, sameH1, sameTitle, jac, textOverlap, linked: linked.has([a.id, b.id].sort().join('|')) });
    }
  }
}

// Sequence vacancies
const seqs = new Set(catalog.map((e) => e.sequence));
const maxSeq = Math.max(...seqs);
const vacancies = [];
for (let s = 1; s <= maxSeq; s++) if (!seqs.has(s)) vacancies.push(s);

// ---------- Report ----------
const title = (id) => byId.get(id)?.title ?? id;
const lines = [];
const push = (...l) => lines.push(...l);

push(
  '# Questions for James',
  '',
  '> Generated by `scripts/audit-series.js` from `data/series.json`, `data/codex-catalog.json`, and the codex texts. Re-running overwrites this file; add framing after generation.',
  '',
  'Everything below is something we inferred, could not place, or found stated two different ways in your own text. Each item cites where we found it. Nothing here was written by us into the codices themselves.',
  ''
);

push('## 1. Corridors as we have them', '');
for (const s of published) {
  push(`### ${s.name}${s.needsReview ? ' *(needs your review)*' : ''}`, '');
  if (s.aliases.length) push(`Also called: ${s.aliases.map((a) => `"${a}"`).join(', ')}.`, '');
  const slots = new Map();
  for (const m of s.members) slots.set(m.position, `${title(m.id)}`);
  for (const p of s.planned) slots.set(p.position, `*${p.title}* — not yet written`);
  const maxPos = Math.max(s.total ?? 0, ...slots.keys(), 0);
  for (let p = 1; p <= maxPos; p++) push(`${p}. ${slots.get(p) ?? '**(no codex known for this position)**'}`);
  if (s.unplacedIds.length) push('', `Also in this series, position unknown: ${s.unplacedIds.map((id) => `*${title(id)}*`).join(', ')}.`);
  if (s.companionIds.length) push('', `Companion: ${s.companionIds.map((id) => `*${title(id)}*`).join(', ')}.`);
  if (s.compilationPdf) push('', `Compilation PDF: \`${s.compilationPdf}\`.`);
  push('', `Source: ${s.source}.`);
  if (s.reviewNotes) push('', `Notes: ${s.reviewNotes}`);
  push('');
}

push('## 2. Works you have named but not yet written', '');
for (const s of published) for (const p of s.planned) {
  push(`- **${p.title}**${p.subtitle ? ` — "${p.subtitle}"` : ''}: position ${p.position} of ${s.total ?? '?'} in *${s.name}*. Source: ${p.source}. Shown on the site as a "Not yet written" card inside the corridor only. Is the title still right, and is it still coming?`);
}
push('');

push('## 3. Positions and totals we could not determine', '');
const unknowns = [];
for (const s of published) {
  if (s.total == null) unknowns.push(`- *${s.name}*: no total is stated anywhere we found.`);
  for (const id of s.unplacedIds) unknowns.push(`- *${title(id)}* names *${s.name}* but no text places it. Where does it belong in the order, if anywhere?`);
}
push(...(unknowns.length ? unknowns : ['- None.']), '');

push('## 4. Where your texts disagree with each other', '');
push('Registry lines and preface headings that name a different series, or number a codex differently, than the corridor we built from the series prefaces.', '');
push(...(conflicts.length ? conflicts.map((c) => `- ${c}`) : ['- None.']), '');
if (unknownSeries.size) {
  push('Series names printed in the codices that are not corridors on the site:', '');
  for (const [name, where] of [...unknownSeries].sort(([a], [b]) => a.localeCompare(b))) push(`- **"${name}"**: ${where.join('; ')}`);
  push('');
}
push('On the website:', '');
push('- The home page blurb for *The Fundamental Arc* begins "This series traces the great curve of return…", but the catalog has it as a single codex in no series. We kept your words as written. Is it a series, or should the blurb say "This Codex"?');
push('- On the Begin a Return Room page we changed one sentence of yours. "We invite you to upload these PDFs to your AI" now reads "We invite you to share these Codices with your AI". Every codex can now be read in the browser, and plain text serves an AI far better than PDF: the thirteen readings are 9 MB as PDFs and about 237 KB as text. The page now offers the readings as a single text file for your AI. Does the new wording sit right with you?');
push('- We removed download lines that pointed readers to PDFs: "Download the full Codex:" at the end of Between Worlds, and "Click to download." after The Fundamental Arc on The Arc of Difference. Readers now go to each codex\'s page, where it can be read (and translated) in the browser, and the PDF is offered there. Is that all right with you?', '');

push('## 5. Two editions of the same work', '');
push('Both editions stay readable. The one we believe is earlier is marked "Earlier edition" and links to the later one, which holds the series position. Please confirm which is later.', '');
const basisOf = (c) =>
  [c.sameH1 && 'same opening heading', c.sameTitle && 'same catalog title', c.jac >= 0.8 && `section headings ${Math.round(c.jac * 100)}% alike`, `${Math.round(c.textOverlap * 100)}% of paragraphs shared`]
    .filter(Boolean)
    .join(', ');
const label = (e) => `*${e.title}* (seq ${e.sequence}, \`${e.id}\`)`;
for (const c of editionCandidates.filter((x) => x.linked)) {
  const earlier = c.a.later_edition_id === c.b.id ? c.a : c.b;
  const later = earlier === c.a ? c.b : c.a;
  push(`- ${label(earlier)} → earlier edition of ${label(later)}. Basis: ${basisOf(c)}.`);
}
const unlinkedPairs = editionCandidates.filter((x) => !x.linked && x.textOverlap >= 0.5);
if (unlinkedPairs.length) {
  push('', 'Largely the same text, but we could not tell which came first, so neither is marked yet:', '');
  for (const c of unlinkedPairs) push(`- ${label(c.a)} and ${label(c.b)}. Basis: ${basisOf(c)}. Which is the later edition, or are both meant to stand?`);
}
const titleOnly = editionCandidates.filter((x) => !x.linked && x.textOverlap < 0.5);
if (titleOnly.length) {
  push('', 'Share a title or opening heading but are different texts (not editions). Is the heading intended?', '');
  for (const c of titleOnly) push(`- ${label(c.a)} and ${label(c.b)}. Basis: ${basisOf(c)}.`);
}
push('');

push('## 6. Catalog entries awaiting your review', '');
const flagged = bySeq.filter((e) => e.needs_review);
push(`${flagged.length} entries are marked \`needs_review\`.`, '');
for (const e of flagged) push(`- **seq ${e.sequence}** *${e.title}* (\`${e.id}\`): ${e.review_notes ?? 'no notes'}`);
push('');
if (vacancies.length) {
  push('## 7. Gaps in the lattice numbering', '');
  for (const s of vacancies) push(`- Sequence ${s} has no codex. Was something removed, or is a work missing?`);
  push('');
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, lines.join('\n').replace(/\n{3,}/g, '\n\n'), 'utf-8');

console.log(`Validation errors: ${errors.length}`);
for (const e of errors) console.log(`  - ${e}`);
console.log(`Series: ${published.length}; planned: ${published.reduce((n, s) => n + s.planned.length, 0)}; unplaced: ${published.reduce((n, s) => n + s.unplacedIds.length, 0)}`);
console.log(`Claim conflicts: ${conflicts.length}`);
for (const c of conflicts) console.log(`  - ${c}`);
console.log(`Series names not in registry: ${unknownSeries.size}`);
for (const [name, where] of unknownSeries) console.log(`  - "${name}": ${where.length} mention(s)`);
console.log(`Edition candidates: ${editionCandidates.length} (${editionCandidates.filter((c) => c.linked).length} linked)`);
for (const c of editionCandidates.filter((x) => !x.linked)) console.log(`  - seq ${c.a.sequence} ${c.a.id} ~ seq ${c.b.sequence} ${c.b.id} (h1=${c.sameH1} title=${c.sameTitle} jaccard=${c.jac.toFixed(2)} text=${c.textOverlap.toFixed(2)})`);
console.log(`Sequence vacancies: ${vacancies.join(', ') || 'none'}`);
console.log(`Wrote ${path.relative(ROOT, OUT_PATH)}`);
process.exitCode = errors.length ? 1 : 0;
