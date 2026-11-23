# Efeitos sonoros do EP2, sintetizados por código (sem amostras). Uso: python3 sfx.py saida.wav
import numpy as np, sys, wave
SR = 48000; DUR = 93.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
t_all = np.arange(N) / SR
def noise(n): return rng.standard_normal(n)
def lp(x, a):  # passa-baixa de 1 polo simples (a = 0..1, menor = mais grave)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def lpf(x, a):  # versão vetorizada aproximada (média móvel exponencial via convolução curta)
    k = int(max(1, 1 / a)); w = np.exp(-np.arange(k * 4) / k); w /= w.sum()
    return np.convolve(x, w, mode='same')
def hp(x, a): return x - lpf(x, a)
def env(n, att, dec):
    t = np.arange(n) / SR; return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)
def put(t0, x, g=1.0, pan=0.0):
    i = int(t0 * SR); x = x[:max(0, N - i)]
    L[i:i+len(x)] += x * g * (1 - pan) ** 0.5 if pan > 0 else x * g
    R[i:i+len(x)] += x * g * (1 + pan) ** 0.5 if pan < 0 else x * g
def tone(f, d, a=0.002, dec=0.3):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, a, dec)
# --- ambiente: zumbido grave + ruído de sala (some no apagão)
DARK = 84.3; END = 86.6
room = 0.05 * np.sin(2*np.pi*50*t_all) + 0.03 * np.sin(2*np.pi*100*t_all) + 0.035 * lpf(noise(N), 0.004)
lv = np.ones(N); lv[t_all >= DARK] = 0.15; lv[t_all >= END] = 0.25; lv[t_all < 2.5] = 0.6
L += room * lv; R += room * lv
# zumbido das lâmpadas fluorescentes, com estalos no pisca-pisca
buzz = 0.018 * np.sign(np.sin(2*np.pi*120*t_all)) * lpf(np.ones(N), 0.5)
buzz = lpf(buzz, 0.05)
bl = np.ones(N); bl[t_all >= DARK] = 0
for a, b in [(36.0, 36.7), (41.0, 41.9), (83.0, 84.3)]:
    for k in np.arange(a, b, 1/15):
        on = rng.random() > 0.5; i0, i1 = int(k*SR), int((k+1/15)*SR); bl[i0:i1] = 1.0 if on else 0.05
        if on: put(k, hp(noise(int(0.03*SR)), 0.3) * env(int(0.03*SR), 0.001, 0.008), 0.25)
L += buzz * bl; R += buzz * bl
# --- abertura: drone e "zaps" do título piscando
n = int(2.5*SR); tt = np.arange(n)/SR
put(0, (0.12*np.sin(2*np.pi*41*tt) + 0.06*np.sin(2*np.pi*61.5*tt)) * np.minimum(1, tt/0.3) * np.clip((2.5-tt)/0.6, 0, 1), 1.0)
for z in [0.62, 0.69, 0.76, 1.36]: put(z, hp(noise(int(0.04*SR)), 0.2) * env(int(0.04*SR), 0.001, 0.01), 0.3)
# --- papel
def paper(t0, d, g):
    n = int(d*SR); x = hp(noise(n), 0.15) * (0.4 + 0.6*np.abs(np.sin(np.arange(n)/SR*2*np.pi*7))) * env(n, 0.02, d*0.6); put(t0, x, g)
paper(2.6, 0.5, 0.18); paper(6.0, 0.8, 0.2)
# --- passos
def step(t0, g=0.5):
    n = int(0.18*SR); x = lpf(noise(n), 0.02) * env(n, 0.002, 0.04) + 0.6*tone(70, 0.18, 0.001, 0.05); put(t0, x, g)
for k in [6.6, 7.0, 7.4, 15.1, 15.5, 15.9]: step(k)
# --- rangido do portão fechando + batida
n = int(1.5*SR); tt = np.arange(n)/SR; f = 300 + 180*np.sin(2*np.pi*0.7*tt) + 40*np.sin(2*np.pi*9*tt)
cre = np.sin(2*np.pi*np.cumsum(f)/SR) * (0.5+0.5*np.abs(np.sin(2*np.pi*13*tt))) + 0.3*np.sin(2*np.pi*np.cumsum(f*2.01)/SR)
put(7.4, cre * np.minimum(1, tt/0.1) * np.clip((1.5-tt)/0.2, 0, 1), 0.07, 0.2)
def clang(t0, g, base=180):
    n = int(1.4*SR); x = sum(np.sin(2*np.pi*base*m*np.arange(n)/SR) * np.exp(-np.arange(n)/SR*(3+m)) / m for m in [1, 2.76, 5.4, 8.9])
    x += hp(noise(n), 0.3) * env(n, 0.001, 0.02); put(t0, x * env(n, 0.001, 0.5), g)
clang(8.9, 0.35)
# --- corrente
def chain(t0, d, g, dens=40):
    for k in np.sort(rng.uniform(t0, t0+d, int(d*dens))):
        n = int(0.05*SR); f0 = rng.uniform(2500, 4800); x = np.sin(2*np.pi*f0*np.arange(n)/SR) * env(n, 0.0005, 0.012) + 0.4*hp(noise(n), 0.4)*env(n, 0.0005, 0.005)
        put(k, x, g * rng.uniform(0.4, 1.0), rng.uniform(-0.3, 0.3))
chain(9.4, 1.2, 0.18)
# --- clique do cadeado
n = int(0.12*SR); put(10.8, (hp(noise(n), 0.5) * env(n, 0.0003, 0.004) + 0.5*tone(2200, 0.12, 0.0003, 0.01)), 0.6)
put(10.86, hp(noise(n), 0.5) * env(n, 0.0003, 0.003), 0.4)
# --- sacudindo o cadeado
chain(11.6, 1.8, 0.28, 55)
for k in np.arange(11.7, 13.3, 0.22): clang(k, 0.05, 420)
# --- relógio
for k in np.arange(16.3, 19.6, 1.0): put(k, hp(noise(int(0.02*SR)), 0.5) * env(int(0.02*SR), 0.0005, 0.004) + 0.4*tone(3000, 0.02, 0.0005, 0.004), 0.3)
# --- TV: chiado baixo nas cenas da TV, rajadas no glitch
def static(t0, t1, g):
    n = int((t1-t0)*SR); x = hp(noise(n), 0.25) * (0.7 + 0.3*np.sin(2*np.pi*60*np.arange(n)/SR)); x *= np.minimum(1, np.arange(n)/SR/0.15) * np.clip(((t1-t0) - np.arange(n)/SR)/0.15, 0, 1); put(t0, x, g)
for a, b in [(20.4, 24.0), (36.9, 51.2), (55.9, 60.3), (72.6, 76.1), (80.6, 84.3)]: static(a, b, 0.025)
for a, b, g in [(24.0, 26.0, 0.16), (36.0, 36.8, 0.22), (72.0, 72.5, 0.18), (82.6, 83.0, 0.22)]: static(a, b, g)
# --- rádio: chiado e bipes
def radio(t0, t1):
    put(t0 - 0.25, tone(1400, 0.12, 0.002, 0.05) + tone(1800, 0.12, 0.002, 0.05), 0.12)
    n = int((t1-t0+0.3)*SR); x = hp(noise(n), 0.2); x = lpf(x, 0.2) * env(n, 0.01, 99) * np.clip((t1-t0+0.3 - np.arange(n)/SR)/0.1, 0, 1); put(t0 - 0.1, x, 0.04)
    put(t1 + 0.1, tone(1200, 0.1, 0.002, 0.04), 0.1)
radio(26.2, 31.4); radio(34.6, 35.5)
# --- tensão: drone grave subindo de 36 a 63 s
n = int(27*SR); tt = np.arange(n)/SR; fr = 38 + 10*tt/27
dr = (np.sin(2*np.pi*np.cumsum(fr)/SR) + 0.5*np.sin(2*np.pi*np.cumsum(fr*1.5)/SR)) * np.minimum(1, tt/4) * np.clip((27-tt)/1.5, 0, 1)
put(36.0, dr, 0.09)
# --- golpes de susto
def hit(t0, g):
    n = int(2.2*SR); tt = np.arange(n)/SR; x = np.sin(2*np.pi*(35 + 40*np.exp(-5*tt))*tt) * np.exp(-1.8*tt) + 0.3*lpf(noise(n), 0.05)*np.exp(-10*tt)
    sc = 0.25*np.sin(2*np.pi*np.cumsum(2400 + 600*np.sin(2*np.pi*31*tt))/SR) * np.exp(-3*tt)
    put(t0, x + sc, g)
hit(36.9, 0.55); hit(57.2, 0.5); hit(83.0, 0.55); hit(84.3, 0.6)
# --- coração: 45 a 60 s, acelerando
k = 45.0; bpm = 62
while k < 60.2:
    for off, gg in [(0, 1.0), (0.16, 0.7)]: put(k + off, tone(52, 0.25, 0.004, 0.07) + 0.5*tone(80, 0.25, 0.004, 0.05), 0.22 * gg)
    k += 60 / bpm; bpm = min(118, bpm + 3.2)
# --- respiração tensa na virada pra trás
for k in np.arange(60.2, 63.6, 0.85):
    n = int(0.6*SR); x = lpf(hp(noise(n), 0.05), 0.3) * np.sin(np.pi*np.arange(n)/n)**2; put(k, x, 0.09)
# --- cadeado balançando sozinho
chain(64.3, 3.8, 0.14, 18)
n = int(4*SR); tt = np.arange(n)/SR; put(64.3, np.sin(2*np.pi*np.cumsum(520 + 60*np.sin(2*np.pi*0.6*tt))/SR) * np.exp(-tt/1.6) * 0.5, 0.05)
# --- coração lento voltando antes do último susto (79-82.6 s)
k = 79.0
while k < 82.6:
    for off, gg in [(0, 1.0), (0.16, 0.7)]: put(k + off, tone(52, 0.25, 0.004, 0.07) + 0.5*tone(80, 0.25, 0.004, 0.05), 0.18 * gg)
    k += 1.0
# --- alívio
n = int(1.0*SR); put(76.4, lpf(hp(noise(n), 0.05), 0.25) * np.sin(np.pi*np.arange(n)/n)**2, 0.08)
# --- final: clique da lanterna e carimbo
put(END + 2/30, hp(noise(int(0.05*SR)), 0.4) * env(int(0.05*SR), 0.0003, 0.006) + 0.6*tone(1700, 0.05, 0.0003, 0.008), 0.5)
put(END + 118/30, lpf(noise(int(0.5*SR)), 0.03) * env(int(0.5*SR), 0.001, 0.06) * 3 + tone(60, 0.5, 0.001, 0.12), 0.5)
mx = np.max(np.abs(np.stack([L, R]))); st = (np.stack([L, R], 1) / mx * 0.8 * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('ok', mx)
