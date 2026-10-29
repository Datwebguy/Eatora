import http from "node:http";
import { QlooClient } from "./lib/qloo.js";
import { SessionLog } from "./lib/session-log.js";
import { applyConstraints } from "./lib/constraints.js";
import { randomUUID } from "node:crypto";

const port = Number(process.env.PORT || 3000);
const sessions = new Map();

function json(res, status, body, sessionId) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(sessionId ? { "x-session-id": sessionId } : {}) });
  res.end(JSON.stringify(body));
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function entitiesFrom(payload) { return payload?.results?.entities ?? payload?.entities ?? []; }

const server = http.createServer(async (req, res) => {
  const sessionId = req.headers["x-session-id"] || randomUUID();
  const log = sessions.get(sessionId) || new SessionLog();
  sessions.set(sessionId, log);
  const qloo = new QlooClient({ apiKey: process.env.QLOO_API_KEY, baseUrl: process.env.QLOO_BASE_URL, log });
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, qlooConfigured: Boolean(process.env.QLOO_API_KEY), openaiConfigured: Boolean(process.env.OPENAI_API_KEY) }, sessionId);
    if (req.method === "GET" && url.pathname === "/session/log") return json(res, 200, { calls: log.entries() }, sessionId);
    if (req.method === "POST" && url.pathname === "/resolve") {
      const input = await body(req);
      if (!Array.isArray(input.favorites) || input.favorites.length < 1) return json(res, 400, { error: "favorites must be a non-empty array" }, sessionId);
      const resolved = [];
      for (const favorite of input.favorites) {
        const matches = entitiesFrom(await qloo.search(favorite, input.types));
        resolved.push({ query: favorite, choices: matches });
      }
      return json(res, 200, { resolved, calls: log.entries() }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/recommend") {
      const input = await body(req);
      if (!Array.isArray(input.entityIds) || input.entityIds.length < 1 || !input.location) return json(res, 400, { error: "entityIds and location are required" }, sessionId);
      const payload = await qloo.insights({ entities: input.entityIds, location: input.location, tags: input.tagIds, take: input.take });
      const places = entitiesFrom(payload);
      const filtered = applyConstraints(places, input.constraints).filter((item) => item.eligible);
      return json(res, 200, { places: filtered.slice(0, 5).map(({ place, passed }) => ({ ...place, evidence: passed, constraints: passed })), calls: log.entries(), empty: places.length === 0 }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/compare") {
      const input = await body(req);
      return json(res, 200, { inputs: input, qlooPlan: input.qlooPlan ?? null, pureLlmPlan: { status: process.env.OPENAI_API_KEY ? "ready" : "not_configured" } }, sessionId);
    }
    return json(res, 404, { error: "Not found" }, sessionId);
  } catch (error) {
    return json(res, 500, { error: error.message, calls: log.entries() }, sessionId);
  }
});

server.listen(port, () => console.log(`Eatora backend listening on ${port}`));
