/**
 * CDN Configuration for Azure Blob Storage
 * 
 * All media assets (covers, thumbnails, PDFs) are served from Azure Blob Storage
 * for better performance and reliability.
 */

export const CDN_BASE = 'https://astrotiles.blob.core.windows.net/alignos';

/**
 * Helper functions to generate CDN URLs for different asset types
 */
export const cdnUrl = {
  /**
   * Get CDN URL for a cover image
   * @param {string} filename - The filename (e.g., "covers/filename.jpg" or just "filename.jpg")
   * @returns {string} Full CDN URL
   */
  cover: (filename) => {
    // Handle both "covers/filename.jpg" and "filename.jpg" formats
    const cleanFilename = filename.replace(/^covers\//, '');
    return `${CDN_BASE}/covers/${cleanFilename}`;
  },

  /**
   * Get CDN URL for a thumbnail image
   * @param {string} filename - The filename (e.g., "thumb/filename.jpg" or just "filename.jpg")
   * @returns {string} Full CDN URL
   */
  thumb: (filename) => {
    // Handle both "thumb/filename.jpg" and "filename.jpg" formats
    const cleanFilename = filename.replace(/^thumb\//, '');
    return `${CDN_BASE}/thumb/${cleanFilename}`;
  },

  /**
   * Get CDN URL for a PDF file
   * @param {string} filename - The filename (e.g., "filename.pdf" or "filename" without extension)
   * @returns {string} Full CDN URL
   */
  pdf: (filename) => {
    // Ensure .pdf extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    return `${CDN_BASE}/pdf/${pdfFilename}`;
  },

  /**
   * Get CDN URL for a markdown file (optional, may continue to serve locally)
   * @param {string} filename - The filename (e.g., "filename.md")
   * @returns {string} Full CDN URL
   */
  md: (filename) => {
    return `${CDN_BASE}/md/${filename}`;
  },
};

export default cdnUrl;
