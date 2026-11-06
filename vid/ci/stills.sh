#!/bin/bash
# Teste rápido: 2 imagens por cena (sem renderizar o vídeo todo).
set -e
bash vid/ci/montar.sh
cd app
mkdir -p out
python3 - > frames.txt <<'PY'
import json,re
src=open("src/data/scene-plan.ts",encoding="utf-8").read()
plan=[int(x) for x in re.findall(r'durationInFrames: (\d+),\s*\n?\s*narration',src)]
if len(plan)!=11: plan=[int(x) for x in re.findall(r'id: "s\d+".*?durationInFrames: (\d+)',src,flags=re.S)]
tm=json.load(open("src/data/timing.json"))
import math
t=0
for i,p in enumerate(plan,1):
    need=math.ceil(8+tm["s%d"%i]["duration"]*30+18)
    d=max(p,need)
    print("s%d_a"%i, t+70)
    print("s%d_b"%i, t+int(d*0.75))
    t+=d
PY
cat frames.txt
while read n f; do
  npx remotion still PilotoF1 out/$n.png --frame=$f --gl=swangle || echo "FALHOU $n"
done < frames.txt
