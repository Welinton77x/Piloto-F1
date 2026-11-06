# production-status — Como a água chega na sua torneira?

- **Fase:** 2 EM ANDAMENTO — **roteiro v2 APROVADO** pelo usuário em 2026-11-06 ("Agora sim, eu aprovo pode executar o processo do vídeo, use a voz do Matheus Dynamics energy").
- **Roteiro:** v2 (2026-11-06): final mais caloroso a pedido do usuário ("Agora você sabe de onde vem a água que sai na sua torneira!"), ~97 s, 201 palavras. v1 não aprovada. Tema escolhido pelo usuário ("Como a água chega na torneira", "Cerca de 90 s") entre ideias sugeridas.
- **Arquivos:** `torneira/production/roteiro.md`, `torneira/production/scene-plan.ts`, este arquivo.
- **Formato:** 1080×1920, 30 fps, ~97 s = 2910 frames, 11 cenas; 201 palavras, 1.104 caracteres.
- **Voz:** ElevenLabs "Matheus - Energetic and Dynamic" (`NQmLEqxcRTkWYIYZSYod`, `eleven_multilingual_v2`), escolhida pelo usuário na aprovação (no lugar do Liam do roteiro); stability 0,5, style 0,3, speed 1,0; gerada pelo workflow `voz-torneira.yml`.
- **Preferências herdadas:** explicação calma e técnica; legenda uma fala por vez; estilo 3D liso v5; mascote do vídeo com reações; trilha leve sem direitos; chuva/ambiente baixos; final sem ícones de comentar/compartilhar; CTA "comente X / comente Y".
- **Reaproveitamento previsto:** pipeline de `rua-alagada/app` (cenas, câmera, legendas, selos, mascote, áudio), com diorama novo.
- **Pendências:** voz, implementação, render e verificação.
