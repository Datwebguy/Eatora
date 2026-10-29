# Build Plan — Eatora

## Must ship (deadline critical)

- [ ] Server-side Qloo client (search, tags, insights) with key protection, retries, and logging
- [ ] Entity resolution that handles ambiguity
- [ ] Insights call that uses only valid parameters for `urn:entity:place`
- [ ] Constraint filter module in code (soft texture, low-sodium, low-heat, simple medication notes)
- [ ] Evidence assembly that reads only from the live Qloo response
- [ ] Pure-LLM comparison path
- [ ] Hosted demo + public repo with license
- [ ] README and HANDOVER updated

## Backend quality bar

- No hardcoded restaurant data, scores, or tags in the production path
- Every user-visible place traces to a Qloo call in that session
- Errors and empty results are explicit
- API key never reaches the client

## Should ship if time remains

- [ ] Under-the-hood call log in the UI
- [ ] Two or three one-click demo personas
- [ ] Basic input validation and loading states

## Explicitly defer

- User accounts or persistence
- Ordering or reservations
- Full medical databases
- Multi-day planning
- Mobile apps

## Suggested order

1. Qloo client + logging
2. Resolution endpoint
3. Insights + constraint filter
4. Evidence payload
5. LLM comparison
6. Minimal frontend
7. Host and submit
