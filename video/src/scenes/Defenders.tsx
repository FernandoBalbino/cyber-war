import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, Burst, C, Cursor, F, Points, Tag, Tiles, Title, ease, useCue } from '../kit';
import { MOVES, MW, WALL, makeMaze, solve, step } from '../../../shared/maze.ts';
import type { Move } from '../../../shared/maze.ts';

// Labirinto de verdade do jogo, com uma semente cujo caminho cabe no tempo da fala.
const SEED = Array.from({ length: 300 }, (_, i) => i + 1).find((s) => { const n = solve(makeMaze(s)).length; return n >= 34 && n <= 46; }) ?? 7;
const M = makeMaze(SEED);
const PATH = solve(M);
const CELLS = [M.start, ...[...PATH].reduce<number[]>((a, mv) => [...a, step(a.length ? a[a.length - 1] : M.start, MOVES[mv as Move])], [])];
const CS = 64, MX = 170, MY = 290;
const PIECES = [{ l: '+4', n: 'Comprimento', c: C.blue }, { l: 'A', n: 'Maiúscula', c: C.ok }, { l: '7', n: 'Número', c: C.warn }, { l: '#', n: 'Símbolo', c: C.pink }];
const pos = (c: number) => ({ x: MX + (c % MW) * CS, y: MY + Math.floor(c / MW) * CS });
const demo = (g: boolean[]) => { let s = g[0] ? 'gatoazul' : 'gato'; if (g[1]) s = s[0].toUpperCase() + s.slice(1); return s + (g[2] ? '7' : '') + (g[3] ? '#' : ''); };

export function S6() {
  const { frame, fps, at, p, pop, after } = useCue();
  const phase = (a: string, b?: string) => ease(frame, [at(a, -0.2), at(a, 0.2)], [0, 1]) * (b ? 1 - ease(frame, [at(b, -0.3), at(b, 0.1)], [0, 1]) : 1);
  const A = 1 - ease(frame, [at('change', -0.3), at('change', 0.1)], [0, 1]);
  const B = phase('change', 'maze'), Mz = phase('maze', 'quiz'), Q = phase('quiz');
  const blocked = after('blocked');
  const bar = blocked ? 1 - ease(at('blocked'), [at('alert'), at('alert', 4)], [0, 1], Easing.linear) : 1 - ease(frame, [at('alert'), at('alert', 4)], [0, 1], Easing.linear);
  // labirinto
  const walk = ease(frame, [at('maze', 1.2), at('chest', -0.2)], [0, CELLS.length - 1], Easing.linear);
  const i = Math.floor(walk), fr = walk - i;
  const a = pos(CELLS[i]), b = pos(CELLS[Math.min(i + 1, CELLS.length - 1)]);
  const hero = { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr };
  const got = M.items.map((c) => CELLS.indexOf(c) <= walk && CELLS.indexOf(c) >= 0);
  const count = got.filter(Boolean).length;
  const meter = [C.red, C.red, C.warn, '#9be15d', C.ok][count];
  return (
    <AbsoluteFill>
      <Bg hue="def" />
      {/* A: alerta e bloqueio */}
      <AbsoluteFill style={{ opacity: A, alignItems: 'center', paddingTop: 70, gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <Avatar name="Bia" size={110} team="def" />
          <Title size={80} color={C.blue}>Sua senha</Title>
        </div>
        <Tiles word="pirata" size={110} />
        <div style={{ width: 1180, borderRadius: 34, padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center',
          background: blocked ? 'rgba(31,111,255,.22)' : 'rgba(90,10,28,.85)', border: `4px solid ${blocked ? C.blue : C.red}`,
          opacity: p('alert', 0.3), scale: pop('alert'), translate: blocked ? undefined : `${Math.sin(frame * 1.7) * 5 * (1 - p('alert', 0.6))}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, font: `700 60px ${F.d}`, color: blocked ? C.blue : '#ffd3dc' }}>
            {blocked ? '🛡️ ATAQUE BLOQUEADO!' : <>⚠️ <Avatar name="Theo" size={84} team="inv" /> Theo está atacando!</>}
          </div>
          <div style={{ width: '100%', height: 16, borderRadius: 10, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: blocked ? C.blue : C.red, transform: `scaleX(${bar})`, transformOrigin: 'left' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ font: `800 90px ${F.m}`, color: C.ink, opacity: p('four', 0.3), scale: pop('four') }}>{Math.max(1, Math.ceil(bar * 4))}s</div>
            <div style={{ padding: '22px 56px', borderRadius: 22, font: `700 54px ${F.d}`, color: '#fff', background: 'linear-gradient(135deg,#3ba7ff,#1f6fff)',
              scale: frame - at('blocked') >= 0 && frame - at('blocked') < 5 ? 0.9 : 1, boxShadow: '0 0 60px -10px #3ba7ff' }}>🛡️ BLOQUEAR</div>
          </div>
        </div>
        <Burst p={ease(frame, [at('blocked'), at('blocked') + 20], [0, 1])} color={C.blue} y={200} r={500} />
        <Points p={ease(frame, [at('blocked', 0.3), at('blocked', 1.8)], [0, 1], Easing.linear)} text="+25" color={C.blue} y={-80} size={190} />
        <Cursor path={[[at('four'), 1500, 1000, 1], [at('blocked'), 1180, 860, 1]]} clicks={[at('blocked')]} />
      </AbsoluteFill>

      {/* B: trocar uma letra */}
      <AbsoluteFill style={{ opacity: B, alignItems: 'center', justifyContent: 'center', gap: 60 }}>
        <Title size={96}>Trocar 1 letra</Title>
        <div style={{ scale: 1.3 }}><Tiles word="pirata" size={120} flip={{ 3: { to: '@', p: ease(frame, [at('change', 0.9), at('change', 1.5)], [0, 1]) } }} /></div>
        <div style={{ display: 'flex', gap: 30 }}>
          <Tag size={48} color={C.warn} style={{ scale: pop('change', 1.6) }}>1 vez por partida</Tag>
          <Tag size={48} color={C.red} style={{ scale: pop('change', 2.4) }}>pistas antigas podem enganar</Tag>
        </div>
      </AbsoluteFill>

      {/* C: missão senha forte */}
      <AbsoluteFill style={{ opacity: Mz }}>
        <div style={{ position: 'absolute', left: MX, top: 120 }}><Title size={84} color={C.blue}>🗝️ Missão Senha Forte</Title></div>
        <div style={{ position: 'absolute', left: MX, top: MY, width: CS * 13 + 4, height: CS * 9 + 4, borderRight: '4px solid #50aaffcc', borderBottom: '4px solid #50aaffcc', background: '#070d1c', borderRadius: 6 }}>
          {M.cells.map((c, k) => (
            <div key={k} style={{ position: 'absolute', left: (k % MW) * CS, top: Math.floor(k / MW) * CS, width: CS, height: CS,
              borderTop: c & WALL.N ? undefined : '4px solid #50aaffcc', borderLeft: c & WALL.W ? undefined : '4px solid #50aaffcc' }} />
          ))}
        </div>
        {M.items.map((c, k) => {
          const t = at('maze', 1.2) + (CELLS.indexOf(c) / (CELLS.length - 1)) * (at('chest', -0.2) - at('maze', 1.2)); // quadro em que é pega
          return (
            <div key={c} style={{ position: 'absolute', left: pos(c).x + 12, top: pos(c).y + 12, width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: PIECES[k].c, color: '#061022', font: `800 22px ${F.m}`, boxShadow: `0 0 24px ${PIECES[k].c}`,
              scale: ease(frame, [t, t + 8], [1, 2.4]) + Math.sin(frame / 8 + k) * 0.08, opacity: ease(frame, [t, t + 8], [1, 0]) }}>{PIECES[k].l}</div>
          );
        })}
        {M.traps.slice(0, 4).map((c) => <div key={c} style={{ position: 'absolute', left: pos(c).x + 14, top: pos(c).y + 10, fontSize: 36, opacity: 0.5 + p('trap', 0.3) * 0.5, scale: 1 + pop('trap') * 0.3 }}>🎣</div>)}
        <div style={{ position: 'absolute', left: pos(M.chest).x + 10, top: pos(M.chest).y + 6, fontSize: 44 }}>{count === 4 ? '🧰' : '🔒'}</div>
        <div style={{ position: 'absolute', left: hero.x + 13, top: hero.y + 13, width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,#8fd0ff,#1f6fff)', boxShadow: '0 0 20px #3ba7ff',
          scale: `${1 + Math.sin(frame / 3) * 0.05} ${1 - Math.sin(frame / 3) * 0.05}` }}>
          <div style={{ position: 'absolute', left: 10, top: 11, width: 5, height: 8, borderRadius: 2, background: '#061022' }} />
          <div style={{ position: 'absolute', right: 10, top: 11, width: 5, height: 8, borderRadius: 2, background: '#061022' }} />
        </div>
        <div style={{ position: 'absolute', left: MX + CS * 13 + 90, top: MY, width: 640, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ font: `800 64px ${F.m}`, color: C.ink, padding: '18px 24px', borderRadius: 18, background: 'rgba(0,0,0,.35)', border: `2px solid ${C.line}`, textAlign: 'center' }}>{demo(got)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{PIECES.map((_, k) => <div key={k} style={{ height: 16, borderRadius: 8, background: k < count ? meter : 'rgba(255,255,255,.1)' }} />)}</div>
          <div style={{ font: `700 44px ${F.d}`, color: meter, textTransform: 'uppercase' }}>{['Fraca', 'Fraca', 'Média', 'Boa', 'Forte'][count]}</div>
          {PIECES.map((pc, k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 18, font: `600 40px ${F.b}`, color: got[k] ? C.ink : C.mute, scale: after('pieces', k * 0.45) && !after('trap') ? 1 + (1 - p('pieces', 0.4, k * 0.45)) * 0.2 : 1 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', display: 'grid', placeItems: 'center', background: got[k] ? pc.c : 'rgba(255,255,255,.08)', color: '#061022', font: `800 24px ${F.m}` }}>{pc.l}</div>{pc.n}
            </div>
          ))}
        </div>
        {after('trap') && !after('chest') && (
          <div style={{ position: 'absolute', left: MX + 220, top: MY + 240, padding: '14px 30px', borderRadius: 999, background: C.red, font: `700 46px ${F.d}`, color: '#fff', scale: pop('trap', 0.1) }}>🎣 Phishing! Volta ao início</div>
        )}
        {after('chest') && (
          <div style={{ position: 'absolute', left: MX, top: MY, width: CS * 13, height: CS * 9, background: 'rgba(6,10,20,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, opacity: p('chest', 0.3) }}>
            <div style={{ fontSize: 130, scale: pop('chest'), rotate: `${interpolate(pop('chest'), [0, 1], [-25, 0])}deg` }}>🧰</div>
            <div style={{ font: `700 50px ${F.d}`, color: C.ink }}>Senha forte! Escolha:</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ padding: '18px 34px', borderRadius: 18, background: 'linear-gradient(135deg,#3ba7ff,#1f6fff)', font: `700 40px ${F.d}`, color: '#fff' }}>🛡️ +1 bloqueio</div>
              <div style={{ padding: '18px 34px', borderRadius: 18, border: `3px solid ${C.line}`, font: `700 40px ${F.d}`, color: C.ink }}>⭐ +20 pontos</div>
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* D: desafio de LGPD */}
      <AbsoluteFill style={{ opacity: Q, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 1200, padding: 50, borderRadius: 36, background: C.panel, border: `4px solid ${after('quizPts') ? C.ok : C.warn}`, display: 'flex', flexDirection: 'column', gap: 26, scale: pop('quiz') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: `700 46px ${F.d}`, color: C.warn }}><span>❓ Desafio LGPD</span><span>+15</span></div>
          <div style={{ font: `700 60px ${F.b}`, color: C.ink }}>Emprestar sua senha para um amigo é…</div>
          {['Seguro', 'Arriscado', 'Obrigatório'].map((o, k) => (
            <div key={o} style={{ padding: '22px 30px', borderRadius: 20, font: `600 48px ${F.b}`, color: C.ink,
              background: k === 1 && after('quizPts', -0.3) ? 'rgba(46,229,157,.18)' : C.panel2, border: `3px solid ${k === 1 && after('quizPts', -0.3) ? C.ok : C.line}` }}>{o}</div>
          ))}
        </div>
        <Cursor path={[[at('quiz', 0.6), 1500, 1000, 1], [at('quizPts', -0.4), 900, 640, 1]]} clicks={[at('quizPts', -0.3)]} />
        <Points p={ease(frame, [at('quizPts'), at('quizPts') + 1.5 * fps], [0, 1], Easing.linear)} text="+15" color={C.ok} x={480} y={-300} size={190} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
