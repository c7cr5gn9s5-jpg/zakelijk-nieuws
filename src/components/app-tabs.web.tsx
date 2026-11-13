import { Tabs, TabList, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// De webversie dient alleen om de schermen te bekijken tijdens het ontwikkelen.
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <TabBalk>
          <TabTrigger name="index" href="/" asChild>
            <TabKnop>Vandaag</TabKnop>
          </TabTrigger>
          <TabTrigger name="koppen" href="/koppen" asChild>
            <TabKnop>Koppen</TabKnop>
          </TabTrigger>
          <TabTrigger name="instellingen" href="/instellingen" asChild>
            <TabKnop>Instellingen</TabKnop>
          </TabTrigger>
        </TabBalk>
      </TabList>
    </Tabs>
  );
}

function TabKnop({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...(props as PressableProps)} style={({ pressed }) => pressed && styles.ingedrukt}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.knop}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function TabBalk(props: TabListProps) {
  return (
    <View {...props} style={styles.houder}>
      <ThemedView type="backgroundElement" style={styles.balk}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  houder: { position: 'absolute', width: '100%', padding: Spacing.three, alignItems: 'center' },
  balk: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    maxWidth: MaxContentWidth,
  },
  knop: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Spacing.three },
  ingedrukt: { opacity: 0.7 },
});
