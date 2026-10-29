import http from "node:http";
import { QlooClient } from "./lib/qloo.js";
import { SessionLog } from "./lib/session-log.js";
import { applyConstraints } from "./lib/constraints.js";

const port = Number(process.env.PORT || 3000);

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function entitiesFrom(payload) { return payload?.results?.entities ?? payload?.entities ?? []; }

const server = http.createServer(async (req, res) => {
  const log = new SessionLog();
  const qloo = new QlooClient({ apiKey: process.env.QLOO_API_KEY, baseUrl: process.env.QLOO_BASE_URL, log });
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/session/log") return json(res, 200, { calls: log.entries() });
    if (req.method === "POST" && url.pathname === "/resolve") {
      const input = await body(req);
      if (!Array.isArray(input.favorites) || input.favorites.length < 1) return json(res, 400, { error: "favorites must be a non-empty array" });
      const resolved = [];
      for (const favorite of input.favorites) {
        const matches = entitiesFrom(await qloo.search(favorite, input.types));
        resolved.push({ query: favorite, choices: matches });
      }
      return json(res, 200, { resolved, calls: log.entries() });
    }
    if (req.method === "POST" && url.pathname === "/recommend") {
      const input = await body(req);
      if (!Array.isArray(input.entityIds) || input.entityIds.length < 1 || !input.location) return json(res, 400, { error: "entityIds and location are required" });
      const payload = await qloo.insights({ entities: input.entityIds, location: input.location, tags: input.tagIds, take: input.take });
      const places = entitiesFrom(payload);
      const filtered = applyConstraints(places, input.constraints).filter((item) => item.eligible);
      return json(res, 200, { places: filtered.slice(0, 5).map(({ place, passed }) => ({ ...place, evidence: passed, constraints: passed })), calls: log.entries(), empty: places.length === 0 });
    }
    if (req.method === "POST" && url.pathname === "/compare") {
      const input = await body(req);
      return json(res, 200, { inputs: input, qlooPlan: input.qlooPlan ?? null, pureLlmPlan: { note: "Connect your LLM provider here; this plan must use identical inputs and no Qloo data." } });
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 500, { error: error.message, calls: log.entries() });
  }
});

server.listen(port, () => console.log(`Eatora backend listening on ${port}`));
