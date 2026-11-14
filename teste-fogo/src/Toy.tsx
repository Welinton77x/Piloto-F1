import React, {useMemo} from "react";
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type {Pose} from "./Boy";

/* ===== Personagem estilo "boneco de vinil": formas lisas e arredondadas, cabeção, olhos pretos brilhantes,
   bochecha rosada, cabelo em cuia com aba grossa. Usa a mesma Pose do Boy (mesmos movimentos). ===== */

export type ToyLook = {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  shoe?: string;
  sole?: string;
  backpack?: string; // mochila nas costas (cor)
  hoodie?: boolean; // casaco com capuz, manga comprida e cordinhas pretas
  hairStyle?: "bowl" | "spiky" | "curly" | "ponytail" | "pigtails" | "long" | "bun" | "buzz" | "straight" | "mohawk" | "bald";
  jelly?: number; // 0..1 coberto de gelatina de morango
  suit?: boolean; // terno de noivo (paletó preto, camisa branca, gravata borboleta)
  dress?: boolean; // vestido de noiva (corpete + saia longa até o chão)
  veil?: boolean; // véu + tiara
  polo?: boolean; // camisa polo de gola branca (roupa da foto)
  flare?: boolean; // calça jeans pantalona
  lashes?: boolean; // cílios
  lips?: string; // cor da boca
  apron?: boolean; // avental branco de cozinheiro por cima da roupa
  plaid?: string; // camisa xadrez: cor das listras
  belly?: number; // barriguinha (0..1)
  flipflop?: boolean; // chinelo de dedo (pé de fora; shoe = cor da tira, sole = cor do solado)
};

const sm = (color: string, rough = 0.55, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});

const plaidCache = new Map<string, THREE.CanvasTexture>();
const plaidTex = (base: string, line: string) => {
  const k = base + line;
  let t = plaidCache.get(k);
  if (t) return t;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = base;
  x.fillRect(0, 0, 128, 128);
  x.globalAlpha = 0.55;
  x.fillStyle = line;
  for (let i = 0; i < 4; i++) {
    x.fillRect(i * 32 + 10, 0, 10, 128);
    x.fillRect(0, i * 32 + 10, 128, 10);
  }
  x.globalAlpha = 0.25;
  x.fillStyle = "#000000";
  for (let i = 0; i < 4; i++) {
    x.fillRect(i * 32 + 26, 0, 3, 128);
    x.fillRect(0, i * 32 + 26, 128, 3);
  }
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  plaidCache.set(k, t);
  return t;
};
const useToyMats = (L: ToyLook) =>
  useMemo(
    () => ({
      skin: sm(L.skin ?? "#dfac80", 0.5),
      skinDark: sm("#c98f62", 0.55),
      shirt: L.plaid ? new THREE.MeshStandardMaterial({map: plaidTex(L.shirt ?? "#c0392b", L.plaid), roughness: 0.7}) : sm(L.shirt ?? "#ffcd2e", 0.6),
      shirtDark: sm("#e7a816", 0.6),
      pants: sm(L.pants ?? "#2f55b0", 0.65),
      pantsHem: sm(new THREE.Color(L.pants ?? "#2f55b0").multiplyScalar(0.8).getStyle(), 0.65),
      hair: sm(L.hair ?? "#3b2416", L.hairStyle === "straight" ? 0.32 : 0.45, {side: THREE.DoubleSide}),
      shoe: sm(L.shoe ?? "#f4f4f2", 0.45),
      sole: sm(L.sole ?? "#f08a1c", 0.5),
      eye: sm("#0c0c10", 0.12, {metalness: 0.1}),
      white: sm("#ffffff", 0.2),
      brow: sm("#2a170d", 0.5),
      mouth: sm("#3a1510", 0.5),
      tongue: sm("#e2606e", 0.45),
      blush: sm("#f3a0a6", 0.6),
      bag: sm("#a88094", 0.7),
      pack: sm(L.backpack ?? "#2f6fd6", 0.5),
      packDark: sm(new THREE.Color(L.backpack ?? "#2f6fd6").multiplyScalar(0.75).getStyle(), 0.5),
      strap: sm("#4a5260", 0.6),
      cord: sm("#141414", 0.45),
      jelly: sm("#e8303f", 0.15, {transparent: true, opacity: 0.85, metalness: 0.05}),
      cuffWhite: sm("#f7f7f4", 0.5),
      lapel: sm(new THREE.Color(L.shirt ?? "#1d1f27").multiplyScalar(0.7).getStyle(), 0.45),
      satin: sm("#fbfaf6", 0.35),
      lace: sm("#f1efe9", 0.6),
      pearl: sm("#fffaf0", 0.2, {metalness: 0.2}),
      lips: sm(L.lips ?? "#3a1510", 0.45),
      veil: sm("#ffffff", 0.3, {transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false}),
      silver: sm("#dfe3ea", 0.2, {metalness: 0.7}),
      apron: sm("#f8f8f5", 0.55, {side: THREE.DoubleSide}),
      apronDark: sm("#e6e6e0", 0.6),
    }),
    [L.skin, L.shirt, L.pants, L.hair, L.shoe, L.sole, L.backpack, L.lips, L.hairStyle, L.plaid],
  );

/* proporções medidas no boneco de referência (altura total ≈ 2,0):
   tênis 0–0,13 · pernas até 0,70 · tronco 0,70–1,415 · cabeça (com cabelo) 1,445–2,0 */
const HIP = 0.72;
const TORSO_BOT = 0.7;
const TORSO_TOP = 1.415;
const HIPX = 0.125;
const SHX = 0.36;
const SHY = 1.325;
const THIGH = 0.3;
const PANT_R = 0.118;
const SHIN = 0.29;


/* linha do cabelo (altura no espaço da cabeça) em função do ângulo em volta da cabeça (0 = frente, ±π = nuca) */
const HAIR_R = 0.345;
const HAIR_SC: [number, number, number] = [1.05, 0.93, 1.02];
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const RING_Y = 0.15; // altura do rolo de cabelo (acima das sobrancelhas e das orelhas)
const ringR = () => {
  const yy = RING_Y / HAIR_SC[1];
  return Math.sqrt(HAIR_R * HAIR_R - yy * yy);
};
/** borda de baixo do cabelo de trás (altura), conforme o ângulo em volta da cabeça (|a| de ~1,9 até π) */
const backEdge = (a: number) => {
  const k = sstep(1.9, 2.6, Math.abs(a));
  return 0.05 + (-0.11 - 0.05) * k + 0.014 * Math.sin(a * 6) * k;
};
const HEAD_R = 0.32;
const HEAD_SC: [number, number, number] = [1, 0.96, 0.94];
/** ponto na pele da cabeça (um tiquinho pra fora) */
const onHead = (a: number, y: number, out = 1.018): THREE.Vector3 => {
  const yu = y / HEAD_SC[1];
  const r = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - yu * yu));
  return new THREE.Vector3(r * Math.sin(a) * HEAD_SC[0] * out, y * out, r * Math.cos(a) * HEAD_SC[2] * out);
};
const makeHair = () => {
  // cuia baixa e lisa em cima
  const cap = new THREE.SphereGeometry(HAIR_R, 64, 24, 0, Math.PI * 2, 0, Math.acos(RING_Y / HAIR_SC[1] / HAIR_R));
  cap.scale(...HAIR_SC);
  // rolo grosso em volta da cabeça toda
  const ring = new THREE.TorusGeometry(ringR(), 0.064, 18, 72);
  ring.rotateX(Math.PI / 2);
  ring.scale(HAIR_SC[0], 1, HAIR_SC[2]);
  ring.translate(0, RING_Y, 0);
  // cabelo de trás: camada colada na cabeça, do rolo até a borda ondulada
  const NA = 64;
  const NY = 10;
  const a0 = 1.85;
  const verts: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= NA; i++) {
    const a = a0 + (i / NA) * (Math.PI * 2 - 2 * a0);
    const yb = backEdge(a);
    for (let j = 0; j <= NY; j++) {
      const y = lerpN(RING_Y + 0.02, yb, j / NY);
      const v = onHead(a, y);
      verts.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < NA; i++)
    for (let j = 0; j < NY; j++) {
      const p = i * (NY + 1) + j;
      const q = (i + 1) * (NY + 1) + j;
      index.push(p, p + 1, q, q, p + 1, q + 1);
    }
  const back = new THREE.BufferGeometry();
  back.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  back.setIndex(index);
  back.computeVertexNormals();
  return {shell: cap, rim: ring, edge: back};
};
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- outros cabelos (para os figurantes): touca lisa + detalhes ---------- */
const capGeo = (() => {
  let g: THREE.SphereGeometry | null = null;
  return () => {
    if (!g) {
      g = new THREE.SphereGeometry(0.335, 40, 24, 0, Math.PI * 2, 0, 1.28);
      g.rotateX(-0.42);
      g.scale(1.03, 0.98, 1.03);
    }
    return g;
  };
})();
const fib = (n: number, minY: number) =>
  Array.from({length: n}, (_, i) => {
    const y = 1 - (i / (n - 1)) * (1 - minY);
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    return [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number];
  });
const OtherHair: React.FC<{style: string; m: THREE.Material}> = ({style, m}) => {
  const cap = <mesh geometry={capGeo()} material={m} castShadow />;
  if (style === "buzz") return cap;
  if (style === "spiky")
    return (
      <>
        {cap}
        {fib(11, 0.45).map(([x, y, z], i) => (
          <mesh key={i} position={[x * 0.31, y * 0.31 + 0.02, z * 0.31 - 0.02]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y + 0.4, z).normalize())} material={m} castShadow>
            <coneGeometry args={[0.065, 0.17, 12]} />
          </mesh>
        ))}
      </>
    );
  if (style === "curly")
    return (
      <>
        {cap}
        {fib(26, -0.15).filter(([, , z], i) => !(z > 0.55 && i > 6)).map(([x, y, z], i) => (
          <mesh key={i} position={[x * 0.34, y * 0.33 + 0.03, z * 0.33 - 0.03]} material={m} castShadow>
            <sphereGeometry args={[0.095, 14, 10]} />
          </mesh>
        ))}
      </>
    );
  if (style === "bun")
    return (
      <>
        {cap}
        <mesh position={[0, 0.33, -0.1]} material={m} castShadow>
          <sphereGeometry args={[0.13, 18, 14]} />
        </mesh>
      </>
    );
  if (style === "ponytail")
    return (
      <>
        {cap}
        <mesh position={[0, 0.12, -0.33]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ff5c8a", 0.5)}>
          <torusGeometry args={[0.05, 0.02, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.05, -0.4]} rotation={[0.35, 0, 0]} material={m} castShadow>
          <capsuleGeometry args={[0.075, 0.24, 8, 14]} />
        </mesh>
      </>
    );
  if (style === "pigtails")
    return (
      <>
        {cap}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.33 * sd, 0.02, -0.08]}>
            <mesh position={[0.06 * sd, -0.08, 0]} rotation={[0, 0, 0.35 * sd]} material={m} castShadow>
              <capsuleGeometry args={[0.07, 0.16, 8, 14]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#ff5c8a", 0.5)}>
              <torusGeometry args={[0.045, 0.018, 8, 16]} />
            </mesh>
          </group>
        ))}
      </>
    );
  if (style === "bald") return null;
  if (style === "mohawk")
    return (
      <>
        {/* crista: uma "barbatana" lisa + pontas por cima, da testa até a nuca */}
        <mesh position={[0, 0.3, -0.06]} rotation={[0.35, 0, 0]} scale={[0.08, 0.16, 0.31]} material={m} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        {Array.from({length: 8}, (_, i) => {
          const a = -0.35 + (i / 7) * 1.95; // da testa até a nuca
          const h = 0.38 - Math.abs(i - 2.5) * 0.03;
          const r = 0.3 + h / 2 - 0.05;
          return (
            <mesh key={i} position={[0, Math.cos(a) * r, -Math.sin(a) * r]} rotation={[-a - 0.25, 0, 0]} material={m} castShadow>
              <coneGeometry args={[0.085, h, 12]} />
            </mesh>
          );
        })}
      </>
    );
  // long
  return (
    <>
      {cap}
      <mesh position={[0, -0.12, -0.22]} material={m} castShadow>
        <capsuleGeometry args={[0.2, 0.32, 10, 20]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.27 * sd, -0.1, -0.06]} material={m} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 8, 14]} />
        </mesh>
      ))}
    </>
  );
};

/* ---------- cabelo liso comprido, repartido no meio (a noiva) ---------- */
const straightHair = (() => {
  let g: {parts: THREE.BufferGeometry[]; rims: THREE.BufferGeometry[]; part: THREE.BufferGeometry} | null = null;
  return () => {
    if (g) return g;
    const R = 0.355;
    const FACE = 0.62; // meia-abertura do rosto (rad)
    const T0 = 0.98; // linha do cabelo na testa
    const T1 = 1.78; // até o queixo
    const SX = 1.03;
    const SY = 0.97;
    const yTop = R * Math.cos(T1) * SY;
    const yEnd = -0.74;
    const CHEST = 0.27; // na frente do peito
    const BACK = -0.31; // atrás das costas
    const top = new THREE.SphereGeometry(R, 56, 16, 0, Math.PI * 2, 0, T0);
    top.scale(SX, SY, 1);
    const sides = new THREE.SphereGeometry(R, 56, 14, Math.PI / 2 + FACE, Math.PI * 2 - 2 * FACE, T0, T1 - T0);
    sides.scale(SX, SY, 1);
    /** ponto da cortina de cabelo: ângulo a (0 = frente), altura y */
    const curtain = (a: number, y: number) => {
      const k = Math.min(1, Math.max(0, (yTop - y) / (yTop - yEnd)));
      const r = 0.358 + 0.075 * Math.min(1, k * 2.2);
      let x = r * Math.sin(a);
      let z = r * Math.cos(a);
      const below = Math.min(1, Math.max(0, (yTop - 0.2 - y) / 0.2));
      if (z > 0) z = Math.min(z, lerpN(z, CHEST, below));
      else z = Math.max(z, lerpN(z, BACK, below));
      x *= 1 - 0.06 * k;
      return new THREE.Vector3(x, y, z);
    };
    const panel = (a0: number, a1: number, na: number) => {
      const NY = 14;
      const pos: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= na; i++)
        for (let j = 0; j <= NY; j++) {
          const v = curtain(lerpN(a0, a1, i / na), lerpN(yTop + 0.004, yEnd, j / NY));
          pos.push(v.x, v.y, v.z);
        }
      for (let i = 0; i < na; i++)
        for (let j = 0; j < NY; j++) {
          const p = i * (NY + 1) + j;
          const q = (i + 1) * (NY + 1) + j;
          idx.push(p, p + 1, q, q, p + 1, q + 1);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    };
    const LOCK = 1.25;
    const BK = 1.95;
    const back = panel(BK, Math.PI * 2 - BK, 40);
    const lockR = panel(FACE, LOCK, 10);
    const lockL = panel(Math.PI * 2 - LOCK, Math.PI * 2 - FACE, 10);
    // bordas arredondadas (dão "espessura" ao cabelo)
    const tube = (pts: THREE.Vector3[], r = 0.03) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 8, false);
    const onSphere = (a: number, th: number) => new THREE.Vector3(R * Math.sin(th) * Math.sin(a) * SX, R * Math.cos(th) * SY, R * Math.sin(th) * Math.cos(a));
    const edgeDown = (a: number) => [
      ...Array.from({length: 6}, (_, i) => onSphere(a, lerpN(T0 - 0.05, T1, i / 5))),
      ...Array.from({length: 8}, (_, i) => curtain(a, lerpN(yTop - 0.02, yEnd, (i + 1) / 8))),
    ];
    const bottom = (a0: number, a1: number, n: number) => Array.from({length: n + 1}, (_, i) => curtain(lerpN(a0, a1, i / n), yEnd));
    const rims = [
      tube(edgeDown(FACE)),
      tube(edgeDown(-FACE)),
      tube(bottom(FACE, LOCK, 6)),
      tube(bottom(-LOCK, -FACE, 6)),
      tube(bottom(BK, Math.PI * 2 - BK, 24)),
      tube(Array.from({length: 9}, (_, i) => curtain(LOCK, lerpN(yTop, yEnd, i / 8)))),
      tube(Array.from({length: 9}, (_, i) => curtain(-LOCK, lerpN(yTop, yEnd, i / 8)))),
      tube(Array.from({length: 9}, (_, i) => curtain(BK, lerpN(yTop, yEnd, i / 8)))),
      tube(Array.from({length: 9}, (_, i) => curtain(-BK, lerpN(yTop, yEnd, i / 8)))),
      // linha da testa (sobe um pouquinho no meio: risca no meio)
      tube(Array.from({length: 13}, (_, i) => {
        const a = lerpN(-FACE, FACE, i / 12);
        return onSphere(a, T0 - 0.02 - 0.16 * Math.exp(-(a * a) / 0.02));
      }), 0.028),
    ];
    // risca no meio (pele aparecendo)
    const part = new THREE.BufferGeometry();
    g = {parts: [top, sides, back, lockR, lockL], rims, part};
    return g;
  };
})();
const StraightHair: React.FC<{m: THREE.Material; skin: THREE.Material}> = ({m, skin}) => {
  const g = straightHair();
  return (
    <>
      {g.parts.map((geo, i) => (
        <mesh key={i} geometry={geo} material={m} castShadow />
      ))}
      {g.rims.map((geo, i) => (
        <mesh key={"r" + i} geometry={geo} material={m} castShadow />
      ))}
    </>
  );
};

/* ---------- textura do logo da camisa polo (rabisco bege genérico) ---------- */
const logoTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, 256, 256);
    x.strokeStyle = "#d9b38c";
    x.lineWidth = 16;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(60, 170);
    x.bezierCurveTo(20, 60, 200, 30, 190, 110);
    x.bezierCurveTo(180, 190, 80, 200, 110, 120);
    x.bezierCurveTo(130, 70, 230, 150, 200, 210);
    x.stroke();
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
const laceTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    x.fillStyle = "#fbfaf6";
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "#e3ded3";
    x.lineWidth = 3;
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const cx = 32 + i * 64 + (j % 2) * 32;
        const cy = 32 + j * 64;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          x.beginPath();
          x.ellipse(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 8, 4, a, 0, Math.PI * 2);
          x.stroke();
        }
      }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 2);
    return t;
  };
})();

/* ---------- avental: faixa que acompanha o contorno arredondado do tronco ---------- */
const apronGeo = (() => {
  let g: {skirt: THREE.BufferGeometry; hem: THREE.BufferGeometry; belt: THREE.BufferGeometry} | null = null;
  return () => {
    if (g) return g;
    const hx = 0.29;
    const hz = 0.205;
    const r = 0.13;
    const F = hx - r; // trecho reto da frente
    const C = (Math.PI / 2) * r; // canto arredondado
    const S = 2 * (hz - r); // lateral reta
    /** ponto do contorno a uma distância s do meio da frente (s>0 vai pro lado +x), afastado pad pra fora */
    const pt = (s: number, pad: number): [number, number] => {
      const sg = s < 0 ? -1 : 1;
      let a = Math.abs(s);
      if (a <= F) return [sg * a, hz + pad];
      a -= F;
      if (a <= C) {
        const th = a / r;
        return [sg * (F + (r + pad) * Math.sin(th)), hz - r + (r + pad) * Math.cos(th)];
      }
      a -= C;
      if (a <= S) return [sg * (hx + pad), hz - r - a];
      a -= S;
      if (a <= C) {
        const th = a / r;
        return [sg * (F + (r + pad) * Math.cos(th)), -(hz - r) - (r + pad) * Math.sin(th)];
      }
      a -= C;
      return [sg * Math.max(0, F - a), -(hz + pad)];
    };
    const strip = (s0: number, s1: number, y0: number, y1: number, pad0: number, pad1: number, ns: number, ny: number) => {
      const pos: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= ns; i++)
        for (let j = 0; j <= ny; j++) {
          const k = j / ny;
          const [x, z] = pt(lerpN(s0, s1, i / ns), lerpN(pad0, pad1, k));
          pos.push(x, lerpN(y0, y1, k), z);
        }
      for (let i = 0; i < ns; i++)
        for (let j = 0; j < ny; j++) {
          const a = i * (ny + 1) + j;
          const b = (i + 1) * (ny + 1) + j;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    };
    const W = F + C + 0.06; // até um pouquinho depois dos cantos
    const skirt = strip(-W, W, 0.97, 0.5, 0.018, 0.05, 40, 6);
    const hem = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length: 33}, (_, i) => {
      const [x, z] = pt(lerpN(-W, W, i / 32), 0.05);
      return new THREE.Vector3(x, 0.5, z);
    })), 64, 0.013, 8, false);
    const P = F + C + S + C + F;
    const belt = strip(-P, P, 0.995, 0.935, 0.024, 0.024, 72, 1);
    g = {skirt, hem, belt};
    return g;
  };
})();

export const Toy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; lPalmRef?: React.Ref<THREE.Object3D>; look?: ToyLook; headExtra?: React.ReactNode}> = ({pose, palmRef, lPalmRef, look = {}, headExtra}) => {
  const m = useToyMats(look);
  const hairGeo = useMemo(makeHair, []);
  const geo = useMemo(
    () => ({
      torso: new RoundedBoxGeometry(0.53, TORSO_TOP - TORSO_BOT, 0.37, 5, 0.11),
      shoe: new RoundedBoxGeometry(0.2, 0.12, 0.34, 4, 0.055),
      pack: new RoundedBoxGeometry(0.47, 0.6, 0.22, 4, 0.085),
      pocket: new RoundedBoxGeometry(0.34, 0.2, 0.07, 3, 0.03),
      strapF: new RoundedBoxGeometry(0.065, 0.6, 0.03, 2, 0.012),
      hoodie: new RoundedBoxGeometry(0.58, TORSO_TOP - TORSO_BOT + 0.02, 0.41, 5, 0.13),
      hem: new RoundedBoxGeometry(0.585, 0.09, 0.415, 3, 0.04),
      kpocket: new RoundedBoxGeometry(0.38, 0.17, 0.04, 3, 0.03),
      hoodBack: new RoundedBoxGeometry(0.4, 0.2, 0.12, 3, 0.06),
      strapT: new RoundedBoxGeometry(0.065, 0.03, 0.42, 2, 0.012),
      sole: new RoundedBoxGeometry(0.21, 0.035, 0.35, 3, 0.015),
      shirtV: (() => {
        const sh = new THREE.Shape();
        sh.moveTo(-0.11, TORSO_TOP - 0.01);
        sh.lineTo(0.11, TORSO_TOP - 0.01);
        sh.lineTo(0, 1.04);
        sh.closePath();
        return new THREE.ShapeGeometry(sh);
      })(),
      lapel: new RoundedBoxGeometry(0.06, 0.34, 0.02, 2, 0.008),
      bodice: new RoundedBoxGeometry(0.5, 0.44, 0.35, 4, 0.1),
      chest: new RoundedBoxGeometry(0.47, 0.18, 0.31, 4, 0.08),
      skirt: (() => {
        const sk = new THREE.CylinderGeometry(0.25, 0.84, 0.95, 64, 6, true);
        const pos = sk.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const y = pos.getY(i);
          const k = (0.475 - y) / 0.95; // 0 em cima .. 1 embaixo
          const a = Math.atan2(x, z);
          const w = 1 + 0.035 * k * Math.sin(a * 12);
          pos.setX(i, x * w);
          pos.setZ(i, z * w);
        }
        sk.computeVertexNormals();
        sk.translate(0, 0.475, 0);
        return sk;
      })(),
      bib: new RoundedBoxGeometry(0.34, 0.4, 0.03, 3, 0.012),
      apronPocket: new RoundedBoxGeometry(0.22, 0.13, 0.02, 2, 0.008),
      collarFlap: (() => {
        const sh = new THREE.Shape();
        sh.moveTo(0, 0);
        sh.lineTo(0.13, -0.02);
        sh.quadraticCurveTo(0.12, -0.11, 0.03, -0.12);
        sh.closePath();
        return new THREE.ShapeGeometry(sh);
      })(),
    }),
    [],
  );
  const {
    pos = [0, 0, 0],
    rotY = 0,
    head = [0, 0, 0],
    torso = [0, 0, 0],
    rShoulder = [0, 0, -0.08],
    rElbow = -0.15,
    rWrist = [0, 0, 0],
    lShoulder = [0, 0, 0.08],
    lElbow = -0.15,
    lWrist = [0, 0, 0],
    blink = 0,
    eyeWide = 0,
    pupil = [0, 0],
    brow = 0,
    mouthOpen = 0,
    smile = 0,
    breathe = 0,
    squash = 0,
    hairLift = 0,
    walk = 0,
    walkAmt = 0,
    legLift = 0,
    bags = 0,
  } = pose;
  const eyeY = Math.max(0.08, (1 - blink) * (1 + eyeWide * 0.2));
  const browUp = brow * 0.025 + eyeWide * 0.015;
  const browRot = brow < 0 ? brow * 0.4 : brow * 0.12;

  const arm = (side: 1 | -1, shoulder: [number, number, number], elbow: number, wrist: [number, number, number], ref?: React.Ref<THREE.Object3D>) => (
    <group position={[SHX * side, SHY, 0]} rotation={shoulder}>
      {look.hoodie || look.suit ? (
        /* manga comprida do casaco (fofinha) */
        <mesh position={[0, -0.12, 0]} material={m.shirt} castShadow>
          <capsuleGeometry args={[0.112, 0.17, 6, 14]} />
        </mesh>
      ) : (
        <>
          {/* manga curta da camiseta */}
          <mesh position={[0, -0.07, 0]} material={look.dress ? m.satin : m.shirt} castShadow>
            <capsuleGeometry args={[0.112, look.dress ? 0.02 : 0.08, 6, 14]} />
          </mesh>
          {look.polo && (
            <mesh position={[0, -0.185, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.cuffWhite}>
              <torusGeometry args={[0.1, 0.02, 8, 20]} />
            </mesh>
          )}
          {/* braço */}
          <mesh position={[0, -0.14, 0]} material={m.skin} castShadow>
            <capsuleGeometry args={[0.09, 0.16, 6, 14]} />
          </mesh>
        </>
      )}
      <group position={[0, -0.26, 0]} rotation={[elbow, 0, 0]}>
        {look.hoodie || look.suit ? (
          <>
            <mesh position={[0, -0.1, 0]} material={m.shirt} castShadow>
              <capsuleGeometry args={[0.106, 0.14, 6, 14]} />
            </mesh>
            {/* punho */}
            <mesh position={[0, -0.215, 0]} material={look.suit ? m.cuffWhite : m.shirtDark} castShadow>
              <capsuleGeometry args={[0.1, 0.03, 6, 14]} />
            </mesh>
          </>
        ) : (
          <mesh position={[0, -0.11, 0]} material={m.skin} castShadow>
            <capsuleGeometry args={[0.088, 0.16, 6, 14]} />
          </mesh>
        )}
        <group position={[0, -0.25, 0]} rotation={wrist}>
          {/* mão de bolinha */}
          <mesh position={[0, -0.045, 0]} material={m.skin} castShadow>
            <sphereGeometry args={[0.095, 18, 14]} />
          </mesh>
          <object3D ref={ref} position={[0, -0.06, 0.09]} />
        </group>
      </group>
    </group>
  );

  return (
    <group position={[pos[0], pos[1] + 0.022 * walkAmt * (Math.cos(2 * walk) - 1), pos[2]]} rotation={[0, rotY, 0]} scale={[1 + squash * 0.5, 1 - squash, 1 + squash * 0.5]}>
      {/* vestido de noiva: saia longa até o chão (fica no quadril, não gira com o tronco) */}
      {look.dress && (
        <>
          <mesh geometry={geo.skirt} material={m.lace} castShadow receiveShadow>
            <meshStandardMaterial attach="material" map={laceTex()} roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.satin} castShadow>
            <torusGeometry args={[0.845, 0.04, 10, 64]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.lace}>
            <circleGeometry args={[0.84, 48]} />
          </mesh>
        </>
      )}
      {/* pernas: calça azul, tênis branco com sola laranja */}
      {!look.dress && [-1, 1].map((sd) => {
        const ph = walk + (sd > 0 ? 0 : Math.PI);
        const A = 0.38 * walkAmt;
        const thigh = Math.sin(ph) * A;
        const swing = walkAmt > 0 ? Math.max(0, -Math.cos(ph)) : 0;
        const knee = 0.95 * walkAmt * swing + 0.08 * walkAmt + Math.max(0, legLift) * 0.9;
        const hipRot = thigh - 0.9 * legLift;
        const foot = -(hipRot + knee) * (walkAmt > 0 ? 0.7 : 0);
        return (
          <group key={sd} position={[HIPX * sd, HIP, 0]} rotation={[hipRot, 0, 0]}>
            <mesh position={[0, -THIGH / 2 + 0.03, 0]} material={m.pants} castShadow receiveShadow>
              <cylinderGeometry args={[PANT_R, PANT_R, THIGH + 0.06, 24]} />
            </mesh>
            <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
              <mesh material={m.pants} castShadow>
                <sphereGeometry args={[PANT_R, 24, 16]} />
              </mesh>
              <mesh position={[0, -SHIN / 2 + 0.01, 0]} material={m.pants} castShadow receiveShadow>
                <cylinderGeometry args={[PANT_R, PANT_R + (look.flare ? 0.035 : 0.004), SHIN - 0.02, 24]} />
              </mesh>
              <mesh position={[0, -SHIN + 0.035, 0]} material={m.pantsHem} castShadow>
                <cylinderGeometry args={[PANT_R + (look.flare ? 0.04 : 0.008), PANT_R + (look.flare ? 0.042 : 0.008), 0.045, 24]} />
              </mesh>
              <group position={[0, -SHIN, 0]} rotation={[foot, 0, 0]}>
                {look.flipflop ? (
                  <>
                    <mesh position={[0, -0.07, 0.05]} scale={[0.82, 0.62, 0.9]} geometry={geo.shoe} material={m.skin} castShadow />
                    <mesh position={[0, -0.112, 0.05]} geometry={geo.sole} material={m.sole} />
                    {[-1, 1].map((k) => (
                      <mesh key={k} position={[0.045 * k, -0.06, 0.1]} rotation={[0, 0.5 * k, 0]} material={m.shoe}>
                        <boxGeometry args={[0.025, 0.07, 0.13]} />
                      </mesh>
                    ))}
                  </>
                ) : (
                  <>
                    <mesh position={[0, -0.055, 0.05]} geometry={geo.shoe} material={m.shoe} castShadow />
                    <mesh position={[0, -0.112, 0.05]} geometry={geo.sole} material={m.sole} />
                  </>
                )}
              </group>
            </group>
          </group>
        );
      })}
      {/* tronco: gira em volta do quadril */}
      <group position={[0, HIP, 0]} rotation={torso}>
        <group position={[0, -HIP, 0]}>
          {look.hoodie ? (
            <>
              {/* casaco amarelo com capuz, bolso canguru, barra e cordinhas pretas */}
              <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.hoodie} material={m.shirt} castShadow receiveShadow />
              <mesh position={[0, TORSO_BOT + 0.03, 0]} geometry={geo.hem} material={m.shirtDark} castShadow />
              <mesh position={[0, 0.9, 0.2]} geometry={geo.kpocket} material={m.shirtDark} castShadow />
              {/* gola do capuz */}
              <mesh position={[0, TORSO_TOP + 0.005, -0.01]} rotation={[-Math.PI / 2, 0, 0]} material={m.shirt} castShadow>
                <torusGeometry args={[0.17, 0.07, 10, 28, Math.PI]} />
              </mesh>
              <mesh position={[0, TORSO_TOP - 0.005, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={m.shirtDark}>
                <torusGeometry args={[0.13, 0.03, 8, 24]} />
              </mesh>
              {/* capuz dobrado nas costas */}
              <mesh position={[0, TORSO_TOP - 0.08, -0.215]} rotation={[0.25, 0, 0]} geometry={geo.hoodBack} material={m.shirt} castShadow />
              {/* cordinhas pretas (ficam por baixo do avental quando ele está de avental) */}
              {!look.apron && [-1, 1].map((sd) => (
                <group key={sd} position={[0.055 * sd, TORSO_TOP - 0.03, 0.215]} rotation={[0.08, 0, 0.04 * sd]}>
                  <mesh position={[0, -0.1, 0]} material={m.cord}>
                    <capsuleGeometry args={[0.013, 0.17, 4, 8]} />
                  </mesh>
                  <mesh position={[0, -0.2, 0]} material={m.cord}>
                    <capsuleGeometry args={[0.02, 0.025, 4, 8]} />
                  </mesh>
                </group>
              ))}
            </>
          ) : look.suit ? (
            <>
              {/* paletó preto, camisa branca em V, lapelas, gravata borboleta, flor na lapela */}
              <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.hoodie} material={m.shirt} castShadow receiveShadow />
              <mesh position={[0, TORSO_BOT + 0.03, 0]} geometry={geo.hem} material={m.lapel} castShadow />
              <mesh position={[0, 0, 0.207]} geometry={geo.shirtV} material={m.cuffWhite} />
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.07 * sd, 1.22, 0.209]} rotation={[0, 0, 0.3 * sd]} geometry={geo.lapel} material={m.lapel} castShadow />
              ))}
              <mesh position={[0, TORSO_TOP - 0.005, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={m.cuffWhite}>
                <torusGeometry args={[0.12, 0.028, 8, 20]} />
              </mesh>
              <group position={[0, TORSO_TOP - 0.045, 0.215]}>
                {[-1, 1].map((sd) => (
                  <mesh key={sd} position={[0.035 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={m.cord}>
                    <coneGeometry args={[0.032, 0.06, 4]} />
                  </mesh>
                ))}
                <mesh material={m.cord}>
                  <sphereGeometry args={[0.018, 10, 8]} />
                </mesh>
              </group>
              {[0.98, 0.86].map((y) => (
                <mesh key={y} position={[0, y, 0.205]} material={m.cord}>
                  <sphereGeometry args={[0.014, 10, 8]} />
                </mesh>
              ))}
              <group position={[0.17, 1.24, 0.215]}>
                <mesh material={sm("#e8414f", 0.5)}>
                  <sphereGeometry args={[0.03, 12, 10]} />
                </mesh>
                <mesh position={[0.015, -0.035, -0.005]} rotation={[0, 0, -0.5]} scale={[0.6, 1.4, 0.4]} material={sm("#3f9a35", 0.6)}>
                  <sphereGeometry args={[0.02, 10, 8]} />
                </mesh>
              </group>
            </>
          ) : look.dress ? (
            <>
              {/* corpete branco com faixa de pérolas; ombros de fora */}
              <mesh position={[0, 1.33, 0]} geometry={geo.chest} material={m.skin} castShadow />
              <mesh position={[0, 1.09 + breathe * 0.003, 0]} geometry={geo.bodice} material={m.satin} castShadow receiveShadow />
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.1 * sd, 1.29, 0.13]} scale={[1, 0.7, 0.75]} material={m.satin} castShadow>
                  <sphereGeometry args={[0.105, 18, 14]} />
                </mesh>
              ))}
              <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]} material={m.pearl}>
                <torusGeometry args={[0.245, 0.028, 10, 40]} />
              </mesh>
              {Array.from({length: 7}, (_, i) => (
                <mesh key={"p" + i} position={[(i - 3) * 0.045, 1.24 - Math.abs(i - 3) * 0.008, 0.175]} material={m.pearl}>
                  <sphereGeometry args={[0.013, 8, 6]} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.torso} material={m.shirt} castShadow receiveShadow />
              {(look.belly ?? 0) > 0.01 && (
                <mesh position={[0, 0.92, 0.12]} scale={[0.27, 0.24, 0.17 * (look.belly ?? 0) + 0.08]} material={m.shirt} castShadow>
                  <sphereGeometry args={[1, 24, 18]} />
                </mesh>
              )}
              {/* gola */}
              <mesh position={[0, TORSO_TOP - 0.01, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={look.polo ? m.cuffWhite : m.shirtDark}>
                <torusGeometry args={[0.11, 0.026, 8, 20]} />
              </mesh>
              {look.polo && (
                <>
                  {[-1, 1].map((sd) => (
                    <mesh key={sd} position={[0.012 * sd, TORSO_TOP - 0.02, 0.19]} rotation={[-0.25, 0, 0]} scale={[sd, 1, 1]} geometry={geo.collarFlap} material={m.cuffWhite} />
                  ))}
                  <mesh position={[0, 0.98, 0.187]} material={sm("#ffffff", 0.6, {map: logoTex(), transparent: true})}>
                    <planeGeometry args={[0.3, 0.3]} />
                  </mesh>
                </>
              )}
            </>
          )}
          {look.apron && (
            <>
              {/* avental branco: peitilho, saia, bolso, alças do pescoço, faixa e laço atrás */}
              <mesh position={[0, 1.15, 0.243]} geometry={geo.bib} material={m.apron} castShadow />
              <mesh geometry={apronGeo().skirt} material={m.apron} castShadow receiveShadow />
              <mesh geometry={apronGeo().hem} material={m.apron} />
              <mesh geometry={apronGeo().belt} material={m.apron} castShadow />
              <mesh position={[0, 0.74, 0.268]} rotation={[-0.035, 0, 0]} geometry={geo.apronPocket} material={m.apronDark} />
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.135 * sd, 1.385, 0.2]} rotation={[-0.55, 0, 0.12 * sd]} material={m.apron}>
                  <capsuleGeometry args={[0.018, 0.1, 4, 8]} />
                </mesh>
              ))}
              <group position={[0, 0.965, -0.238]}>
                {[-1, 1].map((sd) => (
                  <mesh key={sd} position={[0.07 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={m.apron}>
                    <coneGeometry args={[0.055, 0.12, 4]} />
                  </mesh>
                ))}
                <mesh material={m.apron}>
                  <sphereGeometry args={[0.03, 10, 8]} />
                </mesh>
                {[-1, 1].map((sd) => (
                  <mesh key={"t" + sd} position={[0.035 * sd, -0.1, 0]} rotation={[0, 0, 0.2 * sd]} material={m.apron}>
                    <capsuleGeometry args={[0.014, 0.14, 4, 8]} />
                  </mesh>
                ))}
              </group>
            </>
          )}
          {look.backpack && (
            <>
              {/* mochila nas costas + alças passando pela frente */}
              <mesh position={[0, 1.06, -0.3]} geometry={geo.pack} material={m.pack} castShadow />
              <mesh position={[0, 0.9, -0.425]} geometry={geo.pocket} material={m.packDark} castShadow />
              <mesh position={[0, 1.37, -0.29]} rotation={[0, Math.PI / 2, 0]} material={m.packDark}>
                <torusGeometry args={[0.05, 0.014, 8, 16, Math.PI]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <group key={sd}>
                  <mesh position={[0.15 * sd, 1.1, look.hoodie ? 0.214 : 0.197]} geometry={geo.strapF} material={m.strap} castShadow />
                  <mesh position={[0.15 * sd, TORSO_TOP + (look.hoodie ? 0.02 : 0.005), -0.02]} geometry={geo.strapT} material={m.strap} />
                </group>
              ))}
            </>
          )}
          {(look.jelly ?? 0) > 0.01 &&
            [[-0.15, 1.2, 0.19, 0.09], [0.12, 0.95, 0.19, 0.11], [0.2, 1.3, 0.17, 0.07], [-0.05, 0.82, 0.19, 0.08], [0.0, 1.05, 0.2, 0.06]].map(([x, y, z, r], i) => (
              <mesh key={"j" + i} position={[x, y, z]} scale={[(look.jelly ?? 0) * 1, (look.jelly ?? 0) * 0.8, (look.jelly ?? 0) * 0.5]} material={m.jelly}>
                <sphereGeometry args={[r, 14, 10]} />
              </mesh>
            ))}
          {arm(-1, rShoulder, rElbow, rWrist, palmRef)}
          {arm(1, lShoulder, lElbow, lWrist, lPalmRef)}
          {/* cabeça */}
          <group position={[0, TORSO_TOP + 0.29, 0]} rotation={head} scale={0.875}>
            <mesh scale={[1, 0.96, 0.94]} material={m.skin} castShadow>
              <sphereGeometry args={[0.32, 40, 30]} />
            </mesh>
            {/* orelhas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.315 * sd, -0.02, -0.01]} scale={[0.45, 0.9, 0.7]} material={m.skin}>
                <sphereGeometry args={[0.075, 16, 12]} />
              </mesh>
            ))}
            {/* cabelo: uma peça lisa só, com a borda grossa e arredondada seguindo a linha do cabelo */}
            {(look.hairStyle ?? "bowl") === "bowl" ? (
              <>
                <mesh geometry={hairGeo.shell} material={m.hair} castShadow />
                <mesh geometry={hairGeo.rim} material={m.hair} castShadow />
                <mesh geometry={hairGeo.edge} material={m.hair} castShadow />
              </>
            ) : (
              look.hairStyle === "straight" ? <StraightHair m={m.hair} skin={m.skin} /> : <OtherHair style={look.hairStyle!} m={m.hair} />
            )}
            {hairLift > 0.3 &&
              [[-0.12, 0.2], [0.05, -0.15], [0.16, 0.3], [-0.05, 0.5]].map(([x, r], i) => (
                <mesh key={i} position={[x, 0.33, -0.02 + i * 0.03]} rotation={[0.2 * i - 0.3, 0, r]} scale={hairLift} material={m.hair}>
                  <coneGeometry args={[0.045, 0.16, 10]} />
                </mesh>
              ))}
            {/* sobrancelhas grossas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.115 * sd, 0.062 + browUp, 0.285]} rotation={[-0.3, 0.3 * sd, Math.PI / 2 - browRot * sd]} scale={look.lashes ? [0.7, 1, 0.7] : 1} material={m.brow}>
                <capsuleGeometry args={[0.022, 0.065, 4, 10]} />
              </mesh>
            ))}
            {/* olhos pretos brilhantes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[0.11 * sd + pupil[0] * 0.01, -0.03 + pupil[1] * 0.01, 0.27]} rotation={[0, 0.33 * sd, 0]} scale={[1 + eyeWide * 0.15, eyeY, 1]}>
                <mesh scale={[0.052, 0.062, 0.024]} material={m.eye}>
                  <sphereGeometry args={[1, 20, 14]} />
                </mesh>
                {look.lashes &&
                  [0, 1].map((k) => (
                    <mesh key={k} position={[(0.036 + k * 0.014) * sd, 0.048 - k * 0.014, 0.008]} rotation={[0, 0, -sd * (0.75 + k * 0.35)]} material={m.eye}>
                      <capsuleGeometry args={[0.0075, 0.03, 4, 6]} />
                    </mesh>
                  ))}
                <mesh position={[0.018, 0.024, 0.02]} scale={0.015} material={m.white}>
                  <sphereGeometry args={[1, 10, 8]} />
                </mesh>
              </group>
            ))}
            {/* olheiras */}
            {bags > 0.01 &&
              [-1, 1].map((sd) => (
                <mesh key={sd} position={[0.11 * sd, -0.095, 0.262]} rotation={[0, 0.3 * sd, 0]} scale={[0.045, 0.014 * bags, 0.01]} material={m.bag}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              ))}
            {/* bochechas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.18 * sd, -0.1, 0.24]} rotation={[0, 0.55 * sd, 0]} scale={[0.05, 0.034, 0.012]} material={m.blush}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
            ))}
            {/* nariz */}
            <mesh position={[0, -0.075, 0.3]} material={m.skinDark}>
              <sphereGeometry args={[0.03, 14, 10]} />
            </mesh>
            {/* boca */}
            {mouthOpen > 0.05 ? (
              <group position={[0, -0.155, 0.278]}>
                <mesh scale={[0.05 - mouthOpen * 0.01, 0.014 + mouthOpen * 0.045, 0.02]} material={m.mouth}>
                  <sphereGeometry args={[1, 16, 12]} />
                </mesh>
                <mesh position={[0, -0.012 - mouthOpen * 0.018, 0.008]} scale={[0.028, 0.01 + mouthOpen * 0.014, 0.014]} material={m.tongue}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              </group>
            ) : (
              <mesh position={[0, -0.125, 0.282]} rotation={[0.15, 0, Math.PI + (Math.PI - Math.PI * (0.55 + smile * 0.25)) / 2]} material={look.lips ? m.lips : m.mouth}>
                <torusGeometry args={[0.042, 0.009, 8, 24, Math.PI * (0.55 + smile * 0.25)]} />
              </mesh>
            )}
            {look.veil && (
              <group>
                {/* tiara de pérolas em cima do cabelo */}
                {Array.from({length: 9}, (_, i) => {
                  const a = -0.95 + (i / 8) * 1.9;
                  const th = 0.62;
                  const r = 0.36;
                  return (
                    <mesh key={i} position={[r * Math.sin(th) * Math.sin(a) * 1.03, r * Math.cos(th) * 0.97 + (i === 4 ? 0.035 : 0.012), r * Math.sin(th) * Math.cos(a)]} material={i === 4 ? m.silver : m.pearl}>
                      <sphereGeometry args={[i === 4 ? 0.034 : 0.022, 10, 8]} />
                    </mesh>
                  );
                })}
                {/* véu caindo pelas costas até o chão */}
                <mesh position={[0, -0.84, -0.14]} material={m.veil}>
                  <cylinderGeometry args={[0.3, 0.92, 2.3, 40, 1, true, 2.05, Math.PI * 2 - 4.1]} />
                </mesh>
              </group>
            )}
            {headExtra}
          </group>
        </group>
      </group>
    </group>
  );
};
