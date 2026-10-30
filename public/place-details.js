export function safeWebLink(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

export function phoneLink(value) {
  if (typeof value !== 'string' || !/^[+\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/[^\d+]/g, '');
  return /^\+?\d{7,15}$/.test(digits) ? `tel:${digits}` : null;
}

export function questionFor(need) {
  const lower = need.toLowerCase();
  if (lower.includes('texture') || lower.includes('chew')) return 'Which menu items are soft and easy to chew?';
  if (lower.includes('sodium')) return 'Which dishes can be prepared with less salt, and is sodium information available?';
  if (lower.includes('heat') || lower.includes('spicy')) return 'Which dishes can be served mild and at a comfortable temperature?';
  return `Can you confirm this need for the dish: ${need}?`;
}

export function specialtyDishes(place) {
  const dishes = place?.properties?.specialty_dishes;
  if (!Array.isArray(dishes)) return [];
  return dishes.map(item => typeof item === 'string' ? item : item?.name).filter(item => typeof item === 'string' && item.trim()).slice(0, 4);
}
