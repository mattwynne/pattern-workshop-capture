# Iteration 001: Publish a reviewed typed pattern

- **Status:** In progress
- **Depends on:** Serverless direct-publishing ADR

## Outcome

A participant can enter and review Name, Context, Problem, and Solution, then publish one self-contained Hugo page bundle and open it in the public handbook.

## Scope

- Create and publish the public Hugo handbook through GitHub Pages.
- Build a mobile-first TypeScript/Node capture application.
- Persist draft fields in the participant's browser.
- Support individual, group, and anonymous attribution.
- Show a review step before publication.
- Derive collision-safe readable slugs while retaining an independent capture UUID.
- Commit directly to the latest `main` and retry branch-head races.
- Show drafting, publishing, and published states on the live room dashboard.
- Package the application for Google Cloud Run.

## Acceptance criteria

- A reviewed typed pattern becomes one page bundle and one direct commit.
- Required fields and attribution validate clearly on mobile.
- Refreshing the browser retains entered text.
- Simultaneous identical names cannot overwrite one another.
- The dashboard live-updates provisional pattern names.
- The published page is reachable from the capture result and dashboard.

## Verification

- Unit tests for validation, Markdown generation, and slug normalization.
- API tests for draft and publication lifecycle.
- GitHub Pages clean deployment.
- End-to-end publication test against the real handbook.
- iPhone Safari and Android Chrome review.
