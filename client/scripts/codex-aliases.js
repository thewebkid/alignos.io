// Retired codex id -> current id, from the id_change records in data/codex-provenance.json.
// Chains are followed to the end, so an id renamed twice still resolves in one lookup.
export function resolveAliases(provenance, currentIds) {
  const errors = [];
  const current = new Set(currentIds);
  const next = new Map();

  for (const row of provenance) {
    if (row.change_type !== 'id_change') continue;
    if (!row.old_value || !row.new_value || row.old_value === row.new_value) continue;
    const prev = next.get(row.old_value);
    if (prev && prev !== row.new_value) {
      errors.push(`retired id "${row.old_value}" is recorded as becoming both "${prev}" and "${row.new_value}"`);
      continue;
    }
    next.set(row.old_value, row.new_value);
  }

  const aliases = {};
  for (const retired of [...next.keys()].sort()) {
    if (current.has(retired)) {
      errors.push(`retired id "${retired}" is also a current codex id`);
      continue;
    }
    const seen = new Set([retired]);
    let id = next.get(retired);
    while (next.has(id) && !seen.has(id)) {
      seen.add(id);
      id = next.get(id);
    }
    if (seen.has(id)) {
      errors.push(`id changes starting at "${retired}" form a loop`);
    } else if (!current.has(id)) {
      errors.push(`retired id "${retired}" leads to "${id}", which is not a current codex`);
    } else {
      aliases[retired] = id;
    }
  }

  return { errors, aliases };
}
