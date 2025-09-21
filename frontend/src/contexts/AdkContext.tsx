"use client";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";

// バックエンドサーバーのベースURL
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  "https://tea-server-760751063280.us-central1.run.app";

export interface Connection {
  connection_id: string;
  session_id: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  photoUrl?: string;
  photoId?: string;
}

export interface AdkTestContextType {
  // 基本設定
  agent: string;
  setAgent: (agent: string) => void;
  userId: string;
  setUserId: (userId: string) => void;
  sessionId: string;
  setSessionId: (sessionId: string) => void;

  // 接続情報
  connection: Connection | null;
  setConnection: (connection: Connection | null) => void;
  creating: boolean;
  setCreating: (creating: boolean) => void;

  // タブ管理
  activeTab: "ws" | "sse";
  setActiveTab: (tab: "ws" | "sse") => void;

  // ログ機能
  log: string[];
  appendLog: (msg: string) => void;
  resetLog: () => void;

  // WebSocket関連
  wsRef: React.MutableRefObject<WebSocket | null>;
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // SSE関連
  esRef: React.MutableRefObject<EventSource | null>;
  sseConnected: boolean;
  setSseConnected: (connected: boolean) => void;

  // メッセージ送信用
  text: string;
  setText: (text: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;

  // カメラ関連
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  camReady: boolean;
  setCamReady: (ready: boolean) => void;
  streaming: boolean;
  setStreaming: (streaming: boolean) => void;
  fps: number;
  setFps: (fps: number) => void;
  quality: number;
  setQuality: (quality: number) => void;
  sending: boolean;
  setSending: (sending: boolean) => void;

  // メタデータ関連
  hint: string;
  setHint: (hint: string) => void;
  metadataResult: string;
  setMetadataResult: (result: string) => void;
  metadataLoading: boolean;
  setMetadataLoading: (loading: boolean) => void;

  // 解説テキスト関連
  analysisText: string;
  setAnalysisText: (text: string) => void;
  showAnalysisOverlay: boolean;
  setShowAnalysisOverlay: (show: boolean) => void;
  sentFrameImage: string | null;
  setSentFrameImage: (image: string | null) => void;

  // チャット関連
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;

  // エラー管理
  lastError: string | null;
  setLastError: (error: string | null) => void;

  // 再試行管理
  retryCount: number;
  setRetryCount: (count: number) => void;
  lastRetryTime: number;
  setLastRetryTime: (time: number) => void;

  // ユーティリティ
  backendBase: string;
}

const AdkTestContext = createContext<AdkTestContextType | undefined>(undefined);

export const useAdkTest = () => {
  const context = useContext(AdkTestContext);
  if (context === undefined) {
    throw new Error("useAdkTest must be used within an AdkTestProvider");
  }
  return context;
};

interface AdkTestProviderProps {
  children: ReactNode;
}

export const AdkTestProvider: React.FC<AdkTestProviderProps> = ({
  children,
}) => {
  // 基本設定
  const [agent, setAgent] = useState("analyze");
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");

  // 接続情報
  const [connection, setConnection] = useState<Connection | null>(null);
  const [creating, setCreating] = useState(false);

  // タブ管理
  const [activeTab, setActiveTab] = useState<"ws" | "sse">("ws");

  // ログ機能
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((msg: string) => {
    const logMessage = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLog((prev) => [...prev, logMessage]);
    console.log(logMessage);
  }, []);

  const resetLog = useCallback(() => setLog([]), []);

  // WebSocket関連
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // SSE関連
  const esRef = useRef<EventSource | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  // メッセージ送信用
  const [text, setText] = useState("こんにちは");
  const [mode, setMode] = useState("beginner");
  const [busy, setBusy] = useState(false);

  // カメラ関連
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [fps, setFps] = useState(3);
  const [quality, setQuality] = useState(0.6);
  const [sending, setSending] = useState(false);

  // メタデータ関連
  const [hint, setHint] = useState("");
  const [metadataResult, setMetadataResult] = useState("");
  const [metadataLoading, setMetadataLoading] = useState(false);

  // 解説テキスト関連
  const [analysisText, setAnalysisText] = useState("");
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(false);
  const [sentFrameImage, setSentFrameImage] = useState<string | null>(null);

  // チャット関連
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatHistory((prev) => [...prev, message]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  // エラー管理
  const [lastError, setLastError] = useState<string | null>(null);

  // 再試行管理
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState(0);

  const value: AdkTestContextType = {
    // 基本設定
    agent,
    setAgent,
    userId,
    setUserId,
    sessionId,
    setSessionId,

    // 接続情報
    connection,
    setConnection,
    creating,
    setCreating,

    // タブ管理
    activeTab,
    setActiveTab,

    // ログ機能
    log,
    appendLog,
    resetLog,

    // WebSocket関連
    wsRef,
    connected,
    setConnected,

    // SSE関連
    esRef,
    sseConnected,
    setSseConnected,

    // メッセージ送信用
    text,
    setText,
    mode,
    setMode,
    busy,
    setBusy,

    // カメラ関連
    videoRef,
    canvasRef,
    streamRef,
    timerRef,
    camReady,
    setCamReady,
    streaming,
    setStreaming,
    fps,
    setFps,
    quality,
    setQuality,
    sending,
    setSending,

    // メタデータ関連
    hint,
    setHint,
    metadataResult,
    setMetadataResult,
    metadataLoading,
    setMetadataLoading,

    // 解説テキスト関連
    analysisText,
    setAnalysisText,
    showAnalysisOverlay,
    setShowAnalysisOverlay,
    sentFrameImage,
    setSentFrameImage,

    // チャット関連
    chatHistory,
    addChatMessage,
    clearChatHistory,

    // エラー管理
    lastError,
    setLastError,

    // 再試行管理
    retryCount,
    setRetryCount,
    lastRetryTime,
    setLastRetryTime,

    // ユーティリティ
    backendBase: BACKEND_BASE,
  };

  return (
    <AdkTestContext.Provider value={value}>{children}</AdkTestContext.Provider>
  );
};
