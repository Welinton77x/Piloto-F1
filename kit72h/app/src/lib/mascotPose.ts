// Vídeo 4 (carro): o mascote do canal (boné e camisa azuis) empurra a carroça, depois dirige e reage a cada etapa.
// Posições no referencial do carro (frente em +x). Recebe o tempo efetivo t (que volta no rebobinar).
import type {MascotLook, MascotPose} from "../components/Mascot";
import {clamp01} from "./anim";
import {W, brakePress, clutchPress, end, failing, gear, handOnShifter, rew, start} from "./story";

export const REWIND_FRAMES = 26;
export type Look = MascotLook & {at?: [number, number, number]; ry?: number; rx?: number; pivotHip?: boolean};
type V3 = [number, number, number];

const base = (t: number): MascotPose => ({
  emotion: "happy",
  talk: 0, // sem sincronia labial: só reações
  lArm: [-35, 10],
  rArm: [-35, 10],
  umbrella: "none",
  umbrellaTilt: 0,
  jump: 0,
  shiver: 0,
  walking: false,
  hip: 90,
});
const inS = (id: string, t: number) => t >= start(id) && t < end(id);
const SEAT: V3 = [-0.24, 0.9, 0];
const PUSH: V3 = [-1.85, 0.0, 0];
const work = {outfit: "shirt" as const};

export const mascotLook = (t: number): Look => {
  if (inS("s1", t)) return {...work, at: PUSH, ry: Math.PI / 2};
  if (inS("s8", t)) {
    const h = t - W("s8", "buraco");
    const up = h >= 0 && h < 26 && t < W("s8", "molas") ? Math.sin((h / 26) * Math.PI) * 0.45 : 0; // pula do banco no buraco
    return {...work, at: [SEAT[0], SEAT[1] + up, SEAT[2]], ry: Math.PI / 2, pivotHip: true};
  }
  return {...work, at: SEAT, ry: Math.PI / 2, pivotHip: true, rHand: inS("s10", t) && t > W("s10", "comenta", 1) - 6 ? "point" : undefined};
};

export const mascotPose = (t: number): MascotPose => {
  const p = base(t);
  if (t >= W("s7", "volante") - 4) {
    // mãos no volante, acompanhando o giro
    const st = inS("s7", t) && !failing("s7", t) ? Math.sin((t - W("s7", "volante")) * 0.08) * 0.35 : 0;
    p.lArm = [-62 + st * 30, -14];
    p.rArm = [-62 - st * 30, -14];
  }
  if (handOnShifter(t)) p.rArm = gear(t) === 1 ? [-26, 6] : [-50, 6]; // mão direita na alavanca: puxa (1ª) / empurra (5ª)
  // pés nos pedais: esquerdo na embreagem, direito no freio
  p.legPress = [clutchPress(t) * 22, brakePress(t) * 22];
  const scared = () => {
    p.emotion = "scared";
    p.lArm = [-10, 150 + Math.sin(t * 0.6) * 12];
    p.rArm = [-10, 150 - Math.sin(t * 0.6) * 12];
  };
  if (inS("s1", t)) {
    p.hip = 0;
    const tired = t > W("s1", "fôlego") - 8;
    if (!tired) {
      p.walking = t > W("s1", "Pega") + 10;
      p.emotion = t < W("s1", "Pega") ? "happy" : "annoyed";
      p.lArm = [-80, 8];
      p.rArm = [-80, 8];
    } else {
      p.emotion = "sick"; // sem fôlego
      p.sick = 0.25;
      p.lArm = [-35, -25];
      p.rArm = [-35, -25];
      p.shiver = 0.4;
    }
    return p;
  }
  if (inS("s2", t)) {
    p.emotion = t > W("s2", "explode") - 2 && t < W("s2", "explode") + 25 ? "surprised" : t > W("s2", "motor") ? "grin" : "curious";
    return p;
  }
  for (const id of ["s3", "s4", "s5", "s7", "s9"]) {
    if (inS(id, t) && failing(id, t)) {
      if (id === "s3") {
        p.emotion = "surprised";
        p.shiver = 1;
      } else if (id === "s4") {
        p.emotion = "worried";
        p.rArm = [-140, -20]; // abana a fumaça
      } else scared();
      return p;
    }
  }
  if (inS("s3", t)) p.emotion = t > W("s3", "lisinho") - 4 ? "relieved" : "happy";
  if (inS("s4", t)) p.emotion = t > W("s4", "radiador") - 4 ? "grin" : "happy";
  if (inS("s5", t)) {
    p.emotion = t > W("s5", "Quinta") ? "joy" : "happy";
    if (t > rew("s5").R && t < W("s5", "embreagem") + 20) p.emotion = "relieved";
  }
  if (inS("s6", t)) p.emotion = t < W("s6", "Então") ? "worried" : "grin";
  if (inS("s7", t)) p.emotion = "grin";
  if (inS("s8", t)) {
    const h = t - W("s8", "buraco");
    if (h >= 0 && t < W("s8", "molas")) {
      p.emotion = "scared";
      p.lArm = [-10, 120];
      p.rArm = [-10, 120];
    } else p.emotion = "happy";
  }
  if (inS("s9", t)) p.emotion = t < W("s9", "freio") ? "scared" : t > W("s9", "calor") ? "relieved" : "worried";
  if (inS("s10", t)) {
    const pb = W("s10", "Parabéns");
    if (t > pb - 4) {
      p.emotion = "joy";
      p.lArm = [-58, 4];
      p.rArm = t > W("s10", "comenta", 1) - 6 ? [-88, 8] : [-10, 150 + Math.sin(t * 0.4) * 18]; // acena / aponta
    } else p.emotion = "grin";
  }
  if (handOnShifter(t)) p.rArm = gear(t) === 1 ? [-26, 6] : [-50, 6];
  if (t >= W("s7", "volante") - 4 && !inS("s10", t) && !(inS("s8", t) && t >= W("s8", "buraco") && t < W("s8", "molas")) && !failing("s9", t)) {
    const st = inS("s7", t) && !failing("s7", t) ? Math.sin((t - W("s7", "volante")) * 0.08) * 0.35 : 0;
    p.lArm = [-62 + st * 30, -14];
    p.rArm = [-62 - st * 30, -14];
  }
  p.legPress = [clutchPress(t) * 22, brakePress(t) * 22];
  return p;
};
export const _c = clamp01;
