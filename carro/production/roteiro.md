# Vídeo 4 — Você construiu um carro do zero

**Versão:** v2 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** como funciona um carro, construído do zero na frente do espectador, no formato do vídeo de referência da bicicleta (cada problema pede a próxima peça).
- **Referência analisada:** vídeo "Você construiu uma bicicleta do zero" (2:26) que o usuário enviou: quadros a cada 2 s e transcrição completa da fala. Estrutura observada: desejo → gambiarra que falha → "Então você…" → nome da peça ("Esse é o…") → novo problema; o personagem testa e se dá mal (EITA!, cai); etiquetas brancas com bolinha colorida; nome da peça em amarelo grudado nela; cartão histórico; velocímetro; linhas de velocidade; final "Parabéns, você construiu…" + "Comente X se você não sabia dessa". Mantemos a estrutura com texto, personagem e cenário próprios.
- **Sistema construído:** uma carroça de madeira vira, peça por peça, um carro: motor (pistão + virabrequim) → 4 cilindros → radiador → embreagem → câmbio → diferencial → direção → suspensão → pneus → freio → faróis, limpador e cinto.
- **Público:** leigos de 18 a 50 anos. **Tom:** como o narrador da referência e o do vídeo 3: contando como novidade, explicando o porquê.
- **Duração estimada:** ~166 s (4992 frames). A voz real decide os cortes.
- **Voz:** ElevenLabs, **Liam** (speed 1,08), gerada pelo workflow do GitHub com tempos por palavra. Legenda uma palavra por vez.
- **Cenário:** rua de cidade low-poly (prédios coloridos, calçada, árvores, faixa de pedestre, semáforo), no estilo liso e claro do canal; a câmera acompanha o carro e entra em close nas peças em corte.
- **Mascote:** o do canal (boné e camisa azuis), dirigindo e testando cada etapa, com reações e balões (UFA!, BUM!, EITA!, AI!, SOCORRO!). Sem sincronia labial; câmera sempre em movimento.
- **Pausar e rebobinar (pedido do usuário):** em cada falha principal a cena congela com o **botão ⏸ grande no meio da tela**; no "Então você…" vem o **⏪ (duas setas) grande no meio da tela**, com "VOLTANDO…", som de fita e a cena voltando no tempo até antes do erro; aí entra a peça nova. Momentos: carro tremendo (s3), motor fumaçando e travando (s4), carro passando o semáforo vermelho (s5), carro quase tombando na curva (s7) e carro sem freio indo nas caixas (s9). A narração não muda.
- **Sem círculos vermelhos** (pedido do usuário no vídeo 3). Destaques: etiquetas com bolinha, nomes em amarelo, ✓/✕, termômetro do motor, velocímetro, cartão histórico de 1886.

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:10:20 | 0 - 320 (s1) | Você quer viajar com a família e as malas sem se cansar. Pega uma carroça de madeira, tira o cavalo, e quem empurra agora é você. | Rua de cidade low-poly (prédios coloridos, árvores, faixa de pedestre). Mascote (boné e camisa azuis) olha uma carroça de madeira com 4 rodas, cheia de malas; depois empurra. Câmera baixa acompanhando de lado. | street, buildings, trees, woodenCart, suitcases, mascot | cart.x 0→2 (f 60–150, easeIn); mascot.walking true; camera trucking lateral | Pergunta grande: VOCÊ CONSTRUIU UM CARRO DO ZERO? em "viajar" |
| 00:10:20 - 00:13:04 | 320 - 394 (s1) | Cinco minutos depois, acabou o fôlego. | Mascote para, mãos nos joelhos, suando; a carroça desce um pouquinho para trás. | mascot (suor), woodenCart | mascot.emotion sick; mascot.shiver 0.4; cart.x 2→1.8 | Balão UFA!; etiqueta ✕ CANSA |
| 00:13:04 - 00:26:09 | 394 - 789 (s2) | Então você precisa de uma força que não cansa. Você mistura gasolina com ar num cilindro, aperta e solta uma faísca. Ela explode e empurra uma peça pra baixo. Esse é o pistão. | Close: cilindro em corte transparente; gotinhas de gasolina + ar entram, pistão sobe comprimindo, faísca da vela, clarão laranja, pistão desce. Câmera gira em volta do cilindro. | cylinder (corte), piston, sparkPlug, fuelMist, flash | piston.y sobe/desce (sin) ; spark flash 0→1→0 em "faísca"; flash laranja em "explode" | Etiqueta i GASOLINA + AR; balão BUM!; título amarelo PISTÃO em "pistão" |
| 00:26:09 - 00:34:20 | 789 - 1040 (s2) | Uma barra torta transforma esse sobe e desce em giro. Esse é o virabrequim. E o conjunto todo é o motor. | O pistão liga numa biela que gira um eixo em zigue-zague; câmera abre e o motor monta na carroça; o mascote sobe e a carroça anda sozinha. | connectingRod, crankshaft, engineBlock, woodenCart, mascot | crank.rot contínuo; engine.install 0→1 (f 60–100, spring); cart.x anda | Título amarelo VIRABREQUIM; título amarelo MOTOR; cartão histórico: PRIMEIRO CARRO – 1886, 3 rodas, ~16 km/h |
| 00:34:20 - 00:40:14 | 1040 - 1214 (s3) | Só que com um cilindro só, o carro anda aos trancos e treme inteiro. | A carroça-motor anda dando solavancos; malas pulam; o mascote balança. | cart, suitcases, mascot | cart.jolt (sin forte); suitcases.bounce | Balão EITA!; etiqueta ✕ TREME |
| 00:40:14 - 00:46:20 | 1214 - 1400 (s3) | Então você coloca quatro, explodindo um de cada vez, revezando. Agora o giro fica lisinho. | Corte do motor com 4 cilindros acendendo em sequência 1-3-4-2 (clarões alternados); o carro passa a andar suave. | engine4 (corte), flashes | cyl.fire em sequência (f a cada 6 frames) | Etiqueta i 4 CILINDROS; ✓ em "lisinho" |
| 00:46:20 - 00:51:05 | 1400 - 1535 (s4) | Mas cada explosão esquenta tanto que o motor pode até travar. | Motor fica vermelho, fumaça saindo do capô de madeira; termômetro na tela sobe até a faixa vermelha; o carro para. | engine (glow vermelho), smoke, tempGauge | engine.heat 0→1; smoke on; gauge needle sobe | Balão AI!; etiqueta ✕ SUPERAQUECE |
| 00:51:05 - 01:00:28 | 1535 - 1828 (s4) | Então você passa água por dentro dele e leva essa água pra uma grade na frente, onde o vento esfria. Esse é o radiador. | Canos azuis contornam o motor e vão a uma grade na frente; água quente (vermelha) entra, sai azul; o ponteiro volta ao meio. | waterPipes, radiator, fan, flowArrows | pipes.reveal 0→1; flow arrows; engine.heat 1→0; gauge volta | Título amarelo RADIADOR |
| 01:00:28 - 01:07:19 | 1828 - 2029 (s5) | Agora o motor gira sem parar. Mas ligado direto nas rodas, o carro não para no semáforo. | Semáforo fica vermelho; o carro continua andando e o mascote se desespera; para no meio da faixa. | trafficLight, car, mascot | light red; car.x não para; mascot.emotion scared | Balão SOCORRO!; etiqueta ✕ NÃO PARA |
| 01:07:19 - 01:15:28 | 2029 - 2278 (s5) | Então você coloca dois discos apertados um no outro, que se separam quando você pisa num pedal. Essa é a embreagem. | Close em corte: dois discos encostados girando juntos; pedal pisado afasta os discos; o de trás para. | clutchDiscs, pedal | disc.gap 0→0,1 quando pedal pisado; rot do disco de saída para | Título amarelo EMBREAGEM |
| 01:15:28 - 01:28:17 | 2278 - 2657 (s5) | E pra sair do lugar precisa de força, mas na estrada, de velocidade. Então você põe engrenagens de tamanhos diferentes. Primeira: forte e devagar. Quinta: leve e rápida. Esse é o câmbio. | Close: caixa com pares de engrenagens; seletor passa da 1ª (engrenagem grande atrás) para a 5ª (pequena); velocímetro sobe. | gearbox (corte), gears, shifter, speedometer | shift 1→5; speed.needle 10→80 | Etiquetas i 1ª = FORÇA, i 5ª = VELOCIDADE; título amarelo CÂMBIO |
| 01:28:17 - 01:39:00 | 2657 - 2970 (s6) | Mas na primeira curva o pneu de fora arrasta e chia. Olha que curioso: na curva, a roda de fora anda mais que a de dentro. | Vista de cima do carro numa curva; duas trilhas: a de fora (mais longa) e a de dentro (mais curta), com medidas; fumaça no pneu de fora. | car (top view), curveTracks, tireSmoke | tracks.draw 0→1; smoke on | Etiquetas i FORA: CAMINHO MAIOR, i DENTRO: MENOR; balão IIIH! |
| 01:39:00 - 01:47:24 | 2970 - 3234 (s6) | Então você põe no meio do eixo umas engrenagens que deixam uma roda girar mais que a outra. Esse é o diferencial. | Corte do eixo traseiro: engrenagens satélites giram; cada roda com velocidade diferente; o carro faz a curva liso. | differential (corte), rearAxle | planet gears rot; wheel speeds diferentes | Título amarelo DIFERENCIAL |
| 01:47:24 - 01:53:16 | 3234 - 3406 (s7) | E pra virar, se o eixo da frente inteiro gira, o carro pode tombar. | Carroça com eixo dianteiro girando inteiro (como carroça antiga); numa curva, ela inclina e quase tomba; mascote se segura. | car, frontAxle | axle.rot; car.roll quase tomba | Balão OPA!; etiqueta ✕ TOMBA |
| 01:53:16 - 02:00:28 | 3406 - 3628 (s7) | Então cada roda da frente ganha sua articulação, ligada por barras a um volante. Essa é a direção. | Close: duas articulações nas rodas, barras de ligação, coluna até o volante; mascote gira o volante e as rodas viram. | steeringWheel, tieRods, knuckles | wheel.rot ↔ knuckle.rot | Título amarelo DIREÇÃO |
| 02:00:28 - 02:13:11 | 3628 - 4001 (s8) | Só que cada buraco vai direto na sua coluna. Então você prende as rodas em molas, que absorvem a pancada, e em amortecedores, que seguram o balanço. Essa é a suspensão. | Carro passa num buraco e o mascote pula do banco (EITA!); depois close nas molas comprimindo e no amortecedor; carro passa liso. | pothole, springs, dampers, mascot | spring.compress; car.body bounce reduzido | Balão EITA!; título amarelo SUSPENSÃO |
| 02:13:11 - 02:19:12 | 4001 - 4182 (s8) | E troca as rodas de madeira por borracha cheia de ar. Esse é o pneu. | Rodas de madeira viram pneus pretos com aro; seta de ar entrando. | tires | wheel.swap (spring) | Título amarelo PNEU |
| 02:19:12 - 02:34:13 | 4182 - 4633 (s9) | Agora o carro corre demais. Então você põe um disco de metal em cada roda, e duas pastilhas apertam ele quando você pisa no pedal. Esse é o freio. No fim, frear é transformar velocidade em calor. | Velocímetro alto, linhas de velocidade; um muro de caixas à frente; close no disco com pastilhas apertando; disco fica laranja de calor; carro para a centímetros das caixas. | speedometer, speedLines, brakeDisc, pads, boxes | speed 90→0; disc.heat 0→1; car para | Balão SOCORRO!; título amarelo FREIO; etiqueta i VELOCIDADE → CALOR |
| 02:34:13 - 02:46:12 | 4633 - 4992 (s10) | Coloque faróis, limpador e cinto de segurança. Parabéns, você construiu um carro! Comente vrum se você não sabia dessa e segue o Por Dentro Lab. | Faróis acendem, limpador passa, cinto encaixa; carro moderno pronto andando na rua; mascote acena; confete. | headlights, wipers, seatbelt, finalCar, confetti | lights on; wiper sweep; belt click; car drive | Título amarelo CARRO!; pergunta final COMENTE "VRUM" com confete; POR DENTRO LAB em "segue" |

Soma: 4992 frames contíguos (0 a 4991).

## 3. Narração integral

**s1.** Você quer viajar com a família e as malas sem se cansar. Pega uma carroça de madeira, tira o cavalo, e quem empurra agora é você. Cinco minutos depois, acabou o fôlego.

**s2.** Então você precisa de uma força que não cansa. Você mistura gasolina com ar num cilindro, aperta e solta uma faísca. Ela explode e empurra uma peça pra baixo. Esse é o pistão. Uma barra torta transforma esse sobe e desce em giro. Esse é o virabrequim. E o conjunto todo é o motor.

**s3.** Só que com um cilindro só, o carro anda aos trancos e treme inteiro. Então você coloca quatro, explodindo um de cada vez, revezando. Agora o giro fica lisinho.

**s4.** Mas cada explosão esquenta tanto que o motor pode até travar. Então você passa água por dentro dele e leva essa água pra uma grade na frente, onde o vento esfria. Esse é o radiador.

**s5.** Agora o motor gira sem parar. Mas ligado direto nas rodas, o carro não para no semáforo. Então você coloca dois discos apertados um no outro, que se separam quando você pisa num pedal. Essa é a embreagem. E pra sair do lugar precisa de força, mas na estrada, de velocidade. Então você põe engrenagens de tamanhos diferentes. Primeira: forte e devagar. Quinta: leve e rápida. Esse é o câmbio.

**s6.** Mas na primeira curva o pneu de fora arrasta e chia. Olha que curioso: na curva, a roda de fora anda mais que a de dentro. Então você põe no meio do eixo umas engrenagens que deixam uma roda girar mais que a outra. Esse é o diferencial.

**s7.** E pra virar, se o eixo da frente inteiro gira, o carro pode tombar. Então cada roda da frente ganha sua articulação, ligada por barras a um volante. Essa é a direção.

**s8.** Só que cada buraco vai direto na sua coluna. Então você prende as rodas em molas, que absorvem a pancada, e em amortecedores, que seguram o balanço. Essa é a suspensão. E troca as rodas de madeira por borracha cheia de ar. Esse é o pneu.

**s9.** Agora o carro corre demais. Então você põe um disco de metal em cada roda, e duas pastilhas apertam ele quando você pisa no pedal. Esse é o freio. No fim, frear é transformar velocidade em calor.

**s10.** Coloque faróis, limpador e cinto de segurança. Parabéns, você construiu um carro! Comente vrum se você não sabia dessa e segue o Por Dentro Lab.

**Contagem:** 408 palavras → ~156 s de fala + pausas ≈ 166 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, `stability 0.45, similarity 0.8, style 0.4, speed 1.08`), uma faixa por cena, com tempos por palavra.
- Efeitos sintetizados: rodas de madeira, cansaço (ufa), explosão do cilindro, motor engasgando e depois liso, chiado do vapor, freada de pneu, buzina, clique do cinto, confete.
- Trilha leve sem direitos, abaixando sob a voz. Loudness final −15 LUFS, pico ≤ −2,5 dBTP.

## 5. Estrutura de dados
`scene-plan.ts` (nesta pasta) traz tipos e todas as cenas: narração, câmera, objetos, animações e selos com palavra-âncora. Linha do tempo determinística.

## 6. Rigor do conteúdo
- Motor de combustão: mistura ar + combustível comprimida e inflamada pela vela empurra o pistão; biela + virabrequim transformam o movimento linear em rotação. Vários cilindros com ignição alternada suavizam o giro.
- Arrefecimento por água com radiador; superaquecimento pode dilatar e travar peças (dito de forma geral).
- Embreagem: discos pressionados por mola, separados pelo pedal. Câmbio: relações de engrenagens (1ª força, 5ª velocidade; varia por carro).
- Diferencial: na curva a roda externa percorre caminho maior; o diferencial permite rotações diferentes.
- Direção: as rodas dianteiras giram em articulações próprias (em vez do eixo inteiro como nas carroças), ligadas à coluna e ao volante.
- Freio a disco: pastilhas apertam o disco; a energia do movimento vira calor.
- Cartão histórico: Benz Patent-Motorwagen, 1886, três rodas, cerca de 16 km/h (dado geral amplamente conhecido; sem marcas no vídeo além do cartão).

## 7. Critérios de aceite
Gancho imediato; cada peça surge de um problema mostrado antes; mascote testando todas as etapas; carro completo funcionando no fim; leitura no celular; tabela contígua; duração abaixo de 2:45.
