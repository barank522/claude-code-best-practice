#!/usr/bin/env node
// Claude Code hook: olay JSON'unu Claude Canlı sunucusuna iletir. Hata vermez, Claude'u bekletmez.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

let token;
try {
  token = fs.readFileSync(path.join(__dirname, '.token'), 'utf8').trim();
} catch {
  process.exit(0); // sunucu hiç başlatılmamış
}

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
  req.on('error', () => {});
  req.on('timeout', () => req.destroy());
  req.end(body);
});
