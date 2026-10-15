import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Convert markdown to sanitized HTML
 * @param {string} markdown - The markdown string to convert
 * @returns {string|null} - The sanitized HTML or null if no markdown provided
 */
export const markdown2Html = (markdown) => {
  return markdown ? DOMPurify.sanitize(marked.parse(markdown)) : null;
};

// Single newlines are James' line breaks in poetic passages.
const PAGE_OPTIONS = { gfm: true, breaks: true };

/**
 * Split page markdown (client/src/content/pages) into rendered HTML runs and the
 * fenced blocks pages render as components: ```prompt (exact copyable text) and
 * ```collection (a single collection id).
 *
 * Page markdown is committed site content, so it is not sanitized; sanitizing only
 * in the browser would make the SSG HTML and the hydrated HTML differ.
 * @param {string} markdown
 * @returns {({type: 'html', html: string}|{type: 'prompt', text: string}|{type: 'collection', id: string})[]}
 */
export const parsePageMarkdown = (markdown) => {
  const tokens = marked.lexer(markdown, PAGE_OPTIONS);
  const segments = [];
  let run = [];

  const flush = () => {
    if (!run.length) return;
    run.links = tokens.links;
    segments.push({ type: 'html', html: marked.parser(run, PAGE_OPTIONS) });
    run = [];
  };

  for (const token of tokens) {
    if (token.type === 'code' && token.lang === 'prompt') {
      flush();
      segments.push({ type: 'prompt', text: token.text });
    } else if (token.type === 'code' && token.lang === 'collection') {
      flush();
      segments.push({ type: 'collection', id: token.text.trim() });
    } else {
      run.push(token);
    }
  }
  flush();
  return segments;
};
