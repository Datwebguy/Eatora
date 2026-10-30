import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

test('ambiguity must be resolved before insights, and the chosen IDs are checked again', async () => {
  let insights = 0;
  let scenario = 'normal';
  const place = (id) => ({ entity_id: id, name: id, properties: { primary_genre: { id: 'tag:restaurant:pizza' }, localities: [{ name: 'Brooklyn' }] }, query: { affinity: 0.9 } });
  const upstream = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/search') {
      const q = url.searchParams.get('query');
      res.end(JSON.stringify({ results: q === 'Joe' ? [{ id: 'joe1', name: 'Joe' }, { id: 'joe2', name: 'Joe Two' }] : [{ id: q, name: q }] }));
    } else if (url.pathname === '/v2/tags') { const q = url.searchParams.get('filter.query'); res.end(JSON.stringify({ results: { tags: [{ tag_id: 'tag:' + q, name: q === 'restaurant' ? 'Restaurant' : q, type: q === 'restaurant' ? 'urn:tag:genre:place' : 'urn:tag:menu_highlight:qloo' }] } })); }
    else { insights++; const offset = Number(url.searchParams.get('offset') || 0); if (scenario !== 'normal' && offset === 50) { if (scenario === 'failure') { res.statusCode = 400; return res.end('{}'); } return res.end(JSON.stringify({ results: { entities: [place('second-page'), place('place-1')] } })); } if (scenario !== 'normal') return res.end(JSON.stringify({ results: { entities: [place('place-1'), ...Array.from({length:49}, (_,i) => ({entity_id:'other-'+i, properties:{}}))] } })); res.end(JSON.stringify({ results: { entities: [place('place-1'), { entity_id: 'building', name: 'Building', tags: [], query: { affinity: 1 } }] } })); }
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const probe = http.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve)); const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['dev-server.js'], { env: { ...process.env, PORT: String(port), QLOO_API_KEY: 'test-key', QLOO_BASE_URL: `http://127.0.0.1:${upstream.address().port}` }, stdio: 'ignore' });
  try {
    const base = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 50; i++) { try { await fetch(base + '/health'); break; } catch { await new Promise(r => setTimeout(r, 30)); } }
    const post = (path, data) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    const favorites = ['Joe', 'music', 'park'];
    const resolution = await (await post('/resolve', { favorites })).json();
    assert.equal(resolution.status, 'needs_selection'); assert.equal(insights, 0);
    const input = { favorites, location: 'Brooklyn', constraints: ['Low-sodium', 'Low-heat delivery'], entityIds: ['joe2', 'music', 'park'] };
    const result = await (await post('/recommend', input)).json();
    assert.equal(insights, 1); assert.equal(result.needsCheck, true); assert.equal(result.places.length, 1);
    assert.deepEqual([...result.places[0].checks.unknown].sort(), ['Low-heat delivery', 'Low-sodium']);
    assert.deepEqual(result.places[0].checks.passed, []);
    const rejected = await post('/recommend', { ...input, entityIds: ['invented', 'music', 'park'] });
    assert.equal(rejected.status, 400); assert.equal(insights, 1);
    scenario = 'expanded';
    const expanded = await (await post('/recommend', input)).json();
    assert.equal(expanded.expandedSearch, 'completed');
    assert.deepEqual(expanded.places.map(p => p.entity_id), ['place-1', 'second-page']);
    assert.equal(insights, 3);
    scenario = 'failure';
    const fallback = await (await post('/recommend', input)).json();
    assert.equal(fallback.expandedSearch, 'unavailable');
    assert.deepEqual(fallback.places.map(p => p.entity_id), ['place-1']);
    assert.equal(insights, 5);
  } finally { child.kill(); await new Promise(resolve => upstream.close(resolve)); }
});
