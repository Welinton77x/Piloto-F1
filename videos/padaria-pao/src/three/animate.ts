// v2 (comédia): estado de cada frame — câmera, personagens, objetos e física do jaleco. Tudo derivado do frame.
import * as THREE from "three";
import {spring, random} from "remotion";
// @ts-ignore módulo JS
import {setMood, setArm, CoatPhysics, setCoat} from "./professor.js";
// @ts-ignore módulo JS
import {setBakerArm} from "./props.js";
// @ts-ignore módulo JS
import {HOME_X} from "./world.js";
import {cutById, planById, sceneAt, wordLocal, FPS} from "../data/timeline";

type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const spr = (f: number, f0: number, damping = 11) => (f < f0 ? 0 : spring({frame: f - f0, fps: FPS, config: {damping, stiffness: 170, mass: 0.7}}));
/** Frame local do plano aprovado → frame local real (cena reajustada à voz). */
export const L = (id: string, fPlan: number) => Math.round((fPlan * cutById[id].dur) / planById[id].durationInFrames);
const W = (id: string, i: number) => wordLocal(id, i);

// ---------- posições de referência ----------
const P0 = {x: 3.1, z: 1.15, rot: -1.15};
const B0 = {x: -0.5, z: -1.25, rot: 0};
const MATCH_P = {x: 2.75, z: 0.15, rot: -Math.PI / 2};
const MATCH_B = {x: -2.75, z: 0.15, rot: Math.PI / 2};
const SCALE_TOP: V3 = [1.62, 2.04, 0.12];
const HOME_P = {x: HOME_X + 0.6, z: -1.35, rot: -0.15};

const matchOn = (id: string, local: number) => id === "s5" || id === "s11" || (id === "s4" && local >= cutA4());
const cutA4 = () => W("s4", 6) - 3; // corte para a partida em "desafie"

export type Pose = {x: number; y: number; z: number; rot: number};

// ---------- professor ----------
const walkX = (frame: number) => {
  const c = cutById.s1;
  if (frame >= c.start + c.dur) return P0.x;
  return lerp(8.5, P0.x, 1 - Math.pow(1 - clamp01((frame - c.start) / 70), 2));
};
const profSpeed = (frame: number) => (frame < cutById.s1.start + 72 ? Math.abs(walkX(frame + 0.5) - walkX(frame - 0.5)) * FPS : 0);

export function profPose(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (id === "s1") return {x: walkX(frame), y: 0, z: P0.z, rot: lerp(-1.0, P0.rot, smooth(55, 75, local))};
  if (matchOn(id, local)) return {...MATCH_P, y: 0};
  if (id === "s8" || id === "s9") {
    const k = id === "s9" ? 1 : smooth(L("s8", 15), L("s8", 35), local);
    return {x: lerp(P0.x, SCALE_TOP[0], k), y: lerp(0, SCALE_TOP[1], k) + Math.sin(Math.PI * k) * 0.9, z: lerp(P0.z, SCALE_TOP[2], k), rot: lerp(P0.rot, -0.4, k)};
  }
  if (id === "s10") return {...HOME_P, y: 0};
  return {...P0, y: 0};
}

export function bakerPose(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (matchOn(id, local)) return {...MATCH_B, y: 0};
  return {...B0, y: 0};
}

const profLift = (frame: number) => {
  const {id, local} = sceneAt(frame);
  if (id === "s8") return 0.6 * smooth(L("s8", 35), L("s8", 45), local);
  if (id === "s9") return 0.6 * (1 - smooth(0, 12, local));
  return 0;
};

// física do jaleco (integrada do frame 0 até o atual, com cache)
const coatCache: any[] = [];
const phaseCache: number[] = [];
let phys: any = null;
let phase = 0;
function coatAt(frame: number) {
  if (!phys) phys = new CoatPhysics();
  while (coatCache.length <= frame) {
    const f = coatCache.length;
    let out = null;
    for (let i = 0; i < 4; i++) {
      const t = f + i / 4;
      const v = profSpeed(t);
      const acc = (v - profSpeed(t - 0.25)) * FPS * 4;
      phase += (v / FPS / 4) * 3.4;
      const sw = Math.sin(phase) * 0.45 * clamp01(v / 2.5);
      const climb = sceneAt(Math.floor(t)).id === "s8" ? Math.abs(profPose(t + 0.5).y - profPose(t - 0.5).y) * FPS : 0;
      out = phys.step(1 / FPS / 4, {vel: v * 0.6, acc: acc * 0.6, lift: profLift(t) + 0.15 * climb, legL: -sw, legR: sw});
    }
    coatCache.push(out);
    phaseCache.push(phase);
  }
  return {coat: coatCache[frame], phase: phaseCache[frame]};
}

// ---------- pingue-pongue ----------
const PERIOD = 20;
const HAND_X = 1.9;
const slowStart = () => L("s5", 120);
/** Posição da bolinha na partida (t em frames da partida). Saque do Professor em t = 0, 40, 80... */
function rallyPos(t: number): V3 {
  const k = Math.floor(t / PERIOD);
  const u = (t - k * PERIOD) / PERIOD;
  const fromP = k % 2 === 0;
  const x = fromP ? lerp(HAND_X, -HAND_X, u) : lerp(-HAND_X, HAND_X, u);
  return [x, 2.45 + 1.35 * Math.sin(Math.PI * u), 0.15 + Math.sin(k * 1.7) * 0.12];
}
const s5Offset = () => (40 - (slowStart() % 40)) % 40; // a câmera lenta começa num saque do Professor
const SMASH_SLOW = 12; // frames "lentos" até acertar o chapéu
const slowLocal = (local: number) => (local - slowStart()) * 0.3;
export const smashImpact = () => slowStart() + Math.ceil(SMASH_SLOW / 0.3);

export function ballPos(frame: number): V3 | null {
  const {id, local} = sceneAt(frame);
  if (id === "s11") return rallyPos(local);
  if (id !== "s5") return null;
  if (local < slowStart()) return rallyPos(local + s5Offset());
  const v = slowLocal(local) / SMASH_SLOW;
  if (v <= 1) return [lerp(HAND_X, MATCH_B.x + 0.15, v), lerp(2.45, 4.15, v) + 0.7 * Math.sin(Math.PI * v), MATCH_B.z];
  const w = (local - smashImpact()) / FPS;
  return [MATCH_B.x - 0.6 * w * 3, 4.15 + 2 * w - 6 * w * w, MATCH_B.z + w];
}
/** Pulso do golpe (0..1) para o braço de quem rebate. */
function hitPulse(t: number, who: "p" | "b") {
  const k = Math.round(t / PERIOD);
  const isP = k % 2 === 0;
  if ((who === "p") !== isP) return 0;
  return Math.exp(-Math.pow((t - k * PERIOD) / 4, 2));
}
/** Momentos das batidas (para o som "toc"), em frames globais. */
export function rallyHits(): number[] {
  const out: number[] = [];
  const s5 = cutById.s5, s11 = cutById.s11;
  for (let t = 0; t < slowStart(); t++) if ((t + s5Offset()) % PERIOD === 0) out.push(s5.start + t);
  for (let t = 0; t < s11.dur; t += PERIOD) out.push(s11.start + t);
  return out;
}

// ---------- câmera ----------
export type CamPose = {pos: THREE.Vector3; target: THREE.Vector3; fov: number};
type Key = [number, V3, number, number, number]; // [frame local, alvo, raio, azimute°, elevação°]
const PH: V3 = [P0.x, 3.15, P0.z]; // rosto do professor
const BH: V3 = [B0.x, 3.15, B0.z]; // rosto do padeiro
const MT: V3 = [0, 2.8, 0.15]; // centro da partida
function camKeys(id: string): Key[] {
  const d = cutById[id].dur;
  switch (id) {
    case "s1": return [[0, [1.9, 2.4, 0.3], 30, 20, 20], [d, [1.6, 2.4, 0.4], 26, 12, 17]];
    case "s2": {
      const a = W("s2", 12) - 4, b = W("s2", 14);
      return [[0, PH, 12, -42, 4], [a - 1, PH, 7.5, -42, 4], [a, BH, 7, 6, 4], [b - 1, BH, 6.5, 0, 4], [b, PH, 7, -44, 4], [d, PH, 6.3, -44, 4]];
    }
    case "s3": return [[0, [1.3, 2.8, 0.4], 15, -8, 10], [d, [0.9, 2.8, 0.2], 13.5, 8, 10]];
    case "s4": {
      const a = cutA4();
      return [[0, [-1.15, 2.4, 0.3], 10, 6, 14], [a - 1, [-1.15, 2.4, 0.3], 9.5, 12, 14], [a, MT, 31, -8, 10], [d, MT, 30, 6, 10]];
    }
    case "s5": {
      const s = slowStart();
      return [[0, MT, 31, 8, 10], [s - 1, MT, 29.5, -6, 10], [s, [MATCH_B.x + 0.6, 3.9, MATCH_B.z], 8, 80, 30], [d, [MATCH_B.x + 0.6, 4.1, MATCH_B.z], 7.5, 92, 28]];
    }
    case "s6": {
      const a = W("s6", 7) - 2;
      return [[0, BH, 7.5, 8, 4], [a - 1, BH, 7, 2, 4], [a, PH, 7.5, -44, 4], [d, PH, 7, -38, 4]];
    }
    case "s7": return [[0, [2.2, 2.9, 1.3], 9, -34, 6], [d, [2.35, 3.0, 1.4], 7.8, -26, 6]];
    case "s8": return [[0, [2.0, 3.2, 0.6], 16, -20, 10], [d, [1.7, 3.9, 0.4], 14, -2, 10]];
    case "s9": return [[0, [2.2, 3.5, 0.6], 17, -8, 8], [d, [1.2, 3.2, 0.5], 22, 8, 14]];
    case "s10": {
      const a = W("s10", 14) - 6, b = a + 42;
      const NP: V3 = [0.2, 2.6, 1.2];
      return [[0, [0.2, 2.6, -0.3], 13, -8, 12], [a - 1, [0.2, 2.6, -0.3], 12, 6, 12], [a, NP, 4.6, 0, 3], [b - 1, NP, 4.2, 0, 3], [b, [0.6, 3.6, -1.35], 11, -6, 6], [d, [0.6, 3.6, -1.35], 10, 6, 6]];
    }
    case "s11": return [[0, MT, 31, -10, 10], [d, MT, 30, 10, 10]];
  }
  return [[0, [0, 2, 0], 20, 0, 10], [d, [0, 2, 0], 20, 0, 10]];
}
export function cameraAt(frame: number): CamPose {
  const {id, local} = sceneAt(frame);
  const keys = camKeys(id);
  let i = 0;
  while (i < keys.length - 2 && local >= keys[i + 1][0]) i++;
  const [f0, t0, r0, a0, e0] = keys[i];
  const [f1, t1, r1, a1, e1] = keys[i + 1];
  const k = f1 - f0 <= 1 ? (local >= f1 ? 1 : 0) : smooth(f0, f1, local);
  const t = new THREE.Vector3(lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k));
  if (id === "s10") t.x += HOME_X;
  const r = lerp(r0, r1, k), az = THREE.MathUtils.degToRad(lerp(a0, a1, k)), el = THREE.MathUtils.degToRad(lerp(e0, e1, k));
  const pos = new THREE.Vector3(t.x + r * Math.sin(az) * Math.cos(el), t.y + r * Math.sin(el), t.z + r * Math.cos(az) * Math.cos(el));
  // tremor (tapa no balcão, baguete caindo, chapéu)
  const shakeAt = (f0s: number, amp: number) => {
    const s = local - f0s;
    if (s < 0 || s > 18) return;
    const a = amp * Math.exp(-s / 6);
    pos.x += Math.sin(s * 2.7) * a;
    pos.y += Math.cos(s * 3.3) * a;
  };
  if (id === "s3") shakeAt(L("s3", 10), 0.12);
  if (id === "s4") shakeAt(L("s4", 152), 0.08);
  if (id === "s5") shakeAt(smashImpact(), 0.1);
  if (id === "s8") shakeAt(L("s8", 35), 0.1);
  if (id === "s9") shakeAt(L("s9", 25), 0.12);
  return {pos, target: t, fov: 24};
}

// ---------- âncoras 3D para as pílulas ----------
export function anchorAt(name: string, frame: number): V3 | null {
  const p = profPose(frame), b = bakerPose(frame);
  switch (name) {
    case "prof.head": return [p.x, p.y + 4.25, p.z];
    case "baker.head": return [b.x, 4.55, b.z];
    case "breadPale": return [-1.15, 2.95, 0.35];
    case "ball": return ballPos(frame) ?? [0, 3, 0];
    case "sonho": return [2.2, 3.2, 1.3];
    case "homePile": return [HOME_X + 0.2, 3.0, -0.2];
  }
  return null;
}

// ---------- aplica tudo ----------
export function applyFrame(refs: any, frame: number) {
  const {id, local} = sceneAt(frame);
  const P = refs.prof.userData.parts;
  const B = refs.baker.userData.parts;
  const {coat, phase: ph} = coatAt(frame);
  const match = matchOn(id, local);

  // --- professor ---
  const pp = profPose(frame);
  refs.prof.position.set(pp.x, pp.y, pp.z);
  refs.prof.rotation.y = pp.rot;
  const walk = clamp01(profSpeed(frame) / 2.5);
  const sw = Math.sin(ph) * 0.45 * walk;
  P.hips[0].rotation.x = sw;
  P.hips[1].rotation.x = -sw;
  P.body.position.y = Math.abs(Math.cos(ph)) * 0.07 * walk;
  P.body.rotation.x = 0.05 * walk;
  const pm = planById[id].moods.prof;
  let mood = pm[0].mood;
  for (const k of pm) if (local >= L(id, k.f)) mood = k.mood;
  setMood(P, mood);
  setCoat(P, coat);

  const lift = profLift(frame);
  let armL: any = {raise: 0.08 + 2.4 * lift, forward: -sw * 0.9, bend: 0.2 * lift + 0.15 * walk};
  let armR: any = {raise: 0.08 + 2.4 * lift, forward: sw * 0.9, bend: 0.2 * lift + 0.15 * walk};
  if (id === "s3") {
    const k = spr(local, L("s3", 4), 14);
    armR = {raise: 0.25, forward: lerp(1.9, 0.75, k), bend: 0.2};
  }
  if (id === "s4" && !match) {
    const k = spr(local, W("s4", 6) - 12);
    armR = {raise: lerp(0.08, 1.0, k), forward: lerp(0, 0.95, k), bend: lerp(0, 0.85, k), point: k > 0.3};
  }
  if (match) {
    const t = id === "s5" ? (local < slowStart() ? local + s5Offset() : slowStart() + s5Offset() + slowLocal(local)) : local;
    const hit = id === "s5" && local >= slowStart() ? Math.exp(-Math.pow(slowLocal(local) / 3, 2)) : hitPulse(t, "p");
    const appear = id === "s4" ? spr(local, L("s4", 120)) : 1;
    armR = {raise: 0.3, forward: lerp(0.1, 1.15, appear) + 0.5 * hit, bend: 0.35 - 0.3 * hit};
  }
  if (id === "s6" && local >= W("s6", 8) - 4) {
    const k = spr(local, W("s6", 8) - 4);
    armR = {raise: lerp(0.08, 0.35, k), forward: lerp(0, 0.6, k), bend: lerp(0, 1.95, k)};
  }
  if (id === "s7") {
    const k = spr(local, L("s7", 25));
    armR = {raise: 0.15, forward: 0.95 * k, bend: 0.55 * k};
    armL = {raise: 0.15, forward: 0.95 * k, bend: 0.55 * k};
  }
  if (id === "s10" && local >= L("s10", 170)) {
    const k = spr(local, L("s10", 170));
    armR = {raise: lerp(0.08, 2.6, k), forward: lerp(0, 0.3, k), bend: lerp(0, 0.3, k)};
  }
  setArm(P.arms[0], armL);
  setArm(P.arms[1], armR);
  refs.profSlice.visible = match || (id === "s10" && local >= L("s10", 170));
  refs.profSlice.scale.setScalar(id === "s4" ? spr(local, L("s4", 120)) : 1);
  refs.bagHand.visible = false;
  // brilho nos óculos (cena 2)
  const g = id === "s2" ? Math.sin(Math.PI * clamp01((local - (W("s2", 10) - 2)) / 16)) : 0;
  refs.glint.visible = g > 0.01;
  refs.glint.scale.setScalar(g * 1.2);
  refs.glint.rotation.z = local * 0.08;

  // --- padeiro ---
  const bp = bakerPose(frame);
  refs.baker.position.set(bp.x, 0, bp.z);
  refs.baker.rotation.y = bp.rot;
  const bm = planById[id].moods.baker ?? [{f: 0, mood: "feliz"}];
  let bmood = bm[0].mood;
  for (const k of bm) if (local >= L(id, k.f)) bmood = k.mood;
  B.setMood(bmood);
  let bR: any = {raise: 0.1, forward: 0, bend: 0};
  let bL: any = {raise: 0.1, forward: 0, bend: 0};
  if (id === "s3" && local >= L("s3", 60)) {
    const k = spr(local, L("s3", 60));
    bR = {raise: lerp(0.1, 1.55, k), forward: lerp(0, 0.35, k), bend: lerp(0, 2.2, k)}; // continência
  }
  if (match) {
    const t = id === "s5" ? (local < slowStart() ? local + s5Offset() : 1e9) : local;
    const hit = hitPulse(t, "b");
    const appear = id === "s4" ? spr(local, L("s4", 130)) : 1;
    bR = {raise: 0.3, forward: lerp(0.1, 1.15, appear) + 0.5 * hit, bend: 0.35 - 0.3 * hit};
  }
  if (id === "s7") {
    const k = spr(local, 0) * (1 - smooth(L("s7", 40), L("s7", 55), local));
    bR = {raise: 0.2, forward: 1.1 * k, bend: 0.3};
  }
  setBakerArm(B.arms[0], bL);
  setBakerArm(B.arms[1], bR);
  refs.tongs.visible = false;
  refs.bakerSlice.visible = match;
  refs.bakerSlice.scale.setScalar(id === "s4" ? spr(local, L("s4", 130)) : 1);
  B.body.position.y = Math.abs(Math.sin(frame * 0.07)) * 0.02;
  // chapéu voando (cena 5)
  const hk = id === "s5" ? spr(local, smashImpact(), 8) : 0;
  B.hat.position.set(-0.6 * hk, 1.8 * hk, 0);
  B.hat.rotation.set(0, 0, 1.6 * hk);

  // --- bolinha + rastro ---
  const bpos = ballPos(frame);
  const showBall = !!bpos && (id !== "s4");
  refs.ball.visible = showBall;
  if (bpos) refs.ball.position.set(...bpos);
  const slow = id === "s5" && local >= slowStart();
  refs.vitrine.visible = !slow; // no plano fechado da câmera lenta a vitrine tapava o padeiro
  refs.trail.forEach((t: any, i: number) => {
    const q = slow ? ballPos(frame - (i + 1) * 2) : null;
    t.visible = !!q && sceneAt(frame - (i + 1) * 2).id === "s5";
    if (q) t.position.set(...q);
  });
  // baguete-rede
  const showNet = match;
  refs.baguette.visible = showNet;
  const nk = id === "s4" ? spr(local, L("s4", 140), 8) : 1;
  refs.baguette.position.set(0, lerp(6, 1.98, nk), 0.1);

  // --- cesto, vitrine e objetos da v1 que ficam como cenário ---
  refs.oldBreads.forEach((b: any) => (b.visible = false));
  refs.hotBreads.forEach((b: any) => {
    b.visible = true;
    b.position.copy(b.userData.rest);
  });
  refs.ovenDoor.rotation.x = 0;
  refs.tray.position.z = 0.2;
  refs.steam.forEach((s: any) => (s.visible = false));
  refs.breadDark.position.y = 0.16;
  refs.breadLight.position.y = 0.16;
  refs.breadPale.visible = id === "s4" && !match;
  if (refs.breadPale.visible) {
    const k = spr(local, L("s4", 20));
    refs.breadPale.position.set(0, 0.16 + 0.4 * k, 0.3);
    refs.breadPale.rotation.y = Math.sin(local * 0.15) * 0.4;
  }
  for (const k of ["bagCounter", "bagScale", "bagBig", "arrow", "plastic", "homePaper", "split", "stamp"]) refs[k].visible = false;
  refs.fallBreads.forEach((b: any) => (b.visible = false));
  refs.priceTag.rotation.z = 0;

  // --- tapa no balcão: farinha e papéis (cena 3) ---
  const ft = id === "s3" ? (local - L("s3", 10)) / FPS : -1;
  refs.flour.forEach((f: any) => {
    f.visible = ft > 0 && ft < 1.6;
    if (!f.visible) return;
    const v = f.userData.v, e = 1 - Math.exp(-2.2 * ft);
    f.position.set(2.15 + v.x * 0.55 * e, 1.85 + v.y * 0.5 * e, 0.6 + v.z * 0.5 * e);
    f.scale.setScalar(0.6 + ft * 1.5);
    f.material.opacity = 0.85 * (1 - ft / 1.6);
  });
  refs.papers.forEach((pp2: any) => {
    pp2.visible = ft > 0;
    if (!pp2.visible) return;
    const v = pp2.userData.v, tt = Math.min(ft, 1.4);
    pp2.position.set(1.2 + v.x * tt * 0.6, Math.max(0.02, 1.9 + v.y * tt - 3.2 * tt * tt), 0.3 + v.z * tt * 0.6);
    pp2.rotation.set(pp2.userData.s * tt * 2, pp2.userData.s * tt, tt * 3);
  });

  // --- sonho com raios de luz (cena 7) ---
  const cam = cameraAt(frame);
  refs.sonho.visible = id === "s7";
  refs.rays.visible = id === "s7";
  refs.sparkles.forEach((s: any) => (s.visible = id === "s7"));
  if (id === "s7") {
    const k = spr(local, L("s7", 10), 13);
    const from = new THREE.Vector3(-1.15, 2.3, 0.35), to = new THREE.Vector3(2.35, 2.55, 1.55);
    const sp = from.clone().lerp(to, k);
    sp.y += Math.sin(Math.PI * clamp01(k)) * 1.0 + Math.sin(local * 0.12) * 0.03;
    refs.sonho.position.copy(sp);
    refs.sonho.rotation.y = local * 0.05;
    const behind = cam.pos.clone().sub(sp).normalize().multiplyScalar(-0.4);
    refs.rays.position.copy(sp).add(behind);
    refs.rays.lookAt(cam.pos);
    refs.rays.rotateZ(THREE.MathUtils.degToRad(20 * local / FPS));
    refs.rays.scale.setScalar(0.95 + 0.08 * Math.sin(local * 0.2));
    refs.sparkles.forEach((s: any) => {
      const u = s.userData;
      s.position.set(sp.x + Math.cos(u.a + local * 0.03) * u.d, sp.y + Math.sin(u.a + local * 0.03) * u.d * 0.8, sp.z);
      s.lookAt(cam.pos);
      s.scale.setScalar(0.35 * Math.max(0, Math.sin(local * 0.25 + u.ph)));
    });
  }

  // --- balança enlouquecida (cenas 8–9) ---
  let kg = 0;
  if (id === "s8") {
    const a = L("s8", 40), b2 = L("s8", 90);
    if (local >= b2) kg = 72;
    else if (local >= a) kg = Math.floor(random(`kg-${local}`) * 99999) / 1000;
  }
  if (id === "s9") kg = 72;
  refs.setScale(kg);

  // --- carimbo e chuva de pão (cena 9) ---
  if (id === "s9") {
    refs.stamp.visible = true;
    const k = spr(local, L("s9", 10), 7);
    refs.stamp.position.set(2.9, lerp(10, 1.15, k), 2.1);
  }
  const r0 = L("s9", 80), r1 = L("s9", 190);
  refs.rain.forEach((b: any) => {
    const u = b.userData;
    const t0 = lerp(r0, r1, u.t0);
    const on = id === "s9" && local >= t0;
    b.visible = on;
    if (!on) return;
    const q = clamp01((local - t0) / 16);
    b.position.set(u.x, lerp(9, u.y, q * q), u.z);
    b.rotation.set(u.tilt * q, u.rot + (1 - q) * 4, u.tilt);
  });

  // --- casa (cena 10): montanha de pão, sonho e bilhete ---
  refs.homePile.visible = id === "s10";
  refs.homeSonho.visible = id === "s10";
  refs.note.visible = id === "s10" && local >= W("s10", 11) - 4;
  if (refs.note.visible) {
    const k = spr(local, W("s10", 11) - 4, 12);
    const back = smooth(W("s10", 14) + 38, W("s10", 14) + 50, local);
    const a = new THREE.Vector3(HOME_X - 0.2, 1.95, 0.55), b2 = new THREE.Vector3(HOME_X + 0.2, 2.6, 1.2), c = new THREE.Vector3(HOME_X + 1.0, 1.66, 0.6);
    const pos = a.clone().lerp(b2, k).lerp(c, back);
    refs.note.position.copy(pos);
    refs.note.rotation.set(lerp(lerp(-1.2, 0, k), -Math.PI / 2, back), lerp(Math.PI * 2 * (1 - k), 0.3, back), 0);
    refs.note.scale.setScalar(lerp(0.3, 1, k));
  }
  refs.homeSonho.rotation.y = 0.4;

  // --- confete: não usado na v2 ---
  refs.confetti.forEach((c: any) => (c.visible = false));
}
