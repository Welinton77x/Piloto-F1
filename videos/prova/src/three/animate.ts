// "Isso vai cair na prova?": estado de cada frame (determinístico).
import * as THREE from "three";
import {spring} from "remotion";
// @ts-ignore módulo JS
import {setMood, setArm, CoatPhysics, setCoat} from "./professor.js";
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

export type Pose = {x: number; y: number; z: number; rot: number};
const PB: Pose = {x: -1.4, y: 0, z: -3.3, rot: Math.PI}; // no quadro, de costas
const PF: Pose = {x: -1.4, y: 0, z: -3.0, rot: 0}; // de frente para a turma
const TCHAIR = {x: TDESK.x, z: TDESK.z - 1.0};

// ---------- professor ----------
function profPath(frame: number): Pose {
  const {id, local} = sceneAt(frame);
  if (id === "s1") {
    const turn = smooth(W("s1", 15) - 14, W("s1", 15) - 2, local);
    return {...PB, z: lerp(PB.z, PF.z, turn), rot: lerp(Math.PI, 0, turn)};
  }
  if (id === "s4") return {...PB};
  if (id === "s9") {
    const k = 1 - Math.pow(1 - clamp01(local / 55), 2);
    return {x: lerp(6.4, 4.8, k), y: 0, z: lerp(-0.4, -0.6, k), rot: -Math.PI / 2 + 0.25};
  }
  if (id === "s10") return {x: SEATS[ASKER][0], y: 0, z: SEATS[ASKER][1], rot: Math.PI};
  if (id === "s5" || id === "s6") return {x: 0.6, y: 0, z: -2.2, rot: 0.6};
  return {...PF};
}
const profSpeed = (frame: number) => {
  const {id} = sceneAt(frame);
  if (id !== "s9") return 0;
  if (sceneAt(frame - 0.5).id !== id || sceneAt(frame + 0.5).id !== id) return 0;
  const a = profPath(frame - 0.5), b = profPath(frame + 0.5);
  return Math.hypot(b.x - a.x, b.z - a.z) * FPS;
};
export const profPose = profPath;

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
      out = phys.step(1 / FPS / 4, {vel: v * 0.6, acc: acc * 0.6, lift: 0, legL: -sw, legR: sw});
    }
    coatCache.push(out);
    phaseCache.push(phase);
  }
  return {coat: coatCache[frame], phase: phaseCache[frame]};
}

// ---------- alunos ----------
type SPose = Pose & {seated: boolean};
export function studentPose(frame: number, i: number): SPose {
  const {id, local} = sceneAt(frame);
  const [sx, sz] = SEATS[i];
  if (i === ASKER && id === "s9") return {x: TCHAIR.x, y: 0, z: TCHAIR.z, rot: 0, seated: true};
  if (i === ASKER && id === "s10") return {x: PF.x + 0.4, y: 0, z: PF.z, rot: 0.2, seated: false};
  if (id === "s3") {
    const a = (local / FPS) * Math.PI * 2 * 0.8 + i;
    return {x: sx + Math.cos(a) * 0.9, y: Math.abs(Math.sin(local * 0.5 + i)) * 0.15, z: sz - 0.1 + Math.sin(a) * 0.7, rot: -a, seated: false};
  }
  const jump = id === "s7" ? Math.max(0, Math.sin(Math.PI * clamp01((local - L("s7", 105)) / 14))) * 0.5 : 0;
  return {x: sx, y: jump, z: sz, rot: Math.PI, seated: true};
}

// ---------- câmera ----------
export type CamPose = {pos: THREE.Vector3; target: THREE.Vector3; fov: number};
type Key = [number, V3, number, number, number];
const PFACE: V3 = [PF.x, 3.15, PF.z];
const AFACE: V3 = [SEATS[ASKER][0], 2.15, SEATS[ASKER][1]];
const DESK_TOP: V3 = [TDESK.x, 2.1, TDESK.z + 0.2];
const BOARDV: V3 = [BOARD.x, BOARD.y, BOARD.z];
function camKeys(id: string): Key[] {
  const d = cutById[id].dur;
  switch (id) {
    case "s1": {
      const a = W("s1", 8) - 2, b = W("s1", 15) - 2;
      return [[0, [-0.4, 2.8, -0.8], 26, 4, 14], [a - 1, [-0.4, 2.8, -0.8], 22, 10, 12], [a, AFACE, 6.5, 170, 6], [b - 1, AFACE, 6, 178, 6], [b, PFACE, 6.2, 20, 6], [d, PFACE, 5.6, 14, 6]];
    }
    case "s2": return [[0, [-2.4, 2.0, 1.5], 11, 180, 24], [d, [2.4, 2.0, 1.5], 11, 180, 24]];
    case "s3": return [[0, [-0.6, 2.2, -0.8], 15, 0, 28], [d, [-0.6, 2.2, -0.8], 14, 8, 28]];
    case "s4": {
      const a = W("s4", 14) + 3;
      return [[0, [-0.9, 3.4, -3.6], 13, 22, 8], [a - 1, [-0.9, 3.4, -3.6], 11.5, 14, 8], [a, [-0.4, 0.25, -2.9], 2.6, -10, 40], [d, [-0.4, 0.25, -2.9], 2.3, -18, 40]];
    }
    case "s5": return [[0, DESK_TOP, 8, -12, 42], [d, [TDESK.x - 0.6, 2.4, TDESK.z - 0.2], 10, 6, 40]];
    case "s6": return [[0, [TDESK.x, 2.4, TDESK.z + 0.2], 8.5, 4, 42], [d, [TDESK.x, 2.4, TDESK.z + 0.2], 7.8, -6, 42]];
    case "s7": {
      const a = L("s7", 151);
      return [[0, [0, 3.4, -1.2], 22, -6, 14], [a - 1, [0, 3.4, -1.2], 20, 4, 14], [a, BOARDV, 16, 0, 2], [d, BOARDV, 15, 0, 2]];
    }
    case "s8": {
      const a = W("s8", 14) - 3;
      return [[0, [0, 2.0, 1.5], 12, 172, 28], [a - 1, [0, 2.0, 1.5], 11, 188, 28], [a, BOARDV, 16, 0, 2], [d, BOARDV, 15, 0, 2]];
    }
    case "s9": {
      const a = L("s9", 151), b = L("s9", 201);
      const PS: V3 = [4.8, 3.15, -0.6];
      return [[0, [3.6, 2.6, -1.4], 16, -14, 10], [a - 1, [3.4, 2.6, -1.6], 12, -6, 10], [a, PS, 5.5, -75, 4], [b - 1, PS, 5.2, -75, 4], [b, [TCHAIR.x, 2.6, TCHAIR.z + 0.4], 8, 8, 8], [d, [TCHAIR.x, 2.6, TCHAIR.z + 0.4], 7.2, -4, 8]];
    }
    case "s10": return [[0, [-0.4, 2.6, -1.0], 21, -10, 14], [d, [-0.4, 2.6, -1.0], 24, 10, 16]];
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
  if (id === "s4") shakeAt(W("s4", 14), 0.08);
  if (id === "s7") shakeAt(L("s7", 100), 0.08);
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
    case "chalk": return [-0.4, 0.9, -2.9];
    case "eraser": return [TDESK.x - 0.8, 2.75, TDESK.z + 0.2];
    case "marker": return [TDESK.x, 3.0, TDESK.z + 0.25];
    case "projector": return [TDESK.x + 0.75, 2.55, TDESK.z + 0.1];
  }
  return null;
}

// ---------- aplica tudo ----------
export function applyFrame(refs: any, frame: number) {
  const {id, local} = sceneAt(frame);
  const P = refs.prof.userData.parts;
  const {coat, phase: ph} = coatAt(frame);
  const cam = cameraAt(frame);

  // parede do fundo some quando a câmera está "atrás do quadro" (tomadas do rosto dos alunos)
  const hideBack = cam.pos.z < BOARD.z - 0.1;
  refs.backItems.forEach((o: any) => (o.visible = !hideBack));
  refs.prof.visible = !hideBack; // nas tomadas do lado do quadro o professor ficaria colado na câmera

  // --- professor ---
  const pp = profPath(frame);
  refs.prof.position.set(pp.x, pp.y, pp.z);
  refs.prof.rotation.y = pp.rot;
  const seated = id === "s10";
  const walk = clamp01(profSpeed(frame) / 2.5);
  const sw = Math.sin(ph) * 0.45 * walk;
  P.hips[0].rotation.x = seated ? -1.45 : sw;
  P.hips[1].rotation.x = seated ? -1.45 : -sw;
  P.body.position.y = Math.abs(Math.cos(ph)) * 0.07 * walk;
  const pm = planById[id].moods.prof;
  let mood = pm[0].mood;
  for (const k of pm) if (local >= L(id, k.f)) mood = k.mood;
  if (id === "s1") mood = local >= W("s1", 15) - 2 ? "sereno" : "feliz";
  if (id === "s9") mood = local >= L("s9", 151) ? "surpreso" : "feliz";
  setMood(P, mood);
  setCoat(P, coat);
  if (seated) P.flaps.L.rotation.x = P.flaps.R.rotation.x = -1.35;
  let armL: any = {raise: 0.08, forward: -sw * 0.9, bend: 0.15 * walk};
  let armR: any = {raise: 0.08, forward: sw * 0.9, bend: 0.15 * walk};
  const writing = (id === "s1" && local < W("s1", 15) - 14) || (id === "s4" && local < W("s4", 14) + 2);
  if (writing) {
    const scrib = Math.sin(local * 0.6) * 0.12;
    armR = {raise: 0.35 + scrib, forward: 1.75, bend: 0.4};
  }
  if (id === "s3") armL = armR = {raise: 0.9, forward: 0.2, bend: 1.6}; // mãos na cabeça
  if (id === "s6") armL = armR = {raise: 0.45, forward: 0.7, bend: 1.9}; // braços cruzados
  if (id === "s7" && local < L("s7", 150)) armR = {raise: 0.3, forward: lerp(0, 1.2, spr(local, L("s7", 10))), bend: 0.2};
  if (id === "s10") armR = {raise: lerp(0.08, 2.7, spr(local, L("s10", 30))), forward: 0, bend: 0.2};
  setArm(P.arms[0], armL);
  setArm(P.arms[1], armR);

  // --- alunos ---
  const sm = planById[id].moods.students ?? [{f: 0, mood: "feliz"}];
  let smood = sm[0].mood;
  for (const k of sm) if (local >= L(id, k.f)) smood = k.mood;
  refs.students.forEach((s: any, i: number) => {
    const S = s.userData.parts;
    const sp = studentPose(frame, i);
    s.position.set(sp.x, sp.y, sp.z);
    s.rotation.y = sp.rot;
    const run = id === "s3" && !(i === ASKER && false);
    S.hips[0].rotation.x = sp.seated ? -1.45 : run ? Math.sin(local * 0.8 + i) * 0.6 : 0;
    S.hips[1].rotation.x = sp.seated ? -1.45 : run ? -Math.sin(local * 0.8 + i) * 0.6 : 0;
    let m = smood;
    if (i === ASKER && id === "s9") m = "feliz";
    S.face.userData.set(m);
    S.disguise.visible = i === ASKER && (id === "s9" || id === "s10");
    S.head.rotation.x = id === "s8" && local < W("s8", 14) - 3 ? 0.45 : 0;
    let aL: any = {raise: 0.1, forward: sp.seated ? 0.6 : 0, bend: sp.seated ? 0.6 : 0};
    let aR: any = {...aL};
    if (run) aL = aR = {raise: 1.2, forward: 0.3, bend: 1.4};
    if (i === ASKER && id === "s1") {
      const k = spr(local, W("s1", 7) - 4);
      aR = {raise: lerp(0.1, 2.8, k), forward: 0, bend: 0.1};
    }
    const phoneOn = id === "s2" && local >= L("s2", 70) + i * 3;
    if (phoneOn) aR = {raise: 0.2, forward: lerp(0.6, 1.25, spr(local, L("s2", 70) + i * 3)), bend: 1.2};
    if (id === "s7" && local >= L("s7", 105) && local < L("s7", 150)) aL = aR = {raise: 2.6, forward: 0, bend: 0.2};
    if (i === ASKER && id === "s9") aR = {raise: 0.2, forward: 1.0 + 0.35 * Math.max(0, Math.sin(local * 0.42)), bend: 0.7};
    if (i === ASKER && id === "s10") aR = {raise: 1.3, forward: 0.9, bend: 0.1};
    setLimb(S.arms[0], aL);
    setLimb(S.arms[1], aR);
    S.phone.visible = phoneOn;
  });
  refs.stamp.visible = id === "s9";
  refs.books.forEach((b: any) => (b.visible = id === "s8"));
  refs.exams.visible = id === "s9";
  refs.exams.position.set(TDESK.x - 0.5, 1.58, TDESK.z + 0.1);

  // --- quadro ---
  if (id === "s1") refs.setBoard("aula", clamp01(local / Math.max(1, W("s1", 15) - 14)));
  else if (id === "s4") refs.setBoard("tudo", clamp01((local - (W("s4", 5) - 2)) / Math.max(1, W("s4", 14) - W("s4", 5))));
  else if (id === "s7") refs.setBoard(local >= L("s7", 151) ? "prova" : "tudo", local >= L("s7", 151) ? clamp01((local - (W("s7", 15) - 4)) / 40) : 1);
  else if (id === "s8") refs.setBoard(local >= W("s8", 14) - 3 ? "mapa" : "prova", local >= W("s8", 14) - 3 ? clamp01((local - (W("s8", 14) - 3)) / 40) : 1);
  else if (id === "s9" || id === "s10") refs.setBoard("aula", 1);
  else refs.setBoard("tudo", 1);

  // --- giz com rosto ---
  const brk = W("s4", 14);
  refs.chalk.visible = writing || (id === "s4");
  refs.dust.forEach((d: any) => (d.visible = false));
  if (refs.chalk.visible) {
    const [h0, h1] = refs.chalk.userData.halves;
    if (id === "s4" && local >= brk) {
      // quebrou: as metades caem no chão, bravas
      const t = Math.min(1, (local - brk) / 14);
      refs.chalk.position.set(-0.4, lerp(2.9, 0.08, t * t), -2.9);
      refs.chalk.rotation.set(0, 0.3, lerp(0, Math.PI / 2, t));
      h0.position.set(-0.12 * t - 0.05, 0, 0);
      h1.position.set(0.12 * t + 0.05, 0, 0);
      h0.userData.face.userData.set("bravo");
      h1.userData.face.userData.set("bravo");
      const dt = (local - brk) / FPS;
      refs.dust.forEach((d: any) => {
        d.visible = dt < 1.2;
        const v = d.userData.v;
        d.position.set(-0.4 + v.x * dt * 0.6, Math.max(0.05, 2.9 * (1 - t) + v.y * dt - 2.5 * dt * dt), -2.9 + v.z * dt * 0.6);
        d.material.opacity = 0.8 * (1 - dt / 1.2);
      });
    } else {
      // na mão do professor (posição aproximada da mão direita escrevendo)
      const hand = new THREE.Vector3();
      refs.prof.updateMatrixWorld(true);
      refs.profChalkGrip.getWorldPosition(hand);
      refs.chalk.position.copy(hand);
      refs.chalk.rotation.set(0.4, 0, 0.3);
      h0.position.set(0, 0, 0);
      h1.position.set(0, 0, 0);
      h0.userData.face.userData.set(id === "s4" && local > brk - 20 ? "surpreso" : "feliz");
      h1.userData.face.userData.set(id === "s4" && local > brk - 20 ? "surpreso" : "feliz");
    }
  }

  // --- material escolar (s5–s6) ---
  const items = [refs.eraser, refs.marker, refs.projector];
  const words = [W("s5", 2), W("s5", 6), W("s5", 11)];
  items.forEach((it: any, i: number) => {
    const h = it.userData.home;
    let x = h.x, y = h.y, rot = 0;
    if (id === "s5") y += Math.sin(Math.PI * clamp01((local - words[i] + 2) / 12)) * 0.5;
    if (id === "s6") {
      const t = local / FPS;
      x = TDESK.x - 0.9 + ((i * 0.75 + t * 0.45) % 2.0);
      y += Math.abs(Math.sin(t * 6 + i)) * 0.12;
      rot = Math.sin(t * 6 + i) * 0.15;
    }
    it.position.set(x, y, h.z);
    it.rotation.set(0, 0, rot);
    it.userData.face.userData.set(id === "s6" ? "bravo" : id === "s5" && local >= words[i] ? "feliz" : "feliz");
    it.visible = true;
  });
  refs.marker.userData.sign.visible = (id === "s5" && local >= words[1]) || id === "s6";
  refs.strikeSigns.forEach((s: any, i: number) => {
    s.visible = id === "s6";
    if (!s.visible) return;
    const it = items[i];
    s.position.set(it.position.x + 0.05, it.position.y + (i === 1 ? 1.45 : 1.0), it.position.z + 0.05);
    s.rotation.z = Math.sin(local * 0.3 + i) * 0.12;
  });
  if (id === "s6") refs.marker.userData.sign.visible = false;
  // feixe do projetor e tela do wi-fi
  const beamOn = id === "s5" ? smooth(W("s5", 11), W("s5", 11) + 15, local) : 0;
  refs.beam.material.opacity = 0.35 * beamOn;
  refs.beam.visible = beamOn > 0.01;
  refs.wifi.visible = beamOn > 0.5;
  if (refs.beam.visible) {
    const from = new THREE.Vector3(TDESK.x + 0.55, 1.77, TDESK.z - 0.2);
    const to = new THREE.Vector3(BOARD.x + 0.4, BOARD.y, BOARD.z + 0.1);
    refs.beam.position.copy(from.clone().lerp(to, 0.5));
    refs.beam.scale.set(1, from.distanceTo(to) / 5.4, 0.55);
    refs.beam.lookAt(to);
    refs.beam.rotateX(-Math.PI / 2);
  }

  // --- relógio e sinal (s7) ---
  const spin = id === "s7" ? smooth(L("s7", 40), L("s7", 110), local) * Math.PI * 4 : 0;
  refs.clockHands[0].rotation.z = -1.2 - spin * 6;
  refs.clockHands[1].rotation.z = -2.6 - spin;
  const ring = id === "s7" && local >= L("s7", 100) && local < L("s7", 140);
  refs.bell.rotation.z = ring ? Math.sin(local * 4) * 0.12 : 0;

  // --- balões TALVEZ (s2) ---
  refs.talvez.forEach((b: any, i: number) => {
    const t0 = i * 9;
    b.visible = id === "s2" && local >= t0 && local < L("s2", 140);
    if (!b.visible) return;
    const k = clamp01((local - t0) / 12);
    const from = i === 0 ? new THREE.Vector3(PF.x, 4.2, PF.z) : new THREE.Vector3(SEATS[(i + ASKER) % 6][0], 3.2, SEATS[(i + ASKER) % 6][1]);
    const to = new THREE.Vector3(SEATS[(i + ASKER + 1) % 6][0], 3.2, SEATS[(i + ASKER + 1) % 6][1]);
    const p = from.clone().lerp(to, k);
    p.y += Math.sin(Math.PI * k) * 1.2;
    b.position.copy(p);
    b.lookAt(cam.pos);
  });

  // --- folhas voando (s3) ---
  refs.papers.forEach((p: any) => {
    p.visible = id === "s3";
    if (!p.visible) return;
    const u = p.userData, t = ((local / 50 + u.o) % 1);
    p.position.set(u.x + Math.sin(t * 6 + u.s) * 0.4, 0.3 + Math.sin(Math.PI * t) * 3.5, u.z - 1);
    p.rotation.set(t * 5 + u.s, t * 3, t * 4);
  });
}

// efeitos de tela, fundo e luz (interface comum com os outros vídeos)
export function screenFx(_frame: number) {
  return {red: 0, white: 0};
}
export function background(_frame: number) {
  return "#cfe3f5";
}
export function keyLight(_frame: number) {
  return 1;
}
