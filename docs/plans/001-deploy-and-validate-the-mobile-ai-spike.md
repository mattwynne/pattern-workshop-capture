# Iteration 001: Publish a reviewed typed pattern

- **Status:** Implemented locally; live typed capture-to-Pages validation passed; cloud deployment and physical-device validation pending
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

## Live validation — 2026-09-15

The real application at capture commit `dc8f95b` published an anonymous, synthetic
**TEMPORARY REHEARSAL Iteration 001 2026-09-15** pattern using host GitHub CLI
authentication. Chromium with a Pixel 7 viewport verified draft recovery, review,
live dashboard updates, publication, and matching public links. One direct handbook
commit created one page bundle plus its retry receipt; Pages deployed successfully
and the rendered page returned HTTP 200 with the reviewed content.

The temporary page bundle was then removed in a normal cleanup commit; see
[the rehearsal evidence](../rehearsal.md#iteration-001-live-typed-publication--2026-09-15)
for publication/cleanup commits, Pages runs, observations and checks.

Remaining: Google Cloud bootstrap and application deployment, deployed acceptance
checks, and physical iPhone Safari/Android Chrome review. Simultaneous same-name
publication and ambiguous retries remain covered locally, not exercised live here.
Iteration 001 is not Done. No other iteration was started by this validation.
