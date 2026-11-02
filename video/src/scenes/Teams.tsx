import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, Burst, C, F, Title, ease, useCue } from '../kit';

function Side({ team, p, frame, start }: { team: 'def' | 'inv'; p: number; frame: number; start: number }) {
  const def = team === 'def';
  const color = def ? C.blue : C.red;
  const names = def ? ['Bia', 'Caio', 'Davi'] : ['Leo', 'Malu', 'Theo'];
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, [def ? 'left' : 'right']: 0, width: 960, perspective: 1600 }}>
      <div style={{
        position: 'absolute', inset: '90px 50px', borderRadius: 44, border: `4px solid ${color}`,
        background: `linear-gradient(${def ? 160 : 200}deg, ${color}55, rgba(6,10,20,.75) 70%)`,
        boxShadow: `0 0 120px -30px ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34,
        opacity: Math.min(1, p), transform: `rotateY(${(def ? 1 : -1) * interpolate(p, [0, 1], [75, 10])}deg) translateX(${(def ? -1 : 1) * (1 - p) * 300}px)`,
      }}>
        <div style={{ fontSize: 230, lineHeight: 1, scale: ease(frame, [start + 4, start + 20], [0, 1], Easing.back(2)) }}>{def ? '🛡️' : '⚔️'}</div>
        <Title size={128} color={color} style={{ textShadow: `0 0 50px ${color}` }}>{def ? 'Defensores' : 'Invasores'}</Title>
        <div style={{ font: `600 54px ${F.b}`, color: C.ink }}>{def ? 'protegem as senhas' : 'descobrem as senhas'}</div>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          {names.map((n, i) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, scale: ease(frame, [start + 14 + i * 5, start + 28 + i * 5], [0, 1], Easing.back(2.2)) }}>
              <Avatar name={n} size={120} team={team} />
              <div style={{ font: `700 38px ${F.b}`, color: C.ink }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function S2() {
  const { frame, at, pop, p } = useCue();
  const vs = pop('vs', 0, 8);
  const shake = frame - at('vs') >= 0 && frame - at('vs') < 12 ? Math.sin(frame * 2.5) * 14 : 0;
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ translate: `${shake}px 0` }}>
        <Side team="def" p={pop('def', 0, 14)} frame={frame} start={at('def')} />
        <Side team="inv" p={pop('inv', 0, 14)} frame={frame} start={at('inv')} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 957, top: 0, width: 6, height: 1080, background: 'linear-gradient(transparent, #fff, transparent)', scale: `1 ${p('split', 0.6)}`, opacity: 0.8 }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 230, height: 230, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#1f6fff,#d61f45)',
          border: '8px solid #fff', boxShadow: '0 0 90px rgba(255,255,255,.4)', font: `700 110px ${F.d}`, color: '#fff',
          scale: interpolate(vs, [0, 1], [3, 1]), opacity: Math.min(1, vs * 2), rotate: `${interpolate(vs, [0, 1], [-30, 0])}deg` }}>VS</div>
      </AbsoluteFill>
      <Burst p={ease(frame, [at('vs'), at('vs') + 20], [0, 1])} color="#fff" r={460} n={18} />
    </AbsoluteFill>
  );
}
