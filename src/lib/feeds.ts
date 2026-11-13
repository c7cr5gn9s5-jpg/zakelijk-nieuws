import { XMLParser } from 'fast-xml-parser';

import { SOURCES } from './sources';
import type { NewsItem, Source, SourceStatus } from './types';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_PER_BRON = 30;
/** Ouder nieuws tonen we niet meer. */
export const MAX_LEEFTIJD_MS = 72 * 3600_000;

// Entiteiten decoderen we zelf (zie `decodeer`), zodat grote feeds met veel
// `&amp;` niet tegen de expansielimiet van de parser aanlopen.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  processEntities: false,
  parseTagValue: false,
  trimValues: true,
});

const ENTITEITEN: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  euro: '€', pound: '£', hellip: '…', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â',
  ccedil: 'ç', iuml: 'ï', icirc: 'î', ocirc: 'ô', ouml: 'ö', uuml: 'ü', ugrave: 'ù',
};

function decodeerEenmaal(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (heel, naam: string) => {
    if (naam[0] === '#') {
      const code = naam[1].toLowerCase() === 'x' ? parseInt(naam.slice(2), 16) : parseInt(naam.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : heel;
    }
    return ENTITEITEN[naam.toLowerCase()] ?? heel;
  });
}

/** Maakt leesbare platte tekst van een feedveld (HTML en entiteiten weg). */
export function decodeer(ruw: string): string {
  // Feeds coderen vaak dubbel (`&amp;quot;`), dus twee rondes.
  let s = decodeerEenmaal(ruw);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  s = decodeerEenmaal(s);
  return s.replace(/\s+/g, ' ').trim();
}

function tekst(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (Array.isArray(node)) return tekst(node[0]);
  if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (o['#text'] != null) return tekst(o['#text']);
    if (o['__cdata'] != null) return tekst(o['__cdata']);
  }
  return '';
}

function lijst<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

const MAANDEN: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
const ZONES: Record<string, number> = {
  GMT: 0, UT: 0, UTC: 0, Z: 0, EST: -300, EDT: -240, CST: -360, CDT: -300, MST: -420, MDT: -360,
  PST: -480, PDT: -420, CET: 60, CEST: 120, BST: 60,
};

/** Leest RFC 822 (RSS) en ISO 8601 (Atom) datums, onafhankelijk van de JS-engine. */
export function leesDatum(ruw: string): number {
  const s = ruw.trim();
  if (!s) return 0;
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{2}:?\d{2}|[A-Za-z]{1,4})?/.exec(s);
  if (m) {
    const maand = MAANDEN[m[2].toLowerCase()];
    if (maand !== undefined) {
      let offsetMin = 0;
      const zone = m[7];
      if (zone) {
        if (zone[0] === '+' || zone[0] === '-') {
          const cijfers = zone.replace(':', '');
          offsetMin = (zone[0] === '-' ? -1 : 1) * (parseInt(cijfers.slice(1, 3), 10) * 60 + parseInt(cijfers.slice(3, 5), 10));
        } else {
          offsetMin = ZONES[zone.toUpperCase()] ?? 0;
        }
      }
      const utc = Date.UTC(+m[3], maand, +m[1], +m[4], +m[5], m[6] ? +m[6] : 0);
      return utc - offsetMin * 60_000;
    }
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function atomLink(link: unknown): string {
  let eerste = '';
  for (const l of lijst(link)) {
    if (typeof l === 'string') return l;
    if (!l || typeof l !== 'object') continue;
    const o = l as Record<string, unknown>;
    const href = tekst(o['@_href']);
    if (!href) continue;
    const rel = tekst(o['@_rel']);
    if (!rel || rel === 'alternate') return href;
    if (!eerste && rel !== 'self' && rel !== 'enclosure') eerste = href;
  }
  return eerste;
}

function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Zet de XML van een RSS 2.0-, RDF- of Atom-feed om naar artikels. */
export function parseFeed(xml: string, source: Source, nu: number = Date.now()): NewsItem[] {
  const doc = parser.parse(xml) as Record<string, any>;
  const ruweItems: { titel: string; link: string; snippet: string; datum: string }[] = [];

  const rssItems = lijst(doc?.rss?.channel?.item);
  const rdfItems = lijst(doc?.['rdf:RDF']?.item);
  const atomItems = lijst(doc?.feed?.entry);

  for (const it of [...rssItems, ...rdfItems]) {
    const guid = tekst(it.guid);
    const link = tekst(it.link) || (isHttp(guid) ? guid : '');
    ruweItems.push({
      titel: tekst(it.title),
      link,
      snippet: tekst(it.description) || tekst(it['content:encoded']),
      datum: tekst(it.pubDate) || tekst(it['dc:date']),
    });
  }
  for (const it of atomItems) {
    ruweItems.push({
      titel: tekst(it.title),
      link: atomLink(it.link),
      snippet: tekst(it.summary) || tekst(it.content),
      datum: tekst(it.published) || tekst(it.updated),
    });
  }

  if (rssItems.length + rdfItems.length + atomItems.length === 0 && !doc?.rss && !doc?.feed && !doc?.['rdf:RDF']) {
    throw new Error('Geen geldige RSS- of Atom-feed');
  }

  const gezien = new Set<string>();
  const items: NewsItem[] = [];
  for (const r of ruweItems) {
    const titel = decodeer(r.titel);
    const link = decodeerEenmaal(r.link).trim();
    if (!titel || !isHttp(link) || gezien.has(link)) continue;
    gezien.add(link);
    const datum = leesDatum(r.datum);
    // Een datum in de toekomst wijst op een foute feed; behandel die als onbekend.
    const veiligeDatum = datum > nu + 3600_000 ? 0 : datum;
    if (veiligeDatum && nu - veiligeDatum > MAX_LEEFTIJD_MS) continue;
    let snippet = decodeer(r.snippet);
    if (snippet.length > 320) snippet = snippet.slice(0, 317).trimEnd() + '…';
    items.push({ id: `${source.id}-${hash(link)}`, sourceId: source.id, titel, link, snippet, datum: veiligeDatum });
  }
  items.sort((a, b) => b.datum - a.datum);
  return items.slice(0, MAX_PER_BRON);
}

async function haalBron(source: Source): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), source);
  } finally {
    clearTimeout(timer);
  }
}

function foutTekst(e: unknown): string {
  if (e instanceof Error) return e.name === 'AbortError' ? 'Geen antwoord binnen 15 s' : e.message;
  return String(e);
}

export type FeedResultaat = {
  items: NewsItem[];
  status: Record<string, SourceStatus>;
};

/**
 * Haalt alle bronnen parallel op. Een bron die faalt, houdt de rest niet tegen:
 * haar vorige artikels blijven staan en de fout komt in de status.
 */
export async function haalAlleFeeds(vorige: NewsItem[], bronnen: Source[] = SOURCES): Promise<FeedResultaat> {
  const nu = Date.now();
  const uitkomsten = await Promise.allSettled(bronnen.map(haalBron));
  const status: Record<string, SourceStatus> = {};
  const items: NewsItem[] = [];

  uitkomsten.forEach((u, i) => {
    const bron = bronnen[i];
    if (u.status === 'fulfilled') {
      status[bron.id] = { ok: true, aantal: u.value.length, at: nu };
      items.push(...u.value);
    } else {
      const oud = vorige.filter((x) => x.sourceId === bron.id && (!x.datum || nu - x.datum <= MAX_LEEFTIJD_MS));
      status[bron.id] = { ok: false, aantal: oud.length, fout: foutTekst(u.reason), at: nu };
      items.push(...oud);
    }
  });

  items.sort((a, b) => b.datum - a.datum);
  return { items, status };
}
