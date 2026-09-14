# Iteration 006: Project live capture progress

- **Status:** Planned
- **Depends on:** Iteration 005

## Outcome

The room can watch patterns arrive and move through processing, review, commit, and publication without adding complexity to the participant flow.

## Demonstration

A projector shows a live dashboard. New patterns appear as participants begin, move through each processing stage, and link to their handbook pages once published.

## Scope

- Add a read-only, projection-friendly dashboard under the workshop URL.
- Derive state from existing Postgres workflow records rather than creating another content store.
- Publish state changes through Phoenix PubSub.
- Rehydrate the complete view from Postgres after reconnects or deployments.
- Show provisional/final Name, attribution, stage, recoverable failure status, and public link where available.
- Distinguish committed from successfully published.
- Provide simple counts and a layout that remains useful with approximately 100 patterns.
- Exclude transcripts, private media, signed URLs, raw API errors, and anonymous contributor information.
- Keep retries automatic; do not turn the dashboard into an administrative or moderation interface.

## Acceptance criteria

- A capture appears and changes stage without manual refresh.
- Refresh, reconnect, or application restart reconstructs the same state.
- Uploading, interpreting, awaiting review, committing, and published states are distinguishable.
- Anonymous patterns reveal no personal attribution.
- Recoverable failures are visible without exposing sensitive diagnostics.
- Published cards link to reachable Hugo pages.
- Fifty simulated active participants and one hundred cards remain responsive and readable.
- Dashboard updates do not affect publication idempotency.

## Verification

- LiveView tests for initial state and PubSub updates.
- Multi-client integration test with simultaneous captures.
- Reconnect and application-restart tests.
- Privacy tests for audio, signed URLs, errors, and anonymous attribution.
- Test for the interval between Git commit and Hugo publication.
- Projector-sized and mobile browser checks.
- Lightweight load test at the stated workshop ceiling.

## Deferred

- Moderation, approval, deletion, and editing controls.
- Facilitator accounts and private administration.
- Analytics, leaderboards, and cross-workshop reporting.
- Decorative visualisations that do not help facilitation.
