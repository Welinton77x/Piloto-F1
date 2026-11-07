"""Som de fita rebobinando (VHS) para o efeito de voltar no tempo do s2. Escreve public/sfx/rewind.wav."""
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 44100
rng = np.random.default_rng(11)
dur = 0.95
n = int(SR * dur)
t = np.arange(n) / SR
# vozes "aceleradas ao contrário": tom que sobe rápido com trinado irregular
f = 260 + 1500 * (t / dur) ** 1.4
f *= 1 + 0.18 * np.sin(2 * np.pi * 23 * t) + 0.08 * np.sin(2 * np.pi * 61 * t)
ph = 2 * np.pi * np.cumsum(f) / SR
chirp = 0.5 * np.sin(ph) + 0.25 * np.sin(2 * ph + 0.3) + 0.12 * np.sin(3 * ph)
# granulado de "blabla" rebobinando: pulsos rápidos de amplitude
gate = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * (14 + 30 * t / dur) * t))
# chiado de fita
noise = rng.standard_normal(n)
k = 0.08 * (0.92) ** np.arange(60)
hiss = np.convolve(noise, k)[:n]
hiss = noise - hiss  # passa-alta simples
x = chirp * gate * 0.55 + hiss * 0.07
env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.06)
x *= env
# clique mecânico no início (aperta o botão) e no fim (para)
for at, a in ((0.0, 0.9), (dur - 0.05, 0.6)):
    i = int(at * SR)
    m = int(0.012 * SR)
    x[i:i + m] += a * np.exp(-np.arange(m) / (0.002 * SR)) * rng.standard_normal(m)
x = 0.85 * x / np.max(np.abs(x))
out = Path(__file__).resolve().parent.parent / "public/sfx/rewind.wav"
sf.write(out, x.astype(np.float32), SR)
print(out, len(x) / SR)
