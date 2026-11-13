import { BRIEFING_URL } from './config';
import type { Settings } from './types';

// Bewust algemeen gehouden: deze tekst staat in de code en dus ook online.
// Persoonlijke details horen alleen in het profielveld van de app, dat op het toestel blijft.
export const STANDAARD_PROFIEL =
  'De lezer wil later zelf een startup oprichten. De lezer zoekt nieuwe startup-ideeën, gaten in de markt en ' +
  'inzichten die iemand die alleen lokaal nieuws volgt niet oppikt, en wil goed beslagen zijn voor gesprekken ' +
  'over business, innovatie en economie.';

export const STANDAARD_SETTINGS: Settings = {
  modus: 'tijdstippen',
  tijdstippen: ['07:00', '18:00'],
  intervalUren: 3,
  profiel: STANDAARD_PROFIEL,
  briefingUrl: BRIEFING_URL,
};

export const KEUZE_TIJDSTIPPEN = ['06:00', '07:00', '08:00', '12:00', '16:00', '18:00', '21:00', '23:00'];
export const KEUZE_INTERVALLEN = [1, 2, 3, 6, 12];

/** Minder nieuwe koppen dan dit is geen automatische analyse waard. */
export const MIN_NIEUW_VOOR_AUTO = 5;

function momentOp(dag: Date, tijdstip: string): number {
  const [u, m] = tijdstip.split(':').map((x) => parseInt(x, 10));
  return new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(), u || 0, m || 0, 0, 0).getTime();
}

/** Het recentste geplande tijdstip dat al voorbij is (vandaag of gisteren). */
export function laatsteGeplandeMoment(tijdstippen: string[], nu: number): number | null {
  if (tijdstippen.length === 0) return null;
  const vandaag = new Date(nu);
  const gisteren = new Date(nu - 24 * 3600_000);
  const kandidaten = [...tijdstippen.map((t) => momentOp(vandaag, t)), ...tijdstippen.map((t) => momentOp(gisteren, t))];
  const voorbij = kandidaten.filter((t) => t <= nu);
  return voorbij.length ? Math.max(...voorbij) : null;
}

/** Mag er nu vanzelf een analyse starten volgens de instellingen? */
export function analyseVerschuldigd(settings: Settings, laatsteAnalyse: number | null, nu: number): boolean {
  if (settings.modus === 'handmatig') return false;
  if (settings.modus === 'interval') {
    return laatsteAnalyse == null || nu - laatsteAnalyse >= settings.intervalUren * 3600_000;
  }
  const moment = laatsteGeplandeMoment(settings.tijdstippen, nu);
  if (moment == null) return false;
  return laatsteAnalyse == null || laatsteAnalyse < moment;
}

/** Korte uitleg voor in de app over wanneer de volgende analyse komt. */
export function planningTekst(settings: Settings): string {
  if (settings.modus === 'handmatig') return 'Analyse alleen wanneer jij erom vraagt';
  if (settings.modus === 'interval') return `Analyse hoogstens om de ${settings.intervalUren} uur`;
  if (settings.tijdstippen.length === 0) return 'Geen tijdstippen gekozen';
  return `Analyse om ${[...settings.tijdstippen].sort().join(' en ')}`;
}

export function dagSleutel(nu: number): string {
  const d = new Date(nu);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
