#!/bin/bash
# Monta o projeto Remotion a partir da pasta vid/ (rodar na raiz do repositório).
set -e
sudo apt-get update -y >/dev/null
sudo apt-get install -y ffmpeg libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm-dev libcups2 libxkbcommon-dev libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libasound2t64 >/dev/null
npx --yes create-video@latest --yes --blank --no-tailwind app
cd app
rm -rf src public
cp -r ../vid/src ../vid/scripts ../vid/tsconfig.json ../vid/remotion.config.ts .
mkdir -p public
[ -d ../vid/public ] && cp -r ../vid/public/. public/ || true
npx remotion add @remotion/three @remotion/google-fonts
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
node scripts/make_sfx.mjs
if [ -f public/vo/s1.mp3 ] && [ -f src/data/timing.json ] && [ -f ../vid/VOZ_OK.txt ]; then echo "usando voz Liam ja gerada"; else pip install edge-tts; python scripts/tts_edge.py; fi
npx tsc --noEmit 2>&1 | tee ../tsc.log
npx remotion browser ensure
