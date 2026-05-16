/**
 * Codex - Base class representing a single codex document
 * 
 * This is the isomorphic core - works in both browser and Node.js
 * No DOM dependencies here.
 */

/**
 * @typedef {Object} CodexSeries
 * @property {string} name - Name of the series
 * @property {number|null} position - Position within the series (1-based)
 * @property {number|null} total - Total codexes in series (if known)
 */

/**
 * @typedef {Object} CodexRegistry
 * @property {string|null} title - Registry title
 * @property {string|null} classification - e.g., "Reference Codex", "Micro-Codex", "Bridge Codex"
 * @property {string|null} codexSeries - Series name from registry
 * @property {string|null} toneMarker - Emotional/energetic signature
 * @property {string|null} position - Position descriptor
 * @property {string[]|null} primaryArchitectures - Core architectural concepts
 * @property {string|null} coreTransmission - Essence statement
 * @property {string[]|null} codexEntries - Section/entry names
 * @property {string[]|null} fieldNotes - Field note titles
 * @property {string|null} closingSeal - Closing seal text
 * @property {string|null} whisper - Whisper text
 * @property {string|null} function - Function description
 */

/**
 * @typedef {Object} SpecialSection
 * @property {string} type - Type of section (stillpoint, fieldNote, dialogicInterlude, whisper, closingSeal)
 * @property {string} heading - Original heading text
 * @property {string} content - Section content
 * @property {number} lineStart - Starting line number
 */

export class Codex {
  /**
   * @param {Object} data - Codex data object
   */
  constructor(data) {
    // Core identity
    this.id = data.id;
    this.title = data.title;
    this.originalFileName = data.originalFileName;
    this.sequence = data.sequence ?? null; // Position in lattice-links (1-based)
    
    // Content (may be lazy-loaded)
    this.markdown = data.markdown ?? null;
    this.coverImage = data.coverImage ?? null;
    this.subtitle = data.subtitle ?? null;
    
    // Content loading state
    this._contentLoaded = data.markdown !== null && data.markdown !== undefined;
    this._contentLoadPromise = null;
    
    // Series & Constellation
    /** @type {CodexSeries|null} */
    this.series = data.series ?? null;
    this.siblingIds = data.siblingIds ?? [];
    
    // Semantic metadata
    this.keywords = data.keywords ?? [];
    this.glossaryTerms = data.glossaryTerms ?? [];
    
    // Computed metadata (for metadata-only codexes)
    this._wordCount = data.wordCount ?? null;
    this._readingTime = data.readingTime ?? null;
    
    // Registry data (parsed from ## Codex Registry section)
    /** @type {CodexRegistry|null} */
    this.registry = data.registry ?? null;
    
    // Special sections extracted during build
    /** @type {SpecialSection[]} */
    this.specialSections = data.specialSections ?? [];
    
    // Lazy-computed caches
    this._sections = null;
  }

  /**
   * Check if full content is loaded
   * @returns {boolean}
   */
  isContentLoaded() {
    return this._contentLoaded;
  }

  /**
   * Load full content if not already loaded
   * @param {Function} [loadFn] - Optional custom load function
   * @returns {Promise<void>}
   */
  async loadContent(loadFn) {
    if (this._contentLoaded) {
      return; // Already loaded
    }

    // If already loading, return the existing promise
    if (this._contentLoadPromise) {
      return this._contentLoadPromise;
    }

    // Start loading
    this._contentLoadPromise = (async () => {
      if (!loadFn) {
        throw new Error('No load function provided for lazy loading content');
      }

      const content = await loadFn(this.id);
      
      // Update content fields
      this.markdown = content.markdown;
      this.registry = content.registry;
      this.specialSections = content.specialSections;
      
      // Mark as loaded
      this._contentLoaded = true;
      this._contentLoadPromise = null;
      
      // Clear caches that depend on content
      this._sections = null;
    })();

    return this._contentLoadPromise;
  }

  // ============================================================
  // Lazy-computed properties
  // ============================================================

  /**
   * Get parsed sections (## headings)
   * @returns {Array<{level: number, heading: string, content: string, lineStart: number}>}
   */
  get sections() {
    if (this._sections === null) {
      this._sections = this.parseSections();
    }
    return this._sections;
  }

  /**
   * Get word count
   * @returns {number}
   */
  get wordCount() {
    if (this._wordCount === null) {
      if (!this.markdown) {
        return 0; // No content loaded yet
      }
      // Strip markdown formatting and count words
      const text = this.markdown
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
        .replace(/[#*_~]/g, '') // Remove formatting chars
        .replace(/<[^>]+>/g, ''); // Remove HTML tags
      
      this._wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    }
    return this._wordCount;
  }

  /**
   * Get estimated reading time in minutes
   * @returns {number}
   */
  get readingTime() {
    if (this._readingTime === null) {
      // Average reading speed: 200-250 words per minute for complex content
      this._readingTime = Math.ceil(this.wordCount / 200);
    }
    return this._readingTime;
  }

  // ============================================================
  // Parsing methods
  // ============================================================

  /**
   * Parse markdown into sections
   * @returns {Array<{level: number, heading: string, content: string, lineStart: number}>}
   */
  parseSections() {
    const sections = [];
    const lines = this.markdown.split('\n');
    let currentSection = null;
    let contentLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          level: headingMatch[1].length,
          heading: headingMatch[2].trim(),
          content: '',
          lineStart: i + 1
        };
        contentLines = [];
      } else if (currentSection) {
        contentLines.push(line);
      }
    }
    
    // Save last section
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      sections.push(currentSection);
    }
    
    return sections;
  }

  // ============================================================
  // Search methods
  // ============================================================

  /**
   * Check if codex contains text (case-insensitive)
   * @param {string} query - Search query
   * @returns {boolean}
   */
  containsText(query) {
    if (!this.markdown) return false;
    const lower = query.toLowerCase();
    return this.markdown.toLowerCase().includes(lower);
  }

  /**
   * Get snippet around a match
   * @param {string} query - Search query
   * @param {number} contextChars - Characters of context on each side
   * @returns {string|null}
   */
  getSnippet(query, contextChars = 100) {
    if (!this.markdown) return null;
    const lower = this.markdown.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return null;
    
    const start = Math.max(0, idx - contextChars);
    const end = Math.min(this.markdown.length, idx + query.length + contextChars);
    
    let snippet = this.markdown.slice(start, end);
    
    // Clean up snippet boundaries
    if (start > 0) snippet = '...' + snippet;
    if (end < this.markdown.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Get all matches with context
   * @param {string} query - Search query
   * @param {number} contextChars - Characters of context
   * @param {number} maxMatches - Maximum matches to return
   * @returns {Array<{index: number, snippet: string}>}
   */
  getAllMatches(query, contextChars = 100, maxMatches = 5) {
    if (!this.markdown) return [];
    const matches = [];
    const lower = this.markdown.toLowerCase();
    const queryLower = query.toLowerCase();
    let searchStart = 0;
    
    while (matches.length < maxMatches) {
      const idx = lower.indexOf(queryLower, searchStart);
      if (idx === -1) break;
      
      const start = Math.max(0, idx - contextChars);
      const end = Math.min(this.markdown.length, idx + query.length + contextChars);
      
      let snippet = this.markdown.slice(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < this.markdown.length) snippet = snippet + '...';
      
      matches.push({ index: idx, snippet });
      searchStart = idx + query.length;
    }
    
    return matches;
  }

  // ============================================================
  // Accessors for special sections
  // ============================================================

  /**
   * Get all stillpoints in this codex
   * @returns {SpecialSection[]}
   */
  getStillpoints() {
    return this.specialSections.filter(s => s.type === 'stillpoint');
  }

  /**
   * Get all field notes in this codex
   * @returns {SpecialSection[]}
   */
  getFieldNotes() {
    return this.specialSections.filter(s => s.type === 'fieldNote');
  }

  /**
   * Get all dialogic interludes in this codex
   * @returns {SpecialSection[]}
   */
  getDialogicInterludes() {
    return this.specialSections.filter(s => s.type === 'dialogicInterlude');
  }

  /**
   * Get all whispers in this codex
   * @returns {SpecialSection[]}
   */
  getWhispers() {
    return this.specialSections.filter(s => s.type === 'whisper');
  }

  /**
   * Get closing seal if present
   * @returns {SpecialSection|null}
   */
  getClosingSeal() {
    return this.specialSections.find(s => s.type === 'closingSeal') ?? null;
  }

  // ============================================================
  // Utility methods
  // ============================================================

  /**
   * Check if this codex belongs to a series
   * @returns {boolean}
   */
  isInSeries() {
    return this.series !== null;
  }

  /**
   * Check if this codex has siblings
   * @returns {boolean}
   */
  hasSiblings() {
    return this.siblingIds.length > 0;
  }

  /**
   * Get display title (cleaned up)
   * @returns {string}
   */
  getDisplayTitle() {
    // Remove leading numbers and formatting
    return this.title
      .replace(/^(\d+):\s*/, '') // "01: Title" -> "Title"
      .replace(/^Codex\s+(I+|IV|V|VI|VII|VIII|[IVX]+):\s*/i, '') // "Codex I: Title" -> "Title"
      .trim();
  }

  /**
   * Get series display name with position
   * @returns {string|null}
   */
  getSeriesLabel() {
    if (!this.series) return null;
    
    if (this.series.position && this.series.total) {
      return `${this.series.name} (${this.series.position}/${this.series.total})`;
    } else if (this.series.position) {
      return `${this.series.name} #${this.series.position}`;
    }
    return this.series.name;
  }

  /**
   * Export as plain object (for serialization)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      originalFileName: this.originalFileName,
      sequence: this.sequence,
      markdown: this.markdown,
      coverImage: this.coverImage,
      subtitle: this.subtitle,
      series: this.series,
      siblingIds: this.siblingIds,
      keywords: this.keywords,
      glossaryTerms: this.glossaryTerms,
      registry: this.registry,
      specialSections: this.specialSections
    };
  }
}

export default Codex;
