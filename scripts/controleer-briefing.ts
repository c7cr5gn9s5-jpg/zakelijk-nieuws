// Controleert het antwoord van de nachtelijke taak en maakt er data/briefing.json van,
// het bestand dat de app ophaalt. Verwijzingen naar artikels die niet in de opdracht
// zaten, vallen weg; een verhaal zonder geldig bronartikel ook.
import { readFileSync, writeFileSync } from 'node:fs';

import { controleerVerhalen, DigestSchema } from '../src/lib/regels';
import type { Digest, NewsItem } from '../src/lib/types';
import { betrouwbaarheid } from '../src/lib/weergave';

const MIN_VERHALEN = 4;

const items = JSON.parse(readFileSync('data/gekozen.json', 'utf8')) as NewsItem[];
const ruw = DigestSchema.safeParse(JSON.parse(readFileSync('data/briefing-ruw.json', 'utf8')));
if (!ruw.success) {
  console.error('data/briefing-ruw.json heeft niet de juiste vorm:\n' + z_fout(ruw.error.issues));
  process.exit(1);
}

const stories = controleerVerhalen(ruw.data.verhalen, items);
const weggevallen = ruw.data.verhalen.length - stories.length;
if (stories.length < MIN_VERHALEN) {
  console.error(`Maar ${stories.length} geldige verhalen (${weggevallen} weggevallen). De vorige briefing blijft staan.`);
  process.exit(1);
}

const gebruikt = new Set(stories.flatMap((s) => s.itemIds));
const digest: Digest = {
  gemaaktOp: Date.now(),
  model: 'nachtelijke taak',
  stories,
  items: items.filter((i) => gebruikt.has(i.id)),
  gezienIds: items.map((i) => i.id),
};
writeFileSync('data/briefing.json', JSON.stringify(digest, null, 1) + '\n');

const bevestigd = stories.filter((s) => betrouwbaarheid(s, digest).niveau === 'bevestigd').length;
console.log(`data/briefing.json geschreven: ${stories.length} verhalen, ${bevestigd} bevestigd door meerdere bronnen, ${weggevallen} weggevallen.`);

function z_fout(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues.slice(0, 10).map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
}
