// "Vai cortar o cabelo?": estado de cada frame (determinístico) — câmera, personagens, objetos, efeitos.
import * as THREE from "three";
import {spring} from "remotion";
// @ts-ignore módulo JS
import {setMood, setArm, CoatPhysics, setCoat, setHair} from "./professor.js";
// @ts-ignore módulo JS
import {setLimb} from "./characters.js";
// @ts-ignore módulo JS
import {SPACE_X, CHAIR, WAIT} from "./world.js";
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

export type Pose = {x: number; y: number; z: number; rot: number};
const STAND: Pose = {x: 2.6, y: 0, z: 1.6, rot: -0.75};
const SEAT: Pose = {x: CHAIR.x, y: 0.05, z: CHAIR.z + 0.2, rot: 0};
const BARBER: Pose = {x: -1.5, y: 0, z: -0.2, rot: 0.55};
const DUEL_P: Pose = {x: 2.0, y: 0, z: 1.2, rot: -Math.PI / 2};
const DUEL_B: Pose = {x: -2.0, y: 0, z: 1.2, rot: Math.PI / 2};

// ---------- professor ----------
function profPath(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (id === "s1") {
    const k = 1 - Math.pow(1 - clamp01(local / 70), 2);
    return {x: lerp(8.5, STAND.x, k), y: 0, z: STAND.z, rot: lerp(-1.3, STAND.rot, smooth(55, 75, local))};
  }
  if (id === "s2" || id === "s3" || id === "s4" || id === "s5") return {...SEAT};
  if (id === "s6") {
    const up = smooth(L("s6", 20), L("s6", 50), local);
    return {x: lerp(SEAT.x, DUEL_P.x, up), y: lerp(SEAT.y, 0, up), z: lerp(SEAT.z, DUEL_P.z, up), rot: lerp(0, DUEL_P.rot, up)};
  }
  if (id === "s7") return {...DUEL_P};
  if (id === "s8") return {x: DUEL_P.x, y: 0, z: DUEL_P.z, rot: -0.5};
  if (id === "s9") return {x: SPACE_X + 0.7, y: 0.9 + Math.sin(local / 22) * 0.12, z: 0, rot: -0.35};
  if (id === "s10") {
    const k = smooth(L("s10", 0), L("s10", 120), local);
    return {x: lerp(1.8, 7.8, k), y: 0, z: 1.7, rot: lerp(-0.6, Math.PI / 2 + 0.2, smooth(0, 10, local))};
  }
  return {x: 1.7, y: 0, z: 2.2, rot: -0.35};
}
const seated = (id: string, local: number) => ["s2", "s3", "s4", "s5"].includes(id) || (id === "s6" && local < L("s6", 20));
const profSpeed = (frame: number) => {
  const {id} = sceneAt(frame);
  if (id !== "s1" && id !== "s10") return 0;
  const a = profPath(frame - 0.5), b = profPath(frame + 0.5);
  if (sceneAt(frame - 0.5).id !== id || sceneAt(frame + 0.5).id !== id) return 0;
  return Math.hypot(b.x - a.x, b.z - a.z) * FPS;
};
export const profPose = profPath;

const profLift = (frame: number) => {
  const {id, local} = sceneAt(frame);
  if (id === "s11") return 0.85 * spr(local, L("s11", 10));
  return 0;
};

// física do jaleco (integrada do frame 0 até o atual)
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
      out = phys.step(1 / FPS / 4, {vel: v * 0.6, acc: acc * 0.6, lift: profLift(t), legL: -sw, legR: sw});
    }
    coatCache.push(out);
    phaseCache.push(phase);
  }
  return {coat: coatCache[frame], phase: phaseCache[frame]};
}

// ---------- barbeiro ----------
export function barberPose(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (id === "s6") {
    const k = smooth(L("s6", 30), L("s6", 60), local);
    return {x: lerp(BARBER.x, DUEL_B.x, k), y: 0, z: lerp(BARBER.z, DUEL_B.z, k), rot: lerp(BARBER.rot, DUEL_B.rot, k)};
  }
  if (id === "s7") return {...DUEL_B};
  if (id === "s8") return {x: -1.8, y: 0, z: 1.0, rot: 0.9};
  if (id === "s9") return {x: SPACE_X - 1.1, y: 0.8 + Math.sin(local / 25 + 1) * 0.12, z: 0.3, rot: 0.75};
  return {...BARBER};
}

// ---------- pato e leão ----------
export function duckPose(frame: number): (Pose & {hop: number}) | null {
  const {id, local} = sceneAt(frame);
  const order = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"].indexOf(id);
  if (id === "s3") {
    const a = W("s3", 6) - 12, b = a + 70;
    if (local < a) return null;
    const k = clamp01((local - a) / (b - a));
    const hop = spr(local, b, 10);
    return {x: lerp(8.5, WAIT.x, k), y: hop * 0.95 + Math.sin(Math.PI * clamp01((local - b) / 12)) * 0.6 * (local > b ? 1 : 0), z: lerp(2.4, WAIT.z, k), rot: k < 1 ? -Math.PI / 2 : lerp(-Math.PI / 2, 0, hop), hop};
  }
  if (order >= 3 && order <= 5) return {x: WAIT.x, y: 0.95, z: WAIT.z, rot: 0.3, hop: 1};
  if (id === "s7" || id === "s8") return {x: -3.4, y: 0, z: 2.4, rot: 0.5, hop: 0};
  if (id === "s10") {
    const k = smooth(L("s10", 40), L("s10", 120), local);
    if (local < L("s10", 40)) return null;
    return {x: lerp(-3.5, 7.8, k), y: 0, z: 2.6, rot: Math.PI / 2, hop: 0};
  }
  if (id === "s11") return {x: WAIT.x, y: 0.95, z: WAIT.z, rot: 0.3, hop: 1};
  return null;
}
export function lionPose(frame: number): Pose | null {
  const {id, local} = sceneAt(frame);
  if (id === "s10") {
    const a = W("s10", 12) - 8;
    if (local < a) return null;
    const k = 1 - Math.pow(1 - clamp01((local - a) / 45), 2);
    const hop = spr(local, a + 50, 10);
    return {x: lerp(8.5, CHAIR.x, k), y: hop * 0.75 + Math.sin(Math.PI * clamp01((local - a - 50) / 12)) * 0.7 * (local > a + 50 ? 1 : 0), z: lerp(1.2, CHAIR.z + 0.1, k), rot: lerp(-Math.PI / 2, 0, hop)};
  }
  if (id === "s11") return {x: CHAIR.x, y: 0.75, z: CHAIR.z + 0.1, rot: 0};
  return null;
}

// ---------- efeitos de tela (camada 2D) ----------
export function screenFx(frame: number) {
  const {id, local} = sceneAt(frame);
  let red = 0, white = 0;
  if (id === "s5" && local >= L("s5", 20)) red = 0.28 * (0.5 + 0.5 * Math.sign(Math.sin(((local - L("s5", 20)) / FPS) * Math.PI * 2 * 2.5)));
  if (id === "s7") {
    const b = L("s7", 100);
    if (local >= b && local < b + 6) white = 0.75 * (1 - (local - b) / 6);
  }
  return {red, white};
}
export function keyLight(frame: number) {
  const {id, local} = sceneAt(frame);
  if (id === "s4") return 1 - 0.45 * smooth(W("s4", 7) - 2, W("s4", 7) + 8, local);
  return 1;
}
export function background(frame: number): string {
  const {id, local} = sceneAt(frame);
  if (id === "s8") {
    const k = smooth(L("s8", 150), L("s8", 195), local);
    return "#" + new THREE.Color("#cfe3f5").lerp(new THREE.Color("#0b1030"), k).getHexString();
  }
  return "#cfe3f5";
}

// ---------- câmera ----------
export type CamPose = {pos: THREE.Vector3; target: THREE.Vector3; fov: number};
type Key = [number, V3, number, number, number];
const SEAT_HEAD: V3 = [SEAT.x, 3.3, SEAT.z];
const BARBER_HEAD: V3 = [BARBER.x, 3.25, BARBER.z];
const PHOTO_CLOSE: V3 = [-0.7, 3.0, 1.0];
function camKeys(id: string): Key[] {
  const d = cutById[id].dur;
  switch (id) {
    case "s1": return [[0, [0.8, 2.7, 0.3], 28, 18, 16], [d, [0.8, 2.7, 0.3], 24, 10, 14]];
    case "s2": {
      const a = W("s2", 11) - 3;
      return [[0, [-0.6, 2.9, 0.4], 14, -12, 8], [a - 1, [-0.6, 2.9, 0.4], 12, -2, 8], [a, PHOTO_CLOSE, 3.6, 0, 2], [d, PHOTO_CLOSE, 3.2, 0, 2]];
    }
    case "s3": return [[0, [-1.0, 2.6, 0.8], 30, 4, 12], [d, [-1.4, 2.5, 1.0], 28, -6, 12]];
    case "s4": {
      const a = W("s4", 7) - 2;
      return [[0, BARBER_HEAD, 7.5, 28, 4], [a - 1, BARBER_HEAD, 7, 20, 4], [a, SEAT_HEAD, 7.5, -8, 2], [d, SEAT_HEAD, 6.2, -3, 2]];
    }
    case "s5": return [[0, BARBER_HEAD, 9, 26, 6], [d, [-0.6, 3.6, 0.2], 15, 4, 10]];
    case "s6": {
      const a = L("s6", 151), b = L("s6", 166), c = L("s6", 181);
      const PE: V3 = [DUEL_P.x, 3.3, DUEL_P.z], BE: V3 = [DUEL_B.x, 3.3, DUEL_B.z];
      return [[0, [0, 2.8, 0.8], 22, 0, 10], [a - 1, [0, 2.8, 0.8], 20, 6, 10], [a, PE, 3.6, -100, 0], [b - 1, PE, 3.3, -100, 0], [b, BE, 3.6, 100, 0], [c - 1, BE, 3.3, 100, 0], [c, [0, 2.8, 1.2], 21, 0, 6], [d, [0, 2.8, 1.2], 20, 0, 6]];
    }
    case "s7": return [[0, [0.6, 3.8, 1.2], 13, -12, 6], [d, [0.4, 4.6, 1.2], 21, 8, 10]];
    case "s8": {
      const a = L("s8", 140);
      return [[0, [0, 3.0, 1.2], 15, -6, 8], [a, [0, 3.2, 1.2], 14, 6, 8], [d, [0, 48, 1.2], 14, 6, -55]];
    }
    case "s9": return [[0, [SPACE_X - 0.2, 3.0, 0], 11, -14, 6], [d, [SPACE_X - 0.2, 3.1, 0], 9.5, 12, 6]];
    case "s10": {
      const a = W("s10", 12) - 9;
      return [[0, [2.0, 2.6, 1.2], 17, -10, 10], [a - 1, [3.5, 2.6, 1.2], 17, 4, 10], [a, [2.5, 2.4, 0.6], 21, 10, 10], [d, [0.3, 2.7, 0.3], 15, -6, 10]];
    }
    case "s11": return [[0, [-1.0, 2.8, 0.8], 31, -10, 12], [d, [-1.0, 2.8, 0.8], 30, 10, 12]];
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
  let k = f1 - f0 <= 1 ? (local >= f1 ? 1 : 0) : smooth(f0, f1, local);
  if (id === "s8" && i === keys.length - 2) k = Math.pow(clamp01((local - f0) / (f1 - f0)), 2.2); // sobe acelerando
  const t = new THREE.Vector3(lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k));
  const r = lerp(r0, r1, k), az = THREE.MathUtils.degToRad(lerp(a0, a1, k)), el = THREE.MathUtils.degToRad(lerp(e0, e1, k));
  const pos = new THREE.Vector3(t.x + r * Math.sin(az) * Math.cos(el), t.y + r * Math.sin(el), t.z + r * Math.cos(az) * Math.cos(el));
  const shakeAt = (fs: number, amp: number) => {
    const s = local - fs;
    if (s < 0 || s > 18) return;
    const a = amp * Math.exp(-s / 6);
    pos.x += Math.sin(s * 2.7) * a;
    pos.y += Math.cos(s * 3.3) * a;
  };
  if (id === "s2") shakeAt(W("s2", 16), 0.06);
  if (id === "s5") shakeAt(L("s5", 20), 0.1);
  if (id === "s7") shakeAt(L("s7", 100), 0.12);
  if (id === "s10") shakeAt(W("s10", 12) + 66, 0.1);
  return {pos, target: t, fov: 24};
}

// ---------- âncoras 3D para as pílulas ----------
const PHOTO_HAND: V3 = [-0.9, 2.5, 0.6];
export function anchorAt(name: string, frame: number): V3 | null {
  const p = profPath(frame), b = barberPose(frame);
  switch (name) {
    case "prof.head": return [p.x, p.y + (seated(sceneAt(frame).id, sceneAt(frame).local) ? 4.3 : 4.25), p.z];
    case "barber.head": return [b.x, b.y + 4.2, b.z];
    case "photo": return [PHOTO_CLOSE[0], PHOTO_CLOSE[1] + 0.85, PHOTO_CLOSE[2]];
    case "duck": {
      const d = duckPose(frame);
      return d ? [d.x, d.y + 2.3, d.z] : [WAIT.x, 3.2, WAIT.z];
    }
    case "lion": {
      const l = lionPose(frame);
      return l ? [l.x, l.y + 3.4, l.z] : [0, 3.5, 0];
    }
    case "hairCloud": return [p.x, 7.6, p.z];
  }
  return null;
}

// ---------- aplica tudo ----------
export function applyFrame(refs: any, frame: number) {
  const {id, local} = sceneAt(frame);
  const P = refs.prof.userData.parts;
  const B = refs.barber.userData.parts;
  const {coat, phase: ph} = coatAt(frame);
  const space = id === "s9";

  // --- professor ---
  const pp = profPath(frame);
  refs.prof.position.set(pp.x, pp.y, pp.z);
  refs.prof.rotation.y = pp.rot;
  const sit = seated(id, local);
  const walk = clamp01(profSpeed(frame) / 2.5);
  const sw = Math.sin(ph) * 0.45 * walk;
  P.hips[0].rotation.x = sit ? -1.45 : space ? -0.3 + Math.sin(local / 20) * 0.15 : sw;
  P.hips[1].rotation.x = sit ? -1.45 : space ? 0.2 - Math.sin(local / 20) * 0.15 : -sw;
  P.body.position.y = Math.abs(Math.cos(ph)) * 0.07 * walk;
  P.body.rotation.x = 0.05 * walk;
  P.body.rotation.z = space ? Math.sin(local / 30) * 0.08 : 0;
  const pm = planById[id].moods.prof;
  let mood = pm[0].mood;
  for (const k of pm) if (local >= L(id, k.f)) mood = k.mood;
  setMood(P, mood);
  setCoat(P, coat);
  if (sit) P.flaps.L.rotation.x = P.flaps.R.rotation.x = -1.35;
  P.spaceGear.visible = space;
  // cabelo: normal até a nuvem (s7), careca depois, volta a crescer no fim; no espaço tem cabelo (é a cena "imaginada")
  let hair = 1;
  const s7i = ["s7", "s8", "s10", "s11"].indexOf(id);
  if (id === "s7") hair = 1 - smooth(L("s7", 20), L("s7", 40), local);
  else if (s7i > 0) hair = 0;
  if (id === "s11") hair = smooth(L("s11", 60), L("s11", 150), local);
  setHair(P, hair);
  // cabeça acompanha o pato (s3)
  const duck = duckPose(frame);
  let headYaw = 0;
  if (id === "s3" && duck) headYaw = Math.max(-1.1, Math.min(1.1, Math.atan2(duck.x - pp.x, duck.z - pp.z) - pp.rot));
  P.head.rotation.y = headYaw;

  const lift = profLift(frame);
  let armL: any = {raise: 0.08 + 2.4 * lift, forward: -sw * 0.9, bend: 0.2 * lift + 0.15 * walk};
  let armR: any = {raise: 0.08 + 2.4 * lift, forward: sw * 0.9, bend: 0.2 * lift + 0.15 * walk};
  if (sit) {
    armL = {raise: 0.15, forward: 0.5, bend: 0.6};
    armR = {raise: 0.15, forward: 0.5, bend: 0.6};
  }
  if (id === "s2") {
    const give = spr(local, L("s2", 25)) * (1 - smooth(L("s2", 55), L("s2", 70), local));
    armR = {raise: 0.3, forward: lerp(0.5, 1.3, give), bend: lerp(0.6, 0.2, give)};
  }
  const fork = (id === "s6" && local >= L("s6", 60)) || id === "s7";
  if (fork) {
    const k = id === "s6" ? spr(local, L("s6", 60)) : 1;
    const slow = id === "s7" && local < L("s7", 60) ? 0.35 : 1;
    const swing = id === "s7" ? Math.sin(local * 0.5 * slow) * 0.5 : 0;
    armR = {raise: 0.35, forward: lerp(0.2, 1.3, k) + swing, bend: 0.3};
  }
  if (id === "s8") {
    const k = spr(local, L("s8", 90));
    armL = {raise: lerp(0.08, 0.7, k), forward: 0.2, bend: lerp(0, 1.3, k)};
    armR = {raise: lerp(0.08, 0.7, k), forward: 0.2, bend: lerp(0, 1.3, k)};
  }
  if (space) {
    armL = {raise: 0.6 + Math.sin(local / 18) * 0.1, forward: 0.3, bend: 0.4};
    armR = {raise: 0.6 - Math.sin(local / 18) * 0.1, forward: 0.3, bend: 0.4};
  }
  if (id === "s11") armR = {raise: 2.5, forward: 0, bend: 0.25 + 0.25 * Math.sin(local * 0.4)};
  setArm(P.arms[0], armL);
  setArm(P.arms[1], armR);
  refs.profFork.visible = fork;
  refs.profFork.scale.setScalar(id === "s6" ? spr(local, L("s6", 60)) : 1);

  // --- barbeiro ---
  const bp = barberPose(frame);
  refs.barber.position.set(bp.x, bp.y, bp.z);
  refs.barber.rotation.y = bp.rot;
  const bm = planById[id].moods.barber ?? [{f: 0, mood: "feliz"}];
  let bmood = bm[0].mood;
  for (const k of bm) if (local >= L(id, k.f)) bmood = k.mood;
  B.setMood(bmood, local);
  B.head.rotation.y = id === "s3" && duck ? Math.max(-1.1, Math.min(1.1, Math.atan2(duck.x - bp.x, duck.z - bp.z) - bp.rot)) : 0;
  B.head.rotation.x = id === "s3" && local < W("s3", 4) ? Math.max(0, Math.sin(local * 0.35)) * 0.2 : 0; // acena "entendi"
  B.stache.rotation.z = id === "s2" ? Math.sin(local * 1.2) * 0.35 * Math.exp(-Math.max(0, local - W("s2", 16)) / 12) * (local >= W("s2", 16) ? 1 : 0) : 0;
  let bR: any = {raise: 0.12, forward: 0, bend: 0};
  let bL: any = {raise: 0.12, forward: 0, bend: 0};
  if (id === "s2" || id === "s3") {
    const k = id === "s2" ? spr(local, L("s2", 40)) : 1;
    bL = {raise: 0.2, forward: 1.1 * k, bend: 0.6 * k};
  }
  if (id === "s4") bR = {raise: 0.3, forward: 0.9, bend: 0.9};
  if (id === "s5") {
    bL = {raise: 2.2 + Math.sin(local * 0.9) * 0.3, forward: 0, bend: 0.4};
    bR = {raise: 2.2 - Math.sin(local * 0.9) * 0.3, forward: 0, bend: 0.4};
  }
  const bfork = (id === "s6" && local >= L("s6", 80)) || id === "s7";
  if (bfork) {
    const k = id === "s6" ? spr(local, L("s6", 80)) : 1;
    const swing = id === "s7" ? Math.sin(local * 0.5 * (local < L("s7", 60) ? 0.35 : 1) + 1.5) * 0.5 : 0;
    bR = {raise: 0.35, forward: lerp(0.2, 1.3, k) + swing, bend: 0.3};
  }
  const umb = id === "s7" ? spr(local, L("s7", 110)) : id === "s8" ? 1 : 0;
  if (umb > 0) bL = {raise: lerp(0.12, 2.75, umb), forward: 0, bend: 0.15};
  if (id === "s8") {
    const k = spr(local, L("s8", 30));
    bR = {raise: lerp(0.12, 1.4, k), forward: 0.6, bend: 0.1};
  }
  if (space) bR = {raise: 0.5, forward: 1.25, bend: 0.25};
  setLimb(B.arms[0], bL);
  setLimb(B.arms[1], bR);
  refs.barberFork.visible = bfork;
  refs.barberFork.scale.setScalar(id === "s6" ? spr(local, L("s6", 80)) : 1);
  refs.umbrella.visible = umb > 0.02;
  refs.umbrella.userData.top.scale.set(umb, 1, umb);
  refs.scissors.visible = id === "s4" || id === "s5";
  refs.barberBubble.visible = space;
  const faint = id === "s10" ? spr(local, W("s10", 12) + 66, 9) : id === "s11" ? 1 : 0;
  B.pivot.rotation.x = -1.35 * faint;

  // --- foto do leão / foto do professor careca ---
  refs.photoLion.visible = id === "s2" || (id === "s3" && local < W("s3", 4));
  if (refs.photoLion.visible) {
    const close = id === "s2" && local >= W("s2", 11) - 3;
    const give = id === "s2" ? smooth(L("s2", 28), L("s2", 55), local) : 1;
    const from = new THREE.Vector3(0.6, 2.4, 1.2), to = new THREE.Vector3(...PHOTO_HAND);
    const pos = close ? new THREE.Vector3(...PHOTO_CLOSE) : from.lerp(to, give);
    refs.photoLion.position.copy(pos);
    refs.photoLion.rotation.set(0, close ? 0 : 0.35, 0);
    const roar = id === "s2" && local >= W("s2", 16);
    refs.photoLion.userData.plane.material.map = refs.lionTex[roar ? 1 : 0];
    refs.photoLion.scale.setScalar(roar ? 1 + 0.12 * Math.exp(-(local - W("s2", 16)) / 6) : 1);
  }
  const lion = lionPose(frame);
  refs.photoBald.visible = id === "s10" && !!lion && local >= W("s10", 12) + 50;
  if (refs.photoBald.visible && lion) {
    const k = spr(local, W("s10", 12) + 50);
    refs.photoBald.position.set(lion.x + 0.9, lerp(2.2, 3.4, k), lion.z + 1.1);
    refs.photoBald.rotation.set(0, -0.25, 0);
  }

  // --- pato ---
  refs.duck.visible = !!duck;
  if (duck) {
    const D = refs.duck.userData.parts;
    const walking = (id === "s3" && duck.hop < 0.05) || id === "s10";
    refs.duck.position.set(duck.x, duck.y, duck.z);
    refs.duck.rotation.y = duck.rot;
    D.body.rotation.z = walking ? Math.sin(local * 0.9) * 0.15 : 0;
    D.feet.forEach((f: any, i: number) => (f.rotation.x = walking ? Math.sin(local * 0.9 + i * Math.PI) * 0.5 : 0));
    const flap = id === "s5" || id === "s7" ? Math.sin(local * 1.7) * 0.7 : 0;
    D.wings.forEach((w: any, i: number) => (w.rotation.z = (i ? -1 : 1) * Math.abs(flap)));
    D.quiff.visible = id === "s10" || id === "s11";
  }

  // --- leão ---
  refs.lion.visible = !!lion;
  if (lion) {
    const Lp = refs.lion.userData.parts;
    refs.lion.position.set(lion.x, lion.y, lion.z);
    refs.lion.rotation.y = lion.rot;
    Lp.tail.rotation.y = Math.sin(local * 0.2) * 0.4;
    Lp.mane.visible = id !== "s11";
    const roar = id === "s10" ? Math.max(0, Math.sin(Math.PI * clamp01((local - (W("s10", 12) - 8)) / 25))) : 0;
    Lp.mouth.scale.set(1.2, 0.2 + roar * 1.2, 0.5);
  }

  // --- cadeira gira (s1) ---
  refs.chairSeat.rotation.y = id === "s1" ? Math.PI * 2 * spr(local, L("s1", 40), 14) : 0;
  refs.poleTex.offset.y = -frame / 60;

  // --- sirene (s5) ---
  refs.siren.visible = id === "s5";
  if (id === "s5") {
    refs.siren.position.set(-0.9, lerp(12, 5.4, spr(local, L("s5", 5), 9)), 0.5);
    refs.siren.userData.spin.rotation.y = local * 0.35;
  }

  // --- bola de feno (s6) ---
  const tk = id === "s6" ? (local - L("s6", 120)) / (L("s6", 200) - L("s6", 120)) : -1;
  refs.tumble.visible = tk > 0 && tk < 1;
  if (refs.tumble.visible) {
    refs.tumble.position.set(lerp(7, -7, tk), 0.45 + Math.abs(Math.sin(tk * 18)) * 0.35, 2.6);
    refs.tumble.rotation.z = tk * 14;
  }

  // --- nuvem de cabelo, chuva e raio (s7–s8) ---
  const cloudOn = id === "s7" && local >= L("s7", 20);
  const head = new THREE.Vector3(pp.x, 3.3, pp.z);
  const cloudC = new THREE.Vector3(pp.x - 0.6, 6.6, pp.z);
  const gather = id === "s7" ? smooth(L("s7", 20), L("s7", 70), local) : 0;
  const gray = id === "s7" ? smooth(L("s7", 60), L("s7", 80), local) : 0;
  refs.cloud.forEach((c: any) => {
    c.visible = cloudOn;
    if (!cloudOn) return;
    const u = c.userData;
    const k = clamp01((gather - u.d * 0.3) / 0.7);
    c.position.copy(head.clone().add(u.start).lerp(cloudC.clone().add(u.end), k * k * (3 - 2 * k)));
    c.scale.setScalar(lerp(1, u.big, k));
    c.material.color.set(new THREE.Color("#eef0f2").lerp(new THREE.Color("#8a929c"), gray));
  });
  const rainOn = id === "s7" && local >= L("s7", 80);
  refs.rain.forEach((d: any) => {
    d.visible = rainOn;
    if (!rainOn) return;
    const u = d.userData;
    const t = ((local - L("s7", 80)) / 14 + u.o) % 1;
    d.position.set(cloudC.x + u.x, lerp(cloudC.y - 0.5, 0.1, t), cloudC.z + u.z);
  });
  const bf = L("s7", 100);
  refs.bolt.visible = id === "s7" && local >= bf && local < bf + 8;
  refs.bolt.position.set(cloudC.x - 0.3, cloudC.y - 0.6, cloudC.z + 0.8);
  const wet = id === "s7" ? smooth(L("s7", 120), L("s7", 180), local) : id === "s8" ? 1 : 0;
  refs.puddles.forEach((p: any) => {
    p.visible = wet > 0.01;
    p.scale.set(1.4 * wet, wet, 1);
  });

  // --- estrelas / estação (s8–s9) ---
  refs.stars.visible = id === "s8";
  refs.sky.visible = !(id === "s8" && local >= L("s8", 150));
  refs.stars.material.opacity = id === "s8" ? smooth(L("s8", 160), L("s8", 200), local) : 0;
  refs.earth.rotation.y = frame * 0.004;
  refs.clipper.visible = space;
  refs.tubeMesh.visible = space;
  refs.hairBits.forEach((h: any) => (h.visible = false));
  if (space) {
    const head2 = new THREE.Vector3(pp.x - 0.1, pp.y + 3.25, pp.z + 0.1);
    const clip = new THREE.Vector3(pp.x - 0.75, pp.y + 3.55 + Math.sin(local / 10) * 0.08, pp.z + 0.35);
    refs.clipper.position.set(clip.x - SPACE_X, clip.y, clip.z);
    refs.clipper.rotation.z = 0.9 + Math.sin(local / 8) * 0.15;
    const curve = new THREE.CatmullRomCurve3([refs.vacFrom, new THREE.Vector3(refs.vacFrom.x + 1.2, 3.2, -2.0), new THREE.Vector3(clip.x - 0.6, clip.y + 0.6, clip.z - 0.6), clip]);
    refs.tubeMesh.geometry.dispose();
    refs.tubeMesh.geometry = new THREE.TubeGeometry(curve, 40, 0.07, 8, false);
    const a = L("s9", 80), span = L("s9", 120);
    refs.hairBits.forEach((h: any) => {
      const u = h.userData;
      const t0 = a + u.d * span;
      const k = clamp01((local - t0) / 18);
      h.visible = k < 1;
      const float = head2.clone().add(u.o).add(new THREE.Vector3(Math.sin(local / 15 + u.s) * 0.15, Math.cos(local / 17 + u.s) * 0.15, 0));
      h.position.copy(float.lerp(clip, k * k));
      h.rotation.set(local / 20 + u.s, local / 25, u.s);
    });
  }

  // --- calendário (s11): folhas voando, meses passando ---
  const cal = id === "s11" ? Math.max(0, Math.floor((local - L("s11", 20)) / 4)) : 0;
  refs.setCalendar(Math.min(cal, 36));
  refs.calPages.forEach((p: any, i: number) => {
    const t = id === "s11" ? ((local - L("s11", 20)) / 20 - i / 8) % 1 : -1;
    p.visible = id === "s11" && local >= L("s11", 20) && local < L("s11", 160) && t > 0;
    if (!p.visible) return;
    p.position.set(5.2 + t * 1.5, 5.0 - t * 2.5 + Math.sin(t * 6) * 0.2, -4.3 + t * 1.5);
    p.rotation.set(t * 3, t * 2, t * 4);
  });
}
