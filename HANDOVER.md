# Handover — Eatora

Read this file first if you are continuing the project.

## Current objective

Ship the smallest complete version that proves the full journey before the Qloo Agentic Hackathon deadline: resolve favorites in Qloo, retrieve place recommendations with location and signals, apply hard constraints in code, show evidence, and show a pure-LLM comparison. Host it publicly.

## Definition of done

1. User submits favorites + location + constraints.
2. Backend resolves every name with `/search`. Handles ambiguity by returning choices.
3. Backend calls `/v2/insights` with `filter.type=urn:entity:place`, interest entities/tags, and location.
4. Backend applies constraint filters in code and ranks surviving places.
5. Response includes evidence chips derived only from the Qloo payload.
6. Frontend shows the Qloo plan and a pure-LLM plan for the same inputs.
7. Every Qloo call is logged.
8. Demo is hosted externally. Repo is public with license. API key never leaves the server.

## Build order (backend first)

1. Qloo client with retry, timeout, and parameter validation.
2. Entity resolution endpoint.
3. Insights call builder (only valid parameters).
4. Constraint filter module (soft texture, low-sodium, low-heat, simple medication notes).
5. Evidence assembly from raw Qloo response.
6. Pure-LLM comparison path (same inputs, no Qloo).
7. Frontend only after the above returns real data.

## Non-negotiable rules for any agent or developer

- Never hardcode restaurant names, affinity scores, tags, or sample responses.
- Never expose the API key to the client.
- Never let the language model invent places or scores.
- Never make medical claims.
- If a Qloo call returns empty, surface that fact.
- Invalid parameters are silently ignored by Qloo — validate against the Entity Type Parameter Guide.

## Constraints to implement in code

- Soft texture / easy-to-chew: prefer or require tags related to soup, soft, easy, stew, etc. (resolved via `/v2/tags`).
- Low-sodium: exclude or down-rank high-sodium indicators when available; document the method.
- Low-heat: exclude very spicy or high-heat tags.
- Simple medication notes: exact exclusion lists (grapefruit, high-potassium foods) applied as filters.

## Immediate next action

Implement and test the backend path (search → insights → constraint filter) against the live hackathon API with at least two of the personas in `EXAMPLES.md`. Do not start UI polish until this path returns verified results.
