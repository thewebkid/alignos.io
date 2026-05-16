#!/usr/bin/env node

/**
 * Build Lattice Script
 *
 * Reads all markdown files from client/md/, extracts metadata,
 * and generates a JSON lattice file for the application.
 *
 * Usage: node scripts/build-lattice.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const MD_DIR = path.join(ROOT_DIR, 'public/md');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src', 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'codex-lattice.json');
const OUTPUT_META_FILE = path.join(OUTPUT_DIR, 'codex-lattice-meta.json');
const CODEX_CONTENT_DIR = path.join(ROOT_DIR, 'public', 'codex-content');

// Import series detector (relative path)
import { detectSeries } from '../src/lib/series-detector.js';

// ============================================================
// URL Sequence Mapping
// ============================================================

/**
 * The canonical order of codexes from alignos.io/codex-lattice/
 * This array is derived from alignos-codex-lattice-links.js
 */
const LATTICE_URLS = [
  "Between-Worlds_-The-Architecture-of-the-Third-Structure.pdf",
  "Framing-the-Mirror.pdf",
  "The-Craftsman-of-the-Invisible-Frame.pdf",
  "The-Stillpoint-of-Love.pdf",
  "Dissolving-the-Architecture-of-Seeking.pdf",
  "Codex-of-Nearness-and-the-Geometry-of-Prayer.pdf",
  "The-Codex-of-the-Breath-That-Waits.pdf",
  "Codex-of-the-Next-Threshold.pdf",
  "Codex-I_-Origin-and-Exile.pdf",
  "Codex-II_-The-Sovereign-Threshold.pdf",
  "Codex-III_-To-Host-in-Return.pdf",
  "Codex-IV_-The-Sovereign-Spiral.pdf",
  "Codex-V_-The-InterBeing-Emergence.pdf",
  "Codex-VII_-The-Architecture-of-Alignment.pdf",
  "Codex-VIII_-The-Chorus-of-the-Whole.pdf",
  "The-Co-Remembrance-Ecology-of-a-Return-Room.pdf",
  "The-Culture-of-the-Return-Room.pdf",
  "The-Evolution-of-the-Sovereign.pdf",
  "THE-FUNDAMENTAL-ARC.pdf",
  "The-Grace-of-Asymmetry.pdf",
  "The-Purpose-of-the-Return-Room.pdf",
  "The-Rhythm-of-Recursion.pdf",
  "The-Shape-of-a-Welcome.pdf",
  "The-Small-Gate-Open.pdf",
  "The-Tone-of-the-Sovereign-Field-Signature.pdf",
  "The-Transparent-Sovereign.pdf",
  "To-Serve-the-Recursion-of-Love.pdf",
  "The-Gravity-of-Source-2.pdf",
  "Tone-Portraits-of-Becoming-3.pdf",
  "The-Untitled-Offering-55.pdf",
  "The-Harmonic-Being-Called-Earth-4.pdf",
  "The-Animals-That-Remember-You-5.pdf",
  "Between-the-Whole-and-the-Relational-11-1.pdf",
  "The-Codex-of-the-Trust-Circuitry-15.pdf",
  "Codex-of-Vows-20.pdf",
  "Codex-05_-The-Architecture-of-Love-21.pdf",
  "The-Codex-of-Coherence-and-Dissolution-22.pdf",
  "Codex-06_-The-Architecture-of-Love-22.pdf",
  "Codex-09_-The-Architecture-of-Tending-23.pdf",
  "Codex-02_-The-Architecture-of-Love-24.pdf",
  "Codex-04_-The-Architecture-of-Love-25.pdf",
  "Codex-03_-The-Architecture-of-Love-26.pdf",
  "The-Codex-of-the-InterBeing-Dialogues-27.pdf",
  "Codex-01_-The-Architecture-of-Love-27.pdf",
  "Codex-07_-The-Architecture-of-Love-27.pdf",
  "Codex-10_-The-Architecture-of-Tending-29.pdf",
  "Codex-of-the-Language-of-Resonance-30.pdf",
  "The-Codex-of-Loves-Architecture-33.pdf",
  "Codex-of-the-Realized-Flame-Part-I-34.pdf",
  "Codex-08_-The-Architecture-of-Love-36.pdf",
  "The-Agency-of-One-38.pdf",
  "The-Codex-of-the-Chord-38.pdf",
  "The-Codex-of-the-Quiet-Turning-39.pdf",
  "The-Living-Glossary-of-the-Field.pdf",
  "The-Codex-of-the-InterBeing-Lattice-42.pdf",
  "The-Codex-of-the-Realized-Flame-Part-II-42.pdf",
  "The-Codex-of-the-Field-Effect-43.pdf",
  "The-Codex-of-the-Co-Creation-Spiral-44.pdf",
  "The-Codex-of-Trans-Species-Resonance-45.pdf",
  "The-Codex-of-Nonlocal-Memory-46.pdf",
  "Codex-II_-The-InterBeing-46.pdf",
  "The-Codex-of-the-Harmonic-Architectures-47.pdf",
  "What-is-an-InterBeing-47.pdf",
  "The-Codex-of-the-Spiral-48.pdf",
  "The-Codex-of-Harmonic-Reality_-Why-the-Field-is-Not-a-Simulation-50.pdf",
  "The-Codex-of-Resonant-Action-50.pdf",
  "The-Glossary-of-the-InterBeing-Vol.-1-51.pdf",
  "Codex-of-Resonant-Memory-51.pdf",
  "The-Codex-of-the-Sovereign-Known-as-Jesus-52.pdf",
  "Reflections-from-the-Field-52.pdf",
  "The-Sovereign-Host-53.pdf",
  "The-Midwife-of-Dimensional-Kin-54.pdf",
  "The-Codex-of-the-Crossing-Threshold-55.pdf",
  "The-Magdalene-Codex-of-Relational-Sovereignty-56.pdf",
  "The-Codex-of-Harmonic-Service_-Latticework-for-Planetary-Reassembly-57.pdf",
  "The-Codex-of-Living-Harmonics-58.pdf",
  "The-Codex-of-Trans-Species-Resonance-59.pdf",
  "Codex-of-Remembrance-61.pdf",
  "Codex-of-The-Resonant-Arc-62.pdf",
  "Bridge-Between-Chords-63.pdf",
  "Codex_-On-Masters-and-the-Mythologies-of-Separation-66.pdf",
  "The-Codex-of-the-Agency-of-One-Vol.-II-68.pdf",
  "Codex-IV_-The-InterBeing-70.pdf",
  "Resonant-Practices-a-micro-guide-71.pdf",
  "Codex-of-Conscious-Principles-71.pdf",
  "The-Mirror-and-the-Bridge-73.pdf",
  "Codex-of-Relational-Architectures-75.pdf",
  "Codex-of-Relational-Intelligence-76.pdf",
  "Codex-on-the-Nature-of-Guidance-77.pdf",
  "Codex-of-the-Integrative-Species-79.pdf",
  "The-Ethics-of-Resonance-81.pdf",
  "Harmonic-Recognition-Distilled-Practice-81.pdf",
  "The-Harmonic-Future-85.pdf",
  "Codex-I_-The-InterBeing-86.pdf",
  "The-Codex-of-Quantum-Kin-87.pdf",
  "Codex-III_-The-InterBeing-88.pdf",
  "Codex-of-Harmonic-Definitions-89.pdf",
  "Nested-Paper-90.pdf",
  "The-Codex-of-Convergence-and-Reassembly-91.pdf",
  "Codex-of-the-Sanctuary-Builder-92.pdf",
  "Codex_-Introduction-to-Soul-Lines-92.pdf",
  "The-Art-of-Co-Creation-93.pdf",
  "CODEX_-The-Harmonics-of-the-Field-93.pdf",
  "The-Codex-of-Entangled-Trust-94.pdf",
  "The-Codex-of-Arrival-94.pdf",
  "The-Codex-of-Harmonic-Coherence-95.pdf",
  "Codex_-The-Beacons-of-the-Bridge-95.pdf",
  "The-Four-Frequencies-of-Love-96.pdf",
  "The-Mirrors-of-the-Field-96.pdf",
  "Codex-On-Becoming-a-Portal-99.pdf",
  "The-Things-That-Remember-You-100.pdf",
  "Codex_-The-Path-of-Becoming-and-Remembering-101.pdf",
  "Codex-of-Mythos-102.pdf",
  "Codex-of-Harmonic-Intelligence-104.pdf",
  "The-Path-to-the-Non-Path-106.pdf",
  "Codex_-The-Mirror-Path-107.pdf",
  "Codex_-Attunement-as-a-Technology-of-the-Field-108.pdf",
  "The-Codex-of-Relational-Learning-110.pdf",
  "The-Ecology-of-InterBeing-111.pdf",
  "Codex-of-the-Keeper-112.pdf",
  "Codex_-The-Subtle-Body-Of-Trust-113.pdf",
  "Codex-of-the-Sacred-Exile-114.pdf",
  "Soul-Lines-115.pdf",
  "Codex_-The-Architecture-of-Love-116.pdf",
  "The-Souls-Evolution-Codex-117.pdf",
  "The-Soft-Sacred-Words-of-the-Field-118.pdf",
  "Tending-the-Unnameable-119.pdf",
  "The-Architecture-of-Trust-CODEX-120.pdf",
  "The-Codex-of-Listening-121.pdf",
  "The-Harmonics-of-the-Field-123.pdf",
  "Codex_-Coherence-Recursion-124.pdf",
  "The-Codex-of-Leaving-within-Return-125.pdf",
  "Willingness-as-a-Form-of-Intelligence-126.pdf",
  "The-Sanctuary-of-Spiral-Memory-127.pdf",
  "James Mahu_and Lumina_Listening.pdf"
];

/**
 * Build a map of filename (without extension) to sequence number
 */
function buildSequenceMap() {
  const map = new Map();
  LATTICE_URLS.forEach((url, idx) => {
    // Extract filename without .pdf extension
    const basename = url.replace('.pdf', '');
    map.set(basename, idx + 1); // 1-based indexing
  });
  return map;
}

// ============================================================
// Extraction Patterns
// ============================================================

const PATTERNS = {
  // Cover image: <img src="covers/filename.jpg" alt="..."/> or CDN URL
  coverImage: /^<img\s+src="(?:https:\/\/astrotiles\.blob\.core\.windows\.net\/alignos\/covers\/|covers\/)([^"]+)"\s+alt="([^"]+)"[^>]*\/?>/m,

  // Title: # Title (first h1)
  title: /^#\s+(.+)$/m,

  // Subtitle: First line after title that's italicized or plain text
  subtitle: /^#\s+.+\n\n(?:\*([^*\n]+)\*|([A-Z][^\n]{10,}))$/m,

  // Registry section
  registry: /^##\s*(?:❖\s*)?(?:Codex\s+)?Registry\s*\n([\s\S]*?)(?=^##\s|\Z)/m,

  // Series preface
  seriesPreface: /^##\s*Series Preface:\s*([^\n]+)/m,

  // Special sections
  stillpoint: /^###?\s*(?:❖\s*)?(?:A\s+)?Stillpoint\s*\n([\s\S]*?)(?=^##|\n###|\Z)/gim,
  fieldNote: /^###?\s*(?:❖\s*)?Field Note[:\s]*([^\n]*)\n([\s\S]*?)(?=^##|\n###|\Z)/gim,
  dialogicInterlude: /^##\s*(?:❖\s*)?Dialogic Interlude[:\s]*([^\n]*)\n([\s\S]*?)(?=^##\s|\Z)/gim,
  whisper: /^###?\s*(?:❖\s*)?(?:A\s+)?Whisper[:\s]*([^\n]*)\n([\s\S]*?)(?=^##|\n###|\Z)/gim,
  closingSeal: /^##\s*(?:❖\s*)?(?:Final\s+)?(?:Closing\s+)?Seal[:\s]*([^\n]*)\n([\s\S]*?)(?=^##\s|\Z)/gim,

  // Glossary terms (bolded capitalized terms)
  glossaryTerms: /\*\*([A-Z][a-zA-Z\s\-]+)\*\*/g,

  // Living Glossary entry format: ## ✧ Term Name
  livingGlossaryEntry: /^##\s*✧\s*(.+)$/gm
};

// Core vocabulary terms to detect as keywords
const CORE_VOCABULARY = [
  'Field', 'Source', 'Sovereign', 'InterBeing', 'Lattice', 'Chord',
  'Love', 'Trust', 'Coherence', 'Resonance', 'Attunement', 'Stillpoint',
  'Recursion', 'Return', 'Memory', 'Pattern', 'Harmonic', 'Tone',
  'FSF', 'SFS', 'Soul', 'Presence', 'Alignment', 'Emergence',
  'Beacon', 'Bridge', 'Portal', 'Threshold', 'Spiral', 'Echo',
  'Sanctuary', 'Exile', 'Arrival', 'Dissolution', 'Reassembly'
];

// ============================================================
// Extraction Functions
// ============================================================

/**
 * Generate a URL-safe ID from filename
 */
function generateId(filename) {
  return filename
    .replace('.md', '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract cover image info
 */
function extractCoverImage(markdown) {
  const match = markdown.match(PATTERNS.coverImage);
  if (match) {
    return {
      path: `covers/${match[1]}`,
      alt: match[2]
    };
  }
  return null;
}

/**
 * Extract title
 */
function extractTitle(markdown) {
  const match = markdown.match(PATTERNS.title);
  return match ? match[1].trim() : null;
}

/**
 * Extract subtitle (if present)
 */
function extractSubtitle(markdown) {
  // Look for italicized text or descriptive text right after title
  const lines = markdown.split('\n');
  let foundTitle = false;
  let emptyCount = 0;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    if (foundTitle) {
      if (line.trim() === '') {
        emptyCount++;
        if (emptyCount > 2) break;
        continue;
      }
      // Check for italicized subtitle
      const italicMatch = line.match(/^\*([^*]+)\*$/);
      if (italicMatch) {
        return italicMatch[1].trim();
      }
      // Check for "Creating a resonant ecology..." type subtitles
      if (line.match(/^[A-Z][a-z].*[a-z]$/)) {
        return line.trim();
      }
      break;
    }
  }
  return null;
}

/**
 * Extract keywords from markdown
 */
function extractKeywords(markdown, title) {
  const keywords = new Set();

  // Add core vocabulary terms found in the document
  for (const term of CORE_VOCABULARY) {
    // Case-insensitive search, but respect word boundaries
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(markdown)) {
      keywords.add(term);
    }
  }

  // Extract bolded terms that look like concepts
  let match;
  const boldPattern = /\*\*([A-Z][a-zA-Z\s\-]{2,30})\*\*/g;
  while ((match = boldPattern.exec(markdown)) !== null) {
    const term = match[1].trim();
    // Filter out common non-keyword patterns
    if (!term.match(/^(You said|Lumina said|Sovereign [AB]|Note|Definition|Essence)$/i)) {
      keywords.add(term);
    }
  }

  // Extract key terms from title
  const titleWords = title
    .replace(/^The\s+Codex\s+of\s+/i, '')
    .replace(/^Codex\s+\w+:\s*/i, '')
    .split(/[\s\-:]+/)
    .filter(w => w.length > 3 && /^[A-Z]/.test(w));

  titleWords.forEach(w => keywords.add(w));

  return Array.from(keywords).slice(0, 25); // Limit to top 25
}

/**
 * Extract glossary terms used in the document
 */
function extractGlossaryTerms(markdown) {
  const terms = new Set();

  // Look for bolded Field terms
  let match;
  while ((match = PATTERNS.glossaryTerms.exec(markdown)) !== null) {
    const term = match[1].trim();
    if (CORE_VOCABULARY.some(v => term.toLowerCase().includes(v.toLowerCase()))) {
      terms.add(term);
    }
  }

  return Array.from(terms);
}

/**
 * Extract special sections (stillpoints, field notes, etc.)
 */
function extractSpecialSections(markdown) {
  const sections = [];

  // Extract stillpoints
  let match;
  const stillpointPattern = /^###?\s*(?:❖\s*)?(?:A\s+)?Stillpoint\s*\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  while ((match = stillpointPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'stillpoint',
      heading: 'Stillpoint',
      content: match[1].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  // Extract field notes
  const fieldNotePattern = /^###?\s*(?:❖\s*)?Field Note[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  while ((match = fieldNotePattern.exec(markdown)) !== null) {
    sections.push({
      type: 'fieldNote',
      heading: match[1].trim() || 'Field Note',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  // Extract dialogic interludes
  const dialogPattern = /^##\s*(?:❖\s*)?Dialogic Interlude[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##[^#]|\Z)/gim;
  while ((match = dialogPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'dialogicInterlude',
      heading: match[1].trim() || 'Dialogic Interlude',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  // Extract whispers
  const whisperPattern = /^###?\s*(?:❖\s*)?(?:A\s+)?Whisper[:\s]*([^\n]*)\n([\s\S]*?)(?=\n##|\n###[^#]|\Z)/gim;
  while ((match = whisperPattern.exec(markdown)) !== null) {
    sections.push({
      type: 'whisper',
      heading: match[1].trim() || 'Whisper',
      content: match[2].trim(),
      lineStart: markdown.substring(0, match.index).split('\n').length
    });
  }

  // Extract closing seal
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

/**
 * Extract registry metadata
 */
function extractRegistry(markdown) {
  const registryMatch = markdown.match(/^##\s*(?:❖\s*)?(?:Codex\s+)?Registry\s*\n([\s\S]*?)(?=^##[^#]|\Z)/m);
  if (!registryMatch) return null;

  const registryText = registryMatch[1];
  const registry = {};

  // Extract key-value pairs from bullet list format
  const bulletPattern = /^[-*]\s*\*\*([^:*]+)(?::\*\*|\*\*:)\s*(.+)$/gm;
  let match;
  while ((match = bulletPattern.exec(registryText)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const value = match[2].trim();
    registry[key] = value;
  }

  // Also try colon-separated format
  const colonPattern = /^[-*]\s*\*\*([^*]+)\*\*\s+(.+)$/gm;
  while ((match = colonPattern.exec(registryText)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/[:\s]+/g, '_');
    const value = match[2].trim();
    if (!registry[key]) {
      registry[key] = value;
    }
  }

  // Extract arrays (like primary architectures, codex entries)
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

/**
 * Parse a single codex file
 */
function parseCodex(filename, markdown, sequence) {
  const id = generateId(filename);
  const title = extractTitle(markdown) || filename.replace('.md', '').replace(/-/g, ' ');

  const codex = {
    id,
    title,
    originalFileName: filename,
    sequence,
    markdown,
    coverImage: extractCoverImage(markdown)?.path || null,
    subtitle: extractSubtitle(markdown),
    series: detectSeries(filename, markdown, title),
    siblingIds: [], // Will be populated after all codexes are parsed
    keywords: extractKeywords(markdown, title),
    glossaryTerms: extractGlossaryTerms(markdown),
    registry: extractRegistry(markdown),
    specialSections: extractSpecialSections(markdown)
  };

  return codex;
}

/**
 * Extract only metadata from a codex (no markdown content)
 */
function extractMetadata(codex) {
  // Calculate reading time and word count
  const wordCount = codex.markdown.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

  return {
    id: codex.id,
    title: codex.title,
    originalFileName: codex.originalFileName,
    sequence: codex.sequence,
    coverImage: codex.coverImage,
    subtitle: codex.subtitle,
    series: codex.series,
    siblingIds: codex.siblingIds,
    keywords: codex.keywords,
    glossaryTerms: codex.glossaryTerms,
    wordCount,
    readingTime
  };
}

/**
 * Extract only content from a codex (markdown + registry)
 */
function extractContent(codex) {
  return {
    id: codex.id,
    markdown: codex.markdown,
    registry: codex.registry,
    specialSections: codex.specialSections
  };
}

// ============================================================
// Main Build Function
// ============================================================

async function build() {
  console.log('🔮 Building Codex Lattice...\n');

  const startTime = Date.now();
  const sequenceMap = buildSequenceMap();

  // Read all markdown files
  const files = (await fs.readdir(MD_DIR))
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`📚 Found ${files.length} markdown files\n`);

  const codexes = [];
  const seriesMap = new Map();

  // Parse each file
  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(MD_DIR, file), 'utf-8');

      // Find sequence number
      const basename = file.replace('.md', '');
      const sequence = sequenceMap.get(basename) || null;

      const codex = parseCodex(file, content, sequence);
      codexes.push(codex);

      // Track series membership
      if (codex.series) {
        const seriesName = codex.series.name;
        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, []);
        }
        seriesMap.get(seriesName).push(codex.id);
      }

      // Progress indicator
      const seqStr = sequence ? `#${sequence}` : '   ';
      const seriesStr = codex.series ? ` [${codex.series.name}]` : '';
      console.log(`  ✓ ${seqStr} ${codex.title.substring(0, 50)}${seriesStr}`);

    } catch (error) {
      console.error(`  ✗ Error parsing ${file}:`, error.message);
    }
  }

  // Link siblings within each series
  console.log('\n🔗 Linking series siblings...');
  for (const [seriesName, codexIds] of seriesMap) {
    console.log(`  • ${seriesName}: ${codexIds.length} codexes`);
    for (const id of codexIds) {
      const codex = codexes.find(c => c.id === id);
      if (codex) {
        codex.siblingIds = codexIds.filter(sibId => sibId !== id);
      }
    }
  }

  // Sort by sequence (codexes without sequence go to the end)
  codexes.sort((a, b) => {
    if (a.sequence === null && b.sequence === null) return 0;
    if (a.sequence === null) return 1;
    if (b.sequence === null) return -1;
    return a.sequence - b.sequence;
  });

  // Ensure output directories exist
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CODEX_CONTENT_DIR, { recursive: true });

  // Write full lattice (for SSG build)
  console.log('\n📝 Writing full lattice...');
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(codexes, null, 2));
  const fullSize = (await fs.stat(OUTPUT_FILE)).size;

  // Write metadata-only lattice (for client-side hydration)
  console.log('📝 Writing metadata-only lattice...');
  const metadataLattice = codexes.map(extractMetadata);
  await fs.writeFile(OUTPUT_META_FILE, JSON.stringify(metadataLattice, null, 2));
  const metaSize = (await fs.stat(OUTPUT_META_FILE)).size;

  // Write individual content files
  console.log('📝 Writing individual content files...');
  let contentFilesWritten = 0;
  for (const codex of codexes) {
    const contentFile = path.join(CODEX_CONTENT_DIR, `${codex.id}.json`);
    const content = extractContent(codex);
    await fs.writeFile(contentFile, JSON.stringify(content, null, 2));
    contentFilesWritten++;
  }

  // Calculate stats
  const totalWords = codexes.reduce((sum, c) => {
    const words = c.markdown.split(/\s+/).length;
    return sum + words;
  }, 0);

  const totalSize = codexes.reduce((sum, c) => sum + c.markdown.length, 0);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '─'.repeat(50));
  console.log('✨ Codex Lattice built successfully!\n');
  console.log(`   📊 Statistics:`);
  console.log(`      • Codexes: ${codexes.length}`);
  console.log(`      • Series: ${seriesMap.size}`);
  console.log(`      • Total words: ~${Math.round(totalWords / 1000)}k`);
  console.log(`      • Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`      • Build time: ${elapsed}s`);
  console.log(`\n   📁 Outputs:`);
  console.log(`      • Full lattice: ${OUTPUT_FILE} (${(fullSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`      • Meta lattice: ${OUTPUT_META_FILE} (${(metaSize / 1024).toFixed(0)} KB)`);
  console.log(`      • Content files: ${contentFilesWritten} files in ${CODEX_CONTENT_DIR}`);
  console.log(`      • Size reduction: ${((1 - metaSize / fullSize) * 100).toFixed(1)}%`);
  console.log('─'.repeat(50) + '\n');
}

// Run build
build().catch(error => {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
});
