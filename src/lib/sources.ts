import type { Source } from './types';

/**
 * Vaste lijst van bronnen. Alleen gevestigde redacties, vakmedia met een eigen
 * redactie en officiële instellingen. Voeg hier geen blogs of aggregators toe:
 * de betrouwbaarheid van de app staat of valt met deze lijst.
 */
export const SOURCES: Source[] = [
  // België
  { id: 'tijd', naam: 'De Tijd', url: 'https://www.tijd.be/rss/politiek_economie.xml', regio: 'belgie', land: 'België', soort: 'krant' },
  { id: 'tijd-ond', naam: 'De Tijd Ondernemen', url: 'https://www.tijd.be/rss/ondernemen.xml', regio: 'belgie', land: 'België', soort: 'krant' },
  { id: 'lecho', naam: "L'Echo", url: 'https://www.lecho.be/rss/entreprises.xml', regio: 'belgie', land: 'België', soort: 'krant' },
  { id: 'vrt', naam: 'VRT NWS', url: 'https://www.vrt.be/vrtnws/nl.rss.articles.xml', regio: 'belgie', land: 'België', soort: 'omroep', breed: true },

  // Europa
  { id: 'sifted', naam: 'Sifted', url: 'https://sifted.eu/feed', regio: 'europa', land: 'VK / Europa', soort: 'vakmedium' },
  { id: 'techeu', naam: 'Tech.eu', url: 'https://tech.eu/feed/', regio: 'europa', land: 'Europa', soort: 'vakmedium' },
  { id: 'eustartups', naam: 'EU-Startups', url: 'https://www.eu-startups.com/feed/', regio: 'europa', land: 'Europa', soort: 'vakmedium' },
  { id: 'ecb', naam: 'Europese Centrale Bank', url: 'https://www.ecb.europa.eu/rss/press.html', regio: 'europa', land: 'Eurozone', soort: 'instelling' },
  { id: 'euronews', naam: 'Euronews Business', url: 'https://www.euronews.com/rss?level=theme&name=business', regio: 'europa', land: 'Europa', soort: 'omroep' },
  { id: 'dw', naam: 'Deutsche Welle Business', url: 'https://rss.dw.com/rdf/rss-en-bus', regio: 'europa', land: 'Duitsland', soort: 'omroep' },
  { id: 'guardian', naam: 'The Guardian Business', url: 'https://www.theguardian.com/business/rss', regio: 'europa', land: 'VK', soort: 'krant' },
  { id: 'bbc', naam: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', regio: 'europa', land: 'VK', soort: 'omroep' },
  { id: 'economist', naam: 'The Economist', url: 'https://www.economist.com/finance-and-economics/rss.xml', regio: 'europa', land: 'VK', soort: 'krant' },

  // Wereld
  { id: 'nyt', naam: 'The New York Times Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', regio: 'wereld', land: 'VS', soort: 'krant' },
  { id: 'cnbc', naam: 'CNBC', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', regio: 'wereld', land: 'VS', soort: 'omroep' },
  { id: 'techcrunch', naam: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/feed/', regio: 'wereld', land: 'VS', soort: 'vakmedium' },
  { id: 'crunchbase', naam: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/', regio: 'wereld', land: 'VS', soort: 'vakmedium' },
  { id: 'mittr', naam: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', regio: 'wereld', land: 'VS', soort: 'vakmedium' },
  { id: 'fed', naam: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', regio: 'wereld', land: 'VS', soort: 'instelling' },
  { id: 'nikkei', naam: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', regio: 'wereld', land: 'Japan / Azië', soort: 'krant' },
  { id: 'scmp', naam: 'South China Morning Post Business', url: 'https://www.scmp.com/rss/92/feed', regio: 'wereld', land: 'Hongkong / China', soort: 'krant' },
  { id: 'row', naam: 'Rest of World', url: 'https://restofworld.org/feed/latest/', regio: 'wereld', land: 'Opkomende markten', soort: 'vakmedium' },
  { id: 'techcabal', naam: 'TechCabal', url: 'https://techcabal.com/feed/', regio: 'wereld', land: 'Afrika', soort: 'vakmedium' },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
