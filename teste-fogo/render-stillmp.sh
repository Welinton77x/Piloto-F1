#!/bin/bash
# Uso: bash render-stillmp.sh 0 1 2 -> out/mpN.jpg (prévia dos personagens do mecânico)
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion bundle src/index.ts --out-dir=.cache/bundle --log=error >/dev/null 2>&1
for f in "$@"; do npx remotion still .cache/bundle MecPreview out/mp$f.jpg --frame=$f --gl=swangle --scale=0.5 --browser-executable=$B --log=error; done
