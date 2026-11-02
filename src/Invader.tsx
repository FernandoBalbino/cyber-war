import { useEffect, useMemo, useState } from 'react';
import { Crosshair, DatabaseZap, Ruler, FlaskConical, Radar, Search, Timer as TimerIcon, Check, X, Shield } from 'lucide-react';
import { activeClues, fits } from '../shared/types.ts';
import type { LogItem, PubPlayer, Result, ToolKind } from '../shared/types.ts';
import { call, useFx } from './net.ts';
import type { St } from './net.ts';
import { Avatar, DefStrip, EVENT_INFO, QuizSlot, Ranking, Tip, clueText, useClock } from './ui.tsx';

const TOOLS: { k: ToolKind; icon: typeof Ruler; name: string; tip: string; use: string }[] = [
  { k: 'expand', icon: DatabaseZap, name: 'Expandir banco', use: '1 vez para a equipe toda',
    tip: 'Coloca +20 senhas no banco, mas revela 1 letra da senha de um defensor sorteado.' },
  { k: 'len', icon: Ruler, name: 'Comprimento', use: '1 uso por invasor',
    tip: 'Mostra quantos caracteres tem a senha do alvo (5, 6 ou 7). As de outro tamanho ficam apagadas no banco.' },
  { k: 'comp', icon: FlaskConical, name: 'Composição', use: '1 uso por invasor',
    tip: 'Revela se a senha do alvo tem número, letra maiúscula ou símbolo. O banco apaga o que não combina.' },
  { k: 'track', icon: Radar, name: 'Rastrear', use: '1 uso por invasor',
    tip: 'Conta se o alvo já trocou a senha. Se trocou, as pistas antigas podem enganar.' },
];
const SCRAMBLE = 'abcdefghijklmnopqrstuvwxyz0123456789@#$';

function Scramble({ len }: { len: number }) {
  const [s, setS] = useState('');
  useEffect(() => {
    const i = setInterval(() => setS(Array.from({ length: len }, () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]).join('')), 70);
    return () => clearInterval(i);
  }, [len]);
  return <>{s}</>;
}

export function FeedLine({ l, names, words }: { l: LogItem; names: Map<string, PubPlayer>; words?: boolean }) {
  const by = l.by ? names.get(l.by)?.name ?? '?' : '';
  const def = l.def ? names.get(l.def)?.name ?? '?' : '';
  if (l.k === 'try') {
    const icon = l.r === 'hit' ? <Check size={14} /> : l.r === 'blocked' ? <Shield size={14} /> : <X size={14} />;
    return <li className={`feed-${l.r}`}>{icon}<span><b>{by}</b> → {def}: <span className="mono">{l.w}</span>{l.bonus ? ' +10' : ''}</span></li>;
  }
  if (l.k === 'tool') {
    return <li className="feed-tool"><Search size={14} /><span>{by && <b>{by}</b>} {l.clue ? <>→ {def}: {clueText(l.clue)}</> : 'expandiu o banco'}</span></li>;
  }
  if (l.k === 'change') return <li className="feed-change"><Shield size={14} /><span><b>{def}</b> trocou para {words ? <span className="mono">{l.w}</span> : '•••'}</span></li>;
  if (l.k === 'maze') return <li className="feed-change"><Shield size={14} /><span><b>{def}</b> abriu o baú: {l.reward === 'block' ? '+1 bloqueio' : '+20 pts'}</span></li>;
  const ev = EVENT_INFO[l.ev!];
  return <li className="feed-event"><span>{ev.icon} {ev.title}{l.clue ? ` ${def}: ${clueText(l.clue)}` : ''}</span></li>;
}

export function Invader({ v }: { v: St }) {
  const me = v.me!;
  const now = useClock();
  const players = v.players ?? [];
  const names = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const alive = players.filter((p) => p.team === 'def' && !p.down);
  const [selRaw, setSel] = useState('');
  const sel = alive.some((p) => p.id === selRaw) ? selRaw : alive[0]?.id ?? '';
  const target = names.get(sel);
  const [pick, setPick] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [last, setLast] = useState<{ r: Result; w: string; def: string; bonus: boolean; id: number } | null>(null);

  useFx((f) => {
    if (f.t === 'result') { setLast({ ...f, id: Date.now() }); setPick(null); }
  });
  useEffect(() => { if (!last) return; const t = setTimeout(() => setLast(null), 3500); return () => clearTimeout(t); }, [last]);

  const board = v.board;
  const struck = new Set(board?.strikes[sel] ?? []);
  const foundBy = new Map(Object.entries(board?.found ?? {}).map(([d, e]) => [e, d]));
  const clues = board ? activeClues(board.intel, sel) : [];
  const track = board?.intel.filter((c) => c.def === sel && c.k === 'track').at(-1);
  const bank = v.bank ?? [];
  const fit = (w: string) => clues.every((c) => fits(w, c));
  const candidates = bank.filter(([id, w]) => !struck.has(id) && !foundBy.has(id) && fit(w)).length;

  const live = v.room?.phase === 'live';
  const wait = Math.max(0, (me.nextAt ?? 0) - now);
  const pending = me.pending;
  const word = bank.find(([id]) => id === pick)?.[1];
  const canAttack = live && !pending && wait === 0 && !!target && pick !== null && !struck.has(pick) && !foundBy.has(pick);

  const attack = async () => {
    setErr('');
    const r = await call('attempt', { def: sel, entry: pick });
    if (!r.ok) setErr(r.err ?? 'Erro');
  };
  const useTool = async (k: ToolKind) => {
    setErr('');
    const r = await call('tool', { kind: k, def: sel });
    if (!r.ok) setErr(r.err ?? 'Erro');
  };
  const left = (k: ToolKind) => (k === 'expand' ? (board?.expandUsed ? 0 : 1) : me.uses?.[k] ?? 0);
  const known = (k: ToolKind) => k === 'len' && clues.some((c) => c.k === 'len');

  return (
    <main className="game inv-view">
      <div className="main-col">
        <DefStrip v={v} sel={sel} onSel={(id) => { setSel(id); }} />
        <section className="panel bank">
          <header className="bank-head">
            <h2><DatabaseZap size={20} /> Banco <span className="num count">{bank.length}</span></h2>
            {target && (
              <div className="space" title="Senhas que ainda podem ser a do alvo">
                <Avatar av={target.av} team="def" size={24} /> candidatas <b className="num" key={candidates}>{candidates}</b>
              </div>
            )}
            <label className="search"><Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value.toLowerCase())} placeholder="filtrar" aria-label="Filtrar senhas" />
            </label>
          </header>
          <div className="bank-grid">
            {bank.map(([id, w]) => {
              if (q && !w.toLowerCase().includes(q)) return null;
              const owner = foundBy.get(id);
              const isPending = pending?.entry === id;
              const cls = owner ? 'found' : struck.has(id) ? 'struck' : !fit(w) ? 'nofit' : '';
              return (
                <button key={id} type="button" className={`chip ${cls} ${pick === id ? 'pick' : ''} ${isPending ? 'cracking' : ''}`}
                  disabled={!!owner || struck.has(id)} onClick={() => setPick(id)}>
                  {isPending ? <Scramble len={w.length} /> : w}
                  {owner && <span className="chip-owner">{names.get(owner) && <Avatar av={names.get(owner)!.av} size={16} />}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <div className={`actionbar ${last ? `res-${last.r}` : ''}`}>
          {last ? (
            <div className="result" key={last.id}>
              {last.r === 'hit' ? <><Check size={22} /> Senha de <b>{last.def}</b> quebrada! +100</>
                : last.r === 'blocked' ? <><Shield size={22} /> <b>{last.def}</b> bloqueou seu ataque</>
                : <><X size={22} /> <span className="mono">{last.w}</span> não é de <b>{last.def}</b>{last.bonus ? ' · +10 pela pista' : ''}</>}
            </div>
          ) : pending ? (
            <div className="result cracking-msg"><Crosshair size={22} className="spin" /> Quebrando a senha de <b>{names.get(pending.def)?.name}</b>…</div>
          ) : (
            <div className="aim">
              {target ? <Avatar av={target.av} team="def" size={36} /> : null}
              <span className="aim-name">{target?.name ?? 'Escolha um defensor'}</span>
              <span className="aim-arrow">⟵</span>
              <span className={`aim-word mono ${word ? '' : 'empty'}`}>{word ?? 'escolha uma senha'}</span>
            </div>
          )}
          {wait > 0 && !pending ? (
            <div className="cooldown" aria-label="Próxima tentativa">
              <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" /><circle cx="18" cy="18" r="16" className="cd-fill"
                style={{ strokeDashoffset: 100.5 * (wait / 60000) }} /></svg>
              <span className="num">{Math.ceil(wait / 1000)}</span>
            </div>
          ) : null}
          <button className="btn attack" disabled={!canAttack} onClick={attack}>
            {live ? <><Crosshair size={20} /> Atacar</> : <><TimerIcon size={20} /> Aguarde</>}
          </button>
        </div>
        {err && <p className="err floating">{err}</p>}
      </div>

      <aside className="side">
        <QuizSlot quiz={me.quiz} />
        <section className="panel tools">
          <h3>Ferramentas</h3>
          <div className="tool-grid">
            {TOOLS.map((t, i) => {
              const n = left(t.k);
              return (
                <Tip key={t.k} title={t.name} text={t.tip} foot={t.use} align={i % 2 ? 'right' : 'left'} below>
                  <button type="button" className="tool" disabled={!live || n <= 0 || known(t.k) || (t.k !== 'expand' && !target)}
                    onClick={() => useTool(t.k)}>
                    <t.icon size={22} />
                    <span>{t.name}</span>
                    <b className="num">{n}</b>
                  </button>
                </Tip>
              );
            })}
          </div>
        </section>
        {target && (
          <section className="panel intel">
            <h3><Avatar av={target.av} team="def" size={22} /> Pistas de {target.name}</h3>
            {clues.length || track ? (
              <ul>{[...clues, ...(track ? [track] : [])].map((c, i) => <li key={i}>{clueText(c)}</li>)}</ul>
            ) : <p className="hint">Use as ferramentas para descobrir pistas.</p>}
          </section>
        )}
        <section className="panel feed">
          <h3>Equipe</h3>
          <ul>{[...(v.feed ?? [])].reverse().slice(0, 12).map((l, i) => <FeedLine key={`${l.at}${i}`} l={l} names={names} />)}</ul>
        </section>
        <Ranking players={v.players} me={me.id} limit={8} />
      </aside>
    </main>
  );
}
