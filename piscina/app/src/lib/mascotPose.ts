// Vídeo 3 — o mascote aparece só nos momentos importantes, sempre de roupa de banho:
// abertura (quer piscina), pulo no lamaçal (imaginação), pH errado ardendo o olho (imaginação) e o mergulho final.
// Recebe o tempo efetivo t (que volta no rebobinar).
import type {MascotLook, MascotPose} from "../components/Mascot";
import {L, clamp01, easeInOut, easeOut} from "./anim";
import {W, end, rew, start, undoneS2} from "./story";

export const REWIND_FRAMES = 26;
type Look = MascotLook & {at?: [number, number, number]; ry?: number};

const base = (t: number): MascotPose => ({
  emotion: "happy",
  talk: 0, // sem sincronia labial (pedido do usuário): só reações no rosto
  lArm: [4 + Math.sin(t * 0.07) * 1.2, 12],
  rArm: [4, 12],
  umbrella: "none",
  umbrellaTilt: 0,
  jump: 0,
  shiver: 0,
  walking: false,
});
const inS = (id: string, t: number) => t >= start(id) && t < end(id);
const STAND: [number, number, number] = [-2.7, 0.06, 0.9];
const POOL_FLOAT: [number, number, number] = [1.2, -0.82, 0.7];

export const mascotLook = (t: number): Look => {
  const swim = {outfit: "swim" as const};
  if (inS("s1", t)) return {...swim, floaty: "arm", at: STAND, rHand: t > W("s1", "testar") - 6 ? "point" : undefined};
  if (inS("s2", t)) {
    const r = rew("s2");
    if (undoneS2(t)) return {...swim, floaty: "arm", at: STAND};
    if (t < r.P + 6) return {...swim, floaty: "arm", at: STAND};
    // pula no lamaçal: arco do gramado até o meio do buraco
    const k = clamp01((t - r.P - 6) / 26);
    const x = STAND[0] + (1.5 - STAND[0]) * easeInOut(k);
    const y = STAND[1] + Math.sin(k * Math.PI) * 1.3 + (-0.75 - STAND[1]) * k;
    return {...swim, floaty: "arm", at: [x, y, 0.6], muddy: clamp01((t - r.P - 30) / 12)};
  }
  if (inS("s8", t)) {
    const r = rew("s8");
    if (t < r.P || t >= r.R) return {};
    const dunk = t > r.P + 22 && t < r.P + 40 ? Math.sin(((t - r.P - 22) / 18) * Math.PI) * 0.55 : 0;
    return {...swim, at: [POOL_FLOAT[0], -1.05 - dunk + Math.sin(t * 0.15) * 0.03, POOL_FLOAT[2]], redEyes: clamp01((t - r.P - 40) / 10)};
  }
  if (inS("s9", t)) {
    const j = W("s9", "pular");
    if (t < j - 26) return {};
    if (t < j + 2) {
      // corre pela grama até a borda
      const k = clamp01((t - (j - 26)) / 28);
      return {...swim, floaty: "waist", at: [-3.6 + 1.7 * k, 0.06, 0.7], ry: Math.PI / 2 * (1 - clamp01((t - j + 4) / 6))};
    }
    if (t < j + 30) {
      const k = clamp01((t - j - 2) / 28);
      const x = -1.9 + (POOL_FLOAT[0] + 1.9) * k;
      const y = 0.06 + Math.sin(k * Math.PI) * 0.95 + (POOL_FLOAT[1] - 0.06) * easeOut(k);
      return {...swim, floaty: "waist", at: [x, y, POOL_FLOAT[2]]};
    }
    const ci = W("s9", "Comenta");
    return {...swim, floaty: "waist", at: [POOL_FLOAT[0], POOL_FLOAT[1] + Math.sin(t * 0.12) * 0.03, POOL_FLOAT[2]], rHand: t >= ci - 6 && t < ci + 40 ? "point" : undefined};
  }
  return {};
};

export const mascotPose = (t: number): MascotPose => {
  const pose = base(t);
  if (inS("s1", t)) {
    pose.emotion = t < W("s1", "Parece") ? "happy" : "grin";
    pose.rArm = t > W("s1", "testar") - 6 ? [-80, 25] : [-20 + Math.sin(t * 0.12) * 6, 20];
    pose.lArm = [-10, 30]; // braço com a boia
  } else if (inS("s2", t)) {
    const r = rew("s2");
    if (undoneS2(t) || t < r.P) {
      pose.emotion = undoneS2(t) ? "relieved" : t < W("s2", "desmoronam") ? "surprised" : "worried";
      pose.lArm = [-10, 30];
      pose.rArm = [-45, 40];
    } else if (t < r.P + 32) {
      pose.emotion = "joy"; // pula achando que vai ser legal
      pose.lArm = [-10, 150];
      pose.rArm = [-10, 150];
    } else {
      const k = clamp01((t - r.P - 32) / 12);
      pose.emotion = k > 0.4 ? "sick" : "surprised";
      pose.sick = k * 0.8;
      pose.lArm = [-30, 20];
      pose.rArm = [-30, 20];
      pose.shiver = 0.5 * k;
    }
  } else if (inS("s8", t)) {
    const r = rew("s8");
    const k = clamp01((t - r.P - 40) / 10);
    if (k <= 0) {
      pose.emotion = "joy";
      pose.lArm = [-10, 120 + Math.sin(t * 0.4) * 15];
      pose.rArm = [-10, 120 - Math.sin(t * 0.4) * 15];
    } else {
      // olhos ardendo: esfrega os olhos com as duas mãos
      pose.emotion = "sick";
      pose.lArm = [-150 + Math.sin(t * 0.8) * 8, -28];
      pose.rArm = [-150 - Math.sin(t * 0.8) * 8, -28];
      pose.shiver = 0.3;
    }
  } else if (inS("s9", t)) {
    const j = W("s9", "pular");
    const ci = W("s9", "Comenta"), fw = W("s9", "segue");
    if (t < j + 2) {
      pose.walking = true;
      pose.emotion = "grin";
      pose.lArm = [Math.sin(t * 0.45) * 30, 15];
      pose.rArm = [-Math.sin(t * 0.45) * 30, 15];
    } else if (t < j + 30) {
      pose.emotion = "joy";
      pose.lArm = [-10, 165];
      pose.rArm = [-10, 165];
    } else if (t >= ci - 6 && t < ci + 40) {
      pose.emotion = "grin";
      pose.rArm = [-88, 8]; // aponta para quem assiste
      pose.lArm = [-10, 40];
    } else if (t >= fw - 10) {
      pose.emotion = "grin";
      pose.rArm = [-10, 150 + Math.sin(t * 0.35) * 20]; // acena
      pose.lArm = [-10, 40];
    } else {
      pose.emotion = "joy";
      pose.lArm = [-10, 60 + Math.sin(t * 0.3) * 10];
      pose.rArm = [-10, 60 - Math.sin(t * 0.3) * 10];
    }
  }
  return pose;
};
export const unused = [L, easeOut];
