# Iteration 006: Project live capture progress

- **Status:** Implemented locally and audited; deployed and physical room validation pending
- **Depends on:** Iteration 001; enriched by later capture modes

## Outcome

The room can watch provisional pattern names appear and move through drafting, publishing, and published states without complicating participant capture.

## Scope

- Provide a read-only, projection-friendly dashboard.
- Create an ephemeral draft UUID when capture starts.
- Send debounced provisional-name updates from the participant browser.
- Broadcast complete dashboard state using server-sent events.
- Show drafting, publishing, published, and recoverable failure states.
- Link published cards to their handbook pages.
- Exclude field contents, media, transcripts, API errors, and anonymous contributor details.
- Run one application instance during the workshop to keep ephemeral state coherent.

## Acceptance criteria

- Provisional names update without refreshing the dashboard.
- Submission and publication states are distinguishable.
- Published cards link to reachable Hugo pages.
- No temporary media or sensitive diagnostics appear.
- Fifty active participants and one hundred cards remain responsive.
- A server restart may clear the room view; participant form drafts remain in their browsers.

## Verification

- API lifecycle and server-sent-event tests.
- Multi-client browser test.
- Privacy checks for field content, media, errors, and attribution.
- Projector-sized and mobile display checks.
- Lightweight load test at workshop scale.

## Local implementation audit — 2026-09-15

Audited from verified baseline `9256f17`. Only Iteration 006 was changed. No cloud
credentials, OpenRouter calls, physical devices, durable board storage or
multi-instance coordination were required or introduced.

| Scope / acceptance item | Implementation and credential-independent evidence | Remaining gate |
| --- | --- | --- |
| Read-only projection; 100 readable cards | Twelve cards per page, Previous/Next controls, total/published counts, stable card nodes; browser checks all 100 cards are reachable across nine pages, 1920×1080 fit and 320px overflow/axe | Physical room/projector, distance, contrast and manual accessibility |
| Ephemeral UUID at capture start; restart recovery | Bounded board allocates UUID; browser saves text/ID locally; missing entry is recreated with the same UUID, preserving Git receipt retry identity. API and serialized-name/reload browser tests | Deployed process restart and physical browser storage behaviour |
| Debounced live provisional names | Name-only 250ms debounce; serialized updates coalesce latest text, clear to Untitled, retry network/404 failures and reconnect; two-browser tests | Real room Wi-Fi |
| Complete SSE state and reconnect | Every event is a full allowlisted snapshot; fresh connection ignores obsolete event history; disconnect badge retains last view until a snapshot arrives; real HTTP/browser reconnect tests | Cloud Run 300-second request timeout/reconnect and revision routing |
| Drafting, submitting, publishing, failure/retry | Drafting → Saving to Git → Saved/waiting for Pages → Published. Failed Git submission can retry; concurrent same-ID requests return 409 without regressing state. Unreachable Pages becomes Saved/Pages delayed after bounded probes; participant result has a recheck action | Real deployed GitHub/Pages latency and failures |
| Published links reach Hugo pages | Production probes publisher-produced HTTPS URL with HEAD, requires HTTP 200, refuses redirects, bounds each call to five seconds. Dashboard exposes link only after success. Probe/API tests cover 200/202/redirect/404/503; pinned Hugo build checks generated links | Deployed integration. HTTP reachability is not verification of exact deployment SHA or rendered content |
| Published state is monotonic | Late names, failed retries and stale probe results cannot regress confirmed cards; reviewed names freeze during publishing and after commit; deterministic unit/API tests | None locally; state is ephemeral across restarts |
| Exclude fields/media/transcripts/diagnostics/anonymous identity | Board snapshots contain only ID, bounded name, stage, timestamp and confirmed URL. API updates are allowlisted; HTTP load tests assert sensitive fields and logs absent; hostile-title browser test and HTTPS link checks | Public names remain intentionally visible; no promise of private names or forensic memory erasure |
| 50 active participants / 100 patterns responsive | Real HTTP load uses 50 clients, 100 commits, five live SSE readers, deterministic Pages probes, full convergence/reconnect and 15-second budget | Real quotas, Cloud Run CPU/memory, room Wi-Fi |
| Slow/disconnected subscribers; one-workshop memory | Hard cap 200 cards and 60 SSE subscribers; titles 120 code units, URLs 2048; queue limited to 1 MiB per reader before disconnect; heartbeats/listeners cleaned on close/error; capacity/snapshot isolation/slow-reader tests | Operator starts one process for one workshop; full board rejects new allocation with 503 and retains existing cards |

### Explicit operational constraints

- One process, one workshop. No board database, durable history, cross-instance
  coordination, TTL eviction or automatic workshop rollover. Restart clears room
  history and pending checks, while browser-local text and capture UUID survive.
  Existing Git receipts remain the publisher's retry authority; they were not changed.
- At most five Pages requests per five-second polling tick; twelve attempts per
  pending card, round-robin across the bounded board. A larger backlog extends
  elapsed confirmation time. Delayed entries retain only their URL/attempt count
  so recheck can resume without another Git commit. Reachability is a point-in-time
  check; later removal of a page does not regress a Published card.
- Production explicitly wires the network probe; test app factories use injected
  probes or remain waiting for Pages, never silently treating a stub commit as live.
- Existing deployment config uses one warm instance, max one and concurrency 80.
  This audit adds always-allocated CPU for checks after the submission response.
  It does not deploy anything. Avoid revision rollouts during the workshop: even
  a scale cap does not coordinate old/new revision memory. Long-lived SSE readers
  consume request slots; the tested setup has five readers, not fifty dashboards.
- Mobile uses the same paged, scrollable board. EventSource-capable browsers are
  required for live updates; unsupported browsers get an explicit message.

### Verification result

See [Iteration 006 rehearsal evidence](../rehearsal.md#iteration-006-local-implementation-audit--2026-09-15)
for final command results. Single-instance deployed Cloud Run and physical
room/projector/phone validation remain pending. Status remains **Implemented locally**.
