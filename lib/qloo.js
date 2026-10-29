const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export class QlooClient {
  constructor({ apiKey, baseUrl = "https://hackathon.api.qloo.com", log, fetchImpl = fetch } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.log = log;
    this.fetch = fetchImpl;
  }

  async request(path, params = {}) {
    if (!this.apiKey) throw new Error("QLOO_API_KEY is not configured");
    if (!path.startsWith("/")) throw new Error("Qloo path must start with /");
    const query = new URLSearchParams(params);
    const url = `${this.baseUrl}${path}?${query}`;
    const cached = cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      this.log?.add({ method: "GET", path, params, status: 200, summary: { entityCount: cached.entities, topNames: cached.names }, cached: true });
      return cached.body;
    }
    cache.delete(url);
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const started = Date.now();
        const response = await this.fetch(url, { headers: { "X-Api-Key": this.apiKey, Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
        const body = await response.json().catch(() => ({}));
        const rawResults = body?.results;
        const entities = Array.isArray(rawResults) ? rawResults : (rawResults?.entities ?? body?.entities ?? body?.tags ?? []);
        this.log?.add({ method: "GET", path, params, status: response.status, ms: Date.now() - started, summary: { entityCount: entities.length, topNames: entities.slice(0, 5).map((e) => e.name || e.title).filter(Boolean) } });
        if (response.ok) { cache.set(url, { body, expiresAt: Date.now() + CACHE_TTL_MS, entities: entities.length, names: entities.slice(0, 5).map((e) => e.name || e.title).filter(Boolean) }); return body; }
        if (!RETRYABLE.has(response.status)) {
          this.log?.add({ method: "GET", path, params, status: response.status, summary: { entityCount: entities.length }, error: body?.message || `Qloo ${response.status}` });
          throw new Error(body?.message || `Qloo ${response.status}`);
        }
        lastError = new Error(`Qloo ${response.status}`);
      } catch (error) {
        lastError = error;
        this.log?.add({ method: "GET", path, params, status: 0, summary: {}, error: error.message });
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
    throw lastError;
  }

  search(query, types) { return this.request("/search", { query, ...(types ? { types } : {}) }); }
  tags(keyword) { return this.request("/v2/tags", { "filter.query": keyword }); }
  insights({ entities, location, tags, take = 10, offset = 0 }) {
    if (!entities?.length || !location) throw new Error("Insights requires verified entities and a location");
    return this.request("/v2/insights", { "filter.type": "urn:entity:place", "signal.interests.entities": entities.join(","), "signal.location.query": location, ...(tags?.length ? { "filter.tags": tags.join(",") } : {}), take, offset });
  }
}
