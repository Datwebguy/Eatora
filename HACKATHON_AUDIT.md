# Hackathon Audit — Eatora

Source: [Qloo Agentic Hackathon](https://qloo.devpost.com/) and its [official rules](https://qloo.devpost.com/rules), checked October 29, 2026.

## Eligibility and submission requirements

- The project must be a working application that integrates the Qloo API and is an agentic tool, uses an agent framework, or integrates Qloo into an existing agent.
- The demo must be externally hosted, public, free to use, and usable end to end by judges.
- The repository must be public, contain the source, assets, and run instructions, and include a detectable open-source license.
- The Devpost submission must include the demo URL, repository URL, and a plain description of the product.
- Third-party SDKs and APIs must be used under their applicable terms.

## Judging implications

The four equally weighted criteria are technological implementation, design, potential impact, and quality of the idea. Eatora must therefore show a coherent caregiver workflow in addition to a real Qloo integration.

## Patterns adopted from reference projects

- Normalize every Qloo envelope before planning so `/search`, tags, and Insights response variants cannot leak into the UI.
- Keep a bounded retry, timeout, cache, and call log around the Qloo client.
- Stop on ambiguous entity resolution and expose the candidates for selection.
- Keep deterministic selection, filtering, ranking, and provenance checks in code.
- Return a structured receipt containing inputs, resolved signals, Qloo calls, result IDs, and an integrity hash.
- Keep the pure-LLM comparison separate from Qloo inputs and label it as unverified.
- Bound repeated investigations per session and expose an under-the-hood timeline.

## Remaining release gates

- Add the Qloo hackathon key to the server environment.
- Run at least two live personas against `https://hackathon.api.qloo.com`.
- Verify every visible place, tag, affinity, and evidence chip against the current session receipt.
- Add the rotated OpenAI key through Vercel environment variables and verify the comparison path.
- Complete a public mobile and desktop smoke test before the Devpost submission.

## Verification update

- Automated local tests exercise tag-ID matching, stated food exclusions, request construction, input validation, and receipts. These use synthetic test data; they do not verify Qloo's live response shapes.
- Constraint terms are sent to the tags endpoint. If it returns no tags, an exact match against a place's returned tag names is used as a fallback. Missing information is treated as unknown, not proof of suitability. This conservative rule may produce no results, particularly for ingredient exclusions.
- The comparison endpoint passes only favorites, location, constraints and the user's food note to the model client.
- The Qloo key was not available in the local runtime during this update; the two live persona checks remain outstanding.
- The recommendation request re-runs each favorite search and checks the chosen ID against the returned candidates, so validation does not depend on shared function memory. A local HTTP integration test verifies ambiguity, selection, empty results, and rejection of an invented ID using a simulated provider. Live verification remains outstanding.
