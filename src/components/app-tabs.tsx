import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Vandaag</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="koppen">
        <NativeTabs.Trigger.Label>Koppen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="instellingen">
        <NativeTabs.Trigger.Label>Instellingen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
