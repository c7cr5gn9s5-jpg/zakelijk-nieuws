import { SOURCE_BY_ID } from './sources';
import type { Belang, Categorie, Digest, NewsItem, Regio, Source, Story } from './types';

export const REGIO_LABEL: Record<Regio, string> = { belgie: 'België', europa: 'Europa', wereld: 'Wereld' };
export const CATEGORIE_LABEL: Record<Categorie, string> = {
  startups: 'Startups',
  economie: 'Economie',
  tech: 'Tech',
  beleid: 'Beleid',
};

export type BronArtikel = { item: NewsItem; bron: Source | undefined };

export function bronnenVan(story: Story, digest: Digest): BronArtikel[] {
  const perId = new Map(digest.items.map((i) => [i.id, i]));
  return story.itemIds
    .map((id) => perId.get(id))
    .filter((i): i is NewsItem => !!i)
    .map((item) => ({ item, bron: SOURCE_BY_ID[item.sourceId] }));
}

export type Betrouwbaarheid = {
  niveau: 'bevestigd' | 'officieel' | 'enkel';
  /** Aantal verschillende redacties, niet het aantal artikels. */
  aantalBronnen: number;
  label: string;
  namen: string[];
};

/**
 * Twee feeds van dezelfde krant tellen als één bron: bevestiging betekent dat
 * onafhankelijke redacties hetzelfde melden.
 */
export function betrouwbaarheid(story: Story, digest: Digest): Betrouwbaarheid {
  const artikels = bronnenVan(story, digest);
  const namen = [...new Set(artikels.map((a) => (a.bron?.naam ?? a.item.sourceId).replace(/ (Business|Ondernemen|Startups)$/, '')))];
  const n = namen.length;
  if (n >= 2) return { niveau: 'bevestigd', aantalBronnen: n, label: `Bevestigd door ${n} bronnen`, namen };
  if (artikels[0]?.bron?.soort === 'instelling') return { niveau: 'officieel', aantalBronnen: 1, label: 'Officiële bron', namen };
  return { niveau: 'enkel', aantalBronnen: n, label: '1 bron, nog niet bevestigd', namen };
}

const BELANG_GEWICHT: Record<Belang, number> = { hoog: 0, middel: 1, laag: 2 };

export function sorteerVerhalen(stories: Story[], digest: Digest): Story[] {
  return [...stories].sort((a, b) => {
    const belang = BELANG_GEWICHT[a.belang] - BELANG_GEWICHT[b.belang];
    if (belang !== 0) return belang;
    return betrouwbaarheid(b, digest).aantalBronnen - betrouwbaarheid(a, digest).aantalBronnen;
  });
}

export function recentsteDatum(story: Story, digest: Digest): number {
  return Math.max(0, ...bronnenVan(story, digest).map((a) => a.item.datum));
}

export function uur(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "12 min geleden", "3 u geleden", "gisteren 18:40", "di 09:15". */
export function relatief(ms: number, nu: number = Date.now()): string {
  if (!ms) return 'datum onbekend';
  const min = Math.round((nu - ms) / 60_000);
  if (min < 1) return 'zonet';
  if (min < 60) return `${min} min geleden`;
  if (min < 6 * 60) return `${Math.round(min / 60)} u geleden`;
  const d = new Date(ms);
  const vandaag = new Date(nu);
  const dagen = Math.round(
    (new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  if (dagen === 0) return `vandaag ${uur(ms)}`;
  if (dagen === 1) return `gisteren ${uur(ms)}`;
  return `${['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][d.getDay()]} ${uur(ms)}`;
}
