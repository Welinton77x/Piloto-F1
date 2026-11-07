// Vídeo 3 — o mascote participa de todas as etapas (pedido do usuário):
// de roupa de banho quando vai entrar na água (s1, s2, imaginação do s8, s9) e de roupa normal explicando (s3–s8).
// Recebe o tempo efetivo t (que volta no rebobinar).
import type {MascotLook, MascotPose} from "../components/Mascot";
import {L, clamp01, easeInOut, easeOut} from "./anim";
import {W, end, rew, start, undoneS2} from "./story";

export const REWIND_FRAMES = 26;
export type Look = MascotLook & {at?: [number, number, number]; ry?: number; rx?: number; pivotHip?: boolean};
type V3 = [number, number, number];

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
const between = (t: number, a: number, b: number) => t >= a && t < b;
const DIG: V3 = [-0.55, 0.06, 0.9]; // na beira do buraco, cavando
export const CHAIR: V3 = [-3.0, 0.06, 0.6]; // espreguiçadeira no gramado
const LYING: V3 = [CHAIR[0], 0.47, CHAIR[2] + 0.45]; // quadril no encontro do assento com o encosto
const SIDE: V3 = [-2.0, 0.06, 1.2]; // na grama, colado na borda esquerda da piscina, explicando (sempre no quadro)
const POOL_FLOAT: V3 = [1.2, -0.82, 0.7];
const FL = -1.5 + 0.08;
const IN_Y0 = FL + 0.2;
const swim = {outfit: "swim" as const};
const work = {outfit: "swim" as const}; // pedido do usuário: roupa de banho o vídeo todo, inclusive explicando

/** posição do compactador / rolo (mesmas contas do PoolWorld) */
const compX = (t: number) => L(t, W("s3", "socado") - 6, W("s3", "magro"), -1.0, 4.0);
const rollX = (t: number) => -1.3 + 5.6 * L(t, W("s5", "impermeabilização") - 4, W("s5", "veda") + 20, 0, 1);

export const mascotLook = (t: number): Look => {
  if (inS("s1", t)) {
    const idea = W("s1", "ideia");
    const hot = clamp01(1 - (t - idea) / 40);
    // deitado na espreguiçadeira, se abanando no calor
    if (t < idea - 4) return {...swim, hot: 1, at: LYING, rx: -0.8, pivotHip: true, prop: "fan", propHand: "r", propTilt: Math.sin(t * 0.6) * 25};
    // pula da cadeira com a ideia
    if (t < W("s1", "abrir") - 4) return {...swim, hot, floaty: "arm", at: [CHAIR[0] + 0.9, 0.06 + Math.abs(Math.sin(((t - idea + 4) / 14) * Math.PI)) * 0.25, CHAIR[2] + 0.4], rHand: "point"};
    const digging = between(t, W("s1", "abrir") - 4, W("s1", "encher") - 4);
    if (digging) return {...swim, hot, floaty: "arm", at: DIG, prop: "shovel", propHand: "r", propTilt: -25 + Math.sin(t * 0.25) * 18};
    return {...swim, hot, floaty: "arm", at: DIG};
  }
  if (inS("s2", t)) {
    const r = rew("s2");
    if (undoneS2(t) || t < r.P + 6) return {...swim, floaty: "arm", at: DIG};
    // pula no lamaçal: arco da beira até o buraco
    const k = clamp01((t - r.P - 6) / 26);
    const x = DIG[0] + (0.55 - DIG[0]) * easeInOut(k);
    const y = DIG[1] + Math.sin(k * Math.PI) * 1.2 + (-0.75 - DIG[1]) * k;
    return {...swim, floaty: "arm", at: [x, y, 0.6], muddy: clamp01((t - r.P - 30) / 12)};
  }
  if (inS("s3", t)) {
    if (between(t, W("s3", "socado") - 6, W("s3", "magro") + 6)) return {...work, at: [compX(t) - 0.45, -1.5, 0.6]};
    return {...work, at: SIDE, rHand: t < W("s3", "cava") ? "point" : undefined};
  }
  if (inS("s4", t)) {
    if (t < W("s4", "Uma") - 4) return {...work, at: [-4.45, 0.06, 0.75]}; // tenta levantar o cubo de 1 m³
    return {...work, at: SIDE, rHand: t < rew("s4").P ? "point" : undefined};
  }
  if (inS("s5", t)) {
    if (between(t, W("s5", "impermeabilização") - 4, W("s5", "veda") + 20)) return {...work, at: [rollX(t) - 0.55, IN_Y0, 0.6]};
    return {...work, at: SIDE, rHand: t < rew("s5").P ? "point" : undefined};
  }
  if (inS("s6", t)) {
    if (t > W("s6", "antiderrapante") - 8) return {...work, at: [-1.7, 0.15, 0.9]}; // pisa na borda
    return {...work, at: SIDE, rHand: "point"};
  }
  if (inS("s7", t)) {
    if (t > W("s7", "máquinas") - 20) return {...work, at: [5.35, 0.06, 1.0], lHand: "point"};
    return {...work, at: [-1.62, 0.15, 1.2], rHand: t > W("s7", "parte") - 6 ? "point" : undefined}; // na borda, dentro do quadro
  }
  if (inS("s8", t)) {
    const r = rew("s8");
    if (t >= r.P && t < r.R) {
      const dunk = t > r.P + 22 && t < r.P + 40 ? Math.sin(((t - r.P - 22) / 18) * Math.PI) * 0.55 : 0;
      return {...swim, at: [POOL_FLOAT[0], -1.05 - dunk + Math.sin(t * 0.15) * 0.03, POOL_FLOAT[2]], redEyes: clamp01((t - r.P - 40) / 10)};
    }
    const c = W("s8", "cloro");
    if (t < W("s8", "pH") - 10) return {...work, at: [-2.15, 0.15, 0.9], prop: between(t, c - 20, c + 50) ? "bottle" : undefined, propHand: "r", propTilt: L(t, c - 8, c + 4, 0, 110, easeInOut), pouring: between(t, c, c + 45) ? 1 : 0};
    return {...work, at: [-3.15, 0.06, 1.1], rHand: "point"};
  }
  if (inS("s9", t)) {
    const j = W("s9", "pular");
    if (t < j - 26) return {...swim, floaty: "waist", at: [-3.6, 0.06, 0.7], ry: Math.PI / 2};
    if (t < j + 2) {
      const k = clamp01((t - (j - 26)) / 28);
      return {...swim, floaty: "waist", at: [-3.6 + 1.7 * k, 0.06, 0.7], ry: (Math.PI / 2) * (1 - clamp01((t - j + 4) / 6))};
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
  const talkArm = (): [number, number] => [-30 + Math.sin(t * 0.12) * 8, 22];
  if (inS("s1", t)) {
    const idea = W("s1", "ideia");
    if (t < idea - 4) {
      pose.emotion = t < W("s1", "derretendo") ? "annoyed" : "sick"; // sofrendo com o calor
      pose.sick = 0.15;
      pose.hip = 44; // costas no encosto, pernas esticadas no assento
      pose.rArm = [-70 + Math.sin(t * 0.6) * 18, 38]; // abana o leque ao lado do rosto
      pose.lArm = [-15, 18];
    } else if (t < W("s1", "abrir") - 4) {
      pose.emotion = "surprised";
      pose.rArm = [-150, 10]; // dedo para cima: ideia!
    } else if (between(t, W("s1", "abrir") - 4, W("s1", "encher") - 4)) {
      const k = Math.sin(t * 0.25);
      pose.emotion = "grin";
      pose.rArm = [-35 + k * 25, 8];
      pose.lArm = [-45 + k * 25, -18];
      pose.jump = Math.max(0, -k) * 0.03;
    } else if (t < W("s1", "Pronto") - 2) {
      pose.emotion = "happy";
      pose.rArm = [-60, 30]; // segura a mangueira
    } else if (t < W("s1", "Será") - 2) {
      pose.emotion = "joy";
      pose.lArm = [-10, 160 + Math.sin(t * 0.5) * 10];
      pose.rArm = [-10, 160 - Math.sin(t * 0.5) * 10];
      pose.jump = Math.abs(Math.sin(t * 0.3)) * 0.12;
    } else {
      pose.emotion = "curious";
      pose.rArm = [-140, -30]; // coça a cabeça: será?
    }
  } else if (inS("s2", t)) {
    const r = rew("s2");
    if (undoneS2(t) || t < r.P) {
      pose.emotion = undoneS2(t) ? "relieved" : t < W("s2", "desmoronam") ? "surprised" : t < W("s2", "lamaçal") + 8 ? "scared" : "worried";
      const cade = between(t, W("s2", "cadê") - 6, W("s2", "terra"));
      pose.lArm = cade ? [-20, 70] : [-10, 30]; // braços abertos: cadê a água?
      pose.rArm = cade ? [-20, 70] : t > W("s2", "lamaçal") - 4 && t < r.P ? [-150, -10] : [-45, 40]; // mão na cabeça quando o vizinho pula
    } else if (t < r.P + 32) {
      pose.emotion = "joy";
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
  } else if (inS("s3", t)) {
    if (between(t, W("s3", "socado") - 6, W("s3", "magro") + 6)) {
      pose.emotion = "grin";
      pose.lArm = [-55, -10]; // segura o compactador
      pose.rArm = [-55, -10];
      pose.shiver = 0.6;
    } else if (t >= rew("s3").P && t < rew("s3").R) {
      pose.emotion = "scared";
      pose.lArm = [-150, -10];
      pose.rArm = [-150, -10];
    } else {
      pose.emotion = t < W("s3", "cava") ? "curious" : "happy";
      pose.rArm = t < W("s3", "cava") ? [-75, 35] : talkArm();
    }
  } else if (inS("s4", t)) {
    if (t < W("s4", "Uma") - 4) {
      // tenta levantar o cubo de água e não consegue
      pose.emotion = t < W("s4", "mil") ? "curious" : "annoyed";
      pose.rArm = [-80, 30];
      pose.lArm = [-60, 0];
      pose.shiver = t > W("s4", "pesa") ? 0.8 : 0;
    } else if (t >= rew("s4").P && t < rew("s4").R) {
      pose.emotion = "scared";
      pose.lArm = [-150, -10];
      pose.rArm = [-150, -10];
    } else {
      pose.emotion = t > W("s4", "armado") - 4 ? "grin" : "happy";
      pose.rArm = t < rew("s4").P ? [-80, 30] : talkArm();
    }
  } else if (inS("s5", t)) {
    if (between(t, W("s5", "impermeabilização") - 4, W("s5", "veda") + 20)) {
      pose.emotion = "happy";
      pose.lArm = [-60 + Math.sin(t * 0.3) * 6, -8]; // empurra o rolo
      pose.rArm = [-60 + Math.sin(t * 0.3) * 6, -8];
      pose.walking = true;
    } else if (t >= rew("s5").P && t < rew("s5").R) {
      pose.emotion = "scared";
      pose.lArm = [-150, -10];
      pose.rArm = [-150, -10];
    } else {
      pose.emotion = t < rew("s5").P ? "curious" : t > W("s5", "estanqueidade") - 4 ? "grin" : "happy";
      pose.rArm = t < rew("s5").P ? [-75, 35] : talkArm();
    }
  } else if (inS("s6", t)) {
    pose.emotion = "grin";
    pose.rArm = t > W("s6", "antiderrapante") - 8 ? [-10, 150] : [-75, 35];
  } else if (inS("s7", t)) {
    const v = W("s7", "verde");
    if (between(t, v - 20, W("s7", "parte"))) {
      pose.emotion = "sick"; // tapa o nariz
      pose.sick = 0.4;
      pose.rArm = [-150, -32];
    } else if (t > W("s7", "máquinas") - 20) {
      pose.emotion = "grin";
      pose.lArm = [-75, 35];
    } else {
      pose.emotion = t > W("s7", "parte") ? "curious" : "happy";
      pose.rArm = t > W("s7", "parte") - 6 ? [-60, 30] : talkArm();
    }
  } else if (inS("s8", t)) {
    const r = rew("s8");
    if (t >= r.P && t < r.R) {
      const k = clamp01((t - r.P - 40) / 10);
      if (k <= 0) {
        pose.emotion = "joy";
        pose.lArm = [-10, 120 + Math.sin(t * 0.4) * 15];
        pose.rArm = [-10, 120 - Math.sin(t * 0.4) * 15];
      } else {
        pose.emotion = "sick"; // olhos ardendo: esfrega os olhos
        pose.lArm = [-150 + Math.sin(t * 0.8) * 8, -28];
        pose.rArm = [-150 - Math.sin(t * 0.8) * 8, -28];
        pose.shiver = 0.3;
      }
    } else {
      const c = W("s8", "cloro");
      pose.emotion = t > W("s8", "sempre") - 6 ? "grin" : "happy";
      pose.rArm = between(t, c - 20, c + 50) ? [-70, 40] : t >= W("s8", "pH") - 10 ? [-75, 35] : talkArm();
    }
  } else if (inS("s9", t)) {
    const j = W("s9", "pular");
    const ci = W("s9", "Comenta"), fw = W("s9", "segue");
    if (t < j + 2) {
      pose.walking = t > j - 26;
      pose.emotion = "grin";
      pose.lArm = [Math.sin(t * 0.45) * 30, 15];
      pose.rArm = [-Math.sin(t * 0.45) * 30, 15];
    } else if (t < j + 30) {
      pose.emotion = "joy";
      pose.lArm = [-10, 165];
      pose.rArm = [-10, 165];
    } else if (t >= ci - 6 && t < ci + 40) {
      pose.emotion = "grin";
      pose.rArm = [-88, 8];
      pose.lArm = [-10, 40];
    } else if (t >= fw - 10) {
      pose.emotion = "grin";
      pose.rArm = [-10, 150 + Math.sin(t * 0.35) * 20];
      pose.lArm = [-10, 40];
    } else {
      pose.emotion = "joy";
      pose.lArm = [-10, 60 + Math.sin(t * 0.3) * 10];
      pose.rArm = [-10, 60 - Math.sin(t * 0.3) * 10];
    }
  }
  return pose;
};

/* ---------- vizinho engraçado: pula do muro, do nada, no lamaçal (s2) ---------- */
const NB_FROM: V3 = [2.2, 1.02, -7.4]; // em cima do muro do fundo (quintal maior)
const NB_TO: V3 = [1.75, -1.05, 0.35];
export const neighborJump = () => W("s2", "desmoronam") + 4;
export const neighborLand = () => neighborJump() + 30;
export const neighborLook = (t: number): Look => {
  if (!inS("s2", t) || undoneS2(t)) return {};
  const j0 = neighborJump();
  if (t < j0 - 18) return {};
  if (t < j0) return {...swim, neighbor: true, at: [NB_FROM[0], NB_FROM[1] - 1.2 * (1 - clamp01((t - j0 + 18) / 8)), NB_FROM[2]]}; // surge do nada atrás do muro
  if (t < neighborLand()) {
    const k = clamp01((t - j0) / 30);
    const at: V3 = [NB_FROM[0] + (NB_TO[0] - NB_FROM[0]) * k, NB_FROM[1] + Math.sin(k * Math.PI) * 1.3 + (NB_TO[1] - NB_FROM[1]) * k, NB_FROM[2] + (NB_TO[2] - NB_FROM[2]) * k];
    return {...swim, neighbor: true, at};
  }
  return {...swim, neighbor: true, at: [NB_TO[0], NB_TO[1] - clamp01((t - neighborLand()) / 30) * 0.2, NB_TO[2]], muddy: clamp01((t - neighborLand()) / 6)};
};
export const neighborPose = (t: number): MascotPose => {
  const pose = base(t);
  const j0 = neighborJump();
  if (t < j0) {
    pose.emotion = "grin";
    pose.lArm = [-10, 160 + Math.sin(t * 0.5) * 10];
    pose.rArm = [-10, 160 - Math.sin(t * 0.5) * 10];
  } else if (t < neighborLand()) {
    pose.emotion = "joy";
    pose.lArm = [-10, 170];
    pose.rArm = [-10, 170];
  } else {
    pose.emotion = t < neighborLand() + 20 ? "surprised" : "sick";
    pose.sick = clamp01((t - neighborLand() - 20) / 20) * 0.6;
    pose.lArm = [-10, 110 + Math.sin(t * 0.6) * 15]; // atolado, balançando os braços
    pose.rArm = [-10, 110 - Math.sin(t * 0.6) * 15];
  }
  return pose;
};
