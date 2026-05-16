/**
 * BrowserCodex - Browser-specific extension of Codex
 * 
 * Adds DOM-related methods like toHtml() and glossary integration.
 * Only import this in browser contexts.
 */

import { Codex } from './codex.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { injectCodexLinks } from './codex-linker.js';

/**
 * Configure marked for consistent rendering
 */
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

/**
 * Browser-specific Codex with HTML rendering capabilities
 */
export class BrowserCodex extends Codex {
  constructor(data) {
    super(data);
    
    // Cache for rendered HTML
    this._html = null;
    this._htmlWithGlossary = null;
  }

  /**
   * Convert markdown to sanitized HTML
   * @returns {string}
   */
  toHtml() {
    if (this._html === null) {
      let html = marked.parse(this.markdown);
      
      // Sanitize only on client-side (content is trusted for SSG)
      if (typeof window !== 'undefined' && DOMPurify && DOMPurify.sanitize) {
        html = DOMPurify.sanitize(html);
      }
      
      // Note: Cover images now use CDN URLs directly in markdown files
      
      this._html = html;
    }
    return this._html;
  }

  /**
   * Convert markdown to HTML with glossary term highlighting and codex cross-references
   * @param {import('./glossary.js').GlossaryManager} [glossaryManager] 
   * @param {import('./codex-registry.js').CodexRegistry} [registry] - Registry for cross-reference links
   * @returns {string}
   */
  toHtmlWithGlossary(glossaryManager, registry = null) {
    // Get base HTML
    let html = this.toHtml();

    // Inject codex cross-reference links (before glossary to avoid spans inside links)
    if (registry) {
      html = injectCodexLinks(html, registry);
    }

    // Inject glossary term highlighting
    if (glossaryManager) {
      html = glossaryManager.injectLinks(html);
    }

    return html;
  }

  /**
   * Render a specific section to HTML
   * @param {number} index - Section index
   * @returns {string|null}
   */
  sectionToHtml(index) {
    const sections = this.sections;
    if (index < 0 || index >= sections.length) return null;
    
    const section = sections[index];
    const markdown = `${'#'.repeat(section.level)} ${section.heading}\n\n${section.content}`;
    
    let html = marked.parse(markdown);
    
    // Sanitize only on client-side
    if (typeof window !== 'undefined' && DOMPurify && DOMPurify.sanitize) {
      html = DOMPurify.sanitize(html);
    }
    
    return html;
  }

  /**
   * Get the cover image as an HTML img element
   * @param {string} [className] - Optional CSS class
   * @returns {string}
   */
  getCoverImageHtml(className = 'codex-cover') {
    if (!this.coverImage) return '';
    
    const alt = `${this.title} (Cover Image)`;
    return `<img src="${this.coverImage}" alt="${alt}" class="${className}" />`;
  }

  /**
   * Get a table of contents as HTML
   * @param {number} [maxLevel=3] - Maximum heading level to include
   * @returns {string}
   */
  getTableOfContentsHtml(maxLevel = 3) {
    const sections = this.sections.filter(s => s.level <= maxLevel);
    
    if (sections.length === 0) return '';
    
    let html = '<nav class="codex-toc"><ul>';
    
    for (const section of sections) {
      const indent = section.level - 1;
      const id = this.slugify(section.heading);
      html += `<li class="toc-level-${section.level}" style="margin-left: ${indent}em;">`;
      html += `<a href="#${id}">${section.heading}</a>`;
      html += '</li>';
    }
    
    html += '</ul></nav>';
    return html;
  }

  /**
   * Create a URL-safe slug from text
   * @param {string} text 
   * @returns {string}
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get metadata as HTML (for display in UI)
   * @returns {string}
   */
  getMetadataHtml() {
    const parts = [];
    
    if (this.series) {
      parts.push(`<span class="codex-series">${this.getSeriesLabel()}</span>`);
    }
    
    parts.push(`<span class="codex-reading-time">${this.readingTime} min read</span>`);
    parts.push(`<span class="codex-word-count">${this.wordCount.toLocaleString()} words</span>`);
    
    return `<div class="codex-metadata">${parts.join(' · ')}</div>`;
  }

  /**
   * Get keywords as HTML badges
   * @param {number} [limit=10] - Maximum keywords to show
   * @returns {string}
   */
  getKeywordsHtml(limit = 10) {
    const keywords = this.keywords.slice(0, limit);
    
    if (keywords.length === 0) return '';
    
    const badges = keywords.map(k => 
      `<span class="codex-keyword">${k}</span>`
    ).join('');
    
    return `<div class="codex-keywords">${badges}</div>`;
  }

  /**
   * Get stillpoints as formatted HTML cards
   * @returns {string}
   */
  getStillpointsHtml() {
    const stillpoints = this.getStillpoints();
    
    if (stillpoints.length === 0) return '';
    
    const cards = stillpoints.map(sp => {
      let content = marked.parse(sp.content);
      
      // Sanitize only on client-side
      if (typeof window !== 'undefined' && DOMPurify && DOMPurify.sanitize) {
        content = DOMPurify.sanitize(content);
      }
      
      return `
        <div class="stillpoint-card">
          <div class="stillpoint-icon">✧</div>
          <div class="stillpoint-content">${content}</div>
        </div>
      `;
    }).join('');
    
    return `<div class="stillpoints-collection">${cards}</div>`;
  }

  /**
   * Get registry information as HTML
   * @returns {string}
   */
  getRegistryHtml() {
    if (!this.registry) return '';
    
    let html = '<dl class="codex-registry">';
    
    for (const [key, value] of Object.entries(this.registry)) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      html += `<dt>${label}</dt>`;
      
      if (Array.isArray(value)) {
        html += '<dd><ul>';
        for (const item of value) {
          html += `<li>${item}</li>`;
        }
        html += '</ul></dd>';
      } else {
        html += `<dd>${value}</dd>`;
      }
    }
    
    html += '</dl>';
    return html;
  }

  /**
   * Highlight search terms in rendered HTML
   * @param {string} query - Search query
   * @returns {string}
   */
  highlightSearchTerms(query) {
    const html = this.toHtml();
    
    if (!query || query.length < 2) return html;
    
    // Escape special regex characters
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    // Only highlight in text nodes, not in tags
    return html.replace(/>([^<]+)</g, (match, text) => {
      const highlighted = text.replace(regex, '<mark class="search-highlight">$1</mark>');
      return `>${highlighted}<`;
    });
  }

  /**
   * Clear cached HTML (call when glossary changes, etc.)
   */
  clearCache() {
    this._html = null;
    this._htmlWithGlossary = null;
  }
}

/**
 * Factory function to convert a base Codex to BrowserCodex
 * @param {Codex} codex 
 * @returns {BrowserCodex}
 */
export function toBrowserCodex(codex) {
  return new BrowserCodex(codex.toJSON());
}

/**
 * Factory function to create BrowserCodex from data
 * @param {Object} data 
 * @returns {BrowserCodex}
 */
export function createBrowserCodex(data) {
  return new BrowserCodex(data);
}

export default BrowserCodex;
