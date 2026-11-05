set -ex
sudo apt-get update
sudo apt-get install -y ffmpeg libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm-dev libcups2 libxkbcommon-dev libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libasound2t64
unzip -q por-que-piloto-f1.zip
npx --yes create-video@latest --yes --blank --no-tailwind app
cd app
rm -rf src public
cp -r ../por-que-piloto-f1/project/{src,public,scripts,tsconfig.json,remotion.config.ts} .
npx remotion add @remotion/three @remotion/google-fonts
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
pip install edge-tts
python scripts/tts_edge.py
npx tsc --noEmit
npx remotion browser ensure
