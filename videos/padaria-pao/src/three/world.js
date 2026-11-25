// Cenário persistente: padaria (origem) + mesa de casa (x = HOME_X). Monta tudo uma vez e devolve as referências.
import * as THREE from "three";
import {makeProfessor, mat, mesh, rbox, sphere, at} from "./professor.js";
import {C, textTexture, labelPlane, makeBread, makeSplitBread, makePaperBag, makePlasticBag, makeBaker, makeTongs, makeSlice, makeBall, makeBaguette, makeSonho, makeRays, makeGlint, makeNote} from "./props.js";

export const HOME_X = 40;
export const COUNTER_TOP = 1.77;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function skyTexture() {
  const cv = document.createElement("canvas");
  cv.width = 16;
  cv.height = 256;
  const g = cv.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#5aa7ef");
  gr.addColorStop(1, "#cfe8ff");
  g.fillStyle = gr;
  g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowsTexture(cols, rows) {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 256;
  const g = cv.getContext("2d");
  g.fillStyle = "#f4f6f8";
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = "#9db3c9";
  const cw = 128 / cols, rh = 256 / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) g.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.25, cw * 0.56, rh * 0.5);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function box(w, h, d, color, opts) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), color, opts);
  return m;
}

function buildRoom(world) {
  // piso azul-acinzentado (como o carpete da referência)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: "#8b98ae", roughness: 0.95}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);
  // céu e prédios (vistos pela janela)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(400, 60), new THREE.MeshBasicMaterial({map: skyTexture()}));
  sky.position.set(0, 20, -40);
  world.add(sky);
  const r = rng(11);
  for (let i = 0; i < 18; i++) {
    const w = 2 + r() * 2.5, h = 6 + r() * 12, d = 2 + r() * 2;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({map: windowsTexture(3, Math.round(h)), roughness: 0.8}));
    b.position.set(-18 + i * 2.6 + r(), h / 2, -11 - r() * 6);
    world.add(b);
  }
  // parede do fundo com janelão (abertura x -6..0.5, y 2.4..6.8)
  const wallC = "#ece8e1";
  const Z = -4.6;
  world.add(at(box(1.2, 9, 0.25, wallC), -6.6, 4.5, Z));
  world.add(at(box(7.5, 9, 0.25, wallC), 4.25, 4.5, Z));
  world.add(at(box(6.5, 2.4, 0.25, wallC), -2.75, 1.2, Z));
  world.add(at(box(6.5, 2.2, 0.25, wallC), -2.75, 7.9, Z));
  const frameC = "#3c4048";
  world.add(at(box(6.7, 0.16, 0.35, frameC), -2.75, 2.42, Z));
  world.add(at(box(6.7, 0.16, 0.35, frameC), -2.75, 6.8, Z));
  for (const x of [-6, -3.85, -1.65, 0.5]) world.add(at(box(0.14, 4.5, 0.35, frameC), x, 4.6, Z));
  // rodapé
  world.add(at(box(14, 0.25, 0.3, "#d6d0c6"), 0, 0.12, Z + 0.15));
  // parede da esquerda
  world.add(at(box(0.25, 9, 14, "#e2ddd5"), -7.2, 4.5, 2.4));
  // planta
  const pot = at(mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 20), "#e9e9e9"), -6.3, 0.35, -3.7);
  world.add(pot);
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.ConeGeometry(0.12, 1.3, 8), "#3f8f4e");
    leaf.position.set(-6.3, 1.2, -3.7);
    leaf.rotation.set((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9);
    world.add(leaf);
  }
}

function buildCounter(world, refs) {
  const g = new THREE.Group();
  world.add(g);
  g.add(at(rbox(4.4, 1.65, 1.2, 0.06, C.wood), 0, 0.825, 0));
  g.add(at(rbox(4.6, 0.12, 1.36, 0.04, C.woodLight), 0, 1.71, 0));
  // faixa amarela "PADARIA"
  g.add(at(rbox(3.3, 0.66, 0.05, 0.03, "#2b1b12"), -0.35, 1.0, 0.61));
  const band = labelPlane(textTexture("PADARIA", {w: 1024, h: 200, bg: C.band, color: "#3b2414", font: "900 150px Montserrat, Arial"}), 3.2, 0.58);
  band.position.set(-0.35, 1.0, 0.64);
  g.add(band);
  // vitrine de vidro
  const vit = new THREE.Group();
  vit.position.set(-1.15, COUNTER_TOP, 0.05);
  g.add(vit);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.95, 1.0), new THREE.MeshPhysicalMaterial({color: "#e6f4ff", transparent: true, opacity: 0.07, roughness: 0.05, clearcoat: 0.3, depthWrite: false}));
  glass.position.y = 0.5;
  vit.add(glass);
  for (const [x, z] of [[-0.95, 0.5], [0.95, 0.5], [-0.95, -0.5], [0.95, -0.5]]) vit.add(at(box(0.05, 0.97, 0.05, C.steel, {metal: 0.7, rough: 0.3}), x, 0.5, z));
  vit.add(at(box(1.95, 0.05, 1.05, C.steel, {metal: 0.7, rough: 0.3}), 0, 0.99, 0));
  vit.add(at(box(1.9, 0.04, 1.0, "#fff3dc"), 0, 0.03, 0));
  refs.vitBreads = [];
  for (let i = 0; i < 6; i++) {
    const b = makeBread(C.bread, {scale: 0.85});
    b.position.set(-0.7 + (i % 3) * 0.7, 0.14, i < 3 ? -0.25 : 0.0);
    b.rotation.y = 0.15 * (i % 2 ? 1 : -1);
    vit.add(b);
    refs.vitBreads.push(b);
  }
  refs.breadDark = makeBread(C.breadDark);
  refs.breadDark.position.set(-0.45, 0.16, 0.3);
  refs.breadLight = makeBread(C.breadLight);
  refs.breadLight.position.set(0.45, 0.16, 0.3);
  refs.breadPale = makeBread(C.breadPale, {face: true});
  refs.breadPale.position.set(0, 0.16, 0.3);
  vit.add(refs.breadDark, refs.breadLight, refs.breadPale);
  refs.vitrine = vit;
  // cesto
  const basket = new THREE.Group();
  basket.position.set(0.55, COUNTER_TOP, 0.1);
  g.add(basket);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.38, 28, 1, true), new THREE.MeshStandardMaterial({color: "#a8763e", roughness: 0.9, side: THREE.DoubleSide}));
  wick.position.y = 0.19;
  wick.castShadow = true;
  basket.add(wick);
  basket.add(at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), "#8a5c2c"), 0, 0.02, 0));
  basket.add(at(mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 32), "#8a5c2c"), 0, 0.38, 0));
  basket.children[basket.children.length - 1].rotation.x = Math.PI / 2;
  refs.oldBreads = [0, 1].map((i) => {
    const b = makeBread(C.breadOld, {scale: 0.9});
    b.position.set(-0.15 + i * 0.3, 0.16, -0.05 + i * 0.1);
    b.rotation.y = 0.5 - i;
    basket.add(b);
    return b;
  });
  const r = rng(5);
  refs.hotBreads = Array.from({length: 12}, (_, i) => {
    const b = makeBread(C.bread, {scale: 0.8});
    const a = (i / 12) * Math.PI * 4;
    b.userData.rest = new THREE.Vector3(Math.cos(a) * (0.12 + (i % 4) * 0.07), 0.16 + Math.floor(i / 4) * 0.13, Math.sin(a) * (0.12 + (i % 4) * 0.06));
    b.rotation.y = r() * Math.PI;
    b.rotation.z = (r() - 0.5) * 0.4;
    basket.add(b);
    return b;
  });
  refs.basket = basket;
  // balança digital
  const scale = new THREE.Group();
  scale.position.set(1.62, COUNTER_TOP, 0.12);
  g.add(scale);
  scale.add(at(rbox(0.85, 0.22, 0.65, 0.06, "#dfe3e8"), 0, 0.11, 0));
  scale.add(at(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 32), C.steel, {metal: 0.8, rough: 0.25}), 0, 0.25, -0.03));
  const panel = at(rbox(0.7, 0.24, 0.06, 0.03, "#2b2f36"), 0, 0.2, 0.36);
  panel.rotation.x = -0.35;
  scale.add(panel);
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 80;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.18), new THREE.MeshBasicMaterial({map: tex}));
  disp.position.set(0, 0.21, 0.395);
  disp.rotation.x = -0.35;
  scale.add(disp);
  let last = null;
  refs.setScale = (kg) => {
    const txt = kg.toFixed(3).replace(".", ",") + " kg";
    if (txt === last) return;
    last = txt;
    const g2 = cv.getContext("2d");
    g2.fillStyle = "#0f2a12";
    g2.fillRect(0, 0, 256, 80);
    g2.fillStyle = "#5dff7a";
    g2.font = "700 52px 'Courier New', monospace";
    g2.textAlign = "center";
    g2.textBaseline = "middle";
    g2.fillText(txt, 128, 42);
    tex.needsUpdate = true;
  };
  refs.setScale(0);
  refs.scale = scale;
  // plaquinha de preço (valor em branco de propósito)
  const tag = new THREE.Group();
  tag.position.set(1.25, 1.3, 0.63);
  g.add(tag);
  tag.add(at(rbox(1.0, 0.5, 0.05, 0.03, C.band), 0, 0, 0));
  const tagTxt = labelPlane(textTexture(["PÃO FRANCÊS", "R$ ___ /kg"], {w: 512, h: 240, bg: "#ffffff", color: "#2b1b12", font: "900 64px Montserrat, Arial"}), 0.9, 0.42);
  tagTxt.position.z = 0.03;
  tag.add(tagTxt);
  refs.priceTag = tag;
  // seta azul apontando a plaquinha
  const arrow = new THREE.Group();
  arrow.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), "#2f7df6"), 0, 0.45, 0));
  const tip = at(mesh(new THREE.ConeGeometry(0.16, 0.3, 16), "#2f7df6"), 0, 0.1, 0);
  tip.rotation.z = Math.PI;
  arrow.add(tip);
  arrow.position.set(1.25, 1.6, 0.9);
  g.add(arrow);
  refs.arrow = arrow;
  // sacos de pão usados em cenas diferentes
  refs.bagCounter = makePaperBag();
  refs.bagCounter.position.set(-0.1, COUNTER_TOP, 0.2);
  g.add(refs.bagCounter);
  refs.bagScale = makePaperBag();
  scale.add(refs.bagScale);
  refs.bagBig = makePaperBag(0.75, 0.9, 0.45);
  refs.bagBig.position.set(0, 0.27, -0.03);
  scale.add(refs.bagBig);
  refs.fallBreads = Array.from({length: 10}, () => {
    const b = makeBread(C.bread, {scale: 0.7});
    scale.add(b);
    return b;
  });
  refs.counter = g;
}

function buildBack(world, refs) {
  // forno
  const oven = new THREE.Group();
  oven.position.set(-4.4, 0, -3.85);
  world.add(oven);
  oven.add(at(rbox(2.4, 3.0, 1.3, 0.1, "#aab1b9", {metal: 0.5, rough: 0.35}), 0, 1.5, 0));
  oven.add(at(rbox(2.0, 0.35, 0.05, 0.03, "#2b2f36"), 0, 2.7, 0.66));
  oven.add(at(mesh(new THREE.PlaneGeometry(1.7, 1.0), "#ff8a2a", {emissive: "#ff7a1a", ei: 1.2}), 0, 1.6, 0.6));
  const door = new THREE.Group();
  door.position.set(0, 1.05, 0.66);
  oven.add(door);
  door.add(at(rbox(1.9, 1.2, 0.08, 0.04, "#7b838d", {metal: 0.6, rough: 0.3}), 0, 0.6, 0));
  door.add(at(mesh(new THREE.PlaneGeometry(1.4, 0.75), "#3a2a20", {emissive: "#ff7a1a", ei: 0.35}), 0, 0.6, 0.045));
  door.add(at(rbox(1.2, 0.08, 0.1, 0.03, "#2b2f36"), 0, 1.05, 0.1));
  refs.ovenDoor = door;
  const tray = new THREE.Group();
  tray.position.set(0, 1.25, 0.2);
  oven.add(tray);
  tray.add(at(box(1.5, 0.04, 0.8, "#5a5f66", {metal: 0.6}), 0, 0, 0));
  for (let i = 0; i < 6; i++) {
    const b = makeBread(C.bread, {scale: 0.75});
    b.position.set(-0.55 + (i % 3) * 0.55, 0.1, -0.18 + Math.floor(i / 3) * 0.36);
    tray.add(b);
  }
  refs.tray = tray;
  refs.oven = oven;
  // vapor
  refs.steam = Array.from({length: 30}, () => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshStandardMaterial({color: "#ffffff", transparent: true, opacity: 0.6, depthWrite: false}));
    world.add(s);
    return s;
  });
  // prateleiras
  const sh = new THREE.Group();
  sh.position.set(3.6, 0, -4.2);
  world.add(sh);
  for (const x of [-1.3, 1.3]) sh.add(at(box(0.12, 3.6, 0.7, C.wood), x, 1.8, 0));
  const r = rng(3);
  for (let k = 0; k < 4; k++) {
    sh.add(at(box(2.7, 0.08, 0.7, C.woodLight), 0, 0.6 + k * 0.9, 0));
    if (k === 0) continue;
    for (let i = 0; i < 4; i++) {
      const b = makeBread(r() > 0.5 ? C.bread : C.breadDark, {scale: 0.8 + r() * 0.3});
      b.position.set(-0.9 + i * 0.6, 0.8 + k * 0.9 - 0.15, 0.05);
      b.rotation.y = (r() - 0.5) * 0.6;
      sh.add(b);
    }
  }
}

function buildHome(world, refs) {
  const H = new THREE.Group();
  H.position.x = HOME_X;
  world.add(H);
  const wallC = "#f1e1c8";
  H.add(at(box(14, 9, 0.25, wallC), 0, 4.5, -3.2));
  // janela da casa
  H.add(at(box(3.4, 2.6, 0.3, "#ffffff"), -2.2, 4.4, -3.05));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.3), new THREE.MeshBasicMaterial({map: skyTexture()}));
  sky.position.set(-2.2, 4.4, -2.88);
  H.add(sky);
  H.add(at(box(0.1, 2.4, 0.32, "#ffffff"), -2.2, 4.4, -3.0));
  // quadro na parede
  H.add(at(rbox(1.3, 1.0, 0.06, 0.03, "#e0b04a"), 2.4, 4.6, -3.05));
  // mesa
  const t = new THREE.Group();
  H.add(t);
  t.add(at(rbox(3.4, 0.14, 1.8, 0.04, "#c08a5a"), 0, 1.55, 0));
  for (const [x, z] of [[-1.5, -0.75], [1.5, -0.75], [-1.5, 0.75], [1.5, 0.75]]) t.add(at(box(0.14, 1.5, 0.14, "#9a6a40"), x, 0.75, z));
  // toalhinha
  t.add(at(box(1.6, 0.01, 1.0, "#e85c5c"), -0.3, 1.625, 0.1));
  const top = 1.63;
  // saco plástico com pão (cena 11)
  refs.plastic = new THREE.Group();
  refs.plastic.position.set(-0.3, top, 0.35);
  t.add(refs.plastic);
  refs.plastic.add(makePlasticBag());
  refs.softBread = makeBread(C.bread);
  refs.softBread.position.y = 0.17;
  refs.plastic.add(refs.softBread);
  const r = rng(9);
  refs.drops = Array.from({length: 22}, () => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.025 + r() * 0.02, 8, 6), new THREE.MeshPhysicalMaterial({color: "#ffffff", transparent: true, opacity: 0.8, clearcoat: 1, roughness: 0.05}));
    const a = r() * Math.PI * 2;
    d.position.set((r() - 0.5) * 1.1, 0.27 + Math.sin(a) * 0.24, Math.cos(a) * 0.22);
    refs.plastic.add(d);
    return d;
  });
  // saco de papel + pão partido + caneca (cena 12)
  refs.homePaper = new THREE.Group();
  refs.homePaper.position.set(-1.1, top, -0.2);
  t.add(refs.homePaper);
  refs.homePaper.add(makePaperBag());
  refs.split = makeSplitBread();
  refs.split.position.set(-0.2, top + 0.2, 0.4);
  t.add(refs.split);
  refs.crumbs = Array.from({length: 26}, () => {
    const c = box(0.04, 0.03, 0.04, r() > 0.5 ? "#f0c27a" : "#fbe7c0");
    c.userData.v = new THREE.Vector3((r() - 0.5) * 1.6, 0.6 + r() * 1.0, (r() - 0.2) * 0.8);
    c.userData.spin = r() * 10;
    refs.split.add(c);
    return c;
  });
  const mug = new THREE.Group();
  mug.position.set(1.0, top, 0.35);
  t.add(mug);
  mug.add(at(mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.4, 24), "#ffffff"), 0, 0.2, 0));
  mug.add(at(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24), "#4a2a14"), 0, 0.38, 0));
  const handle = at(mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 16), "#ffffff"), 0.22, 0.2, 0);
  mug.add(handle);
  refs.mugSteam = Array.from({length: 6}, () => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false}));
    mug.add(s);
    return s;
  });
  refs.home = H;
}

function buildExtras(world, refs) {
  // carimbo gigante (cena 7) — ícone de balança, sem logotipo. Face para +z, cabo para trás.
  const st = new THREE.Group();
  world.add(st);
  const body = new THREE.Group();
  body.rotation.x = -Math.PI / 2 + 0.12;
  st.add(body);
  body.add(at(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.35, 40), "#c0392b"), 0, 0, 0));
  body.add(at(mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 20), "#8e2a20"), 0, 0.6, 0));
  body.add(at(sphere(0.38, "#c0392b"), 0, 1.15, 0));
  const faceTex = textTexture(["A PESO", "✓"], {w: 512, h: 512, bg: "#fff6e6", color: "#c0392b", font: "900 130px MontserratLocal, Arial"});
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.82, 40), new THREE.MeshStandardMaterial({map: faceTex, roughness: 0.7}));
  disc.rotation.x = Math.PI / 2;
  disc.position.y = -0.18;
  body.add(disc);
  st.scale.setScalar(0.62);
  refs.stamp = st;
  // confete
  const r = rng(21);
  const cols = ["#ffd21f", "#ffffff", "#ff7a59", "#5dc1ff", "#7be07b"];
  refs.confetti = Array.from({length: 44}, (_, i) => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), new THREE.MeshStandardMaterial({color: cols[i % cols.length], side: THREE.DoubleSide}));
    c.userData = {x: (r() - 0.5) * 6, z: (r() - 0.5) * 3, d: r(), s: r() * 6};
    world.add(c);
    return c;
  });
}

export function buildWorld() {
  const world = new THREE.Group();
  const refs = {};
  buildRoom(world);
  buildCounter(world, refs);
  buildBack(world, refs);
  buildHome(world, refs);
  buildExtras(world, refs);
  refs.prof = makeProfessor({pose: "idle", mood: "feliz"});
  world.add(refs.prof);
  refs.baker = makeBaker();
  world.add(refs.baker);
  refs.tongs = makeTongs();
  refs.baker.userData.parts.arms[1].userData.grip.add(refs.tongs);
  refs.bagPivot = new THREE.Group();
  refs.bagHand = makePaperBag();
  refs.bagHand.position.set(0, -0.72, 0.05);
  refs.bagPivot.add(refs.bagHand);
  refs.prof.userData.parts.arms[1].userData.grip.add(refs.bagPivot);
  buildV2(world, refs);
  return {world, refs};
}

function buildV2(world, refs) {
  const r = rng(33);
  // raquetes de pão de forma
  refs.profSlice = makeSlice();
  refs.profSlice.position.set(0, -0.3, 0.12);
  refs.prof.userData.parts.arms[1].userData.grip.add(refs.profSlice);
  refs.bakerSlice = makeSlice();
  refs.bakerSlice.position.set(0, -0.3, 0.12);
  refs.baker.userData.parts.arms[1].userData.grip.add(refs.bakerSlice);
  // bolinha + rastro
  refs.ball = makeBall();
  world.add(refs.ball);
  refs.trail = Array.from({length: 7}, (_, i) => {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({color: "#ffffff", transparent: true, opacity: 0.5 - i * 0.06, depthWrite: false}));
    world.add(t);
    return t;
  });
  // baguete-rede (atravessa o balcão)
  refs.baguette = makeBaguette(1.25);
  refs.baguette.rotation.y = Math.PI / 2;
  world.add(refs.baguette);
  // brilho nos óculos
  refs.glint = makeGlint();
  refs.glint.position.set(0.32, 0.18, 0.75);
  refs.prof.userData.parts.head.add(refs.glint);
  // farinha e papéis (tapa no balcão)
  refs.flour = Array.from({length: 30}, () => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({color: "#fbfaf5", transparent: true, opacity: 0.85, depthWrite: false}));
    f.userData.v = new THREE.Vector3((r() - 0.5) * 2.4, 1.2 + r() * 2.2, (r() - 0.3) * 1.6);
    world.add(f);
    return f;
  });
  refs.papers = Array.from({length: 6}, () => {
    const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshStandardMaterial({color: "#ffffff", side: THREE.DoubleSide}));
    pp.castShadow = true;
    pp.userData = {v: new THREE.Vector3((r() - 0.5) * 3, 2 + r() * 2, (r() - 0.2) * 2), s: r() * 6};
    world.add(pp);
    return pp;
  });
  // sonho com raios de luz
  refs.sonho = makeSonho();
  world.add(refs.sonho);
  refs.rays = makeRays();
  world.add(refs.rays);
  refs.sparkles = Array.from({length: 10}, (_, i) => {
    const g = makeGlint();
    g.scale.setScalar(0.5);
    g.userData = {a: r() * Math.PI * 2, d: 0.45 + r() * 0.35, ph: r() * 6};
    world.add(g);
    return g;
  });
  // chuva de pão (60) — pousa no balcão ou no chão
  refs.rain = Array.from({length: 60}, (_, i) => {
    const b = makeBread(r() > 0.25 ? C.bread : C.breadDark, {scale: 0.85});
    const x = -2.6 + r() * 6.2, z = -0.7 + r() * 2.6;
    const onCounter = x > -2.2 && x < 2.2 && z > -0.6 && z < 0.6;
    b.userData = {x, z, y: (onCounter ? 1.9 : 0.15) + Math.floor(r() * 3) * 0.16, t0: r(), rot: r() * Math.PI, tilt: (r() - 0.5) * 0.8};
    world.add(b);
    return b;
  });
  // montanha de pão na mesa da casa
  refs.homePile = new THREE.Group();
  refs.homePile.position.set(HOME_X, 0, 0);
  world.add(refs.homePile);
  for (let i = 0; i < 46; i++) {
    const b = makeBread(r() > 0.3 ? C.bread : C.breadDark, {scale: 0.9});
    const onTable = i < 30;
    const a = r() * Math.PI * 2, rr = Math.sqrt(r());
    if (onTable) b.position.set(Math.cos(a) * rr * 1.4 + 0.2, 1.75 + (1 - rr) * 0.55 + r() * 0.15, Math.sin(a) * rr * 0.7 - 0.2);
    else b.position.set((r() - 0.5) * 4, 0.15 + r() * 0.1, 1.1 + r() * 0.8);
    b.rotation.set((r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.4);
    refs.homePile.add(b);
  }
  refs.homeSonho = makeSonho();
  refs.homeSonho.position.set(HOME_X - 0.2, 1.88, 0.55);
  world.add(refs.homeSonho);
  refs.note = makeNote();
  world.add(refs.note);
}
