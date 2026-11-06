# production-status — Por que a rua fica toda alagada depois de uma chuva?

- **Fase:** 1 — **v2 AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas.**
- **Histórico de versões:**
  - v1 (2026-11-06): 90 s, tom informal e ágil. O usuário respondeu "Aprovo sim, este roteiro" **com pedido de mudanças**: "a legenda coloque uma separada da outra e uma fala por vez, explicação calma é bem técnica". Como a narração precisou ser reescrita, a v1 **não** autoriza a Fase 2.
  - v2 (2026-11-06): narração técnica e calma (237 palavras, ~124 pal/min), 115 s = 3450 frames; legendas uma fala por vez, sem dois blocos na tela; voz calma (stability 0,6, style 0,2, velocidade 0,95); vocabulário técnico nos badges; hidrograma esquemático na cena do piscinão. Visual, ordem das cenas e ciclos mantidos.
- **Arquivos:** `rua-alagada/production/roteiro.md`, `rua-alagada/production/scene-plan.ts`, este arquivo.
- **Voz planejada:** ElevenLabs "Liam" (`TX3LPaxmHKxFdv7VOQHJ`, `eleven_multilingual_v2`), ~1.320 caracteres. **Escolha da voz ainda não respondida** pelo usuário. Alternativa gratuita: edge-tts `pt-BR-AntonioNeural`.
- **Preferências do usuário/canal:** legenda uma fala por vez; explicação calma e técnica; mascote de macacão azul e boné; identidade Por Dentro Lab; fecho "segue o Por Dentro Lab".
- **Reaproveitamento previsto na Fase 2:** pipeline do projeto `vid/` (Overlay a adaptar para legenda por frase, badges, Parts do mascote, script de TTS com novas configurações de voz, workflows do GitHub Actions para voz e render).
- **Verificado na Fase 1 (v2):** 11 cenas contíguas, soma 3450; narração idêntica entre tabela, texto corrido e scene-plan; frames da tabela = scene-plan; nenhum frame local fora da cena; `tsc --noEmit --strict` do scene-plan.ts sem erros.
- **NÃO feito:** código de componentes, TTS, áudio, stills, render, MP4.
- **Pendências:** aprovação da v2; escolha da voz.
