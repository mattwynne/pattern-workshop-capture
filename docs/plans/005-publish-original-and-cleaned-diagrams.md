# Iteration 005: Publish original and cleaned diagrams

- **Status:** Planned
- **Depends on:** Iteration 004

## Outcome

Hand-drawn diagrams remain visibly human while gaining an optional, deterministic cleanup that improves readability.

## Demonstration

A participant marks an image as a diagram, compares its metadata-stripped visual original with a gently cleaned derivative, supplies or edits alt text, and publishes both versions with the pattern.

## Scope

- Distinguish source-card photographs from diagrams in the capture flow.
- Produce a deterministic cleaned derivative using orientation correction, cropping, deskewing, background normalization, and restrained contrast adjustment.
- Do not redraw shapes, replace handwriting, vectorize, or generate synthetic artwork.
- Preview both versions and allow publication of the original alone when cleanup is harmful.
- Suggest alt text or a caption, requiring participant review.
- Use deterministic, collision-safe asset names inside the page bundle.
- Commit the visual original, selected derivative, and Markdown atomically.
- Apply EXIF removal and decompression limits to all public outputs.
- Make transformation retries idempotent.

## Acceptance criteria

- The cleaned derivative is recognizably the same human drawing.
- Participants can compare both versions and reject the cleanup.
- Selected images appear in the self-contained Hugo page bundle.
- No public image contains EXIF or GPS metadata.
- Retrying cleanup or publication creates no duplicate assets or commits.
- Cleanup failure does not block publication of the safe original.
- Every published diagram has reviewed alt text.

## Verification

- Golden or perceptual tests for orientation, crop, deskew, and contrast.
- Fixtures for faint pencil, coloured marker, lined paper, shadows, and skew.
- Metadata-removal and decompression-bomb tests.
- LiveView tests for role selection, previews, fallback, captions, and alt text.
- Git bundle tests for deterministic filenames and atomic publication.
- Human review using representative workshop drawings.

## Deferred

- Synthetic diagram generation or semantic redrawing.
- General-purpose photo editing controls.
- Collaborative image editing.
- Browser reprocessing of already published bundles.
