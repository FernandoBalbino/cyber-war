import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Avatar, Bg, C, Chip, F, Tag, Title, ease, useCue } from '../kit';
import { BANK, SECRET, hasDigit, hasSym } from '../data';

const LIFT = ['gatos', 'porta', 'janela'];
const OWN = Object.entries(SECRET) as [string, string][];

export function S3() {
  const { frame, fps, at, p, pop, after } = useCue();
  const words = p('words', 0.8);
  const hide = p('hide', 0.9);
  const secret = p('secret', 0.6);
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ perspective: 1500, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(10, 150px)', gap: 14, transformStyle: 'preserve-3d',
          transform: `translateY(${interpolate(words, [0, 1], [60, 120]) + secret * 120}px) rotateX(${interpolate(frame, [0, 10 * fps], [58, 44]) - words * 18 + secret * 14}deg) rotateZ(${interpolate(frame, [0, 10 * fps], [-12, -5])}deg) scale(${0.92 + words * 0.22 - secret * 0.2})`,
        }}>
          {BANK.map((w, i) => {
            const r = Math.floor(i / 10), c = i % 10;
            const d = Math.hypot(r - 4.5, c - 4.5);
            const t = ease(frame, [at('bank') + d * 2, at('bank') + d * 2 + 12], [0, 1], Easing.back(1.6));
            const lift = LIFT.includes(w) ? ease(frame, [at('words') + LIFT.indexOf(w) * 8, at('words') + LIFT.indexOf(w) * 8 + 14], [0, 1]) * (1 - p('extra', 0.4)) : 0;
            const hot = (hasDigit(w) || hasSym(w)) && after('extra') && !after('secret');
            const flash = OWN.some(([, pw]) => pw === w) && frame > at('hide', 0.6) && frame < at('hide', 1.4);
            return (
              <Chip key={w} w={w} size={28} state={flash ? 'glow' : lift > 0.1 ? 'pick' : hot ? 'hot' : 'normal'}
                style={{ opacity: t, transform: `translateZ(${lift * 160 + (1 - t) * -300}px) scale(${1 + lift * 0.6})` }} />
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 90, top: 70, opacity: p('bank', 0.5) * (1 - secret) }}>
        <Title size={86}>Banco de senhas</Title>
        <div style={{ font: `700 60px ${F.m}`, color: C.blue, marginTop: 8 }}>{Math.round(ease(frame, [at('bank'), at('bank') + 1.4 * fps], [0, 100]))} senhas</div>
      </div>
      <div style={{ position: 'absolute', right: 90, top: 90, opacity: p('extra', 0.4) * (1 - secret) }}>
        <Tag color={C.warn} size={46}>gatos7 · c@nela · festa!</Tag>
      </div>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 70, opacity: secret }}>
        <div style={{ display: 'flex', gap: 220 }}>
          {OWN.map(([n, pw], i) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, scale: pop('secret', i * 0.15) }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={n} size={150} team="def" />
                <div style={{ position: 'absolute', right: -30, top: -26, font: `700 90px ${F.d}`, color: C.warn, scale: pop('who', i * 0.12), textShadow: '0 0 30px #000' }}>?</div>
              </div>
              <div style={{ font: `700 46px ${F.b}`, color: C.ink }}>{n}</div>
              <div style={{ translate: `0 ${hide * 420}px`, scale: 1 - hide * 0.6, opacity: 1 - ease(hide, [0.6, 1], [0, 1]) }}>
                <Chip w={`🔒 ${pw}`} size={44} state="glow" />
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70, opacity: p('who', 0.4) }}>
        <Tag color={C.red} size={52}>🤫 ninguém sabe qual é de quem</Tag>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
