import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chips } from '@/components/chips';
import { Scherm } from '@/components/scherm';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SOURCE_BY_ID } from '@/lib/sources';
import type { Regio } from '@/lib/types';
import { relatief } from '@/lib/weergave';
import { useNews } from '@/state/news';

type Filter = 'alles' | Regio;

const FILTERS: { waarde: Filter; label: string }[] = [
  { waarde: 'alles', label: 'Alle bronnen' },
  { waarde: 'belgie', label: 'Belgische' },
  { waarde: 'europa', label: 'Europese' },
  { waarde: 'wereld', label: 'Wereldwijde' },
];

const MAX_ZICHTBAAR = 150;

/** De ruwe koppen, rechtstreeks uit de feeds en zonder tussenkomst van AI. */
export default function KoppenScherm() {
  const theme = useTheme();
  const news = useNews();
  const [filter, setFilter] = useState<Filter>('alles');

  const zichtbaar = news.items
    .filter((i) => filter === 'alles' || SOURCE_BY_ID[i.sourceId]?.regio === filter)
    .slice(0, MAX_ZICHTBAAR);

  return (
    <Scherm
      titel="Koppen"
      ondertitel="Rechtstreeks van de bron, nieuwste eerst. Hier komt geen AI aan te pas."
      verversen={{ bezig: news.feedsBezig, actie: () => void news.ververs() }}>
      <Chips opties={FILTERS} gekozen={filter} onKies={setFilter} />
      <View style={[styles.lijst, { backgroundColor: theme.backgroundElement, borderColor: theme.lijn }]}>
        {zichtbaar.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => void openBrowserAsync(item.link)}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.rij,
              { borderTopColor: theme.lijn, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.meta, { color: theme.accent }]}>
              {SOURCE_BY_ID[item.sourceId]?.naam ?? item.sourceId}
              <Text style={{ color: theme.textSecondary, fontWeight: '500' }}> · {relatief(item.datum)}</Text>
            </Text>
            <Text style={[styles.titel, { color: theme.text }]}>{item.titel}</Text>
          </Pressable>
        ))}
        {zichtbaar.length === 0 && (
          <Text style={[styles.leeg, { color: theme.textSecondary }]}>
            {news.feedsBezig ? 'Koppen ophalen…' : 'Geen koppen. Trek omlaag om te verversen.'}
          </Text>
        )}
      </View>
    </Scherm>
  );
}

const styles = StyleSheet.create({
  lijst: { marginHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  rij: { paddingHorizontal: Spacing.three, paddingVertical: 12, gap: 3 },
  meta: { fontSize: 12.5, fontWeight: '700' },
  titel: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  leeg: { fontSize: 15, textAlign: 'center', padding: Spacing.five },
});
