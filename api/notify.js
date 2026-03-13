// Vercel Serverless Function — envoie une notification push à tous les abonnés
import webpush from 'web-push';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_KEY = process.env.ADMIN_KEY || 'focusadmin2026';
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vérification clé admin
  if (req.body.adminKey !== ADMIN_KEY) return res.status(403).json({ error: 'Unauthorized' });

  const { title, body, url } = req.body;
  const payload = JSON.stringify({ title, body, url: url || '/card.html' });

  try {
    const subs = await getSubscriptions();
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub, payload))
    );
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    return res.status(200).json({ success: true, sent, failed, total: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
