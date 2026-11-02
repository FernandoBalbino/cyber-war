import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, KeyRound, Play, Shield, Star, TriangleAlert } from 'lucide-react';
import { MOVES, MW, WALL, makeMaze, step } from '../shared/maze.ts';
import type { Move } from '../shared/maze.ts';
import { MAX_BLOCKS, MAZE_PTS } from '../shared/types.ts';
import type { Me } from '../shared/types.ts';
import { call } from './net.ts';
import { useClock } from './ui.tsx';

// As 4 peças de uma senha forte; a senha de exemplo cresce conforme o aluno pega cada uma.
const PIECES = [
  { label: '+4', name: 'Comprimento' },
  { label: 'A', name: 'Maiúscula' },
  { label: '7', name: 'Número' },
  { label: '#', name: 'Símbolo' },
];
const LEVEL = ['Fraca', 'Fraca', 'Média', 'Boa', 'Forte'];
const KEYS: Record<string, Move> = {
  ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R',
};
const NONE = [false, false, false, false];
const demo = (g: boolean[]) => {
  let s = g[0] ? 'gatoazul' : 'gato';
  if (g[1]) s = s[0].toUpperCase() + s.slice(1);
  return s + (g[2] ? '7' : '') + (g[3] ? '#' : '');
};
const at = (c: number): CSSProperties => ({ '--gx': c % MW, '--gy': Math.floor(c / MW) } as CSSProperties);

export function MazePanel({ me, down, threatBy, onBlock }: { me: Me; down: boolean; threatBy?: string; onBlock: () => void }) {
  const now = useClock(500);
  const z = me.maze;
  const m = useMemo(() => (z ? makeMaze(z.seed) : null), [z?.seed]);
  const [pos, setPos] = useState(0); // posição desenhada
  const logic = useRef(0);           // posição real: a armadilha manda de volta ao início na hora
  const path = useRef('');
  const lock = useRef(0);
  const gotRef = useRef(NONE);
  const [got, setGot] = useState(NONE);
  const [seen, setSeen] = useState<number[]>([]);
  const [anim, setAnim] = useState({ k: 0, t: '' }); // 'hit' = caiu no phishing, 'bump' = bateu na parede
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    logic.current = 0; path.current = ''; gotRef.current = NONE;
    setPos(0); setGot(NONE); setSeen([]); setOpen(false);
  }, [z?.id]);

  const move = (mv: Move) => {
    if (!m || open) return;
    const t = performance.now();
    if (t < lock.current) return;
    lock.current = t + 85;
    const d = MOVES[mv];
    if (!(m.cells[logic.current] & d)) { setAnim((a) => ({ k: a.k + 1, t: 'bump' })); return; }
    path.current += mv;
    const np = step(logic.current, d);
    if (m.traps.includes(np)) {
      setSeen((s) => [...s, np]); setAnim((a) => ({ k: a.k + 1, t: 'hit' })); setPos(np);
      logic.current = m.start; lock.current = t + 450;
      setTimeout(() => setPos(m.start), 350);
      return;
    }
    logic.current = np; setPos(np);
    const k = m.items.indexOf(np);
    if (k >= 0 && !gotRef.current[k]) { gotRef.current = gotRef.current.map((x, i) => x || i === k); setGot(gotRef.current); }
    if (np === m.chest && gotRef.current.every(Boolean)) setOpen(true);
  };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const mv = KEYS[e.key];
      if (!mv || !m) return;
      e.preventDefault();
      move(mv);
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  });

  const start = async () => { setMsg(''); const r = await call('maze:start'); if (!r.ok) setMsg(r.err ?? 'Erro'); };
  const claim = async (choice: 'block' | 'points') => {
    if (!z) return;
    setBusy(true);
    const r = await call('maze:done', { id: z.id, path: path.current, choice });
    setBusy(false);
    setMsg(r.ok ? (r.reward === 'block' ? '🛡️ +1 bloqueio!' : `⭐ +${MAZE_PTS} pontos!`) : r.err ?? 'Erro');
  };

  const wait = Math.max(0, (me.mazeNext ?? 0) - now);
  const count = got.filter(Boolean).length;
  const px = pos % MW, py = Math.floor(pos / MW);
  const near = (c: number) => Math.abs((c % MW) - px) + Math.abs(Math.floor(c / MW) - py) <= 2;
  const canBlock = !down && (me.blocks ?? 0) < MAX_BLOCKS;

  return (
    <section className={`panel maze-panel ${threatBy ? 'threat' : ''}`}>
      <header className="maze-head">
        <h2><KeyRound size={20} /> Missão senha forte</h2>
        <span className="maze-prize">Baú: <Shield size={15} /> +1 bloqueio ou <Star size={15} /> +{MAZE_PTS} pts</span>
      </header>
      {threatBy && (
        <div className="maze-alert" role="alert">
          <TriangleAlert size={20} /> <b>{threatBy}</b> está atacando!
          <button className="btn shield-btn sm" onClick={onBlock} disabled={!me.blocks}><Shield size={16} /> Bloquear <kbd>Espaço</kbd></button>
        </div>
      )}
      {!m ? (
        <div className="maze-start">
          <div className="maze-preview" aria-hidden>
            {PIECES.map((p, i) => <span key={i} className={`token t${i}`}>{p.label}</span>)}
            <span className="token trap">🎣</span><span className="token chest">🧰</span>
          </div>
          <p>Pegue as 4 peças de uma senha forte, fuja do phishing e abra o baú.</p>
          {msg && <p className="maze-msg" key={msg}>{msg}</p>}
          <button className="btn primary big" disabled={wait > 0} onClick={start}>
            <Play size={20} /> {wait > 0 ? `Novo labirinto em ${Math.ceil(wait / 1000)}s` : 'Jogar'}
          </button>
          <p className="hint">Setas ou W A S D</p>
        </div>
      ) : (
        <div className="maze-wrap">
          <div className="maze" style={at(pos)} data-seed={m.seed}>
            <div className="maze-grid">
              {m.cells.map((c, i) => <i key={i} className={`${c & WALL.N ? '' : 'n'} ${c & WALL.W ? '' : 'w'}`} />)}
            </div>
            <div className="maze-fog" />
            {m.items.map((c, i) => <span key={c} className={`token t${i} ${got[i] ? 'taken' : ''}`} style={at(c)}>{PIECES[i].label}</span>)}
            {m.traps.map((c) => (seen.includes(c) || near(c)) && <span key={c} className="token trap" style={at(c)}>🎣</span>)}
            <span className={`token chest ${count === 4 ? 'ready' : ''}`} style={at(m.chest)}>{count === 4 ? '🧰' : '🔒'}</span>
            <span className="hero" style={at(pos)}>
              <i className={`hero-core ${anim.t}`} key={anim.k} />
            </span>
            {anim.t === 'hit' && <span className="maze-flash" key={`f${anim.k}`}>🎣 Phishing! Volta ao início</span>}
            {open && (
              <div className="chest-open">
                <span className="chest-big">🧰</span>
                <b>Senha forte! Escolha o prêmio:</b>
                <div className="chest-choices">
                  <button className="btn primary" disabled={busy || !canBlock} onClick={() => claim('block')}><Shield size={18} /> +1 bloqueio</button>
                  <button className="btn ghost" disabled={busy} onClick={() => claim('points')}><Star size={18} /> +{MAZE_PTS} pontos</button>
                </div>
                {!canBlock && !down && <span className="hint">Você já tem {MAX_BLOCKS} bloqueios</span>}
              </div>
            )}
          </div>
          <aside className="maze-side">
            <span className="demo-pw mono" key={count}>{demo(got)}</span>
            <div className={`meter m${count}`}>{PIECES.map((_, i) => <i key={i} className={i < count ? 'on' : ''} />)}</div>
            <span className={`meter-label m${count}`}>{LEVEL[count]}</span>
            <ul className="pieces">
              {PIECES.map((p, i) => <li key={i} className={got[i] ? 'on' : ''}><b className={`t${i}`}>{p.label}</b>{p.name}</li>)}
            </ul>
            <div className="dpad">
              <button aria-label="Cima" onPointerDown={() => move('U')}><ArrowUp size={18} /></button>
              <button aria-label="Esquerda" onPointerDown={() => move('L')}><ArrowLeft size={18} /></button>
              <button aria-label="Baixo" onPointerDown={() => move('D')}><ArrowDown size={18} /></button>
              <button aria-label="Direita" onPointerDown={() => move('R')}><ArrowRight size={18} /></button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
