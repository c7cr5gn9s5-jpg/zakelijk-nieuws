import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chips } from '@/components/chips';
import { Scherm } from '@/components/scherm';
import { StoryCard } from '@/components/story-card';
import { StoryDetail } from '@/components/story-detail';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { planningTekst } from '@/lib/schedule';
import type { Categorie, Regio, Story } from '@/lib/types';
import { relatief, sorteerVerhalen, uur } from '@/lib/weergave';
import { useNews } from '@/state/news';

type RegioFilter = 'alles' | Regio;
type ThemaFilter = 'alles' | Categorie;

const REGIOS: { waarde: RegioFilter; label: string }[] = [
  { waarde: 'alles', label: 'Overal' },
  { waarde: 'belgie', label: 'België' },
  { waarde: 'europa', label: 'Europa' },
  { waarde: 'wereld', label: 'Wereld' },
];
const THEMAS: { waarde: ThemaFilter; label: string }[] = [
  { waarde: 'alles', label: "Alle thema's" },
  { waarde: 'startups', label: 'Startups' },
  { waarde: 'economie', label: 'Economie' },
  { waarde: 'tech', label: 'Tech' },
  { waarde: 'beleid', label: 'Beleid' },
];

export default function VandaagScherm() {
  const theme = useTheme();
  const router = useRouter();
  const news = useNews();
  const [regio, setRegio] = useState<RegioFilter>('alles');
  const [thema, setThema] = useState<ThemaFilter>('alles');
  const [open, setOpen] = useState<Story | null>(null);

  const { digest } = news;
  const verhalen = digest
    ? sorteerVerhalen(digest.stories, digest).filter(
        (s) => (regio === 'alles' || s.regio === regio) && (thema === 'alles' || s.categorie === thema),
      )
    : [];

  const bronnenOk = Object.values(news.status).filter((s) => s.ok).length;
  const ondertitel = news.laatsteFeedCheck
    ? `Koppen bijgewerkt om ${uur(news.laatsteFeedCheck)} · ${news.items.length} koppen uit ${bronnenOk} bronnen`
    : news.feedsBezig
      ? 'Koppen ophalen…'
      : 'Nog niet bijgewerkt';

  return (
    <>
      <Scherm titel="Vandaag" ondertitel={ondertitel} verversen={{ bezig: news.feedsBezig, actie: () => void news.ververs() }}>
        {!!news.fout && (
          <Pressable onPress={news.wisFout} style={[styles.blok, styles.melding, { backgroundColor: theme.letZacht }]}>
            <Text style={[styles.meldingTekst, { color: theme.text }]}>{news.fout}</Text>
            <Text style={[styles.klein, { color: theme.textSecondary }]}>Tik om te sluiten</Text>
          </Pressable>
        )}

        {news.geladen && !news.heeftSleutel && !news.settings.briefingUrl && (
          <View style={[styles.blok, styles.melding, { backgroundColor: theme.accentZacht }]}>
            <Text style={[styles.meldingTitel, { color: theme.text }]}>Nog één stap voor de uitleg</Text>
            <Text style={[styles.meldingTekst, { color: theme.text }]}>
              De koppen komen al binnen. Voor de uitleg in gewone taal en de impact voor jou stel je bij Instellingen de
              nachtelijke briefing in, of voeg je een eigen API-sleutel toe.
            </Text>
            <Knop label="Naar Instellingen" onPress={() => router.navigate('/instellingen')} />
          </View>
        )}

        {!news.heeftSleutel && !!news.settings.briefingUrl && (
          <View style={[styles.blok, styles.status, { backgroundColor: theme.backgroundElement, borderColor: theme.lijn }]}>
            <Text style={[styles.statusTekst, { color: theme.text }]}>
              {digest ? `Briefing van ${relatief(digest.gemaaktOp)}.` : 'De eerste briefing staat nog niet klaar.'}
            </Text>
            <Text style={[styles.klein, { color: theme.textSecondary }]}>
              Wordt elke nacht vernieuwd. {digest ? `${news.nieuwSindsAnalyse} nieuwe koppen sindsdien, te lezen onder Koppen.` : ''}
            </Text>
          </View>
        )}

        {news.heeftSleutel && (
          <View style={[styles.blok, styles.status, { backgroundColor: theme.backgroundElement, borderColor: theme.lijn }]}>
            {news.analyseBezig ? (
              <View style={styles.rij}>
                <ActivityIndicator color={theme.accent} />
                <Text style={[styles.statusTekst, { color: theme.text }]}>
                  Claude leest de koppen en schrijft je briefing. Dit duurt ongeveer een minuut.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.statusTekst, { color: theme.text }]}>
                  {digest
                    ? `Briefing van ${relatief(digest.gemaaktOp)}. ${news.nieuwSindsAnalyse} nieuwe koppen sindsdien.`
                    : 'Nog geen briefing gemaakt.'}
                </Text>
                <Text style={[styles.klein, { color: theme.textSecondary }]}>
                  {planningTekst(news.settings)} · {news.analysesVandaag} vandaag
                </Text>
                <Knop
                  label={digest ? 'Nu opnieuw analyseren' : 'Maak mijn eerste briefing'}
                  onPress={() => void news.analyseer()}
                  uit={news.items.length === 0}
                />
              </>
            )}
          </View>
        )}

        {digest && (
          <View style={styles.filters}>
            <Chips opties={REGIOS} gekozen={regio} onKies={setRegio} />
            <Chips opties={THEMAS} gekozen={thema} onKies={setThema} />
          </View>
        )}

        <View style={[styles.blok, styles.lijst]}>
          {digest &&
            verhalen.map((s) => <StoryCard key={s.id} story={s} digest={digest} onOpen={() => setOpen(s)} />)}
          {digest && verhalen.length === 0 && (
            <Text style={[styles.leeg, { color: theme.textSecondary }]}>Geen verhalen voor deze keuze.</Text>
          )}
          {!digest && news.geladen && (
            <Text style={[styles.leeg, { color: theme.textSecondary }]}>
              {news.items.length > 0
                ? 'Je briefing verschijnt hier. Alle binnengekomen koppen vind je intussen onder Koppen.'
                : news.feedsBezig
                  ? 'Koppen ophalen bij de bronnen…'
                  : 'Er zijn nog geen koppen binnen. Trek omlaag om opnieuw te proberen.'}
            </Text>
          )}
        </View>

        {digest && (
          <Text style={[styles.blok, styles.klein, { color: theme.textSecondary }]}>
            De uitleg is door AI geschreven op basis van de vermelde bronnen. Controleer belangrijke zaken altijd in het
            originele artikel.
          </Text>
        )}
      </Scherm>
      <StoryDetail story={open} digest={digest} onSluit={() => setOpen(null)} />
    </>
  );
}

function Knop({ label, onPress, uit }: { label: string; onPress: () => void; uit?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={uit}
      accessibilityRole="button"
      style={({ pressed }) => [styles.knop, { backgroundColor: theme.accent, opacity: uit ? 0.4 : pressed ? 0.8 : 1 }]}>
      <Text style={[styles.knopTekst, { color: theme.background }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  blok: { marginHorizontal: Spacing.three },
  melding: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  meldingTitel: { fontSize: 17, fontWeight: '700' },
  meldingTekst: { fontSize: 15, lineHeight: 22 },
  status: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  statusTekst: { fontSize: 15, lineHeight: 21, fontWeight: '600', flexShrink: 1 },
  rij: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  klein: { fontSize: 13, lineHeight: 18 },
  filters: { gap: Spacing.two },
  lijst: { gap: Spacing.three },
  leeg: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingVertical: Spacing.five },
  knop: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 2 },
  knopTekst: { fontSize: 15, fontWeight: '700' },
});
