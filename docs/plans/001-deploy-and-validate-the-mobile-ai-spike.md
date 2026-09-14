# Iteration 001: Deploy and validate the mobile AI spike

- **Status:** Planned
- **Depends on:** Architecture ADR

## Outcome

A deployed walking skeleton proves that the proposed stack can accept media from real phones once, process it reliably through OpenRouter, and report progress after browser or server interruptions.

This iteration decides whether to adopt Elixir, Phoenix LiveView, Postgres/Ecto, Oban, and Req. It is evidence for a follow-up implementation-stack ADR, not permission to build a broad framework.

## Demonstration

From an unguessable Fly.io staging URL, a participant can photograph a card, record a short explanation, upload both, and see extracted text and a transcript. Restarting the application or forcing a temporary OpenRouter failure does not require either file to be uploaded again.

## Scope

- Create the smallest deployable Phoenix LiveView application.
- Add Postgres submission/asset records and Oban-backed processing jobs.
- Stage media privately in an S3-compatible object store using direct, signed uploads.
- Add minimal browser JavaScript for `MediaRecorder`, MIME negotiation, and upload progress.
- Call OpenRouter image interpretation and speech-transcription endpoints through an application-owned adapter using Req.
- Keep transcription, vision, and synthesis model or preset identifiers outside application code.
- Persist which model/profile and prompt version produced each interpretation.
- Prove that a model can be changed without a code change and without losing queued work.
- Expose simple per-submission states: uploading, queued, processing, complete, and failed/retrying.
- Deploy to Fly.io with migrations and health checks.
- Record physical-device results and write the implementation-stack ADR.

## Acceptance criteria

- Real iPhone Safari and Android Chrome devices can upload a photograph and microphone recording.
- A recording at the two-minute limit is accepted; unsupported or oversized media is rejected clearly.
- OpenRouter returns both a transcript and useful text extracted from a representative handwritten card.
- Uploaded objects are private and are not passed through the LiveView websocket.
- Restarting Fly after upload but before processing loses neither the asset nor its job.
- A simulated timeout, 429, or 5xx response is retried from the staged object.
- Changing the configured OpenRouter model or preset requires no source-code change.
- The stack ADR accepts, amends, or rejects the proposed stack using evidence from the spike.

## Verification

- Unit tests for media type, size, duration, and lifecycle validation.
- Adapter contract tests for OpenRouter requests, responses, and error classification.
- Oban integration test proving a retry reuses the same staged asset.
- Fly restart/redeploy recovery test.
- Manual device matrix covering permissions, cancellation, and interrupted connections.

## Deferred

- Production-quality pattern entry and attribution.
- Hugo/GitHub publication.
- Cleaned or public images.
- A room-wide dashboard.
- Offline capture and resuming an upload that never reached object storage.
