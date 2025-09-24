/**
 * SSE接続プール管理サービス
 * 接続の再利用とセッション管理を行う
 */

export interface StoredConnection {
  connection_id: string;
  session_id: string;
  agent: string;
  user_id: string;
  created_at: string;
  last_used: string;
  is_active: boolean;
}

export interface ConnectionPoolEntry {
  connection: StoredConnection;
  eventSource?: EventSource;
  lastActivity: number;
}

const STORAGE_KEY = "tea_connection_pool";
const MAX_POOL_SIZE = 5;
const CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30分

/**
 * ローカルストレージから接続プールを取得
 */
export const getConnectionPool = (): StoredConnection[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const connections: StoredConnection[] = JSON.parse(stored);

    // 期限切れの接続を除外
    const now = Date.now();
    const validConnections = connections.filter((conn) => {
      const lastUsed = new Date(conn.last_used).getTime();
      return now - lastUsed < CONNECTION_TIMEOUT;
    });

    // 有効な接続のみ保存し直す
    if (validConnections.length !== connections.length) {
      saveConnectionPool(validConnections);
    }

    return validConnections;
  } catch (error) {
    console.error("接続プール取得エラー:", error);
    return [];
  }
};

/**
 * ローカルストレージに接続プールを保存
 */
export const saveConnectionPool = (connections: StoredConnection[]): void => {
  try {
    // プールサイズ制限
    const limitedConnections = connections
      .sort(
        (a, b) =>
          new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
      )
      .slice(0, MAX_POOL_SIZE);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedConnections));
  } catch (error) {
    console.error("接続プール保存エラー:", error);
  }
};

/**
 * 接続プールに新しい接続を追加
 */
export const addConnectionToPool = (
  connection: {
    connection_id: string;
    session_id: string;
  },
  agent: string,
  userId: string
): void => {
  const pool = getConnectionPool();

  // 既存の同じ接続があれば更新
  const existingIndex = pool.findIndex(
    (conn) => conn.connection_id === connection.connection_id
  );

  const storedConnection: StoredConnection = {
    connection_id: connection.connection_id,
    session_id: connection.session_id,
    agent,
    user_id: userId,
    created_at:
      existingIndex >= 0
        ? pool[existingIndex].created_at
        : new Date().toISOString(),
    last_used: new Date().toISOString(),
    is_active: true,
  };

  if (existingIndex >= 0) {
    pool[existingIndex] = storedConnection;
  } else {
    pool.push(storedConnection);
  }

  saveConnectionPool(pool);
};

/**
 * 特定のユーザーとエージェントの組み合わせで利用可能な接続を検索
 */
export const findAvailableConnection = (
  agent: string,
  userId: string,
  sessionId?: string
): StoredConnection | null => {
  const pool = getConnectionPool();

  // セッションIDが指定されている場合は完全一致を探す
  if (sessionId) {
    const exactMatch = pool.find(
      (conn) =>
        conn.agent === agent &&
        conn.user_id === userId &&
        conn.session_id === sessionId &&
        conn.is_active
    );
    if (exactMatch) return exactMatch;
  }

  // セッションIDが指定されていない場合は、最新の接続を返す
  const availableConnections = pool
    .filter(
      (conn) =>
        conn.agent === agent && conn.user_id === userId && conn.is_active
    )
    .sort(
      (a, b) =>
        new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
    );

  return availableConnections[0] || null;
};

/**
 * 接続の最終使用時刻を更新
 */
export const updateConnectionActivity = (connectionId: string): void => {
  const pool = getConnectionPool();
  const connectionIndex = pool.findIndex(
    (conn) => conn.connection_id === connectionId
  );

  if (connectionIndex >= 0) {
    pool[connectionIndex].last_used = new Date().toISOString();
    saveConnectionPool(pool);
  }
};

/**
 * 接続を非アクティブにする
 */
export const deactivateConnection = (connectionId: string): void => {
  const pool = getConnectionPool();
  const connectionIndex = pool.findIndex(
    (conn) => conn.connection_id === connectionId
  );

  if (connectionIndex >= 0) {
    pool[connectionIndex].is_active = false;
    pool[connectionIndex].last_used = new Date().toISOString();
    saveConnectionPool(pool);
  }
};

/**
 * 特定の接続をプールから削除
 */
export const removeConnectionFromPool = (connectionId: string): void => {
  const pool = getConnectionPool();
  const filteredPool = pool.filter(
    (conn) => conn.connection_id !== connectionId
  );
  saveConnectionPool(filteredPool);
};

/**
 * ユーザーの全接続をクリア
 */
export const clearUserConnections = (userId: string): void => {
  const pool = getConnectionPool();
  const filteredPool = pool.filter((conn) => conn.user_id !== userId);
  saveConnectionPool(filteredPool);
};

/**
 * 接続プール全体をクリア
 */
export const clearConnectionPool = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * ユーザーの接続統計を取得
 */
export const getConnectionStats = (userId: string) => {
  const pool = getConnectionPool();
  const userConnections = pool.filter((conn) => conn.user_id === userId);

  return {
    total: userConnections.length,
    active: userConnections.filter((conn) => conn.is_active).length,
    agents: [...new Set(userConnections.map((conn) => conn.agent))],
    sessions: [...new Set(userConnections.map((conn) => conn.session_id))],
    oldest:
      userConnections.length > 0
        ? Math.min(
            ...userConnections.map((conn) =>
              new Date(conn.created_at).getTime()
            )
          )
        : null,
    newest:
      userConnections.length > 0
        ? Math.max(
            ...userConnections.map((conn) => new Date(conn.last_used).getTime())
          )
        : null,
  };
};

/**
 * セッション一覧を取得
 */
export const getUserSessions = (userId: string, agent?: string) => {
  const pool = getConnectionPool();
  const userConnections = pool.filter(
    (conn) =>
      conn.user_id === userId &&
      (!agent || conn.agent === agent) &&
      conn.is_active
  );

  // セッションごとにグループ化
  const sessionMap = new Map<string, StoredConnection[]>();
  userConnections.forEach((conn) => {
    const existing = sessionMap.get(conn.session_id) || [];
    existing.push(conn);
    sessionMap.set(conn.session_id, existing);
  });

  return Array.from(sessionMap.entries())
    .map(([sessionId, connections]) => ({
      sessionId,
      connections,
      lastUsed: Math.max(
        ...connections.map((conn) => new Date(conn.last_used).getTime())
      ),
      agents: [...new Set(connections.map((conn) => conn.agent))],
    }))
    .sort((a, b) => b.lastUsed - a.lastUsed);
};
