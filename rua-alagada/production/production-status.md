# production-status — Por que a rua fica toda alagada depois de uma chuva?

- **Fase:** 2 **CONCLUÍDO** (MP4 em `rua-alagada/out/rua-alagada.mp4`) — **v2 APROVADA** pelo usuário em 2026-11-06 ("1: eu aprovo"), voz escolhida: "Use a voz do liam" (ElevenLabs Liam, créditos autorizados para este vídeo).
- **Histórico de versões:**
  - v1 (2026-11-06): 90 s, tom informal e ágil. O usuário respondeu "Aprovo sim, este roteiro" **com pedido de mudanças**: "a legenda coloque uma separada da outra e uma fala por vez, explicação calma é bem técnica". Como a narração precisou ser reescrita, a v1 **não** autoriza a Fase 2.
  - v2 (2026-11-06): narração técnica e calma (237 palavras, ~124 pal/min), 115 s = 3450 frames; legendas uma fala por vez, sem dois blocos na tela; voz calma (stability 0,6, style 0,2, velocidade 0,95); vocabulário técnico nos badges; hidrograma esquemático na cena do piscinão. Visual, ordem das cenas e ciclos mantidos.
- **Arquivos:** `rua-alagada/production/roteiro.md`, `rua-alagada/production/scene-plan.ts`, este arquivo.
- **Voz planejada:** ElevenLabs "Liam" (`TX3LPaxmHKxFdv7VOQHJ`, `eleven_multilingual_v2`), ~1.320 caracteres. **Escolhida pelo usuário (v2).** Alternativa gratuita: edge-tts `pt-BR-AntonioNeural`.
- **Preferências do usuário/canal:** legenda uma fala por vez; explicação calma e técnica; mascote de macacão azul e boné; identidade Por Dentro Lab; fecho "segue o Por Dentro Lab".
- **Reaproveitamento previsto na Fase 2:** pipeline do projeto `vid/` (Overlay a adaptar para legenda por frase, badges, Parts do mascote, script de TTS com novas configurações de voz, workflows do GitHub Actions para voz e render).
- **Verificado na Fase 1 (v2):** 11 cenas contíguas, soma 3450; narração idêntica entre tabela, texto corrido e scene-plan; frames da tabela = scene-plan; nenhum frame local fora da cena; `tsc --noEmit --strict` do scene-plan.ts sem erros.
- **Pendências:** nenhuma. Não publicado (entrega local/repositório).

## Fase 2 — ajustes técnicos (conteúdo aprovado inalterado)
- **Voz:** gerada uma vez pelo workflow `.github/workflows/voz-rua.yml` com o segredo `ELEVENLABS_API_KEY` do repositório (a chave colada na sessão foi recusada pela ElevenLabs: "Invalid API key"). Liam, `eleven_multilingual_v2`, stability 0,6 / style 0,2 / speed 0,95. Voz total 101,4 s; nº de palavras por cena = roteiro.
- **Cortes derivados da voz:** fala começa 8 f após o corte; cena termina 20 f após a fala; +45 f no fim. Total **3403 frames = 113,4 s** (plano: 3450). Frames locais do plano reescalados por cena; selos com `anchorWord` entram no frame real da palavra.
- **Enquadramento 9:16:** diorama comprimido no eixo x (mapa `mapX` em `app/src/lib/camera.ts`); rio e piscinão mais fundos para a água descer por gravidade. Câmeras de s1, s4, s5, s6, s9 e s11 reposicionadas (mascote no gancho, boca de lobo vista por cima da rua, piscinão acima do gráfico, plano geral centrado no sistema).
- **Continuidade:** mascote volta à calçada no início da s7, desce do banquinho quando a rua seca (s9); chuva e céu voltam ao normal na s9; chuva forte no plano geral da s11.
- **Render nesta nuvem:** sem GPU e sem acesso ao download do navegador do Remotion → Chromium headless pré-instalado + `--gl=swangle` (o `angle` não abriu contexto WebGL).

## Entrega e verificações (medidas)
- `rua-alagada/out/rua-alagada.mp4`: H.264 1080×1920, 30 fps, 3403 frames, 113,5 s; AAC 48 kHz 192 kb/s; 55 MB.
- Loudness: bruto −23,0 LUFS → final **−14,6 LUFS**, pico real **−1,5 dBTP** (loudnorm + limitador). Áudio presente em todos os 113 s (nenhum segundo abaixo de −40 dB).
- `tsc --noEmit` (strict) sem erros. Stills por cena revisados em 4 rodadas; quadros extraídos do próprio MP4 revisados (`rua-alagada/out/folha-de-contato.png`).
- NÃO verificado: audição (o agente não ouve áudio); só medições.
- Renderizar de novo: ver `rua-alagada/app/README.md`.
