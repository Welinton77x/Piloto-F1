# Voz do canal (escolhida em 22/11/2026)

**"Voz 2"**: Will - Social media (`r3KkFedJ4n8aabIZ0RFQ`), modelo **eleven_multilingual_v2**, igual à referência do
"banho quente". Fala corrida, contando a história, um pouco mais devagar.

- stability 0.35 · similarity 0.8 · style 0.5 · speaker boost · **speed 0.88**
- sem marcações de emoção ([excited] etc.): o script tira sozinho quando o modelo é o v2

Comando:

```
NARR=narracao-X.txt VODIR=public/voX VOMP3=out/vozX-bruto.mp3 VOJSON=out/timingX-bruto.json \
VOICE_ID=r3KkFedJ4n8aabIZ0RFQ MODEL=eleven_multilingual_v2 STAB=0.35 STYLE=0.5 SPEED=0.88 \
GAP=0.35 GAP_IN=0.3 SUFFIX="" python3 scripts/voz_linhas.py
```

Amostra: `out/teste-voz/2-voz-igual-referencia.mp3`.
