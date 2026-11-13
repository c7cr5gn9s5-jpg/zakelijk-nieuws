import assert from 'node:assert/strict';
import { test } from 'node:test';

import { haalBriefing, isDigest } from '../src/lib/briefing';

const goed = {
  gemaaktOp: 1, model: 'm',
  items: [{ id: 'a', sourceId: 'bbc', titel: 'T', link: 'https://x.test/a', snippet: '', datum: 1 }],
  stories: [{ id: 's', titel: 'T', categorie: 'economie', regio: 'wereld', belang: 'hoog', watGebeurt: 'W', waaromBelangrijk: '', impactVoorJou: '', kansen: [], kanttekening: '', itemIds: ['a'] }],
};

test('isDigest: aanvaardt een geldige briefing en weigert rommel', () => {
  assert.equal(isDigest(goed), true);
  assert.equal(isDigest(null), false);
  assert.equal(isDigest({ ...goed, stories: [] }), false);
  assert.equal(isDigest({ ...goed, items: [{ ...goed.items[0], link: 'javascript:alert(1)' }] }), false);
  assert.equal(isDigest({ ...goed, stories: [{ titel: 'zonder rest' }] }), false);
});

test('haalBriefing: alleen https, vult gezienIds aan, null bij fout', async () => {
  const echt = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response(JSON.stringify(goed))) as typeof fetch;
    assert.equal(await haalBriefing(''), null);
    assert.equal(await haalBriefing('http://x.test/b.json'), null);
    assert.deepEqual((await haalBriefing('https://x.test/b.json'))?.gezienIds, []);
    globalThis.fetch = (async () => new Response('<html>404</html>', { status: 404 })) as typeof fetch;
    assert.equal(await haalBriefing('https://x.test/b.json'), null);
    globalThis.fetch = (async () => new Response('geen json')) as typeof fetch;
    assert.equal(await haalBriefing('https://x.test/b.json'), null);
    globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
    assert.equal(await haalBriefing('https://x.test/b.json'), null);
  } finally {
    globalThis.fetch = echt;
  }
});
