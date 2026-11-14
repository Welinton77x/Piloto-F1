// Vídeo 6 (calor no Nordeste): linha do tempo. Tudo deriva do frame global.
import {S, timed, wordLocal} from "../data/scenes";
import {L, clamp01} from "./anim";

export const RW = 26; // frames do rebobinar
export const W = (id: string, word: string, occ = 0, fb = 0.5): number => {
  const s = S(id);
  return s.startFrame + (wordLocal(s, word, occ) ?? Math.round(fb * s.durationInFrames));
};
export const start = (id: string) => S(id).startFrame;
export const end = (id: string) => S(id).startFrame + S(id).durationInFrames;
export const inS = (id: string, t: number) => t >= start(id) && t < end(id);

/* cenários (x de cada "set" no mundo) */
export const SET = {sertao: 0, globe: 70, map: 140, city: -70, room: -140} as const;

/* ⏸/⏪ só no mito do ventilador (decisão do usuário) */
export type Rewind = {id: string; P: number; R: number; back: number; label: string};
export const REWINDS: Rewind[] = [{id: "s8", P: W("s8", "liga") - 6, R: W("s8", "contrário") - 4, back: W("s8", "liga") - 6, label: "VENTILADOR"}];
export const rew = (id: string) => REWINDS.find((x) => x.id === id)!;
export const te = (gf: number): number => {
  for (const r of REWINDS) if (gf >= r.R && gf < r.R + RW) return Math.round(r.R - ((gf - r.R) / RW) * (r.R - r.back));
  return gf;
};
export const failing = (id: string, t: number) => {
  const r = REWINDS.find((x) => x.id === id);
  return !!r && t >= r.P && t < r.R;
};
export const imagineAmount = (gf: number) => {
  for (const r of REWINDS) if (gf >= r.P - 8 && gf < r.R + RW + 6) return L(gf, r.P - 4, r.P + 4, 0, 1) * (1 - L(gf, r.R + RW - 6, r.R + RW + 6, 0, 1));
  return 0;
};

/** qual cenário está no ar */
export const setAt = (t: number): keyof typeof SET => {
  if (inS("s2", t)) return t < W("s2", "Esse") - 4 ? "globe" : "sertao";
  if (inS("s5", t)) return "city";
  if (inS("s6", t)) return "map";
  if (inS("s7", t)) return t < W("s7", "calorão") - 10 ? "map" : "sertao";
  if (inS("s8", t)) return "room";
  return "sertao";
};
/** noite só na cidade (ilha de calor) */
export const skyDark = (gf: number) => (setAt(gf) === "city" ? L(gf, start("s5"), W("s5", "noite") , 0.2, 0.85) : 0);
/** calor do céu (alaranjado) */
export const heat = (gf: number) => (setAt(gf) === "sertao" ? (inS("s3", gf) ? L(gf, W("s3", "interior") - 10, W("s3", "sertão"), 0.25, 1) : 1) : 0);
/** El Niño: mancha quente crescendo no Pacífico */
export const ninoK = (t: number) => L(t, W("s6", "água") - 6, W("s6", "recorde") + 10, 0, 1);
/** setas do ar: sobe (s7) / arco / desce no Nordeste */
export const airUp = (t: number) => L(t, W("s7", "subir") - 6, W("s7", "Pacífico", 0) + 10, 0, 1);
export const airArc = (t: number) => L(t, W("s7", "Só") - 4, W("s7", "lugar") + 10, 0, 1);
export const airDown = (t: number) => L(t, W("s7", "desce") - 6, W("s7", "Nordeste") + 10, 0, 1);
export const cloudsGone = (t: number) => L(t, W("s7", "segura") - 4, W("s7", "chove") + 10, 0, 1);
export const lastScene = timed[timed.length - 1];
export {clamp01};
