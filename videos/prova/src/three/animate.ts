// "Isso vai cair na prova?" v3 (sem sentido): estado de cada frame (determinístico).
import * as THREE from "three";
import {spring} from "remotion";
// @ts-ignore módulo JS
import {setMood, setArm, CoatPhysics, setCoat} from "./professor.js";
// @ts-ignore módulo JS
import {setLimb as setBarberLimb} from "./characters.js";
// @ts-ignore módulo JS
import {BOARD, TDESK, SEATS, ASKER, setLimb} from "./world.js";
import {cutById, planById, sceneAt, wordLocal, FPS} from "../data/timeline";

type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const spr = (f: number, f0: number, damping = 11) => (f < f0 ? 0 : spring({frame: f - f0, fps: FPS, config: {damping, stiffness: 170, mass: 0.7}}));
export const L = (id: string, fPlan: number) => Math.round((fPlan * cutById[id].dur) / planById[id].durationInFrames);
const W = (id: string, i: number) => wordLocal(id, i);
const ORDER = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"];
const after = (id: string, ref: string) => ORDER.indexOf(id) > ORDER.indexOf(ref);

export type Pose = {x: number; y: number; z: number; rot: number};
const PB: Pose = {x: -1.4, y: 0, z: -3.3, rot: Math.PI};
const PF: Pose = {x: -1.4, y: 0, z: -3.0, rot: 0};
const DESK_Y = 1.57;
const DOOR = {x: 6.4, z: -0.6};

// ---------- professor ----------
function profPath(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (id === "s1") {
    const turn = smooth(W("s1", 15) - 14, W("s1", 15) - 2, local);
    return {...PB, z: lerp(PB.z, PF.z, turn), rot: lerp(Math.PI, 0, turn)};
  }
  if (id === "s4" || id === "s7" || id === "s8" || id === "s9") return {x: 0.9, y: 0, z: -1.6, rot: 0.9};
  if (id === "s10") return {x: SEATS[ASKER][0], y: 0, z: SEATS[ASKER][1], rot: Math.PI};
  return {...PF};
}
export const profPose = profPath;

const coatCache: any[] = [];
let phys: any = null;
function coatAt(frame: number) {
  if (!phys) phys = new CoatPhysics();
  while (coatCache.length <= frame) {
    let out = null;
    for (let i = 0; i < 4; i++) out = phys.step(1 / FPS / 4, {vel: 0, acc: 0, lift: 0, legL: 0, legR: 0});
    coatCache.push(out);
  }
  return coatCache[frame];
}

// ---------- alunos ----------
type SPose = Pose & {seated: boolean; hidden?: boolean};
export function studentPose(frame: number, i: number): SPose {
  const {id, local} = sceneAt(frame);
  const [sx, sz] = SEATS[i];
  if (i === ASKER && id === "s10") return {x: sx, y: 0, z: sz, rot: Math.PI, seated: true, hidden: true};
  if (id === "s3" && local < W("s3", 12) - 2) {
    const a = (local / FPS) * Math.PI * 2 * 0.8 + i;
    return {x: sx + Math.cos(a) * 0.9, y: Math.abs(Math.sin(local * 0.5 + i)) * 0.15, z: sz - 0.1 + Math.sin(a) * 0.7, rot: -a, seated: false};
  }
  // rebobinando: andam de costas um pouco (s5)
  const back = id === "s5" && local >= W("s5", 10) ? Math.sin((local - W("s5", 10)) * 0.25) * 0.25 : 0;
  return {x: sx, y: 0, z: sz + back, rot: Math.PI, seated: true};
}

// ---------- pato, dinossauro, diretor ----------
export function duckPose(frame: number): (Pose & {walk: boolean}) | null {
  const {id, local} = sceneAt(frame);
  if (id === "s3") {
    const a = W("s3", 12) - 2;
    if (local < a) return null;
    const t = (local - a) * 0.4; // câmera lenta
    const k = clamp01(t / 40);
    return {x: lerp(DOOR.x + 0.6, DOOR.x - 1.8, k), y: 0, z: DOOR.z, rot: -Math.PI / 2 + 0.6, walk: k < 1};
  }
  if (id === "s4") return {x: TDESK.x - 0.6, y: DESK_Y, z: TDESK.z + 0.1, rot: 0.2, walk: false};
  if (["s5", "s6", "s7", "s8", "s9"].includes(id)) return {x: TDESK.x + 0.95, y: DESK_Y, z: TDESK.z + 0.5, rot: -0.3, walk: false};
  if (id === "s11") return {x: 0.6, y: 0, z: -2.4, rot: 0, walk: false};
  return null;
}
export function dinoPose(frame: number): (Pose & {scale: number}) | null {
  const {id, local} = sceneAt(frame);
  if (id === "s7") {
    const k = spr(local, W("s7", 10) - 2, 9);
    if (k <= 0) return null;
    return {x: TDESK.x, y: DESK_Y, z: TDESK.z + 0.1, rot: 0, scale: k};
  }
  if (id === "s8") return {x: TDESK.x - 0.85, y: DESK_Y, z: TDESK.z - 0.05, rot: Math.PI / 2, scale: 1};
  if (id === "s9") return {x: TDESK.x - 0.4, y: DESK_Y, z: TDESK.z + 0.1, rot: 0.1, scale: 1};
  if (id === "s11") return {x: -0.6, y: 0, z: -2.5, rot: 0, scale: 2.2};
  return null;
}
export function directorPose(frame: number): Pose | null {
  const {id, local} = sceneAt(frame);
  const stand = {x: TDESK.x + 2.0, y: 0, z: TDESK.z - 0.05, rot: -Math.PI / 2};
  if (id === "s8") {
    const k = 1 - Math.pow(1 - clamp01(local / 55), 2);
    return {x: lerp(DOOR.x, stand.x, k), y: 0, z: lerp(DOOR.z, stand.z, k), rot: stand.rot};
  }
  if (id === "s9") return stand;
  return null;
}

// ---------- efeitos de tela ----------
export function screenFx(frame: number) {
  const {id, local} = sceneAt(frame);
  const vhs = id === "s5" && local >= W("s5", 10) - 2 ? 1 : 0;
  const sepia = id === "s6" ? 0.35 : 0;
  return {red: 0, white: id === "s7" && local >= W("s7", 10) - 2 && local < W("s7", 10) + 3 ? 0.5 : 0, vhs, sepia};
}
export function background(_frame: number) {
  return "#cfe3f5";
}
export function keyLight(_frame: number) {
  return 1;
}

// ---------- câmera ----------
export type CamPose = {pos: THREE.Vector3; target: THREE.Vector3; fov: number};
type Key = [number, V3, number, number, number];
const PFACE: V3 = [PF.x, 3.15, PF.z];
const AFACE: V3 = [SEATS[ASKER][0], 2.15, SEATS[ASKER][1]];
const DESK: V3 = [TDESK.x, 2.0, TDESK.z];
const CLOCK: V3 = [4.6, 6.7, -4.3];
const WIN: V3 = [-5.0, 4.3, -4.4];
function camKeys(id: string): Key[] {
  const d = cutById[id].dur;
  switch (id) {
    case "s1": {
      const a = W("s1", 8) - 2, b = W("s1", 15) - 2;
      return [[0, [-0.4, 2.8, -0.8], 26, 4, 14], [a - 1, [-0.4, 2.8, -0.8], 22, 10, 12], [a, AFACE, 6.5, 170, 6], [b - 1, AFACE, 6, 178, 6], [b, PFACE, 6.2, 20, 6], [d, PFACE, 5.6, 14, 6]];
    }
    case "s2": {
      const a = W("s2", 13) - 2;
      return [[0, [-2.4, 2.0, 1.5], 11, 180, 24], [a - 1, [2.4, 2.0, 1.5], 11, 180, 24], [a, [WIN[0] + 0.3, WIN[1] + 0.4, WIN[2]], 11.5, 12, 4], [d, [WIN[0] + 0.3, WIN[1] + 0.4, WIN[2]], 10.5, 4, 4]];
    }
    case "s3": {
      const a = W("s3", 12) - 2;
      return [[0, [-0.6, 2.2, -0.8], 15, 0, 28], [a - 1, [-0.6, 2.2, -0.8], 14, 8, 28], [a, [5.4, 1.4, -0.6], 7.5, -42, 30], [d, [4.9, 1.4, -0.6], 6.8, -32, 28]];
    }
    case "s4": {
      const a = W("s4", 15) - 2, b = W("s4", 20) - 2;
      return [[0, [TDESK.x - 0.4, 2.3, TDESK.z], 7, -8, 26], [a - 1, [TDESK.x - 0.4, 2.3, TDESK.z], 6.2, 6, 26], [a, [0, 2.4, 1.0], 12, 180, 26], [b - 1, [0, 2.4, 1.0], 11, 186, 26], [b, CLOCK, 5, 0, 0], [d, CLOCK, 4.4, 0, 0]];
    }
    case "s5": {
      const a = W("s5", 11) - 2;
      return [[0, CLOCK, 4.6, 0, 0], [a - 1, CLOCK, 4.2, 0, 0], [a, [0, 2.8, -0.6], 20, 0, 16], [d, [0, 2.8, -0.6], 22, -6, 16]];
    }
    case "s6": return [[0, PFACE, 8, 18, 6], [d, PFACE, 7, 8, 6]];
    case "s7": return [[0, [TDESK.x, 2.0, TDESK.z], 4.6, -10, 24], [d, [TDESK.x, 2.15, TDESK.z], 4.0, 6, 18]];
    case "s8": {
      const a = W("s8", 13) - 2, b = a + 16, c = b + 16;
      return [[0, [4.0, 2.4, -1.4], 13, -20, 14], [a - 1, [TDESK.x, 1.9, TDESK.z], 6, -4, 32], [a, [TDESK.x - 0.85, 2.3, TDESK.z], 2.4, 90, 2], [b - 1, [TDESK.x - 0.85, 2.3, TDESK.z], 2.2, 90, 2], [b, [TDESK.x + 2.0, 3.25, TDESK.z], 3.2, -90, 2], [c - 1, [TDESK.x + 2.0, 3.25, TDESK.z], 3.0, -90, 2], [c, [TDESK.x + 0.2, 2.2, TDESK.z], 7.5, 0, 24], [d, [TDESK.x + 0.2, 2.2, TDESK.z], 7, 6, 24]];
    }
    case "s9": return [[0, [TDESK.x + 0.4, 2.4, TDESK.z], 9, -6, 14], [d, [TDESK.x + 0.4, 2.4, TDESK.z], 8, 6, 14]];
    case "s10": return [[0, [0, 1.7, 0.1], 6, 160, 40], [d, [0, 1.7, 0.1], 5, 170, 44]];
    case "s11": return [[0, [0.2, 2.6, -1.4], 20, -8, 14], [d, [0.2, 2.6, -1.4], 23, 8, 16]];
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
  const r = lerp(r0, r1, k), az = THREE.MathUtils.degToRad(lerp(a0, a1, k)), el = THREE.MathUtils.degToRad(lerp(e0, e1, k));
  const pos = new THREE.Vector3(t.x + r * Math.sin(az) * Math.cos(el), t.y + r * Math.sin(el), t.z + r * Math.cos(az) * Math.cos(el));
  const shakeAt = (fs: number, amp: number) => {
    const s = local - fs;
    if (s < 0 || s > 18) return;
    const a = amp * Math.exp(-s / 6);
    pos.x += Math.sin(s * 2.7) * a;
    pos.y += Math.cos(s * 3.3) * a;
  };
  if (id === "s7") shakeAt(W("s7", 10), 0.06);
  if (id === "s9") shakeAt(L("s9", 12), 0.08);
  return {pos, target: t, fov: 24};
}

// ---------- âncoras ----------
export function anchorAt(name: string, frame: number): V3 | null {
  const p = profPath(frame);
  switch (name) {
    case "prof.head": return [p.x, p.y + (sceneAt(frame).id === "s10" ? 3.6 : 4.25), p.z];
    case "asker.head": {
      const s = studentPose(frame, ASKER);
      return [s.x, s.y + 3.1, s.z];
    }
    case "window": return [WIN[0] + 0.6, WIN[1] + 1.6, WIN[2] + 0.3];
    case "duck": {
      const d = duckPose(frame);
      return d ? [d.x, d.y + 2.3, d.z] : [5, 2.5, -0.6];
    }
    case "clock": return [CLOCK[0], CLOCK[1] + 0.9, CLOCK[2]];
    case "dino": {
      const d = dinoPose(frame);
      return d ? [d.x, d.y + 1.4 * d.scale + 0.2, d.z] : [TDESK.x, 3.2, TDESK.z];
    }
    case "director.head": {
      const d = directorPose(frame);
      return d ? [d.x, 4.3, d.z] : [5, 4.3, -2];
    }
  }
  return null;
}

// ---------- aplica tudo ----------
export function applyFrame(refs: any, frame: number) {
  const {id, local} = sceneAt(frame);
  const P = refs.prof.userData.parts;
  const cam = cameraAt(frame);
  const hideBack = cam.pos.z < BOARD.z - 0.1;
  refs.backItems.forEach((o: any) => (o.visible = !hideBack));

  // --- professor ---
  const pp = profPath(frame);
  refs.prof.visible = !hideBack;
  refs.prof.position.set(pp.x, pp.y, pp.z);
  refs.prof.rotation.y = pp.rot;
  const seated = id === "s10";
  P.hips[0].rotation.x = P.hips[1].rotation.x = seated ? -1.45 : 0;
  const pm = planById[id].moods.prof;
  let mood = pm[0].mood;
  for (const k of pm) if (local >= L(id, k.f)) mood = k.mood;
  if (id === "s1") mood = local >= W("s1", 15) - 2 ? "sereno" : "feliz";
  setMood(P, mood);
  setCoat(P, coatAt(frame));
  if (seated) P.flaps.L.rotation.x = P.flaps.R.rotation.x = -1.35;
  let armL: any = {raise: 0.08}, armR: any = {raise: 0.08};
  const writing = id === "s1" && local < W("s1", 15) - 14;
  if (writing) armR = {raise: 0.35 + Math.sin(local * 0.6) * 0.12, forward: 1.75, bend: 0.4};
  if (id === "s3" && local < W("s3", 12) - 2) armL = armR = {raise: 0.9, forward: 0.2, bend: 1.6};
  if (id === "s6") armL = armR = {raise: 0.5, forward: 0.2, bend: 0.3 + 0.2 * Math.sin(local * 0.3)};
  setArm(P.arms[0], armL);
  setArm(P.arms[1], armR);

  // --- alunos ---
  const sm = planById[id].moods.students ?? [{f: 0, mood: "feliz"}];
  let smood = sm[0].mood;
  for (const k of sm) if (local >= L(id, k.f)) smood = k.mood;
  const sevenOn = (i: number) => (id === "s4" && local >= W("s4", 16) + i * 3) || after(id, "s4");
  refs.students.forEach((s: any, i: number) => {
    const S = s.userData.parts;
    const sp = studentPose(frame, i);
    s.visible = !sp.hidden;
    s.position.set(sp.x, sp.y, sp.z);
    s.rotation.y = sp.rot;
    const run = id === "s3" && !sp.seated;
    S.hips[0].rotation.x = sp.seated ? -1.45 : run ? Math.sin(local * 0.8 + i) * 0.6 : 0;
    S.hips[1].rotation.x = sp.seated ? -1.45 : run ? -Math.sin(local * 0.8 + i) * 0.6 : 0;
    S.face.userData.set(smood);
    S.disguise.visible = false;
    S.phone.visible = false;
    let aL: any = {raise: 0.1, forward: sp.seated ? 0.6 : 0, bend: sp.seated ? 0.6 : 0};
    let aR: any = {...aL};
    if (run) aL = aR = {raise: 1.2, forward: 0.3, bend: 1.4};
    if (i === ASKER && id === "s1") aR = {raise: lerp(0.1, 2.8, spr(local, W("s1", 7) - 4)), forward: 0, bend: 0.1};
    setLimb(S.arms[0], aL);
    setLimb(S.arms[1], aR);
    refs.sevens[i].visible = sevenOn(i);
    refs.sevens[i].scale.setScalar(id === "s4" ? spr(local, W("s4", 16) + i * 3) : 1);
  });
  refs.stamp.visible = false;
  refs.books.forEach((b: any) => (b.visible = false));
  refs.exams.visible = id === "s4";
  refs.exams.position.set(TDESK.x + 0.1, DESK_Y + 0.01, TDESK.z + 0.1);

  // --- quadro ---
  if (id === "s1") refs.setBoard("aula", clamp01(local / Math.max(1, W("s1", 15) - 14)));
  else refs.setBoard("aula", 1);

  // --- material escolar: só o giz aparece (na mesa, até virar dinossauro) ---
  refs.eraser.visible = refs.marker.visible = refs.projector.visible = false;
  refs.strikeSigns.forEach((s: any) => (s.visible = false));
  refs.beam.visible = false;
  refs.wifi.visible = false;
  refs.dust.forEach((d: any) => (d.visible = false));
  const chalkOnDesk = id === "s7" && local < W("s7", 10) - 2;
  refs.chalk.visible = chalkOnDesk || writing;
  const [h0, h1] = refs.chalk.userData.halves;
  h0.position.set(0, 0, 0);
  h1.position.set(0, 0, 0);
  if (chalkOnDesk) {
    const shake = local >= W("s7", 7) ? Math.sin(local * 4) * 0.04 : 0;
    refs.chalk.position.set(TDESK.x + shake, DESK_Y + 0.08, TDESK.z + 0.1);
    refs.chalk.rotation.set(0, 0, Math.PI / 2);
    h0.userData.face.userData.set(local >= W("s7", 7) ? "surpreso" : "feliz");
    h1.userData.face.userData.set(local >= W("s7", 7) ? "surpreso" : "feliz");
  } else if (writing) {
    const hand = new THREE.Vector3();
    refs.prof.updateMatrixWorld(true);
    refs.profChalkGrip.getWorldPosition(hand);
    refs.chalk.position.copy(hand);
    refs.chalk.rotation.set(0.4, 0, 0.3);
  }

  // --- relógio com rosto, "7" e rebobinar ---
  const happy = id === "s4" && local >= W("s4", 21) || id === "s5";
  refs.clockFace.userData.set(happy ? "feliz" : "surpreso");
  refs.clockSeven.visible = (id === "s4" && local >= W("s4", 21)) || after(id, "s4");
  refs.clockSeven.scale.setScalar(id === "s4" ? spr(local, W("s4", 21)) : 1);
  const rew = id === "s5" ? Math.pow(clamp01((local - W("s5", 6)) / 90), 1.5) * Math.PI * 14 : 0;
  refs.clockHands[0].rotation.z = -1.2 + rew * 6;
  refs.clockHands[1].rotation.z = -2.6 + rew;
  refs.bell.rotation.z = 0;

  // --- balões TALVEZ (s2) + janela com rosto ---
  const SEATS6 = SEATS;
  refs.talvez.forEach((b: any, i: number) => {
    const t0 = i * 10;
    b.visible = id === "s2" && local >= t0 && local < W("s2", 13) - 2;
    if (!b.visible) return;
    const k = clamp01((local - t0) / 12);
    const from = i === 0 ? new THREE.Vector3(PF.x, 4.2, PF.z) : new THREE.Vector3(SEATS6[(i + ASKER) % 6][0], 3.2, SEATS6[(i + ASKER) % 6][1]);
    const to = new THREE.Vector3(SEATS6[(i + ASKER + 1) % 6][0], 3.2, SEATS6[(i + ASKER + 1) % 6][1]);
    const p = from.clone().lerp(to, k);
    p.y += Math.sin(Math.PI * k) * 1.2;
    b.position.copy(p);
    b.lookAt(cam.pos);
  });
  const winOn = id === "s2" && local >= W("s2", 13) - 2;
  refs.windowFace.visible = winOn && !hideBack;
  const blink = winOn && (local % 50) < 4 ? 0.15 : 1;
  refs.windowEyes.forEach((e: any, i: number) => (e.scale.y = (i % 2 === 0 ? 1.2 : 1) * blink));
  refs.windowMouth.scale.set(1.3, winOn ? 0.5 + 0.6 * Math.abs(Math.sin(local * 0.5)) : 0.9, 0.3);
  refs.bigTalvez.visible = winOn && local >= W("s2", 15) - 2;
  if (refs.bigTalvez.visible) {
    const k = spr(local, W("s2", 15) - 2);
    refs.bigTalvez.position.set(WIN[0] + 0.6, WIN[1] + 1.55, WIN[2] + 0.8);
    refs.bigTalvez.scale.setScalar(Math.max(0.01, k * 0.75));
    refs.bigTalvez.lookAt(cam.pos);
  }

  // --- folhas voando: pânico (s3) e correção do pato (s4) ---
  refs.papers.forEach((p: any, i: number) => {
    const u = p.userData;
    if (id === "s3" && local < W("s3", 12) - 2) {
      p.visible = true;
      const t = ((local / 50 + u.o) % 1);
      p.position.set(u.x + Math.sin(t * 6 + u.s) * 0.4, 0.3 + Math.sin(Math.PI * t) * 3.5, u.z - 1);
      p.rotation.set(t * 5 + u.s, t * 3, t * 4);
    } else if (id === "s4" && local >= W("s4", 7) - 2 && local < W("s4", 15)) {
      p.visible = true;
      const t = ((local - W("s4", 7)) / 18 + i / 12) % 1;
      p.position.set(TDESK.x - 0.4 + Math.sin(i * 2.1) * 2.5 * t, DESK_Y + 0.2 + Math.sin(Math.PI * t) * 2.2, TDESK.z + 0.1 + Math.cos(i * 1.7) * 1.5 * t);
      p.rotation.set(t * 6, t * 4 + i, t * 3);
    } else if (id === "s5" && local >= W("s5", 10)) {
      // rebobinando: as folhas voltam para a mesa
      p.visible = true;
      const t = 1 - clamp01((local - W("s5", 10)) / 40 + i / 30);
      p.position.set(TDESK.x - 0.4 + Math.sin(i * 2.1) * 2.5 * t, DESK_Y + 0.2 + Math.sin(Math.PI * t) * 2.2, TDESK.z + 0.1 + Math.cos(i * 1.7) * 1.5 * t);
      p.rotation.set(t * 6, t * 4 + i, t * 3);
    } else p.visible = false;
  });

  // --- pato de gravata ---
  const duck = duckPose(frame);
  const westernClose = id === "s8" && local >= W("s8", 13) - 2 && local < W("s8", 13) + 30;
  refs.duck.visible = !!duck && !westernClose; // nos closes de faroeste o pato ficaria colado na câmera
  if (duck) {
    const D = refs.duck.userData.parts;
    refs.duck.position.set(duck.x, duck.y, duck.z);
    refs.duck.rotation.y = duck.rot;
    const t = id === "s3" ? (local - (W("s3", 12) - 2)) * 0.4 : local;
    D.body.rotation.z = duck.walk ? Math.sin(t * 0.9) * 0.15 : 0;
    D.feet.forEach((f: any, i: number) => (f.rotation.x = duck.walk ? Math.sin(t * 0.9 + i * Math.PI) * 0.5 : 0));
    const writingDuck = id === "s4" && local >= W("s4", 7) - 2 && local < W("s4", 15);
    const wings = id === "s11" ? spr(local, W("s11", 6) - 2) : writingDuck ? Math.abs(Math.sin(local * 1.4)) * 0.8 : 0;
    D.wings.forEach((w: any, i: number) => (w.rotation.z = (i ? -1 : 1) * wings * 1.2));
    D.head.rotation.x = writingDuck ? 0.4 + Math.sin(local * 1.1) * 0.15 : 0;
    D.quiff.visible = false;
    D.glasses.visible = after(id, "s8");
    refs.duck.scale.setScalar(id === "s11" ? 1.3 : id === "s3" ? 1.0 : 0.75);
  }
  // holofote e fumaça na entrada do pato (s3)
  const spotOn = id === "s3" ? smooth(W("s3", 12) - 2, W("s3", 12) + 10, local) : 0;
  refs.spot.visible = spotOn > 0.01;
  refs.spot.material.opacity = 0.32 * spotOn;
  refs.spot.position.set(DOOR.x - 1.0, 3.25, DOOR.z);
  const smokeAt = id === "s3" ? W("s3", 12) - 2 : id === "s7" ? W("s7", 10) - 2 : -999;
  const smokeC = id === "s3" ? new THREE.Vector3(DOOR.x - 0.6, 0.6, DOOR.z) : new THREE.Vector3(TDESK.x, DESK_Y + 0.4, TDESK.z + 0.1);
  refs.smoke.forEach((m: any) => {
    const st = (local - smokeAt) / (id === "s3" ? 60 : 30);
    m.visible = st > 0 && st < 1;
    if (!m.visible) return;
    const u = m.userData;
    m.position.copy(smokeC).add(u.d.clone().multiplyScalar(st * (id === "s3" ? 1.5 : 0.6)));
    m.scale.setScalar(u.s * (0.4 + st) * (id === "s3" ? 1 : 0.6));
    m.material.opacity = 0.7 * (1 - st);
  });

  // --- dinossauro de giz ---
  const dino = dinoPose(frame);
  refs.dino.visible = !!dino;
  if (dino) {
    refs.dino.position.set(dino.x, dino.y, dino.z);
    refs.dino.rotation.y = dino.rot;
    refs.dino.scale.setScalar(Math.max(0.01, dino.scale));
    const roar = id === "s7" ? Math.max(0, Math.sin(Math.PI * clamp01((local - W("s7", 10) - 8) / 20))) : 0;
    refs.dino.userData.jaw.position.y = -0.15 - roar * 0.12;
    refs.dino.userData.face.userData.set(id === "s8" ? "bravo" : id === "s9" || id === "s11" ? "feliz" : roar > 0.1 ? "surpreso" : "feliz");
    refs.dino.userData.tie.visible = id === "s9" || id === "s11";
    refs.dino.userData.body.rotation.z = Math.sin(local * 0.2) * 0.04;
  }

  // --- diretor ---
  const dir = directorPose(frame);
  refs.director.visible = !!dir;
  if (dir) {
    const R = refs.director.userData.parts;
    refs.director.position.set(dir.x, dir.y, dir.z);
    refs.director.rotation.y = dir.rot;
    R.setMood(id === "s9" ? "surpreso" : id === "s8" && local >= W("s8", 5) ? "bravo" : "feliz", local);
    R.head.rotation.x = id === "s9" ? 0.55 * spr(local, L("s9", 10)) : 0;
    R.pivot.rotation.x = 0;
    setBarberLimb(R.arms[0], {raise: 0.12});
    setBarberLimb(R.arms[1], {raise: 0.12, forward: id === "s8" && local >= W("s8", 13) ? 0.8 : 0, bend: 0.3});
  }

  // --- tabuleiro com pães de queijo (s8–s9) ---
  const chessOn = id === "s8" && local >= W("s8", 10) - 2 || id === "s9";
  refs.chess.visible = chessOn;
  if (chessOn) {
    refs.chess.position.set(TDESK.x + 0.15, DESK_Y + 0.03, TDESK.z);
    const k = id === "s8" ? spr(local, W("s8", 10) - 2) : 1;
    refs.chess.scale.setScalar(Math.max(0.01, k));
    refs.paes.forEach((p: any, i: number) => {
      const t0 = W("s8", 14) - 4 + i * 2;
      const q = id === "s9" ? 1 : clamp01((local - t0) / 8);
      p.visible = q > 0;
      p.position.copy(p.userData.rest);
      p.position.y += (1 - q * q) * 1.5;
      if (id === "s9" && i % 3 === 0) p.position.x += 0.5 * spr(local, L("s9", 12)); // tabuleiro bagunçado: o diretor perdeu
    });
  }
}
