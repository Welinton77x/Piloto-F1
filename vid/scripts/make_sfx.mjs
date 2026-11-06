// Gera efeitos e trilha 100% por código (sem direitos de terceiros). Uso: node scripts/make_sfx.mjs
import {writeFileSync, mkdirSync} from "node:fs";

const SR = 44100;
mkdirSync("public/sfx", {recursive: true});

function wav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32000, 44 + i * 2);
  writeFileSync(`public/sfx/${name}.wav`, buf);
}

// PRNG determinístico para o ruído
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const make = (sec, fn) => Float64Array.from({length: Math.floor(sec * SR)}, (_, i) => fn(i / SR, i));

// pop do badge
wav("pop", make(0.18, (t) => Math.sin(2 * Math.PI * (700 - 1800 * t) * t) * Math.exp(-t * 22) * 0.8));

// whoosh (ruído com filtro passa-baixa que abre)
{
  let y = 0;
  wav(
    "whoosh",
    make(0.7, (t) => {
      const a = 0.02 + 0.5 * Math.sin((Math.PI * t) / 0.7);
      y += (rnd() - y) * (0.02 + 0.5 * (t / 0.7));
      return y * a * 1.6 * Math.sin((Math.PI * t) / 0.7);
    }),
  );
}

// thud grave (freio, peso, metal)
wav("thud", make(0.4, (t) => Math.sin(2 * Math.PI * (120 - 150 * t) * t) * Math.exp(-t * 9) * 0.95));

// batida de coração (duas pancadas)
wav(
  "beat",
  make(0.7, (t) => {
    const h = (t0) => (t > t0 ? Math.sin(2 * Math.PI * 70 * (t - t0)) * Math.exp(-(t - t0) * 20) : 0);
    return (h(0) + 0.7 * h(0.18)) * 0.9;
  }),
);

// tique
wav("tick", make(0.08, (t) => Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 60) * 0.5));


// ding de solução (duas notas brilhantes)
wav("ding", make(0.6, (t) => (Math.sin(2 * Math.PI * 988 * t) + 0.6 * Math.sin(2 * Math.PI * 1480 * Math.max(0, t - 0.09))) * Math.exp(-t * 6) * 0.35));

// alerta de problema (bipe duplo grave)
wav("alert", make(0.45, (t) => {
  const on = t < 0.15 || (t > 0.22 && t < 0.37);
  return on ? Math.sign(Math.sin(2 * Math.PI * 330 * t)) * 0.18 + Math.sin(2 * Math.PI * 220 * t) * 0.2 : 0;
}));

// motor de F1 (zumbido que sobe)
{
  let ph = 0;
  wav("engine", make(1.6, (t) => {
    const fr = 140 + 520 * (t / 1.6) ** 1.5;
    ph += (2 * Math.PI * fr) / SR;
    const env = Math.min(1, t * 8) * Math.min(1, (1.6 - t) * 5);
    return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph) + 0.15 * rnd()) * 0.28 * env;
  }));
}

// freada / rangido de pneu
{
  let y = 0;
  wav("squeal", make(0.8, (t) => {
    y += (rnd() - y) * 0.25;
    const env = Math.min(1, t * 10) * Math.exp(-t * 2.2);
    return (Math.sin(2 * Math.PI * (2400 - 700 * t) * t) * 0.25 + y * 0.5) * env;
  }));
}

// brilho / faísca
wav("sparkle", make(0.5, (t) => {
  let v = 0;
  for (const [t0, f] of [[0, 1760], [0.07, 2217], [0.14, 2637], [0.21, 3520]]) if (t > t0) v += Math.sin(2 * Math.PI * f * (t - t0)) * Math.exp(-(t - t0) * 14);
  return v * 0.18;
}));

// chiado (suor / calor)
{
  let y = 0;
  wav("sizzle", make(1.0, (t) => {
    y += (rnd() - y) * 0.7;
    return (y - 0.0) * 0.28 * Math.min(1, t * 12) * Math.exp(-t * 2.5);
  }));
}

// clique de cinto / metal
wav("click", make(0.25, (t) => (Math.sin(2 * Math.PI * 2800 * t) * Math.exp(-t * 90) + 0.7 * Math.sin(2 * Math.PI * 1200 * Math.max(0, t - 0.06)) * Math.exp(-Math.max(0, t - 0.06) * 70)) * 0.5));

// boing de mola
wav("boing", make(0.6, (t) => Math.sin(2 * Math.PI * (300 + 220 * Math.sin(2 * Math.PI * 9 * t)) * t) * Math.exp(-t * 5) * 0.5));

// trilha: 8 s em loop, 120 bpm, Am - F - C - G
{
  const beat = 0.5;
  const prog = [
    [110, [220, 261.63, 329.63]],
    [87.31, [174.61, 220, 261.63]],
    [130.81, [261.63, 329.63, 392]],
    [98, [196, 246.94, 293.66]],
  ];
  const total = 8;
  wav(
    "music",
    make(total, (t) => {
      const bar = Math.min(3, Math.floor(t / 2));
      const [root, arp] = prog[bar];
      const tb = t - bar * 2;
      const bassEnv = Math.exp(-((tb % beat) * 5));
      const bass = Math.sin(2 * Math.PI * root * t) * bassEnv * 0.5;
      const step = Math.floor(tb / (beat / 2));
      const f = arp[step % 3];
      const te = tb % (beat / 2);
      const lead = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-te * 9) * 0.22;
      const fade = Math.min(1, t * 200, (total - t) * 200);
      return (bass + lead) * fade;
    }),
  );
}
console.log("sfx gerados em public/sfx");
