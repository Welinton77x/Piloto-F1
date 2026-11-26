# production-status — "Isso vai cair na prova?"

- **Fase:** v2 CONCLUÍDA e entregue (2026-11-26). **v3 (sem sentido): APROVADA pelo usuário em 2026-11-26 ("Pode fazer eu aprovo"); Fase 2 da v3 EM ANDAMENTO.** Créditos ElevenLabs para a narração autorizados.
- **v3:** pedido do usuário "o vídeo mais sem sentido" + voz da amostra enviada (Will – Deep, `CstacWqMhJQlnfLPxRG4`, `eleven_v4`, stability 0.5, similarity 0.75). Roteiro v2 arquivado em `roteiro-v2.md` / `scene-plan-v2.ts`.
- **Aprovação:** roteiro v2 (sem fato real) APROVADO pelo usuário em 2026-11-26 ("Pode fazer, eu aprovo"). Créditos ElevenLabs para a narração autorizados.
- **Roteiro:** v2 (2026-11-26), `production/roteiro.md` + `production/scene-plan.ts` (10 cenas, estimativa 2313 frames / 77,1 s). v2 = v1 sem o fato real (pedido do usuário); nova cena "estudando o intervalo / mapa mental do recreio".
- **Origem:** usuário escolheu "roteiro novo no formato da história em corrente" (exemplo dos gatos); tema escolhido pelo agente (pode trocar).
- **Padrão:** `videos/GUIA-DO-CANAL.md` (voz Will estilo B, legendas, card @professorpowerguido, música baixa + versão sem música).
- **Sem fato real** (preferência do usuário, registrada no guia do canal).
- **Fase 2 (planejado):** reaproveitar o motor de `videos/cabelo`; cenário novo (sala de aula), alunos, material escolar com rosto, cartões falsos (definição técnica, notificação, plano de ensino).

## Entrega
- `final/prova-musica-baixa.mp4` (71,1 s, −14,4 LUFS, pico −2,7 dBFS) e `final/prova-sem-musica.mp4` (71,1 s, −14,4 LUFS, pico −2,2 dBFS). H.264 1080×1920, 30 fps, 2132 frames, AAC 48 kHz.
- Narração: 10 falas, Will estilo B (`eleven_multilingual_v2`, stability 0.3, style 0.75, speed 1.0, sem marcações), gerada uma vez. Cortes derivados da voz.
- Verificado: `tsc --noEmit` sem erros; stills de todas as cenas revisados e corrigidos (boné cobrindo os olhos, close do giz bloqueado por carteira, câmera da mesa do material, texto do quadro grande demais para o 9:16, close do Professor atrás da parede, Professor colado na câmera nas tomadas do lado do quadro); quadros extraídos do MP4 conferidos; áudio presente em todos os segundos menos o último (fade da música sob o card). Não verificado: audição.
- Ajustes técnicos (mesmo conteúdo): nas tomadas que mostram o rosto dos alunos (câmera do lado do quadro) a parede do fundo e o Professor ficam ocultos; textos do quadro centralizados e menores; pílula "VAI CAIR NA PROVA?" com tempo ajustado para não sobrepor o título.
- Render: `npm run render`; sem música: `npx remotion render src/index.ts Prova out/audio-0.wav --codec=wav --props='{"music":0}'` e juntar com ffmpeg.
