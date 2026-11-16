export type Kind = 'tea' | 'coffee';
export type ThemeKey = 'imperial' | 'lacquer' | 'paper';
export type SoundId = 'gong' | 'bell' | 'melody' | 'beep' | 'default' | 'silent';

export interface Brew {
  id: string;
  name: string;
  kind: Kind;
  category: string;
  tempC: number;
  grams: number;
  waterMl: number;
  steeps: number[]; // секунды на каждый пролив/этап
  notes: string;
  custom: boolean;
  sound?: SoundId | 'inherit'; // звук именно для этого сорта
}

export interface Settings {
  theme: ThemeKey;
  notifications: boolean;
  vibration: boolean;
  fahrenheit: boolean;
  sound: SoundId; // звук по умолчанию
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

/** Один запущенный таймер. Их может быть сколько угодно, они идут одновременно. */
export interface Timer {
  id: string;
  name: string;
  kind: Kind;
  brewId?: string;
  tempC?: number;
  grams?: number;
  waterMl?: number;
  steeps: number[];
  idx: number;
  total: number;
  remaining: number;
  status: TimerStatus;
  endAt: number;
  sound: SoundId;
  notifId: string | null;
}
