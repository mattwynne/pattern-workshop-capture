# Deploy the capture application to Google Cloud Run

Every push to `main` runs the test suite, builds a container, pushes it to Google Artifact Registry, deploys it to Cloud Run, and checks `/health`. Pull requests run checks without deploying.

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
- grant the minimum deployment/runtime roles used by the workflow;
- configure a Workload Identity pool restricted to `mattwynne/pattern-workshop-capture`;
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
gh workflow run deploy.yml --repo mattwynne/pattern-workshop-capture
gh run watch --repo mattwynne/pattern-workshop-capture
```

The completed workflow shows the Cloud Run URL under its `production` environment. You can also retrieve it with:

```sh
gcloud run services describe pattern-workshop-capture \
  --project PROJECT_ID \
  --region us-central1 \
  --format='value(status.url)'
```

Open the root URL on a phone. The room display is at `/dashboard.html`, and `/health` should return `{"ok":true}`.

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

There are no GitHub Actions secrets for Google Cloud. Runtime credentials live in Google Secret Manager:

| Google secret | Runtime environment variable |
| --- | --- |
| `github-handbook-token` | `GITHUB_TOKEN` |
| `openrouter-api-key` | `OPENROUTER_API_KEY` |

## Rotate a credential

Rerunning the bootstrap script adds new secret versions. To rotate one value directly without exposing it in shell history:

```sh
read -rsp "New value: " VALUE; printf '\n'
printf %s "$VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
unset VALUE
```

Use `github-handbook-token` or `openrouter-api-key` as `SECRET_NAME`, then redeploy or create a new Cloud Run revision so it resolves the latest version.

## Workshop operation and cost

CI configures exactly one warm Cloud Run instance (`--min-instances 1 --max-instances 1`). This keeps the in-memory live dashboard coherent and avoids a cold start during the workshop, but incurs a small continuous charge.

After the workshop, scale to zero when idle:

```sh
gcloud run services update pattern-workshop-capture \
  --project PROJECT_ID --region us-central1 --min-instances 0
```

A later CI deployment currently restores the configured minimum to one. Change `.github/workflows/deploy.yml` when the workshop is over.

## Failure checks

- **Workload identity failure:** confirm the GitHub variable contains the full provider resource name and that the repository is exactly `mattwynne/pattern-workshop-capture`.
- **Container push denied:** confirm the deployment service account has `roles/artifactregistry.writer`.
- **Cloud Run deploy denied:** confirm it has `roles/run.admin` and `roles/iam.serviceAccountUser` on the runtime account.
- **Secret access denied:** confirm the runtime account has `roles/secretmanager.secretAccessor`.
- **Handbook publication denied:** check token expiry, selected repository, and Contents read/write permission.
- **AI features unavailable:** verify that `openrouter-api-key` has an enabled version and available OpenRouter credit. Typed capture and publication remain usable without successful AI calls.
