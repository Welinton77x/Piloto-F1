"""Narração com ElevenLabs (créditos autorizados pelo usuário) + alinhamento por palavra.
Uso:  ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... python scripts/tts_elevenlabs.py
Escolha uma voz pt-BR masculina, animada e próxima na sua conta. Gera uma vez por cena (cobra créditos
a cada execução: não rode em loop). Escreve public/vo/sN.mp3 e src/data/timing.json."""
import base64, json, os, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE = os.environ["ELEVENLABS_VOICE_ID"]
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
SPEED = float(os.environ.get("ELEVENLABS_SPEED", "1.05"))  # até ~1,12 soa natural

src = (ROOT / "src/data/scene-plan.ts").read_text(encoding="utf-8")
items = re.findall(r'voKey: "(s\d+)".*?narration: "((?:[^"\\]|\\.)*)"', src, flags=re.S)


def dur(p: Path) -> float:
    o = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)])
    return float(o.decode().strip())


def words_from_chars(text, chars, starts, ends):
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


timing = {}
(ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
for k, text in items:
    text = text.replace('\\"', '"')
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": MODEL, "voice_settings": {"speed": SPEED}}).encode(),
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    r = json.load(urllib.request.urlopen(req))
    mp3 = ROOT / f"public/vo/{k}.mp3"
    mp3.write_bytes(base64.b64decode(r["audio_base64"]))
    al = r["alignment"]
    timing[k] = {
        "duration": round(dur(mp3), 3),
        "words": words_from_chars(text, al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]),
    }
    print(k, timing[k]["duration"], "s")
(ROOT / "src/data/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")
