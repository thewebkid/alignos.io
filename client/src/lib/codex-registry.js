/**
 * CodexRegistry - Central registry managing all codexes
 * 
 * Provides multiple lookup indices, search, and series management.
 * This is the isomorphic core - works in both browser and Node.js.
 */

import { Codex } from './codex.js';

/**
 * @typedef {Object} SearchResult
 * @property {Codex} codex - The matching codex
 * @property {number} score - Relevance score (higher is better)
 * @property {'title'|'keyword'|'content'|'series'} match - What matched
 * @property {string} [snippet] - Context snippet for content matches
 * @property {number} [matchCount] - Number of matches in content (only for content matches)
 */

/**
 * @typedef {Object} SearchOptions
 * @property {('title'|'keyword'|'content'|'series')[]} [searchIn] - Fields to search
 * @property {number} [limit] - Maximum results
 * @property {boolean} [fuzzy] - Enable fuzzy matching
 * @property {boolean} [includeMatchCount] - Include match count for content results
 */

export class CodexRegistry {
  constructor() {
    // Primary storage
    /** @type {Map<string, Codex>} id -> Codex */
    this.codexes = new Map();
    
    // Lookup indices
    /** @type {Map<string, Codex>} filename -> Codex */
    this.byFilename = new Map();
    
    /** @type {Map<number, Codex>} sequence -> Codex */
    this.bySequence = new Map();
    
    /** @type {Map<string, Codex>} lowercase title -> Codex */
    this.byTitle = new Map();
    
    // Series management
    /** @type {Map<string, Codex[]>} seriesName -> Codex[] */
    this.series = new Map();
    
    // Keyword index
    /** @type {Map<string, Set<string>>} keyword -> Set<codexId> */
    this.keywordIndex = new Map();
    
    // Glossary term index
    /** @type {Map<string, Set<string>>} term -> Set<codexId> */
    this.glossaryTermIndex = new Map();
    
    // Statistics
    this.stats = {
      totalCodexes: 0,
      totalWords: 0,
      seriesCount: 0,
      keywordCount: 0
    };
  }

  /**
   * Load codexes from parsed JSON data
   * @param {Object[]} data - Array of codex data objects
   * @param {typeof Codex} [CodexClass=Codex] - Class to instantiate (allows for extensions)
   * @returns {CodexRegistry} this (for chaining)
   */
  loadFromData(data, CodexClass = Codex) {
    for (const item of data) {
      const codex = new CodexClass(item);
      // Mark content as loaded if markdown is present (full lattice)
      if (codex.markdown) {
        codex._contentLoaded = true;
      }
      this.addCodex(codex);
    }
    
    // Post-processing
    this.sortSeriesCodexes();
    this.computeStats();
    
    return this;
  }

  /**
   * Load full content for a codex by ID (lazy loading)
   * @param {string} id - Codex ID
   * @returns {Promise<Object>} Content object with markdown, registry, specialSections
   */
  async loadFullContent(id) {
    // Fetch from /codex-content/{id}.json
    const response = await fetch(`/codex-content/${id}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load content for codex: ${id}`);
    }
    return await response.json();
  }

  /**
   * Ensure a codex has full content loaded
   * @param {string} id - Codex ID
   * @returns {Promise<Codex>} The codex with loaded content
   */
  async ensureContentLoaded(id) {
    const codex = this.get(id);
    if (!codex) {
      throw new Error(`Codex not found: ${id}`);
    }

    if (!codex.isContentLoaded()) {
      await codex.loadContent(this.loadFullContent.bind(this));
    }

    return codex;
  }

  /**
   * Add a codex to the registry
   * @param {Codex} codex 
   */
  addCodex(codex) {
    // Primary storage
    this.codexes.set(codex.id, codex);
    
    // Filename index
    this.byFilename.set(codex.originalFileName, codex);
    
    // Sequence index
    if (codex.sequence !== null) {
      this.bySequence.set(codex.sequence, codex);
    }
    
    // Title index (lowercase for case-insensitive lookup)
    this.byTitle.set(codex.title.toLowerCase(), codex);
    
    // Series index
    if (codex.series) {
      if (!this.series.has(codex.series.name)) {
        this.series.set(codex.series.name, []);
      }
      this.series.get(codex.series.name).push(codex);
    }
    
    // Keyword index
    for (const keyword of codex.keywords) {
      const keyLower = keyword.toLowerCase();
      if (!this.keywordIndex.has(keyLower)) {
        this.keywordIndex.set(keyLower, new Set());
      }
      this.keywordIndex.get(keyLower).add(codex.id);
    }
    
    // Glossary term index
    for (const term of codex.glossaryTerms) {
      const termLower = term.toLowerCase();
      if (!this.glossaryTermIndex.has(termLower)) {
        this.glossaryTermIndex.set(termLower, new Set());
      }
      this.glossaryTermIndex.get(termLower).add(codex.id);
    }
  }

  /**
   * Sort codexes within each series by position
   */
  sortSeriesCodexes() {
    for (const [, codexes] of this.series) {
      codexes.sort((a, b) => {
        // Sort by position if available, otherwise by sequence
        const posA = a.series?.position ?? a.sequence ?? 999;
        const posB = b.series?.position ?? b.sequence ?? 999;
        return posA - posB;
      });
    }
  }

  /**
   * Compute registry statistics
   */
  computeStats() {
    this.stats.totalCodexes = this.codexes.size;
    this.stats.seriesCount = this.series.size;
    this.stats.keywordCount = this.keywordIndex.size;
    
    let totalWords = 0;
    for (const codex of this.codexes.values()) {
      totalWords += codex.wordCount;
    }
    this.stats.totalWords = totalWords;
  }

  // ============================================================
  // Lookup methods
  // ============================================================

  /**
   * Get codex by ID
   * @param {string} id 
   * @returns {Codex|undefined}
   */
  get(id) {
    return this.codexes.get(id);
  }

  /**
   * Get codex by original filename
   * @param {string} filename 
   * @returns {Codex|undefined}
   */
  getByFilename(filename) {
    return this.byFilename.get(filename);
  }

  /**
   * Get codex by sequence number
   * @param {number} seq 
   * @returns {Codex|undefined}
   */
  getBySequence(seq) {
    return this.bySequence.get(seq);
  }

  /**
   * Get codex by title (case-insensitive)
   * @param {string} title 
   * @returns {Codex|undefined}
   */
  getByTitle(title) {
    return this.byTitle.get(title.toLowerCase());
  }

  /**
   * Get all codexes in a series
   * @param {string} seriesName 
   * @returns {Codex[]}
   */
  getSeries(seriesName) {
    return this.series.get(seriesName) ?? [];
  }

  /**
   * Get siblings of a codex (other codexes in same series)
   * @param {Codex|string} codexOrId 
   * @returns {Codex[]}
   */
  getSiblings(codexOrId) {
    const codex = typeof codexOrId === 'string' ? this.get(codexOrId) : codexOrId;
    if (!codex || !codex.series) return [];
    
    return this.getSeries(codex.series.name).filter(c => c.id !== codex.id);
  }

  /**
   * Get all codexes
   * @returns {Codex[]}
   */
  getAll() {
    return Array.from(this.codexes.values());
  }

  /**
   * Get all codexes sorted by sequence
   * @returns {Codex[]}
   */
  getAllBySequence() {
    return this.getAll()
      .filter(c => c.sequence !== null)
      .sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * Get all series names
   * @returns {string[]}
   */
  getSeriesNames() {
    return Array.from(this.series.keys());
  }

  /**
   * Get all unique keywords
   * @returns {string[]}
   */
  getAllKeywords() {
    return Array.from(this.keywordIndex.keys());
  }

  /**
   * Get codexes by keyword
   * @param {string} keyword 
   * @returns {Codex[]}
   */
  getByKeyword(keyword) {
    const ids = this.keywordIndex.get(keyword.toLowerCase());
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)).filter(Boolean);
  }

  /**
   * Get codexes that use a glossary term
   * @param {string} term 
   * @returns {Codex[]}
   */
  getByGlossaryTerm(term) {
    const ids = this.glossaryTermIndex.get(term.toLowerCase());
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)).filter(Boolean);
  }

  // ============================================================
  // Search methods
  // ============================================================

  /**
   * Search codexes
   * @param {string} query 
   * @param {SearchOptions} [options={}] 
   * @returns {SearchResult[]}
   */
  search(query, options = {}) {
    const {
      searchIn = ['title', 'keyword', 'content'],
      limit = 10,
      fuzzy = false,
      includeMatchCount = false
    } = options;
    
    const results = [];
    const queryLower = query.toLowerCase();
    const addedIds = new Set();
    
    // Helper to add result without duplicates (or upgrade existing)
    const addResult = (codex, score, match, snippet = null, matchCount = null) => {
      if (!addedIds.has(codex.id)) {
        addedIds.add(codex.id);
        results.push({ codex, score, match, snippet, matchCount });
      } else {
        // Upgrade existing result if new score is higher
        const existingResult = results.find(r => r.codex.id === codex.id);
        if (existingResult && score > existingResult.score) {
          existingResult.score = score;
          existingResult.match = match;
          existingResult.snippet = snippet;
          existingResult.matchCount = matchCount;
        }
      }
    };
    
    // Title search (highest priority)
    if (searchIn.includes('title')) {
      for (const codex of this.codexes.values()) {
        const titleLower = codex.title.toLowerCase();
        
        if (titleLower === queryLower) {
          // Exact match
          addResult(codex, 100, 'title');
        } else if (titleLower.includes(queryLower)) {
          // Partial match - score based on position and coverage
          const coverage = queryLower.length / titleLower.length;
          const position = titleLower.indexOf(queryLower);
          const score = 80 - (position * 2) + (coverage * 20);
          addResult(codex, Math.max(50, score), 'title');
        } else if (fuzzy && this.fuzzyMatch(titleLower, queryLower)) {
          addResult(codex, 30, 'title');
        }
      }
    }
    
    // Content search (do this BEFORE keyword search so we get snippets)
    if (searchIn.includes('content')) {
      for (const codex of this.codexes.values()) {
        if (codex.containsText(query)) {
          const snippet = codex.getSnippet(query);
          // Always count matches for better ranking
          const matchCount = this.countMatches(codex, query);
          // Score based on match count: base 45 + bonus for multiple matches
          // More matches = higher relevance (up to +50 bonus)
          const matchBonus = Math.min(50, matchCount * 2);
          const score = 45 + matchBonus;
          addResult(codex, score, 'content', snippet, matchCount);
        }
      }
    }
    
    // Keyword search (lower priority, only adds if no content match)
    if (searchIn.includes('keyword')) {
      for (const [keyword, codexIds] of this.keywordIndex) {
        if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
          const matchScore = keyword === queryLower ? 25 : 20;
          for (const id of codexIds) {
            const codex = this.get(id);
            if (codex && !addedIds.has(codex.id)) {
              addResult(codex, matchScore, 'keyword');
            }
          }
        }
      }
    }
    
    // Series name search
    if (searchIn.includes('series')) {
      for (const [seriesName, codexes] of this.series) {
        if (seriesName.toLowerCase().includes(queryLower)) {
          for (const codex of codexes) {
            if (!addedIds.has(codex.id)) {
              addResult(codex, 15, 'series');
            }
          }
        }
      }
    }
    
    // Sort by score and apply limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Count total matches of query in a codex's content
   * @param {Codex} codex 
   * @param {string} query 
   * @returns {number}
   */
  countMatches(codex, query) {
    if (!codex.markdown) return 0;
    const lower = codex.markdown.toLowerCase();
    const queryLower = query.toLowerCase();
    let count = 0;
    let pos = 0;
    while ((pos = lower.indexOf(queryLower, pos)) !== -1) {
      count++;
      pos += queryLower.length;
    }
    return count;
  }

  /**
   * Get total count of matching codexes (without limit)
   * @param {string} query 
   * @param {SearchOptions} [options={}] 
   * @returns {number}
   */
  getTotalResultCount(query, options = {}) {
    const { searchIn = ['title', 'keyword', 'content'], fuzzy = false } = options;
    const queryLower = query.toLowerCase();
    const matchedIds = new Set();
    
    // Title search
    if (searchIn.includes('title')) {
      for (const codex of this.codexes.values()) {
        const titleLower = codex.title.toLowerCase();
        if (titleLower === queryLower || titleLower.includes(queryLower)) {
          matchedIds.add(codex.id);
        } else if (fuzzy && this.fuzzyMatch(titleLower, queryLower)) {
          matchedIds.add(codex.id);
        }
      }
    }
    
    // Keyword search
    if (searchIn.includes('keyword')) {
      for (const [keyword, codexIds] of this.keywordIndex) {
        if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
          for (const id of codexIds) {
            matchedIds.add(id);
          }
        }
      }
    }
    
    // Series name search
    if (searchIn.includes('series')) {
      for (const [seriesName, codexes] of this.series) {
        if (seriesName.toLowerCase().includes(queryLower)) {
          for (const codex of codexes) {
            matchedIds.add(codex.id);
          }
        }
      }
    }
    
    // Content search
    if (searchIn.includes('content')) {
      for (const codex of this.codexes.values()) {
        if (!matchedIds.has(codex.id) && codex.containsText(query)) {
          matchedIds.add(codex.id);
        }
      }
    }
    
    return matchedIds.size;
  }

  /**
   * Simple fuzzy matching (allows for typos)
   * @param {string} str1 
   * @param {string} str2 
   * @returns {boolean}
   */
  fuzzyMatch(str1, str2) {
    // Simple Levenshtein distance check
    if (Math.abs(str1.length - str2.length) > 3) return false;
    
    const distance = this.levenshteinDistance(str1, str2);
    const threshold = Math.max(1, Math.floor(Math.min(str1.length, str2.length) / 4));
    
    return distance <= threshold;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} s1 
   * @param {string} s2 
   * @returns {number}
   */
  levenshteinDistance(s1, s2) {
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    
    const matrix = [];
    
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2[i - 1] === s1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[s2.length][s1.length];
  }

  /**
   * Search only by title (optimized)
   * @param {string} query 
   * @param {number} [limit=10] 
   * @returns {Codex[]}
   */
  searchByTitle(query, limit = 10) {
    return this.search(query, { searchIn: ['title'], limit })
      .map(r => r.codex);
  }

  /**
   * Search only by keyword (optimized)
   * @param {string} keyword 
   * @param {number} [limit=10] 
   * @returns {Codex[]}
   */
  searchByKeyword(keyword, limit = 10) {
    return this.search(keyword, { searchIn: ['keyword'], limit })
      .map(r => r.codex);
  }

  /**
   * Full-text search in content
   * @param {string} query 
   * @param {number} [limit=10] 
   * @returns {SearchResult[]}
   */
  searchContent(query, limit = 10) {
    return this.search(query, { searchIn: ['content'], limit });
  }

  // ============================================================
  // Navigation methods
  // ============================================================

  /**
   * Get previous and next codex by sequence
   * @param {Codex|string} codexOrId 
   * @returns {{prev: Codex|null, next: Codex|null}}
   */
  getAdjacentBySequence(codexOrId) {
    const codex = typeof codexOrId === 'string' ? this.get(codexOrId) : codexOrId;
    if (!codex || codex.sequence === null) {
      return { prev: null, next: null };
    }
    
    return {
      prev: this.bySequence.get(codex.sequence - 1) ?? null,
      next: this.bySequence.get(codex.sequence + 1) ?? null
    };
  }

  /**
   * Get previous and next codex within a series
   * @param {Codex|string} codexOrId 
   * @returns {{prev: Codex|null, next: Codex|null}}
   */
  getAdjacentInSeries(codexOrId) {
    const codex = typeof codexOrId === 'string' ? this.get(codexOrId) : codexOrId;
    if (!codex || !codex.series) {
      return { prev: null, next: null };
    }
    
    const seriesCodexes = this.getSeries(codex.series.name);
    const index = seriesCodexes.findIndex(c => c.id === codex.id);
    
    return {
      prev: index > 0 ? seriesCodexes[index - 1] : null,
      next: index < seriesCodexes.length - 1 ? seriesCodexes[index + 1] : null
    };
  }

  // ============================================================
  // Related codexes
  // ============================================================

  /**
   * Get related codexes based on shared keywords/terms
   * @param {Codex|string} codexOrId 
   * @param {number} [limit=5] 
   * @returns {Codex[]}
   */
  getRelated(codexOrId, limit = 5) {
    const codex = typeof codexOrId === 'string' ? this.get(codexOrId) : codexOrId;
    if (!codex) return [];
    
    const scores = new Map();
    
    // Score by shared keywords
    for (const keyword of codex.keywords) {
      const related = this.getByKeyword(keyword);
      for (const r of related) {
        if (r.id !== codex.id) {
          scores.set(r.id, (scores.get(r.id) ?? 0) + 3);
        }
      }
    }
    
    // Score by shared glossary terms
    for (const term of codex.glossaryTerms) {
      const related = this.getByGlossaryTerm(term);
      for (const r of related) {
        if (r.id !== codex.id) {
          scores.set(r.id, (scores.get(r.id) ?? 0) + 1);
        }
      }
    }
    
    // Score by same series (but not same codex)
    if (codex.series) {
      const siblings = this.getSiblings(codex);
      for (const s of siblings) {
        scores.set(s.id, (scores.get(s.id) ?? 0) + 5);
      }
    }
    
    // Sort by score and return top matches
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.get(id))
      .filter(Boolean);
  }

  // ============================================================
  // Utility methods
  // ============================================================

  /**
   * Get registry statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Check if registry has a codex
   * @param {string} id 
   * @returns {boolean}
   */
  has(id) {
    return this.codexes.has(id);
  }

  /**
   * Get count of codexes
   * @returns {number}
   */
  get size() {
    return this.codexes.size;
  }

  /**
   * Iterate over all codexes
   * @returns {IterableIterator<Codex>}
   */
  [Symbol.iterator]() {
    return this.codexes.values();
  }

  /**
   * Export all codexes as JSON array
   * @returns {Object[]}
   */
  toJSON() {
    return this.getAll().map(c => c.toJSON());
  }
}

export default CodexRegistry;
