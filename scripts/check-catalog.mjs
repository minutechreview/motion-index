import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { validateSubmission } from '../api/submit.js';
const {entries,sources} = JSON.parse(readFileSync('public/catalog.json', 'utf8'));
const app = readFileSync('public/app.js', 'utf8') + readFileSync('public/scenes-ultra.js', 'utf8');
assert.equal(entries.length, 60);
assert.equal(new Set(entries.map(e=>e.id)).size, entries.length);
assert.equal(new Set(sources.map(source=>source.id)).size, sources.length);
const featured = entries.filter(entry=>entry.featured).sort((a,b)=>a.featured-b.featured);
assert.deepEqual(featured.map(entry=>entry.id), ['turntable','money','flip','receipt','design-pack']);
assert.deepEqual(featured.map(entry=>entry.featured), [1,2,3,4,5]);
for (const entry of featured) {
  assert.equal(entry.demo, `/demos/${entry.id}.mp4`);
  assert.equal(entry.poster, `/demos/${entry.id}.jpg`);
  assert.ok(existsSync(`public${entry.demo}`), `Missing demo: ${entry.id}`);
  assert.ok(existsSync(`public${entry.poster}`), `Missing poster: ${entry.id}`);
}
for (const source of sources) {
  assert.ok(source.author && source.name && source.project && source.description);
  assert.ok(source.url.startsWith('https://') && source.authorUrl.startsWith('https://'));
  assert.ok(entries.some(entry=>entry.source.id===source.id), `Unreferenced credit: ${source.id}`);
}
for (const entry of entries) {
  assert.ok(entry.prompt.includes(entry.title));
  assert.ok(entry.prompt.includes('[YOUR TOPIC OR BRAND]'));
  assert.ok(entry.source.url.startsWith('https://'));
  assert.ok(sources.some(source=>source.id===entry.source.id && source.author===entry.source.author), `Missing creator credit: ${entry.id}`);
  assert.ok(entry.prompt.includes(entry.source.name) && entry.prompt.includes(entry.source.url), `Prompt missing credit: ${entry.id}`);
  assert.ok(app.includes(`${entry.id.includes('-') ? "'" + entry.id + "'" : entry.id}:`), `Missing preview: ${entry.id}`);
}
assert.equal(validateSubmission({title:'Paper',url:'https://example.com/demo'}).title, 'Paper');
assert.ok(validateSubmission({title:'Paper',url:'javascript:alert(1)'}).error);
assert.ok(validateSubmission({title:'',url:'https://example.com'}).error);
assert.ok(validateSubmission({title:'Paper',url:'https://example.com',note:'x'.repeat(1001)}).error);
assert.ok(validateSubmission({website:'spam'}).honeypot);
console.log(`Validated ${entries.length} previews and credited prompts across ${sources.length} sources, plus submission validation.`);
