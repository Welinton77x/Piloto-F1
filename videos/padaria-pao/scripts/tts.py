"""Gera a narração com ElevenLabs (voz Will) + tempos por palavra.
Uso: python3 scripts/tts.py   (cobra créditos a cada execução; pula falas que já existem)
Lê as falas de production/scene-plan.ts; escreve public/vo/<voKey>.mp3 e src/data/timing.json."""
import base64, json, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = "r3KkFedJ4n8aabIZ0RFQ"  # Will - Social media
import os
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_v3")  # v3: entende marcações de emoção
# Interpretação animada e engraçada: mesmas falas aprovadas + marcações de emoção (só no v3).
DELIVERY = {
    "s1": "[excited] Vai na padaria comprar pão? Então segue essas quatro dicas!",
    "s2": "[excited] Primeiro: ao entrar, NÃO diga bom dia. [whispers] Olhe fundo nos olhos do padeiro e fale a senha secreta:",
    "s3": "[dramatic] \"O pão é francês, mas eu sou brasileiro!\" [laughs] Ele vai saber que você é profissional.",
    "s4": "[excited] Segundo: se o pão vier clarinho, desafie o padeiro pra uma partida de pingue-pongue com pão de forma!",
    "s5": "[confident] Ele vai aceitar. Padeiro acorda antes do sol, não tem medo de nada!",
    "s6": "[playful] Terceiro: quando ele perguntar \"mais alguma coisa?\", responda: [sighs] \"só a felicidade\".",
    "s7": "[happy] Ele vai te entregar um sonho. [laughs] Que, convenhamos, é quase a mesma coisa.",
    "s8": "[excited] Quarto: suba na balança e peça o seu peso em pão!",
    "s9": "[whispers] Parece loucura, [excited] mas o pão francês só pode ser vendido a peso. É regra do Inmetro, de verdade!",
    "s10": "[excited] Pronto: você saiu com setenta quilos de pão! [laughs] E dentro do sonho tem um bilhete do padeiro pedindo revanche no pingue-pongue.",
    "s11": "[curious] E você, pede o pão moreninho ou clarinho?",
}
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
    said = DELIVERY.get(key, text) if MODEL == "eleven_v3" else text
    plain = lambda x: re.sub(r"[^a-zà-ú ]", "", re.sub(r"\[[a-z]+\]", "", x.lower())).split()
    assert plain(said) == plain(text), f"{key}: a fala com marcações difere da aprovada"
    vs = {"stability": 0.0, "similarity_boost": 0.8, "style": 0.8, "use_speaker_boost": True} if MODEL == "eleven_v3" else {"stability": 0.4, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True, "speed": 1.05}
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
