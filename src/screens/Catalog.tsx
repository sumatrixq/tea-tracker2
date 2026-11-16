import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Brew, Kind, Settings } from '../types';
import { Chip, Frame, Header, SERIF, Seal, useP } from '../ui';
import { fmt, temp } from '../utils';

export default function Catalog({ brews, settings, onAdd, onStart, onEdit, onNew }: {
  brews: Brew[]; settings: Settings; onAdd: (b: Brew) => void; onStart: (b: Brew) => void; onEdit: (id: string) => void; onNew: () => void;
}) {
  const p = useP();
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const list = brews.filter((b) => filter === 'all' || b.kind === filter);

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Header title="茶道 · Каталог" right={{ icon: '＋', onPress: onNew }} />
      <FlatList
        data={list}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 }}>
              <Chip label="Всё" active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Чай" active={filter === 'tea'} onPress={() => setFilter('tea')} />
              <Chip label="Кофе" active={filter === 'coffee'} onPress={() => setFilter('coffee')} />
            </View>
            <Text style={{ color: p.dim, marginBottom: 10, fontFamily: SERIF }}>▶ запускает таймер сразу, касание карточки добавляет его на вкладку «Таймеры». Можно запускать несколько одновременно.</Text>
          </View>
        }
        ListEmptyComponent={<Text style={{ color: p.dim, textAlign: 'center', marginTop: 40, fontFamily: SERIF }}>Пусто. Нажмите ＋, чтобы добавить сорт.</Text>}
        renderItem={({ item: b }) => (
          <Pressable onPress={() => onAdd(b)} style={{ marginBottom: 12 }}>
            <Frame>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Seal char={b.kind === 'tea' ? '茶' : '咖'} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: p.text, fontSize: 18, fontWeight: '700', fontFamily: SERIF }}>{b.name}</Text>
                  <Text style={{ color: p.dim, marginTop: 2 }}>
                    {b.category} · {temp(b.tempC, settings.fahrenheit)} · {b.grams} г / {b.waterMl} мл
                  </Text>
                  <Text style={{ color: p.goldSoft, marginTop: 2 }}>
                    {b.steeps.length > 1 ? `${b.steeps.length} ${b.kind === 'tea' ? 'проливов' : 'этапа'}, от ${fmt(b.steeps[0])}` : fmt(b.steeps[0])}
                    {b.custom ? '  · свой' : ''}
                  </Text>
                </View>
                <Pressable onPress={() => onEdit(b.id)} hitSlop={10} style={{ padding: 6 }}>
                  <Text style={{ color: p.gold, fontSize: 20 }}>✎</Text>
                </Pressable>
                <Pressable onPress={() => onStart(b)} hitSlop={10} style={{ marginLeft: 6, width: 44, height: 44, borderRadius: 22, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: p.onGold, fontSize: 20 }}>▶</Text>
                </Pressable>
              </View>
            </Frame>
          </Pressable>
        )}
      />
    </View>
  );
}
