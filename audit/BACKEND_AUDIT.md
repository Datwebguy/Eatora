# Backend audit — 2026-10-30

Scope: local Eatora working tree, Node 24, mock Qloo provider and no real provider keys. No active scan was directed at the production site or Qloo. This is a partial audit, not a certification.

## Findings

| Severity | Finding | Evidence / reproduction | Fix and status |
| --- | --- | --- | --- |
| High | Public paid-provider endpoints have no shared abuse or spending limit | `POST /api/compare` and `/api/resolve` are public; repeated valid requests invoke upstream providers. Request size limits do not limit request volume. | **Open:** configure a shared rate limit and spending caps on the deployment; local in-memory counters would not enforce a limit across serverless instances. |
| High | The OpenAI key was pasted into the conversation before being installed | Session history, not repository contents. Gitleaks does not cover chat. | **Open:** rotate the exposed key and replace the production secret. |
| Medium | Request bodies and user-controlled lists were unbounded | Before this change, `body()` accumulated arbitrary input and `/resolve` iterated any number of favorites; long food notes produced many tag calls. | **Fixed locally:** 16 KiB body limit, 3–5 favorites, bounded notes, valid distinct needs, and comparison validation. Regression tests in `test/security.test.js`. |
| Medium | Cross-origin simple requests could send JSON as `text/plain` to paid endpoints | Before this change `body()` parsed JSON without checking Content-Type. | **Fixed locally:** require `application/json`; this reduces browser-based cross-origin request abuse, but does not replace authentication or rate limits. |
| Low | Unsupported methods returned 404 rather than 405 | Schemathesis reproduced with `TRACE /health`. | **Fixed locally:** known endpoints return 405 and an Allow header. |
| Low | Responses lacked browser policy headers | Local response headers did not contain these controls. | **Fixed locally:** add X-Frame-Options, X-Content-Type-Options, Referrer-Policy and a restrictive Content-Security-Policy. ZAP retest removed the CSP finding. |
| Medium | Provider failures could expose raw error details | The catch handler returned `error.message` to callers. | **Fixed locally:** return a generic upstream error while preserving controlled validation errors. |

## Tool results and limits

- Gitleaks: current files and 39 git commits scanned with redaction; no secrets detected. This does not cover secrets exposed outside Git.
- Semgrep `p/javascript`: 68 rules, 13 tracked JavaScript files, zero findings; not exhaustive.
- Trivy: vulnerability database downloaded successfully with the host CA mounted. The scan exited cleanly, with no secret findings; this repository has no lockfile or supported container/config files, so no dependency or image CVE inventory was produced.
- Schemathesis 4.32.7: 171 generated cases passed against the **three-operation** `openapi-subset.json` with a local mock provider. This is not a full API contract and does not test live upstreams.
- CATS 15.3.0: full default suite, 635 requests against the same subset; 192 reported errors and 247 warnings. Main groups included unsupported Accept headers, extra fields, and missing security headers. These results include contract assumptions and have not all been triaged; they are **not** 192 confirmed vulnerabilities.
- Nuclei: targeted HTTP misconfiguration templates against the local instance returned no findings. A full template suite was not run.
- OWASP ZAP 2.17.0: standalone scan against the local instance completed. Initial findings were a missing CSP and a missing SRI attribute. CSP and pinned SRI attributes for the two Google Fonts stylesheets were added; the follow-up scan reported zero alerts.
- Microcks 1.15.0: imported the OpenAPI subset and ran the local contract test against the mock-backed server. All three operations (`GET /health`, `POST /resolve`, `POST /compare`) passed in test `6ae461485727ac5480537a89`.
- REA: official CLI analysis completed against the JavaScript tree (26 files inventoried, 21 parsed, 0 parse failures). It produced static dependency/control-flow observations; these are evidence for review, not confirmed vulnerabilities.
- Keploy: official binary installed, but recording could not start because this environment has no `sudo`; no recordings or generated tests were claimed.
- Shannon: official CLI installed and preflight attempted against the local server. Its Docker worker image exhausted the temporary filesystem during setup, so no model-backed penetration scan completed and no Shannon finding is claimed.
- HumanLayer, 12-factor-agents, and agentcontrolplane: official repositories were reviewed. They are agent control-plane/principles projects rather than scanners for this Node service; no safe standalone vulnerability command applies to this codebase. Their guidance informed the audit boundary.

## Recommended CI gates

Run unit and integration tests, Gitleaks against working tree and history, pinned Semgrep rules, and a current vulnerability database scan. Maintain a complete OpenAPI contract and run bounded Schemathesis/CATS/Microcks checks against a local mock-backed deployment; review and baseline expected contract differences rather than suppressing confirmed bugs. Add a browser smoke test and dependency-outage tests. Keep live keys out of pull-request jobs, use rate and spend limits on production, and periodically run an authorized dynamic scan in an isolated environment.
