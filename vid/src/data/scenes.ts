// Cenas com tempos reais da voz. Parte do scene-plan.ts aprovado (v1) e só ESTICA
// uma cena se a fala real não couber (nunca encurta). Sem timing.json => frames do plano.
import {scenes as planned, config} from "./scene-plan";
import type {ScenePlan} from "./scene-plan";
import timingJson from "./timing.json";

export type VoWord = {w: string; s: number; e: number}; // segundos, relativos ao início do áudio
type Timing = Record<string, {duration: number; words: VoWord[]}>;
const timing = timingJson as unknown as Timing;

export const VO_OFFSET = 8; // fala começa ~0,25 s após o corte
export const TAIL = 18; // respiro (~0,6 s) antes do próximo corte

export type TimedScene = ScenePlan & {voWords?: VoWord[]; voSeconds?: number};

let t = 0;
export const timed: TimedScene[] = planned.map((s) => {
  const tm = timing[s.voKey];
  const need = tm ? Math.ceil(VO_OFFSET + tm.duration * config.fps + TAIL) : 0;
  const d = Math.max(s.durationInFrames, need);
  const out: TimedScene = {
    ...s,
    startFrame: t,
    durationInFrames: d,
    voWords: tm?.words,
    voSeconds: tm?.duration,
  };
  t += d;
  return out;
});

export const totalFrames = t;
export const hasVO = (key: string) => Boolean(timing[key]);
export {config};
