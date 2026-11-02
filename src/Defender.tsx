import { useEffect, useState } from 'react';
import { Pencil, Shield, ShieldCheck, TriangleAlert, LockOpen, Check, Search, Crosshair } from 'lucide-react';
import { call, useFx } from './net.ts';
import type { St } from './net.ts';
import { DefStrip, QuizSlot, Ranking, Tip, fmt, useClock } from './ui.tsx';
import { MazePanel } from './Maze.tsx';

type Alert = { id: number; icon: 'atk' | 'scan'; text: string; at: number };
let aid = 0;

export function Defender({ v }: { v: St }) {
  const me = v.me!;
  const pub = v.players?.find((p) => p.id === me.id);
  const now = useClock();
  const [editing, setEditing] = useState(false);
  const [pos, setPos] = useState<number | null>(null);
  const [ch, setCh] = useState('');
  const [err, setErr] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hit, setHit] = useState(0);

  useFx((f) => {
    if (f.t === 'alert') { setAlerts((a) => [{ id: ++aid, icon: 'atk' as const, text: `${f.by} tentou sua senha`, at: Date.now() }, ...a].slice(0, 8)); setHit((x) => x + 1); }
    if (f.t === 'scan') setAlerts((a) => [{ id: ++aid, icon: 'scan' as const, text: 'Sua senha foi analisada', at: Date.now() }, ...a].slice(0, 8));
  });

  const pw = me.pw ?? '';
  const down = pub?.down;
  const threat = down ? undefined : me.threats?.[0];
  const live = v.room?.phase === 'live';

  const change = async () => {
    if (pos === null || !ch) return;
    const r = await call('change', { pos, ch });
    if (!r.ok) { setErr(r.err ?? 'Erro'); return; }
    setEditing(false); setPos(null); setCh(''); setErr('');
  };
  const block = async () => { const r = await call('block'); if (!r.ok) setErr(r.err ?? 'Erro'); };

  // Espaço ou B bloqueiam o ataque mesmo jogando o labirinto
  useEffect(() => {
    if (!threat) return;
    const f = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.key !== ' ' && e.key.toLowerCase() !== 'b')) return;
      e.preventDefault();
      block();
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [threat]);

  return (
    <main className="game def-view">
      <div className="main-col">
        <DefStrip v={v} />
        <section className={`panel pw-panel compact ${down ? 'down' : ''} ${threat ? 'under-attack' : ''}`} key={`h${hit}`}>
          <div className="pw-title">
            <h2>{down ? <><LockOpen size={20} /> Senha descoberta</> : <><Shield size={20} /> Sua senha</>}</h2>
            {v.room?.phase === 'prep' && <span className="hint">Memorize! Ataques em <b>{fmt((v.room.endsAt ?? 0) - now)}</b></span>}
          </div>
          <div className={`tiles ${editing ? 'editing' : ''}`}>
            {[...pw].map((c, i) => (
              <button key={i} type="button" className={`tile ${pos === i ? 'on' : ''}`} disabled={!editing}
                onClick={() => { setPos(i); setCh(''); }} style={{ animationDelay: `${i * 60}ms` }}>
                {pos === i && ch ? ch : c}
              </button>
            ))}
          </div>
          <div className="pw-action">
            {down ? (
              <p className="pw-msg bad">Quebrada por <b>{down}</b></p>
            ) : editing ? (
              <div className="edit-row">
                {pos === null ? <span className="hint">Toque na letra que quer trocar</span> : (
                  <>
                    <input autoFocus maxLength={1} value={ch} aria-label="Nova letra"
                      onChange={(e) => { setCh(e.target.value.slice(-1)); setErr(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && change()} />
                    <button className="btn primary" disabled={!ch} onClick={change}><Check size={18} /> Trocar</button>
                  </>
                )}
                <button className="btn ghost" onClick={() => { setEditing(false); setPos(null); setErr(''); }}>Cancelar</button>
              </div>
            ) : me.changed ? (
              <p className="pw-msg ok"><Check size={16} /> Senha alterada</p>
            ) : (
              <Tip title="Trocar 1 letra" text="Troque uma letra da sua senha (pode ser número ou símbolo). As pistas que os invasores já têm podem ficar erradas." foot="1 vez por partida" align="right">
                <button className="btn ghost" onClick={() => setEditing(true)}><Pencil size={16} /> Trocar 1 letra</button>
              </Tip>
            )}
            {err && <p className="err">{err}</p>}
          </div>
        </section>
        <MazePanel me={me} down={!!down} threatBy={threat?.by} onBlock={block} />
      </div>

      <aside className="side">
        <section className={`panel shield-panel ${threat ? 'threat' : ''}`}>
          {threat ? (
            <>
              <div className="threat-head"><TriangleAlert size={24} /> <span><b>{threat.by}</b> está atacando!</span></div>
              <div className="bar danger"><span style={{ transform: `scaleX(${Math.max(0, threat.until - now) / 4000})` }} /></div>
              <button className="btn shield-btn" disabled={!me.blocks} onClick={block}>
                <Shield size={22} /> Bloquear <span className="num">{me.blocks}</span>
              </button>
            </>
          ) : (
            <Tip title="Bloqueio" text="Quando um invasor atacar, você tem 4 segundos para bloquear. Ele perde a tentativa e você ganha +25." foot="Atalho: Espaço" align="right">
              <div className="shield-idle-row">
                <ShieldCheck size={36} className="shield-idle" />
                <div>
                  <b className="shield-count num">{me.blocks ?? 0}</b> <span>bloqueio{me.blocks === 1 ? '' : 's'}</span>
                  <p className="hint">{live ? 'Fique de olho nos alertas' : 'Ativo quando a partida começar'}</p>
                </div>
              </div>
            </Tip>
          )}
        </section>
        <QuizSlot quiz={me.quiz} />
        <section className="panel alerts">
          <h3>Alertas</h3>
          {alerts.length === 0 ? <p className="hint">Nenhum alerta ainda.</p> : (
            <ul>
              {alerts.map((a) => (
                <li key={a.id} className={a.icon}>
                  {a.icon === 'atk' ? <Crosshair size={14} /> : <Search size={14} />} {a.text}
                </li>
              ))}
            </ul>
          )}
        </section>
        <Ranking players={v.players} me={me.id} limit={8} />
      </aside>
    </main>
  );
}
