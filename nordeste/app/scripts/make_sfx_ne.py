"""Sons do vídeo 6 (sintetizados): cigarras do sertão, chiado de chão quente, ventilador, gole d'água."""
from pathlib import Path
import numpy as np, soundfile as sf
SR = 44100; OUT = Path(__file__).resolve().parent.parent / "public/sfx"; rng = np.random.default_rng(6)
T = lambda d: np.arange(int(SR * d)) / SR
def save(n, x, pk=0.8): sf.write(OUT / n, (x / (np.max(np.abs(x)) + 1e-9) * pk).astype(np.float32), SR)
def hp(x, a=0.2):
    k = a * (1 - a) ** np.arange(60); return x - np.convolve(x, k)[: len(x)]
# cigarras: zumbido agudo pulsante em loop de 4 s
t = T(4.0); car = np.sin(2 * np.pi * 4300 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 95 * t)))
env = 0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t) ** 2
save("cicadas.wav", (car * env + 0.15 * hp(rng.standard_normal(len(t)))) * 0.6, 0.5)
# chiado (chão quente)
t = T(1.2); x = hp(rng.standard_normal(len(t)), 0.35) * np.minimum(1, t / 0.05) * np.exp(-t * 2.2)
save("sizzle.wav", x, 0.45)
# ventilador: zumbido grave + ar
t = T(3.0); x = 0.5 * np.sin(2 * np.pi * 110 * t) + 0.3 * np.sin(2 * np.pi * 220 * t) + 0.4 * np.convolve(rng.standard_normal(len(t)), np.ones(30) / 30, "same")
x *= np.minimum(1, t / 0.3) * np.minimum(1, (3 - t) / 0.4)
save("fan.wav", x, 0.4)
# gole d'água (3 glub)
y = np.zeros(int(SR * 0.9))
for k in range(3):
    tt = T(0.14); f = 260 - 500 * tt; seg = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18)
    i = int(SR * k * 0.26); y[i:i + len(seg)] += seg
save("gulp.wav", y, 0.6)
print("ok")
