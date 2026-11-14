# Status de produção — Vídeo 6: Por que o Nordeste tá tão quente?

- **Fase:** 2 — roteiro v1 e boneco APROVADOS pelo usuário ("Ok, agora sim eu aprovo pode executar o serviço", 2026-11-12); implementação iniciada. Boneco: estilo da referência, blusão azul sem bolinha, capacete de obra azul (formato da foto do usuário), mochila. ⏸/⏪ só no ventilador (decisão do usuário).
- **Pedido do usuário (2026-11-12):** vídeo no formato da referência "Por que o Sul do Brasil teve 7 tornados em 6 dias?"; tema calor no Nordeste com El Niño; boneco igual ao da referência (proporção, movimentos, física), de blusão azul, sem boné/chapéu, sem a bolinha no peito; sem bugs.
- **Referência analisada:** quadros a cada 2 s, quadros ampliados do personagem e transcrição (workflow `stt-nordeste`, arquivo `nordeste/stt/words.json`).
- **Preferências herdadas:** voz Liam; legenda uma palavra por vez; sem sincronia labial; ⏸/⏪ no meio da tela; ✕/✓ grandes; etiquetas com bolinha; sem círculos vermelhos; final pedindo comentário + próximo vídeo; até 2:45.

## Fase final (12/11)
- Capacete trocado pelo cabelo da referência (aprovado).
- Render final: out/nordeste.mp4 — 2:18,6, 1080×1920, 4157 frames, loudnorm -15 LUFS.

- 2026-11-12: render final v2 (mascote referência, globo com Brasil, casas, quarto, juazeiro alto) — 4157 frames, 2:18.6.
- 2026-11-12: removido o som de grilo/cigarra; adicionados efeitos de reação do personagem (calor, enxugar a testa, alívio, confete, brilho).
