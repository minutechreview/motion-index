// Local preview with working likes and copy counts: serves public/ and /api/stats on an in-memory store.
// Usage: node scripts/dev-server.mjs [port]   (counts reset when the server stops)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import stats from '../api/stats.js';

process.env.MI_MEMORY_STORE ??= '1';
const PORT = Number(process.argv[2] || 53180);
const ROOT = join(process.cwd(), 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.zip': 'application/zip' };

const apiResponse = res => {
  const out = { setHeader: (k, v) => res.setHeader(k, v), status(code) { res.statusCode = code; return out; }, json(data) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return out; } };
  return out;
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/stats') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
    return stats({ method: req.method, headers: req.headers, query: Object.fromEntries(url.searchParams), body }, apiResponse(res));
  }
  const path = normalize(join(ROOT, url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname));
  if (!path.startsWith(ROOT)) { res.statusCode = 403; return res.end('Forbidden'); }
  try {
    const file = await readFile(path);
    res.setHeader('Content-Type', TYPES[extname(path)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(file);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(PORT, () => console.log(`Motion Index dev server on http://localhost:${PORT}`));
