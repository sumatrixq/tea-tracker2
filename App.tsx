import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Brew, Settings } from './src/types';
import { DEFAULT_BREWS } from './src/data';
import { DEFAULT_SETTINGS, loadBrews, loadSettings, saveBrews, saveSettings } from './src/storage';
import { setupNotifications } from './src/notifications';
import { PALETTES } from './src/theme';
import { TabBar, ThemeCtx } from './src/ui';
import { TimersProvider, useTimers } from './src/timers';
import Catalog from './src/screens/Catalog';
import TimersScreen from './src/screens/Timers';
import Editor from './src/screens/Editor';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'catalog' | 'timers' | 'settings';

function Main({ brews, setBrews, settings, setSettings }: {
  brews: Brew[]; setBrews: React.Dispatch<React.SetStateAction<Brew[]>>; settings: Settings; setSettings: (s: Settings) => void;
}) {
  const timers = useTimers();
  const [tab, setTab] = useState<Tab>('catalog');
  const [edit, setEdit] = useState<{ id?: string } | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (edit) { setEdit(null); return true; }
      if (tab !== 'catalog') { setTab('catalog'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [edit, tab]);

  if (edit) {
    return (
      <Editor
        brew={brews.find((b) => b.id === edit.id)}
        onBack={() => setEdit(null)}
        onSave={(b) => { setBrews((l) => (l.some((x) => x.id === b.id) ? l.map((x) => (x.id === b.id ? b : x)) : [...l, b])); setEdit(null); }}
        onDelete={(id) => { setBrews((l) => l.filter((x) => x.id !== id)); setEdit(null); }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'catalog' && (
          <Catalog
            brews={brews}
            settings={settings}
            onEdit={(id) => setEdit({ id })}
            onNew={() => setEdit({})}
            onAdd={(b) => { timers.addFromBrew(b, false); setTab('timers'); }}
            onStart={(b) => { timers.addFromBrew(b, true); setTab('timers'); }}
          />
        )}
        {tab === 'timers' && <TimersScreen settings={settings} onCatalog={() => setTab('catalog')} />}
        {tab === 'settings' && <SettingsScreen settings={settings} onChange={setSettings} onResetBrews={() => setBrews(DEFAULT_BREWS)} />}
      </View>
      <TabBar
        active={tab}
        onChange={(k) => setTab(k as Tab)}
        tabs={[
          { key: 'catalog', label: 'Каталог', icon: '茶' },
          { key: 'timers', label: 'Таймеры', icon: '⏳', badge: timers.runningCount },
          { key: 'settings', label: 'Настройки', icon: '⚙' },
        ]}
      />
    </View>
  );
}

export default function App() {
  const [brews, setBrews] = useState<Brew[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setBrews(await loadBrews());
      setSettings(await loadSettings());
      setReady(true);
      setupNotifications();
    })();
  }, []);
  useEffect(() => { if (ready) saveBrews(brews); }, [brews, ready]);
  useEffect(() => { if (ready) saveSettings(settings); }, [settings, ready]);

  const palette = PALETTES[settings.theme];
  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;

  return (
    <ThemeCtx.Provider value={palette}>
      <StatusBar style="light" />
      <TimersProvider settings={settings}>
        <Main brews={brews} setBrews={setBrews} settings={settings} setSettings={setSettings} />
      </TimersProvider>
    </ThemeCtx.Provider>
  );
}
