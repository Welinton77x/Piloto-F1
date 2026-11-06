"""Narração gratuita com edge-tts (pt-BR-AntonioNeural) + tempos por palavra.
Uso:  pip install edge-tts && python scripts/tts_edge.py
Gera public/vo/sN.mp3 e src/data/timing.json (duração e palavras em segundos).
Roda localmente (precisa de internet)."""
import asyncio, json, re, subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
VOICE = "pt-BR-AntonioNeural"
RATE = "+6%"  # animado; ajuste se a cena estourar muito

# lê as falas do scene-plan.ts (campos voKey e narration)
src = (ROOT / "src/data/scene-plan.ts").read_text(encoding="utf-8")
items = re.findall(r'voKey: "(s\d+)".*?narration: "((?:[^"\\]|\\.)*)"', src, flags=re.S)


def dur(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]
    )
    return float(out.decode().strip())


async def one(key: str, text: str):
    mp3 = ROOT / f"public/vo/{key}.mp3"
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as fh:
        async for ch in comm.stream():
            if ch["type"] == "audio":
                fh.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"w": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    return key, {"duration": round(dur(mp3), 3), "words": words}


async def main():
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    timing = {}
    for key, text in items:
        k, v = await one(key, text.replace('\\"', '"'))
        timing[k] = v
        print(k, v["duration"], "s,", len(v["words"]), "palavras")
    (ROOT / "src/data/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")


asyncio.run(main())
