# production-status — "Vai na padaria comprar um pão?"

- **Fase:** 2 — **CONCLUÍDO** (2026-11-25). Vídeo final: `final/padaria-pao.mp4`.
- **Aprovação:** roteiro v1 APROVADO pelo usuário em 2026-11-25 ("Aprovado, pode gerar o vídeo"), após escolher a voz Will. Créditos ElevenLabs para a narração autorizados.
- **Roteiro:** v1 (2026-11-25), `production/roteiro.md` + `production/scene-plan.ts` (14 cenas, 1980 frames, 66 s).
- **Referência:** vídeo enviado pelo usuário (62 s, 720×1280): cenário 3D único, legenda de uma palavra branca com contorno, palavra-chave amarela, título com caixa amarela, selos "DICA N", pílulas com bolinha colorida, card de seguir. Estilo reproduzido sem copiar marca, @ ou personagens.
- **Preferências do usuário:** protagonista = Professor (`personagens/professor`); voz natural de narrador; **sem boca mexendo**; mesma estética e legendas da referência.
- **Voz:** ElevenLabs "Will – Social media" (`r3KkFedJ4n8aabIZ0RFQ`), `eleven_multilingual_v2` — **escolhida pelo usuário** após ouvir 4 amostras (amostras-voz/). Créditos para a narração completa: autorizados só ao aprovar o roteiro.
- **Card final:** @professorpowerguido (informado pelo usuário: "Professor Power Guido").
- **Fase 2 (planejado):** projeto Remotion novo em `videos/padaria-pao/` (+ @remotion/three, R3F); Professor importado de `personagens/professor/professor.js`; voz → cortes derivados da voz; stills e folhas de contato; render 1080×1920 H.264 + AAC; −14 LUFS.

## Fase 2 — registro técnico
- Projeto: `videos/padaria-pao/` (Remotion 4.0.547 + @remotion/three + R3F 9 + three 0.170). Professor: `src/three/professor.js` (cópia de `personagens/professor/professor.js`, com troca de expressão `setMood` e braços `setArm`).
- Narração gerada uma vez (13 falas, ElevenLabs Will, `eleven_multilingual_v2`, velocidade 1,05) → `public/vo/*.mp3` + `src/data/timing.json` (tempos por palavra). Total de fala: 47,4 s.
- **Ajuste técnico (sem mudar conteúdo):** cortes derivados da voz real (`src/data/timeline.ts`: fala começa 0,25 s após o corte, pausa 0,55 s; s7→s8 com 0,12 s por ser a mesma frase). Duração final **1816 frames = 60,5 s** (estimativa do roteiro: 66 s). Animações do plano reescaladas para a duração real de cada cena (`L(id, f)`) e presas às palavras onde importa (eureka em "Na hora", quebra do pão em "crocante").

| Cena | Timestamp | Frames | Duração |
| --- | --- | --- | --- |
| s1 | 00:00:00 - 00:04:27 | 0 - 147 | 147 |
| s2 | 00:04:27 - 00:07:28 | 147 - 238 | 91 |
| s3 | 00:07:28 - 00:14:10 | 238 - 430 | 192 |
| s4 | 00:14:10 - 00:19:05 | 430 - 575 | 145 |
| s5 | 00:19:05 - 00:24:21 | 575 - 741 | 166 |
| s6 | 00:24:21 - 00:29:13 | 741 - 883 | 142 |
| s7 | 00:29:13 - 00:34:19 | 883 - 1039 | 156 |
| s8 | 00:34:19 - 00:38:01 | 1039 - 1141 | 102 |
| s9 | 00:38:01 - 00:42:18 | 1141 - 1278 | 137 |
| s10 | 00:42:18 - 00:45:27 | 1278 - 1377 | 99 |
| s11 | 00:45:27 - 00:49:28 | 1377 - 1498 | 121 |
| s12 | 00:49:28 - 00:54:08 | 1498 - 1628 | 130 |
| s13 | 00:54:08 - 00:57:16 | 1628 - 1726 | 98 |
| s14 | 00:57:16 - 01:00:16 | 1726 - 1816 | 90 |

- Ajustes visuais feitos após conferir stills: enquadramentos (s1, s4, s10, s11, s12), Professor de frente nas cenas 7 e 10, Professor atrás da mesa na casa, carimbo refeito (face "A PESO ✓" para a câmera, menor), vidro da vitrine mais transparente.
- Fonte Montserrat servida localmente (`public/fonts`), pois o navegador do render não acessa o Google Fonts. Navegador: Chromium headless já instalado (`--browser-executable`).
- Efeitos e trilha: `scripts/make_sfx.py` (sintetizados).

## Entrega
- `final/padaria-pao.mp4`: H.264 1080×1920, 30 fps, 1816 frames, 60,6 s, AAC 48 kHz 192 kbps.
- Loudness medido após normalização: −14,1 LUFS integrado, pico −1,4 dBFS. Áudio presente em todos os segundos (RMS por segundo entre −13 e −31 dB).
- Verificado: `tsc --noEmit` sem erros; stills de todas as cenas revisados e corrigidos; quadros extraídos do próprio MP4 conferidos (título, DICA, pílulas, contador, fato, CROC, card com @professorpowerguido).
- Não verificado: audição (o agente não ouve áudio).
- Re-render: `npm install && npm run render` e depois `ffmpeg -i out/padaria-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 final/padaria-pao.mp4`.
