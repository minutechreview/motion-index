// check-stats.mjs: likes, copies, trending and the abuse limits, against the in-memory store (no network).
import assert from 'node:assert/strict';
import handler, { trendingScores, validateAction, allowedOrigin, lastDays } from '../api/stats.js';
import { upstashStore, LIMITS } from '../api/_store.js';

process.env.MI_MEMORY_STORE = '1';
for (const k of Object.keys(process.env)) if (/KV_REST_API|UPSTASH_REDIS/.test(k)) delete process.env[k];

const V1 = 'a'.repeat(32), V2 = 'b'.repeat(32), V3 = 'c'.repeat(32);
const call = async ({ method = 'POST', body, query, ip = '1.1.1.1', origin = 'https://motion.minutechbuilds.com' } = {}) => {
  let status = 0, json = null; const headers = {};
  const res = { setHeader: (k, v) => { headers[k] = v; }, status(code) { status = code; return this; }, json(data) { json = data; return this; } };
  await handler({ method, body, query: query ?? {}, headers: { host: 'motion.minutechbuilds.com', origin, 'x-forwarded-for': ip, 'content-length': '80' } }, res);
  return { status, json, headers };
};

// Trending: likes count three times a copy; today outweighs last week.
const days = lastDays(Date.parse('2026-11-09T12:00:00Z'));
assert.equal(days[0], '2026-11-09'); assert.equal(days.length, 7);
const t = trendingScores([{ likes: { a: 1 }, copies: { b: 3 } }, ...Array(5).fill({}), { likes: { c: 5 } }]);
assert.equal(t.a, 3); assert.equal(t.b, 3); assert.ok(t.c < t.a * 5);
assert.equal(trendingScores([{ likes: { a: -2 } }]).a, 0, 'negative day buckets never lower a score below zero');

// Input and origin guards.
const ids = new Set(['hologram']);
assert.ok(validateAction({ action: 'boom', id: 'hologram', visitor: V1 }, ids).error);
assert.ok(validateAction({ action: 'like', id: 'nope', visitor: V1 }, ids).error);
assert.ok(validateAction({ action: 'like', id: 'hologram', visitor: 'short' }, ids).error);
assert.equal(validateAction({ action: 'like', id: 'hologram', visitor: V1 }, ids).id, 'hologram');
assert.ok(allowedOrigin({ origin: 'https://motion.minutechbuilds.com', host: 'x' }));
assert.ok(allowedOrigin({ origin: 'https://motion-index-library-abc123-team.vercel.app', host: 'x' }));
assert.ok(!allowedOrigin({ origin: 'https://evil.example', host: 'motion.minutechbuilds.com' }));
assert.ok(!allowedOrigin({ host: 'x' }), 'a write with no origin and no same-origin fetch header is refused');

// Reads.
let r = await call({ method: 'GET' });
assert.equal(r.status, 200); assert.equal(r.json.available, true);
assert.match(r.headers['Cache-Control'], /s-maxage=60/);

// Likes: one per visitor, one per IP, and unlike gives it back.
r = await call({ body: { action: 'like', id: 'hologram', visitor: V1 } });
assert.deepEqual([r.status, r.json.likes, r.json.liked, r.json.counted], [200, 1, true, true]);
r = await call({ body: { action: 'like', id: 'hologram', visitor: V1 } });
assert.deepEqual([r.json.likes, r.json.liked, r.json.counted], [1, true, false], 'liking twice does not double count');
r = await call({ body: { action: 'like', id: 'hologram', visitor: V2 } });
assert.deepEqual([r.json.likes, r.json.liked], [1, false], 'a second visitor id on the same IP cannot add a like');
r = await call({ body: { action: 'like', id: 'hologram', visitor: V2 }, ip: '2.2.2.2' });
assert.equal(r.json.likes, 2);
r = await call({ method: 'GET', query: { liked: V2 } });
assert.deepEqual(r.json.liked, ['hologram']); assert.equal(r.headers['Cache-Control'], 'no-store');
r = await call({ body: { action: 'unlike', id: 'hologram', visitor: V1 } });
assert.deepEqual([r.json.likes, r.json.liked], [1, false]);
r = await call({ body: { action: 'unlike', id: 'hologram', visitor: V1 } });
assert.equal(r.json.likes, 1, 'unliking twice does not go below the real count');

// Copies: counted once per visitor per style per day.
r = await call({ body: { action: 'copy', id: 'deep-time', visitor: V3 }, ip: '3.3.3.3' });
assert.deepEqual([r.json.copies, r.json.counted], [1, true]);
r = await call({ body: { action: 'copy', id: 'deep-time', visitor: V3 }, ip: '3.3.3.3' });
assert.deepEqual([r.json.copies, r.json.counted], [1, false]);

r = await call({ method: 'GET' });
assert.equal(r.json.likes.hologram, 1); assert.equal(r.json.copies['deep-time'], 1);
assert.ok(r.json.trending.hologram > 0 && r.json.trending['deep-time'] > 0);

// Refusals.
assert.equal((await call({ body: { action: 'like', id: 'hologram', visitor: V1 }, origin: 'https://evil.example' })).status, 403);
assert.equal((await call({ body: { action: 'like', id: 'not-a-style', visitor: V1 } })).status, 400);
assert.equal((await call({ method: 'DELETE' })).status, 405);
let limited = 0;
for (let i = 0; i < LIMITS.actionsPerMinute + 5; i++) if ((await call({ body: { action: 'copy', id: 'hologram', visitor: V1 }, ip: '9.9.9.9' })).status === 429) limited++;
assert.ok(limited >= 5, 'an IP is rate limited past the per-minute cap');

// Upstash adapter: request shape and reply parsing, against a fake REST endpoint.
const sent = [];
const fake = async (url, init) => {
  sent.push({ url, init, body: JSON.parse(init.body) });
  const body = JSON.parse(init.body);
  if (body[0][0] === 'EVAL') return { ok: true, json: async () => [{ result: [1, 7] }] };
  return { ok: true, json: async () => body.map((cmd, i) => ({ result: i === 0 ? ['hologram', '4'] : [] })) };
};
const up = upstashStore({ url: 'https://example.upstash.io', token: 'secret' }, fake);
const read = await up.read(['2026-11-09']);
assert.equal(read.likes.hologram, 4);
assert.equal(sent[0].url, 'https://example.upstash.io/pipeline');
assert.equal(sent[0].init.headers.Authorization, 'Bearer secret');
const liked = await up.like({ id: 'hologram', visitor: V1, ip: 'abc', day: '2026-11-09', minute: 1 });
assert.deepEqual(liked, { code: 1, count: 7 });
assert.equal(sent[1].body[0][0], 'EVAL'); assert.equal(sent[1].body[0][2], '5', 'like touches five keys');
assert.ok(sent[1].body[0].includes('mi:likes'));

console.log('stats checks passed');
