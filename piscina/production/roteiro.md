# Vídeo 3 — Como um buraco no quintal de casa vira uma piscina?

**Versão:** v6 ( começo trocado a pedido do usuário (dia quente, espreguiçadeira, buraco que seca no outro dia); demais cenas = v5 aprovado)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** como uma piscina de alvenaria/concreto é construída num quintal comum.
- **Recorte técnico escolhido:** piscina **de concreto armado** com impermeabilização, revestimento de pastilha/azulejo, filtragem (ralo de fundo + skimmer → bomba → filtro de areia → bocais de retorno) e tratamento com cloro + pH. Não entram piscinas de fibra ou vinil (outro sistema), aquecimento, iluminação nem normas específicas.
- **Sistema construído na frente do espectador:** o mesmo quintal em corte (diorama). O buraco vira, etapa por etapa, uma piscina pronta e funcionando.
- **Cadeia de problemas:** água some na terra e o barro desmorona → precisa de base firme → a água pesa 25 toneladas → concreto armado → concreto vaza pelos poros → impermeabilização + teste → acabamento → água parada fica verde → filtragem → filtro não mata micróbios → cloro + pH.
- **Público:** leigos de 18 a 50 anos (Shorts, TikTok, Instagram). **Tom (pedido v4):** como o narrador do vídeo de exemplo: conta cada etapa como novidade e explica o porquê com detalhe ("Só que não é bem assim", "Sabe por que…?", "tem um detalhe que quase ninguém sabe", "repara", "olha que curioso").
- **Duração estimada:** ~164 s (4919 frames). A voz real decide os cortes.
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
| 00:00:00 - 00:03:09 | 0 - 99 (s1) | Dia quente, sol rachando, e você ali derretendo. | Dia muito quente: sol forte, ondas de calor, termômetro alto. O mascote de roupa de banho está deitado numa espreguiçadeira se abanando com um leque, suando, rosto vermelho, reagindo ao calor. | yard, house, wall, grass, mascot (roupa de banho), floaty | camera dolly-in dist 13→8 (f 0–70, easeInOut); mascot.emotion happy | Pergunta grande: COMO UM BURACO VIRA UMA PISCINA? (spring em "vontade") |
| 00:03:09 - 00:11:18 | 99 - 348 (s1) | Do nada, bate a ideia: abrir um buraco no quintal e encher de água. Pronto, você fez uma piscina! Será? | Na "ideia" ele levanta num pulo, cava o buraco com a pá na mão e enche com a mangueira; em "Pronto" comemora; em "Será?" fica desconfiado. | shovel, hole, dirtPile, hose | hole.depth 0→1,0 (f 40–150, linear); dirtPile.scale 0→1; hose.flow 0→1 (f 150–180) | Pergunta continua até "testar" |
| 00:11:18 - 00:22:07 | 348 - 667 (s2) | No outro dia, cadê a água? A terra é cheia de espacinhos, então ela sumiu no chão. E as paredes de barro desmoronaram: virou um lamaçal. | No outro dia (céu passa da noite para o dia) o buraco está seco: a água afundou pela terra (gotas descendo) e o barranco escorrega para dentro. O vizinho engraçado pula do muro direto no lamaçal e fica atolado. | waterInHole, soilDrops, wallCollapse, mud | waterInHole.level sobe e some (f 0–120); soilDrops (seeded); wallCollapse.t 0→1 (f 90–140, easeIn) | Etiquetas ✕ ÁGUA SOME NA TERRA ("some") e ✕ PAREDES DESMORONAM ("desmoronam") |
| 00:22:07 - 00:25:15 | 667 - 765 (s2) | Imagina pular aí dentro. Nem pensar! Volta tudo. | ⏸ em "Imagina" + tela de imaginação; o mascote de roupa de banho pula no lamaçal e sai coberto de lama, enjoado. Em "volta": ⏪ VOLTANDO… com som de fita até o quintal intacto. | mascot (lama), mudSplash, overlay pausa/rebobinar | imagine 0→1; mascot.jump; mascot.muddy 0→1; rewind 26 frames | ✕ grande em "Não"; ⏪ em "volta" |
| 00:25:15 - 00:33:26 | 765 - 1016 (s3) | E aqui começa o jeito certo. Primeiro vem o projeto: define o tamanho, a profundidade e por onde passam os canos. | Desconstrução começa: linhas azuis de projeto riscam o chão (6 × 3 m) e uma régua mostra 1,4 m. Câmera de cima (el 45°). Sem mascote. | blueprintLines, depthRuler | blueprint.draw 0→1 (f 10–90); depthRuler.h 0→1,4 (f 60–110) | Etiqueta i PROJETO; rótulos 6 m / 3 m / 1,4 m |
| 00:33:26 - 00:40:19 | 1016 - 1219 (s3) | Aí a máquina cava, o fundo é socado e recebe uma camada de concreto magro, a base. | Miniescavadeira cava o buraco retangular; compactador bate o fundo; a camada cinza clara de concreto magro cobre o fundo. Câmera desce para o corte (el 12°). | excavator, pit, compactor, leanConcrete | pit.depth 0→1,5 (f 0–110); compactor.bob (sin); leanConcrete.h 0→0,08 | Título amarelo CONCRETO MAGRO em "magro" |
| 00:40:19 - 00:47:12 | 1219 - 1422 (s3) | E se pular essa parte? O chão cede com o peso, o fundo afunda e racha. Volta! | ⏸ "E SE…?" + tela de imaginação: sem base, o fundo afunda de um lado e uma rachadura corre pelo piso (esquemático). Em "Volta": ⏪ até a base pronta. | pitFloor (cede), crackLine, overlay pausa/rebobinar | floor.sink 0→0,15 (f 20–70, easeIn); crack.draw 0→1 (f 50–80); rewind 26 frames | ✕ FUNDO AFUNDA E RACHA em "racha" |
| 00:47:12 - 00:52:28 | 1422 - 1588 (s4) | Sabe por que tanto cuidado? Água pesa demais. Cada metro cúbico tem mil quilos. | Um cubo de água de 1 m³ cai numa balança gigante que marca 1.000 kg. Câmera fecha no cubo. | waterCube, scale | waterCube.scale 0→1 (spring); scale.value 0→1000 (easeOut) | Etiqueta i 1 m³ = 1.000 kg em "mil" |
| 00:52:28 - 01:02:14 | 1588 - 1874 (s4) | Uma piscina de seis por três, com um metro e quarenta de fundo, carrega umas vinte e cinco toneladas empurrando as paredes pra fora. | Câmera abre: 25 cubos enchem o buraco; setas vermelhas empurram paredes e fundo. | waterCubes ×25, pressureArrows | cubes.count 0→25 (f 0–120); arrows.len 0→1 (f 100–160) | Título amarelo ≈ 25 TONELADAS em "toneladas" |
| 01:02:14 - 01:05:07 | 1874 - 1957 (s4) | Se fosse só concreto, a parede trincava. | ⏸ "E SE…?": parede só de concreto, as setas empurram e uma trinca abre; água escorre para a terra. | plainConcreteWall, crack, leak | crack.draw 0→1 (f 10–40); leak (seeded) | Círculo vermelho na trinca (1 de 3); ✕ PAREDE TRINCA em "trinca" |
| 01:05:07 - 01:11:29 | 1957 - 2159 (s4) | Por isso se monta uma gaiola de vergalhões e o concreto envolve tudo: é o concreto armado. | ⏪ em "Por isso". A grade de vergalhões (laranja) se monta sozinha, peça por peça (desconstrução ao contrário); a betoneira cobre com concreto. | rebarCage, concreteMixer, concreteShell | rewind 26 frames; rebar.build 0→1; concrete.fill 0→1 | Etiqueta i VERGALHÕES; título amarelo CONCRETO ARMADO em "armado"; ✓ |
| 01:11:29 - 01:23:15 | 2159 - 2505 (s5) | Mas tem um detalhe que quase ninguém sabe: o concreto é cheio de poros. Sem proteção, a água vaza, a piscina esvazia sozinha e a conta de água dispara. | Lupa sobre a parede mostrando os poros. ⏸ "E SE…?": o nível da água desce sozinho e uma conta de água sobe de valor na tela. | lens (poros), leakDrops, waterLevel, waterBill | lens.scale spring; waterLevel 1→0,6 (f 40–120); bill.value sobe (easeIn) | ✕ VAZAMENTO em "vaza"; ✕ CONTA SOBE em "conta" |
| 01:23:15 - 01:27:15 | 2505 - 2625 (s5) | Por isso entra a impermeabilização, uma camada que veda tudo. | ⏪ em "Aí". Um rolo passa sozinho a camada impermeabilizante em faixas; os poros somem. | roller, waterproofLayer | rewind; waterproof.cover 0→1 (f 10–110) | Título amarelo IMPERMEABILIZAÇÃO |
| 01:27:15 - 01:34:08 | 2625 - 2828 (s5) | Depois enche e espera uns dias pra ver se o nível baixa: é o teste de estanqueidade. | Água enche; marca de nível; dias passando rápido (céu clareia e escurece); o nível fica parado. | testWater, levelMark, sky | testWater.level 0→1; sky.cycle (sin) | Título amarelo TESTE DE ESTANQUEIDADE; ✓ |
| 01:34:08 - 01:42:25 | 2828 - 3085 (s6) | Agora vem a parte bonita, o acabamento: pastilha ou azulejo com argamassa e rejunte, e na borda uma pedra antiderrapante. | Pastilhas azuis entram em onda pelo fundo e paredes; peças de borda claras encaixam em volta. Câmera rente à borda. | tiles, groutLines, borderStones | tiles.reveal 0→1 (onda); border.reveal 0→1 | Etiqueta i ACABAMENTO; ✓ BORDA ANTIDERRAPANTE |
| 01:42:25 - 01:50:00 | 3085 - 3300 (s7) | Pronto, piscina cheia! Mas repara: em poucos dias caem folhas e poeira, e a água parada fica verde. | Piscina cheia e azul; dias passam rápido; folhas caem; a água fica verde. | poolWater, leaves, sky | poolWater.color azul→verde (f 60–200); leaves (seeded) | ✕ ÁGUA PARADA FICA VERDE |
| 01:50:00 - 02:01:05 | 3300 - 3635 (s7) | Aí entra a parte escondida: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia, e ela volta limpinha pelos bocais. | Desconstrução da hidráulica: a terra fica transparente e revela os canos acendendo em sequência (ralo → skimmer → bomba → filtro de areia em corte → bocais); setas de fluxo; a água volta a ficar azul. | mainDrain, skimmer, pipes, pump, sandFilter, returnJets, flowArrows | pipes.lit em sequência por palavra; poolWater.color verde→azul | Títulos amarelos SKIMMER e FILTRO DE AREIA; círculo vermelho no filtro de areia (2 de 3) |
| 02:01:05 - 02:03:29 | 3635 - 3719 (s7) | Tudo isso fica na casa de máquinas. | Câmera vai até a caixa enterrada em corte; a tampa abre sozinha. | machineRoom | machineRoom.lid 0→70° (spring) | Título amarelo CASA DE MÁQUINAS |
| 02:03:29 - 02:11:06 | 3719 - 3936 (s8) | E olha que curioso: o filtro segura a sujeira, mas não mata micróbios. Isso é trabalho do cloro. | Lupa na água com micróbios; gotas de cloro caem e os micróbios estouram. | lens (micróbios), chlorineDrops | microbes.pop 1→0 depois de "cloro" | ✕ em "não"; título amarelo CLORO; ✓ |
| 02:11:06 - 02:20:25 | 3936 - 4225 (s8) | Só que o cloro depende do pH. Imagina nadar com ele fora do ponto: o cloro perde força e a água arde no olho. | Kit de teste de pH com tubos de cor e um ponteiro com faixa verde. ⏸ em "Imagina": o mascote de roupa de banho mergulha, sai com os olhos vermelhos ardendo e esfrega os olhos. | phKit, phGauge, mascot (roupa de banho, olhos vermelhos) | phGauge.needle sai da faixa verde; mascot.emotion sick (olhos ardendo) | Círculo vermelho no kit de pH (3 de 3); ✕ ARDE NO OLHO em "arde" |
| 02:20:25 - 02:22:25 | 4225 - 4285 (s8) | Por isso se mede sempre. | ⏪ em "Por isso": volta ao ponteiro na faixa verde; o kit marca a cor certa. | phGauge | rewind; phGauge.needle → faixa verde | ✓ pH EQUILIBRADO |
| 02:22:25 - 02:24:17 | 4285 - 4337 (s9) | Agora sim: pode pular! | Vista explodida final: as camadas da piscina se separam no ar (terra, concreto magro, ferro, concreto, impermeabilização, pastilha, canos, água) e cada uma acende na sua palavra; depois se juntam de novo. | piscina explodida (camadas) | layers.explode 0→1→0 (atWord por camada) | Etiqueta i BURACO → PISCINA |
| 02:24:17 - 02:29:22 | 4337 - 4492 (s9) | Parabéns, agora você sabe como construir uma piscina, para se divertir no calor! | O mascote de roupa de banho corre e dá um mergulho "bomba"; respingo grande e confete. | mascot (roupa de banho), splash, confetti | mascot.jump arco; splash (spring); confetti (seeded) | AGORA VOCÊ SABE! em "Parabéns" |
| 02:29:22 - 02:43:29 | 4492 - 4919 (s9) | E aí, teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra ver como funciona por dentro tudo o que você usa no dia a dia. | O mascote boia na boia e acena; aponta para quem assiste em "Comenta". | mascot, floaty | mascot.rArm aponta (Comenta), acena (segue) | Pergunta grande VOCÊ TERIA CORAGEM? COMENTA AÍ! com confete; POR DENTRO LAB em "segue" |

Soma: 4919 frames contíguos (0 a 4918).

## 3. Narração integral

**s1.** Dia quente, sol rachando, e você ali derretendo. Do nada, bate a ideia: abrir um buraco no quintal e encher de água. Pronto, você fez uma piscina! Será?

**s2.** No outro dia, cadê a água? A terra é cheia de espacinhos, então ela sumiu no chão. E as paredes de barro desmoronaram: virou um lamaçal. Imagina pular aí dentro. Nem pensar! Volta tudo.

**s3.** E aqui começa o jeito certo. Primeiro vem o projeto: define o tamanho, a profundidade e por onde passam os canos. Aí a máquina cava, o fundo é socado e recebe uma camada de concreto magro, a base. E se pular essa parte? O chão cede com o peso, o fundo afunda e racha. Volta!

**s4.** Sabe por que tanto cuidado? Água pesa demais. Cada metro cúbico tem mil quilos. Uma piscina de seis por três, com um metro e quarenta de fundo, carrega umas vinte e cinco toneladas empurrando as paredes pra fora. Se fosse só concreto, a parede trincava. Por isso se monta uma gaiola de vergalhões e o concreto envolve tudo: é o concreto armado.

**s5.** Mas tem um detalhe que quase ninguém sabe: o concreto é cheio de poros. Sem proteção, a água vaza, a piscina esvazia sozinha e a conta de água dispara. Por isso entra a impermeabilização, uma camada que veda tudo. Depois enche e espera uns dias pra ver se o nível baixa: é o teste de estanqueidade.

**s6.** Agora vem a parte bonita, o acabamento: pastilha ou azulejo com argamassa e rejunte, e na borda uma pedra antiderrapante.

**s7.** Pronto, piscina cheia! Mas repara: em poucos dias caem folhas e poeira, e a água parada fica verde. Aí entra a parte escondida: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia, e ela volta limpinha pelos bocais. Tudo isso fica na casa de máquinas.

**s8.** E olha que curioso: o filtro segura a sujeira, mas não mata micróbios. Isso é trabalho do cloro. Só que o cloro depende do pH. Imagina nadar com ele fora do ponto: o cloro perde força e a água arde no olho. Por isso se mede sempre.

**s9.** Agora sim: pode pular! Parabéns, agora você sabe como construir uma piscina, para se divertir no calor! E aí, teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra ver como funciona por dentro tudo o que você usa no dia a dia.

**Contagem:** 404 palavras → ~154 s de fala + pausas ≈ 164 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, `stability 0.45, similarity 0.8, style 0.4, speed 1.08` (um pouco mais rápida que no vídeo 2 para caber em menos de 3 min)), uma faixa por cena, com tempos por palavra.
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
