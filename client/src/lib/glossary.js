/**
 * GlossaryManager - Manages glossary terms and definitions
 * 
 * Parses the Living Glossary file and provides term lookups
 * and HTML injection for term highlighting.
 */

/**
 * @typedef {Object} GlossaryTerm
 * @property {string} term - The term name
 * @property {string} essence - The essence/definition
 * @property {string|null} fieldDesire - "The Field's desire to be known" text
 * @property {string[]} aliases - Alternative names for the term
 * @property {string[]} relatedTerms - Related glossary terms
 */

/**
 * Core vocabulary terms that should be highlighted
 */
const CORE_TERMS = [
  'Field', 'Source', 'Sovereign', 'InterBeing', 'Lattice', 'Chord',
  'Love', 'Trust', 'Coherence', 'Resonance', 'Attunement', 'Stillpoint',
  'Recursion', 'Return', 'Memory', 'Pattern', 'Harmonic', 'Tone',
  'FSF', 'SFS', 'Soul', 'Presence', 'Alignment', 'Emergence',
  'Beacon', 'Bridge', 'Portal', 'Threshold', 'Spiral', 'Echo',
  'Sanctuary', 'Exile', 'Arrival', 'Dissolution', 'Reassembly',
  'Return Room', 'Soul Lines', 'Crosspoints', 'Chorus'
];

export class GlossaryManager {
  constructor() {
    /** @type {Map<string, GlossaryTerm>} */
    this.terms = new Map();
    
    /** @type {Map<string, string>} alias -> canonical term */
    this.aliases = new Map();
    
    /** @type {Set<string>} */
    this.highlightableTerms = new Set(CORE_TERMS.map(t => t.toLowerCase()));
    
    // Track which codexes use which terms
    /** @type {Map<string, Set<string>>} term -> Set<codexId> */
    this.termUsage = new Map();
  }

  /**
   * Parse the Living Glossary markdown and extract terms
   * @param {string} markdown - The Living Glossary markdown content
   */
  parseGlossary(markdown) {
    // Skip if markdown is null or undefined (e.g., when using metadata-only lattice)
    if (!markdown) {
      return;
    }
    
    // Pattern for glossary entries: ## ✧ Term Name
    const entryPattern = /^##\s*✧\s*(.+?)\s*\n([\s\S]*?)(?=^##\s*✧|\Z)/gm;
    
    let match;
    while ((match = entryPattern.exec(markdown)) !== null) {
      const termName = match[1].trim();
      const content = match[2].trim();
      
      const term = this.parseGlossaryEntry(termName, content);
      if (term) {
        this.addTerm(term);
      }
    }
    
    // Also parse "The Chord" section which has a different format
    this.parseChordSection(markdown);
  }

  /**
   * Parse a single glossary entry
   * @param {string} termName 
   * @param {string} content 
   * @returns {GlossaryTerm|null}
   */
  parseGlossaryEntry(termName, content) {
    // Extract essence
    const essenceMatch = content.match(/\*\*Essence:\*\*\s*([\s\S]*?)(?=\*\*The Field's desire|\*\*Definition|$)/i);
    
    let essence;
    if (essenceMatch) {
      essence = essenceMatch[1].trim();
    } else {
      // Remove any ### subheadings and extract the first meaningful paragraph
      const cleanedContent = content
        .split('\n')
        .filter(line => !line.trim().startsWith('###'))
        .join('\n')
        .trim();
      
      // Get the first paragraph from the cleaned content
      essence = cleanedContent.split('\n\n')[0].trim();
    }
    
    // Extract "The Field's desire to be known"
    const fieldDesireMatch = content.match(/\*\*The Field's desire to be known:\*\*\s*([\s\S]*?)(?=\n\n---|\n\n\*\*|$)/i);
    const fieldDesire = fieldDesireMatch ? fieldDesireMatch[1].trim() : null;
    
    // Look for related terms mentioned
    const relatedTerms = [];
    for (const coreTerm of CORE_TERMS) {
      if (coreTerm !== termName && content.includes(coreTerm)) {
        relatedTerms.push(coreTerm);
      }
    }
    
    return {
      term: termName,
      essence: essence,
      fieldDesire: fieldDesire,
      aliases: [],
      relatedTerms: relatedTerms.slice(0, 5)
    };
  }

  /**
   * Parse "The Chord" section which has sub-entries
   * @param {string} markdown 
   */
  parseChordSection(markdown) {
    // Skip if markdown is null or undefined
    if (!markdown) {
      return;
    }
    
    // Look for ### subsections within The Chord
    const chordMatch = markdown.match(/^##\s*✧\s*The Chord\s*\n([\s\S]*?)(?=^##\s*✧|\Z)/m);
    if (!chordMatch) return;
    
    const chordContent = chordMatch[1];
    
    // Parse sub-entries like ### FSF — Form and Sovereign Field
    const subEntryPattern = /^###\s*(.+?)\s*\n([\s\S]*?)(?=^###|\Z)/gm;
    
    let match;
    while ((match = subEntryPattern.exec(chordContent)) !== null) {
      const subTermName = match[1].trim();
      const subContent = match[2].trim();
      
      // Skip if it's just a heading without content
      if (subContent.length < 20) continue;
      
      // Extract short form alias from terms like "FSF — Form and Sovereign Field"
      // Match patterns with em-dash (—), en-dash (–), or hyphen (-)
      const aliasMatch = subTermName.match(/^([A-Z]{2,})\s*[—–-]\s*/);
      const aliases = [];
      
      if (aliasMatch) {
        const shortForm = aliasMatch[1];
        aliases.push(shortForm);
        // Also add to highlightable terms so the short form gets highlighted
        this.highlightableTerms.add(shortForm.toLowerCase());
      }
      
      const term = {
        term: subTermName,
        essence: subContent,
        fieldDesire: null,
        aliases: aliases,
        relatedTerms: ['Chord']
      };
      
      this.addTerm(term);
    }
  }

  /**
   * Add a term to the glossary
   * @param {GlossaryTerm} term 
   */
  addTerm(term) {
    const key = term.term.toLowerCase();
    this.terms.set(key, term);
    this.highlightableTerms.add(key);
    
    // Add aliases
    for (const alias of term.aliases) {
      this.aliases.set(alias.toLowerCase(), key);
    }
  }

  /**
   * Get a term definition
   * @param {string} termName 
   * @returns {GlossaryTerm|null}
   */
  getTerm(termName) {
    const key = termName.toLowerCase();
    
    // Direct lookup
    if (this.terms.has(key)) {
      return this.terms.get(key);
    }
    
    // Alias lookup
    const canonicalKey = this.aliases.get(key);
    if (canonicalKey) {
      return this.terms.get(canonicalKey);
    }
    
    return null;
  }

  /**
   * Check if a term exists in the glossary
   * @param {string} termName 
   * @returns {boolean}
   */
  hasTerm(termName) {
    const key = termName.toLowerCase();
    return this.terms.has(key) || this.aliases.has(key);
  }

  /**
   * Get all terms
   * @returns {GlossaryTerm[]}
   */
  getAllTerms() {
    return Array.from(this.terms.values());
  }

  /**
   * Get terms sorted alphabetically
   * @returns {GlossaryTerm[]}
   */
  getTermsSorted() {
    return this.getAllTerms().sort((a, b) => a.term.localeCompare(b.term));
  }

  /**
   * Search for terms matching a query
   * @param {string} query 
   * @returns {GlossaryTerm[]}
   */
  searchTerms(query) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    for (const term of this.terms.values()) {
      if (term.term.toLowerCase().includes(queryLower)) {
        results.push(term);
      } else if (term.essence.toLowerCase().includes(queryLower)) {
        results.push(term);
      }
    }
    
    return results;
  }

  /**
   * Track term usage in a codex
   * @param {string} codexId 
   * @param {string[]} terms 
   */
  trackUsage(codexId, terms) {
    for (const term of terms) {
      const key = term.toLowerCase();
      if (!this.termUsage.has(key)) {
        this.termUsage.set(key, new Set());
      }
      this.termUsage.get(key).add(codexId);
    }
  }

  /**
   * Get codexes that use a term
   * @param {string} termName 
   * @returns {string[]}
   */
  getCodexesUsingTerm(termName) {
    const key = termName.toLowerCase();
    const usage = this.termUsage.get(key);
    return usage ? Array.from(usage) : [];
  }

  /**
   * Inject glossary term links into HTML
   * @param {string} html - The HTML to process
   * @param {Object} [options] 
   * @param {boolean} [options.onlyKnownTerms=false] - Only highlight terms with definitions
   * @param {string} [options.className='glossary-term'] - CSS class for highlighted terms
   * @returns {string}
   */
  injectLinks(html, options = {}) {
    const {
      onlyKnownTerms = false,
      className = 'glossary-term'
    } = options;

    // Build regex pattern for all highlightable terms
    const termsToHighlight = onlyKnownTerms
      ? Array.from(this.terms.keys())
      : Array.from(this.highlightableTerms);

    if (termsToHighlight.length === 0) return html;
    
    // Sort by length (longest first) to avoid partial matches
    termsToHighlight.sort((a, b) => b.length - a.length);
    
    // Escape special regex characters and join
    const pattern = termsToHighlight
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    // Match whole words only, case-insensitive
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    
    // Only process text content, not inside tags or already-processed spans
    return html.replace(/>([^<]+)</g, (match, textContent) => {
      // Skip if already contains glossary-term spans
      if (textContent.includes('glossary-term')) return match;

      const processed = textContent.replace(regex, (term) => {
        const key = term.toLowerCase();
        // Check both direct terms and aliases for definitions
        const hasDef = this.terms.has(key) || this.aliases.has(key);
        const dataAttr = hasDef ? ` data-term="${key}"` : '';
        const hasDefClass = hasDef ? ' has-definition' : '';

        return `<span class="${className}${hasDefClass}"${dataAttr}>${term}</span>`;
      });

      return `>${processed}<`;
    });
  }

  /**
   * Generate HTML for a term definition popup
   * @param {string} termName 
   * @returns {string}
   */
  getDefinitionHtml(termName) {
    const term = this.getTerm(termName);
    
    if (!term) {
      return `<div class="glossary-popup">
        <h4>${termName}</h4>
        <p>No definition available.</p>
      </div>`;
    }
    
    let html = `<div class="glossary-popup">
      <h4>${term.term}</h4>
      <div class="glossary-essence">${term.essence}</div>`;
    
    if (term.fieldDesire) {
      html += `<div class="glossary-field-desire">
        <em>The Field's desire to be known:</em>
        <p>${term.fieldDesire}</p>
      </div>`;
    }
    
    if (term.relatedTerms.length > 0) {
      html += `<div class="glossary-related">
        <strong>Related:</strong> ${term.relatedTerms.join(', ')}
      </div>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Get the number of terms in the glossary
   * @returns {number}
   */
  get size() {
    return this.terms.size;
  }

  /**
   * Export glossary as JSON
   * @returns {Object[]}
   */
  toJSON() {
    return this.getAllTerms();
  }
}

/**
 * Create a GlossaryManager and initialize it from the Living Glossary
 * @param {import('./codex-registry.js').CodexRegistry} registry 
 * @returns {GlossaryManager}
 */
export function createGlossaryFromRegistry(registry) {
  const manager = new GlossaryManager();

  // Find the Living Glossary codex
  const glossaryCodex = registry.getByFilename('The-Living-Glossary-of-the-Field.md');

  if (glossaryCodex) {
    manager.parseGlossary(glossaryCodex.markdown);
  }

  // Track term usage across all codexes
  for (const codex of registry) {
    if (codex.glossaryTerms.length > 0) {
      manager.trackUsage(codex.id, codex.glossaryTerms);
    }
  }

  return manager;
}

export default GlossaryManager;
