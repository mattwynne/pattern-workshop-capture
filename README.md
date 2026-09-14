# Pattern Workshop Capture

[![Test and deploy](https://github.com/mattwynne/pattern-workshop-capture/actions/workflows/deploy.yml/badge.svg)](https://github.com/mattwynne/pattern-workshop-capture/actions/workflows/deploy.yml)

Mobile-first capture and live progress for the Explore DDD 2026 workshop “Non-Authoritarian Team Practices: a Co-Created Handbook”.

## Run locally

Requires Node.js 22+ and a GitHub token with write access to the handbook repository.

```sh
npm install
GITHUB_TOKEN=... npm run dev
```

Open <http://localhost:8080>. The room dashboard is at <http://localhost:8080/dashboard.html>.

## Checks

```sh
npm run check
```

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
