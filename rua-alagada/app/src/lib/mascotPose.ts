// Reações e gestos do mascote ao longo do roteiro (tudo derivado do frame global).
import {VO_OFFSET, S, finalCut, sceneAt, wordLocal} from "../data/scenes";
import type {MascotPose} from "../components/Mascot";
import {L, clamp01, easeInOut} from "./anim";
import {track} from "./track";

/** boca falando acompanhando as palavras da narração */
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

export const mascotPose = (gf: number): MascotPose => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const p = f / s.durationInFrames;
  const sway = Math.sin(gf * 0.07) * 4;
  const pose: MascotPose = {
    emotion: "happy",
    talk: talkAt(gf),
    lArm: [-62, 16], // segura o guarda-chuva
    rArm: [4 + sway * 0.5, 10],
    umbrella: "open",
    umbrellaTilt: 0,
    jump: 0,
    shiver: 0,
    walking: false,
  };
  switch (s.id) {
    case "s1":
      pose.emotion = p < 0.45 ? "surprised" : "worried";
      pose.umbrellaTilt = track("umbrella.rotZ", gf, 0) * 0.6 + Math.sin(gf * 0.2) * 3;
      pose.rArm = p < 0.45 ? [-30, 40] : [-70, 25]; // susto, depois "pra onde?" com a mão
      break;
    case "s3":
      pose.emotion = p < 0.3 ? "happy" : "worried";
      break;
    case "s6": {
      const walk0 = 0.77, walk1 = 0.86, throw1 = 0.93;
      pose.emotion = p < 0.3 ? "surprised" : p < throw1 ? "annoyed" : "happy";
      pose.walking = p >= walk0 && p < walk1;
      if (p >= walk1 && p < throw1) pose.rArm = [L(p, walk1, throw1, -20, -140, easeInOut), 15];
      if (p < 0.3) pose.rArm = [-40, 45];
      break;
    }
    case "s7":
      pose.emotion = "scared";
      pose.shiver = 1;
      pose.umbrellaTilt = Math.sin(gf * 0.25) * 9;
      pose.rArm = [-20, 30];
      break;
    case "s8":
      pose.emotion = "worried";
      pose.shiver = 0.4;
      break;
    case "s9":
      pose.emotion = p < 0.45 ? "worried" : "relieved";
      if (p >= 0.45) pose.rArm = [-25, 20];
      break;
    case "s10":
      pose.emotion = "happy";
      pose.rArm = [-55 + Math.sin(gf * 0.15) * 8, 30]; // mostra a calçada
      break;
    case "s11": {
      if (gf < finalCut) break;
      const c = gf - finalCut;
      const s11 = S("s11");
      const ci = wordLocal(s11, "comente") ?? 0;
      const fw = wordLocal(s11, "Dentro") ?? 0;
      const lf = f;
      pose.umbrella = "none";
      pose.emotion = "happy";
      if (c < 80) {
        // comemoração: braços para cima e pulinhos
        pose.emotion = "joy";
        const up = clamp01(c / 8);
        pose.lArm = [-10, 15 + 140 * up + Math.sin(gf * 0.5) * 8];
        pose.rArm = [-10, 15 + 140 * up - Math.sin(gf * 0.5) * 8];
        pose.jump = Math.abs(Math.sin(c * 0.22)) * 0.18 * (1 - clamp01((c - 60) / 20));
      } else if (lf >= ci - 6 && lf < ci + 45) {
        pose.lArm = [4, 10];
        pose.rArm = [-88, 8]; // aponta para quem está assistindo ("comente")
      } else if (lf >= fw - 10) {
        pose.lArm = [4, 10];
        pose.rArm = [-10, 150 + Math.sin(gf * 0.35) * 20]; // acena
      } else {
        pose.lArm = [4 + sway * 0.3, 10];
        pose.rArm = [-35 + Math.sin(gf * 0.12) * 10, 25]; // gesticula falando
      }
      break;
    }
  }
  return pose;
};
