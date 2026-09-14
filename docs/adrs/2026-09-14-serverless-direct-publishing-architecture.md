# Use a serverless direct-publishing architecture

- **Status:** Accepted
- **Date:** 2026-09-14
- **Supersedes:** `2026-09-14-capture-and-publishing-architecture.md`

## Context

The working system must be ready for a joint review on Friday before the Explore DDD workshop. The essential value is the shortest path from participant capture to a public, editable Git-backed handbook. Durable media staging and background-job infrastructure can follow if rehearsal evidence justifies them.

## Decision

- Implement the capture application as a small TypeScript/Node service deployed to Google Cloud Run.
- Publish the handbook as a Hugo site from `mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop` using GitHub Pages.
- Deliver in this order: typed capture, participant-supplied avatar, temporary card-photo interpretation, temporary speech transcription, diagram cleanup, live dashboard, rehearsal hardening.
- Commit each reviewed pattern directly to `main` as a self-contained Hugo page bundle.
- Accept Name, Context, Problem, Solution, optional participant-supplied avatar, and individual/group/anonymous attribution.
- Normalize avatars, remove metadata, and publish only the normalized copy. Do not retain raw avatar bytes.
- Hold card photos and audio only in request memory while OpenRouter processes them. Do not publish or retain them.
- Limit recordings to two minutes. If processing or the application fails, the participant may need to upload or record again.
- Store draft form content in the participant's browser. Keep the live room dashboard in server memory initially; it may reset after deployment or restart.
- Show provisional names on the dashboard while they are edited, followed by publishing and published states.
- Require participant review before publication. AI output is always an editable suggestion.
- Make further corrections through GitHub rather than the capture application.
- Show concise publication and AI-processing notices without requiring a separate consent checkbox.

## Consequences

- The first useful slice reaches publication without Postgres, Oban, object storage, or a second content store.
- Cloud Run's request limit is sufficient for compressed two-minute recordings and ordinary mobile images; requests use binary multipart uploads rather than base64 from the browser.
- Temporary media can be lost during failures. This is an explicit workshop-MVP trade-off, not an unnoticed reliability guarantee.
- Durable staging, resumable uploads, persistent dashboard state, and stronger idempotency remain possible later without changing the handbook format.
- Running one Cloud Run instance during the workshop keeps the in-memory dashboard coherent. The participant form remains recoverable from browser-local draft data.
