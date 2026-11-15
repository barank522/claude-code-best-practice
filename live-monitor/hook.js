#!/usr/bin/env node
// Claude Code hook: olay JSON'unu Claude Canlı sunucusuna iletir, oturum açılışında sunucu kapalıysa başlatır.
// Hata vermez, Claude'u bekletmez.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let token = '';
try {
  token = fs.readFileSync(path.join(__dirname, '.token'), 'utf8').trim();
} catch {}

// Bazı platformlarda stdin hiç kapanmaz; sonsuza kadar bekleme.
setTimeout(() => process.exit(0), 3000).unref();

const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  let p;
  try {
    p = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return;
  }
  // Ayrı süreç grubunda başlar; hook ve Claude kapansa da çalışmaya devam eder.
  const start = () => {
    if (p.hook_event_name !== 'SessionStart') return;
    spawn(process.execPath, [path.join(__dirname, 'server.js')], { detached: true, stdio: 'ignore' }).unref();
  };
  if (!token) return start();
  delete p.tool_response; // dosya içerikleri vb. olabilir; panoya gerekmez
  const body = JSON.stringify(p);
  const req = http.request({
    host: '127.0.0.1',
    port: Number(process.env.CLAUDE_LIVE_PORT) || 7878,
    path: '/event',
    method: 'POST',
    timeout: 1500,
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-live-token': token },
  });
  req.on('error', (e) => {
    if (e.code === 'ECONNREFUSED') start();
  });
  req.on('timeout', () => req.destroy());
  req.end(body);
});
