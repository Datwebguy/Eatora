import test from "node:test";
import assert from "node:assert/strict";
import { QlooClient } from "../lib/qloo.js";
import { SessionLog } from "../lib/session-log.js";

test("Qloo insights sends only the documented place parameters and API header", async () => {
  let request;
  const client = new QlooClient({ apiKey: "secret", log: new SessionLog(), fetchImpl: async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ results: { entities: [] } }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  await client.insights({ entities: ["urn:entity:place:1"], location: "Brooklyn, NY", tags: ["urn:tag:soft"], take: 5 });
  const parsed = new URL(request.url);
  assert.equal(parsed.searchParams.get("filter.type"), "urn:entity:place");
  assert.equal(parsed.searchParams.get("signal.interests.entities"), "urn:entity:place:1");
  assert.equal(parsed.searchParams.get("signal.location.query"), "Brooklyn, NY");
  assert.equal(parsed.searchParams.get("filter.tags"), "urn:tag:soft");
  assert.equal(request.options.headers["X-Api-Key"], "secret");
});
