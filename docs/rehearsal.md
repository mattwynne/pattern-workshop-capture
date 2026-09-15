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

Initial pre-hardening local validation: `npm run check` passed 43 tests; `npm run test:browser`
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
  EventSource retries automatically. Iteration 006 now caps the board at 200 cards
  and 60 subscribers, with no durable history or automatic workshop rollover.
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
need reselection. After a server restart, reload restores text into a recreated room entry with the
same capture UUID. Retry an ambiguous publication with that UUID so the existing
Git receipt resolves to the original page. The room history itself is not restored.

## Iteration 004 local implementation audit — 2026-09-15

**Result:** Locally implementable Iteration 004 gaps fixed and audited. Status stays
**Implemented locally**; workshop decision stays **NO-GO**. No live OpenRouter call,
credential lookup, real microphone, physical phone, noisy room or live publication
was required or attempted. Other iterations' delivery gates are unchanged.

- Scope: read the Iteration 004 plan, ledger, rehearsal record, browser recording and
  suggestion code, adapter, upload handling and all existing tests. The [plan audit
  matrix](plans/004-transcribe-and-use-a-spoken-explanation.md#local-implementation-audit--2026-09-15)
  maps each planned behaviour/criterion to implementation, evidence and pending gates.
- Fixed missing cancel, permission-request races, stale recording/result reuse,
  recorder start/error/empty/track-end cases, hidden-page/pagehide/review cleanup,
  client request deadlines, server disconnect cancellation, ambiguous validation
  errors and synthesis failure losing an otherwise usable transcript. Explicit
  per-field and apply-all actions are allowlisted; applying all skips suggestions
  already consumed so it preserves subsequent manual edits to those fields.
- Replaced permissive metadata-only duration checking (including its five-second
  grace and unreadable/unknown-duration bypass) with bounded FFmpeg decoding through
  stdin/stdout. Accepted container data becomes 16 kHz mono PCM/WAV; decoded samples
  enforce 120 seconds, with a 15-second processing deadline and 16 MiB upload bound.
  Multipart audio accepts one file and no extra fields. Raw metadata and participant
  filenames are not sent to the provider. Browser MIME-less/generic file uploads
  can be recognised from container signatures; unsupported types fail clearly.
- Runtime dependency: FFmpeg **6.1.1** installed and exercised on this host. Dockerfile
  installs FFmpeg in the runtime image; CI installs it before tests. The obsolete
  music-metadata dependency was removed. Docker is unavailable on this host, so
  image build/execution was pending at that audit (see the final 007 audit below); deployed FFmpeg behaviour remains pending. Local binary
  tests do not prove the Alpine image or Cloud Run environment works.
- Privacy evidence is deterministic test assertions plus code inspection: Multer
  memory storage; decoder pipes and pipe-only protocol allowlist; no media filesystem
  paths, audio persistence calls or publisher calls in interpretation; redacted logs;
  no audio/transcript/private filename on the dashboard or in browser draft storage;
  only explicitly applied field text becomes draft/publication content. Request buffer
  references are released after completion; browser selections/chunks/tracks/timers
  are discarded appropriately. This is not a forensic memory-erasure guarantee or a
  new filesystem trace, and cannot establish provider-side retention policy.
- Synthetic coverage includes valid generated WAV, duration-less WebM/Opus,
  fragmented MP4/AAC, Ogg/Opus, AAC and MP3; malformed/disguised/empty/oversized inputs;
  exactly 120-second WAV acceptance and over-limit WAV/WebM/MP4 rejection; API extra
  field/file rejection; configurable model/payload handling; 429/503, malformed,
  empty and wrong-type responses; actual abort-signal deadlines and disconnects;
  transcript retained when synthesis fails. Provider responses are doubles.
- Browser coverage uses Chromium with a mobile viewport and deterministic recorder
  doubles for MP4/WebM negotiation, permission/cancel races, final stop chunks,
  timer cap, empty/start/error/track-end states, page lifecycle/review cleanup,
  oversized file fallback, timeout/stale response handling, explicit application,
  preservation of later edits, and manual publication to a stub publisher. The
  existing real Chromium MediaRecorder test uses an oscillator and real multipart
  API/FFmpeg/adapter with a stub provider. This is not an iPhone/Android recording.
- Mobile accessibility checks cover status/alert output, a non-announcing elapsed
  timer, keyboard controls, transcript labelling, 320px overflow and axe WCAG A/AA.
  Manual VoiceOver/TalkBack, zoom/touch and noisy-room usability remain pending.

Validation on the final implementation:

- `npm run check`: TypeScript build and **59 tests passed**.
- `npm run test:browser`: **35 tests passed**, including **14** dedicated audio
  regression cases plus all existing browser checks.
- `HUGO_BIN=/tmp/hugo-007/hugo npm run check:hugo`: passed, four HTML pages and
  18 local links/assets; existing section/taxonomy layout warnings unchanged.
- `node --check public/audio.js`, `node --check public/capture.js` and
  `git diff --check`: passed. No audio fixture binaries are tracked; fixtures are
  generated in memory. No application credentials were used by these checks.

**Remaining gates / blockers:** working OpenRouter credential and real transcription
endpoint/model validation (the earlier supplied credential returned 401 in Iteration
003); real recordings and synthesis quality/latency; physical iPhone Safari and
Android Chrome microphone/library formats and permissions; room noise; real phone
call/lock/background/network interruptions; VoiceOver/TalkBack and manual mobile
accessibility; runtime image/deployed decoder verification. None blocks the requested
local audit, commit or push. No live/model/device gate is marked passed by these tests.

## Iteration 006 local implementation audit — 2026-09-15

**Result:** Iteration 006 is implemented and audited locally. Status remains
**Implemented locally**, and workshop decision remains **NO-GO**. Started at verified
`9256f17` on clean `main`; no other iteration was implemented or re-audited. Tests
use local HTTP servers, synthetic participant data and injected publishers/Pages
responses. No Google Cloud, OpenRouter, live handbook writes or physical devices
were required. Pushing the capture repository is separate from these local tests.

The [scope and acceptance matrix](plans/006-project-live-capture-progress.md#local-implementation-audit--2026-09-15)
maps every item to evidence and pending gates.

### Changes and findings

- Fixed premature Published status at Git commit. The API's HTTP 201 continues to
  acknowledge the Git commit; the board waits for a successful public-page HEAD
  request before displaying Published and a link. A 404, network failure, redirect
  or timeout cannot confirm publication. This verifies reachability at that moment,
  not exact deployment SHA/content or permanent future availability.
- Added distinct saving/waiting/delayed states. Concurrent retries cannot regress
  an active save; late name edits freeze once saving starts; committed cards cannot
  regress to failed/drafting; confirmed cards remain published. Pages checks have
  five-second network deadlines, five requests per five-second tick and twelve
  attempts per card. Recheck resumes delayed checks without republishing to Git.
  No sensitive provider error or commit diagnostics enter the board.
- Browser name updates now serialize, debounce only name edits, coalesce newer
  text, clear empty names, retry failures and recover on reconnect. After loss of
  ephemeral server state, browser recovery reuses the saved UUID, preserving the
  existing publisher receipt's retry identity. Text remains browser-local.
- Board snapshots are allowlisted, copied and bounded. Capacity is 200 cards,
  120-code-unit names, 2048-character HTTPS URLs and 60 subscribers. Allocation
  beyond capacity returns 503 without evicting published history. Each subscriber
  has a one-MiB write-queue ceiling; close/error/overflow removes the listener and
  heartbeat. This bounds board state, not total process memory used by concurrent
  media requests. No durable board storage or multi-instance coordination exists.
- Twelve cards per projection page keeps 100 cards reachable through nine pages.
  Counts and manual navigation avoid squeezing 100 titles onto one screen or
  moving focused controls automatically. Existing card nodes preserve link focus
  through updates. Mobile falls back to a scrollable single column with the same
  navigation. EventSource is required for live updates; unsupported browsers show
  an explicit message. Disconnection retains the last snapshot with a reconnect
  notice; a new full snapshot replaces obsolete state.
- Existing one-warm-instance/max-one/concurrency-80 deployment settings remain;
  always-allocated CPU was added for background Pages checks after a response.
  This configuration was inspected, not deployed. A revision rollout can still
  split in-memory boards; avoid mid-workshop deployments. SSE readers consume
  Cloud Run request slots. Use one process for one workshop and restart deliberately
  between workshops; no automatic expiry/rollover was added.

### Validation

- `npm run check`: TypeScript build and **64 unit/API tests passed**.
- `npm run test:browser`: **38 Chromium browser tests passed**.
- After adding screenshots and the explicit recheck-route assertion, the dedicated
  dashboard browser suite (**3 tests**) and DraftBoard/API suite (**5 tests**) passed.
- Load test: **50 simultaneous HTTP clients, 100 patterns and five SSE readers**;
  all converge to confirmed full snapshots, including a reconnected reader. Private
  bodies, transcripts, attribution, headers and query markers are absent from board
  snapshots/logs. The local 15-second completion budget passed. Git and Pages are
  deterministic doubles, so these timings exclude external latency and quotas.
- An initial load run compressed twenty logical Pages ticks without allowing socket
  I/O and triggered the bounded slow-reader disconnect. The final deterministic
  rehearsal yields one event-loop turn between those ticks. Cleanup now aborts
  readers before disposing the board, including on assertion failure. Normal Node
  write backpressure is tolerated up to the byte ceiling; it is not itself a reason
  to disconnect a healthy reader. Slow/closed/error/capacity cases have separate tests.
- Browser evidence includes independent capture/dashboard pages, empty-name update,
  offline recovery, serialized stale-name/404 recovery, saved capture-ID preservation,
  Git-versus-Pages status/link gating, full reconnect, escaped hostile names, stable
  keyboard focus, 100-pattern pagination and axe WCAG A/AA at 320px. Screenshots of
  the 1920×1080 projection and 320px mobile board were visually inspected; no title
  clipping or horizontal overflow was observed for the synthetic fixtures. Generated
  screenshots remain under ignored `test-results/`, not committed participant media.
- `HUGO_BIN=/tmp/hugo-007/hugo npm run check:hugo`: passed, four HTML pages and
  18 local links/assets against pinned Hugo/handbook fixtures. Existing missing
  section/taxonomy layout warnings remain. This is not proof of live Pages deployment.
- `node --check public/dashboard.js`, `node --check public/capture.js` and
  `git diff --check`: passed. Full regression suites were run because shared capture
  and API paths changed; their execution does not reopen other iteration audits.

**Remaining gates / blockers:** deployed single-instance Cloud Run behaviour,
background CPU and request-timeout/reconnect behaviour, real Pages integration,
real room Wi-Fi/load and physical phone/projector readability, room-distance
contrast and manual keyboard/screen-reader checks. None blocks the local Iteration
006 audit, commit or push. No deployed or physical gate is marked passed.

## Iteration 007 final credential-independent audit — 2026-09-15

**Result:** Integrated release engineering hardening completed locally from clean
`069918e` on main, including the recent 004/006 changes. Iteration 007 remains
**Implemented locally** and the workshop remains **NO-GO**. No other iteration is
started or marked Done. No cloud provisioning, OpenRouter calls, handbook
publication, physical-device tests or printed-QR scans were performed in this audit.

### Changes and audit coverage

- Fixed the credential-gated Docker gap: every PR/main push builds the production
  image and runs its exact CMD as non-root on a read-only filesystem with no
  external network and explicitly non-secret dummy GitHub/OpenRouter configuration.
  The smoke test checks fresh production-only dependencies, actual FFmpeg decoding,
  Sharp WebP normalization, non-default PORT, health, static paths and redacted API
  responses/log allowlists. Missing publishing configuration must fail startup.
- The tested Docker image is saved as a one-day CI artifact, loaded for deployment
  without rebuilding, pushed and deployed by digest. Runtime contains only compiled
  application code, public assets and production dependencies; tests/dev modules,
  credentials and operator artifacts are excluded. Docker context is allowlisted.
- Pinned action revisions; added checksum-verified actionlint and shell syntax checks;
  restricted deployment and WIF to main/non-PR runs, moved OIDC permission into the
  deploy job, and made configuration failures explicit. Bootstrap now updates old
  WIF conditions, enables required IAM APIs, grants per-secret runtime access and
  writes the deployment-enabling project variable last. It was inspected and linted,
  not executed against cloud resources. Existing older project-wide grants, if any,
  require operator review; rerunning does not remove pre-existing grants.
- Startup validates port and runnable FFmpeg without external calls or raw config
  logging. Health bypasses JSON parsing and returns uncached local liveness only.
  Existing request logging/provider error redaction and public/licensing/AI notices
  were reviewed; regression checks cover private body/header/query markers and
  validation-like upstream exceptions. QR errors now suppress invalid input values.
- Numeric secret versions make rollback selection reproducible. Model overrides
  survive CI deployments. The runbook records known-good revision/digest/config,
  explicit rollback/return-to-latest traffic, credential rotation, model switching,
  final stable URL QR generation and the [tomorrow checklist](deployment.md#tomorrow-checklist).
  Per-revision caps do not guarantee one board during rollout; avoid mid-session
  deployments. Rollback does not undo published Git content or restore room history.

### Exact local validation

- `npm ci`: clean install, audit reported zero vulnerabilities.
- `npm run check`: TypeScript build and **68 unit/API tests passed** (including
  health/parser independence, safe startup failures, QR round-trip/rejection,
  50-client/100-pattern load, Git races/ambiguous retry and media/provider faults).
- `npm run test:browser`: **38 Chromium tests passed**. These use emulated mobile
  viewports, synthetic media/providers and a local publisher, not physical phones.
- `HUGO_BIN=/tmp/hugo-007/hugo npm run check:hugo`: pinned Hugo extended 0.150.0,
  **four HTML pages / 18 local links/assets passed**. Existing non-linked
  section/taxonomy layout warnings remain; no live handbook content was changed.
- `npm run check:workflow`: actionlint **1.7.12**, including ShellCheck **0.11.0**
  when added to PATH, passed. ShellCheck on all `scripts/*.sh`, Bash syntax checks,
  `node --check` on capture/dashboard/smoke scripts and `git diff --check` passed.
- Fresh temporary production layout: copied only package manifests, `dist/src` and
  `public`; `npm ci --omit=dev` installed Express 5.2.1, Multer 2.4.0 and Sharp 0.35.4.
  `npm ls --omit=dev` passed; `npm start` and the shared runtime smoke passed with
  dummy config on Node 24.18.0/host FFmpeg 6.1.1. No dev package was resolvable;
  decoder, native WebP processing, health and all four static paths worked. Temporary
  files/processes were removed. This host check does not prove Alpine compatibility.
  The initial smoke fixture used a streaming WAV with unknown length, rejected by
  the strict decoder; the smoke now builds a finite canonical WAV from generated PCM.
- Docker is unavailable on this host. **Exact-main CI Docker build/execution is
  awaiting the implementation push**; record the run below after objective validation.
  No deployed Cloud Run runtime result is inferred from either host or Docker checks.

### Remaining gates / blockers

All entries in [Facilitated release gates](#facilitated-release-gates-none-fully-complete)
retain their pending/partial status: Google credentials/billing/WIF/Secret Manager
and deployed health; dedicated publishing credential and deployed GitHub/Pages
concurrency/interrupted retry; working OpenRouter credential (prior key returned
401), credits and successful real-model output; real cards/drawings/noisy recordings;
physical iPhone/Android/HEIC and accessibility; room Wi-Fi/projector/load; final URL,
actual printed QR scans; explicit facilitator go/no-go. Local automation cannot
close these gates. No credential-independent application blocker is known; CI must
still confirm the production Docker result before this audit is considered validated.
