import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, Burst, C, F, Panel, Tag, Title, ease, useCue } from '../kit';

const ROWS = [
  { cue: '', icon: '🔓', text: 'Descobrir uma senha', pts: '+100', team: C.red },
  { cue: '', icon: '🔍', text: 'Atacar seguindo as pistas', pts: '+10', team: C.red },
  { cue: 'survive', icon: '🛡️', text: 'Chegar ao fim sem ser descoberto', pts: '+100', team: C.blue },
  { cue: '', icon: '✋', text: 'Bloquear um ataque', pts: '+25', team: C.blue },
  { cue: '', icon: '🧰', text: 'Baú do labirinto', pts: '+20', team: C.blue },
  { cue: '', icon: '❓', text: 'Acertar um desafio', pts: '+15', team: C.ok },
];

export function S9() {
  const { frame, fps, at, p, pop, after } = useCue();
  const secs = Math.max(0, 3 - (frame - at('time', -0.6)) / fps);
  const end = p('allDown', 0.5);
  const win = ease(frame, [at('win'), at('win', 1.2)], [0, 1], Easing.bezier(0.3, 0, 0.2, 1));
  const swap = ease(frame, [at('swap'), at('swap', 0.9)], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg />
      <div style={{ position: 'absolute', left: 100, top: 70 }}><Title size={100}>Como vencer</Title></div>
      <Panel style={{ position: 'absolute', left: 100, top: 230, width: 900, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ROWS.map((r, i) => {
          const hl = r.cue && after(r.cue) && !after('allDown');
          return (
            <div key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '14px 18px', borderRadius: 18, background: hl ? `${r.team}30` : 'transparent', border: `3px solid ${hl ? r.team : 'transparent'}`,
              opacity: ease(frame, [i * 6, i * 6 + 10], [0, 1]), translate: `${ease(frame, [i * 6, i * 6 + 12], [-60, 0])}px 0`, scale: hl ? 1.04 : 1 }}>
              <span style={{ fontSize: 56 }}>{r.icon}</span>
              <span style={{ font: `600 42px ${F.b}`, color: C.ink, flex: 1 }}>{r.text}</span>
              <span style={{ font: `700 54px ${F.d}`, color: r.team }}>{r.pts}</span>
            </div>
          );
        })}
      </Panel>
      {/* fim da partida */}
      <div style={{ position: 'absolute', left: 1080, top: 230, width: 740, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, opacity: 1 - p('sum', 0.4) }}>
        <div style={{ font: `800 150px/1 ${F.m}`, color: secs < 1 ? C.red : C.ink }}>0:0{Math.ceil(secs)}</div>
        <Tag color={C.red} size={46} style={{ scale: pop('time', 0.6) }}>⏰ fim do tempo</Tag>
        <div style={{ font: `700 54px ${F.d}`, color: C.mute, marginTop: 20, opacity: p('allDown', 0.4) }}>ou...</div>
        <div style={{ display: 'flex', gap: 24, opacity: p('allDown', 0.4) }}>
          {['Bia', 'Caio', 'Davi'].map((n, i) => <div key={n} style={{ scale: 1 + (after('allDown', 0.3 + i * 0.2) ? 0 : 0.2) }}><Avatar name={n} size={120} team="def" down={after('allDown', 0.3 + i * 0.2)} /></div>)}
        </div>
        <Tag color={C.red} size={40} style={{ opacity: end }}>todos descobertos = fim</Tag>
      </div>
      {/* placar das equipes */}
      <div style={{ position: 'absolute', left: 1080, top: 230, width: 740, display: 'flex', flexDirection: 'column', gap: 40, opacity: p('sum', 0.4) * (1 - swap) }}>
        {[{ n: 'Defensores', c: C.blue, v: 380, icon: '🛡️' }, { n: 'Invasores', c: C.red, v: 320, icon: '⚔️' }].map((t, i) => (
          <div key={t.n}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: `700 52px ${F.d}`, color: t.c }}><span>{t.icon} {t.n}</span><span>{Math.round(t.v * ease(frame, [at('sum'), at('win', 1.2)], [0, 1]))}</span></div>
            <div style={{ height: 50, borderRadius: 25, background: 'rgba(255,255,255,.08)', marginTop: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(t.v / 400) * 100}%`, borderRadius: 25, background: t.c, transform: `scaleX(${interpolate(win, [0, 1], [0.05, 1])})`, transformOrigin: 'left' }} />
            </div>
            {i === 0 && after('win', 1.2) && <div style={{ fontSize: 120, position: 'absolute', right: 150, top: -80, scale: pop('win', 1.2), rotate: '12deg' }}>🏆</div>}
          </div>
        ))}
        <Tag color={C.ok} size={44} style={{ alignSelf: 'center', opacity: p('win', 0.4, 1) }}>vence quem somar mais pontos</Tag>
      </div>
      {/* troca de lado */}
      <div style={{ position: 'absolute', left: 1080, top: 300, width: 740, display: 'flex', justifyContent: 'center', gap: 40, opacity: swap, perspective: 1200 }}>
        {[C.blue, C.red].map((c, i) => {
          const flip = ease(frame, [at('swap', 0.6), at('swap', 1.4)], [0, 180]);
          const shown = flip > 90 ? (i === 0 ? C.red : C.blue) : c;
          return (
            <div key={i} style={{ width: 300, height: 360, borderRadius: 30, border: `5px solid ${shown}`, background: `${shown}30`, display: 'grid', placeItems: 'center', transform: `rotateY(${flip}deg)` }}>
              <div style={{ fontSize: 150, transform: flip > 90 ? 'rotateY(180deg)' : undefined }}>{(shown === C.blue) ? '🛡️' : '⚔️'}</div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-end', padding: '0 100px 120px 0', opacity: p('swap', 0.4, 1.2) }}>
        <Tag color={C.warn} size={50}>🔁 quem defendeu, agora ataca!</Tag>
      </AbsoluteFill>
      <Burst p={ease(frame, [at('win', 1.2), at('win', 1.9)], [0, 1])} color={C.warn} x={480} y={-200} r={300} />
    </AbsoluteFill>
  );
}
