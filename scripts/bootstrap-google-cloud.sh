#!/usr/bin/env bash
set +x # Never trace credential reads or pipes, even when invoked with bash -x.
set -euo pipefail

PROJECT_ID="${1:-}"
BILLING_ACCOUNT="${2:-}"
REGION="${GCP_REGION:-us-central1}"
REPOSITORY="pattern-workshop"
SERVICE="pattern-workshop-capture"
POOL="github-actions"
PROVIDER="pattern-workshop-capture"
GITHUB_REPOSITORY="mattwynne/pattern-workshop-capture"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 <globally-unique-gcp-project-id> [billing-account-id]" >&2
  exit 2
fi
for command in gcloud gh; do
  command -v "$command" >/dev/null || { echo "$command is required" >&2; exit 2; }
done

echo "Configuring Google Cloud project $PROJECT_ID in $REGION"
if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud projects create "$PROJECT_ID" --name="Pattern Workshop Capture"
fi
if [[ -n "$BILLING_ACCOUNT" ]]; then
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
fi

BILLING_ENABLED="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' 2>/dev/null || true)"
if [[ "$BILLING_ENABLED" != "True" ]]; then
  echo "Billing is not enabled. Link billing in Google Cloud, then run this script again." >&2
  echo "Available accounts:" >&2
  gcloud billing accounts list >&2 || true
  exit 1
fi

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sts.googleapis.com

if ! gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker --location="$REGION" \
    --description="Pattern Workshop capture application images"
fi

DEPLOYER_NAME="github-capture-deployer"
RUNTIME_NAME="capture-runtime"
DEPLOYER_EMAIL="$DEPLOYER_NAME@$PROJECT_ID.iam.gserviceaccount.com"
RUNTIME_EMAIL="$RUNTIME_NAME@$PROJECT_ID.iam.gserviceaccount.com"
for account in "$DEPLOYER_NAME" "$RUNTIME_NAME"; do
  if ! gcloud iam service-accounts describe "$account@$PROJECT_ID.iam.gserviceaccount.com" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$account" --display-name="$account"
  fi
done

for role in roles/artifactregistry.writer roles/run.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOYER_EMAIL" --role="$role" --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_EMAIL" \
  --member="serviceAccount:$DEPLOYER_EMAIL" --role=roles/iam.serviceAccountUser >/dev/null

if ! gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"
fi
PROVIDER_OPERATION=create-oidc
if gcloud iam workload-identity-pools providers describe "$PROVIDER" --workload-identity-pool="$POOL" --location=global >/dev/null 2>&1; then
  PROVIDER_OPERATION=update-oidc
fi
gcloud iam workload-identity-pools providers "$PROVIDER_OPERATION" "$PROVIDER" \
    --workload-identity-pool="$POOL" --location=global \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository == '$GITHUB_REPOSITORY' && assertion.ref == 'refs/heads/main' && assertion.event_name != 'pull_request'"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
PRINCIPAL="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GITHUB_REPOSITORY"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --member="$PRINCIPAL" --role=roles/iam.workloadIdentityUser >/dev/null

for secret in github-handbook-token openrouter-api-key; do
  if ! gcloud secrets describe "$secret" >/dev/null 2>&1; then
    gcloud secrets create "$secret" --replication-policy=automatic
  fi
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:$RUNTIME_EMAIL" --role=roles/secretmanager.secretAccessor --condition=None >/dev/null
done

echo
read -rsp "Fine-grained GitHub token for the handbook repository: " GITHUB_TOKEN
printf '\n'
[[ -n "$GITHUB_TOKEN" ]] || { echo "Publishing token must not be empty" >&2; exit 1; }
GITHUB_SECRET_VERSION="$(printf %s "$GITHUB_TOKEN" | gcloud secrets versions add github-handbook-token --data-file=- --format='value(name)')"
unset GITHUB_TOKEN
read -rsp "OpenRouter API key: " OPENROUTER_API_KEY
printf '\n'
[[ -n "$OPENROUTER_API_KEY" ]] || { echo "OpenRouter key must not be empty" >&2; exit 1; }
OPENROUTER_SECRET_VERSION="$(printf %s "$OPENROUTER_API_KEY" | gcloud secrets versions add openrouter-api-key --data-file=- --format='value(name)')"
unset OPENROUTER_API_KEY

WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"
gh variable set GCP_REGION --repo "$GITHUB_REPOSITORY" --body "$REGION"
gh variable set GCP_ARTIFACT_REPOSITORY --repo "$GITHUB_REPOSITORY" --body "$REPOSITORY"
gh variable set CLOUD_RUN_SERVICE --repo "$GITHUB_REPOSITORY" --body "$SERVICE"
gh variable set CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT --repo "$GITHUB_REPOSITORY" --body "$RUNTIME_EMAIL"
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "$GITHUB_REPOSITORY" --body "$WIF_PROVIDER"
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo "$GITHUB_REPOSITORY" --body "$DEPLOYER_EMAIL"

gh variable set HANDBOOK_TOKEN_VERSION --repo "$GITHUB_REPOSITORY" --body "${GITHUB_SECRET_VERSION##*/}"
gh variable set OPENROUTER_API_KEY_VERSION --repo "$GITHUB_REPOSITORY" --body "${OPENROUTER_SECRET_VERSION##*/}"
# Enable automatic deployment only after every other variable has been written.
gh variable set GCP_PROJECT_ID --repo "$GITHUB_REPOSITORY" --body "$PROJECT_ID"

echo
echo "Bootstrap complete. GitHub Actions variables and Google Cloud secrets are configured."
echo "Push to main or run the 'Test and deploy capture app' workflow."
