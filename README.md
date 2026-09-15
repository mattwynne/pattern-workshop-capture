# Pattern Workshop Capture

[![Test and deploy](https://github.com/mattwynne/pattern-workshop-capture/actions/workflows/deploy.yml/badge.svg)](https://github.com/mattwynne/pattern-workshop-capture/actions/workflows/deploy.yml)

Mobile-first capture and live progress for the Explore DDD 2026 workshop “Non-Authoritarian Team Practices: a Co-Created Handbook”.

## Run locally

Requires FFmpeg on PATH (for bounded in-memory audio decoding), Node.js 22+ and a GitHub token with write access to the handbook repository.

```sh
npm ci
# Supply GITHUB_TOKEN through your shell environment without putting it in history.
npm run dev
```

Open <http://localhost:8080>. The room dashboard is at <http://localhost:8080/dashboard.html>.

## Checks

```sh
npm run check
npx playwright install --with-deps chromium # once per development environment
npm run test:browser
npm run check:workflow
# With Docker available:
docker build --tag capture:local .
npm run check:container -- capture:local
```

The browser suite uses mobile Chromium emulation and a local stub publisher; it never writes to GitHub. CI runs both suites, validates the workflow and builds/smoke-tests the production image without cloud credentials. Physical iPhone/Android checks remain necessary.

## Deployment

See **[docs/deployment.md](docs/deployment.md)** for the one-time Google Cloud setup, credential permissions, GitHub Actions variables, deployment, rotation, and troubleshooting instructions.

After bootstrap, every push to `main` tests and deploys the application to Cloud Run. Pull requests run checks without deploying.

## Configuration

- `GITHUB_TOKEN` — required token able to commit to the handbook repository
- `HANDBOOK_OWNER` — defaults to `mattwynne`
- `HANDBOOK_REPO` — defaults to `explore-ddd-anti-authoritarian-team-practices-workshop`
- `HANDBOOK_URL` — defaults to its GitHub Pages URL
- `PORT` — defaults to `8080`
- `OPENROUTER_API_KEY` — enables temporary card-photo interpretation and speech transcription
- `VISION_MODEL` — defaults to `google/gemini-2.5-flash`
- `TRANSCRIPTION_MODEL` — defaults to `openai/whisper-1`
- `SYNTHESIS_MODEL` — defaults to `google/gemini-2.5-flash`

Card photos and audio are held only in request memory while OpenRouter processes them; they are neither stored nor published. Draft form content is retained in the participant's browser. Live dashboard state is deliberately ephemeral in this first release and resets if the capture server restarts.


## Avatar comparison

`POST /api/avatars/previews` accepts one multipart `avatar` (up to 16 MiB). It returns metadata-free WebP data URLs in `original` and optional `cleaned`, plus a `warning` if cleanup fails. Responses are not cacheable; the service retains no image state.

The browser defaults to the original, keeps both previews only in page memory for comparison, and sends **only the selected bytes** as the multipart `avatar` to `POST /api/patterns`, with reviewed `avatarAlt`. The server independently validates and normalizes that image before passing it to the publisher. There is no treatment flag or server-side preview token to expire. Reloading requires choosing the picture again. Raw and unselected images never enter the handbook bundle.

Cleanup keeps the full frame and gently lifts the background. Automatic crop/deskew is deferred to avoid removing faint marks or changing intentionally slanted drawings; see the [Iteration 005 decision and validation record](docs/plans/005-publish-original-and-cleaned-diagrams.md).
