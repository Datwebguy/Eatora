const CONSTRAINT_TAG_QUERIES = {
  "soft texture / easy-to-chew": ["soft", "soup", "stew"],
  "low-heat delivery": ["mild", "non spicy"],
  "low-sodium": ["low sodium"]
};

export function entitiesFrom(payload) { return payload?.results?.entities ?? payload?.results?.items ?? payload?.results?.tags ?? payload?.results ?? payload?.entities ?? payload?.tags ?? []; }
export function idOf(entity) { return entity?.tag_id || entity?.entity_id || entity?.id || entity?.uri; }
export function nameOf(entity) { return entity?.name || entity?.title || "Unnamed place"; }

export function validatePlanInput(input) {
  if (!Array.isArray(input?.favorites) || input.favorites.length < 3 || input.favorites.length > 5) throw new Error("Provide 3 to 5 favorites");
  if (!input.location || typeof input.location !== "string" || input.location.trim().length < 2) throw new Error("Provide a city or neighborhood");
  if (!Array.isArray(input.constraints) || input.constraints.length < 2 || input.constraints.length > 3) throw new Error("Choose 2 or 3 practical constraints");
  if (input.favorites.some(value => typeof value !== 'string' || !value.trim())) throw new Error('Favorites cannot be empty');
  const favorites = input.favorites.map((value) => value.trim());
  if (favorites.some((favorite) => favorite.length > 120)) throw new Error("Favorite names must be 120 characters or fewer");
  if (new Set(favorites.map(value => value.toLowerCase())).size !== favorites.length) throw new Error('Favorites must be different');
  if (input.location.trim().length > 160) throw new Error('Location is too long');
  const allowed = new Set(['Soft texture / easy-to-chew', 'Low-sodium', 'Low-heat delivery', 'Avoid grapefruit', 'Limit high-potassium']);
  if (input.constraints.some(value => typeof value !== 'string' || !allowed.has(value)) || new Set(input.constraints).size !== input.constraints.length) throw new Error('Choose valid, distinct needs');
  if (input.medicationNotes !== undefined && (typeof input.medicationNotes !== 'string' || input.medicationNotes.length > 240 || input.medicationNotes.split(/[,;\n]+/).filter(s => s.trim()).length > 3)) throw new Error('Food notes must be at most 240 characters and three items');
  return { favorites, location: input.location.trim(), constraints: input.constraints.map((value) => value.trim()) };
}

export function evidenceFor(place, signals) {
  const matches = place?.query?.explainability?.['signal.interests.entities'];
  if (!Array.isArray(matches)) return [];
  const ids = new Set(matches.map(idOf).filter(Boolean));
  return signals.filter(signal => ids.has(signal.id)).map(signal => ({ label: signal.label, id: signal.id }));
}

export function rankPlaces(places, signals, constraints) {
  return places.map((place, index) => ({ place, evidence: evidenceFor(place, signals), constraintResult: constraints[index] })).sort((a, b) => Number(b.place?.affinity ?? b.place?.score ?? 0) - Number(a.place?.affinity ?? a.place?.score ?? 0));
}

export function constraintQueries(constraints) {
  return constraints.flatMap((constraint) => CONSTRAINT_TAG_QUERIES[constraint.toLowerCase()] || []).filter((value, index, values) => values.indexOf(value) === index);
}
