import test from 'node:test';
import assert from 'node:assert/strict';
import { safeWebLink, phoneLink, questionFor, specialtyDishes } from '../public/place-details.js';

test('restaurant links accept only safe web addresses and phone numbers', () => {
  assert.equal(safeWebLink('javascript:alert(1)'), null);
  assert.equal(safeWebLink('https://user:password@example.com'), null);
  assert.equal(safeWebLink('https://example.com/menu'), 'https://example.com/menu');
  assert.equal(phoneLink('+1 (212) 555-0100'), 'tel:+12125550100');
  assert.equal(phoneLink('555;123'), null);
});

test('specialties are taken from the place response only', () => {
  assert.deepEqual(specialtyDishes({ properties: { specialty_dishes: [{ name: 'Soup' }, { name: 'Stew' }] } }), ['Soup', 'Stew']);
  assert.deepEqual(specialtyDishes({ properties: {} }), []);
});

test('questions reflect the selected need without adding medical advice', () => {
  assert.match(questionFor('Low-sodium'), /salt/);
  assert.match(questionFor('no shellfish'), /no shellfish/);
});
