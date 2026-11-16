import { Audio } from 'expo-av';
import { SoundId } from './types';

export const SOUNDS: { id: SoundId; label: string; file: string | null }[] = [
  { id: 'gong', label: 'Гонг', file: 'gong.wav' },
  { id: 'bell', label: 'Колокольчик', file: 'bell.wav' },
  { id: 'melody', label: 'Мелодия', file: 'melody.wav' },
  { id: 'beep', label: 'Сигнал', file: 'beep.wav' },
  { id: 'default', label: 'Системный', file: null },
  { id: 'silent', label: 'Без звука', file: null },
];

const FILES: Partial<Record<SoundId, number>> = {
  gong: require('../assets/sounds/gong.wav'),
  bell: require('../assets/sounds/bell.wav'),
  melody: require('../assets/sounds/melody.wav'),
  beep: require('../assets/sounds/beep.wav'),
};

let current: Audio.Sound | null = null;

/** Проигрывает звук, чтобы послушать его при выборе. */
export async function previewSound(id: SoundId) {
  try {
    if (current) {
      await current.unloadAsync();
      current = null;
    }
    const src = FILES[id];
    if (!src) return;
    const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: true });
    current = sound;
    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && st.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (current === sound) current = null;
      }
    });
  } catch {}
}
