import { AbsoluteFill, Easing, interpolate, random } from 'remotion';
import { Avatar, Bg, C, Camera, Chip, Cursor, F, Points, Screen, Tag, Vignette, ease, useCue } from '../kit';
import type { Key } from '../kit';
import { BANK } from '../data';

// Tela do invasor, em coordenadas do vídeo (1920x1080).
const SX = 210, SY = 120;
const GRID = BANK.filter((w) => w !== 'janela' && w !== 'sorvete').slice(0, 48);
GRID[19] = 'janela'; GRID[38] = 'sorvete';
const cell = (i: number) => ({ x: SX + 40 + (i % 8) * 176, y: SY + 240 + Math.floor(i / 8) * 72 });
const mid = (i: number) => ({ x: cell(i).x + 80, y: cell(i).y + 28 });
const DEFS = ['Ana', 'Bia', 'Caio'];
const card = (i: number) => ({ x: SX + 40 + i * 270, y: SY + 110 });
const BTN = { x: SX + 1180, y: SY + 715 };
const SCR = 'abcdefghijklmnopqrstuvwxyz0123456789@#';
const scramble = (n: number, f: number) => Array.from({ length: n }, (_, i) => SCR[Math.floor(random(`${f}-${i}`) * SCR.length)]).join('');

export function S4() {
  const { frame, fps, at, p, pop, after } = useCue();
  const J = 19, S = 38;
  const off = (pt: { x: number; y: number }, s: number): [number, number, number] => [pt.x - 960, pt.y - 540, s];
  const keys: Key[] = [
    [0, 0, 0, 0.9], [at('see', 0.8), 0, 0, 1],
    [at('pickDef', -0.3), ...off({ x: card(0).x + 125, y: card(0).y + 45 }, 1.7)],
    [at('pickPw', -0.3), ...off(mid(J), 1.8)],
    [at('attack', -0.2), ...off({ x: BTN.x + 130, y: BTN.y + 40 }, 1.5)],
    [at('attack', 1.2), 0, 0, 1], [at('miss', -0.2), ...off(mid(J), 2)],
    [at('team', 0.2), 0, -60, 1.15], [at('hit', -0.2), ...off(mid(S), 1.6)], [at('vig', -0.5), 0, 0, 1],
  ];
  const cursor: Key[] = [
    [at('pickDef', -0.9), 1400, 1000, 1], [at('pickDef'), card(0).x + 140, card(0).y + 50, 1],
    [at('pickPw'), mid(J).x, mid(J).y, 1], [at('attack'), BTN.x + 130, BTN.y + 40, 1],
    [at('attack', 1.3), BTN.x + 300, BTN.y + 200, 1], [at('hit'), mid(S).x, mid(S).y, 1],
    [at('hit', 0.7), BTN.x + 130, BTN.y + 40, 1], [at('vig', 0.3), 1700, 1050, 1],
  ];
  const sel = after('pickDef');
  const word = after('hit') ? 'sorvete' : after('pickPw') && !after('miss') ? 'janela' : '';
  const crackJ = after('attack') && !after('miss');
  const crackS = after('hit', 0.7) && !after('vig');
  const down = after('vig');
  const wait = after('attack') ? Math.max(0, 60 - (frame - at('attack')) / fps) : 0;
  const minute = ease(frame, [at('attack', 1.3), at('attack', 1.7)], [0, 1]) * (1 - p('miss', 0.3)); // logo após o clique, até o "Errou?"
  return (
    <AbsoluteFill>
      <Bg hue="inv" />
      <Camera keys={keys}>
        <AbsoluteFill style={{ transform: `perspective(1800px) rotateY(${interpolate(p('see', 0.9), [0, 1], [-28, 0])}deg) scale(${interpolate(p('see', 0.9), [0, 1], [0.85, 1])})`, opacity: p('see', 0.4) + 0.3 }}>
        <div style={{ position: 'absolute', left: SX, top: SY }}>
          <Screen>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', borderBottom: `2px solid ${C.line}`, font: `700 34px ${F.d}` }}>
              <span><span style={{ color: C.blue }}>CYBER</span> <span style={{ color: C.red }}>WAR</span></span>
              <span style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                <span style={{ color: C.blue }}>🛡 0</span><span style={{ font: `800 40px ${F.m}` }}>14:32</span><span style={{ color: C.red }}>{after('points') ? 100 : 0} ⚔</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, font: `700 30px ${F.b}` }}><Avatar name="Leo" size={46} team="inv" /> Leo</span>
            </div>
            <div style={{ position: 'absolute', left: 40, top: 90, font: `600 22px ${F.d}`, color: C.blue, letterSpacing: '.08em' }}>DEFENSORES</div>
          </Screen>
        </div>
        {DEFS.map((n, i) => {
          const isSel = sel && i === 0;
          const dead = down && i === 0;
          return (
            <div key={n} style={{ position: 'absolute', left: card(i).x, top: card(i).y + 10, width: 250, height: 84, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px',
              background: dead ? 'rgba(255,59,92,.25)' : isSel ? 'rgba(255,59,92,.18)' : C.panel2, border: `3px solid ${isSel || dead ? C.red : C.line}` }}>
              <Avatar name={n} size={56} team="def" down={dead} />
              <div style={{ font: `700 30px ${F.b}`, color: C.ink }}>{n}<div style={{ font: `600 20px ${F.b}`, color: dead ? C.red : C.mute }}>{dead ? '🔓 por Leo' : '🔒 protegido'}</div></div>
            </div>
          );
        })}
        {GRID.map((w, i) => {
          const st = i === S && down ? 'found' : (i === J && word === 'janela') || (i === S && word === 'sorvete') ? 'pick' : 'normal';
          const shake = i === J && after('miss') ? Math.sin(frame * 3) * 10 * (1 - p('miss', 0.4)) : 0;
          const label = (i === J && crackJ) || (i === S && crackS) ? scramble(w.length, frame) : w;
          return (
            <div key={i} style={{ position: 'absolute', left: cell(i).x + shake, top: cell(i).y, width: 160 }}>
              <Chip w={label} size={24} state={st} strike={i === J ? p('miss', 0.4, 0.15) : 0} style={{ opacity: i === J && after('miss') ? 0.6 : 1 }} />
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: SX + 40, top: SY + 700, width: 1420, height: 110, borderRadius: 20, background: '#0a1020', border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px' }}>
          {sel && <Avatar name="Ana" size={64} team="def" />}
          <span style={{ font: `700 36px ${F.d}`, color: C.ink }}>{sel ? 'Ana' : 'Escolha um defensor'}</span>
          <span style={{ font: `700 40px ${F.m}`, color: C.red }}>{word ? `⟵ ${word}` : ''}</span>
        </div>
        <div style={{ position: 'absolute', left: BTN.x, top: BTN.y, width: 260, height: 80, borderRadius: 16, display: 'grid', placeItems: 'center', font: `700 36px ${F.d}`, color: '#fff',
          background: 'linear-gradient(135deg,#ff3b5c,#d61f45)', scale: [at('attack'), at('hit', 0.7)].some((k) => frame - k >= 0 && frame - k < 5) ? 0.92 : 1,
          boxShadow: '0 10px 30px -10px rgba(255,59,92,.7)' }}>🎯 ATACAR</div>
        {after('miss') && (
          <div style={{ position: 'absolute', left: mid(J).x - 30, top: mid(J).y - 150, scale: pop('miss', 0.1) }}>
            <div style={{ font: `700 120px ${F.d}`, color: C.red, textShadow: '0 0 30px #000' }}>✗</div>
          </div>
        )}
        <div style={{ position: 'absolute', left: mid(J).x - 130, top: mid(J).y + 50, opacity: p('miss', 0.4, 0.5) * (1 - p('hit', 0.3)), scale: 0.6 }}>
          <Tag color={C.red} size={40}>riscada só para a Ana</Tag>
        </div>
        </AbsoluteFill>
        <Cursor path={cursor} clicks={[at('pickDef'), at('pickPw'), at('attack'), at('hit'), at('hit', 0.7)]} />
      </Camera>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: minute, background: `rgba(6,10,20,${0.75 * minute})` }}>
        <div style={{ position: 'relative', width: 420, height: 420, scale: 0.8 + minute * 0.2 }}>
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, rotate: '-90deg' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke={C.red} strokeWidth="6" strokeLinecap="round" strokeDasharray={276.5} strokeDashoffset={276.5 * (1 - wait / 60)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', font: `800 150px ${F.m}`, color: C.ink }}>{Math.ceil(wait)}s</div>
        </div>
        <div style={{ font: `700 64px ${F.d}`, color: C.ink, marginTop: 30 }}>1 tentativa por minuto</div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 70, opacity: p('team', 0.4) * (1 - p('hit', 0.3)) }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', background: C.panel, padding: '20px 36px', borderRadius: 999, border: `3px solid ${C.red}` }}>
          {['Leo', 'Malu', 'Theo'].map((n, i) => <div key={n} style={{ scale: pop('team', i * 0.1) }}><Avatar name={n} size={84} team="inv" /></div>)}
          <span style={{ font: `600 46px ${F.b}`, color: C.ink, marginLeft: 10 }}>a equipe toda vê: não é a da Ana</span>
        </div>
      </AbsoluteFill>
      <Vignette at={at('vig')} name="Ana" by="Leo" />
      <Points p={ease(frame, [at('points'), at('points') + 1.6 * fps], [0, 1], Easing.linear)} text="+100" color={C.ok} size={220} />
    </AbsoluteFill>
  );
}
