# Iteration 004: Transcribe a temporary spoken explanation

- **Status:** Implemented locally; live-model and device validation pending
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

## Local implementation audit — 2026-09-15

Iteration 004 only. No live OpenRouter request or physical-device validation was
attempted. The default transcription endpoint/model contract remains a live gate.

| Planned behaviour / criterion | Implementation and deterministic evidence | Remaining gate |
| --- | --- | --- |
| Two-minute recorder, stop and cancel | Explicit permission/recording/stopping/request states; elapsed-time cap; final chunks collected on stop; cancel discards; repeated permission clicks blocked; late granted streams stopped | Actual iPhone Safari / Android Chrome permission UI and capture |
| Browser formats and file fallback | Negotiates MP4, WebM/Opus and Ogg; uses actual recorder MIME/extension; unsupported API, denial, empty recording and start/error states retain manual/file fallback | Real phone-generated containers, phone library files |
| Byte and duration enforcement | Multipart accepts one file, no extra fields, bounded at 16 MiB; decoder counts 16 kHz mono PCM samples, rejects above 120 seconds; no duration-metadata trust or 125-second grace | Deployed decoder/container execution |
| Temporary transcription | FFmpeg decodes via pipes with only the pipe protocol enabled; 15-second decode deadline and bounded output; metadata-free WAV sent to configurable transcription model, then text to synthesis model | Working OpenRouter credential, real model contract/output/latency |
| Review transcript and suggestions | Transcript stays in page memory; four-field allowlist; explicit per-field / apply-all; consumed suggestions cannot overwrite later edits; stale results ignored; synthesis failure retains transcript with manual-edit warning | Human fidelity/quality review |
| No stored/published audio or private metadata | Multer memory storage and decoder pipes; no upload paths or filenames sent to provider; raw metadata stripped; request buffer reference released; logs/board/publisher exclude audio; browser draft stores authored/applied fields, not transcript or media | Provider retention policy is outside app control; no secure memory-erasure claim |
| Failures never block manual publication | Provider 429/503, malformed/empty/wrong-type responses, deadlines and disconnects tested; browser cancellation, timeout and network failure preserve fields and manual review/publication | Real noisy recordings and network/phone interruptions |
| Cleanup and mobile accessibility | Tracks/timers/chunks released on cancel, error, track end, hidden page, pagehide and review; disconnected requests abort processing; status announcements separate from non-announcing timer; keyboard controls, 320px overflow and axe checks | VoiceOver/TalkBack, physical touch/zoom and actual call/lock/background interruptions |

### Runtime decision

A metadata parser alone cannot enforce duration on browser WebM that omits duration.
The server now requires **FFmpeg on PATH** (installed in CI and the runtime Dockerfile)
and decodes a bounded PCM stream before any provider call. Original containers and
metadata are never forwarded. See FFmpeg's [pipe/protocol allowlist documentation](https://ffmpeg.org/ffmpeg-protocols.html)
and [decoding/output options](https://ffmpeg.org/ffmpeg.html).
Files the decoder cannot read fail clearly; participants can record/choose again or
finish manually. Empty or generic file MIME is inferred from recognised container
signatures; declared unsupported MIME is rejected. This supports synthetic fragmented
MP4 and duration-less WebM locally without claiming phone compatibility is proven.

### Tests and limits

- `test/audio.test.ts`: generated WAV, WebM, fragmented MP4/AAC, Ogg/Opus,
  AAC and MP3; exact 120-second WAV acceptance and over-limit WAV/WebM/MP4
  rejection; byte/type/container validation; provider payload/model/deadline/error
  handling; partial success; API multipart limits, no-store, log/board/publication
  privacy and disconnect abort.
- `test/browser/audio.spec.ts`: deterministic recorder doubles for MIME negotiation,
  permission race, stop/cancel, errors, track end, lifecycle cleanup, empty recordings,
  120-second elapsed clock, stale responses, request timeout, size fallback, explicit
  suggestion application, later-edit preservation, draft privacy and mobile accessibility.
- Existing browser rehearsal still runs a real Chromium MediaRecorder with a synthetic
  oscillator through the real API/decoder/adapter and a stub provider. Uploaded-audio
  flows now use valid generated WAV rather than arbitrary bytes.
- Full validation counts and remaining gates are recorded in [the rehearsal record](../rehearsal.md#iteration-004-local-implementation-audit--2026-09-15).

**Status remains Implemented locally, not Done.** Working OpenRouter, room noise,
physical iPhone/Android and real interruption checks are pending.
