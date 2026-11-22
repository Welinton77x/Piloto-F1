"""Narração corrida (texto inteiro numa chamada só), igual à referência.
Uso: NARR=narracao-X.txt VOMP3=public/vozX.mp3 VOJSON=src/timingX.json python3 scripts/voz_corrida.py"""
import json, base64, os, subprocess, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
VOICE = os.environ.get("VOICE_ID", "r3KkFedJ4n8aabIZ0RFQ")  # Will
lines = [l.strip().replace(" | ", " ") for l in (ROOT / os.environ["NARR"]).read_text(encoding="utf-8").splitlines() if l.strip()]
text = " ".join(lines)
body = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": float(os.environ.get("STAB", "0.5")), "similarity_boost": 0.8, "style": float(os.environ.get("STYLE", "0.3")), "use_speaker_boost": True, "speed": float(os.environ.get("SPEED", "0.76"))}}
r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps", data=json.dumps(body).encode(), headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": "application/json"})
d = json.load(urllib.request.urlopen(r, timeout=300))
raw = ROOT / "out" / (Path(os.environ["VOMP3"]).stem + "-corrida.mp3")
raw.write_bytes(base64.b64decode(d["audio_base64"]))
PAD = 0.25
subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"adelay={int(PAD*1000)}", "-ar", "44100", "-b:a", "192k", str(ROOT / os.environ["VOMP3"])])
a = d["alignment"]; st, en = a["character_start_times_seconds"], a["character_end_times_seconds"]
words, pos = [], 0
for li, line in enumerate(lines):
    for w in line.split():
        i = text.index(w, pos); j = i + len(w) - 1; pos = j + 1
        words.append({"w": w, "s": round(st[i] + PAD, 3), "e": round(en[j] + PAD, 3), "line": li})
(ROOT / os.environ["VOJSON"]).write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
print(len(words), "palavras; fim em", words[-1]["e"], "s")
