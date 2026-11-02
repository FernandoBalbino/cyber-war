// Mostra em que quadro começa cada cena e onde caem as marcas (para conferir prints).
import { TIMELINE } from '../src/timing.ts';
let from = 0;
for (const s of TIMELINE) { console.log(s.id, 'início', from, 'dur', s.dur, JSON.stringify(s.cues)); from += s.dur; }
console.log('total', from, `${(from / 30).toFixed(1)}s`);
