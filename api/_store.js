// Like and copy counters. Upstash Redis (REST) in production; an in-memory stand-in for local development.
// Every write is one atomic Lua script, so concurrent likes and copies never lose counts.

export const LIMITS = {
  actionsPerMinute: 40, // per IP, all actions together
  dayTtl: 9 * 86400, // daily buckets feed the 7-day trending score
  ipLikeTtl: 30 * 86400, // one like per IP per style
  visitorTtl: 400 * 86400, // a visitor's liked set
  copyDedupeTtl: 2 * 86400, // one counted copy per visitor per style per day
};
const P = 'mi:';
export const keys = {
  likes: `${P}likes`,
  copies: `${P}copies`,
  dayLikes: day => `${P}d:${day}:l`,
  dayCopies: day => `${P}d:${day}:c`,
  visitor: v => `${P}v:${v}`,
  ipLike: (ip, id) => `${P}ipl:${ip}:${id}`,
  copyOnce: (v, id, day) => `${P}cp:${v}:${id}:${day}`,
  rate: (ip, minute) => `${P}rl:${ip}:${minute}`,
};

// Shared prelude: KEYS[1] is the rate key, ARGV[1] the limit. Returns -2 when over the limit.
const RATE = `local n = redis.call('INCR', KEYS[1]) if n == 1 then redis.call('EXPIRE', KEYS[1], 90) end if n > tonumber(ARGV[1]) then return {-2, 0} end`;
const LIKE = `${RATE}
if redis.call('SISMEMBER', KEYS[4], ARGV[2]) == 1 then return {0, tonumber(redis.call('HGET', KEYS[2], ARGV[2]) or '0')} end
if not redis.call('SET', KEYS[5], '1', 'NX', 'EX', ARGV[4]) then return {-1, tonumber(redis.call('HGET', KEYS[2], ARGV[2]) or '0')} end
redis.call('SADD', KEYS[4], ARGV[2]) redis.call('EXPIRE', KEYS[4], ARGV[5])
redis.call('HINCRBY', KEYS[3], ARGV[2], 1) redis.call('EXPIRE', KEYS[3], ARGV[3])
return {1, redis.call('HINCRBY', KEYS[2], ARGV[2], 1)}`;
const UNLIKE = `${RATE}
if redis.call('SREM', KEYS[4], ARGV[2]) == 0 then return {0, tonumber(redis.call('HGET', KEYS[2], ARGV[2]) or '0')} end
redis.call('DEL', KEYS[5])
redis.call('HINCRBY', KEYS[3], ARGV[2], -1) redis.call('EXPIRE', KEYS[3], ARGV[3])
local c = redis.call('HINCRBY', KEYS[2], ARGV[2], -1)
if c < 0 then redis.call('HSET', KEYS[2], ARGV[2], 0) c = 0 end
return {1, c}`;
const COPY = `${RATE}
if not redis.call('SET', KEYS[4], '1', 'NX', 'EX', ARGV[4]) then return {0, tonumber(redis.call('HGET', KEYS[2], ARGV[2]) or '0')} end
redis.call('HINCRBY', KEYS[3], ARGV[2], 1) redis.call('EXPIRE', KEYS[3], ARGV[3])
return {1, redis.call('HINCRBY', KEYS[2], ARGV[2], 1)}`;

// The Vercel Upstash integration names its variables <PREFIX>_KV_REST_API_URL / _TOKEN (or KV_... with the
// default prefix); a direct Upstash setup uses UPSTASH_REDIS_REST_URL / _TOKEN. Accept any of them.
export function storeConfig(env = process.env) {
  const pick = suffix => {
    const exact = env[`KV_${suffix}`] || env[`UPSTASH_REDIS_${suffix}`];
    if (exact) return exact;
    const key = Object.keys(env).find(k => k.endsWith(`_KV_${suffix}`) && env[k]);
    return key ? env[key] : undefined;
  };
  const url = pick('REST_API_URL') || env.UPSTASH_REDIS_REST_URL;
  const token = pick('REST_API_TOKEN') || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

function upstashStore({ url, token }, fetchImpl = fetch) {
  const call = async body => {
    const res = await fetchImpl(`${url}/pipeline`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`store ${res.status}`);
    const out = await res.json();
    const failed = out.find(r => r.error);
    if (failed) throw new Error(`store command failed: ${failed.error}`);
    return out.map(r => r.result);
  };
  const toObject = arr => { const o = {}; for (let i = 0; i < (arr?.length ?? 0); i += 2) o[arr[i]] = Number(arr[i + 1]); return o; };
  const run = async (script, k, argv) => {
    const [[code, count]] = await call([['EVAL', script, String(k.length), ...k, ...argv.map(String)]]);
    return { code: Number(code), count: Number(count) };
  };
  return {
    kind: 'upstash',
    async read(days) {
      const out = await call([['HGETALL', keys.likes], ['HGETALL', keys.copies], ...days.flatMap(d => [['HGETALL', keys.dayLikes(d)], ['HGETALL', keys.dayCopies(d)]])]);
      const [likes, copies, ...daily] = out.map(toObject);
      return { likes, copies, days: days.map((d, i) => ({ day: d, likes: daily[i * 2], copies: daily[i * 2 + 1] })) };
    },
    async liked(visitor) { const [ids] = await call([['SMEMBERS', keys.visitor(visitor)]]); return ids ?? []; },
    like: ({ id, visitor, ip, day, minute }) => run(LIKE, [keys.rate(ip, minute), keys.likes, keys.dayLikes(day), keys.visitor(visitor), keys.ipLike(ip, id)], [LIMITS.actionsPerMinute, id, LIMITS.dayTtl, LIMITS.ipLikeTtl, LIMITS.visitorTtl]),
    unlike: ({ id, visitor, ip, day, minute }) => run(UNLIKE, [keys.rate(ip, minute), keys.likes, keys.dayLikes(day), keys.visitor(visitor), keys.ipLike(ip, id)], [LIMITS.actionsPerMinute, id, LIMITS.dayTtl]),
    copy: ({ id, visitor, ip, day, minute }) => run(COPY, [keys.rate(ip, minute), keys.copies, keys.dayCopies(day), keys.copyOnce(visitor, id, day)], [LIMITS.actionsPerMinute, id, LIMITS.dayTtl, LIMITS.copyDedupeTtl]),
  };
}

// Same semantics as the Lua scripts, for local development and the checks. Not for production.
export function memoryStore() {
  const h = new Map(), sets = new Map(), flags = new Set(), rates = new Map();
  const hash = k => { if (!h.has(k)) h.set(k, {}); return h.get(k); };
  const incr = (k, id, by) => { const o = hash(k); o[id] = (o[id] ?? 0) + by; return o[id]; };
  const rate = (ip, minute) => { const k = keys.rate(ip, minute); const n = (rates.get(k) ?? 0) + 1; rates.set(k, n); return n > LIMITS.actionsPerMinute; };
  return {
    kind: 'memory',
    async read(days) { return { likes: { ...hash(keys.likes) }, copies: { ...hash(keys.copies) }, days: days.map(d => ({ day: d, likes: { ...hash(keys.dayLikes(d)) }, copies: { ...hash(keys.dayCopies(d)) } })) }; },
    async liked(visitor) { return [...(sets.get(keys.visitor(visitor)) ?? [])]; },
    async like({ id, visitor, ip, day, minute }) {
      if (rate(ip, minute)) return { code: -2, count: 0 };
      const set = sets.get(keys.visitor(visitor)) ?? new Set(); sets.set(keys.visitor(visitor), set);
      if (set.has(id)) return { code: 0, count: hash(keys.likes)[id] ?? 0 };
      if (flags.has(keys.ipLike(ip, id))) return { code: -1, count: hash(keys.likes)[id] ?? 0 };
      flags.add(keys.ipLike(ip, id)); set.add(id); incr(keys.dayLikes(day), id, 1);
      return { code: 1, count: incr(keys.likes, id, 1) };
    },
    async unlike({ id, visitor, ip, day, minute }) {
      if (rate(ip, minute)) return { code: -2, count: 0 };
      const set = sets.get(keys.visitor(visitor));
      if (!set?.delete(id)) return { code: 0, count: hash(keys.likes)[id] ?? 0 };
      flags.delete(keys.ipLike(ip, id)); incr(keys.dayLikes(day), id, -1);
      const c = Math.max(0, incr(keys.likes, id, -1)); hash(keys.likes)[id] = c;
      return { code: 1, count: c };
    },
    async copy({ id, visitor, ip, day, minute }) {
      if (rate(ip, minute)) return { code: -2, count: 0 };
      const k = keys.copyOnce(visitor, id, day);
      if (flags.has(k)) return { code: 0, count: hash(keys.copies)[id] ?? 0 };
      flags.add(k); incr(keys.dayCopies(day), id, 1);
      return { code: 1, count: incr(keys.copies, id, 1) };
    },
  };
}

let devStore = null;
export function getStore(env = process.env) {
  const config = storeConfig(env);
  if (config) return upstashStore(config);
  if (env.MI_MEMORY_STORE === '1') return (devStore ??= memoryStore());
  return null;
}
export { upstashStore };
