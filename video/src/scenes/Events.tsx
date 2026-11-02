import { AbsoluteFill, interpolate } from 'remotion';
import { Bg, C, F, Title, ease, useCue } from '../kit';

const EVENTS = [
  { cue: 'leak', icon: '💧', name: 'Vazamento de dados', line: 'invasores ganham 1 letra', color: '#4cc3ff' },
  { cue: 'brute', icon: '⚡', name: 'Força bruta', line: 'ataque liberado agora', color: C.warn },
  { cue: 'fw', icon: '🛡️', name: 'Firewall', line: '+1 bloqueio para defensores', color: C.blue },
  { cue: 'quiz', icon: '❓', name: 'Desafio relâmpago', line: 'pergunta para todos', color: C.pink },
];

export function S7() {
  const { frame, at, p, pop, after } = useCue();
  const cur = [...EVENTS].reverse().find((e) => after(e.cue));
  const siren = after('ev') ? (Math.sin(frame / 4) + 1) / 2 : 0;
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ background: cur ? `radial-gradient(circle at 50% 60%, ${cur.color}40, transparent 65%)` : undefined }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 110 }}>
        <div style={{ scale: pop('ev', 0, 9), padding: '24px 60px', borderRadius: 28, border: `5px solid ${C.warn}`, background: `rgba(255,176,32,${0.08 + siren * 0.12})`, boxShadow: `0 0 ${40 + siren * 60}px -10px ${C.warn}` }}>
          <Title size={110} color={C.warn}>🚨 Evento surpresa!</Title>
        </div>
        <div style={{ font: `600 46px ${F.b}`, color: C.mute, marginTop: 24, opacity: p('ev', 0.4, 0.4) }}>a qualquer momento, de 1 a 3 minutos</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 34, paddingBottom: 120, perspective: 1600 }}>
        {EVENTS.map((e) => {
          const on = cur?.cue === e.cue;
          const rot = interpolate(pop(e.cue, 0, 13), [0, 1], [180, 0]); // carta virada até a hora do evento
          const front = rot < 90;
          return (
            <div key={e.cue} style={{ width: 400, height: 470, borderRadius: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center', padding: 26,
              background: front ? `linear-gradient(170deg, ${e.color}38, ${C.panel2})` : C.panel2, border: `5px solid ${on ? e.color : C.line}`, boxShadow: on ? `0 0 90px -10px ${e.color}` : undefined,
              transform: `rotateY(${rot}deg) translateY(${on ? -30 : 0}px) scale(${on ? 1.08 : 1})`, opacity: p('ev', 0.4) }}>
              {front ? (
                <>
                  <div style={{ fontSize: 150, lineHeight: 1, scale: on ? 1 + Math.sin(frame / 5) * 0.06 : 1 }}>{e.icon}</div>
                  <div style={{ font: `700 52px/1.05 ${F.d}`, color: C.ink }}>{e.name}</div>
                  <div style={{ font: `500 34px ${F.b}`, color: C.mute }}>{e.line}</div>
                </>
              ) : <div style={{ font: `700 220px ${F.d}`, color: C.line, transform: 'rotateY(180deg)' }}>?</div>}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: EVENTS.reduce((o, e) => Math.max(o, 0.35 - ease(frame, [at(e.cue), at(e.cue) + 6], [0, 0.35])) * (after(e.cue) ? 1 : 0), 0) }} />
    </AbsoluteFill>
  );
}
