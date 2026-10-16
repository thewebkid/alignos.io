/**
 * Media URLs.
 * Covers and thumbnails are same-origin files under client/public/.
 * PDFs live on the public alignos-blob store. Set VITE_BLOB_BASE_URL to point
 * somewhere else; otherwise downloads use the store below.
 * Legacy /pdf/ paths are rewritten to the same store in vercel.json.
 */

const PDF_BLOB_BASE = (
  import.meta.env?.VITE_BLOB_BASE_URL ||
  'https://qahh5hlfi6v2odz8.public.blob.vercel-storage.com'
).replace(/\/$/, '');

function basename(filename, stripPrefix) {
  return filename.replace(new RegExp(`^${stripPrefix}/`), '');
}

export const cdnUrl = {
  cover: (filename) => `/covers/${basename(filename, 'covers')}`,

  thumb: (filename) => {
    const cleanFilename = basename(filename, 'thumb').replace(/^thumbs\//, '');
    return `/thumb/${cleanFilename}`;
  },

  pdf: (filename) => {
    const pdfFilename = String(filename).replace(/^\/?pdf\//, '');
    const withExt = pdfFilename.endsWith('.pdf') ? pdfFilename : `${pdfFilename}.pdf`;
    return `${PDF_BLOB_BASE}/pdf/${withExt}`;
  },

  md: (filename) => `/md/${filename}`,
};

export default cdnUrl;
