import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Shield, Swords, Lock, LockOpen } from 'lucide-react';
import { serverNow, useFx } from './net.ts';
import type { St } from './net.ts';
import type { Clue, EventKind, Fx, PubPlayer, Quiz, Team } from '../shared/types.ts';
import { call } from './net.ts';

export const AVATARS = ['🦊', '🐱', '🐼', '🦉', '🐙', '🤖', '👾', '🦄', '🐸', '🐯', '🐺', '🦁', '🐲', '🐧', '🦈', '🐝'];
export const TEAM = { def: 'Defensores', inv: 'Invasores' } as const;

export function Avatar({ av, team, size = 40, down }: { av: number; team?: Team | null; size?: number; down?: boolean }) {
  return (
    <span className={`av ${team ?? ''} ${down ? 'down' : ''}`} style={{ width: size, height: size, fontSize: size * 0.56 }} aria-hidden>
      {AVATARS[av] ?? AVATARS[0]}
    </span>
  );
}

import { Logo } from './Logo.tsx';
export { Logo };

// re-renderiza a cada 250 ms para relógios e barras
export function useClock(ms = 250) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), ms); return () => clearInterval(i); }, [ms]);
  return serverNow();
}

export const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Timer({ v }: { v: St }) {
  const now = useClock();
  const left = (v.room?.endsAt ?? 0) - now;
  const phase = v.room?.phase;
  if (phase !== 'prep' && phase !== 'live') return null;
  return (
    <div className={`timer ${phase} ${phase === 'live' && left < 60_000 ? 'hurry' : ''}`}>
      <span className="timer-label">{phase === 'prep' ? 'preparação' : 'ao vivo'}</span>
      <span className="timer-num">{fmt(left)}</span>
    </div>
  );
}

export function teamScore(players: PubPlayer[] = [], t: Team) {
  return players.filter((p) => p.team === t).reduce((s, p) => s + p.score, 0);
}

export function Hud({ v }: { v: St }) {
  const me = v.players?.find((p) => p.id === v.me?.id);
  const d = teamScore(v.players, 'def'), i = teamScore(v.players, 'inv');
  const share = d + i ? (d / (d + i)) * 100 : 50;
  return (
    <header className="hud">
      <div className="hud-left"><Logo /><span className="room-code">{v.room?.code}</span></div>
      <div className="duel">
        <div className="duel-side def"><Shield size={18} /><b className="num" key={d}>{d}</b></div>
        <Timer v={v} />
        <div className="duel-side inv"><b className="num" key={i}>{i}</b><Swords size={18} /></div>
        <div className="tug"><span style={{ transform: `scaleX(${share / 100})` }} /></div>
      </div>
      <div className="hud-right">
        {me ? (
          <div className={`me-chip ${me.team ?? ''}`}>
            <Avatar av={me.av} team={me.team} size={30} />
            <span className="me-name">{me.name}</span>
            <b className="num" key={me.score}>{me.score}</b>
          </div>
        ) : v.prof ? <span className="me-chip prof">Professor</span> : null}
      </div>
    </header>
  );
}

export function DefStrip({ v, sel, onSel, secrets }: { v: St; sel?: string; onSel?: (id: string) => void; secrets?: Record<string, string> }) {
  const defs = (v.players ?? []).filter((p) => p.team === 'def');
  const down = defs.filter((p) => p.down).length;
  return (
    <section className="defstrip" aria-label="Defensores">
      <div className="defstrip-head">
        <Shield size={16} /> <span>{TEAM.def}</span>
        <span className="pill-down">{down}/{defs.length} descobertos</span>
      </div>
      <div className="defstrip-list">
        {defs.map((p) => {
          const strikes = v.board?.strikes[p.id]?.length ?? 0;
          return (
            <button key={p.id} type="button" disabled={!onSel || !!p.down}
              className={`dcard ${sel === p.id ? 'sel' : ''} ${p.down ? 'down' : ''} ${p.id === v.me?.id ? 'mine' : ''} ${p.on ? '' : 'off'}`}
              onClick={() => onSel?.(p.id)}>
              <Avatar av={p.av} team="def" size={34} down={!!p.down} />
              {p.down && <span className="stamp">descoberto</span>}
              <span className="dcard-txt">
                <span className="dcard-name">{p.name}</span>
                {p.down ? <span className="dcard-sub bad"><LockOpen size={12} /> por {p.down}</span>
                  : secrets ? <span className="dcard-sub mono">{secrets[p.id]}</span>
                  : <span className="dcard-sub"><Lock size={12} /> {onSel && strikes ? `${strikes} testadas` : 'protegido'}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Ranking({ players = [], me, title = 'Ranking', limit = 12 }: { players?: PubPlayer[]; me?: string; title?: string; limit?: number }) {
  const list = players.filter((p) => p.team).sort((a, b) => b.score - a.score).slice(0, limit);
  return (
    <section className="panel ranking">
      <h3>{title}</h3>
      <ol>
        {list.map((p, i) => (
          <li key={p.id} className={`${p.team} ${p.id === me ? 'mine' : ''} ${p.down ? 'down' : ''}`}>
            <span className="rk-pos">{i + 1}</span>
            <Avatar av={p.av} team={p.team} size={26} down={!!p.down} />
            <span className="rk-name">{p.name}{!p.on && <i className="offline" title="desconectado" />}</span>
            <b className="num">{p.score}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function clueText(c: Pick<Clue, 'k' | 'v'>) {
  switch (c.k) {
    case 'len': return `${c.v} caracteres`;
    case 'digit': return c.v ? 'tem número' : 'sem número';
    case 'upper': return c.v ? 'tem maiúscula' : 'sem maiúscula';
    case 'symbol': return c.v ? 'tem símbolo' : 'sem símbolo';
    case 'letter': return `tem a letra ${String(c.v).toUpperCase()}`;
    case 'track': return c.v ? 'já trocou a senha' : 'não trocou a senha';
  }
}

// Explicação que aparece ao passar o mouse (ou focar com Tab) em um botão.
export function Tip({ title, text, foot, align = 'left', below, children }: { title: string; text: string; foot?: string; align?: 'left' | 'right'; below?: boolean; children: ReactNode }) {
  return (
    <div className={`has-tip ${align} ${below ? 'below' : ''}`}>
      {children}
      <div className="tip-pop" role="tooltip"><b>{title}</b><p>{text}</p>{foot && <span>{foot}</span>}</div>
    </div>
  );
}

export const EVENT_INFO: Record<EventKind, { icon: string; title: string; text: string }> = {
  leak: { icon: '💧', title: 'Vazamento de dados!', text: 'Invasores ganharam 1 letra da senha de um defensor.' },
  brute: { icon: '⚡', title: 'Ataque de força bruta!', text: 'Invasores podem atacar agora, sem esperar.' },
  firewall: { icon: '🛡️', title: 'Firewall ativado!', text: 'Cada defensor ganhou +1 bloqueio.' },
  quiz: { icon: '❓', title: 'Desafio relâmpago!', text: 'Responda rápido e ganhe +15.' },
};

// ---------- efeitos globais ----------
type Toast = { id: number; icon: string; text: string; team?: Team; desc?: string };
let toastId = 0;
export function Toasts() {
  const [list, setList] = useState<Toast[]>([]);
  const push = (t: Omit<Toast, 'id'>) => {
    const id = ++toastId;
    setList((l) => [...l.slice(-3), { ...t, id }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), t.desc ? 5000 : 4000);
  };
  useFx((f: Fx) => {
    if (f.t === 'toast') push(f);
    if (f.t === 'event') { const e = EVENT_INFO[f.ev]; push({ icon: e.icon, text: e.title, desc: e.text }); }
    if (f.t === 'scan') push({ icon: '🔍', text: 'Alguém analisou sua senha!', team: 'inv' });
    if (f.t === 'kicked') push({ icon: '👋', text: 'Você foi removido da sala' });
    if (f.t === 'closed') push({ icon: '🔒', text: 'O professor fechou a sala' });
  });
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => t.desc ? (
        <div key={t.id} className="toast big"><span className="toast-icon">{t.icon}</span><div><b>{t.text}</b><small>{t.desc}</small></div></div>
      ) : <div key={t.id} className={`toast ${t.team ?? ''}`}><span>{t.icon}</span>{t.text}</div>)}
    </div>
  );
}

// Vinheta que cruza a tela quando um defensor cai.
export function Vignette() {
  const [queue, setQueue] = useState<(Fx & { t: 'vignette' } & { id: number })[]>([]);
  useFx((f) => { if (f.t === 'vignette') setQueue((q) => [...q, { ...f, id: ++toastId }]); });
  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3000);
    return () => clearTimeout(t);
  }, [cur]);
  if (!cur) return null;
  return (
    <div className="vig" key={cur.id} role="alert">
      <div className="vig-flash" />
      <div className="vig-band">
        <div className="vig-stripes" />
        <div className="vig-content">
          <span className="vig-av">{AVATARS[cur.av]}</span>
          <div className="vig-text">
            <span className="vig-kicker">defensor</span>
            <span className="vig-name" data-text={cur.def}>{cur.def}</span>
            <span className="vig-title">DESCOBERTO</span>
          </div>
        </div>
        <div className="vig-by"><LockOpen size={18} /> senha quebrada por <b>{cur.by}</b></div>
      </div>
    </div>
  );
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const now = useClock(200);
  const [res, setRes] = useState<{ choice: number; correct: boolean; answer: number; tip: string; block: boolean } | null>(null);
  const [shown, setShown] = useState(quiz);
  if (shown.id !== quiz.id) { setShown(quiz); setRes(null); }
  const left = Math.max(0, quiz.until - now);
  const answer = async (choice: number) => {
    if (res) return;
    const r = await call('answer', { id: quiz.id, choice });
    if (r.ok) setRes({ choice, correct: !!r.correct, answer: Number(r.answer), tip: String(r.tip), block: !!r.block });
  };
  return (
    <div className={`quiz ${res ? (res.correct ? 'right' : 'wrong') : ''}`} role="dialog" aria-label="Desafio de segurança">
      <div className="quiz-head"><span>❓ Desafio</span><b>+15</b></div>
      <p className="quiz-q">{quiz.q}</p>
      <div className="quiz-opts">
        {quiz.opts.map((o, i) => (
          <button key={i} type="button" onClick={() => answer(i)} disabled={!!res || left === 0}
            className={res ? (i === res.answer ? 'ok' : i === res.choice ? 'bad' : '') : ''}>{o}</button>
        ))}
      </div>
      {!res && left === 0 ? <p className="quiz-tip">⏱ Tempo esgotado</p> : res ? <p className="quiz-tip">{res.correct ? (res.block ? '✔ +15 e +1 bloqueio! ' : '✔ +15! ') : '✘ '}{res.tip}</p>
        : <div className="bar"><span style={{ transform: `scaleX(${left / 20_000})` }} /></div>}
    </div>
  );
}

// segura o card depois da resposta para o aluno ler a dica
export function QuizSlot({ quiz }: { quiz: Quiz | null | undefined }) {
  const [last, setLast] = useState<Quiz | null>(null);
  if (quiz && quiz.id !== last?.id) setLast(quiz);
  useEffect(() => {
    if (quiz || !last) return;
    const t = setTimeout(() => setLast(null), 4000);
    return () => clearTimeout(t);
  }, [quiz, last]);
  return last ? <QuizCard quiz={last} /> : null;
}
