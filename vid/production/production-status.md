# production-status — Por que o piloto de F1 parece só ficar sentado?
- Fase: 2 PARCIAL — código escrito offline; NÃO renderizado.
- Roteiro: v1, APROVADO pelo usuário em 2026-11-05 ("Eu aprovo"), sem alterações. Pendência opcional: frase de ligação na cena 4 ("Esses músculos" sem antecedente).
- Créditos ElevenLabs: autorizados. Nenhuma geração feita (ambiente sem rede para baixar o áudio).
- Personagem do canal: macacão/uniforme azul (calça, camisa, boné), aprovado; implementado em Parts.tsx (outfit "mechanic").
- Ambiente da sessão: Bash sem rede, sem Remotion/Three instalados => sem render.
- Escolha do usuário: opção 2 — projeto pronto para renderizar localmente (ver project/README.md).
- Verificado: sintaxe TS/TSX (0 erros), plano contíguo (11 cenas, 2940 f), SFX/trilha gerados por código (public/sfx).
- NÃO verificado: tipos (tsc), render, imagem, áudio, voz.
- Status final: NÃO CONCLUÍDO (sem MP4).

## v2 (ajustes visuais — conteúdo/narração aprovados inalterados)
- Braço do mascote corrigido (não atravessa mais o corpo); mãos, sapatos e chave inglesa.
- Câmeras reescritas para 9:16 (src/data/cameras.ts); sujeito enquadrado entre selos e legenda.
- Cenário externo persistente (grama, pista, zebras, árvores, morros, montanhas, nuvens) e palco de laboratório nas cenas internas.
- Legendas com palavras separadas; selos menores; rótulos e contadores em cartões brancos pequenos, sem sobreposição.
- Músculos do pescoço como segmentos (não deslocam ao engrossar).
- v3: boneco redesenhado (cabeça grande, rosto, corpo arredondado, mãos/sapatos), carro de F1 refeito (bico, asas, rodas com aro), coração em formato real, grama instanciada, árvores fora do caminho da câmera, enquadramento de cenas 5/8/10.
