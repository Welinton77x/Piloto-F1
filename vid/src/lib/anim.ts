import {Easing, interpolate, spring} from "remotion";

export const FPS = 30;
export const rad = (d: number) => (d * Math.PI) / 180;

/** interpolate com clamp: L(frame, f0, f1, de, para, easing?) */
export const L = (
  f: number,
  f0: number,
  f1: number,
  from: number,
  to: number,
  easing?: (t: number) => number,
) =>
  interpolate(f, [f0, f1], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** spring com entrada a partir do frame f0 (overshoot leve por padrão) */
export const SP = (f: number, f0: number, damping = 12, stiffness = 100) =>
  spring({frame: f - f0, fps: FPS, config: {damping, stiffness}});

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
