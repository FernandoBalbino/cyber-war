import { useState } from 'react';
import { Pencil, Shield, ShieldCheck, TriangleAlert, LockOpen, Check, Search, Crosshair } from 'lucide-react';
import { call, useFx } from './net.ts';
import type { St } from './net.ts';
import { DefStrip, Ranking, fmt, useClock } from './ui.tsx';

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
  const threat = me.threats?.[0];
  const live = v.room?.phase === 'live';

  const change = async () => {
    if (pos === null || !ch) return;
    const r = await call('change', { pos, ch });
    if (!r.ok) { setErr(r.err ?? 'Erro'); return; }
    setEditing(false); setPos(null); setCh(''); setErr('');
  };
  const block = async () => { const r = await call('block'); if (!r.ok) setErr(r.err ?? 'Erro'); };

  return (
    <main className="game def-view">
      <div className="main-col">
        <DefStrip v={v} />
        <section className={`panel pw-panel ${down ? 'down' : ''} ${threat ? 'under-attack' : ''}`} key={`h${hit}`}>
          <h2>{down ? <><LockOpen size={20} /> Senha descoberta</> : <><Shield size={20} /> Sua senha</>}</h2>
          <div className={`tiles ${editing ? 'editing' : ''}`}>
            {[...pw].map((c, i) => (
              <button key={i} type="button" className={`tile ${pos === i ? 'on' : ''}`} disabled={!editing}
                onClick={() => { setPos(i); setCh(''); }} style={{ animationDelay: `${i * 60}ms` }}>
                {pos === i && ch ? ch : c}
              </button>
            ))}
          </div>
          {down ? (
            <p className="pw-msg bad">Quebrada por <b>{down}</b>. Ainda dá para pontuar nos desafios!</p>
          ) : editing ? (
            <div className="edit-row">
              {pos === null ? <span className="hint">Toque no caractere que quer trocar</span> : (
                <>
                  <input autoFocus maxLength={1} value={ch} aria-label="Novo caractere"
                    onChange={(e) => { setCh(e.target.value.slice(-1)); setErr(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && change()} />
                  <button className="btn primary" disabled={!ch} onClick={change}><Check size={18} /> Trocar</button>
                </>
              )}
              <button className="btn ghost" onClick={() => { setEditing(false); setPos(null); setErr(''); }}>Cancelar</button>
            </div>
          ) : me.changed ? (
            <p className="pw-msg ok"><Check size={16} /> Senha alterada. O banco dos invasores mudou junto.</p>
          ) : (
            <button className="btn ghost" onClick={() => setEditing(true)}><Pencil size={16} /> Trocar 1 caractere</button>
          )}
          {err && <p className="err">{err}</p>}
          {v.room?.phase === 'prep' && <p className="pw-msg">Memorize sua senha. Ataques em <b>{fmt((v.room.endsAt ?? 0) - now)}</b></p>}
        </section>

        <section className={`panel shield-panel ${threat ? 'threat' : ''}`}>
          {threat && !down ? (
            <>
              <div className="threat-head"><TriangleAlert size={28} /> <span><b>{threat.by}</b> está atacando!</span></div>
              <div className="bar danger"><span style={{ transform: `scaleX(${Math.max(0, threat.until - now) / 4000})` }} /></div>
              <button className="btn shield-btn" disabled={!me.blocks} onClick={block}>
                <Shield size={22} /> Bloquear <span className="num">{me.blocks}</span>
              </button>
            </>
          ) : (
            <>
              <ShieldCheck size={40} className="shield-idle" />
              <div>
                <b className="shield-count num">{me.blocks ?? 0}</b> <span>bloqueio{me.blocks === 1 ? '' : 's'}</span>
                <p className="hint">{live ? 'Quando um ataque chegar, decida se bloqueia.' : 'Disponível quando a partida começar.'}</p>
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="side">
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
        <Ranking players={v.players} me={me.id} />
      </aside>
    </main>
  );
}
