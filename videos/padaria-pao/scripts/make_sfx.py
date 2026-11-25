"""Efeitos e trilha sintetizados por código (sem direitos de terceiros). Escreve public/sfx/*.wav"""
import wave
from pathlib import Path
import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x, stereo=False):
    x = np.asarray(x, dtype=np.float64)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    data = (x * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2 if stereo else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def t(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


# pop: blip curto que sobe de tom
tt = t(0.11)
f = 520 + 900 * tt / tt[-1]
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38))
# whoosh: ruído filtrado com envelope em sino
tt = t(0.42)
n = rng.standard_normal(len(tt))
env = np.sin(np.pi * tt / tt[-1]) ** 2
save("whoosh", lowpass(n, 0.08) * env)
# tsss: vapor
tt = t(1.3)
n = rng.standard_normal(len(tt))
save("tsss", (n - lowpass(n, 0.3)) * np.minimum(1, tt * 8) * np.exp(-tt * 1.6))
# plim: sino da balança
tt = t(0.9)
save("plim", (np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 2637 * tt) + 0.25 * np.sin(2 * np.pi * 3951 * tt)) * np.exp(-tt * 5))
# croc: casca crocante (estalos)
tt = t(0.35)
x = np.zeros(len(tt))
for k in range(9):
    s = int(rng.uniform(0, 0.25) * SR)
    L = int(0.018 * SR)
    burst = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.004 * SR))
    x[s:s + L] += burst * rng.uniform(0.4, 1)
save("croc", x - lowpass(x, 0.15))
# tum: pancada grave do carimbo
tt = t(0.45)
f = 110 * np.exp(-tt * 6) + 45
save("tum", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) + 0.3 * lowpass(rng.standard_normal(len(tt)), 0.05) * np.exp(-tt * 30))
# confete: brilhos
tt = t(1.4)
x = np.zeros(len(tt))
for k in range(26):
    s = int(rng.uniform(0, 1.1) * SR)
    L = int(0.12 * SR)
    fr = rng.uniform(1800, 4200)
    seg = np.sin(2 * np.pi * fr * np.arange(L) / SR) * np.exp(-np.arange(L) / (0.025 * SR))
    x[s:s + L] += seg[: len(x) - s] * rng.uniform(0.3, 1)
save("confete", x)

# trilha: dedilhado leve (C G Am F) a 104 bpm, baixo e chocalho — 64 s
BPM = 104
beat = 60 / BPM
dur = 64
N = int(SR * dur)
mix = np.zeros(N)
def note(midi):
    return 440 * 2 ** ((midi - 69) / 12)
def pluck(freq, length, amp):
    tt = np.arange(int(SR * length)) / SR
    y = sum((0.6 ** h) * np.sin(2 * np.pi * freq * (h + 1) * tt) for h in range(5))
    return amp * y * np.exp(-tt * 5.5) * np.minimum(1, tt * 400)
def add(x, start):
    s = int(start * SR)
    e = min(N, s + len(x))
    if s < N:
        mix[s:e] += x[: e - s]
chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
bass = [36, 31, 33, 29]
pattern = [0, 2, 1, 2, 0, 2, 1, 2]
bar = 0
time = 0.0
while time < dur:
    ch = chords[bar % 4]
    for i, p in enumerate(pattern):
        st = time + i * beat / 2
        add(pluck(note(ch[p] + 12), 0.6, 0.30 if i % 2 == 0 else 0.22), st)
    add(pluck(note(bass[bar % 4] + 12), 1.6, 0.5), time)
    add(pluck(note(bass[bar % 4] + 12), 1.0, 0.35), time + 2 * beat)
    for i in range(8):
        L = int(0.05 * SR)
        sh = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.008 * SR))
        add(sh * (0.10 if i % 2 else 0.05), time + i * beat / 2)
    time += 4 * beat
    bar += 1
mix = mix - lowpass(mix, 0.002)
save("trilha", mix)
print("ok", sorted(p.name for p in OUT.iterdir()))
