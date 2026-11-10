// Vídeo 5 (kit 72h): linha do tempo. Tudo deriva do frame global (sem rebobinar neste vídeo).
import {S, timed, wordLocal} from "../data/scenes";
import {L, clamp01} from "./anim";

export const RW = 26;
export const W = (id: string, word: string, occ = 0, fb = 0.5): number => {
  const s = S(id);
  return s.startFrame + (wordLocal(s, word, occ) ?? Math.round(fb * s.durationInFrames));
};
export const start = (id: string) => S(id).startFrame;
export const end = (id: string) => S(id).startFrame + S(id).durationInFrames;
export const inS = (id: string, t: number) => t >= start(id) && t < end(id);

export type Rewind = {id: string; P: number; R: number; back: number; label: string};
export const REWINDS: Rewind[] = []; // vídeo informativo: sem pausar/rebobinar
export const te = (gf: number) => gf;
export const imagineAmount = (_gf: number) => 0;

/** escuridão do céu: nublado no começo, temporal à noite (s2–s6), amanhecendo (s7), sol (s8) */
export const skyDark = (gf: number) => {
  if (gf < W("s1", "imagina", 0, 0.9) && gf < start("s2")) return 0.25;
  if (gf < start("s2")) return L(gf, end("s1") - 40, end("s1"), 0.25, 0.85);
  if (gf < start("s7")) return 0.85;
  if (gf < start("s8")) return L(gf, start("s7"), end("s7"), 0.85, 0.35);
  return L(gf, start("s8"), start("s8") + 40, 0.35, 0);
};
/** chuva (0-1) */
export const rain = (gf: number) => (gf < start("s2") - 30 ? L(gf, start("s1") + 60, start("s2") - 30, 0, 0.5) : gf < start("s8") ? 1 : L(gf, start("s8"), start("s8") + 30, 1, 0));
/** energia da casa (1 = luz acesa) */
export const power = (gf: number) => (gf < W("s2", "energia") ? 1 : 0);
/** lanterna acesa (depois do item 3) */
export const flashlightOn = (gf: number) => gf >= W("s5", "lanterna") && gf < start("s8");
export const heat = (_gf: number) => 0;

/** os 8 itens do kit: quando cada um entra (frame global da palavra) */
export const ITEMS = [
  {k: "agua", label: "ÁGUA POTÁVEL", w: ["s4", "potável"]},
  {k: "comida", label: "COMIDA", w: ["s4", "comida"]},
  {k: "lanterna", label: "LANTERNA + PILHAS", w: ["s5", "lanterna"]},
  {k: "radio", label: "RÁDIO A PILHA", w: ["s5", "rádio"]},
  {k: "carregador", label: "CARREGADOR + TELEFONES", w: ["s5", "carregador"]},
  {k: "remedios", label: "REMÉDIOS + 1ºS SOCORROS", w: ["s6", "remédios"]},
  {k: "documentos", label: "DOCUMENTOS", w: ["s6", "documentos"]},
  {k: "higiene", label: "HIGIENE E FAMÍLIA", w: ["s6", "higiene"]},
] as const;
export const itemAt = (i: number) => W(ITEMS[i].w[0], ITEMS[i].w[1]);
/** quanto o item já apareceu (0-1) */
export const itemK = (i: number, gf: number) => clamp01((gf - itemAt(i) + 4) / 14);
/** itens indo para a mochila (s7, "mochila") */
export const packK = (gf: number) => L(gf, W("s7", "mochila") - 4, W("s7", "mochila") + 30, 0, 1);
export const lastScene = timed[timed.length - 1];
