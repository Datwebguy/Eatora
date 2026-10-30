import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIClient } from '../lib/openai.js';

test('bounded decision accepts only a recognized tool action and sends only counts', async () => {
  let sent;
  const client = new OpenAIClient({ apiKey: 'test', fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { tool_calls: [{ function: { name: 'choose_next_step', arguments: '{"action":"search_more"}' } }] } }] }) };
  } });
  assert.deepEqual(await client.decideFollowUp({ found: 1, returned: 50 }), { action: 'search_more', source: 'model' });
  assert.deepEqual(JSON.parse(sent.messages[1].content), { localDiningCandidates: 1, resultsInFirstPage: 50 });
  const bad = new OpenAIClient({ apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { tool_calls: [{ function: { name: 'choose_next_step', arguments: '{"action":"invent_places"}' } }] } }] }) }) });
  assert.deepEqual(await bad.decideFollowUp({ found: 1, returned: 50 }), { action: 'search_more', source: 'fallback' });
});
