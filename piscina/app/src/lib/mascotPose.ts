// Vídeo 2 — o mascote participa de cada etapa (como o personagem da referência): reações, gestos e objetos.
import {VO_OFFSET, finalCut, sceneAt, wordLocal} from "../data/scenes";
import type {MascotLook, MascotPose} from "../components/Mascot";
import {L, clamp01, easeInOut} from "./anim";

/** s2: janela do "rebobinar" a partir do "Por isso". null = fora; >=0 = frame local a mostrar; -1 = depois */
export const s2Rewind = (s: ReturnType<typeof sceneAt>, f: number): number | null => {
  const p = wordLocal(s, "Por");
  const im = wordLocal(s, "Agora");
  if (p === undefined || im === undefined || f < p) return null;
  const R = REWIND_FRAMES;
  if (f < p + R) return Math.min(p - 1, Math.round(p - ((f - p) / R) * (p - im)));
  return -1;
};
export const REWIND_FRAMES = 26;

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
  const W = (w: string, fb: number) => wordLocal(s, w) ?? Math.round(fb * s.durationInFrames);
  switch (s.id) {
    case "s2": {
      // pega o copo, imagina beber, bebe, larga o copo e passa mal; no "Por isso" tudo rebobina
      const r = s2Rewind(s, f);
      if (r !== null) return r < 0 ? {} : mascotLook(s.startFrame + r);
      const b = W("beber", 0.22), res = W("Resultado", 0.6);
      if (f < s.durationInFrames * 0.07 || f >= res) return {};
      return {prop: "glassDirty", propHand: "r", propTilt: f > b && f < b + 40 ? 35 : 0};
    }
    case "s4": {
      const a = W("produto", 0.3), b = W("maiores", 0.7);
      const tilt = f < b + 10 ? L(f, a - 6, a + 8, 0, 80, easeInOut) : L(f, b + 10, b + 22, 80, 0, easeInOut);
      return {prop: "jug", propHand: "r", propTilt: tilt, pouring: f > a + 4 && f < b + 10 ? 1 : 0};
    }
    case "s7": {
      const a = W("cloro", 0.45), b = W("germes", 0.6);
      return {prop: "bottle", propHand: "l", propTilt: L(f, a - 6, a + 6, 0, 75, easeInOut), pouring: f > a + 3 && f < b + 25 ? 1 : 0};
    }
    case "s10":
      return {prop: "glass", propHand: "r"};
    case "s11": {
      if (gf < finalCut) return {};
      const ci = wordLocal(s, "Comenta") ?? 0;
      return f >= ci - 6 && f < ci + 45 ? {rHand: "point"} : {};
    }
  }
  return {};
};

export const mascotPose = (gf: number): MascotPose => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const p = f / s.durationInFrames;
  const sway = Math.sin(gf * 0.07) * 4;
  const pose: MascotPose = {
    emotion: "happy",
    talk: 0, // sem sincronia labial: só reações no rosto (pedido do usuário)
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
    case "s2": {
      // o boneco testa: imagina beber a água da represa, bebe e passa mal... e a cena rebobina
      const r = s2Rewind(s, f);
      if (r !== null) {
        if (r >= 0) return mascotPose(s.startFrame + r);
        pose.emotion = "worried"; // de volta ao começo: "melhor não!"
        pose.rArm = [-55, 48 + Math.sin(gf * 0.4) * 10];
        break;
      }
      const im = wordLocal(s, "imagina") ?? s.durationInFrames * 0.2;
      const b = wordLocal(s, "beber") ?? s.durationInFrames * 0.22;
      const t = wordLocal(s, "terra") ?? s.durationInFrames * 0.38;
      const res = wordLocal(s, "Resultado") ?? s.durationInFrames * 0.6;
      if (f < s.durationInFrames * 0.07) {
        pose.emotion = "curious";
      } else if (f < b) {
        pose.emotion = f < im - 6 ? "happy" : "curious";
        pose.rArm = [-75, 12]; // olha a água no copo
      } else if (f < b + 40) {
        pose.emotion = "happy";
        pose.rArm = [-113.5, -39]; // bebe
      } else if (f < res) {
        pose.emotion = f < t ? "curious" : "surprised"; // percebe a sujeira no copo
        pose.rArm = [-75, 12];
      } else {
        const k = clamp01((f - res) / 20);
        pose.sick = k;
        pose.emotion = k > 0.3 ? "sick" : "surprised";
        pose.lArm = [-35, -28]; // mãos na barriga
        pose.rArm = [-35, -28];
        pose.shiver = 0.5 * k;
      }
      break;
    }
    case "s3": {
      const b = wordLocal(s, "Bombas") ?? 10;
      pose.emotion = f < b ? "happy" : "surprised";
      pose.lArm = f < b - 4 ? [-30, 20] : [-55, 52]; // aperta o botão da bomba
      break;
    }
    case "s4":
      pose.emotion = "happy";
      pose.rArm = [-105, 22]; // segura a jarra sobre o tanque
      break;
    case "s5":
      pose.emotion = p < 0.3 ? "curious" : "surprised";
      pose.rArm = [-40, 35]; // aponta os flocos afundando
      break;
    case "s6":
      pose.emotion = p < 0.35 ? "curious" : "happy";
      pose.rArm = [-50, 38]; // mostra as camadas
      break;
    case "s7": {
      const c = wordLocal(s, "cloro") ?? s.durationInFrames * 0.45;
      pose.emotion = f < c ? "worried" : "happy";
      pose.lArm = [-105, 22]; // frasco de cloro sobre o tanque
      break;
    }
    case "s8":
      pose.emotion = p < 0.4 ? "surprised" : "happy";
      pose.rArm = [-100, 20]; // aponta para o reservatório lá em cima
      break;
    case "s9":
      pose.emotion = p < 0.4 ? "curious" : "happy";
      pose.rArm = [-75, 35]; // aponta para o hidrômetro, ao lado dele na calçada
      break;
    case "s10":
      pose.emotion = p < 0.75 ? "happy" : "relieved";
      pose.rArm = p < 0.75 ? [-60, 18] : [-113.5, -39]; // segura o copo e bebe
      break;
    case "s11": {
      if (gf < finalCut) break;
      const c = gf - finalCut;
      const ci = wordLocal(s, "Comenta") ?? 0;
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
