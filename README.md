# Pattern Workshop Capture

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

## Configuration

- `GITHUB_TOKEN` — required token able to commit to the handbook repository
- `HANDBOOK_OWNER` — defaults to `mattwynne`
- `HANDBOOK_REPO` — defaults to `explore-ddd-anti-authoritarian-team-practices-workshop`
- `HANDBOOK_URL` — defaults to its GitHub Pages URL
- `PORT` — defaults to `8080`

Draft form content is retained in the participant's browser. Live dashboard state is deliberately ephemeral in this first release and resets if the capture server restarts.
