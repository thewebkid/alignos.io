// Machine-facing outputs cite the live site even on preview deployments, so the
// production base is the default; override only to rehost the canonical source.
export const CANONICAL_BASE = (process.env.ALIGNOS_CANONICAL_BASE || 'https://alignos.io').replace(/\/$/, '');

export const codexUrl = (id) => `${CANONICAL_BASE}/codex/${id}`;
