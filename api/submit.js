import { put } from '@vercel/blob';
import { createHmac } from 'node:crypto';

export function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Please complete the form.' };
  if (body.website) return { honeypot: true };
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
  if (!title || title.length > 100 || note.length > 1000 || rawUrl.length > 500) return { error: 'Please enter a title and a valid demo link.' };
  try {
    const url = new URL(rawUrl);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('invalid URL');
    return { title, url: url.href, note };
  } catch { return { error: 'Please enter a valid http or https demo link.' }; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (Number(req.headers['content-length'] || 0) > 5000) return res.status(413).json({ error: 'Submission is too large.' });
  const submission = validateSubmission(req.body);
  if (submission.honeypot) return res.status(200).json({ ok: true });
  if (submission.error) return res.status(400).json({ error: submission.error });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Submissions are temporarily unavailable.' });
  // A stable, secret-keyed per-minute name prevents repeated writes from one client in the same minute.
  const client = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const minute = Math.floor(Date.now() / 60000);
  const digest = createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN).update(`${client}:${minute}`).digest('hex').slice(0, 32);
  try {
    await put(`suggestions/${minute}-${digest}.json`, JSON.stringify({ ...submission, receivedAt: new Date().toISOString() }, null, 2), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (/already exists/i.test(String(error?.message))) return res.status(429).json({ error: 'Please wait a minute before sending another suggestion.' });
    console.error('Submission storage failed');
    return res.status(503).json({ error: 'Could not send your suggestion. Please try again shortly.' });
  }
}
