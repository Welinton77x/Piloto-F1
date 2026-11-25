// Padeiro, pães e objetos da padaria — mesmo estilo de brinquedo do Professor.
import * as THREE from "three";
import {mat, mesh, rbox, sphere, capsule, at, COLORS} from "./professor.js";


export const C = {
  bread: "#d9963f",
  breadDark: "#9c5a22",
  breadLight: "#ecd3a0",
  breadPale: "#f3ead6",
  breadOld: "#b39a72",
  crust: "#f0c27a",
  wood: "#6b4128",
  woodLight: "#8a5a3a",
  band: "#f5c518",
  paper: "#c89a63",
  paperDark: "#a97c49",
  steel: "#b9c0c8",
};

// ---------- texto em textura ----------
export function textTexture(lines, {w = 512, h = 128, bg = null, color = "#1b1b1b", font = "900 80px MontserratLocal, Arial", stroke = null, align = "center"} = {}) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d");
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
  }
  g.font = font;
  g.textAlign = align;
  g.textBaseline = "middle";
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((t, i) => {
    const y = (h / (arr.length + 1)) * (i + 1);
    if (stroke) {
      g.lineWidth = 10;
      g.strokeStyle = stroke;
      g.strokeText(t, align === "center" ? w / 2 : 20, y);
    }
    g.fillStyle = color;
    g.fillText(t, align === "center" ? w / 2 : 20, y);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function labelPlane(tex, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex, roughness: 0.6}));
  m.receiveShadow = true;
  return m;
}

// ---------- pão francês ----------
/** Pão francês: corpo alongado + pestana. userData.setSag(0..1), setColor(hex). */
export function makeBread(color = C.bread, {face = false, scale = 1} = {}) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const bodyMat = new THREE.MeshPhysicalMaterial({color, roughness: 0.6, clearcoat: 0.25});
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 18), bodyMat);
  body.scale.set(1.75, 0.82, 0.95);
  body.castShadow = true;
  inner.add(body);
  const ridgeMat = new THREE.MeshPhysicalMaterial({color: new THREE.Color(color).lerp(new THREE.Color("#fff1cf"), 0.45), roughness: 0.7});
  const ridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 6, 12), ridgeMat);
  ridge.rotation.z = Math.PI / 2;
  ridge.rotation.y = 0.18;
  ridge.position.y = 0.16;
  ridge.scale.set(1, 1, 0.6);
  inner.add(ridge);
  if (face) {
    for (const s of [-1, 1]) inner.add(at(sphere(0.03, "#222222"), s * 0.09, 0.03, 0.2));
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12, Math.PI), mat("#5a1f1f"));
    m.position.set(0, -0.05, 0.205);
    inner.add(m);
    for (const s of [-1, 1]) {
      const t = at(sphere(0.012, "#7ec8ff", {emissive: "#7ec8ff", ei: 0.3}), s * 0.1, -0.03, 0.205);
      t.visible = true;
      inner.add(t);
    }
  }
  g.scale.setScalar(scale);
  g.userData.setSag = (k) => {
    inner.scale.set(1 + 0.25 * k, 1 - 0.55 * k, 1 + 0.1 * k);
    inner.position.y = -0.1 * k;
  };
  g.userData.setColor = (hex) => {
    bodyMat.color.set(hex);
    ridgeMat.color.set(new THREE.Color(hex).lerp(new THREE.Color("#fff1cf"), 0.45));
  };
  g.userData.halves = null;
  return g;
}

/** Pão partido ao meio: duas metades com miolo à mostra. userData.setSplit(d). */
export function makeSplitBread() {
  const g = new THREE.Group();
  const halves = [-1, 1].map((s) => {
    const h = new THREE.Group();
    const crustHalf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 18, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), new THREE.MeshPhysicalMaterial({color: C.bread, roughness: 0.6, clearcoat: 0.25}));
    crustHalf.scale.set(1.75, 0.82, 0.95);
    crustHalf.castShadow = true;
    const crumb = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), mat("#fbe7c0", {coat: 0}));
    crumb.scale.set(0.94, 0.8, 1);
    crumb.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    h.add(crustHalf, crumb);
    g.add(h);
    return h;
  });
  g.userData.setSplit = (d) => {
    halves[0].position.x = -d / 2;
    halves[1].position.x = d / 2;
    halves[0].rotation.z = d * 0.6;
    halves[1].rotation.z = -d * 0.6;
  };
  g.userData.setSplit(0);
  return g;
}

// ---------- sacos ----------
export function makePaperBag(w = 0.55, h = 0.75, d = 0.35) {
  const g = new THREE.Group();
  g.add(at(rbox(w, h, d, 0.03, C.paper, {coat: 0, rough: 0.9}), 0, h / 2, 0));
  const fold = at(rbox(w + 0.02, 0.12, d + 0.02, 0.02, C.paperDark, {coat: 0, rough: 0.9}), 0, h - 0.02, 0);
  g.add(fold);
  g.add(at(rbox(w * 0.7, 0.02, 0.01, 0.005, C.paperDark), 0, h * 0.35, d / 2 + 0.005));
  g.userData.fold = fold;
  return g;
}

export function makePlasticBag() {
  const g = new THREE.Group();
  const m = new THREE.MeshPhysicalMaterial({color: "#e8f3ff", transparent: true, opacity: 0.45, roughness: 0.15, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide});
  const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 8, 20), m);
  bag.rotation.z = Math.PI / 2;
  bag.scale.set(0.85, 1, 0.75);
  bag.position.y = 0.27;
  g.add(bag);
  const knot = at(sphere(0.07, "#e8f3ff"), 0.68, 0.3, 0);
  knot.material = m;
  g.add(knot);
  return g;
}

// ---------- padeiro ----------
function bakerArm(side) {
  const shoulder = new THREE.Group();
  const upper = new THREE.Group();
  shoulder.add(upper);
  upper.add(at(capsule(0.16, 0.3, "#f07a2a"), 0, -0.25, 0));
  const elbow = new THREE.Group();
  elbow.position.y = -0.5;
  upper.add(elbow);
  elbow.add(at(capsule(0.14, 0.3, COLORS.skin), 0, -0.2, 0));
  const hand = at(sphere(0.13, COLORS.skin), 0, -0.5, 0.02);
  hand.scale.set(0.9, 1.05, 0.85);
  elbow.add(hand);
  const grip = new THREE.Group();
  grip.position.set(0, -0.58, 0.05);
  elbow.add(grip);
  shoulder.userData = {upper, elbow, side, grip};
  return shoulder;
}

export function makeBaker() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  for (const s of [-1, 1]) {
    body.add(at(rbox(0.4, 1.05, 0.44, 0.12, "#3b3f4a"), s * 0.25, 0.65, 0));
    body.add(at(rbox(0.44, 0.2, 0.6, 0.09, "#2a2a2a", {coat: 0.8, rough: 0.3}), s * 0.25, 0.1, 0.07));
  }
  // tronco (camiseta laranja) + avental branco
  body.add(at(rbox(1.15, 1.25, 0.72, 0.28, "#f07a2a"), 0, 1.78, 0));
  body.add(at(rbox(0.9, 1.15, 0.06, 0.04, "#fbfbf8"), 0, 1.6, 0.36));
  body.add(at(rbox(0.5, 0.25, 0.03, 0.02, "#e6e6e0"), 0, 1.35, 0.4));
  for (const s of [-1, 1]) {
    const strap = at(rbox(0.06, 0.5, 0.03, 0.01, "#fbfbf8"), s * 0.32, 2.3, 0.33);
    strap.rotation.z = s * 0.25;
    body.add(strap);
  }
  // cabeça
  const head = new THREE.Group();
  head.position.set(0, 2.95, 0.02);
  body.add(head);
  body.add(at(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16), COLORS.skin), 0, 2.45, 0));
  const skull = sphere(0.6, "#e9a77f");
  skull.scale.set(1, 0.96, 0.92);
  head.add(skull);
  for (const s of [-1, 1]) {
    const ear = at(sphere(0.12, "#e9a77f"), s * 0.58, -0.04, -0.02);
    ear.scale.set(0.55, 1, 0.8);
    head.add(ear);
    const eye = at(sphere(0.075, "#ffffff", {coat: 0.6}), s * 0.2, 0.06, 0.5);
    eye.scale.set(1, 1.1, 0.5);
    head.add(eye);
    const pup = at(sphere(0.045, "#1a1a1a", {coat: 0.9}), s * 0.2, 0.06, 0.54);
    pup.scale.set(1, 1.1, 0.5);
    head.add(pup);
    head.add(at(sphere(0.014, "#ffffff", {emissive: "#ffffff", ei: 0.6}), s * 0.2 + 0.02, 0.09, 0.565));
    const brow = at(rbox(0.16, 0.04, 0.04, 0.02, "#3a2416"), s * 0.2, 0.2, 0.52);
    brow.rotation.z = s * -0.08;
    head.add(brow);
    const ck = at(sphere(0.08, COLORS.cheek, {coat: 0}), s * 0.32, -0.12, 0.44);
    ck.scale.set(1, 0.65, 0.35);
    head.add(ck);
  }
  const nose = at(sphere(0.09, "#e39470"), 0, -0.06, 0.57);
  head.add(nose);
  // bigode preto e sorriso
  for (const s of [-1, 1]) {
    const m = at(sphere(0.07, "#2b1a10", {coat: 0}), s * 0.09, -0.18, 0.53);
    m.scale.set(1.4, 0.6, 0.6);
    m.rotation.z = s * 0.25;
    head.add(m);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.017, 8, 20, Math.PI), mat("#5a1f1f"));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.28, 0.52);
  head.add(smile);
  // cabelo castanho + chapéu de cozinheiro
  const hair = at(sphere(0.62, "#3a2416", {coat: 0.1}), 0, 0.12, -0.06);
  hair.scale.set(1.02, 0.75, 0.95);
  head.add(hair);
  const band = at(mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.25, 32), "#fbfbf8"), 0, 0.5, -0.02);
  head.add(band);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    head.add(at(sphere(0.3, "#ffffff", {coat: 0.2}), Math.cos(a) * 0.3, 0.82, Math.sin(a) * 0.3 - 0.02));
  }
  head.add(at(sphere(0.36, "#ffffff", {coat: 0.2}), 0, 0.95, -0.02));
  // braços
  const arms = [1, -1].map((sx) => {
    const a = bakerArm(sx > 0 ? -1 : 1);
    a.position.set(sx * 0.7, 2.25, 0);
    body.add(a);
    return a;
  });
  root.userData.parts = {body, head, arms};
  return root;
}

export function setBakerArm(arm, {raise = 0.1, forward = 0, bend = 0} = {}) {
  const {upper, elbow, side} = arm.userData;
  upper.rotation.z = side * -raise;
  upper.rotation.x = -forward;
  elbow.rotation.x = -bend;
}

// ---------- pegador ----------
export function makeTongs() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const b = at(rbox(0.04, 0.6, 0.02, 0.01, C.steel, {metal: 0.8, rough: 0.3}), s * 0.04, -0.3, 0);
    b.rotation.z = s * 0.08;
    g.add(b);
  }
  return g;
}

// ---------- lâmpada (para a cena final) ----------
export function makeBulb() {
  const b = new THREE.Group();
  b.add(sphere(0.16, COLORS.bulb, {emissive: "#ffd23f", ei: 0.9, coat: 1}));
  b.add(at(mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.12, 16), "#9aa0a8", {metal: 0.7}), 0, -0.18, 0));
  return b;
}
