# Iteration 002: Publish a participant-supplied pattern avatar

- **Status:** Implemented locally; integration and device validation pending
- **Depends on:** Iteration 001

## Outcome

A participant can optionally take or choose a picture representing the pattern and publish it as the pattern's avatar.

## Scope

- Make the avatar optional but visibly encouraged.
- Support camera capture and photo-library selection.
- Require editable alt text when an avatar is present.
- Decode and validate the image rather than trusting its filename.
- Correct orientation, bound dimensions, convert to WebP, and strip EXIF and location metadata.
- Discard the raw upload after request processing.
- Commit Markdown and the normalized avatar atomically in one page bundle.
- Display the avatar on handbook catalogue cards and detail pages.

## Acceptance criteria

- Patterns publish successfully with or without an avatar.
- The public avatar is visually faithful and contains no EXIF/GPS metadata.
- Raw upload bytes are not stored or committed.
- Invalid, oversized, or decompression-bomb images are rejected clearly.
- Avatar and Markdown cannot be published separately.

## Verification

- Image-format, dimension, normalization, and metadata-removal tests.
- Atomic Git tree/commit integration test.
- Camera and library selection on iPhone Safari and Android Chrome.
- Hugo build with representative portrait and landscape avatars.
