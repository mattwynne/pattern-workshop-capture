# Iteration 006: Project live capture progress

- **Status:** Implemented locally; load and deployment validation pending
- **Depends on:** Iteration 001; enriched by later capture modes

## Outcome

The room can watch provisional pattern names appear and move through drafting, publishing, and published states without complicating participant capture.

## Scope

- Provide a read-only, projection-friendly dashboard.
- Create an ephemeral draft UUID when capture starts.
- Send debounced provisional-name updates from the participant browser.
- Broadcast complete dashboard state using server-sent events.
- Show drafting, publishing, published, and recoverable failure states.
- Link published cards to their handbook pages.
- Exclude field contents, media, transcripts, API errors, and anonymous contributor details.
- Run one application instance during the workshop to keep ephemeral state coherent.

## Acceptance criteria

- Provisional names update without refreshing the dashboard.
- Submission and publication states are distinguishable.
- Published cards link to reachable Hugo pages.
- No temporary media or sensitive diagnostics appear.
- Fifty active participants and one hundred cards remain responsive.
- A server restart may clear the room view; participant form drafts remain in their browsers.

## Verification

- API lifecycle and server-sent-event tests.
- Multi-client browser test.
- Privacy checks for field content, media, errors, and attribution.
- Projector-sized and mobile display checks.
- Lightweight load test at workshop scale.
