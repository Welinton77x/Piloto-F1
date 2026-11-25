"""Gera a narração com ElevenLabs (voz Will) + tempos por palavra.
Uso: python3 scripts/tts.py   (cobra créditos a cada execução; pula falas que já existem)
Lê as falas de production/scene-plan.ts; escreve public/vo/<voKey>.mp3 e src/data/timing.json."""
import base64, json, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = "r3KkFedJ4n8aabIZ0RFQ"  # Will - Social media
MODEL = "eleven_multilingual_v2"
src = (ROOT / "production/scene-plan.ts").read_text(encoding="utf-8")
items = [(k, t.replace('\\"', '"')) for k, t in re.findall(r'voKey: "(s\d+)",\s*narration: "((?:[^"\\]|\\.)*)"', src)]
timing_path = ROOT / "src/data/timing.json"
timing = json.loads(timing_path.read_text()) if timing_path.exists() else {}


def words(chars, starts, ends):
    out, cur, s0, e0 = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
            cur, s0 = "", None
            continue
        if s0 is None:
            s0 = s
        cur += ch
        e0 = e
    if cur:
        out.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
    return out


for key, text in items:
    mp3 = ROOT / f"public/vo/{key}.mp3"
    if mp3.exists() and key in timing:
        continue
    body = {"text": text, "model_id": MODEL, "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True, "speed": 1.05}}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"xi-api-key": "dummy", "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req))
    mp3.write_bytes(base64.b64decode(r["audio_base64"]))
    a = r["alignment"]
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]).decode())
    timing[key] = {"text": text, "duration": round(dur, 3), "words": words(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"])}
    print(key, round(dur, 2), "s", len(timing[key]["words"]), "palavras")
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
