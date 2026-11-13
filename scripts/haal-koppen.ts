// Haalt de koppen op bij alle bronnen en bewaart ze in data/koppen.json.
// Draait elke nacht op GitHub (zie .github/workflows/koppen.yml), zodat de
// nachtelijke briefing op dezelfde vaste bronnenlijst steunt als de app.
import { mkdirSync, writeFileSync } from 'node:fs';

import { haalAlleFeeds } from '../src/lib/feeds';
import { SOURCES } from '../src/lib/sources';

async function main() {
  const { items, status } = await haalAlleFeeds([]);
  const gelukt = SOURCES.filter((s) => status[s.id]?.ok);
  for (const s of SOURCES) {
    const st = status[s.id];
    console.log(`${st?.ok ? 'ok  ' : 'FOUT'} ${s.naam}: ${st?.ok ? `${st.aantal} koppen` : st?.fout}`);
  }
  console.log(`\n${items.length} koppen uit ${gelukt.length} van ${SOURCES.length} bronnen`);
  if (items.length === 0) {
    console.error('Geen enkele kop opgehaald; het vorige bestand blijft staan.');
    process.exit(1);
  }
  mkdirSync('data', { recursive: true });
  writeFileSync('data/koppen.json', JSON.stringify({ opgehaaldOp: Date.now(), items, status }, null, 1) + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
