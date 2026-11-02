import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, Burst, C, Camera, Chip, F, Points, Tag, Tiles, Vignette, ease, useCue } from '../kit';
import type { Key } from '../kit';
import { hasDigit } from '../data';

const WORDS = ['cavalo', 'Praia', 'janela', 'tigre', 'arroz', 'pirata', 'Brasil', 'pente', 'lapis5', 'robos',
  'corvo', 'pastel', 'museu', 'tucano', 'quarto', 'zebra', 'porta7', 'piano', 'limao', 'escola',
  'moto12', 'pipoca', 'ondas', 'Fadas', 'gat0s', 'ninja', 'oculos', 'trens', 'cinema', 'cocos1',
  'barco', 'peixe', 'chuva', 'banana', 'raios', 'vento', 'pato12', 'samba', 'heroi', 'tomate'];
const DEF = ['Bia', 'Caio', 'Davi'], INV = ['Leo', 'Malu', 'Theo'];
const dCard = (i: number) => ({ x: 60, y: 230 + i * 215, w: 500, h: 190 });
const iCard = (i: number) => ({ x: 1360, y: 230 + i * 140, w: 500, h: 120 });
const GX = 615, GY = 300;
const cellOf = (k: number) => ({ x: GX + (k % 5) * 140, y: GY + Math.floor(k / 5) * 70 });

function Beam({ from, to, p, color, word }: { from: { x: number; y: number }; to: { x: number; y: number }; p: number; color: string; word?: string }) {
  if (p <= 0 || p >= 1) return null;
  const draw = ease(p, [0, 0.35], [0, 1]), fade = ease(p, [0.8, 1], [1, 0]);
  const x = from.x + (to.x - from.x) * draw, y = from.y + (to.y - from.y) * draw;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: fade }}>
        <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray="28 16" strokeDashoffset={-p * 400} />
        <circle cx={x} cy={y} r={18} fill={color} />
      </svg>
      {word && <div style={{ position: 'absolute', left: (from.x + to.x) / 2 - 110, top: (from.y + to.y) / 2 - 90, opacity: fade * draw }}><Chip w={word} size={40} state="pick" /></div>}
    </>
  );
}

export function S8() {
  const { frame, fps, at, p, pop, after } = useCue();
  const target = after('comp') ? 'Davi' : 'Bia';
  const fits = (w: string) => (target === 'Bia' ? !after('six') || w.length === 6 : !after('num', 0.3) || hasDigit(w));
  const count = WORDS.filter(fits).length;
  const def = Math.round(ease(frame, [at('plus'), at('plus', 0.6)], [0, 25], Easing.linear));
  const inv = Math.round(ease(frame, [at('pts'), at('pts', 0.6)], [0, 100], Easing.linear));
  const secs = Math.max(0, 900 - Math.max(0, frame - at('go')) / fps);
  const clock = `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
  const actor = after('attack') ? 'Leo' : after('comp') ? 'Leo' : after('theo') && !after('caio') ? 'Theo' : after('malu') && !after('theo') ? 'Malu' : after('len') && !after('malu') ? 'Leo' : '';
  const keys: Key[] = [[0, 0, 0, 1], [at('smaller', -0.3), 0, 60, 1.25], [at('malu', -0.2), 0, 0, 1], [at('block', -0.3), -650, -215, 1.5], [at('plus', 0.4), 0, 0, 1],
    [at('caio', -0.2), -650, 0, 1.6], [at('comp', -0.3), 0, 0, 1], [at('join', -0.2), 0, 60, 1.3], [at('attack', -0.2), 0, 0, 1]];
  const feed = [
    after('len', 0.4) && '📏 Leo → Bia: 6 caracteres',
    after('miss') && '✗ Malu → Bia: janela',
    after('block') && '🛡️ Bia bloqueou o Theo',
    after('zero') && '🔁 Caio trocou 1 letra',
    after('num') && '🧪 Leo → Davi: tem número',
    after('hit') && '✓ Leo → Davi: porta7',
  ].filter(Boolean) as string[];
  const center = (r: { x: number; y: number; w: number; h: number }, side: 'l' | 'r') => ({ x: side === 'l' ? r.x : r.x + r.w, y: r.y + r.h / 2 });
  return (
    <AbsoluteFill>
      <Bg />
      <Camera keys={keys}>
        {/* placar */}
        <div style={{ position: 'absolute', left: 60, right: 60, top: 40, height: 110, borderRadius: 26, background: C.panel, border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <span style={{ font: `700 46px ${F.d}` }}><span style={{ color: C.blue }}>CYBER</span> <span style={{ color: C.red }}>WAR</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 50, font: `700 60px ${F.d}` }}>
            <span key={`d${def}`} style={{ color: C.blue }}>🛡 {def}</span>
            <span style={{ font: `800 66px ${F.m}`, color: C.ink }}>{clock}</span>
            <span key={`i${inv}`} style={{ color: C.red }}>{inv} ⚔</span>
          </span>
          <Tag size={30} color={C.warn}>partida simulada</Tag>
        </div>
        {/* defensores */}
        <div style={{ position: 'absolute', left: 60, top: 175, font: `700 30px ${F.d}`, color: C.blue, letterSpacing: '.08em' }}>DEFENSORES</div>
        {DEF.map((n, i) => {
          const r = dCard(i);
          const down = n === 'Davi' && after('hit', 0.4);
          const lit = target === n && !down;
          return (
            <div key={n} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 26, padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
              background: down ? 'repeating-linear-gradient(-45deg, rgba(255,59,92,.22) 0 14px, rgba(255,59,92,.08) 14px 28px)' : C.panel2,
              border: `4px solid ${down ? C.red : lit ? C.red : C.line}`, boxShadow: lit ? '0 0 40px -10px #ff3b5c' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <Avatar name={n} size={80} team="def" down={down} />
                <div>
                  <div style={{ font: `700 46px ${F.b}`, color: C.ink }}>{n}</div>
                  <div style={{ font: `600 26px ${F.b}`, color: down ? C.red : C.mute }}>{down ? '🔓 descoberto por Leo' : '🔒 protegido'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {n === 'Caio' && (
                  <div style={{ width: 200, height: 50, scale: after('caio') ? 1 + pop('caio') * 0.15 : 1, transformOrigin: 'left' }}>
                    <div style={{ scale: 0.4, transformOrigin: 'top left' }}><Tiles word="gatos" size={90} flip={{ 3: { to: '0', p: ease(frame, [at('zero'), at('zero', 0.5)], [0, 1]) } }} /></div>
                  </div>
                )}
                {n === 'Bia' && after('six') && <Tag size={24} color={C.blue} style={{ scale: pop('six') }}>📏 6 caracteres</Tag>}
                {n === 'Caio' && <Tag size={24} color={C.ok} style={{ opacity: 1 - p('old', 0.4) * 0.6, textDecoration: after('old') ? 'line-through' : undefined }}>🧪 sem número</Tag>}
                {n === 'Davi' && after('num') && <Tag size={24} color={C.ok} style={{ scale: pop('num') }}>🧪 tem número</Tag>}
              </div>
            </div>
          );
        })}
        {/* banco */}
        <div style={{ position: 'absolute', left: GX, top: 180, width: 690, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14, font: `700 36px ${F.d}`, color: C.ink }}>alvo: <Avatar name={target} size={64} team="def" /> {target}</span>
          <span style={{ font: `600 28px ${F.b}`, color: C.mute }}>candidatas <b key={count} style={{ font: `800 60px ${F.m}`, color: count < 6 ? C.ok : C.ink }}>{count}</b></span>
        </div>
        {WORDS.map((w, k) => {
          const st = w === 'porta7' && after('hit') ? 'found' : w === 'porta7' && after('join') ? 'pick' : !fits(w) ? 'dim' : 'normal';
          return (
            <div key={w} style={{ position: 'absolute', left: cellOf(k).x, top: cellOf(k).y, width: 130 }}>
              <Chip w={w} size={22} state={st} strike={w === 'janela' && target === 'Bia' ? p('miss', 0.4) : 0} />
            </div>
          );
        })}
        {after('join') && !after('hit') && <div style={{ position: 'absolute', left: cellOf(16).x + 60, top: cellOf(16).y - 50, fontSize: 110, scale: pop('join') }}>🔍</div>}
        {/* invasores */}
        <div style={{ position: 'absolute', left: 1360, top: 175, font: `700 30px ${F.d}`, color: C.red, letterSpacing: '.08em' }}>INVASORES</div>
        {INV.map((n, i) => {
          const r = iCard(i);
          return (
            <div key={n} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 24, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 18,
              background: actor === n ? 'rgba(255,59,92,.2)' : C.panel2, border: `4px solid ${actor === n ? C.red : C.line}`, scale: actor === n ? 1.04 : 1 }}>
              <Avatar name={n} size={80} team="inv" />
              <span style={{ font: `700 44px ${F.b}`, color: C.ink }}>{n}</span>
              {n === 'Leo' && <span style={{ marginLeft: 'auto', font: `700 40px ${F.d}`, color: C.red }}>{inv}</span>}
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 1360, top: 660, width: 500, height: 370, borderRadius: 24, background: C.panel, border: `2px solid ${C.line}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ font: `700 28px ${F.d}`, color: C.mute }}>AO VIVO</div>
          {feed.slice(-6).reverse().map((l) => <div key={l} style={{ font: `600 28px ${F.b}`, color: l.startsWith('✓') ? C.ok : l.startsWith('🛡') ? C.blue : C.ink }}>{l}</div>)}
        </div>
        {/* ataques */}
        <Beam from={center(iCard(0), 'l')} to={center(dCard(0), 'r')} p={ease(frame, [at('len'), at('len', 1.6)], [0, 1], Easing.linear)} color={C.blue} />
        <Beam from={center(iCard(1), 'l')} to={center(dCard(0), 'r')} p={ease(frame, [at('malu'), at('miss', 0.8)], [0, 1], Easing.linear)} color={C.red} word="janela" />
        <Beam from={center(iCard(2), 'l')} to={center(dCard(0), 'r')} p={ease(frame, [at('theo'), at('block', 0.3)], [0, 1], Easing.linear)} color={C.red} word="????" />
        <Beam from={center(iCard(0), 'l')} to={center(dCard(2), 'r')} p={ease(frame, [at('comp'), at('comp', 1.4)], [0, 1], Easing.linear)} color={C.ok} />
        <Beam from={center(iCard(0), 'l')} to={center(dCard(2), 'r')} p={ease(frame, [at('attack'), at('hit', 0.2)], [0, 1], Easing.linear)} color={C.red} word="porta7" />
        <div style={{ position: 'absolute', left: dCard(0).x + 250, top: dCard(0).y + 95 }}><Burst p={ease(frame, [at('block'), at('block', 0.7)], [0, 1])} color={C.blue} r={260} /></div>
        {after('block') && !after('caio') && <div style={{ position: 'absolute', left: dCard(0).x + 200, top: dCard(0).y - 40, scale: pop('block'), rotate: '-8deg' }}><Tag size={36} color={C.blue}>🛡️ BLOQUEOU!</Tag></div>}
      </Camera>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: ease(frame, [at('go'), at('go', 0.2), at('go', 1.1), at('go', 1.5)], [0, 1, 1, 0]) }}>
        <div style={{ font: `700 200px ${F.d}`, color: C.warn, rotate: '-6deg', scale: interpolate(pop('go', 0, 9), [0, 1], [2, 1]), textShadow: '0 0 80px rgba(255,176,32,.7)' }}>VALENDO!</div>
      </AbsoluteFill>
      <Vignette at={at('hit')} name="Davi" by="Leo" />
      <Points p={ease(frame, [at('pts'), at('pts', 1.6)], [0, 1], Easing.linear)} text="+100" color={C.red} size={220} />
      <Points p={ease(frame, [at('plus'), at('plus', 1.4)], [0, 1], Easing.linear)} text="+25" color={C.blue} size={180} x={-500} />
    </AbsoluteFill>
  );
}
