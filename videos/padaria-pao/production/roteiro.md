# Roteiro v2 — "Vai na padaria comprar pão?" (versão comédia)

Origem: reescrito pelo agente depois do pedido do usuário ("tem que ter coisas aleatórias", como na referência). A v1 (informativa) ficou em `roteiro-v1.md`. Status: **AGUARDANDO APROVAÇÃO**.

## Como a referência funciona (transcrição + quadros)

O narrador dá **dicas absurdas com a cara mais séria do mundo**, e cada uma é mais maluca que a anterior:
1. Encarar o sargento e dizer "Eu sou o chefe aqui".
2. Desafiar o sargento pra um duelo de Beyblade ("militar não foge de duelo").
3. Mostrar clipes do Call of Duty como experiência de combate.
4. Virar um pombo-correio que escreve.

No meio entra **um fato real** amarrado na piada (o pombo que salvou quase 200 soldados na Primeira Guerra). O final **volta numa piada anterior** (a carta do sargento pedindo revanche no Beyblade) e termina com uma **pergunta** para quem está assistindo.

Na tela: o personagem faz as loucuras de verdade (sobe na mesa, papéis voam, a câmera treme), aparecem pílulas com as falas ("● EU SOU O CHEFE AQUI!", "● DESAFIO ACEITO", "● CÂMERA LENTA") e selos "DICA N".

A v2 usa **essa fórmula com piadas próprias**. Não copia nenhuma fala, nenhum personagem e nenhum @ da referência.

## 1. Briefing

| Item | Definição |
| --- | --- |
| Tema | "Vai na padaria comprar pão?": 4 dicas absurdas, com um fato real no meio |
| Público | Redes sociais (Reels / Shorts / TikTok) |
| Formato | Vertical 1080 × 1920, 30 fps, ~62–67 s (os cortes seguem a voz real) |
| Tom | Narrador sério e confiante dando conselhos ridículos (humor seco) |
| Personagens | **Professor** (protagonista; a boca não mexe, só a expressão muda) e **Padeiro** (a "autoridade", como o sargento da referência; ganha expressões de bravo e surpreso) |
| Cenário | A mesma padaria 3D da v1 (balcão "PADARIA", vitrine, balança, forno, prateleiras, janelão) + a mesa de casa no final |
| Voz | ElevenLabs **Will** (`r3KkFedJ4n8aabIZ0RFQ`), já escolhida por você. Nova geração de ~850 caracteres: **gasta créditos; a aprovação autoriza** |
| Legendas e gráficos | Iguais à v1 (estilo da referência). Pílulas com as "falas" e "CÂMERA LENTA"; card **@professorpowerguido** no final |

**Fato real usado:** o pão francês só pode ser vendido a peso, com o preço do quilo à vista (Portaria Inmetro 146/2006, mantida pela 181/2021). Fontes no fim.

**O fio da piada:** o Professor humilha o padeiro no pingue-pongue de pão de forma (dica 2). No final o sonho vem com um bilhete do padeiro pedindo revanche (volta na piada) e, no último plano, os dois estão jogando de novo.

## 2. Tabela cronológica (estimativa; os cortes seguem a voz depois de gerada)

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:04:27 | 0 - 147 | Vai na padaria comprar pão? Então segue essas quatro dicas. | Plano aberto da padaria. O Professor entra andando pela direita até o balcão (jaleco com física); o padeiro espera.<br>Câmera: alvo (1.9,2.4,0.3), raio 30→26, azimute 20°→12°. | Padaria completa; Professor; Padeiro. | `prof.x` 8.5→3.1 (f0–70, easeOut); parada no f70 com o jaleco balançando. | Título "Vai na padaria comprar **pão**?" (caixa amarela em "pão"), spring f0, sai no f95.<br>Contador "4 DICAS" (f100). |
| 00:04:27 - 00:11:06 | 147 - 336 | Primeiro: ao entrar, não diga bom dia. Olhe fundo nos olhos do padeiro e fale a senha secreta: | Close do Professor sério (bravo), olhos semicerrados; a câmera aproxima devagar como em filme de faroeste. Contraplano rápido do padeiro confuso. | Reflexo brilhando nos óculos (estrela branca). | `cam.radius` 12→8 (dolly lento, linear); brilho nos óculos: escala 0→1→0 (f90–105). Corte para o padeiro (f120–150) e volta. | **DICA 1** (f0).<br>Pílula "● BOM DIA ✖" vermelha (f40).<br>Legenda: "senha secreta" em amarelo. |
| 00:11:06 - 00:17:03 | 336 - 513 | "O pão é francês, mas eu sou brasileiro." Ele vai saber que você é profissional. | O Professor bate a mão no balcão: papéis e farinha voam, a câmera treme. O padeiro fica surpreso e bate continência. | Nuvem de farinha (partículas); papéis voando. | Tremor de câmera ±0.08 u (f10–25, seno amortecido); farinha: 30 partículas `random(seed)` (f10–60); braço do padeiro em continência (f60, spring). | Pílula de fala "● O PÃO É FRANCÊS, MAS EU SOU BRASILEIRO!" vermelha (f5).<br>Pílula "● PROFISSIONAL ✓" verde (f110). |
| 00:17:03 - 00:24:12 | 513 - 732 | Segundo: se o pão vier clarinho, desafie o padeiro pra uma partida de pingue-pongue com pão de forma. | Na vitrine aparece o pão branquelo (com carinha triste). O Professor aponta para o padeiro. Duas fatias de pão de forma surgem nas mãos de cada um e uma baguete deitada vira a rede no balcão. | Pão branquelo; 2 fatias de pão de forma (raquetes); baguete (rede); bolinha branca. | Pão branquelo sobe e gira (f20–50, spring); fatias surgem com pop (f120, f130); baguete cai no balcão (f140–155, spring com quique). | **DICA 2** (f0).<br>Pílula "● CLARINHO ✖" vermelha no pão (f30).<br>Legenda: "pingue-pongue" em amarelo. |
| 00:24:12 - 00:30:09 | 732 - 909 | Ele vai aceitar. Padeiro acorda antes do sol, não tem medo de nada. | A partida: a bolinha vai e volta sobre a baguete; o padeiro com cara de bravo, o Professor concentrado. Final em câmera lenta: cortada do Professor, bolinha passa raspando no chapéu do padeiro. | Bolinha; rastro da bolinha. | Bolinha em arco parabólico entre as fatias (ciclo de 20 f, 4 ciclos); últimos 50 f com tempo a 0,3× e rastro; o chapéu do padeiro voa (f150, spring). | Pílula "● DESAFIO ACEITO" azul (f5).<br>Pílula "● CÂMERA LENTA" laranja (f120). |
| 00:30:09 - 00:35:15 | 909 - 1065 | Terceiro: quando ele perguntar "mais alguma coisa?", responda: "só a felicidade". | Plano e contraplano: o padeiro pergunta (pílula); o Professor responde de olhos fechados, sereno, com a mão no peito. | — | Câmera troca de lado na fala do Professor (no meio da cena, corte seco). | **DICA 3** (f0).<br>Pílula "● MAIS ALGUMA COISA?" azul (f40), ancorada no padeiro.<br>Pílula "● SÓ A FELICIDADE." vermelha (f100), ancorada no Professor. |
| 00:35:15 - 00:41:00 | 1065 - 1230 | Ele vai te entregar um sonho. Que, convenhamos, é quase a mesma coisa. | O padeiro estende um **sonho** (doce redondo com açúcar e creme) que brilha com raios de luz; o Professor recebe, emocionado. | Sonho brilhando; raios de luz girando atrás dele; brilhinhos. | Sonho sobe da vitrine até a mão do Professor (f10–40, spring); raios giram 20°/s; brilho pulsa (seno). | Pílula "● SONHO ✓" verde (f20).<br>Legenda: "sonho" e "felicidade" em amarelo. |
| 00:41:00 - 00:45:24 | 1230 - 1374 | Quarto: suba na balança e peça o seu peso em pão. | O Professor sobe no balcão e fica em pé em cima da balança (como o garoto em cima da mesa na referência). O visor enlouquece. | Balança; visor. | `prof.y` 0→1.77 com pulinho (f15–35, spring); visor rola números aleatórios (`random(seed)`) e para em 72,000 kg (f40–90). | **DICA 4** (f0).<br>Pílula "● 72 KG DE PÃO, POR FAVOR" vermelha (f60). |
| 00:45:24 - 00:53:03 | 1374 - 1593 | Parece loucura, mas o pão francês só pode ser vendido a peso. É regra do Inmetro, de verdade. | O carimbo "A PESO ✓" cai do alto ao lado do Professor (como na v1). Depois chove pão do teto e forma uma pilha no balcão. | Carimbo; ~60 pães caindo e se acumulando. | Carimbo cai y 10→1.15 (f10–25, spring com quique); chuva de pão: 60 pães, cada um começa a cair num momento sorteado (`random(seed)`) entre f80 e f190 e para na pilha. | Selo "● FATO REAL · INMETRO" laranja no topo (f5).<br>Legenda: "Inmetro" e "peso" em amarelo. |
| 00:53:03 - 01:01:15 | 1593 - 1845 | Pronto: você saiu com setenta quilos de pão. E dentro do sonho tem um bilhete do padeiro pedindo revanche no pingue-pongue. | Na casa: a mesa está tomada por pão. O Professor abre o sonho e sai um bilhete; close no bilhete. Ele faz cara de bravo e ergue a fatia de pão de forma (aceita o desafio). | Montanha de pão na mesa; sonho aberto; bilhete "REVANCHE. AMANHÃ, 6H. — PADEIRO". | Bilhete sai do sonho e gira até a câmera (f110–140, spring); Professor: surpreso → bravo (f150); fatia sobe (f170, spring). | Pílula "● 70 KG DE PÃO ✓" verde (f20).<br>Pílula "● REVANCHE" vermelha (f150). |
| 01:01:15 - 01:07:15 | 1845 - 2025 | E você, pede o pão moreninho ou clarinho? | Volta à padaria: plano aberto, os dois jogando a revanche, com a bolinha indo e voltando; a câmera orbita devagar. Aparece o card de seguir. | Os mesmos objetos da partida; confete. | Partida em loop (ciclo de 20 f); card entra com spring (f80) e o botão vira "Seguindo ✓" (f120). | Legenda: "moreninho" e "clarinho" em amarelo.<br>Card "@professorpowerguido" (f80). |

**Soma estimada:** 2025 frames = 67,5 s. Com a voz real deve ficar entre 60 e 65 s.

## 3. Dados (Remotion)

`production/scene-plan.ts` (v2) tem as 11 cenas com as mesmas falas, câmera, objetos, animações, selos e sons desta tabela. O motor da v1 é reaproveitado: a física do jaleco, as legendas palavra a palavra, as pílulas presas a pontos 3D, os cortes que seguem a voz e o render determinístico.

**Peças novas:**
- fatias de pão de forma, bolinha, baguete-rede e sonho;
- bilhete e chuva/pilha de pão;
- tremor de câmera e câmera lenta;
- expressões do padeiro (feliz, bravo, surpreso) e continência;
- Professor em pé sobre a balança.

## 4. Áudio

**Narração completa (~150 palavras):**
Vai na padaria comprar pão? Então segue essas quatro dicas. Primeiro: ao entrar, não diga bom dia. Olhe fundo nos olhos do padeiro e fale a senha secreta: "O pão é francês, mas eu sou brasileiro." Ele vai saber que você é profissional. Segundo: se o pão vier clarinho, desafie o padeiro pra uma partida de pingue-pongue com pão de forma. Ele vai aceitar. Padeiro acorda antes do sol, não tem medo de nada. Terceiro: quando ele perguntar "mais alguma coisa?", responda: "só a felicidade". Ele vai te entregar um sonho. Que, convenhamos, é quase a mesma coisa. Quarto: suba na balança e peça o seu peso em pão. Parece loucura, mas o pão francês só pode ser vendido a peso. É regra do Inmetro, de verdade. Pronto: você saiu com setenta quilos de pão. E dentro do sonho tem um bilhete do padeiro pedindo revanche no pingue-pongue. E você, pede o pão moreninho ou clarinho?

- **Voz:** Will, num tom mais sério e firme, para o contraste com o absurdo fazer graça.
- **Efeitos novos:** "tum" da mão no balcão, "toc-toc" da bolinha, "whoosh" lento na câmera lenta, coro "aaah" sintetizado no sonho, sons de pão caindo na chuva de pão.
- **Trilha:** a mesma, um pouco mais alta nas pausas.

## 5. Critérios de aceite

- [x] Formato da referência: dicas absurdas e cada vez mais malucas, um fato real no meio, volta numa piada anterior no final, pergunta para quem assiste
- [x] Piadas e falas próprias (nada copiado da referência)
- [x] Fato do Inmetro conferido
- [x] Legendas, pílulas, "DICA N" e card no mesmo estilo
- [x] Sem boca mexendo
- [ ] Fase 2: voz, render, conferência de imagem e som

**Fontes:** [Migalhas — Portaria Inmetro 181/2021](https://www.migalhas.com.br/quentes/344335/preco-do-pao-frances-devera-ser-fixado-proximo-ao-balcao-de-venda), [Jus.com.br — Portaria 146/2006](https://jus.com.br/artigos/69642/pao-frances-vendido-por-unidade), [Diário do Comércio](https://diariodocomercio.com.br/mix/padarias-sao-proibidas-de-comercializar-pao-frances-por-unidade-e-agora-devem-vender-por-quilo-entenda-a-regra-do-inmetro/)
