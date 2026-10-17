// Reading progress per codex: { furthest, position, lastRead }, with furthest and position as
// fractions (0–1) of the codex's scrollable length and lastRead an ISO timestamp

export const COMPLETE_AT = 0.95

const clamp01 = (n) => Math.min(1, Math.max(0, n))
export const roundFraction = (n) => Math.round(clamp01(n) * 10000) / 10000

const validDate = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s))

// Accepts the current shape and the earlier one ({ scrollPercent: 0–100, scrollPosition: px }).
// A pixel position can't be converted, so earlier entries resume from their furthest point.
export const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object' || !validDate(entry.lastRead)) return null
  if ('furthest' in entry) {
    if (!Number.isFinite(entry.furthest)) return null
    const furthest = roundFraction(entry.furthest)
    const position = Number.isFinite(entry.position) ? roundFraction(entry.position) : furthest
    return { furthest, position, lastRead: entry.lastRead }
  }
  if (!Number.isFinite(entry.scrollPercent)) return null
  const furthest = roundFraction(entry.scrollPercent / 100)
  return { furthest, position: furthest, lastRead: entry.lastRead }
}

export const normalizeProgress = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [id, entry] of Object.entries(raw)) {
    const normalized = normalizeEntry(entry)
    if (normalized) out[id] = normalized
  }
  return out
}

// Equal timestamps keep the larger position so the result doesn't depend on argument order
const mergeEntry = (a, b) => {
  if (!a) return b
  if (!b) return a
  const ta = Date.parse(a.lastRead)
  const tb = Date.parse(b.lastRead)
  const recent = ta > tb ? a : tb > ta ? b : a.position >= b.position ? a : b
  return {
    furthest: Math.max(a.furthest, b.furthest),
    position: recent.position,
    lastRead: recent.lastRead
  }
}

export const mergeProgress = (local, incoming) => {
  const out = { ...local }
  for (const [id, entry] of Object.entries(incoming)) {
    out[id] = mergeEntry(local[id], entry)
  }
  return out
}
