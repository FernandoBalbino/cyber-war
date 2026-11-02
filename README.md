# CYBER WAR

Jogo multiplayer em tempo real sobre senhas, LGPD e segurança da informação para o curso Técnico em Manutenção e Suporte em Informática.

**Defensores** (azul) protegem senhas simples; **Invasores** (vermelho) tentam descobrir qual senha do banco pertence a cada defensor.

- Jogar: https://fernandobalbino.github.io/cyber-war/
- Professor: https://fernandobalbino.github.io/cyber-war/#prof

![Vinheta de defensor descoberto](docs/prints/18-vinheta-defensor-descoberto.png)

## Como funciona

1. O professor cria a sala e projeta o código.
2. Os alunos entram com nome e avatar. O professor escolhe a equipe de cada aluno (ex.: por fileira) ou sorteia, ajusta o tempo e inicia.
3. Preparação de 2 minutos, depois a partida (15 min por padrão; o professor pode mudar e dar +2 min durante o jogo).
4. Cada invasor faz 1 tentativa por minuto: escolhe um defensor e uma senha do banco (100 palavras simples, 5 a 7 caracteres).
   Senha errada fica riscada **só para aquele defensor**, para toda a equipe.
5. Defensores recebem alerta com o nome do invasor e têm 4 segundos para bloquear (Espaço); podem trocar 1 letra da senha uma vez.
   Enquanto isso jogam a **Missão senha forte**: um labirinto em que pegam as 4 peças de uma senha forte, fogem do phishing e abrem um baú (+1 bloqueio ou +20 pontos). O labirinto roda no navegador; o servidor só recebe o caminho no final e confere.
6. Acaba no tempo ou quando todos os defensores caem. O professor pode inverter as equipes e jogar outra rodada.

| Ação | Pontos |
|---|---|
| Invasor descobre uma senha | +100 |
| Tentativa que respeita todas as pistas da equipe | +10 |
| Defensor termina sem ser descoberto | +100 |
| Defensor bloqueia um ataque | +25 |
| Acerto no desafio de LGPD/segurança | +15 (a cada 2 acertos, defensor ganha +1 bloqueio) |
| Baú do labirinto | +20 ou +1 bloqueio (máximo de 3 bloqueios guardados) |

Ferramentas dos invasores: Expandir banco (+20 senhas e 1 letra, 1 vez por equipe), Comprimento, Composição e Rastrear (1 uso de cada por invasor).
Eventos surpresa automáticos a cada 1–3 minutos: Vazamento, Força bruta, Firewall e Desafio relâmpago.

## Arquitetura

- `src/` — site (Vite + React), publicado no GitHub Pages.
- `server/` — Node + Socket.IO no Render. Toda regra, senha e pontuação vive só no servidor; o navegador recebe apenas o banco público.
- `shared/` — tipos e o filtro de pistas usados pelos dois lados.

Senhas são fictícias, geradas para o jogo. Nenhuma senha real de aluno é pedida ou guardada.

## Rodar localmente

```bash
npm install
npm run server      # servidor em http://localhost:3001
npm run dev         # site em http://localhost:5173
npm test            # regras do jogo
```

Teste completo com robôs e prints (local, não usa o Render):

```bash
CW_SPEED=12 node server/index.ts     # tempos curtos só para o teste
npm run build && npx vite preview --port 4173
PW_CHANNEL=msedge npm run e2e
```

Os prints ficam em `docs/prints/`.

Sala local com bots para jogar como aluno (o script faz o papel do professor):

```bash
npm run server
npm run dev -- --host
npm run bots -- 7
```

## Aula: vídeo e slides

- `/slide` abre a apresentação: 1º o vídeo explicativo do jogo, depois os slides de LGPD (← → ou passador de slides, **F** = tela cheia). Essa página não conecta no servidor do jogo.
- O vídeo é feito com Remotion na pasta `video/` (cenas em `video/src/scenes`, roteiro em `video/src/script.ts`).
- Narração: voz "Filipe – Natural e Expressivo", modelo Eleven v4, gerada no ElevenLabs e salva em `video/public/voice/s1.mp3 … s10.mp3`.
- Para refazer:

```bash
cd video
node --env-file=../.env.local scripts/voiceover.mts   # mede quando cada palavra é falada (sincroniza as animações)
npx remotion studio                                   # prévia
npx remotion render CyberWar ../public/video/cyberwar.mp4 --crf=22
```
