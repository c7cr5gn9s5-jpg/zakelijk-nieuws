import type { ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  titel: string;
  ondertitel?: string;
  children: ReactNode;
  verversen?: { bezig: boolean; actie: () => void };
};

/** Gedeeld kader voor elk tabblad: grote titel, veilige randen, optioneel omlaag trekken om te verversen. */
export function Scherm({ titel, ondertitel, children, verversen }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.inhoud,
        {
          paddingTop: insets.top + Spacing.three + (Platform.OS === 'web' ? Spacing.six : 0),
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        verversen ? (
          <RefreshControl refreshing={verversen.bezig} onRefresh={verversen.actie} tintColor={theme.textSecondary} />
        ) : undefined
      }>
      <View style={styles.kop}>
        <Text style={[styles.titel, { color: theme.text }]}>{titel}</Text>
        {!!ondertitel && <Text style={[styles.ondertitel, { color: theme.textSecondary }]}>{ondertitel}</Text>}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inhoud: { gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  kop: { paddingHorizontal: Spacing.three, gap: 2 },
  titel: { fontFamily: Fonts?.serif, fontSize: 34, lineHeight: 40, fontWeight: '700' },
  ondertitel: { fontSize: 13.5, lineHeight: 19 },
});
