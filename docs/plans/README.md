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
| 001 | [Publish a reviewed typed pattern](001-deploy-and-validate-the-mobile-ai-spike.md) | **Implemented locally** | Public Hugo handbook; mobile form; browser-local draft recovery; review; attribution; direct GitHub publishing; lifecycle API | Bootstrap Google Cloud; deploy; run a real capture-to-Pages test; test branch races and physical phones |
| 002 | [Publish a participant-supplied pattern avatar](002-publish-a-reviewed-typed-pattern.md) | **Implemented locally** | Camera/library input; required alt text; bounded metadata-free WebP; atomic Markdown-and-image Git commit; handbook rendering | Real GitHub integration test with an avatar; Hugo/device checks; malformed and oversized upload API tests |
| 003 | [Interpret temporary card photographs](003-interpret-and-publish-card-photos.md) | **Implemented locally** | Temporary request-memory processing; image normalization; configurable OpenRouter vision call; structured suggestions; per-field/apply-all controls | Configure production OpenRouter key; validate model output using real workshop cards; mobile camera and error-path tests |
| 004 | [Transcribe a temporary spoken explanation](004-transcribe-and-use-a-spoken-explanation.md) | **Implemented locally** | `MediaRecorder`; MIME negotiation; two-minute browser timer; file fallback; temporary transcription; transcript-to-field suggestions | Validate OpenRouter transcription with real recordings; test iPhone/Android formats, room noise, permissions, interruption, and server-side duration fixtures |
| 005 | [Offer gentle diagram cleanup](005-publish-original-and-cleaned-diagrams.md) | **Implemented locally** | Original/cleaned comparison API and mobile selection; metadata-free selected-only publishing; failure fallback; synthetic perceptual, API, GitHub bundle, and mobile browser tests | Human review with workshop drawings; physical phones/HEIC; deployed GitHub-to-Pages validation; crop/deskew deferred to preserve marks |
| 006 | [Project live capture progress](006-project-live-capture-progress.md) | **Implemented locally** | Projection view; server-sent updates; live provisional names; drafting/publishing/published/failure stages; handbook links | Multi-client/load test; reconnect/privacy checks; verify single-instance Cloud Run behaviour |
| 007 | [Rehearse and release](007-rehearse-and-release-the-workshop.md) | **Planned** | CI checks and push-to-Cloud-Run workflow; keyless Google authentication bootstrap and deployment guide | Configure cloud account/secrets; deploy; end-to-end rehearsal; fault injection; QR code; accessibility/device review; go/no-go decision |

## Immediate critical path

1. Review Iteration 005 cleanup with real workshop drawings; comparison/selection is implemented and automated checks pass.
2. Run `scripts/bootstrap-google-cloud.sh` with the Google project and billing account.
3. Let CI deploy the application and verify `/health`.
4. Exercise actual GitHub publishing and OpenRouter models end to end.
5. Run the physical-device and room-concurrency rehearsal.
6. Mark an iteration **Done** only after its remaining workshop-critical checks pass.
