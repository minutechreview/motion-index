// Likes, copy counts and trending scores from /api/stats. The library works the same if the API is down:
// counts simply stay hidden.
const ENDPOINT = '/api/stats';
const VISITOR_KEY = 'mi-visitor';
const LIKED_KEY = 'mi-liked';

const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode: state lives for this page only */ } };

function visitorId() {
  let id = safeGet(VISITOR_KEY);
  if (!/^[a-f0-9]{32}$/.test(id ?? '')) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    id = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    safeSet(VISITOR_KEY, id);
  }
  return id;
}

export function createCommunity({ onChange, onNotice }) {
  const state = { available: false, likes: {}, copies: {}, trending: {}, liked: new Set(JSON.parse(safeGet(LIKED_KEY) || '[]')) };
  const visitor = visitorId();
  const saveLiked = () => safeSet(LIKED_KEY, JSON.stringify([...state.liked]));
  const post = body => fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, visitor }) });

  async function load() {
    try {
      const res = await fetch(ENDPOINT);
      const data = res.ok ? await res.json() : { available: false };
      if (!data.available) return;
      Object.assign(state, { available: true, likes: data.likes ?? {}, copies: data.copies ?? {}, trending: data.trending ?? {} });
      onChange();
      const mine = await fetch(`${ENDPOINT}?liked=${visitor}`, { cache: 'no-store' });
      if (mine.ok) { state.liked = new Set((await mine.json()).liked ?? []); saveLiked(); onChange(); }
    } catch { /* offline or blocked: keep counts hidden */ }
  }

  async function toggleLike(id) {
    if (!state.available) return;
    const wasLiked = state.liked.has(id);
    const before = state.likes[id] ?? 0;
    // Optimistic: flip now, reconcile with the server's answer.
    wasLiked ? state.liked.delete(id) : state.liked.add(id);
    state.likes[id] = Math.max(0, before + (wasLiked ? -1 : 1));
    onChange(id);
    try {
      const res = await post({ action: wasLiked ? 'unlike' : 'like', id });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save that.');
      state.likes[id] = data.likes;
      data.liked ? state.liked.add(id) : state.liked.delete(id);
      if (!wasLiked && !data.liked) onNotice('Someone on your network already liked this one.');
    } catch (error) {
      wasLiked ? state.liked.add(id) : state.liked.delete(id);
      state.likes[id] = before;
      onNotice(error.message || 'Could not save that.');
    }
    saveLiked();
    onChange(id);
  }

  async function recordCopy(id) {
    if (!state.available) return;
    try {
      const res = await post({ action: 'copy', id });
      if (!res.ok) return;
      const data = await res.json();
      state.copies[id] = data.copies;
      onChange(id);
    } catch { /* a missed copy count is not worth bothering anyone about */ }
  }

  return { state, load, toggleLike, recordCopy };
}

export const compact = n => n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
