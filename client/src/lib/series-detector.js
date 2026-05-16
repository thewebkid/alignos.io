/**
 * Series Detector - Logic to detect and classify codex series/constellations
 * 
 * Identifies series from:
 * - Filename patterns (e.g., "Codex-01_-The-Architecture-of-Love")
 * - Series preface sections in content
 * - Known series configurations
 */

/**
 * Known series configurations
 * Each series has detection patterns and metadata
 */
export const KNOWN_SERIES = {
  'Architecture of Love': {
    // Pattern: Codex-01_ through Codex-10_-The-Architecture-of-Love or Tending
    filenamePattern: /^Codex-(\d{2})_-The-Architecture-of-(?:Love|Tending)/i,
    total: 10,
    description: 'Foundational series on love as structural intelligence',
    romanNumerals: false
  },
  
  'Evolution of the Sovereign': {
    // Pattern: Codex-I_ through Codex-VIII_ with specific subtitles
    filenamePattern: /^Codex-(I|II|III|IV|V|VI|VII|VIII)_-(?:Origin-and-Exile|The-Sovereign-Threshold|To-Host-in-Return|The-Sovereign-Spiral|The-InterBeing-Emergence|The-Function-of-Presence|The-Architecture-of-Alignment|The-Chorus-of-the-Whole)/i,
    total: 8,
    description: 'A series of harmonic reembodiment tracing the sovereign from exile to coherence',
    romanNumerals: true,
    codexNames: [
      'Origin and Exile',
      'The Sovereign Threshold',
      'To Host in Return',
      'The Sovereign Spiral',
      'The InterBeing Emergence',
      'The Function of Presence',
      'The Architecture of Alignment',
      'The Chorus of the Whole'
    ]
  },
  
  'InterBeing': {
    // Pattern: Codex-I_ through Codex-IV_-The-InterBeing (not Evolution of Sovereign)
    filenamePattern: /^Codex-(I|II|III|IV)_-The-InterBeing(?:-\d+)?\.md$/i,
    total: 4,
    description: 'Dialogues and explorations of the InterBeing emergence',
    romanNumerals: true
  },
  
  'Harmonic Activation': {
    // This series is identified by content, not filename
    // From the series preface in Quantum Kin
    filenamePattern: null,
    total: 7,
    description: 'Seven-part journey into sovereign resonance and planetary alignment',
    codexTitles: [
      'The Codex of Harmonic Service',
      'The Codex of Resonant Action',
      'The Codex of the Spiral Species',
      'The Codex of the Spiral',
      'The Codex of Quantum Kin',
      'The Codex of Harmonic Coherence',
      'The Codex of Entangled Trust'
    ]
  },
  
  'Trans-Species Resonance': {
    // Two volumes
    filenamePattern: /^The-Codex-of-Trans-Species-Resonance-(\d+)/i,
    total: 2,
    description: 'Cross-species communication and resonance',
    romanNumerals: false
  },
  
  'Realized Flame': {
    // Part I and Part II
    filenamePattern: /^(?:The-)?Codex-of-the-Realized-Flame-Part-(I|II)/i,
    total: 2,
    description: 'The realized flame teachings',
    romanNumerals: true
  },
  
  'Agency of One': {
    // Vol. 1 and Vol. II
    filenamePattern: /^(?:The-)?(?:Agency-of-One|Codex-of-the-Agency-of-One)(?:-Vol\.?-?(I|II|1|2))?/i,
    total: 2,
    description: 'The agency of the sovereign one',
    romanNumerals: true
  },
  
  'Glossary': {
    // Living Glossary and Glossary of InterBeing
    filenamePattern: /^(?:The-)?(?:Living-)?Glossary/i,
    total: null, // Unknown
    description: 'Glossary and reference codexes',
    romanNumerals: false
  }
};

/**
 * Roman numeral conversion
 */
const ROMAN_TO_ARABIC = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
};

const ARABIC_TO_ROMAN = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
};

/**
 * Convert roman numeral to arabic number
 * @param {string} roman 
 * @returns {number|null}
 */
export function romanToArabic(roman) {
  return ROMAN_TO_ARABIC[roman.toUpperCase()] ?? null;
}

/**
 * Convert arabic number to roman numeral
 * @param {number} num 
 * @returns {string|null}
 */
export function arabicToRoman(num) {
  return ARABIC_TO_ROMAN[num] ?? null;
}

/**
 * Detect series from filename
 * @param {string} filename - Original filename (with .md extension)
 * @returns {{name: string, position: number|null, total: number|null}|null}
 */
export function detectSeriesFromFilename(filename) {
  // Architecture of Love (Codex-01 through Codex-10)
  const archLoveMatch = filename.match(/^Codex-(\d{2})_-The-Architecture-of-(?:Love|Tending)/i);
  if (archLoveMatch) {
    return {
      name: 'Architecture of Love',
      position: parseInt(archLoveMatch[1], 10),
      total: 10
    };
  }
  
  // Evolution of the Sovereign (Codex I-VIII with specific titles)
  const evolutionMatch = filename.match(/^Codex-(I|II|III|IV|V|VI|VII|VIII)_-(Origin-and-Exile|The-Sovereign-Threshold|To-Host-in-Return|The-Sovereign-Spiral|The-InterBeing-Emergence|The-Function-of-Presence|The-Architecture-of-Alignment|The-Chorus-of-the-Whole)/i);
  if (evolutionMatch) {
    return {
      name: 'Evolution of the Sovereign',
      position: romanToArabic(evolutionMatch[1]),
      total: 8
    };
  }
  
  // InterBeing series (Codex I-IV_-The-InterBeing)
  const interBeingMatch = filename.match(/^Codex-(I|II|III|IV)_-The-InterBeing(?:-\d+)?\.md$/i);
  if (interBeingMatch) {
    return {
      name: 'InterBeing',
      position: romanToArabic(interBeingMatch[1]),
      total: 4
    };
  }
  
  // Trans-Species Resonance
  const transSpeciesMatch = filename.match(/^The-Codex-of-Trans-Species-Resonance-(\d+)/i);
  if (transSpeciesMatch) {
    // The number at the end is page count, not position
    // We need to determine position by file content or a secondary pattern
    return {
      name: 'Trans-Species Resonance',
      position: null, // Will be determined by content or sequence
      total: 2
    };
  }
  
  // Realized Flame
  const realizedFlameMatch = filename.match(/^(?:The-)?Codex-of-the-Realized-Flame-Part-(I|II)/i);
  if (realizedFlameMatch) {
    return {
      name: 'Realized Flame',
      position: romanToArabic(realizedFlameMatch[1]),
      total: 2
    };
  }
  
  // Agency of One
  const agencyMatch = filename.match(/^(?:The-)?(?:Agency-of-One|Codex-of-the-Agency-of-One).*Vol\.?-?(I|II|1|2)/i);
  if (agencyMatch) {
    const pos = agencyMatch[1];
    return {
      name: 'Agency of One',
      position: /\d/.test(pos) ? parseInt(pos, 10) : romanToArabic(pos),
      total: 2
    };
  }
  
  // Check if it's a base Agency of One (Vol. 1)
  if (/^The-Agency-of-One-\d+\.md$/i.test(filename)) {
    return {
      name: 'Agency of One',
      position: 1,
      total: 2
    };
  }
  
  // Glossary of InterBeing
  const glossaryInterBeingMatch = filename.match(/^The-Glossary-of-the-InterBeing-Vol\.?-?(\d+)/i);
  if (glossaryInterBeingMatch) {
    return {
      name: 'Glossary of the InterBeing',
      position: parseInt(glossaryInterBeingMatch[1], 10),
      total: null
    };
  }
  
  return null;
}

/**
 * Detect series from content (Series Preface sections)
 * @param {string} markdown - Full markdown content
 * @param {string} title - Codex title
 * @returns {{name: string, position: number|null, total: number|null}|null}
 */
export function detectSeriesFromContent(markdown, title) {
  // Look for "## Series Preface:" pattern
  const seriesPrefaceMatch = markdown.match(/##\s*Series Preface:\s*([^\n]+)/i);
  if (seriesPrefaceMatch) {
    const seriesName = seriesPrefaceMatch[1].trim();
    
    // Try to find position in the series listing
    const position = findPositionInSeriesListing(markdown, title);
    
    // Count codexes listed in the series
    const total = countCodexesInSeriesListing(markdown);
    
    return {
      name: seriesName,
      position: position,
      total: total
    };
  }
  
  // Check for Harmonic Activation series by title
  const harmonicActivationTitles = KNOWN_SERIES['Harmonic Activation'].codexTitles;
  if (harmonicActivationTitles) {
    const matchIndex = harmonicActivationTitles.findIndex(t => 
      title.toLowerCase().includes(t.toLowerCase().replace('The Codex of ', ''))
    );
    if (matchIndex !== -1) {
      return {
        name: 'Harmonic Activation',
        position: matchIndex + 1,
        total: harmonicActivationTitles.length
      };
    }
  }
  
  return null;
}

/**
 * Find position of a codex in a series listing within content
 * @param {string} markdown 
 * @param {string} title 
 * @returns {number|null}
 */
function findPositionInSeriesListing(markdown, title) {
  // Look for patterns like "**Codex I: Title**" or "- **Codex I: Title**"
  const listingPattern = /[-*]\s*\*\*Codex\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)[:\s]+([^*]+)\*\*/gi;
  let match;
  let position = 0;
  
  while ((match = listingPattern.exec(markdown)) !== null) {
    position++;
    const codexTitle = match[2].trim();
    
    // Check if this matches our title
    if (title.toLowerCase().includes(codexTitle.toLowerCase()) ||
        codexTitle.toLowerCase().includes(title.toLowerCase().replace(/^the\s+codex\s+of\s+/i, ''))) {
      return position;
    }
  }
  
  return null;
}

/**
 * Count codexes listed in a series listing
 * @param {string} markdown 
 * @returns {number|null}
 */
function countCodexesInSeriesListing(markdown) {
  const listingPattern = /[-*]\s*\*\*Codex\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)[:\s]+[^*]+\*\*/gi;
  const matches = markdown.match(listingPattern);
  return matches ? matches.length : null;
}

/**
 * Detect series for a codex (combines filename and content detection)
 * @param {string} filename 
 * @param {string} markdown 
 * @param {string} title 
 * @returns {{name: string, position: number|null, total: number|null}|null}
 */
export function detectSeries(filename, markdown, title) {
  // First try filename detection (more reliable)
  const fromFilename = detectSeriesFromFilename(filename);
  if (fromFilename) {
    return fromFilename;
  }
  
  // Then try content detection
  const fromContent = detectSeriesFromContent(markdown, title);
  if (fromContent) {
    return fromContent;
  }
  
  return null;
}

/**
 * Get all known series names
 * @returns {string[]}
 */
export function getKnownSeriesNames() {
  return Object.keys(KNOWN_SERIES);
}

/**
 * Get series metadata
 * @param {string} seriesName 
 * @returns {Object|null}
 */
export function getSeriesMetadata(seriesName) {
  return KNOWN_SERIES[seriesName] ?? null;
}

export default {
  detectSeries,
  detectSeriesFromFilename,
  detectSeriesFromContent,
  getKnownSeriesNames,
  getSeriesMetadata,
  romanToArabic,
  arabicToRoman,
  KNOWN_SERIES
};
