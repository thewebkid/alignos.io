/**
 * Codex Lattice Library
 * 
 * Main entry point for the Codex Lattice library.
 * Exports all public classes and utilities.
 */

// Core classes (isomorphic)
export { Codex } from './codex.js';
export { CodexRegistry } from './codex-registry.js';
export { GlossaryManager, createGlossaryFromRegistry } from './glossary.js';

// Series detection
export { 
  detectSeries, 
  detectSeriesFromFilename, 
  detectSeriesFromContent,
  getKnownSeriesNames,
  getSeriesMetadata,
  romanToArabic,
  arabicToRoman,
  KNOWN_SERIES 
} from './series-detector.js';

// Browser-specific (only import in browser context)
export { 
  BrowserCodex, 
  toBrowserCodex, 
  createBrowserCodex 
} from './codex-browser.js';

// Utility
export { markdown2Html } from './markdown.js';

/**
 * Initialize the full Codex Lattice system
 * @param {Object[]} latticeData - The parsed lattice JSON data
 * @returns {{registry: CodexRegistry, glossary: GlossaryManager}}
 */
export function initializeLattice(latticeData) {
  // Create registry with browser-enhanced codexes
  const registry = new CodexRegistry().loadFromData(latticeData, BrowserCodex);
  
  // Create glossary from the Living Glossary codex
  const glossary = createGlossaryFromRegistry(registry);
  
  return { registry, glossary };
}
