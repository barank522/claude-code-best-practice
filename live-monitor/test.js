// node --test live-monitor/test.js — durum makinesinin temel akışı.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { apply, snapshot } = require('./server.js');

test('ana ajan, alt ajan ve sırasız gelen hook olayları', () => {
  const base = { session_id: 's1', cwd: '/x/proje' };
  const ev = (o) => apply({ ...base, ...o });

  ev({ hook_event_name: 'UserPromptSubmit', prompt: 'testleri düzelt' });
  ev({ hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_use_id: 'A', tool_input: { subagent_type: 'Explore', description: 'Testleri bul' } });
  ev({ hook_event_name: 'SubagentStart', agent_id: 'ag1', agent_type: 'Explore' });
  ev({ hook_event_name: 'PreToolUse', agent_id: 'ag1', agent_type: 'Explore', tool_name: 'Read', tool_use_id: 'R', tool_input: { file_path: '/x/proje/cart.ts' } });
  // async hook'lar: Post, Pre'den önce gelebilir
  ev({ hook_event_name: 'PostToolUse', agent_id: 'ag1', agent_type: 'Explore', tool_name: 'Grep', tool_use_id: 'G' });
  ev({ hook_event_name: 'PreToolUse', agent_id: 'ag1', agent_type: 'Explore', tool_name: 'Grep', tool_use_id: 'G', tool_input: { pattern: 'x' } });

  let s = JSON.parse(snapshot()).sessions[0];
  assert.strictEqual(s.project, 'proje');
  assert.strictEqual(s.status, 'working');
  assert.deepStrictEqual(s.running.map((t) => t.name), ['Agent']);
  const a = s.agents[0];
  assert.strictEqual(a.desc, 'Testleri bul');
  assert.strictEqual(a.tools, 2);
  assert.deepStrictEqual(a.running.map((t) => t.detail), ['cart.ts']);

  ev({ hook_event_name: 'PermissionRequest', tool_name: 'Bash' });
  assert.strictEqual(JSON.parse(snapshot()).sessions[0].status, 'waiting');

  ev({ hook_event_name: 'SubagentStop', agent_id: 'ag1', agent_type: 'Explore', last_assistant_message: '3 test bulundu' });
  ev({ hook_event_name: 'PostToolUse', tool_name: 'Agent', tool_use_id: 'A' });
  ev({ hook_event_name: 'Stop', last_assistant_message: 'Bitti.' });

  s = JSON.parse(snapshot()).sessions[0];
  assert.strictEqual(s.status, 'idle');
  assert.strictEqual(s.running.length, 0);
  assert.strictEqual(s.agents[0].status, 'done');
  assert.strictEqual(s.agents[0].result, '3 test bulundu');
  assert.strictEqual(s.message, 'Bitti.');
  assert.ok(!('queued' in s) && !('done' in s));
});
