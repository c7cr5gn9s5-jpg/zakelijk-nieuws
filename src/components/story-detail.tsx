import type { ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BronBadge } from '@/components/bron-badge';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Digest, Story } from '@/lib/types';
import { betrouwbaarheid, bronnenVan, CATEGORIE_LABEL, REGIO_LABEL, relatief } from '@/lib/weergave';

type Props = { story: Story | null; digest: Digest | null; onSluit: () => void };

export function StoryDetail({ story, digest, onSluit }: Props) {
  const theme = useTheme();
  const zichtbaar = !!story && !!digest;

  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluit}>
      {story && digest && (
        <View style={[styles.blad, { backgroundColor: theme.background }]}>
          <View style={[styles.balk, { borderBottomColor: theme.lijn }]}>
            <Text style={[styles.label, { color: theme.accent }]}>
              {CATEGORIE_LABEL[story.categorie].toUpperCase()} · {REGIO_LABEL[story.regio].toUpperCase()}
            </Text>
            <Pressable onPress={onSluit} hitSlop={12} accessibilityRole="button">
              <Text style={[styles.sluit, { color: theme.accent }]}>Sluiten</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.inhoud}>
            <Text style={[styles.titel, { color: theme.text }]}>{story.titel}</Text>
            <BronBadge info={betrouwbaarheid(story, digest)} />

            <Sectie titel="Wat gebeurt er">
              <Text style={[styles.tekst, { color: theme.text }]}>{story.watGebeurt}</Text>
            </Sectie>

            {!!story.waaromBelangrijk && (
              <Sectie titel="Waarom is dit belangrijk">
                <Text style={[styles.tekst, { color: theme.text }]}>{story.waaromBelangrijk}</Text>
              </Sectie>
            )}

            <View style={[styles.kader, { backgroundColor: theme.accentZacht }]}>
              <Text style={[styles.sectieTitel, { color: theme.accent }]}>WAT BETEKENT DIT VOOR JOU</Text>
              <Text style={[styles.tekst, { color: theme.text }]}>{story.impactVoorJou}</Text>
              {story.kansen.length > 0 && (
                <View style={styles.kansen}>
                  <Text style={[styles.kansTitel, { color: theme.text }]}>Kansen en ideeën</Text>
                  {story.kansen.map((k, i) => (
                    <View key={i} style={styles.kans}>
                      <Text style={[styles.tekst, { color: theme.accent }]}>→</Text>
                      <Text style={[styles.tekst, styles.kansTekst, { color: theme.text }]}>{k}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.klein, { color: theme.textSecondary }]}>
                Dit kader is een interpretatie van Claude, bedoeld als inspiratie. Het is geen feit en geen advies.
              </Text>
            </View>

            {!!story.kanttekening && (
              <View style={[styles.kader, { backgroundColor: theme.letZacht }]}>
                <Text style={[styles.sectieTitel, { color: theme.let }]}>KANTTEKENING</Text>
                <Text style={[styles.tekst, { color: theme.text }]}>{story.kanttekening}</Text>
              </View>
            )}

            <Sectie titel="Bronnen">
              <Text style={[styles.klein, { color: theme.textSecondary }]}>
                Tik op een bron om het originele artikel te lezen en de uitleg zelf na te gaan.
              </Text>
              {bronnenVan(story, digest).map(({ item, bron }) => (
                <Pressable
                  key={item.id}
                  onPress={() => void Linking.openURL(item.link).catch(() => {})}
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.bron,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.lijn, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Text style={[styles.bronNaam, { color: theme.accent }]}>
                    {bron?.naam ?? item.sourceId}
                    <Text style={{ color: theme.textSecondary, fontWeight: '500' }}>
                      {bron ? ` · ${bron.land}` : ''} · {relatief(item.datum)}
                    </Text>
                  </Text>
                  <Text style={[styles.bronTitel, { color: theme.text }]}>{item.titel}</Text>
                  <Text style={[styles.klein, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.link.replace(/^https?:\/\/(www\.)?/, '')}
                  </Text>
                </Pressable>
              ))}
            </Sectie>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

function Sectie({ titel, children }: { titel: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectie}>
      <Text style={[styles.sectieTitel, { color: theme.textSecondary }]}>{titel.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blad: { flex: 1 },
  balk: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  sluit: { fontSize: 16, fontWeight: '600' },
  inhoud: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  titel: { fontFamily: Fonts?.serif, fontSize: 26, lineHeight: 33, fontWeight: '700' },
  sectie: { gap: Spacing.two },
  sectieTitel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7 },
  tekst: { fontSize: 16.5, lineHeight: 25 },
  klein: { fontSize: 13, lineHeight: 18 },
  kader: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  kansen: { gap: 6, marginTop: Spacing.one },
  kansTitel: { fontSize: 15, fontWeight: '700' },
  kans: { flexDirection: 'row', gap: Spacing.two },
  kansTekst: { flex: 1 },
  bron: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 4 },
  bronNaam: { fontSize: 13.5, fontWeight: '700' },
  bronTitel: { fontSize: 15.5, lineHeight: 21, fontWeight: '600' },
});
