"""Remonta a narração a partir das frases já geradas (sem gastar créditos):
corta o silêncio das pontas de cada frase, acelera a fala (atempo, mesmo tom) e
recoloca as pausas no ritmo do vídeo de referência. Gera o mp3 final e os tempos por palavra."""
import json, os, subprocess, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
NARR = ROOT / os.environ.get("NARR", "narracao-galo2.txt")
VODIR = ROOT / os.environ.get("VODIR", "public/vogalo2")
OUT_MP3 = ROOT / os.environ.get("VOMP3", "public/vozgalo2.mp3")
OUT_JSON = ROOT / os.environ.get("VOJSON", "src/timingGalo2.json")
R = float(os.environ.get("RATE", "1.15"))        # aceleração da fala
GAP = float(os.environ.get("GAP", "0.45"))       # pausa entre linhas
GAP_IN = float(os.environ.get("GAP_IN", "0.4"))  # pausa entre frases da mesma linha
PAD = 0.04
lines = [l.strip() for l in NARR.read_text(encoding="utf-8").splitlines() if l.strip()]
chunks = [(i, j, c.strip()) for i, line in enumerate(lines) for j, c in enumerate(line.split(" | "))]
tmp = Path(tempfile.mkdtemp())
words, parts, t0 = [], [], 0.0
for n, (i, j, text) in enumerate(chunks):
    base = f"l{i:02d}" if " | " not in lines[i] else f"l{i:02d}_{j}"
    a = json.loads((VODIR / f"{base}.json").read_text(encoding="utf-8"))
    chars, st, en = a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]
    # palavras (ignora as tags entre colchetes)
    ws, cur, s0, e0 = [], "", None, None
    for ch, s, e in list(zip(chars, st, en)) + [(" ", 0, 0)]:
        if ch.isspace():
            if cur and not (cur.startswith("[") or cur.endswith("]")):
                ws.append((cur, s0, e0))
            cur, s0 = "", None
        else:
            s0 = s if s0 is None else s0
            cur += ch
            e0 = e
    a0 = max(0.0, ws[0][1] - PAD)
    a1 = ws[-1][2] + PAD
    seg = tmp / f"{n:03d}.wav"
    subprocess.check_call(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(VODIR / f"{base}.mp3"), "-ss", f"{a0:.3f}", "-to", f"{a1:.3f}",
                           "-af", f"atempo={R}", "-ar", "44100", "-ac", "1", str(seg)])
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(seg)]).decode())
    for w, s, e in ws:
        words.append({"w": w, "s": round(t0 + (s - a0) / R, 3), "e": round(t0 + (e - a0) / R, 3), "line": i})
    parts.append((seg, t0))
    last = n + 1 == len(chunks) or chunks[n + 1][0] != i
    t0 += d + (GAP if last else GAP_IN)
lst = tmp / "lista.txt"
inputs, filt = [], []
for k, (p, st0) in enumerate(parts):
    inputs += ["-i", str(p)]
    filt.append(f"[{k}]adelay={int(st0*1000)}|{int(st0*1000)}[a{k}]")
mix = "".join(f"[a{k}]" for k in range(len(parts)))
subprocess.check_call(["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt) + f";{mix}amix=inputs={len(parts)}:normalize=0[o]",
                       "-map", "[o]", "-ac", "1", "-b:a", "160k", str(OUT_MP3)])
OUT_JSON.write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
print(len(words), "palavras; fim em", words[-1]["e"], "s")
