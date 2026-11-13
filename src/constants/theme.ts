/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FAFAF8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECECEF',
    textSecondary: '#60646C',
    accent: '#0B4F8A',
    accentZacht: '#E6F0FA',
    goed: '#1A7F4B',
    goedZacht: '#E3F4EA',
    let: '#9A6200',
    letZacht: '#FDF1D8',
    lijn: '#E3E4E8',
  },
  dark: {
    text: '#ffffff',
    background: '#0B0C0E',
    backgroundElement: '#191A1D',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#7DB8F2',
    accentZacht: '#12283D',
    goed: '#5FD08F',
    goedZacht: '#11301F',
    let: '#F2B84B',
    letZacht: '#3A2A08',
    lijn: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
