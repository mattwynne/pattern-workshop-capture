# Capture and publishing architecture

- **Status:** Superseded by `2026-09-14-serverless-direct-publishing-architecture.md`
- **Date:** 2026-09-14

## Context

The workshop capture application must turn participants’ text, photographs, diagrams, and speech into a public, editable handbook without requiring participants to install software or understand Git. Submissions should appear immediately, survive transient processing failures, and remain easy for the community to improve during and after the workshop.

## Decision

The capture application and published handbook will be separate systems:

- The capture application will be hosted on Fly.io.
- OpenRouter will provide speech transcription and image/text interpretation. Model and routing choices will be configurable without code changes.
- The handbook will be a Hugo site in `mattwynne/explore-ddd-anti-authoritarian-team-practices-workshop`.
- Possession of the workshop URL is sufficient to submit.
- A contributor may choose individual attribution, group attribution, or anonymity.
- The application will accept typed text, photographs, hand-drawn diagrams, and speech. It will extract or transcribe text and require the contributor to review and edit that interpretation before submission.
- A pattern contains **Name**, **Context**, **Problem**, and **Solution**.
- A stable ID is derived from the initial name. A suffix disambiguates duplicate slugs.
- Each submission adds a self-contained Hugo page bundle containing Markdown and images, then commits it directly to `main`. Hugo discovers patterns without a committed shared index or manifest.
- Concurrent branch-head updates are retried against the latest `main`; additive submissions should not require merge-conflict resolution.
- Original and cleaned images are public in Git. Sensitive image metadata such as EXIF location is removed before publication.
- Uploaded media is staged durably so processing can be retried without another upload. Audio is deleted after successful transcription and publication; abandoned staged media expires automatically.
- A live dashboard shows submissions arriving and progressing through upload, interpretation, review, commit, and publication.
- Further editing happens through Git.
- Handbook text and images are published under CC BY-SA 4.0.

## Consequences

- Git is the source of truth for published handbook content; temporary processing state is not a second content store.
- The capture application needs temporary durable media storage, background processing, OpenRouter and GitHub credentials, and safe retry behaviour.
- Every commit to `main` can trigger Hugo publication, while the dashboard can report progress before a commit exists.
- Immediate publication and URL-only access deliberately favour workshop flow over moderation machinery.
- Participants must be told that OpenRouter processes their submitted media.
- The implementation language and specific storage service remain separate technical decisions.
