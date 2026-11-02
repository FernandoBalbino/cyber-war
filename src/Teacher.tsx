import { useMemo, useState } from 'react';
import { Eye, EyeOff, LogOut, Play, Shuffle, SkipForward, Square } from 'lucide-react';
import type { EventKind } from '../shared/types.ts';
import { call, leaveRoom } from './net.ts';
import type { St } from './net.ts';
import { DefStrip, Hud, Logo, Ranking } from './ui.tsx';
import { Roster } from './Lobby.tsx';
import { FeedLine } from './Invader.tsx';
import { Results } from './Results.tsx';

const EVENTS: { ev: EventKind; icon: string; name: string; tip: string }[] = [
  { ev: 'leak', icon: '💧', name: 'Vazamento', tip: 'Invasores ganham 1 letra de um defensor' },
  { ev: 'brute', icon: '⚡', name: 'Força bruta', tip: 'Libera agora a tentativa de todos os invasores' },
  { ev: 'firewall', icon: '🛡️', name: 'Firewall', tip: 'Defensores ganham +1 bloqueio' },
  { ev: 'quiz', icon: '❓', name: 'Desafio LGPD', tip: 'Pergunta relâmpago para todos' },
];

export function Teacher({ v }: { v: St }) {
  const phase = v.room?.phase;
  if (phase === 'end' && v.results) return <Results v={v} />;
  if (phase === 'prep' || phase === 'live') return <TeacherLive v={v} />;
  return <TeacherLobby v={v} />;
}

function useAction() {
  const [err, setErr] = useState('');
  const run = async (ev: string, data?: object) => { setErr(''); const r = await call(ev, data); if (!r.ok) setErr(r.err ?? 'Erro'); };
  return { err, run };
}

function TeacherLobby({ v }: { v: St }) {
  const { err, run } = useAction();
  const code = v.room?.code ?? '';
  const url = `${location.host}${location.pathname}`.replace(/\/$/, '');
  const online = v.players?.filter((p) => p.on).length ?? 0;
  return (
    <main className="lobby prof">
      <header className="lobby-top">
        <Logo />
        <span className="lobby-count">{online} aluno{online === 1 ? '' : 's'} conectado{online === 1 ? '' : 's'}</span>
        <button className="btn ghost sm" onClick={() => confirm('Fechar a sala?') && leaveRoom(true)}><LogOut size={16} /> Fechar sala</button>
      </header>
      <div className="join-banner">
        <div className="join-url"><span>Acesse</span><b>{url}</b></div>
        <div className="big-code" aria-label="Código da sala">{[...code].map((c, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }}>{c}</span>)}</div>
      </div>
      <div className="prof-actions">
        <button className="btn ghost" onClick={() => run('prof:sort')} disabled={online < 2}><Shuffle size={18} /> Sortear equipes</button>
        <button className="btn primary big" onClick={() => run('prof:start')} disabled={online < 2}><Play size={20} /> Iniciar partida</button>
      </div>
      {err && <p className="err center">{err}</p>}
      {v.players?.length ? <Roster players={v.players} onKick={(id) => run('prof:kick', { id })} />
        : <p className="wait small">Esperando alunos<span className="dots"><i /><i /><i /></span></p>}
    </main>
  );
}

function TeacherLive({ v }: { v: St }) {
  const { err, run } = useAction();
  const [show, setShow] = useState(false);
  const names = useMemo(() => new Map((v.players ?? []).map((p) => [p.id, p])), [v.players]);
  const tries = (v.feed ?? []).filter((l) => l.k === 'try');
  const hits = tries.filter((l) => l.r === 'hit').length;
  return (
    <>
      <Hud v={v} />
      <main className="game prof-view">
        <div className="main-col">
          <DefStrip v={v} secrets={show ? v.secrets : undefined} />
          <section className="panel log">
            <h3>Ao vivo <span className="hint">{tries.length} tentativa{tries.length === 1 ? '' : 's'} · {hits} acerto{hits === 1 ? '' : 's'}</span></h3>
            <ul>{[...(v.feed ?? [])].reverse().map((l, i) => <FeedLine key={`${l.at}${i}`} l={l} names={names} words />)}</ul>
          </section>
        </div>
        <aside className="side">
          <section className="panel controls">
            <h3>Partida</h3>
            {v.room?.phase === 'prep' && <button className="btn primary" onClick={() => run('prof:skip')}><SkipForward size={18} /> Começar agora</button>}
            <button className="btn ghost" onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />} {show ? 'Esconder' : 'Mostrar'} senhas</button>
            <button className="btn danger" onClick={() => confirm('Encerrar a partida agora?') && run('prof:end')}><Square size={18} /> Encerrar</button>
          </section>
          <section className="panel events">
            <h3>Eventos surpresa</h3>
            <div className="event-grid">
              {EVENTS.map((e) => (
                <button key={e.ev} type="button" className="event" title={e.tip} disabled={v.room?.phase !== 'live'} onClick={() => run('prof:event', { ev: e.ev })}>
                  <span className="event-icon">{e.icon}</span>{e.name}
                </button>
              ))}
            </div>
            {err && <p className="err">{err}</p>}
          </section>
          <Ranking players={v.players} limit={20} />
        </aside>
      </main>
    </>
  );
}
