const webpush = require('web-push');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY || 'focusvivant2026';
const REPO = 'enixlab/focus-systeme-complet';
const FILE_PATH = 'subscriptions.json';

webpush.setVapidDetails(
  'mailto:enix.lab.ai@gmail.com',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

async function getSubscriptions() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'FocusCard' }
  });
  if (res.status === 404) return [];
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString());
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.body.adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { title, body, url } = req.body;
  const payload = JSON.stringify({
    title: title || '🔴 LIVE EN COURS — Mentalité Focus',
    body: body || 'Un live vient de démarrer. Ouvre ta carte.',
    url: url || '/card.html'
  });

  try {
    const subs = await getSubscriptions();
    if (subs.length === 0) return res.status(200).json({ success: true, sent: 0, message: 'Aucun abonné' });

    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub, payload).catch(e => { throw e; }))
    );
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    return res.status(200).json({ success: true, sent, failed, total: subs.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
