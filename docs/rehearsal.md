# Workshop rehearsal and release record

## Decision: NO-GO for the workshop until live gates pass

Local release hardening is implemented. This is not evidence of deployed-cloud,
real-model, or physical-device readiness. Do not mark the iteration Done yet.

## Iteration 001 live typed publication — 2026-09-15

**Result:** Real typed capture-to-GitHub-to-Pages publication passed from the local
application. This evidence completes that part of Iteration 001 only; cloud
application deployment, OpenRouter and physical-device validation were not performed.
The workshop decision remains **NO-GO**, and Iteration 001 remains **Implemented locally**.

- Operator: Codex on Matt's host, at the user's direction; UTC 2026-09-15.
- Capture application: `dc8f95bc33ebd4f476112c5e9b5f5aabf3ab147c` (clean before the run), Node 24.18.0,
  built with `npm run build`, real `src/server.ts` entrypoint at local port 18081.
  Chromium used the Pixel 7 viewport; this was not a physical phone.
- Authentication: existing host GitHub CLI credentials, read through a subprocess
  pipe and supplied to the server in memory. No token values were printed or written
  into rehearsal files. A dedicated production publishing token remains pending.
- Fixture: **TEMPORARY REHEARSAL Iteration 001 2026-09-15**, anonymous attribution,
  synthetic Name/Context/Problem/Solution only; no participant data or media.
  Its Context explicitly identified it as a temporary operator rehearsal.
- Browser flow: entered all four fields; observed the provisional name on the live
  dashboard; reloaded and verified the fields survived; reviewed the exact fields
  and anonymous attribution; clicked **Publish to handbook**. The real multipart
  API returned HTTP 201 at 01:32:03 UTC. Result and dashboard links matched the
  returned public URL, and the local draft was cleared after publication.
- Publication: [handbook commit df7d3983bfcba9d5b5f864be4bea2788eaa945dd](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/commit/df7d3983bfcba9d5b5f864be4bea2788eaa945dd),
  directly on `main`, parent `b78895ee30cfa075c0ebeda475494e8204806d97`.
  GitHub's commit API confirmed exactly two added files: the page bundle's `index.md`
  and its atomic capture receipt. The capture UUID was
  `fdfaa7f0-946c-4a02-8e5f-31937e8cb086`; the Markdown matched the reviewed text.
- Deployment: [Publish handbook run 34917647418](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/actions/runs/34917647418)
  used that exact publication SHA. Both build and deploy succeeded; deploy finished
  at 01:32:25 UTC.
- Rendered verification at 01:33:07 UTC: the [temporary page](https://mattwynne.github.io/explore-ddd-anti-authoritarian-team-practices-workshop/patterns/temporary-rehearsal-iteration-001-2026-09-15/)
  returned HTTP 200. Chromium verified the title, all three body fields and Anonymous
  attribution. The handbook homepage returned HTTP 200 and its pattern link opened
  that rendered page. This URL is intentionally removed by cleanup below.
- Cleanup: [handbook commit aaa188cb7d7ee97b4da19946f476bf3bf3314cea](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/commit/aaa188cb7d7ee97b4da19946f476bf3bf3314cea)
  was pushed directly to `main` and deletes only the temporary bundle's `index.md`.
  The non-rendered `.workshop-captures/eddbbf8378a032a836ccc21c78334ea7e1d4d7cc26a02346634649b3d63aff49.json`
  receipt is deliberately retained for retry safety. Compared with the original
  handbook parent, this one-line receipt is the only remaining Git change.
- Cleanup deployment: [Publish handbook run 34917726067](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/actions/runs/34917726067)
  used the exact cleanup SHA; build and deploy succeeded, finishing at 01:33:43 UTC.
  At 01:34:27 UTC a fresh Chromium browser observed HTTP 404 at the original
  temporary URL, HTTP 200 at the homepage, and no temporary title or pattern link
  on the homepage. GitHub's commit API confirmed that cleanup removed only the
  temporary Markdown file and had the publication commit as its sole parent.
- Checks rerun: `npm run check` passed all 43 tests and TypeScript build;
  `npm run test:browser` passed all 21 tests; `HUGO_BIN=/tmp/hugo-007/hugo npm run check:hugo`
  passed using Hugo extended 0.150.0 (four HTML pages, 18 local links/assets).
  Existing missing section/taxonomy layout warnings remain as described below.
  The live test exposed no application defect, so no implementation fix or new
  regression test was needed. The one-off browser probe's exact homepage-link
  assertion was corrected to include its existing Anonymous accessible text.

This run did not exercise live simultaneous submissions, interrupted-response
retries, image publishing, deployed-cloud boundaries, real models, or physical
phones. Those broader release gates remain pending; local race/retry coverage is
not evidence that they were exercised against GitHub in this run.

## Reproducible local evidence

Run from a clean checkout with Node 24:

```sh
npm ci
npx playwright install --with-deps chromium
npm run check
npm run test:browser
# Install Hugo extended 0.150.0 (same version as the handbook workflow).
npm run check:hugo
npm run qr -- https://YOUR-FINAL-CAPTURE-HOST/ artifacts/qr
```

`check` includes a QR CLI test that decodes a PNG, API fault tests, a generated
126-second WAV duration rejection, and stateful Git protocol tests. The Git double
models immutable trees, fast-forward rejection, simultaneous same-name and
same-capture publication, a committed update whose response is lost, server errors,
and credential/rate-limit failures. No test writes to the live handbook.

The load rehearsal uses **50 simultaneous HTTP clients, 100 total patterns and five
live SSE subscribers**. It checks complete published snapshots, disconnect/reconnect,
private-field exclusion and a 15-second local completion budget. A representative
run took about 0.4 seconds. Publishing is stubbed: this excludes real GitHub latency,
API quotas, Pages queueing, model inference, Cloud Run resources and room Wi-Fi.
The Git protocol test separately stresses 12 same-name captures plus a duplicate request.

Browser coverage uses Chromium with a Pixel 7 viewport and a separate 320px check:
text, photo and uploaded-audio flows across individual/group/anonymous attribution;
explicit suggestion application, editing, reload recovery, review and publication;
original/cleaned avatars; failed AI/network calls and manual publication; microphone
denial and synthetic browser MediaRecorder capture/track cleanup; dashboard reconnect and escaped hostile titles; focus transitions and axe
WCAG A/AA checks on capture, review, result and dashboard. Provider responses and
recordings are synthetic. This does not certify screen-reader or physical-phone use.

The Hugo check clones pinned handbook revision
`b78895ee30cfa075c0ebeda475494e8204806d97` into temporary storage, generates three
attribution bundles and both selected-avatar variants, builds four HTML pages and
checks 18 local links/assets plus any local fragments. It verifies pattern bodies
and image alt text. The unchanged handbook emits missing section/taxonomy layout
warnings; no generated navigation points at these missing pages. The check does
not crawl external links or claim that Pages has deployed. Set `HANDBOOK_CHECKOUT`
to a local clone to avoid network cloning and `HUGO_BIN` to a local Hugo binary.
Temporary validation files are removed even on failure.

Final local validation: `npm run check` passed 43 tests; `npm run test:browser`
passed 21 tests; the pinned Hugo clean build and all 18 local link/asset checks
passed. The QR round-trip check is included in the 43-test suite.

## Operational properties and limits

- Slug checks and capture receipts use the same immutable Git parent. Each commit
  atomically writes the page bundle and `.workshop-captures/<SHA-256 of capture ID>.json`.
  Never delete these receipts: they make retries across process restarts safe even
  when GitHub code search has not indexed the commit. The receipt contains only the slug.
  A repeated capture ID resolves to the first publication, including after name edits.
  Existing pre-007 publications have no receipt; do not replay old capture IDs.
- Git operations time out after 20 seconds; AI calls after 60 seconds per call.
  Ref retries have an approximately four-minute budget (an in-progress request can
  extend it). Permission/rate-limit errors fail closed. Participants can retry a
  failed publication using the same draft; do not create a new draft to retry an
  ambiguous publication. Git is authoritative; the handbook link may lag behind it.
- Dashboard state resets on restart; reconnect gets a full current snapshot.
  Published cards cannot regress from late form edits or failed retries. Heartbeats
  run every 15 seconds and clients exceeding 1 MiB of queued data are disconnected.
  EventSource retries automatically. This is a small-room board with no durable
  history or unlimited-session capacity guarantee.
- Draft names and stages are public on the dashboard. Bodies, attribution, audio,
  photos and credentials are excluded. API responses are marked `no-store`.
  The app holds temporary media only in request memory; provider-side retention is
  governed by OpenRouter/provider policies and is not guaranteed by this app.
- Request logs are JSON with generated request ID, method, route template, status
  and duration. They never include raw URLs/query strings, bodies, headers, capture
  IDs, error payloads or media. `X-Request-ID` connects a participant's failed request
  to a log. SSE duration logs appear when the response finishes, not on every event.
  Generic error messages keep external exceptions out of participant responses.

## Facilitated release gates (none fully complete)

Record operator, UTC date, app commit/revision, handbook commit, devices and observed
results for each gate. Use a clearly labelled real rehearsal pattern and retain its
Git/Pages links as evidence; do not publish test participant data without review.

| Gate | Required evidence | Status |
| --- | --- | --- |
| Cloud bootstrap and deployment | Project/billing, Secret Manager, WIF deploy, exact image revision, `/health` | Pending: Google credentials/configuration unavailable |
| GitHub publishing and Pages | Real token, simultaneous submissions, retry after interrupted response, final page/selected image | Partial: Iteration 001 local-app typed publication and Pages cleanup verified above; dedicated publishing token, deployed integration, live concurrency/interrupted retry and image checks remain pending |
| OpenRouter | Cards, real recordings, configured model IDs, credits, latency, failure fallback | Pending: OpenRouter credentials |
| iPhone Safari and Android Chrome | Camera/library, HEIC, original/cleaned human review, photo suggestions, recorder/file fallback, attribution, review, public page | Pending: physical devices |
| Accessibility | VoiceOver/TalkBack, keyboard, zoom, touch targets and readable errors in room conditions | Pending: physical/manual review |
| Room rehearsal | 50 clients/100 patterns with real boundaries, projected board, reconnect, restart, Wi-Fi loss, noisy recordings | Pending: facilitated room/cloud rehearsal |
| QR and final URL | Generate final SVG/PNG; print URL alongside; scan from both phones at room distance | Pending: final deployed URL and physical scans |
| Go/no-go approval | Facilitators review every gate and record explicit decision | Pending; current decision NO-GO |

Use the manual text form when AI is unavailable. If publication or internet access
is down, keep the same browser draft open and retain paper cards; wait for recovery
and retry with the same capture ID. Browser-local text survives reload; media may
need reselection. After a server restart, reload restores text into a new live draft;
first check Git/the handbook for any ambiguous earlier publication to avoid creating
a second capture of the same work.
