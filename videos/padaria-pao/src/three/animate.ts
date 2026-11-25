// Estado de cada frame (determinístico): câmera, personagens, objetos e física do jaleco.
import * as THREE from "three";
import {spring} from "remotion";
// @ts-ignore módulo JS
import {setMood, setArm, CoatPhysics, setCoat} from "./professor.js";
// @ts-ignore módulo JS
import {setBakerArm} from "./props.js";
// @ts-ignore módulo JS
import {HOME_X} from "./world.js";
import {cuts, cutById, planById, sceneAt, wordLocal, FPS} from "../data/timeline";

type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const spr = (f: number, f0: number, damping = 11) => (f < f0 ? 0 : spring({frame: f - f0, fps: FPS, config: {damping, stiffness: 170, mass: 0.7}}));

/** Converte um frame local do plano aprovado para o frame local real (cena reajustada à voz). */
export const L = (id: string, fPlan: number) => Math.round((fPlan * cutById[id].dur) / planById[id].durationInFrames);

const HOME = new Set(["s11", "s12"]);
const P0 = {x: 3.1, z: 1.15, rot: -1.15};

// ---------- câmera ----------
export type CamPose = {pos: THREE.Vector3; target: THREE.Vector3; fov: number};
// ajustes técnicos de enquadramento (mesma intenção do roteiro, coordenadas finais)
const CAM: Record<string, [number[], number, number, number, number[], number, number, number]> = {
  // id: [alvo0, raio0, az0, el0, alvo1, raio1, az1, el1]
  s1: [[1.9, 2.4, 0.3], 30, 20, 20, [1.6, 2.4, 0.4], 26, 12, 17],
  s2: [[2.4, 2.9, 0.6], 13, -40, 6, [2.2, 2.9, 0.6], 12, -30, 8],
  s3: [[0.0, 2.3, 0.2], 19, 18, 14, [-0.8, 2.3, -0.4], 17, -12, 14],
  s4: [[-1.15, 2.4, 0.3], 10.5, 4, 14, [-1.15, 2.4, 0.3], 10, 16, 14],
  s5: [[-0.7, 2.4, -0.3], 11, -12, 10, [-0.6, 2.4, -0.3], 10.5, 6, 10],
  s6: [[1.62, 2.2, 0.2], 7, 22, 16, [1.62, 2.2, 0.2], 6.5, 8, 16],
  s7: [[3.4, 2.6, 0.8], 14, -6, 6, [3.4, 2.6, 0.8], 13, 6, 6],
  s8: [[1.6, 1.6, 0.8], 8.5, 14, 8, [1.6, 1.7, 0.8], 8, -4, 8],
  s9: [[1.7, 2.5, 0.4], 15, -14, 10, [1.8, 2.5, 0.4], 12.5, 10, 10],
  s10: [[3.0, 2.7, 1.3], 12.5, -14, 6, [3.0, 2.7, 1.3], 11.5, -4, 6],
  s11: [[0.1, 2.6, 0], 12.5, 2, 12, [0.1, 2.6, 0], 11.5, 12, 12],
  s12: [[0.1, 2.6, 0], 12.5, -10, 12, [0.1, 2.6, 0], 11.5, 6, 12],
  s13: [[1.4, 2.6, 1.0], 19, -16, 12, [1.4, 2.6, 1.0], 16, 14, 12],
  s14: [[1.4, 2.6, 1.0], 16, 14, 12, [1.4, 2.6, 1.0], 16, 26, 12],
};
export function cameraAt(frame: number): CamPose {
  const {id, local, cut} = sceneAt(frame);
  const [t0, r0, a0, e0, t1, r1, a1, e1] = CAM[id];
  const k = smooth(0, 1, local / cut.dur);
  const t = new THREE.Vector3(lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k));
  if (HOME.has(id)) t.x += HOME_X;
  const r = lerp(r0, r1, k), az = THREE.MathUtils.degToRad(lerp(a0, a1, k)), el = THREE.MathUtils.degToRad(lerp(e0, e1, k));
  const pos = new THREE.Vector3(t.x + r * Math.sin(az) * Math.cos(el), t.y + r * Math.sin(el), t.z + r * Math.cos(az) * Math.cos(el));
  return {pos, target: t, fov: 24};
}

// ---------- professor ----------
const walkX = (frame: number) => {
  const c = cutById.s1;
  if (frame >= c.start + c.dur) return P0.x;
  const f = frame - c.start;
  return lerp(8.5, P0.x, 1 - Math.pow(1 - clamp01(f / 70), 2));
};
const profSpeed = (frame: number) => (frame < cutById.s1.start + 72 ? Math.abs(walkX(frame + 0.5) - walkX(frame - 0.5)) * FPS : 0);

/** Levantar os braços (0..1) — alimenta pose e física do jaleco. */
const profLift = (frame: number) => {
  const {id, local} = sceneAt(frame);
  if (id === "s9") return spr(local, 0) * (1 - smooth(wordLocal("s9", 5), wordLocal("s9", 5) + 10, local));
  if (id === "s13") return spr(local, 8, 10);
  if (id === "s14") return 1 - smooth(10, 30, local);
  return 0;
};

// física do jaleco: integrada do frame 0 até o atual (cache sequencial)
const coatCache: any[] = [];
let phys: any = null;
let phase = 0;
const phaseCache: number[] = [];
function coatAt(frame: number) {
  if (!phys) {
    phys = new CoatPhysics();
    coatCache.length = 0;
  }
  while (coatCache.length <= frame) {
    const f = coatCache.length;
    const sub = 4;
    let out = null;
    for (let i = 0; i < sub; i++) {
      const t = f + i / sub;
      const v = profSpeed(t);
      const acc = (v - profSpeed(t - 1 / sub)) * FPS * sub;
      phase += (v / FPS / sub) * 3.4;
      const sw = Math.sin(phase) * 0.45 * clamp01(v / 2.5);
      out = phys.step(1 / FPS / sub, {vel: v * 0.6, acc: acc * 0.6, lift: profLift(t), legL: -sw, legR: sw});
    }
    coatCache.push(out);
    phaseCache.push(phase);
  }
  return {coat: coatCache[frame], phase: phaseCache[frame]};
}

function moodAt(id: string, local: number): Mood {
  const m = planById[id].moods.prof;
  let cur: Mood = m[0].mood;
  for (const k of m) if (local >= L(id, k.f)) cur = k.mood;
  if (id === "s3") cur = local >= wordLocal("s3", 10) ? "eureka" : "bravo";
  if (id === "s7") cur = local >= wordLocal("s7", 9) ? "eureka" : local >= L("s7", 10) ? "surpreso" : "feliz";
  if (id === "s12") cur = local >= wordLocal("s12", 7) && local < wordLocal("s12", 7) + 18 ? "surpreso" : "feliz";
  return cur;
}

// ---------- aplica tudo ----------
export function applyFrame(refs: any, frame: number) {
  const {id, local, cut} = sceneAt(frame);
  const P = refs.prof.userData.parts;
  const B = refs.baker.userData.parts;
  const home = HOME.has(id);
  const {coat, phase: ph} = coatAt(frame);

  // --- professor: posição ---
  let px = P0.x, pz = P0.z, rot = P0.rot, py = 0;
  if (id === "s1") {
    px = walkX(frame);
    rot = lerp(-1.0, P0.rot, smooth(55, 75, local));
  }
  if (home) {
    px = HOME_X + 0.6;
    pz = -1.35;
    rot = -0.15;
  }
  if (id === "s13" || id === "s14") {
    px = 2.6;
    pz = 2.3;
    rot = -0.45;
    if (id === "s13") py = 0.35 * Math.sin(Math.PI * clamp01((local - 12) / 14));
  }
  if (id === "s7") rot = -0.4;
  refs.prof.position.set(px, py, pz);
  refs.prof.rotation.y = rot;
  const v = profSpeed(frame);
  const walk = clamp01(v / 2.5);
  const sw = Math.sin(ph) * 0.45 * walk;
  P.hips[0].rotation.x = sw;
  P.hips[1].rotation.x = -sw;
  P.body.position.y = Math.abs(Math.cos(ph)) * 0.07 * walk;
  P.body.rotation.x = 0.05 * walk;
  setMood(P, moodAt(id, local));
  setCoat(P, coat);

  // --- professor: braços ---
  const lift = profLift(frame);
  const rest = {raise: 0.08 + 2.4 * lift, bend: 0.2 * lift, forward: 0};
  let armL: any = {...rest, forward: -sw * 0.9 + 0, bend: rest.bend + 0.15 * walk};
  let armR: any = {...rest, forward: sw * 0.9, bend: rest.bend + 0.15 * walk};
  if (id === "s2" || id === "s8") {
    const k = spr(local, id === "s2" ? 0 : L("s8", 5));
    armR = {raise: lerp(0.08, 1.0, k), forward: lerp(0, 0.95, k), bend: lerp(0, 0.85, k), point: k > 0.3};
  }
  if (id === "s10") {
    const k = spr(local, 3);
    armR = {raise: lerp(0.08, 0.25, k), forward: lerp(0, 1.1, k), bend: lerp(0, 0.5, k)};
    rot = -0.35;
    refs.prof.rotation.y = rot;
  }
  if (id === "s12" || id === "s11") {
    const k = id === "s12" ? spr(local, 4) : 0;
    armR = {raise: 0.1, forward: 0.9 * k, bend: 0.35 * k};
    armL = {raise: 0.1, forward: 0.9 * k, bend: 0.35 * k};
  }
  setArm(P.arms[0], armL);
  setArm(P.arms[1], armR);
  refs.bagHand.visible = id === "s10";
  if (id === "s10") refs.bagPivot.rotation.x = armR.forward + armR.bend; // mantém o saco em pé

  // --- padeiro ---
  let bx = -0.5, brot = 0;
  let bR = {raise: 0.1, forward: 0, bend: 0}, bL = {raise: 0.1, forward: 0, bend: 0};
  if (id === "s3") {
    const k = spr(local, L("s3", 95));
    bL = {raise: lerp(0.1, 1.35, k), forward: 0, bend: 0.1};
    brot = -0.4 * k;
  }
  if (id === "s5") {
    brot = -0.35;
    const end = wordLocal("s5", 8);
    const cyc = local < end ? 0.5 - 0.5 * Math.cos((local / end) * Math.PI * 6) : 0;
    bR = {raise: 0.25, forward: 0.4 + 0.9 * cyc, bend: 0.5};
  }
  if (id === "s9") {
    bx = 1.1;
    const k = spr(local, L("s9", 10));
    bR = {raise: 0.2, forward: 1.2 * k, bend: 0.4};
    bL = {raise: 0.2, forward: 1.2 * k, bend: 0.4};
  }
  if (id === "s13" || id === "s14") {
    const clap = id === "s13" ? Math.abs(Math.sin(local * 0.55)) : 0;
    bR = {raise: 0.35 - 0.3 * clap, forward: 1.0, bend: 0.6};
    bL = {raise: 0.35 - 0.3 * clap, forward: 1.0, bend: 0.6};
  }
  refs.baker.position.set(bx, 0, -1.25);
  refs.baker.rotation.y = brot;
  setBakerArm(B.arms[0], bL);
  setBakerArm(B.arms[1], bR);
  refs.tongs.visible = id === "s5";
  B.body.position.y = Math.abs(Math.sin(frame * 0.07)) * 0.02;

  // --- cesto: pães velhos x quentinhos ---
  const order = cuts.findIndex((c) => c.id === id);
  const s3i = cuts.findIndex((c) => c.id === "s3");
  const hotStart = L("s3", 120);
  const hotBegun = order > s3i || (id === "s3" && local >= hotStart);
  refs.oldBreads.forEach((b: any, i: number) => {
    b.visible = !hotBegun;
    b.userData.setSag(id === "s3" ? smooth(L("s3", 20), L("s3", 50), local) * 0.4 : 0.35);
    b.rotation.z = id === "s3" ? 0 : 0;
    if (i === 0 && id === "s3") b.position.y = 0.16 + 0.0;
  });
  refs.hotBreads.forEach((b: any, i: number) => {
    const t0 = hotStart + i * 4;
    const ok = order > s3i || (id === "s3" && local >= t0);
    b.visible = ok;
    const k = order > s3i ? 1 : spr(local, t0, 9);
    b.position.set(b.userData.rest.x, b.userData.rest.y + (1 - k) * 1.6, b.userData.rest.z);
  });
  // forno, bandeja e vapor
  const open = id === "s3" ? spr(local, L("s3", 100), 12) : 0;
  refs.ovenDoor.rotation.x = 1.35 * open;
  refs.tray.position.z = 0.2 + 0.7 * open;
  refs.steam.forEach((s: any, i: number) => {
    const t = id === "s3" ? (local - L("s3", 105) - i * 1.6) / 45 : -1;
    s.visible = t > 0 && t < 1;
    if (!s.visible) return;
    const j = (i * 0.618) % 1;
    s.position.set(-4.4 + (j - 0.5) * 1.4 + Math.sin(t * 6 + i) * 0.15, 2.0 + t * 3.2, -2.8 + (j - 0.5) * 0.4);
    s.scale.setScalar(0.6 + t * 1.6);
    s.material.opacity = 0.65 * (1 - t);
  });

  // --- vitrine: moreninho, clarinho, branquelo ---
  const d0 = L("s4", 40), l0 = L("s4", 80);
  const dk = id === "s4" ? spr(local, d0) : 0, lk = id === "s4" ? spr(local, l0) : 0;
  refs.breadDark.position.y = 0.16 + 0.3 * dk * (1 - smooth(L("s4", 100), L("s4", 120), local) * 0);
  refs.breadDark.rotation.y = id === "s4" ? Math.PI * 2 * smooth(d0, d0 + 30, local) : 0;
  refs.breadLight.position.y = 0.16 + 0.3 * lk;
  refs.breadLight.rotation.y = id === "s4" ? Math.PI * 2 * smooth(l0, l0 + 30, local) : 0;
  refs.breadPale.visible = id === "s5";
  if (id === "s5") {
    const up = spr(local, L("s5", 120));
    const down = spr(local, L("s5", 150));
    refs.breadPale.position.y = 0.16 + 0.5 * up - 0.62 * down;
    refs.breadPale.position.z = 0.3;
  }
  refs.bagCounter.visible = id === "s5";

  // --- balança ---
  refs.bagScale.visible = id === "s6" || id === "s7" || id === "s8";
  if (id === "s6") refs.bagScale.position.set(0, lerp(1.6, 0.27, spr(local, L("s6", 20))), -0.03);
  else refs.bagScale.position.set(0, 0.27, -0.03);
  refs.bagBig.visible = id === "s9";
  let kg = 0;
  if (id === "s6") kg = 0.52 * smooth(L("s6", 35), L("s6", 70), local);
  if (id === "s7" || id === "s8") kg = 0.52;
  let fallen = 0;
  if (id === "s9") {
    kg = 0.5 * smooth(L("s9", 80), L("s9", 110), local);
    refs.fallBreads.forEach((b: any, i: number) => {
      const t0 = L("s9", 15) + i * 6;
      const t = (local - t0) / 10;
      b.visible = t >= 0 && t < 1;
      b.position.set(Math.sin(i * 2.3) * 0.15, 2.6 - 1.7 * t * t, -0.03 + Math.cos(i * 1.7) * 0.08);
      b.rotation.set(t * 3, i, 0);
      if (local >= t0 + 10) fallen++;
    });
  } else refs.fallBreads.forEach((b: any) => (b.visible = false));
  refs.setScale(kg);
  refs.priceTag.rotation.z = id === "s8" ? THREE.MathUtils.degToRad(4) * Math.sin(local * 0.35) * Math.exp(-local / 30) : 0;
  refs.arrow.visible = id === "s8";
  refs.arrow.position.y = 1.65 + 0.08 * Math.sin(local * 0.42);

  // --- carimbo (cena 7) ---
  refs.stamp.visible = id === "s7";
  if (id === "s7") {
    const k = spr(local, L("s7", 10), 7);
    refs.stamp.position.set(4.25, lerp(10, 1.15, k), 1.7);
  }

  // --- casa ---
  refs.plastic.visible = id === "s11";
  if (id === "s11") {
    const dk2 = smooth(L("s11", 10), L("s11", 60), local);
    refs.drops.forEach((d: any, i: number) => {
      d.visible = dk2 > (i % 7) / 7;
      d.material.opacity = 0.8 * dk2;
    });
    const sag = smooth(L("s11", 40), L("s11", 120), local);
    refs.softBread.userData.setSag(sag * 0.55);
    refs.softBread.userData.setColor("#" + new THREE.Color("#d9963f").lerp(new THREE.Color("#d8c6a2"), sag).getHexString());
  }
  refs.homePaper.visible = id === "s12";
  refs.split.visible = id === "s12";
  if (id === "s12") {
    const br = wordLocal("s12", 7) - 4;
    refs.split.userData.setSplit(local < br ? 0 : 0.45 * spr(local, br, 9));
    const t = Math.max(0, (local - br) / FPS);
    refs.crumbs.forEach((c: any) => {
      c.visible = local >= br;
      const vv = c.userData.v;
      const y = Math.max(-0.17, vv.y * t - 4.5 * t * t);
      c.position.set(vv.x * Math.min(t, 0.5), y, vv.z * Math.min(t, 0.5));
      c.rotation.set(c.userData.spin * Math.min(t, 0.5), c.userData.spin, 0);
    });
  }
  refs.mugSteam.forEach((s: any, i: number) => {
    const t = ((frame / 40 + i / 6) % 1);
    s.position.set(Math.sin(t * 6 + i) * 0.05, 0.45 + t * 0.7, 0);
    s.scale.setScalar(0.6 + t);
    s.material.opacity = 0.45 * (1 - t);
  });

  // --- confete ---
  const confOn = id === "s13" || id === "s14";
  const ct = confOn ? (frame - (cutById.s13.start + L("s13", 15))) / FPS : -1;
  refs.confetti.forEach((c: any) => {
    const u = c.userData;
    const t = ct - u.d * 0.6;
    c.visible = t > 0;
    if (!c.visible) return;
    c.position.set(2.0 + u.x + Math.sin(t * 3 + u.s) * 0.3, Math.max(0.05, 8 - t * 2.6), 2.0 + u.z);
    c.rotation.set(t * 4 + u.s, t * 3, t * 2);
  });
  return {cut};
}
