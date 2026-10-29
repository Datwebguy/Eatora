# Product Specification — Eatora

## One-sentence description

Eatora takes a senior’s real taste signals and hard constraints, resolves them in Qloo, and returns ranked dining options that are culturally grounded and practically usable, with every claim backed by a live API response.

## Problem

Caregivers need places that respect both what the person likes and what they can actually handle (texture, sodium, heat, simple medication exclusions). A plain LLM invents plausible-sounding places, has no local affinity data, and cannot reliably apply hard filters. Qloo supplies the taste graph; the backend must enforce the constraints.

## Primary user

Family caregiver or adult child planning a meal. Secondary: the senior, or a care-home coordinator.

## Inputs (required)

- 3–5 favorites. Mix of restaurants, dishes, films, music, or places is allowed.
- Location (city or neighborhood string).
- 2–3 constraints chosen from:
  - Soft texture / easy-to-chew
  - Low-sodium
  - Low-heat delivery (avoid very hot or spicy)
  - Simple medication notes (e.g. “avoid grapefruit”, “limit high-potassium”)

## Outputs (required)

- 3–5 ranked places that passed both taste signals and constraints.
- For each place:
  - Name and basic metadata returned by Qloo
  - Evidence chips listing the exact signals that contributed
  - Plain statement of which constraints were applied and how
- Side-by-side pure-LLM plan generated from the identical inputs (no Qloo).
- Log of every Qloo request and response summary (for the under-the-hood drawer).

## Hard rules

- Every place, tag, and affinity value shown to the user must originate from a Qloo response in that session.
- Constraint filtering and ranking logic lives in code, not in the language model.
- If Qloo returns empty or low-quality results for a location, say so. Do not invent places.
- No medical claims. Medication notes are exclusion filters only.

## Success criteria for submission

- Live hosted demo a judge can complete in under two minutes.
- Public repository with license.
- Visible Qloo evidence on every recommendation.
- Visible pure-LLM comparison.
- Backend handles resolution, insights, constraint application, and error cases without hardcoding.

## Explicitly out of scope for v1

- Full drug-interaction databases
- Ordering, payment, or reservations
- Persistent user accounts or history
- Multi-day meal plans
- Medical diagnosis or advice
