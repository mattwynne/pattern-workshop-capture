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
| 001 | [Publish a reviewed typed pattern](001-deploy-and-validate-the-mobile-ai-spike.md) | **Implemented locally** | Public Hugo handbook; mobile form; browser-local draft recovery; review; attribution; direct GitHub publishing; lifecycle API | Bootstrap Google Cloud; deploy; run a real capture-to-Pages test; test physical phones (branch races covered locally in 007) |
| 002 | [Publish a participant-supplied pattern avatar](002-publish-a-reviewed-typed-pattern.md) | **Implemented locally** | Camera/library input; required alt text; bounded metadata-free WebP; atomic Markdown-and-image Git commit; handbook rendering | Real GitHub integration test with an avatar; physical-device checks (Hugo and malformed/oversized upload checks now automated) |
| 003 | [Interpret temporary card photographs](003-interpret-and-publish-card-photos.md) | **Implemented locally** | Temporary request-memory processing; image normalization; configurable OpenRouter vision call; structured suggestions; per-field/apply-all controls | Configure production OpenRouter key; validate model output using real workshop cards; physical mobile camera checks (synthetic error paths now automated) |
| 004 | [Transcribe a temporary spoken explanation](004-transcribe-and-use-a-spoken-explanation.md) | **Implemented locally** | `MediaRecorder`; MIME negotiation; two-minute browser timer; file fallback; temporary transcription; transcript-to-field suggestions | Validate OpenRouter transcription with real recordings; test iPhone/Android formats, room noise, permissions and interruption (126-second WAV rejection now automated) |
| 005 | [Offer gentle diagram cleanup](005-publish-original-and-cleaned-diagrams.md) | **Implemented locally** | Original/cleaned comparison API and mobile selection; metadata-free selected-only publishing; failure fallback; synthetic perceptual, API, GitHub bundle, and mobile browser tests | Human review with workshop drawings; physical phones/HEIC; deployed GitHub-to-Pages validation; crop/deskew deferred to preserve marks |
| 006 | [Project live capture progress](006-project-live-capture-progress.md) | **Implemented locally** | Projection view; server-sent updates; live provisional names; drafting/publishing/published/failure stages; handbook links | Verify single-instance Cloud Run behaviour and live room load (50-client/100-pattern, reconnect/privacy tests pass locally) |
| 007 | [Rehearse and release](007-rehearse-and-release-the-workshop.md) | **Implemented locally** | Browser capture/attribution and accessibility checks; Git race/ambiguous retry receipts; external fault injection; 50-client/100-pattern dashboard rehearsal; pinned Hugo build/link check; redacted logs; reconnect/focus fixes; URL-driven QR generation; operational/rollback guide | Google Cloud/OpenRouter configuration; dedicated publishing token and live GitHub-to-Pages rehearsal; physical iPhone/Android, real models/drawings/noisy audio, room load and manual accessibility; final URL/printed QR scans; facilitator go/no-go. Current decision: NO-GO; see [evidence and gates](../rehearsal.md) |

## Immediate critical path

1. Iteration 007 local checks are complete; release remains blocked on the live gates in [the rehearsal record](../rehearsal.md). Review Iteration 005 cleanup with real workshop drawings; comparison/selection is implemented and automated checks pass.
2. Run `scripts/bootstrap-google-cloud.sh` with the Google project and billing account.
3. Let CI deploy the application and verify `/health`.
4. Exercise actual GitHub publishing and OpenRouter models end to end.
5. Run the physical-device and room-concurrency rehearsal.
6. Mark an iteration **Done** only after its remaining workshop-critical checks pass.
