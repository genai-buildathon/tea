#!/usr/bin/env bash
set -euo pipefail

# Cloud Run helper for this backend.
# Subcommands:
#   init     - Enable APIs, create Artifact Registry and SA with roles
#   build    - Build and push image via Cloud Build
#   deploy   - Deploy to Cloud Run with sensible defaults
#   set-env  - Update only environment variables on Cloud Run service
#   url      - Print Cloud Run service URL
#   logs     - Tail logs

# Load optional local .env for defaults (not baked into image)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Defaults (override by exporting vars before calling or via .env)
# Prefer .env's GOOGLE_* when PROJECT_ID/REGION are not explicitly set
PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null || true)}}"
REGION="${REGION:-${GOOGLE_CLOUD_LOCATION:-us-central1}}"
REPO="${REPO:-backend}"
SERVICE="${SERVICE:-tea-server}"
SA_NAME="${SA_NAME:-tea-run-sa}"
SA_EMAIL="${SA_EMAIL:-${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com}"

GOOGLE_GENAI_USE_VERTEXAI="${GOOGLE_GENAI_USE_VERTEXAI:-1}"
GOOGLE_CLOUD_LOCATION="${GOOGLE_CLOUD_LOCATION:-${REGION}}"
GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-${PROJECT_ID}}"

IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${IMAGE:-${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}}"

usage() {
  cat <<USAGE
Usage: scripts/cloud-run.sh <init|build|deploy|release|set-env|url|logs>

Env vars:
  PROJECT_ID, REGION, REPO, SERVICE, SA_NAME
  GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_LOCATION, GOOGLE_CLOUD_PROJECT
  IMAGE (optional explicit), IMAGE_TAG (optional)

Examples:
  PROJECT_ID=my-proj REGION=us-central1 scripts/cloud-run.sh init
  scripts/cloud-run.sh build
  scripts/cloud-run.sh deploy
  scripts/cloud-run.sh release   # build + deploy (recommended with :latest)
  scripts/cloud-run.sh set-env
  scripts/cloud-run.sh url
  scripts/cloud-run.sh logs
USAGE
}

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }

ensure_project() {
  if [[ -z "${PROJECT_ID}" ]]; then
    echo "PROJECT_ID is empty. Set PROJECT_ID or 'gcloud config set project'." >&2
    exit 1
  fi
  gcloud config set project "${PROJECT_ID}" >/dev/null
}

init() {
  ensure_project
  echo "Enabling required APIs..."
  gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    logging.googleapis.com

  echo "Ensuring Artifact Registry repo '${REPO}' in ${REGION}..."
  if ! gcloud artifacts repositories describe "${REPO}" --location "${REGION}" >/dev/null 2>&1; then
    gcloud artifacts repositories create "${REPO}" \
      --repository-format=docker \
      --location="${REGION}" \
      --description="tea-backend" || true
  fi

  echo "Ensuring service account ${SA_EMAIL}..."
  if ! gcloud iam service-accounts describe "${SA_EMAIL}" >/dev/null 2>&1; then
    gcloud iam service-accounts create "${SA_NAME}" \
      --display-name="Tea Cloud Run SA" || true
  fi

  echo "Binding roles to ${SA_EMAIL}..."
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/artifactregistry.reader" >/dev/null
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/aiplatform.user" >/dev/null
  # Uncomment if you plan to use Secrets
  # gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  #   --member="serviceAccount:${SA_EMAIL}" \
  #   --role="roles/secretmanager.secretAccessor" >/dev/null

  echo "Init complete."
}

build() {
  ensure_project
  echo "Building image: ${IMAGE}"
  gcloud builds submit --tag "${IMAGE}"
  echo "Built: ${IMAGE}"
}

deploy() {
  ensure_project
  echo "Deploying ${SERVICE} to Cloud Run (image=${IMAGE})"
  gcloud run deploy "${SERVICE}" \
    --image "${IMAGE}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --service-account "${SA_EMAIL}" \
    --port=8080 \
    --concurrency=20 \
    --cpu=4 --memory=8Gi \
    --timeout=3600 \
    --max-instances=1 --min-instances=0 \
    --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=${GOOGLE_GENAI_USE_VERTEXAI},GOOGLE_CLOUD_LOCATION=${GOOGLE_CLOUD_LOCATION},GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}"
}

release() {
  # Convenience: build then deploy
  build
  deploy
}

set_env() {
  ensure_project
  echo "Updating environment variables for ${SERVICE}"
  gcloud run services update "${SERVICE}" \
    --region "${REGION}" \
    --platform managed \
    --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=${GOOGLE_GENAI_USE_VERTEXAI},GOOGLE_CLOUD_LOCATION=${GOOGLE_CLOUD_LOCATION},GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}"
}

url() {
  ensure_project
  gcloud run services describe "${SERVICE}" --region "${REGION}" \
    --format='value(status.url)'
}

logs() {
  ensure_project
  gcloud run services logs tail "${SERVICE}" --region "${REGION}"
}

main() {
  need gcloud
  subcmd="${1:-}" || true
  case "${subcmd}" in
    init)   init ;;
    build)  build ;;
    deploy) deploy ;;
    release) release ;;
    set-env) set_env ;;
    url)    url ;;
    logs)   logs ;;
    *) usage; exit 1 ;;
  esac
}

main "$@"
