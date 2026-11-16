import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Brew, Kind, Settings, SoundId, Timer } from './types';
import { cancelNotification, scheduleDone } from './notifications';
import { uid } from './utils';

const KEY = 'chai2.timers.v1';

export const secondsLeft = (t: Timer, now: number) =>
  t.status === 'running' ? Math.max(0, Math.ceil((t.endAt - now) / 1000)) : t.remaining;

export interface TimersApi {
  timers: Timer[];
  now: number;
  runningCount: number;
  addFromBrew: (b: Brew, autostart?: boolean) => void;
  addQuick: (p: { name: string; kind: Kind; seconds: number; sound: SoundId }, autostart?: boolean) => void;
  start: (id: string) => void;
  pause: (id: string) => void;
  reset: (id: string) => void;
  goStep: (id: string, i: number) => void;
  adjust: (id: string, delta: number) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  setSound: (id: string, sound: SoundId) => void;
  setSteeps: (id: string, steeps: number[]) => void;
  clearDone: () => void;
}

const Ctx = createContext<TimersApi>(null as unknown as TimersApi);
export const useTimers = () => useContext(Ctx);

export function TimersProvider({ settings, children }: { settings: Settings; children: React.ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(Date.now());
  const ref = useRef<Timer[]>([]);
  ref.current = timers;
  const st = useRef(settings);
  st.current = settings;
  const loaded = useRef(false);
  const finishing = useRef(new Set<string>());

  const find = (id: string) => ref.current.find((t) => t.id === id);
  const upd = (id: string, p: Partial<Timer>) => {
    if (p.status !== undefined && p.status !== 'done') finishing.current.delete(id);
    setTimers((l) => l.map((t) => (t.id === id ? { ...t, ...p } : t)));
  };

  // Ставит системное уведомление на момент окончания. Оно сработает и при свёрнутом приложении.
  const arm = async (t: Timer, seconds: number, endAt: number) => {
    if (!st.current.notifications) return;
    const unit = t.kind === 'tea' ? 'Пролив' : 'Этап';
    const body = t.steeps.length > 1 ? `${unit} ${t.idx + 1} из ${t.steeps.length} завершён` : 'Время вышло';
    const nid = await scheduleDone(seconds, `${t.name}: готово`, body, t.sound);
    if (!nid) return;
    const cur = ref.current.find((x) => x.id === t.id) ?? t;
    if (cur.status === 'running' && cur.endAt === endAt) upd(t.id, { notifId: nid });
    else cancelNotification(nid);
  };

  const left = (t: Timer) => (t.status === 'running' ? Math.max(1, Math.ceil((t.endAt - Date.now()) / 1000)) : t.remaining);

  const api: TimersApi = {
    timers,
    now,
    runningCount: timers.filter((t) => t.status === 'running').length,

    addFromBrew: (b, autostart) => {
      const sound: SoundId = b.sound && b.sound !== 'inherit' ? b.sound : st.current.sound;
      const base: Timer = {
        id: uid(), name: b.name, kind: b.kind, brewId: b.id, tempC: b.tempC, grams: b.grams, waterMl: b.waterMl,
        steeps: b.steeps, idx: 0, total: b.steeps[0], remaining: b.steeps[0], status: 'idle', endAt: 0, sound, notifId: null,
      };
      const t = autostart ? { ...base, status: 'running' as const, endAt: Date.now() + base.remaining * 1000 } : base;
      setTimers((l) => [...l, t]);
      if (autostart) arm(t, t.remaining, t.endAt);
    },

    addQuick: (p, autostart) => {
      const base: Timer = {
        id: uid(), name: p.name, kind: p.kind, steeps: [p.seconds], idx: 0, total: p.seconds, remaining: p.seconds,
        status: 'idle', endAt: 0, sound: p.sound, notifId: null,
      };
      const t = autostart ? { ...base, status: 'running' as const, endAt: Date.now() + p.seconds * 1000 } : base;
      setTimers((l) => [...l, t]);
      if (autostart) arm(t, t.remaining, t.endAt);
    },

    start: (id) => {
      const t = find(id);
      if (!t || t.status === 'running') return;
      const rem = t.status === 'done' ? t.total : t.remaining;
      const endAt = Date.now() + rem * 1000;
      upd(id, { status: 'running', endAt, remaining: rem });
      arm({ ...t, status: 'running', endAt, remaining: rem }, rem, endAt);
    },

    pause: (id) => {
      const t = find(id);
      if (!t || t.status !== 'running') return;
      cancelNotification(t.notifId);
      upd(id, { status: 'paused', remaining: left(t), notifId: null });
    },

    reset: (id) => {
      const t = find(id);
      if (!t) return;
      cancelNotification(t.notifId);
      upd(id, { status: 'idle', remaining: t.total, notifId: null });
    },

    goStep: (id, i) => {
      const t = find(id);
      if (!t || i < 0 || i >= t.steeps.length) return;
      cancelNotification(t.notifId);
      upd(id, { idx: i, total: t.steeps[i], remaining: t.steeps[i], status: 'idle', notifId: null });
    },

    adjust: (id, delta) => {
      const t = find(id);
      if (!t || t.status === 'done') return;
      const next = Math.max(5, left(t) + delta);
      const total = Math.max(5, t.total + delta);
      if (t.status === 'running') {
        cancelNotification(t.notifId);
        const endAt = Date.now() + next * 1000;
        upd(id, { total, remaining: next, endAt, notifId: null });
        arm({ ...t, endAt }, next, endAt);
      } else upd(id, { total, remaining: next });
    },

    remove: (id) => {
      const t = find(id);
      if (t) cancelNotification(t.notifId);
      finishing.current.delete(id);
      setTimers((l) => l.filter((x) => x.id !== id));
    },

    rename: (id, name) => upd(id, { name }),

    setSound: (id, sound) => {
      const t = find(id);
      if (!t) return;
      upd(id, { sound });
      if (t.status === 'running') {
        cancelNotification(t.notifId);
        upd(id, { notifId: null });
        arm({ ...t, sound }, left(t), t.endAt);
      }
    },

    setSteeps: (id, steeps) => {
      const t = find(id);
      if (!t || steeps.length === 0) return;
      cancelNotification(t.notifId);
      const idx = Math.min(t.idx, steeps.length - 1);
      upd(id, { steeps, idx, total: steeps[idx], remaining: steeps[idx], status: 'idle', notifId: null });
    },

    clearDone: () => setTimers((l) => l.filter((t) => t.status !== 'done')),
  };

  // Один общий тик. Остаток считается по метке окончания, поэтому время не «уплывает» в фоне.
  useEffect(() => {
    const i = setInterval(() => {
      const n = Date.now();
      setNow(n);
      ref.current.forEach((t) => {
        if (t.status === 'running' && t.endAt <= n && !finishing.current.has(t.id)) {
          finishing.current.add(t.id);
          upd(t.id, { status: 'done', remaining: 0, notifId: null });
          if (st.current.vibration && n - t.endAt < 4000) Vibration.vibrate([0, 500, 250, 500, 250, 500]);
        }
      });
    }, 250);
    return () => clearInterval(i);
  }, []);

  // Восстановление таймеров после перезапуска приложения.
  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(KEY);
        if (s) {
          const n = Date.now();
          const arr = JSON.parse(s) as Timer[];
          setTimers(arr.map((t) => (t.status === 'running' && t.endAt <= n ? { ...t, status: 'done' as const, remaining: 0, notifId: null } : t)));
        }
      } catch {}
      loaded.current = true;
    })();
  }, []);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(timers)).catch(() => {});
  }, [timers]);

  const anyRunning = api.runningCount > 0;
  useEffect(() => {
    if (anyRunning) activateKeepAwakeAsync('timers').catch(() => {});
    else deactivateKeepAwake('timers').catch(() => {});
  }, [anyRunning]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
