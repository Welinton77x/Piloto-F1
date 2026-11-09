import * as THREE from "three";

export const FPS = 30;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** 0→1 entre os frames a e b com suavização */
export const ramp = (f: number, a: number, b: number, ease = smooth) => ease((f - a) / (b - a));
/** mola com leve passada do ponto (pop) */
export const pop = (f: number, start: number, dur = 12) => {
  const t = clamp((f - start) / dur);
  if (t <= 0) return 0;
  return 1 + Math.sin(t * Math.PI * 1.15) * 0.25 * (1 - t) - Math.pow(1 - t, 3);
};
export const mix3 = (a: number[], b: number[], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** tremor de câmera determinístico */
export const shake = (f: number, amt: number): [number, number, number] => [
  amt * (Math.sin(f * 1.7) * 0.6 + Math.sin(f * 3.1 + 1) * 0.4),
  amt * (Math.sin(f * 2.3 + 2) * 0.6 + Math.sin(f * 4.7) * 0.4),
  0,
];

/** Texturas procedurais (canvas) — madeira, parede, céu */
const cache = new Map<string, THREE.CanvasTexture>();
export const canvasTex = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, r: () => number) => void, repeat: [number, number] = [1, 1]) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx, rng(key.length * 977 + 13));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

export const woodTex = (key: string, base: [number, number, number], planks: number, repeat: [number, number]) =>
  canvasTex(key, 1024, 1024, (c, r) => {
    const ph = 1024 / planks;
    for (let i = 0; i < planks; i++) {
      const v = 0.82 + r() * 0.3;
      c.fillStyle = `rgb(${base[0] * v},${base[1] * v},${base[2] * v})`;
      c.fillRect(0, i * ph, 1024, ph);
      for (let g = 0; g < 26; g++) {
        const y = i * ph + r() * ph;
        c.strokeStyle = `rgba(40,20,8,${0.05 + r() * 0.08})`;
        c.lineWidth = 1 + r() * 2;
        c.beginPath();
        c.moveTo(0, y);
        c.bezierCurveTo(300, y + (r() - 0.5) * 8, 700, y + (r() - 0.5) * 8, 1024, y + (r() - 0.5) * 6);
        c.stroke();
      }
      c.fillStyle = "rgba(30,15,5,0.55)";
      c.fillRect(0, i * ph, 1024, 3);
      const cut = r() * 1024;
      c.fillRect(cut, i * ph, 3, ph);
    }
  }, repeat);
