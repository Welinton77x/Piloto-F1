# Canal Por Dentro Lab

Kit de configuração do canal (YouTube Shorts, TikTok e Instagram Reels) para curiosos de 18 a 50 anos.

- **[guia/guia-do-canal.pdf](guia/guia-do-canal.pdf)**: guia completo: posicionamento, @, textos prontos para colar, passo a passo no YouTube Studio, TikTok/Instagram, fórmula dos Shorts, rotina, 10 ideias de vídeo, métricas e checklist.
- **[arte/avatar.png](arte/avatar.png)**: foto de perfil (800×800) para as três plataformas.
- **[arte/banner.png](arte/banner.png)**: banner do YouTube (2560×1440, texto dentro da área segura).

## Editar e gerar de novo

```bash
# arte (precisa do Playwright)
node canal/arte/gerar_arte.mjs

# guia em PDF (skill weasyprint-pdf-creator; precisa de: pip install weasyprint jinja2)
S=.claude/skills/weasyprint-pdf-creator
python $S/scripts/render_pdf.py canal/guia/guia.html canal/guia/guia-do-canal.pdf \
  -c $S/assets/base_print.css -c canal/guia/guia.css
```

Fonte: Montserrat (SIL Open Font License, ver `arte/fonts/LICENSE-Montserrat.txt`).
