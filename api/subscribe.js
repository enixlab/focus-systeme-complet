const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'enixlab/focus-systeme-complet';
const FILE_PATH = 'subscriptions.json';

async function getSubscriptions() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'FocusCard' }
  });
  if (res.status === 404) return { subs: [], sha: null };
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
  return { subs: content, sha: data.sha };
}

async function saveSubscriptions(subs, sha) {
  const content = Buffer.from(JSON.stringify(subs, null, 2)).toString('base64');
  const body = { message: 'Update subscriptions', content };
  if (sha) body.sha = sha;
  await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'FocusCard' },
    body: JSON.stringify(body)
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    const { subs, sha } = await getSubscriptions();
    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push({ ...subscription, createdAt: new Date().toISOString() });
      await saveSubscriptions(subs, sha);
    }
    return res.status(200).json({ success: true, total: subs.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
