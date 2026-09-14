# Iteration 004: Transcribe and use a spoken explanation

- **Status:** Planned
- **Depends on:** Iteration 003

## Outcome

A participant can add up to two minutes of speech to a pattern, review its transcript and proposed changes, and publish the result without exposing or permanently retaining the recording.

## Demonstration

A participant records an explanation on their phone. The app transcribes it and proposes additions to Name, Context, Problem, and Solution. The participant edits or rejects those suggestions and publishes the reviewed pattern. No audio appears in Git.

## Scope

- Add a `MediaRecorder` hook with feature detection, a timer, cancellation, and clear permission/error states.
- Provide a file-input fallback for browsers that cannot record reliably.
- Enforce duration and file limits independently in the browser and server.
- Stage audio privately and durably before transcription.
- Transcribe through the OpenRouter adapter in an idempotent Oban job.
- Show the transcript and derived suggestions before submission.
- Combine text, photograph interpretation, and transcript without silently replacing participant-authored text.
- Require the participant to review or explicitly discard attached audio-derived material.
- Retain the recording across transcription and publication retries.
- Delete audio after successful transcription and confirmed publication; expire abandoned recordings under the retention policy.

## Acceptance criteria

- Supported iPhone Safari and Android Chrome devices can record, upload, and transcribe audio.
- A two-minute recording is accepted and an over-limit recording is rejected.
- Worker restart or OpenRouter failure does not require re-recording.
- Retried jobs do not create duplicate transcripts or repeatedly modify reviewed fields.
- Participants can rewrite or ignore every transcript-derived suggestion.
- Audio and its private metadata are absent from Git and the public site.
- Audio remains recoverable while publication is failing and is deleted after confirmed publication.

## Verification

- JavaScript tests for MIME selection, timer, stop, cancel, and denied permission.
- Duration and media validation using representative iOS and Android formats.
- OpenRouter transcription contract and error tests.
- Oban retry, uniqueness, and lifecycle tests.
- Tests proving suggestions cannot overwrite participant edits.
- Physical-device tests including interruption and lost connectivity.

## Deferred

- Multiple recordings per pattern unless user testing shows a need.
- Public audio, diarization, and archival.
- Offline speech recognition.
- Any autonomous rewrite that bypasses participant review.
