"""Sons do mascote (vídeo 5), sintetizados por código: comemoração, pulinho, ops, passos, pancada do poste."""
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
rng = np.random.default_rng(9)
T = lambda d: np.arange(int(SR * d)) / SR

def env(t, a, r):
    d = t[-1] + 1 / SR
    return np.minimum(1, t / a) * np.exp(-np.maximum(0, t - a) / r) * np.minimum(1, (d - t) / 0.03)

def voice(f0, f1, d, vib=6.0):
    """vogal 'iê' sintetizada (formantes simples) com glide f0→f1: soa como um 'ê!' de desenho"""
    t = T(d)
    f = f0 + (f1 - f0) * (t / d) ** 0.6
    f = f * (1 + 0.02 * np.sin(2 * np.pi * vib * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 14))
    # formantes ~ /e/: realça 500 Hz e 2000 Hz
    def bp(sig, fc, q):
        w = 2 * np.pi * fc / SR; a = np.sin(w) / (2 * q)
        b0, b2, a0, a1, a2 = a, -a, 1 + a, -2 * np.cos(w), 1 - a
        y = np.zeros_like(sig); x1 = x2 = y1 = y2 = 0.0
        for i, v in enumerate(sig):
            o = (b0 * v + b2 * x2 - a1 * y1 - a2 * y2) / a0
            x2, x1, y2, y1 = x1, v, y1, o
            y[i] = o
        return y
    y = bp(x, 520, 3) + 0.8 * bp(x, 2100, 5)
    return y * env(t, 0.03, d * 0.6)

def save(name, x, peak=0.8):
    sf.write(OUT / name, (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32), SR)

# comemoração: "ê-ê!" subindo + palminhas
y = np.concatenate([voice(330, 420, 0.18), np.zeros(int(SR * 0.04)), voice(420, 640, 0.42)])
cl = np.zeros(int(SR * 0.9))
for k in range(6):
    i = int(SR * (0.12 + k * 0.11)); n = int(SR * 0.03)
    cl[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.006)) * 0.6
y = np.concatenate([y, np.zeros(max(0, len(cl) - len(y)))]) + cl[: max(len(y), len(cl))] if len(cl) >= len(y) else y
save("cheer.wav", y)
# "hmm/ops": descendo
save("ohno.wav", np.concatenate([voice(380, 300, 0.2), np.zeros(int(SR * 0.05)), voice(300, 190, 0.35)]))
# pulinho (boing)
t = T(0.35); f = 180 + 420 * np.exp(-t * 12) + 40 * np.sin(2 * np.pi * 18 * t) * np.exp(-t * 6)
save("hop.wav", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.005, 0.12), 0.5)
# passos (4 batidinhas)
st = np.zeros(int(SR * 1.2))
for k in range(4):
    i = int(SR * k * 0.28); n = int(SR * 0.05)
    st[i:i + n] += np.convolve(rng.standard_normal(n), np.ones(40) / 40, "same") * np.exp(-np.arange(n) / (SR * 0.012))
save("steps.wav", st, 0.5)
print("ok")
