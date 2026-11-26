# Roteiro v3 — "Isso vai cair na prova?" (versão sem sentido)

Origem: o usuário pediu "o vídeo mais sem sentido" e mandou uma amostra de voz ("Will – Deep", Eleven v4). A v2 (entregue) ficou em `roteiro-v2.md`. Status: **AGUARDANDO APROVAÇÃO**.

**O que muda da v2 para a v3:**
- A história continua em corrente: cada absurdo "causa" o próximo, sempre narrado com seriedade.
- Os saltos agora **não fazem sentido nenhum**: um pato de gravata que é a cura do pânico, um relógio que volta para a segunda-feira passada, um giz que era um dinossauro disfarçado, xadrez com pão de queijo…
- O final volta nas piadas anteriores: o pato e o "talvez".

## 1. Briefing

| Item | Definição |
| --- | --- |
| Formato | Vertical 1080 × 1920, 30 fps, ~65–75 s (os cortes seguem a voz real). Sem fato real (guia do canal) |
| Voz | ElevenLabs **Will – Deep** (`CstacWqMhJQlnfLPxRG4`), modelo **`eleven_v4`**, stability 0.50, similarity 0.75, igual à amostra enviada pelo usuário (tom grave e animado, faixa de 92–267 Hz). Sem marcações. ~950 caracteres: **gasta créditos; a aprovação autoriza** |
| Personagens | **Professor** (boca parada, só expressões); **alunos** (o de boné vermelho faz a pergunta); **pato de gravata** (do vídeo do cabelo, agora de gravata vermelha); **relógio de parede com rosto**; **dinossauro de giz** (branco, com textura de giz); **diretor** (terno cinza, bigode, crachá) |
| Cenário | A sala de aula da v2, mais efeitos: **rebobinar** (tela azulada com faixas de VHS e "◀◀"), **fumaça de transformação** e **holofote** |
| Tela | Legenda palavra a palavra, pílulas, **cartões "DEFINIÇÃO TÉCNICA"**, **crachás falsos** (DIRETOR / COORDENADOR PEDAGÓGICO), **folha de prova falsa**, card **@professorpowerguido** |
| Áudio | Música bem baixa + versão sem música; efeitos sintetizados (quack, rebobinar, puf, rugidinho, sinal) |

## 2. Tabela cronológica (estimativa; os cortes seguem a voz depois de gerada)

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:07:15 | 0 - 225 | Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez. | Igual à abertura da v2: o Professor escreve no quadro e o aluno de boné levanta a mão. Corte para o aluno (na palavra "perguntar") e depois para o Professor, de olhos fechados (na palavra "nunca"). | Sala; quadro "AULA 7". | Mão do aluno sobe (spring); Professor vira de frente (spring). | Título "Isso vai cair na **prova**?".<br>Pílula "● VAI CAIR NA PROVA?" azul.<br>Pílula "● TALVEZ." vermelha. |
| 00:07:15 - 00:16:15 | 225 - 495 | Porque o talvez é contagioso. Em trinta segundos, a sala inteira fala talvez, inclusive a janela, que nem estava na aula. | Balões "TALVEZ" pulam de aluno em aluno (como na v2). **Corte para a janela**: ela ganha olhos e boca e solta um balão "TALVEZ" enorme. | Balões "TALVEZ"; janela com rosto (olhos e boca sobre o vidro). | Balões em arco (6 saltos); olhos da janela piscam (escala Y 1 → 0,1 → 1); balão gigante cresce (spring) na palavra "janela". | Pílula "● CONTAGIOSO" vermelha.<br>Pílula "● A JANELA TAMBÉM" laranja.<br>Legenda: "contagioso" e "janela" em amarelo. |
| 00:16:15 - 00:23:18 | 495 - 708 | Isso é chamado de pânico acadêmico coletivo, e a única cura conhecida é um pato de gravata. | Alunos correndo em círculos (como na v2). Na palavra "pato": **holofote** na porta, a porta abre e **entra um pato de gravata**, andando em câmera lenta, com fumaça. | Pato com gravata vermelha; holofote (cone de luz); fumaça. | Holofote acende (opacidade 0 → 0,5); pato anda x 6,5 → 4,5 (gingado); tempo a 0,4× durante a entrada. | **Cartão "DEFINIÇÃO TÉCNICA: PÂNICO ACADÊMICO COLETIVO"**.<br>Pílula "● CURA: PATO DE GRAVATA" verde. |
| 00:23:18 - 00:32:06 | 708 - 966 | Então você chama o pato. O pato corrige a prova em trinta segundos e dá nota sete pra todo mundo, inclusive pro relógio. | O pato na mesa do professor, com uma caneta vermelha, corrigindo uma pilha de provas **rapidíssimo** (folhas voando para todo lado). Cada aluno ganha um adesivo "7" na testa; corte para o relógio de parede, que **também ganha um "7"** e sorri. | Pato com caneta; pilha de provas; folhas voando; adesivos "7"; relógio com rosto. | Folhas voam da mesa a cada 3 f (`random(seed)`); adesivos "7" aparecem com pop, aluno por aluno; zoom no relógio na palavra "relógio". | Pílula "● NOTA 7 PRA TODOS ✓" verde.<br>Pílula "● RELÓGIO: 7" laranja. |
| 00:32:06 - 00:39:09 | 966 - 1179 | O relógio fica tão feliz que começa a andar ao contrário, e a aula volta pra segunda-feira passada. | Close no relógio feliz; os ponteiros giram para trás cada vez mais rápido. **Efeito de rebobinar** na tela inteira: imagem azulada, faixas de VHS e "◀◀ SEGUNDA-FEIRA PASSADA"; os alunos andam de costas, as folhas voltam para a mesa. | Relógio; efeito VHS (2D). | Ponteiros: −720°/s; efeito VHS entra na palavra "contrário" (opacidade 0 → 1); folhas fazem o caminho de volta (animação invertida). | Texto VHS "◀◀ SEGUNDA-FEIRA PASSADA" (fonte de display, canto superior esquerdo).<br>Legenda: "contrário" e "segunda-feira" em amarelo. |
| 00:39:09 - 00:42:24 | 1179 - 1284 | Esse fenômeno é conhecido como recuperação temporal. | A sala na "segunda passada" (tom sépia leve); o Professor olha em volta, confuso. | Filtro sépia. | Sépia a 30%; câmera deriva devagar. | **Cartão "DEFINIÇÃO TÉCNICA: RECUPERAÇÃO TEMPORAL"**. |
| 00:42:24 - 00:49:06 | 1284 - 1476 | Na segunda-feira passada, você descobre que o giz era um dinossauro disfarçado o tempo todo. | Close no giz com rosto na mesa; ele treme e **puf!**: fumaça, e no lugar dele aparece um **dinossauro de giz** (branco, pequeno, com o mesmo rosto), que dá um rugidinho. | Giz; fumaça; dinossauro de giz. | Giz treme (seno 20 Hz); puf na palavra "dinossauro" (escala 0 → 1,2 → 1); rugido (boca abre). | Pílula "● DISFARÇADO O TEMPO TODO" vermelha.<br>Legenda: "dinossauro" em amarelo. |
| 00:49:06 - 00:56:21 | 1476 - 1701 | Ele não aceita perder e desafia o diretor pra uma partida de xadrez usando pão de queijo como peças. | **Entra o diretor** (terno, bigode). Na mesa do professor aparece um tabuleiro de xadrez com **pães de queijo** no lugar das peças; o dinossauro e o diretor se encaram (close de faroeste). | Diretor; tabuleiro; 16 pães de queijo (bolinhas douradas). | Diretor entra pela porta (caminhada); tabuleiro surge (spring); pães de queijo caem nas casas um a um (2 f cada); cortes de faroeste nos olhos. | Pílula "● NÃO ACEITA PERDER" vermelha.<br>Pílula "● DESAFIO ACEITO" azul.<br>Legenda: "xadrez" e "pão de queijo" em amarelo. |
| 00:56:21 - 01:03:03 | 1701 - 1893 | O diretor perde, o dinossauro vira diretor, e o pato agora é coordenador pedagógico. | O diretor cabisbaixo; o dinossauro com gravata e crachá de **DIRETOR**; o pato com crachá de **COORDENADOR PEDAGÓGICO**, de óculos. | Crachás 3D. | Diretor afunda (cabeça baixa, spring); crachás aparecem com brilho (spring). | **Crachás falsos (cartões)**: "DIRETOR · Espécie: dinossauro de giz" e "COORDENADOR PEDAGÓGICO · Espécie: pato". |
| 01:03:03 - 01:08:09 | 1893 - 2049 | No dia da prova, a única questão é: por que você disse talvez? | Close numa **folha de prova** na carteira: "QUESTÃO 1 (10 pontos): Por que você disse talvez?". O Professor (agora sentado como aluno) com cara de surpreso. | Folha de prova (cartão). | Folha desliza (spring); câmera aproxima. | **Cartão "PROVA · QUESTÃO 1 (10 pontos): Por que você disse talvez?"**. |
| 01:08:09 - 01:14:09 | 2049 - 2229 | Moral da história: nunca diga talvez. Diga pato. | Plano aberto: o pato coordenador e o dinossauro diretor na frente da turma; o pato dá um "quack" (asas abertas). Card de seguir. | Todos os personagens. | Asas do pato abrem (spring) na palavra "pato"; câmera recua. | Legenda: "talvez" e "pato" em amarelo.<br>Card "@professorpowerguido". |

**Soma estimada:** 2229 frames = 74,3 s.

## 3. Dados (Remotion)

`production/scene-plan.ts` (v3) tem as 11 cenas.

**Reaproveitado:** a sala, os alunos, o Professor, os cartões, as legendas e o motor (cortes pela voz, câmera, efeitos de tela). O pato vem do vídeo do cabelo.

**Peças novas:**
- gravata do pato;
- janela e relógio com rosto;
- efeito de rebobinar (VHS) e sépia;
- dinossauro de giz;
- diretor;
- tabuleiro com pães de queijo;
- crachás e folha de prova.

## 4. Áudio

**Narração completa (~170 palavras):**
Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez. Porque o talvez é contagioso. Em trinta segundos, a sala inteira fala talvez, inclusive a janela, que nem estava na aula. Isso é chamado de pânico acadêmico coletivo, e a única cura conhecida é um pato de gravata. Então você chama o pato. O pato corrige a prova em trinta segundos e dá nota sete pra todo mundo, inclusive pro relógio. O relógio fica tão feliz que começa a andar ao contrário, e a aula volta pra segunda-feira passada. Esse fenômeno é conhecido como recuperação temporal. Na segunda-feira passada, você descobre que o giz era um dinossauro disfarçado o tempo todo. Ele não aceita perder e desafia o diretor pra uma partida de xadrez usando pão de queijo como peças. O diretor perde, o dinossauro vira diretor, e o pato agora é coordenador pedagógico. No dia da prova, a única questão é: por que você disse talvez? Moral da história: nunca diga talvez. Diga pato.

## 5. Critérios de aceite

- [x] Mais sem sentido que a v2, mas ainda em corrente (cada absurdo "causa" o próximo)
- [x] Nomes técnicos sérios ("pânico acadêmico coletivo", "recuperação temporal")
- [x] Final volta no "talvez" e no pato
- [x] Voz da amostra do usuário (Will – Deep, Eleven v4, 0.50 / 0.75)
- [x] Sem fato real; legendas, cartões e card no padrão
- [ ] Fase 2: voz, render, conferência
