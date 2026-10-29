import test from "node:test";
import assert from "node:assert/strict";
import { applyConstraints } from "../lib/constraints.js";

test("constraint filtering keeps eligible Qloo entities and records applied filters", () => {
  const result = applyConstraints([
    { id: "1", name: "Soup House", tags: ["soft", "low sodium"] },
    { id: "2", name: "Chili Grill", tags: ["spicy"] }
  ], ["Soft texture", "Low-sodium", "Low-heat delivery"]);

  assert.equal(result[0].eligible, true);
  assert.deepEqual(result[0].passed, ["soft texture / easy-to-chew", "low-sodium", "low-heat delivery"]);
  assert.equal(result[1].eligible, false);
  assert.match(result[1].excluded.join(" "), /soft texture/);
});

test("medication notes are exclusions, not medical advice", () => {
  const result = applyConstraints([{ name: "Citrus Bowl", ingredients: ["grapefruit"] }], ["Avoid grapefruit"]);
  assert.equal(result[0].eligible, false);
  assert.deepEqual(result[0].excluded, ["avoid grapefruit"]);
});
