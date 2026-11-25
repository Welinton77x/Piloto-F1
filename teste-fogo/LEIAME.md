# Teste: poder do fogo

Teste curto (~11 s, vertical 1080x1920) feito com Remotion + three.js, no estilo
"elemento + narração + legendas palavra a palavra".

Cenas: apresentação (espiral de fogo + faixa "FOGO") → estala os dedos → a mão acende →
encosta no livro → o livro pega fogo.

## Como rodar
```
npm install
bash render-still.sh 50 150 300        # imagens de conferência em out/
npx remotion render src/index.ts TesteFogo out/teste-fogo.mp4 --gl=swangle
```

## Voz
Ainda sem narração (o gerador gratuito da ElevenLabs estava ocupado). Para colocar:
1. gerar `public/voz.mp3` e `src/timing.json` (scripts/voz.py ou o conector ElevenLabs);
2. em `src/Video.tsx`, trocar `HAS_VOICE = false` para `true` e renderizar de novo.
Os cortes das cenas seguem os tempos de cada palavra em `src/timing.json`.
