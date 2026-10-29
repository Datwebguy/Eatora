export class SessionLog {
  #entries = [];

  add({ method, path, params, status, summary, error, ms, cached }) {
    this.#entries.push({
      at: new Date().toISOString(),
      method,
      path,
      params,
      url: `${path}${params ? `?${new URLSearchParams(params)}` : ""}`,
      status,
      ...(ms !== undefined ? { ms } : {}),
      ...(cached ? { cached: true } : {}),
      summary,
      ...(error ? { error } : {})
    });
  }

  entries() { return [...this.#entries]; }
}
