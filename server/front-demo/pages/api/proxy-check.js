export default async function handler(req, res) {
  try {
    const r = await fetch(`${process.env.BACKEND_BASE || 'https://tea-server-760751063280.us-central1.run.app'}/health`);
    const j = await r.json();
    res.status(200).json({ ok: true, backend: j });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

