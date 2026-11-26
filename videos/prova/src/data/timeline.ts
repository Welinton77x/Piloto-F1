// Linha do tempo final: cortes derivados da voz real (timing.json), preservando ids, ordem e falas aprovadas.
import timingJson from "./timing.json";
import {scenes as plan, videoConfig} from "./scene-plan";

export const FPS = videoConfig.fps;
type Word = {w: string; s: number; e: number};
export const timing = timingJson as Record<string, {text: string; duration: number; words: Word[]}>;

const LEAD = 0.25; // fala começa 0,25 s após o corte
const GAP: Record<string, number> = {};
const DEFAULT_GAP = 0.55;
const MIN: Record<string, number> = {s1: 5.8, s3: 3.6, s6: 4.2, s7: 8.6, s9: 9.4, s10: 6.0}; // tempo mínimo para a ação caber

export type Cut = {id: string; start: number; dur: number; voKey: string | null; voStart: number};
export const cuts: Cut[] = (() => {
  let f = 0;
  return plan.map((s) => {
    const t = s.voKey ? timing[s.voKey] : null;
    const need = t ? LEAD + t.duration + (GAP[s.id] ?? DEFAULT_GAP) : 0;
    const dur = Math.round(Math.max(need, MIN[s.id] ?? 0) * FPS);
    const c = {id: s.id, start: f, dur, voKey: s.voKey, voStart: f + Math.round(LEAD * FPS)};
    f += dur;
    return c;
  });
})();
export const TOTAL = cuts[cuts.length - 1].start + cuts[cuts.length - 1].dur;
export const cutById = Object.fromEntries(cuts.map((c) => [c.id, c]));
export const planById = Object.fromEntries(plan.map((s) => [s.id, s]));

/** Frame local (dentro da cena) em que a palavra idx da fala começa. */
export const wordLocal = (id: string, idx: number) => {
  const c = cutById[id];
  const w = timing[c.voKey!].words[idx];
  return c.voStart - c.start + Math.round(w.s * FPS);
};

/** Cena ativa e frame local para um frame global. */
export const sceneAt = (frame: number) => {
  let c = cuts[0];
  for (const k of cuts) if (frame >= k.start) c = k;
  return {cut: c, id: c.id, local: frame - c.start, plan: planById[c.id]};
};

// integridade
(() => {
  let f = 0;
  for (const c of cuts) {
    if (c.start !== f) throw new Error("cortes não contíguos em " + c.id);
    f += c.dur;
  }
})();
