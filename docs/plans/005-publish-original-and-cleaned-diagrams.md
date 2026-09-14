# Iteration 005: Offer gentle diagram cleanup

- **Status:** Planned
- **Depends on:** Iteration 002

## Outcome

A participant can use a human-drawn diagram as the pattern avatar and optionally choose a gently cleaned version that remains recognizably theirs.

## Scope

- Start from the participant-supplied avatar flow.
- Produce a deterministic preview using orientation correction, conservative cropping/deskewing, background normalization, and restrained contrast.
- Never redraw shapes, replace handwriting, vectorize, or generate artwork.
- Let the participant compare the normalized original and cleaned preview.
- Publish only the selected metadata-free version; discard raw and unselected bytes.
- Preserve reviewed alt text.
- Treat cleanup failure as non-blocking.

## Acceptance criteria

- Cleanup preserves the human drawing's marks and meaning.
- Participants can reject cleanup and publish the normalized original.
- Only the selected output appears in the page bundle.
- No output contains EXIF or GPS metadata.
- Cleanup failure cannot block publication.

## Verification

- Representative faint pencil, coloured marker, lined paper, shadow, and skew examples.
- Golden/perceptual tests for deterministic transformations.
- Mobile comparison and selection tests.
- Human review with workshop drawings.
