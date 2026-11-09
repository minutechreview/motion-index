// Motion Index tools shared by the MCP endpoint (api/mcp.js). Same behaviour as the Hermes plugin
// (github.com/minutechreview/hermes-motion-index): search styles, read one, turn one into a brief, suggest a new one.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE_URL = 'https://motion.minutechbuilds.com';
export const PLACEHOLDER = '[YOUR TOPIC OR BRAND]';
const FORMATS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };
const DEFAULT_LOOP_LINE = 'Make a 6–8 second seamless loop unless the project calls for another duration.';
const REQUIRED = ['id', 'title', 'category', 'description', 'look', 'motion', 'use', 'prompt'];
const WEIGHTS = { title: 4, category: 3, use: 2, description: 2, look: 1, motion: 1 };
const WORD = /[a-z0-9]+/g;

let cache = null;
export function entries() {
  if (cache) return cache;
  const data = JSON.parse(readFileSync(join(process.cwd(), 'public', 'catalog.json'), 'utf8'));
  const list = Array.isArray(data?.entries) ? data.entries : [];
  cache = list.filter((e) => e && typeof e.source === 'object' && REQUIRED.every((k) => typeof e[k] === 'string' && e[k].trim()));
  if (!cache.length) throw new Error('The Motion Index catalog has no entries.');
  return cache;
}

export const categories = () => [...new Set(entries().map((e) => e.category))];
const find = (id) => entries().find((e) => e.id === String(id || '').trim().toLowerCase());
const credit = (e) => ({ author: e.source.author || '', collection: e.source.project || '', reference_url: e.source.url || '' });
const previewUrl = (e) => `${SITE_URL}/#style-${e.id}`;
const summary = (e) => ({ id: e.id, title: e.title, category: e.category, description: e.description, best_for: e.use, credit: credit(e), preview_url: previewUrl(e) });
const clamp = (v, d, lo, hi) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.max(lo, Math.min(hi, Math.trunc(Number(v)))) : d);
const oneLine = (s) => String(s ?? '').split(/\s+/).filter(Boolean).join(' ');

function score(e, words) {
  let total = 0;
  for (const [field, weight] of Object.entries(WEIGHTS)) {
    const tokens = new Set(e[field].toLowerCase().match(WORD) || []);
    total += weight * words.filter((w) => tokens.has(w) || [...tokens].some((t) => t.startsWith(w))).length;
  }
  return total;
}

export function search(query = '', category = '', limit = 5) {
  const pool = entries().filter((e) => !category || e.category.toLowerCase() === category.trim().toLowerCase());
  const words = (String(query).toLowerCase().match(WORD) || []).filter((w) => w.length > 1);
  if (!words.length) return [...pool].sort((a, b) => (a.featured || 999) - (b.featured || 999) || (a.index || 999) - (b.index || 999)).slice(0, limit);
  return pool.map((e) => [score(e, words), e]).filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0] || (a[1].index || 999) - (b[1].index || 999)).slice(0, limit).map(([, e]) => e);
}

const fail = (error, extra = {}) => ({ ok: false, error, ...extra });
const unknown = (id) => fail(`No style with id "${id}".`, { did_you_mean: search(String(id), '', 3).map((e) => e.id) });

export function motionSearch(args = {}) {
  const category = String(args.category || '');
  if (category && !categories().some((c) => c.toLowerCase() === category.toLowerCase())) return fail(`Unknown category "${category}".`, { categories: categories() });
  const results = search(String(args.query || ''), category, clamp(args.limit, 5, 1, 12));
  return { ok: true, count: results.length, styles: results.map(summary), categories: categories(),
    hint: 'Call motion_brief with a style id and the user\'s topic to get a build-ready brief.' };
}

export function motionStyle(args = {}) {
  const e = find(args.id);
  if (!e) return unknown(args.id);
  return { ok: true, ...summary(e), look: e.look, motion: e.motion, prompt: e.prompt };
}

export function motionBrief(args = {}) {
  const e = find(args.id);
  if (!e) return unknown(args.id);
  const topic = oneLine(args.topic);
  const aspect = String(args.aspect || '9:16');
  const notes = oneLine(args.notes).slice(0, 600);
  if (!topic || topic.length > 300) return fail('Give a topic (1–300 characters), e.g. the product, brand or message.');
  if (!FORMATS[aspect]) return fail(`Unknown aspect "${aspect}".`, { aspects: Object.keys(FORMATS) });
  const seconds = clamp(args.duration_seconds, 8, 3, 120);
  const [width, height] = FORMATS[aspect];
  const spec = `Make it ${seconds} seconds long at ${width}x${height} (${aspect}), 30 fps, unless the project calls for another format.`;
  let brief = e.prompt.split(PLACEHOLDER).join(topic).replace(DEFAULT_LOOP_LINE, spec);
  if (!brief.includes(spec)) brief += `\n\n${spec}`;
  if (notes) brief += `\n\nExtra notes from the user: ${notes}`;
  return { ok: true, style: e.title, id: e.id, brief, format: { width, height, fps: 30, seconds }, credit: credit(e), preview_url: previewUrl(e),
    next_step: 'Build the brief with the project\'s motion stack (HyperFrames, Remotion, After Effects, CSS/GSAP…). Credit the reference when sharing, and create original assets.' };
}

export function checkSuggestion(args = {}) {
  const title = oneLine(args.title);
  const url = String(args.url || '').trim();
  const note = String(args.note || '').trim();
  if (!title || title.length > 100) return { error: 'The title must be 1–100 characters.' };
  if (note.length > 1000) return { error: 'The note must be at most 1000 characters.' };
  try {
    const u = new URL(url);
    if (url.length > 500 || !['http:', 'https:'].includes(u.protocol) || !u.hostname || u.username || u.password) throw new Error('bad');
  } catch { return { error: 'The link must be a plain http or https URL (max 500 characters).' }; }
  return { title, url, note };
}

export async function motionSuggest(args = {}, post = defaultPost) {
  const s = checkSuggestion(args);
  if (s.error) return fail(s.error);
  try {
    const res = await post(`${SITE_URL}/api/submit`, s);
    if (!res.ok) return fail(`Motion Index did not accept the suggestion: ${(await res.json().catch(() => ({}))).error || `HTTP ${res.status}`}`);
  } catch (err) { return fail(`Could not reach Motion Index: ${err?.message || err}`); }
  return { ok: true, message: 'Suggestion sent. The Motion Index maintainer reviews every suggestion before it is added.', submitted: s };
}

function defaultPost(url, body) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'motion-index-mcp/1.0' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
}

const CATS = ['Product', 'Type', 'Data', 'Editorial', 'Illustration', 'Interface', 'Abstract'];
export const TOOLS = [
  { name: 'motion_search', title: 'Search motion styles',
    description: 'Search Motion Index, a free library of motion-graphics styles (product turntables, kinetic type, data charts, editorial layouts, interface demos and more). Use it when the user wants an animated video, title sequence, explainer, ad or motion graphic and needs a visual style, or asks for motion ideas. Returns short summaries with ids.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: 'Words describing the topic, mood or use, e.g. "product launch", "stats", "retro". Empty lists the featured styles.' },
      category: { type: 'string', enum: CATS, description: 'Optional category filter.' },
      limit: { type: 'integer', minimum: 1, maximum: 12, description: 'Max results (default 5).' } } },
    annotations: { readOnlyHint: true, openWorldHint: false }, run: motionSearch },
  { name: 'motion_style', title: 'Get a motion style',
    description: 'Get one Motion Index style by id: its look, motion, use case, reference credit and the full original prompt.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Style id from motion_search, e.g. "turntable".' } }, required: ['id'] },
    annotations: { readOnlyHint: true, openWorldHint: false }, run: motionStyle },
  { name: 'motion_brief', title: 'Write a motion brief',
    description: 'Turn a Motion Index style into a build-ready brief for the user\'s topic: fills in the topic, sets duration and aspect ratio (9:16 by default for Reels/Shorts/TikTok) and returns the credit to keep. Use it before building a motion graphic in a chosen style.',
    inputSchema: { type: 'object', properties: {
      id: { type: 'string', description: 'Style id, e.g. "kinetic".' },
      topic: { type: 'string', description: 'What the piece is about: product, brand, message.' },
      duration_seconds: { type: 'integer', minimum: 3, maximum: 120, description: 'Length (default 8).' },
      aspect: { type: 'string', enum: Object.keys(FORMATS), description: 'Frame shape (default 9:16).' },
      notes: { type: 'string', description: 'Optional extra direction: colours, copy, brand rules.' } }, required: ['id', 'topic'] },
    annotations: { readOnlyHint: true, openWorldHint: false }, run: motionBrief },
  { name: 'motion_suggest', title: 'Suggest a motion style',
    description: 'Send a new motion style suggestion (a title and a link to an example) to the public Motion Index review queue. Only call this when the user explicitly asks to suggest or submit a style, and confirm the title and link with them first.',
    inputSchema: { type: 'object', properties: {
      title: { type: 'string', description: 'Name of the style (max 100 characters).' },
      url: { type: 'string', description: 'http(s) link to an example of the style.' },
      note: { type: 'string', description: 'Optional note for the reviewer (max 1000 characters).' } }, required: ['title', 'url'] },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true }, run: motionSuggest },
];
