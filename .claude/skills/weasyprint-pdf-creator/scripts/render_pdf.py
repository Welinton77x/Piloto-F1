#!/usr/bin/env python3
"""Renderiza um template HTML (Jinja2) em PDF com WeasyPrint.

Uso:
    python render_pdf.py template.html saida.pdf [-d dados.json] [-c estilo.css ...]
"""
import argparse
import json
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import CSS, HTML
from weasyprint.text.fonts import FontConfiguration


def main() -> int:
    ap = argparse.ArgumentParser(description="HTML/Jinja2 -> PDF via WeasyPrint")
    ap.add_argument("template", type=Path, help="Template HTML (Jinja2)")
    ap.add_argument("output", type=Path, help="Arquivo PDF de saída")
    ap.add_argument("-d", "--data", type=Path, help="JSON com variáveis do template")
    ap.add_argument("-c", "--css", type=Path, action="append", default=[],
                    help="Folha de estilo extra (pode repetir)")
    args = ap.parse_args()

    if not args.template.is_file():
        print(f"Template não encontrado: {args.template}", file=sys.stderr)
        return 1

    data = {}
    if args.data:
        data = json.loads(args.data.read_text(encoding="utf-8"))

    tpl_dir = args.template.resolve().parent
    env = Environment(loader=FileSystemLoader(str(tpl_dir)),
                      autoescape=select_autoescape(["html", "xml"]))
    html_content = env.get_template(args.template.name).render(**data)

    font_config = FontConfiguration()
    stylesheets = [CSS(filename=str(c), font_config=font_config) for c in args.css]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    # base_url permite caminhos relativos (imagens, fontes) a partir do template
    HTML(string=html_content, base_url=str(tpl_dir)).write_pdf(
        str(args.output),
        stylesheets=stylesheets,
        font_config=font_config,
        presentational_hints=True,
    )
    print(f"PDF gerado: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
