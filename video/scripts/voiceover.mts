// Mede quando cada trecho marcado do roteiro é falado, para sincronizar as animações com a voz.
// As falas (public/voice/sN.mp3) são geradas pelo conector da ElevenLabs; aqui só transcrevemos
// com timestamps por palavra (speech-to-text) e gravamos src/voice.json.
// Uso (dentro de video/): node --env-file=../.env.local scripts/voiceover.mts [s1 s2 ...]
// A chave vem de ELEVENLABS_API_KEY (no .env.local); nunca fica no código.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SCENES } from '../src/script.ts';

const DATA = 'src/voice.json';
type Timing = { file: string; duration: number; cues: Record<string, number> };
const data: Record<string, Timing> = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : {};
const only = process.argv.slice(2);
const client = new ElevenLabsClient();
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').trim();

for (const s of SCENES) {
  const file = `public/voice/${s.id}.mp3`;
  if ((only.length && !only.includes(s.id)) || !existsSync(file)) continue;
  const audio = readFileSync(file);
  const r = await client.speechToText.convert({
    file: new Blob([audio], { type: 'audio/mpeg' }),
    modelId: 'scribe_v2',
    languageCode: 'por',
    timestampsGranularity: 'word',
    tagAudioEvents: false,
  });
  const words = ('words' in r ? r.words : []).filter((w) => w.type === 'word').map((w) => ({ t: norm(w.text), start: w.start ?? 0 }));
  const cues: Record<string, number> = {};
  let from = 0;
  for (const [name, phrase] of Object.entries(s.cues)) {
    // "a|b": alternativas, porque a transcrição pode escrever "cem" como "100" ou "Theo" como "Téo"
    const alts = phrase.split('|').map((p) => norm(p).split(' '));
    // procura a sequência de palavras do trecho (a partir da última marca encontrada)
    const find = (start: number) => words.findIndex((_, i) => i >= start && alts.some((want) => want.every((p, j) => words[i + j]?.t.startsWith(p))));
    let i = find(from);
    if (i < 0) i = find(0);
    if (i < 0) { console.warn(`  ${s.id}: trecho "${phrase}" não encontrado`); continue; }
    cues[name] = +words[i].start.toFixed(3);
    from = i;
  }
  const duration = await new Input({ formats: ALL_FORMATS, source: new BufferSource(audio) }).computeDuration();
  data[s.id] = { file: `voice/${s.id}.mp3`, duration: +duration.toFixed(3), cues };
  writeFileSync(DATA, JSON.stringify(data, null, 2));
  console.log(`${s.id}: ${duration.toFixed(1)}s, ${Object.keys(cues).length}/${Object.keys(s.cues).length} marcas`);
}
