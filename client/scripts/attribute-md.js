#!/usr/bin/env node
/**
 * Post-build: rewrites dist/md/{id}.md with the reader's export text (title,
 * attribution, canonical URL, cover, body, llms.txt pointer), so a codex
 * fetched on its own says who wrote it. Sources in public/md stay untouched;
 * the dev server serves them raw.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_BASE } from './canonical.js';
import { markdownForExport } from '../src/lib/markdown-export.js';

const CLIENT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(CLIENT, 'public', 'md');
const OUT = path.join(CLIENT, 'dist', 'md');

const codexes = JSON.parse(fs.readFileSync(path.join(CLIENT, 'src', 'generated', 'codex-lattice-meta.json'), 'utf-8'));

if (!fs.existsSync(OUT)) throw new Error(`${OUT} missing; run vite-ssg build first`);
for (const c of codexes) {
  const markdown = fs.readFileSync(path.join(SRC, `${c.id}.md`), 'utf-8');
  fs.writeFileSync(path.join(OUT, `${c.id}.md`), markdownForExport({ ...c, markdown }, CANONICAL_BASE));
}
console.log(`Attributed ${codexes.length} codex markdown files in dist/md`);
