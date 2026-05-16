/**
 * Search Index - Full-text search for the Codex Lattice
 * 
 * This module provides an optional full-text search capability using lunr.js.
 * If lunr.js is not installed, it falls back to the basic search in CodexRegistry.
 * 
 * To enable full-text search:
 *   npm install lunr
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Codex ID
 * @property {number} score - Relevance score (higher is better)
 * @property {Object} matchData - Details about what matched
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string[]} [fields] - Fields to search (title, keywords, content)
 * @property {number} [limit] - Maximum results
 * @property {boolean} [fuzzy] - Enable fuzzy matching
 */

let lunr = null;

/**
 * Attempt to load lunr.js dynamically
 * @returns {Promise<boolean>} Whether lunr was loaded successfully
 */
async function loadLunr() {
  if (lunr !== null) return lunr !== false;
  
  try {
    // Try dynamic import
    const module = await import('lunr');
    lunr = module.default || module;
    return true;
  } catch (e) {
    // lunr not installed - use fallback
    lunr = false;
    console.warn('lunr.js not installed. Using basic search. Install with: npm install lunr');
    return false;
  }
}

/**
 * CodexSearchIndex - Full-text search index for codexes
 */
export class CodexSearchIndex {
  /**
   * @param {import('./codex-registry.js').CodexRegistry} registry 
   */
  constructor(registry) {
    this.registry = registry;
    this.index = null;
    this.isLunrAvailable = false;
    this.isBuilt = false;
  }

  /**
   * Build the search index
   * @returns {Promise<boolean>} Whether the full-text index was built
   */
  async build() {
    this.isLunrAvailable = await loadLunr();
    
    if (!this.isLunrAvailable) {
      this.isBuilt = true;
      return false;
    }
    
    // Build lunr index
    const registry = this.registry;
    
    this.index = lunr(function() {
      // Configure fields with boosting
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('keywords', { boost: 5 });
      this.field('seriesName', { boost: 3 });
      this.field('coreTransmission', { boost: 2 });
      this.field('content', { boost: 1 });
      
      // Disable stemming for better exact matches
      this.pipeline.remove(lunr.stemmer);
      this.searchPipeline.remove(lunr.stemmer);
      
      // Add all codexes to the index
      for (const codex of registry) {
        this.add({
          id: codex.id,
          title: codex.title,
          keywords: codex.keywords.join(' '),
          seriesName: codex.series?.name || '',
          coreTransmission: codex.registry?.core_transmission || '',
          content: codex.markdown
        });
      }
    });
    
    this.isBuilt = true;
    return true;
  }

  /**
   * Search the index
   * @param {string} query 
   * @param {SearchOptions} [options={}]
   * @returns {import('./codex.js').Codex[]}
   */
  search(query, options = {}) {
    const { limit = 10, fuzzy = false } = options;
    
    if (!this.isBuilt) {
      console.warn('Search index not built. Call build() first.');
      return this.registry.search(query, { limit }).map(r => r.codex);
    }
    
    // Use lunr if available
    if (this.isLunrAvailable && this.index) {
      return this.searchWithLunr(query, options);
    }
    
    // Fallback to basic registry search
    return this.registry.search(query, { limit, fuzzy }).map(r => r.codex);
  }

  /**
   * Search using lunr.js
   * @param {string} query 
   * @param {SearchOptions} options 
   * @returns {import('./codex.js').Codex[]}
   */
  searchWithLunr(query, options = {}) {
    const { limit = 10, fuzzy = false } = options;
    
    try {
      // Build search query
      let searchQuery = query;
      
      if (fuzzy) {
        // Add fuzzy matching (edit distance of 1)
        searchQuery = query.split(/\s+/)
          .map(term => `${term}~1`)
          .join(' ');
      }
      
      // Execute search
      const results = this.index.search(searchQuery);
      
      // Map to codexes
      return results
        .slice(0, limit)
        .map(result => this.registry.get(result.ref))
        .filter(Boolean);
        
    } catch (e) {
      // If lunr query fails (invalid syntax), fall back to basic search
      console.warn('Lunr search failed, using fallback:', e.message);
      return this.registry.search(query, { limit }).map(r => r.codex);
    }
  }

  /**
   * Search with highlighted snippets
   * @param {string} query 
   * @param {SearchOptions} [options={}]
   * @returns {Array<{codex: import('./codex.js').Codex, snippet: string|null, score: number}>}
   */
  searchWithSnippets(query, options = {}) {
    const { limit = 10 } = options;
    
    // Get search results
    const codexes = this.search(query, options);
    
    // Add snippets
    return codexes.map((codex, index) => ({
      codex,
      snippet: codex.getSnippet(query),
      score: 100 - (index * 10) // Simple score based on position
    }));
  }

  /**
   * Search only in titles
   * @param {string} query 
   * @param {number} [limit=10]
   * @returns {import('./codex.js').Codex[]}
   */
  searchTitles(query, limit = 10) {
    if (this.isLunrAvailable && this.index) {
      try {
        const results = this.index.search(`title:${query}`);
        return results
          .slice(0, limit)
          .map(r => this.registry.get(r.ref))
          .filter(Boolean);
      } catch (e) {
        // Fall through to basic search
      }
    }
    
    return this.registry.searchByTitle(query, limit);
  }

  /**
   * Search by keyword
   * @param {string} keyword 
   * @param {number} [limit=10]
   * @returns {import('./codex.js').Codex[]}
   */
  searchKeywords(keyword, limit = 10) {
    if (this.isLunrAvailable && this.index) {
      try {
        const results = this.index.search(`keywords:${keyword}`);
        return results
          .slice(0, limit)
          .map(r => this.registry.get(r.ref))
          .filter(Boolean);
      } catch (e) {
        // Fall through to basic search
      }
    }
    
    return this.registry.searchByKeyword(keyword, limit);
  }

  /**
   * Get search suggestions (autocomplete)
   * @param {string} prefix 
   * @param {number} [limit=5]
   * @returns {string[]}
   */
  getSuggestions(prefix, limit = 5) {
    const suggestions = new Set();
    const prefixLower = prefix.toLowerCase();
    
    // Search titles
    for (const codex of this.registry) {
      if (codex.title.toLowerCase().startsWith(prefixLower)) {
        suggestions.add(codex.title);
      }
      if (suggestions.size >= limit) break;
    }
    
    // Search keywords if we need more
    if (suggestions.size < limit) {
      for (const keyword of this.registry.getAllKeywords()) {
        if (keyword.toLowerCase().startsWith(prefixLower)) {
          suggestions.add(keyword);
        }
        if (suggestions.size >= limit) break;
      }
    }
    
    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get statistics about the search index
   * @returns {Object}
   */
  getStats() {
    return {
      isBuilt: this.isBuilt,
      isLunrAvailable: this.isLunrAvailable,
      codexCount: this.registry.size,
      keywordCount: this.registry.getAllKeywords().length
    };
  }
}

/**
 * Create and build a search index from a registry
 * @param {import('./codex-registry.js').CodexRegistry} registry 
 * @returns {Promise<CodexSearchIndex>}
 */
export async function createSearchIndex(registry) {
  const index = new CodexSearchIndex(registry);
  await index.build();
  return index;
}

export default CodexSearchIndex;
