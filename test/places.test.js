import test from 'node:test';
import assert from 'node:assert/strict';
import { isDiningPlace, matchesRequestedLocality } from '../lib/places.js';

test('uses returned primary genre and locality rather than a broad tag', () => {
  const brooklyn = { properties: { primary_genre: { id: 'genre:restaurant:pizza' }, localities: [{ name: 'Brooklyn' }, { name: 'New York' }] } };
  const manhattan = { properties: { primary_genre: { id: 'genre:restaurant:pizza' }, localities: [{ name: 'Manhattan' }, { name: 'New York' }] } };
  const mall = { properties: { primary_genre: { id: 'genre:shopping_mall' }, localities: [{ name: 'Brooklyn' }] }, tags: [{ id: 'genre:restaurant' }] };
  assert.equal(isDiningPlace(brooklyn, 'genre:restaurant'), true);
  assert.equal(matchesRequestedLocality(brooklyn, 'Brooklyn, NY'), true);
  assert.equal(matchesRequestedLocality(manhattan, 'Brooklyn, NY'), false);
  assert.equal(isDiningPlace(mall, 'genre:restaurant'), false);
  assert.equal(matchesRequestedLocality({}, 'Brooklyn, NY'), false);
});
