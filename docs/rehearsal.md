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

## Iteration 002 live avatar publication — 2026-09-15

**Result:** Real avatar capture-to-GitHub-to-Pages publication and cleanup passed
from the local application. The selected **Gently cleaned** image reached Git and
Pages unchanged, with the reviewed alt text on the detail page and no EXIF/GPS
metadata. Iteration 002 remains **Implemented locally**: deployed-cloud and
physical-device checks remain pending. The workshop decision remains **NO-GO**.
No other iteration was started or marked complete.

- Operator: Codex on Matt's host, at the user's direction; UTC 2026-09-15.
- Capture application: `1d29b966a2bdf41bb618ff5d29109b97823562af` (clean before the run),
  Node 24.18.0, built with `npm run build`; real `src/server.ts` entrypoint at local
  port 18082, using the real GitHub publisher. Chromium used the Pixel 7 viewport;
  this was not a physical phone. No API or GitHub responses were stubbed.
- Authentication: existing GitHub CLI credentials read through a subprocess pipe
  and passed to the application in memory. No credential values were printed or
  persisted. A dedicated production publishing token remains pending.
- Fixture: **TEMPORARY REHEARSAL Iteration 002 2026-09-15**, anonymous attribution,
  explicitly temporary synthetic Context/Problem/Solution. The generated JPEG
  shows a pink square, right-pointing arrow and pink circle, with visible
  `TEMPORARY REHEARSAL 002` and `SYNTHETIC TEST — NO PARTICIPANT DATA` labels.
  It contains no participant data and was generated deterministically with Sharp,
  without a model. Operator fixture/probe files were held in temporary host
  storage; application uploads and previews remained request/browser memory only.
- Source metadata was verified by decoding the JPEG's 404-byte EXIF block and its
  TIFF GPS IFD: Artist `SYNTHETIC EXIF TEST Iteration 002`, ImageDescription
  `Temporary rehearsal metadata must be stripped`, latitude reference `N`, longitude
  reference `E`, and both coordinates `0/1 0/1 0/1` (synthetic zero coordinates).
  The source was 51,083 bytes, 960 × 640 pixels. Its SHA-256 was
  `bb9de70a3ebfa443ee33ceb7e62253a60ab7fe83213cf7a71d18bacd1d38bdfe`.
- Browser flow: entered the four fields and anonymous attribution; selected the
  synthetic JPEG using the real file input; `/api/avatars/previews` returned HTTP
  200. Selected **Gently cleaned**, entered the alt text below, and opened review.
  The source, review screenshot and committed image were visually inspected: the
  labels, shapes, arrow and full frame remained intact. The review image's alt
  attribute matched the entered text exactly:

  > Synthetic rehearsal diagram: a pink square points right to a pink circle beneath TEMPORARY REHEARSAL 002.

- Byte identity: the normalized original preview had SHA-256
  `04546ce94861bf1194ba58cca8ea1f25da3f0c73c9f181147ef7ea873d2d6ae3`.
  The distinct cleaned preview, review image, outgoing avatar file, committed
  image and downloaded Pages image all had SHA-256
  `386df65c41c90e6955aca1c79cf2d7e6cda399673e446a3da01390f1f8a1295d`.
  A browser fetch observer inspected the real outgoing FormData before forwarding
  it unchanged: exactly one file, `avatar.webp`, MIME `image/webp`, containing the
  cleaned bytes. Neither the source JPEG nor the unselected original was sent to
  `/api/patterns`. The API returned HTTP 201 at 01:38:42 UTC; the result link matched
  the returned public URL and the browser-local draft was cleared.
- Publication: [handbook commit 48abd5fbc5961dba3f79ba7e14a37f8122e6e8be](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/commit/48abd5fbc5961dba3f79ba7e14a37f8122e6e8be),
  directly on `main`, sole parent `aaa188cb7d7ee97b4da19946f476bf3bf3314cea`.
  Capture UUID: `01899675-2321-4aa6-b1b1-8ff3431c4a09`.
  GitHub's commit API confirmed exactly three added files in the atomic commit:
  `content/patterns/temporary-rehearsal-iteration-002-2026-09-15/index.md`,
  the same bundle's `avatar.webp`, and
  `.workshop-captures/a4af69f5b6959bb14cb96a15455c857b25913818bda4a61c88c64889b1d6120f.json`.
  The Markdown contained every reviewed field and the exact alt text. The receipt
  contained only `{"slug":"temporary-rehearsal-iteration-002-2026-09-15"}`.
- Committed-image inspection at 01:38:45 UTC: fetched the image from GitHub at the
  immutable publication SHA, decoded it with Sharp and parsed its RIFF chunks.
  It is a 100,064-byte, 960 × 640 lossless WebP with only a `VP8L` pixel-data chunk.
  No `EXIF`, `XMP ` or `ICCP` chunks exist; decoded EXIF, XMP, ICC, IPTC and orientation
  fields are absent. Its Git blob is `8c1c27a227bbbc71205f9bca49073f8593937cf3`.
  This proves the actual committed bytes contain no EXIF/GPS metadata, not merely
  that the preview omitted it. The three-file diff excludes raw or unselected media.
- Deployment: [Publish handbook run 34918089948](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/actions/runs/34918089948)
  used the exact publication SHA. Build and deploy succeeded; deploy finished at
  01:39:05 UTC.
- Rendered verification at 01:39:53 UTC: the [temporary page](https://mattwynne.github.io/explore-ddd-anti-authoritarian-team-practices-workshop/patterns/temporary-rehearsal-iteration-002-2026-09-15/)
  and image returned HTTP 200. Chromium verified the title, all body fields,
  Anonymous attribution, exact detail-image alt text, successful image decoding
  and 960 × 640 natural dimensions. The homepage returned HTTP 200; the catalogue
  card displayed the same image bytes and its link navigated to the correct page.
  The catalogue image uses the existing template's decorative `alt=""` inside its
  text-labelled link; the reviewed descriptive alt is on the detail image.
  Rendered detail and catalogue screenshots were visually inspected.
- Cleanup: [handbook commit f107398a4fb317404b93c05b3482fb6509cb7f26](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/commit/f107398a4fb317404b93c05b3482fb6509cb7f26)
  was pushed directly to `main` as a normal cleanup commit, with the publication
  SHA as its sole parent. GitHub's commit API confirmed it removed exactly the
  temporary `index.md` and `avatar.webp`. The receipt was retained and its contents
  verified at the cleanup SHA. GitHub's comparison against the pre-rehearsal parent
  confirmed that this receipt is the only remaining change.
- Cleanup deployment: [Publish handbook run 34918181638](https://github.com/mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop/actions/runs/34918181638)
  used the exact cleanup SHA. Build and deploy succeeded; deploy finished at
  01:40:32 UTC. At 01:40:41 UTC a fresh Chromium context observed HTTP 404 for both
  the removed page and avatar, HTTP 200 for the homepage, and no temporary title
  or card link there. The receipt's Pages URL also returned HTTP 404, confirming
  it is non-rendered. The temporary page URL above is intentionally removed.
- Checks: `npm run check` passed the TypeScript build and all 43 tests;
  `npm run test:browser` passed all 21 tests;
  `HUGO_BIN=/tmp/hugo-007/hugo npm run check:hugo` passed with Hugo extended 0.150.0
  (four HTML pages, 18 local links/assets). Existing section/taxonomy layout
  warnings remain as documented below. No application defect was exposed, so no
  implementation fix or new regression test was needed. The one-off probe was
  corrected for Playwright's unavailable multipart `postDataBuffer` and for the
  catalogue's existing decorative alt convention; neither required product changes.

This completes Iteration 002's local-app-to-live-GitHub/Pages avatar validation
only. It does not claim Google Cloud deployment, a live model, physical camera or
photo-library/HEIC validation, live simultaneous submissions or interrupted-response
retry testing. Retaining the receipt preserves the existing retry-safety mechanism;
no live retry was attempted. Physical iPhone Safari and Android Chrome checks and
deployed-application validation remain pending. Iteration 005's broader gates are
unchanged; this run did not review real workshop drawings or start another iteration.

## Iteration 003 live photo interpretation attempt — 2026-09-15

**Result: blocked on OpenRouter authentication.** The actual local browser/API
photo flow reached OpenRouter, which returned **401, `User not found.`** for the
configured default `google/gemini-2.5-flash`. Live output quality and successful
suggestion application could not be validated. Real failure handling, manual editing,
reload recovery and review passed. Iteration 003 remains **Implemented locally**;
the workshop decision remains **NO-GO**.

- Operator: Codex on Matt's host at the user's direction; UTC 2026-09-15.
  Application revision `aa759f2`, initially clean on `main`; Node 24.18.0,
  `npm run build`, actual `dist/src/server.js` entrypoint on port 18083.
  Chromium used the Pixel 7 viewport, not a physical phone. The browser, multipart
  API, image normalization and OpenRouter HTTP requests were real, without stubs.
  The publisher had an inert placeholder credential; no publishing was attempted.
- Credential handling: the supplied host credential file was read directly into an
  in-memory process environment variable and inherited by the local app. No key
  value was printed, passed in command arguments, written to artifacts or committed.
  A temporary fetch observer forwarded requests unchanged and recorded only
  allowlisted status/model/timing/usage metadata. It checked the known provider
  error text by equality; it did not log raw provider errors or request headers.
- Fixture: built-in imagegen produced a clearly labelled **SYNTHETIC TEST -
  ITERATION 003** handwritten card on a table, with mild perspective and uneven
  lighting. Visual inspection confirmed these exact field contents:

  | Field | Synthetic handwriting |
  | --- | --- |
  | Name | Pass the pen |
  | Context | A team is mapping a tricky workflow together. |
  | Problem | One loud voice holds the pen and quieter ideas get lost. |
  | Solution | Rotate the pen after each idea. Invite each person to add or pass. |

  The PNG is 1536 × 1024, 2,525,062 bytes, SHA-256
  `9a73bcbe872b92e7fb4d7961e791e3009d02ea03dd8b5936946bb7c0dae76481`.
  Running the application's normalization pipeline on those bytes produced a
  158,916-byte WebP, SHA-256
  `107d745fca75d0907b06d9ea686ca98a117287dedd956e590bdb32ef9c829aed`.
  This generated handwriting is a synthetic fixture, not evidence from real cards.
- Four browser attempts returned app HTTP 502. The first two probes stopped at
  their success assertion before retaining detailed telemetry; the last two
  explicitly observed provider HTTP 401. No successful inference was observed.
  The final run completed at **01:46:58.327 UTC**: provider request/response plus
  observer JSON parsing **179 ms**, app request log **457 ms**, browser click to
  parsed API response **505 ms**. The preceding instrumented attempt measured
  165 / 369 / 409 ms respectively. These are authentication-failure latencies,
  not model inference timings. No returned model/provider ID, generation ID,
  token usage or cost was supplied. OpenRouter cost is **unobservable**, not
  asserted to be zero; fixture generation cost was also unavailable.
- Final response: HTTP 502, body exactly
  `{"error":"Photo interpretation failed. Try again or enter the fields manually."}`.
  Headers included `Cache-Control: no-store`,
  `Content-Type: application/json; charset=utf-8`, `Content-Length: 80`,
  `ETag: W/"50-zjSiYM0k8p8RtuKRZFSIS+0Mpk4"`, and
  `X-Request-ID: 8c3a6a39-057e-4aca-94c4-9780308d57bb`.
  There was no `Set-Cookie` header. The provider error and credential did not
  appear in the participant response; the matching app log contained only the
  existing request ID/method/route/status/duration allowlist. The ETag accompanies
  a no-store response; successful-response headers remain unverified live.
- Manual fallback: all four pre-entered fields remained unchanged after failure.
  The operator edited Solution to `Manual fallback remains editable. SYNTHETIC TEST 003`,
  reloaded, and verified the edit persisted and the photo input became empty.
  Review showed the exact edited text and Anonymous attribution, with the publish
  button enabled. A screenshot was visually inspected. The browser recorded **zero
  `/api/patterns` requests**; nothing synthetic was published to the handbook.
  Actual manual publication following this live error was deliberately not tested.
- Suggestion behavior: live output was absent, so transcription fidelity, missing-field
  restraint, per-field/apply-all application and editing of actual model output
  remain pending. Four existing photo-only Chromium tests passed with synthetic
  provider responses: group/individual/anonymous flows and network-failure fallback.
  They verified no automatic overwrite, per-field isolation, explicit apply-all,
  editing, reload, review and publication to an in-memory publisher only.
- Media persistence: `strace -f` followed the app and its threads for file opens,
  creates, renames, unlinks and directory creation; no write-capable file opens or
  filesystem mutations occurred during the final run. The trace excluded write
  payloads, network payloads and process environment contents. Code review confirms
  `multer.memoryStorage()` and Sharp buffer-to-buffer processing; the photo route
  neither writes files nor invokes the publisher. Browser local storage held only
  draft text/options/ID, session storage was empty, and Cache Storage and IndexedDB
  were empty. The selected source file remained in page memory until reload; this
  is not immediate browser-memory erasure. No source image is tracked in Git.
  Provider-side retention is outside this app's control and was not verified.
- Operator-only artifacts are in ignored `artifacts/iteration-003/`: the synthetic
  fixture, exact built-in generation prompt (`fixture-prompt.txt`), sanitized
  `evidence.json`, review screenshot and filesystem trace.
  These are explicit operator evidence files, not app-persisted uploads, and are
  excluded from the commit. The temporary probe/observer are under
  `/tmp/iteration-003-live/`; all app/browser processes were stopped.
- Validation: TypeScript build passed; the final anchored photo/OpenRouter test
  selection passed **7 tests**; the photo-only browser selection passed **4 tests**.
  An earlier overly broad test-name filter accidentally also ran the existing
  synthetic 126-second WAV rejection test; it passed without any provider call.
  No live speech, transcription, recording or microphone flow was exercised.
  The full suite was not run to keep remaining checks within this iteration.
  No application defect was demonstrated, so no implementation or regression-test
  change was made. An invalid-model failure was not attempted after the real
  authentication failure already supplied a safe provider-failure case.

**Remaining gates:** provide a working OpenRouter credential and rerun the default
model success flow, recording output, application/edit controls, successful-response
headers, inference timing and any reported usage/cost. Production OpenRouter
configuration, real workshop cards (including varied lighting/orientation and
missing fields), deployed-app validation and physical iPhone Safari/Android Chrome
camera/library checks remain pending. No cloud resources were deployed and no
other iteration was started.

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
| GitHub publishing and Pages | Real token, simultaneous submissions, retry after interrupted response, final page/selected image | Partial: Iterations 001/002 local-app typed and selected-avatar publication, metadata removal, Pages rendering and cleanup verified above; dedicated publishing token, deployed integration and live concurrency/interrupted retry remain pending |
| OpenRouter | Cards, real recordings, configured model IDs, credits, latency, failure fallback | Partial: Iteration 003 live photo authentication failure/manual review verified; supplied credential returned 401. Successful vision output, working production credential, real cards and recordings remain pending |
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
