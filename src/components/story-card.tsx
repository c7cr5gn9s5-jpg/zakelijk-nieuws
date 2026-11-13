import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BronBadge } from '@/components/bron-badge';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Digest, Story } from '@/lib/types';
import { betrouwbaarheid, CATEGORIE_LABEL, recentsteDatum, REGIO_LABEL, relatief } from '@/lib/weergave';

type Props = { story: Story; digest: Digest; onOpen: () => void };

export function StoryCard({ story, digest, onOpen }: Props) {
  const theme = useTheme();
  const info = betrouwbaarheid(story, digest);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.kaart,
        { backgroundColor: theme.backgroundElement, borderColor: theme.lijn, opacity: pressed ? 0.75 : 1 },
      ]}>
      <View style={styles.kop}>
        <Text style={[styles.label, { color: theme.accent }]}>
          {CATEGORIE_LABEL[story.categorie].toUpperCase()} · {REGIO_LABEL[story.regio].toUpperCase()}
        </Text>
        {story.belang === 'hoog' && <Text style={[styles.label, { color: theme.textSecondary }]}>TOPVERHAAL</Text>}
      </View>
      <Text style={[styles.titel, { color: theme.text }]}>{story.titel}</Text>
      <Text style={[styles.tekst, { color: theme.textSecondary }]} numberOfLines={3}>
        {story.watGebeurt}
      </Text>
      <View style={styles.voet}>
        <BronBadge info={info} />
        <Text style={[styles.bronnen, { color: theme.textSecondary }]} numberOfLines={1}>
          {info.namen.join(', ')} · {relatief(recentsteDatum(story, digest))}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kaart: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  kop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  titel: { fontFamily: Fonts?.serif, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  tekst: { fontSize: 15, lineHeight: 22 },
  voet: { gap: 6, marginTop: 2 },
  bronnen: { fontSize: 12.5 },
});
