import {VO_OFFSET, finalCut, timed} from "../data/scenes";
import {track} from "./track";
import {clamp01} from "./anim";

// efeito sintetizado (public/sfx) para cada pista do plano; null = sem som
export const SFX = (id: string): string | null => {
  if (/pop/.test(id)) return "pop.wav";
  if (/whoosh/.test(id)) return "whoosh.wav";
  if (/thunder/.test(id)) return "thunder.wav";
  if (/gurgle|waterfall|trickle|pipe-flow|slow-drain|river-rush|system-flow/.test(id)) return "gurgle.wav";
  if (/splash|geyser/.test(id)) return "splash.wav";
  if (/plastic/.test(id)) return "crinkle.wav";
  if (/thud|bin-drop/.test(id)) return "thud.wav";
  if (/bubble/.test(id)) return "bubble.wav";
  if (/drip|soak/.test(id)) return "drip.wav";
  if (/build/.test(id)) return "pop.wav";
  return null;
};

// trechos com voz (globais) para abaixar a trilha
const voSpans: [number, number][] = timed
  .filter((s) => s.voWords && s.voWords.length)
  .map((s) => [s.startFrame + VO_OFFSET, s.startFrame + VO_OFFSET + Math.round((s.voSeconds ?? 0) * 30)]);
const speaking = (f: number) => voSpans.some(([a, b]) => f >= a - 6 && f < b + 6);

export const musicVolume = (f: number) => {
  const total = timed[timed.length - 1].startFrame + timed[timed.length - 1].durationInFrames;
  const fadeIn = clamp01(f / 30);
  const fadeOut = clamp01((total - f) / 45);
  return (speaking(f) ? 0.06 : 0.13) * fadeIn * fadeOut;
};

export const rainVolume = (f: number) => {
  const d = track("rain.density", f, 1);
  const end = clamp01((finalCut + 20 - f) / 20);
  return (speaking(f) ? 0.045 : 0.075) * d * end; // chuva mais baixa (pedido do usuário)
};
