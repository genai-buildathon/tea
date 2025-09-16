import { useState } from 'react';

export default function Health() {
  const [res, setRes] = useState('');
  const ping = async () => {
    try {
      const r = await fetch('/api/health');
      const j = await r.json();
      setRes(JSON.stringify(j, null, 2));
    } catch (e) {
      setRes('error: ' + e.message);
    }
  };
  return (
    <div style={{padding: 16}}>
      <h1>/health</h1>
      <button onClick={ping}>Ping</button>
      <pre>{res}</pre>
    </div>
  );
}

