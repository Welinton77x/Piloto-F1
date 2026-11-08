"""Efeitos do vídeo 4 (carro), sintetizados por código: motor, explosão, buzina, pneu cantando, vapor."""
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
rng = np.random.default_rng(4)
t = lambda d: np.arange(int(SR * d)) / SR

def lp(x, a):
    n = int(min(len(x), max(32, 6 / a)))
    return np.convolve(x, a * (1 - a) ** np.arange(n))[: len(x)]

def save(name, x, peak=0.85):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    sf.write(OUT / name, x.astype(np.float32), SR)

# motor: pulsos de explosão rápidos filtrados (ronco), acelerando um pouco
d = 2.4; tt = t(d)
f = 28 + 10 * tt / d
ph = np.cumsum(f) / SR
puls = (np.sin(2 * np.pi * ph) > 0.6).astype(float) * rng.uniform(0.7, 1, len(tt))
eng = lp(puls, 0.02) + 0.3 * lp(rng.standard_normal(len(tt)), 0.01)
env = np.minimum(1, tt / 0.15) * np.minimum(1, (d - tt) / 0.4)
save("engine.wav", eng * env, 0.7)
# explosão do cilindro (bum curto)
d = 0.8; tt = t(d)
b = lp(rng.standard_normal(len(tt)), 0.03) * np.exp(-tt * 9) + 0.6 * np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 7)
save("boom.wav", b)
# buzina (duas notas)
d = 0.7; tt = t(d)
h = np.sign(np.sin(2 * np.pi * 400 * tt)) + np.sign(np.sin(2 * np.pi * 500 * tt))
h = lp(h, 0.25) * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.05)
save("horn.wav", h, 0.6)
# pneu cantando
d = 1.2; tt = t(d)
sc = np.sin(2 * np.pi * (1700 + 300 * np.sin(2 * np.pi * 7 * tt)) * tt) * (0.6 + 0.4 * rng.uniform(0, 1, len(tt)))
sc *= np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.3)
save("screech.wav", sc, 0.45)
# vapor/fumaça (chiado)
d = 1.5; tt = t(d)
st = rng.standard_normal(len(tt)); st = st - lp(st, 0.2)
st *= np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.5)
save("steam.wav", st, 0.4)
print("ok")
