import {VO_OFFSET, timed} from "../data/scenes";
import {clamp01} from "./anim";
import {rain} from "./story";

// efeito sintetizado (public/sfx) para cada pista do plano; null = sem som
export const SFX = (id: string): string | null => {
  if (/pop|celebrate/.test(id)) return "pop.wav";
  if (/whoosh/.test(id)) return "whoosh.wav";
  if (/pump/.test(id)) return "pump.wav";
  if (/tick/.test(id)) return "tick.wav";
  if (/faucet|glass/.test(id)) return "splash.wav";
  if (/gurgle|swirl|flow/.test(id)) return "gurgle.wav";
  if (/drip|plop/.test(id)) return "drip.wav";
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
  return (speaking(f) ? 0.07 : 0.14) * fadeIn * fadeOut;
};

export const rainVolume = (f: number) => 0.07 * rain(f); // vídeo 5: temporal (baixo, pedido do usuário)
