import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { Betrouwbaarheid } from '@/lib/weergave';

/** Toont in één oogopslag hoe stevig een verhaal onderbouwd is. */
export function BronBadge({ info }: { info: Betrouwbaarheid }) {
  const theme = useTheme();
  const stevig = info.niveau !== 'enkel';
  return (
    <View style={[styles.badge, { backgroundColor: stevig ? theme.goedZacht : theme.letZacht }]}>
      <Text style={[styles.tekst, { color: stevig ? theme.goed : theme.let }]}>
        {stevig ? '✓ ' : '! '}
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  tekst: { fontSize: 12.5, fontWeight: '700' },
});
