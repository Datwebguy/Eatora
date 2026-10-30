import { entitiesFrom, idOf } from './planner.js';

const QUERIES = {
  'Soft texture / easy-to-chew': ['soft', 'soup', 'stew'],
  'Low-sodium': ['low sodium'],
  'Low-heat delivery': ['mild', 'non-spicy']
};

function relevantTags(tags, terms) {
  const normalized = new Set(terms.map(term => term.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()));
  return tags.filter(tag => {
    const name = String(tag?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const type = String(tag?.type || '').toLowerCase();
    return normalized.has(name) && !type.includes(':ambience:') && !type.includes(':setting:') && !type.includes(':payments:');
  });
}

export async function resolveConstraints(qloo, constraints, medicationNotes = '') {
  const rules = [];
  const extraNotes = [];
  for (const label of constraints) {
    const queries = QUERIES[label];
    if (!queries) { extraNotes.push(label); continue; }
    const tags = relevantTags((await Promise.all(queries.map(q => qloo.tags(q)))).flatMap(entitiesFrom), queries);
    const ids = tags.map(idOf).filter(Boolean);
    rules.push({ label, mode: 'require', ids, fallback: ids.length ? [] : queries });
  }
  for (const note of [...extraNotes, ...medicationNotes.split(/[,;\n]+/)].map(s => s.trim()).filter(Boolean)) {
    const term = note.replace(/^(avoid|limit|no|exclude)\s+/i, '').trim();
    if (!term) continue;
    const tags = relevantTags(entitiesFrom(await qloo.tags(term)), [term]);
    const ids = tags.map(idOf).filter(Boolean);
    rules.push({ label: note, mode: 'exclude', ids, fallback: ids.length ? [] : [term] });
  }
  return rules;
}

export function applyConstraints(places, rules = []) {
  return places.map(place => {
    const tags = Array.isArray(place.tags) ? place.tags : Array.isArray(place.properties?.tags) ? place.properties.tags : [];
    const ids = new Set(tags.map(t => typeof t === 'string' ? t : idOf(t)).filter(Boolean));
    const names = tags.map(t => typeof t === 'object' ? String(t.name || '').toLowerCase() : '');
    const passed = [], excluded = [], unknown = [];
    for (const rule of rules) {
      const match = rule.ids.some(id => ids.has(id)) || rule.fallback.some(term => names.includes(term.toLowerCase()));
      if (rule.mode === 'exclude' && match) excluded.push(rule.label);
      // Place-level tags describe offerings, not a verified dish or nutrient value.
      // They cannot establish texture, sodium or heat for the meal being chosen.
      else if (rule.mode === 'require' && match) unknown.push(rule.label);
      else unknown.push(rule.label);
    }
    return { place, passed, excluded, unknown, eligible: excluded.length === 0 && unknown.length === 0 };
  });
}
