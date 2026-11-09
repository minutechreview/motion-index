// MCP endpoint (Streamable HTTP, stateless, JSON responses) so Claude, ChatGPT and other MCP clients can use
// Motion Index as a connector: https://motion.minutechbuilds.com/mcp (rewritten here by vercel.json).
import { TOOLS, SITE_URL } from './_motion.js';

const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const INFO = { name: 'motion-index', title: 'Motion Index', version: '1.0.0', websiteUrl: SITE_URL };
const INSTRUCTIONS = 'Motion Index is a free library of motion-graphics styles with copy-ready prompts. '
  + 'Use motion_search to find a style for the user\'s video idea, motion_brief to turn it into a build-ready brief, '
  + 'and keep the credit it returns. Only use motion_suggest when the user asks to submit a style.';

const result = (id, value) => ({ jsonrpc: '2.0', id, result: value });
const error = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const publicTools = () => TOOLS.map(({ run, ...tool }) => tool);

export async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return error(msg?.id, -32600, 'Invalid request');
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return null;                                   // notifications/initialized etc.: nothing to send back
  const params = msg.params && typeof msg.params === 'object' ? msg.params : {};
  switch (msg.method) {
    case 'initialize': {
      const asked = String(params.protocolVersion || '');
      return result(msg.id, { protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0], capabilities: { tools: { listChanged: false } },
        serverInfo: INFO, instructions: INSTRUCTIONS });
    }
    case 'ping': return result(msg.id, {});
    case 'tools/list': return result(msg.id, { tools: publicTools() });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return error(msg.id, -32602, `Unknown tool: ${params.name}`);
      let out;
      try { out = await tool.run(params.arguments && typeof params.arguments === 'object' ? params.arguments : {}); }
      catch (err) { out = { ok: false, error: `Motion Index failed: ${err?.message || err}` }; }
      return result(msg.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: out.ok === false });
    }
    default: return error(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

export default async function handler(req, res) {
  cors(res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    // No server-initiated stream; a browser visit gets a short pointer instead of an error page.
    if (!String(req.headers.accept || '').includes('text/event-stream')) {
      return res.status(200).json({ name: INFO.title, mcp: `${SITE_URL}/mcp`, transport: 'streamable-http', tools: TOOLS.map((t) => t.name) });
    }
    return res.status(405).json(error(null, -32000, 'This server does not open SSE streams.'));
  }
  if (req.method === 'DELETE') return res.status(405).end();
  if (req.method !== 'POST') return res.status(405).json(error(null, -32000, 'Method not allowed'));
  if (Number(req.headers['content-length'] || 0) > 64000) return res.status(413).json(error(null, -32600, 'Request too large'));
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json(error(null, -32700, 'Parse error')); } }
  const batch = Array.isArray(body);
  const messages = batch ? body.slice(0, 20) : [body];
  const replies = (await Promise.all(messages.map(handleMessage))).filter(Boolean);
  if (!replies.length) return res.status(202).end();
  return res.status(200).json(batch ? replies : replies[0]);
}
