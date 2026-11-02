import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, C, Camera, Chip, F, Points, Tag, Title, ease, useCue } from '../kit';
import { hasDigit } from '../data';

const W = ['pirata', 'cavalo', 'gatos', 'pastel', 'janela', 'porta7', 'pipoca', 'zebra', 'escola', 'Brasil', 'lapis5', 'sapos',
  'tomate', 'museu', 'c@nela', 'festa!', 'quarto', 'piano', 'tucano', 'dados', 'cinema', 'mesas', 'banana', 'limao',
  'robos', 'balde', 'corvo', 'Praia', 'pente', 'tigre', 'arroz', 'moto12', 'ninja', 'ondas', 'pato12', 'mapas'];
const MORE = ['lagoas', 'nuvens', 'piscina', 'bolsa1', 'tapete', 'rodas'];

const TOOLS = [
  { cue: 'len', icon: '📏', name: 'Comprimento', line: 'quantos caracteres', use: '1 por invasor', color: C.blue },
  { cue: 'comp', icon: '🧪', name: 'Composição', line: 'número, maiúscula, símbolo', use: '1 por invasor', color: C.ok },
  { cue: 'track', icon: '📡', name: 'Rastrear', line: 'já trocou a senha?', use: '1 por invasor', color: C.warn },
  { cue: 'expand', icon: '🗂️', name: 'Expandir banco', line: '+20 senhas e 1 letra', use: '1 por equipe', color: C.pink },
];

export function S5() {
  const { frame, fps, at, p, pop, after } = useCue();
  const active = [...TOOLS].reverse().find((t) => after(t.cue))?.cue;
  const fits = (w: string) =>
    (!after('len', 0.6) || w.length === 6) && (!after('comp', 0.6) || !hasDigit(w)) && (!after('letter', 0.4) || w.toLowerCase().includes('p'));
  const words = after('expand', 1) ? [...W, ...MORE] : W;
  const count = words.filter(fits).length;
  const keys: [number, number, number, number][] = [[0, 0, 0, 1], [at('filter', -0.2), 440, -300, 1.6], [at('analyze', -0.3), 0, 0, 1]];
  const finalists = W.concat(MORE).filter((w) => w.length === 6 && !hasDigit(w) && w.includes('p'));
  return (
    <AbsoluteFill>
      <Bg hue="inv" />
      <Camera keys={keys}>
        <div style={{ position: 'absolute', left: 100, top: 70, opacity: p('tools', 0.4) }}>
          <Title size={92} color={C.red}>Ferramentas</Title>
          <div style={{ font: `600 40px ${F.b}`, color: C.mute }}>dos invasores</div>
        </div>
        {TOOLS.map((t, i) => {
          const on = active === t.cue;
          const enter = pop('tools', i * 0.12, 14);
          return (
            <div key={t.cue} style={{ position: 'absolute', left: 100 + (i % 2) * 400, top: 260 + Math.floor(i / 2) * 370, width: 370, height: 340, perspective: 1200 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 32, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center',
                background: on ? `linear-gradient(160deg, ${t.color}40, ${C.panel2})` : C.panel2, border: `4px solid ${on ? t.color : C.line}`,
                boxShadow: on ? `0 0 70px -10px ${t.color}` : undefined, transform: `rotateY(${(1 - enter) * 90}deg) scale(${on ? 1.06 : active ? 0.94 : 1})`,
                opacity: active && !on ? 0.55 : 1 }}>
                <div style={{ fontSize: 96, lineHeight: 1 }}>{t.icon}</div>
                <div style={{ font: `700 42px/1.05 ${F.d}`, color: C.ink }}>{t.name}</div>
                <div style={{ font: `500 30px ${F.b}`, color: C.mute }}>{t.line}</div>
                <div style={{ font: `700 26px ${F.b}`, color: t.color }}>{t.use}</div>
              </div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 980, top: 90, display: 'flex', alignItems: 'center', gap: 22, opacity: p('tools', 0.4, 0.3) }}>
          <Avatar name="Bia" size={100} team="def" />
          <div style={{ font: `700 48px ${F.d}`, color: C.ink }}>alvo: Bia</div>
          <div style={{ marginLeft: 50, textAlign: 'center' }}>
            <div style={{ font: `600 30px ${F.b}`, color: C.mute }}>candidatas</div>
            <div key={count} style={{ font: `800 96px/1 ${F.m}`, color: count < 8 ? C.ok : C.ink }}>{count}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 980, top: 225, display: 'flex', gap: 14, flexWrap: 'wrap', width: 880 }}>
          {after('len', 0.4) && <Tag size={30} color={C.blue} style={{ scale: pop('len', 0.4) }}>📏 6 caracteres</Tag>}
          {after('comp', 0.4) && <Tag size={30} color={C.ok} style={{ scale: pop('comp', 0.4) }}>🧪 sem número</Tag>}
          {after('track', 0.4) && <Tag size={30} color={C.warn} style={{ scale: pop('track', 0.4) }}>📡 não trocou</Tag>}
          {after('letter') && <Tag size={30} color={C.pink} style={{ scale: pop('letter') }}>🗂️ tem a letra P</Tag>}
        </div>
        <div style={{ position: 'absolute', left: 980, top: 375, display: 'grid', gridTemplateColumns: 'repeat(6, 140px)', gap: 12 }}>
          {words.map((w, i) => (
            <Chip key={w} w={w} size={24} state={!fits(w) ? 'dim' : count < 8 ? 'safe' : 'normal'}
              style={{ scale: i >= W.length ? ease(frame, [at('expand', 1 + (i - W.length) * 0.08), at('expand', 1.3 + (i - W.length) * 0.08)], [0, 1], Easing.back(2)) : 1 }} />
          ))}
        </div>
        {after('track') && !after('expand') && (
          <div style={{ position: 'absolute', left: 1600, top: 120, width: 200, height: 200, borderRadius: '50%', border: `4px solid ${C.warn}`, opacity: 1 - p('expand', 0.3),
            background: `conic-gradient(from ${(frame - at('track')) * 8}deg, ${C.warn}80, transparent 25%)` }} />
        )}
        {after('analyze') && (
          <div style={{ position: 'absolute', fontSize: 130, left: interpolate(frame, [at('analyze'), at('analyze', 2.4)], [1000, 1650], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), top: 420 + Math.sin((frame - at('analyze')) / 6) * 60 }}>🔍</div>
        )}
      </Camera>
      <div style={{ position: 'absolute', right: 90, bottom: 26, opacity: p('analyze', 0.4) }}>
        <Tag size={48} color={C.ok}>🧠 analisar &gt; chutar · {finalists.length} candidatas</Tag>
      </div>
      <Points p={ease(frame, [at('ten'), at('ten') + 1.4 * fps], [0, 1], Easing.linear)} text="+10" color={C.ok} size={200} />
    </AbsoluteFill>
  );
}
