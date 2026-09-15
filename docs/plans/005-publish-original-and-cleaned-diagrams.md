# Iteration 005: Offer gentle diagram cleanup

- **Status:** Implemented locally
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


## Implementation and decisions (2026-09-15)

- Completed the request-local comparison API and mobile original/cleaned selection flow. The normalized original is selected by default. Review uses the chosen preview and the participant's unchanged alt text.
- Publication accepts just the selected image bytes. Independent server normalization strips metadata even for direct API callers. Lossless WebP makes publication of either generated preview byte-identical to that preview. The GitHub bundle contains only `index.md` and `avatar.webp`.
- Raw upload bytes are released by the page after successful preview processing. Both choices remain only in page memory while editing/reviewing, and are released on replacement, removal, or successful publication. The server has no media store or preview token. Failed publication retains choices for retry. A reload requires a new upload.
- Cleanup failure returns an original plus a warning. Network errors and a 30-second browser timeout allow original publication, which never invokes cleanup. Invalid media is rejected separately and does not silently become publishable.
- Corrected the intentional partial implementation: its `Promise.all` made cleanup failure fatal to the original path; its fixed paper-colour trim and sharpening could erase or distort faint marks; repeated lossy encoding could change the selected preview on publication.
- **Scope adjustment:** automatic cropping and arbitrary-angle deskewing are deferred. This implementation applies EXIF orientation correction, bounded resizing, white alpha compositing, and a small deterministic tonal lift to the cleaned choice, preserving the full drawing geometry. It does not claim to remove strong shadows, find paper edges, or straighten photographed pages. Faint edge marks and deliberately slanted drawings take priority over speculative geometric correction.

## Validation completed

- `npm run check`: TypeScript build and 23 automated tests passed.
- `npm run test:browser`: six mobile Chromium tests passed. CI now installs Chromium and runs this suite before deployment.
- Synthetic perceptual probes cover faint pencil, coloured marker, lined paper, uneven shadow, and skew. Tests bound every colour-channel change to five levels, preserve dimensions and edge marks, and check deterministic output. These are reproducible test drawings, not real participant samples or human approval.
- EXIF/GPS removal, orientation, size bounds, invalid/disguised input, missing alt text, missing/malformed/oversized uploads, injected cleanup failures, exact selected-byte publication, and the GitHub two-file tree are tested.
- Browser tests cover stacked mobile comparison without horizontal overflow, original default, both selections, reviewed alt text, back/edit, network and cleanup failures, replacement/removal, a late response, malformed uploads, and publication retry.
- Browser runtime dependencies were initially missing locally; installed with `npx playwright install --with-deps chromium` before the successful run.

## Remaining acceptance work

- Human comparison with actual workshop drawings, especially very faint pencil and handwriting, to judge retained character and useful cleanup strength.
- Physical iPhone/Android camera, HEIC support, memory/network behavior, and accessibility review. Chromium emulation does not establish these.
- Deployed capture-to-GitHub-to-Hugo/Pages verification with each selection. Automated publisher tests use a fake GitHub service.
- Revisit crop/deskew only with representative samples and a reliable conservative geometry policy.

This iteration is **Implemented locally**, not **Done**. No production or human-review acceptance is claimed.
