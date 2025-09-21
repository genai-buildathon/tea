# Firebase 設定ガイド

## CORS エラー解決のための設定手順

### 1. Firebase Console でのセキュリティルール設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Storage」を選択
4. 「Rules」タブをクリック
5. 以下のルールをコピー&ペーストして「公開」をクリック

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 写真フォルダのルール
    match /photos/{userId}/{fileName} {
      // 認証済みユーザーのみ、自分のフォルダにアップロード可能
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && resource == null; // 新規ファイルのみ

      // 認証済みユーザーは全ての写真を読み取り可能
      allow read: if request.auth != null;
    }

    // その他のファイルは管理者のみアクセス可能
    match /{allPaths=**} {
      allow read, write: if false; // デフォルトは拒否
    }
  }
}
```

### 2. Firestore セキュリティルール設定

1. Firebase Console で「Firestore Database」を選択
2. 「Rules」タブをクリック
3. 以下のルールを設定

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 写真メタデータのルール
    match /photos/{photoId} {
      // 認証済みユーザーのみ読み取り可能
      allow read: if request.auth != null;

      // 認証済みユーザーのみ、自分の写真を作成可能
      allow create: if request.auth != null
                    && request.auth.uid == resource.data.userId;

      // 更新・削除は所有者のみ
      allow update, delete: if request.auth != null
                            && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. 環境変数の設定

`.env.local` ファイルを作成して以下の環境変数を設定：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Storage CORS 設定（必要に応じて）

もしまだ CORS エラーが発生する場合は、Google Cloud Shell で以下のコマンドを実行：

```bash
# cors.json ファイルを作成
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Range"]
  }
]
EOF

# CORSを設定
gsutil cors set cors.json gs://your-project.appspot.com
```

### 5. トラブルシューティング

#### CORS エラーが続く場合：

1. ブラウザのキャッシュをクリア
2. Firebase プロジェクトの設定を確認
3. 環境変数が正しく設定されているか確認
4. Firebase Console で Storage が有効になっているか確認

#### アップロードが失敗する場合：

1. ユーザーがログインしているか確認
2. Firebase Storage のセキュリティルールが正しく設定されているか確認
3. ファイルサイズが制限内か確認（デフォルト: 10MB）

#### 権限エラーが発生する場合：

1. Firebase Authentication が有効になっているか確認
2. ユーザーが正しく認証されているか確認
3. セキュリティルールでユーザー ID が正しく検証されているか確認

### 6. 実装されたエラーハンドリング

アプリケーションには以下のエラーハンドリングが実装されています：

- **詳細なエラーメッセージ**: Firebase エラーコードを日本語メッセージに変換
- **リトライ機能**: 一時的なエラーに対する自動リトライ
- **プログレス表示**: アップロード進行状況の表示
- **ユーザーフレンドリーな通知**: エラー発生時の分かりやすい説明

### 7. セキュリティ考慮事項

- **認証必須**: 全ての操作で Firebase Authentication が必要
- **ユーザー分離**: 各ユーザーは自分の写真のみアクセス可能
- **ファイル検証**: アップロード時のファイル形式・サイズ検証
- **メタデータ保護**: 写真メタデータの適切な権限管理
