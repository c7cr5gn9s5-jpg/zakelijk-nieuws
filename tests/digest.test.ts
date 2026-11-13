import assert from 'node:assert/strict';
import { test } from 'node:test';

import { maakDigest } from '../src/lib/digest';
import { AnalyseFout } from '../src/lib/fouten';
import type { NewsItem } from '../src/lib/types';

const nu = Date.now();
const items: NewsItem[] = [
  { id: 'bbc-1', sourceId: 'bbc', titel: 'ECB cuts rates', link: 'https://bbc.test/1', snippet: 'The ECB cut rates.', datum: nu - 3600_000 },
  { id: 'tijd-1', sourceId: 'tijd', titel: 'ECB verlaagt rente', link: 'https://tijd.test/1', snippet: 'De ECB verlaagt de rente.', datum: nu - 7200_000 },
];

function nepAntwoord(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('maakDigest: stuurt het juiste verzoek en verwerkt het antwoord', async () => {
  let verzoek: any;
  let headers: Headers | undefined;
  const echt = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    verzoek = JSON.parse(init.body);
    headers = new Headers(init.headers);
    assert.match(String(url), /\/v1\/messages/);
    return nepAntwoord({
      id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
      content: [{
        type: 'text',
        text: JSON.stringify({
          verhalen: [{
            titel: 'ECB verlaagt de rente', categorie: 'economie', regio: 'europa', belang: 'hoog',
            wat_gebeurt: 'De ECB verlaagt de rente.', waarom_belangrijk: 'Lenen wordt goedkoper.',
            impact_voor_jou: 'Dit zou financiering makkelijker kunnen maken.', kansen: ['Idee'], kanttekening: '',
            item_ids: ['bbc-1', 'tijd-1', 'verzonnen-9'],
          }],
        }),
      }],
    });
  }) as typeof fetch;
  try {
    const d = await maakDigest('sk-ant-test', items, 'Profiel X');
    assert.equal(verzoek.model, 'claude-opus-5-5');
    assert.equal(verzoek.fallbacks, 'default');
    assert.equal(verzoek.output_config.effort, 'medium');
    assert.equal(verzoek.output_config.format.type, 'json_schema');
    assert.ok(verzoek.output_config.format.schema.properties.verhalen);
    assert.equal(verzoek.thinking, undefined);
    assert.equal(verzoek.temperature, undefined);
    assert.equal(verzoek.betas, undefined, 'betas horen in de header, niet in de body');
    assert.match(headers!.get('anthropic-beta') ?? '', /server-side-fallback-2026-07-01/);
    assert.equal(headers!.get('authorization'), 'Bearer sk-ant-test');
    assert.match(verzoek.messages[0].content, /Profiel X/);
    assert.match(verzoek.messages[0].content, /"id":"bbc-1"/);
    assert.deepEqual(d.gebruik, { tokensIn: 10, tokensUit: 10, dollar: (10 * 4 + 10 * 20) / 1e6 });
    assert.equal(d.stories.length, 1);
    assert.deepEqual(d.stories[0].itemIds, ['bbc-1', 'tijd-1']);
    assert.deepEqual(d.items.map((i) => i.id).sort(), ['bbc-1', 'tijd-1']);
    assert.deepEqual(d.gezienIds.sort(), ['bbc-1', 'tijd-1']);
  } finally {
    globalThis.fetch = echt;
  }
});

test('maakDigest: ongeldige sleutel geeft een begrijpelijke fout', async () => {
  const echt = globalThis.fetch;
  globalThis.fetch = (async () =>
    nepAntwoord({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 401)) as typeof fetch;
  try {
    await assert.rejects(() => maakDigest('fout', items, ''), (e) => e instanceof AnalyseFout && /API-sleutel/.test(e.message));
  } finally {
    globalThis.fetch = echt;
  }
});

test('maakDigest: weigering en afgebroken antwoord', async () => {
  const echt = globalThis.fetch;
  const basis = { id: 'm', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } };
  try {
    globalThis.fetch = (async () => nepAntwoord({ ...basis, stop_reason: 'refusal', content: [] })) as typeof fetch;
    await assert.rejects(() => maakDigest('k', items, ''), (e) => e instanceof AnalyseFout && /weigerde/.test(e.message));
    globalThis.fetch = (async () => nepAntwoord({ ...basis, stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"verhalen":[{"tit' }] })) as typeof fetch;
    await assert.rejects(() => maakDigest('k', items, ''), (e) => e instanceof AnalyseFout && /onvolledig/.test(e.message));
  } finally {
    globalThis.fetch = echt;
  }
});

test('maakDigest: zonder recente artikels geen aanroep', async () => {
  await assert.rejects(() => maakDigest('k', [], ''), AnalyseFout);
});
