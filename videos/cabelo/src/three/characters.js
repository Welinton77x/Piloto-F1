// Barbeiro, pato e leão — mesmo estilo de brinquedo do Professor.
import * as THREE from "three";
import {mat, mesh, rbox, sphere, capsule, at, COLORS} from "./professor.js";

function stripes(c1, c2, n = 8, vertical = true) {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 128;
  const g = cv.getContext("2d");
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? c2 : c1;
    if (vertical) g.fillRect((i * 128) / n, 0, 128 / n + 1, 128);
    else g.fillRect(0, (i * 128) / n, 128, 128 / n + 1);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function arm(color, side) {
  const shoulder = new THREE.Group();
  const upper = new THREE.Group();
  shoulder.add(upper);
  upper.add(at(capsule(0.16, 0.3, color), 0, -0.25, 0));
  const elbow = new THREE.Group();
  elbow.position.y = -0.5;
  upper.add(elbow);
  elbow.add(at(capsule(0.14, 0.3, color), 0, -0.2, 0));
  const hand = at(sphere(0.13, COLORS.skin), 0, -0.5, 0.02);
  hand.scale.set(0.9, 1.05, 0.85);
  elbow.add(hand);
  const grip = new THREE.Group();
  grip.position.set(0, -0.58, 0.05);
  elbow.add(grip);
  shoulder.userData = {upper, elbow, side, grip};
  return shoulder;
}

export function setLimb(a, {raise = 0.1, forward = 0, bend = 0} = {}) {
  const {upper, elbow, side} = a.userData;
  upper.rotation.z = side * -raise;
  upper.rotation.x = -forward;
  elbow.rotation.x = -bend;
}

// ---------- barbeiro ----------
export function makeBarber() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const pivot = new THREE.Group(); // para desmaiar (gira nos pés)
  body.add(pivot);
  for (const s of [-1, 1]) {
    pivot.add(at(rbox(0.4, 1.05, 0.44, 0.12, "#2b2f3a"), s * 0.25, 0.65, 0));
    pivot.add(at(rbox(0.44, 0.2, 0.6, 0.09, "#151515", {coat: 0.9, rough: 0.25}), s * 0.25, 0.1, 0.07));
  }
  // camisa branca + colete listrado
  pivot.add(at(rbox(1.15, 1.25, 0.72, 0.28, "#f4f4f4"), 0, 1.78, 0));
  const vest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.05, 0.06), new THREE.MeshStandardMaterial({map: stripes("#2f6fb5", "#e9eef5", 10), roughness: 0.7}));
  vest.position.set(0, 1.72, 0.37);
  pivot.add(vest);
  const bow = at(rbox(0.3, 0.12, 0.06, 0.04, "#c0392b"), 0, 2.32, 0.38);
  pivot.add(bow);
  // cabeça
  const head = new THREE.Group();
  head.position.set(0, 2.95, 0.02);
  pivot.add(head);
  pivot.add(at(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16), COLORS.skin), 0, 2.45, 0));
  const skull = sphere(0.6, "#e2a37c");
  skull.scale.set(1, 0.98, 0.92);
  head.add(skull);
  const eyes = [], pupils = [], brows = [];
  for (const s of [-1, 1]) {
    const ear = at(sphere(0.12, "#e2a37c"), s * 0.58, -0.04, -0.02);
    ear.scale.set(0.55, 1, 0.8);
    head.add(ear);
    const eye = at(sphere(0.075, "#ffffff", {coat: 0.6}), s * 0.2, 0.06, 0.5);
    eye.scale.set(1, 1.1, 0.5);
    head.add(eye);
    eyes.push(eye);
    const pup = at(sphere(0.045, "#1a1a1a", {coat: 0.9}), s * 0.2, 0.06, 0.54);
    pup.scale.set(1, 1.1, 0.5);
    head.add(pup);
    pupils.push(pup);
    const brow = at(rbox(0.17, 0.045, 0.04, 0.02, "#1d1410"), s * 0.2, 0.21, 0.52);
    brow.userData.side = s;
    head.add(brow);
    brows.push(brow);
    const ck = at(sphere(0.08, COLORS.cheek, {coat: 0}), s * 0.32, -0.12, 0.44);
    ck.scale.set(1, 0.65, 0.35);
    head.add(ck);
  }
  head.add(at(sphere(0.09, "#d98e6a"), 0, -0.06, 0.57));
  // bigode enrolado
  const stache = new THREE.Group();
  stache.position.set(0, -0.19, 0.53);
  head.add(stache);
  for (const s of [-1, 1]) {
    const m = at(sphere(0.075, "#1d1410", {coat: 0.2}), s * 0.1, 0, 0);
    m.scale.set(1.5, 0.55, 0.6);
    stache.add(m);
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.022, 8, 16, Math.PI * 1.4), mat("#1d1410"));
    curl.position.set(s * 0.25, 0.04, 0);
    curl.rotation.z = s > 0 ? -0.3 : Math.PI + 0.3;
    stache.add(curl);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.017, 8, 20, Math.PI), mat("#5a1f1f"));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.3, 0.52);
  head.add(smile);
  const mouthO = at(sphere(0.075, "#3a1414"), 0, -0.33, 0.52);
  mouthO.scale.set(1, 1.3, 0.4);
  head.add(mouthO);
  const mouthFlat = at(rbox(0.18, 0.035, 0.03, 0.015, "#3a1414"), 0, -0.31, 0.54);
  head.add(mouthFlat);
  // cabelo preto penteado com gel + pente atrás da orelha
  const hair = at(sphere(0.63, "#16110d", {coat: 0.9, rough: 0.2}), 0, 0.16, -0.08);
  hair.scale.set(1.02, 0.72, 0.95);
  head.add(hair);
  const part = at(rbox(0.6, 0.02, 0.5, 0.01, "#3a2b22"), 0.12, 0.6, -0.05);
  head.add(part);
  const comb = at(rbox(0.05, 0.36, 0.08, 0.02, "#2f7df6"), 0.62, 0.15, -0.1);
  comb.rotation.z = 0.3;
  head.add(comb);
  // gotas de suor (pânico)
  const sweat = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshPhysicalMaterial({color: "#8fd3ff", roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9}));
    d.scale.set(1, 1.4, 1);
    head.add(d);
    sweat.push(d);
  }
  const arms = [1, -1].map((sx) => {
    const a = arm("#f4f4f4", sx > 0 ? -1 : 1);
    a.position.set(sx * 0.7, 2.25, 0);
    pivot.add(a);
    return a;
  });
  const setMood = (m, t = 0) => {
    const panic = m === "panico";
    smile.visible = m === "feliz";
    mouthO.visible = m === "surpreso" || panic;
    mouthFlat.visible = m === "bravo";
    for (const e of eyes) e.scale.set(panic ? 1.35 : 1, panic ? 1.5 : 1.1, 0.5);
    for (const p of pupils) p.scale.set(panic ? 0.6 : 1, panic ? 0.66 : 1.1, 0.5);
    for (const b of brows) {
      const sd = b.userData.side;
      b.rotation.z = m === "bravo" ? sd * 0.4 : panic ? sd * -0.35 : sd * -0.08;
      b.position.y = m === "surpreso" || panic ? 0.3 : m === "bravo" ? 0.17 : 0.21;
    }
    sweat.forEach((d, i) => {
      d.visible = panic;
      if (!panic) return;
      const u = ((t / 18 + i / 6) % 1);
      const s = i % 2 ? 1 : -1;
      d.position.set(s * (0.45 + u * 0.4), 0.35 - u * 0.9 + Math.sin(u * Math.PI) * 0.3, 0.2);
    });
  };
  setMood("feliz");
  root.userData.parts = {body, pivot, head, arms, setMood, stache};
  return root;
}

// ---------- pato ----------
export function makeDuck() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const b = sphere(0.55, "#ffd23f");
  b.scale.set(1, 0.8, 1.3);
  b.position.y = 0.75;
  body.add(b);
  const tail = at(sphere(0.2, "#ffd23f"), 0, 0.95, -0.7);
  tail.scale.set(1, 0.6, 1);
  body.add(tail);
  const head = new THREE.Group();
  head.position.set(0, 1.45, 0.45);
  body.add(head);
  head.add(sphere(0.38, "#ffd23f"));
  const beak = at(sphere(0.18, "#ff8f1f"), 0, -0.05, 0.36);
  beak.scale.set(1.3, 0.5, 1.2);
  head.add(beak);
  for (const s of [-1, 1]) {
    head.add(at(sphere(0.07, "#ffffff"), s * 0.15, 0.1, 0.3));
    head.add(at(sphere(0.045, "#111111"), s * 0.15, 0.1, 0.35));
  }
  // topete (cabelo branco do Professor!)
  const quiff = new THREE.Group();
  quiff.position.set(0, 0.32, 0);
  head.add(quiff);
  for (let i = 0; i < 9; i++) {
    const t = at(sphere(0.14 + (i % 3) * 0.03, COLORS.hair, {coat: 0.1, rough: 0.85}), Math.sin(i * 1.3) * 0.15, 0.05 + i * 0.06, 0.1 + i * 0.05);
    quiff.add(t);
  }
  quiff.visible = false;
  const wings = [-1, 1].map((s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.5, 0.85, 0);
    const m = sphere(0.3, "#f5c518");
    m.scale.set(0.35, 0.7, 1.1);
    m.position.y = -0.1;
    w.add(m);
    body.add(w);
    return w;
  });
  const feet = [-1, 1].map((s) => {
    const f = new THREE.Group();
    f.position.set(s * 0.22, 0.2, 0.1);
    f.add(at(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), "#ff8f1f"), 0, 0, 0));
    f.add(at(rbox(0.25, 0.05, 0.3, 0.02, "#ff8f1f"), 0, -0.13, 0.08));
    body.add(f);
    return f;
  });
  root.userData.parts = {body, head, wings, feet, quiff};
  return root;
}

// ---------- leão ----------
export function makeLion() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const tan = "#e0a85a";
  const torso = at(capsule(0.55, 1.0, tan), 0, 1.2, -0.1);
  torso.rotation.x = Math.PI / 2;
  body.add(torso);
  for (const [x, z] of [[-0.35, 0.45], [0.35, 0.45], [-0.35, -0.65], [0.35, -0.65]]) {
    body.add(at(capsule(0.17, 0.55, tan), x, 0.45, z));
    body.add(at(sphere(0.2, "#f0c07a"), x, 0.12, z + 0.05));
  }
  const tail = new THREE.Group();
  tail.position.set(0, 1.35, -0.95);
  body.add(tail);
  const tl = at(capsule(0.06, 0.7, tan), 0, 0.2, -0.3);
  tl.rotation.x = -0.9;
  tail.add(tl);
  tail.add(at(sphere(0.16, "#8a4a1c"), 0, 0.5, -0.6));
  const head = new THREE.Group();
  head.position.set(0, 2.05, 0.75);
  body.add(head);
  const mane = new THREE.Group();
  head.add(mane);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    mane.add(at(sphere(0.3, i % 2 ? "#a0521f" : "#c06a28", {coat: 0.1, rough: 0.85}), Math.cos(a) * 0.62, Math.sin(a) * 0.62, -0.15));
  }
  mane.add(at(sphere(0.6, "#a0521f", {rough: 0.85}), 0, 0, -0.3));
  head.add(sphere(0.5, tan));
  for (const s of [-1, 1]) {
    head.add(at(sphere(0.14, tan), s * 0.42, 0.42, -0.05));
    head.add(at(sphere(0.08, "#ffffff"), s * 0.18, 0.12, 0.42));
    head.add(at(sphere(0.05, "#1a1a1a"), s * 0.18, 0.12, 0.47));
  }
  const muzzle = at(sphere(0.25, "#f6dcae"), 0, -0.15, 0.38);
  muzzle.scale.set(1.2, 0.75, 0.8);
  head.add(muzzle);
  head.add(at(sphere(0.09, "#3a2416"), 0, -0.05, 0.6));
  const mouth = at(sphere(0.12, "#5a1f1f"), 0, -0.3, 0.5);
  mouth.scale.set(1.2, 0.2, 0.5);
  head.add(mouth);
  root.userData.parts = {body, head, mane, tail, mouth};
  return root;
}
