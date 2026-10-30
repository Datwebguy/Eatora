import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

test('API rejects oversized and malformed input before provider calls', async () => {
  const probe = http.createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port; await new Promise(r => probe.close(r));
  const child = spawn(process.execPath, ['dev-server.js'], { env: { ...process.env, PORT: String(port), QLOO_API_KEY: '', OPENAI_API_KEY: '' }, stdio: 'ignore' });
  try {
    const base = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 50; i++) { try { await fetch(base + '/health'); break; } catch { await new Promise(r => setTimeout(r, 30)); } }
    const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    const health = await fetch(base + '/health');
    assert.match(health.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await fetch(base + '/health', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/compare', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' })).status, 415);
    assert.equal((await post('/resolve', '{')).status, 400);
    assert.equal((await post('/resolve', JSON.stringify({ favorites: ['x'.repeat(17000)] }))).status, 413);
    assert.equal((await post('/resolve', JSON.stringify({ favorites: Array(100).fill('x') }))).status, 400);
    assert.equal((await post('/compare', JSON.stringify({ favorites: ['a','b','c'], location: 'Austin', constraints: ['Low-sodium','Low-heat delivery'], medicationNotes: 'x,'.repeat(30) }))).status, 400);
  } finally { child.kill(); }
});
