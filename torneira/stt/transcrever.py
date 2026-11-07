"""Transcreve a narração v3 com tempos por palavra (ElevenLabs Speech-to-Text, scribe_v1).
Uso: ELEVENLABS_API_KEY=... python torneira/stt/transcrever.py  -> torneira/stt/words.json"""
import json, os, uuid, urllib.request, urllib.error
from pathlib import Path
ROOT = Path(__file__).resolve().parent
audio = (ROOT.parent / "production/narracao-v3-matheus-energic.mp3").read_bytes()
b = uuid.uuid4().hex
body = b"".join([
    f"--{b}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n".encode(),
    f"--{b}\r\nContent-Disposition: form-data; name=\"language_code\"\r\n\r\npor\r\n".encode(),
    f"--{b}\r\nContent-Disposition: form-data; name=\"timestamps_granularity\"\r\n\r\nword\r\n".encode(),
    f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"n.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode(), audio, b"\r\n",
    f"--{b}--\r\n".encode(),
])
req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
    headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": f"multipart/form-data; boundary={b}"})
try:
    r = json.load(urllib.request.urlopen(req))
except urllib.error.HTTPError as e:
    raise SystemExit(f"ElevenLabs {e.code}: {e.read()[:400]!r}")
(ROOT / "words.json").write_text(json.dumps(r.get("words", r), ensure_ascii=False), encoding="utf-8")
print("palavras:", sum(1 for w in r.get("words", []) if w.get("type") == "word"))
