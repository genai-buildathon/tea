"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ja" | "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// 言語リソース
const translations = {
  ja: {
    // サイドバー
    menu: "メニュー",
    closeSidebar: "サイドバーを閉じる",
    language: "言語",
    // 言語名
    japanese: "日本語",
    english: "English",
    spanish: "Español",
    // ヘッダー
    appTitle: "侘び寂び アナライザー",
    appSubtitle: "Tea Ceremony Tool Analyzer",
    // ナビゲーション
    analyzerTab: "お道具アナライザー",
    historyTab: "保存履歴",
    // モードセレクター
    analysisLevel: "解析レベル",
    beginner: "初心者",
    intermediate: "中級者",
    advanced: "上級者",
    beginnerDesc: "基本的な説明",
    intermediateDesc: "詳細な解説",
    advancedDesc: "専門的な分析",
    selectMode: "モードを選択",
    // チャットインターフェース
    askQuestion: "質問や感想をお聞かせください",
    inputPlaceholder: "質問や感想を入力してください...",
    // 履歴セクション
    loading: "読み込み中...",
    savedHistory: "保存履歴",
    loginRequired: "保存された要約を表示するにはログインが必要です",
    summaryError: "要約エラー:",
    summaryListError: "要約一覧の取得に失敗しました",
    summaryDeleteError: "要約の削除に失敗しました",
    learningHistory: "学習履歴",
    update: "更新",
    searchLearningContent: "学習内容を検索...",
    noSearchResults: "検索結果がありません",
    noLearningHistory: "学習履歴がありません",
    saveChatLearning: "チャットで学んだことを保存すると、ここに表示されます",
    items: "件",
    // 保存関連
    saveLearning: "学んだことを保存する",
    saving: "保存中...",
    saved: "保存済み",
    saveError: "保存エラー",
    summarySavedToFirebase: "学んだことが保存されました",
    // アナライザーセクション
    analyzerDescription:
      "お道具にカメラをかざすだけで、AIが瞬時に名称・由来・季節の取り合わせを解説します。",
    // カメラ機能
    createNewConnection: "新規接続を作成",
    cameraStart: "カメラ開始",
    cameraStop: "カメラ停止",
    sendFrame: "フレーム送信",
    sending: "送信中...",
    waitingSSE: "SSE接続待機中...",
    // ログメッセージ
    chatMessageSent: "チャットメッセージを送信しました",
    photoConditionsNotMet: "写真キャプチャの条件が満たされていません",
    frameCaptureError: "フレームのキャプチャに失敗しました",
    cameraPhoto: "カメラで撮影した写真",
    photoSent: "写真を送信しました",
    noSummaryHistory: "要約対象のチャット履歴がありません",
    sseNotConnected: "SSE接続が確立されていません",
    frameSent: "フレームを送信しました",
    startingNewConnection: "新規接続を開始します...",
    newConnectionCreated: "新規接続を作成しました",
    connected: "接続済み",
    // 共通
    close: "閉じる",
    save: "保存",
    delete: "削除",
    edit: "編集",
    settings: "設定",
    languageCode: "ja-JP",
    copyError: "コピーに失敗しました",
    downloadSummary: "要約をダウンロード",
    summaryDetail: "要約詳細",
    purpose: "目的/タスク",
    mainTools: "主要な道具/対象",
    scene: "シーン/設定",
    keywords: "重要キーワード",
    keyEvents: "キーイベント",
    fullSummary: "完全な要約",
    connecting: "接続を準備中...",
    frameImage: "フレーム画像",
    zoomIn: "拡大",
    zoomOut: "縮小",
    logout: "ログアウト",
    loggingOut: "ログアウト中...",
    logoutError: "ログアウトに失敗しました",
    sentFrame: "送信されたフレーム",
    languageSettingSent: "言語設定を送信しました",
    languageSettingError: "言語設定の送信に失敗しました",
    // オンボーディング
    welcomeToAnalyzer: "Tea Ceremony Analyzerへようこそ",
    selectLanguage: "使用する言語を選択してください",
    teaCeremonyExperience: "茶道の経験レベルを教えてください",
    tailoredExplanations: "あなたに最適な解説レベルを提供します",
    setupComplete: "設定が完了しました！",
    welcomeToTeaCeremony: "茶道の世界へようこそ",
    bestExperience: "あなたの設定に基づいて、最適な体験をお届けします。",
    yourSettings: "あなての設定",
    experienceLevel: "経験レベル:",
    getStarted: "始める",
    continue: "続ける",
    complete: "完了",
    back: "戻る",
    user: "ユーザー",
    assistant: "アシスタント",
    photo: "写真",
    summarizeChatHistory:
      "以下のチャット履歴を要約してください。主要なトピック、質問と回答、重要なポイントを含めて簡潔にまとめてください。",
    chatHistory: "チャット履歴",
    chatSummaryGenerated: "チャット要約を生成しました",
    chatSummaryError: "チャット要約エラー",
    saveSummary: "学んだことを保存する",
    noSummaryTarget: "要約対象なし",
    summarizing: "要約中...",
    summaryCompleted: "要約完了",
    summarizeChatMessages: "チャット履歴を要約します",
    chatSummary: "チャット要約",
  },
  en: {
    // サイドバー
    menu: "Menu",
    closeSidebar: "Close sidebar",
    language: "Language",
    // 言語名
    japanese: "日本語",
    english: "English",
    spanish: "Español",
    // ヘッダー
    appTitle: "WabiSabi Analyzer",
    appSubtitle: "Tea Ceremony Tool Analyzer",
    // ナビゲーション
    analyzerTab: "Tea Tool Analyzer",
    historyTab: "Saved History",
    // モードセレクター
    analysisLevel: "Analysis Level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    beginnerDesc: "Basic explanation",
    intermediateDesc: "Detailed analysis",
    advancedDesc: "Expert analysis",
    selectMode: "Select mode",
    // チャットインターフェース
    askQuestion: "Please share your questions or thoughts",
    inputPlaceholder: "Enter your questions or thoughts...",
    // 履歴セクション
    loading: "Loading...",
    savedHistory: "Saved History",
    loginRequired: "Login required to view saved summaries",
    summaryError: "Summary error:",
    summaryListError: "Failed to get summary list",
    summaryDeleteError: "Failed to delete summary",
    learningHistory: "Learning History",
    update: "Update",
    searchLearningContent: "Search learning content...",
    noSearchResults: "No search results",
    noLearningHistory: "No learning history",
    saveChatLearning: "Save chat learning and it will be displayed here",
    items: "items",
    close: "Close",
    // 保存関連
    saveLearning: "Save What You Learned",
    saving: "Saving...",
    saved: "Saved",
    saveError: "Save Error",
    summarySavedToFirebase: "Your learning has been saved",
    // アナライザーセクション
    analyzerDescription:
      "Simply point your camera at tea ceremony tools, and AI will instantly explain their names, origins, and seasonal combinations.",
    // カメラ機能
    createNewConnection: "Create New Connection",
    cameraStart: "Start Camera",
    cameraStop: "Stop Camera",
    sendFrame: "Send Frame",
    sending: "Sending...",
    waitingSSE: "Waiting for SSE connection...",
    // ログメッセージ
    chatMessageSent: "Chat message sent",
    photoConditionsNotMet: "Photo capture conditions not met",
    frameCaptureError: "Failed to capture frame",
    cameraPhoto: "Camera captured photo",
    photoSent: "Photo sent",
    noSummaryHistory: "No chat history to summarize",
    sseNotConnected: "SSE connection not established",
    frameSent: "Frame sent",
    startingNewConnection: "Starting new connection...",
    newConnectionCreated: "New connection created",
    connected: "Connected",
    // 共通
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    settings: "Settings",
    languageCode: "en-US",
    copyError: "Copy error",
    downloadSummary: "Download summary",
    summaryDetail: "Summary detail",
    purpose: "Purpose",
    mainTools: "Main tools",
    scene: "Scene",
    keywords: "Keywords",
    keyEvents: "Key events",
    fullSummary: "Full summary",
    connecting: "Connecting...",
    frameImage: "Frame Image",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    logout: "Logout",
    loggingOut: "Logging out...",
    logoutError: "Logout failed",
    sentFrame: "Sent Frame",
    languageSettingSent: "Language setting sent",
    languageSettingError: "Language setting error",
    // オンボーディング
    welcomeToAnalyzer: "Welcome to Tea Ceremony Analyzer",
    selectLanguage: "Please select your preferred language",
    teaCeremonyExperience: "What's your tea ceremony experience level?",
    tailoredExplanations: "We'll provide explanations tailored to your level",
    setupComplete: "Setup Complete!",
    welcomeToTeaCeremony: "Welcome to the world of tea ceremony",
    bestExperience:
      "We'll provide you with the best experience based on your preferences.",
    yourSettings: "Your Settings",
    experienceLevel: "Experience:",
    getStarted: "Get Started",
    continue: "Continue",
    complete: "Complete",
    back: "Back",
    user: "User",
    assistant: "Assistant",
    photo: "Photo",
    summarizeChatHistory:
      "Please summarize the following chat history. Include main topics, questions and answers, and important points in a concise manner.",
    chatHistory: "Chat History",
    chatSummaryGenerated: "Chat summary generated",
    chatSummaryError: "Chat summary error",
    saveSummary: "Save summary",
    noSummaryTarget: "No summary target",
    summarizing: "Summarizing...",
    summaryCompleted: "Summary completed",
    summarizeChatMessages: "Summarize chat messages",
    chatSummary: "Chat summary",
  },
  es: {
    // サイドバー
    menu: "Menú",
    closeSidebar: "Cerrar barra lateral",
    language: "Idioma",
    // 言語名
    japanese: "日本語",
    english: "English",
    spanish: "Español",
    // ヘッダー
    appTitle: "WabiSabi Analyzer",
    appSubtitle: "Té Ceremonia Herramientas Analizador",
    // ナビゲーション
    analyzerTab: "Analizador de Herramientas",
    historyTab: "Historial Guardado",
    // モードセレクター
    analysisLevel: "Nivel de Análisis",
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    beginnerDesc: "Explicación básica",
    intermediateDesc: "Análisis detallado",
    advancedDesc: "Análisis experto",
    selectMode: "Seleccionar modo",
    // チャットインターフェース
    askQuestion: "Por favor comparte tus preguntas o pensamientos",
    inputPlaceholder: "Ingresa tus preguntas o pensamientos...",
    // 履歴セクション
    loading: "Cargando...",
    savedHistory: "Historial Guardado",
    loginRequired:
      "Se requiere iniciar sesión para ver los resúmenes guardados",
    summaryError: "Error de resumen:",
    summaryListError: "Error al obtener el listado de resumen",
    summaryDeleteError: "Error al eliminar el resumen",
    learningHistory: "Historial de aprendizaje",
    update: "Actualizar",
    searchLearningContent: "Buscar contenido de aprendizaje...",
    noSearchResults: "No hay resultados de búsqueda",
    noLearningHistory: "No hay historial de aprendizaje",
    saveChatLearning: "Guarda el aprendizaje en el chat y se mostrará aquí",
    items: "items",
    close: "Cerrar",
    // 保存関連
    saveLearning: "Guardar lo que Aprendiste",
    saving: "Guardando...",
    saved: "Guardado",
    saveError: "Error al Guardar",
    summarySavedToFirebase: "Tu aprendizaje ha sido guardado",
    // アナライザーセクション
    analyzerDescription:
      "Simplemente apunta tu cámara a las herramientas de la ceremonia del té, y la IA explicará instantáneamente sus nombres, orígenes y combinaciones estacionales.",
    // カメラ機能
    createNewConnection: "Crear Nueva Conexión",
    cameraStart: "Iniciar Cámara",
    cameraStop: "Detener Cámara",
    sendFrame: "Enviar Marco",
    sending: "Enviando...",
    waitingSSE: "Esperando conexión SSE...",
    // ログメッセージ
    chatMessageSent: "Mensaje de chat enviado",
    photoConditionsNotMet: "Condiciones de captura de foto no cumplidas",
    frameCaptureError: "Error al capturar marco",
    cameraPhoto: "Foto capturada por cámara",
    photoSent: "Foto enviada",
    noSummaryHistory: "No hay historial de chat para resumir",
    sseNotConnected: "Conexión SSE no establecida",
    frameSent: "Marco enviado",
    startingNewConnection: "Iniciando nueva conexión...",
    newConnectionCreated: "Nueva conexión creada",
    connected: "Conectado",
    // 共通
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    settings: "Configuración",
    languageCode: "es-ES",
    copyError: "Error al copiar",
    downloadSummary: "Descargar resumen",
    summaryDetail: "Detalle del resumen",
    purpose: "Propósito",
    mainTools: "Herramientas principales",
    scene: "Escenario",
    keywords: "Palabras clave",
    keyEvents: "Eventos clave",
    fullSummary: "Resumen completo",
    connecting: "Conectando...",
    frameImage: "Imagen del Marco",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    logout: "Cerrar sesión",
    loggingOut: "Cerrando sesión...",
    logoutError: "Error al cerrar sesión",
    sentFrame: "Marco Enviado",
    languageSettingSent: "Configuración de idioma enviada",
    languageSettingError: "Error de configuración de idioma",
    // オンボーディング
    welcomeToAnalyzer: "Bienvenido al Analizador de Ceremonia del Té",
    selectLanguage: "Por favor selecciona tu idioma preferido",
    teaCeremonyExperience:
      "¿Cuál es tu nivel de experiencia en la ceremonia del té?",
    tailoredExplanations: "Proporcionaremos explicaciones adaptadas a tu nivel",
    setupComplete: "¡Configuración Completa!",
    welcomeToTeaCeremony: "Bienvenido al mundo de la ceremonia del té",
    bestExperience:
      "Te proporcionaremos la mejor experiencia basada en tus preferencias.",
    yourSettings: "Tu Configuración",
    experienceLevel: "Experiencia:",
    getStarted: "Comenzar",
    continue: "Continuar",
    complete: "Completar",
    back: "Atrás",
    user: "Usuario",
    assistant: "Asistente",
    photo: "Foto",
    summarizeChatHistory:
      "Por favor resume el siguiente historial de chat. Incluye temas principales, preguntas y respuestas, y puntos importantes en una forma concisa.",
    chatHistory: "Historial de chat",
    chatSummaryGenerated: "Resumen de chat generado",
    chatSummaryError: "Error de resumen de chat",
    saveSummary: "Guardar resumen",
    noSummaryTarget: "No hay objetivo de resumen",
    summarizing: "Resumiendo...",
    summaryCompleted: "Resumen completado",
    summarizeChatMessages: "Resumir mensajes de chat",
    chatSummary: "Resumen de chat",
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("ja");

  // ローカルストレージから言語設定を読み込み
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && ["ja", "en", "es"].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // 言語変更時にローカルストレージに保存
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  // 翻訳関数
  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
