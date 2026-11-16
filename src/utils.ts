export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(r).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const temp = (c: number, f: boolean) => (f ? `${Math.round((c * 9) / 5 + 32)}°F` : `${c}°C`);

export function parseSteeps(text: string): number[] {
  return text
    .split(/[\s,;]+/)
    .map((x) => Math.round(Number(x.replace(',', '.'))))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 86400);
}
