import AsyncStorage from '@react-native-async-storage/async-storage';
import { Brew, Settings } from './types';
import { DEFAULT_BREWS } from './data';

const K_BREWS = 'chai2.brews.v1';
const K_SETTINGS = 'chai2.settings.v1';

export const DEFAULT_SETTINGS: Settings = { theme: 'imperial', notifications: true, vibration: true, fahrenheit: false, sound: 'gong' };

export async function loadBrews(): Promise<Brew[]> {
  try {
    const s = await AsyncStorage.getItem(K_BREWS);
    if (s) return JSON.parse(s) as Brew[];
  } catch {}
  return DEFAULT_BREWS;
}
export const saveBrews = (b: Brew[]) => AsyncStorage.setItem(K_BREWS, JSON.stringify(b)).catch(() => {});

export async function loadSettings(): Promise<Settings> {
  try {
    const s = await AsyncStorage.getItem(K_SETTINGS);
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem(K_SETTINGS, JSON.stringify(s)).catch(() => {});
