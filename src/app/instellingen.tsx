import { openBrowserAsync } from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Scherm } from '@/components/scherm';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { KEUZE_INTERVALLEN, KEUZE_TIJDSTIPPEN, STANDAARD_PROFIEL } from '@/lib/schedule';
import { SOURCES } from '@/lib/sources';
import type { AnalyseModus, Regio } from '@/lib/types';
import { REGIO_LABEL } from '@/lib/weergave';
import { useNews } from '@/state/news';

const MODI: { waarde: AnalyseModus; titel: string; uitleg: string }[] = [
  { waarde: 'handmatig', titel: 'Alleen als ik erom vraag', uitleg: 'Je tikt zelf op de knop. Volledige controle over de kosten.' },
  { waarde: 'tijdstippen', titel: 'Op vaste momenten', uitleg: 'De eerste keer dat de app open is na een gekozen tijdstip.' },
  { waarde: 'interval', titel: 'Automatisch, met een rem', uitleg: 'Zodra er genoeg nieuws is, maar nooit vaker dan je instelt.' },
];

export default function InstellingenScherm() {
  const theme = useTheme();
  const news = useNews();
  const { settings } = news;
  const [sleutel, setSleutel] = useState('');
  const [profiel, setProfiel] = useState<string | null>(null);
  const [adres, setAdres] = useState<string | null>(null);
  const adresTekst = adres ?? settings.briefingUrl;
  const profielTekst = profiel ?? settings.profiel;

  const wisselTijdstip = (t: string) => {
    const heeft = settings.tijdstippen.includes(t);
    const tijdstippen = heeft ? settings.tijdstippen.filter((x) => x !== t) : [...settings.tijdstippen, t].sort();
    news.bewaarSettings({ ...settings, tijdstippen });
  };

  return (
    <Scherm titel="Instellingen">
      <Blok titel="Nachtelijke briefing">
        <Text style={[styles.tekst, { color: theme.text }]}>
          {settings.briefingUrl
            ? 'Elke nacht wordt een nieuwe briefing klaargezet. De app haalt ze op zodra je ze opent. Dit kost niets extra.'
            : 'Nog niet ingesteld. Vul hier het adres in waar je briefing elke nacht wordt klaargezet.'}
        </Text>
        <TextInput
          value={adresTekst}
          onChangeText={setAdres}
          placeholder="https://…/briefing.json"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[styles.invoer, { color: theme.text, borderColor: theme.lijn, backgroundColor: theme.background }]}
        />
        <Knop
          label="Bewaren"
          uit={adres === null || adres.trim() === settings.briefingUrl}
          onPress={() => {
            news.bewaarSettings({ ...settings, briefingUrl: adresTekst.trim() });
            setAdres(null);
            void news.ververs();
          }}
        />
      </Blok>

      <Blok titel="Eigen API-sleutel (optioneel)">
        <Text style={[styles.tekst, { color: theme.text }]}>
          {news.heeftSleutel
            ? 'Er is een sleutel bewaard in de beveiligde sleutelhanger van je iPhone. Hij verlaat je toestel alleen om Claude aan te roepen.'
            : 'Niet nodig als je de nachtelijke briefing gebruikt. Met een eigen sleutel kan je ook overdag zelf een nieuwe analyse vragen; dat betaal je per keer.'}
        </Text>
        {news.heeftSleutel ? (
          <Knop label="Sleutel verwijderen" soort="rustig" onPress={() => void news.wisSleutel()} />
        ) : (
          <>
            <TextInput
              value={sleutel}
              onChangeText={setSleutel}
              placeholder="sk-ant-…"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.invoer, { color: theme.text, borderColor: theme.lijn, backgroundColor: theme.background }]}
            />
            <View style={styles.knoppen}>
              <Knop
                label="Bewaren"
                uit={sleutel.trim().length < 20}
                onPress={() => {
                  void news.bewaarSleutel(sleutel).then(() => setSleutel(''));
                }}
              />
              <Knop label="Sleutel aanmaken" soort="rustig" onPress={() => void openBrowserAsync('https://platform.claude.com/settings/keys')} />
            </View>
          </>
        )}
      </Blok>

      <Blok titel="Wanneer mag Claude analyseren">
        <Text style={[styles.klein, { color: theme.textSecondary }]}>
          Koppen ophalen is gratis en gebeurt vanzelf: bij het openen en om de 15 minuten zolang de app open is. Alleen de
          analyse door Claude kost geld. Vandaag gelopen: {news.analysesVandaag}.
        </Text>
        {!!news.digest?.gebruik && (
          <Text style={[styles.klein, { color: theme.textSecondary }]}>
            Laatste analyse: {news.digest.gebruik.tokensIn.toLocaleString('nl-BE')} tokens gelezen,{' '}
            {news.digest.gebruik.tokensUit.toLocaleString('nl-BE')} geschreven
            {news.digest.gebruik.dollar != null
              ? `, ongeveer $${news.digest.gebruik.dollar.toFixed(2).replace('.', ',')}.`
              : '.'}
          </Text>
        )}
        {MODI.map((m) => {
          const actief = settings.modus === m.waarde;
          return (
            <Pressable
              key={m.waarde}
              onPress={() => news.bewaarSettings({ ...settings, modus: m.waarde })}
              accessibilityRole="radio"
              accessibilityState={{ selected: actief }}
              style={[styles.keuze, { borderColor: actief ? theme.accent : theme.lijn, backgroundColor: actief ? theme.accentZacht : 'transparent' }]}>
              <View style={[styles.bol, { borderColor: actief ? theme.accent : theme.textSecondary }]}>
                {actief && <View style={[styles.bolBinnen, { backgroundColor: theme.accent }]} />}
              </View>
              <View style={styles.keuzeTekst}>
                <Text style={[styles.keuzeTitel, { color: theme.text }]}>{m.titel}</Text>
                <Text style={[styles.klein, { color: theme.textSecondary }]}>{m.uitleg}</Text>
              </View>
            </Pressable>
          );
        })}

        {settings.modus === 'tijdstippen' && (
          <View style={styles.pillen}>
            {KEUZE_TIJDSTIPPEN.map((t) => (
              <Pil key={t} label={t} actief={settings.tijdstippen.includes(t)} onPress={() => wisselTijdstip(t)} />
            ))}
          </View>
        )}
        {settings.modus === 'interval' && (
          <View style={styles.pillen}>
            {KEUZE_INTERVALLEN.map((u) => (
              <Pil
                key={u}
                label={`om de ${u} u`}
                actief={settings.intervalUren === u}
                onPress={() => news.bewaarSettings({ ...settings, intervalUren: u })}
              />
            ))}
          </View>
        )}
      </Blok>

      <Blok titel="Over jou">
        <Text style={[styles.klein, { color: theme.textSecondary }]}>
          Claude gebruikt dit om „Wat betekent dit voor jou” op maat te schrijven. Hoe concreter, hoe beter.
        </Text>
        <TextInput
          value={profielTekst}
          onChangeText={setProfiel}
          multiline
          style={[styles.invoer, styles.groot, { color: theme.text, borderColor: theme.lijn, backgroundColor: theme.background }]}
        />
        <View style={styles.knoppen}>
          <Knop
            label="Bewaren"
            uit={profiel === null || profiel === settings.profiel}
            onPress={() => {
              news.bewaarSettings({ ...settings, profiel: profielTekst.trim() });
              setProfiel(null);
            }}
          />
          <Knop
            label="Standaardtekst"
            soort="rustig"
            onPress={() => {
              news.bewaarSettings({ ...settings, profiel: STANDAARD_PROFIEL });
              setProfiel(null);
            }}
          />
        </View>
      </Blok>

      <Blok titel="Bronnen">
        <Text style={[styles.klein, { color: theme.textSecondary }]}>
          De app leest alleen deze vaste lijst van redacties, vakmedia en officiële instellingen. Een rood bolletje betekent
          dat de bron bij de laatste poging niet bereikbaar was.
        </Text>
        {(['belgie', 'europa', 'wereld'] as Regio[]).map((regio) => (
          <View key={regio} style={styles.bronGroep}>
            <Text style={[styles.groepTitel, { color: theme.textSecondary }]}>{REGIO_LABEL[regio].toUpperCase()}</Text>
            {SOURCES.filter((s) => s.regio === regio).map((s) => {
              const st = news.status[s.id];
              const kleur = !st ? theme.textSecondary : st.ok ? theme.goed : theme.let;
              return (
                <View key={s.id} style={styles.bron}>
                  <View style={[styles.stip, { backgroundColor: kleur }]} />
                  <View style={styles.keuzeTekst}>
                    <Text style={[styles.bronNaam, { color: theme.text }]}>
                      {s.naam}
                      <Text style={{ color: theme.textSecondary, fontWeight: '500' }}> · {s.land}</Text>
                    </Text>
                    <Text style={[styles.klein, { color: theme.textSecondary }]}>
                      {!st ? 'Nog niet opgehaald' : st.ok ? `${st.aantal} recente koppen` : `Niet bereikbaar (${st.fout ?? 'onbekende fout'})`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </Blok>

      <Blok titel="Hoe betrouwbaar is dit">
        <Text style={[styles.tekst, { color: theme.text }]}>
          Geen enkele app kan garanderen dat nieuws voor de volle honderd procent klopt. Deze app is wel zo gebouwd dat je
          alles kan nagaan.
        </Text>
        {[
          'Nieuws komt alleen uit de vaste bronnenlijst hierboven.',
          'Links en bronnamen komen rechtstreeks uit de feed van de bron, nooit van de AI.',
          'Claude mag bij "Wat gebeurt er" alleen feiten gebruiken die in de aangeleverde artikels staan.',
          'Een groen label betekent dat minstens twee verschillende redacties hetzelfde melden. Een geel label betekent één bron.',
          '"Wat betekent dit voor jou" is interpretatie en staat daarom in een apart kader.',
        ].map((regel) => (
          <View key={regel} style={styles.punt}>
            <Text style={[styles.tekst, { color: theme.accent }]}>•</Text>
            <Text style={[styles.tekst, styles.keuzeTekst, { color: theme.text }]}>{regel}</Text>
          </View>
        ))}
      </Blok>
    </Scherm>
  );
}

function Blok({ titel, children }: { titel: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.blok, { backgroundColor: theme.backgroundElement, borderColor: theme.lijn }]}>
      <Text style={[styles.blokTitel, { color: theme.text }]}>{titel}</Text>
      {children}
    </View>
  );
}

function Knop({ label, onPress, uit, soort }: { label: string; onPress: () => void; uit?: boolean; soort?: 'rustig' }) {
  const theme = useTheme();
  const rustig = soort === 'rustig';
  return (
    <Pressable
      onPress={onPress}
      disabled={uit}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.knop,
        { backgroundColor: rustig ? theme.backgroundSelected : theme.accent, opacity: uit ? 0.4 : pressed ? 0.8 : 1 },
      ]}>
      <Text style={[styles.knopTekst, { color: rustig ? theme.text : theme.background }]}>{label}</Text>
    </Pressable>
  );
}

function Pil({ label, actief, onPress }: { label: string; actief: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: actief }}
      style={[styles.pil, { backgroundColor: actief ? theme.text : 'transparent', borderColor: actief ? theme.text : theme.lijn }]}>
      <Text style={[styles.pilTekst, { color: actief ? theme.background : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  blok: { marginHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: 12 },
  blokTitel: { fontSize: 18, fontWeight: '700' },
  tekst: { fontSize: 15, lineHeight: 22 },
  klein: { fontSize: 13, lineHeight: 18 },
  invoer: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  groot: { minHeight: 120, lineHeight: 21, textAlignVertical: 'top' },
  knoppen: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  knop: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  knopTekst: { fontSize: 15, fontWeight: '700' },
  keuze: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  keuzeTekst: { flex: 1, gap: 2 },
  keuzeTitel: { fontSize: 15.5, fontWeight: '700' },
  bol: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bolBinnen: { width: 10, height: 10, borderRadius: 5 },
  pillen: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pil: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  pilTekst: { fontSize: 14, fontWeight: '600' },
  bronGroep: { gap: Spacing.two },
  groepTitel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, marginTop: Spacing.one },
  bron: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stip: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
  bronNaam: { fontSize: 15, fontWeight: '600' },
  punt: { flexDirection: 'row', gap: Spacing.two },
});
