# Tea Frontend

第 3 回 AI Agent Hackathon with Google Cloud 用 Web アプリケーションのフロントエンド

## 🏗️ プロジェクト構成

### フレームワーク・ライブラリ

- **Next.js 15.5.3** - React フレームワーク
- **React 19.1.0** - UI ライブラリ
- **TypeScript 5** - 型安全性のための言語
- **Tailwind CSS 4** - ユーティリティファースト CSS フレームワーク
- **Lucide React 0.544.0** - アイコンライブラリ

### 開発環境

- **ESLint 9** - コード品質とフォーマット
- **PostCSS** - CSS 処理
- **Turbopack** - 高速バンドラー（Next.js 内蔵）

## 📁 ディレクトリ構造

```
frontend/
├── src/
│   └── app/                    # App Router（Next.js 13+）
│       ├── favicon.ico         # ファビコン
│       ├── globals.css         # グローバルスタイル
│       ├── layout.tsx          # ルートレイアウト
│       └── page.tsx            # ホームページ
├── public/                     # 静的ファイル
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── package.json                # 依存関係とスクリプト
├── tsconfig.json              # TypeScript設定
├── next.config.ts             # Next.js設定
├── postcss.config.mjs         # PostCSS設定
├── eslint.config.mjs          # ESLint設定
└── README.md                  # このファイル
```

## 🚀 開発環境のセットアップ

### 前提条件

- Node.js 18.18.0 以上
- npm 9 以上

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動（Turbopack使用）
npm run build    # 本番用ビルド（Turbopack使用）
npm run start    # 本番サーバー起動
npm run lint     # ESLintによるコード検査
```

## 🛠️ 技術的な特徴

### Next.js App Router

- ファイルベースルーティング
- サーバーコンポーネントとクライアントコンポーネントの混在
- 自動コード分割

### Tailwind CSS

- ユーティリティファーストのアプローチ
- カスタマイズ可能なデザインシステム
- レスポンシブデザインの簡単実装

### Lucide React

- 豊富なアイコンセット
- TypeScript 完全対応
- カスタマイズ可能（サイズ、色、ストローク幅）

### TypeScript

- 型安全性によるバグの早期発見
- 優れた IDE 支援
- 自動補完とリファクタリング

## 🎨 アイコンの使用例

```tsx
import { Home, User, Settings, Search } from "lucide-react";

export default function IconExample() {
  return (
    <div className="flex gap-4">
      <Home size={24} />
      <User size={24} color="#3b82f6" />
      <Settings size={24} strokeWidth={1.5} />
      <Search size={24} className="text-gray-600" />
    </div>
  );
}
```

## 🔧 設定ファイル

### next.config.ts

Next.js の設定ファイル。Turbopack の有効化などの設定を含む。

### tsconfig.json

TypeScript の設定ファイル。パスエイリアス、厳密性の設定を含む。

### eslint.config.mjs

ESLint の設定ファイル。Next.js 推奨ルールとカスタムルールを設定。

### postcss.config.mjs

PostCSS の設定ファイル。Tailwind CSS の処理を設定。

## 📝 開発ガイドライン

### コンポーネント設計

- できるだけ細かくコンポーネントを分割する
- 単一責任の原則に従う
- TypeScript を活用した型安全性の確保

### スタイリング

- Tailwind CSS を優先的に使用
- カスタム CSS は globals.css に追加
- レスポンシブデザインを考慮

### ファイル命名規則

- コンポーネント: PascalCase (例: `UserProfile.tsx`)
- ユーティリティ: camelCase (例: `formatDate.ts`)
- 定数: UPPER_SNAKE_CASE (例: `API_ENDPOINTS.ts`)

## 🌐 デプロイ

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
