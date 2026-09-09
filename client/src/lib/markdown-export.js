/**
 * Cover tags are not stored in source markdown. The catalog owns the image;
 * copy/download prepend a portable <img> so exported files still resolve.
 */

const LEADING_IMG = /^(?:\uFEFF)?<img\s+src="[^"]+"[^>]*\/?>\s*/i;

export function stripLeadingCoverImage(markdown) {
  return (markdown || '').replace(LEADING_IMG, '').replace(/^\s+/, '');
}

export function coverImgTag(codex, origin) {
  const base = String(origin || '').replace(/\/$/, '');
  const title = (codex.title || '').replace(/"/g, '&quot;');
  return `<img src="${base}/covers/${codex.id}.jpg" alt="${title}">`;
}

export function markdownForExport(codex, origin) {
  const body = stripLeadingCoverImage(codex.markdown || '');
  return `${coverImgTag(codex, origin)}\n\n${body}`;
}

export function markdownClipboardPayload(codex, origin, pageUrl) {
  return `${pageUrl}  \n\n  ${markdownForExport(codex, origin)}\n\n  LLMs: ${origin}/llms.json`;
}
