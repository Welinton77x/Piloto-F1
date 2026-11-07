# Vídeo 3 — Como um buraco no quintal de casa vira uma piscina?

**Versão:** v1 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** como uma piscina de alvenaria/concreto é construída num quintal comum.
- **Recorte técnico escolhido:** piscina **de concreto armado** com impermeabilização, revestimento de pastilha/azulejo, filtragem (ralo de fundo + skimmer → bomba → filtro de areia → bocais de retorno) e tratamento com cloro + pH. Não entram piscinas de fibra ou vinil (outro sistema), aquecimento, iluminação nem normas específicas.
- **Sistema construído na frente do espectador:** o mesmo quintal em corte (diorama). O buraco vira, etapa por etapa, uma piscina pronta e funcionando.
- **Cadeia de problemas:** água some na terra e o barro desmorona → precisa de base firme → a água pesa 25 toneladas → concreto armado → concreto vaza pelos poros → impermeabilização + teste → acabamento → água parada fica verde → filtragem → filtro não mata micróbios → cloro + pH.
- **Público:** leigos de 18 a 50 anos (Shorts, TikTok, Instagram). **Tom:** calmo, técnico e informal, em segunda pessoa.
- **Duração estimada:** ~142 s (4270 frames). A voz real decide os cortes.
- **Voz:** ElevenLabs, **Liam** (mesma do vídeo 2), gerada pelo workflow do GitHub com tempos por palavra. Legenda uma palavra por vez.
- **Direção de arte:** a mesma do vídeo 2: 3D liso low-poly, céu claro, sombras suaves, mascote adolescente de boné azul participando de tudo, câmera sempre em movimento.
- **Recursos do vídeo de exemplo** (aprovados no vídeo 2): pergunta grande no início; etiquetas brancas com bolinha colorida; termo técnico em título grande amarelo; círculo vermelho na cena 3D (atrás do mascote); ✓/✕ grandes; pausa + imaginação + REBOBINAR com som de fita; pergunta final grande com confete.
- **Premissa:** os números são de uma piscina de exemplo (6 × 3 m, 1,4 m de fundo ≈ 25,2 m³ ≈ 25 t de água, porque 1 m³ de água ≈ 1.000 kg). Não são medidas obrigatórias.

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:02:19 | 0 - 79 (s1) | Você quer uma piscina no quintal. | Quintal em diorama com corte frontal: grama, casa à esquerda, muro ao fundo, céu claro. Câmera abre alta (az 20°, el 22°, dist 13) e desce até o mascote no meio do gramado. | yard, house, wall, grass, mascot, sun | camera dolly-in dist 13→8 (f 0–70, easeInOut); mascot.emotion happy; mascot.lookAt yard (f 20) | Pergunta grande no topo em "quer": COMO UM BURACO VIRA UMA PISCINA? (spring f 8–20) |
| 00:02:19 - 00:08:23 | 79 - 263 (s1) | Parece fácil: é só cavar um buraco e encher de água, né? Bora testar. | Mascote pega a pá (prop shovel) e cava; corte mostra as camadas de terra. Câmera orbita 12° para a direita, mantendo o buraco entre a pergunta e a legenda. | shovel, hole (terra), dirtPile, hose | hole.depth 0→1,0 u3d (f local 40–150, linear); dirtPile.scale 0→1 (40–150, easeOut); mascot.rArm cavar (sin) | Pergunta continua até "testar"; ícone ✓? amarelo em "fácil" |
| 00:08:23 - 00:16:13 | 263 - 493 (s2) | Olha o que acontece. A água some na terra, as paredes de barro desmoronam e vira um lamaçal. | Mascote abre a mangueira no buraco. Corte mostra a água afundando na terra (gotas descendo pelo solo) e as paredes de barro escorregando. Câmera aproxima (dist 8→6) do corte. | hose, waterInHole, soilDrops, wallCollapse, mud | waterInHole.level 0→0,6→0,15 (sobe e some, f 20–160); soilDrops.y 0→−2 (seeded); wallCollapse.t 0→1 (f 120–170, easeIn); mud.color água→marrom | Selo ✕ ÁGUA SOME NA TERRA em "some"; ✕ PAREDES DESMORONAM em "desmoronam"; círculo vermelho no barranco caindo |
| 00:16:13 - 00:20:20 | 493 - 620 (s2) | Agora imagina pular aí dentro. Não dá! Então volta tudo. | "imagina": pausa (⏸) e tela em tom de imaginação; mascote pula no lamaçal e sai sujo de lama. Em "volta": REBOBINAR (⏪, VOLTANDO…, som de fita) até o quintal intacto. | mascot (sujo de lama), mudSplash, rewind overlay | imagine 0→1 (f imagina−8 → +2); mascot.jump (f +10–40); mascot.muddy 0→1; rewind: cena volta ao frame do início de s2 em 26 frames | ✕ grande em "Não"; ⏸ em "imagina"; ⏪ VOLTANDO… em "volta" |
| 00:20:20 - 00:25:21 | 620 - 771 (s3) | Primeiro vem o projeto: tamanho, profundidade e por onde passam os canos. | Quintal limpo de novo. Linhas azuis de projeto aparecem no chão (retângulo 6 × 3 m) e uma régua de profundidade. Mascote segura uma prancheta. Câmera de cima (el 45°). | blueprintLines, depthRuler, clipboard, mascot | blueprint.draw 0→1 (f 10–90, linear); depthRuler.h 0→1,4 (f 60–110, easeOut) | Selo i PROJETO em "projeto"; rótulos 6 m / 3 m / 1,4 m ancorados nas linhas |
| 00:25:21 - 00:34:27 | 771 - 1047 (s3) | Aí a máquina cava, o fundo é nivelado e compactado, e recebe uma camada de concreto magro pra ter uma base firme. | Miniescavadeira entra, cava o buraco retangular; mascote passa o compactador (sapo) no fundo e despeja o concreto magro cinza claro. Câmera desce para o corte lateral (el 12°). | excavator, pit (6×3×1,5), compactor, leanConcrete, dirtTruckPile | pit.depth 0→1,5 (f 0–150, easeInOut); excavator.arm (sin); compactor.bob (sin, f 160–230); leanConcrete.h 0→0,08 (f 240–300) | Título amarelo CONCRETO MAGRO em "magro"; círculo vermelho no fundo compactado em "compactado" |
| 00:34:27 - 00:40:18 | 1047 - 1218 (s4) | Só que tem um problema: água pesa muito. Cada metro cúbico tem mil quilos. | Um cubo de água 1 × 1 × 1 m aparece ao lado do mascote; uma balança mostra 1.000 kg; o mascote tenta levantar e não consegue. Câmera fecha no cubo. | waterCube, scale (balança), mascot | waterCube.scale 0→1 (spring); scale.value 0→1000 (f 40–90, easeOut); mascot.strain (shiver 0,4) | Selo i 1 m³ = 1.000 kg em "mil" |
| 00:40:18 - 00:51:06 | 1218 - 1536 (s4) | Uma piscina de seis por três metros, com um metro e quarenta de fundo, guarda umas vinte e cinco toneladas, empurrando o fundo e as paredes. | Câmera abre: 25 cubos enchem o buraco; setas vermelhas empurram paredes e fundo para fora; as paredes de terra se deformam (esquemático). | waterCubes ×25, pressureArrows, pit | cubes.count 0→25 (f 0–120, linear); arrows.len 0→1 (f 100–160, easeOut); wall.bulge 0→0,1 (f 140–200, sin) | Título amarelo ≈ 25 TONELADAS em "toneladas"; selo ✕ ÁGUA EMPURRA em "empurrando" |
| 00:51:06 - 00:58:29 | 1536 - 1769 (s4) | Por isso se monta uma gaiola de ferro, os vergalhões, e enche de concreto. Isso é o concreto armado. | Mascote amarra vergalhões (grade laranja) no fundo e nas paredes; caminhão-betoneira despeja concreto que cobre a grade. Câmera orbita 15°. | rebarCage, concreteMixer, concreteShell, mascot (alicate) | rebar.build 0→1 (f 0–110, linear); concrete.fill 0→1 (f 120–220, easeInOut); arrows somem | Selo i VERGALHÕES em "vergalhões"; título amarelo CONCRETO ARMADO em "armado"; ✓ grande em "armado"+20 |
| 00:58:29 - 01:06:13 | 1769 - 1993 (s5) | Mas o concreto tem poros minúsculos e pode ganhar trincas. A água vai vazando devagar, sem ninguém ver. | Lupa (como a dos micróbios) sobre a parede de concreto mostrando poros e uma trinca; gotas escapando para a terra. Câmera aproxima da parede. | concreteShell, lens (poros/trinca), leakDrops | lens.scale spring em "poros"; leakDrops.y (seeded); crack.draw 0→1 (f 60–100) | Círculo vermelho na trinca em "trincas"; selo ✕ VAZAMENTO em "vazando" |
| 01:06:13 - 01:10:05 | 1993 - 2105 (s5) | Aí entra a impermeabilização: uma camada que veda tudo. | Mascote passa o rolo com a camada impermeabilizante (cinza-azulada) em faixas pelo fundo e paredes; as gotas param. | roller, waterproofLayer, mascot | waterproof.cover 0→1 (f 0–110, linear); leakDrops.opacity 1→0 | Título amarelo IMPERMEABILIZAÇÃO em "impermeabilização" |
| 01:10:05 - 01:16:11 | 2105 - 2291 (s5) | Depois enche de água e confere se o nível baixa. É o teste de estanqueidade. | Água enche a casca; marcador de nível na parede; relógio acelera (dias passando, céu clareia/escurece rápido); o nível não muda; mascote confere com a régua. | testWater, levelMark, fastClock | testWater.level 0→1 (f 0–60); sky.cycle (f 60–150, sin); levelMark fixo | Título amarelo TESTE DE ESTANQUEIDADE em "estanqueidade"; ✓ em "nível"+40 |
| 01:16:11 - 01:23:11 | 2291 - 2501 (s6) | Agora vem o acabamento: azulejo ou pastilha colados com argamassa e rejunte, que protegem a impermeabilização. | Água do teste sai. Mascote assenta pastilhas azuis em fileiras (efeito de onda) pelo fundo e paredes. Câmera passeia rente à borda. | tiles (instanced), groutLines, mascot (desempenadeira) | tiles.reveal 0→1 (f 0–200, linear, onda da esquerda para a direita) | Selo i REVESTIMENTO em "acabamento"; rótulos AZULEJO, REJUNTE ancorados |
| 01:23:11 - 01:25:16 | 2501 - 2566 (s6) | Na borda, uma pedra antiderrapante. | Peças de borda claras entram uma a uma em volta; o mascote testa pisando com o pé molhado e não escorrega. | borderStones, mascot | border.reveal 0→1 (f 0–60, easeOut); mascot.step | ✓ em "antiderrapante"; círculo vermelho na borda |
| 01:25:16 - 01:33:09 | 2566 - 2799 (s7) | Pronto, cheia de água. Mas em poucos dias caem folhas, insetos e poeira, e a água parada fica verde. | Piscina cheia e azul. Relógio acelera; folhas e insetos caem; a água muda de azul para verde; mascote tapa o nariz (expressão enjoada). | poolWater, leaves, bugs, sky | poolWater.color azul→verde (f 60–200, linear); leaves.fall (seeded); mascot.emotion surprised→sick | Selo ✕ ÁGUA PARADA FICA VERDE em "verde" |
| 01:33:09 - 01:45:17 | 2799 - 3167 (s7) | Por isso a piscina tem canos escondidos: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia, e ela volta limpa pelos bocais. | Corte revela os canos: ralo de fundo, skimmer na parede, tubulação até a casa de máquinas (bomba + filtro de areia em corte), retorno pelos bocais. Setas mostram o caminho; a água volta de verde para azul. | mainDrain, skimmer, pipes, pump, sandFilter (corte com areia), returnJets, flowArrows | pipes.lit em sequência (ralo f 30, skimmer f 60, bomba f 110, filtro f 150, retorno f 200); flowArrows (sin); poolWater.color verde→azul (f 200–300) | Títulos amarelos SKIMMER e FILTRO DE AREIA nas palavras; círculos vermelhos no ralo, no skimmer e no filtro |
| 01:45:17 - 01:48:01 | 3167 - 3241 (s7) | Tudo fica na casa de máquinas. | Câmera vai até a caixa enterrada ao lado da piscina, em corte; mascote abre a tampa e aponta para a bomba. | machineRoom (caixa enterrada), pump, sandFilter | machineRoom.lid 0→70° (spring); camera target → casa de máquinas | Título amarelo CASA DE MÁQUINAS em "máquinas" |
| 01:48:01 - 01:54:09 | 3241 - 3429 (s8) | Só que o filtro segura a sujeira, mas não mata micróbios. Aí entra o cloro. | Lupa na água com micróbios passando pelo filtro; mascote despeja cloro (frasco) na borda; micróbios estouram. | lens (micróbios), chlorineBottle, microbes | microbes.pop 1→0 (f após "cloro" +10 → +60); bottle.tilt 0→75° (spring) | ✕ em "não"; título amarelo CLORO em "cloro"; ✓ em "cloro"+30 |
| 01:54:09 - 02:02:20 | 3429 - 3680 (s8) | E o pH precisa ficar equilibrado: se sair do ponto, o cloro perde força ou a água arde no olho. | Mascote pinga gotas no kit de teste: tubos de cor (amarelo → vermelho). Mostra um ponteiro de pH com faixa verde; ao sair da faixa, o mascote coça os olhos (vermelhos). | phKit (tubos), phGauge, mascot | phKit.color (f 0–60); phGauge.needle verde→fora (f 90–150); mascot.emotion worried (olhos ardendo) | Selo i pH EQUILIBRADO em "equilibrado"; círculo vermelho no kit de teste |
| 02:02:20 - 02:06:21 | 3680 - 3801 (s9) | Resumindo: buraco, concreto armado, impermeabilização, azulejo, filtro e cloro. | Plano geral do corte com a piscina pronta; cada parte acende em sequência junto da palavra (buraco, casca de concreto, camada impermeável, pastilhas, filtro, frasco de cloro). | piscina completa, highlights por parte | part.glow por palavra (atWord); câmera orbita 20° devagar | Selo i BURACO → PISCINA até "Parabéns" |
| 02:06:21 - 02:12:02 | 3801 - 3962 (s9) | Parabéns, agora você sabe como um buraco no quintal vira uma piscina! | Mascote corre e dá um mergulho "bomba" na piscina; respingo grande; confete. | mascot (mergulho), splash, confetti | mascot.jump arco (f 0–40); splash.scale (spring); confetti (seeded) | AGORA VOCÊ SABE! em "agora" |
| 02:12:02 - 02:22:10 | 3962 - 4270 (s9) | Você teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra descobrir mais coisas por dentro. | Close no mascote boiando de boia, acenando; aponta para quem assiste em "Comenta"; marca POR DENTRO LAB em "segue". | mascot (boia), floaty | mascot.rArm aponta (Comenta), acena (segue) | Pergunta grande VOCÊ TERIA CORAGEM DE FAZER UMA? COMENTA AÍ! com confete; POR DENTRO LAB em "segue" |

Soma: 4270 frames contíguos (0 a 4269).

## 3. Narração integral

**s1.** Você quer uma piscina no quintal. Parece fácil: é só cavar um buraco e encher de água, né? Bora testar.

**s2.** Olha o que acontece. A água some na terra, as paredes de barro desmoronam e vira um lamaçal. Agora imagina pular aí dentro. Não dá! Então volta tudo.

**s3.** Primeiro vem o projeto: tamanho, profundidade e por onde passam os canos. Aí a máquina cava, o fundo é nivelado e compactado, e recebe uma camada de concreto magro pra ter uma base firme.

**s4.** Só que tem um problema: água pesa muito. Cada metro cúbico tem mil quilos. Uma piscina de seis por três metros, com um metro e quarenta de fundo, guarda umas vinte e cinco toneladas, empurrando o fundo e as paredes. Por isso se monta uma gaiola de ferro, os vergalhões, e enche de concreto. Isso é o concreto armado.

**s5.** Mas o concreto tem poros minúsculos e pode ganhar trincas. A água vai vazando devagar, sem ninguém ver. Aí entra a impermeabilização: uma camada que veda tudo. Depois enche de água e confere se o nível baixa. É o teste de estanqueidade.

**s6.** Agora vem o acabamento: azulejo ou pastilha colados com argamassa e rejunte, que protegem a impermeabilização. Na borda, uma pedra antiderrapante.

**s7.** Pronto, cheia de água. Mas em poucos dias caem folhas, insetos e poeira, e a água parada fica verde. Por isso a piscina tem canos escondidos: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia, e ela volta limpa pelos bocais. Tudo fica na casa de máquinas.

**s8.** Só que o filtro segura a sujeira, mas não mata micróbios. Aí entra o cloro. E o pH precisa ficar equilibrado: se sair do ponto, o cloro perde força ou a água arde no olho.

**s9.** Resumindo: buraco, concreto armado, impermeabilização, azulejo, filtro e cloro. Parabéns, agora você sabe como um buraco no quintal vira uma piscina! Você teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra descobrir mais coisas por dentro.

**Contagem:** 338 palavras → ~133 s de fala + pausas ≈ 142 s.

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
