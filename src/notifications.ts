import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SOUNDS } from './sounds';
import { SoundId } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// На Android звук задаётся каналом и после создания не меняется, поэтому на каждый звук свой канал.
export const channelOf = (s: SoundId) => `brew-${s}`;

export async function setupNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      for (const s of SOUNDS) {
        await Notifications.setNotificationChannelAsync(channelOf(s.id), {
          name: `Таймер: ${s.label}`,
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 400, 200, 400],
          sound: s.file ?? (s.id === 'silent' ? null : 'default'),
        });
      }
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function scheduleDone(seconds: number, title: string, body: string, sound: SoundId): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: sound !== 'silent' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: channelOf(sound),
      },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}
