import { ThemeKey } from './types';

export interface Palette {
  label: string;
  bg: string;
  card: string;
  header: string;
  red: string;
  gold: string;
  goldSoft: string;
  text: string;
  dim: string;
  onGold: string;
  statusBar: 'light' | 'dark';
}

export const PALETTES: Record<ThemeKey, Palette> = {
  imperial: {
    label: 'Императорский',
    bg: '#6E0E0E', card: '#8E1616', header: '#4F0808', red: '#B3171B',
    gold: '#E3B341', goldSoft: '#F2D98A', text: '#FBEFD0', dim: '#E2B9A0',
    onGold: '#4A0E0E', statusBar: 'light',
  },
  lacquer: {
    label: 'Чёрный лак',
    bg: '#1C0707', card: '#2E0C0C', header: '#120404', red: '#B3171B',
    gold: '#D4A537', goldSoft: '#E8C766', text: '#F5E6C4', dim: '#B58F7A',
    onGold: '#1C0707', statusBar: 'light',
  },
  paper: {
    label: 'Рисовая бумага',
    bg: '#F4E7C8', card: '#FFF6DD', header: '#A8161B', red: '#A8161B',
    gold: '#B8860B', goldSoft: '#8A6508', text: '#4A0E0E', dim: '#8B5A4A',
    onGold: '#FFF6DD', statusBar: 'light',
  },
};
