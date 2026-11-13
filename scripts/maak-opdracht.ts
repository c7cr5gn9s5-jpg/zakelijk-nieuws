// Zet de opgehaalde koppen om in een opdracht voor de nachtelijke taak: de regels,
// het profiel van de lezer en de artikels. Het resultaat staat in data/opdracht.md.
import { readFileSync, writeFileSync } from 'node:fs';
import * as z from 'zod/v4';

import { alsInvoer, DigestSchema, kiesVoorAnalyse, SYSTEEM } from '../src/lib/regels';
import { STANDAARD_PROFIEL } from '../src/lib/schedule';
import type { NewsItem } from '../src/lib/types';

const MAX_LEEFTIJD_UUR = 8;

const koppen = JSON.parse(readFileSync('data/koppen.json', 'utf8')) as { opgehaaldOp: number; items: NewsItem[] };
const leeftijdUur = (Date.now() - koppen.opgehaaldOp) / 3600_000;
if (leeftijdUur > MAX_LEEFTIJD_UUR) {
  console.error(`De koppen zijn ${leeftijdUur.toFixed(1)} uur oud. Ze horen deze nacht ververst te zijn; maak geen briefing van oud nieuws.`);
  process.exit(1);
}

const items = kiesVoorAnalyse(koppen.items);
if (items.length < 10) {
  console.error(`Maar ${items.length} recente artikels; te weinig voor een briefing.`);
  process.exit(1);
}

// De briefing komt online te staan, dus hier alleen het algemene profiel, nooit persoonlijke gegevens.
const profiel = STANDAARD_PROFIEL;

const opdracht = `${SYSTEEM}

## Vorm van het antwoord

Schrijf je antwoord als één JSON-object naar \`data/briefing-ruw.json\`, zonder tekst ervoor of erna. Het moet aan dit schema voldoen:

\`\`\`json
${JSON.stringify(z.toJSONSchema(DigestSchema), null, 1)}
\`\`\`

## Profiel van de lezer

${profiel}

De briefing wordt openbaar bewaard. Spreek de lezer aan met "je" en vermeld geen naam, woonplaats, school, werkgever of andere persoonlijke gegevens.

## Artikels

Het is nu ${new Date().toISOString().slice(0, 16)} UTC. Dit zijn de ${items.length} artikels, één per regel:

${alsInvoer(items)}
`;

writeFileSync('data/opdracht.md', opdracht);
writeFileSync('data/gekozen.json', JSON.stringify(items) + '\n');
console.log(`data/opdracht.md geschreven met ${items.length} artikels (koppen van ${leeftijdUur.toFixed(1)} uur geleden).`);
