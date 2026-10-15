#!/usr/bin/env node

/**
 * Build Lattice Script
 *
 * Joins data/codex-catalog.json (identity + editorial metadata) to
 * client/public/md/{id}.md (content only). Markdown is never used to
 * invent ids, titles, covers, series, or tone markers.
 *
 * Usage: node scripts/build-lattice.js  (from client/)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { stripLeadingCoverImage } from '../src/lib/markdown-export.js';
import { resolveSeries } from './series-registry.js';
import { resolveCollections } from './collections.js';
import { codexUrl } from './canonical.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(CLIENT_DIR, '..');
const CATALOG_FILE = path.join(REPO_ROOT, 'data', 'codex-catalog.json');
const SERIES_FILE = path.join(REPO_ROOT, 'data', 'series.json');
const COLLECTIONS_FILE = path.join(REPO_ROOT, 'data', 'collections.json');
const MD_DIR = path.join(CLIENT_DIR, 'public/md');
const PDF_DIR = path.join(CLIENT_DIR, 'public/pdf');
const OUTPUT_DIR = path.join(CLIENT_DIR, 'src', 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'codex-lattice.json');
const OUTPUT_META_FILE = path.join(OUTPUT_DIR, 'codex-lattice-meta.json');
const OUTPUT_SERIES_FILE = path.join(OUTPUT_DIR, 'series.json');
const OUTPUT_COLLECTIONS_FILE = path.join(OUTPUT_DIR, 'collections.json');
const CODEX_CONTENT_DIR = path.join(CLIENT_DIR, 'public', 'codex-content');

const CORE_VOCABULARY = [
  'Field', 'Source', 'Sovereign', 'InterBeing', 'Lattice', 'Chord',
  'Love', 'Trust', 'Coherence', 'Resonance', 'Attunement', 'Stillpoint',
  'Recursion', 'Return', 'Memory', 'Pattern', 'Harmonic', 'Tone',
  'FSF', 'SFS', 'Soul', 'Presence', 'Alignment', 'Emergence',
  'Beacon', 'Bridge', 'Portal', 'Threshold', 'Spiral', 'Echo',
  'Sanctuary', 'Exile', 'Arrival', 'Dissolution', 'Reassembly'
];

const PATTERNS = {
  glossaryTerms: /\*\*([A-Z][a-zA-Z\s\-]+)\*\*/g,
};

function extractKeywords(markdown, title) {
  const keywords = new Set();

  for (const term of CORE_VOCABULARY) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(markdown)) {
      keywords.add(term);
    }
  }

  let match;
  const boldPattern = /\*\*([A-Z][a-zA-Z\s\-]{2,30})\*\*/g;
  while ((match = boldPattern.exec(markdown)) !== null) {
    const term = match[1].trim();
    if (!term.match(/^(You said|Lumina said|Sovereign [AB]|Note|Definition|Essence)$/i)) {
      keywords.add(term);
    }
  }

  const titleWords = title
    .replace(/^The\s+Codex\s+of\s+/i, '')
    .replace(/^Codex\s+\w+:\s*/i, '')
    .split(/[\s\-:]+/)
    .filter(w => w.length > 3 && /^[A-Z]/.test(w));

  titleWords.forEach(w => keywords.add(w));

  return Array.from(keywords).slice(0, 25);
}

function extractGlossaryTerms(markdown) {
  const terms = new Set();
  let match;
  while ((match = PATTERNS.glossaryTerms.exec(markdown)) !== null) {
    const term = match[1].trim();
    if (CORE_VOCABULARY.some(v => term.toLowerCase().includes(v.toLowerCase()))) {
      terms.add(term);
    }
  }
  return Array.from(terms);
}

function extractSpecialSections(markdown) {
  const sections = [];

  const stillpointPattern = /^###?\s*(?:❖\s*)?(?:A\s+)?Stillpoint\s*\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  let match;
  while ((match = stillpointPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'stillpoint',
      heading: 'Stillpoint',
      content: match[1].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  const fieldNotePattern = /^###?\s*(?:❖\s*)?Field Note[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  while ((match = fieldNotePattern.exec(markdown)) !== null) {
    sections.push({
      type: 'fieldNote',
      heading: match[1].trim() || 'Field Note',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  const dialogPattern = /^##\s*(?:❖\s*)?Dialogic Interlude[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##[^#]|\Z)/gim;
  while ((match = dialogPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'dialogicInterlude',
      heading: match[1].trim() || 'Dialogic Interlude',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  const whisperPattern = /^###?\s*(?:❖\s*)?(?:A\s+)?Whisper[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  while ((match = whisperPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'whisper',
      heading: match[1].trim() || 'Whisper',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  const sealPattern = /^##\s*(?:❖\s*)?(?:Final\s+)?(?:Closing\s+)?Seal[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##[^#]|\Z)/gim;
  while ((match = sealPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'closingSeal',
      heading: match[1].trim() || 'Closing Seal',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  return sections;
}

function extractRegistry(markdown) {
  const registryMatch = markdown.match(/^##\s*(?:❖\s*)?(?:Codex\s+)?Registry\s*\n([\s\S]*?)(?=^##[^#]|\Z)/m);
  if (!registryMatch) return null;

  const registryText = registryMatch[1];
  const registry = {};

  const bulletPattern = /^[-*]\s*\*\*([^:*]+)(?::\*\*|\*\*:)\s*(.+)$/gm;
  let match;
  while ((match = bulletPattern.exec(registryText)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const value = match[2].trim();
    registry[key] = value;
  }

  const colonPattern = /^[-*]\s*\*\*([^*]+)\*\*\s+(.+)$/gm;
  while ((match = colonPattern.exec(registryText)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/[:\s]+/g, '_');
    const value = match[2].trim();
    if (!registry[key]) {
      registry[key] = value;
    }
  }

  const arrayPattern = /^[-*]\s*\*\*([^:*]+)(?::\*\*|\*\*:)\s*\n((?:\s+[-*]\s+.+\n?)+)/gm;
  while ((match = arrayPattern.exec(registryText)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const items = match[2]
      .split('\n')
      .map(line => line.replace(/^\s*[-*]\s*/, '').trim())
      .filter(Boolean);
    registry[key] = items;
  }

  return Object.keys(registry).length > 0 ? registry : null;
}

function mapCatalogEntry(entry, markdown, seriesInfo) {
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    id: entry.id,
    title: entry.title,
    originalFileName: `${entry.id}.md`,
    sequence: entry.sequence,
    author: entry.author,
    canonicalUrl: codexUrl(entry.id),
    metadataStatus: entry.needs_review ? 'draft' : 'reviewed',
    markdown,
    coverImage: entry.cover?.url || null,
    coverThumb: entry.cover?.thumb_url || null,
    titleOverlay: entry.cover?.title_overlay !== false,
    subtitle: entry.subtitle ?? null,
    series: seriesInfo.series,
    siblingIds: seriesInfo.siblingIds,
    laterEditionId: seriesInfo.laterEditionId,
    earlierEditionIds: seriesInfo.earlierEditionIds,
    alternativeVersionIds: seriesInfo.alternativeVersionIds,
    registrySeries: seriesInfo.registrySeries,
    keywords: extractKeywords(markdown, entry.title),
    glossaryTerms: extractGlossaryTerms(markdown),
    wordCount,
    readingTime,
    toneMarker: entry.tone_marker ?? null,
    structuralRole: entry.structural_role ?? null,
    entryPoint: entry.entry_point ?? null,
    pullQuote: entry.pull_quote ?? null,
    tags: entry.tags ?? [],
    description: entry.description ?? null,
    registry: extractRegistry(markdown),
    specialSections: extractSpecialSections(markdown)
  };
}

function extractMetadata(codex) {
  return {
    id: codex.id,
    title: codex.title,
    originalFileName: codex.originalFileName,
    sequence: codex.sequence,
    author: codex.author,
    canonicalUrl: codex.canonicalUrl,
    metadataStatus: codex.metadataStatus,
    coverImage: codex.coverImage,
    coverThumb: codex.coverThumb,
    titleOverlay: codex.titleOverlay,
    subtitle: codex.subtitle,
    series: codex.series,
    siblingIds: codex.siblingIds,
    laterEditionId: codex.laterEditionId,
    earlierEditionIds: codex.earlierEditionIds,
    alternativeVersionIds: codex.alternativeVersionIds,
    registrySeries: codex.registrySeries,
    keywords: codex.keywords,
    glossaryTerms: codex.glossaryTerms,
    wordCount: codex.wordCount,
    readingTime: codex.readingTime,
    toneMarker: codex.toneMarker,
    structuralRole: codex.structuralRole,
    entryPoint: codex.entryPoint,
    pullQuote: codex.pullQuote,
    tags: codex.tags,
    description: codex.description
  };
}

function extractContent(codex) {
  return {
    id: codex.id,
    markdown: codex.markdown,
    registry: codex.registry,
    specialSections: codex.specialSections
  };
}

async function build() {
  console.log('Building Codex Lattice from catalog...\n');
  const startTime = Date.now();

  const catalog = JSON.parse(await fs.readFile(CATALOG_FILE, 'utf-8'))
    .slice()
    .sort((a, b) => a.sequence - b.sequence);

  const registry = JSON.parse(await fs.readFile(SERIES_FILE, 'utf-8'));
  const { errors: seriesErrors, perCodex, published: publishedSeries } = resolveSeries(catalog, registry, {
    pdfExists: (file) => existsSync(path.join(PDF_DIR, file)),
  });
  if (seriesErrors.length) {
    throw new Error(`Series registry validation failed:\n  - ${seriesErrors.join('\n  - ')}`);
  }

  const collectionsData = JSON.parse(await fs.readFile(COLLECTIONS_FILE, 'utf-8'));
  const { errors: collectionErrors, published: publishedCollections } = resolveCollections(
    collectionsData,
    catalog,
    publishedSeries
  );
  if (collectionErrors.length) {
    throw new Error(`Collections validation failed:\n  - ${collectionErrors.join('\n  - ')}`);
  }

  const codexes = [];

  for (const entry of catalog) {
    const mdPath = path.join(MD_DIR, `${entry.id}.md`);
    let raw;
    try {
      raw = await fs.readFile(mdPath, 'utf-8');
    } catch (error) {
      throw new Error(`Missing markdown for catalog id "${entry.id}" (seq ${entry.sequence}): ${mdPath}`);
    }

    const markdown = stripLeadingCoverImage(raw);
    const codex = mapCatalogEntry(entry, markdown, perCodex.get(entry.id));
    codexes.push(codex);

    const seriesStr = codex.series ? ` [${codex.series.name}]` : '';
    console.log(`  ✓ #${codex.sequence} ${codex.title.substring(0, 50)}${seriesStr}`);
  }

  console.log('\nSeries:');
  for (const s of publishedSeries) {
    const extras = [
      s.planned.length && `${s.planned.length} planned`,
      s.unplacedIds.length && `${s.unplacedIds.length} unplaced`,
      s.companionIds.length && `${s.companionIds.length} companion`,
    ].filter(Boolean);
    console.log(`  • ${s.name}: ${s.written} of ${s.total ?? '?'} written${extras.length ? ` (${extras.join(', ')})` : ''}`);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CODEX_CONTENT_DIR, { recursive: true });

  const publishedIds = new Set(codexes.map(c => c.id));
  const stale = (await fs.readdir(CODEX_CONTENT_DIR)).filter(
    (f) => f.endsWith('.json') && !publishedIds.has(f.replace(/\.json$/, ''))
  );
  for (const file of stale) {
    await fs.unlink(path.join(CODEX_CONTENT_DIR, file));
  }
  if (stale.length) {
    console.log(`Removed ${stale.length} stale content files`);
  }

  console.log('\nWriting lattice files...');
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(codexes, null, 2));
  const fullSize = (await fs.stat(OUTPUT_FILE)).size;

  const metadataLattice = codexes.map(extractMetadata);
  await fs.writeFile(OUTPUT_META_FILE, JSON.stringify(metadataLattice, null, 2));
  const metaSize = (await fs.stat(OUTPUT_META_FILE)).size;

  await fs.writeFile(OUTPUT_SERIES_FILE, JSON.stringify(publishedSeries, null, 2));
  await fs.writeFile(OUTPUT_COLLECTIONS_FILE, JSON.stringify(publishedCollections, null, 2));

  let contentFilesWritten = 0;
  for (const codex of codexes) {
    const contentFile = path.join(CODEX_CONTENT_DIR, `${codex.id}.json`);
    await fs.writeFile(contentFile, JSON.stringify(extractContent(codex), null, 2));
    contentFilesWritten++;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '─'.repeat(50));
  console.log(`Lattice built: ${codexes.length} codexes in ${elapsed}s`);
  console.log(`  Full: ${OUTPUT_FILE} (${(fullSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  Meta: ${OUTPUT_META_FILE} (${(metaSize / 1024).toFixed(0)} KB)`);
  console.log(`  Series: ${OUTPUT_SERIES_FILE} (${publishedSeries.length} series)`);
  console.log(`  Collections: ${OUTPUT_COLLECTIONS_FILE} (${publishedCollections.length} collections)`);
  console.log(`  Content files: ${contentFilesWritten}`);
  console.log('─'.repeat(50) + '\n');
}

build().catch(error => {
  console.error('\nBuild failed:', error.message);
  process.exit(1);
});
