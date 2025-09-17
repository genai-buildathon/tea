ChaAgentArch バックエンド（FastAPI + Google ADK）

概要
- Google ADK + Gemini Live API を用いたマルチエージェント・バックエンドです。
- レジストリとパス切替で 2 つの root agent を提供します:
  - analyze: メインのマルチエージェント（Vision/Tools/Setting/Translator を束ねる Planner）
  - summary: セッション履歴をもとにメタデータを生成するエージェント
- ライブ入出力は WebSocket と SSE をサポート。各ストリームは `connection_id` をキーに管理し、多重接続の衝突を避けます。

アーキテクチャ
- Agents: `server/app_state.py` で `agents = {"analyze": adk.agent.root_agent, "summary": adk.agent_alt.root_agent_alt}` を登録
- Runner: ADK の `Runner.run_live(...)` + `LiveRequestQueue` でユーザーの音声/画像/テキストを Live API に橋渡し
- Coordinator: `server/core/coordinator.py` がキュー処理、音声アクティビティ、移譲後の再送、モード管理を担当
- Sessions: インメモリ `SessionService`（`app_name` を共有し、エージェント間で履歴を再利用）
- Connections: `connection_index[connection_id] -> {user_id, agent_key, session_id}` としてライブ状態を追跡。WS/SSE は `connection_id` を使用

主要エンドポイント
- Health
  - `GET /health` – 動作確認
- Sessions（履歴）
  - `GET /sessions/{user_id}` – ユーザーのセッションID一覧
  - `POST /sessions/{session_id}/metadata` – summary エージェントでメタデータ生成（任意ボディ `{ "hint": "..." }`）
- Connections（WS/SSE の前に作成）
  - `POST /connections/{agent_key}` – ボディ `{ "user_id": "...", "session_id"?: "..." }` ⇒ `{ connection_id, session_id, user_id, agent_key }` を返却
  - agent_key: `analyze` | `summary`
- WebSocket（二方向）
  - `WS /ws/{agent_key}/{connection_id}` – 以下の JSON フレームを送信
    - `{ "type": "video", "data": <Base64JPEG>, "mode"?: "webcam"|... }`
    - `{ "type": "audio", "data": <Base64PCM16LE> }`（16kHz）
    - `{ "type": "text",  "data": "..." }`
    - `{ "type": "mode",  "data": "beginner|intermediate|advanced" }`
  - サーバはモデルのテキスト応答をプレーンテキストで、音声は `{type:"audio",data:<Base64>}` でプッシュ
- SSE（下りストリーム + 上りHTTP）
  - 下り: `GET /sse/{agent_key}/{connection_id}`（text/event-stream）
  - 上り:
    - `POST /sse/{agent_key}/{connection_id}/text`  ボディ `{ "data": "..." }`
    - `POST /sse/{agent_key}/{connection_id}/video` ボディ `{ "data": <Base64JPEG> }`
    - `POST /sse/{agent_key}/{connection_id}/audio` ボディ `{ "data": <Base64PCM16LE> }`
    - `POST /sse/{agent_key}/{connection_id}/mode`  ボディ `{ "data": "beginner|intermediate|advanced" }`

使い方
- 起動
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `python app.py`
- 接続の作成
  - `POST /connections/analyze` に `{ "user_id": "user-123" }` を送る → `connection_id` と `session_id` を保存
- WebSocket を使う場合
  - `ws://localhost:8000/ws/analyze/{connection_id}` へ接続し、上記 JSON でフレーム送信
- SSE を使う場合
  - `GET /sse/analyze/{connection_id}` を開き、対応する `/sse/...` エンドポイントへ text/video/audio/mode を POST
- まとめ（メタデータ生成）
  - 共有の `session_id` に対し `POST /sessions/{session_id}/metadata`

エージェント構成
- Analyze: `adk/agent.py` の Planner を root（`root_agent`）として公開
- Summary: `adk/agent_alt.py` のメタデータ特化 root（`root_agent_alt`）
- 下位エージェント: `adk/vision/*`, `adk/setting/*`, `adk/tools_basic/*`, `adk/tools_analysis/*`, `adk/translator/*`

拡張方法
- 新しい root agent を追加する場合:
  - 例 `adk/agent_xyz.py` に `root_agent_xyz` を定義し、`server/app_state.py` の `agents["xyz"] = root_agent_xyz` として登録
  - 履歴を分けたい場合は `connections` 作成時に別 `session_id` を指定（指定なしは既存を再利用）

環境変数
- `GOOGLE_API_KEY` もしくは `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` を設定
- 音声入出力: `server/config.py` の `ENABLE_AUDIO`（デフォルト off）、音声名は `VOICE_NAME`

注意点
- モードは接続単位（`beginner|intermediate|advanced`）で、ユーザー入力へ付与する指示文に反映
- タブ/デバイスの多重接続は `connection_id` で安全に並行可能
- API仕様は `openapi.yaml` を参照。ブラウザで `GET /docs` から確認できます。

Cloud Run 最短手順（デプロイ）
- 前提: GCP プロジェクト/課金有効化、`gcloud` セットアップ済み
- API 有効化: `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com logging.googleapis.com`
- Artifact Registry 作成: `gcloud artifacts repositories create backend --repository-format=docker --location=us-central1`
- サービスアカウント（例）: `gcloud iam service-accounts create tea-run-sa` を作成し、`roles/artifactregistry.reader` と `roles/aiplatform.user`、必要に応じ `roles/secretmanager.secretAccessor` を付与
- スクリプト利用（推奨）:
  - 初期化: `PROJECT_ID=$PROJECT REGION=us-central1 scripts/cloud-run.sh init`
  - 一発（ビルド→デプロイ）: `scripts/cloud-run.sh release`（デフォルトで `:latest` タグ）
  - ビルドのみ: `scripts/cloud-run.sh build`
  - デプロイのみ: `scripts/cloud-run.sh deploy`
  - 環境変数のみ更新: `scripts/cloud-run.sh set-env`
- 動作確認: `curl https://<SERVICE-URL>/health` と `https://<SERVICE-URL>/docs`

補足と既知の制約
- ストリーミング/接続状態は現状インメモリのため、スケールアウト時は接続確立→WS/SSE が別インスタンスに当たると失敗し得ます。初期は `--max-instances=1` 推奨、将来は Redis/Firestore 等へ移行を検討してください。
- `.env` は本番イメージに含めない想定です（`.dockerignore` 追加済み）。本番値は Cloud Run の環境変数/Secret Manager から注入してください。
- SSE ルートのバグ（未定義 `client_id`）を修正済みです。

より詳しい手順は `docs/deploy-cloud-run.md` を参照してください。
環境変数はイメージへ同梱せず、スクリプトが Cloud Run に設定します（`.env` はローカル開発専用）。
