import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Bg, Burst, C, Chip, F, Tag, Tiles, Title, ease, useCue } from '../kit';
import { Lock3D } from '../Lock3D';

// Cantos e rótulos de "central de operações"
function Hud({ p }: { p: number }) {
  const corner = (s: React.CSSProperties) => (
    <div style={{ position: 'absolute', width: 140 * p, height: 140 * p, borderColor: C.blue, borderStyle: 'solid', borderWidth: 0, opacity: p, ...s }} />
  );
  return (
    <AbsoluteFill style={{ font: `700 30px ${F.m}`, color: C.blue }}>
      {corner({ left: 60, top: 60, borderLeftWidth: 6, borderTopWidth: 6 })}
      {corner({ right: 60, top: 60, borderRightWidth: 6, borderTopWidth: 6 })}
      {corner({ left: 60, bottom: 60, borderLeftWidth: 6, borderBottomWidth: 6 })}
      {corner({ right: 60, bottom: 60, borderRightWidth: 6, borderBottomWidth: 6 })}
      <div style={{ position: 'absolute', left: 100, top: 96, opacity: p }}>CENTRAL DE OPERAÇÕES</div>
      <div style={{ position: 'absolute', right: 100, top: 96, opacity: p, color: C.red }}>● AO VIVO</div>
      <div style={{ position: 'absolute', left: 100, bottom: 96, opacity: p, color: C.mute }}>SALA 4GE8 · 30 AGENTES</div>
    </AbsoluteFill>
  );
}

export function S1() {
  const { frame, fps, p, pop, at } = useCue();
  const t = pop('title', 0, 9);
  const out = p('weapon', 0.6);
  const lock = p('pw', 0.25);
  const glitch = frame > at('title') + 4 && frame < at('title') + 16 && frame % 4 < 2;
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ opacity: ease(frame, [0, 20], [0, 1]) }}>
        <Lock3D spin={Math.sin(frame / 40) * 0.6} open={1 - lock} scale={interpolate(out, [0, 1], [0.62, 0.8]) + lock * 0.04} y={interpolate(out, [0, 1], [1.1, 0.9])} />
      </AbsoluteFill>
      <Hud p={p('ops', 0.7)} />
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150 }}>
        <div style={{ scale: interpolate(t, [0, 1], [1.8, 1]) * (1 - out * 0.3), opacity: Math.min(t, 1) * (1 - out), translate: glitch ? '10px 0' : undefined }}>
          <Title size={190} style={{ textShadow: glitch ? '-10px 0 #00e5ff' : '0 0 60px rgba(59,167,255,.5)' }}>
            <span style={{ color: C.blue }}>CYBER</span> <span style={{ color: C.red }}>WAR</span>
          </Title>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120, opacity: p('pw', 0.3) }}>
        <div style={{ scale: ease(frame, [at('pw'), at('pw') + 0.4 * fps], [0.6, 1], Easing.back(1.8)) }}>
          <Tiles word="SENHA" size={130} />
        </div>
      </AbsoluteFill>
      <Burst p={ease(frame, [at('title'), at('title') + 18], [0, 1])} color={C.blue} y={330} r={420} />
      <Burst p={ease(frame, [at('pw') + 6, at('pw') + 26], [0, 1])} color={C.ok} y={-60} r={380} />
    </AbsoluteFill>
  );
}

const WEAK = ['gatos', 'porta', '123456', 'senha', 'bolas'];
export function S10() {
  const { frame, fps, p, pop, at, after } = useCue();
  const fall = (i: number) => Math.max(0, frame - at('simple', 0.6 + i * 0.12));
  const strong = p('strong', 0.4);
  const ready = p('ready', 0.5);
  const go = pop('go', 0, 9);
  const shown = 'Gatoazul7#'.slice(0, Math.round(ease(frame, [at('strong'), at('strong') + 1.2 * fps], [4, 10])));
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ opacity: 1 - strong, alignItems: 'center', justifyContent: 'center', gap: 60 }}>
        <Title size={110}>Palavras simples...</Title>
        <div style={{ display: 'flex', gap: 30 }}>
          {WEAK.map((w, i) => {
            const t = fall(i) / fps;
            return <Chip key={w} w={w} size={54} state="pick" style={{ translate: `0 ${t * t * 900}px`, rotate: `${t * (i % 2 ? 160 : -140)}deg`, opacity: Math.max(0, 1 - t * 0.9) }} />;
          })}
        </div>
        <div style={{ font: `700 64px ${F.d}`, color: C.red, opacity: p('simple', 0.4, 0.9) }}>...caem rápido!</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: strong * (1 - ready), alignItems: 'center', justifyContent: 'center', gap: 56 }}>
        <Title size={110} color={C.ok}>Senha forte</Title>
        <Tiles word={shown.padEnd(10, ' ')} size={118} color={C.ok} />
        <div style={{ display: 'flex', gap: 30 }}>
          <Tag color={C.blue} size={50} style={{ scale: pop('strong', 0.6) }}>📏 longa</Tag>
          <Tag color={C.warn} size={50} style={{ scale: pop('mixed') }}>🧪 misturada</Tag>
          <Tag color={C.ok} size={50} style={{ scale: pop('yours') }}>🔒 só sua</Tag>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: ready }}>
        {after('ready') && <Lock3D spin={frame * 0.03} open={0} scale={ease(frame, [at('ready'), at('ready') + 20], [0.5, 1])} y={0.7} />}
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150 }}>
          <Title size={130} style={{ opacity: 1 - p('go', 0.3) }}>Preparados?</Title>
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110, opacity: Math.min(1, go) }}>
          <Title size={170} style={{ scale: interpolate(go, [0, 1], [1.8, 1]), textShadow: '0 0 60px rgba(255,59,92,.6)' }}>
            <span style={{ color: C.blue }}>CYBER</span> <span style={{ color: C.red }}>WAR</span>
          </Title>
          <div style={{ font: `700 64px ${F.d}`, color: C.ink, marginTop: 10 }}>QUE COMECE A GUERRA!</div>
        </AbsoluteFill>
        <Burst p={ease(frame, [at('go'), at('go') + 22], [0, 1])} color={C.red} y={250} r={520} n={18} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
