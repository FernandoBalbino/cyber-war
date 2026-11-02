# Design QA

Checado em 2026-11-02 com `tests/e2e.mjs` (viewport 1366×680, como Chromebook) e 390×844 (celular).

- [x] Entrada, sala de espera, equipes, preparação, partida, resultado e 2ª rodada sem erros no console.
- [x] Banco de 100 senhas cabe sem rolagem em 1366×680.
- [x] Defensores descobertos ficam destacados para todos (selo "descoberto", listras vermelhas, "por Fulano").
- [x] Vinheta "DEFENSOR X DESCOBERTO" cruza a tela de todos os jogadores e do professor.
- [x] Senha testada e errada fica riscada só para aquele defensor e o servidor recusa repetição.
- [x] Desafio aparece no canto direito sem cobrir o botão de bloquear.
- [x] `prefers-reduced-motion`: animações reduzidas, vinheta vira fade.
- [x] Dicas das ferramentas aparecem ao passar o mouse ou focar com Tab, sem sair da tela.
- [x] Labirinto: setas/WASD e botões na tela; alerta de ataque fica por cima sem empurrar o jogo; desafio aparece na coluna lateral sem cobrir botões.
- [x] /slide: vídeo + 10 slides de LGPD conferidos em 1366×768; navegação por teclado e passador.
