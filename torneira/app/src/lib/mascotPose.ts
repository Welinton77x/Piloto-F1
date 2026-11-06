// Vídeo 2 — reações e gestos do mascote na cozinha (tudo derivado do frame global).
import {VO_OFFSET, S, finalCut, sceneAt, wordLocal} from "../data/scenes";
import type {MascotLook, MascotPose} from "../components/Mascot";
import {L, clamp01, easeInOut} from "./anim";

const talkAt = (gf: number) => {
  const s = sceneAt(gf);
  if (!s.voWords) return 0;
  const f = gf - s.startFrame;
  for (const w of s.voWords) {
    const a = VO_OFFSET + w.s * 30, b = VO_OFFSET + w.e * 30;
    if (f >= a && f < b) return 0.3 + 0.7 * Math.abs(Math.sin((f - a) * 0.75));
  }
  return 0;
};

export const mascotLook = (gf: number): MascotLook => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  if (s.id === "s11" && gf >= finalCut) {
    const ci = wordLocal(s, "comente") ?? 0;
    if (f >= ci - 6 && f < ci + 45) return {capLogo: true, rHand: "point"};
  }
  return {capLogo: true};
};

export const mascotPose = (gf: number): MascotPose => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const p = f / s.durationInFrames;
  const sway = Math.sin(gf * 0.07) * 4;
  const pose: MascotPose = {
    emotion: "happy",
    talk: talkAt(gf),
    lArm: [4 + sway * 0.3, 12],
    rArm: [-30 + Math.sin(gf * 0.12) * 8, 22], // gesticula falando
    umbrella: "none",
    umbrellaTilt: 0,
    jump: 0,
    shiver: 0,
    walking: false,
  };
  switch (s.id) {
    case "s1": {
      const onde = wordLocal(s, "onde") ?? s.durationInFrames * 0.6;
      pose.emotion = f < onde - 4 ? "happy" : "surprised";
      if (p < 0.2) pose.rArm = [L(p, 0, 0.12, -10, -75, easeInOut), 30]; // estica o braço até a torneira
      if (f >= onde - 4) pose.rArm = [-45, 40];
      break;
    }
    case "s2":
    case "s3":
      pose.emotion = "surprised";
      break;
    case "s7":
      pose.emotion = p < 0.37 ? "worried" : "relieved";
      break;
    case "s9":
      pose.emotion = "happy";
      pose.lArm = [-70, 40]; // mostra o hidrômetro, do lado de fora da casa
      break;
    case "s10":
      pose.emotion = p < 0.8 ? "happy" : "relieved";
      if (p >= 0.8) pose.rArm = [-113.5, -39]; // leva o copo à boca
      break;
    case "s11": {
      if (gf < finalCut) break;
      const c = gf - finalCut;
      const ci = wordLocal(s, "comente") ?? 0;
      const fw = wordLocal(s, "segue") ?? 0;
      if (c < 80) {
        pose.emotion = "joy";
        const up = clamp01(c / 8);
        pose.lArm = [-10, 15 + 140 * up + Math.sin(gf * 0.5) * 8];
        pose.rArm = [-10, 15 + 140 * up - Math.sin(gf * 0.5) * 8];
        pose.jump = Math.abs(Math.sin(c * 0.22)) * 0.18 * (1 - clamp01((c - 60) / 20));
      } else if (f >= ci - 6 && f < ci + 45) {
        pose.lArm = [4, 10];
        pose.rArm = [-88, 8]; // aponta para quem assiste
      } else if (f >= fw - 10) {
        pose.lArm = [4, 10];
        pose.rArm = [-10, 150 + Math.sin(gf * 0.35) * 20]; // acena
      }
      break;
    }
  }
  return pose;
};
