# Eatora

Eatora is an agent that helps caregivers and seniors find real dining options that match personal taste and hard practical constraints.

Built for the [Qloo Agentic Hackathon](https://qloo.devpost.com/). The submission requires a functional public demo, a public open-source repository, and a live Qloo-powered workflow that judges can use end to end.

It is built for the Qloo Agentic Hackathon. Cultural intelligence from Qloo is the differentiator: a plain LLM guesses places and ignores local affinity; Eatora resolves real entities, queries the taste graph, and applies constraints in code with visible evidence.

## What it does

1. Accepts 3–5 favorites (restaurants, dishes, films, music, places), a location, and 2–3 constraints.
2. Resolves every name against Qloo `/search`. Asks the user if ambiguous.
3. Builds signals and calls `/v2/insights` for places (`urn:entity:place`) with location and interest signals.
4. Applies hard constraints in the backend (soft texture, low-sodium, low-heat, simple medication notes). Nothing that fails a constraint is returned.
5. Returns ranked places with Qloo evidence chips (which signals matched, affinity context).
6. Shows a pure-LLM plan for the identical inputs so the difference is visible.
7. Logs every Qloo call for the under-the-hood view.

## Why this product

Organizers listed senior meals with taste + age-specific needs (easy-to-chew, low-heat delivery, medication-aware) as an example. Tour routing and opener selection are already saturated. This job is not.

## Live demo requirements

- Hosted externally (Vercel, Render, or equivalent).
- Judge can try the full journey end-to-end with no private access.
- Public GitHub/GitLab/Bitbucket repo with an open-source license visible in the About section.
- Every claim about a place or affinity must trace to a real Qloo response.

## Security and data rules (non-negotiable)

- API key lives only on the server. Never ship it to the browser.
- Do not store user favorites, locations, or constraint data beyond the current session.
- Do not hardcode restaurant lists, affinity scores, tags, or sample Qloo responses in production code.
- Do not generate medical advice. Medication notes are simple exclusion filters only.
- Invalid or empty Qloo results must be surfaced honestly; do not invent replacements.

## Quick start for development

1. Obtain a hackathon API key for `https://hackathon.api.qloo.com`.
2. Set `QLOO_API_KEY` in the server environment.
3. Implement the backend flow first: search → insights → constraint filter → evidence assembly.
4. Add the frontend only after the backend returns verified results.

## Project files

- `HANDOVER.md` — start here
- `PRODUCT.md` — full specification
- `API_GUIDE.md` — exact endpoints, parameters, and pitfalls
- `AGENT_PROMPTS.md` — system prompts and tool rules
- `EXAMPLES.md` — personas and test cases
- `BUILD_PLAN.md` — prioritized tasks

## License

MIT (or Apache-2.0). Must appear in the repository About section.
