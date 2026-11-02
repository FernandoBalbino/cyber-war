# AGENTS.md

- Regras do jogo: `server/game.ts` (constantes `T`, `PTS`, `USES` no topo). Servidor é a única fonte de verdade.
- Senhas: `server/words.ts` (palavras simples, sem acento, 5 a 7 letras). Perguntas: `server/quiz.ts`.
- Cliente recebe `view` (só as seções que mudaram) e `fx` (efeitos). Não mande a ligação defensor→senha para alunos.
- O Render tem limite de banda de 5 GB: teste tudo localmente (`npm test`, `npm run e2e`). No Render, só checagem leve de `/healthz`.
- Node 24 roda TypeScript direto (sem build no servidor): use só sintaxe apagável (sem enum, namespace ou parameter properties) e importe com `.ts`.
- Interface em português, textos curtos; animações só com `transform`/`opacity` e respeitando `prefers-reduced-motion`.
