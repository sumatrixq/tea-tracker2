import React from 'react';
import { View } from 'react-native';
import { SoundId } from './types';
import { SOUNDS, previewSound } from './sounds';
import { Chip } from './ui';

type Value = SoundId | 'inherit';

/** Выбор звука таймера. При выборе звук сразу проигрывается. */
export default function SoundPicker({ value, onChange, allowInherit }: { value: Value; onChange: (v: Value) => void; allowInherit?: boolean }) {
  const pick = (v: Value) => {
    onChange(v);
    if (v !== 'inherit') previewSound(v);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {allowInherit && <Chip label="По умолчанию" active={value === 'inherit'} onPress={() => pick('inherit')} />}
      {SOUNDS.map((s) => (
        <Chip key={s.id} label={s.label} active={value === s.id} onPress={() => pick(s.id)} />
      ))}
    </View>
  );
}
