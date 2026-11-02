import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { Logo } from './Logo.tsx';
import './slides.css';

// Apresentação da aula: 1º o vídeo do jogo, depois LGPD. O professor passa com ← → ou o passador de slides.
const BASE = import.meta.env.BASE_URL;
const d = (i: number) => ({ '--d': i }) as CSSProperties;

function Chips({ items, color, from = 0 }: { items: string[]; color: string; from?: number }) {
  return <div className="sl-chips">{items.map((t, i) => <span key={t} className="sl-chip anim-pop" style={{ ...d(from + i), '--c': color } as CSSProperties}>{t}</span>)}</div>;
}

const SLIDES: { name: string; body: ReactNode }[] = [
  {
    name: 'Vídeo',
    body: (
      <div className="sl-video anim-pop">
        <video src={`${BASE}video/cyberwar.mp4`} poster={`${BASE}video/poster.jpg`} controls playsInline preload="metadata" />
      </div>
    ),
  },
  {
    name: 'LGPD',
    body: (
      <div className="sl-center">
        <div className="sl-icon float anim-pop">🛡️</div>
        <h1 className="sl-h1 anim-up" style={d(1)}>LGPD</h1>
        <p className="sl-sub anim-up" style={d(2)}>Lei Geral de Proteção de Dados</p>
        <Chips items={['Lei 13.709', 'criada em 2018', 'vale desde 2020']} color="#3ba7ff" from={3} />
        <p className="sl-big anim-up" style={d(6)}>Protege os <b>dados pessoais</b> de cada pessoa.</p>
      </div>
    ),
  },
  {
    name: 'Dado pessoal',
    body: (
      <div className="sl-two">
        <div className="sl-col blue anim-left">
          <h2>Dado pessoal</h2>
          <p>identifica alguém</p>
          <Chips items={['👤 Nome', '🪪 CPF', '📧 E-mail', '📱 Telefone', '📸 Foto', '📍 Localização']} color="#3ba7ff" from={1} />
        </div>
        <div className="sl-col red anim-right" style={d(3)}>
          <h2>Dado sensível</h2>
          <p>pode gerar discriminação</p>
          <Chips items={['🩺 Saúde', '🧬 Biometria', '🙏 Religião', '🌍 Origem racial', '🗳️ Opinião política']} color="#ff3b5c" from={5} />
        </div>
        <p className="sl-foot anim-up" style={d(11)}>Sensível = cuidado redobrado.</p>
      </div>
    ),
  },
  {
    name: 'Quem é quem',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Quem é quem</h2>
        <div className="sl-cards four">
          {[['🙋', 'Titular', 'você, dono dos dados'], ['🏫', 'Controlador', 'decide como usar (ex.: a escola)'], ['⚙️', 'Operador', 'trata os dados a mando dele (ex.: o sistema)'], ['🏛️', 'ANPD', 'fiscaliza e aplica multas']].map(([i, t, s], k) => (
            <div key={t} className="sl-card anim-flip" style={d(k + 1)}><span className="sl-emoji">{i}</span><b>{t}</b><span>{s}</span></div>
          ))}
        </div>
      </>
    ),
  },
  {
    name: 'Consentimento',
    body: (
      <div className="sl-two">
        <div className="anim-left">
          <h2 className="sl-h2">Consentimento</h2>
          <Chips items={['✔ Livre', '✔ Informado', '✔ Claro', '✔ Para um fim específico']} color="#2ee59d" from={1} />
        </div>
        <div className="sl-form anim-right" style={d(2)}>
          <label className="on" style={d(4)}><i /><span>Aceito que a escola use meu e-mail para <b>avisos</b></span></label>
          <label style={d(6)}><i /><span>...e para <b>vender a anunciantes</b></span></label>
          <p>Cada uso precisa da sua autorização. Você pode desistir quando quiser.</p>
        </div>
      </div>
    ),
  },
  {
    name: 'Direitos',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Direitos do titular</h2>
        <div className="sl-cards six">
          {[['👀', 'Acessar'], ['✏️', 'Corrigir'], ['🗑️', 'Excluir'], ['📦', 'Levar para outro serviço'], ['🤝', 'Saber com quem foi compartilhado'], ['✋', 'Desistir do consentimento']].map(([i, t], k) => (
            <div key={t} className="sl-card small anim-pop" style={d(k + 1)}><span className="sl-emoji">{i}</span><b>{t}</b></div>
          ))}
        </div>
      </>
    ),
  },
  {
    name: 'Vazamento',
    body: (
      <div className="sl-two">
        <div className="sl-leak anim-pop">
          <span className="db">🗄️</span>
          {[0, 1, 2, 3].map((k) => <span key={k} className="drop" style={d(k)}>💧</span>)}
        </div>
        <div>
          <h2 className="sl-h2 anim-up">Vazamento de dados</h2>
          <ol className="sl-steps">
            <li className="anim-up" style={d(2)}>A empresa precisa <b>avisar a ANPD</b></li>
            <li className="anim-up" style={d(3)}>e <b>avisar as pessoas</b> afetadas</li>
            <li className="anim-up" style={d(4)}>Multa de até <b>2% do faturamento</b>, até <b>R$ 50 milhões</b> por infração</li>
          </ol>
          <p className="sl-note anim-up" style={d(6)}>💧 No jogo: o evento “Vazamento” entrega uma letra da sua senha.</p>
        </div>
      </div>
    ),
  },
  {
    name: 'Senhas',
    body: (
      <>
        <h2 className="sl-h2 anim-up">A senha é a chave</h2>
        <div className="sl-meter">
          {[['gatos', 'Fraca', '#ff3b5c', 25], ['Gatos7#', 'Média', '#ffb020', 55], ['cavalo-azul-pula-muro', 'Forte', '#2ee59d', 100]].map(([w, l, c, v], k) => (
            <div key={w} className="sl-meter-row anim-left" style={{ ...d(k * 2 + 1), '--c': c, '--v': `${v}%` } as CSSProperties}>
              <code>{w}</code><div className="bar"><span /></div><b>{l}</b>
            </div>
          ))}
        </div>
        <Chips items={['🔑 1 conta = 1 senha', '🗃️ use um gerenciador de senhas', '🤐 nunca compartilhe']} color="#3ba7ff" from={7} />
      </>
    ),
  },
  {
    name: 'Ataques reais',
    body: (
      <>
        <h2 className="sl-h2 anim-up">O jogo na vida real</h2>
        <div className="sl-cards three">
          {[['⚡', 'Força bruta', 'testar milhares de senhas', 'bloqueio após erros e CAPTCHA'],
            ['🎣', 'Phishing', 'golpe que pede sua senha', 'desconfie de links e pressa'],
            ['🔍', 'Pistas', 'aniversário, nome do pet, time', 'senha sem nada pessoal']].map(([i, t, a, b], k) => (
            <div key={t} className="sl-card anim-flip" style={d(k + 1)}>
              <span className="sl-emoji">{i}</span><b>{t}</b><span>{a}</span><em>🛡️ {b}</em>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    name: 'Proteja-se',
    body: (
      <div className="sl-two wide">
        <div className="sl-center anim-left"><div className="sl-icon float">🔐</div><h2 className="sl-h2">Proteja-se</h2></div>
        <ul className="sl-check">
          {['Verificação em duas etapas (2FA)', 'Bloqueie a tela ao sair (Win + L)', 'Mantenha o sistema atualizado', 'Uma senha diferente por conta', 'Pense antes de postar seus dados'].map((t, k) => (
            <li key={t} className="anim-up" style={d(k + 1)}><i />{t}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    name: 'Bora jogar',
    body: (
      <div className="sl-center">
        <div className="anim-pop"><Logo big /></div>
        <p className="sl-big anim-up" style={d(2)}>Agora é com vocês!</p>
        <p className="sl-sub anim-up" style={d(3)}>Entrem com o código da sala que o professor vai mostrar.</p>
      </div>
    ),
  },
];

export function Slides() {
  const [i, setI] = useState(0);
  const deck = useRef<HTMLDivElement>(null);
  const go = (n: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + n)));
  useEffect(() => {
    document.title = 'CYBER WAR · Aula';
    const f = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLVideoElement && (e.key === ' ' || e.key.startsWith('Arrow'))) return; // controles do vídeo
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key.toLowerCase() === 'f') full();
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : deck.current?.requestFullscreen())?.catch(() => {});
  return (
    <div className="deck" ref={deck}>
      <div className="bg" aria-hidden />
      <section className="slide" key={i} aria-label={`${i + 1}. ${SLIDES[i].name}`}>{SLIDES[i].body}</section>
      <nav className="sl-nav">
        <button onClick={() => go(-1)} disabled={i === 0} aria-label="Anterior"><ChevronLeft /></button>
        <span className="sl-dots">{SLIDES.map((s, k) => <i key={s.name} className={k === i ? 'on' : ''} onClick={() => setI(k)} title={s.name} />)}</span>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} aria-label="Próximo"><ChevronRight /></button>
        <button onClick={full} aria-label="Tela cheia"><Maximize size={18} /></button>
      </nav>
    </div>
  );
}
