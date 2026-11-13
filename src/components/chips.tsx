import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string> = {
  opties: { waarde: T; label: string }[];
  gekozen: T;
  onKies: (waarde: T) => void;
};

/** Eén rij keuzeknoppen die horizontaal scrolt als ze niet op het scherm past. */
export function Chips<T extends string>({ opties, gekozen, onKies }: Props<T>) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rij}>
      {opties.map((o) => {
        const actief = o.waarde === gekozen;
        return (
          <Pressable
            key={o.waarde}
            onPress={() => onKies(o.waarde)}
            accessibilityRole="button"
            accessibilityState={{ selected: actief }}
            style={[
              styles.chip,
              { backgroundColor: actief ? theme.text : theme.backgroundElement, borderColor: actief ? theme.text : theme.lijn },
            ]}>
            <Text style={[styles.tekst, { color: actief ? theme.background : theme.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rij: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  tekst: { fontSize: 14, fontWeight: '600' },
});
