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
  {id: "s4", P: W("s4", "Se") - 6, R: W("s4", "Por", 2), back: W("s4", "Se") - 6},
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
  const spans: [number, number, number][] = [
    [start("s2"), W("s2", "cadê") - 4, 1], // "No outro dia": uma noite passando rápido
    [W("s5", "espera"), W("s5", "teste") + 5, 3],
    [W("s7", "dias") - 5, W("s7", "verde") + 5, 3],
  ];
  for (const [a, b, n] of spans) {
    if (gf >= a && gf < b) {
      const k = (gf - a) / Math.max(1, b - a);
      return 0.8 * Math.pow(Math.sin(k * Math.PI * n), 2);
    }
  }
  return 0;
};
export const lastScene = timed[timed.length - 1];
export {clamp01};

/** calor do começo (s1): céu alaranjado, sol forte — some depois da "ideia" */
export const heat = (gf: number) => (gf < end("s1") ? 1 - L(gf, W("s1", "ideia") + 10, W("s1", "abrir") + 10, 0, 1) : 0);

/* ---------- trabalho do mascote dentro da piscina (desce e sobe pela escada) ---------- */
/** s3: desce a escada de obra, passa o compactador da esquerda para a direita, volta para o lado firme */
export const s3Work = () => {
  const d0 = W("s3", "socado");
  return {d0, d1: d0 + 20, c1: W("s3", "magro") + 6};
};
export const compX = (t: number) => {
  const w = s3Work();
  return L(t, w.d1, w.c1, -0.5, 3.6);
};
/** s5: depois do rebobinar desce a escada da piscina, vai até a parede da direita e puxa o rolo até a escada */
export const s5Work = () => {
  const r0 = rew("s5").R + RW;
  const v = W("s5", "veda") + 20;
  return {r0, d1: r0 + 18, w1: r0 + 34, v, back: v + 12, up: v + 36};
};
export const IN_X0 = -1.3, IN_X1 = 4.3;
export const rollX = (t: number) => {
  const w = s5Work();
  return L(t, w.w1, w.v, IN_X1, IN_X0 + 0.6);
};
export const proofK = (t: number) => {
  const w = s5Work();
  return L(t, w.w1, w.v, 0, 1);
};
