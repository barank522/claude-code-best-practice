#!/usr/bin/env node
// Claude Canlı: Claude Code hook olaylarını toplar, telefondan açılan canlı panoya yayınlar. Bağımlılık yok.
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.CLAUDE_LIVE_PORT) || 7878;
const HOST = process.env.CLAUDE_LIVE_HOST || '0.0.0.0';
const TOKEN_FILE = path.join(__dirname, '.token');
const AGENT_TOOLS = new Set(['Agent', 'Task']);

const sessions = new Map();
const feed = [];
const clients = new Set();

const clip = (s, n) => {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

function describe(input) {
  if (!input || typeof input !== 'object') return '';
  const file = input.file_path || input.notebook_path;
  if (file) return path.basename(String(file));
  return clip(input.description || input.command || input.pattern || input.url || input.query || input.skill || input.prompt || '', 120);
}

function getSession(p) {
  let s = sessions.get(p.session_id);
  if (!s) {
    s = {
      id: p.session_id, project: path.basename(p.cwd || '') || '?', status: 'idle', model: '', prompt: '', message: '',
      tools: 0, errors: 0, startedAt: Date.now(), updatedAt: Date.now(),
      running: new Map(), agents: new Map(), queued: [], done: new Set(),
    };
    sessions.set(p.session_id, s);
    if (sessions.size > 20) sessions.delete([...sessions.values()].sort((a, b) => a.updatedAt - b.updatedAt)[0].id);
  }
  return s;
}

function getAgent(s, p) {
  let a = s.agents.get(p.agent_id);
  if (!a) {
    const type = p.agent_type || 'agent';
    // Açıklama ana ajanın Agent çağrısından gelir; SubagentStart'ta yok, o yüzden tipe göre eşleştir.
    let i = s.queued.findIndex((q) => q.type === type);
    if (i < 0 && s.queued.length) i = 0;
    const q = i >= 0 ? s.queued.splice(i, 1)[0] : null;
    a = {
      id: p.agent_id, type, desc: q ? q.desc : '', status: 'running', tools: 0, errors: 0,
      startedAt: Date.now(), endedAt: 0, result: '', running: new Map(),
    };
    s.agents.set(p.agent_id, a);
    if (s.agents.size > 40) {
      const old = [...s.agents.values()].find((x) => x.status === 'done');
      if (old) s.agents.delete(old.id);
    }
  }
  return a;
}

function apply(p) {
  if (!p || typeof p.session_id !== 'string') return;
  const ev = p.hook_event_name;
  const now = Date.now();
  const s = getSession(p);
  const a = p.agent_id ? getAgent(s, p) : null;
  const who = a || s;
  s.updatedAt = now;
  let text = ev;

  switch (ev) {
    case 'SessionStart':
      s.status = 'idle';
      if (p.model) s.model = String(p.model);
      text = 'Oturum başladı';
      break;
    case 'UserPromptSubmit':
      s.status = 'working';
      s.prompt = clip(p.prompt, 280);
      s.message = '';
      text = 'Yeni istek: ' + clip(p.prompt, 80);
      break;
    case 'PreToolUse': {
      const detail = describe(p.tool_input);
      const id = p.tool_use_id || p.tool_name;
      who.tools++;
      // Hook'lar async çalışır; Post, Pre'den önce gelebilir. Biten aracı tekrar "çalışıyor" yapma.
      if (!s.done.has(id) && !(a && a.status === 'done')) who.running.set(id, { name: p.tool_name, detail, at: now });
      if (!a) {
        s.status = 'working';
        if (AGENT_TOOLS.has(p.tool_name)) {
          const type = (p.tool_input && p.tool_input.subagent_type) || 'general-purpose';
          const orphan = [...s.agents.values()].find((x) => !x.desc && x.type === type && now - x.startedAt < 5000);
          if (orphan) orphan.desc = detail;
          else if (s.queued.push({ type, desc: detail }) > 20) s.queued.shift();
        }
      }
      text = p.tool_name + (detail ? ' · ' + detail : '');
      break;
    }
    case 'PostToolUse':
    case 'PostToolUseFailure': {
      const id = p.tool_use_id || p.tool_name;
      who.running.delete(id);
      s.done.add(id);
      if (s.done.size > 500) s.done.delete(s.done.values().next().value);
      if (!a && s.status === 'waiting') s.status = 'working';
      if (ev === 'PostToolUse') return schedule();
      who.errors++;
      text = `${p.tool_name} hata: ${clip(p.error, 80)}`;
      break;
    }
    case 'PermissionRequest':
      s.status = 'waiting';
      text = 'İzin istiyor: ' + p.tool_name;
      break;
    case 'Notification':
      if (/permission|elicitation/.test(p.notification_type || '')) s.status = 'waiting';
      text = clip(p.message, 120);
      break;
    case 'SubagentStart':
      text = 'Alt ajan başladı: ' + a.type;
      break;
    case 'SubagentStop':
      if (a) {
        a.status = 'done';
        a.endedAt = now;
        a.running.clear();
        a.result = clip(p.last_assistant_message, 200);
      }
      text = 'Alt ajan bitti: ' + (a ? a.type : '?');
      break;
    case 'Stop':
      s.status = 'idle';
      s.running.clear();
      s.message = clip(p.last_assistant_message, 400);
      text = 'Yanıt bitti';
      break;
    case 'StopFailure':
      s.status = 'error';
      s.running.clear();
      text = 'Hata: ' + clip(p.error_message || p.error_type, 100);
      break;
    case 'PreCompact':
      text = 'Bağlam sıkıştırılıyor';
      break;
    case 'SessionEnd':
      s.status = 'ended';
      s.running.clear();
      text = 'Oturum kapandı';
      break;
  }

  feed.push({ t: now, sid: s.id, project: s.project, who: a ? a.type : 'ana', ev, text });
  if (feed.length > 150) feed.shift();
  schedule();
}

function snapshot() {
  const list = [...sessions.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
  return JSON.stringify({ now: Date.now(), sessions: list, feed: feed.slice(-80) }, (k, v) =>
    k === 'queued' || k === 'done' ? undefined : v instanceof Map ? [...v.values()] : v);
}

let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    const data = `data: ${snapshot()}\n\n`;
    for (const c of clients) c.write(data);
  }, 200);
}

function loadToken() {
  try {
    const t = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (t) return t;
  } catch {}
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const t = Array.from(crypto.randomBytes(12), (b) => abc[b % abc.length]).join('');
  fs.writeFileSync(TOKEN_FILE, t, { mode: 0o600 });
  return t;
}

function main() {
  const token = Buffer.from(loadToken());
  const authed = (got) => {
    const b = Buffer.from(String(got || ''));
    return b.length === token.length && crypto.timingSafeEqual(b, token);
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    if (!authed(req.headers['x-live-token'] || url.searchParams.get('t'))) {
      res.writeHead(401);
      return res.end('token gerekli');
    }
    if (req.method === 'POST' && url.pathname === '/event') {
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > 8e6) req.destroy();
        else chunks.push(c);
      });
      req.on('end', () => {
        try {
          apply(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch {}
        res.end('ok');
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/stream') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      res.write(`data: ${snapshot()}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url.pathname === '/ok') return res.writeHead(204).end();
    res.writeHead(404).end();
  });

  // Mobil ağlar ve tüneller boşta kalan bağlantıyı keser; ara ara ping at.
  setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 20000);

  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} dolu. Sunucu zaten çalışıyor olabilir.` : e.message);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => {
    const ips = Object.values(os.networkInterfaces()).flat()
      .filter((i) => i && (i.family === 'IPv4' || i.family === 4) && !i.internal).map((i) => i.address);
    console.log('Claude Canlı çalışıyor. Telefondan aç (aynı Wi-Fi ya da Tailscale):');
    for (const ip of ips) console.log(`  http://${ip}:${PORT}/#${token}`);
    console.log(`Bu bilgisayarda: http://localhost:${PORT}/#${token}`);
  });
}

if (require.main === module) main();
module.exports = { apply, snapshot };
