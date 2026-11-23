# Voz do canal (escolhida em 23/11/2026 — opção A)

**Will - Social media** (`r3KkFedJ4n8aabIZ0RFQ`), modelo **eleven_v3**, gerada **numa chamada só** (texto inteiro),
nunca frase por frase.

- stability 0.0 · similarity 0.8 · style 0.8 · language_code pt
- uma tag de emoção por frase ([excited], [amused], [laughing], [mischievously], [proudly])
- frases corridas, poucas pausas, sem "..." picotando

Comando:

```
VOICE_ID=r3KkFedJ4n8aabIZ0RFQ MODEL=eleven_v3 STAB=0.0 STYLE=0.8 \
NARR=narracao-X.txt VOMP3=public/vozX.mp3 VOJSON=src/timingX.json python3 scripts/voz_corrida.py
```

Amostra aprovada: `out/teste-voz/10-will-animado-A.mp3`.
