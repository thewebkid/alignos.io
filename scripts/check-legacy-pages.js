#!/usr/bin/env node
// Diffs the prerendered page text in client/dist against the WordPress captures in
// analysis/legacy-pages. Every capture line must appear in the rendered page, in order,
// unless it is a recorded deviation (design.md D6). Run `npm run build` in client first.
//
//   node scripts/check-legacy-pages.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURES = path.join(ROOT, 'analysis', 'legacy-pages');
const DIST = path.join(ROOT, 'client', 'dist');

// edits: [from, to, reason] applied to capture lines before matching, so the rest of the line is still checked.
// missing: capture substring -> D6 reason for lines absent on purpose.
// moved: capture lines that render elsewhere on the page (checked for presence, not order).
// duplicatesOnce: a block WordPress repeats renders once (D6.1, D6.2).
// dropFrom/dropUntil: a capture section removed on purpose (D6.4).
const ONWARD = 'D6.9 closing link renders as the onward action after the body';
const DEVIATIONS = {
  home: {},
  'before-you-begin': { moved: { 'Begin a Return Room': ONWARD } },
  'between-worlds': {
    missing: { 'Download the full Codex:': 'D6.10 PDF download prompt removed' },
  },
  'arc-of-difference': {
    duplicatesOnce: true,
    moved: { 'Begin a Return Room': ONWARD, 'Codex Lattice': ONWARD },
    edits: [[' Click to download.', '', 'D6.10 PDF download prompt removed']],
  },
  'return-room': {
    duplicatesOnce: true,
    edits: [['upload these PDFs to your AI', 'share these Codices with your AI', 'D6.7 reworded for HTML and AI']],
  },
  papers: {},
  faq: {
    missing: { 'contact@alignos.io': 'D6.5 contact becomes info@alignos.io' },
    dropFrom: 'Is there more coming?',
    dropUntil: 'Have a question not listed here?',
  },
};

const PAGES = [
  ['home', 'index.html'],
  ['before-you-begin', 'before-you-begin.html'],
  ['between-worlds', 'between-worlds.html'],
  ['arc-of-difference', 'arc-of-difference.html'],
  ['return-room', 'return-room.html'],
  ['papers', 'papers.html'],
  ['faq', 'faq.html'],
];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n] ?? m);
}

function normalize(s) {
  return s
    .normalize('NFC')
    .replace(/[“”"→]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?])/g, '$1')
    .trim();
}

function captureLines(slug) {
  const raw = fs.readFileSync(path.join(CAPTURES, `${slug}.md`), 'utf8').split(/\r?\n/);
  const start = raw.findIndex(l => /^---\s*$/.test(l));
  const end = raw.findIndex(l => /^## Links on page/.test(l));
  const body = raw.slice(start + 1, end === -1 ? undefined : end);
  return body
    .map(l => l.trim())
    .filter(l => l && !/^---$/.test(l))
    .filter(l => !/^\[\[.*\]\]/.test(l))
    .filter(l => !/^\(Live site/.test(l))
    .filter(l => !/^```/.test(l))
    .map(l => {
      l = l.replace(/^#+\s*/, '').replace(/^(>\s*)+/, '').replace(/^[-*]\s+/, '');
      // Collection lists number items with a CSS counter, so numbering is checked in the browser, not here.
      return l
        .replace(/^\d+\.\s+/, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\*\*|__|`/g, '')
        .replace(/(^|[^\p{L}])[*_]([^*_]+)[*_](?=[^\p{L}]|$)/gu, '$1$2')
        .replace(/<br\s*\/?>/gi, ' ');
    })
    .map(normalize)
    .filter(Boolean);
}

function renderedText(file) {
  const html = fs.readFileSync(path.join(DIST, file), 'utf8');
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
  if (!main) throw new Error(`${file}: no <main> in prerendered HTML`);
  const text = main
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<footer class="app-footer"[\s\S]*?<\/footer>/, '')
    .replace(/<br\b[^>]*>|<\/(a|button)>/gi, ' ')
    .replace(/<\/?(p|h[1-6]|li|ul|ol|blockquote|figure|figcaption|div|section|article|header|footer|nav)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return normalize(decode(text));
}

function words(s) {
  return new Set(s.match(/[\p{L}\p{N}][\p{L}\p{N}’'-]*/gu) ?? []);
}

let failures = 0;

for (const [slug, file] of PAGES) {
  const dev = DEVIATIONS[slug];
  const lines = captureLines(slug);
  const rendered = renderedText(file);
  const problems = [];
  const expected = [];

  let skipQuestion = false;
  let cursor = 0;
  for (let line of lines) {
    for (const [from, to, reason] of dev.edits ?? []) {
      if (line.includes(from)) {
        line = line.replace(from, to);
        expected.push(`${reason}: "${from.trim()}"`);
      }
    }
    if (dev.dropFrom) {
      if (line === dev.dropFrom) skipQuestion = true;
      else if (line === dev.dropUntil) skipQuestion = false;
      if (skipQuestion) {
        expected.push(`dropped (D6.4): ${line}`);
        continue;
      }
    }
    const movedReason = dev.moved?.[line];
    if (movedReason) {
      if (rendered.includes(line)) expected.push(`${movedReason}: ${line}`);
      else problems.push(`missing: ${line}`);
      continue;
    }
    const missingReason = Object.entries(dev.missing ?? {}).find(([k]) => line.includes(normalize(k)));
    const at = rendered.indexOf(line, cursor);
    if (at !== -1) {
      cursor = at + line.length;
      continue;
    }
    if (missingReason) {
      expected.push(`${missingReason[1]}: ${line}`);
      continue;
    }
    if (rendered.includes(line)) {
      if (dev.duplicatesOnce) expected.push(`duplicate rendered once (D6): ${line}`);
      else problems.push(`out of order: ${line}`);
      continue;
    }
    problems.push(`missing: ${line}`);
  }

  const captureWords = words(lines.join(' '));
  const extra = [...words(rendered)].filter(w => !captureWords.has(w));

  const status = problems.length ? 'FAIL' : 'ok';
  if (problems.length) failures++;
  console.log(`\n${status}  ${slug}  (${lines.length} capture lines)`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  for (const e of expected) console.log(`  · ${e}`);
  if (extra.length) console.log(`  + words not in capture (UI chrome or collection text): ${extra.join(', ')}`);
}

console.log(failures ? `\n${failures} page(s) differ from their captures.` : '\nAll pages match their captures (beyond recorded deviations).');
process.exit(failures ? 1 : 0);
