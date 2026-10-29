import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { QlooClient } from "./lib/qloo.js";
import { SessionLog } from "./lib/session-log.js";
import { applyConstraints } from "./lib/constraints.js";
import { randomUUID } from "node:crypto";
import { OpenAIClient } from "./lib/openai.js";

const port = Number(process.env.PORT || 3000);
const sessions = new Map();
const publicRoot = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

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
  const session = sessions.get(sessionId) || { log: new SessionLog(), entities: new Set(), tags: new Set() };
  sessions.set(sessionId, session);
  const { log } = session;
  const qloo = new QlooClient({ apiKey: process.env.QLOO_API_KEY, baseUrl: process.env.QLOO_BASE_URL, log });
  const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL });
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
        for (const match of matches) if (match.entity_id || match.id) session.entities.add(match.entity_id || match.id);
        resolved.push({ query: favorite, choices: matches });
      }
      return json(res, 200, { resolved, calls: log.entries() }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/tags") {
      const input = await body(req);
      if (!input.keyword) return json(res, 400, { error: "keyword is required" }, sessionId);
      const matches = entitiesFrom(await qloo.tags(input.keyword));
      for (const match of matches) if (match.id || match.entity_id) session.tags.add(match.id || match.entity_id);
      return json(res, 200, { tags: matches, calls: log.entries() }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/recommend") {
      const input = await body(req);
      if (!Array.isArray(input.entityIds) || input.entityIds.length < 1 || !input.location) return json(res, 400, { error: "entityIds and location are required" }, sessionId);
      if (input.entityIds.some((id) => !session.entities.has(id))) return json(res, 400, { error: "Every entity ID must come from a Qloo search in this session" }, sessionId);
      if (input.tagIds?.some((id) => !session.tags.has(id))) return json(res, 400, { error: "Every tag ID must come from a Qloo tag search in this session" }, sessionId);
      const payload = await qloo.insights({ entities: input.entityIds, location: input.location, tags: input.tagIds, take: input.take });
      const places = entitiesFrom(payload);
      const filtered = applyConstraints(places, input.constraints).filter((item) => item.eligible);
      return json(res, 200, { places: filtered.slice(0, 5).map(({ place, passed }) => ({ ...place, evidence: passed, constraints: passed })), calls: log.entries(), empty: places.length === 0 }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/compare") {
      const input = await body(req);
      const pureLlmPlan = await openai.plan(input);
      return json(res, 200, { inputs: input, qlooPlan: input.qlooPlan ?? null, pureLlmPlan }, sessionId);
    }
    if (req.method === "GET") {
      const requested = url.pathname === "/" ? "/index.html" : url.pathname;
      const file = normalize(join(publicRoot, requested));
      if (file.startsWith(publicRoot)) {
        try { const content = await readFile(file); res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream", "cache-control": "no-cache" }); res.end(content); return; } catch { /* continue to JSON 404 */ }
      }
    }
    return json(res, 404, { error: "Not found" }, sessionId);
  } catch (error) {
    return json(res, 500, { error: error.message, calls: log.entries() }, sessionId);
  }
});

server.listen(port, () => console.log(`Eatora backend listening on ${port}`));
