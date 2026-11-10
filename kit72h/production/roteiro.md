# Vídeo 5 — Kit de emergência para 72 horas: por que ter um?

**Versão:** v1 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** a recomendação da Defesa Civil Nacional (início de novembro de 2026) para as famílias montarem um kit de emergência para 72 horas, a partir da notícia da Veja enviada pelo usuário.
- **Fontes:** a página da Veja não abriu neste ambiente; usamos a cobertura de outros veículos sobre a mesma orientação (Diário do Nordeste, DCI, Compre Rural, Correio Braziliense). Pontos usados: 2 L de água por pessoa por dia (6 L em 3 dias); comida que não precisa de geladeira; remédios de uso contínuo; rádio a pilha e telefones anotados em papel; documentos protegidos da água; itens para bebês, crianças e pets; conferir validade a cada 6 meses; 199 (Defesa Civil) e 193 (Bombeiros); recomendação preventiva, não obrigatória; 72 h porque grandes desastres podem interromper serviços e dificultar o acesso do socorro. Lanterna, pilhas extras, primeiros socorros e carregador portátil são itens comuns em listas de kit (pedido do usuário incluir lanternas e pilhas).
- **Sistema mostrado:** uma casa em corte durante uma noite de temporal; a cada problema (sem luz, sem água limpa, sem comida, escuro, sem notícia, documentos molhados) um item entra na mochila, até o kit ficar pronto perto da porta.
- **Mascote (pedido do usuário):** o do canal, com **blusão de moletom com capuz no lugar da camisa e mochila nas costas**.
- **Tom:** o mesmo dos vídeos 3 e 4 (contando como novidade, explicando o porquê), calmo e sem alarmismo: "não é pra ter medo, é pra estar pronto".
- **Recursos:** ⏸ e ⏪ grandes no meio da tela nos erros (água da enchente, vela, documentos molhados); ✕ vermelho e ✓ verde grandes; etiquetas com bolinha; nome do item em amarelo; cartão 199/193; sem círculos vermelhos; acabamento com fundo desfocado como no vídeo do carro.
- **Duração estimada:** ~151 s (4535 frames). Voz Liam (speed 1,08).

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:09:24 | 0 - 294 (s1) | A Defesa Civil fez um alerta: toda casa devia ter um kit de emergência pra setenta e duas horas. Parece exagero, né? Então imagina. | Casa em corte (casa de bonecas): sala, cozinha e quarto; o mascote de blusão com capuz e mochila nas costas olha a TV com a notícia. Câmera abre de fora da casa e entra pela parede cortada. | house (corte), tv, mascot (blusão + mochila) | camera dolly-in; tv.glow | Pergunta grande: VOCÊ TEM UM KIT PRA 72 HORAS? |
| 00:09:24 - 00:13:27 | 294 - 417 (s1) | Chuva forte a noite inteira. De repente, a luz acaba. | Céu escurece, chuva forte, relâmpago; as luzes da casa apagam de uma vez; o mascote no escuro. | rain, lightning, houseLights | lights 1→0 em "luz"; flash relâmpago | Balão EITA!; ✕ SEM LUZ |
| 00:13:27 - 00:20:28 | 417 - 628 (s2) | A geladeira desliga, o celular tá com dez por cento e a internet caiu. E agora? | Close: geladeira com luz apagando; celular com bateria vermelha 10%; ícone de Wi-Fi riscado. Mascote preocupado. | fridge, phone, wifiIcon | battery 10%; wifi off | Etiquetas ● SEM INTERNET, ● 10% DE BATERIA; ✕ |
| 00:20:28 - 00:34:18 | 628 - 1038 (s3) | Sabe por que setenta e duas horas? Num desastre grande, a água, a energia e as estradas podem parar ao mesmo tempo. E o socorro não consegue chegar em todo mundo de uma vez. | Câmera sobe e mostra o bairro: rua alagada, poste caído, ponte bloqueada; ambulância e bote parados longe, com várias casas esperando. | street (alagada), pole, bridge, rescueBoat, ambulance | flood.rise; rescue fila | Título amarelo 72 HORAS = 3 DIAS |
| 00:34:18 - 00:38:19 | 1038 - 1159 (s3) | Nesses primeiros três dias, quem cuida de você é você. | Volta para dentro da casa; o mascote aponta para si mesmo e tira a mochila das costas. | mascot, backpack | backpack.off | Etiqueta ● NÃO É OBRIGATÓRIO, É PREVENÇÃO |
| 00:38:19 - 00:49:14 | 1159 - 1484 (s4) | Primeiro item: água. A torneira pode parar, ou a água ficar contaminada. A conta é dois litros por pessoa por dia. Três dias, seis litros por pessoa. | Torneira pinga e para. Garrafas de 2 L aparecem uma a uma ao lado do mascote (3 garrafas = 6 L); contador na tela. | faucet, waterBottles | bottles.count 0→3 | Título amarelo ÁGUA; etiqueta ● 2 L POR PESSOA POR DIA; ✓ |
| 00:49:14 - 00:52:20 | 1484 - 1580 (s4) | Uma família de quatro? Vinte e quatro litros. | Aparecem 4 bonecos (família) e 12 garrafas empilhadas. | family, bottles ×12 | bottles 3→12 | Etiqueta ● FAMÍLIA DE 4 = 24 L |
| 00:52:20 - 00:57:26 | 1580 - 1736 (s4) | E se não tiver? Você bebe água da enchente e passa mal. Volta! | ⏸ no meio da tela + tela de imaginação: mascote enche o copo na água barrenta da rua, bebe e fica verde; ⏪ no meio da tela, VOLTANDO. | mudWater, glass, mascot (enjoado) | imagine; rewind | ✕ grande |
| 00:57:26 - 01:09:26 | 1736 - 2096 (s5) | Depois, comida que não precisa de geladeira nem de fogão: enlatados com abridor, biscoito, castanhas e barra de cereal. Sem luz, o que tá na geladeira começa a estragar. | Os alimentos voam para dentro da mochila; ao lado, a geladeira aberta e escura com a comida ficando verde e moscas. | cans, opener, crackers, nuts, cerealBars, fridge | items → backpack | Título amarelo COMIDA; ✓; ✕ na geladeira |
| 01:09:26 - 01:13:28 | 2096 - 2218 (s6) | Agora a noite chega e tá tudo escuro. Vela? Perigoso. | Casa escura; o mascote acende uma vela, hesita. | candle, mascot | candle.light | Etiqueta ● VELA = RISCO DE INCÊNDIO |
| 01:13:28 - 01:18:13 | 2218 - 2353 (s6) | E se usar? Ela cai e pega fogo na cortina. Volta! | ⏸ no meio: a vela cai e a cortina pega fogo; ⏪ no meio, VOLTANDO. | candle, curtain, fire | imagine; fire; rewind | ✕ grande |
| 01:18:13 - 01:24:16 | 2353 - 2536 (s6) | Por isso, lanterna. E várias pilhas de reserva, porque elas sempre acabam na pior hora. | O mascote liga a lanterna (facho de luz); várias pilhas caem em fileira e entram na mochila; uma segunda lanterna de cabeça. | flashlights, batteries ×8 | beam on; batteries → backpack | Título amarelo LANTERNA + PILHAS; ✓ |
| 01:24:16 - 01:32:25 | 2536 - 2785 (s7) | Sem internet e sem sinal, como saber se a água vai subir ou pra onde ir? Com um rádio a pilha. | O mascote gira o botão de um rádio a pilha; ondas de rádio saem até uma antena da Defesa Civil. | batteryRadio, radioWaves, antenna | radio.on; waves | Título amarelo RÁDIO A PILHA; ✓ |
| 01:32:25 - 01:38:11 | 2785 - 2951 (s7) | Ele pega as rádios da sua cidade, que passam os avisos da Defesa Civil. | Balão do rádio: "ATENÇÃO: RIO SUBINDO, VÁ PARA LOCAL ALTO"; seta para o morro. | radio, alertBubble | bubble pop | Etiqueta ● AVISOS OFICIAIS |
| 01:38:11 - 01:51:12 | 2951 - 3342 (s7) | E anota os telefones importantes num papel, porque celular descarregado não lembra de nada. Defesa Civil: cento e noventa e nove. Bombeiros: cento e noventa e três. Um carregador portátil cheio também ajuda. | Papel com números escritos à mão entra na mochila; carregador portátil carregado. | paperNote, powerBank | note → backpack | Cartão 199 DEFESA CIVIL · 193 BOMBEIROS; ✓ |
| 01:51:12 - 02:00:04 | 3342 - 3604 (s8) | Também vão os remédios de uso contínuo, um kit de primeiros socorros e os documentos dentro de um saco plástico fechado. | Caixa de remédios, kit de primeiros socorros (cruz vermelha) e documentos entrando num saco zip, tudo para a mochila. | medicine, firstAidKit, documents, zipBag | items → backpack | Títulos amarelos REMÉDIOS e DOCUMENTOS; ✓ |
| 02:00:04 - 02:02:19 | 3604 - 3679 (s8) | E se molharem? Viram papa. Volta! | ⏸ no meio: a água entra na casa e os documentos soltos ficam encharcados e se desfazem; ⏪ no meio, VOLTANDO. | documents, floodWater | imagine; rewind | ✕ grande |
| 02:02:19 - 02:14:19 | 3679 - 4039 (s9) | E o segredo: deixa tudo numa mochila, num lugar fácil de pegar. Na emergência, você não tem tempo de procurar nada. E confere a validade a cada seis meses. | A mochila fecha e vai para um gancho perto da porta; o mascote veste e sai pela porta tranquilo; calendário com 6 meses. | backpack, hook, door, calendar | backpack.zip; hang | Título amarelo MOCHILA PRONTA; etiqueta ● VALIDADE: A CADA 6 MESES |
| 02:14:19 - 02:31:05 | 4039 - 4535 (s10) | Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo. | A chuva passa, o sol volta; o mascote com a mochila nas costas acena; confete. | sun, mascot, confetti | rain off; sun on | Pergunta final VOCÊ JÁ TEM O SEU? COMENTA AÍ! com confete |

Soma: 4535 frames contíguos (0 a 4534).

## 3. Narração integral

**s1.** A Defesa Civil fez um alerta: toda casa devia ter um kit de emergência pra setenta e duas horas. Parece exagero, né? Então imagina. Chuva forte a noite inteira. De repente, a luz acaba.

**s2.** A geladeira desliga, o celular tá com dez por cento e a internet caiu. E agora?

**s3.** Sabe por que setenta e duas horas? Num desastre grande, a água, a energia e as estradas podem parar ao mesmo tempo. E o socorro não consegue chegar em todo mundo de uma vez. Nesses primeiros três dias, quem cuida de você é você.

**s4.** Primeiro item: água. A torneira pode parar, ou a água ficar contaminada. A conta é dois litros por pessoa por dia. Três dias, seis litros por pessoa. Uma família de quatro? Vinte e quatro litros. E se não tiver? Você bebe água da enchente e passa mal. Volta!

**s5.** Depois, comida que não precisa de geladeira nem de fogão: enlatados com abridor, biscoito, castanhas e barra de cereal. Sem luz, o que tá na geladeira começa a estragar.

**s6.** Agora a noite chega e tá tudo escuro. Vela? Perigoso. E se usar? Ela cai e pega fogo na cortina. Volta! Por isso, lanterna. E várias pilhas de reserva, porque elas sempre acabam na pior hora.

**s7.** Sem internet e sem sinal, como saber se a água vai subir ou pra onde ir? Com um rádio a pilha. Ele pega as rádios da sua cidade, que passam os avisos da Defesa Civil. E anota os telefones importantes num papel, porque celular descarregado não lembra de nada. Defesa Civil: cento e noventa e nove. Bombeiros: cento e noventa e três. Um carregador portátil cheio também ajuda.

**s8.** Também vão os remédios de uso contínuo, um kit de primeiros socorros e os documentos dentro de um saco plástico fechado. E se molharem? Viram papa. Volta!

**s9.** E o segredo: deixa tudo numa mochila, num lugar fácil de pegar. Na emergência, você não tem tempo de procurar nada. E confere a validade a cada seis meses.

**s10.** Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo.

**Contagem:** 368 palavras → ~140 s de fala + pausas ≈ 151 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, speed 1,08), uma faixa por cena, com tempos por palavra.
- Sons sintetizados: chuva, trovão, luz apagando, pingos, lanterna (clique), rádio chiando, zíper da mochila, fogo (na imaginação), confete. Trilha leve abaixando sob a voz.

## 5. Rigor do conteúdo
- Números citados vêm da cobertura da orientação da Defesa Civil: 2 L/pessoa/dia, 6 L em 3 dias (família de 4 = 24 L, conta simples), validade a cada 6 meses, 199 e 193.
- Não dizemos que o socorro chega em 72 h; dizemos que nos primeiros dias ele pode não conseguir chegar a todos.
- A recomendação é preventiva e não obrigatória (dito na tela).
- Vela: dito como risco de incêndio (orientação geral de segurança).

## 6. Critérios de aceite
Gancho com a notícia; cada item surge de um problema mostrado antes; mascote de blusão e mochila em todas as cenas; mochila pronta no fim; tom calmo; duração até 2:45.
