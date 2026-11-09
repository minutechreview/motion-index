// check-mcp.mjs: offline checks for the MCP endpoint (no network; motion_suggest uses a fake poster).
import assert from 'node:assert/strict';
import { handleMessage } from '../api/mcp.js';
import { motionSuggest, checkSuggestion } from '../api/_motion.js';

const call = (name, args) => handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });

const init = await handleMessage({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
assert.equal(init.result.protocolVersion, '2025-06-18');
assert.equal(init.result.serverInfo.name, 'motion-index');
assert.equal(await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
const list = await handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
assert.deepEqual(list.result.tools.map((t) => t.name), ['motion_search', 'motion_style', 'motion_brief', 'motion_suggest']);
assert.ok(list.result.tools.every((t) => !('run' in t)));

const s = await call('motion_search', { query: 'product launch', limit: 3 });
assert.equal(s.result.isError, false);
assert.ok(s.result.structuredContent.styles.length > 0);
const id = s.result.structuredContent.styles[0].id;
const st = await call('motion_style', { id });
assert.ok(st.result.structuredContent.prompt.length > 20);
const b = await call('motion_brief', { id, topic: 'Pocket, a Mac clipboard app', aspect: '16:9', duration_seconds: 12 });
assert.ok(b.result.structuredContent.brief.includes('Pocket, a Mac clipboard app'));
assert.ok(b.result.structuredContent.brief.includes('1920x1080'));
assert.ok(!b.result.structuredContent.brief.includes('[YOUR TOPIC OR BRAND]'));
assert.equal((await call('motion_brief', { id, topic: '' })).result.isError, true);
assert.equal((await call('motion_style', { id: 'nope' })).result.isError, true);
assert.equal((await call('motion_search', { category: 'Bogus' })).result.isError, true);
assert.equal((await call('no_such_tool', {})).error.code, -32602);
assert.equal((await handleMessage({ jsonrpc: '2.0', id: 3, method: 'bogus' })).error.code, -32601);

assert.ok(checkSuggestion({ title: 'x', url: 'javascript:alert(1)' }).error);
assert.ok(checkSuggestion({ title: 'x', url: 'https://u:p@example.com' }).error);
let sent = null;
const ok = await motionSuggest({ title: 'Paper fold', url: 'https://example.com/demo' }, async (u, body) => { sent = { u, body }; return { ok: true }; });
assert.equal(ok.ok, true);
assert.equal(sent.u, 'https://motion.minutechbuilds.com/api/submit');
const bad = await motionSuggest({ title: 'Paper fold', url: 'https://example.com/demo' }, async () => ({ ok: false, status: 429, json: async () => ({ error: 'slow down' }) }));
assert.match(bad.error, /slow down/);
console.log('mcp checks passed');
