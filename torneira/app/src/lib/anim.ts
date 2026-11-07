import {Easing, interpolate, spring} from "remotion";

export const FPS = 30;
export const rad = (d: number) => (d * Math.PI) / 180;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** interpolate com clamp */
export const L = (f: number, f0: number, f1: number, from: number, to: number, easing?: (t: number) => number) =>
  f1 <= f0 ? (f >= f1 ? to : from) : interpolate(f, [f0, f1], [from, to], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing});

/** spring a partir de f0 (leve overshoot) */
export const SP = (f: number, f0: number, damping = 12, stiffness = 110) =>
  f < f0 ? 0 : spring({frame: f - f0, fps: FPS, config: {damping, stiffness}});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(lerp(v, y[i], clamp01(t))).toString(16).padStart(2, "0")).join("");
};
