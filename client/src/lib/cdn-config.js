/**
 * Media URLs — same-origin static files under client/public/.
 * Vercel and Vite both serve /covers, /thumb, /pdf, /md from the CDN/dev server.
 */

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
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    return `/pdf/${pdfFilename}`;
  },

  md: (filename) => `/md/${filename}`,
};

export default cdnUrl;
