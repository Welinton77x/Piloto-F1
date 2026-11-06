# production-status — Por que a rua fica toda alagada depois de uma chuva?

- **Fase:** 1 concluída — **AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas.**
- **Roteiro:** v1 (2026-11-06), origem: tema do usuário via skill remotion-problem-resolve-video.
- **Arquivos:** `rua-alagada/production/roteiro.md`, `rua-alagada/production/scene-plan.ts`, este arquivo.
- **Formato:** 1080×1920, 9:16, 30 fps, 90 s = 2700 frames, 11 cenas.
- **Narração:** 234 palavras, ~156 pal/min, 1.179 caracteres.
- **Voz planejada:** ElevenLabs "Liam" (`TX3LPaxmHKxFdv7VOQHJ`, `eleven_multilingual_v2`), a mesma do canal. **Créditos para ESTE vídeo ainda não autorizados**: a aprovação do roteiro cobre o gasto (~1.200 caracteres). Alternativa gratuita: edge-tts `pt-BR-AntonioNeural`.
- **Preferências herdadas do canal:** mascote de macacão azul e boné (aprovado no vídeo da F1), identidade Por Dentro Lab (cores, Montserrat 900, badges ✖/✔/i/?), fecho "segue o Por Dentro Lab".
- **Reaproveitamento previsto na Fase 2:** pipeline do projeto `vid/` (Overlay, legendas, badges, Parts do mascote, script de TTS, workflows do GitHub Actions para voz e render).
- **Verificado na Fase 1:** 11 cenas contíguas, soma 2700 frames; narração idêntica entre tabela, texto corrido e scene-plan (234 palavras); frames da tabela = scene-plan; `tsc --noEmit --strict` do scene-plan.ts sem erros.
- **NÃO feito:** código de componentes, TTS, áudio, stills, render, MP4.
- **Pendências:** aprovação do roteiro; escolha da voz (ElevenLabs Liam ou edge-tts gratuito).
