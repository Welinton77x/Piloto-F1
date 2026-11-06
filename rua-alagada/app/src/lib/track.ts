// Linha do tempo global: cada objeto lê seu estado com track("alvo.prop", frameGlobal, padrão).
// Vale a última animação do alvo que já começou; antes de começar, o padrão. Tudo deriva do frame.
import {Easing} from "remotion";
import {timed} from "../data/scenes";
import {L, easeIn, easeInOut, easeOut} from "./anim";

type G = {target: string; g0: number; g1: number; from: number; to: number; fn: string};

// Ajustes técnicos de continuidade (não mudam conteúdo): devolvem o estado normal depois de um evento.
// [cena, alvo, de, para, início e fim como fração da cena]
const EXTRA: [string, string, number, number, number, number, string][] = [
  ["s9", "rain.density", 2, 1, 0.3, 0.7, "easeInOut"], // chuva volta ao normal enquanto o piscinão trabalha
  ["s9", "sky.darkness", 0.7, 0.15, 0.3, 0.8, "easeInOut"],
  ["s9", "mascot.y", 0.4, 0, 0.6, 0.75, "easeInOut"], // desce do banquinho quando a rua seca
  ["s11", "rain.density", 1, 1.4, 0, 0.1, "linear"], // "chuva forte" no sistema completo
];

const EASE: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeOut,
  easeIn,
  easeInOut,
  spring: Easing.out(Easing.back(1.4)),
  sin: (t) => t,
  seeded: (t) => t,
};

// alvos do plano com nomes diferentes que controlam a mesma coisa
const ALIAS: Record<string, string> = {
  "inletWaterfall.opacity": "inlet.waterfall",
  "sidewalk.scaleY": "sidewalks.scaleY",
};

const all: G[] = [];
for (const s of timed) {
  for (const a of s.animations) {
    if (typeof a.from !== "number" || typeof a.to !== "number") continue;
    all.push({target: ALIAS[a.target] ?? a.target, g0: s.startFrame + a.f0, g1: s.startFrame + a.f1, from: a.from, to: a.to, fn: a.fn});
  }
}
for (const [id, target, from, to, p0, p1, fn] of EXTRA) {
  const s = timed.find((x) => x.id === id)!;
  all.push({target, g0: s.startFrame + Math.round(p0 * s.durationInFrames), g1: s.startFrame + Math.round(p1 * s.durationInFrames), from, to, fn});
}
all.sort((a, b) => a.g0 - b.g0);
const byTarget = new Map<string, G[]>();
for (const g of all) byTarget.set(g.target, [...(byTarget.get(g.target) ?? []), g]);

export const track = (target: string, gf: number, def = 0): number => {
  const list = byTarget.get(target);
  if (!list) return def;
  let cur: G | undefined;
  for (const g of list) if (g.g0 <= gf) cur = g;
  if (!cur) return def;
  return L(gf, cur.g0, cur.g1, cur.from, cur.to, EASE[cur.fn] ?? ((t) => t));
};

/** primeiro frame global em que o alvo começa a animar */
export const firstStart = (target: string) => byTarget.get(target)?.[0]?.g0 ?? Infinity;
