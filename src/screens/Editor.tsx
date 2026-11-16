import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Brew, Kind, SoundId } from '../types';
import SoundPicker from '../SoundPicker';
import { CATEGORIES } from '../data';
import { Btn, Chip, Header, SERIF, label, useP } from '../ui';
import { fmt, parseSteeps, uid } from '../utils';

export default function Editor({ brew, onSave, onDelete, onBack }: {
  brew?: Brew; onSave: (b: Brew) => void; onDelete: (id: string) => void; onBack: () => void;
}) {
  const p = useP();
  const [name, setName] = useState(brew?.name ?? '');
  const [kind, setKind] = useState<Kind>(brew?.kind ?? 'tea');
  const [category, setCategory] = useState(brew?.category ?? 'Улун');
  const [tempC, setTempC] = useState(String(brew?.tempC ?? 95));
  const [grams, setGrams] = useState(String(brew?.grams ?? 5));
  const [water, setWater] = useState(String(brew?.waterMl ?? 120));
  const [steeps, setSteeps] = useState((brew?.steeps ?? [20, 15, 20, 30, 45]).join(', '));
  const [notes, setNotes] = useState(brew?.notes ?? '');
  const [sound, setSound] = useState<SoundId | 'inherit'>(brew?.sound ?? 'inherit');

  const parsed = parseSteeps(steeps);
  const input = {
    borderWidth: 1.5, borderColor: p.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9,
    color: p.text, backgroundColor: p.card, fontSize: 16, fontFamily: SERIF,
  } as const;

  const pickKind = (k: Kind) => {
    setKind(k);
    if (!CATEGORIES[k].includes(category)) setCategory(CATEGORIES[k][0]);
  };

  const save = () => {
    const t = Number(tempC.replace(',', '.')), g = Number(grams.replace(',', '.')), w = Number(water.replace(',', '.'));
    if (!name.trim()) return Alert.alert('Укажите название', 'Например: «Те Гуань Инь» или «Мой эспрессо».');
    if (!(t >= 1 && t <= 100)) return Alert.alert('Температура', 'Введите число от 1 до 100 °C.');
    if (!(g > 0) || !(w > 0)) return Alert.alert('Дозировка', 'Вес и объём воды должны быть больше нуля.');
    if (parsed.length === 0) return Alert.alert('Таймеры', 'Введите время в секундах через запятую, например: 20, 15, 30.');
    onSave({ id: brew?.id ?? uid(), name: name.trim(), kind, category: category.trim() || 'Другое', tempC: t, grams: g, waterMl: w, steeps: parsed, notes: notes.trim(), sound, custom: brew ? brew.custom : true });
  };

  const del = () =>
    Alert.alert('Удалить?', `«${brew?.name}» будет удалён из списка.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onDelete(brew!.id) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Header title={brew ? 'Редактирование' : 'Новый сорт'} left={{ icon: '‹', onPress: onBack }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={label(p)}>Название</Text>
          <TextInput style={input} value={name} onChangeText={setName} placeholder="Например, Те Гуань Инь" placeholderTextColor={p.dim} />

          <Text style={label(p)}>Напиток</Text>
          <View style={{ flexDirection: 'row' }}>
            <Chip label="Чай" active={kind === 'tea'} onPress={() => pickKind('tea')} />
            <Chip label="Кофе" active={kind === 'coffee'} onPress={() => pickKind('coffee')} />
          </View>

          <Text style={label(p)}>Категория</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {CATEGORIES[kind].map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
          </View>
          <TextInput style={input} value={category} onChangeText={setCategory} placeholder="или впишите свою" placeholderTextColor={p.dim} />

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={label(p)}>Темп., °C</Text>
              <TextInput style={input} value={tempC} onChangeText={setTempC} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={label(p)}>Вес, г</Text>
              <TextInput style={input} value={grams} onChangeText={setGrams} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={label(p)}>Вода, мл</Text>
              <TextInput style={input} value={water} onChangeText={setWater} keyboardType="numeric" />
            </View>
          </View>

          <Text style={label(p)}>Таймеры, секунды (каждый пролив или этап)</Text>
          <TextInput style={input} value={steeps} onChangeText={setSteeps} placeholder="20, 15, 20, 30, 45" placeholderTextColor={p.dim} keyboardType="numbers-and-punctuation" />
          <Text style={{ color: p.dim, marginTop: 6, fontFamily: SERIF }}>
            {parsed.length ? `${parsed.length} шт.: ${parsed.map(fmt).join(' → ')}` : 'Введите числа через запятую'}
          </Text>

          <Text style={label(p)}>Звук таймера для этого сорта</Text>
          <SoundPicker value={sound} onChange={setSound} allowInherit />

          <Text style={label(p)}>Заметки</Text>
          <TextInput style={[input, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Вкус, посуда, помол…" placeholderTextColor={p.dim} />

          <Btn label="Сохранить" onPress={save} style={{ marginTop: 22 }} />
          {brew && <Btn label="Удалить" variant="danger" onPress={del} style={{ marginTop: 10 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
