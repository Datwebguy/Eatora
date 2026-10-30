import test from 'node:test';
import assert from 'node:assert/strict';
import { applyConstraints, resolveConstraints } from '../lib/constraints.js';

test('uses returned tag IDs and excludes stated medication terms', async () => {
  const qloo = { tags: async term => ({ results: { tags: [{ tag_id: `id:${term}`, name: term }] } }) };
  const rules = await resolveConstraints(qloo, ['Soft texture / easy-to-chew'], 'no shellfish');
  const [safe, excluded, unknown] = applyConstraints([
    { tags: [{ tag_id: 'id:soft' }, { tag_id: 'id:other' }] },
    { tags: [{ tag_id: 'id:soft' }, { tag_id: 'id:shellfish' }] },
    { tags: [] }
  ], rules);
  assert.deepEqual(excluded.excluded, ['no shellfish']);
  assert.equal(excluded.eligible, false);
  assert.equal(unknown.eligible, false);
  assert.equal(safe.eligible, false); // Absence of an ingredient tag does not establish safety.
});

test('ignores unrelated and ambience tags returned by a broad search', async () => {
  const qloo = { tags: async () => ({ results: { tags: [{ tag_id: 'ambience', name: 'Soft', type: 'urn:tag:ambience:qloo' }, { tag_id: 'unrelated', name: 'Low income housing', type: 'urn:tag:category:place' }] } }) };
  const rules = await resolveConstraints(qloo, ['Soft texture / easy-to-chew', 'Low-sodium']);
  assert.deepEqual(rules.map(rule => rule.ids), [[], []]);
  assert.equal(applyConstraints([{ tags: [{ tag_id: 'ambience' }, { tag_id: 'unrelated' }] }], rules)[0].eligible, false);
});
