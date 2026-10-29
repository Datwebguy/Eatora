import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { QlooClient } from "./lib/qloo.js";
import { SessionLog } from "./lib/session-log.js";
import { applyConstraints, resolveConstraints } from "./lib/constraints.js";
import { randomUUID } from "node:crypto";
import { OpenAIClient } from "./lib/openai.js";
import { constraintQueries, entitiesFrom, evidenceFor, idOf, nameOf, rankPlaces, validatePlanInput } from "./lib/planner.js";
import { sealReceipt } from "./lib/receipt.js";

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

export async function handler(req, res) {
  const sessionId = req.headers["x-session-id"] || randomUUID();
  const session = sessions.get(sessionId) || { log: new SessionLog(), entities: new Set(), tags: new Set(), entityRecords: new Map(), tagRecords: new Map(), investigations: 0 };
  sessions.set(sessionId, session);
  const { log } = session;
  const qloo = new QlooClient({ apiKey: process.env.QLOO_API_KEY, baseUrl: process.env.QLOO_BASE_URL, log });
  const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL });
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) url.pathname = url.pathname.slice(4);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, qlooConfigured: Boolean(process.env.QLOO_API_KEY), openaiConfigured: Boolean(process.env.OPENAI_API_KEY) }, sessionId);
    if (req.method === "GET" && url.pathname === "/session/log") return json(res, 200, { calls: log.entries() }, sessionId);
    if (req.method === "POST" && url.pathname === "/resolve") {
      const input = await body(req);
      if (!Array.isArray(input.favorites) || input.favorites.length < 1) return json(res, 400, { error: "favorites must be a non-empty array" }, sessionId);
      const resolved = [];
      for (const favorite of input.favorites) {
        const matches = entitiesFrom(await qloo.search(favorite, input.types));
        for (const match of matches) if (idOf(match)) { session.entities.add(idOf(match)); session.entityRecords.set(idOf(match), match); }
        resolved.push({ query: favorite, choices: matches });
      }
      session.resolved = resolved;
      return json(res, 200, { status: resolved.some(r => r.choices.length !== 1) ? "needs_selection" : "ready", resolved, calls: log.entries() }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/tags") {
      const input = await body(req);
      if (!input.keyword) return json(res, 400, { error: "keyword is required" }, sessionId);
      const matches = entitiesFrom(await qloo.tags(input.keyword));
      for (const match of matches) if (idOf(match)) { session.tags.add(idOf(match)); session.tagRecords.set(idOf(match), match); }
      return json(res, 200, { tags: matches, calls: log.entries() }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/recommend") {
      const input = await body(req);
      if (!Array.isArray(input.entityIds) || input.entityIds.length < 1 || !input.location) return json(res, 400, { error: "entityIds and location are required" }, sessionId);
      const validated = validatePlanInput(input);
      if (input.entityIds.length !== validated.favorites.length) return json(res, 400, { error: "Please choose a match for each favorite." }, sessionId);
      const selected = [];
      for (let i = 0; i < validated.favorites.length; i++) {
        const matches = entitiesFrom(await qloo.search(validated.favorites[i]));
        const match = matches.find(item => idOf(item) === input.entityIds[i]);
        if (!match) return json(res, 400, { error: "Please choose a match for each favorite." }, sessionId);
        selected.push(match);
      }
      const rules = await resolveConstraints(qloo, input.constraints || [], String(input.medicationNotes || ''));
      const payload = await qloo.insights({ entities: input.entityIds, location: input.location, take: 20 });
      const places = entitiesFrom(payload);
      const filtered = applyConstraints(places, rules).filter((item) => item.eligible);
      const signals = selected.map((signal) => ({ id: idOf(signal), label: nameOf(signal) }));
      return json(res, 200, { places: filtered.slice(0, Math.min(Number(input.take) || 5, 5)).map(({ place, passed }) => ({ ...place, evidence: evidenceFor(place, signals), constraints: passed })), calls: log.entries(), empty: places.length === 0, few: filtered.length < 3 }, sessionId);
    }
    if (req.method === "POST" && url.pathname === "/compare") {
      const input = await body(req);
      const { favorites, location, constraints, medicationNotes } = input;
      const pureLlmPlan = await openai.plan({ favorites, location, constraints: [...(constraints || []), ...(medicationNotes ? [medicationNotes] : [])] });
      return json(res, 200, { pureLlmPlan }, sessionId);
    }
    if (req.method === "GET") {
      const requested = url.pathname === "/" ? "/index.html" : (url.pathname === "/app" ? "/app.html" : url.pathname);
      const file = normalize(join(publicRoot, requested));
      if (file.startsWith(publicRoot)) {
        try { const content = await readFile(file); res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream", "cache-control": "no-cache" }); res.end(content); return; } catch { /* continue to JSON 404 */ }
      }
    }
    return json(res, 404, { error: "Not found" }, sessionId);
  } catch (error) {
    return json(res, 500, { error: error.message, calls: log.entries() }, sessionId);
  }
}

export default handler;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = http.createServer(handler);
  server.listen(port, () => console.log(`Eatora backend listening on ${port}`));
}
