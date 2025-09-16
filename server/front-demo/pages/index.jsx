import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || 'https://tea-server-760751063280.us-central1.run.app';

export default function Home() {
  const [agent, setAgent] = useState('analyze');
  const [userId, setUserId] = useState('user-local');
  const [sessionId, setSessionId] = useState('');
  const [connection, setConnection] = useState(null);
  const [creating, setCreating] = useState(false);

  const [activeTab, setActiveTab] = useState('ws'); // 'ws' | 'sse'

  const [log, setLog] = useState([]);
  const appendLog = useCallback((msg) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const resetLog = useCallback(() => setLog([]), []);

  const createConnection = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/connections/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, session_id: sessionId || undefined })
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setConnection(data);
      appendLog(`Connection created: ${data.connection_id} (session: ${data.session_id})`);
    } catch (e) {
      console.error(e);
      appendLog(`Error creating connection: ${e.message}`);
    } finally {
      setCreating(false);
    }
  }, [agent, userId, sessionId, appendLog]);

  return (
    <div className="container">
      <h1>ADK Live Test Frontend</h1>

      <section className="card">
        <h2>1. 接続を作成</h2>
        <div className="row">
          <label>agent_key</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="analyze">analyze</option>
            <option value="summary">summary</option>
          </select>
        </div>
        <div className="row">
          <label>user_id</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
        </div>
        <div className="row">
          <label>session_id (optional)</label>
          <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="existing session id" />
        </div>
        <button onClick={createConnection} disabled={creating}>
          {creating ? 'Creating...' : 'Create Connection'}
        </button>
        {connection && (
          <div className="info">
            <div>connection_id: <code>{connection.connection_id}</code></div>
            <div>session_id: <code>{connection.session_id}</code></div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>2. 送受信テスト</h2>
        <div className="tabs">
          <button className={activeTab === 'ws' ? 'active' : ''} onClick={() => setActiveTab('ws')}>WebSocket</button>
          <button className={activeTab === 'sse' ? 'active' : ''} onClick={() => setActiveTab('sse')}>SSE</button>
        </div>
        {activeTab === 'ws' ? (
          <WebSocketPanel agent={agent} conn={connection} appendLog={appendLog} />
        ) : (
          <SSEPanel agent={agent} conn={connection} appendLog={appendLog} />)
        }
      </section>

      {connection && (
        <section className="card">
          <h2>3. メタデータ生成（summary agent）</h2>
          <MetadataPanel sessionId={connection.session_id} appendLog={appendLog} />
        </section>
      )}

      <section className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h2>Log</h2>
          <button onClick={resetLog}>Clear</button>
        </div>
        <pre className="log" aria-live="polite">{log.join('\n')}</pre>
      </section>

      <footer>
        <small>Backend: <code>{BACKEND_BASE}</code></small>
      </footer>
    </div>
  );
}

function WebSocketPanel({ agent, conn, appendLog }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('こんにちは');
  const [mode, setMode] = useState('beginner');
  const [busy, setBusy] = useState(false);

  // Webcam streaming
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [camReady, setCamReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [fps, setFps] = useState(3);
  const [quality, setQuality] = useState(0.6); // JPEG quality 0..1

  const wsUrl = useMemo(() => {
    if (!conn) return '';
    // Derive ws(s) from backend base for flexibility
    const base = (BACKEND_BASE || '').replace(/^http/, 'ws');
    return `${base}/ws/${agent}/${conn.connection_id}`;
  }, [conn, agent]);

  const connect = useCallback(() => {
    if (!wsUrl) return;
    if (wsRef.current) wsRef.current.close();
    appendLog(`WS connecting: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); appendLog('WS opened'); };
    ws.onmessage = (ev) => {
      appendLog(`WS <- ${typeof ev.data === 'string' ? ev.data : '[binary]'}`);
    };
    ws.onerror = (ev) => { appendLog('WS error'); };
    ws.onclose = () => { setConnected(false); appendLog('WS closed'); };
  }, [wsUrl, appendLog]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const sendText = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const payload = { type: 'text', data: text };
    wsRef.current.send(JSON.stringify(payload));
    appendLog(`WS -> text: ${text}`);
  }, [text, appendLog]);

  const sendMode = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const payload = { type: 'mode', data: mode };
    wsRef.current.send(JSON.stringify(payload));
    appendLog(`WS -> mode: ${mode}`);
  }, [mode, appendLog]);

  const sendImage = useCallback(async (file) => {
    if (!file || !wsRef.current || wsRef.current.readyState !== 1) return;
    setBusy(true);
    try {
      const b64 = await fileToBase64(file);
      const base64data = b64.replace(/^data:.*;base64,/, '');
      const payload = { type: 'video', data: base64data, mode: 'upload' };
      wsRef.current.send(JSON.stringify(payload));
      appendLog(`WS -> video frame (${file.name}, ${Math.round(file.size/1024)} KB)`);
    } finally { setBusy(false); }
  }, [appendLog]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamReady(true);
      appendLog('Camera ready');
    } catch (e) {
      appendLog('Camera error: ' + e.message);
    }
  }, [appendLog]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  }, []);

  const captureAndSendFrame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    const video = videoRef.current;
    if (!video) return;
    const canvas = canvasRef.current || (canvasRef.current = document.createElement('canvas'));
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', Math.min(Math.max(quality, 0.1), 0.95));
    const base64data = dataUrl.replace(/^data:.*;base64,/, '');
    const payload = { type: 'video', data: base64data, mode: 'webcam', timestamp: Date.now() };
    wsRef.current.send(JSON.stringify(payload));
  }, [quality]);

  const startStreaming = useCallback(async () => {
    if (!connected) { appendLog('Connect WS first'); return; }
    if (!camReady) await startCamera();
    if (timerRef.current) return;
    const interval = Math.max(1, Math.round(1000 / Math.max(1, fps)));
    timerRef.current = setInterval(captureAndSendFrame, interval);
    setStreaming(true);
    appendLog(`Start webcam WS streaming @ ${fps} fps, q=${quality}`);
  }, [connected, camReady, startCamera, fps, quality, captureAndSendFrame, appendLog]);

  const stopStreaming = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(false);
    appendLog('Stop webcam WS streaming');
  }, [appendLog]);

  useEffect(() => () => {
    // cleanup on unmount
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
  }, [stopCamera]);

  return (
    <div>
      <div className="row">
        <button onClick={connect} disabled={!conn || connected}>Connect WS</button>
        <button onClick={disconnect} disabled={!connected}>Disconnect</button>
      </div>
      <div className="row">
        <label>webcam</label>
        <button onClick={startCamera} disabled={camReady}>Start Camera</button>
        <button onClick={stopCamera} disabled={!camReady}>Stop Camera</button>
      </div>
      <div className="row">
        <video ref={videoRef} playsInline muted autoPlay style={{ width: 320, height: 240, background:'#000', borderRadius:6, border:'1px solid #1b2533' }} />
        <div style={{display:'grid', gap:8}}>
          <div>
            <label style={{marginRight:8}}>fps</label>
            <input type="number" min={1} max={15} value={fps} onChange={e => setFps(Number(e.target.value)||1)} style={{width:80}} />
          </div>
          <div>
            <label style={{marginRight:8}}>jpeg q</label>
            <input type="number" step={0.05} min={0.1} max={0.95} value={quality} onChange={e => setQuality(Number(e.target.value)||0.6)} style={{width:80}} />
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={startStreaming} disabled={!camReady || streaming || !connected}>Start Stream</button>
            <button onClick={stopStreaming} disabled={!streaming}>Stop Stream</button>
          </div>
        </div>
      </div>
      <div className="row">
        <label>text</label>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={sendText} disabled={!connected}>Send</button>
      </div>
      <div className="row">
        <label>mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <button onClick={sendMode} disabled={!connected}>Set</button>
      </div>
      <div className="row">
        <label>video frame (JPEG)</label>
        <input type="file" accept="image/jpeg,image/jpg" onChange={(e) => sendImage(e.target.files?.[0])} disabled={!connected || busy} />
      </div>
    </div>
  );
}

function SSEPanel({ agent, conn, appendLog }) {
  const esRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('こんにちは');
  const [mode, setMode] = useState('beginner');
  const [busy, setBusy] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camReady, setCamReady] = useState(false);
  const [sending, setSending] = useState(false);

  const ssePath = useMemo(() => {
    if (!conn) return '';
    // Use Next rewrite proxy: /api/sse -> remote
    return `/api/sse/${agent}/${conn.connection_id}`;
  }, [conn, agent]);

  const openSse = useCallback(() => {
    if (!ssePath) return;
    if (esRef.current) esRef.current.close();
    appendLog(`SSE connecting: ${ssePath}`);
    const es = new EventSource(ssePath);
    esRef.current = es;
    es.onopen = () => { setConnected(true); appendLog('SSE opened'); };
    es.onmessage = (ev) => { appendLog(`SSE <- ${ev.data}`); };
    es.addEventListener('ready', () => appendLog('SSE ready'));
    es.addEventListener('ping', () => appendLog('SSE ping'));
    es.onerror = () => { appendLog('SSE error'); };
  }, [ssePath, appendLog]);

  const closeSse = useCallback(() => {
    esRef.current?.close();
    setConnected(false);
    appendLog('SSE closed');
  }, [appendLog]);

  const postJson = useCallback(async (path, body) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
    return res.json().catch(() => ({}));
  }, []);

  const sendText = useCallback(async () => {
    if (!conn) return;
    try {
      await postJson(`/api/sse/${agent}/${conn.connection_id}/text`, { data: text });
      appendLog(`SSE -> text: ${text}`);
    } catch (e) { appendLog(`SSE text error: ${e.message}`); }
  }, [agent, conn, text, postJson, appendLog]);

  const setModeReq = useCallback(async () => {
    if (!conn) return;
    try {
      await postJson(`/api/sse/${agent}/${conn.connection_id}/mode`, { data: mode });
      appendLog(`SSE -> mode: ${mode}`);
    } catch (e) { appendLog(`SSE mode error: ${e.message}`); }
  }, [agent, conn, mode, postJson, appendLog]);

  const sendImage = useCallback(async (file) => {
    if (!conn || !file) return;
    setBusy(true);
    try {
      const b64 = await fileToBase64(file);
      const base64data = b64.replace(/^data:.*;base64,/, '');
      await postJson(`/api/sse/${agent}/${conn.connection_id}/video`, { data: base64data });
      appendLog(`SSE -> video frame (${file.name}, ${Math.round(file.size/1024)} KB)`);
    } catch (e) {
      appendLog(`SSE video error: ${e.message}`);
    } finally { setBusy(false); }
  }, [agent, conn, postJson, appendLog]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamReady(true);
      appendLog('Camera ready');
    } catch (e) {
      appendLog('Camera error: ' + e.message);
    }
  }, [appendLog]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  }, []);

  const sendCurrentFrame = useCallback(async () => {
    if (!conn || !camReady) return;
    setSending(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || (canvasRef.current = document.createElement('canvas'));
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64data = dataUrl.replace(/^data:.*;base64,/, '');
      await postJson(`/api/sse/${agent}/${conn.connection_id}/video`, { data: base64data });
      appendLog('SSE -> current webcam frame');
    } catch (e) {
      appendLog('SSE webcam frame error: ' + e.message);
    } finally {
      setSending(false);
    }
  }, [conn, camReady, agent, postJson, appendLog]);

  useEffect(() => () => {
    if (streamRef.current) stopCamera();
  }, [stopCamera]);

  return (
    <div>
      <div className="row">
        <button onClick={openSse} disabled={!conn || connected}>Open SSE</button>
        <button onClick={closeSse} disabled={!connected}>Close SSE</button>
      </div>
      <div className="row">
        <label>webcam</label>
        <button onClick={startCamera} disabled={camReady}>Start Camera</button>
        <button onClick={stopCamera} disabled={!camReady}>Stop Camera</button>
        <button onClick={sendCurrentFrame} disabled={!camReady || !conn || sending}>Send Frame</button>
      </div>
      <div className="row">
        <video ref={videoRef} playsInline muted autoPlay style={{ width: 320, height: 240, background:'#000', borderRadius:6, border:'1px solid #1b2533' }} />
      </div>
      <div className="row">
        <label>text</label>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={sendText} disabled={!conn}>Send</button>
      </div>
      <div className="row">
        <label>mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <button onClick={setModeReq} disabled={!conn}>Set</button>
      </div>
      <div className="row">
        <label>video frame (JPEG)</label>
        <input type="file" accept="image/jpeg,image/jpg" onChange={(e) => sendImage(e.target.files?.[0])} disabled={!conn || busy} />
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MetadataPanel({ sessionId, appendLog }) {
  const [hint, setHint] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hint ? { hint } : {})
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data.metadata || JSON.stringify(data));
      appendLog('Metadata generated');
    } catch (e) {
      setResult('error: ' + e.message);
      appendLog('Metadata error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, hint, appendLog]);

  return (
    <div>
      <div className="row">
        <label>session_id</label>
        <code>{sessionId}</code>
      </div>
      <div className="row">
        <label>hint (任意)</label>
        <input value={hint} onChange={e => setHint(e.target.value)} placeholder="要約に加えるヒント" />
        <button onClick={generate} disabled={loading}>Generate</button>
      </div>
      <div className="row">
        <label>metadata</label>
      </div>
      <pre className="log" style={{height:160}}>{result}</pre>
    </div>
  );
}
