# Iteration 004: Transcribe a temporary spoken explanation

- **Status:** In progress
- **Depends on:** Iteration 003

## Outcome

A participant can record up to two minutes of explanation, review its transcript and structured suggestions, and continue without publishing or retaining the audio.

## Scope

- Record using `MediaRecorder` with supported MIME negotiation, timer, stop, cancellation/error handling, and a file-input fallback.
- Enforce a two-minute recording limit and a conservative request-size limit.
- Send audio from request memory to a configurable OpenRouter transcription model.
- Turn the transcript into optional Name, Context, Problem, and Solution suggestions.
- Show the transcript and allow one-at-a-time or explicit apply-all actions.
- Do not store audio or include it in Git.
- Allow manual completion when recording or transcription fails.

## Acceptance criteria

- Supported iPhone Safari and Android Chrome devices can record and transcribe.
- Over-limit or unsupported audio is rejected clearly.
- Suggestions never modify fields without an explicit participant action.
- Audio and private metadata are absent from Git and server storage.
- Failure may require re-recording but never blocks manual publication.

## Verification

- MIME mapping, OpenRouter request/response, malformed response, and error tests.
- Browser checks for permission denial, recording, timer, stop, and fallback.
- Physical-device tests with representative room noise.
