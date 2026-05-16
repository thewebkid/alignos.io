/**
 * CodexLinker - Automatically links codex references in HTML content
 * 
 * Uses a best-effort approach:
 * - Builds a title lookup map from all existing codexes
 * - Scans rendered HTML for <strong> tags that match known titles
 * - Only creates links for codexes that exist (unknown references stay as bold text)
 * - Gracefully handles inconsistent naming patterns
 */

/**
 * Normalize a title for flexible matching
 * "The Codex of Harmonic Service" -> "codex of harmonic service"
 * @param {string} title 
 * @returns {string}
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/^the\s+/, '')        // Remove leading "The "
    .replace(/[^\w\s]/g, ' ')      // Replace punctuation with spaces
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}

/**
 * Generate variations of a title for matching
 * @param {string} title 
 * @returns {string[]}
 */
function generateTitleVariations(title) {
  const variations = [];
  const normalized = normalizeTitle(title);
  
  // Full normalized title
  variations.push(normalized);
  
  // Without subtitle (split on colon)
  // "Codex VIII: The Chorus of the Whole" -> "Codex VIII"
  const colonParts = title.split(':');
  if (colonParts.length > 1) {
    variations.push(normalizeTitle(colonParts[0]));
    // Also the part after the colon
    variations.push(normalizeTitle(colonParts.slice(1).join(':')));
  }
  
  // Handle "Codex of X" pattern - also match just "X"
  // "The Codex of Harmonic Service" -> "harmonic service"
  const codexOfMatch = normalized.match(/codex of (.+)/);
  if (codexOfMatch) {
    variations.push(codexOfMatch[1]);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Build a lookup map of normalized titles to codex IDs
 * @param {import('./codex-registry.js').CodexRegistry} registry 
 * @returns {Map<string, string>} normalized title -> codex id
 */
export function buildTitleMap(registry) {
  const map = new Map();
  
  for (const codex of registry) {
    const variations = generateTitleVariations(codex.title);
    
    for (const variation of variations) {
      // Don't overwrite if a more specific match already exists
      if (!map.has(variation)) {
        map.set(variation, codex.id);
      }
    }
  }
  
  return map;
}

/**
 * Find a codex ID for a given reference text
 * @param {string} text - The text to look up (e.g., "Codex I: Origin and Exile")
 * @param {Map<string, string>} titleMap 
 * @returns {string|null} codex ID or null if not found
 */
export function findCodexId(text, titleMap) {
  const variations = generateTitleVariations(text);
  
  for (const variation of variations) {
    if (titleMap.has(variation)) {
      return titleMap.get(variation);
    }
  }
  
  return null;
}

/**
 * Inject codex links into HTML content
 * Replaces <strong> tags that match known codex titles with links
 * 
 * @param {string} html - The HTML content to process
 * @param {import('./codex-registry.js').CodexRegistry} registry 
 * @param {Map<string, string>} [titleMap] - Pre-built title map (optional, will build if not provided)
 * @returns {string} HTML with codex links injected
 */
export function injectCodexLinks(html, registry, titleMap = null) {
  if (!registry) return html;
  
  // Build title map if not provided
  const map = titleMap || buildTitleMap(registry);
  
  // Pattern to match <strong> tags with potential codex references
  // Looks for patterns like:
  // - "Codex I: Origin and Exile"
  // - "The Codex of Harmonic Service"
  // - "Codex of Vows"
  const strongPattern = /<strong>([^<]*(?:Codex|codex)[^<]*)<\/strong>/gi;
  
  return html.replace(strongPattern, (match, text) => {
    const codexId = findCodexId(text, map);
    
    if (codexId) {
      // Found a match - create a link
      return `<a href="/codex/${codexId}" class="codex-link">${text}</a>`;
    }
    
    // No match - return original bold text unchanged
    return match;
  });
}

/**
 * Create a CodexLinker instance for a registry
 * Caches the title map for repeated use
 */
export class CodexLinker {
  /**
   * @param {import('./codex-registry.js').CodexRegistry} registry 
   */
  constructor(registry) {
    this.registry = registry;
    this.titleMap = buildTitleMap(registry);
  }
  
  /**
   * Inject links into HTML
   * @param {string} html 
   * @returns {string}
   */
  injectLinks(html) {
    return injectCodexLinks(html, this.registry, this.titleMap);
  }
  
  /**
   * Find a codex ID for reference text
   * @param {string} text 
   * @returns {string|null}
   */
  findCodex(text) {
    return findCodexId(text, this.titleMap);
  }
  
  /**
   * Check if a reference would link to an existing codex
   * @param {string} text 
   * @returns {boolean}
   */
  hasMatch(text) {
    return this.findCodex(text) !== null;
  }
  
  /**
   * Get all indexed title variations (for debugging)
   * @returns {string[]}
   */
  getIndexedTitles() {
    return Array.from(this.titleMap.keys()).sort();
  }
}

export default CodexLinker;
