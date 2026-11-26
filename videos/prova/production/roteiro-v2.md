# Roteiro v2 — "Isso vai cair na prova?" (história em corrente, sem fato real)

Origem: escrito pelo agente seguindo o `videos/GUIA-DO-CANAL.md`. O usuário pediu um roteiro novo no formato do exemplo dos gatos. Tema escolhido pelo agente (o protagonista é professor); pode ser trocado. Status: **AGUARDANDO APROVAÇÃO**. v2: o usuário pediu para tirar o fato real ("Não precisa esse negócio de fato"); a cena do pergaminho grego saiu e a fala seguinte foi trocada por uma continuação absurda.

## 1. Briefing

| Item | Definição |
| --- | --- |
| Formato narrativo | **Uma história só, em corrente de consequências** ("Se você fizer X… então Y… e aí Z…"), com **nomes técnicos sérios para os absurdos**, **reviravolta** e **moral** no final. **Sem fato real** (preferência do usuário). Sem "DICA N" (formato do exemplo dos gatos) |
| Tema | O aluno pergunta "isso vai cair na prova?" e o Professor responde "talvez", e tudo desanda |
| Formato | Vertical 1080 × 1920, 30 fps, ~70–80 s (os cortes seguem a voz real) |
| Voz | ElevenLabs **Will, estilo B** (`eleven_multilingual_v2`, stability 0.3, style 0.75, speed 1.0, sem marcações): **animado no tom, sério no conteúdo**, sem risadas. ~1020 caracteres: **gasta créditos; a aprovação autoriza** |
| Personagens | **Professor** (protagonista, boca parada, só expressões); **alunos** (6 bonequinhos no mesmo estilo de brinquedo, cores variadas; um deles é o **"aluno da pergunta"**, de boné vermelho); **material escolar com carinha**: giz, apagador, caneta de quadro, projetor |
| Cenário | **Sala de aula** 3D: quadro-negro verde com moldura de madeira, mesa do professor, 6 carteiras, janela com prédios, relógio de parede, mural. |
| Tela | Legenda palavra a palavra (palavra-chave em amarelo); pílulas; **cartões falsos**: notificação de grupo no celular, "DEFINIÇÃO TÉCNICA", plaquinhas de greve, tela do projetor pedindo a senha do wi-fi, "PLANO DE ENSINO"; card **@professorpowerguido** |
| Áudio | Música bem baixa + versão sem música; efeitos sintetizados |

## 2. Tabela cronológica (estimativa; os cortes seguem a voz depois de gerada)

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:07:24 | 0 - 234 | Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez. | Plano aberto da sala: o Professor escreve no quadro; o aluno de boné levanta a mão. Corte para o Professor virando de frente, pensativo.<br>Câmera: alvo (0,2.6,0), raio 26→22, azimute 0°→8°; corte em "perguntar" para o aluno (raio 8); corte em "nunca" para o rosto do Professor (raio 7). | Sala completa; quadro com "AULA 7"; 6 alunos; aluno de boné. | Mão do aluno sobe (spring, na palavra "aluno"); giz desenha linhas no quadro (desenho progressivo); Professor gira de costas → de frente (spring). | Título "Isso vai cair na **prova**?" (caixa amarela), sai em ~3 s.<br>Pílula "● VAI CAIR NA PROVA?" azul no aluno.<br>Pílula "● TALVEZ." vermelha no Professor (na palavra "talvez"). |
| 00:07:24 - 00:17:15 | 234 - 525 | Porque o talvez se espalha. Em trinta segundos, a sala cria um grupo chamado resumão definitivo, com trinta e oito pessoas e nenhum resumo. | A palavra "TALVEZ" sai da boca de cena como balões amarelos que pulam de carteira em carteira; todos os alunos sacam o celular ao mesmo tempo; a câmera passa por cima das carteiras. | Balões "TALVEZ" (texto 3D); 6 celulares com a tela acesa. | Balões pulam em arco de aluno em aluno (6 saltos, 8 f cada); celulares sobem das carteiras (spring, defasados 3 f); câmera faz travelling lateral x −4 → 4. | **Cartão falso** de notificação do celular: "Novo grupo: RESUMÃO DEFINITIVO 🔥 · 38 participantes", que desliza do topo na palavra "grupo".<br>Pílula "● 0 RESUMOS" vermelha (na palavra "nenhum"). |
| 00:17:15 - 00:20:27 | 525 - 627 | Isso é chamado de pânico acadêmico coletivo. | Close do Professor sério (cara de surpreso) com a sala atrás em caos: alunos correndo em círculos, folhas voando. | Folhas voando (12, `random(seed)`). | Alunos giram em volta das carteiras (órbita, 1 volta/s); folhas sobem e caem. | **Cartão "DEFINIÇÃO TÉCNICA: PÂNICO ACADÊMICO COLETIVO"** (azul-marinho com borda amarela, igual ao do exemplo), com spring. |
| 00:20:27 - 00:31:09 | 627 - 939 | Nesse caso, o correto é escrever no quadro: tudo cai. Só que o giz quebra no meio da palavra, porque giz não trabalha sob pressão. | O Professor vai até o quadro e escreve "TUDO C…"; o giz (com carinha) **quebra ao meio** e as duas metades caem com cara brava. Close do giz no chão. | Giz com rosto; texto progressivo no quadro; poeira de giz. | Escrita progressiva "TUDO C" (letras aparecem uma a uma); giz parte (as metades se separam, spring, na palavra "quebra"); poeira (20 partículas); tremor leve. | Legenda: "quebra" e "pressão" em amarelo.<br>Pílula "● SOB PRESSÃO ✖" vermelha no giz. |
| 00:31:09 - 00:40:09 | 939 - 1209 | Aí o apagador pede férias, a caneta pede aumento, e o projetor só liga se você souber a senha do wi-fi. | Na mesa, o material ganha vida: o **apagador** com chapéu de praia e óculos escuros; a **caneta** segurando uma plaquinha "AUMENTO JÁ"; o **projetor** acende e projeta no quadro "DIGITE A SENHA DO WI-FI". | Apagador (chapéu de palha, óculos); caneta com placa; projetor com feixe de luz; tela projetada. | Cada objeto pula quando é citado (spring, preso às palavras "apagador", "caneta" e "projetor"); feixe do projetor acende (opacidade 0 → 0,5). | Pílulas: "● FÉRIAS" laranja, "● AUMENTO JÁ" vermelha, "● SENHA DO WI-FI?" azul, cada uma no seu objeto. |
| 00:40:09 - 00:44:12 | 1209 - 1332 | Esse procedimento é conhecido como greve do material escolar. | Plano médio da mesa: o material em fila com plaquinhas de greve, marchando; o Professor de braços cruzados (cara brava). | Plaquinhas "GREVE", "REAJUSTE", "ZZZ". | Material marcha de um lado ao outro (passos, seno); plaquinhas balançam. | **Cartão "DEFINIÇÃO TÉCNICA: GREVE DO MATERIAL ESCOLAR"**. |
| 00:44:12 - 00:53:12 | 1332 - 1602 | Pra acabar com a greve, ofereça quinze minutos de intervalo. Mas cuidado: se eles aceitarem, o intervalo vira matéria de prova. | O Professor estende um apito (oferta); o relógio de parede gira rápido; **o sinal toca** e todo mundo comemora. Depois, no quadro, aparece sozinho: "MATÉRIA DA PROVA: INTERVALO (cap. 1–15)". Os alunos congelam. | Relógio de parede; sinal (campainha); texto no quadro. | Ponteiros giram (360°/s); campainha vibra (seno 20 Hz); alunos pulam (spring); texto do quadro se escreve sozinho (na palavra "matéria"); alunos: feliz → surpreso. | Pílula "● ACORDO ✓" verde (na palavra "aceitarem").<br>Legenda: "intervalo" e "prova" em amarelo. |
| 00:53:12 - 00:58:27 | 1602 - 1767 | Agora a turma passa o intervalo estudando o intervalo, e alguém já fez um mapa mental do recreio. | Os 6 alunos debruçados em livros abertos durante o intervalo, com cara de surpreso; corte para o quadro, onde aparece um **mapa mental** com "RECREIO" no centro e ramos "lanche", "pega-pega", "fila da cantina", "bola". | Livros abertos; mapa mental desenhado no quadro. | Alunos abaixam a cabeça nos livros (spring); o mapa mental se desenha sozinho, ramo por ramo (na palavra "mapa"). | Pílula "● ESTUDANDO O INTERVALO" vermelha.<br>Legenda: "intervalo", "mapa" e "recreio" em amarelo. |
| 00:58:27 - 01:10:12 | 1767 - 2112 | No dia da prova, o aluno que perguntou está na sua cadeira, de óculos e bigode, corrigindo as provas, porque foi o único que leu o plano de ensino. | Reviravolta: o Professor entra com as provas e encontra o **aluno de boné sentado na cadeira dele, com óculos redondos e bigode branco postiço** (igual ao do Professor), carimbando "CORRIGIDO". Close no Professor de boca aberta. | Óculos e bigode postiço no aluno; carimbo; pilha de provas; documento "PLANO DE ENSINO" na mão do aluno. | Professor para na porta (spring); aluno carimba (braço desce a cada 15 f); "PLANO DE ENSINO" levanta (na palavra "plano"). | **Cartão falso "PLANO DE ENSINO — Lido por: 1 pessoa"**.<br>Pílula "● CORRIGIDO ✓" verde. |
| 01:10:12 - 01:17:03 | 2112 - 2313 | Moral da história: nunca diga talvez pra quem tem grupo no celular. | Plano aberto: o aluno-professor dá aula para a turma, e o Professor senta numa carteira, de mão levantada. Vibração do celular: nova notificação do grupo. Card de seguir. | Notificação; card. | Câmera recua devagar; mão do Professor sobe (spring); card entra (spring) e o botão vira "Seguindo ✓". | Legenda: "talvez" e "celular" em amarelo.<br>Card "@professorpowerguido". |

**Soma estimada:** 2313 frames = 77,1 s. Com a voz real deve ficar entre 65 e 75 s.

## 3. Dados (Remotion)

`production/scene-plan.ts` tem as 10 cenas, com as mesmas falas, o texto falado (campo `delivery`), câmera, objetos, animações, selos e sons.

**Reaproveitado:** o motor dos vídeos anteriores (Professor, legendas, pílulas, cortes pela voz, câmera, efeitos de tela, card).

**Peças novas:**
- sala de aula;
- alunos;
- material escolar com rosto;
- cartões falsos ("DEFINIÇÃO TÉCNICA", notificação, plano de ensino);
- mapa mental no quadro.

## 4. Áudio

**Narração completa (184 palavras):**
Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez. Porque o talvez se espalha. Em trinta segundos, a sala cria um grupo chamado resumão definitivo, com trinta e oito pessoas e nenhum resumo. Isso é chamado de pânico acadêmico coletivo. Nesse caso, o correto é escrever no quadro: tudo cai. Só que o giz quebra no meio da palavra, porque giz não trabalha sob pressão. Aí o apagador pede férias, a caneta pede aumento, e o projetor só liga se você souber a senha do wi-fi. Esse procedimento é conhecido como greve do material escolar. Pra acabar com a greve, ofereça quinze minutos de intervalo. Mas cuidado: se eles aceitarem, o intervalo vira matéria de prova. Agora a turma passa o intervalo estudando o intervalo, e alguém já fez um mapa mental do recreio. No dia da prova, o aluno que perguntou está na sua cadeira, de óculos e bigode, corrigindo as provas, porque foi o único que leu o plano de ensino. Moral da história: nunca diga talvez pra quem tem grupo no celular.

- **Ritmo:** depois de gerar, confiro a velocidade (meta ~160–170 palavras/min) e as pausas (~0,4 s entre falas).
- **Efeitos:** "plim" de notificação (vários), giz quebrando (estalo), apito, sinal da escola (campainha), vibração do celular, carimbo ("tum").

## 5. Critérios de aceite

- [x] Formato do exemplo: história em corrente, nomes técnicos sérios, coisas aleatórias, reviravolta e moral (sem fato real, a pedido)
- [x] Piadas e falas próprias (nenhuma frase copiada das referências)
- [x] Voz estilo B, sem boca mexendo, legendas e card no padrão
- [ ] Fase 2: voz, render, conferência de imagem e som
