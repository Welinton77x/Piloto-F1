// Linha do tempo da história (vídeo 3): palavras-âncora, "E se…?" (pausa + imaginação) e REBOBINAR.
// Tudo deriva do frame global; durante o rebobinar o mundo e o mascote leem um tempo que volta para trás.
import {S, timed, wordLocal} from "../data/scenes";
import {L, clamp01} from "./anim";

export const RW = 26; // frames do rebobinar

/** frame GLOBAL em que a palavra é dita (n-ésima ocorrência) */
export const W = (id: string, word: string, occ = 0, fb = 0.5): number => {
  const s = S(id);
  return s.startFrame + (wordLocal(s, word, occ) ?? Math.round(fb * s.durationInFrames));
};
export const start = (id: string) => S(id).startFrame;
export const end = (id: string) => S(id).startFrame + S(id).durationInFrames;

/** janelas "E se fizer errado?": P = pausa (início da imaginação), R = começa a rebobinar, back = para onde volta */
export type Rewind = {id: string; P: number; R: number; back: number};
export const REWINDS: Rewind[] = [
  {id: "s2", P: W("s2", "Imagina") - 8, R: W("s2", "Volta"), back: start("s1")},
  {id: "s3", P: W("s3", "se") - 6, R: W("s3", "Volta"), back: W("s3", "se") - 6},
  {id: "s4", P: W("s4", "Se") - 6, R: W("s4", "Por", 1), back: W("s4", "Se") - 6},
  {id: "s5", P: W("s5", "Sem") - 6, R: W("s5", "Por"), back: W("s5", "Sem") - 6},
  {id: "s8", P: W("s8", "Imagina") - 8, R: W("s8", "Por"), back: W("s8", "Imagina") - 8},
];

/** tempo efetivo do mundo: igual ao frame, exceto durante o rebobinar (volta rápido até "back") */
export const te = (gf: number): number => {
  for (const r of REWINDS) if (gf >= r.R && gf < r.R + RW) return Math.round(r.R - ((gf - r.R) / RW) * (r.R - r.back));
  return gf;
};
/** dentro da imaginação (entre a pausa e o começo do rebobinar), no tempo efetivo */
export const failing = (id: string, t: number) => {
  const r = REWINDS.find((x) => x.id === id)!;
  return t >= r.P && t < r.R;
};
export const rew = (id: string) => REWINDS.find((x) => x.id === id)!;
/** quanto a tela está "em modo imaginação" (sépia + vinheta) */
export const imagineAmount = (gf: number) => {
  for (const r of REWINDS) {
    if (gf >= r.P - 8 && gf < r.R + RW + 6) return L(gf, r.P - 8, r.P + 2, 0, 1) * (1 - L(gf, r.R + RW - 6, r.R + RW + 6, 0, 1));
  }
  return 0;
};
/** depois do rebobinar do s2, o quintal volta limpo até o fim da cena */
export const undoneS2 = (gf: number) => gf >= rew("s2").R + RW && gf < start("s3");

/** céu: dias passando rápido (teste de estanqueidade e água parada) — 0 = dia, 1 = noite */
export const skyDark = (gf: number) => {
  const spans: [number, number][] = [
    [W("s5", "espera"), W("s5", "teste") + 5],
    [W("s7", "dias") - 5, W("s7", "verde") + 5],
  ];
  for (const [a, b] of spans) {
    if (gf >= a && gf < b) {
      const k = (gf - a) / Math.max(1, b - a);
      return 0.75 * Math.pow(Math.sin(k * Math.PI * 3), 2);
    }
  }
  return 0;
};
export const lastScene = timed[timed.length - 1];
export {clamp01};
