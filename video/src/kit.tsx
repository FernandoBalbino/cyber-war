import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont as chakra } from '@remotion/google-fonts/ChakraPetch';
import { loadFont as inter } from '@remotion/google-fonts/Inter';
import { loadFont as mono } from '@remotion/google-fonts/JetBrainsMono';

// Mesmas cores e fontes do jogo, para o vídeo parecer o próprio CYBER WAR.
export const C = {
  bg: '#060a14', panel: 'rgba(13,20,38,.9)', panel2: '#121c35', line: 'rgba(130,160,210,.18)',
  ink: '#e8eef9', mute: '#8d9bb5', blue: '#3ba7ff', blueD: '#1f6fff', red: '#ff3b5c', redD: '#d61f45',
  ok: '#2ee59d', warn: '#ffb020', pink: '#ff6ad5',
};
export const F = {
  d: chakra('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily,
  b: inter('normal', { weights: ['500', '600', '700'], subsets: ['latin'] }).fontFamily,
  m: mono('normal', { weights: ['700', '800'], subsets: ['latin'] }).fontFamily,
};
export const AV: Record<string, string> = { Bia: '🦊', Caio: '🐼', Davi: '🐸', Leo: '🐺', Malu: '🐱', Theo: '🤖', Ana: '🦉' };

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** interpolação já "presa" nas pontas, com saída suave */
export const ease = (f: number, i: number[], o: number[], e = OUT) => interpolate(f, i, o, { ...clamp, easing: e });

// ---------- marcas da narração (em quadros, relativas à cena) ----------
type Cues = { cues: Record<string, number>; dur: number };
export const CueCtx = createContext<Cues>({ cues: {}, dur: 0 });
export function useCue() {
  const { cues, dur } = useContext(CueCtx);
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  /** quadro em que a palavra é falada (+ atraso em segundos) */
  const at = (name: string, delay = 0) => (cues[name] ?? 0) + delay * fps;
  /** 0→1 a partir da palavra, em `len` segundos */
  const p = (name: string, len = 0.5, delay = 0) => ease(frame, [at(name, delay), at(name, delay) + len * fps], [0, 1]);
  /** mola 0→1 a partir da palavra */
  const pop = (name: string, delay = 0, damping = 12) => spring({ frame: frame - at(name, delay), fps, config: { damping, stiffness: 170, mass: 0.8 } });
  /** já passou da palavra? */
  const after = (name: string, delay = 0) => frame >= at(name, delay);
  return { frame, fps, dur, at, p, pop, after };
}

// ---------- fundo vivo: grade em perspectiva + brilho das equipes ----------
export function Bg({ hue = 'both' }: { hue?: 'both' | 'def' | 'inv' }) {
  const f = useCurrentFrame();
  const glowB = hue !== 'inv' ? 'rgba(31,111,255,.28)' : 'transparent';
  const glowR = hue !== 'def' ? 'rgba(255,59,92,.22)' : 'transparent';
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 0% 0%, ${glowB}, transparent 70%), radial-gradient(70% 60% at 100% 100%, ${glowR}, transparent 70%), ${C.bg}`, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: '-50%', right: '-50%', top: '45%', height: '120%',
        backgroundImage: 'linear-gradient(rgba(90,150,255,.16) 2px, transparent 2px), linear-gradient(90deg, rgba(90,150,255,.16) 2px, transparent 2px)',
        backgroundSize: '90px 90px', backgroundPositionY: `${(f * 2) % 90}px`,
        transform: 'perspective(700px) rotateX(68deg)', transformOrigin: 'top',
        maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 60%, transparent)',
      }} />
      {Array.from({ length: 26 }, (_, i) => {
        const x = random(`x${i}`) * 1920, y = (random(`y${i}`) * 1080 - f * (0.4 + random(`s${i}`))) % 1080;
        return <div key={i} style={{ position: 'absolute', left: x, top: (y + 1080) % 1080, width: 3, height: 3, borderRadius: 2, background: i % 3 ? C.blue : C.red, opacity: 0.35 }} />;
      })}
    </AbsoluteFill>
  );
}

// ---------- câmera: zoom e deslocamento por pontos-chave ----------
export type Key = [frame: number, x: number, y: number, scale: number];
export function Camera({ keys, children, tilt }: { keys: Key[]; children: React.ReactNode; tilt?: [number, number] }) {
  const f = useCurrentFrame();
  const ks = [...keys].sort((a, b) => a[0] - b[0]);
  const fr = ks.map((k) => k[0]);
  const pick = (j: number) => (fr.length > 1 ? interpolate(f, fr, ks.map((k) => k[j]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }) : ks[0][j]);
  const s = pick(3);
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <AbsoluteFill style={{
        transform: `scale(${s}) translate(${-pick(1)}px, ${-pick(2)}px) rotateX(${tilt?.[0] ?? 0}deg) rotateY(${tilt?.[1] ?? 0}deg)`,
        transformStyle: 'preserve-3d',
      }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- peças do jogo ----------
export function Avatar({ name, size = 80, team, down }: { name: string; size?: number; team?: 'def' | 'inv'; down?: boolean }) {
  const ring = team === 'def' ? C.blue : team === 'inv' ? C.red : C.line;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: size * 0.56, lineHeight: 1,
      background: C.panel2, boxShadow: `inset 0 0 0 ${Math.max(3, size / 22)}px ${ring}, 0 0 ${size / 3}px -${size / 10}px ${ring}`,
      filter: down ? 'grayscale(1) brightness(.7)' : undefined, flexShrink: 0,
    }}>{AV[name] ?? '🙂'}</div>
  );
}

type ChipState = 'normal' | 'dim' | 'pick' | 'found' | 'glow' | 'hot' | 'safe';
export function Chip({ w, state = 'normal', strike = 0, size = 30, style }: { w: string; state?: ChipState; strike?: number; size?: number; style?: React.CSSProperties }) {
  const bg = { pick: 'rgba(255,59,92,.25)', found: 'rgba(255,59,92,.35)', glow: 'rgba(59,167,255,.25)', hot: 'rgba(255,176,32,.22)', safe: 'rgba(46,229,157,.2)' } as Record<string, string>;
  const bd = { pick: C.red, found: C.red, glow: C.blue, hot: C.warn, safe: C.ok } as Record<string, string>;
  return (
    <div style={{
      position: 'relative', font: `700 ${size}px ${F.m}`, color: strike > 0.5 || state === 'dim' ? C.mute : C.ink, textAlign: 'center',
      padding: `${size * 0.42}px ${size * 0.3}px`, borderRadius: size * 0.3, background: bg[state] ?? '#0f1a33',
      border: `${Math.max(2, size / 14)}px solid ${bd[state] ?? C.line}`, opacity: state === 'dim' ? 0.22 : 1,
      boxShadow: bd[state] ? `0 0 ${size}px -${size / 3}px ${bd[state]}` : undefined, whiteSpace: 'nowrap', ...style,
    }}>
      {w}
      {strike > 0 && <div style={{ position: 'absolute', left: '8%', right: '8%', top: '50%', height: Math.max(3, size / 9), background: C.red, borderRadius: 4, transform: `scaleX(${strike})`, transformOrigin: 'left' }} />}
    </div>
  );
}

export function Tiles({ word, size = 110, color = C.blue, flip = {} }: { word: string; size?: number; color?: string; flip?: Record<number, { to: string; p: number }> }) {
  return (
    <div style={{ display: 'flex', gap: size * 0.12, perspective: 900 }}>
      {[...word].map((c, i) => {
        const fl = flip[i];
        const rot = fl ? fl.p * 180 : 0;
        const show = fl && fl.p > 0.5 ? fl.to : c;
        return (
          <div key={i} style={{
            width: size, height: size * 1.25, borderRadius: size * 0.16, display: 'grid', placeItems: 'center',
            font: `800 ${size * 0.62}px ${F.m}`, color: fl && fl.p > 0.5 ? C.warn : C.ink,
            background: 'linear-gradient(180deg,#16295a,#0b1530)', border: `3px solid ${fl && fl.p > 0.5 ? C.warn : color}`,
            boxShadow: `0 0 ${size * 0.4}px -${size * 0.12}px ${color}, inset 0 -6px 0 rgba(0,0,0,.35)`,
            transform: `rotateX(${rot}deg)`,
          }}><span style={{ transform: rot > 90 ? 'rotateX(180deg)' : undefined }}>{show}</span></div>
        );
      })}
    </div>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.panel, border: `2px solid ${C.line}`, borderRadius: 28, padding: 32, boxShadow: '0 40px 80px -30px #000', ...style }}>{children}</div>;
}

export function Title({ children, size = 120, color = C.ink, style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) {
  return <div style={{ font: `700 ${size}px/1 ${F.d}`, color, letterSpacing: '0.02em', textTransform: 'uppercase', ...style }}>{children}</div>;
}

export function Tag({ children, color = C.blue, size = 40, style }: { children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, font: `600 ${size}px ${F.b}`, color: C.ink, padding: `${size * 0.3}px ${size * 0.6}px`,
      borderRadius: 999, background: `${color}26`, border: `3px solid ${color}`, boxShadow: `0 0 ${size}px -${size / 3}px ${color}`, whiteSpace: 'nowrap', ...style }}>{children}</div>
  );
}

// ---------- efeitos ----------
/** efeito sonoro curto no quadro `at` (arquivos em public/sfx) */
export const Sfx = ({ at, src, volume = 0.5 }: { at: number; src: 'whoosh' | 'mouse-click' | 'ding' | 'switch'; volume?: number }) => (
  <Sequence from={Math.round(at)} durationInFrames={90} layout="none"><Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} /></Sequence>
);

/** explosão de partículas (estilo mo.js, mas guiada pelo quadro) */
export function Burst({ p, color = C.red, n = 14, r = 260, x = 0, y = 0 }: { p: number; color?: string; n?: number; r?: number; x?: number; y?: number }) {
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', translate: `${x}px ${y}px`, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', width: r * 2 * p, height: r * 2 * p, left: -r * p, top: -r * p, borderRadius: '50%', border: `${8 * (1 - p)}px solid ${color}`, opacity: 1 - p }} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const d = r * (0.3 + 0.9 * p);
        return <div key={i} style={{ position: 'absolute', width: 18 * (1 - p) + 4, height: 18 * (1 - p) + 4, borderRadius: '50%', background: i % 2 ? color : '#fff', left: Math.cos(a) * d, top: Math.sin(a) * d, opacity: 1 - p }} />;
      })}
    </div>
  );
}

/** "+100" que sobe e some */
export function Points({ p, text, color = C.ok, x = 0, y = 0, size = 120 }: { p: number; text: string; color?: string; x?: number; y?: number; size?: number }) {
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', translate: `calc(-50% + ${x}px) calc(-50% + ${y - p * 120}px)`, scale: ease(p, [0, 0.15], [0.4, 1]),
      font: `700 ${size}px ${F.d}`, color, textShadow: `0 0 40px ${color}`, opacity: ease(p, [0.7, 1], [1, 0]) }}>{text}</div>
  );
}

/** ponteiro do mouse que anda entre pontos e clica */
export function Cursor({ path, clicks = [] }: { path: Key[]; clicks?: number[] }) {
  const f = useCurrentFrame();
  if (!path.length || f < path[0][0]) return null;
  const fr = path.map((k) => k[0]);
  const x = interpolate(f, fr, path.map((k) => k[1]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const y = interpolate(f, fr, path.map((k) => k[2]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const c = clicks.map((k) => f - k).find((d) => d >= 0 && d < 14);
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, pointerEvents: 'none' }}>
      {clicks.map((k) => <Sfx key={k} at={k} src="mouse-click" volume={0.6} />)}
      {c !== undefined && <div style={{ position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: '50%', border: `5px solid ${C.ink}`, opacity: 1 - c / 14, scale: 0.3 + c / 10 }} />}
      <svg width="64" height="64" viewBox="0 0 24 24" style={{ scale: c !== undefined && c < 5 ? 0.85 : 1, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.6))' }}>
        <path d="M4 2l15 9.5-6.6 1.4L16 21l-3 1.3-3.6-8L4 18z" fill="#fff" stroke="#061022" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/** a vinheta do jogo "DEFENSOR X DESCOBERTO", animada pelo quadro */
export function Vignette({ at, name, by }: { at: number; name: string; by: string }) {
  const f = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  const sfx = <Sfx at={at} src="whoosh" volume={0.8} />;
  if (f < 0 || f > 3 * fps) return sfx;
  const x = interpolate(f, [0, 0.4 * fps, 2.5 * fps, 3 * fps], [-110, 0, 0, 110], { ...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1) });
  const glitch = f > 8 && f < 22 && f % 4 < 2;
  return (
    <AbsoluteFill style={{ zIndex: 80, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      {sfx}
      <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(255,59,92,.5), rgba(80,0,20,.75))', opacity: ease(f, [0, 4, 2.4 * fps, 3 * fps], [0, 1, 0.7, 0]) }} />
      <div style={{ width: '140%', padding: '50px 0 40px', transform: `translateX(${x}%) rotate(-4deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', position: 'relative',
        background: `repeating-linear-gradient(-45deg, rgba(0,0,0,.2) 0 24px, transparent 24px 48px), linear-gradient(90deg,#2a0710,#b3122f 25%,#ff3b5c 50%,#b3122f 75%,#2a0710)`,
        backgroundPositionX: `${f * 6}px, 0`, boxShadow: '0 0 0 6px rgba(255,255,255,.9), 0 0 140px rgba(255,59,92,.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
          <div style={{ fontSize: 170, scale: ease(f, [6, 20], [0, 1], Easing.back(2)), rotate: `${ease(f, [6, 20], [-180, 0])}deg` }}>{AV[name]}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 0.95 }}>
            <div style={{ font: `600 34px ${F.d}`, letterSpacing: '0.4em', color: 'rgba(255,255,255,.85)', textTransform: 'uppercase' }}>defensor</div>
            <div style={{ font: `700 210px/0.95 ${F.d}`, color: '#fff', textTransform: 'uppercase', translate: glitch ? '8px 0' : undefined, textShadow: glitch ? '-8px 0 #00e5ff' : undefined }}>{name}</div>
            <div style={{ marginTop: 10, font: `700 96px/1 ${F.d}`, letterSpacing: '0.2em', color: '#22020a', background: '#fff', padding: '6px 24px',
              scale: ease(f, [14, 26], [2.4, 1]), opacity: ease(f, [14, 20], [0, 1]) }}>DESCOBERTO</div>
          </div>
        </div>
        <div style={{ marginTop: 24, font: `500 40px ${F.b}`, color: '#fff', opacity: ease(f, [20, 30], [0, 1]) }}>🔓 senha quebrada por <b>{by}</b></div>
      </div>
    </AbsoluteFill>
  );
}

/** contorno de "monitor" do jogo, com barra de topo */
export function Screen({ children, w = 1500, h = 840, style }: { children: React.ReactNode; w?: number; h?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 30, overflow: 'hidden', background: '#070c18', border: `3px solid ${C.line}`, boxShadow: '0 60px 120px -40px #000, 0 0 0 10px rgba(255,255,255,.03)', position: 'relative', ...style }}>
      {children}
    </div>
  );
}

export const Center = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</AbsoluteFill>
);
