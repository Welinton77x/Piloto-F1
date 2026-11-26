"""Gera a narração com ElevenLabs (voz Will) + tempos por palavra.
Uso: python3 scripts/tts.py   (cobra créditos a cada execução; pula falas que já existem)
Lê as falas de production/scene-plan.ts; escreve public/vo/<voKey>.mp3 e src/data/timing.json."""
import base64, json, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = "r3KkFedJ4n8aabIZ0RFQ"  # Will - Social media
import os
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")  # estilo B (guia do canal)
# A fala com marcações de emoção vem do campo "delivery" do scene-plan (aprovado no roteiro).
src = (ROOT / "production/scene-plan.ts").read_text(encoding="utf-8")
STR = r'"((?:[^"\\]|\\.)*)"'
found = re.findall(r'voKey: "(s\d+)".*?narration: ' + STR + r',\s*delivery: ' + STR, src, flags=re.S)
items = [(k, t.replace('\\"', '"')) for k, t, _ in found]
DELIVERY = {k: d.replace('\\"', '"') for k, _, d in found}
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
    said = DELIVERY.get(key, text)
    plain = lambda x: re.sub(r"[^a-zà-ú ]", "", re.sub(r"\[[a-z]+\]", "", x.lower())).split()
    assert plain(said) == plain(text), f"{key}: a fala com marcações difere da aprovada"
    vs = {"stability": 0.0, "similarity_boost": 0.8, "style": 0.8, "use_speaker_boost": True} if MODEL == "eleven_v3" else {"stability": 0.3, "similarity_boost": 0.8, "style": 0.75, "use_speaker_boost": True, "speed": 1.0}  # estilo B
    body = {"text": said, "model_id": MODEL, "voice_settings": vs}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"xi-api-key": "dummy", "Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req))
    mp3.write_bytes(base64.b64decode(r["audio_base64"]))
    a = r["alignment"]
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]).decode())
    ws = [w for w in words(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]) if not re.fullmatch(r"\[[a-z]+\]", w["w"])]
    timing[key] = {"text": text, "said": said, "model": MODEL, "duration": round(dur, 3), "words": ws}
    print(key, round(dur, 2), "s", len(timing[key]["words"]), "palavras")
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=1))
