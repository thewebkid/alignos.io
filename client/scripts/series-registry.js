/**
 * Series registry rules shared by the lattice build and scripts/audit-series.js.
 *
 * resolveSeries(catalog, registry, { pdfExists }) validates the registry and every
 * catalog series reference, then returns per-codex series data plus the published
 * registry. Errors are collected, never thrown, so callers can report them all.
 */

export const kebab = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function validateRegistry(registry, catalogById, pdfExists, errors) {
  const ids = new Set();
  const names = new Map();
  for (const rec of registry) {
    const where = `series "${rec.id}"`;
    if (!rec.id || !rec.name) errors.push(`${where}: id and name are required`);
    if (rec.id !== kebab(rec.name)) errors.push(`${where}: id must be the kebab-case of its name ("${kebab(rec.name)}")`);
    if (ids.has(rec.id)) errors.push(`${where}: duplicate id`);
    ids.add(rec.id);
    for (const label of [rec.name, ...(rec.aliases || [])]) {
      const key = label.toLowerCase();
      if (names.has(key) && names.get(key) !== rec.id) errors.push(`${where}: name or alias "${label}" is also used by "${names.get(key)}"`);
      names.set(key, rec.id);
    }
    if (rec.total != null && (!Number.isInteger(rec.total) || rec.total < 1)) errors.push(`${where}: total must be a positive integer or null`);
    for (const cid of rec.companion_ids || []) {
      if (!catalogById.has(cid)) errors.push(`${where}: companion "${cid}" is not a catalog id`);
    }
    if (rec.compilation_pdf) {
      if (rec.compilation_pdf !== `${rec.id}.pdf`) errors.push(`${where}: compilation_pdf must be "${rec.id}.pdf"`);
      if (catalogById.has(rec.id)) errors.push(`${where}: compilation name collides with a catalog id`);
      if (pdfExists && !pdfExists(rec.compilation_pdf)) errors.push(`${where}: compilation_pdf "${rec.compilation_pdf}" not found`);
    }
    const plannedPositions = new Set();
    for (const p of rec.planned || []) {
      if (!p.title || !p.source) errors.push(`${where}: planned position ${p.position} needs a title and source`);
      if (!Number.isInteger(p.position) || p.position < 1 || (rec.total != null && p.position > rec.total)) {
        errors.push(`${where}: planned position ${p.position} is outside 1..${rec.total ?? '?'}`);
      }
      if (plannedPositions.has(p.position)) errors.push(`${where}: planned position ${p.position} appears twice`);
      plannedPositions.add(p.position);
      const asCatalog = [...catalogById.values()].find((e) => kebab(e.title) === kebab(p.title));
      if (asCatalog) errors.push(`${where}: planned "${p.title}" matches published catalog entry "${asCatalog.id}"`);
    }
  }
  return names;
}

export function resolveSeries(catalog, registry, { pdfExists } = {}) {
  const errors = [];
  const catalogById = new Map(catalog.map((e) => [e.id, e]));
  const nameIndex = validateRegistry(registry, catalogById, pdfExists, errors);
  const recordById = new Map(registry.map((r) => [r.id, r]));
  const recordByName = new Map(registry.map((r) => [r.name, r]));

  const members = new Map(registry.map((r) => [r.id, { positioned: [], unplaced: [] }]));
  const codexSeries = new Map();

  for (const e of catalog) {
    if (!e.series) continue;
    const where = `catalog "${e.id}" (seq ${e.sequence})`;
    const rec = recordByName.get(e.series.name);
    if (!rec) {
      const viaAlias = nameIndex.get(String(e.series.name).toLowerCase());
      errors.push(
        viaAlias
          ? `${where}: series "${e.series.name}" is an alias; use the canonical name "${recordById.get(viaAlias).name}"`
          : `${where}: series "${e.series.name}" is not in the registry`
      );
      continue;
    }
    if ((e.series.total ?? null) !== (rec.total ?? null)) errors.push(`${where}: series total ${e.series.total} differs from registry total ${rec.total}`);
    const pos = e.series.position ?? null;
    if (pos != null) {
      if (!Number.isInteger(pos) || pos < 1 || (rec.total != null && pos > rec.total)) errors.push(`${where}: position ${pos} is outside 1..${rec.total ?? '?'}`);
      if ((rec.planned || []).some((p) => p.position === pos)) errors.push(`${where}: position ${pos} collides with a planned position in "${rec.id}"`);
      const clash = members.get(rec.id).positioned.find((m) => m.position === pos);
      if (clash) errors.push(`${where}: position ${pos} is also held by "${clash.id}"`);
      members.get(rec.id).positioned.push({ id: e.id, position: pos });
    } else {
      members.get(rec.id).unplaced.push(e.id);
    }
    codexSeries.set(e.id, { id: rec.id, name: rec.name, position: pos, total: rec.total ?? null });
  }

  const earlierByLater = new Map();
  for (const e of catalog) {
    if (!e.later_edition_id) continue;
    const where = `catalog "${e.id}" (seq ${e.sequence})`;
    const later = catalogById.get(e.later_edition_id);
    if (!later) errors.push(`${where}: later_edition_id "${e.later_edition_id}" is not a catalog id`);
    else if (later.id === e.id) errors.push(`${where}: later_edition_id points to itself`);
    if (e.series?.position != null) errors.push(`${where}: an earlier edition cannot hold a series position`);
    if (!earlierByLater.has(e.later_edition_id)) earlierByLater.set(e.later_edition_id, []);
    earlierByLater.get(e.later_edition_id).push(e.id);
  }

  const bySequence = (a, b) => catalogById.get(a).sequence - catalogById.get(b).sequence;
  const orderedIds = new Map();
  for (const [sid, m] of members) {
    m.positioned.sort((a, b) => a.position - b.position);
    m.unplaced.sort(bySequence);
    orderedIds.set(sid, m.positioned.map((p) => p.id));
  }

  const perCodex = new Map();
  for (const e of catalog) {
    const series = codexSeries.get(e.id) ?? null;
    perCodex.set(e.id, {
      series,
      siblingIds: series?.position != null ? orderedIds.get(series.id) : [],
      laterEditionId: e.later_edition_id ?? null,
      earlierEditionIds: (earlierByLater.get(e.id) ?? []).sort(bySequence),
    });
  }

  const published = registry.map((rec) => {
    const m = members.get(rec.id);
    return {
      id: rec.id,
      name: rec.name,
      aliases: rec.aliases ?? [],
      total: rec.total ?? null,
      written: m.positioned.length,
      members: m.positioned,
      unplacedIds: m.unplaced,
      companionIds: rec.companion_ids ?? [],
      compilationPdf: rec.compilation_pdf ?? null,
      planned: (rec.planned ?? []).map((p) => ({ position: p.position, title: p.title, subtitle: p.subtitle ?? null, source: p.source })),
      source: rec.source,
      needsReview: rec.needs_review === true,
      reviewNotes: rec.review_notes ?? null,
    };
  });

  return { errors, perCodex, published };
}
