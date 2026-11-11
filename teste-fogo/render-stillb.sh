#!/bin/bash
# Uso: bash render-still.sh 50 120 200   -> gera out/fNN.jpg (meia resolução)
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
for f in "$@"; do npx remotion still src/index.ts Birmingham out/b$f.jpg --frame=$f --gl=swangle --scale=0.5 --browser-executable=$B --log=error; done
