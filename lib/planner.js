const CONSTRAINT_TAG_QUERIES = {
  "soft texture / easy-to-chew": ["soft", "soup", "stew"],
  "low-heat delivery": ["mild", "non spicy"],
  "low-sodium": ["low sodium"]
};

export function entitiesFrom(payload) { return payload?.results?.entities ?? payload?.results ?? payload?.entities ?? []; }
export function idOf(entity) { return entity?.entity_id || entity?.id || entity?.uri; }
export function nameOf(entity) { return entity?.name || entity?.title || "Unnamed place"; }

export function validatePlanInput(input) {
  if (!Array.isArray(input?.favorites) || input.favorites.length < 3 || input.favorites.length > 5) throw new Error("Provide 3 to 5 favorites");
  if (!input.location || typeof input.location !== "string" || input.location.trim().length < 2) throw new Error("Provide a city or neighborhood");
  if (!Array.isArray(input.constraints) || input.constraints.length < 2 || input.constraints.length > 3) throw new Error("Choose 2 or 3 practical constraints");
  return { favorites: input.favorites.map((value) => String(value).trim()).filter(Boolean), location: input.location.trim(), constraints: input.constraints.map((value) => String(value).trim()) };
}

export function evidenceFor(place, signals) {
  const source = place?.tags || place?.interests || place?.signals || [];
  const sourceIds = new Set(source.map((item) => idOf(item) || item).filter(Boolean));
  return signals.filter((signal) => sourceIds.has(signal.id)).map((signal) => ({ label: signal.label, id: signal.id }));
}

export function rankPlaces(places, signals, constraints) {
  return places.map((place, index) => ({ place, evidence: evidenceFor(place, signals), constraintResult: constraints[index] })).sort((a, b) => Number(b.place?.affinity ?? b.place?.score ?? 0) - Number(a.place?.affinity ?? a.place?.score ?? 0));
}

export function constraintQueries(constraints) {
  return constraints.flatMap((constraint) => CONSTRAINT_TAG_QUERIES[constraint.toLowerCase()] || []).filter((value, index, values) => values.indexOf(value) === index);
}
