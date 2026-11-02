import { useEffect } from 'react';
import { Trophy, Shield, Swords, LockOpen, Lock, Repeat, Shuffle, LogOut } from 'lucide-react';
import type { Results as R } from '../shared/types.ts';
import { Avatar } from './ui.tsx';
import { call, keepResult, leaveRoom } from './net.ts';
import type { St } from './net.ts';

const WIN = { def: 'Defensores venceram', inv: 'Invasores venceram', tie: 'Empate!' };

export function ResultsBody({ r, me }: { r: R; me?: string }) {
  const rate = r.attempts ? Math.round((r.hits / r.attempts) * 100) : 0;
  return (
    <>
      <div className={`winner ${r.winner}`}>
        <Trophy size={48} className="trophy" />
        <h1>{WIN[r.winner]}</h1>
        <div className="final-score">
          <span className="def"><Shield size={22} /> <b className="num">{r.teams.def}</b></span>
          <span className="x">×</span>
          <span className="inv"><b className="num">{r.teams.inv}</b> <Swords size={22} /></span>
        </div>
      </div>
      <div className="stats">
        <div><b className="num">{r.hits}/{r.defenders.length}</b><span>senhas quebradas</span></div>
        <div><b className="num">{r.attempts}</b><span>tentativas</span></div>
        <div><b className="num">{rate}%</b><span>de acerto</span></div>
        <div><b className="num">{r.blocks}</b><span>bloqueios</span></div>
      </div>
      <div className="res-grid">
        <section className="panel">
          <h2>Senhas dos defensores</h2>
          <ul className="pw-cards">
            {r.defenders.map((d, i) => (
              <li key={d.id} className={d.down ? 'down' : 'safe'} style={{ animationDelay: `${300 + i * 70}ms` }}>
                <Avatar av={d.av} team="def" size={34} down={!!d.down} />
                <div>
                  <span className="pwc-name">{d.name}</span>
                  <span className="pwc-pw mono">{d.pw}</span>
                </div>
                <span className="pwc-status">{d.down ? <><LockOpen size={14} /> {d.down}</> : <><Lock size={14} /> protegida</>}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Desempenho</h2>
          <table className="perf">
            <thead><tr><th /><th>Jogador</th><th>Pontos</th><th title="Senhas quebradas / tentativas">Ataques</th><th>Bloq.</th><th>Desafios</th></tr></thead>
            <tbody>
              {r.players.map((p, i) => (
                <tr key={p.id} className={`${p.team} ${p.id === me ? 'mine' : ''}`}>
                  <td className="num">{i + 1}</td>
                  <td><span className="perf-name"><Avatar av={p.av} team={p.team} size={24} /> {p.name}</span></td>
                  <td className="num"><b>{p.score}</b>{p.total !== p.score && <small> · total {p.total}</small>}</td>
                  <td className="num">{p.team === 'inv' ? `${p.hits}/${p.attempts}` : '—'}</td>
                  <td className="num">{p.team === 'def' ? p.blocked : '—'}</td>
                  <td className="num">{p.quiz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <p className="lesson">💡 Palavra comum com número no fim cai rápido. Use frases longas, uma senha por conta e verificação em duas etapas.</p>
    </>
  );
}

export function Results({ v }: { v: St }) {
  const r = v.results!;
  useEffect(() => { if (v.prof) keepResult(r); }, [v.prof, r]);
  const next = (swap: boolean) => call('prof:next', { swap });
  return (
    <main className="results">
      <ResultsBody r={r} me={v.me?.id} />
      {v.prof ? (
        <div className="prof-actions">
          <button className="btn primary big" onClick={() => next(true)}><Repeat size={20} /> Inverter equipes e jogar</button>
          <button className="btn ghost" onClick={() => next(false)}><Shuffle size={18} /> Sortear novas equipes</button>
          <button className="btn ghost" onClick={() => confirm('Fechar a sala para todos?') && leaveRoom(true)}><LogOut size={18} /> Fechar sala</button>
        </div>
      ) : (
        <p className="wait small">Aguardando o professor<span className="dots"><i /><i /><i /></span></p>
      )}
    </main>
  );
}
