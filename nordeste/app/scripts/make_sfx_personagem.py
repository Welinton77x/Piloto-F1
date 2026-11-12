"""Sons de reação do personagem (vídeo 6): bafo de calor, alívio, brilho de comemoração, confete, passada de mão na testa."""
from pathlib import Path
import numpy as np, soundfile as sf
SR = 44100; OUT = Path(__file__).resolve().parent.parent / "public/sfx"; rng = np.random.default_rng(16)
T = lambda d: np.arange(int(SR * d)) / SR
def save(n, x, pk=0.8): sf.write(OUT / n, (x / (np.max(np.abs(x)) + 1e-9) * pk).astype(np.float32), SR)
def bp(x, f, q=6):
    # ressonador de 2 polos (filtro passa-banda simples)
    r = np.exp(-np.pi * f / q / SR); c = 2 * r * np.cos(2 * np.pi * f / SR); y = np.zeros_like(x)
    for i in range(2, len(x)): y[i] = x[i] + c * y[i - 1] - r * r * y[i - 2]
    return y
def breath(d, f1, f2, f3=None):
    n = rng.standard_normal(int(SR * d)); t = T(d)
    v = bp(n, f1, 5) + 0.6 * bp(n, f2, 6) + (0.3 * bp(n, f3, 8) if f3 else 0)
    return v * np.sin(np.pi * np.minimum(1, t / d)) ** 1.5
def bell(f, d):
    t = T(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t)) * np.exp(-t * 6)
# calor: "haa... haa" ofegante + ondulação de calor (tom grave que tremula)
y = np.zeros(int(SR * 1.6))
for k, s in enumerate([0.0, 0.42, 0.84]):
    b = breath(0.3, 800, 1250, 2600) * (1 - 0.15 * k); i = int(SR * s); y[i:i + len(b)] += b
t = T(1.6); y = y / np.max(np.abs(y)) + 0.35 * np.sin(2 * np.pi * (180 + 25 * np.sin(2 * np.pi * 5 * t)) * t) * np.sin(np.pi * t / 1.6)
save("calor.wav", y, 0.6)
# alívio: "aaah" longo descendo + brilho suave
b = breath(1.1, 700, 1100, 2400); t = T(1.1); b *= np.exp(-t * 1.2)
y = b / np.max(np.abs(b)); c = np.zeros_like(y); s = bell(1568, 0.8); c[int(SR * 0.15):int(SR * 0.15) + len(s)] += s[: len(c) - int(SR * 0.15)]
save("alivio.wav", y + 0.25 * c, 0.6)
# comemoração: arpejo de sininhos subindo
y = np.zeros(int(SR * 1.3))
for k, f in enumerate([1047, 1319, 1568, 2093, 2637]):
    s = bell(f, 0.9); i = int(SR * 0.07 * k); y[i:i + len(s)] += s[: len(y) - i]
save("brilho.wav", y, 0.6)
# confete: estalo + chuva de papel picado
t = T(1.2); pop = np.sin(2 * np.pi * (220 * np.exp(-t * 30) + 90) * t) * np.exp(-t * 25)
cr = np.zeros(len(t))
for _ in range(90):
    i = int(rng.uniform(0.04, 1.0) * SR); L = int(SR * 0.008); cr[i:i + L] += rng.standard_normal(L) * rng.uniform(0.2, 1) * np.hanning(L)
cr = np.diff(np.concatenate([[0], cr])) * np.exp(-t * 1.8)
save("confete.wav", pop + 0.25 * cr / np.max(np.abs(cr)) + 0.6 * np.diff(np.concatenate([[0], rng.standard_normal(len(t))])) * np.exp(-t * 40), 0.6)
# passada de mão na testa: swish curto
n = rng.standard_normal(int(SR * 0.35)); t = T(0.35)
y = bp(n, 1800, 2) * np.sin(np.pi * t / 0.35) ** 2
save("enxuga.wav", y, 0.45)
print("ok")
