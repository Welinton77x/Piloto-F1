# Vídeo 3 — Como um buraco no quintal de casa vira uma piscina?

**Versão:** v2 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** como uma piscina de alvenaria/concreto é construída num quintal comum.
- **Recorte técnico escolhido:** piscina **de concreto armado** com impermeabilização, revestimento de pastilha/azulejo, filtragem (ralo de fundo + skimmer → bomba → filtro de areia → bocais de retorno) e tratamento com cloro + pH. Não entram piscinas de fibra ou vinil (outro sistema), aquecimento, iluminação nem normas específicas.
- **Sistema construído na frente do espectador:** o mesmo quintal em corte (diorama). O buraco vira, etapa por etapa, uma piscina pronta e funcionando.
- **Cadeia de problemas:** água some na terra e o barro desmorona → precisa de base firme → a água pesa 25 toneladas → concreto armado → concreto vaza pelos poros → impermeabilização + teste → acabamento → água parada fica verde → filtragem → filtro não mata micróbios → cloro + pH.
- **Público:** leigos de 18 a 50 anos (Shorts, TikTok, Instagram). **Tom:** calmo, técnico e informal, em segunda pessoa.
- **Duração estimada:** ~152 s (4563 frames). A voz real decide os cortes.
- **Voz:** ElevenLabs, **Liam** (mesma do vídeo 2), gerada pelo workflow do GitHub com tempos por palavra. Legenda uma palavra por vez.
- **Direção de arte:** a mesma do vídeo 2 (3D liso low-poly, céu claro, sombras suaves, câmera sempre em movimento), agora em **desconstrução**: a piscina é montada camada por camada sozinha (máquinas e peças entrando), com terra transparente para ver por dentro e vista explodida no fim.
- **Mascote (pedido v2):** aparece só nos momentos importantes (abertura, pulo no lamaçal, pH errado ardendo o olho, mergulho final), sempre de **roupa de banho de clube aquático**: bermuda de praia estampada, camiseta de lycra, chinelo, óculos de natação na testa e boia; sem o boné.
- **E se fizer errado? (pedido v2):** ⏸ + tela de imaginação mostrando o que acontece, depois ⏪ VOLTANDO… com som de fita: buraco sem nada (lamaçal), sem base (fundo afunda e racha), sem ferro (parede trinca), sem impermeabilização (piscina esvazia e a conta sobe), pH errado (arde no olho).
- **Círculo vermelho (pedido v2):** só em 3 pontos: a trinca da parede, o filtro de areia e o kit de pH.
- **Recursos do vídeo de exemplo** (aprovados no vídeo 2): pergunta grande no início; etiquetas brancas com bolinha colorida; termo técnico em título grande amarelo; ✓/✕ grandes; pergunta final grande com confete.
- **Premissa:** os números são de uma piscina de exemplo (6 × 3 m, 1,4 m de fundo ≈ 25,2 m³ ≈ 25 t de água, porque 1 m³ de água ≈ 1.000 kg). Não são medidas obrigatórias.

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:02:19 | 0 - 79 (s1) | Você quer uma piscina no quintal. | Quintal em corte (diorama), céu claro. O mascote já de roupa de banho (bermuda de praia estampada, camiseta de lycra, chinelo, óculos de natação na testa, boia no braço) olha o gramado. Câmera desce de cima (dist 13→8). | yard, house, wall, grass, mascot (roupa de banho), floaty | camera dolly-in dist 13→8 (f 0–70, easeInOut); mascot.emotion happy | Pergunta grande: COMO UM BURACO VIRA UMA PISCINA? (spring em "quer") |
| 00:02:19 - 00:08:23 | 79 - 263 (s1) | Parece fácil: é só cavar um buraco e encher de água, né? Bora testar. | Sem o mascote cavando: a pá cava sozinha (plano de desconstrução); o corte mostra camadas de terra. Mangueira começa a encher. | shovel, hole, dirtPile, hose | hole.depth 0→1,0 (f 40–150, linear); dirtPile.scale 0→1; hose.flow 0→1 (f 150–180) | Pergunta continua até "testar" |
| 00:08:23 - 00:14:21 | 263 - 441 (s2) | A água some na terra, as paredes de barro desmoronam e vira um lamaçal. | Corte: a água afunda pela terra (gotas descendo) e o barranco escorrega para dentro. Câmera aproxima do corte (dist 8→6). | waterInHole, soilDrops, wallCollapse, mud | waterInHole.level sobe e some (f 0–120); soilDrops (seeded); wallCollapse.t 0→1 (f 90–140, easeIn) | Etiquetas ✕ ÁGUA SOME NA TERRA ("some") e ✕ PAREDES DESMORONAM ("desmoronam") |
| 00:14:21 - 00:21:02 | 441 - 632 (s2) | Imagina pular aí dentro. Não dá! Então volta tudo e vamos fazer do jeito certo. | ⏸ em "Imagina" + tela de imaginação; o mascote de roupa de banho pula no lamaçal e sai coberto de lama, enjoado. Em "volta": ⏪ VOLTANDO… com som de fita até o quintal intacto. | mascot (lama), mudSplash, overlay pausa/rebobinar | imagine 0→1; mascot.jump; mascot.muddy 0→1; rewind 26 frames | ✕ grande em "Não"; ⏪ em "volta" |
| 00:21:02 - 00:26:01 | 632 - 781 (s3) | Primeiro vem o projeto: tamanho, profundidade e por onde passam os canos. | Desconstrução começa: linhas azuis de projeto riscam o chão (6 × 3 m) e uma régua mostra 1,4 m. Câmera de cima (el 45°). Sem mascote. | blueprintLines, depthRuler | blueprint.draw 0→1 (f 10–90); depthRuler.h 0→1,4 (f 60–110) | Etiqueta i PROJETO; rótulos 6 m / 3 m / 1,4 m |
| 00:26:01 - 00:31:24 | 781 - 954 (s3) | A máquina cava, o fundo é compactado e recebe uma camada de concreto magro. | Miniescavadeira cava o buraco retangular; compactador bate o fundo; a camada cinza clara de concreto magro cobre o fundo. Câmera desce para o corte (el 12°). | excavator, pit, compactor, leanConcrete | pit.depth 0→1,5 (f 0–110); compactor.bob (sin); leanConcrete.h 0→0,08 | Título amarelo CONCRETO MAGRO em "magro" |
| 00:31:24 - 00:38:25 | 954 - 1165 (s3) | E se pular essa parte? O chão cede com o peso, o fundo afunda e racha. Volta! | ⏸ "E SE…?" + tela de imaginação: sem base, o fundo afunda de um lado e uma rachadura corre pelo piso (esquemático). Em "Volta": ⏪ até a base pronta. | pitFloor (cede), crackLine, overlay pausa/rebobinar | floor.sink 0→0,15 (f 20–70, easeIn); crack.draw 0→1 (f 50–80); rewind 26 frames | ✕ FUNDO AFUNDA E RACHA em "racha" |
| 00:38:25 - 00:43:09 | 1165 - 1299 (s4) | Isso porque água pesa muito: cada metro cúbico tem mil quilos. | Um cubo de água de 1 m³ cai numa balança gigante que marca 1.000 kg. Câmera fecha no cubo. | waterCube, scale | waterCube.scale 0→1 (spring); scale.value 0→1000 (easeOut) | Etiqueta i 1 m³ = 1.000 kg em "mil" |
| 00:43:09 - 00:53:26 | 1299 - 1616 (s4) | Uma piscina de seis por três metros, com um metro e quarenta de fundo, guarda umas vinte e cinco toneladas empurrando o fundo e as paredes. | Câmera abre: 25 cubos enchem o buraco; setas vermelhas empurram paredes e fundo. | waterCubes ×25, pressureArrows | cubes.count 0→25 (f 0–120); arrows.len 0→1 (f 100–160) | Título amarelo ≈ 25 TONELADAS em "toneladas" |
| 00:53:26 - 00:57:28 | 1616 - 1738 (s4) | Sem ferro, o concreto não aguenta e a parede trinca. | ⏸ "E SE…?": parede só de concreto, as setas empurram e uma trinca abre; água escorre para a terra. | plainConcreteWall, crack, leak | crack.draw 0→1 (f 10–40); leak (seeded) | Círculo vermelho na trinca (1 de 3); ✕ PAREDE TRINCA em "trinca" |
| 00:57:28 - 01:04:25 | 1738 - 1945 (s4) | Por isso se monta uma gaiola de vergalhões e enche de concreto. Isso é o concreto armado. | ⏪ em "Por isso". A grade de vergalhões (laranja) se monta sozinha, peça por peça (desconstrução ao contrário); a betoneira cobre com concreto. | rebarCage, concreteMixer, concreteShell | rewind 26 frames; rebar.build 0→1; concrete.fill 0→1 | Etiqueta i VERGALHÕES; título amarelo CONCRETO ARMADO em "armado"; ✓ |
| 01:04:25 - 01:13:27 | 1945 - 2217 (s5) | Mas o concreto tem poros minúsculos. Sem proteção, a água vaza devagar, a piscina esvazia sozinha e a conta de água sobe. | Lupa sobre a parede mostrando os poros. ⏸ "E SE…?": o nível da água desce sozinho e uma conta de água sobe de valor na tela. | lens (poros), leakDrops, waterLevel, waterBill | lens.scale spring; waterLevel 1→0,6 (f 40–120); bill.value sobe (easeIn) | ✕ VAZAMENTO em "vaza"; ✕ CONTA SOBE em "conta" |
| 01:13:27 - 01:17:18 | 2217 - 2328 (s5) | Aí entra a impermeabilização: uma camada que veda tudo. | ⏪ em "Aí". Um rolo passa sozinho a camada impermeabilizante em faixas; os poros somem. | roller, waterproofLayer | rewind; waterproof.cover 0→1 (f 10–110) | Título amarelo IMPERMEABILIZAÇÃO |
| 01:17:18 - 01:23:24 | 2328 - 2514 (s5) | Depois enche de água e confere se o nível baixa. É o teste de estanqueidade. | Água enche; marca de nível; dias passando rápido (céu clareia e escurece); o nível fica parado. | testWater, levelMark, sky | testWater.level 0→1; sky.cycle (sin) | Título amarelo TESTE DE ESTANQUEIDADE; ✓ |
| 01:23:24 - 01:31:00 | 2514 - 2730 (s6) | Agora o acabamento: pastilha ou azulejo com argamassa e rejunte, e na borda uma pedra antiderrapante. | Pastilhas azuis entram em onda pelo fundo e paredes; peças de borda claras encaixam em volta. Câmera rente à borda. | tiles, groutLines, borderStones | tiles.reveal 0→1 (onda); border.reveal 0→1 | Etiqueta i ACABAMENTO; ✓ BORDA ANTIDERRAPANTE |
| 01:31:00 - 01:38:11 | 2730 - 2951 (s7) | Pronto, cheia de água. Mas em poucos dias caem folhas e poeira, e a água parada fica verde. | Piscina cheia e azul; dias passam rápido; folhas caem; a água fica verde. | poolWater, leaves, sky | poolWater.color azul→verde (f 60–200); leaves (seeded) | ✕ ÁGUA PARADA FICA VERDE |
| 01:38:11 - 01:49:25 | 2951 - 3295 (s7) | Por isso tem canos escondidos: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia e ela volta limpa pelos bocais. | Desconstrução da hidráulica: a terra fica transparente e revela os canos acendendo em sequência (ralo → skimmer → bomba → filtro de areia em corte → bocais); setas de fluxo; a água volta a ficar azul. | mainDrain, skimmer, pipes, pump, sandFilter, returnJets, flowArrows | pipes.lit em sequência por palavra; poolWater.color verde→azul | Títulos amarelos SKIMMER e FILTRO DE AREIA; círculo vermelho no filtro de areia (2 de 3) |
| 01:49:25 - 01:52:21 | 3295 - 3381 (s7) | Tudo isso fica na casa de máquinas. | Câmera vai até a caixa enterrada em corte; a tampa abre sozinha. | machineRoom | machineRoom.lid 0→70° (spring) | Título amarelo CASA DE MÁQUINAS |
| 01:52:21 - 01:58:27 | 3381 - 3567 (s8) | Só que o filtro segura a sujeira, mas não mata micróbios. Aí entra o cloro. | Lupa na água com micróbios; gotas de cloro caem e os micróbios estouram. | lens (micróbios), chlorineDrops | microbes.pop 1→0 depois de "cloro" | ✕ em "não"; título amarelo CLORO; ✓ |
| 01:58:27 - 02:08:12 | 3567 - 3852 (s8) | E o pH precisa ficar equilibrado. Imagina nadar com ele fora do ponto: o cloro perde força e a água arde no olho. | Kit de teste de pH com tubos de cor e um ponteiro com faixa verde. ⏸ em "Imagina": o mascote de roupa de banho mergulha, sai com os olhos vermelhos ardendo e esfrega os olhos. | phKit, phGauge, mascot (roupa de banho, olhos vermelhos) | phGauge.needle sai da faixa verde; mascot.emotion sick (olhos ardendo) | Círculo vermelho no kit de pH (3 de 3); ✕ ARDE NO OLHO em "arde" |
| 02:08:12 - 02:10:14 | 3852 - 3914 (s8) | Por isso se mede sempre. | ⏪ em "Por isso": volta ao ponteiro na faixa verde; o kit marca a cor certa. | phGauge | rewind; phGauge.needle → faixa verde | ✓ pH EQUILIBRADO |
| 02:10:14 - 02:14:26 | 3914 - 4046 (s9) | Resumindo: projeto, base, concreto armado, impermeabilização, acabamento, filtro e cloro. | Vista explodida final: as camadas da piscina se separam no ar (terra, concreto magro, ferro, concreto, impermeabilização, pastilha, canos, água) e cada uma acende na sua palavra; depois se juntam de novo. | piscina explodida (camadas) | layers.explode 0→1→0 (atWord por camada) | Etiqueta i BURACO → PISCINA |
| 02:14:26 - 02:21:28 | 4046 - 4258 (s9) | Agora sim: pode pular! Parabéns, agora você sabe como um buraco no quintal vira uma piscina! | O mascote de roupa de banho corre e dá um mergulho "bomba"; respingo grande e confete. | mascot (roupa de banho), splash, confetti | mascot.jump arco; splash (spring); confetti (seeded) | AGORA VOCÊ SABE! em "Parabéns" |
| 02:21:28 - 02:32:03 | 4258 - 4563 (s9) | Você teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra descobrir mais coisas por dentro. | O mascote boia na boia e acena; aponta para quem assiste em "Comenta". | mascot, floaty | mascot.rArm aponta (Comenta), acena (segue) | Pergunta grande VOCÊ TERIA CORAGEM? COMENTA AÍ! com confete; POR DENTRO LAB em "segue" |

Soma: 4563 frames contíguos (0 a 4562).

## 3. Narração integral

**s1.** Você quer uma piscina no quintal. Parece fácil: é só cavar um buraco e encher de água, né? Bora testar.

**s2.** A água some na terra, as paredes de barro desmoronam e vira um lamaçal. Imagina pular aí dentro. Não dá! Então volta tudo e vamos fazer do jeito certo.

**s3.** Primeiro vem o projeto: tamanho, profundidade e por onde passam os canos. A máquina cava, o fundo é compactado e recebe uma camada de concreto magro. E se pular essa parte? O chão cede com o peso, o fundo afunda e racha. Volta!

**s4.** Isso porque água pesa muito: cada metro cúbico tem mil quilos. Uma piscina de seis por três metros, com um metro e quarenta de fundo, guarda umas vinte e cinco toneladas empurrando o fundo e as paredes. Sem ferro, o concreto não aguenta e a parede trinca. Por isso se monta uma gaiola de vergalhões e enche de concreto. Isso é o concreto armado.

**s5.** Mas o concreto tem poros minúsculos. Sem proteção, a água vaza devagar, a piscina esvazia sozinha e a conta de água sobe. Aí entra a impermeabilização: uma camada que veda tudo. Depois enche de água e confere se o nível baixa. É o teste de estanqueidade.

**s6.** Agora o acabamento: pastilha ou azulejo com argamassa e rejunte, e na borda uma pedra antiderrapante.

**s7.** Pronto, cheia de água. Mas em poucos dias caem folhas e poeira, e a água parada fica verde. Por isso tem canos escondidos: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia e ela volta limpa pelos bocais. Tudo isso fica na casa de máquinas.

**s8.** Só que o filtro segura a sujeira, mas não mata micróbios. Aí entra o cloro. E o pH precisa ficar equilibrado. Imagina nadar com ele fora do ponto: o cloro perde força e a água arde no olho. Por isso se mede sempre.

**s9.** Resumindo: projeto, base, concreto armado, impermeabilização, acabamento, filtro e cloro. Agora sim: pode pular! Parabéns, agora você sabe como um buraco no quintal vira uma piscina! Você teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra descobrir mais coisas por dentro.

**Contagem:** 363 palavras → ~142 s de fala + pausas ≈ 152 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, `stability 0.45, similarity 0.8, style 0.4, speed 1.05`), uma faixa por cena, com tempos por palavra.
- Efeitos sintetizados: pá cavando, mangueira, barro caindo, ⏸ clique, ⏪ fita rebobinando, motor da escavadeira, betoneira, rolo, pastilhas (tec-tec), folhas, bomba ligando, borbulhas do retorno, gotas do cloro, mergulho "bomba" + respingo, confete/pop.
- Trilha leve sem direitos, abaixando sob a voz. Loudness final −15 LUFS, pico ≤ −2,5 dBTP.

## 5. Estrutura de dados
`scene-plan.ts` (nesta pasta) traz tipos e todas as cenas: narração, câmera, objetos, animações, selos com palavra-âncora e sons. Linha do tempo determinística (derivada do frame; aleatório só com `random(seed)`).

## 6. Rigor do conteúdo e fontes
- 1 m³ de água ≈ 1.000 kg (densidade da água ≈ 1 g/cm³) → 6 × 3 × 1,4 = 25,2 m³ ≈ 25 t.
- Etapas (projeto, escavação, base, concreto armado, impermeabilização, teste de estanqueidade, revestimento, filtragem, tratamento) são o caminho comum de piscinas de concreto/alvenaria; materiais e espessuras variam por projeto e não são citados.
- pH: dito de forma geral ("equilibrado"). Fora da faixa, o cloro perde eficácia ou a água irrita olhos e pele. Nenhum número citado.
- Nenhuma norma ou exigência legal citada. Fontes não consultadas nesta sessão: a formulação é geral de propósito.

## 7. Critérios de aceite
Gancho imediato com teste que falha; explicação antes de cada termo; mesmo quintal do começo ao fim; mascote participando de todas as etapas; piscina pronta funcionando no fim; leitura no celular; tabela contígua; narração compatível com a duração.
