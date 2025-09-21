import { storage, db } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirebaseError } from "@/utils/firebaseErrorHandler";

/**
 * 写真データの型定義
 */
export interface PhotoData {
  id?: string;
  userId: string;
  fileName: string;
  fileSize: number;
  downloadURL: string;
  uploadedAt: any; // Firestore timestamp
  sessionId?: string;
  chatMessageId?: string;
  metadata?: {
    width?: number;
    height?: number;
    capturedAt?: Date;
    analysisText?: string;
  };
}

/**
 * Base64データをBlobに変換する関数
 */
const base64ToBlob = (
  base64Data: string,
  contentType: string = "image/jpeg"
): Blob => {
  const byteCharacters = atob(base64Data.split(",")[1] || base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

/**
 * 一意なファイル名を生成する関数
 */
const generateFileName = (
  userId: string,
  extension: string = "jpg"
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  return `photos/${userId}/${timestamp}_${randomId}.${extension}`;
};

/**
 * 写真をFirebase Storageにアップロードする関数
 */
export const uploadPhotoToStorage = async (
  base64Data: string,
  userId: string,
  fileName?: string
): Promise<string> => {
  try {
    // Base64データをBlobに変換
    const blob = base64ToBlob(base64Data);

    // ファイル名を生成（指定されていない場合）
    const finalFileName = fileName || generateFileName(userId);

    // Storage参照を作成
    const storageRef = ref(storage, finalFileName);

    // メタデータを設定（CORS対応）
    const metadata = {
      contentType: "image/jpeg",
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    };

    // ファイルをアップロード（resumableを使用してCORSエラーを回避）
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

    // アップロード完了を待機
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // プログレス処理（必要に応じて）
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`アップロード進行状況: ${progress}%`);
        },
        (error) => {
          console.error("アップロードエラー:", error);
          reject(error);
        },
        () => {
          console.log("アップロード完了");
          resolve();
        }
      );
    });

    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    const errorMessage = handleFirebaseError(error, "写真アップロード");
    throw new Error(errorMessage);
  }
};

/**
 * 写真データをFirestoreに保存する関数
 */
export const savePhotoToDatabase = async (
  photoData: Omit<PhotoData, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "photos"), {
      ...photoData,
      uploadedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    const errorMessage = handleFirebaseError(error, "写真データ保存");
    throw new Error(errorMessage);
  }
};

/**
 * 写真をアップロードしてデータベースに保存する統合関数
 */
export const uploadAndSavePhoto = async (
  base64Data: string,
  userId: string,
  options: {
    sessionId?: string;
    chatMessageId?: string;
    analysisText?: string;
    capturedAt?: Date;
  } = {}
): Promise<{ photoId: string; downloadURL: string }> => {
  try {
    // 1. Storageにアップロード
    const downloadURL = await uploadPhotoToStorage(base64Data, userId);

    // 2. ファイルサイズを計算
    const blob = base64ToBlob(base64Data);
    const fileSize = blob.size;

    // 3. ファイル名を生成
    const fileName = generateFileName(userId);

    // 4. Firestoreに保存
    const photoData: Omit<PhotoData, "id"> = {
      userId,
      fileName,
      fileSize,
      downloadURL,
      sessionId: options.sessionId,
      chatMessageId: options.chatMessageId,
      metadata: {
        capturedAt: options.capturedAt || new Date(),
        analysisText: options.analysisText,
      },
      uploadedAt: new Date(),
    };

    const photoId = await savePhotoToDatabase(photoData);

    return { photoId, downloadURL };
  } catch (error) {
    // エラーが既にハンドリング済みの場合はそのまま再スロー
    if (error instanceof Error) {
      throw error;
    }
    // 未処理のエラーの場合はハンドリング
    const errorMessage = handleFirebaseError(error, "写真アップロード・保存");
    throw new Error(errorMessage);
  }
};

/**
 * チャット用の写真アップロード関数
 */
export const uploadChatPhoto = async (
  base64Data: string,
  userId: string,
  chatMessageId: string,
  sessionId?: string,
  analysisText?: string
): Promise<{ photoId: string; downloadURL: string }> => {
  return uploadAndSavePhoto(base64Data, userId, {
    chatMessageId,
    sessionId,
    analysisText,
    capturedAt: new Date(),
  });
};
