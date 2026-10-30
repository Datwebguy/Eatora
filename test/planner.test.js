import test from "node:test";
import assert from "node:assert/strict";
import { constraintQueries, evidenceFor, idOf, validatePlanInput } from "../lib/planner.js";

test("plan input enforces the product contract", () => {
  assert.deepEqual(validatePlanInput({ favorites: ["a", "b", "c"], location: "Brooklyn", constraints: ["Low-sodium", "Low-heat delivery"] }), { favorites: ["a", "b", "c"], location: "Brooklyn", constraints: ["Low-sodium", "Low-heat delivery"] });
  assert.throws(() => validatePlanInput({ favorites: ["a"], location: "Brooklyn", constraints: ["Low-sodium"] }), /3 to 5/);
});

test('evidence uses only signals identified by Insights explainability', () => {
  const signals = [{ id: 'a', label: 'First favorite' }, { id: 'b', label: 'Second favorite' }];
  const place = { query: { explainability: { 'signal.interests.entities': [{ entity_id: 'b', score: 1 }] } } };
  assert.deepEqual(evidenceFor(place, signals), [{ id: 'b', label: 'Second favorite' }]);
  assert.deepEqual(evidenceFor({}, signals), []);
});

test("constraint tag queries are keywords, never fabricated Qloo IDs", () => {
  assert.deepEqual(constraintQueries(["Soft texture / easy-to-chew", "Low-heat delivery"]), ["soft", "soup", "stew", "mild", "non spicy"]);
  assert.equal(idOf({ entity_id: "qloo:1" }), "qloo:1");
});
