export type Regio = 'belgie' | 'europa' | 'wereld';
export type Categorie = 'startups' | 'economie' | 'tech' | 'beleid';
export type Belang = 'hoog' | 'middel' | 'laag';

export type Source = {
  id: string;
  naam: string;
  url: string;
  /** Waar de redactie zit; het verhaal zelf kan over een andere regio gaan. */
  regio: Regio;
  land: string;
  soort: 'krant' | 'omroep' | 'vakmedium' | 'instelling';
  /** Brede feeds bevatten ook niet-zakelijk nieuws; Claude filtert die eruit. */
  breed?: boolean;
};

export type NewsItem = {
  id: string;
  sourceId: string;
  titel: string;
  link: string;
  snippet: string;
  /** Publicatietijd in ms sinds epoch; 0 als de feed geen leesbare datum gaf. */
  datum: number;
};

export type SourceStatus = {
  ok: boolean;
  aantal: number;
  fout?: string;
  at: number;
};

export type Story = {
  id: string;
  titel: string;
  categorie: Categorie;
  regio: Regio;
  belang: Belang;
  watGebeurt: string;
  waaromBelangrijk: string;
  impactVoorJou: string;
  kansen: string[];
  kanttekening: string;
  /** Verwijst naar NewsItem.id. Links en bronnamen komen altijd uit de feed, nooit van het model. */
  itemIds: string[];
};

export type Digest = {
  gemaaktOp: number;
  model: string;
  /** Verbruik van deze analyse; `dollar` is een schatting of null als de prijs onbekend is. */
  gebruik?: { tokensIn: number; tokensUit: number; dollar: number | null };
  stories: Story[];
  /** De artikels waarop de analyse steunt, bewaard zodat bronnen zichtbaar blijven. */
  items: NewsItem[];
  /** Alle ids die naar het model gingen, om "nieuw sinds analyse" te kunnen tellen. */
  gezienIds: string[];
};

export type AnalyseModus = 'handmatig' | 'tijdstippen' | 'interval';

export type Settings = {
  modus: AnalyseModus;
  /** "HH:MM" in lokale tijd. */
  tijdstippen: string[];
  intervalUren: number;
  profiel: string;
  /** Adres van de nachtelijke briefing; leeg als die niet gebruikt wordt. */
  briefingUrl: string;
};
