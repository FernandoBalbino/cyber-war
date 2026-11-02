import voice from './voice.json' with { type: 'json' };
import { SCENES } from './script.ts';

export const FPS = 30;
const LEAD = 0.4, TAIL = 0.9; // respiro antes e depois de cada fala (s)
type V = Record<string, { file: string; duration: number; cues: Record<string, number> }>;

// Cena sem áudio ainda: estima pela quantidade de letras, para dar para montar e prever.
const estimate = (text: string, cues: Record<string, string>) => {
  const plain = text.replace(/\[[^\]]+\]\s*/g, '');
  const sec = plain.length / 14.5;
  return {
    duration: sec,
    cues: Object.fromEntries(Object.entries(cues).map(([k, ph]) => [k, (Math.max(0, plain.indexOf(ph.split('|')[0])) / plain.length) * sec])),
  };
};

export const TIMELINE = SCENES.map((s) => {
  const v = (voice as V)[s.id];
  const t = v ?? estimate(s.text, s.cues);
  return {
    id: s.id,
    audio: v?.file,
    lead: Math.round(LEAD * FPS),
    dur: Math.ceil((LEAD + t.duration + TAIL) * FPS),
    cues: Object.fromEntries(Object.entries(t.cues).map(([k, sec]) => [k, Math.round((LEAD + sec) * FPS)])),
  };
});
export const TOTAL = TIMELINE.reduce((a, s) => a + s.dur, 0);
