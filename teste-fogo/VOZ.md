# Voz do canal (atualizada em 23/11/2026 — opção A do teste 13)

**Will - Social media** (`r3KkFedJ4n8aabIZ0RFQ`), modelo **eleven_v3**, gerada **frase por frase** (igual ao vídeo da escola).

- stability 0.0 · similarity 0.8 · style 0.6 · SUFFIX " [short pause]" · GAP 0.4 · GAP_IN 0.35
- texto: muitas exclamações, tags [excited]/[laughing] na maioria, ÊNFASE EM MAIÚSCULA nas palavras-chave
- "..." só nos nomes pomposos ("Esse... é o DERRETIMENTO ROMÂNTICO!")
- ritmo alvo ~2,5 palavras/s (igual à escola)

Comando:

```
VOICE_ID=r3KkFedJ4n8aabIZ0RFQ STAB=0.0 STYLE=0.6 SUFFIX=" [short pause]" GAP=0.4 GAP_IN=0.35 \
NARR=narracao-X.txt VODIR=public/voX VOMP3=out/vozX-bruto.mp3 VOJSON=out/timingX-bruto.json python3 scripts/voz_linhas.py
```

Amostra aprovada: `out/teste-voz/13-animado-style0.6.mp3`.
