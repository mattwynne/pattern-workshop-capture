# Use single-piece flow on `main`

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

This is a small, purpose-built application with one active stream of work. Branches and pull requests would add queues and integration delay without providing useful coordination.

## Decision

- Work on one iteration at a time.
- Integrate each completed, verified piece directly into `main`.
- Do not use feature branches or pull requests as part of the normal delivery flow.
- Temporary local worktrees may isolate changes while they are being made, but they must not become long-lived branches or parallel streams of work.
- Keep every piece small enough to verify before it reaches `main`.

## Consequences

- `main` always represents the latest integrated state.
- Tests and other relevant checks must pass before each piece is committed or integrated.
- Incomplete work stays local rather than accumulating in a branch queue.
- A bad change is corrected with a new commit or reverted directly on `main`.
