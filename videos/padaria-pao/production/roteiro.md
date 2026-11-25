# Roteiro v1 — "Vai na padaria comprar um pão?"

Origem: escrito pelo agente a partir do tema do usuário. Status: **AGUARDANDO APROVAÇÃO**.

## 1. Briefing de produção

| Item | Definição |
| --- | --- |
| Tema | Como comprar pão na padaria (pão francês) do jeito certo, em 4 dicas |
| Recorte | Pão francês em padaria brasileira: horário da fornada, ponto do pão, venda por peso (regra do Inmetro), saco de papel × plástico |
| Público | Leigo, redes sociais (Reels / Shorts / TikTok) |
| Objetivo | Quem assiste sai sabendo 4 coisas práticas e um fato real sobre a compra do pão |
| Formato | Vertical 9:16, 1080 × 1920, 30 fps, **66 s (1980 frames)** |
| Tom | Bem-humorado, rápido, segunda pessoa, igual ao vídeo de referência |
| Protagonista | O **Professor** 3D (`personagens/professor`): cabelo branco, óculos, bigode, jaleco com física. **Sem boca mexendo**: só troca de expressão (feliz, surpreso, bravo, eureka, sereno) |
| Coadjuvante | **Padeiro** no mesmo estilo de brinquedo: chapéu de cozinheiro, avental branco sobre camiseta laranja |
| Cenário fixo | Uma padaria (diorama): balcão de madeira com faixa amarela "PADARIA", vitrine de vidro com pães, cesto de pães, balança digital, forno no fundo, prateleiras, janelão com prédios e céu azul, piso azul-acinzentado. Igual à sala da referência: um cenário só, a câmera passeia por ele |
| Voz | **ElevenLabs**, voz **"Will – Social media"** (`r3KkFedJ4n8aabIZ0RFQ`, brasileira, jovem, descontraída e dinâmica), modelo `eleven_multilingual_v2`, velocidade 1,05. Uma geração por cena (13 falas, ~900 caracteres no total). **Usa créditos da sua conta: a aprovação deste roteiro autoriza esse gasto.** |
| Legendas | Igual à referência: **uma palavra por vez**, branca, contorno escuro, no centro da tela (~y 1240 px); palavra-chave em **amarelo** |
| Gráficos | Título de abertura com palavra em caixa amarela; selo **"DICA N"** amarelo com contorno escuro no topo; **pílulas** brancas com bolinha colorida (vermelho = problema, verde = certo ✓, azul = informação); contador; selo **"FATO REAL · INMETRO"**; **card de seguir** no final |

**Sistema mostrado:** a compra do pão, do começo ao fim. Cada dica resolve um problema que aparece na tela: pão velho, pão claro demais, a dúvida sobre o preço e o pão murcho em casa.

**Premissas:** 66 s (perto dos 62 s da referência); nenhum preço ou horário exato (variam de padaria para padaria; só "pergunte o horário da fornada"); o @ do card final fica como `@seucanal` até você me dizer o seu.

Convenção de tempo: `MM:SS:FF` (FF de 00 a 29), intervalos semiabertos [início, fim). Coordenadas 3D em unidades do personagem (o professor tem ~4,4 u de altura). Balcão centrado em x=0, frente voltada para a câmera (+z).

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:05:00 | 0 - 150 | Vai na padaria comprar um pão? Então presta atenção nessas quatro dicas. | Plano aberto da padaria vista de cima (como o 1º plano da referência). O Professor entra pela direita andando até a frente do balcão; o padeiro espera atrás do balcão.<br>Câmera: alvo (0,1.5,0), raio 26→22, azimute 20°→12°, elevação 28°, FOV 24. | Padaria completa; Professor (andar, feliz); Padeiro (parado, feliz); vitrine cheia; cesto vazio. | `prof.x` 6→2.6 (frames locais 0–75, interpolate easeOut); ciclo de passos com física do jaleco (`CoatPhysics`), parada no f75 (jaleco balança para frente); câmera `radius` 26→22 (0–150, linear). | Título no topo (y 300): "Vai na padaria / comprar um **pão**?" com "pão" em caixa amarela, spring f0–12; some no f95 (fade 8 f).<br>Contador branco "4 DICAS" ao lado do Professor (spring f100). |
| 00:05:00 - 00:08:00 | 150 - 240 | Primeiro: descubra o horário da fornada. | Corte para close do Professor apontando para o forno no fundo, cara curiosa.<br>Câmera: alvo (1.8,2.8,0.5), raio 9, azimute −25°, elevação 6°. | Forno com porta fechada e luz laranja fraca. | Braço direito `point` (spring f0–10); `cam.az` −25°→−18° (deriva linear). | "**DICA 1**" amarelo no topo (y 300), spring f0–10 com overshoot. Legenda: "fornada" em amarelo. |
| 00:08:00 - 00:15:15 | 240 - 465 | Chegou fora de hora, só sobrou o pão de ontem. Na hora certa, o pão sai quentinho, estalando. | Parte A (f0–100): plano médio, cesto com 2 pães murchos e cinzentos; Professor com cara de bravo, segura um pão que verga.<br>Parte B (f100–225): padeiro abre o forno, vapor sobe, assadeira entra e pães dourados enchem o cesto; Professor com cara de eureka (lâmpada).<br>Câmera: alvo (0,1.8,0), raio 14→11, azimute 15°→−10°. | Pães velhos (achatados, cor bege-acinzentada); forno abre; partículas de vapor; 12 pães dourados; lâmpada. | `breadOld.sag` 0→0.4 (f20–50); `oven.door` 0→80° (f100–115, spring); vapor: 30 partículas com `random(seed)` subindo 0→2.5 u (f105–160); pães caem no cesto um a um (f120–180, 5 f de intervalo, spring com quique). | Pílula "● PÃO DE ONTEM" bolinha vermelha (f10) ancorada no cesto, com ✖ vermelho (f30).<br>Pílula "● QUENTINHO ✓" bolinha verde (f130).<br>Legenda: "ontem" em amarelo, "quentinho" em amarelo. |
| 00:15:15 - 00:20:00 | 465 - 600 | Segundo: peça o seu ponto. Mais moreninho ou mais clarinho. | Close na vitrine: dois pães lado a lado, um moreninho (marrom escuro) e um clarinho (bege claro). Professor de frente para a vitrine, curioso.<br>Câmera: alvo (−0.8,1.7,0.6), raio 8, azimute 5°→15°, elevação 12°. | Vitrine; pão moreninho; pão clarinho; placas brancas pequenas. | Pão moreninho sobe 0.3 u e gira 360° (f40–70, spring); pão clarinho faz o mesmo (f80–110). | "**DICA 2**" amarelo (f0).<br>Placas ancoradas: "MORENINHO" (f40) e "CLARINHO" (f80). |
| 00:20:00 - 00:26:12 | 600 - 792 | O padeiro escolhe um por um pra você. Ninguém precisa levar pão branquelo pra casa. | Padeiro pega pães com o pegador e põe no saco, um a um. Piada: um pão bem branquelo, com cara triste, é posto de volta e afunda na vitrine.<br>Câmera: alvo (−0.6,2.2,−0.4), raio 10, azimute −10°→5°, elevação 10°. | Pegador de pão; saco de papel pardo; pão branquelo com olhinhos e boca triste (só ele tem rosto). | Braço do padeiro `reach` 0→1→0 em 3 ciclos (f10–110, 33 f cada); pão branquelo sobe (f120) e volta (f150, spring); Professor: feliz → sereno (f150). | Pílula "● BRANQUELO ✖" bolinha vermelha ancorada no pão branquelo (f125).<br>Legenda: "branquelo" em amarelo. |
| 00:26:12 - 00:30:27 | 792 - 927 | Terceiro: o pãozinho é vendido por peso, não por unidade. | Close na balança digital no balcão; o saco de pão é colocado nela. Visor verde mostra o peso subindo.<br>Câmera: alvo (1.2,1.9,0.3), raio 7, azimute 20°→8°, elevação 18°. | Balança digital com visor; saco de papel com pães. | Saco desce sobre a balança (f20–35, spring); visor conta 0,000 → 0,520 kg (f35–70, interpolate easeOut; número esquemático). | "**DICA 3**" amarelo (f0).<br>Pílula "● PESO, NÃO UNIDADE" bolinha azul (f40).<br>Legenda: "peso" em amarelo. |
| 00:30:27 - 00:36:27 | 927 - 1107 | Fato real: pela regra do Inmetro, o pão francês só pode ser vendido a peso, | Plano médio: Professor de frente para a câmera com cara de surpreso; atrás dele surge um "carimbo" gigante de certificação balançando, estilo lousa.<br>Câmera: alvo (2.4,2.4,0.6), raio 12, azimute −5°→5°, elevação 8°. | Placa/carimbo 3D com balança desenhada (ícone, sem logotipo oficial). | Carimbo cai de y 8 → 3.5 (f10–25, spring com quique); Professor: surpreso (f10), eureka com lâmpada (f90). | Selo "**FATO REAL · INMETRO**" bolinha laranja (y 300, f5).<br>Legenda: "Inmetro" e "peso" em amarelo. |
| 00:36:27 - 00:40:24 | 1107 - 1224 | com o preço do quilo bem à vista no balcão. | Câmera desliza até uma plaquinha de preço presa ao balcão: "PÃO FRANCÊS · R$ __/kg" (valor deixado em branco de propósito). Professor aponta.<br>Câmera: alvo (0.2,1.4,0.9), raio 7, azimute 10°→−5°. | Plaquinha de preço com moldura amarela. | Plaquinha balança ±4° (f0–60, seno amortecido); seta azul 3D pulsa (escala 1→1.15, seno 1 Hz). | Pílula "● PREÇO DO KG À VISTA" bolinha azul (f15).<br>Legenda: "quilo" em amarelo. |
| 00:40:24 - 00:46:00 | 1224 - 1380 | Então, se pedir dez pães, quem decide o preço é a balança. | Professor levanta 10 dedos (duas mãos para cima), padeiro despeja pães no saco; volta para a balança, visor sobe.<br>Câmera: alvo (0.8,2.2,0.4), raio 12→9, azimute −15°→10°. | Saco maior; contador. | 10 pães caem no saco (f15–75, 6 f de intervalo); visor 0,000 → 0,500 kg (f80–110); contador 1→10 sincronizado com os pães. | Contador branco "10 PÃES" (f15, números trocando).<br>Pílula "● A BALANÇA DECIDE ✓" bolinha verde (f90). |
| 00:46:00 - 00:49:24 | 1380 - 1494 | Quarto: leve o pão no saco de papel. | Professor segura o saco de papel pardo, cara feliz.<br>Câmera: alvo (2.6,2.6,0.6), raio 9, azimute −20°→−8°, elevação 6°. | Saco de papel pardo com dobra no topo. | Saco sobe até a altura do peito (f5–20, spring); `cam.radius` 9→8. | "**DICA 4**" amarelo (f0).<br>Legenda: "papel" em amarelo. |
| 00:49:24 - 00:54:09 | 1494 - 1629 | No plástico, o vapor fica preso e a casca amolece. | Mesa de casa (fundo simples bege). Pão dentro de saco plástico transparente: gotas de vapor embaçam o saco e o pão murcha devagar. Professor com cara de bravo ao lado.<br>Câmera: alvo (0,1.4,0), raio 7, azimute 0°→10°, elevação 10°. | Saco plástico translúcido; gotinhas; pão. | Gotas aparecem (f10–60, 20 esferas com `random(seed)`, opacidade 0→0.8); `bread.sag` 0→0.5 e cor dourado→bege (f40–120, interpolate). | Pílula "● CASCA MOLE ✖" bolinha vermelha (f60).<br>Legenda: "vapor" e "amolece" em amarelo. |
| 00:54:09 - 00:59:06 | 1629 - 1776 | No papel, o pão respira e continua crocante até o café. | Mesma mesa, agora com saco de papel: Professor tira o pão e parte ao meio; farelos voam; caneca de café ao lado soltando vapor.<br>Câmera: alvo (0,1.6,0), raio 7→6, azimute −10°→5°. | Saco de papel; pão inteiro → 2 metades; farelos; caneca. | Pão parte (f60, as metades se afastam 0.4 u, spring); 25 farelos com `random(seed)` (f60–90); vapor da caneca em loop. | Pílula "● CROCANTE ✓" bolinha verde (f62).<br>Texto "CROC!" amarelo com contorno (f60, escala 0→1.2→1).<br>Legenda: "crocante" em amarelo. |
| 00:59:06 - 01:03:00 | 1776 - 1890 | Pronto: agora você é o professor da padaria. | Volta para a padaria. Professor no meio da loja comemora com os braços para cima (pose eureka, jaleco abre com a física), segurando o saco; padeiro aplaude.<br>Câmera: alvo (1.5,2.2,0.5), raio 16→13, órbita azimute −15°→15°. | Padaria completa; lâmpada; confete amarelo e branco. | Braços sobem (f10–25) com `CoatPhysics` (lift 0→1); salto `prof.y` 0→0.3→0 (f12–28); confete: 40 peças com `random(seed)` (f15–100). | Legenda: "professor" em amarelo. |
| 01:03:00 - 01:06:00 | 1890 - 1980 | *(sem fala)* | Mesmo plano aberto, câmera continua orbitando devagar; o card de seguir aparece no topo. | Card branco arredondado: avatar circular do Professor, "@seucanal", botão "Seguir" → "Seguindo ✓". | Card entra com spring (f0–12); botão troca para "Seguindo ✓" no f40 com pop de escala. | Card de seguir (y 380). |

**Soma:** 150+90+225+135+192+135+180+117+156+114+135+147+114+90 = **1980 frames = 66,0 s**. Contíguo, de 0 a 1979.

## 3. Estrutura de dados (Remotion)

Arquivo: `production/scene-plan.ts`, com todas as 14 cenas. Na Fase 2 ele vira `src/data/scenes.ts` sem tradução.

- A linha do tempo é **determinística**: tudo sai do frame atual (`useCurrentFrame`). Não há timers, `Date.now` nem `Math.random` (usa `random(seed)` do Remotion). Dentro de cada `<Sequence>` os componentes usam frames locais.
- A física do jaleco (`CoatPhysics`) é recalculada do frame 0 até o frame atual a cada quadro. Isso torna o resultado idêntico em qualquer ordem de renderização.
- **Camada 3D:** `@remotion/three` + R3F. O Professor vem de `personagens/professor/professor.js` como `<primitive>`; o Padeiro e a padaria são novos, no mesmo estilo.
- **Camada 2D:** HTML por cima, com título, "DICA N", pílulas, contador, legenda e card.
- Pílulas e placas ficam presas a pontos 3D, projetados com a câmera de cada quadro.

## 4. Áudio e montagem

**Narração completa (143 palavras):**
Vai na padaria comprar um pão? Então presta atenção nessas quatro dicas. Primeiro: descubra o horário da fornada. Chegou fora de hora, só sobrou o pão de ontem. Na hora certa, o pão sai quentinho, estalando. Segundo: peça o seu ponto. Mais moreninho ou mais clarinho. O padeiro escolhe um por um pra você. Ninguém precisa levar pão branquelo pra casa. Terceiro: o pãozinho é vendido por peso, não por unidade. Fato real: pela regra do Inmetro, o pão francês só pode ser vendido a peso, com o preço do quilo bem à vista no balcão. Então, se pedir dez pães, quem decide o preço é a balança. Quarto: leve o pão no saco de papel. No plástico, o vapor fica preso e a casca amolece. No papel, o pão respira e continua crocante até o café. Pronto: agora você é o professor da padaria.

- 143 palavras a ~160 palavras por minuto dá ~54 s de fala, mais pausas e o card final: cerca de 66 s.
- Os tempos acima são estimativas. Depois de gerar a voz, **os cortes passam a seguir a voz real**: cada fala começa ~0,25 s após o corte da cena, e as pausas entre falas ficam em 0,5–0,7 s. Legenda e animações ficam presas à palavra falada.
- **Efeitos (feitos por código, sem direitos de terceiros):** "pop" nas pílulas e nos selos DICA; "whoosh" nos cortes; "tsss" do vapor do forno; "plim" da balança; "croc" ao partir o pão; "tum" do carimbo; confete no final.
- **Trilha:** leve e alegre, feita por código, baixa durante a fala (−22 dB). Volume final normalizado em −14 LUFS.
- A boca do personagem não mexe; só a expressão do rosto muda.

## 5. Critérios de aceite

- [x] Gancho imediato (pergunta + promessa de 4 dicas em 5 s)
- [x] Cada dica mostra o problema antes da solução
- [x] Um cenário fixo (padaria), com saídas rápidas para a mesa de casa nas cenas 11 e 12
- [x] Final mostra o resultado (pão crocante + comemoração)
- [x] Tabela completa, frames contíguos, soma = 1980
- [x] Narração cabe no tempo
- [x] `scene-plan.ts` com as mesmas 14 cenas, falas e tempos
- [x] Nenhum preço ou horário inventado
- [x] Fato do Inmetro conferido em fontes (abaixo)
- [ ] Não verificado ainda (Fase 2): voz, render, imagem, som

**Fontes consultadas:**
- Venda do pão francês a peso: Portaria Inmetro nº 146/2006, substituída pela nº 181/2021, que mantém a venda "somente a peso" e exige o preço do quilo à vista perto do balcão. [Migalhas](https://www.migalhas.com.br/quentes/344335/preco-do-pao-frances-devera-ser-fixado-proximo-ao-balcao-de-venda), [Jus.com.br](https://jus.com.br/artigos/69642/pao-frances-vendido-por-unidade), [Diário do Comércio](https://diariodocomercio.com.br/mix/padarias-sao-proibidas-de-comercializar-pao-frances-por-unidade-e-agora-devem-vender-por-quilo-entenda-a-regra-do-inmetro/)
- Papel × plástico: o plástico segura o vapor e amolece a casca; o papel deixa o pão respirar e mantém a casca crocante. Vale para o mesmo dia e o seguinte; para mais tempo, o melhor é congelar. [TudoGostoso](https://www.tudogostoso.com.br/noticias/nem-no-saco-de-papel-nem-no-saco-plastico-esse-e-o-jeito-certo-para-armazenar-o-pao-frances-a16755.htm), [TudoGostoso (congelar)](https://www.tudogostoso.com.br/noticias/adeus-ao-pao-murcho-o-truque-do-tudogostoso-para-congelar-pao-frances-da-maneira-correta-sem-perder-a-crocancia-a29383.htm), [Olhar Digital](https://olhardigital.com.br/curiosidades/?p=34709)
