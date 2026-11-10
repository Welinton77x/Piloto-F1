// Vídeo 5 (kit 72h): mascote do canal de blusão laranja com capuz, chapéu cáqui e mochila (pedido do usuário).
import type {MascotLook, MascotPose} from "../components/Mascot";
import {clamp01} from "./anim";
import {W, end, flashlightOn, inS, start} from "./story";

export const REWIND_FRAMES = 26;
export type Look = MascotLook & {at?: [number, number, number]; ry?: number; rx?: number; pivotHip?: boolean};
type V3 = [number, number, number];

const base = (t: number): MascotPose => ({
  emotion: "happy",
  talk: 0, // sem sincronia labial: só reações
  lArm: [4 + Math.sin(t * 0.07) * 1.2, 12],
  rArm: [4, 12],
  umbrella: "none",
  umbrellaTilt: 0,
  jump: 0,
  shiver: 0,
  walking: false,
});
const look = {outfit: "shirt" as const, hoodie: true, hat: true};
const LIVING: V3 = [0.6, 0.15, 0.45];
const TABLE_SIDE: V3 = [0.4, 0.15, -1.75]; // atrás da mesa, de frente para a câmera
const DOOR: V3 = [2.75, 0.15, 0.3];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const mascotLook = (t: number): Look => {
  if (inS("s1", t)) return {...look, at: LIVING, ry: 0.2, rHand: "open"};
  if (inS("s2", t) || inS("s3", t)) return {...look, at: LIVING, ry: -0.2};
  if (inS("s7", t)) {
    const a = W("s7", "pegar") - 6, b = W("s7", "ir") + 6;
    if (t < a) return {...look, at: TABLE_SIDE, ry: 0, rHand: "point"};
    const k = clamp01((t - a) / Math.max(1, b - a));
    return {...look, at: lerp3(TABLE_SIDE, DOOR, k), ry: Math.PI / 2 * clamp01(k * 3)};
  }
  if (inS("s8", t)) return {...look, at: LIVING, ry: 0};
  return {...look, at: TABLE_SIDE, ry: 0, rHand: "point"};
};

export const mascotPose = (t: number): MascotPose => {
  const p = base(t);
  const talk = (): [number, number] => [-35 + Math.sin(t * 0.12) * 8, 22];
  if (inS("s1", t)) {
    p.emotion = t < W("s1", "três") ? "curious" : "grin";
    p.rArm = [-75, -10]; // segura o celular na frente
  } else if (inS("s2", t)) {
    const e = W("s2", "energia");
    p.emotion = t < e ? "worried" : t < e + 25 ? "surprised" : "worried";
    if (t >= e && t < e + 25) {
      p.lArm = [-10, 120];
      p.rArm = [-10, 120];
    } else p.rArm = [-60, 35];
  } else if (inS("s3", t)) {
    p.emotion = t > W("s3", "kit") - 6 ? "relieved" : "worried";
    p.rArm = talk();
  } else if (inS("s7", t)) {
    const a = W("s7", "pegar") - 6;
    p.emotion = "grin";
    if (t >= a) p.walking = t < W("s7", "ir") + 6;
    else p.rArm = [-75, 35];
  } else if (inS("s8", t)) {
    p.emotion = "joy";
    p.rArm = [-10, 150 + Math.sin(t * 0.4) * 18]; // acena
  } else {
    // s4–s6: apresenta cada item na mesa
    p.emotion = "happy";
    p.rArm = [-75, 35];
    p.lArm = talk();
  }
  // lanterna na mão esquerda quando acesa (s5–s7)
  if (flashlightOn(t) && !inS("s7", t)) p.lArm = [-70, -10];
  void start;
  void end;
  return p;
};
