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

# toc: bolinha de pingue-pongue
tt = t(0.09)
save("toc", (np.sin(2 * np.pi * 2300 * tt) * 0.6 + rng.standard_normal(len(tt)) * 0.4) * np.exp(-tt * 70))
# whoosh lento (câmera lenta): ruído grave que desce
tt = t(1.6)
n = rng.standard_normal(len(tt))
save("whooshlento", lowpass(n, 0.02) * np.sin(np.pi * tt / tt[-1]) ** 2 + 0.4 * np.sin(2 * np.pi * (90 - 40 * tt / tt[-1]) * tt) * np.sin(np.pi * tt / tt[-1]))
# aaah: coro celestial (acorde com vibrato e ataque lento)
tt = t(2.2)
x = np.zeros(len(tt))
for m in [64, 68, 71, 76]:
    f0 = 440 * 2 ** ((m - 69) / 12)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt)
    for h, a in [(1, 1), (2, 0.35), (3, 0.15)]:
        x += a * np.sin(2 * np.pi * f0 * h * np.cumsum(vib) / SR)
save("aaah", x * np.minimum(1, tt * 2.5) * np.exp(-np.maximum(0, tt - 1.4) * 3))
# chuvapao: pães caindo (baques abafados)
tt = t(3.2)
x = np.zeros(len(tt))
for k in range(45):
    st = int(rng.uniform(0.3, 3.0) * SR)
    Lq = int(0.08 * SR)
    th = np.sin(2 * np.pi * rng.uniform(140, 260) * np.arange(Lq) / SR) * np.exp(-np.arange(Lq) / (0.015 * SR))
    x[st:st + Lq] += th[: len(x) - st] * rng.uniform(0.3, 1)
save("chuvapao", x)

# rugido: ruído grave com tom que sobe e desce
tt = t(1.3)
n = rng.standard_normal(len(tt))
f = 95 + 60 * np.sin(np.pi * tt / tt[-1])
growl = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sin(2 * np.pi * 28 * tt))
save("rugido", (0.6 * growl + 0.8 * lowpass(n, 0.06)) * np.sin(np.pi * tt / tt[-1]) ** 0.6)
# quack: buzina nasal curta
tt = t(0.22)
f = 520 - 260 * tt / tt[-1]
ph = np.cumsum(f) / SR
q = np.sign(np.sin(2 * np.pi * ph)) * 0.5 + np.sin(2 * np.pi * 2 * ph) * 0.3
save("quack", lowpass(q, 0.25) * np.minimum(1, tt * 60) * np.exp(-tt * 6))
# sirene: tom que sobe e desce (2 ciclos)
tt = t(2.4)
f = 700 + 350 * np.sin(2 * np.pi * 0.85 * tt)
save("sirene", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt * 10) * np.minimum(1, (tt[-1] - tt) * 4))
# tlim: brilho metálico do garfo
tt = t(0.8)
save("tlim", (np.sin(2 * np.pi * 2093 * tt) + 0.6 * np.sin(2 * np.pi * 3136 * tt) + 0.3 * np.sin(2 * np.pi * 5274 * tt)) * np.exp(-tt * 6))
# vento de faroeste
tt = t(2.6)
n = rng.standard_normal(len(tt))
w = lowpass(n, 0.015) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt))
save("ventofaroeste", w * np.sin(np.pi * tt / tt[-1]) + 0.08 * np.sin(2 * np.pi * (600 + 80 * np.sin(2 * np.pi * 0.5 * tt)) * tt) * np.sin(np.pi * tt / tt[-1]))
# chuva: ruído chiado com pingos
tt = t(4.0)
n = rng.standard_normal(len(tt))
x = (n - lowpass(n, 0.4)) * 0.35
for k in range(140):
    st = int(rng.uniform(0, 3.9) * SR)
    Lq = int(0.01 * SR)
    x[st:st + Lq] += rng.standard_normal(Lq) * np.exp(-np.arange(Lq) / (0.002 * SR)) * rng.uniform(0.2, 0.8)
save("chuva", x * np.minimum(1, tt * 3) * np.minimum(1, (tt[-1] - tt) * 2))
# trovão: estalo + ronco grave
tt = t(2.2)
n = rng.standard_normal(len(tt))
save("trovao", (n * np.exp(-tt * 25) * 0.8 + lowpass(n, 0.015) * 6 * np.exp(-tt * 1.6)))
# aspirador: zumbido com ruído
tt = t(3.5)
n = rng.standard_normal(len(tt))
save("aspirador", (0.5 * np.sin(2 * np.pi * 180 * tt) + 0.3 * np.sin(2 * np.pi * 360 * tt) + 0.6 * (n - lowpass(n, 0.2))) * np.minimum(1, tt * 4) * np.minimum(1, (tt[-1] - tt) * 4))

# notificação de celular: dois toques
tt = t(0.35)
x = np.zeros(len(tt))
for st, f0 in [(0, 1568), (0.12, 2093)]:
    s0 = int(st * SR); seg = np.arange(len(tt) - s0) / SR
    x[s0:] += np.sin(2 * np.pi * f0 * seg) * np.exp(-seg * 18)
save("notificacao", x)
# giz escrevendo no quadro (arranhado)
tt = t(1.2)
n = rng.standard_normal(len(tt))
save("giz", (n - lowpass(n, 0.5)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3 * tt))) * np.minimum(1, (tt[-1] - tt) * 5))
# giz quebrando: estalo seco
tt = t(0.25)
n = rng.standard_normal(len(tt))
save("crec", (n - lowpass(n, 0.3)) * np.exp(-tt * 40) + 0.4 * np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 60))
# sinal da escola: campainha elétrica
tt = t(1.6)
save("sinal", (np.sign(np.sin(2 * np.pi * 900 * tt)) * 0.35 + np.sin(2 * np.pi * 1800 * tt) * 0.3) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 22 * tt))) * np.minimum(1, (tt[-1] - tt) * 6))

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
