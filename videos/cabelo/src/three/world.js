// Cenários: barbearia (origem) + estação espacial (x = SPACE_X). Monta tudo uma vez e devolve as referências.
import * as THREE from "three";
import {makeProfessor, addSpaceGear, mat, mesh, rbox, sphere, at} from "./professor.js";
import {textTexture} from "./props.js";
import {makeBarber, makeDuck, makeLion} from "./characters.js";

export const SPACE_X = 80;
export const CHAIR = {x: 0, z: 0.2, seat: 1.2};
export const WAIT = {x: -4.3, z: 1.7, seat: 1.0};

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

// ---------- desenhos (texturas) ----------
function drawLion(g, w, h, roar) {
  g.fillStyle = "#fffaf0";
  g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.48;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    g.fillStyle = i % 2 ? "#a0521f" : "#c06a28";
    g.beginPath();
    g.arc(cx + Math.cos(a) * w * 0.3, cy + Math.sin(a) * w * 0.3, w * 0.13, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#e0a85a";
  g.beginPath();
  g.arc(cx, cy, w * 0.27, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1a1a1a";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(cx + s * w * 0.1, cy - w * 0.06, w * 0.03, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#3a2416";
  g.beginPath();
  g.ellipse(cx, cy + w * 0.04, w * 0.05, w * 0.035, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#5a1f1f";
  g.beginPath();
  if (roar) g.ellipse(cx, cy + w * 0.15, w * 0.11, w * 0.09, 0, 0, Math.PI * 2);
  else g.ellipse(cx, cy + w * 0.13, w * 0.07, w * 0.02, 0, 0, Math.PI * 2);
  g.fill();
  if (roar) {
    g.fillStyle = "#ffffff";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + s * w * 0.06, cy + w * 0.08);
      g.lineTo(cx + s * w * 0.03, cy + w * 0.13);
      g.lineTo(cx + s * w * 0.09, cy + w * 0.1);
      g.fill();
    }
  }
}
function drawBaldProf(g, w, h) {
  g.fillStyle = "#fffaf0";
  g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.48;
  g.fillStyle = "#f2b48f";
  g.beginPath();
  g.arc(cx, cy, w * 0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#9a5a32";
  g.lineWidth = w * 0.02;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(cx + s * w * 0.11, cy - w * 0.02, w * 0.075, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "#222";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(cx + s * w * 0.11, cy - w * 0.02, w * 0.025, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#eef0f2";
  g.beginPath();
  g.ellipse(cx, cy + w * 0.12, w * 0.15, w * 0.05, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.globalAlpha = 0.7;
  g.beginPath();
  g.ellipse(cx - w * 0.08, cy - w * 0.2, w * 0.07, w * 0.03, -0.5, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

function photoFrame(tex) {
  const g = new THREE.Group();
  g.add(at(rbox(0.95, 1.15, 0.04, 0.02, "#ffffff"), 0, 0, 0));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshStandardMaterial({map: tex, roughness: 0.7}));
  p.position.set(0, 0.07, 0.025);
  g.add(p);
  g.userData.plane = p;
  return g;
}

function makeFork() {
  const g = new THREE.Group();
  const steel = {metal: 0.85, rough: 0.2};
  g.add(at(rbox(0.12, 1.1, 0.06, 0.03, "#c9ced6", steel), 0, -0.2, 0));
  g.add(at(rbox(0.42, 0.14, 0.06, 0.03, "#c9ced6", steel), 0, 0.42, 0));
  for (let i = 0; i < 4; i++) g.add(at(rbox(0.06, 0.5, 0.05, 0.02, "#c9ced6", steel), -0.15 + i * 0.1, 0.72, 0));
  return g;
}

function makeTumbleweed() {
  const g = new THREE.Group();
  const r = rng(4);
  for (let i = 0; i < 9; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 6, 24), mat("#a07a45", {rough: 0.9}));
    t.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
    t.castShadow = true;
    g.add(t);
  }
  return g;
}

function makeUmbrella() {
  const g = new THREE.Group();
  const top = new THREE.Group();
  top.position.y = 1.1;
  g.add(top);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.45, 12, 1, true), new THREE.MeshStandardMaterial({color: "#e53935", side: THREE.DoubleSide, roughness: 0.6}));
  canopy.castShadow = true;
  top.add(canopy);
  g.add(at(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 8), "#333"), 0, 0.5, 0));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12, Math.PI), mat("#333"));
  hook.position.y = -0.15;
  hook.rotation.z = Math.PI;
  g.add(hook);
  g.userData.top = top;
  return g;
}

function makeSiren() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 8), "#555"), 0, 2.2, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.2, 20), "#444"), 0, 0.1, 0));
  g.add(at(sphere(0.38, "#ff2a2a", {emissive: "#ff1a1a", ei: 1.2, coat: 1}), 0, 0.2, 0));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 20, 1, true), new THREE.MeshBasicMaterial({color: "#ff3030", transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide}));
  beam.rotation.z = Math.PI / 2;
  beam.position.x = 1.9;
  const spin = new THREE.Group();
  spin.position.y = 0.2;
  spin.add(beam);
  g.add(spin);
  g.userData.spin = spin;
  return g;
}

function makeBolt() {
  const s = new THREE.Shape();
  const pts = [[0, 0], [0.35, -0.9], [0.1, -0.9], [0.45, -1.9], [-0.15, -0.7], [0.1, -0.7], [-0.2, 0]];
  s.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => s.lineTo(...p));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({color: "#fff36b", side: THREE.DoubleSide}));
  m.scale.setScalar(1.2);
  return m;
}

// ---------- barbearia ----------
function buildShop(world, refs) {
  const floorTex = canvasTex(256, 256, (g) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      g.fillStyle = (i + j) % 2 ? "#2d2f36" : "#f2f2ee";
      g.fillRect(i * 32, j * 32, 32, 32);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(8, 8);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), new THREE.MeshStandardMaterial({map: floorTex, roughness: 0.55}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: "#8b98ae", roughness: 0.95}));
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.01;
  outer.receiveShadow = true;
  world.add(outer);
  // céu + prédios
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({map: canvasTex(16, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#5aa7ef");
    gr.addColorStop(1, "#cfe8ff");
    g.fillStyle = gr;
    g.fillRect(0, 0, 16, 256);
  })}));
  sky.position.set(0, 20, -40);
  world.add(sky);
  refs.sky = sky;
  const r = rng(12);
  for (let i = 0; i < 14; i++) {
    const w = 2 + r() * 2.5, h = 6 + r() * 12;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.5), new THREE.MeshStandardMaterial({color: r() > 0.5 ? "#f4f6f8" : "#dfe8f2", roughness: 0.8}));
    b.position.set(-16 + i * 2.7, h / 2, -12 - r() * 6);
    world.add(b);
  }
  // parede do fundo (verde-menta) com janela à esquerda
  const wallC = "#dcefe9";
  const Z = -4.5;
  world.add(at(box(2.0, 9, 0.25, wallC), -7.0, 4.5, Z));
  world.add(at(box(10.8, 9, 0.25, wallC), 2.6, 4.5, Z));
  world.add(at(box(3.2, 2.4, 0.25, wallC), -4.4, 1.2, Z));
  world.add(at(box(3.2, 2.6, 0.25, wallC), -4.4, 7.7, Z));
  for (const x of [-6.0, -4.4, -2.8]) world.add(at(box(0.14, 4.0, 0.35, "#3c4048"), x, 4.4, Z));
  for (const y of [2.4, 6.4]) world.add(at(box(3.4, 0.14, 0.35, "#3c4048"), -4.4, y, Z));
  world.add(at(box(16, 0.3, 0.3, "#b6d3ca"), 0, 0.15, Z + 0.15));
  world.add(at(box(0.25, 9, 14, "#d2e7e0"), -8.0, 4.5, 2.5));
  // espelho com moldura dourada
  world.add(at(rbox(3.6, 2.6, 0.12, 0.06, "#d4a537", {metal: 0.6, rough: 0.3}), 0.4, 3.6, Z + 0.15));
  world.add(at(mesh(new THREE.PlaneGeometry(3.3, 2.3), "#cfe6f2", {metal: 0.9, rough: 0.08, coat: 1}), 0.4, 3.6, Z + 0.22));
  // poste listrado (gira)
  const pole = new THREE.Group();
  pole.position.set(2.9, 3.4, Z + 0.4);
  world.add(pole);
  const poleTex = canvasTex(128, 128, (g) => {
    for (let i = -4; i < 8; i++) {
      g.fillStyle = ["#e53935", "#ffffff", "#2f6fb5", "#ffffff"][((i % 4) + 4) % 4];
      g.beginPath();
      g.moveTo(0, i * 32);
      g.lineTo(128, i * 32 - 64);
      g.lineTo(128, i * 32 - 32);
      g.lineTo(0, i * 32 + 32);
      g.fill();
    }
  });
  poleTex.wrapS = poleTex.wrapT = THREE.RepeatWrapping;
  poleTex.repeat.set(1, 2);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.8, 24), new THREE.MeshPhysicalMaterial({map: poleTex, roughness: 0.2, clearcoat: 1}));
  pole.add(tube);
  for (const y of [-1, 1]) pole.add(at(sphere(0.3, "#c9ced6", {metal: 0.8, rough: 0.2}), 0, y, 0));
  refs.poleTex = poleTex;
  // prateleira com frascos
  world.add(at(box(2.2, 0.1, 0.5, "#8a5a3a"), 5.2, 3.0, Z + 0.35));
  const cols = ["#2fb84f", "#2f7df6", "#e53935", "#ffd21f", "#8e44ad"];
  for (let i = 0; i < 6; i++) world.add(at(mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.45 + (i % 3) * 0.12, 14), cols[i % 5], {coat: 1, rough: 0.15}), 4.4 + i * 0.32, 3.3 + (i % 3) * 0.06, Z + 0.35));
  // calendário de parede
  const calCv = document.createElement("canvas");
  calCv.width = 256;
  calCv.height = 320;
  const calTex = new THREE.CanvasTexture(calCv);
  calTex.colorSpace = THREE.SRGBColorSpace;
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.38), new THREE.MeshStandardMaterial({map: calTex, roughness: 0.8}));
  cal.position.set(5.2, 5.0, Z + 0.15);
  world.add(cal);
  let lastCal = null;
  refs.setCalendar = (n) => {
    if (n === lastCal) return;
    lastCal = n;
    const g = calCv.getContext("2d");
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 256, 320);
    g.fillStyle = "#e53935";
    g.fillRect(0, 0, 256, 80);
    g.fillStyle = "#fff";
    g.font = "900 46px MontserratLocal, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"][n % 12], 128, 42);
    g.fillStyle = "#1d1d1d";
    g.font = "900 140px MontserratLocal, Arial";
    g.fillText(String((n % 28) + 1), 128, 205);
    calTex.needsUpdate = true;
  };
  refs.setCalendar(0);
  refs.calPages = Array.from({length: 8}, () => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({color: "#ffffff", side: THREE.DoubleSide}));
    world.add(p);
    return p;
  });
  // porta (direita)
  world.add(at(box(0.25, 5.2, 0.4, "#8a5a3a"), 7.2, 2.6, -1.6));
  world.add(at(box(0.25, 5.2, 0.4, "#8a5a3a"), 7.2, 2.6, 1.8));
  world.add(at(box(0.25, 0.4, 3.8, "#8a5a3a"), 7.2, 5.2, 0.1));
  // cadeira do barbeiro
  const chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z);
  world.add(chair);
  chair.add(at(mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.12, 28), "#c9ced6", {metal: 0.8, rough: 0.2}), 0, 0.06, 0));
  chair.add(at(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.85, 16), "#c9ced6", {metal: 0.8, rough: 0.2}), 0, 0.5, 0));
  const seatG = new THREE.Group();
  seatG.position.y = 0;
  chair.add(seatG);
  seatG.add(at(rbox(1.3, 0.3, 1.2, 0.12, "#c0392b", {coat: 0.8, rough: 0.3}), 0, 1.05, 0.05));
  seatG.add(at(rbox(1.3, 1.6, 0.3, 0.12, "#c0392b", {coat: 0.8, rough: 0.3}), 0, 1.95, -0.5));
  for (const s of [-1, 1]) seatG.add(at(rbox(0.2, 0.12, 1.0, 0.05, "#c9ced6", {metal: 0.8, rough: 0.2}), s * 0.72, 1.55, 0.05));
  seatG.add(at(rbox(0.9, 0.12, 0.3, 0.05, "#c9ced6", {metal: 0.8, rough: 0.2}), 0, 0.45, 0.85));
  refs.chairSeat = seatG;
  // cadeira de espera
  const wc = new THREE.Group();
  wc.position.set(WAIT.x, 0, WAIT.z);
  world.add(wc);
  for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) wc.add(at(box(0.1, 0.9, 0.1, "#333"), x, 0.45, z));
  wc.add(at(rbox(1.1, 0.12, 1.1, 0.04, "#2f6fb5"), 0, 0.95, 0));
  wc.add(at(rbox(1.1, 1.0, 0.12, 0.04, "#2f6fb5"), 0, 1.5, -0.5));
}

// ---------- estação espacial ----------
function buildStation(world, refs) {
  const S = new THREE.Group();
  S.position.x = SPACE_X;
  world.add(S);
  const panelTex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#eef1f4";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#c9ced6";
    g.lineWidth = 6;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.strokeRect(i * 64 + 4, j * 64 + 4, 56, 56);
    g.fillStyle = "#2f7df6";
    g.fillRect(20, 20, 18, 8);
    g.fillStyle = "#e53935";
    g.fillRect(150, 90, 10, 10);
  });
  panelTex.wrapS = panelTex.wrapT = THREE.RepeatWrapping;
  panelTex.repeat.set(4, 2);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 24, 24, 1, true), new THREE.MeshStandardMaterial({map: panelTex, side: THREE.BackSide, roughness: 0.6}));
  shell.rotation.z = Math.PI / 2;
  shell.position.y = 3;
  S.add(shell);
  // janela redonda com a Terra (no fundo)
  const back = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshStandardMaterial({color: "#dfe4ea", side: THREE.DoubleSide}));
  back.position.set(0, 3, -4.6);
  S.add(back);
  const win = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshBasicMaterial({color: "#05070f"}));
  win.position.set(0, 3.6, -4.55);
  S.add(win);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.18, 12, 48), mat("#9aa3ad", {metal: 0.7, rough: 0.3}));
  rim.position.set(0, 3.6, -4.5);
  S.add(rim);
  const earthTex = canvasTex(512, 256, (g) => {
    g.fillStyle = "#1f6fd1";
    g.fillRect(0, 0, 512, 256);
    const rr = rng(8);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = rr() > 0.3 ? "#3fae5a" : "#c9a86a";
      g.beginPath();
      g.ellipse(rr() * 512, 40 + rr() * 176, 20 + rr() * 50, 12 + rr() * 30, rr() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.ellipse(rr() * 512, rr() * 256, 20 + rr() * 40, 5 + rr() * 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 32), new THREE.MeshStandardMaterial({map: earthTex, roughness: 0.8, emissive: "#0a2a5a", emissiveIntensity: 0.25}));
  earth.position.set(0.6, 2.9, -4.4);
  earth.scale.z = 0.25;
  S.add(earth);
  refs.earth = earth;
  // máquina de cortar + tubo do aspirador
  const vac = at(rbox(1.0, 1.4, 0.6, 0.1, "#c9ced6", {metal: 0.5, rough: 0.35}), -3.4, 1.2, -3.0);
  S.add(vac);
  const clipper = new THREE.Group();
  clipper.add(at(rbox(0.22, 0.45, 0.16, 0.06, "#3c4048"), 0, 0, 0));
  clipper.add(at(rbox(0.26, 0.08, 0.18, 0.02, "#c9ced6", {metal: 0.8}), 0, 0.26, 0));
  S.add(clipper);
  refs.clipper = clipper;
  refs.vacFrom = new THREE.Vector3(SPACE_X - 3.4, 1.9, -3.0);
  refs.tubeMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({color: "#8a939e", roughness: 0.5}));
  world.add(refs.tubeMesh);
  // fios de cabelo flutuando
  const r = rng(31);
  refs.hairBits = Array.from({length: 40}, () => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.12, 3, 6), mat("#f4f5f6", {coat: 0}));
    b.userData = {o: new THREE.Vector3((r() - 0.5) * 1.6, (r() - 0.5) * 1.2, (r() - 0.5) * 1.0), s: r() * 6, d: r()};
    world.add(b);
    return b;
  });
  refs.station = S;
}

export function buildWorld() {
  const world = new THREE.Group();
  const refs = {};
  buildShop(world, refs);
  buildStation(world, refs);
  // personagens
  refs.prof = makeProfessor({pose: "idle", mood: "feliz"});
  addSpaceGear(refs.prof);
  world.add(refs.prof);
  refs.barber = makeBarber();
  world.add(refs.barber);
  // barbeiro astronauta: bolha de vidro
  const bb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 24), new THREE.MeshPhysicalMaterial({color: "#dff2ff", transparent: true, opacity: 0.18, roughness: 0.05, clearcoat: 1, depthWrite: false}));
  bb.position.copy(refs.barber.userData.parts.head.position);
  refs.barber.userData.parts.pivot.add(bb);
  refs.barberBubble = bb;
  refs.duck = makeDuck();
  world.add(refs.duck);
  refs.lion = makeLion();
  world.add(refs.lion);
  // fotos
  refs.lionTex = [false, true].map((roar) => canvasTex(512, 512, (g, w, h) => drawLion(g, w, h, roar)));
  refs.photoLion = photoFrame(refs.lionTex[0]);
  world.add(refs.photoLion);
  refs.photoBald = photoFrame(canvasTex(512, 512, drawBaldProf));
  world.add(refs.photoBald);
  // garfos nas mãos
  refs.profFork = makeFork();
  refs.profFork.position.set(0, -0.2, 0.1);
  refs.prof.userData.parts.arms[1].userData.grip.add(refs.profFork);
  refs.barberFork = makeFork();
  refs.barberFork.position.set(0, -0.2, 0.1);
  refs.barber.userData.parts.arms[1].userData.grip.add(refs.barberFork);
  // guarda-chuva na mão esquerda do barbeiro
  refs.umbrella = makeUmbrella();
  refs.umbrella.position.set(0, -0.3, 0.1);
  refs.umbrella.rotation.x = Math.PI;
  refs.barber.userData.parts.arms[0].userData.grip.add(refs.umbrella);
  // tesoura e pente (dica 2)
  refs.scissors = new THREE.Group();
  for (const s of [-1, 1]) {
    const b = at(rbox(0.05, 0.45, 0.02, 0.01, "#c9ced6", {metal: 0.8}), s * 0.04, -0.2, 0);
    b.rotation.z = s * 0.25;
    refs.scissors.add(b);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), mat("#e53935"));
    ring.position.set(s * 0.08, 0.06, 0);
    refs.scissors.add(ring);
  }
  refs.barber.userData.parts.arms[1].userData.grip.add(refs.scissors);
  // sirene, bola de feno, raio, nuvem, chuva, poças
  refs.siren = makeSiren();
  world.add(refs.siren);
  refs.tumble = makeTumbleweed();
  world.add(refs.tumble);
  refs.bolt = makeBolt();
  world.add(refs.bolt);
  const rr = rng(77);
  refs.cloud = Array.from({length: 22}, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16 + rr() * 0.08, 16, 12), new THREE.MeshStandardMaterial({color: "#eef0f2", roughness: 0.85}));
    const a = rr() * Math.PI * 2;
    m.userData = {
      start: new THREE.Vector3(Math.cos(a) * 0.62, 0.1 + rr() * 0.55, Math.sin(a) * 0.55),
      end: new THREE.Vector3((rr() - 0.5) * 2.6, (rr() - 0.5) * 0.7, (rr() - 0.5) * 1.2),
      big: 2.6 + rr() * 1.6,
      d: rr() * 0.4,
    };
    world.add(m);
    return m;
  });
  refs.rain = Array.from({length: 90}, () => {
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.3, 3, 6), new THREE.MeshStandardMaterial({color: "#8fd3ff", transparent: true, opacity: 0.8}));
    d.userData = {x: (rr() - 0.5) * 3.4, z: (rr() - 0.5) * 1.8, o: rr()};
    world.add(d);
    return d;
  });
  refs.puddles = Array.from({length: 6}, (_, i) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.5 + rr() * 0.5, 24), new THREE.MeshPhysicalMaterial({color: "#7cc4f2", transparent: true, opacity: 0.75, roughness: 0.05, clearcoat: 1}));
    p.rotation.x = -Math.PI / 2;
    p.position.set(-2.5 + i * 1.2 + rr() * 0.4, 0.012, 1.0 + rr() * 1.4);
    p.scale.set(1.4, 1, 1);
    world.add(p);
    return p;
  });
  // estrelas (subida ao espaço)
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 700; i++) pts.push((rr() - 0.5) * 120, 30 + rr() * 60, -30 + (rr() - 0.5) * 60);
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  refs.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color: "#ffffff", size: 0.35, sizeAttenuation: true, transparent: true}));
  world.add(refs.stars);
  return {world, refs};
}
