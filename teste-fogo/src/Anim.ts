import type {Pose} from "./Boy";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import words from "./timing.json";

/* ---------- linha do tempo (frames, 30 fps) — segue os tempos de cada palavra ---------- */
const S = (w: number) => Math.round(words[w].s * FPS);
export const T = {
  fogo1: S(4), // "fogo."
  snap: S(8) + 3, // "dedos..."
  ignite: S(12), // "acende."
  reach: S(17), // "tudo"
  touch: S(20) + 8, // "encosta..."
  burn: S(21), // "pega"
};
export const SHOT_B = Math.round((words[4].e + 0.45) * FPS);
export const SHOT_C = Math.round((words[12].e + 0.5) * FPS);
export const SHOT_D = T.burn - 6;
export const TOTAL = Math.round((words[words.length - 1].e + 1.4) * FPS);
const SHOTS = [0, SHOT_B, SHOT_C, SHOT_D];

type V3 = [number, number, number];
export type Cam = {pos: V3; look: V3; fov: number};
export type State = {pose: Pose; cam: Cam; helix: number; palmPower: number; palmSize: number; bookBurn: number; dim: number};

/** salto: 0 no chão, sobe e desce (parábola) entre a e b */
const hop = (f: number, a: number, b: number, h: number) => {
  const x = (f - a) / (b - a);
  return x <= 0 || x >= 1 ? 0 : 4 * h * x * (1 - x);
};
/** pulso rápido (impacto) que decai */
const kick = (f: number, at: number, len = 6) => (f < at ? 0 : Math.exp(-(f - at) / len));

/* ---------- poses-alvo (o que o animador "marcaria" em cada momento) ---------- */
const target = (f: number): State => {
  const t = f / FPS;
  const blinkAt = (fr: number) => clamp(1 - Math.abs(f - fr) / 3);
  const base: Pose = {breathe: Math.sin(t * 2.4), blink: Math.max(blinkAt(16), blinkAt(110), blinkAt(200))};

  if (f < SHOT_B) {
    // A — antecipação (agacha, punhos fechando) → explode para cima com o fogo e flutua
    const crouch = ramp(f, T.fogo1 - 14, T.fogo1 - 2, easeInOut) * (1 - ramp(f, T.fogo1 - 2, T.fogo1 + 3, easeOut));
    const k = ramp(f, T.fogo1 - 2, T.fogo1 + 8, easeOut);
    const helix = ramp(f, T.fogo1, T.fogo1 + 14);
    const float = k * (0.07 + 0.02 * Math.sin(t * 3.1));
    const pose: Pose = {
      ...base,
      pos: [0, float - 0.05 * crouch, 0],
      squash: 0.12 * crouch - 0.06 * kick(f, T.fogo1, 5),
      torso: [0.12 * crouch - 0.05 * k, 0, 0],
      head: [0.15 * crouch - 0.08 * k, 0.12 * (1 - k), 0.05 * (1 - k)],
      brow: lerp(0, -0.7, Math.max(crouch, k)),
      smile: lerp(0.3, 0.9, k),
      glow: k,
      rShoulder: [-0.25 * crouch, 0, lerp(-0.08, -0.55, k) - 0.1 * crouch],
      lShoulder: [-0.25 * crouch, 0, lerp(0.08, 0.55, k) + 0.1 * crouch],
      rElbow: lerp(-0.15, -0.5, Math.max(k, crouch)),
      lElbow: lerp(-0.15, -0.5, Math.max(k, crouch)),
      rFist: Math.max(k, crouch),
      hairLift: helix,
    };
    const p = ramp(f, 0, SHOT_B, easeInOut);
    const sh = shake(f, 0.014 * helix + 0.02 * kick(f, T.fogo1, 4));
    return {pose, cam: {pos: [lerp(0.3, 0, p) + sh[0], 1.4 + sh[1], lerp(3.6, 2.9, p)], look: [0, 1.15, 0], fov: 42}, helix, palmPower: 0, palmSize: 1, bookBurn: 0, dim: 0.25 * helix};
  }

  if (f < SHOT_C) {
    // B — levanta a mão, prepara (fecha), estala (estalo com tranco), a mão acende (coice para baixo)
    const up = ramp(f, SHOT_B - 4, SHOT_B + 10, easeOut);
    const fist = ramp(f, T.snap - 10, T.snap - 3) * (1 - ramp(f, T.snap, T.snap + 2));
    const snapK = kick(f, T.snap, 3);
    const ign = kick(f, T.ignite, 5);
    const lit = ramp(f, T.ignite, T.ignite + 8);
    const pose: Pose = {
      ...base,
      pos: [0, -0.015 * ign, 0],
      squash: 0.05 * ign,
      torso: [0.04 * ign, 0, 0],
      rShoulder: [lerp(0, -0.5, up) + 0.25 * ign, 0.2 * up, lerp(-0.08, -0.12, up)],
      rElbow: lerp(-0.15, -1.75, up) + 0.15 * (fist - snapK) + 0.45 * ign,
      rWrist: [0.15 * up - 0.7 * snapK + 0.3 * fist, 0, -0.45 * snapK],
      rFist: fist,
      lShoulder: [0, 0, 0.08 + 0.15 * ign],
      head: [0.22 - 0.12 * ign, -0.32, 0.04 * ign],
      pupil: [-0.6, -0.5],
      brow: lerp(-0.3, 0.6, lit),
      eyeWide: 0.7 * lit,
      smile: lerp(0.6, 1, lit),
      mouthOpen: 0.4 * lit * (1 - ramp(f, T.ignite + 18, T.ignite + 28)),
      glow: 0.3 * lit,
    };
    const p = ramp(f, SHOT_B, SHOT_C, easeInOut);
    const sh = shake(f, 0.006 * snapK + 0.012 * ign);
    return {
      pose,
      cam: {pos: [lerp(-1.05, -0.85, p) + sh[0], lerp(1.3, 1.28, p) + sh[1], lerp(1.75, 1.45, p)], look: [-0.22, 1.3, 0.2], fov: 34},
      helix: 0,
      palmPower: pop(f, T.ignite, 14),
      palmSize: 1,
      bookBurn: 0,
      dim: 0.35 * lit,
    };
  }

  if (f < SHOT_D) {
    // C — inclina o corpo, estende o braço até o livro (peso vai para a frente)
    const reach = ramp(f, T.reach, T.touch, easeInOut);
    const lean = ramp(f, T.reach - 6, T.touch - 4, easeInOut);
    const pose: Pose = {
      ...base,
      pos: [1.2, -0.02 * lean, -0.82 - 0.05 * lean],
      rotY: Math.PI,
      torso: [0.18 * lean, 0, -0.05 * lean],
      rShoulder: [lerp(-0.45, -1.05, reach), 0.15 * (1 - reach), lerp(-0.15, -0.02, reach)],
      rElbow: lerp(-1.4, -0.3, reach),
      rWrist: [lerp(0.1, 0.5, reach), lerp(0, Math.PI, reach), 0],
      lShoulder: [0.15 * lean, 0, 0.12 + 0.1 * lean],
      lElbow: -0.25 - 0.2 * lean,
      head: [lerp(0.25, 0.35, reach), lerp(-0.2, 0, reach), 0],
      pupil: [0, -0.7],
      smile: 0.6,
    };
    const p = ramp(f, SHOT_C, SHOT_D, easeInOut);
    return {pose, cam: {pos: [lerp(2.25, 2.05, p), lerp(1.95, 1.8, p), lerp(0.45, 0.15, p)], look: [1.4, 0.9, -1.4], fov: 40}, helix: 0, palmPower: 0.75, palmSize: 0.7, bookBurn: 0, dim: 0.25};
  }

  // D — o livro explode em chamas: susto, pulo para trás com aterrissagem amassando
  const bookBurn = ramp(f, T.burn, T.burn + 40, (x) => x);
  const jolt = ramp(f, T.burn + 1, T.burn + 6, easeOut);
  const jumpA = T.burn + 3;
  const jumpB = T.burn + 16;
  const land = kick(f, jumpB, 4);
  const back = ramp(f, jumpA, jumpB, easeOut);
  const pose: Pose = {
    ...base,
    pos: [1.2, hop(f, jumpA, jumpB, 0.16) - 0.03 * land, lerp(-0.85, -0.5, back)],
    rotY: Math.PI,
    squash: 0.14 * land - 0.06 * kick(f, jumpA, 3),
    torso: [lerp(0.18, -0.15, jolt) + 0.12 * land, 0, 0],
    rShoulder: [lerp(-1.05, -0.3, jolt), 0, lerp(-0.02, -0.6, jolt)],
    rElbow: lerp(-0.3, -1.8, jolt),
    rWrist: [0.5, lerp(Math.PI, 0, jolt), 0],
    lShoulder: [lerp(0, -0.3, jolt), 0, lerp(0.12, 0.7, jolt)],
    lElbow: lerp(-0.25, -1.4, jolt),
    head: [lerp(0.35, -0.12, jolt) + 0.1 * land, 0, 0],
    eyeWide: jolt,
    brow: lerp(0, 1, jolt),
    mouthOpen: jolt * 0.9,
    pupil: [0, lerp(-0.7, -0.4, jolt)],
  };
  const sh = shake(f, 0.025 * kick(f, T.burn, 10) + 0.012 * land + 0.004 * bookBurn);
  const p = ramp(f, SHOT_D, TOTAL, easeInOut);
  return {
    pose,
    cam: {pos: [lerp(1.75, 1.7, p) + sh[0], lerp(1.08, 1.02, p) + sh[1], lerp(-2.38, -2.22, p)], look: [1.4, 1.12, -0.8], fov: 52},
    helix: 0,
    palmPower: 0.75 * (1 - jolt * 0.6),
    palmSize: 0.7,
    bookBurn,
    dim: 0.25 + 0.3 * ramp(f, T.burn, T.burn + 8),
  };
};

/* ---------- física: molas com sobra de movimento (overshoot) e atraso (follow-through) ---------- */
type Chan = {get: (p: Pose) => number; set: (p: Pose, v: number) => void; k: number; c: number};
const DEF: Required<Pick<Pose, "pos" | "head" | "torso" | "rShoulder" | "lShoulder" | "rWrist">> & {rElbow: number; lElbow: number} = {
  pos: [0, 0, 0],
  head: [0, 0, 0],
  torso: [0, 0, 0],
  rShoulder: [0, 0, -0.08],
  lShoulder: [0, 0, 0.08],
  rWrist: [0, 0, 0],
  rElbow: -0.15,
  lElbow: -0.15,
};
const vec = (key: "pos" | "head" | "torso" | "rShoulder" | "lShoulder" | "rWrist", i: number, k: number, c: number): Chan => ({
  get: (p) => (p[key] ?? DEF[key])[i],
  set: (p, v) => {
    const a = [...(p[key] ?? DEF[key])] as V3;
    a[i] = v;
    p[key] = a;
  },
  k,
  c,
});
const num = (key: "rElbow" | "lElbow", k: number, c: number): Chan => ({get: (p) => p[key] ?? DEF[key], set: (p, v) => (p[key] = v), k, c});

// k = rigidez, c = amortecimento (por quadro). Menos rigidez = mais “peso” e balanço.
const CHANNELS: Chan[] = [
  ...[0, 1, 2].map((i) => vec("torso", i, 0.3, 0.42)),
  ...[0, 1, 2].map((i) => vec("head", i, 0.22, 0.32)), // cabeça atrasa e balança
  ...[0, 1, 2].map((i) => vec("rShoulder", i, 0.32, 0.36)),
  ...[0, 1, 2].map((i) => vec("lShoulder", i, 0.26, 0.3)),
  num("rElbow", 0.24, 0.3), // antebraço atrasa mais que o ombro
  num("lElbow", 0.2, 0.26),
  ...[0, 2].map((i) => vec("rWrist", i, 0.35, 0.4)),
];

const cache = new Map<number, State>();

/** Estado final no quadro f: poses-alvo + molas simuladas desde o início do plano + cabelo balançando */
export const stateAt = (f: number): State => {
  const hit = cache.get(f);
  if (hit) return hit;
  const shotStart = [...SHOTS].reverse().find((s) => f >= s) ?? 0;
  const s0 = target(shotStart);
  const x = CHANNELS.map((ch) => ch.get(s0.pose));
  const v = CHANNELS.map(() => 0);
  let hairX = 0, hairZ = 0, hvX = 0, hvZ = 0;
  let prevHead = [...(s0.pose.head ?? [0, 0, 0])];
  let prevY = (s0.pose.pos ?? [0, 0, 0])[1];
  let prevVy = 0;
  let out = s0;
  for (let fr = shotStart; fr <= f; fr++) {
    out = fr === shotStart ? s0 : target(fr);
    const pose: Pose = {...out.pose};
    CHANNELS.forEach((ch, i) => {
      const goal = ch.get(out.pose);
      v[i] += (goal - x[i]) * ch.k;
      v[i] *= 1 - ch.c;
      x[i] += v[i];
      ch.set(pose, x[i]);
    });
    // cabelo: reage à aceleração da cabeça e do corpo (inércia), com mola própria
    const head = pose.head ?? [0, 0, 0];
    const y = (pose.pos ?? [0, 0, 0])[1];
    const vy = y - prevY;
    const ay = vy - prevVy;
    const dHx = head[0] - prevHead[0];
    const dHz = head[2] - prevHead[2];
    hvX += (-hairX - dHx * 6 + ay * 25) * 0.25;
    hvZ += (-hairZ - dHz * 6) * 0.25;
    hvX *= 0.78;
    hvZ *= 0.78;
    hairX += hvX;
    hairZ += hvZ;
    prevHead = [...head];
    prevY = y;
    prevVy = vy;
    pose.hair = [hairX, hairZ];
    out = {...out, pose};
  }
  cache.set(f, out);
  return out;
};
