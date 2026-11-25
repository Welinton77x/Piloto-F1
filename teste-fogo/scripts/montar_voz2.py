"""Monta a narração cortando cada frase pelo SOM (não pelos tempos do TTS), com entrada/saída suaves,
e tira os tempos de cada palavra transcrevendo o áudio final (fica sincronizado com o que é falado de verdade)."""
import difflib, json, os, re, subprocess, tempfile, unicodedata
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parent.parent
NARR = ROOT / os.environ.get("NARR", "narracao-galo3.txt")
VODIR = ROOT / os.environ.get("VODIR", "public/vogalo5")
OUT_MP3 = ROOT / os.environ.get("VOMP3", "public/vozgalo5.mp3")
OUT_JSON = ROOT / os.environ.get("VOJSON", "src/timingGalo5.json")
GAP = float(os.environ.get("GAP", "0.4"))
GAP_IN = float(os.environ.get("GAP_IN", "0.35"))
SR = 44100
lines = [l.strip() for l in NARR.read_text(encoding="utf-8").splitlines() if l.strip()]
chunks = [(i, j) for i, line in enumerate(lines) for j, _ in enumerate(line.split(" | "))]

def load(p):
    raw = subprocess.check_output(["ffmpeg", "-nostdin", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

def chunk_text(i, j):
    return re.sub(r"\[[^\]]*\]", " ", lines[i].split(" | ")[j]).split()

norm = lambda w: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())

def stt_words(path, cache):
    if cache.exists():
        return json.loads(cache.read_text())
    r = subprocess.check_output(["curl", "-sS", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text", "-H", "xi-api-key: proxy-injected",
                                 "-F", "model_id=scribe_v1", "-F", "language_code=pt", "-F", "timestamps_granularity=word", "-F", f"file=@{path}"], stdin=subprocess.DEVNULL)
    w = [x for x in json.loads(r)["words"] if x.get("type") == "word"]
    cache.write_text(json.dumps(w))
    return w

def bounds(x, path, cache, toks):
    """corta do começo da 1ª palavra do roteiro até o fim da última (ignora sobras que o modelo inventa depois)"""
    sw = stt_words(path, cache)
    A = [norm(t) for t in toks]
    B = [norm(w["text"]) for w in sw]
    m = difflib.SequenceMatcher(None, A, B, autojunk=False)
    pairs = [(i1 + d, j1 + d) for op, i1, i2, j1, j2 in m.get_opcodes() if op == "equal" or (op == "replace" and i2 - i1 == j2 - j1) for d in range(i2 - i1)]
    first = sw[pairs[0][1]] if pairs else sw[0]
    lastw = sw[max(j for _, j in pairs)] if pairs else sw[-1]
    # se as últimas palavras do roteiro não casaram (ex.: "poraquê" ouvido como "por aqui"), vai até a última palavra ouvida
    if pairs and max(i for i, _ in pairs) < len(A) - 1 and max(j for _, j in pairs) < len(B) - 1:
        lastw = sw[-1]
    n = SR // 100
    fr = x[: len(x) // n * n].reshape(-1, n)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    # começo: volta até o silêncio antes da 1ª palavra (no máximo 0,25 s antes)
    k0 = int(first["start"] * 100)
    k = k0
    while k > 0 and k0 - k < 25 and db[k - 1] > -50:
        k -= 1
    s = max(0, k * n - int(0.02 * SR))
    # fim: depois da última palavra, espera a voz sumir (até 0,3 s); corta antes de qualquer som novo
    k1 = min(len(db) - 1, int(lastw["end"] * 100))
    k = k1
    while k < len(db) - 1 and k - k1 < 30 and db[k] > -48:
        k += 1
    e = min(len(x), (k + 1) * n)
    return s, e, len(pairs) == len(toks)
out = np.zeros(int(200 * SR), dtype=np.float32)
t0 = 0.0
for k, (i, j) in enumerate(chunks):
    base = f"l{i:02d}" if " | " not in lines[i] else f"l{i:02d}_{j}"
    x = load(VODIR / f"{base}.mp3")
    s, e, ok = bounds(x, VODIR / f"{base}.mp3", VODIR / f"{base}_stt.json", chunk_text(i, j))
    if not ok:
        print("atenção: palavras diferentes em", base)
    seg = x[s:e].copy()
    fi, fo = int(0.012 * SR), int(0.06 * SR)
    seg[:fi] *= np.linspace(0, 1, fi)
    seg[-fo:] *= np.linspace(1, 0, fo)
    a = int(t0 * SR)
    out[a : a + len(seg)] += seg
    last = k + 1 == len(chunks) or chunks[k + 1][0] != i
    t0 += len(seg) / SR + (GAP if last else GAP_IN)
out = out[: int((t0 + 0.2) * SR)]
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "160k", str(OUT_MP3)], input=pcm, check=True)

# tempos por palavra: transcreve o áudio final e casa com as palavras do roteiro
stt = subprocess.check_output(["curl", "-sS", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text", "-H", "xi-api-key: proxy-injected",
                               "-F", "model_id=scribe_v1", "-F", "language_code=pt", "-F", "timestamps_granularity=word", "-F", f"file=@{OUT_MP3}"], stdin=subprocess.DEVNULL)
sw = [w for w in json.loads(stt)["words"] if w.get("type") == "word"]
script = []
for i, line in enumerate(lines):
    for tok in re.sub(r"\[[^\]]*\]", " ", line).replace("|", " ").split():
        script.append((tok, i))
A = [norm(t) for t, _ in script]
B = [norm(w["text"]) for w in sw]
sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
times = [None] * len(script)
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "equal" or (op == "replace" and i2 - i1 == j2 - j1):
        for d in range(i2 - i1):
            times[i1 + d] = (sw[j1 + d]["start"], sw[j1 + d]["end"])
miss = sum(t is None for t in times)
for q in range(len(times)):  # preenche faltas por interpolação
    if times[q] is None:
        prev = next((times[p] for p in range(q - 1, -1, -1) if times[p]), (0, 0))
        nxt = next((times[p] for p in range(q + 1, len(times)) if times[p]), (prev[1] + 0.3, prev[1] + 0.3))
        times[q] = (prev[1], max(prev[1] + 0.05, nxt[0]))
words = [{"w": t, "s": round(times[k][0], 3), "e": round(times[k][1], 3), "line": li} for k, (t, li) in enumerate(script)]
OUT_JSON.write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
print(len(words), "palavras;", miss, "sem par na transcrição; fim em", words[-1]["e"], "s; similaridade", round(sm.ratio(), 3))
