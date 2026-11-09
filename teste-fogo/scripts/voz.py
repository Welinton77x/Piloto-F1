"""Gera a narração do teste (ElevenLabs, voz Liam) + tempos por palavra. Rodar UMA vez (gasta créditos)."""
import base64, json, os, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
TEXT = "E tem o elemento fogo. Tu estala os dedos... e a mão acende. Mas tem um detalhe: tudo que tu encosta... pega fogo."
req = urllib.request.Request(
    "https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps({"text": "[excited] " + TEXT, "model_id": "eleven_v3",
                     "voice_settings": {"stability": 0.3, "similarity_boost": 0.8, "style": 0.7, "use_speaker_boost": True}}).encode(),
    headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "dummy"), "Content-Type": "application/json"})
r = json.load(urllib.request.urlopen(req))
(ROOT / "public/voz.mp3").write_bytes(base64.b64decode(r["audio_base64"]))
a = r["alignment"]; words, cur, s0, e0 = [], "", None, None
for ch, s, e in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
    if ch.isspace():
        if cur: words.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)}); cur, s0 = "", None
    else:
        s0 = s if s0 is None else s0; cur += ch; e0 = e
if cur: words.append({"w": cur, "s": round(s0, 3), "e": round(e0, 3)})
words = [w for w in words if not w["w"].startswith("[")]
(ROOT / "src/timing.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps(words, ensure_ascii=False))
