# Roteiro v1 — "Vai cortar o cabelo?" (comédia aleatória)

Origem: escrito pelo agente a partir das ideias para o próximo vídeo. O usuário pediu "mais coisas aleatórias". Status: **AGUARDANDO APROVAÇÃO**.

Fórmula, a mesma do vídeo da padaria (que deu certo):
- narrador **animado** dando **4 dicas absurdas**, cada uma mais maluca que a anterior;
- **um fato real** no meio;
- **volta das piadas anteriores** no final;
- **pergunta** para quem assiste.

Novidade: **muito mais coisa aleatória**, com bichos que aparecem do nada (um pato e um leão), alarme, nuvem de chuva dentro da barbearia e um corte para o espaço.

## 1. Briefing

| Item | Definição |
| --- | --- |
| Tema | "Vai cortar o cabelo?": 4 dicas absurdas |
| Formato | Vertical 1080 × 1920, 30 fps, ~70–75 s (os cortes seguem a voz real) |
| Tom | Narrador **animado e engraçado**, no mesmo tom aprovado no vídeo da padaria |
| Voz | ElevenLabs **Will**, modelo `eleven_v3`, com marcações de emoção (empolgado, sussurro, risada, dramático). ~950 caracteres: **gasta créditos; a aprovação autoriza** |
| Personagens | **Professor** (protagonista, cabelo branco maluco, boca parada, só a expressão muda); **Barbeiro** (a "autoridade": bigode, avental listrado, pente atrás da orelha; expressões feliz, surpreso, pânico); **Pato** (atravessa a cena do nada e volta no final); **Leão** (na foto de referência e no final); **Professor astronauta** (corte para o espaço) |
| Cenário | **Barbearia** 3D: cadeira de barbeiro, espelho grande, poste listrado vermelho e branco, prateleira de produtos, janela com rua e prédios, piso xadrez. Mais um cenário rápido: **estação espacial** (corredor branco, janela com a Terra) |
| Gráficos | Os mesmos do vídeo da padaria: legenda palavra a palavra (palavra-chave em amarelo), título com caixa amarela, "DICA N", pílulas com bolinha colorida, "CÂMERA LENTA", "FATO REAL", card **@professorpowerguido** |

**Fatos reais (conferidos):**
1. Na Estação Espacial Internacional, os astronautas cortam o cabelo com uma máquina ligada a um aspirador, para os fios não saírem flutuando (NASA, ESA, Agência Espacial Canadense).
2. O cabelo cresce cerca de 1 cm por mês. Só aparece como piada visual (calendário), sem número na fala.

**Fios de piada que voltam no final:** o pato (aparece na dica 1, sai de topete no final), o leão (é a foto de referência e no final entra pedindo o mesmo corte) e a nuvem de cabelo.

## 2. Tabela cronológica (estimativa; os cortes seguem a voz depois de gerada)

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:04:24 | 0 - 144 | Vai cortar o cabelo? Então segue essas quatro dicas! | Plano aberto da barbearia. O Professor entra pela direita (jaleco com física), com o cabelo enorme balançando; o barbeiro gira a cadeira, convidando.<br>Câmera: alvo (0,2.6,0), raio 28→24, azimute 18°→10°. | Barbearia completa; Professor; Barbeiro; poste listrado girando. | `prof.x` 8→2.8 (f0–70, easeOut); `chair.rotY` 0→360° (f40–80, spring); poste: listras sobem em loop. | Título "Vai cortar o **cabelo**?" (caixa amarela), sai no f95.<br>Contador "4 DICAS" (f100). |
| 00:04:24 - 00:13:03 | 144 - 393 | Primeiro: leve uma foto de referência. Mas não de um corte. Leve a foto de um leão. | O Professor sentado na cadeira entrega um papel ao barbeiro. Close no papel: uma foto de leão com juba enorme. **O leão da foto ruge** e o vento do rugido bagunça o bigode do barbeiro. | Foto (quadro 3D com o leão desenhado); linhas de vento. | Papel passa da mão do Professor para a do barbeiro (f30–50, spring); corte para o close da foto (na palavra "leão"); leão: boca abre (f+5), câmera treme ±0.1 u; bigode balança (seno amortecido). | **DICA 1** (some após ~2,4 s).<br>Pílula "● REFERÊNCIA: LEÃO 🦁" laranja (na palavra "leão").<br>Legenda: "leão" em amarelo. |
| 00:13:03 - 00:19:03 | 393 - 573 | O barbeiro vai entender. E se um pato entrar, finge que é normal. | O barbeiro acena, sério, segurando a foto. **Do nada, um pato amarelo entra pela porta**, atravessa a barbearia na frente de todo mundo e senta na cadeira de espera. Os dois olham para o pato… e voltam ao normal. | Pato 3D (corpo, bico laranja, patinhas); cadeira de espera. | Pato anda de x 7 → x −2 com balanço (gingado seno 4 Hz) (f60–150); cabeças do Professor e do barbeiro acompanham o pato (rotY seguindo a posição do pato); pato pula na cadeira (f150, spring). | Pílula "● NORMAL ✓" verde (f155).<br>Legenda: "pato" e "normal" em amarelo. |
| 00:19:03 - 00:25:03 | 573 - 753 | Segundo: quando ele perguntar como vai ser, responda só: surpreenda-me. | Plano e contraplano: o barbeiro com tesoura e pente pergunta (pílula); o Professor responde de olhos fechados, misterioso (cara serena), com luz dramática. | Tesoura; pente. | Corte seco no meio da cena (na palavra "responda"); luz principal cai 40% na resposta (dramático). | **DICA 2**.<br>Pílula "● COMO VAI SER?" azul ancorada no barbeiro.<br>Pílula "● SURPREENDA-ME." vermelha ancorada no Professor. |
| 00:25:03 - 00:30:09 | 753 - 909 | Pronto: ele entrou em pânico e o alarme da barbearia disparou. | O barbeiro com cara de pânico, gotas de suor saltando; **uma sirene vermelha cai do teto e pisca**, a sala fica vermelha e piscando; o pato bate as asas desesperado. | Sirene giratória; gotas de suor; luz vermelha. | Sirene desce do teto (f5–20, spring) e gira; luz ambiente alterna branco/vermelho a 3 Hz; suor: 10 gotas (`random(seed)`) saltando; asas do pato batendo (rotZ ±40° a 8 Hz). | Pílula "● MODO PÂNICO" vermelha (f10).<br>Legenda: "pânico" e "alarme" em amarelo. |
| 00:30:09 - 00:38:06 | 909 - 1146 | Terceiro: desafie o barbeiro pra um duelo de penteado usando garfos. Barbeiro nunca recusa um garfo. | O Professor levanta da cadeira com um garfo gigante na mão; o barbeiro aceita e saca outro garfo do avental, como num faroeste. Os dois se encaram; uma bola de feno (tumbleweed) passa rolando entre eles. | 2 garfos gigantes; bola de feno; poeira. | Garfos surgem com brilho (f60, f80, spring); bola de feno rola x 6 → x −6 girando (f120–200); câmera faz o "zoom de faroeste" alternando os olhos dos dois (cortes de 15 f). | **DICA 3**.<br>Pílula "● DESAFIO ACEITO" azul (f100).<br>Legenda: "garfos" e "garfo" em amarelo. |
| 00:38:06 - 00:44:18 | 1146 - 1338 | No meio do duelo, seu cabelo vira uma nuvem e chove na barbearia inteira. | O duelo em **câmera lenta**: garfos penteando no ar; o cabelo do Professor se solta da cabeça, sobe, **vira uma nuvem cinza** e começa a chover (com um raiozinho); o barbeiro abre um guarda-chuva; o pato toma banho feliz. O Professor fica careca. | Nuvem (os tufos do cabelo se juntam); 80 gotas de chuva; raio; guarda-chuva; poças. | Tufos do cabelo sobem e se juntam em nuvem (f20–70, spring); cor branco→cinza (f60–80); chuva: gotas em loop (`random(seed)`); raio pisca (f100); guarda-chuva abre (f110, spring); tempo da animação a 0,35× nos f0–60. | Pílula "● CÂMERA LENTA" laranja (f5).<br>Pílula "● PREVISÃO: CHUVA 🌧" azul (f80).<br>Legenda: "nuvem" e "chove" em amarelo. |
| 00:44:18 - 00:51:12 | 1338 - 1542 | Quarto: se ele reclamar da bagunça, diga que podia ser pior. Podia ser no espaço. | O barbeiro, encharcado, reclama apontando a bagunça (poças, pato nadando); o Professor careca dá de ombros e aponta para cima… **a câmera sobe atravessando o teto** até o céu e as estrelas. | Barbearia molhada; poças; pato numa poça; céu estrelado. | Barbeiro: cara brava; braço apontando (spring); na palavra "espaço" a câmera sobe y 3 → 40 (f140–204, easeIn) atravessando o teto, o fundo escurece para azul-marinho com estrelas. | **DICA 4**.<br>Pílula "● BAGUNÇA ✖" vermelha ancorada no barbeiro.<br>Legenda: "espaço" em amarelo. |
| 00:51:12 - 01:00:15 | 1542 - 1815 | Fato real: no espaço, os astronautas cortam o cabelo com uma máquina ligada a um aspirador, pros fios não saírem voando. | **Estação espacial**: o Professor de astronauta (capacete aberto) flutua; outro astronauta corta o cabelo dele com uma máquina presa a um tubo de aspirador; os fios soltos flutuam e são sugados pelo tubo. Pela janela, a Terra gira. | Estação (corredor branco, painéis); janela com a Terra; máquina + tubo sanfonado; fios flutuando; astronauta ajudante. | Flutuação: corpos sobem/descem ±0.1 u (seno lento) e giram devagar; fios: 40 partículas flutuam e depois são puxadas para a boca do tubo (f80–200, interpolate); Terra: rotY contínua. | Selo "● FATO REAL · NASA" laranja no topo (f5).<br>Legenda: "aspirador" e "astronautas" em amarelo. |
| 01:00:15 - 01:09:18 | 1815 - 2088 | No fim, você sai careca, o pato sai de topete, e um leão entra pedindo o mesmo corte que o seu. | Volta à barbearia (seca). O Professor careca sai satisfeito; **o pato sai com um topete enorme** (de cabelo branco, o mesmo do Professor!); **um leão de verdade (cartunesco) entra pela porta**, senta na cadeira e mostra a foto do Professor careca para o barbeiro, que desmaia. | Pato com topete; leão 3D (juba, rabo); foto do Professor careca; barbeiro desmaiando. | Pato com topete atravessa (f40–120); leão entra x 8 → x 0.5 (f130–190, easeOut), pula na cadeira (f195, spring); foto vira para a câmera (f210); barbeiro cai para trás (rotX 0 → −80°, f225–245, spring). | Pílula "● CARECA ✓" verde (f10) no Professor.<br>Pílula "● TOPETE ✓" verde (f60) no pato.<br>Pílula "● O MESMO CORTE, POR FAVOR" vermelha (f200) no leão. |
| 01:09:18 - 01:15:18 | 2088 - 2268 | E você, corta ou deixa crescer? | Plano aberto da barbearia com todos: o leão careca na cadeira (o barbeiro cortou!), o pato de topete, o Professor careca acenando; o cabelo do Professor volta aos poucos (calendário na parede folheando sozinho, piada de ~1 cm por mês acelerado). Card de seguir. | Calendário de parede; os personagens. | Folhas do calendário voam (1 a cada 4 f); cabelo do Professor reaparece (escala 0→1, f60–150); card entra com spring (f90), botão "Seguindo ✓" (f130). | Legenda: "corta" e "crescer" em amarelo.<br>Card "@professorpowerguido" (f90). |

**Soma estimada:** 2268 frames = 75,6 s. Com a voz real deve ficar entre 65 e 75 s.

## 3. Dados (Remotion)

`production/scene-plan.ts` tem as 11 cenas, com as mesmas falas, câmera, objetos, animações, selos e sons da tabela.

**Reaproveitado do vídeo da padaria:**
- o Professor (com física do jaleco e expressões);
- legendas, pílulas, "DICA N", título e card;
- cortes que seguem a voz real;
- tremor e câmera lenta;
- o render determinístico.

**Peças novas:**
- barbearia e estação espacial;
- Barbeiro (com expressão de pânico);
- pato e leão;
- nuvem de cabelo com chuva;
- sirene;
- garfos e bola de feno;
- traje de astronauta e máquina de cortar com aspirador;
- calendário.

## 4. Áudio

**Narração completa (~165 palavras):**
Vai cortar o cabelo? Então segue essas quatro dicas! Primeiro: leve uma foto de referência. Mas não de um corte. Leve a foto de um leão. O barbeiro vai entender. E se um pato entrar, finge que é normal. Segundo: quando ele perguntar como vai ser, responda só: surpreenda-me. Pronto: ele entrou em pânico e o alarme da barbearia disparou. Terceiro: desafie o barbeiro pra um duelo de penteado usando garfos. Barbeiro nunca recusa um garfo. No meio do duelo, seu cabelo vira uma nuvem e chove na barbearia inteira. Quarto: se ele reclamar da bagunça, diga que podia ser pior. Podia ser no espaço. Fato real: no espaço, os astronautas cortam o cabelo com uma máquina ligada a um aspirador, pros fios não saírem voando. No fim, você sai careca, o pato sai de topete, e um leão entra pedindo o mesmo corte que o seu. E você, corta ou deixa crescer?

- **Interpretação** (marcações do `eleven_v3`, no tom aprovado):
  - empolgado na abertura e nas dicas;
  - sussurro em "Mas não de um corte…";
  - dramático em "surpreenda-me";
  - risada depois de "finge que é normal" e no final;
  - em pânico em "o alarme disparou".
- **Efeitos** (sintetizados): rugido (ruído grave filtrado), "quack" do pato, sirene, "tlim" dos garfos, vento de faroeste, chuva + trovão, "zum" do aspirador, a mesma trilha bem baixa.

## 5. Critérios de aceite

- [x] Fórmula da referência: dicas absurdas e cada vez mais malucas, fato real, volta das piadas anteriores no final, pergunta
- [x] Mais coisas aleatórias: pato, leão, alarme, nuvem de chuva, faroeste com bola de feno, viagem ao espaço
- [x] Fatos conferidos em fontes
- [x] Mesmo estilo de legendas e gráficos, sem boca mexendo, card @professorpowerguido
- [ ] Fase 2: voz, render, conferência de imagem e som

**Fontes:**
- Corte de cabelo no espaço com aspirador: [ESA — Hair clippers with vacuum device on the ISS](https://www.esa.int/spaceinimages/Images/2006/11/Hair_clippers_with_vacuum_device_on_the_ISS), [NASA — Andrew Morgan corta o cabelo de Alexander Skvortsov](https://www.nasa.gov/image-detail/astronaut-andrew-morgan-trims-the-hair-of-cosmonaut-alexander-skvortsov-48935678358-o/), [Agência Espacial Canadense — Haircut in space](https://asc-csa.gc.ca/eng/multimedia/search/video/18328), [Digital Trends](https://digitaltrends.com/news/watch-an-astronaut-have-a-haircut-in-microgravity-conditions)
- Crescimento do cabelo (~1 cm/mês): [Drogasil (especialista)](https://www.drogasil.com.br/blog/beleza/cabelo/quanto-tempo-demora-para-o-cabelo-crescer), [Drogaraia](https://www.drogaraia.com.br/blog/beleza/cabelo/quanto-tempo-leva-para-o-cabelo-crescer-mitos-verdades-e-o-que-realmente-funciona)
