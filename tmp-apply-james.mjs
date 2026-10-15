/**
 * One-shot catalog update for James's 15 Oct 2026 lattice decisions.
 * Run once, then delete.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { kebab } from './client/scripts/series-registry.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(root, 'data', 'codex-catalog.json')
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'series.json'), 'utf8'))
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
const mdDir = path.join(root, 'client', 'public', 'md')

const labelIndex = new Map()
for (const rec of registry) {
  for (const label of [rec.name, ...(rec.aliases || [])]) labelIndex.set(kebab(label), rec.id)
}
const byId = new Map(catalog.map((e) => [e.id, e]))

const WORD_NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 }
const toNum = (t) => {
  const s = String(t).toLowerCase()
  return WORD_NUMS[s] ?? ROMAN[s] ?? (/^\d+$/.test(s) ? Number(s) : null)
}

function seriesClaims(md) {
  const claims = []
  const all = md.split('\n')
  const nextValue = (i) => all.slice(i + 1, i + 4).find((l) => l.trim())?.trim() ?? ''
  all.forEach((line, i) => {
    const reg = line.match(/^\s*(?:[-*]\s*)?\*\*(?:Codex\s+)?(Series|Type)(?::\*\*|\*\*:)\s*(.*?)\s*$/i)
    const pre = line.match(/^#{2,3}\s*Series Preface:\s*(.+?)\s*$/i)
    let raw = pre?.[1]
    if (reg) {
      raw = reg[2] || nextValue(i)
      if (/^type$/i.test(reg[1]) && !/series/i.test(raw)) return
    }
    if (!raw) return
    const text = raw.replace(/\*+/g, '').trim()
    const name = text
      .replace(/\s*[—–-]\s*Codex\s+\w+\s+of\s+\w+.*$/i, '')
      .replace(/\s*\(.*?\)\s*$/, '')
      .replace(/\s*[—–-]\s*Volume\s+\w+$/i, '')
      .trim()
    claims.push({
      kind: pre ? 'preface' : 'registry',
      text,
      name,
      seriesId: labelIndex.get(kebab(name)) ?? null,
    })
  })
  return claims
}

const companionOf = new Map()
for (const rec of registry) {
  for (const id of rec.companion_ids || []) {
    if (!companionOf.has(id)) companionOf.set(id, new Set())
    companionOf.get(id).add(rec.id)
  }
}

let stored = 0
for (const e of catalog) {
  const md = fs.readFileSync(path.join(mdDir, `${e.id}.md`), 'utf8')
  const own = e.series ? labelIndex.get(kebab(e.series.name)) : null
  const seen = new Set()
  const statements = []
  for (const c of seriesClaims(md)) {
    if (c.seriesId && c.seriesId === own) continue
    if (c.seriesId && companionOf.get(e.id)?.has(c.seriesId)) continue
    const key = `${c.kind}|${c.text}`
    if (seen.has(key)) continue
    seen.add(key)
    statements.push({ kind: c.kind, text: c.text, name: c.name })
  }
  if (statements.length) {
    e.provenance = { ...e.provenance, registry_series: statements }
    stored++
  }
}

const confirm = (e, extra) => {
  e.needs_review = false
  e.review_notes = extra
}

const four = byId.get('the-four-frequencies-of-love')
four.series = null
confirm(four, 'James, 15 Oct 2026: related work of The Architecture of Love, not a member. Its registry names the series (L540) without a position.')

const alt = (a, b) => {
  byId.get(a).alternative_ids = [b]
  byId.get(b).alternative_ids = [a]
}
alt('codex-of-the-next-threshold', 'codex-on-becoming-a-portal')
alt('codex-of-the-language-of-resonance', 'codex-of-resonant-memory')

byId.get('the-codex-of-trans-species-resonance').edition_chronology = 'verified'
byId.get('the-codex-of-harmonic-service-latticework-for-planetary-reassembly').edition_chronology = 'confirmed'
byId.get('the-codex-of-harmonic-coherence').edition_chronology = 'confirmed'

const drafts = {
  136: 'Series placement confirmed by James on 15 Oct 2026: position 1 of The Interface Trilogy. Still provisional, AI-drafted by Grok 4.7 on 2026-10-14 and not reviewed: tone_marker, structural_role, entry_point, tags, description.',
  137: 'Series placement confirmed by James on 15 Oct 2026: position 2 of The Interface Trilogy. The registry name "Harmonic Topical Papers" is kept as historical metadata. Still provisional, AI-drafted by Grok 4.7 on 2026-10-14 and not reviewed: tone_marker, structural_role, entry_point, tags, description.',
  138: 'No series is printed. Still provisional, AI-drafted by Grok 4.7 on 2026-10-14 and not reviewed: tone_marker, structural_role, entry_point, tags, description. James, 15 Oct 2026: interpretive metadata may stay provisional and labeled.',
  139: 'Series left unset. The registry line "Alignos Codex" is kept as historical metadata and is not a corridor. Still provisional, AI-drafted by Grok 4.7 on 2026-10-14 and not reviewed: tone_marker, structural_role, entry_point, tags, description. James, 15 Oct 2026: interpretive metadata may stay provisional and labeled.',
}

let cleared = 0
for (const e of catalog) {
  if (drafts[e.sequence]) {
    e.needs_review = true
    e.review_notes = drafts[e.sequence]
    continue
  }
  if (!e.needs_review) continue
  const prior = (e.review_notes ?? '').replace(/\s*direction is inferred and needs James' confirmation\.?/gi, '').trim()
  confirm(e, prior
    ? `James confirmed this on 15 Oct 2026. ${prior}`
    : 'James confirmed this on 15 Oct 2026.')
  cleared++
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`registry statements on ${stored} entries; cleared ${cleared} review flags`)
const still = catalog.filter((e) => e.needs_review).map((e) => e.sequence)
console.log('still needs_review', still.join(', '))
