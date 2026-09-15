# Iteration 003: Interpret temporary card photographs

- **Status:** Implemented locally; live-model and device validation pending
- **Depends on:** Iteration 002

## Outcome

A participant can photograph a handwritten card, receive structured suggestions, selectively apply or rewrite them, and discard the source photo.

## Scope

- Accept camera or photo-library input up to the configured request limit.
- Decode, orient, resize, and compress the image in request memory.
- Send it to a configurable OpenRouter vision model using structured output.
- Suggest Name, Context, Problem, and Solution without inventing missing content.
- Let participants apply one suggestion, apply all, ignore them, or rewrite anything.
- Never overwrite participant text automatically.
- Do not store or publish the card photograph.
- Permit completely manual completion when interpretation fails.

## Acceptance criteria

- Representative handwriting produces useful editable suggestions.
- Every suggestion remains optional and participant-controlled.
- The temporary card photo is absent from Git and server storage.
- Invalid and oversized images receive clear errors.
- AI failure does not prevent manual publication; retry may require another upload.

## Verification

- OpenRouter request, structured response, malformed response, and error tests.
- Image decoding and request-limit tests.
- Real workshop card tests under varied lighting and orientation.
- iPhone Safari and Android Chrome camera tests.
