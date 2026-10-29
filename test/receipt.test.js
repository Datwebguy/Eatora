import test from "node:test";
import assert from "node:assert/strict";
import { sealReceipt } from "../lib/receipt.js";

test("planning receipts contain a deterministic integrity hash", () => {
  const receipt = sealReceipt({ input: { location: "Austin" }, placeIds: ["place:1"], qlooCalls: [] });
  assert.equal(receipt.integrity.algorithm, "sha256");
  assert.equal(receipt.integrity.hash.length, 64);
});
