# お道具アナライザー（Tea Ceremony Tool Analyzer）

第 3 回 AI Agent Hackathon with Google Cloud 用 Web アプリケーション

AI を活用した茶道体験アプリケーション。カメラで茶道具を撮影し、AI エージェントが多言語で茶道の作法や道具について詳しく解説します。

## 🎯 アプリケーション概要

「お道具アナライザー」は、茶道初心者から上級者まで幅広いユーザーを対象とした、AI 駆動の茶道体験アプリケーションです。リアルタイムカメラ分析と AI エージェントによる対話を通じて、茶道の深い世界を探求できます。

### 主要機能

- **🎥 リアルタイムカメラ分析**: カメラで茶道具や所作を撮影し、AI が分析
- **🤖 多言語 AI ガイド**: 日本語、英語、スペイン語での茶道解説
- **📊 レベル別対応**: 初心者・中級者・上級者向けの詳細度調整
- **💬 インタラクティブチャット**: AI エージェントとの自然な対話
- **📱 モバイル対応**: スマートフォンでの使用に最適化
- **📚 履歴管理**: 過去の分析結果やチャット履歴の保存・閲覧
- **🔐 セキュアな認証**: Firebase Authentication（Google 認証）

## 🏗️ 技術スタック

### フロントエンド

- **Next.js 15.5.3** - React フレームワーク（App Router 使用）
- **React 19.1.0** - UI ライブラリ
- **TypeScript 5** - 型安全性のための言語
- **Tailwind CSS 4** - ユーティリティファースト CSS フレームワーク
- **Firebase 12.3.0** - 認証・ストレージ・データベース
- **Lucide React 0.544.0** - アイコンライブラリ

### 開発・デプロイ環境

- **ESLint 9** - コード品質とフォーマット
- **PostCSS** - CSS 処理
- **Turbopack** - 高速バンドラー（Next.js 内蔵）
- **Google Cloud Run** - コンテナベースデプロイ
- **Docker** - コンテナ化

## 📁 プロジェクト構造

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # APIルート
│   │   │   ├── connections/        # AIエージェント接続管理
│   │   │   ├── sessions/           # セッション管理
│   │   │   └── sse/               # Server-Sent Events
│   │   ├── globals.css            # グローバルスタイル
│   │   ├── layout.tsx             # ルートレイアウト
│   │   └── page.tsx               # ホームページ
│   ├── components/                 # Reactコンポーネント
│   │   ├── analyzer/              # カメラ分析関連
│   │   │   ├── AnalysisOverlay.tsx    # 分析結果オーバーレイ
│   │   │   ├── AnalyzerSection.tsx    # アナライザーメインセクション
│   │   │   ├── CameraDisplay.tsx      # カメラ表示・制御
│   │   │   ├── CameraSection.tsx      # カメラセクション
│   │   │   ├── CameraSwitchButton.tsx # カメラ切り替えボタン
│   │   │   └── ChatInterface.tsx      # チャットインターフェース
│   │   ├── auth/                  # 認証関連
│   │   │   ├── AuthSection.tsx        # 認証セクション
│   │   │   └── GoogleLoginButton.tsx  # Googleログインボタン
│   │   ├── chat/                  # チャット機能
│   │   │   ├── ChatSummaryButton.tsx  # チャット要約ボタン
│   │   │   ├── ChatSummaryDisplay.tsx # チャット要約表示
│   │   │   └── PhotoMessage.tsx       # 写真メッセージ
│   │   ├── history/               # 履歴管理
│   │   │   ├── FrameImageDisplay.tsx  # フレーム画像表示
│   │   │   ├── HistorySection.tsx     # 履歴セクション
│   │   │   ├── SummaryDetailModal.tsx # 要約詳細モーダル
│   │   │   ├── SummaryList.tsx        # 要約リスト
│   │   │   └── SummaryListItem.tsx    # 要約リストアイテム
│   │   ├── main/                  # メインレイアウト
│   │   │   ├── Header.tsx             # ヘッダー
│   │   │   ├── Main.tsx               # メインコンテンツ
│   │   │   └── NavBar.tsx             # ナビゲーションバー
│   │   ├── onboarding/            # オンボーディング
│   │   │   ├── ExperienceSelection.tsx # 経験レベル選択
│   │   │   ├── LanguageSelection.tsx   # 言語選択
│   │   │   └── OnboardingFlow.tsx      # オンボーディングフロー
│   │   ├── sidebar/               # サイドバー
│   │   │   ├── LogoutButton.tsx       # ログアウトボタン
│   │   │   ├── ModeSelector.tsx       # モードセレクター
│   │   │   ├── Sidebar.tsx            # サイドバーメイン
│   │   │   └── UserProfile.tsx        # ユーザープロフィール
│   │   └── ui/                    # 汎用UIコンポーネント
│   │       ├── AnalysisOverlayToggleFAB.tsx # 分析オーバーレイトグルFAB
│   │       ├── ChasenLogo.tsx         # 茶筅ロゴ
│   │       ├── ConnectionStatus.tsx   # 接続状態表示
│   │       ├── ErrorNotification.tsx  # エラー通知
│   │       ├── LanguageSelector.tsx   # 言語セレクター
│   │       ├── MenuIcon.tsx           # メニューアイコン
│   │       ├── NavTabItem.tsx         # ナビタブアイテム
│   │       └── SmartRetryButton.tsx   # スマートリトライボタン
│   ├── contexts/                   # React Context
│   │   ├── AdkContext.tsx         # AIエージェント開発キット
│   │   ├── AuthContext.tsx        # 認証
│   │   ├── ChatContext.tsx        # チャット
│   │   ├── LanguageContext.tsx    # 多言語対応
│   │   ├── NavContext.tsx         # ナビゲーション
│   │   ├── OnboardingContext.tsx  # オンボーディング
│   │   └── SidebarContext.tsx     # サイドバー
│   ├── hooks/                     # カスタムフック
│   │   ├── useCamera.ts           # カメラ制御
│   │   ├── useConnection.ts       # 接続管理
│   │   ├── useMetadata.ts         # メタデータ管理
│   │   ├── useSSE.ts             # Server-Sent Events
│   │   └── useWebSocket.ts        # WebSocket通信
│   ├── lib/                       # ライブラリ設定
│   │   └── firebase.ts           # Firebase設定
│   ├── services/                  # サービス層
│   │   ├── connectionPoolService.ts # 接続プール管理
│   │   ├── photoUploadService.ts    # 写真アップロード
│   │   └── summaryService.ts        # 要約サービス
│   ├── types/                     # TypeScript型定義
│   │   ├── onboarding.ts         # オンボーディング型
│   │   └── summary.ts            # 要約型
│   └── utils/                     # ユーティリティ
│       └── firebaseErrorHandler.ts # Firebaseエラーハンドリング
├── public/                        # 静的ファイル
│   ├── chasen.svg                # 茶筅アイコン
│   ├── Tearoom.png              # 茶室背景画像
│   └── ...                      # その他アイコン
├── scripts/                      # デプロイスクリプト
│   └── cloud-run.sh            # Google Cloud Run デプロイ
├── cloudbuild.yaml              # Cloud Build設定
├── cors.json                    # CORS設定
├── Dockerfile                   # Docker設定
├── firebase-setup-guide.md      # Firebase設定ガイド
├── firebase-config.example.txt  # Firebase設定例
└── ...                         # 設定ファイル
```

## 🚀 開発環境のセットアップ

### 前提条件

- **Node.js** 18.18.0 以上
- **npm** 9 以上
- **Firebase プロジェクト** (認証・ストレージ・Firestore 用)
- **Google Cloud プロジェクト** (バックエンド API 用)

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd tea/frontend

# 依存関係のインストール
npm install
```

### 2. Firebase 設定

#### 環境変数の設定

`.env.local` ファイルを作成し、Firebase 設定を追加：

```bash
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# バックエンドAPI URL
NEXT_PUBLIC_BACKEND_BASE=https://your-backend-url
```

### 3. 開発サーバーの起動

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認してください。

## 🛠️ 利用可能なスクリプト

```bash
# 開発
npm run dev      # 開発サーバー起動（Turbopack使用）
npm run build    # 本番用ビルド（Turbopack使用）
npm run start    # 本番サーバー起動
npm run lint     # ESLintによるコード検査
```

## 🌐 デプロイ

### Google Cloud Run へのデプロイ

```bash
# 初期設定（API有効化、Artifact Registry作成）
./scripts/cloud-run.sh init

# ビルド＆プッシュ
./scripts/cloud-run.sh build

# デプロイ
./scripts/cloud-run.sh deploy

# ビルド＆デプロイ（一括実行）
./scripts/cloud-run.sh release

# サービスURL取得
./scripts/cloud-run.sh url

# ログ確認
./scripts/cloud-run.sh logs
```

## 🎨 アプリケーション機能詳細

### カメラ分析機能

- **リアルタイム撮影**: スマートフォンのフロント/バックカメラを使用
- **フレーム送信**: 設定可能な FPS での画像送信
- **分析オーバーレイ**: 撮影画像上に AI 分析結果を表示
- **写真保存**: Firebase Storage への画像アップロード

### AI エージェント機能

- **多言語対応**: 日本語、英語、スペイン語での応答
- **レベル別説明**: ユーザーの経験レベルに応じた詳細度調整
- **リアルタイム通信**: WebSocket と Server-Sent Events による即座の応答
- **コンテキスト保持**: 会話履歴を考慮した自然な対話

### 履歴管理機能

- **チャット履歴**: 過去の対話の保存と閲覧
- **要約機能**: 長い会話の自動要約生成
- **画像管理**: 撮影した写真の整理と表示
- **検索機能**: 過去のセッションから情報を検索

## 🔧 技術的な特徴

### アーキテクチャ

- **モジュラー設計**: 機能ごとに細分化されたコンポーネント構造
- **Context API**: 状態管理の一元化
- **カスタムフック**: ロジックの再利用性向上
- **TypeScript**: 型安全性による開発効率向上

### パフォーマンス最適化

- **Turbopack**: Next.js 15 の高速バンドラー使用
- **Image Optimization**: Next.js Image コンポーネントによる画像最適化
- **Code Splitting**: 自動コード分割による読み込み速度向上
- **Server Components**: サーバーサイドレンダリングによるパフォーマンス向上

### モバイル対応

- **レスポンシブデザイン**: Tailwind CSS による柔軟なレイアウト
- **タッチ操作**: スマートフォンでの使いやすい UI
- **PWA 対応**: プログレッシブ Web アプリケーション機能（将来実装予定）

## 📝 開発ガイドライン

### コンポーネント設計原則

1. **単一責任の原則**: 各コンポーネントは一つの明確な責任を持つ
2. **細分化**: できるだけ小さく、再利用可能なコンポーネントに分割
3. **型安全性**: TypeScript の型システムを最大限活用
4. **アクセシビリティ**: ARIA 属性やキーボードナビゲーションに配慮

### ファイル命名規則

- **コンポーネント**: PascalCase (例: `CameraDisplay.tsx`)
- **フック**: camelCase で`use`プレフィックス (例: `useCamera.ts`)
- **ユーティリティ**: camelCase (例: `firebaseErrorHandler.ts`)
- **型定義**: camelCase (例: `summary.ts`)
- **定数**: UPPER_SNAKE_CASE (例: `API_ENDPOINTS.ts`)

### スタイリング

- **Tailwind CSS 優先**: ユーティリティクラスを積極的に使用
- **カスタム CSS**: 必要に応じて`globals.css`に追加
- **レスポンシブ**: モバイルファーストのアプローチ
- **デザインシステム**: 一貫したカラーパレットとスペーシング

### 状態管理

- **Context API**: グローバル状態の管理
- **カスタムフック**: ロジックの抽象化と再利用
- **ローカル状態**: コンポーネント固有の状態は useState で管理

## 🔒 セキュリティ

### 認証・認可

- **Firebase Authentication**: Google OAuth 2.0 による認証
- **セッション管理**: セキュアなトークンベース認証
- **役割ベースアクセス制御**: ユーザー権限に基づく機能制限

### データ保護

- **HTTPS 通信**: 全ての通信の暗号化
- **CORS 設定**: 適切なクロスオリジンリクエスト制御
- **入力検証**: フロントエンド・バックエンド両方でのデータ検証
- **環境変数**: 機密情報の適切な管理

## 🐛 トラブルシューティング

### よくある問題

1. **Firebase 接続エラー**: 環境変数の設定確認
2. **CORS エラー**: `cors.json`と Firebase 設定の確認
3. **カメラアクセス拒否**: ブラウザの権限設定確認
4. **ビルドエラー**: Node.js バージョンとキャッシュクリア

### デバッグ方法

```bash
# 詳細ログでの開発サーバー起動
DEBUG=* npm run dev

# ビルド時のトラブルシューティング
npm run build -- --debug

# ESLintによる詳細チェック
npm run lint -- --fix
```

**開発チーム**: 第 3 回 AI Agent Hackathon with Google Cloud 参加チーム  
**最終更新**: 2025 年 9 月 23 日
