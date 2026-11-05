set -ex
cd app
mkdir -p out
npx remotion still PilotoF1 out/frame-500.png --frame=500 --gl=swangle
for f in 60 200 900 1100 1400 1700 2000 2300 2550 2800; do
  npx remotion still PilotoF1 out/frame-$f.png --frame=$f --gl=swangle || true
done
npx remotion render PilotoF1 out/piloto-f1-raw.mp4 --gl=swangle --concurrency=100% --crf=17
ffmpeg -y -i out/piloto-f1-raw.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy -c:a aac out/piloto-f1.mp4
rm out/piloto-f1-raw.mp4
