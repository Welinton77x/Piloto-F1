// Vídeo 5 (kit 72h): mascote do canal de blusão laranja com capuz, chapéu cáqui e mochila (pedido do usuário).
import type {MascotLook, MascotPose} from "../components/Mascot";
import {clamp01} from "./anim";
import {CARRY, PLACE, W, currentItem, end, flashlightOn, inS, itemAt, slotX, start} from "./story";

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
  // s4–s6: anda por trás da mesa até o lugar de cada item, pega, olha e coloca
  const c = currentItem(t);
  if (c < 0) return {...look, at: TABLE_SIDE, ry: 0};
  const prevX = c > 0 ? slotX(c - 1) : TABLE_SIDE[0];
  const k = clamp01((t - (itemAt(c) - CARRY - 14)) / 14);
  const x = prevX + (slotX(c) - prevX) * k;
  const placing = t >= itemAt(c) - CARRY && t < itemAt(c) + PLACE + 4;
  return {...look, at: [x, 0.15, TABLE_SIDE[2]], ry: 0, rHand: !placing && t > itemAt(c) + PLACE + 4 && t < itemAt(c) + 40 ? "point" : undefined, lHand: placing ? "open" : undefined};
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
    // s4–s6: observa e separa cada item
    const c = currentItem(t);
    p.emotion = "curious";
    p.lArm = [4 + Math.sin(t * 0.07) * 1.2, 12];
    p.rArm = [4, 12];
    if (c >= 0) {
      const it = itemAt(c);
      if (t < it - CARRY) {
        p.walking = true; // anda até o lugar do item
      } else if (t < it) {
        // segura o item com as duas mãos na frente do rosto e olha
        const k = (t - (it - CARRY)) / CARRY;
        p.lArm = [-88 - Math.sin(k * Math.PI) * 10, -14];
        p.rArm = [-88 - Math.sin(k * Math.PI) * 10, -14];
        p.emotion = "curious";
      } else if (t < it + PLACE + 4) {
        // abaixa e coloca na mesa
        const k = clamp01((t - it) / PLACE);
        p.lArm = [-88 + k * 25, -14];
        p.rArm = [-88 + k * 25, -14];
        p.jump = -0.04 * Math.sin(k * Math.PI);
        p.emotion = "happy";
      } else if (t < it + 40) {
        // confere: aponta para o item colocado
        p.rArm = [-55, 8];
        p.emotion = "grin";
      }
    }
  }
  // susto quando a luz acaba: pula de susto e treme
  const e = t - W("s2", "energia");
  if (e >= -6 && e < 18) {
    p.jump = Math.max(p.jump, Math.abs(Math.sin(((e + 6) / 24) * Math.PI)) * 0.18);
    p.shiver = 0.8;
  }
  // final: comemoração com pulos seguidos
  if (inS("s8", t) && t > W("s8", "Parabéns") - 4) {
    const d = t - W("s8", "Parabéns");
    p.jump = Math.abs(Math.sin(d * 0.2)) * 0.2 * Math.exp(-Math.max(0, d - 40) * 0.03);
    p.lArm = [-10, 150 + Math.sin(d * 0.4) * 15];
  }
  // respiração/balanço leve quando parado e cabeça acompanhando
  if (!p.walking && p.jump < 0.01) p.jump = Math.abs(Math.sin(t * 0.09)) * 0.012;
  // lanterna na mão esquerda quando acesa (s5–s7)
  if (flashlightOn(t) && !inS("s7", t)) p.lArm = [-70, -10];
  void start;
  void end;
  return p;
};
