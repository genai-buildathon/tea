# Cloud Run デプロイ手順（詳細）

このドキュメントは FastAPI + Google ADK バックエンドを Google Cloud Run へデプロイするための詳細手順です。最短手順は `README.md` にも記載しています。

## 1. 前提
- GCP プロジェクト作成済み・課金有効化済み
- ローカルに `gcloud` CLI セットアップ済み（`gcloud auth login`, `gcloud auth application-default login`）
- このリポジトリ直下に `Dockerfile` があり、`uvicorn` で起動可能

## 2. プロジェクト/リージョン
```bash
export PROJECT_ID=<your-project>
export REGION=us-central1
export REPO=backend
export SERVICE=tea-server
```

```bash
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
```

## 3. 必要な API を有効化
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com
```

## 4. Artifact Registry の作成
```bash
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="tea-backend"
```

## 5. ランタイム用サービスアカウント
```bash
gcloud iam service-accounts create tea-run-sa \
  --display-name="Tea Cloud Run SA"

# 必要ロールの付与（最小権限）
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:tea-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:tea-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/aiplatform.user

# Secret Manager を使う場合のみ
# gcloud projects add-iam-policy-binding $PROJECT_ID \
#   --member=serviceAccount:tea-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
#   --role=roles/secretmanager.secretAccessor
```

## 6. ビルド & プッシュ
```bash
export IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/tea-server:$(date +%Y%m%d-%H%M%S)

gcloud builds submit --tag $IMAGE
```

## 7. デプロイ
SSE/WS とインメモリ状態の整合のため、初期は単一インスタンス推奨です。
```bash
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account=tea-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --port=8080 \
  --concurrency=20 \
  --cpu=1 --memory=1Gi \
  --timeout=3600 \
  --max-instances=1 --min-instances=0 \
  --set-env-vars=GOOGLE_GENAI_USE_VERTEXAI=1,GOOGLE_CLOUD_LOCATION=$REGION
```

- 認証が必要な場合は `--no-allow-unauthenticated` にし、呼び出し元に `roles/run.invoker` を付与します。

## 8. 動作確認
```bash
SERVICE_URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')

curl -sS $SERVICE_URL/health
# ブラウザで $SERVICE_URL/docs を開く
```

## 9. ログ/監視
```bash
gcloud run services logs tail $SERVICE --region $REGION
```

## 10. 運用に向けた追加検討事項
- ステート外出し：`connection_index`/`_sse_clients`/セッションを Memorystore(REDIS) や Firestore へ
- CORS 設定：フロント別オリジンの場合は `CORSMiddleware` を追加
- Secret 管理：`.env` は開発専用。Cloud Run/Secret Manager から注入
- スケール：外部ストア移行後に `--max-instances` を増やす
- タイムアウト：ストリーミング用途では `--timeout` を長めに設定
- CI/CD：Cloud Build トリガや GitHub Actions で build/deploy を自動化

## 11. 既知の修正点（本リポジトリ）
- `server/routes/sse.py` の未定義変数 `client_id` を `connection_id` に修正済み
- `.dockerignore` を追加し、`.env` 等がイメージへ含まれないように調整
