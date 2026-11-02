import { useEffect, useState } from 'react';
import { useView } from './net.ts';
import { Hud, Logo, Toasts, Vignette } from './ui.tsx';
import { Join, ProfHome } from './Home.tsx';
import { Lobby } from './Lobby.tsx';
import { Defender } from './Defender.tsx';
import { Invader } from './Invader.tsx';
import { Teacher } from './Teacher.tsx';
import { Results } from './Results.tsx';

function Booting() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 4000); return () => clearTimeout(t); }, []);
  return (
    <main className="home booting">
      <div className="radar" aria-hidden />
      <div className="boot">
        <Logo big />
        <div className="loader" aria-hidden><i /><i /><i /></div>
        <p>Conectando ao servidor…</p>
        {slow && <p className="hint">O servidor gratuito pode levar até 1 minuto para acordar.</p>}
      </div>
    </main>
  );
}

export function App() {
  const v = useView();
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  let screen;
  if (!v.ready) screen = <Booting />;
  else if (!v.room) screen = hash === '#prof' ? <ProfHome /> : <Join />;
  else if (v.prof) screen = <Teacher v={v} />;
  else if (v.room.phase === 'end' && v.results) screen = <Results v={v} />;
  else if (v.room.phase === 'lobby' || !v.me?.team) screen = <Lobby v={v} />;
  else screen = <><Hud v={v} />{v.me.team === 'def' ? <Defender v={v} /> : <Invader v={v} />}</>;

  return (
    <>
      <div className="bg" aria-hidden />
      {v.ready && !v.conn && <div className="connbar">Reconectando…</div>}
      {screen}
      <Vignette />
      <Toasts />
    </>
  );
}
