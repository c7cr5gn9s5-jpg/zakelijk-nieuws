import assert from 'node:assert/strict';
import { test } from 'node:test';

import { controleerVerhalen, kiesVoorAnalyse } from '../src/lib/regels';
import { decodeer, leesDatum, parseFeed } from '../src/lib/feeds';
import { analyseVerschuldigd, laatsteGeplandeMoment, STANDAARD_SETTINGS } from '../src/lib/schedule';
import type { Digest, NewsItem, Source } from '../src/lib/types';
import { betrouwbaarheid } from '../src/lib/weergave';

const bron: Source = { id: 'test', naam: 'Test', url: 'https://x.test/rss', regio: 'wereld', land: 'VS', soort: 'krant' };
const NU = Date.UTC(2026, 10, 13, 18, 0, 0);

test('leesDatum: RFC 822 met GMT en met offset, en ISO', () => {
  assert.equal(leesDatum('Fri, 13 Nov 2026 05:00:24 GMT'), Date.UTC(2026, 10, 13, 5, 0, 24));
  assert.equal(leesDatum('Thu, 12 Nov 2026 20:22:02 +0100'), Date.UTC(2026, 10, 12, 19, 22, 2));
  assert.equal(leesDatum('Tue, 10 Nov 2026 17:45:00 -0500'), Date.UTC(2026, 10, 10, 22, 45, 0));
  assert.equal(leesDatum('2026-11-13T04:30:14Z'), Date.UTC(2026, 10, 13, 4, 30, 14));
  assert.equal(leesDatum('12 Nov 2026 18:30 EST'), Date.UTC(2026, 10, 12, 23, 30, 0));
  assert.equal(leesDatum(''), 0);
  assert.equal(leesDatum('geen datum'), 0);
});

test('decodeer: HTML, entiteiten en dubbele codering', () => {
  assert.equal(decodeer('<p>AT&amp;T koopt &quot;Foo&quot;&nbsp;voor &#8364;5&nbsp;mrd</p>'), 'AT&T koopt "Foo" voor €5 mrd');
  assert.equal(decodeer('Caf&amp;eacute; &amp;amp; co'), 'Café & co');
  assert.equal(decodeer('Tekst<script>alert(1)</script> hier'), 'Tekst hier');
});

test('parseFeed: RSS 2.0 met CDATA, dubbele links en te oud nieuws', () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>
    <item><title><![CDATA[Startup haalt &euro;10 miljoen op]]></title><link>https://x.test/a?x=1&amp;y=2</link>
      <description><![CDATA[<p>Een <b>korte</b> inhoud.</p>]]></description><pubDate>Fri, 13 Nov 2026 12:00:00 +0100</pubDate></item>
    <item><title>Dubbel</title><link>https://x.test/a?x=1&amp;y=2</link><pubDate>Fri, 13 Nov 2026 12:00:00 GMT</pubDate></item>
    <item><title>Oud nieuws</title><link>https://x.test/oud</link><pubDate>Mon, 02 Nov 2026 12:00:00 GMT</pubDate></item>
    <item><title>Zonder link</title></item>
    <item><title>Gevaarlijke link</title><link>javascript:alert(1)</link></item>
    <item><title>Guid als link</title><guid>https://x.test/g</guid><pubDate>Fri, 13 Nov 2026 09:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const items = parseFeed(xml, bron, NU);
  assert.deepEqual(items.map((i) => i.titel), ['Startup haalt €10 miljoen op', 'Guid als link']);
  assert.equal(items[0].link, 'https://x.test/a?x=1&y=2');
  assert.equal(items[0].snippet, 'Een korte inhoud.');
  assert.equal(items[0].datum, Date.UTC(2026, 10, 13, 11, 0, 0));
});

test('parseFeed: één enkel item (geen array) en Atom', () => {
  const rss = `<rss><channel><item><title>Solo</title><link>https://x.test/solo</link><pubDate>Fri, 13 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  assert.equal(parseFeed(rss, bron, NU).length, 1);
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><title>A</title>
    <entry><title type="html">Atom &amp;amp; co</title><id>1</id><published>2026-11-13T04:30:14Z</published><summary/>
      <link rel="self" href="https://x.test/self.xml"/><link rel="alternate" href="https://x.test/artikel"/>
      <link rel="enclosure" href="https://x.test/img.jpg"/></entry></feed>`;
  const a = parseFeed(atom, bron, NU);
  assert.equal(a.length, 1);
  assert.equal(a[0].link, 'https://x.test/artikel');
  assert.equal(a[0].titel, 'Atom & co');
});

test('parseFeed: RDF en lege feed; HTML-pagina geeft een fout', () => {
  const rdf = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <item><title>RDF item</title><link>https://x.test/rdf</link><dc:date>2026-11-13T08:00:00Z</dc:date></item></rdf:RDF>`;
  assert.equal(parseFeed(rdf, bron, NU)[0].datum, Date.UTC(2026, 10, 13, 8));
  assert.deepEqual(parseFeed('<rss><channel><title>Leeg</title></channel></rss>', bron, NU), []);
  assert.throws(() => parseFeed('<html><body>Access denied</body></html>', bron, NU));
});

test('parseFeed: toekomstige datum telt als onbekend', () => {
  const xml = `<rss><channel><item><title>Toekomst</title><link>https://x.test/t</link><pubDate>Fri, 13 Nov 2027 10:00:00 GMT</pubDate></item></channel></rss>`;
  assert.equal(parseFeed(xml, bron, NU)[0].datum, 0);
});

const item = (id: string, sourceId: string, uurGeleden: number): NewsItem => ({
  id, sourceId, titel: id, link: `https://x.test/${id}`, snippet: '', datum: uurGeleden < 0 ? 0 : NU - uurGeleden * 3600_000,
});

test('kiesVoorAnalyse: alleen recent, met datum, begrensd per bron', () => {
  const items = [
    ...Array.from({ length: 20 }, (_, i) => item(`a${i}`, 'a', i)),
    item('b-oud', 'b', 40), item('b-nieuw', 'b', 2), item('b-onbekend', 'b', -1),
  ];
  const gekozen = kiesVoorAnalyse(items, NU);
  assert.equal(gekozen.filter((i) => i.sourceId === 'a').length, 12);
  assert.deepEqual(gekozen.filter((i) => i.sourceId === 'b').map((i) => i.id), ['b-nieuw']);
});

const verhaal = (item_ids: string[]) => ({
  titel: 'T', categorie: 'startups' as const, regio: 'wereld' as const, belang: 'hoog' as const,
  wat_gebeurt: 'W', waarom_belangrijk: 'B', impact_voor_jou: 'I', kansen: [' idee ', ''], kanttekening: '', item_ids,
});

test('controleerVerhalen: verzonnen ids verdwijnen, verhaal zonder bron ook', () => {
  const items = [item('x1', 'bbc', 1), item('x2', 'guardian', 1)];
  const uit = controleerVerhalen([verhaal(['x1', 'verzonnen', 'x1', 'x2']), verhaal(['bestaat-niet']), verhaal([])], items);
  assert.equal(uit.length, 1);
  assert.deepEqual(uit[0].itemIds, ['x1', 'x2']);
  assert.deepEqual(uit[0].kansen, ['idee']);
});

test('betrouwbaarheid: twee feeds van dezelfde krant tellen als één bron', () => {
  const maak = (ids: [string, string][]): [Parameters<typeof betrouwbaarheid>[0], Digest] => {
    const items = ids.map(([id, s]) => item(id, s, 1));
    const [story] = controleerVerhalen([verhaal(ids.map(([id]) => id))], items);
    return [story, { gemaaktOp: NU, model: 'm', stories: [story], items, gezienIds: [] }];
  };
  assert.equal(betrouwbaarheid(...maak([['1', 'bbc'], ['2', 'guardian'], ['3', 'tijd']])).label, 'Bevestigd door 3 bronnen');
  assert.equal(betrouwbaarheid(...maak([['1', 'tijd'], ['2', 'tijd-ond']])).niveau, 'enkel');
  assert.equal(betrouwbaarheid(...maak([['1', 'ecb']])).niveau, 'officieel');
  assert.equal(betrouwbaarheid(...maak([['1', 'sifted']])).niveau, 'enkel');
});

test('planning: handmatig, interval en vaste tijdstippen', () => {
  const om = (u: number, m = 0, dag = 13) => new Date(2026, 10, dag, u, m).getTime();
  const s = STANDAARD_SETTINGS; // 07:00 en 18:00
  assert.equal(analyseVerschuldigd({ ...s, modus: 'handmatig' }, null, om(12)), false);
  assert.equal(analyseVerschuldigd({ ...s, modus: 'interval', intervalUren: 3 }, om(10), om(12)), false);
  assert.equal(analyseVerschuldigd({ ...s, modus: 'interval', intervalUren: 3 }, om(9), om(12)), true);
  assert.equal(analyseVerschuldigd({ ...s, modus: 'interval' }, null, om(12)), true);
  assert.equal(laatsteGeplandeMoment(s.tijdstippen, om(6, 30)), om(18, 0, 12));
  assert.equal(laatsteGeplandeMoment(s.tijdstippen, om(7, 0)), om(7));
  assert.equal(analyseVerschuldigd(s, om(6), om(6, 30)), false, 'na 18:00 gisteren al geanalyseerd');
  assert.equal(analyseVerschuldigd(s, om(6), om(7, 5)), true, '07:00 is voorbij sinds de laatste analyse');
  assert.equal(analyseVerschuldigd(s, om(7, 5), om(17, 59)), false);
  assert.equal(analyseVerschuldigd(s, om(7, 5), om(18, 1)), true);
  assert.equal(analyseVerschuldigd(s, null, om(3)), true);
  assert.equal(analyseVerschuldigd({ ...s, tijdstippen: [] }, null, om(12)), false);
});
