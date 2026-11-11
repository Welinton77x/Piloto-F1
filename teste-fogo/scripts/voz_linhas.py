"""Narração de 90 s (voz Matheus - Energetic and Dynamic) + tempos por palavra.
Gera linha a linha de narracao-90s.txt (tags de emoção entre colchetes) e junta tudo.
Linhas já geradas ficam em public/vo90/ e não são cobradas de novo."""
import base64, json, os, re, subprocess, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
VOICE = os.environ.get("VOICE_ID", "NQmLEqxcRTkWYIYZSYod")  # padrão: Matheus - Energetic and Dynamic
GAP = 0.18  # respiro entre frases (s)
lines = [l.strip() for l in (ROOT / os.environ.get("NARR", "narracao-90s.txt")).read_text(encoding="utf-8").splitlines() if l.strip()]
out = ROOT / os.environ.get("VODIR", "public/vo90"); out.mkdir(parents=True, exist_ok=True)

def tts(text):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": "eleven_v3", "language_code": "pt",
                         "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.6, "use_speaker_boost": True}}).encode(),
        headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"), "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=180))

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())

words, t0, parts = [], 0.0, []
for i, line in enumerate(lines):
    mp3, js = out / f"l{i:02d}.mp3", out / f"l{i:02d}.json"
    if not js.exists():
        for k in range(3):
            try:
                r = tts(line); break
            except Exception as e:
                print("linha", i, "falhou:", e); time.sleep(4)
        else:
            raise SystemExit(1)
        mp3.write_bytes(base64.b64decode(r["audio_base64"]))
        js.write_text(json.dumps(r["alignment"]), encoding="utf-8")
    a = json.loads(js.read_text(encoding="utf-8"))
    cur, s0, e0 = "", None, None
    for ch, s, e in list(zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"])) + [(" ", 0, 0)]:
        if ch.isspace():
            if cur and not (cur.startswith("[") or cur.endswith("]")):
                words.append({"w": cur, "s": round(t0 + s0, 3), "e": round(t0 + e0, 3), "line": i})
            cur, s0 = "", None
        else:
            s0 = s if s0 is None else s0; cur += ch; e0 = e
    parts.append((mp3, t0))
    t0 += dur(mp3) + GAP
    print(i, round(t0, 2), line[:50])

# junta os áudios nas posições certas
inputs, filt = [], []
for k, (p, st) in enumerate(parts):
    inputs += ["-i", str(p)]
    filt.append(f"[{k}]adelay={int(st*1000)}|{int(st*1000)}[a{k}]")
mix = "".join(f"[a{k}]" for k in range(len(parts)))
subprocess.check_call(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt) + f";{mix}amix=inputs={len(parts)}:normalize=0[o]", "-map", "[o]", "-ac", "1", str(ROOT / os.environ.get("VOMP3", "public/voz90.mp3"))])
(ROOT / os.environ.get("VOJSON", "src/timing90.json")).write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
print(len(words), "palavras; fim em", words[-1]["e"], "s")
