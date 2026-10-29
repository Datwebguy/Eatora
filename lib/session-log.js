export class SessionLog {
  #entries = [];

  add({ method, path, params, status, summary, error }) {
    this.#entries.push({
      at: new Date().toISOString(),
      method,
      url: `${path}${params ? `?${new URLSearchParams(params)}` : ""}`,
      status,
      summary,
      ...(error ? { error } : {})
    });
  }

  entries() { return [...this.#entries]; }
}
