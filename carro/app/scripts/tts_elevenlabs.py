"""Narração do vídeo 4 (carro) com ElevenLabs, voz Liam + tempos por palavra.
Uso (uma vez; cobra créditos a cada execução):
    ELEVENLABS_API_KEY=... python carro/app/scripts/tts_elevenlabs.py
Lê src/data/scene-plan.ts, escreve public/vo/sN.mp3 e src/data/timing.json.
Roteiro v5 aprovado: speed 1,08 para caber em ~2:45."""
import base64, json, os, re, subprocess, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")  # Liam (escolha do usuário no roteiro v5)
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
SETTINGS = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "use_speaker_boost": True, "speed": 1.08}

src = (ROOT / "src/data/scene-plan.ts").read_text(encoding="utf-8")
items = re.findall(r'voKey: "(s\d+)".*?narration: "((?:[^"\\]|\\.)*)"', src, flags=re.S)
assert len(items) == 10, len(items)
# TTS_ONLY="s11" regenera só essas cenas e mantém as demais (economiza créditos)
ONLY = [x for x in os.environ.get("TTS_ONLY", "").replace(",", " ").split() if x]


def dur(p: Path) -> float:
    o = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)])
    return float(o.decode().strip())


def words_from_chars(chars, starts, ends):
    out, cur, s0, e0 = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
                cur, s0 = "", None
        else:
            if s0 is None:
                s0 = s
            cur += ch
            e0 = e
    if cur:
        out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
    return out


tpath = ROOT / "src/data/timing.json"
timing = json.loads(tpath.read_text(encoding="utf-8")) if ONLY and tpath.exists() else {}
(ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
prev = None
for k, text in items:
    if ONLY and k not in ONLY:
        prev = text
        continue
    body = {"text": text, "model_id": MODEL, "voice_settings": SETTINGS}
    if prev:
        body["previous_text"] = prev  # mantém a entonação contínua entre cenas
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    try:
        r = json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs {e.code}: {e.read()[:400]!r}")
    mp3 = ROOT / f"public/vo/{k}.mp3"
    mp3.write_bytes(base64.b64decode(r["audio_base64"]))
    al = r["alignment"]
    timing[k] = {"duration": round(dur(mp3), 3),
                 "words": words_from_chars(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])}
    prev = text
    print(k, timing[k]["duration"], "s", len(timing[k]["words"]), "palavras")
tpath.write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")
