/**
 * Cover tags are not stored in source markdown. The catalog owns the image;
 * copy/download prepend a portable <img> so exported files still resolve.
 */

const LEADING_IMG = /^(?:\uFEFF)?<img\s+src="[^"]+"[^>]*\/?>\s*/i;
const LEADING_H1 = /^#\s+(.*)\n+/;
const AUTHOR_LINE = 'James Mahu with Lumina';

export function stripLeadingCoverImage(markdown) {
  return (markdown || '').replace(LEADING_IMG, '').replace(/^\s+/, '');
}

export function coverImgTag(codex, origin) {
  const base = String(origin || '').replace(/\/$/, '');
  const title = (codex.title || '').replace(/"/g, '&quot;');
  return `<img src="${base}/covers/${codex.id}.jpg" alt="${title}">`;
}

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function canonicalUrl(codex, origin) {
  return codex.canonicalUrl || `${String(origin || '').replace(/\/$/, '')}/codex/${codex.id}`;
}

/** Copy, download, and the served /md/{id}.md are all this text. */
export function markdownForExport(codex, origin) {
  let body = stripLeadingCoverImage(codex.markdown || '').replace(/\r\n/g, '\n').trimEnd();
  const h1 = body.match(LEADING_H1);
  if (h1 && squash(h1[1]) === squash(codex.title || '')) body = body.slice(h1[0].length);
  const url = canonicalUrl(codex, origin);
  return [
    `# ${codex.title}`,
    `${AUTHOR_LINE} · ${url}`,
    '',
    coverImgTag(codex, origin),
    '',
    body,
    '',
    `LLMs: ${new URL(url).origin}/llms.txt`,
    '',
  ].join('\n');
}
