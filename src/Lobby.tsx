import { LogOut, Shield, Swords, X } from 'lucide-react';
import type { PubPlayer } from '../shared/types.ts';
import { Avatar, Logo, TEAM } from './ui.tsx';
import { leaveRoom } from './net.ts';
import type { St } from './net.ts';

// Grade de jogadores; vira duas colunas quando as equipes já foram sorteadas.
export function Roster({ players = [], me, onKick }: { players?: PubPlayer[]; me?: string; onKick?: (id: string) => void }) {
  const sorted = players.some((p) => p.team);
  const card = (p: PubPlayer, i: number) => (
    <li key={p.id} className={`pcard ${p.team ?? ''} ${p.id === me ? 'mine' : ''} ${p.on ? '' : 'off'}`} style={{ animationDelay: `${i * 40}ms` }}>
      <Avatar av={p.av} team={p.team} size={44} />
      <span className="pcard-name">{p.name}</span>
      {onKick && <button type="button" className="kick" onClick={() => onKick(p.id)} aria-label={`Remover ${p.name}`}><X size={14} /></button>}
    </li>
  );
  if (!sorted) return <ul className="roster">{players.map(card)}</ul>;
  const col = (t: 'def' | 'inv') => {
    const list = players.filter((p) => p.team === t);
    return (
      <div className={`team-col ${t}`}>
        <h3>{t === 'def' ? <Shield size={18} /> : <Swords size={18} />} {TEAM[t]} <span className="num">{list.length}</span></h3>
        <ul className="roster">{list.map(card)}</ul>
      </div>
    );
  };
  const rest = players.filter((p) => !p.team);
  return (
    <>
      <div className="teams">{col('def')}{col('inv')}</div>
      {rest.length > 0 && <ul className="roster rest">{rest.map(card)}</ul>}
    </>
  );
}

export function Lobby({ v }: { v: St }) {
  const me = v.players?.find((p) => p.id === v.me?.id);
  return (
    <main className="lobby">
      <header className="lobby-top">
        <Logo />
        <div className="lobby-code"><span>Sala</span><b className="mono">{v.room?.code}</b></div>
        <button className="btn ghost sm" onClick={() => leaveRoom()}><LogOut size={16} /> Sair</button>
      </header>
      <div className="lobby-hero">
        {me?.team ? (
          <h1 className={`role-reveal ${me.team}`}>
            {me.team === 'def' ? <Shield size={44} /> : <Swords size={44} />}
            Você é {me.team === 'def' ? 'Defensor' : 'Invasor'}
          </h1>
        ) : (
          <h1 className="wait">Aguardando o professor<span className="dots"><i /><i /><i /></span></h1>
        )}
        <p className="lobby-count">{v.players?.length ?? 0} jogadores na sala</p>
      </div>
      <Roster players={v.players} me={v.me?.id} />
    </main>
  );
}
