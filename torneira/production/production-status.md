# production-status — Como a água chega na sua torneira?

- **Fase:** 2 CONCLUÍDO — **roteiro v2 APROVADO** pelo usuário em 2026-11-06 ("Agora sim, eu aprovo pode executar o processo do vídeo, use a voz do Matheus Dynamics energy").
- **Roteiro:** v2 (2026-11-06): final mais caloroso a pedido do usuário ("Agora você sabe de onde vem a água que sai na sua torneira!"), ~97 s, 201 palavras. v1 não aprovada. Tema escolhido pelo usuário ("Como a água chega na torneira", "Cerca de 90 s") entre ideias sugeridas.
- **Arquivos:** `torneira/production/roteiro.md`, `torneira/production/scene-plan.ts`, este arquivo.
- **Formato:** 1080×1920, 30 fps, ~97 s = 2910 frames, 11 cenas; 201 palavras, 1.104 caracteres.
- **Voz:** ElevenLabs "Matheus - Energetic and Dynamic" (`NQmLEqxcRTkWYIYZSYod`, `eleven_multilingual_v2`), escolhida pelo usuário na aprovação (no lugar do Liam do roteiro); stability 0,5, style 0,3, speed 1,0; gerada pelo workflow `voz-torneira.yml`.
- **Preferências herdadas:** explicação calma e técnica; legenda uma fala por vez; estilo 3D liso v5; mascote do vídeo com reações; trilha leve sem direitos; chuva/ambiente baixos; final sem ícones de comentar/compartilhar; CTA "comente X / comente Y".
- **Reaproveitamento previsto:** pipeline de `rua-alagada/app` (cenas, câmera, legendas, selos, mascote, áudio), com diorama novo.
- **Pendências:** voz, implementação, render e verificação.

## Fase 2 — registro técnico
- **Voz:** a API do plano gratuito recusou a voz da biblioteca ("Free users cannot use library voices via the API", erro 402 no workflow). Gerada então pelo conector da ElevenLabs no chat (mesma voz Matheus, `eleven_multilingual_v2`, uma tomada, 1.104 créditos), baixada (host `elevenlabsusercontent.com` liberado no ambiente `piloto-f1`) e transcrita com `eleven_scribe_v1` (0 crédito) para os tempos por palavra; cortada por cena em `app/public/vo/sN.mp3` + `app/src/data/timing.json`. Narração completa: `production/narracao-completa-matheus.mp3` (85,5 s).
- **Cortes derivados da voz:** 2912 frames ≈ 97,1 s.
- **Ajustes de enquadramento/geometria (conteúdo inalterado):** canos e bomba subterrâneos na face do corte; morro menor; câmeras das cenas da ETA centradas nos tanques; cozinha mais à frente; hidrômetro e subida no muro externo; resumo da s11 como panorâmica da represa até a casa (o sistema inteiro não cabe em 9:16).

## Entrega
- **Fase 2 CONCLUÍDA.** `torneira/out/torneira.mp4`: H.264 1080×1920, 30 fps, 2912 frames, 97,1 s; AAC 48 kHz; −15,4 LUFS, pico −2,3 dBFS; áudio em todos os segundos (51 MB).
- Mudanças pedidas pelo usuário durante a Fase 2: boné encaixado sem nome/lâmpada e com aba para frente; legendas uma palavra por vez (estilo da referência); mascote maior.
- Verificado: `tsc --noEmit`, stills revisados em 6 rodadas, 18 quadros do MP4 revisados (`torneira/out/folha-de-contato.png`). Não verificado por audição.

## Entrega v2 (correções do usuário)
- Voz trocada para "Matheus – Energic Young Voice" (`36rVQA1AOIPwpA3Hg1tC`), escolhida pelo usuário; gerada pelo conector da ElevenLabs (1.104 créditos), transcrita para tempos por palavra.
- Corrigidos: árvore na represa, pia/torneira presa na parede (água não flutua), braço atravessando a parede, adutora na frente da câmera, dosadores flutuando, rótulo da bomba, câmera do resumo; mascote com proporção de adolescente, closes da cintura pra cima e presença na represa, bomba, reservatório e hidrômetro.
- MP4: 1080×1920, 30 fps, 1798 frames, 60,0 s; −14,9 LUFS, pico −2,9 dBFS; áudio em todos os segundos. Não verificado por audição.

## v3 (roteiro aprovado em 2026-11-07)
- Narração v3 (314 palavras) na voz Matheus – Energic Young Voice: 1.699 créditos (a conta ficou com ~5 créditos). Transcrição do conector estava ocupada; frases alinhadas pelas pausas do áudio e palavras distribuídas dentro de cada frase. Voz desacelerada 12% (atempo 0,88) com pausas de 0,22 s entre frases → ~180 pal/min (referência medida: 185–200).
- Mascote participa de cada etapa: copo de água suja na represa, aperta o botão da bomba, despeja o coagulante com jarra (banquinho), aponta flocos e camadas, pinga o cloro (banquinho), aponta reservatório e hidrômetro, bebe a água, comemora.
- Entrega v3: 1080×1920, 30 fps, 3036 frames, 101,3 s; −15,1 LUFS, pico −3,3 dBFS; áudio em todos os segundos. Cópia do repositório recomprimida (CRF 21) para caber no limite do GitHub. Não verificado por audição.

## v4 (pedidos do usuário, 2026-11-07)
- Legendas sincronizadas com a transcrição real (ElevenLabs STT via GitHub Actions, chave do repositório).
- Sem sincronia labial: só reações no rosto (curioso, surpreso, enjoado, feliz…).
- Mascote testa a água da represa: bebe, fica verde, mãos na barriga; aviso "DÁ DOR DE BARRIGA, DIARREIA E VÔMITO" (conteúdo novo na tela, coerente com a narração "essa água não dá pra beber").
- Câmera sempre em movimento (órbita contínua, respiração de zoom, leve flutuação).
- Gráficos: sombras suaves, água brilhante com ondinhas, pedras.

## v5 (roteiro no estilo do vídeo de exemplo, aprovado em 2026-11-07)
- Voz Liam (`TX3LPaxmHKxFdv7VOQHJ`) gerada pelo workflow `voz-torneira` com tempos por palavra (372 palavras, 145,6 s de fala); as palavras batem 1:1 com o roteiro.
- Recursos visuais novos: pergunta grande no início; etiquetas brancas com bolinha colorida; termos técnicos em título grande amarelo antes de virarem etiqueta; círculo vermelho desenhado em volta do ponto 3D que importa; ✓/✕ grandes; "imagina beber" com pausa, tela em tom de imaginação e REBOBINAR no "Por isso" (o mascote volta no tempo); cartão DICA (a cada 6 meses); pergunta final "Você já limpou sua caixa d'água? COMENTA AÍ!" com confete.
