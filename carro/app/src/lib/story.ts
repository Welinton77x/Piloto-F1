// Vídeo 4 (carro): linha do tempo da história. Tudo deriva do frame global.
// Cada erro: ⏸ (P) → cena da falha → ⏪ no "Então você…" (R) volta até "back" → entra a peça nova.
import {S, timed, totalFrames, wordLocal} from "../data/scenes";
import {L, clamp01} from "./anim";

export const RW = 26; // frames do rebobinar

/** frame GLOBAL em que a palavra é dita (n-ésima ocorrência) */
export const W = (id: string, word: string, occ = 0, fb = 0.5): number => {
  const s = S(id);
  return s.startFrame + (wordLocal(s, word, occ) ?? Math.round(fb * s.durationInFrames));
};
export const start = (id: string) => S(id).startFrame;
export const end = (id: string) => S(id).startFrame + S(id).durationInFrames;

export type Rewind = {id: string; P: number; R: number; back: number; label: string};
const mk = (id: string, pWord: string, label: string, occ = 0): Rewind => {
  const P = W(id, pWord, occ) - 6;
  return {id, P, R: W(id, "Então"), back: P, label};
};
export const REWINDS: Rewind[] = [
  mk("s3", "trancos", "TREME"),
  mk("s4", "esquenta", "SUPERAQUECE"),
  mk("s5", "Mas", "NÃO PARA"),
  mk("s7", "se", "TOMBA"),
  mk("s9", "corre", "SEM FREIO"),
];
export const rew = (id: string) => REWINDS.find((x) => x.id === id)!;

/** tempo efetivo: igual ao frame, exceto durante o rebobinar (volta rápido até "back") */
export const te = (gf: number): number => {
  for (const r of REWINDS) if (gf >= r.R && gf < r.R + RW) return Math.round(r.R - ((gf - r.R) / RW) * (r.R - r.back));
  return gf;
};
/** dentro da falha (entre a pausa e o rebobinar), no tempo efetivo */
export const failing = (id: string, t: number) => {
  const r = rew(id);
  return t >= r.P && t < r.R;
};
/** tela "congelada/imaginação" (sépia + vinheta) durante a falha */
export const imagineAmount = (gf: number) => {
  for (const r of REWINDS) {
    if (gf >= r.P - 8 && gf < r.R + RW + 6) return L(gf, r.P - 4, r.P + 4, 0, 1) * (1 - L(gf, r.R + RW - 6, r.R + RW + 6, 0, 1));
  }
  return 0;
};
export const skyDark = (_gf: number) => 0;
export const heat = (_gf: number) => 0;

const inS = (id: string, t: number) => t >= start(id) && t < end(id);
const after = (t: number, f: number) => t >= f;

/* ---------- velocidade do carro (u/frame) e posição acumulada ---------- */
const speed = (t: number): number => {
  if (inS("s1", t)) return t > W("s1", "Pega") + 10 && t < W("s1", "fôlego") - 8 ? 0.018 : 0;
  if (inS("s2", t)) return t > W("s2", "motor") ? 0.05 : 0;
  if (inS("s3", t)) {
    if (failing("s3", t)) return 0.04;
    return t > W("s3", "quatro") ? 0.07 : 0.03;
  }
  if (inS("s4", t)) {
    const r = rew("s4");
    if (t < r.P) return 0.07;
    if (failing("s4", t)) return L(t, r.P, r.P + 40, 0.07, 0);
    return t > W("s4", "radiador") ? 0.07 : 0;
  }
  if (inS("s5", t)) {
    const r = rew("s5");
    if (t < r.R) return 0.07; // não consegue parar: passa o semáforo
    if (t < W("s5", "Primeira")) return 0;
    if (t < W("s5", "Quinta")) return 0.03;
    return 0.11;
  }
  if (inS("s6", t)) return 0.07;
  if (inS("s7", t)) return 0.05;
  if (inS("s8", t)) return 0.06;
  if (inS("s9", t)) {
    const fr = W("s9", "freio");
    if (t < fr) return 0.14;
    return L(t, fr, W("s9", "calor"), 0.14, 0);
  }
  if (inS("s10", t)) return t > W("s10", "Parabéns") ? 0.06 : 0;
  return 0;
};
const XS: number[] = (() => {
  const out = new Array(totalFrames + 2).fill(0);
  for (let f = 1; f < out.length; f++) out[f] = out[f - 1] + speed(f - 1);
  return out;
})();
export const carX = (t: number) => XS[Math.max(0, Math.min(XS.length - 1, Math.round(t)))];
export const carSpeed = (t: number) => speed(t);

/* ---------- objetos fixos na rua, posicionados pela posição do carro ---------- */
export const lightX = () => carX(rew("s5").P) + 3.2; // semáforo do s5
export const potholeX = () => carX(W("s8", "buraco")) + 1.05 + 0.4; // buraco do s8 (roda da frente passa logo depois)
export const boxesX = () => carX(W("s9", "calor") + 20) + 2.2; // caixas do s9 (o carro para antes)

/* ---------- peças: 0 → 1 quando surgem (por palavra) ---------- */
const appear = (t: number, f: number, d = 12) => (t < f ? 0 : clamp01((t - f) / d));
export const parts = (t: number) => ({
  engine: appear(t, W("s2", "cilindro") - 6),
  crank: appear(t, W("s2", "barra") - 4),
  four: appear(t, W("s3", "quatro") - 4),
  radiator: appear(t, W("s4", "grade") - 6),
  clutch: appear(t, W("s5", "discos") - 6),
  gearbox: appear(t, W("s5", "engrenagens") - 6),
  diff: appear(t, W("s6", "engrenagens") - 6),
  steering: appear(t, W("s7", "articulação") - 6),
  springs: appear(t, W("s8", "molas") - 6),
  tires: appear(t, W("s8", "borracha") - 4),
  brakes: appear(t, W("s9", "disco") - 6),
  body: appear(t, start("s10") + 4, 20),
  lights: appear(t, W("s10", "faróis") - 2, 6),
  wiper: appear(t, W("s10", "limpador") - 2, 6),
  belt: appear(t, W("s10", "cinto") - 2, 6),
});
export const lastScene = timed[timed.length - 1];
export {after};

/* ---------- pedais e câmbio (mascote pisando e trocando marcha) ---------- */
/** pé esquerdo na embreagem (0-1) */
export const clutchPress = (t: number) => {
  const pulse = (c: number, w = 14) => (t >= c - 4 && t < c + w ? Math.sin(((t - c + 4) / (w + 4)) * Math.PI) : 0);
  if (t >= W("s5", "discos") && t < W("s5", "embreagem") + 20) return Math.max(0, Math.sin((t - W("s5", "discos")) * 0.12));
  return Math.max(pulse(W("s5", "Primeira")), pulse(W("s5", "Quinta")));
};
/** pé direito no freio (0-1) */
export const brakePress = (t: number) => (t >= W("s9", "pastilhas") - 6 && t < W("s9", "calor") + 20 ? clamp01((t - W("s9", "pastilhas") + 6) / 6) : 0);
/** marcha engatada (1 a 5) e se a mão está na alavanca */
export const gear = (t: number) => (t < W("s5", "Quinta") ? 1 : 5);
export const handOnShifter = (t: number) => t >= W("s5", "Primeira") - 8 && t < W("s5", "câmbio") + 25;
