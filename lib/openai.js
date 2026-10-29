export class OpenAIClient {
  constructor({ apiKey, model = "gpt-4o-mini", fetchImpl = fetch } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async plan({ favorites, location, constraints }) {
    if (!this.apiKey) return { status: "not_configured", plan: null };
    const response = await this.fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
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
