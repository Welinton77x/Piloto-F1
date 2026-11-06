"""Efeitos e trilha sintetizados por código (sem direitos de terceiros). Escreve public/sfx/*.wav.
Uso: python scripts/make_sfx.py"""
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def lp(x, a):  # passa-baixa de 1 polo (a pequeno = mais grave)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def lp_fast(x, a):
    # filtro de 1 polo vetorizado via convolução com resposta exponencial truncada
    n = int(min(len(x), max(32, 6 / a)))
    k = a * (1 - a) ** np.arange(n)
    return np.convolve(x, k)[: len(x)]


def norm(x, peak=0.8):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def save(name, x, stereo_w=0.0):
    x = np.clip(x, -1, 1).astype(np.float32)
    if stereo_w:
        d = int(0.012 * SR)
        r = np.concatenate([np.zeros(d, np.float32), x[:-d]])
        x = np.stack([x, (1 - stereo_w) * x + stereo_w * r], 1)
    sf.write(OUT / name, x, SR)
    print(name, round(len(x) / SR, 2), "s")


# chuva: ruído rosa-ish com gotinhas, loop de 12 s com crossfade
n = SR * 12
w = rng.standard_normal(n + SR)
rain = lp_fast(w, 0.25) - 0.6 * lp_fast(w, 0.02)
drops = np.zeros_like(rain)
for p in rng.integers(0, len(rain) - 400, 900):
    drops[p : p + 300] += rng.uniform(0.2, 0.6) * np.exp(-np.arange(300) / 40) * np.sin(np.arange(300) * rng.uniform(0.3, 0.9))
rain = rain + 0.5 * drops
fade = SR
loop = rain[:n].copy()
loop[:fade] = loop[:fade] * np.linspace(0, 1, fade) + rain[n : n + fade] * np.linspace(1, 0, fade)
save("rain.wav", norm(loop, 0.7), 0.6)

# trilha: pad calmo em lá menor (Am–F–C–G), 4 compassos de 4 s, loop de 16 s
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
mus = np.zeros(SR * 16)
for i, ch in enumerate(chords):
    tt = t(4)
    seg = np.zeros_like(tt)
    for m in ch:
        f = 440 * 2 ** ((m - 69) / 12)
        seg += np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 2 * tt + 0.3) * 0.12
    e = np.minimum(1, tt / 0.8) * np.minimum(1, (4 - tt) / 0.8)
    mus[i * SR * 4 : (i + 1) * SR * 4] += seg * e
    # pulso suave de baixo
    f0 = 440 * 2 ** ((ch[0] - 12 - 69) / 12)
    for b in range(4):
        bt = t(0.9)
        start = i * SR * 4 + b * SR
        mus[start : start + len(bt)] += 0.5 * np.sin(2 * np.pi * f0 * bt) * np.exp(-bt * 4)
save("music.wav", norm(lp_fast(mus, 0.3), 0.6), 0.5)

# pop dos selos
tt = t(0.18)
save("pop.wav", norm(np.sin(2 * np.pi * (500 + 900 * tt / 0.18) * tt) * np.exp(-tt * 28), 0.7))

# whoosh (mergulho / rewind)
tt = t(0.9)
wn = rng.standard_normal(len(tt))
sweep = np.array([lp_fast(wn[i : i + 2000], 0.05 + 0.4 * (i / len(tt)))[-1] if False else 0 for i in range(0)])
wh = lp_fast(wn, 0.12) * np.sin(np.pi * tt / 0.9) ** 2
save("whoosh.wav", norm(wh, 0.7))

# trovão: ruído grave com estalo inicial e rolagem
tt = t(3.5)
wn = rng.standard_normal(len(tt))
th = lp_fast(wn, 0.012) * np.exp(-tt * 0.9) * (1 + 0.6 * np.sin(2 * np.pi * 1.7 * tt))
th[: int(0.05 * SR)] += lp_fast(wn[: int(0.05 * SR)], 0.4) * 0.6
save("thunder.wav", norm(th, 0.9), 0.4)

# gorgolejo: bolhas ressonantes
tt = t(1.6)
g = np.zeros_like(tt)
for p in rng.integers(0, len(tt) - 3000, 40):
    bt = np.arange(3000) / SR
    f = rng.uniform(180, 420)
    g[p : p + 3000] += np.sin(2 * np.pi * f * bt * (1 + bt * 6)) * np.exp(-bt * 30)
g += 0.3 * lp_fast(rng.standard_normal(len(tt)), 0.08)
save("gurgle.wav", norm(g * env(len(tt), 0.05, 0.4), 0.6))

# respingo
tt = t(0.7)
sp = (lp_fast(rng.standard_normal(len(tt)), 0.5) - lp_fast(rng.standard_normal(len(tt)), 0.05)) * np.exp(-tt * 6)
save("splash.wav", norm(sp, 0.7))

# plástico amassando: estalos curtos
tt = t(0.9)
cr = np.zeros_like(tt)
for p in rng.integers(0, len(tt) - 200, 120):
    cr[p : p + 200] += rng.uniform(-1, 1) * np.exp(-np.arange(200) / 25)
save("crinkle.wav", norm(lp_fast(cr, 0.6) * env(len(tt)), 0.6))

# baque grave (piscinão / lixeira)
tt = t(0.6)
save("thud.wav", norm(np.sin(2 * np.pi * (90 - 40 * tt) * tt) * np.exp(-tt * 9) + 0.2 * lp_fast(rng.standard_normal(len(tt)), 0.05) * np.exp(-tt * 20), 0.85))

# borbulho de cano cheio
tt = t(1.2)
bu = np.zeros_like(tt)
for p in rng.integers(0, len(tt) - 2500, 25):
    bt = np.arange(2500) / SR
    bu[p : p + 2500] += np.sin(2 * np.pi * rng.uniform(90, 200) * bt * (1 + bt * 10)) * np.exp(-bt * 18)
save("bubble.wav", norm(bu * env(len(tt), 0.02, 0.3), 0.6))

# gota (infiltração / contagem)
tt = t(0.25)
save("drip.wav", norm(np.sin(2 * np.pi * (900 - 500 * tt / 0.25) * tt) * np.exp(-tt * 22), 0.5))
