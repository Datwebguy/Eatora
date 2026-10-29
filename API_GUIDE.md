# Qloo API Guide — Eatora

## Base configuration

- Base URL: `https://hackathon.api.qloo.com`
- Authentication: `X-Api-Key` header. Do not use Bearer.
- Insights method: GET. All parameters in the query string.
- Key must remain server-side only.

## Required flow

1. Resolve names  
   `GET /search?query=<name>&types=urn:entity:place`  
   (Also works for artist, movie, etc. Check supported types.)

2. Resolve tags  
   `GET /v2/tags?filter.query=<keyword>`  
   Use only returned tag IDs.

3. Get place recommendations  
   `GET /v2/insights?filter.type=urn:entity:place&signal.interests.entities=<id1>,<id2>&signal.location.query=<city>&filter.tags=<tag_ids>`

## Supported parameters for places (`urn:entity:place`)

- `signal.interests.entities`
- `signal.interests.tags`
- `signal.location.query` or `filter.location.query`
- `filter.tags` (and `operator.filter.tags`)
- `signal.demographics.age` (optional)
- `take`, `offset`

Do not use `urn:entity:food_and_drink`. It is not supported.

## Critical pitfalls

- Invalid parameters are silently ignored. Always cross-check the Entity Type Parameter Guide.
- Empty results are common in thinner regions. Surface them; do not invent data.
- Hackathon keys only work against the hackathon base URL.
- Rate limits are high but finite. Implement basic retry with backoff.

## Logging requirement

Every request URL (redact the key) and a summary of the response (entity count, top names, any error) must be stored for the session so the under-the-hood view can display it.

## Official references

- https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
- https://docs.qloo.com/reference/available-parameters-by-entity-type
- https://docs.qloo.com/reference/insights-with-location-use-case
- https://docs.qloo.com/reference/get-search
- https://docs.qloo.com/reference/insights-api-deep-dive

## Testing note

Test with real keys against the hackathon endpoint. Do not rely on fixtures for the final demo path.
