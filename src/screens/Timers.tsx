import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { Kind, Settings, SoundId, Timer } from '../types';
import { secondsLeft, useTimers } from '../timers';
import SoundPicker from '../SoundPicker';
import { Btn, Chip, Frame, Header, SERIF, Seal, label, useP } from '../ui';
import { fmt, parseSteeps, temp } from '../utils';

function TimerCard({ t, fahrenheit }: { t: Timer; fahrenheit: boolean }) {
  const p = useP();
  const api = useTimers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(t.name);
  const [steepsText, setSteepsText] = useState(t.steeps.join(', '));

  const sec = secondsLeft(t, api.now);
  const unit = t.kind === 'tea' ? 'Пролив' : 'Этап';
  const last = t.idx >= t.steeps.length - 1;
  const progress = t.total > 0 ? Math.min(1, Math.max(0, 1 - sec / t.total)) : 0;
  const done = t.status === 'done';
  const info = [t.tempC != null ? temp(t.tempC, fahrenheit) : '', t.grams != null ? `${t.grams} г / ${t.waterMl} мл` : ''].filter(Boolean).join(' · ');
  const input = { borderWidth: 1.5, borderColor: p.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: p.text, backgroundColor: p.bg, fontSize: 16, fontFamily: SERIF } as const;

  const del = () => {
    if (t.status === 'running' || t.status === 'paused') {
      Alert.alert('Удалить таймер?', `«${t.name}» будет остановлен.`, [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => api.remove(t.id) },
      ]);
    } else api.remove(t.id);
  };

  return (
    <Frame style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Seal char={t.kind === 'tea' ? '茶' : '咖'} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: p.text, fontSize: 18, fontWeight: '700', fontFamily: SERIF }} numberOfLines={1}>{t.name}</Text>
          <Text style={{ color: p.dim, fontSize: 13 }} numberOfLines={1}>
            {t.steeps.length > 1 ? `${unit} ${t.idx + 1}/${t.steeps.length}` : 'Один таймер'}{info ? ` · ${info}` : ''}
          </Text>
        </View>
        <Text onPress={() => setOpen((o) => !o)} style={{ color: p.gold, fontSize: 22, padding: 6 }}>⚙</Text>
        <Text onPress={del} style={{ color: p.gold, fontSize: 22, padding: 6 }}>✕</Text>
      </View>

      <Text style={{ color: done ? p.gold : p.text, fontSize: 54, fontWeight: '700', fontFamily: SERIF, textAlign: 'center', marginTop: 8 }}>{fmt(sec)}</Text>
      <Text style={{ color: p.dim, textAlign: 'center', fontFamily: SERIF, marginBottom: 8 }}>
        {done ? (last ? 'Готово 🍵' : 'Сливайте!') : t.status === 'paused' ? 'пауза' : t.status === 'running' ? 'идёт заваривание' : 'готов к запуску'}
      </Text>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: p.bg, borderWidth: 1, borderColor: p.gold, overflow: 'hidden', marginBottom: 12 }}>
        <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: p.gold }} />
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {t.status === 'running' ? (
          <Btn label="Пауза" onPress={() => api.pause(t.id)} style={{ flex: 1, marginRight: 8 }} />
        ) : done ? (
          <Btn label={last ? 'Заново' : `${unit} ${t.idx + 2} →`} onPress={() => api.goStep(t.id, last ? 0 : t.idx + 1)} style={{ flex: 1, marginRight: 8 }} />
        ) : (
          <Btn label={t.status === 'paused' ? 'Продолжить' : 'Старт'} onPress={() => api.start(t.id)} style={{ flex: 1, marginRight: 8 }} />
        )}
        <Btn label="Сброс" variant="outline" onPress={() => api.reset(t.id)} disabled={t.status === 'idle' && t.remaining === t.total} style={{ flex: 1 }} />
      </View>

      {!done && (
        <View style={{ flexDirection: 'row' }}>
          <Btn small label="−10 с" variant="outline" onPress={() => api.adjust(t.id, -10)} style={{ flex: 1, marginRight: 6 }} />
          <Btn small label="+10 с" variant="outline" onPress={() => api.adjust(t.id, 10)} style={{ flex: 1, marginRight: 6 }} />
          {t.steeps.length > 1 && (
            <>
              <Btn small label="‹" variant="outline" onPress={() => api.goStep(t.id, t.idx - 1)} disabled={t.idx === 0 || t.status === 'running'} style={{ flex: 1, marginRight: 6 }} />
              <Btn small label="›" variant="outline" onPress={() => api.goStep(t.id, t.idx + 1)} disabled={last || t.status === 'running'} style={{ flex: 1 }} />
            </>
          )}
        </View>
      )}

      {open && (
        <View style={{ marginTop: 6 }}>
          <Text style={label(p)}>Название таймера</Text>
          <TextInput style={input} value={name} onChangeText={setName} onEndEditing={() => api.rename(t.id, name.trim() || t.name)} />
          <Text style={label(p)}>Время проливов, секунды</Text>
          <TextInput
            style={input}
            value={steepsText}
            onChangeText={setSteepsText}
            keyboardType="numbers-and-punctuation"
            onEndEditing={() => {
              const s = parseSteeps(steepsText);
              if (s.length && s.join() !== t.steeps.join()) api.setSteeps(t.id, s);
              else setSteepsText(t.steeps.join(', '));
            }}
          />
          <Text style={{ color: p.dim, fontSize: 13, marginTop: 4 }}>Изменение времени сбросит таймер на первый пролив.</Text>
          <Text style={label(p)}>Звук этого таймера</Text>
          <SoundPicker value={t.sound} onChange={(v) => v !== 'inherit' && api.setSound(t.id, v)} />
        </View>
      )}
    </Frame>
  );
}

function QuickTimer({ visible, onClose, defaultSound }: { visible: boolean; onClose: () => void; defaultSound: SoundId }) {
  const p = useP();
  const api = useTimers();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Kind>('tea');
  const [min, setMin] = useState('3');
  const [sec, setSec] = useState('0');
  const [sound, setSound] = useState<SoundId>(defaultSound);
  const input = { borderWidth: 1.5, borderColor: p.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: p.text, backgroundColor: p.bg, fontSize: 18, fontFamily: SERIF } as const;

  const go = () => {
    const s = Math.round(Number(min) || 0) * 60 + Math.round(Number(sec) || 0);
    if (s < 5 || s > 86400) return Alert.alert('Время', 'Введите время от 5 секунд до 24 часов.');
    api.addQuick({ name: name.trim() || (kind === 'tea' ? 'Чай' : 'Кофе'), kind, seconds: s, sound }, true);
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000AA' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }} keyboardShouldPersistTaps="handled">
          <Frame>
            <Text style={{ color: p.gold, fontSize: 22, fontWeight: '700', fontFamily: SERIF }}>Свой таймер</Text>
            <Text style={label(p)}>Название</Text>
            <TextInput style={input} value={name} onChangeText={setName} placeholder="Например, Чашка для мамы" placeholderTextColor={p.dim} />
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <Chip label="Чай" active={kind === 'tea'} onPress={() => setKind('tea')} />
              <Chip label="Кофе" active={kind === 'coffee'} onPress={() => setKind('coffee')} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={label(p)}>Минуты</Text>
                <TextInput style={input} value={min} onChangeText={setMin} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={label(p)}>Секунды</Text>
                <TextInput style={input} value={sec} onChangeText={setSec} keyboardType="numeric" />
              </View>
            </View>
            <Text style={label(p)}>Звук</Text>
            <SoundPicker value={sound} onChange={(v) => v !== 'inherit' && setSound(v)} />
            <Btn label="Запустить" onPress={go} style={{ marginTop: 16 }} />
            <Btn label="Отмена" variant="outline" onPress={onClose} style={{ marginTop: 8 }} />
          </Frame>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function TimersScreen({ settings, onCatalog }: { settings: Settings; onCatalog: () => void }) {
  const p = useP();
  const api = useTimers();
  const [quick, setQuick] = useState(false);
  const hasDone = api.timers.some((t) => t.status === 'done');

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Header title="Таймеры" right={{ icon: '＋', onPress: () => setQuick(true) }} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {api.timers.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: p.dim, textAlign: 'center', fontFamily: SERIF, marginBottom: 16, lineHeight: 22 }}>
              Таймеров пока нет. Запустите сорт из каталога или нажмите ＋, чтобы поставить свой. Идти могут сразу несколько таймеров.
            </Text>
            <Btn label="Открыть каталог" onPress={onCatalog} />
          </View>
        )}
        {api.timers.map((t) => <TimerCard key={t.id} t={t} fahrenheit={settings.fahrenheit} />)}
        {hasDone && <Btn label="Убрать готовые" variant="outline" onPress={api.clearDone} />}
      </ScrollView>
      <QuickTimer visible={quick} onClose={() => setQuick(false)} defaultSound={settings.sound} />
    </View>
  );
}
