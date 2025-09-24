/**
 * Firebase エラーハンドリングユーティリティ
 */

export interface FirebaseError {
  code: string;
  message: string;
  customData?: any;
}

/**
 * Firebase Storage エラーを日本語メッセージに変換
 */
export const getStorageErrorMessage = (error: any): string => {
  if (!error?.code) {
    return `不明なエラーが発生しました: ${error?.message || error}`;
  }

  switch (error.code) {
    case "storage/unauthorized":
      return "アップロード権限がありません。ログインしているか確認してください。";

    case "storage/canceled":
      return "アップロードがキャンセルされました。";

    case "storage/unknown":
      return "サーバーで不明なエラーが発生しました。しばらく待ってから再試行してください。";

    case "storage/object-not-found":
      return "ファイルが見つかりません。";

    case "storage/bucket-not-found":
      return "ストレージバケットが見つかりません。Firebase設定を確認してください。";

    case "storage/project-not-found":
      return "プロジェクトが見つかりません。Firebase設定を確認してください。";

    case "storage/quota-exceeded":
      return "ストレージの容量制限を超えています。";

    case "storage/unauthenticated":
      return "認証が必要です。ログインしてください。";

    case "storage/retry-limit-exceeded":
      return "リトライ回数の上限に達しました。しばらく待ってから再試行してください。";

    case "storage/invalid-checksum":
      return "ファイルの整合性チェックに失敗しました。再度アップロードしてください。";

    case "storage/canceled":
      return "アップロードがキャンセルされました。";

    case "storage/invalid-event-name":
      return "イベント名が無効です。";

    case "storage/invalid-url":
      return "URLが無効です。";

    case "storage/invalid-argument":
      return "引数が無効です。";

    case "storage/no-default-bucket":
      return "デフォルトのストレージバケットが設定されていません。";

    case "storage/cannot-slice-blob":
      return "ファイルの処理中にエラーが発生しました。";

    case "storage/server-file-wrong-size":
      return "サーバー上のファイルサイズが一致しません。";

    default:
      return `Firebase Storage エラー (${error.code}): ${error.message}`;
  }
};

/**
 * Firestore エラーを日本語メッセージに変換
 */
export const getFirestoreErrorMessage = (error: any): string => {
  if (!error?.code) {
    return `不明なエラーが発生しました: ${error?.message || error}`;
  }

  switch (error.code) {
    case "permission-denied":
      return "データベースへのアクセス権限がありません。";

    case "unavailable":
      return "データベースサービスが一時的に利用できません。しばらく待ってから再試行してください。";

    case "unauthenticated":
      return "認証が必要です。ログインしてください。";

    case "resource-exhausted":
      return "データベースのクォータを超過しています。";

    case "failed-precondition":
      return "データベースの前提条件が満たされていません。";

    case "aborted":
      return "トランザクションが中断されました。再試行してください。";

    case "out-of-range":
      return "データの範囲が無効です。";

    case "unimplemented":
      return "この操作は実装されていません。";

    case "internal":
      return "データベース内部エラーが発生しました。";

    case "deadline-exceeded":
      return "データベース操作がタイムアウトしました。";

    case "cancelled":
      return "データベース操作がキャンセルされました。";

    default:
      return `Firestore エラー (${error.code}): ${error.message}`;
  }
};

/**
 * 汎用Firebase エラーハンドラー
 */
export const handleFirebaseError = (error: any, operation: string): string => {
  console.error(`Firebase エラー (${operation}):`, error);

  // Storage エラーの場合
  if (error?.code?.startsWith("storage/")) {
    return getStorageErrorMessage(error);
  }

  // Firestore エラーの場合
  if (error?.code && !error.code.startsWith("storage/")) {
    return getFirestoreErrorMessage(error);
  }

  // その他のエラー
  return `${operation}中にエラーが発生しました: ${error?.message || error}`;
};
