// Sala de aula: quadro-negro (redesenhável), carteiras, 6 alunos, mesa do professor, material escolar com rosto.
import * as THREE from "three";
import {makeProfessor, mat, mesh, rbox, sphere, capsule, at, COLORS} from "./professor.js";
import {makeDuck, makeBarber} from "./characters.js";

export const BOARD = {x: 0, y: 3.5, z: -4.3, w: 7.0, h: 3.0};
export const TDESK = {x: 2.9, z: -2.4};
export const SEATS = [
  [-2.6, 0.4], [0, 0.4], [2.6, 0.4],
  [-2.6, 2.8], [0, 2.8], [2.6, 2.8],
]; // [x, z]; o aluno da pergunta é o índice 1
export const ASKER = 1;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const box = (w, h, d, c, o) => mesh(new THREE.BoxGeometry(w, h, d), c, o);

/** Rostinho simples (olhos + boca) num grupo; m: feliz | bravo | surpreso. */
function addFace(g, s = 1, z = 0.2) {
  const face = new THREE.Group();
  face.position.z = z;
  face.scale.setScalar(s);
  g.add(face);
  const eyes = [-1, 1].map((k) => {
    const e = at(sphere(0.06, "#ffffff", {coat: 0.5}), k * 0.1, 0.04, 0);
    e.scale.set(1, 1.2, 0.5);
    face.add(e);
    face.add(at(sphere(0.035, "#111", {coat: 0.9}), k * 0.1, 0.04, 0.03));
    return e;
  });
  const brows = [-1, 1].map((k) => {
    const b = at(rbox(0.12, 0.03, 0.02, 0.01, "#222"), k * 0.1, 0.15, 0.02);
    b.userData.k = k;
    face.add(b);
    return b;
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 14, Math.PI), mat("#5a1f1f"));
  smile.rotation.z = Math.PI;
  smile.position.y = -0.08;
  face.add(smile);
  const o = at(sphere(0.05, "#3a1414"), 0, -0.1, 0.01);
  o.scale.set(1, 1.3, 0.4);
  face.add(o);
  const flat = at(rbox(0.12, 0.025, 0.02, 0.01, "#3a1414"), 0, -0.1, 0.01);
  face.add(flat);
  face.userData.set = (m) => {
    smile.visible = m === "feliz";
    o.visible = m === "surpreso";
    flat.visible = m === "bravo";
    for (const b of brows) {
      b.rotation.z = m === "bravo" ? b.userData.k * 0.45 : 0;
      b.position.y = m === "surpreso" ? 0.2 : m === "bravo" ? 0.13 : 0.15;
    }
  };
  face.userData.set("feliz");
  return face;
}

// ---------- aluno ----------
const SHIRTS = ["#ff7a59", "#2f7df6", "#2fb84f", "#ffd21f", "#8e44ad", "#00b3b3"];
const HAIRS = ["#3a2416", "#16110d", "#c07a2c", "#3a2416", "#16110d", "#8a4a1c"];
const SKINS = ["#f2c09a", "#c98a5e", "#f2c09a", "#8d5a3b", "#e9b08a", "#f2c09a"];
function limb(color, side, skin) {
  const sh = new THREE.Group();
  const up = new THREE.Group();
  sh.add(up);
  up.add(at(capsule(0.12, 0.25, color), 0, -0.2, 0));
  const el = new THREE.Group();
  el.position.y = -0.42;
  up.add(el);
  el.add(at(capsule(0.1, 0.22, color), 0, -0.15, 0));
  el.add(at(sphere(0.1, skin), 0, -0.38, 0.02));
  const grip = new THREE.Group();
  grip.position.set(0, -0.45, 0.05);
  el.add(grip);
  sh.userData = {up, el, side, grip};
  return sh;
}
export function setLimb(a, {raise = 0.1, forward = 0, bend = 0} = {}) {
  a.userData.up.rotation.z = a.userData.side * -raise;
  a.userData.up.rotation.x = -forward;
  a.userData.el.rotation.x = -bend;
}
function makeStudent(i) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shirt = SHIRTS[i % 6], skin = SKINS[i % 6];
  const hips = [-1, 1].map((s) => {
    const h = new THREE.Group();
    h.position.set(s * 0.18, 0.9, 0);
    h.add(at(rbox(0.28, 0.8, 0.32, 0.1, "#2b3a5a"), 0, -0.42, 0));
    h.add(at(rbox(0.32, 0.15, 0.45, 0.07, "#f4f4f4"), 0, -0.84, 0.06));
    body.add(h);
    return h;
  });
  body.add(at(rbox(0.85, 0.95, 0.55, 0.22, shirt), 0, 1.35, 0));
  const head = new THREE.Group();
  head.position.set(0, 2.2, 0.02);
  body.add(head);
  head.add(sphere(0.48, skin));
  for (const s of [-1, 1]) {
    const ear = at(sphere(0.1, skin), s * 0.47, -0.03, 0);
    ear.scale.set(0.55, 1, 0.8);
    head.add(ear);
    const ck = at(sphere(0.06, COLORS.cheek, {coat: 0}), s * 0.27, -0.12, 0.36);
    ck.scale.set(1, 0.65, 0.35);
    head.add(ck);
  }
  const hair = at(sphere(0.5, HAIRS[i % 6], {coat: 0.2}), 0, 0.13, -0.05);
  hair.scale.set(1.02, 0.72, 0.95);
  head.add(hair);
  const face = addFace(head, 1.15, 0.4);
  // boné vermelho (aluno da pergunta)
  const cap = new THREE.Group();
  cap.add(at(sphere(0.5, "#e53935", {coat: 0.4}), 0, 0.3, -0.04));
  cap.children[0].scale.set(1, 0.6, 1);
  cap.add(at(rbox(0.55, 0.05, 0.4, 0.02, "#e53935"), 0, 0.33, 0.42));
  head.add(cap);
  cap.visible = i === ASKER;
  // disfarce: óculos redondos + bigode branco (reviravolta)
  const disguise = new THREE.Group();
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 8, 24), mat("#9a5a32", {metal: 0.6}));
    r.position.set(s * 0.13, 0.05, 0.46);
    disguise.add(r);
    const m = at(sphere(0.08, COLORS.hair, {coat: 0}), s * 0.08, -0.12, 0.44);
    m.scale.set(1.4, 0.7, 0.7);
    disguise.add(m);
  }
  head.add(disguise);
  disguise.visible = false;
  const arms = [1, -1].map((sx) => {
    const a = limb(shirt, sx > 0 ? -1 : 1, skin);
    a.position.set(sx * 0.55, 1.7, 0);
    body.add(a);
    return a;
  });
  // celular e livro (na mão direita)
  const phone = new THREE.Group();
  phone.add(at(rbox(0.22, 0.4, 0.04, 0.03, "#1d1d1d"), 0, -0.15, 0));
  phone.add(at(mesh(new THREE.PlaneGeometry(0.18, 0.34), "#7cc4f2", {emissive: "#7cc4f2", ei: 0.8}), 0, -0.15, 0.025));
  arms[1].userData.grip.add(phone);
  phone.visible = false;
  root.userData.parts = {body, hips, head, arms, face, cap, disguise, phone};
  return root;
}

// ---------- material escolar com rosto ----------
function makeChalk() {
  const g = new THREE.Group();
  const halves = [-1, 1].map((s) => {
    const h = new THREE.Group();
    const p = at(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 16), "#fbfbf8"), 0, s * 0.11, 0);
    h.add(p);
    const f = addFace(h, 0.45, 0.075);
    f.position.y = s * 0.11;
    h.userData.face = f;
    g.add(h);
    return h;
  });
  g.userData.halves = halves;
  return g;
}
function makeEraser() {
  const g = new THREE.Group();
  g.add(at(rbox(0.7, 0.18, 0.32, 0.04, "#8a5a3a"), 0, 0.3, 0));
  g.add(at(rbox(0.7, 0.12, 0.32, 0.03, "#3c4048"), 0, 0.15, 0));
  const f = addFace(g, 0.7, 0.17);
  f.position.y = 0.25;
  g.userData.face = f;
  // chapéu de palha e óculos escuros
  const hat = new THREE.Group();
  hat.add(at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 24), "#e9c46a"), 0, 0.42, 0));
  hat.add(at(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.18, 24), "#e9c46a"), 0, 0.52, 0));
  hat.add(at(mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 24), "#e53935"), 0, 0.47, 0));
  g.add(hat);
  for (const s of [-1, 1]) g.add(at(rbox(0.14, 0.08, 0.02, 0.02, "#111"), s * 0.08, 0.28, 0.18));
  return g;
}
function makeMarker() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 20), "#f4f4f4"), 0, 0.45, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.22, 20), "#2f7df6"), 0, 0.85, 0));
  const f = addFace(g, 0.55, 0.11);
  f.position.y = 0.5;
  g.userData.face = f;
  // plaquinha "AUMENTO JÁ"
  const sign = new THREE.Group();
  sign.position.set(0.3, 1.1, 0);
  sign.add(at(rbox(0.03, 0.7, 0.03, 0.01, "#8a5a3a"), 0, -0.3, 0));
  const t = textPlane(["AUMENTO", "JÁ!"], 0.62, 0.38, "#e53935");
  t.position.y = 0.1;
  sign.add(t);
  g.add(sign);
  g.userData.sign = sign;
  return g;
}
function makeProjector() {
  const g = new THREE.Group();
  g.add(at(rbox(0.8, 0.35, 0.6, 0.08, "#dfe3e8"), 0, 0.18, 0));
  const lens = at(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 20), "#2b2f36"), -0.2, 0.2, -0.32);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  const f = addFace(g, 0.6, 0.31);
  f.position.set(0.12, 0.18, 0);
  g.userData.face = f;
  return g;
}
function textPlane(lines, w, h, color = "#1d1d1d", bg = "#ffffff") {
  const tex = canvasTex(512, Math.round((512 * h) / w), (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const fs = Math.min(H / (lines.length + 0.6), W / (Math.max(...lines.map((l) => l.length)) * 0.62));
    g.font = `900 ${fs}px MontserratLocal, Arial`;
    lines.forEach((l, i) => g.fillText(l, W / 2, (H / (lines.length + 1)) * (i + 1)));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex, roughness: 0.7, side: THREE.DoubleSide}));
  m.castShadow = true;
  return m;
}

// ---------- quadro-negro redesenhável ----------
function makeBoard(world, refs) {
  world.add(at(rbox(BOARD.w + 0.4, BOARD.h + 0.4, 0.15, 0.05, "#8a5a3a"), BOARD.x, BOARD.y, BOARD.z));
  const cv = document.createElement("canvas");
  cv.width = 1400;
  cv.height = 600;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshStandardMaterial({map: tex, roughness: 0.9}));
  board.position.set(BOARD.x, BOARD.y, BOARD.z + 0.08);
  world.add(board);
  world.add(at(box(BOARD.w, 0.08, 0.25, "#8a5a3a"), BOARD.x, BOARD.y - BOARD.h / 2 - 0.15, BOARD.z + 0.15));
  let last = "";
  refs.setBoard = (state, p = 1, text = "") => {
    const key = state + ":" + Math.round(p * 60) + ":" + text;
    if (key === last) return;
    last = key;
    const g = cv.getContext("2d");
    g.fillStyle = "#2f5d46";
    g.fillRect(0, 0, 1400, 600);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 1400, (i * 53) % 600, 160, 6);
    g.fillStyle = "#f6f6ee";
    g.strokeStyle = "#f6f6ee";
    g.textAlign = "left";
    g.textBaseline = "middle";
    const write = (txt, x, y, size, prog) => {
      g.font = `700 ${size}px 'Comic Sans MS', MontserratLocal, Arial`;
      g.fillText(txt.slice(0, Math.round(txt.length * prog)), x, y);
    };
    g.textAlign = "center";
    const C = 700;
    const writeC = (txt, y, size, prog, color = "#f6f6ee") => {
      g.fillStyle = color;
      g.font = `700 ${size}px 'Comic Sans MS', MontserratLocal, Arial`;
      g.fillText(txt.slice(0, Math.round(txt.length * prog)), C, y);
    };
    if (state === "aula") {
      writeC("AULA 7", 120, 110, 1);
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(C - 330, 200);
      g.lineTo(C - 330 + 660 * p, 200);
      g.stroke();
      writeC("x² + 2x + 1 = (x+1)²", 320, 70, p);
      writeC("Δ = b² − 4ac", 440, 70, Math.max(0, p * 2 - 1));
    }
    if (state === "tudo") writeC("TUDO C", 320, 200, p);
    if (state === "def") {
      // definição técnica escrita a giz (centro do quadro, cabe no 9:16)
      const lines = text.split("|");
      const total = lines.reduce((n, l) => n + l.length, 0) + 18;
      let budget = Math.round(total * p);
      const take = (s2) => {
        const n = Math.max(0, Math.min(s2.length, budget));
        budget -= s2.length;
        return s2.slice(0, n);
      };
      g.font = "700 46px 'Comic Sans MS', MontserratLocal, Arial";
      g.fillStyle = "#f6f6ee";
      const lab = take("DEFINIÇÃO TÉCNICA:");
      g.fillText(lab, C, 90);
      if (lab.length === 18) {
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(C - 230, 125);
        g.lineTo(C + 230, 125);
        g.stroke();
      }
      g.fillStyle = "#ffe066";
      g.font = "900 104px 'Comic Sans MS', MontserratLocal, Arial";
      lines.forEach((l, i) => g.fillText(take(l), C, 225 + i * 125));
    }
    if (state === "prova") {
      writeC("MATÉRIA DA", 120, 90, Math.min(1, p * 3));
      writeC("PROVA:", 230, 90, Math.min(1, Math.max(0, p * 3 - 1)));
      writeC("INTERVALO", 390, 120, Math.max(0, p * 3 - 2), "#ffd21f");
      writeC("(cap. 1–15)", 500, 64, Math.max(0, p * 3 - 2), "#ffd21f");
    }
    if (state === "mapa") {
      const n = Math.round(4 * p);
      const br = [["LANCHE", 470, 110], ["PEGA-PEGA", 930, 110], ["CANTINA", 460, 520], ["BOLA", 940, 520]];
      g.lineWidth = 8;
      br.slice(0, n).forEach(([t, x, y]) => {
        g.beginPath();
        g.moveTo(C, 310);
        g.lineTo(x, y);
        g.stroke();
      });
      g.fillStyle = "#2f5d46";
      g.beginPath();
      g.ellipse(C, 310, 190, 85, 0, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 8;
      g.stroke();
      g.fillStyle = "#ffd21f";
      g.font = "900 70px MontserratLocal, Arial";
      g.fillText("RECREIO", C, 315);
      g.fillStyle = "#f6f6ee";
      g.font = "700 52px 'Comic Sans MS', MontserratLocal, Arial";
      br.slice(0, n).forEach(([t, x, y]) => g.fillText(t, x, y));
    }
    tex.needsUpdate = true;
  };
  refs.setBoard("aula", 0);
}

export function buildWorld() {
  const world = new THREE.Group();
  const refs = {};
  const r = rng(5);
  // piso de madeira
  const floorTex = canvasTex(256, 256, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#c99a66" : "#d3a673";
      g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = "rgba(0,0,0,0.08)";
      g.fillRect(((i * 77) % 200), i * 32, 3, 32);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({map: floorTex, roughness: 0.7}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);
  // céu e prédios (janela lateral esquerda)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({color: "#9ccaf2"}));
  sky.position.set(0, 20, -40);
  world.add(sky);
  for (let i = 0; i < 12; i++) {
    const h = 6 + r() * 10;
    world.add(at(box(2.5, h, 2.5, r() > 0.5 ? "#f4f6f8" : "#dfe8f2"), -16 + i * 3, h / 2, -12 - r() * 5));
  }
  // paredes creme; janela à esquerda do quadro
  const wallC = "#f3ead8", Z = -4.5;
  world.add(at(box(9, 9, 0.25, wallC), 1.5, 4.5, Z));
  world.add(at(box(1.0, 9, 0.25, wallC), -7.5, 4.5, Z));
  world.add(at(box(4.0, 2.2, 0.25, wallC), -5.0, 1.1, Z));
  world.add(at(box(4.0, 2.6, 0.25, wallC), -5.0, 7.7, Z));
  for (const x of [-7.0, -5.0, -3.0]) world.add(at(box(0.14, 4.2, 0.35, "#ffffff"), x, 4.3, Z));
  for (const y of [2.2, 6.4]) world.add(at(box(4.2, 0.14, 0.35, "#ffffff"), -5.0, y, Z));
  world.add(at(box(0.25, 9, 16, "#efe4cf"), -8.0, 4.5, 3.0));
  world.add(at(box(0.25, 9, 16, "#efe4cf"), 7.0, 4.5, 3.0));
  world.add(at(box(16, 0.3, 0.3, "#d9c6a3"), 0, 0.15, Z + 0.15));
  // porta (parede direita)
  world.add(at(rbox(0.12, 4.4, 1.8, 0.04, "#8a5a3a"), 6.85, 2.2, -0.8));
  world.add(at(sphere(0.08, "#d4a537", {metal: 0.7}), 6.75, 2.2, -0.1));
  // mural
  world.add(at(rbox(1.8, 1.3, 0.06, 0.03, "#c98a5e"), 5.4, 4.2, Z + 0.15));
  ["#ffd21f", "#7cc4f2", "#ff7a59", "#7be07b"].forEach((c, i) => world.add(at(box(0.5, 0.45, 0.02, c), 5.0 + (i % 2) * 0.8, 4.45 - Math.floor(i / 2) * 0.55, Z + 0.2)));
  makeBoard(world, refs);
  // relógio
  const clock = new THREE.Group();
  clock.position.set(4.6, 6.7, Z + 0.2);
  world.add(clock);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 32), mat("#ffffff"));
  face.rotation.x = Math.PI / 2;
  clock.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 32), mat("#2b2f36"));
  clock.add(rim);
  const hands = [0.38, 0.26].map((len, i) => {
    const h = new THREE.Group();
    h.position.z = 0.06;
    h.add(at(box(0.04 + i * 0.02, len, 0.02, "#111"), 0, len / 2, 0));
    clock.add(h);
    return h;
  });
  refs.clockHands = hands;
  refs.clockFace = addFace(clock, 1.6, 0.08);
  refs.clockFace.position.y = -0.18;
  refs.clockSeven = sevenSticker(0.35);
  refs.clockSeven.position.set(0.32, 0.32, 0.1);
  clock.add(refs.clockSeven);
  // sinal da escola
  const bell = new THREE.Group();
  bell.position.set(-1.8, 6.7, Z + 0.25);
  world.add(bell);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#e53935", {coat: 0.9}));
  dome.rotation.x = Math.PI / 2;
  bell.add(dome);
  refs.bell = bell;
  // carteiras
  SEATS.forEach(([x, z]) => {
    const d = new THREE.Group();
    d.position.set(x, 0, z);
    world.add(d);
    d.add(at(rbox(1.3, 0.1, 0.8, 0.03, "#e2b27a"), 0, 1.3, -0.55));
    for (const s of [-1, 1]) d.add(at(box(0.08, 1.3, 0.08, "#555"), s * 0.55, 0.65, -0.55));
    d.add(at(rbox(0.8, 0.08, 0.7, 0.03, "#2f6fb5"), 0, 0.85, 0.15));
    d.add(at(rbox(0.8, 0.8, 0.08, 0.03, "#2f6fb5"), 0, 1.3, 0.5));
    for (const [sx, sz] of [[-0.35, -0.15], [0.35, -0.15], [-0.35, 0.45], [0.35, 0.45]]) d.add(at(box(0.06, 0.85, 0.06, "#555"), sx, 0.42, sz));
  });
  // livros abertos (um por carteira)
  refs.books = SEATS.map(([x, z]) => {
    const b = new THREE.Group();
    b.position.set(x, 1.37, z - 0.5);
    for (const s of [-1, 1]) {
      const p = at(rbox(0.36, 0.03, 0.46, 0.01, "#ffffff"), s * 0.19, 0.03, 0);
      p.rotation.z = s * -0.12;
      b.add(p);
    }
    b.add(at(rbox(0.78, 0.03, 0.5, 0.01, "#c0392b"), 0, 0, 0));
    world.add(b);
    return b;
  });
  // mesa do professor + cadeira
  const td = new THREE.Group();
  td.position.set(TDESK.x, 0, TDESK.z);
  world.add(td);
  td.add(at(rbox(2.4, 0.14, 1.2, 0.04, "#8a5a3a"), 0, 1.5, 0));
  td.add(at(rbox(2.2, 1.4, 0.1, 0.03, "#7a4c30"), 0, 0.75, 0.5));
  for (const s of [-1, 1]) td.add(at(box(0.12, 1.5, 1.0, "#7a4c30"), s * 1.05, 0.75, 0));
  const chair = new THREE.Group();
  chair.position.set(TDESK.x, 0, TDESK.z - 1.0);
  world.add(chair);
  chair.add(at(rbox(0.9, 0.1, 0.8, 0.03, "#2b2f36"), 0, 0.95, 0));
  chair.add(at(rbox(0.9, 1.0, 0.1, 0.03, "#2b2f36"), 0, 1.5, -0.4));
  chair.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), "#888"), 0, 0.45, 0));
  // pilha de provas + carimbo
  refs.exams = new THREE.Group();
  for (let i = 0; i < 8; i++) refs.exams.add(at(box(0.6, 0.02, 0.8, "#ffffff"), (r() - 0.5) * 0.05, i * 0.025, (r() - 0.5) * 0.05));
  world.add(refs.exams);
  refs.stamp = new THREE.Group();
  refs.stamp.add(at(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), "#c0392b"), 0, -0.06, 0));
  refs.stamp.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12), "#5a3a2a"), 0, 0.12, 0));
  // material escolar na mesa
  const top = 1.57;
  refs.eraser = makeEraser();
  refs.eraser.userData.home = new THREE.Vector3(TDESK.x - 0.8, top, TDESK.z + 0.2);
  refs.marker = makeMarker();
  refs.marker.userData.home = new THREE.Vector3(TDESK.x, top, TDESK.z + 0.25);
  refs.projector = makeProjector();
  refs.projector.userData.home = new THREE.Vector3(TDESK.x + 0.75, top, TDESK.z + 0.1);
  for (const k of ["eraser", "marker", "projector"]) world.add(refs[k]);
  // placas de greve
  refs.strikeSigns = ["GREVE", "REAJUSTE", "ZZZ"].map((t) => {
    const s = new THREE.Group();
    s.add(at(rbox(0.03, 0.6, 0.03, 0.01, "#8a5a3a"), 0, -0.25, 0));
    const p = textPlane([t], 0.6, 0.3, "#e53935");
    p.position.y = 0.15;
    s.add(p);
    world.add(s);
    return s;
  });
  // feixe do projetor + tela projetada
  refs.beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.4, 4, 1, true), new THREE.MeshBasicMaterial({color: "#fffbe0", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}));
  world.add(refs.beam);
  refs.wifi = textPlane(["DIGITE A SENHA", "DO WI-FI: ________"], 4.2, 1.6, "#1d1d1d", "#eef6ff");
  refs.wifi.position.set(BOARD.x + 0.4, BOARD.y, BOARD.z + 0.12);
  world.add(refs.wifi);
  // giz com rosto (na mão do professor; depois as metades caem)
  refs.chalk = makeChalk();
  world.add(refs.chalk);
  refs.dust = Array.from({length: 22}, () => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({color: "#ffffff", transparent: true, opacity: 0.8, depthWrite: false}));
    d.userData.v = new THREE.Vector3((r() - 0.5) * 1.4, 0.5 + r() * 1.3, (r() - 0.5) * 1.0);
    world.add(d);
    return d;
  });
  // folhas voando (pânico)
  refs.papers = Array.from({length: 12}, () => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshStandardMaterial({color: "#ffffff", side: THREE.DoubleSide}));
    p.userData = {x: (r() - 0.5) * 8, z: (r() - 0.2) * 5, s: r() * 6, o: r()};
    world.add(p);
    return p;
  });
  // balões "TALVEZ"
  const talvezTex = canvasTex(512, 220, (g, W, H) => {
    g.fillStyle = "#ffd21f";
    g.beginPath();
    g.ellipse(W / 2, H / 2, W / 2 - 8, H / 2 - 8, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = "#161616";
    g.stroke();
    g.fillStyle = "#161616";
    g.font = "900 110px MontserratLocal, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("TALVEZ", W / 2, H / 2 + 4);
  });
  refs.talvez = Array.from({length: 6}, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.56), new THREE.MeshBasicMaterial({map: talvezTex, transparent: true, depthWrite: false}));
    world.add(m);
    return m;
  });
  // personagens
  refs.prof = makeProfessor({pose: "idle", mood: "feliz"});
  world.add(refs.prof);
  refs.profChalkGrip = refs.prof.userData.parts.arms[1].userData.grip;
  refs.students = SEATS.map((_, i) => {
    const s = makeStudent(i);
    world.add(s);
    return s;
  });
  refs.students[ASKER].userData.parts.arms[1].userData.grip.add(refs.stamp);
  refs.sky = sky;
  buildV3(world, refs);
  // peças da parede do fundo (somem quando a câmera fica "atrás do quadro")
  refs.backItems = world.children.filter((o) => o.position.z <= -4.0 && o.position.z > -6 && o !== refs.wifi);
  return {world, refs};
}

// ---------- v3 (sem sentido) ----------
function sevenSticker(size = 0.3) {
  const tex = canvasTex(128, 128, (g) => {
    g.fillStyle = "#ffd21f";
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = "#161616";
    g.stroke();
    g.fillStyle = "#e53935";
    g.font = "900 92px MontserratLocal, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("7", 64, 70);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({map: tex, transparent: true}));
}

function makeDino() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const chalkC = "#f6f4ee";
  const torso = at(capsule(0.22, 0.35, chalkC), 0, 0.5, 0);
  torso.rotation.x = Math.PI / 2 - 0.4;
  body.add(torso);
  const head = new THREE.Group();
  head.position.set(0, 0.95, 0.25);
  body.add(head);
  head.add(sphere(0.22, chalkC));
  const snout = at(sphere(0.16, chalkC), 0, -0.05, 0.18);
  snout.scale.set(1, 0.8, 1.2);
  head.add(snout);
  const face = addFace(head, 0.6, 0.25);
  face.position.y = 0.05;
  const jaw = at(rbox(0.22, 0.05, 0.2, 0.02, "#d9d6cc"), 0, -0.15, 0.2);
  head.add(jaw);
  const tail = at(mesh(new THREE.ConeGeometry(0.16, 0.7, 12), chalkC), 0, 0.35, -0.5);
  tail.rotation.x = -Math.PI / 2 - 0.3;
  body.add(tail);
  for (let i = 0; i < 5; i++) {
    const sp = at(mesh(new THREE.ConeGeometry(0.05, 0.13, 6), "#ffd21f"), 0, 0.78 - i * 0.1, -0.05 - i * 0.12);
    body.add(sp);
  }
  for (const s2 of [-1, 1]) {
    body.add(at(capsule(0.08, 0.2, chalkC), s2 * 0.13, 0.15, 0.05));
    const arm = at(capsule(0.04, 0.12, chalkC), s2 * 0.18, 0.62, 0.2);
    arm.rotation.x = -0.8;
    body.add(arm);
  }
  const tie = new THREE.Group();
  tie.add(at(rbox(0.07, 0.05, 0.04, 0.02, "#2f6fb5"), 0, 0.72, 0.24));
  tie.add(at(rbox(0.06, 0.2, 0.03, 0.02, "#2f6fb5"), 0, 0.6, 0.26));
  body.add(tie);
  g.userData = {body, head, face, jaw, tie};
  return g;
}

function buildV3(world, refs) {
  const r = rng(91);
  // janela com rosto
  const wf = new THREE.Group();
  wf.position.set(-5.0, 4.3, -4.3);
  world.add(wf);
  for (const s2 of [-1, 1]) {
    const e = at(sphere(0.32, "#ffffff", {coat: 0.5}), s2 * 0.6, 0.45, 0);
    e.scale.set(1, 1.2, 0.3);
    wf.add(e);
    wf.add(at(sphere(0.16, "#161616"), s2 * 0.6, 0.42, 0.08));
  }
  const wm = at(sphere(0.35, "#5a1f1f"), 0, -0.55, 0);
  wm.scale.set(1.3, 0.9, 0.3);
  wf.add(wm);
  refs.windowFace = wf;
  refs.windowEyes = wf.children.slice(0, 4);
  refs.windowMouth = wm;
  // balão "TALVEZ" gigante da janela (mesma textura dos outros)
  refs.bigTalvez = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), refs.talvez[0].material);
  world.add(refs.bigTalvez);
  // pato de gravata
  refs.duck = makeDuck();
  const D = refs.duck.userData.parts;
  const tie = new THREE.Group();
  tie.add(at(rbox(0.14, 0.1, 0.06, 0.03, "#e53935"), 0, 1.18, 0.62));
  tie.add(at(rbox(0.12, 0.38, 0.05, 0.03, "#e53935"), 0, 0.95, 0.66));
  D.body.add(tie);
  const glasses = new THREE.Group();
  for (const s2 of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 8, 20), mat("#161616"));
    ring.position.set(s2 * 0.15, 0.1, 0.38);
    glasses.add(ring);
  }
  D.head.add(glasses);
  D.glasses = glasses;
  world.add(refs.duck);
  // holofote (cone de luz)
  refs.spot = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6.5, 24, 1, true), new THREE.MeshBasicMaterial({color: "#fff6c4", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide}));
  world.add(refs.spot);
  // fumaça
  refs.smoke = Array.from({length: 16}, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({color: "#f2f2f2", transparent: true, opacity: 0.7, depthWrite: false}));
    m.userData = {d: new THREE.Vector3((r() - 0.5) * 2, r() * 1.2, (r() - 0.5) * 2), s: 0.6 + r() * 0.8};
    world.add(m);
    return m;
  });
  // adesivos "7" na testa dos alunos
  refs.sevens = refs.students.map((st) => {
    const s7 = sevenSticker(0.32);
    s7.position.set(0, 0.28, 0.47);
    st.userData.parts.head.add(s7);
    return s7;
  });
  // dinossauro de giz
  refs.dino = makeDino();
  world.add(refs.dino);
  // diretor (terno cinza por cima da roupa do barbeiro)
  refs.director = makeBarber();
  const jacket = at(rbox(1.25, 1.3, 0.8, 0.28, "#5a5f6a"), 0, 1.78, -0.02);
  refs.director.userData.parts.pivot.add(jacket);
  const lapel = at(rbox(0.35, 0.7, 0.05, 0.03, "#f4f4f4"), 0, 2.0, 0.39);
  refs.director.userData.parts.pivot.add(lapel);
  refs.director.userData.parts.pivot.add(at(rbox(0.1, 0.45, 0.04, 0.02, "#2b2f36"), 0, 1.95, 0.42));
  const badge = at(rbox(0.32, 0.22, 0.03, 0.02, "#ffffff"), 0.3, 2.2, 0.42);
  refs.director.userData.parts.pivot.add(badge);
  world.add(refs.director);
  // tabuleiro de xadrez + pães de queijo
  const boardTex = canvasTex(256, 256, (g) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      g.fillStyle = (i + j) % 2 ? "#3b2414" : "#f2e3c6";
      g.fillRect(i * 32, j * 32, 32, 32);
    }
  });
  refs.chess = new THREE.Group();
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 1.1), new THREE.MeshStandardMaterial({map: boardTex, roughness: 0.6}));
  cb.castShadow = true;
  refs.chess.add(cb);
  refs.paes = Array.from({length: 16}, (_, i) => {
    const p = sphere(0.055, i < 8 ? "#e0a84a" : "#c98a30", {coat: 0.3});
    p.scale.set(1, 0.8, 1);
    const col = i % 8, row = i < 8 ? 0 : 7;
    p.userData.rest = new THREE.Vector3(-0.48 + col * 0.137, 0.07, -0.48 + row * 0.137);
    refs.chess.add(p);
    return p;
  });
  world.add(refs.chess);
}
