# production-status — "Vai cortar o cabelo?"

- **Fase:** 2 — **CONCLUÍDO** (2026-11-26).
- **Aprovação:** roteiro v1 APROVADO pelo usuário em 2026-11-26 ("Pode fazer"). Créditos ElevenLabs para a narração autorizados.
- **Roteiro:** v1 (2026-11-26), `production/roteiro.md` + `production/scene-plan.ts` (11 cenas, estimativa 2268 frames / 75,6 s).
- **Origem:** ideia nº 1 da lista de próximos vídeos; o usuário pediu "mais coisas aleatórias também no roteiro" (o tema ainda não foi confirmado explicitamente; o roteiro diz que dá para trocar).
- **Preferências do usuário (do vídeo da padaria):** formato de comédia da referência, narrador animado (Will, `eleven_v3`, marcações de emoção), boca parada, legendas e gráficos no mesmo estilo, música bem baixa (e versão sem música), card @professorpowerguido.
- **Fatos conferidos:** corte de cabelo no espaço com aspirador (NASA/ESA/CSA); cabelo cresce ~1 cm/mês.
- **Fase 2 (planejado):** reaproveitar o projeto `videos/padaria-pao` (motor, Professor, overlay, TTS, timeline) num projeto `videos/cabelo`; cenários novos (barbearia, estação espacial), personagens novos (barbeiro, pato, leão).

## Entrega
- `final/cabelo-musica-baixa.mp4` (73,0 s, −14,3 LUFS, pico −2,8 dBFS) e `final/cabelo-sem-musica.mp4` (73,0 s, −14,3 LUFS, pico −2,9 dBFS). H.264 1080×1920, 30 fps, 2189 frames, AAC 48 kHz.
- Narração (11 falas, Will, eleven_v3, marcações do campo `delivery` do plano) gerada uma vez. Cortes derivados da voz (`src/data/timeline.ts`).
- Projeto: `videos/cabelo/` (node_modules é um link para `videos/padaria-pao/node_modules`; para rodar noutro lugar: `npm install`). Render: `npm run render`; áudio sem música: `npx remotion render src/index.ts Cabelo out/audio-0.wav --codec=wav --props='{"music":0}'`.
- Verificado: `tsc --noEmit` sem erros; stills de todas as cenas revisados e corrigidos (enquadramento do pato e do final, sirene, subida ao espaço com céu escuro e estrelas); quadros extraídos do MP4 conferidos; áudio presente em todos os segundos. Não verificado: audição.
- Ajustes técnicos (mesmo conteúdo): no espaço o Professor aparece com cabelo (cena "imaginada", para o corte fazer sentido); posições/câmeras ajustadas para caber no 9:16.
