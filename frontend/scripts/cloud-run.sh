#!/usr/bin/env bash
set -euo pipefail

# Cloud Run helper for frontend.
# Subcommands:
#   init     - Enable APIs, create Artifact Registry
#   build    - Build and push image via Cloud Build
#   deploy   - Deploy to Cloud Run with sensible defaults
#   release  - Build and deploy (convenience command)
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
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-us-central1}"
REPO="${REPO:-frontend}"
SERVICE="${SERVICE:-tea-frontend}"

# Firebase環境変数（.envから読み込み）
NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:-}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-}"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}"
NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID:-}"
NEXT_PUBLIC_BACKEND_BASE="${NEXT_PUBLIC_BACKEND_BASE:-}"

IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${IMAGE:-${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}}"

usage() {
  cat <<USAGE
Usage: scripts/cloud-run.sh <init|build|deploy|release|url|logs>

Env vars:
  PROJECT_ID, REGION, REPO, SERVICE
  NEXT_PUBLIC_FIREBASE_* (Firebase設定)
  NEXT_PUBLIC_BACKEND_BASE (バックエンドURL)
  IMAGE (optional explicit), IMAGE_TAG (optional)

Examples:
  PROJECT_ID=my-proj REGION=us-central1 scripts/cloud-run.sh init
  scripts/cloud-run.sh build
  scripts/cloud-run.sh deploy
  scripts/cloud-run.sh release   # build + deploy (recommended)
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

check_firebase_config() {
  if [[ -z "${NEXT_PUBLIC_FIREBASE_API_KEY}" ]]; then
    echo "Firebase設定が不完全です。.envファイルを確認してください。" >&2
    exit 1
  fi
}

init() {
  ensure_project
  echo "Enabling required APIs..."
  gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

  echo "Ensuring Artifact Registry repo '${REPO}' in ${REGION}..."
  if ! gcloud artifacts repositories describe "${REPO}" --location "${REGION}" >/dev/null 2>&1; then
    gcloud artifacts repositories create "${REPO}" \
      --repository-format=docker \
      --location="${REGION}" \
      --description="tea-frontend" || true
  fi

  echo "Init complete."
}

build() {
  ensure_project
  check_firebase_config
  
  echo "Building image: ${IMAGE}"
  
  # cloudbuild.yamlを動的に生成
  cat > cloudbuild.yaml <<EOF
steps:
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
      - "--build-arg"
      - "NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"
      - "--build-arg"
      - "NEXT_PUBLIC_BACKEND_BASE=${NEXT_PUBLIC_BACKEND_BASE}"
      - "-t"
      - "\$_IMAGE_NAME"
      - "."
  - name: "gcr.io/cloud-builders/docker"
    args: ["push", "\$_IMAGE_NAME"]

substitutions:
  _IMAGE_NAME: "${IMAGE}"

options:
  logging: CLOUD_LOGGING_ONLY
EOF

  gcloud builds submit --config cloudbuild.yaml
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
    --port=3000 \
    --concurrency=80 \
    --cpu=1 --memory=512Mi \
    --timeout=300 \
    --max-instances=10 --min-instances=0
}

release() {
  # Convenience: build then deploy
  build
  deploy
}

url() {
  ensure_project
  gcloud run services describe "${SERVICE}" --region "${REGION}" \
    --format='value(status.url)'
}

logs() {
  ensure_project
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE}" --limit=50 --format="table(timestamp,severity,textPayload)" --project="${PROJECT_ID}"
}

main() {
  need gcloud
  subcmd="${1:-}" || true
  case "${subcmd}" in
    init)   init ;;
    build)  build ;;
    deploy) deploy ;;
    release) release ;;
    url)    url ;;
    logs)   logs ;;
    *) usage; exit 1 ;;
  esac
}

main "$@"
