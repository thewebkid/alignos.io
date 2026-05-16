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
