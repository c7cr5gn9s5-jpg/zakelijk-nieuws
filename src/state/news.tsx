import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { haalBriefing } from '@/lib/briefing';
import { AnalyseFout } from '@/lib/fouten';
import { haalAlleFeeds } from '@/lib/feeds';
import { analyseVerschuldigd, dagSleutel, MIN_NIEUW_VOOR_AUTO, STANDAARD_SETTINGS } from '@/lib/schedule';
import { opslag, sleutelOpslag } from '@/lib/storage';
import type { Digest, NewsItem, Settings, SourceStatus } from '@/lib/types';

/** Koppen ophalen is gratis en licht; dat mag vaak. */
const FEED_INTERVAL_MS = 15 * 60_000;
const MIN_TUSSEN_FEEDS_MS = 3 * 60_000;

type NewsState = {
  geladen: boolean;
  items: NewsItem[];
  status: Record<string, SourceStatus>;
  digest: Digest | null;
  settings: Settings;
  heeftSleutel: boolean;
  feedsBezig: boolean;
  analyseBezig: boolean;
  fout: string | null;
  laatsteFeedCheck: number | null;
  analysesVandaag: number;
  /** Koppen die na de laatste analyse zijn binnengekomen. */
  nieuwSindsAnalyse: number;
  ververs: () => Promise<void>;
  analyseer: () => Promise<void>;
  bewaarSettings: (s: Settings) => void;
  bewaarSleutel: (sleutel: string) => Promise<void>;
  wisSleutel: () => Promise<void>;
  wisFout: () => void;
};

const NewsContext = createContext<NewsState | null>(null);

export function useNews(): NewsState {
  const ctx = use(NewsContext);
  if (!ctx) throw new Error('useNews hoort binnen NewsProvider');
  return ctx;
}

function telNieuw(items: NewsItem[], digest: Digest | null): number {
  if (!digest) return items.length;
  const gezien = new Set(digest.gezienIds);
  return items.filter((i) => i.datum > 0 && !gezien.has(i.id)).length;
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const [geladen, setGeladen] = useState(false);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<Record<string, SourceStatus>>({});
  const [digest, setDigest] = useState<Digest | null>(null);
  const [settings, setSettings] = useState<Settings>(STANDAARD_SETTINGS);
  const [heeftSleutel, setHeeftSleutel] = useState(false);
  const [feedsBezig, setFeedsBezig] = useState(false);
  const [analyseBezig, setAnalyseBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [laatsteFeedCheck, setLaatsteFeedCheck] = useState<number | null>(null);
  const [analysesVandaag, setAnalysesVandaag] = useState(0);

  // Refs houden de actuele waarden bij voor de timers en de AppState-luisteraar.
  const nu = useRef({ items, digest, settings, feedsBezig: false, analyseBezig: false, laatsteFeedCheck: 0 });
  useEffect(() => {
    nu.current.items = items;
    nu.current.digest = digest;
    nu.current.settings = settings;
  }, [items, digest, settings]);

  const draaiAnalyse = useCallback(async (bron: NewsItem[], handmatig: boolean) => {
    if (nu.current.analyseBezig) return;
    const sleutel = await sleutelOpslag.lees();
    if (!sleutel) {
      if (handmatig) setFout('Voeg eerst je API-sleutel toe bij Instellingen.');
      return;
    }
    nu.current.analyseBezig = true;
    setAnalyseBezig(true);
    setFout(null);
    try {
      // Pas hier laden: de Claude-code is alleen nodig voor de analyse, en een probleem
      // ermee mag het tonen van de koppen nooit in de weg staan.
      const { maakDigest } = await import('@/lib/digest');
      const nieuw = await maakDigest(sleutel, bron, nu.current.settings.profiel);
      setDigest(nieuw);
      nu.current.digest = nieuw;
      await opslag.schrijfDigest(nieuw);
      const dag = dagSleutel(Date.now());
      const teller = await opslag.leesTeller();
      const aantal = (teller.dag === dag ? teller.aantal : 0) + 1;
      await opslag.schrijfTeller({ dag, aantal });
      setAnalysesVandaag(aantal);
    } catch (e) {
      setFout(e instanceof AnalyseFout ? e.message : `De analyse is mislukt: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      nu.current.analyseBezig = false;
      setAnalyseBezig(false);
    }
  }, []);

  const ververs = useCallback(async () => {
    if (nu.current.feedsBezig) return;
    nu.current.feedsBezig = true;
    setFeedsBezig(true);
    try {
      const [res, klaargezet] = await Promise.all([
        haalAlleFeeds(nu.current.items),
        haalBriefing(nu.current.settings.briefingUrl),
      ]);
      const tijd = Date.now();
      // De nachtelijke briefing vervangt de huidige alleen als ze recenter is.
      if (klaargezet && klaargezet.gemaaktOp > (nu.current.digest?.gemaaktOp ?? 0)) {
        nu.current.digest = klaargezet;
        setDigest(klaargezet);
        void opslag.schrijfDigest(klaargezet);
      }
      nu.current.items = res.items;
      nu.current.laatsteFeedCheck = tijd;
      setItems(res.items);
      setStatus(res.status);
      setLaatsteFeedCheck(tijd);
      void opslag.schrijfItems(res.items);
      void opslag.schrijfStatus(res.status);

      // De analyse kost geld, dus alleen als de planning het toelaat en er genoeg nieuws is.
      const { digest: d, settings: s } = nu.current;
      const verschuldigd = analyseVerschuldigd(s, d?.gemaaktOp ?? null, tijd);
      if (verschuldigd && telNieuw(res.items, d) >= MIN_NIEUW_VOOR_AUTO) {
        void draaiAnalyse(res.items, false);
      }
    } finally {
      nu.current.feedsBezig = false;
      setFeedsBezig(false);
    }
  }, [draaiAnalyse]);

  const analyseer = useCallback(() => draaiAnalyse(nu.current.items, true), [draaiAnalyse]);

  // Opstarten: eerst de bewaarde toestand tonen, dan meteen verversen.
  useEffect(() => {
    let actief = true;
    (async () => {
      const [i, st, d, s, teller, sleutel] = await Promise.all([
        opslag.leesItems(),
        opslag.leesStatus(),
        opslag.leesDigest(),
        opslag.leesSettings(),
        opslag.leesTeller(),
        sleutelOpslag.lees(),
      ]);
      if (!actief) return;
      nu.current.items = i;
      nu.current.digest = d;
      nu.current.settings = s;
      setItems(i);
      setStatus(st);
      setDigest(d);
      setSettings(s);
      setAnalysesVandaag(teller.dag === dagSleutel(Date.now()) ? teller.aantal : 0);
      setHeeftSleutel(!!sleutel);
      setGeladen(true);
      void ververs();
    })();
    return () => {
      actief = false;
    };
  }, [ververs]);

  // Automatisch bijwerken: op vaste tijd zolang de app open is, en telkens ze weer naar voren komt.
  useEffect(() => {
    const timer = setInterval(() => void ververs(), FEED_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (toestand) => {
      if (toestand === 'active' && Date.now() - nu.current.laatsteFeedCheck > MIN_TUSSEN_FEEDS_MS) void ververs();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ververs]);

  const bewaarSettings = useCallback((s: Settings) => {
    nu.current.settings = s;
    setSettings(s);
    void opslag.schrijfSettings(s);
  }, []);

  const bewaarSleutel = useCallback(async (sleutel: string) => {
    await sleutelOpslag.schrijf(sleutel.trim());
    setHeeftSleutel(true);
    setFout(null);
  }, []);

  const wisSleutel = useCallback(async () => {
    await sleutelOpslag.wis();
    setHeeftSleutel(false);
  }, []);

  const wisFout = useCallback(() => setFout(null), []);

  const nieuwSindsAnalyse = useMemo(() => telNieuw(items, digest), [items, digest]);

  const waarde: NewsState = {
    geladen,
    items,
    status,
    digest,
    settings,
    heeftSleutel,
    feedsBezig,
    analyseBezig,
    fout,
    laatsteFeedCheck,
    analysesVandaag,
    nieuwSindsAnalyse,
    ververs,
    analyseer,
    bewaarSettings,
    bewaarSleutel,
    wisSleutel,
    wisFout,
  };

  return <NewsContext value={waarde}>{children}</NewsContext>;
}
