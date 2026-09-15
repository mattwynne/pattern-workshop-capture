# Deploy the capture application to Google Cloud Run

Every pull request and push to `main` runs tests and builds and smoke-tests the
production Docker image, even before cloud credentials exist. With bootstrap
variables configured, main also pushes that **same tested image** to Artifact
Registry and deploys its digest to Cloud Run. Manual dispatch deploys only main.
Without `GCP_PROJECT_ID`, only the deploy job is skipped.

The workflow authenticates through GitHub's OpenID Connect token and Google Workload Identity Federation. It does **not** use a downloadable Google service-account key.

## What you need

- A Google account allowed to create a project and attach a billing account.
- The [`gcloud` CLI](https://cloud.google.com/sdk/docs/install), authenticated with `gcloud auth login`.
- The [`gh` CLI](https://cli.github.com/), authenticated as `mattwynne`.
- An OpenRouter API key with credits.
- A fine-grained GitHub personal access token dedicated to publishing the handbook.

## 1. Create the handbook publishing token

In GitHub, create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new):

1. Give it a short expiry that covers the workshop and rehearsal.
2. Set the resource owner to `mattwynne`.
3. Select **Only select repositories** and choose `explore-ddd-anti-authoritarian-team-practices-workshop`.
4. Under repository permissions, grant **Contents: Read and write**. Metadata read access is added automatically.
5. Generate and temporarily copy the token. Do not commit it or paste it into chat.

Commits made with this token trigger the handbook's GitHub Pages workflow. Revoke it after the workshop.

## 2. Authenticate and identify billing

```sh
gcloud auth login
gcloud billing accounts list
```

Choose a globally unique project ID, for example `pattern-workshop-capture-<unique-suffix>`. Project IDs cannot be renamed.

Your Google identity needs permission to create projects, link the selected billing account, enable APIs, create service accounts, and change IAM policy. If the project already exists, the same script can configure it.

## 3. Run the bootstrap script

From this repository:

```sh
./scripts/bootstrap-google-cloud.sh \
  pattern-workshop-capture-<unique-suffix> \
  YOUR-BILLING-ACCOUNT-ID
```

The script is safe to rerun. It will:

- create the project if needed and link billing;
- enable Cloud Run, Artifact Registry, Secret Manager, IAM Credentials, and Security Token Service APIs;
- create the `pattern-workshop` Docker repository;
- create separate deployment and runtime service accounts;
- grant deployment roles and runtime access to only the two application secrets;
- configure a Workload Identity provider restricted to non-PR main runs of `mattwynne/pattern-workshop-capture` (reruns update the condition);
- securely prompt in the terminal for the GitHub publishing token and OpenRouter key;
- put those values into Google Secret Manager—not GitHub Actions;
- configure all required GitHub Actions repository variables.

Secret prompts do not echo their values. Do not put either secret on the command line.

The default region is `us-central1`. Override it for initial setup with:

```sh
GCP_REGION=us-east1 ./scripts/bootstrap-google-cloud.sh PROJECT_ID BILLING_ACCOUNT_ID
```

Do not change the region variable after images have been created without also creating the Artifact Registry repository in the new region.

## 4. Deploy

The bootstrap variables take a short time to propagate. Start the workflow manually or push a commit:

```sh
gh workflow run deploy.yml --ref main --repo mattwynne/pattern-workshop-capture
gh run list --workflow deploy.yml --branch main --limit 5 --repo mattwynne/pattern-workshop-capture
# Use the run ID for the intended commit, not an unrelated latest run.
gh run watch RUN_ID --exit-status --repo mattwynne/pattern-workshop-capture
```

The completed workflow shows the Cloud Run URL under its `production` environment. You can also retrieve it with:

```sh
gcloud run services describe pattern-workshop-capture \
  --project PROJECT_ID \
  --region us-central1 \
  --format='value(status.url)'
```

Open the root URL on a phone. The room display is at `/dashboard.html`.
`/health` must return HTTP 200, `Cache-Control: no-store`, and exactly `{"ok":true}`.
It is local liveness, not credential/provider/Pages readiness. Startup requires a
nonempty publishing token, valid port and runnable FFmpeg; it makes no external
calls. Cloud Run uses an explicit HTTP startup probe. A dummy token can pass
health: complete the separate live integration gates before opening the workshop.

## GitHub Actions configuration reference

The bootstrap script creates these repository **variables**:

| Variable | Example | Purpose |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `pattern-workshop-capture-ab12` | Google Cloud project |
| `GCP_REGION` | `us-central1` | Artifact Registry and Cloud Run region |
| `GCP_ARTIFACT_REPOSITORY` | `pattern-workshop` | Docker repository |
| `CLOUD_RUN_SERVICE` | `pattern-workshop-capture` | Cloud Run service name |
| `CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT` | `capture-runtime@….iam.gserviceaccount.com` | Runtime identity |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123…/providers/pattern-workshop-capture` | Keyless GitHub identity provider |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `github-capture-deployer@….iam.gserviceaccount.com` | Deployment identity |
| `HANDBOOK_TOKEN_VERSION` | `1` | Numeric version of `github-handbook-token` |
| `OPENROUTER_API_KEY_VERSION` | `1` | Numeric version of `openrouter-api-key` |

There are no GitHub Actions secrets for Google Cloud. Runtime credentials live in Google Secret Manager:

| Google secret | Runtime environment variable |
| --- | --- |
| `github-handbook-token` | `GITHUB_TOKEN` |
| `openrouter-api-key` | `OPENROUTER_API_KEY` |

## Rotate a credential

Rerunning bootstrap adds versions and updates both numeric repository variables.
Revisions pin numeric versions so rollback also restores the credential selection.
Keep known-good secret versions enabled until the rollback window ends.
For one credential, run this in **Bash**, with shell tracing disabled:

```bash
set +x
# Choose github-handbook-token / HANDBOOK_TOKEN_VERSION, or
# openrouter-api-key / OPENROUTER_API_KEY_VERSION.
SECRET_NAME=github-handbook-token
VERSION_VARIABLE=HANDBOOK_TOKEN_VERSION
read -rsp "New value: " SECRET_VALUE
printf '\n'
SECRET_VERSION="$(printf %s "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
  --project PROJECT_ID --data-file=- --format='value(name)')"
unset SECRET_VALUE
gh variable set "$VERSION_VARIABLE" --body "${SECRET_VERSION##*/}" \
  --repo mattwynne/pattern-workshop-capture
unset SECRET_VERSION
gh workflow run deploy.yml --ref main --repo mattwynne/pattern-workshop-capture
```

Do not paste credentials in command arguments, chat or logs. Changing a repository
variable alone does not update an existing revision. After rollback, restore the
known-good numeric variables before the next deployment if rotation was the cause.

## Workshop operation and cost

CI configures one warm instance per revision (`--min-instances 1 --max-instances 1`). With one serving revision this keeps the in-memory live dashboard coherent and avoids a cold start, but incurs continuous charges. Rollouts can temporarily run multiple revisions/instances; this is not a service-wide singleton guarantee.

After the workshop, scale to zero when idle:

```sh
gcloud run services update pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 --min-instances 0 --cpu-throttling
```

Also set minimum instances to zero on any retained/tagged serving revisions as needed; verify billing. A later CI deployment restores the minimum to one and always-allocated CPU. Change `.github/workflows/deploy.yml` when the workshop is over.

## Failure checks

- **Workload identity failure:** confirm the GitHub variable contains the full provider resource name and that the repository is exactly `mattwynne/pattern-workshop-capture`.
- **Container push denied:** confirm the deployment service account has `roles/artifactregistry.writer`.
- **Cloud Run deploy denied:** confirm it has `roles/run.admin` and `roles/iam.serviceAccountUser` on the runtime account.
- **Secret access denied:** confirm the runtime account has `roles/secretmanager.secretAccessor`.
- **Handbook publication denied:** check token expiry, selected repository, and Contents read/write permission.
- **AI features unavailable:** verify that `openrouter-api-key` has an enabled version and available OpenRouter credit. Typed capture and publication remain usable without successful AI calls.

## Release rehearsal, QR and go/no-go

Follow [the rehearsal record](rehearsal.md) before admitting workshop participants.
CI runs API/Git fault tests, browser/accessibility tests, a QR decoding test,
a pinned Hugo integration build, actionlint and the production container smoke test. These use local doubles and do not establish
production readiness. The deploy job remains skipped until cloud variables exist. The container job runs
with dummy configuration, no external network, a read-only filesystem and the real
Docker CMD. It checks FFmpeg decoding, Sharp WebP processing, production-only
modules, static assets, non-default PORT, health, startup failure and log redaction.
The artifact passed to deployment is that exact image; deployment never rebuilds.

To reproduce the Docker gate locally (requires Docker):

```sh
docker build --tag capture:local .
npm run check:container -- capture:local
npm run check:workflow
```

The build stage installs dev dependencies and compiles TypeScript; the runtime
stage performs a fresh `npm ci --omit=dev`, copies only `dist/src` plus `public`,
installs FFmpeg and runs as `node` from `/app`. `npm start` and Docker CMD both use
`dist/src/server.js`. QR, Hugo, browser, test and development scripts require the
full developer install and are run outside the production image. The Docker
context is allowlisted; `.env*`, WIF files, rehearsal artifacts and traces stay out.

Generate the printable SVG and PNG after obtaining the final HTTPS capture URL:

```sh
CAPTURE_URL="$(gcloud run services describe pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 --format='value(status.url)')"
curl --fail --show-error --silent --connect-timeout 5 --max-time 15 "$CAPTURE_URL/health"
npm ci # QR tooling is a developer dependency
npm run qr -- "$CAPTURE_URL/" artifacts/qr
```

For a custom domain, substitute its final verified HTTPS root URL before generation.
Open that exact root and dashboard URL before printing. Do not use a revision/tag
URL or a placeholder. The test QR uses example.test and is not a release artifact.
Print the human-readable URL alongside the QR. The generator refuses embedded
credentials, query strings and fragments. Scan the printed result on both phones.

## Monitor and recover

Cloud Run uses one warm instance, a per-revision maximum of one and concurrency 80. The room
rehearsal must confirm CPU/memory and GitHub/OpenRouter quotas at the real workshop
rate; long-lived dashboard connections consume request slots. Avoid deploying
mid-session because revisions have separate in-memory boards, even with a scale cap.

Inspect Cloud Logging for the service and `jsonPayload.event="http_request"`.
Use `jsonPayload.status>=500` to find failures and `jsonPayload.requestId` to match
`X-Request-ID` from the browser. Track error counts and duration changes against the
rehearsal baseline. Do not enable body/header logging. Cloud Run's own access logs
may record request URLs; do not put participant information or secrets in URLs.
Check the Google log retention policy before the event. Do not paste raw logs or
credentials into the handbook or issue tracker.

Before deployment, record the current known-good revision and image digest:

```sh
gcloud run services describe pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 --format='yaml(status.traffic)'
gcloud run revisions list --service pattern-workshop-capture \
  --project PROJECT_ID --region us-central1
# Choose the currently serving known-good revision from status.traffic.
gcloud run revisions describe KNOWN_GOOD_REVISION \
  --project PROJECT_ID --region us-central1 \
  --format='yaml(metadata.name,status.imageDigest,spec.containers[0].env)'
```

If a deployment fails health or rehearsal checks, restore all traffic to that
recorded revision (replace `KNOWN_GOOD_REVISION` with its actual name):

```sh
gcloud run services update-traffic pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 \
  --to-revisions KNOWN_GOOD_REVISION=100
```

Only use the configuration output privately; secret references are shown, but
never add plaintext secrets as environment variables. Record image digest, model
IDs and secret version references with the rehearsal evidence.

Verify `/health`, reconnect the dashboard and perform an explicitly reviewed real
rehearsal capture once live testing is authorized. Rollback is an operator action;
a failed CI health check does not automatically restore traffic. Rollback
resets in-memory state and does not undo Git commits. Preserve browser drafts and
check the handbook before recreating an ambiguously published capture. Do not roll
back to a pre-007 publisher during submissions: it cannot use the new capture
receipts. Correct code on `main` or revert the faulty change, run all checks, and
redeploy; otherwise the next push can reintroduce the bad revision.

## Switch models without a code rebuild

Defaults in `src/openrouter.ts` are configuration choices, **not validated model
availability or quality**. Successful real-model validation is still pending.
Record the known-good revision above, then substitute model IDs that have passed
the vision, transcription and synthesis rehearsal gates:

```sh
gcloud run services update pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 \
  --update-env-vars 'VISION_MODEL=VALIDATED_VISION_ID,TRANSCRIPTION_MODEL=VALIDATED_AUDIO_ID,SYNTHESIS_MODEL=VALIDATED_SYNTHESIS_ID'
gcloud run services update-traffic pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 --to-latest
```

This creates a revision and can reset the board; do it before participants arrive.
CI uses `--update-env-vars` so these overrides survive subsequent image deployments.
To restore code defaults, use `gcloud run services update` with the same project,
region and service and `--remove-env-vars VISION_MODEL,TRANSCRIPTION_MODEL,SYNTHESIS_MODEL`,
then move traffic to latest. To undo a bad switch, route traffic to the recorded
known-good revision. Health alone does not validate a switch. Test actual reviewed
photo/audio output and manual fallback; never silently change models mid-workshop.
After any rollback, reconcile code/configuration before the next CI deployment:
CI deliberately restores traffic to latest.

## Tomorrow checklist

1. Confirm exact-main CI is green, including **container**; record its run URL and commit.
2. Obtain cloud/billing access, dedicated handbook token, working OpenRouter key and credits;
   bootstrap, pin secret versions, deploy and record revision/digest and health.
3. Run the pending deployed GitHub/Pages, simultaneous/retry and real-model gates;
   record observed results, latency and fallback. Review real cleaned drawings.
4. Rehearse on physical iPhone Safari and Android Chrome: camera/library/HEIC,
   microphone/interruptions/noisy audio, attribution, review, publication and accessibility.
5. Test the projector and real Wi-Fi/load/reconnect; record limits and known-good rollback.
6. Generate from the final stable URL, print URL plus QR, and scan the actual print on both phones.
7. Facilitators review every pending gate in [rehearsal.md](rehearsal.md), record go/no-go,
   and retain paper/manual fallback. **Until then: NO-GO.**

Flag semantics were checked against the [gcloud deploy reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy).
Workflow validation uses [actionlint](https://github.com/rhysd/actionlint); image handoff
uses [GitHub artifacts](https://github.com/actions/upload-artifact).
