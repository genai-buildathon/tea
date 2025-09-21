import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  ChatSummaryData,
  CreateSummaryRequest,
  SummaryListItem,
  SummaryKeyEvent,
} from "@/types/summary";

const COLLECTION_NAME = "chatSummaries";
const STORAGE_PATH = "summary-frame-images";

/**
 * Base64画像データをFirebase Storageにアップロードする関数
 */
const uploadFrameImage = async (
  userId: string,
  sessionId: string,
  base64Data: string
): Promise<string> => {
  try {
    // Base64データをBlobに変換
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // ファイル名を生成（ユーザーID_セッションID_タイムスタンプ.jpg）
    const timestamp = Date.now();
    const fileName = `${userId}_${sessionId}_${timestamp}.jpg`;
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);

    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, blob);

    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("画像アップロードエラー:", error);
    throw new Error("画像のアップロードに失敗しました");
  }
};

/**
 * Firebase Storageから画像を削除する関数
 */
const deleteFrameImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("画像削除エラー:", error);
    // 画像削除の失敗は致命的ではないため、エラーをスローしない
  }
};

/**
 * 要約テキストを構造化データに変換する関数
 */
const parseSummaryText = (rawSummary: string) => {
  const lines = rawSummary
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const structuredData: {
    purpose?: string;
    mainTools?: string;
    scene?: string;
    keyEvents?: SummaryKeyEvent[];
    keywords?: string[];
  } = {};

  let currentSection = "";
  let keyEventOrder = 1;

  for (const line of lines) {
    // 目的/タスクの抽出
    if (line.includes("目的") || line.includes("タスク")) {
      const match = line.match(/(?:目的|タスク)[：:]\s*(.+)/);
      if (match) {
        structuredData.purpose = match[1].trim();
      }
      currentSection = "purpose";
      continue;
    }

    // 主要な道具/対象の抽出
    if (line.includes("主要な道具") || line.includes("対象")) {
      const match = line.match(/主要な道具[／/]対象[：:]\s*(.+)/);
      if (match) {
        structuredData.mainTools = match[1].trim();
      }
      currentSection = "mainTools";
      continue;
    }

    // シーン/設定の抽出
    if (line.includes("シーン") || line.includes("設定")) {
      const match = line.match(/シーン[／/]設定[：:]\s*(.+)/);
      if (match) {
        structuredData.scene = match[1].trim();
      }
      currentSection = "scene";
      continue;
    }

    // キーイベントの抽出
    if (line.includes("キーイベント")) {
      currentSection = "keyEvents";
      structuredData.keyEvents = [];
      continue;
    }

    // 重要キーワードの抽出
    if (line.includes("重要キーワード")) {
      const match = line.match(/重要キーワード[：:]\s*(.+)/);
      if (match) {
        structuredData.keywords = match[1]
          .split(/[,、，]/)
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword);
      }
      currentSection = "keywords";
      continue;
    }

    // キーイベントの項目を処理
    if (currentSection === "keyEvents" && line.match(/^\d+\./)) {
      if (!structuredData.keyEvents) {
        structuredData.keyEvents = [];
      }
      const eventMatch = line.match(/^\d+\.\s*(.+)/);
      if (eventMatch) {
        structuredData.keyEvents.push({
          order: keyEventOrder++,
          description: eventMatch[1].trim(),
        });
      }
    }
  }

  return structuredData;
};

/**
 * チャット要約をFirestoreに保存
 */
export const saveChatSummary = async (
  userId: string,
  request: CreateSummaryRequest
): Promise<string> => {
  try {
    const structuredData = parseSummaryText(request.rawSummary);
    const now = new Date();

    // フレーム画像がある場合はStorageにアップロード
    let frameImageUrl: string | undefined;
    if (request.frameImageBase64) {
      frameImageUrl = await uploadFrameImage(
        userId,
        request.sessionId,
        request.frameImageBase64
      );
    }

    const summaryData: Omit<ChatSummaryData, "id"> = {
      userId,
      sessionId: request.sessionId,
      createdAt: now,
      updatedAt: now,
      messageCount: request.messageCount,
      purpose: structuredData.purpose,
      mainTools: structuredData.mainTools,
      scene: structuredData.scene,
      keyEvents: structuredData.keyEvents,
      keywords: structuredData.keywords,
      rawSummary: request.rawSummary,
      frameImageUrl,
      structuredData,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...summaryData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return docRef.id;
  } catch (error) {
    console.error("要約保存エラー:", error);
    throw new Error("要約の保存に失敗しました");
  }
};

/**
 * ユーザーの要約一覧を取得
 */
export const getUserSummaries = async (
  userId: string,
  limitCount: number = 20
): Promise<SummaryListItem[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const summaries: SummaryListItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      summaries.push({
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        messageCount: data.messageCount,
        purposeShort: data.purpose?.substring(0, 50),
        topKeywords: data.keywords?.slice(0, 3),
      });
    });

    return summaries;
  } catch (error) {
    console.error("要約一覧取得エラー:", error);
    throw new Error("要約一覧の取得に失敗しました");
  }
};

/**
 * 特定の要約を取得
 */
export const getSummaryById = async (
  summaryId: string
): Promise<ChatSummaryData | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, summaryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      sessionId: data.sessionId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      messageCount: data.messageCount,
      purpose: data.purpose,
      mainTools: data.mainTools,
      scene: data.scene,
      keyEvents: data.keyEvents,
      keywords: data.keywords,
      rawSummary: data.rawSummary,
      frameImageUrl: data.frameImageUrl,
      structuredData: data.structuredData,
    };
  } catch (error) {
    console.error("要約取得エラー:", error);
    throw new Error("要約の取得に失敗しました");
  }
};

/**
 * 要約を更新
 */
export const updateSummary = async (
  summaryId: string,
  updates: Partial<Omit<ChatSummaryData, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, summaryId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("要約更新エラー:", error);
    throw new Error("要約の更新に失敗しました");
  }
};

/**
 * 要約を削除
 */
export const deleteSummary = async (summaryId: string): Promise<void> => {
  try {
    // 削除前に要約データを取得して画像URLを確認
    const summaryData = await getSummaryById(summaryId);

    // Firestoreから要約を削除
    const docRef = doc(db, COLLECTION_NAME, summaryId);
    await deleteDoc(docRef);

    // 関連する画像がある場合は削除
    if (summaryData?.frameImageUrl) {
      await deleteFrameImage(summaryData.frameImageUrl);
    }
  } catch (error) {
    console.error("要約削除エラー:", error);
    throw new Error("要約の削除に失敗しました");
  }
};

/**
 * セッションIDで要約を検索
 */
export const getSummariesBySession = async (
  userId: string,
  sessionId: string
): Promise<ChatSummaryData[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("sessionId", "==", sessionId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const summaries: ChatSummaryData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      summaries.push({
        id: doc.id,
        userId: data.userId,
        sessionId: data.sessionId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        messageCount: data.messageCount,
        purpose: data.purpose,
        mainTools: data.mainTools,
        scene: data.scene,
        keyEvents: data.keyEvents,
        keywords: data.keywords,
        rawSummary: data.rawSummary,
        frameImageUrl: data.frameImageUrl,
        structuredData: data.structuredData,
      });
    });

    return summaries;
  } catch (error) {
    console.error("セッション要約取得エラー:", error);
    throw new Error("セッション要約の取得に失敗しました");
  }
};
