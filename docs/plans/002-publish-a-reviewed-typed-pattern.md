# Iteration 002: Publish a reviewed typed pattern

- **Status:** Planned
- **Depends on:** Iteration 001 and its stack ADR

## Outcome

The first complete product slice lets a participant type and review a pattern, publish it as a discrete Git commit, and open it on the public Hugo handbook.

## Demonstration

A participant opens the workshop URL, enters Name, Context, Problem, and Solution, chooses individual, group, or anonymous attribution, reviews the pattern, and submits it. The app shows commit and deployment progress before linking to the published page.

## Scope

- Confirm or create `mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop`.
- Scaffold a Hugo site and automatic publication from `main`.
- Define the page-bundle contract at `content/patterns/<stable-id>/index.md`.
- Add CC BY-SA 4.0 notices to the handbook and submission flow.
- Persist drafts from the first meaningful edit and restore them through an opaque draft token.
- Provide distinct capture, review, and submission states.
- Require Name, Context, Problem, and Solution before submission.
- Support individual, group, and anonymous attribution without accounts.
- Derive a stable slug from the reviewed initial Name; reserve suffixes such as `-2` transactionally.
- Keep an internal capture UUID independent of the readable slug.
- Publish one atomic Git tree and commit directly to the latest `main`.
- Retry branch-head races and reconcile ambiguous GitHub responses using the capture UUID.
- Confirm that Hugo has published the page rather than treating a Git commit as publication.

## Acceptance criteria

- A typed pattern becomes one Hugo page bundle and one direct commit to `main`.
- Hugo discovers patterns without a committed shared index or manifest.
- Reloading the browser or restarting the app does not lose the draft.
- Double submission, job retry, or an ambiguous GitHub timeout cannot publish a duplicate.
- Simultaneous patterns with the same Name receive distinct stable IDs.
- All attribution choices render correctly.
- Git or Hugo failure remains recoverable and visible to the participant.
- The published handbook and submission notice identify CC BY-SA 4.0.
- There is no browser-based editing after publication; the public Git repository is the editing interface.

## Verification

- LiveView tests for capture, review, validation, attribution, and submission.
- Tests for slug normalization, collisions, and legal lifecycle transitions.
- GitHub adapter tests for atomic trees, commits, ref races, timeouts, and duplicate detection.
- Concurrent integration test using several identical names.
- Hugo clean-build test for generated bundles.
- Browser test from workshop URL to public handbook page.

## Deferred

- Photographs, interpretation, audio, and diagram cleanup.
- The room-wide dashboard; only the submitting participant sees status.
- Moderation, accounts, and browser post-publication editing.
- Tags, search, related patterns, and multi-workshop administration.
