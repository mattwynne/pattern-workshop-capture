# Delivery plan ledger

This ledger is the source of truth for delivery status. Update it whenever a plan moves state or its remaining validation changes.

## Status meanings

- **Implemented locally** — the feature exists on `main` and automated checks pass, but production or physical-device validation remains.
- **In progress** — implementation has started but the complete planned behaviour is not yet on `main`.
- **Planned** — implementation has not started.
- **Done** — deployed and all workshop-critical acceptance checks have passed.

## Current status

| Iteration | Plan | Status | Implemented | Still to do |
| --- | --- | --- | --- | --- |
| 001 | [Publish a reviewed typed pattern](001-deploy-and-validate-the-mobile-ai-spike.md) | **Implemented locally** | Public Hugo handbook; mobile form; browser-local draft recovery; review; attribution; direct GitHub publishing; lifecycle API; real typed capture-to-Pages publication and cleanup verified ([evidence](../rehearsal.md#iteration-001-live-typed-publication--2026-09-15)) | Bootstrap Google Cloud; deploy and validate deployed app; test physical phones (branch races covered locally in 007) |
| 002 | [Publish a participant-supplied pattern avatar](002-publish-a-reviewed-typed-pattern.md) | **Implemented locally** | Camera/library input; required alt text; bounded metadata-free WebP; atomic Markdown-and-image Git commit; real local-app-to-GitHub/Pages cleaned-avatar publication, metadata removal, rendering and cleanup verified ([evidence](../rehearsal.md#iteration-002-live-avatar-publication--2026-09-15)) | Deployed-application validation; physical iPhone/Android camera/library and HEIC checks (Hugo and malformed/oversized upload checks automated) |
| 003 | [Interpret temporary card photographs](003-interpret-and-publish-card-photos.md) | **Implemented locally** | Temporary request-memory processing; image normalization; configurable OpenRouter vision call; structured suggestions; per-field/apply-all controls; live authentication-failure/manual-review and no-app-media-persistence checks ([evidence](../rehearsal.md#iteration-003-live-photo-interpretation-attempt--2026-09-15)) | Working OpenRouter credential (supplied key returned 401); successful default-model synthetic validation; production configuration; real workshop cards; physical mobile camera checks |
| 004 | [Transcribe a temporary spoken explanation](004-transcribe-and-use-a-spoken-explanation.md) | **Implemented locally** | Audited recorder stop/cancel/permission lifecycle; MIME/file fallback; server byte and decoded-duration enforcement; metadata-free request-memory transcription; transcript partial fallback; explicit suggestions and cleanup; deterministic unit/API/mobile browser regressions ([evidence](../rehearsal.md#iteration-004-local-implementation-audit--2026-09-15)) | Real OpenRouter model/credential validation; deployed FFmpeg runtime; physical iPhone/Android recording/library/permissions, room noise, actual interruptions and VoiceOver/TalkBack |
| 005 | [Offer gentle diagram cleanup](005-publish-original-and-cleaned-diagrams.md) | **Implemented locally** | Original/cleaned comparison API and mobile selection; metadata-free selected-only publishing; failure fallback; synthetic perceptual, API, GitHub bundle, and mobile browser tests | Human review with workshop drawings; physical phones/HEIC; deployed GitHub-to-Pages validation; crop/deskew deferred to preserve marks |
| 006 | [Project live capture progress](006-project-live-capture-progress.md) | **Implemented locally** | Audited live names/reconnect; Git-versus-Pages lifecycle with bounded reachability checks/retry; monotonic publication; paged projection/mobile accessibility; bounded board/subscribers; 50-client/100-pattern load ([evidence](../rehearsal.md#iteration-006-local-implementation-audit--2026-09-15)) | Single-instance deployed Cloud Run/Pages behaviour; physical room/projector/phones, real Wi-Fi load and manual accessibility |
| 007 | [Rehearse and release](007-rehearse-and-release-the-workshop.md) | **Implemented locally** | Browser capture/attribution and accessibility checks; Git race/ambiguous retry receipts; external fault injection; 50-client/100-pattern dashboard rehearsal; pinned Hugo build/link check; redacted logs; reconnect/focus fixes; URL-driven QR generation; operational/rollback guide | Google Cloud/OpenRouter configuration; dedicated publishing token and live GitHub-to-Pages rehearsal; physical iPhone/Android, real models/drawings/noisy audio, room load and manual accessibility; final URL/printed QR scans; facilitator go/no-go. Current decision: NO-GO; see [evidence and gates](../rehearsal.md) |

## Immediate critical path

1. Iteration 007 local checks are complete; release remains blocked on the live gates in [the rehearsal record](../rehearsal.md). Review Iteration 005 cleanup with real workshop drawings; comparison/selection is implemented and automated checks pass.
2. Run `scripts/bootstrap-google-cloud.sh` with the Google project and billing account.
3. Let CI deploy the application and verify `/health`.
4. Complete deployed GitHub publishing gates and OpenRouter model checks. Iterations 001 and 002 typed/avatar publishing from the local app to live Pages passed; see [typed evidence](../rehearsal.md#iteration-001-live-typed-publication--2026-09-15) and [avatar evidence](../rehearsal.md#iteration-002-live-avatar-publication--2026-09-15).
5. Run the physical-device and room-concurrency rehearsal.
6. Mark an iteration **Done** only after its remaining workshop-critical checks pass.
