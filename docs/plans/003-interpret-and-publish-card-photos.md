# Iteration 003: Interpret and publish card photographs

- **Status:** Planned
- **Depends on:** Iteration 002

## Outcome

A participant can photograph a handwritten card, receive a structured interpretation, correct it, and publish the photograph with the reviewed pattern.

## Demonstration

A participant takes or selects a photograph. The app proposes Name, Context, Problem, and Solution. The participant rewrites anything inaccurate, chooses attribution, and publishes the pattern and its visually original photograph.

## Scope

- Add camera/file selection to durable drafts using the direct-upload path proven in iteration 001.
- Validate decoded image content, dimensions, and magic bytes rather than trusting browser MIME headers.
- Normalize orientation and create a visually original publication copy with EXIF, GPS, embedded thumbnails, and other sensitive metadata removed.
- Send the staged image to a configured OpenRouter vision model or preset.
- Require schema-shaped output and normalize it behind the interpretation adapter.
- Store AI results as versioned suggestions, never as authoritative content.
- Allow manual completion when interpretation fails without requiring another upload.
- Prevent a retry from overwriting participant edits.
- Add Markdown and the safe image to the same atomic Git commit.
- Expire abandoned media after the configured retention period, while retaining media attached to submitted or publishing patterns.

## Acceptance criteria

- A temporary processing failure can be retried without photographing or uploading the card again.
- Every proposed field can be reviewed and completely rewritten.
- Reprocessing cannot overwrite human edits.
- Published photographs contain no EXIF or GPS metadata.
- Private staged objects and signed URLs never appear in the handbook.
- The Markdown and photograph appear in one self-contained page bundle and commit.
- Failed interpretation still permits manual review and publication.
- Cleanup is idempotent and cannot remove assets needed by active or submitted work.

## Verification

- Image decoding, size, pixel-count, and malformed-image tests.
- Fixtures containing GPS, rotation, thumbnails, and device metadata.
- OpenRouter schema and malformed-response contract tests.
- Lifecycle tests for success, failure, retry, manual completion, and abandonment.
- Test proving retries preserve participant edits.
- Real-device camera tests in portrait and landscape orientation.

## Deferred

- Speech capture.
- Diagram-specific cleaned derivatives.
- Synthetic image generation or autonomous prose polishing.
- Publication of the byte-for-byte private upload.
