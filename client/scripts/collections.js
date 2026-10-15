/**
 * Collection rules for the lattice build.
 *
 * resolveCollections(collections, catalog, publishedSeries) validates data/collections.json
 * against catalog ids and the resolved series registry, then returns the published
 * (camelCase) collections with titles resolved. Errors are collected, never thrown.
 */

import { kebab } from './series-registry.js';

const GROUP_STYLES = new Set(['star', 'numbered']);

export function resolveCollections(collections, catalog, publishedSeries) {
  const errors = [];
  const catalogById = new Map(catalog.map((e) => [e.id, e]));
  const seriesById = new Map(publishedSeries.map((s) => [s.id, s]));
  const seriesPosition = new Map();
  for (const s of publishedSeries) {
    for (const m of s.members) seriesPosition.set(m.id, { id: s.id, name: s.name, position: m.position, total: s.total });
  }

  if (!Array.isArray(collections)) {
    return { errors: ['collections file must be an array'], published: [] };
  }

  const ids = new Set();
  const published = [];
  for (const col of collections) {
    const where = `collection "${col.id}"`;
    if (!col.id || col.id !== kebab(col.id)) errors.push(`${where}: id must be kebab-case`);
    if (ids.has(col.id)) errors.push(`${where}: duplicate id`);
    ids.add(col.id);
    if (!col.title) errors.push(`${where}: title is required`);
    if (typeof col.show_in_lattice !== 'boolean') errors.push(`${where}: show_in_lattice must be true or false`);
    if (col.offer_bundle !== undefined && typeof col.offer_bundle !== 'boolean') errors.push(`${where}: offer_bundle must be true or false`);
    // Bundles are only generated for lattice collections (build-ai-layer.js).
    if (col.offer_bundle && !col.show_in_lattice) errors.push(`${where}: offer_bundle requires show_in_lattice`);
    if (!col.source) errors.push(`${where}: source is required`);

    const groupIds = new Set();
    for (const g of col.groups || []) {
      if (groupIds.has(g.id)) errors.push(`${where}: duplicate group "${g.id}"`);
      groupIds.add(g.id);
      if (!GROUP_STYLES.has(g.style)) errors.push(`${where}: group "${g.id}" style must be one of ${[...GROUP_STYLES].join(', ')}`);
    }

    if (!Array.isArray(col.items) || !col.items.length) errors.push(`${where}: items must be a non-empty array`);
    const items = [];
    for (const [i, item] of (col.items || []).entries()) {
      const at = `${where} item ${i + 1}`;
      if (Boolean(item.codex) === Boolean(item.series)) {
        errors.push(`${at}: must reference exactly one of codex or series`);
        continue;
      }
      if (item.group && !groupIds.has(item.group)) errors.push(`${at}: unknown group "${item.group}"`);

      if (item.codex) {
        const entry = catalogById.get(item.codex);
        if (!entry) {
          errors.push(`${at}: unknown codex id "${item.codex}"`);
          continue;
        }
        items.push({
          kind: 'codex',
          id: entry.id,
          title: entry.title,
          label: item.label ?? entry.title,
          tagline: item.tagline ?? null,
          note: item.note ?? null,
          group: item.group ?? null,
          series: seriesPosition.get(entry.id) ?? null,
        });
      } else {
        const s = seriesById.get(item.series);
        if (!s) {
          errors.push(`${at}: unknown series id "${item.series}"`);
          continue;
        }
        items.push({
          kind: 'series',
          id: s.id,
          title: s.name,
          label: item.label ?? s.name,
          tagline: item.tagline ?? null,
          note: item.note ?? null,
          group: item.group ?? null,
          memberIds: s.members.map((m) => m.id),
        });
      }
    }

    published.push({
      id: col.id,
      title: col.title,
      subtitle: col.subtitle ?? null,
      intro: col.intro ?? null,
      registryName: col.registry_name ?? null,
      showInLattice: col.show_in_lattice,
      offerBundle: col.offer_bundle ?? false,
      source: col.source,
      groups: col.groups || [],
      items,
    });
  }

  return { errors, published };
}
