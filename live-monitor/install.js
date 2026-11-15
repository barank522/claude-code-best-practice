#!/usr/bin/env node
// Claude Canlı hook'larını ~/.claude/settings.json'a ekler; --remove ile kaldırır. Önce .bak yedeği alır.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const EVENTS = [
  'SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest',
  'Notification', 'SubagentStart', 'SubagentStop', 'Stop', 'StopFailure', 'PreCompact', 'SessionEnd',
];
const remove = process.argv.includes('--remove');
const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const file = path.join(dir, 'settings.json');
const mark = path.join('live-monitor', 'hook.js');
const command = `node "${path.join(__dirname, 'hook.js')}"`;

let settings = {};
if (fs.existsSync(file)) {
  try {
    settings = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`${file} okunamadı (${e.message}). Dosyaya dokunmadım.`);
    process.exit(1);
  }
  fs.copyFileSync(file, file + '.bak');
}

settings.hooks = settings.hooks || {};
const ours = (g) => (g.hooks || []).some((h) => typeof h.command === 'string' && h.command.includes(mark));
for (const ev of new Set([...EVENTS, ...Object.keys(settings.hooks)])) {
  const kept = (settings.hooks[ev] || []).filter((g) => !ours(g));
  if (!remove && EVENTS.includes(ev)) kept.push({ hooks: [{ type: 'command', command, async: true, timeout: 5 }] });
  if (kept.length) settings.hooks[ev] = kept;
  else delete settings.hooks[ev];
}
if (!Object.keys(settings.hooks).length) delete settings.hooks;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
console.log(remove
  ? `Hook'lar kaldırıldı: ${file}`
  : `Hook'lar eklendi: ${file}\nŞimdi: node "${path.join(__dirname, 'server.js')}"  (açık Claude oturumlarını yeniden başlat)`);
