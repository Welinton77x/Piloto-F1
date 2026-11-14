#!/bin/bash
# Uso: bash render-stillh.sh 50 120 200 -> out/hNN.jpg (vídeo do chulé) (meia resolução). Gera o bundle uma vez.
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion bundle src/index.ts --out-dir=.cache/bundle --log=error >/dev/null 2>&1
for f in "$@"; do npx remotion still .cache/bundle Chule out/h$f.jpg --frame=$f --gl=swangle --scale=0.5 --browser-executable=$B --log=error; done
