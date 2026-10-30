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
| Low | Responses lacked basic anti-framing, MIME-sniffing and referrer controls | Local response headers did not contain these controls. | **Fixed locally:** add X-Frame-Options, X-Content-Type-Options and Referrer-Policy. A full CSP still needs design and browser validation. |
| Medium | Provider failures could expose raw error details | The catch handler returned `error.message` to callers. | **Fixed locally:** return a generic upstream error while preserving controlled validation errors. |

## Tool results and limits

- Gitleaks: current files and 39 git commits scanned with redaction; no secrets detected. This does not cover secrets exposed outside Git.
- Semgrep `p/javascript`: 68 rules, 13 tracked JavaScript files, zero findings; not exhaustive.
- Trivy: secret scan reported no findings. Vulnerability database download failed TLS certificate verification; vulnerability scanning was **not completed**. Misconfiguration checks fell back to embedded checks and found no supported config files.
- Schemathesis 4.32.7: 171 generated cases passed against the **three-operation** `openapi-subset.json` with a local mock provider. This is not a full API contract and does not test live upstreams.
- CATS 15.3.0: full default suite, 635 requests against the same subset; 192 reported errors and 247 warnings. Main groups included unsupported Accept headers, extra fields, and missing security headers. These results include contract assumptions and have not all been triaged; they are **not** 192 confirmed vulnerabilities.
- Nuclei: targeted HTTP misconfiguration templates against the local instance returned no printed findings; no full template suite was run.
- ZAP baseline: container installation failed because Docker reported no space left on device; no ZAP scan was completed.
- Shannon, Keploy, Microcks, REA, HumanLayer, 12-factor-agents, and agentcontrolplane: not installed or run in this pass. REA targets binaries, whereas this repository contains JavaScript source; the control-plane and principles repositories are not vulnerability scanners. Keploy/Microcks and Shannon require additional setup and a suitable isolated test environment. Their absence is a coverage gap, not a pass.

## Recommended CI gates

Run unit and integration tests, Gitleaks against working tree and history, pinned Semgrep rules, and a current vulnerability database scan. Maintain a complete OpenAPI contract and run bounded Schemathesis/CATS against a local mock-backed deployment; review and baseline expected contract differences rather than suppressing confirmed bugs. Add a browser smoke test and dependency-outage tests. Keep live keys out of pull-request jobs, use rate and spend limits on production, and periodically run an authorized dynamic scan in an isolated environment.
