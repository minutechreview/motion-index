// /api/stats: public like and copy counts, the 7-day trending score, and like/copy actions.
// GET            -> { available, likes, copies, trending }  (edge-cached briefly)
// GET ?liked=V   -> { liked: [ids] } for visitor V             (never cached)
// POST {action: 'like'|'unlike'|'copy', id, visitor} -> { ok, id, likes|copies, liked }
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import { getStore, storeConfig } from './_store.js';

const TRENDING_DAYS = 7;
const LIKE_WEIGHT = 3;
const VISITOR = /^[a-f0-9]{32}$/;
const ACTIONS = new Set(['like', 'unlike', 'copy']);
let catalogIds = null;
const knownIds = () => (catalogIds ??= new Set(JSON.parse(readFileSync(join(process.cwd(), 'public/catalog.json'), 'utf8')).entries.map(e => e.id)));

export const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
export const lastDays = (now, n = TRENDING_DAYS) => Array.from({ length: n }, (_, i) => dayOf(now - i * 86400000));

// Each of the last 7 days counts likes x3 plus copies, weighted from 1 (today) down to 1/7.
export function trendingScores(days) {
  const scores = {};
  days.forEach(({ likes = {}, copies = {} }, i) => {
    const weight = (days.length - i) / days.length;
    for (const [id, n] of Object.entries(likes)) scores[id] = (scores[id] ?? 0) + Math.max(0, n) * LIKE_WEIGHT * weight;
    for (const [id, n] of Object.entries(copies)) scores[id] = (scores[id] ?? 0) + Math.max(0, n) * weight;
  });
  for (const id of Object.keys(scores)) scores[id] = Math.round(scores[id] * 10) / 10;
  return scores;
}

export function validateAction(body, ids) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Bad request.' };
  const { action, id, visitor } = body;
  if (!ACTIONS.has(action)) return { error: 'Unknown action.' };
  if (typeof id !== 'string' || !ids.has(id)) return { error: 'Unknown style.' };
  if (typeof visitor !== 'string' || !VISITOR.test(visitor)) return { error: 'Bad visitor id.' };
  return { action, id, visitor };
}

// Writes must come from the site itself (production domain, its Vercel previews, or local development).
export function allowedOrigin(headers) {
  const origin = headers.origin;
  if (!origin) return headers['sec-fetch-site'] === 'same-origin';
  try {
    const { hostname, host } = new URL(origin);
    return host === headers.host || hostname === 'motion.minutechbuilds.com' || /^motion-index-library[a-z0-9-]*\.vercel\.app$/.test(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
  } catch { return false; }
}

const clientIp = headers => String(headers['x-vercel-forwarded-for'] || headers['x-forwarded-for'] || headers['x-real-ip'] || 'local').split(',')[0].trim();
const hashIp = (ip, secret) => createHmac('sha256', secret).update(ip).digest('hex').slice(0, 24);

export default async function handler(req, res) {
  const store = getStore();
  if (req.method === 'GET') {
    if (!store) { res.setHeader('Cache-Control', 'public, s-maxage=60'); return res.status(200).json({ available: false }); }
    const visitor = typeof req.query?.liked === 'string' ? req.query.liked : null;
    try {
      if (visitor !== null) {
        res.setHeader('Cache-Control', 'no-store');
        if (!VISITOR.test(visitor)) return res.status(400).json({ error: 'Bad visitor id.' });
        return res.status(200).json({ liked: await store.liked(visitor) });
      }
      const days = lastDays(Date.now());
      const { likes, copies, days: daily } = await store.read(days);
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).json({ available: true, likes, copies, trending: trendingScores(daily) });
    } catch (error) {
      console.error('Stats read failed', error?.message);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ available: false });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!allowedOrigin(req.headers)) return res.status(403).json({ error: 'Forbidden.' });
  if (Number(req.headers['content-length'] || 0) > 500) return res.status(413).json({ error: 'Too large.' });
  if (!store) return res.status(503).json({ error: 'Likes are not available right now.' });
  const input = validateAction(req.body, knownIds());
  if (input.error) return res.status(400).json({ error: input.error });
  const now = Date.now();
  const secret = storeConfig()?.token || process.env.MI_STATS_SECRET || 'local-development';
  const ctx = { id: input.id, visitor: input.visitor, ip: hashIp(clientIp(req.headers), secret), day: dayOf(now), minute: Math.floor(now / 60000) };
  try {
    const result = await store[input.action](ctx);
    if (result.code === -2) return res.status(429).json({ error: 'Slow down a little.' });
    const field = input.action === 'copy' ? 'copies' : 'likes';
    const liked = input.action === 'copy' ? undefined : input.action === 'like' ? result.code !== -1 : false;
    return res.status(200).json({ ok: true, id: input.id, [field]: result.count, ...(liked === undefined ? {} : { liked }), counted: result.code === 1 });
  } catch (error) {
    console.error('Stats write failed', error?.message);
    return res.status(503).json({ error: 'Could not save that. Try again shortly.' });
  }
}
