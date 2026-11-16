import React from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { Settings, ThemeKey } from '../types';
import { PALETTES } from '../theme';
import SoundPicker from '../SoundPicker';
import { Btn, Chip, Frame, Header, SERIF, label, useP } from '../ui';

export default function SettingsScreen({ settings, onChange, onResetBrews }: {
  settings: Settings; onChange: (s: Settings) => void; onResetBrews: () => void;
}) {
  const p = useP();
  const row = (title: string, sub: string, key: 'notifications' | 'vibration' | 'fahrenheit') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: p.text, fontSize: 16, fontFamily: SERIF }}>{title}</Text>
        <Text style={{ color: p.dim, fontSize: 13 }}>{sub}</Text>
      </View>
      <Switch value={settings[key]} onValueChange={(v) => onChange({ ...settings, [key]: v })} trackColor={{ true: p.gold, false: p.dim + '66' }} thumbColor={settings[key] ? p.goldSoft : '#ccc'} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Header title="Настройки" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={label(p)}>Тема оформления</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(Object.keys(PALETTES) as ThemeKey[]).map((k) => (
            <Chip key={k} label={PALETTES[k].label} active={settings.theme === k} onPress={() => onChange({ ...settings, theme: k })} />
          ))}
        </View>

        <Text style={label(p)}>Звук таймера по умолчанию</Text>
        <SoundPicker value={settings.sound} onChange={(v) => v !== 'inherit' && onChange({ ...settings, sound: v })} />
        <Text style={{ color: p.dim, fontSize: 13, marginBottom: 4 }}>Для отдельного сорта или таймера звук можно переопределить.</Text>

        <Frame style={{ marginTop: 16 }}>
          {row('Уведомления', 'Сообщить, когда пролив готов, даже если приложение свёрнуто', 'notifications')}
          {row('Вибрация', 'Вибрировать по окончании таймера', 'vibration')}
          {row('Температура в °F', 'Показывать градусы Фаренгейта', 'fahrenheit')}
        </Frame>

        <Btn
          label="Вернуть стандартные сорта"
          variant="outline"
          style={{ marginTop: 24 }}
          onPress={() =>
            Alert.alert('Сбросить список?', 'Все ваши сорта и правки будут удалены, вернутся стандартные.', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Сбросить', style: 'destructive', onPress: onResetBrews },
            ])
          }
        />
      </ScrollView>
    </View>
  );
}
