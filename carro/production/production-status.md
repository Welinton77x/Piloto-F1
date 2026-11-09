# Status de produção — Vídeo 4: Você construiu um carro do zero

- **Fase:** 2 — roteiro v3 APROVADO pelo usuário ("Eu aprovo pode fazer", 2026-11-08); implementação iniciada. Antes: roteiro v3 entregue (v2 + final: comentar o que quer ver no próximo vídeo) (v1 + pausar/rebobinar com ⏸ e ⏪ no meio da tela). **AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas.**
- **Pedido do usuário (2026-11-08):** vídeo no formato da referência "Você construiu uma bicicleta do zero", mas sobre carro.
- **Referência analisada:** quadros a cada 2 s e transcrição (ElevenLabs STT pelo workflow `stt-carro`, arquivo `carro/stt/words.json`).
- **Arquivos:** `carro/production/roteiro.md`, `carro/production/scene-plan.ts`.
- **Preferências herdadas:** voz Liam; legenda uma palavra por vez; sem sincronia labial; mascote testando tudo; câmera sempre em movimento; sem círculos vermelhos; duração até 2:45.

## Fase 2 CONCLUÍDA
- `carro/out/carro.mp4`: H.264 1080×1920, 30 fps, 4714 frames, 157,1 s; AAC; −15,2 LUFS, pico −2,5 dBTP; sem silêncios longos; 25 quadros do MP4 revisados (`carro/out/folha-de-contato.png`). Não verificado por audição.
- Acabamento parecido com a referência: profundidade de campo (BokehPass), tons ACES e SMAA (`src/components/Post.tsx`). Render em 3 partes (limite de 2 h por comando) + áudio por uma composição só de som (`Audio`), juntados com ffmpeg.
- Pedidos do usuário durante a Fase 2: mãos no volante virado para o boneco, pés nos pedais, troca de marcha; ⏸/⏪ no meio da tela; ✕ vermelho / ✓ verde grandes; etiquetas só com a bolinha.
