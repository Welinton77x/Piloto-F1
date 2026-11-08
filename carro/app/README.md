# Por que a rua fica alagada depois da chuva? (Remotion)

Roteiro aprovado: `../production/roteiro.md` (v2). Dados: `src/data/scene-plan.ts` (cópia do plano com ajustes de enquadramento) e `src/data/timing.json` (tempos por palavra da voz Liam).

```bash
cd rua-alagada/app
npm install
# voz (uma vez, cobra créditos): ELEVENLABS_API_KEY=... python scripts/tts_elevenlabs.py
python scripts/make_sfx.py                 # efeitos e trilha (sem direitos de terceiros)
npx tsc --noEmit
npx remotion studio                        # prévia
npx remotion render RuaAlagada out/rua-alagada-raw.mp4 --gl=angle --concurrency=4 --crf=17
# sem GPU (ex.: nuvem): --gl=swangle e, se precisar, REMOTION_BROWSER=/caminho/do/chrome-headless-shell
# loudness final (−14 LUFS / −1,5 dBTP), sem reprocessar o vídeo:
ffmpeg -i out/rua-alagada-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/rua-alagada.mp4
```
