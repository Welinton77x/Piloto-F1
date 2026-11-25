"""Voz grátis (Microsoft Edge TTS, pt-BR) + tempos por palavra. Alternativa à ElevenLabs."""
import asyncio, json
from pathlib import Path
import os, ssl
import edge_tts, edge_tts.communicate as _cm
_cm._SSL_CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')
ROOT = Path(__file__).resolve().parent.parent
TEXT = "E tem o elemento fogo. Tu estala os dedos... e a mão acende. Mas tem um detalhe: tudo que tu encosta... pega fogo."
async def main():
    c = edge_tts.Communicate(TEXT, "pt-BR-AntonioNeural", rate="+8%", pitch="+2Hz", boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    words = []
    with open(ROOT / "public/voz.mp3", "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7; words.append({"w": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    (ROOT / "src/timing.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(words, ensure_ascii=False))
asyncio.run(main())
