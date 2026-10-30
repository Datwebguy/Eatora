export class OpenAIClient {
  constructor({ apiKey, model = "gpt-4o-mini", fetchImpl = fetch } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async decideFollowUp({ found, returned }) {
    // The model receives counts only. Code controls when the action is permitted.
    if (!this.apiKey) return { action: 'search_more', source: 'fallback' };
    try {
      const response = await this.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, temperature: 0, messages: [
          { role: 'system', content: 'Choose whether to check one additional page of place results. When fewer than three local dining candidates were found in a full page, choose search_more. Otherwise choose finish. Do not invent data.' },
          { role: 'user', content: JSON.stringify({ localDiningCandidates: found, resultsInFirstPage: returned }) }
        ], tools: [{ type: 'function', function: { name: 'choose_next_step', description: 'Choose the next bounded search action.', parameters: { type: 'object', properties: { action: { type: 'string', enum: ['search_more', 'finish'] } }, required: ['action'], additionalProperties: false } } }], tool_choice: { type: 'function', function: { name: 'choose_next_step' } } })
      });
      if (!response.ok) throw new Error('Decision unavailable');
      const result = await response.json();
      const call = result?.choices?.[0]?.message?.tool_calls?.[0];
      const action = JSON.parse(call?.function?.arguments || '{}').action;
      if (call?.function?.name !== 'choose_next_step' || !['search_more', 'finish'].includes(action)) throw new Error('Invalid decision');
      return { action, source: 'model' };
    } catch { return { action: 'search_more', source: 'fallback' }; }
  }

  async plan({ favorites, location, constraints }) {
    if (!this.apiKey) return { status: "not_configured", plan: null };
    const response = await this.fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        messages: [
          { role: "system", content: "You create a clearly labeled exploratory dining plan from user preferences. Do not claim Qloo evidence, live availability, safety, nutrition, or medical suitability. Do not present the plan as verified recommendations. Mention that a caregiver should confirm details directly." },
          { role: "user", content: JSON.stringify({ favorites, location, constraints }) }
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI ${response.status}`);
    return { status: "ready", plan: data?.choices?.[0]?.message?.content || "No comparison plan was returned." };
  }
}
