import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { STANDAARD_SETTINGS } from './schedule';
import type { Digest, NewsItem, Settings, SourceStatus } from './types';

const K = {
  items: 'nieuws.items.v1',
  status: 'nieuws.status.v1',
  digest: 'nieuws.digest.v1',
  settings: 'nieuws.settings.v1',
  teller: 'nieuws.teller.v1',
  apiKey: 'nieuws.anthropicKey',
};

async function lees<T>(sleutel: string, standaard: T): Promise<T> {
  try {
    const ruw = await AsyncStorage.getItem(sleutel);
    return ruw ? (JSON.parse(ruw) as T) : standaard;
  } catch {
    return standaard;
  }
}

async function schrijf(sleutel: string, waarde: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(sleutel, JSON.stringify(waarde));
  } catch {
    // Cache is een gemak, geen vereiste: bij een volle opslag werkt de app gewoon door.
  }
}

export type Teller = { dag: string; aantal: number };

export const opslag = {
  leesItems: () => lees<NewsItem[]>(K.items, []),
  schrijfItems: (v: NewsItem[]) => schrijf(K.items, v),
  leesStatus: () => lees<Record<string, SourceStatus>>(K.status, {}),
  schrijfStatus: (v: Record<string, SourceStatus>) => schrijf(K.status, v),
  leesDigest: () => lees<Digest | null>(K.digest, null),
  schrijfDigest: (v: Digest) => schrijf(K.digest, v),
  leesSettings: async (): Promise<Settings> => {
    const s = { ...STANDAARD_SETTINGS, ...(await lees<Partial<Settings>>(K.settings, {})) };
    // Een leeg adres uit een oudere versie mag het ingebouwde adres niet verbergen.
    return { ...s, briefingUrl: s.briefingUrl || STANDAARD_SETTINGS.briefingUrl };
  },
  schrijfSettings: (v: Settings) => schrijf(K.settings, v),
  leesTeller: () => lees<Teller>(K.teller, { dag: '', aantal: 0 }),
  schrijfTeller: (v: Teller) => schrijf(K.teller, v),
};

// De API-sleutel hoort in de versleutelde sleutelhanger van iOS, niet in gewone opslag.
// Op het web bestaat die niet; daar is de app alleen bedoeld om te testen.
export const sleutelOpslag = {
  async lees(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return await AsyncStorage.getItem(K.apiKey);
      return await SecureStore.getItemAsync(K.apiKey);
    } catch {
      return null;
    }
  },
  async schrijf(sleutel: string): Promise<void> {
    if (Platform.OS === 'web') await AsyncStorage.setItem(K.apiKey, sleutel);
    else await SecureStore.setItemAsync(K.apiKey, sleutel);
  },
  async wis(): Promise<void> {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(K.apiKey);
    else await SecureStore.deleteItemAsync(K.apiKey);
  },
};
