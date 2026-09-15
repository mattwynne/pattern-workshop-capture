# Iteration 007: Rehearse and release the workshop

- **Status:** Implemented locally; live release gates pending
- **Depends on:** Iterations 001–006

## Outcome

A realistic rehearsal demonstrates that the complete capture-to-GitHub flow works concurrently on actual workshop devices, with understood fallback behaviour when temporary processing fails.

## Scope

- Provision Google Cloud Run and secrets for GitHub and OpenRouter.
- Keep one warm application instance during the workshop and cap scaling at one while dashboard state is in memory.
- Add CI, health checks, structured redacted logs, and deploy/rollback instructions.
- Exercise GitHub branch-head races and ambiguous failures.
- Confirm that manual entry remains available whenever AI processing fails.
- Run a facilitated rehearsal with real cards, drawings, room noise, phones, dashboard, and handbook.
- Finalize the capture URL and printable QR code.
- Show concise notices for public content, attribution, AI processing, temporary-media disposal, and CC BY-SA 4.0.

## Acceptance criteria

- Fifty simulated clients and one hundred total patterns stay responsive.
- Same-name submissions receive unique IDs and cannot overwrite page bundles.
- GitHub races cause no duplicate or lost published patterns.
- Real iPhone Safari and Android Chrome complete text, avatar, photo-interpretation, and speech flows.
- Failed AI calls leave all participant-authored fields intact and allow manual publication.
- Temporary photos and audio do not appear in Git or persistent server storage.
- Dashboard and handbook converge on published patterns under normal operation.
- A documented go/no-go review confirms readiness.

## Verification

- End-to-end browser suite for capture modes and attribution choices.
- Concurrency tests around slug allocation and Git ref updates.
- OpenRouter and GitHub fault injection.
- Hugo clean-build and broken-link checks.
- Mobile accessibility and viewport review.
- Facilitated physical-device rehearsal.

## Local verification and release decision

See [the rehearsal record](../rehearsal.md) for reproducible checks, exact scope,
operational limits and pending evidence. Credential-independent implementation is
complete. Current release decision is **NO-GO** pending deployed-cloud, live-model,
physical-device and facilitated room validation. No such results are claimed.

## Deferred

- Durable media staging, resumable uploads, and persistent dashboard state.
- Offline-first capture and native apps.
- Accounts, moderation, and browser post-publication editing.
- Multi-workshop administration and internet-scale abuse prevention.
