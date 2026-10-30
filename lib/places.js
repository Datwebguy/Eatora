function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function matchesRequestedLocality(place, location) {
  const target = normalize(location.split(',')[0]);
  if (!target) return false;
  const properties = place?.properties || {};
  const locality = properties.locality && typeof properties.locality === 'object' ? Object.values(properties.locality) : [];
  const localities = Array.isArray(properties.localities) ? properties.localities : [];
  const names = [...locality, ...localities].map(item => normalize(item?.name));
  names.push(normalize(properties.neighborhood), normalize(properties.geocode?.city), normalize(properties.geocode?.name));
  return names.includes(target);
}

export function isDiningPlace(place, restaurantGenreId, excludedGenreIds = []) {
  const genre = place?.properties?.primary_genre;
  const genreId = typeof genre === 'object' && typeof genre?.id === 'string' ? genre.id : '';
  const ids = [genreId, ...(Array.isArray(place?.tags) ? place.tags.map(tag => typeof tag === 'string' ? tag : tag?.tag_id || tag?.id || tag?.value) : [])].filter(Boolean);
  return Boolean(restaurantGenreId && (genreId === restaurantGenreId || genreId.startsWith(`${restaurantGenreId}:`)) && !excludedGenreIds.some(id => ids.some(actual => actual === id || actual.startsWith(`${id}:`))));
}
