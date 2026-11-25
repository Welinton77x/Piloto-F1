// Professor — personagem 3D estilizado (formas arredondadas, visual de brinquedo).
// makeProfessor({pose, mood}) devolve um THREE.Group com os pés em y = 0, olhando para +Z.
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

export const COLORS = {
  skin: "#f2b48f",
  cheek: "#f28c8c",
  hair: "#eef0f2",
  hairShade: "#cfd4da",
  brow: "#c9ccd1",
  coat: "#f4f5f2",
  coatShade: "#dfe2de",
  vest: "#4a4f58",
  shirt: "#ffffff",
  tie: "#7a5a3c",
  tieDot: "#c8a173",
  pants: "#3a3d45",
  shoe: "#6b3a22",
  sole: "#2a1a12",
  glasses: "#9a5a32",
  eye: "#ffffff",
  iris: "#4a3a22",
  pupil: "#111111",
  mouth: "#5a1f1f",
  tongue: "#ff7a85",
  book: "#c0392b",
  page: "#fff6df",
  bulb: "#ffe27a",
};

const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: opts.rough ?? 0.55,
        metalness: opts.metal ?? 0,
        clearcoat: opts.coat ?? 0.35,
        clearcoatRoughness: 0.4,
        emissive: opts.emissive ?? "#000000",
        emissiveIntensity: opts.ei ?? 0,
      }),
    );
  }
  return matCache.get(key);
}

function mesh(geo, color, opts) {
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const rbox = (w, h, d, r, color, opts) => mesh(new RoundedBoxGeometry(w, h, d, 4, r), color, opts);
const sphere = (r, color, opts) => mesh(new THREE.SphereGeometry(r, 32, 24), color, opts);
const capsule = (r, l, color, opts) => mesh(new THREE.CapsuleGeometry(r, l, 8, 20), color, opts);
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

// gerador pseudoaleatório fixo, para o cabelo sair sempre igual
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const MOODS = {
  feliz: {eye: 1, brow: 0, browY: 0, mouth: "smile", closed: false},
  surpreso: {eye: 1.25, brow: -0.15, browY: 0.07, mouth: "o", closed: false},
  bravo: {eye: 0.9, brow: 0.45, browY: -0.03, mouth: "flat", closed: false},
  eureka: {eye: 1.1, brow: -0.1, browY: 0.05, mouth: "grin", closed: false, spiky: true, bulb: true},
  sereno: {eye: 1, brow: 0, browY: 0, mouth: "smile", closed: true},
  pensativo: {eye: 0.95, brow: 0.2, browY: 0.02, mouth: "hmm", closed: false, look: 0.6},
};

function buildHead(moodName) {
  const m = MOODS[moodName] ?? MOODS.feliz;
  const head = new THREE.Group();

  // crânio
  const skull = sphere(0.62, COLORS.skin);
  skull.scale.set(1, 0.97, 0.92);
  head.add(skull);

  // orelhas
  for (const s of [-1, 1]) {
    const ear = at(sphere(0.12, COLORS.skin), s * 0.6, -0.04, -0.02);
    ear.scale.set(0.55, 1, 0.8);
    head.add(ear);
  }

  // nariz grande e redondo
  const nose = at(sphere(0.115, "#f0a07f"), 0, -0.08, 0.58);
  nose.scale.set(1, 0.95, 0.9);
  head.add(nose);

  // bochechas
  for (const s of [-1, 1]) {
    const ck = at(sphere(0.085, COLORS.cheek, {coat: 0}), s * 0.32, -0.15, 0.45);
    ck.scale.set(1, 0.65, 0.35);
    ck.material = ck.material.clone();
    ck.material.transparent = true;
    ck.material.opacity = 0.75;
    head.add(ck);
  }

  // rugas na testa
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.02, 0.007, 6, 24, Math.PI * 0.7), mat("#d98f6c", {coat: 0}));
    w.position.set(0, 0.3 + i * 0.055, 0.5 - i * 0.035);
    w.rotation.set(-0.45 - i * 0.08, 0, Math.PI * 0.15);
    head.add(w);
  }

  // olhos
  const look = m.look ?? 0;
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * 0.2, 0.07, 0.5);
    if (m.closed) {
      const lid = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 6, 16, Math.PI), mat("#3a2a20"));
      lid.rotation.z = Math.PI;
      lid.position.z = 0.05;
      g.add(lid);
    } else {
      const white = sphere(0.095, COLORS.eye, {coat: 0.6});
      white.scale.set(1, 1.08 * m.eye, 0.55);
      g.add(white);
      const iris = at(sphere(0.06, COLORS.iris, {coat: 0.8}), look * 0.03, 0, 0.035);
      iris.scale.set(1, 1.05 * Math.min(1.1, m.eye), 0.5);
      g.add(iris);
      const pupil = at(sphere(0.036, COLORS.pupil, {coat: 0.9}), look * 0.03, 0, 0.055);
      pupil.scale.set(1, 1, 0.5);
      g.add(pupil);
      const hl = at(sphere(0.016, "#ffffff", {emissive: "#ffffff", ei: 0.6}), look * 0.03 + 0.02, 0.025, 0.07);
      g.add(hl);
    }
    // óculos redondos
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.017, 10, 40), mat(COLORS.glasses, {metal: 0.6, rough: 0.35}));
    rim.position.z = 0.07;
    rim.castShadow = true;
    g.add(rim);
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.145, 32),
      new THREE.MeshPhysicalMaterial({color: "#dff2ff", transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1}),
    );
    lens.position.z = 0.072;
    g.add(lens);
    // haste lateral
    const arm = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), COLORS.glasses, {metal: 0.6});
    arm.rotation.x = Math.PI / 2;
    arm.position.set(s * 0.15, 0, -0.14);
    arm.rotation.y = s * 0.25;
    g.add(arm);
    // sobrancelha espessa (tufos)
    const brow = new THREE.Group();
    brow.position.set(0, 0.2 + m.browY, 0.02);
    brow.rotation.z = s * m.brow;
    for (let i = 0; i < 5; i++) {
      const t = (i - 2) / 2;
      const tuft = at(sphere(0.045, COLORS.brow, {coat: 0}), t * 0.085, -Math.abs(t) * 0.02 + (i % 2) * 0.012, 0);
      tuft.scale.set(1.3, 0.75, 0.6);
      brow.add(tuft);
    }
    g.add(brow);
    head.add(g);
  }
  // ponte dos óculos
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16, Math.PI), mat(COLORS.glasses, {metal: 0.6, rough: 0.35}));
  bridge.position.set(0, 0.1, 0.58);
  head.add(bridge);

  // bigode volumoso
  const stache = new THREE.Group();
  stache.position.set(0, -0.2, 0.52);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const p = at(sphere(0.075 - i * 0.008, COLORS.hair, {coat: 0}), s * (0.05 + i * 0.065), -i * 0.022, -i * 0.025);
      p.scale.set(1.25, 0.8, 0.75);
      stache.add(p);
    }
  }
  head.add(stache);

  // boca
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.33, 0.5);
  if (m.mouth === "smile") {
    const sm = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 20, Math.PI), mat(COLORS.mouth));
    sm.rotation.z = Math.PI;
    sm.position.y = 0.04;
    mouth.add(sm);
  } else if (m.mouth === "grin") {
    const o = sphere(0.09, COLORS.mouth);
    o.scale.set(1.3, 0.75, 0.4);
    mouth.add(o);
    const teeth = at(rbox(0.16, 0.035, 0.02, 0.01, "#ffffff"), 0, 0.035, 0.03);
    mouth.add(teeth);
    const tg = at(sphere(0.05, COLORS.tongue), 0, -0.035, 0.02);
    tg.scale.set(1.2, 0.5, 0.4);
    mouth.add(tg);
  } else if (m.mouth === "o") {
    const o = sphere(0.06, COLORS.mouth);
    o.scale.set(0.85, 1.15, 0.4);
    mouth.add(o);
    const tg = at(sphere(0.035, COLORS.tongue), 0, -0.035, 0.015);
    tg.scale.set(1, 0.5, 0.4);
    mouth.add(tg);
  } else if (m.mouth === "flat") {
    const f = rbox(0.13, 0.025, 0.02, 0.01, COLORS.mouth);
    f.rotation.z = 0.05;
    mouth.add(f);
  } else if (m.mouth === "hmm") {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 16, Math.PI * 0.8), mat(COLORS.mouth));
    f.rotation.z = Math.PI * 1.15;
    f.position.x = 0.05;
    mouth.add(f);
  }
  head.add(mouth);

  // cabelo branco desgrenhado: laterais e nuca volumosas, topo ralo
  const hair = new THREE.Group();
  const r = rng(7);
  const addTuft = (theta, phi, size, out) => {
    // theta: ângulo ao redor do eixo Y (0 = frente), phi: altura (-1..1)
    const y = phi * 0.55;
    const rad = Math.sqrt(Math.max(0, 1 - phi * phi)) * 0.62 + out;
    const x = Math.sin(theta) * rad;
    const z = Math.cos(theta) * rad * 0.92;
    const col = r() > 0.7 ? COLORS.hairShade : COLORS.hair;
    const t = at(sphere(size, col, {coat: 0.1, rough: 0.85}), x, y, z);
    t.scale.set(1, 0.85 + r() * 0.3, 1);
    hair.add(t);
  };
  for (let i = 0; i < 70; i++) {
    const side = r() > 0.5 ? 1 : -1;
    // da têmpora (~70°) até a nuca (180°)
    const theta = side * (1.2 + r() * (Math.PI - 1.2));
    const phi = -0.25 + r() * 0.95;
    addTuft(theta, phi, 0.12 + r() * 0.09, 0.08 + r() * 0.1);
  }
  // topo (mais ralo, um pouco para trás)
  for (let i = 0; i < 16; i++) {
    const theta = (r() - 0.5) * 2 * Math.PI;
    const phi = 0.82 + r() * 0.16;
    if (Math.cos(theta) > 0.6) continue;
    addTuft(theta, phi, 0.1 + r() * 0.06, 0.02);
  }
  // mechas espetadas para os lados
  const spikes = m.spiky ? 16 : 9;
  for (let i = 0; i < spikes; i++) {
    const side = i % 2 ? 1 : -1;
    const theta = side * (1.35 + r() * 1.3);
    const phi = -0.1 + r() * 0.85 + (m.spiky ? 0.15 : 0);
    const y = phi * 0.55;
    const rad = 0.72;
    const len = (m.spiky ? 0.36 : 0.14) + r() * 0.08;
    const cone = mesh(new THREE.ConeGeometry(m.spiky ? 0.07 : 0.06, len, 10), COLORS.hair, {coat: 0.1, rough: 0.85});
    const dir = new THREE.Vector3(Math.sin(theta), phi * 0.9 + (m.spiky ? 0.35 : 0.1), Math.cos(theta) * 0.8).normalize();
    cone.position.set(Math.sin(theta) * rad, y, Math.cos(theta) * rad * 0.92).addScaledVector(dir, len * 0.3);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    hair.add(cone);
  }
  head.add(hair);

  if (m.bulb) {
    const bulb = new THREE.Group();
    bulb.position.set(0.55, 0.95, 0);
    const glass = sphere(0.16, COLORS.bulb, {emissive: "#ffd23f", ei: 0.9, coat: 1});
    bulb.add(glass);
    const base = at(mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.12, 16), "#9aa0a8", {metal: 0.7}), 0, -0.18, 0);
    bulb.add(base);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ray = rbox(0.03, 0.12, 0.03, 0.012, "#ffcc33", {emissive: "#ffcc33", ei: 0.6});
      ray.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0);
      ray.rotation.z = a - Math.PI / 2;
      bulb.add(ray);
    }
    head.add(bulb);
  }
  return head;
}

function buildArm(side, {raise = 0, forward = 0, bend = 0, hold = null}) {
  // side: +1 direita do personagem (x negativo na tela de frente), -1 esquerda
  const shoulder = new THREE.Group();
  const upper = new THREE.Group();
  shoulder.add(upper);
  const sleeve = at(capsule(0.17, 0.42, COLORS.coat), 0, -0.3, 0);
  upper.add(sleeve);
  const elbow = new THREE.Group();
  elbow.position.y = -0.55;
  upper.add(elbow);
  const fore = at(capsule(0.155, 0.3, COLORS.coat), 0, -0.2, 0);
  elbow.add(fore);
  const cuff = at(mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.07, 20), COLORS.coatShade), 0, -0.43, 0);
  elbow.add(cuff);
  const hand = at(sphere(0.13, COLORS.skin), 0, -0.55, 0.02);
  hand.scale.set(0.9, 1.05, 0.85);
  elbow.add(hand);
  const thumb = at(sphere(0.05, COLORS.skin), side * 0.09, -0.5, 0.08);
  thumb.scale.set(1, 1.4, 1);
  elbow.add(thumb);
  if (hold === "book") {
    const book = new THREE.Group();
    book.position.set(0, -0.6, 0.12);
    book.rotation.set(0.1, Math.PI / 2, 0);
    book.add(rbox(0.5, 0.38, 0.1, 0.02, COLORS.book));
    book.add(at(rbox(0.46, 0.34, 0.08, 0.01, COLORS.page), 0.03, 0, 0));
    elbow.add(book);
  }
  if (hold === "point") {
    const finger = at(capsule(0.035, 0.12, COLORS.skin), 0, -0.7, 0.03);
    elbow.add(finger);
  }
  upper.rotation.z = side * -raise;
  upper.rotation.x = -forward;
  elbow.rotation.x = -bend;
  return shoulder;
}

export function makeProfessor({pose = "idle", mood = "feliz"} = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // ---- pernas ----
  const legSwing = pose === "walk" ? 0.35 : 0;
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.24, 1.05, 0);
    hip.rotation.x = s * legSwing;
    const leg = at(rbox(0.38, 0.9, 0.42, 0.12, COLORS.pants), 0, -0.47, 0);
    hip.add(leg);
    const shoe = at(rbox(0.42, 0.2, 0.62, 0.09, COLORS.shoe, {coat: 0.8, rough: 0.3}), 0, -0.95, 0.08);
    hip.add(shoe);
    const sole = at(rbox(0.44, 0.06, 0.64, 0.025, COLORS.sole), 0, -1.04, 0.08);
    hip.add(sole);
    body.add(hip);
  }

  // ---- tronco: colete, camisa, gravata ----
  const torso = new THREE.Group();
  torso.position.y = 1.0;
  body.add(torso);
  const vest = at(rbox(0.98, 1.0, 0.62, 0.2, COLORS.vest), 0, 0.68, 0);
  torso.add(vest);
  // botões do colete
  for (let i = 0; i < 4; i++) torso.add(at(sphere(0.03, "#22252b", {coat: 0.9}), 0.08, 0.95 - i * 0.16, 0.315));
  // gola da camisa (V branco)
  for (const s of [-1, 1]) {
    const col = at(rbox(0.16, 0.26, 0.04, 0.02, COLORS.shirt), s * 0.1, 1.08, 0.3);
    col.rotation.z = s * 0.55;
    torso.add(col);
  }
  const knot = at(rbox(0.11, 0.09, 0.06, 0.03, COLORS.tie), 0, 1.07, 0.33);
  torso.add(knot);
  const tie = at(rbox(0.13, 0.42, 0.04, 0.03, COLORS.tie), 0, 0.82, 0.325);
  torso.add(tie);
  for (let i = 0; i < 6; i++) torso.add(at(sphere(0.012, COLORS.tieDot, {coat: 0}), ((i % 2) - 0.5) * 0.06, 0.98 - i * 0.07, 0.35));

  // ---- jaleco (painéis abertos na frente) ----
  const coat = new THREE.Group();
  torso.add(coat);
  const back = at(rbox(1.18, 1.5, 0.3, 0.14, COLORS.coat), 0, 0.42, -0.24);
  coat.add(back);
  for (const s of [-1, 1]) {
    const side = at(rbox(0.36, 1.5, 0.72, 0.14, COLORS.coat), s * 0.42, 0.42, 0.0);
    coat.add(side);
    // lapela
    const lap = at(rbox(0.13, 0.62, 0.05, 0.03, COLORS.coatShade), s * 0.27, 0.86, 0.37);
    lap.rotation.z = s * 0.2;
    coat.add(lap);
    // bolso
    coat.add(at(rbox(0.26, 0.24, 0.04, 0.03, COLORS.coatShade), s * 0.43, 0.06, 0.37));
    // botão
    coat.add(at(sphere(0.03, "#c7cbd0", {coat: 0.9}), s * 0.3, 0.42, 0.37));
  }
  // bolso do peito com caneta
  coat.add(at(rbox(0.2, 0.16, 0.04, 0.02, COLORS.coatShade), -0.43, 0.82, 0.37));
  coat.add(at(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 10), "#2d6cdf"), -0.38, 0.92, 0.38));
  // fenda nas costas
  coat.add(at(rbox(0.03, 0.55, 0.02, 0.01, COLORS.coatShade), 0, -0.05, -0.39));
  // ombros arredondados
  for (const s of [-1, 1]) coat.add(at(sphere(0.22, COLORS.coat), s * 0.55, 1.05, 0));

  // ---- braços ----
  const armCfg = {
    idle: [{raise: 0.08}, {raise: 0.08}],
    point: [{raise: 0.08}, {raise: 1.0, forward: 0.9, bend: 0.9, hold: "point"}],
    walk: [{raise: 0.1, forward: -0.35, hold: "book", bend: 0.3}, {raise: 0.1, forward: 0.35}],
    side: [{raise: 0.06, bend: 0.25, hold: "book"}, {raise: 0.06}],
    eureka: [{raise: 2.5, bend: 0.2}, {raise: 2.5, bend: 0.2}],
  }[pose === "back" ? "idle" : pose] ?? [{raise: 0.08}, {raise: 0.08}];
  // índice 0 = braço esquerdo do personagem (x positivo), 1 = direito (x negativo)
  [1, -1].forEach((sx, i) => {
    const side = sx > 0 ? -1 : 1;
    const arm = buildArm(side, armCfg[i]);
    arm.position.set(sx * 0.66, 2.05, 0);
    body.add(arm);
  });

  // ---- cabeça ----
  const head = buildHead(mood);
  head.position.set(0, 2.85, 0.02);
  head.scale.setScalar(1.08);
  if (pose === "walk") head.rotation.z = 0.05;
  if (mood === "pensativo") head.rotation.z = -0.12;
  body.add(head);
  // pescoço
  body.add(at(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16), COLORS.skin), 0, 2.18, 0));

  if (pose === "walk") body.rotation.x = 0.05;
  return root;
}
