# Status de produção — Vídeo 3: Como um buraco no quintal de casa vira uma piscina?

- **Fase:** 2 CONCLUÍDA — `piscina/out/piscina.mp4`: H.264 1080×1920, 30 fps, 155,0 s; AAC; −15,6 LUFS, pico −2,8 dBTP; sem silêncios longos; 26 quadros do MP4 revisados (`piscina/out/folha-de-contato.png`). Não verificado por audição. Roteiro v5 APROVADO pelo usuário ("Aprovo, sim pode fazer", 2026-11-07); implementação iniciada. Antes: roteiro v5 entregue (v4 reduzido para ~2:45 a pedido). Antes: roteiro v4 entregue (narração no estilo do narrador do vídeo de exemplo: cada etapa contada como novidade, com o porquê; voz Liam a 1,08). Antes: roteiro v3 entregue (v2 + tom de amigo contando novidade e final novo). Antes: roteiro v2 entregue (v1 revisado a pedido: desconstrução, mascote só em partes importantes de roupa de banho, pausa/rebobinar em cada erro, círculo vermelho só em 3 pontos). **AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas.**
- **Tema escolhido pelo usuário** em 2026-11-07.
- **Arquivos:** `piscina/production/roteiro.md`, `piscina/production/scene-plan.ts`.
- **Plano técnico:** reaproveitar o projeto do vídeo 2 (`torneira/app`) como base: mascote, legendas, etiquetas, títulos amarelos, círculo vermelho 3D, ✓/✕, pausa/imaginação/rebobinar, pergunta final com confete, voz Liam via workflow do GitHub.
- **Preferências do usuário (herdadas):** voz Liam; legenda uma palavra por vez; sem sincronia labial (só reações); mascote testa e participa de tudo; câmera sempre em movimento; cenário claro com sombras; mascote grande na tela; boné encaixado sem nome; explicação calma e técnica; círculo vermelho todo vermelho e atrás do mascote; sem ícones de comentar/compartilhar no fim; capa no estilo das capas de referência (título branco com palavras em amarelo e vermelho + círculo vermelho).

## Fase 2 (implementação)
- Projeto: `piscina/app` (base do vídeo 2). Voz Liam gerada pelo workflow `voz-piscina` (speed 1,08): 144,9 s de fala, palavras 1:1 com o roteiro.
- Mundo: `src/components/PoolWorld.tsx` (quintal em corte; buraco → projeto → escavação → concreto magro → concreto armado → impermeabilização → pastilhas/borda → água, canos, casa de máquinas → cloro/pH).
- "E se fizer errado?": `src/lib/story.ts` (5 janelas com pausa, imaginação em sépia e rebobinar; o mundo e o mascote voltam no tempo).
- Mascote só em s1, s2 (pulo na lama), s8 (olho ardendo) e s9 (mergulho), de roupa de banho (bermuda, lycra, chinelo, óculos, boia).
- Círculo vermelho 3D só em 3 pontos: trinca da parede, filtro de areia, kit de pH.
- Ajustes técnicos sem mudar conteúdo: câmeras amarradas às palavras e afastadas para caber a piscina inteira.
