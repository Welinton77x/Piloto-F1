# Vídeo 5 — Kit de emergência para 72 horas: por que ter um?

**Versão:** v3 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** a recomendação da Defesa Civil Nacional (início de novembro de 2026) para as famílias montarem um kit de emergência para 72 horas, a partir da notícia da Veja enviada pelo usuário.
- **Fontes:** a página da Veja não abriu neste ambiente; usamos a cobertura de outros veículos sobre a mesma orientação (Diário do Nordeste, DCI, Compre Rural, Correio Braziliense). Pontos usados: 2 L de água por pessoa por dia (6 L em 3 dias); comida que não precisa de geladeira; remédios de uso contínuo; rádio a pilha e telefones anotados em papel; documentos protegidos da água; itens para bebês, crianças e pets; conferir validade a cada 6 meses; 199 (Defesa Civil) e 193 (Bombeiros); recomendação preventiva, não obrigatória; 72 h porque grandes desastres podem interromper serviços e dificultar o acesso do socorro. Lanterna, pilhas extras, primeiros socorros e carregador portátil são itens comuns em listas de kit (pedido do usuário incluir lanternas e pilhas).
- **Formato (pedido v2):** vídeo informativo e de ajuda: (1) por que 72 horas — energia, água e comunicação podem parar juntas, e o socorro não chega em todos de uma vez; (2) checklist de 8 itens na tela, marcado um a um, cada item com o porquê; (3) dicas para montar (mochila perto da porta, validade a cada 6 meses, montar aos poucos, adaptar à família).
- **Mascote (pedido do usuário):** o do canal, com **blusão de moletom com capuz no lugar da camisa, mochila nas costas e chapéu no lugar do boné** (chapéu de aba redonda, estilo explorador/pescador, cor cáqui).
- **Tom:** o mesmo dos vídeos 3 e 4 (contando como novidade, explicando o porquê), calmo e sem alarmismo: "não é pra ter medo, é pra estar pronto".
- **Recursos:** checklist na tela; ✕ vermelho e ✓ verde grandes; etiquetas com bolinha; nome do item em amarelo; cartão 199/193; sem círculos vermelhos; acabamento com fundo desfocado como no vídeo do carro.
- **Duração estimada:** ~164 s (4914 frames). Voz Liam (speed 1,08).

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:12:11 | 0 - 371 (s1) | A Defesa Civil recomendou que toda casa tenha um kit de emergência pra setenta e duas horas. Mas por que três dias? E o que vai dentro? Vamos montar juntos. | Casa em corte; o mascote de blusão e mochila lê a notícia no celular; uma lista em branco aparece ao lado (CHECKLIST DO KIT) com 8 linhas vazias. | house, phone, mascot (blusão + mochila), checklist | checklist.in (spring) | Pergunta grande: O QUE VAI NO KIT DE 72 HORAS? |
| 00:12:11 - 00:19:13 | 371 - 583 (s2) | Num temporal, numa enchente ou num apagão grande, três coisas podem parar ao mesmo tempo. Primeira: a energia. | Temporal à noite; um poste cai e a casa apaga. | storm, pole, houseLights | lights off | Etiqueta ● ENERGIA |
| 00:19:13 - 00:28:03 | 583 - 843 (s2) | Sem luz, a geladeira desliga, o celular não carrega e, em prédio, a bomba que sobe a água pra caixa também para. | Corte: geladeira escura; celular com bateria vazia; prédio com a bomba parada e a caixa d'água esvaziando. | fridge, phone, building, pump, tank | tank.level ↓ | ✕ GELADEIRA, ✕ CELULAR, ✕ BOMBA |
| 00:28:03 - 00:36:10 | 843 - 1090 (s2) | Segunda: a água. A estação de tratamento também precisa de energia, canos podem romper e a enchente pode contaminar a água. | Corte da rua: cano rompido jorrando, água barrenta da enchente entrando na rede; torneira da casa pinga e para. | pipe, flood, faucet | faucet stop | Etiqueta ● ÁGUA; ✕ |
| 00:36:10 - 00:44:06 | 1090 - 1326 (s2) | Terceira: a comunicação. As antenas de celular têm bateria só por algumas horas. Depois disso, sem sinal e sem internet. | Antena de celular com bateria acabando; ícones de sinal e Wi-Fi riscados no celular do mascote. | cellTower, battery, phone | tower.battery ↓; signal off | Etiqueta ● COMUNICAÇÃO; ✕ |
| 00:44:06 - 01:01:27 | 1326 - 1857 (s3) | E por que setenta e duas horas? Porque num desastre grande as estradas ficam bloqueadas e o socorro não consegue chegar em todo mundo de uma vez. Esses três primeiros dias são os mais difíceis, e o kit te deixa seguro até tudo voltar. | Vista do bairro alagado; bote e caminhão de resgate atendendo uma casa de cada vez; relógio 72 h correndo. | street, rescueBoat, truck, clock72 | clock 0→72 | Título amarelo 72 HORAS = 3 DIAS |
| 01:01:27 - 01:12:22 | 1857 - 2182 (s4) | Agora, a lista. Item um: água potável. Dois litros por pessoa por dia, então seis litros por pessoa pros três dias. Em garrafas fechadas, longe do sol. | Garrafas de 2 L aparecem ao lado do mascote e entram na mochila (e um fardo fica no chão); a primeira linha do checklist recebe ✓. | bottles, checklist | check 1 | Título amarelo ÁGUA; etiqueta ● 2 L POR PESSOA POR DIA; ✓ |
| 01:12:22 - 01:20:11 | 2182 - 2411 (s4) | Item dois: comida que não precisa de geladeira nem de fogão. Enlatados com abridor, biscoito, castanhas, barra de cereal. | Alimentos entram na mochila; o abridor de lata gira; checklist linha 2 ✓. | cans, opener, crackers, nuts, bars | check 2 | Título amarelo COMIDA; ✓ |
| 01:20:11 - 01:27:03 | 2411 - 2613 (s5) | Item três: lanterna, e várias pilhas de reserva. É mais seguro que vela, que pode causar incêndio. | O mascote liga a lanterna (facho); fileira de pilhas entra na mochila; uma vela ao lado recebe ✕. | flashlights, batteries, candle | beam on; check 3 | Título amarelo LANTERNA + PILHAS; ✕ na vela; ✓ |
| 01:27:03 - 01:35:13 | 2613 - 2863 (s5) | Item quatro: rádio a pilha. Sem internet, é por ele que chegam os avisos da Defesa Civil sobre pra onde ir. | Rádio a pilha liga com chiado; balão do rádio: ATENÇÃO, PROCURE LOCAL ALTO; checklist 4 ✓. | batteryRadio, alertBubble | radio on; check 4 | Título amarelo RÁDIO A PILHA; ✓ |
| 01:35:13 - 01:45:10 | 2863 - 3160 (s5) | Item cinco: carregador portátil cheio e os telefones importantes anotados num papel. Defesa Civil, cento e noventa e nove. Bombeiros, cento e noventa e três. | Power bank carregado e bilhete com 199 e 193 entram na mochila; checklist 5 ✓. | powerBank, paperNote | check 5 | Cartão 199 DEFESA CIVIL · 193 BOMBEIROS; ✓ |
| 01:45:10 - 01:50:05 | 3160 - 3305 (s6) | Item seis: remédios de uso contínuo e um kit de primeiros socorros. | Caixa de remédios e kit com cruz vermelha entram na mochila; checklist 6 ✓. | medicine, firstAidKit | check 6 | Título amarelo REMÉDIOS; ✓ |
| 01:50:05 - 01:54:17 | 3305 - 3437 (s6) | Item sete: documentos num saco plástico bem fechado, pra não molhar. | RG, cartões e papéis entram num saco zip que fecha; gotas escorrem por fora sem entrar; checklist 7 ✓. | documents, zipBag | zip close; check 7 | Título amarelo DOCUMENTOS; ✓ |
| 01:54:17 - 02:04:06 | 3437 - 3726 (s6) | Item oito: itens de higiene, um agasalho e o que sua família precisa a mais, como fralda, leite pro bebê ou ração pro pet. | Escova, sabonete e papel higiênico; blusão dobrado; fralda e pote de ração entram; checklist 8 ✓. | hygiene, jacket, diaper, petFood | check 8 | Etiqueta ● BEBÊS E PETS TAMBÉM |
| 02:04:06 - 02:14:16 | 3726 - 4036 (s7) | Agora, as dicas pra montar. Deixa tudo numa mochila, num lugar fácil, perto da porta. Assim, se precisar sair às pressas, é só pegar e ir. | Mochila fecha (zíper) e vai para um gancho ao lado da porta; o mascote veste e sai tranquilo. | backpack, hook, door | zip; hang | Título amarelo MOCHILA PERTO DA PORTA |
| 02:14:16 - 02:21:09 | 4036 - 4239 (s7) | E a cada seis meses confere a validade da água, da comida, dos remédios e das pilhas. | Calendário vira 6 meses; o mascote troca uma lata vencida e uma pilha. | calendar, cans, batteries | calendar flip | Etiqueta ● CONFERIR A CADA 6 MESES |
| 02:21:09 - 02:27:08 | 4239 - 4418 (s7) | Não precisa comprar tudo de uma vez. Monta aos poucos, do jeito da sua família. | Checklist completo com 8 ✓ ao lado da mochila. | checklist | all checks glow | Etiqueta ● NÃO É OBRIGATÓRIO, É PREVENÇÃO |
| 02:27:08 - 02:43:24 | 4418 - 4914 (s8) | Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo. | A chuva passa e o sol volta; o mascote com a mochila acena; confete. | sun, mascot, confetti | rain off; sun on | Pergunta final VOCÊ JÁ TEM O SEU? COMENTA AÍ! com confete |

Soma: 4914 frames contíguos (0 a 4913).

## 3. Narração integral

**s1.** A Defesa Civil recomendou que toda casa tenha um kit de emergência pra setenta e duas horas. Mas por que três dias? E o que vai dentro? Vamos montar juntos.

**s2.** Num temporal, numa enchente ou num apagão grande, três coisas podem parar ao mesmo tempo. Primeira: a energia. Sem luz, a geladeira desliga, o celular não carrega e, em prédio, a bomba que sobe a água pra caixa também para. Segunda: a água. A estação de tratamento também precisa de energia, canos podem romper e a enchente pode contaminar a água. Terceira: a comunicação. As antenas de celular têm bateria só por algumas horas. Depois disso, sem sinal e sem internet.

**s3.** E por que setenta e duas horas? Porque num desastre grande as estradas ficam bloqueadas e o socorro não consegue chegar em todo mundo de uma vez. Esses três primeiros dias são os mais difíceis, e o kit te deixa seguro até tudo voltar.

**s4.** Agora, a lista. Item um: água potável. Dois litros por pessoa por dia, então seis litros por pessoa pros três dias. Em garrafas fechadas, longe do sol. Item dois: comida que não precisa de geladeira nem de fogão. Enlatados com abridor, biscoito, castanhas, barra de cereal.

**s5.** Item três: lanterna, e várias pilhas de reserva. É mais seguro que vela, que pode causar incêndio. Item quatro: rádio a pilha. Sem internet, é por ele que chegam os avisos da Defesa Civil sobre pra onde ir. Item cinco: carregador portátil cheio e os telefones importantes anotados num papel. Defesa Civil, cento e noventa e nove. Bombeiros, cento e noventa e três.

**s6.** Item seis: remédios de uso contínuo e um kit de primeiros socorros. Item sete: documentos num saco plástico bem fechado, pra não molhar. Item oito: itens de higiene, um agasalho e o que sua família precisa a mais, como fralda, leite pro bebê ou ração pro pet.

**s7.** Agora, as dicas pra montar. Deixa tudo numa mochila, num lugar fácil, perto da porta. Assim, se precisar sair às pressas, é só pegar e ir. E a cada seis meses confere a validade da água, da comida, dos remédios e das pilhas. Não precisa comprar tudo de uma vez. Monta aos poucos, do jeito da sua família.

**s8.** Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo.

**Contagem:** 406 palavras → ~155 s de fala + pausas ≈ 164 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, speed 1,08), uma faixa por cena, com tempos por palavra.
- Sons sintetizados: chuva, trovão, luz apagando, pingos, lanterna (clique), rádio chiando, zíper da mochila, fogo (na imaginação), confete. Trilha leve abaixando sob a voz.

## 5. Rigor do conteúdo
- Números citados vêm da cobertura da orientação da Defesa Civil: 2 L/pessoa/dia, 6 L em 3 dias (família de 4 = 24 L, conta simples), validade a cada 6 meses, 199 e 193.
- Não dizemos que o socorro chega em 72 h; dizemos que nos primeiros dias ele pode não conseguir chegar a todos.
- A recomendação é preventiva e não obrigatória (dito na tela).
- Vela: dito como risco de incêndio (orientação geral de segurança).
- Antenas de celular: dito de forma geral que têm bateria por algumas horas; bomba de prédio e tratamento de água dependem de energia (explicação geral).

## 6. Critérios de aceite
Gancho com a notícia; cada item surge de um problema mostrado antes; mascote de blusão e mochila em todas as cenas; mochila pronta no fim; tom calmo; duração até 2:45.
