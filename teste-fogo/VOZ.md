# Voz do canal (escolhida em 23/11/2026 — opção 2 do teste 14)

**Will - Social media** (`r3KkFedJ4n8aabIZ0RFQ`), modelo **eleven_v3**, natural e corrido,
gerado **numa chamada só** (texto inteiro), SEM tags de emoção.

- stability 0.5 · similarity 0.8 · style 0.6 · language_code pt
- roteiro no estilo da referência do pudim: frases longas e corridas, explicando o absurdo
  como se fosse normal ("Se você ..., isso é facinho de resolver. Primeiro, você precisa ...")

Comando:

```
VOICE_ID=r3KkFedJ4n8aabIZ0RFQ MODEL=eleven_v3 STAB=0.5 STYLE=0.6 \
NARR=narracao-X.txt VOMP3=public/vozX.mp3 VOJSON=src/timingX.json python3 scripts/voz_corrida.py
```

Amostra aprovada: `out/teste-voz/14-opcao-2.mp3`.
