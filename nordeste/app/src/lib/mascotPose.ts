// Vídeo 6 (Nordeste): ações do mascote (estilo da referência). Tudo deriva do tempo efetivo t.
// Física simples e consistente: andar com passo e balanço de braços, pulos em arco (gravidade) com poeira
// ao aterrissar, deitar na cama, beber água inclinando a garrafa, suor que aumenta com o calor.
import type {MascotPose} from "../components/Mascot";
import type {RefLook} from "../components/MascotRef";
import {clamp01, easeInOut} from "./anim";
import {SET, W, end, failing, inS, setAt, start} from "./story";

export const REWIND_FRAMES = 26;
export const MASCOT_SCALE = 0.85;
type V3 = [number, number, number];
export type Look = RefLook & {at?: V3; ry?: number; rx?: number; rz?: number; dust?: number};

const HOME: V3 = [0, 0.06, 0.6];
const COAST: V3 = [9.6, 0.06, 1.0];
const SHADE: V3 = [-4.2, 0.06, 0.6];
const WET_SIDE: V3 = [-0.1, 0.06, 0.7];
const DRY: V3 = [1.55, 0.06, 1.35];
const BED: V3 = [SET.city + 0.8, 0.62 + 0.2, 2.0];
const ROOM: V3 = [SET.room + 0.55, 0.05, 0.9];

const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const base = (t: number): MascotPose => ({
  emotion: "happy",
  talk: 0,
  lArm: [4 + Math.sin(t * 0.07) * 2, 10],
  rArm: [4 - Math.sin(t * 0.07) * 2, 10],
  umbrella: "none",
  umbrellaTilt: 0,
  jump: 0,
  shiver: 0,
  walking: false,
});
/** pulo com gravidade: altura de um arco parabólico que dura `dur` frames */
const hop = (f: number, dur: number, h: number) => (f < 0 || f > dur ? 0 : 4 * h * (f / dur) * (1 - f / dur));
/** caminhada de a → b entre os frames f0 e f1: posição, virado para onde anda */
const walk = (t: number, f0: number, f1: number, a: V3, b: V3) => {
  const k = easeInOut(clamp01((t - f0) / Math.max(1, f1 - f0)));
  const moving = t >= f0 && t < f1;
  const dir = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return {at: lerp3(a, b, k), moving, ry: moving ? dir : 0};
};

/* ---------- onde ele está e como está vestido/suado ---------- */
export const mascotLook = (t: number): Look => {
  const set = setAt(t);
  if (set === "globe" || set === "map") return {};
  if (set === "city") {
    // deitado de costas na cama, rolando de calor (sem a mochila, pra deitar direito)
    return {at: BED, rx: -Math.PI / 2, ry: Math.PI / 2, rz: Math.sin(t * 0.06) * 0.25, hot: 0.8, sweat: 0.8, backpack: false, rHand: "open"};
  }
  if (set === "room") {
    const after = t >= W("s8", "contrário") + 22;
    return {at: ROOM, ry: -0.5, hot: 0.5, sweat: after ? 0.8 : 0.4, rHand: "open", lHand: "open"};
  }
  // sertão
  if (inS("s1", t)) return {at: HOME, hot: 1, tongue: t < W("s1", "Se") - 4, sweat: 1, rHand: t >= W("s1", "sol") - 6 ? "point" : "open"};
  if (inS("s2", t)) return {at: HOME, hot: 1, sweat: 1};
  if (inS("s3", t)) {
    const w = walk(t, W("s3", "Então") - 4, W("s3", "interior") + 16, COAST, HOME);
    const k = clamp01((t - W("s3", "Então")) / 50);
    return {at: w.at, ry: w.ry, hot: 0.25 + 0.75 * k, sweat: 0.2 + 0.8 * k, tongue: k > 0.9};
  }
  if (inS("s4", t)) {
    const f0 = W("s4", "seca") - 4, f1 = W("s4", "seca") + 18;
    const w = walk(t, f0, f1, WET_SIDE, DRY);
    // depois de pisar no chão seco e quente: pulinhos com poeira ao bater o pé
    const hf = t - f1, per = 22;
    const landing = hf >= 0 ? (hf % per) / 8 : 2;
    return {at: w.at, ry: w.ry, hot: 1, sweat: 1, lHand: t < f0 ? "point" : "open", dust: hf >= 0 && landing < 1 ? landing : 0};
  }
  if (inS("s7", t)) return {at: HOME, hot: 1, sweat: 1, tongue: true};
  if (inS("s9", t)) {
    const d0 = W("s9", "bebe") - 6, d1 = W("s9", "sede") + 10;
    const w = walk(t, W("s9", "foge") - 4, W("s9", "sol") + 20, HOME, SHADE);
    const drinking = t >= d0 && t < d1;
    const level = t < d0 ? 1 : t < d1 ? 1 - 0.7 * clamp01((t - d0) / (d1 - d0)) : 0.3;
    const inShade = t >= W("s9", "sol") + 20;
    return {at: w.at, ry: w.ry, hot: inShade ? 0.3 : 0.8, sweat: inShade ? 0.2 : 0.8, bottle: t < W("s9", "foge") ? level : 0, bottleTilt: drinking ? 75 * Math.sin(clamp01((t - d0) / (d1 - d0)) * Math.PI) : 0, rHand: t >= W("s9", "idosos") - 6 && t < W("s9", "alertas") ? "point" : undefined};
  }
  if (inS("s10", t)) {
    const p = W("s10", "Parabéns");
    const hf = t - p;
    const landing = hf >= 0 && hf < 3 * 26 ? ((hf % 26) - 22) / 10 : -1;
    return {at: SHADE, hot: 0.1, sweat: 0, rHand: t >= W("s10", "Comenta") - 6 && t < W("s10", "Comenta") + 30 ? "point" : "open", dust: landing >= 0 && landing < 1 ? landing : 0};
  }
  return {at: HOME, hot: 1, sweat: 1};
};

/* ---------- pose: braços, emoção, pulos ---------- */
export const mascotPose = (t: number): MascotPose => {
  const p = base(t);
  const set = setAt(t);
  const fan = (): void => {
    // se abanando com a mão aberta perto do rosto + punho fechado no ombro (como na referência)
    p.rArm = [-150 + Math.sin(t * 0.7) * 14, -38];
    p.lArm = [-95, 28];
  };
  if (set === "city") {
    p.emotion = "sick";
    p.sick = 0.15;
    p.rArm = [-150 + Math.sin(t * 0.6) * 14, -30]; // se abana deitado
    p.lArm = [-10, 50];
    return p;
  }
  if (set === "room") {
    const r = t >= W("s8", "contrário") - 4;
    if (!r) {
      p.emotion = failing("s8", t) ? "relieved" : "happy";
      p.lArm = [-20, 75]; // braços abertos curtindo o vento
      p.rArm = [-20, 75];
    } else if (t < W("s8", "suor") - 6) {
      p.emotion = "curious"; // dá de ombros: não esfriou nada
      p.lArm = [-35, 55];
      p.rArm = [-35, 55];
    } else {
      p.emotion = "sick";
      p.sick = 0.1;
      p.rArm = [-160, -25]; // passa a mão na testa suada
    }
    return p;
  }
  if (inS("s1", t)) {
    p.emotion = "sick";
    p.sick = 0.1;
    if (t >= W("s1", "sol") - 6) {
      p.emotion = "surprised";
      p.rArm = [-170, 12]; // aponta pro sol
      p.lArm = [-95, 28];
    } else fan();
    return p;
  }
  if (inS("s2", t)) {
    p.emotion = "surprised";
    p.rArm = [-165, 15]; // olha pra cima e aponta o sol a pino
    return p;
  }
  if (inS("s3", t)) {
    const f0 = W("s3", "Então") - 4, f1 = W("s3", "interior") + 16;
    if (t < f0) {
      p.emotion = "relieved"; // na brisa do mar: braços abertos
      p.lArm = [-15, 70 + Math.sin(t * 0.1) * 6];
      p.rArm = [-15, 70 - Math.sin(t * 0.1) * 6];
    } else if (t < f1) {
      p.walking = true;
      p.emotion = "curious";
      p.lArm = [Math.sin(t * 0.45) * 28, 10];
      p.rArm = [-Math.sin(t * 0.45) * 28, 10];
    } else {
      p.emotion = "sick";
      p.sick = 0.1;
      fan();
    }
    return p;
  }
  if (inS("s4", t)) {
    const f0 = W("s4", "seca") - 4, f1 = W("s4", "seca") + 18;
    if (t < f0) {
      p.emotion = "curious";
      p.lArm = [-55, 35]; // aponta o chão úmido soltando vapor
    } else if (t < f1) {
      p.walking = true;
      p.lArm = [Math.sin(t * 0.45) * 28, 10];
      p.rArm = [-Math.sin(t * 0.45) * 28, 10];
    } else {
      // chão quente: pulinhos trocando o pé, braços pra cima
      const hf = t - f1;
      p.jump = hop(hf % 22, 14, 0.2);
      p.emotion = "scared";
      p.lArm = [-20, 120 + Math.sin(t * 0.5) * 12];
      p.rArm = [-20, 120 - Math.sin(t * 0.5) * 12];
      p.legPress = [Math.sin(t * 0.6) > 0 ? 30 : 0, Math.sin(t * 0.6) > 0 ? 0 : 30];
    }
    return p;
  }
  if (inS("s7", t)) {
    p.emotion = "sick";
    p.sick = 0.2;
    p.shiver = 0.3;
    p.rArm = [-160 + Math.sin(t * 0.25) * 20, -30]; // enxuga a testa
    p.lArm = [-95, 28];
    return p;
  }
  if (inS("s9", t)) {
    const d0 = W("s9", "bebe") - 6, d1 = W("s9", "sede") + 10;
    const wf0 = W("s9", "foge") - 4, wf1 = W("s9", "sol") + 20;
    if (t >= d0 && t < d1) {
      const k = Math.sin(clamp01((t - d0) / (d1 - d0)) * Math.PI);
      p.rArm = [-80 - 70 * k, -10 - 18 * k]; // leva a garrafa até a boca
      p.emotion = k > 0.5 ? "relieved" : "happy";
    } else if (t >= wf0 && t < wf1) {
      p.walking = true;
      p.lArm = [Math.sin(t * 0.45) * 28, 10];
      p.rArm = [-Math.sin(t * 0.45) * 28, 10];
    } else if (t >= W("s9", "idosos") - 6 && t < W("s9", "alertas")) {
      p.rArm = [-80, 20]; // aponta: cuida dos idosos e das crianças
      p.emotion = "happy";
    } else if (t >= W("s9", "alertas") - 4) {
      p.emotion = "grin";
      p.rArm = [-75, -15];
    } else {
      p.emotion = "happy";
      p.rArm = t < d0 ? [-60, 8] : p.rArm; // segura a garrafa
    }
    return p;
  }
  if (inS("s10", t)) {
    const pb = W("s10", "Parabéns");
    const hf = t - pb;
    if (hf >= 0 && hf < 3 * 26) {
      p.emotion = "joy";
      p.jump = hop(hf % 26, 22, 0.42); // três pulos de comemoração
      p.lArm = [-10, 150 + Math.sin(t * 0.5) * 12];
      p.rArm = [-10, 150 - Math.sin(t * 0.5) * 12];
    } else if (t >= W("s10", "Comenta") - 6 && t < W("s10", "Comenta") + 30) {
      p.emotion = "grin";
      p.rArm = [-88, 8];
    } else if (hf >= 3 * 26) {
      p.emotion = "grin";
      p.rArm = [-10, 140 + Math.sin(t * 0.35) * 22]; // acena
    } else p.emotion = "relieved";
    return p;
  }
  p.emotion = "sick";
  fan();
  void start;
  void end;
  return p;
};
