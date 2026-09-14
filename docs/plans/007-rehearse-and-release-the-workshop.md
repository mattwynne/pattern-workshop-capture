# Iteration 007: Rehearse and release the workshop

- **Status:** Planned
- **Depends on:** Iteration 006

## Outcome

A realistic rehearsal demonstrates that the complete system can survive workshop concurrency, service failures, deployments, and participant mistakes without losing or duplicating contributions.

This iteration verifies guarantees built into earlier slices; it must not introduce durable storage or idempotency for the first time.

## Demonstration

Several real phones and simulated groups submit typed, photographed, diagrammed, and spoken patterns concurrently. Injected OpenRouter, GitHub, Hugo, and Fly failures recover without repeat uploads. The room dashboard and public handbook converge on the same set of patterns.

## Scope

- Configure production Fly.io, Postgres, private object storage, OpenRouter, GitHub credentials, and Hugo deployment.
- Add CI, release migrations, health checks, structured logs, capture IDs, and secret/error redaction.
- Reconcile ambiguous GitHub outcomes, stuck jobs, incomplete uploads, and orphaned media.
- Verify object-store lifecycle rules preserve active and submitted media.
- Exercise database backup and restoration.
- Document deployment, rollback, secret rotation, model/preset switching, retries, retention, and Git correction.
- Finalize the workshop URL and printable QR code.
- Finalize participant notices covering public images, attribution, OpenRouter processing, audio deletion, retention, and CC BY-SA 4.0.
- Run a facilitated rehearsal with actual workshop materials and physical devices.

## Acceptance criteria

- Fifty concurrent simulated participants and one hundred total patterns complete within an agreed publication-time budget.
- Identical names receive unique IDs and no page bundle is overwritten.
- OpenRouter failures, GitHub timeouts, branch-head races, Hugo delays, worker restarts, and Fly deployments cause no lost or duplicate submissions.
- Participants can finish manually when interpretation fails.
- Pending media survives processing and publication failures.
- Published audio is deleted; abandoned media expires; public images remain in Git.
- Database restoration and stuck-job reconciliation are demonstrated in staging.
- Real iPhone Safari and Android Chrome complete every capture mode.
- Changing OpenRouter models or presets during the rehearsal does not lose in-flight work.
- A documented go/no-go review confirms readiness.

## Verification

- End-to-end browser suite for every capture mode and attribution choice.
- Concurrency tests around slug reservation and Git ref updates.
- Fault injection at each external boundary.
- Oban uniqueness, retry, and reconciliation tests.
- Retention and object-store lifecycle audit.
- Hugo clean-build and broken-link checks.
- Backup/restore exercise.
- Accessibility and mobile-viewport review.

## Deferred

- Offline-first capture and native mobile applications.
- Accounts, moderation queues, and browser post-publication editing.
- Multi-tenant workshop administration and internet-scale abuse prevention.
- AI-generated artwork or autonomous editorial rewriting.
- Features not required for the Explore DDD workshop.
