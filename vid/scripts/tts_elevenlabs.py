"""Narração com ElevenLabs (créditos autorizados pelo usuário) + alinhamento por palavra.
Uso:  ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... python scripts/tts_elevenlabs.py
Escolha uma voz pt-BR masculina, animada e próxima na sua conta. Gera uma vez por cena (cobra créditos
a cada execução: não rode em loop). Escreve public/vo/sN.mp3 e src/data/timing.json."""
import base64, json, os, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY = os.environ["ELEVENLABS_API_KEY"]
VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")  # Liam
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_v3")  # v3 entende tags de emoção; cai para v2 se falhar
TAGS = {"s1": "[curious]", "s2": "[excited]", "s3": "[surprised]", "s4": "[excited]", "s5": "[curious]", "s6": "[surprised]", "s7": "[excited]", "s8": "[curious]", "s9": "[excited]", "s10": "[excited]", "s11": "[laughs] [excited]"}
SPEED = float(os.environ.get("ELEVENLABS_SPEED", "1.0"))  # até ~1,12 soa natural

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
def call(model, text):
    vs = {"stability": 0.3, "similarity_boost": 0.8, "style": 0.7, "use_speaker_boost": True}
    if model != "eleven_v3":
        vs["speed"] = 1.05
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps({"text": text, "model_id": model, "voice_settings": vs}).encode(),
        headers={"xi-api-key": KEY, "Content-Type": "application/json"},
    )
    return json.load(urllib.request.urlopen(req))


for k, text in items:
    text = text.replace('\\"', '"')
    try:
        r = call(MODEL, (TAGS.get(k, "") + " " + text).strip() if MODEL == "eleven_v3" else text)
    except Exception as e:  # sem cobrança em erro: tenta o modelo v2
        print("falhou", MODEL, e, "-> v2")
        r = call("eleven_multilingual_v2", text)
    mp3 = ROOT / f"public/vo/{k}.mp3"
    mp3.write_bytes(base64.b64decode(r["audio_base64"]))
    al = r["alignment"]
    timing[k] = {
        "duration": round(dur(mp3), 3),
        "words": [w for w in words_from_chars(text, al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]) if not (w["w"].startswith("[") or w["w"].endswith("]"))],
    }
    print(k, timing[k]["duration"], "s")
(ROOT / "src/data/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")
