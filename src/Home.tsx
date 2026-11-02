import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, GraduationCap, Plus, ArrowLeft } from 'lucide-react';
import { AVATARS, Logo } from './ui.tsx';
import { createRoom, joinRoom, loadHistory } from './net.ts';
import { ResultsBody } from './Results.tsx';

export function Join() {
  const params = new URLSearchParams(location.search);
  const [code, setCode] = useState(params.get('sala')?.toUpperCase() ?? '');
  const [name, setName] = useState(() => { try { return localStorage.getItem('cyberwar-name') ?? ''; } catch { return ''; } });
  const [av, setAv] = useState(() => Math.floor(Math.random() * AVATARS.length));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { localStorage.setItem('cyberwar-name', name.trim()); } catch { /* ok */ }
    const r = await joinRoom(code, name, av);
    if (!r.ok) setErr(r.err ?? 'Não foi possível entrar');
    setBusy(false);
  };

  return (
    <main className="home">
      <div className="radar" aria-hidden />
      <form className="home-card" onSubmit={submit}>
        <Logo big />
        <p className="tagline"><span className="t-def">Defensores</span> <span className="vs">vs</span> <span className="t-inv">Invasores</span></p>
        <label className="field">
          <span>Código da sala</span>
          <input className="code-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            placeholder="ABCD" autoComplete="off" inputMode="text" required minLength={4} />
        </label>
        <label className="field">
          <span>Seu nome</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} placeholder="Como quer aparecer" required maxLength={16} />
        </label>
        <fieldset className="avatars">
          <legend>Avatar</legend>
          {AVATARS.map((a, i) => (
            <button key={a} type="button" className={`av-pick ${av === i ? 'on' : ''}`} onClick={() => setAv(i)} aria-pressed={av === i} aria-label={`Avatar ${i + 1}`}>{a}</button>
          ))}
        </fieldset>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary big" disabled={busy || code.length < 4 || !name.trim()}>
          Entrar <ArrowRight size={20} />
        </button>
        <a className="link-prof" href="#prof"><GraduationCap size={16} /> Sou professor</a>
      </form>
    </main>
  );
}

export function ProfHome() {
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const history = loadHistory();
  const create = async () => { const r = await createRoom(); if (!r.ok) setErr(r.err ?? 'Erro'); };
  return (
    <main className="home">
      <div className="radar" aria-hidden />
      <div className="home-card prof-card">
        <Logo big />
        <p className="tagline">Painel do professor</p>
        <button className="btn primary big" onClick={create}><Plus size={20} /> Criar sala</button>
        {err && <p className="err">{err}</p>}
        {history.length > 0 && (
          <section className="history">
            <h3>Histórico</h3>
            {history.map((h, i) => (
              <div key={`${h.code}${h.round}${h.at}`}>
                <button type="button" className={`hist-row ${h.winner}`} onClick={() => setOpen(open === i ? null : i)}>
                  <span>{new Date(h.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="mono">{h.code} · R{h.round}</span>
                  <b>{h.winner === 'def' ? '🛡️ Defensores' : h.winner === 'inv' ? '⚔️ Invasores' : 'Empate'}</b>
                  <span className="num">{h.teams.def} × {h.teams.inv}</span>
                </button>
                {open === i && <div className="hist-detail"><ResultsBody r={h} /></div>}
              </div>
            ))}
          </section>
        )}
        <a className="link-prof" href="#"><ArrowLeft size={16} /> Entrar como aluno</a>
      </div>
    </main>
  );
}
