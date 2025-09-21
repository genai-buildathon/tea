/**
 * チャット要約データの型定義
 */

export interface SummaryKeyEvent {
  /** イベントの順序番号 */
  order: number;
  /** イベントの内容 */
  description: string;
}

export interface ChatSummaryData {
  /** 要約ID */
  id: string;
  /** ユーザーID */
  userId: string;
  /** セッションID */
  sessionId: string;
  /** 要約作成日時 */
  createdAt: Date;
  /** 要約更新日時 */
  updatedAt: Date;
  /** 対象メッセージ数 */
  messageCount: number;
  /** 目的/タスク */
  purpose?: string;
  /** 主要な道具/対象 */
  mainTools?: string;
  /** シーン/設定 */
  scene?: string;
  /** キーイベント */
  keyEvents?: SummaryKeyEvent[];
  /** 重要キーワード */
  keywords?: string[];
  /** 生の要約テキスト */
  rawSummary: string;
  /** 構造化された要約データ */
  structuredData?: {
    purpose?: string;
    mainTools?: string;
    scene?: string;
    keyEvents?: SummaryKeyEvent[];
    keywords?: string[];
  };
}

export interface CreateSummaryRequest {
  /** セッションID */
  sessionId: string;
  /** 対象メッセージ数 */
  messageCount: number;
  /** 生の要約テキスト */
  rawSummary: string;
}

export interface SummaryListItem {
  /** 要約ID */
  id: string;
  /** 要約作成日時 */
  createdAt: Date;
  /** 対象メッセージ数 */
  messageCount: number;
  /** 目的/タスク（短縮版） */
  purposeShort?: string;
  /** 重要キーワード（最大3つ） */
  topKeywords?: string[];
}
