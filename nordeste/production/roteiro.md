# Vídeo 6 — Por que o Nordeste tá tão quente?

**Versão:** v1 (AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas)  
**Canal:** Por Dentro Lab · **Formato:** Short vertical 1080 × 1920, 9:16, 30 fps

## 1. Briefing de produção

- **Tema:** o calor no Nordeste e por que ele está maior este ano, no formato do vídeo de referência "Por que o Sul do Brasil teve 7 tornados em 6 dias?" enviado pelo usuário.
- **Referência analisada:** quadros a cada 2 s e transcrição completa. Estrutura observada: pergunta no início → "Se você quer fazer X, começa com…" → cada ingrediente vira um passo ("Então você…", "Esse é o…") → mapa 3D estilizado da América do Sul explicando o "por que aqui" → El Niño como fator do ano → mito com ⏸/⏪ ("Ao contrário do que muita gente pensa…") → dicas práticas → "Parabéns, você entendeu…" + pergunta para comentar. Personagem grande no quadro, cabeça redonda, cabelo castanho, blusão com capuz e cordões, mochila; reações fortes (suor, língua de fora, olhos arregalados), deita no chão, anda, gesticula; balões e etiquetas com bolinha; títulos amarelos; confete no fim.
- **Personagem (pedido do usuário):** igual ao da referência em proporção e estilo, mas com **blusão AZUL**, **sem boné nem chapéu** (cabelo à mostra), **sem a bolinha no peito**, com mochila. Reações de calor: suor escorrendo, rosto vermelho, língua de fora, se abanando, pulando no chão quente, deitado na sombra.
- **Cenário:** sertão nordestino estilizado (chão rachado, caatinga seca, mandacaru, juazeiro, casinha de taipa), litoral com coqueiros, cidade com asfalto; mapa 3D do Brasil/Nordeste e do Pacífico no estilo do mapa da referência.
- **Ciência (fontes abaixo):** proximidade do Equador (sol alto o ano todo); semiárido seco e longe do mar; solo seco: sem evaporação, a energia do sol vira calor; ilha de calor urbana; El Niño "muito forte" (recorde de +2,47 °C na região Niño 3.4 em outubro de 2026): aquece o Pacífico, o ar sobe lá e desce sobre o Norte/Nordeste, inibindo nuvens e chuva; INMET/INPE preveem temperaturas acima da média até janeiro.
- **Duração estimada:** ~154 s (4625 frames). Voz Liam (speed 1,08).
- **Recursos:** ⏸ e ⏪ no meio da tela no mito do ventilador; ✕ vermelho e ✓ verde grandes; etiquetas com bolinha; títulos amarelos; sem círculos vermelhos; acabamento com fundo desfocado; física e animação do personagem (suor, pulos, andar, deitar).

## 2. Tabela cronológica

Convenção: MM:SS:FF (FF de 00 a 29), intervalos semiabertos [início, fim). Tempos estimados a ~153 palavras/min; serão recalculados pela voz real.

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 - 00:07:01 | 0 - 211 (s1) | Por que o Nordeste tá tão quente? Se você quer fazer um calorão, começa pelo sol. | Boneco (igual ao da referência: cabeça redonda, cabelo castanho, blusão AZUL com capuz e cordões, mochila cinza, sem boné/chapéu, sem bolinha no peito) parado no meio do sertão; suor pingando, língua de fora, se abanando com a mão. Sol enorme no céu. Câmera baixa, boneco grande no quadro. | sertão (chão rachado, cactos mandacaru, caatinga seca), sol, mascote | mascot.sweat; heatWaves | Pergunta grande: POR QUE O NORDESTE TÁ TÃO QUENTE? |
| 00:07:01 - 00:22:14 | 211 - 674 (s2) | O Nordeste fica pertinho da linha do Equador. Lá, o sol passa quase em cima da sua cabeça o ano todo, e os raios chegam retinhos, concentrados num pedaço pequeno do chão. Esse é o sol a pino. | Globo terrestre com a linha do Equador e o Nordeste marcado; raios de sol chegando retos no Nordeste e inclinados no Sul (mesma lanterna, mancha pequena e forte x mancha grande e fraca). Volta ao boneco: a sombra dele fica bem curtinha embaixo do pé. | globe, equatorLine, sunRays, mascotShadow | rays; shadow shrink | Etiqueta ● PERTO DO EQUADOR; título amarelo SOL A PINO |
| 00:22:14 - 00:35:18 | 674 - 1068 (s3) | Mas só sol não basta. No litoral, o mar e a brisa ainda refrescam. Então você vai pro interior, longe do mar, onde quase não chove. Esse é o sertão, o semiárido. | Mapa 3D do Nordeste (como o mapa da referência): litoral com coqueiros e setas azuis de brisa; o boneco anda para o interior e a cor do mapa vai de verde a laranja. | nordesteMap, coast, breezeArrows, sertão | map color gradient; mascot walk | Etiqueta ● LITORAL: BRISA DO MAR; título amarelo SERTÃO / SEMIÁRIDO |
| 00:35:18 - 00:52:16 | 1068 - 1576 (s4) | E repara: quando tem água no chão, parte do calor vai pra evaporar essa água, igual o suor esfria a sua pele. Mas a terra do sertão tá seca. Então toda a energia vai direto pra esquentar o chão e o ar. | Lado a lado: chão úmido soltando vapor (setas de calor indo para o vapor) x chão seco rachado com as setas de calor entrando no chão, que fica vermelho. O boneco pisa e pula (chão queimando o pé). | wetSoil, steam, drySoil, heatArrows | soil.heat ↑; mascot hop | ✓ CHÃO ÚMIDO, ✕ CHÃO SECO; etiqueta ● SEM ÁGUA, TUDO VIRA CALOR |
| 00:52:16 - 01:05:08 | 1576 - 1958 (s5) | Agora junta isso com a cidade. Asfalto e concreto guardam o calor do dia e soltam de noite. Essa é a ilha de calor. Por isso, a noite quase não refresca. | Cidade nordestina de dia (prédios, asfalto), setas de calor entrando; anoitece (lua) e o calor sai do asfalto em ondas; o boneco na cama se abanando, sem conseguir dormir. | city, asphalt, heatWaves, moon, bed, mascot | day→night; heat out | Título amarelo ILHA DE CALOR |
| 01:05:08 - 01:20:21 | 1958 - 2421 (s6) | E esse ano ainda tem El Niño. Lá longe, no oceano Pacífico, perto do Peru, a água do mar fica bem mais quente que o normal. Em outubro, ele bateu recorde e virou um El Niño muito forte. | Mapa da América do Sul e do Pacífico (como o mapa da referência); mancha laranja/vermelha crescendo no mar perto do Peru; termômetro do mar subindo. | southAmericaMap, pacific, warmPatch, seaThermometer | patch grow | Título amarelo EL NIÑO; etiqueta ● MUITO FORTE: RECORDE EM OUTUBRO |
| 01:20:21 - 01:42:18 | 2421 - 3078 (s7) | Essa água quente faz o ar subir lá no Pacífico. Só que todo ar que sobe precisa descer em algum lugar. E ele desce justo em cima do Norte e do Nordeste. Ar descendo segura as nuvens, então não chove. Céu limpo, sol direto e chão ainda mais seco. É o calorão ficando ainda maior. | No mapa: seta laranja subindo do Pacífico, fazendo um arco por cima do continente e descendo (seta azul/branca) sobre o Nordeste; as nuvens sobre o Nordeste somem; o Nordeste fica vermelho; volta ao boneco suando ainda mais. | arrowUp, arrowArc, arrowDown, clouds, nordeste | clouds fade; map red | Etiqueta ● AR QUE DESCE = SEM NUVEM; ✕ SEM CHUVA |
| 01:42:18 - 01:59:16 | 3078 - 3586 (s8) | Aí muita gente liga o ventilador achando que ele esfria o ar. Ao contrário do que muita gente pensa, ventilador não esfria nada: ele só sopra o ar pra secar o seu suor mais rápido. Sem água no corpo, nem ele ajuda. | ⏸ no meio da tela: o boneco na frente do ventilador, termômetro do quarto não muda; ⏪ no meio; close no suor evaporando com o vento. | fan, roomThermometer, sweat | pause; rewind; sweat evaporates | ✕ NÃO ESFRIA O AR; etiqueta ● SÓ SECA O SUOR |
| 01:59:16 - 02:16:26 | 3586 - 4106 (s9) | Então bebe água antes de sentir sede, foge do sol entre dez da manhã e quatro da tarde, usa roupa clara e leve e fica de olho nos idosos e nas crianças, que sentem mais. E acompanha os alertas de onda de calor. | O boneco bebe uma garrafa d'água (✓); relógio 10h–16h com sol riscado; ele troca para roupa clara; vó e criança na sombra com água; celular com ALERTA DE ONDA DE CALOR. | bottle, clock, shade, grandma, kid, phoneAlert | checks | ✓ ÁGUA, ✓ SOMBRA 10H–16H, ✓ ROUPA CLARA, ✓ IDOSOS E CRIANÇAS |
| 02:16:26 - 02:34:05 | 4106 - 4625 (s10) | Parabéns, agora você sabe por que o Nordeste tá tão quente! E aí, qual foi a temperatura mais alta que você já pegou na sua cidade? Comenta aí embaixo, e diz o que você quer ver no próximo vídeo. | O boneco na sombra de um juazeiro, com água, aliviado; confete saindo dos cantos. | tree, mascot, confetti | confetti | Pergunta final QUAL A TEMPERATURA MAIS ALTA NA SUA CIDADE? COMENTA AÍ! |

Soma: 4625 frames contíguos (0 a 4624).

## 3. Narração integral

**s1.** Por que o Nordeste tá tão quente? Se você quer fazer um calorão, começa pelo sol.

**s2.** O Nordeste fica pertinho da linha do Equador. Lá, o sol passa quase em cima da sua cabeça o ano todo, e os raios chegam retinhos, concentrados num pedaço pequeno do chão. Esse é o sol a pino.

**s3.** Mas só sol não basta. No litoral, o mar e a brisa ainda refrescam. Então você vai pro interior, longe do mar, onde quase não chove. Esse é o sertão, o semiárido.

**s4.** E repara: quando tem água no chão, parte do calor vai pra evaporar essa água, igual o suor esfria a sua pele. Mas a terra do sertão tá seca. Então toda a energia vai direto pra esquentar o chão e o ar.

**s5.** Agora junta isso com a cidade. Asfalto e concreto guardam o calor do dia e soltam de noite. Essa é a ilha de calor. Por isso, a noite quase não refresca.

**s6.** E esse ano ainda tem El Niño. Lá longe, no oceano Pacífico, perto do Peru, a água do mar fica bem mais quente que o normal. Em outubro, ele bateu recorde e virou um El Niño muito forte.

**s7.** Essa água quente faz o ar subir lá no Pacífico. Só que todo ar que sobe precisa descer em algum lugar. E ele desce justo em cima do Norte e do Nordeste. Ar descendo segura as nuvens, então não chove. Céu limpo, sol direto e chão ainda mais seco. É o calorão ficando ainda maior.

**s8.** Aí muita gente liga o ventilador achando que ele esfria o ar. Ao contrário do que muita gente pensa, ventilador não esfria nada: ele só sopra o ar pra secar o seu suor mais rápido. Sem água no corpo, nem ele ajuda.

**s9.** Então bebe água antes de sentir sede, foge do sol entre dez da manhã e quatro da tarde, usa roupa clara e leve e fica de olho nos idosos e nas crianças, que sentem mais. E acompanha os alertas de onda de calor.

**s10.** Parabéns, agora você sabe por que o Nordeste tá tão quente! E aí, qual foi a temperatura mais alta que você já pegou na sua cidade? Comenta aí embaixo, e diz o que você quer ver no próximo vídeo.

**Contagem:** 376 palavras → ~144 s de fala + pausas ≈ 154 s.

## 4. Áudio e montagem
- Voz Liam (ElevenLabs, speed 1,08), uma faixa por cena, com tempos por palavra.
- Sons: cigarras/calor do sertão (baixo), vento da brisa, ventilador, chiado de chão quente, gole d'água, sons de reação do mascote (ufa, ôô, comemoração), confete. Trilha leve.

## 5. Rigor do conteúdo e fontes
- El Niño muito forte, anomalia recorde de +2,47 °C (Niño 3.4) em outubro de 2026: Brasil 61 (06/11/2026).
- Painel El Niño 2026-2027 (INMET/INPE): temperaturas acima da média de nov/2026 a jan/2027; maior risco de seca no norte do Nordeste.
- Mecanismo (circulação de Walker): ar que sobe no Pacífico aquecido e desce sobre o Norte/Nordeste do Brasil, reduzindo nuvens e chuva — explicação geral, sem números.
- Ventilador: não reduz a temperatura do ar; aumenta a evaporação do suor (explicação geral). Dicas de calor: gerais de saúde (hidratação, evitar sol forte no meio do dia, roupa clara, atenção a idosos e crianças).
- Não citamos temperaturas recorde de cidades específicas (não confirmadas).

## 6. Critérios de aceite
Gancho com a pergunta; cada ingrediente do calor mostrado antes do nome; mapa explicando o El Niño; mascote de blusão azul sem boné/chapéu/bolinha em todas as cenas, grande no quadro, com reações e física sem atravessar objetos; duração até 2:45.
