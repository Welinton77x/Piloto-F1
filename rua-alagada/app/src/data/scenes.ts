// Cenas com tempos DERIVADOS DA VOZ (roteiro v2 aprovado). Sem timing.json => frames do plano.
// Cada fala começa VO_OFFSET após o corte; a cena termina TAIL após o fim da fala.
// Os frames locais do plano (câmera, animações, badges, sons) são reescalados para a nova duração,
// e badges com anchorWord passam a entrar no frame real da palavra.
import {scenes as planned, config} from "./scene-plan";
import type {Anim, Badge, CamKey, ScenePlan} from "./scene-plan";
import timingJson from "./timing.json";

export type VoWord = {w: string; s: number; e: number};
type Timing = Record<string, {duration: number; words: VoWord[]}>;
const timing = timingJson as unknown as Timing;

export const VO_OFFSET = 8; // ~0,25 s
export const TAIL = 20; // ~0,65 s de pausa até o próximo corte
export const END_HOLD = 45; // respiro final do vídeo (1,5 s)

export type TimedScene = ScenePlan & {k: number; voWords?: VoWord[]; voSeconds?: number; plannedDuration: number};

export const norm = (w: string) =>
  w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** frame local (na cena) em que a palavra n-ésima ocorrência de `word` começa a ser dita */
export const wordLocal = (s: TimedScene, word: string, occurrence = 0): number | undefined => {
  if (!s.voWords) return undefined;
  const target = norm(word.split(/\s+/)[0]);
  let n = 0;
  for (const w of s.voWords) {
    const nw = norm(w.w);
    if (nw === target || (target.length >= 5 && nw.startsWith(target.slice(0, 5)))) {
      if (n === occurrence) return Math.round(VO_OFFSET + w.s * config.fps);
      n++;
    }
  }
  return undefined;
};

let t = 0;
export const timed: TimedScene[] = planned.map((s, i) => {
  const tm = timing[s.voKey];
  const last = i === planned.length - 1;
  const d = tm ? Math.ceil(VO_OFFSET + tm.duration * config.fps + TAIL + (last ? END_HOLD : 0)) : s.durationInFrames;
  const k = d / s.durationInFrames;
  const sc = (x: number) => Math.round(x * k);
  const base: TimedScene = {
    ...s,
    startFrame: t,
    durationInFrames: d,
    plannedDuration: s.durationInFrames,
    k,
    voWords: tm?.words,
    voSeconds: tm?.duration,
    camera: s.camera.map((c: CamKey, j: number, arr: CamKey[]) => {
      // preserva cortes secos (keys consecutivas)
      const prev = arr[j - 1];
      const f = prev && c.f - prev.f === 1 ? sc(prev.f) + 1 : sc(c.f);
      return {...c, f};
    }),
    animations: s.animations.map((a: Anim) => ({...a, f0: sc(a.f0), f1: sc(a.f1)})),
    audioCues: s.audioCues.map((c) => ({...c, f: sc(c.f)})),
    badges: [],
  };
  base.badges = s.badges.map((b: Badge) => {
    const wf = b.anchorWord ? wordLocal(base, b.anchorWord) : undefined;
    const f0 = wf ?? sc(b.f0);
    return {...b, f0, f1: b.f1 !== undefined ? sc(b.f1) : undefined};
  });
  t += d;
  return base;
});

export const totalFrames = t;
export const hasVO = (key: string) => Boolean(timing[key]);
export const sceneAt = (gf: number) => timed.find((s) => gf >= s.startFrame && gf < s.startFrame + s.durationInFrames) ?? timed[timed.length - 1];
export const S = (id: string) => timed.find((s) => s.id === id)!;
export {config};
