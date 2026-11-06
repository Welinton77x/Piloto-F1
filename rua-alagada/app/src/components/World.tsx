// Diorama persistente (corte transversal). Cada peça lê seu estado de track(alvo, frameGlobal).
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {S, finalCut, timed} from "../data/scenes";
import {track} from "../lib/track";
import {clamp01, mixHex, rad} from "../lib/anim";
import {mapX, poseAt} from "../lib/camera";
import {Mascot} from "./Mascot";
import {mascotPose} from "../lib/mascotPose";

export const FACE = 1; // face cortada (z) voltada para a câmera
const ZB = -2.6; // profundidade das peças locais (piscinão, juntas...)
const FAR = -48; // rua, solo e rio continuam até o horizonte
const DEPTH = FACE - FAR;

// layout real (u3d, esquemático)
export const X = {
  soilL: -4.6, soilR: 6.4,
  houseL: -4.4, houseR: -3.0,
  swL: [-3.0, -2.2] as const, street: [-2.2, 2.2] as const, swR: [2.2, 3.0] as const,
  inlet: 2.0, green: [3.0, 4.8] as const, river: [4.8, 6.2] as const,
  res: [3.1, 4.6] as const,
};
export const Y = {soilBottom: -18, riverBed: -2.9, resTop: -1.6, resBottom: -2.75, pipeIn: -0.9, pipeOut: -1.25};
const CURB = 0.18;

const C = {
  soil1: "#7a5534", soil2: "#6a4a2e", soil3: "#58402a", wet: "#3e2b1c",
  asphalt: "#3b414d", sidewalk: "#c3c8cf", curb: "#e1e4e8", grass: "#7ccf52", grass2: "#5db443",
  concrete: "#9aa4ae", concreteD: "#7d8791", water: "#3fa9f5", waterD: "#1f6fb5", pipe: "#cfd6de",
  wall: "#f6ecd9", roof: "#c9563c", trunk: "#7a4f2c", leaf: "#3f9b3a", red: "#E53935", cyan: "#4DD0FF",
};

const M: React.FC<{c: string; o?: number; e?: string; ei?: number; metal?: number; side?: THREE.Side}> = ({c, o = 1, e = "#000000", ei = 0, metal = 0, side}) => (
  <meshStandardMaterial color={c} transparent={o < 1} opacity={o} depthWrite={o >= 1} emissive={e} emissiveIntensity={ei} metalness={metal} roughness={0.85} side={side ?? THREE.FrontSide} />
);

/** caixa por limites: x0..x1, y0..y1, z0..z1 */
const B: React.FC<{x: [number, number]; y: [number, number]; z?: [number, number]; c: string; o?: number; e?: string; ei?: number}> = ({x, y, z = [FAR, FACE], c, o, e, ei}) => {
  const w = x[1] - x[0], h = y[1] - y[0], d = z[1] - z[0];
  if (w <= 0.0001 || h <= 0.0001 || d <= 0.0001) return null;
  return (
    <mesh position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}>
      <boxGeometry args={[w, h, d]} />
      <M c={c} o={o} e={e} ei={ei} />
    </mesh>
  );
};

/** cilindro entre dois pontos */
const Tube: React.FC<{a: [number, number, number]; b: [number, number, number]; r: number; c: string; o?: number; seg?: number; e?: string; ei?: number}> = ({a, b, r, c, o, seg = 14, e, ei}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, seg, 1, true]} />
      <M c={c} o={o} e={e} ei={ei} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Arrow: React.FC<{p: [number, number, number]; dir: number; s?: number; c?: string; o?: number}> = ({p, dir, s = 1, c = C.cyan, o = 1}) => (
  <group position={p} rotation={[0, 0, dir]} scale={s}>
    <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.09, 0.22, 3]} />
      <M c={c} o={o} e={c} ei={0.4} />
    </mesh>
    <mesh position={[-0.17, 0, 0]}>
      <boxGeometry args={[0.2, 0.05, 0.05]} />
      <M c={c} o={o} e={c} ei={0.4} />
    </mesh>
  </group>
);

/* ---------------- chuva (instanciada) ---------------- */
const RAIN_MAX = 640;
const Rain: React.FC<{gf: number; density: number; opacity: number; floorAt: (x: number) => number}> = ({gf, density, opacity, floorAt}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const n = Math.round(300 * density);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < RAIN_MAX; i++) {
      if (i >= n) {
        tmp.position.set(0, -999, 0);
        tmp.scale.set(0, 0, 0);
      } else {
        const x = -5.2 + random("rx" + i) * 12.2;
        const z = -4 + random("rz" + i) * 6.4;
        const top = 9.5, bottom = floorAt(x);
        const span = top - bottom;
        const speed = 0.55 + random("rs" + i) * 0.15;
        const y = top - ((gf * speed + random("ry" + i) * span) % span);
        tmp.position.set(x, y, z);
        tmp.scale.set(1, 1, 1);
      }
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, RAIN_MAX]} frustumCulled={false}>
      <boxGeometry args={[0.018, 0.34, 0.018]} />
      <meshBasicMaterial color="#cfe8ff" transparent opacity={opacity} />
    </instancedMesh>
  );
};

/* ---------------- gotas infiltrando no corte ---------------- */
const Drops: React.FC<{gf: number; zones: {x: [number, number]; k: number}[]; depth: number}> = ({gf, zones, depth}) => {
  const items: React.ReactNode[] = [];
  zones.forEach((zn, zi) => {
    const count = Math.round(14 * zn.k * (zn.x[1] - zn.x[0]));
    for (let i = 0; i < count; i++) {
      const id = `d${zi}-${i}`;
      const x = zn.x[0] + random(id + "x") * (zn.x[1] - zn.x[0]);
      const ph = random(id + "p") * 60;
      const t = ((gf + ph) % 60) / 60;
      items.push(
        <mesh key={id} position={[x, -0.15 - t * depth, FACE + 0.04]} scale={[1, 1.5, 1]}>
          <icosahedronGeometry args={[0.055, 0]} />
          <M c={C.cyan} o={0.95 * (1 - t * 0.6)} e={C.cyan} ei={0.5} />
        </mesh>,
      );
    }
  });
  return <>{items}</>;
};

/* ---------------- perfil abaulado da rua ---------------- */
const StreetGeo = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const [a, b] = X.street;
    s.moveTo(a, 0);
    s.lineTo(b, 0);
    s.lineTo(b, 0.05);
    s.lineTo(0, 0.16);
    s.lineTo(a, 0.05);
    s.closePath();
    return s;
  }, []);
  return <extrudeGeometry args={[shape, {depth: DEPTH, bevelEnabled: false}]} />;
};

/* ---------------- árvores / arbustos ---------------- */
/** árvore de copa redonda e fofa (estilo liso) */
const Tree: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.55, 0]}>
      <cylinderGeometry args={[0.08, 0.13, 1.1, 12]} />
      <M c={C.trunk} />
    </mesh>
    <mesh position={[0, 1.45, 0]} scale={[1, 0.95, 1]}>
      <sphereGeometry args={[0.72, 24, 18]} />
      <M c={C.leaf} />
    </mesh>
    <mesh position={[0.42, 1.2, 0.2]}>
      <sphereGeometry args={[0.45, 20, 14]} />
      <M c="#4aaa41" />
    </mesh>
    <mesh position={[-0.38, 1.25, -0.15]}>
      <sphereGeometry args={[0.48, 20, 14]} />
      <M c="#378f34" />
    </mesh>
  </group>
);

/** pinheiro (fundo) */
const Pine: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
      <M c={C.trunk} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.7 + i * 0.42, 0]}>
        <coneGeometry args={[0.55 - i * 0.13, 0.75, 14]} />
        <M c={i % 2 ? "#2f7d3a" : "#2a7034"} />
      </mesh>
    ))}
  </group>
);

/** grama em folhas (instanciada, balança com o vento) */
type Area = {x: [number, number]; z: [number, number]; n: number};
const GrassBlades: React.FC<{areas: Area[]; gf: number; scale?: number; seed: string}> = ({areas, gf, scale = 1, seed}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const total = areas.reduce((a, b) => a + b.n, 0);
  const pts = useMemo(() => {
    const out: {x: number; z: number; h: number; r: number; c: number; ph: number}[] = [];
    areas.forEach((a, ai) => {
      for (let i = 0; i < a.n; i++) {
        const id = `${seed}${ai}-${i}`;
        out.push({x: a.x[0] + random(id + "x") * (a.x[1] - a.x[0]), z: a.z[0] + random(id + "z") * (a.z[1] - a.z[0]), h: 0.16 + random(id + "h") * 0.3, r: random(id + "r") * Math.PI, c: random(id + "c"), ph: random(id + "p") * 6.28});
      }
    });
    return out;
  }, [areas, seed]);
  const colors = useMemo(() => ["#5fb33c", "#4a9c33", "#78c94f", "#3f8a2e"].map((c) => new THREE.Color(c)), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    pts.forEach((b, i) => {
      tmp.position.set(b.x, (b.h * scale) / 2 + 0.05, b.z);
      tmp.rotation.set(Math.sin(gf * 0.06 + b.ph) * 0.12, b.r, Math.sin(gf * 0.05 + b.ph) * 0.1);
      tmp.scale.set(1, b.h * scale, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, colors[Math.floor(b.c * colors.length)]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  if (scale < 0.01) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} frustumCulled={false}>
      <coneGeometry args={[0.03, 1, 4]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
};

/** flores vermelhas e rosas */
const Flowers: React.FC<{spots: [number, number][]; scale?: number}> = ({spots, scale = 1}) => (
  <group>
    {scale > 0.01 &&
      spots.map(([x, z], i) => (
        <group key={i} position={[x, 0.05, z]} scale={scale}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
            <M c="#3f8a2e" />
          </mesh>
          {Array.from({length: 5}).map((_, k) => (
            <mesh key={k} position={[Math.sin((k / 5) * 6.28) * 0.06, 0.34, Math.cos((k / 5) * 6.28) * 0.06]}>
              <sphereGeometry args={[0.045, 10, 8]} />
              <M c={i % 3 === 0 ? "#ff7aa8" : "#ef4b4b"} />
            </mesh>
          ))}
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <M c="#ffd84d" />
          </mesh>
        </group>
      ))}
  </group>
);

/* ---------------- telhado (prisma triangular extrudado em z) ---------------- */
const RoofGeo: React.FC<{w: number; h: number; d: number}> = ({w, h, d}) => {
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(w / 2, 0);
    sh.lineTo(0, h);
    sh.closePath();
    return sh;
  }, [w, h]);
  return <extrudeGeometry args={[shape, {depth: d, bevelEnabled: false}]} />;
};

/* ---------------- calçada de placas (instanciada) ---------------- */
const Pavers: React.FC<{x: [number, number]; perm: number}> = ({x, perm}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const size = 0.38;
  const cols = Math.max(1, Math.round((x[1] - x[0] - 0.08) / size));
  const rows = 40;
  const n = cols * rows;
  const gap = 0.035 + perm * 0.03;
  const tw = (x[1] - x[0] - 0.08) / cols;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    let k = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        tmp.position.set(x[0] + 0.04 + tw * (c + 0.5), CURB - 0.005, FACE - size * (r + 0.5));
        tmp.scale.set(tw - gap, 0.03, size - gap);
        tmp.updateMatrix();
        m.setMatrixAt(k++, tmp.matrix);
      }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <boxGeometry args={[1, 1, 1]} />
      <M c={mixHex("#d3d7dd", "#b7bdb0", perm)} />
    </instancedMesh>
  );
};

/* ---------------- casas, árvores e morros ao fundo (o bairro continua) ---------------- */
const Backdrop: React.FC<{city: number}> = ({city}) => {
  const houses: [number, number, string, string][] = [
    [-5.3, -4.6, "#f2e6d0", "#b24a36"],
    [-5.3, -8.2, "#dfe9f2", "#4f6d8f"],
    [-5.3, -11.8, "#f5d9b8", "#b24a36"],
    [-5.3, -15.4, "#e8e2f0", "#6b4f8f"],
    [-8.4, -3.0, "#f2e6d0", "#4f6d8f"],
    [-8.4, -7.0, "#f5d9b8", "#b24a36"],
    [8.2, -2.5, "#dfe9f2", "#b24a36"],
    [8.2, -6.4, "#f2e6d0", "#4f6d8f"],
    [8.2, -10.3, "#f5d9b8", "#6b4f8f"],
    [11.4, -4.0, "#e8e2f0", "#b24a36"],
  ];
  return (
    <group>
      {city > 0.01 &&
        houses.map(([x, z, wall, roof], i) => (
          <group key={i} position={[x, 0.06, z]} scale={[1, city, 1]}>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[1.6, 1.5, 2.2]} />
              <M c={wall} />
            </mesh>
            <mesh position={[0, 1.5, -1.25]}>
              <RoofGeo w={1.9} h={0.62} d={2.5} />
              <M c={roof} />
            </mesh>
            <mesh position={[x > 0 ? -0.81 : 0.81, 0.6, 0.3]}>
              <boxGeometry args={[0.02, 0.36, 0.36]} />
              <M c="#9ad4ff" />
            </mesh>
          </group>
        ))}
      {[[-7, -1.2], [-2.8, -6], [3.8, -5.5], [7.2, -13], [-7.2, -18], [4.2, -12], [10, -8]].map(([x, z], i) => (
        <Tree key={i} x={x} z={z} s={0.9 + (i % 3) * 0.15} />
      ))}
      {[[-12, -14], [-14, -20], [-10, -24], [14, -16], [16, -22], [12, -26], [-4, -30], [5, -32], [-18, -12], [19, -12]].map(([x, z], i) => (
        <Pine key={"p" + i} x={x} z={z} s={1.3 + (i % 3) * 0.3} />
      ))}
      {/* morros distantes */}
      {[[-30, -46, 12], [-8, -50, 15], [16, -48, 13], [36, -44, 10]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -r * 0.55, z]} scale={[1.6, 1, 1]}>
          <sphereGeometry args={[r, 32, 16]} />
          <M c={i % 2 ? "#7fb35a" : "#8cc063"} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------------- casa ---------------- */
const House: React.FC<{green: number; redirect: number}> = ({green, redirect}) => {
  const w = X.houseR - X.houseL, cx = (X.houseL + X.houseR) / 2;
  return (
    <group position={[cx, CURB, -0.9]}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[w, 1.5, 2.2]} />
        <M c={C.wall} />
      </mesh>
      <mesh position={[0, 0.55, 1.11]}>
        <boxGeometry args={[0.36, 0.7, 0.02]} />
        <M c="#7a5230" />
      </mesh>
      <mesh position={[-0.42, 1.0, 1.11]}>
        <boxGeometry args={[0.36, 0.32, 0.02]} />
        <M c="#9ad4ff" />
      </mesh>
      {/* telhado de duas águas, apoiado no topo das paredes, com beiral */}
      <mesh position={[0, 1.5, -1.25]}>
        <RoofGeo w={w + 0.3} h={0.62} d={2.5} />
        <M c={mixHex(C.roof, C.grass2, green)} />
      </mesh>
      {/* oitão (triângulo da parede) */}
      <mesh position={[0, 1.5, -1.1]}>
        <RoofGeo w={w} h={0.56} d={2.2} />
        <M c={C.wall} />
      </mesh>
      {green > 0.02 &&
        [-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x * 1.2, 2.25, 0]} scale={[green, green, green]}>
            <icosahedronGeometry args={[0.2, 0]} />
            <M c={C.grass} />
          </mesh>
        ))}
      {/* calha e cano de descida (lado da rua) */}
      <mesh position={[w / 2 + 0.05, 1.47, 0.6]}>
        <boxGeometry args={[0.1, 0.08, 1.2]} />
        <M c="#8b939d" />
      </mesh>
      <mesh position={[w / 2 + 0.05, 0.74, 1.15]}>
        <boxGeometry args={[0.08, 1.46, 0.08]} />
        <M c="#8b939d" />
      </mesh>
      {/* saída do cano no gramado (a água cai na grama, não na calçada) */}
      {redirect > 0.02 && (
        <mesh position={[w / 2 + 0.05, 0.02, 1.15]} rotation={[-Math.PI / 2, 0, 0]} scale={redirect}>
          <circleGeometry args={[0.12, 16]} />
          <M c="#3fa9f5" o={0.7} />
        </mesh>
      )}
    </group>
  );
};

/* ================= MUNDO ================= */
export const World: React.FC<{gf: number}> = ({gf}) => {
  const s3 = S("s3"), s2 = S("s2"), s4 = S("s4"), s5 = S("s5"), s6 = S("s6"), s9 = S("s9"), s10 = S("s10"), s11 = S("s11");
  const before = (s: typeof s3) => gf < s.startFrame;

  // cidade: inteira na s1, some na s2 (volta no tempo), renasce peça a peça na s3
  const city = track("city.scaleY", gf, 1);
  const asphalt = before(s3) ? city : track("asphalt.scaleY", gf, 0);
  const sidewalks = before(s3) ? city : track("sidewalks.scaleY", gf, 0);
  const house = before(s3) ? city : track("house.scaleY", gf, 0);
  const natural = 1 - Math.min(asphalt, 1);
  const grassScale = gf >= s2.startFrame && before(s3) ? track("grass.scale", gf, 0) : before(s2) ? 0 : clamp01(1 - asphalt);

  // água
  const streetWater = track("streetWater.level", gf, 0.35);
  const pipeFill = track("pipeWater.fill", gf, 0);
  const riverLevel = track("river.level", gf, -1.2) - 1.0; // plano → diorama (ver mapY)
  const resVis = track("reservoir.scaleY", gf, 0);
  const resFill = track("reservoir.fill", gf, 0);
  const weir = track("weirFlow.opacity", gf, 0);
  const outletFlow = track("outletPipe.flow", gf, 0);
  const blocked = track("inlet.blocked", gf, 0);
  const waterfall = track("inlet.waterfall", gf, 0);
  const geyser = gf < s9.startFrame ? track("inletGeyser.height", gf, 0) : Math.max(0, track("inletGeyser.height", gf, 0) * (1 - clamp01((gf - s9.startFrame) / 60)));

  // céu e chuva
  const density = track("rain.density", gf, 1);
  const wet = Math.max(track("soilSection.wetness", gf, 0), gf >= s2.startFrame ? 0.15 : 0);

  // infraestrutura verde
  const perm = track("sidewalk.permeable", gf, 0);
  const garden = track("rainGarden.scaleY", gf, 0);
  const redirect = track("downspout.redirect", gf, 0);
  const roofGreen = track("roof.green", gf, 0);

  // fluxo superficial (setas e filetes)
  const runoff = gf >= s3.startFrame && gf < s6.startFrame ? track("runoff.flow", gf, 0) : gf >= s11.startFrame && gf < finalCut ? 1 : 0;
  const crown = gf >= s4.startFrame && gf < s5.startFrame ? track("crownLine.opacity", gf, 0) : 0;
  const gutterGlow = gf >= s4.startFrame && gf < s6.startFrame ? track("gutter.glow", gf, 0) : 0;
  const pipeFlowSpeed = gf >= S("s8").startFrame && gf < s9.startFrame ? track("pipeFlowArrows.speed", gf, 1) : 1;
  const flowArrowsAll = gf >= s11.startFrame && gf < finalCut ? track("flowArrowsAll.opacity", gf, 0) : 0;
  const outletRed = gf >= S("s8").startFrame && gf < s9.startFrame + 40 ? clamp01((gf - S("s8").startFrame - S("s8").durationInFrames * 0.27) / (S("s8").durationInFrames * 0.18)) : 0;

  // infiltração: natural (s2), cai na s3, volta em pontos na s10
  const infil = gf < s2.startFrame ? 0 : before(s3) ? (gf - s2.startFrame > s2.durationInFrames * 0.37 ? 1 : 0) : track("infiltration.rate", gf, 1);
  const zones: {x: [number, number]; k: number}[] = [];
  if (infil > 0.02 && gf < s4.startFrame) zones.push({x: [X.soilL + 0.1, X.green[1] - 0.1], k: infil});
  if (gf >= s10.startFrame) {
    if (perm > 0.05) zones.push({x: [X.swL[0] + 0.05, X.swL[1] - 0.05], k: perm * 1.3});
    if (garden > 0.05) zones.push({x: [X.swR[0] + 0.05, X.green[0] + 0.9], k: garden * 1.3});
    zones.push({x: [X.green[0] + 0.9, X.green[1] - 0.1], k: 0.6});
  }

  // lixo (s6): desce pela sarjeta, gruda na grade, vai para a lixeira
  const trashX = track("trash.x", gf, -1); // plano: −1 → 2,6 (coordenada antiga)
  const trashY = track("trash.y", gf, 0);
  const trashVisible = gf >= s6.startFrame && gf < S("s7").startFrame;
  const binX = 2.75; // lixeira na calçada, atrás (não cobre a grade)

  // mascote
  const mx = gf >= S("s7").startFrame ? mapX(-3.0) : mapX(track("mascot.x", gf, -3.0));
  const my = track("mascot.y", gf, 0);
  const s1 = S("s1");

  const mascotVis = gf < s2.startFrame ? 1 : before(s3) ? 0 : sidewalks;
  const waterAtMascot = streetWater > CURB ? streetWater - CURB : 0;

  const groundAt = (x: number) => {
    if (x > X.river[0] && x < X.river[1]) return riverLevel;
    return Math.max(streetWater, 0.05);
  };

  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);
  // cores do solo (umedece)
  const soilCol = (c: string) => mixHex(c, C.wet, wet * 0.55);

  // galeria: inclinação
  const pa: [number, number, number] = [X.inlet, Y.pipeIn, FACE - 0.3];
  const pb: [number, number, number] = [X.river[0], Y.pipeOut, FACE - 0.3];
  const pipeR = 0.32;
  const pipeLen = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
  const pipeAng = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);

  // eventos da s7: a água sobe pela boca de lobo
  return (
    <group>
      {/* ---------- SOLO EM CORTE (com cavidades do rio e do piscinão) ---------- */}
      <B x={[X.soilL, X.res[0]]} y={[Y.soilBottom, -1.6]} c={soilCol(C.soil3)} />
      <B x={[X.soilL, X.res[0]]} y={[-1.6, -0.5]} c={soilCol(C.soil2)} />
      <B x={[X.soilL, X.res[0]]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      <B x={[X.res[0], X.res[1]]} y={[Y.soilBottom, Y.resBottom - 0.15]} c={soilCol(C.soil3)} />
      <B x={[X.res[0], X.res[1]]} y={[Y.resTop + 0.15, -0.5]} c={soilCol(C.soil2)} />
      <B x={[X.res[0], X.res[1]]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      {/* cavidade do piscinão: preenchida de terra até ele "aparecer" */}
      <B x={[X.res[0], X.res[1]]} y={[Y.resBottom - 0.15, Y.resBottom - 0.15 + (Y.resTop - Y.resBottom + 0.3) * (1 - resVis)]} c={soilCol(C.soil3)} />
      <B x={[X.res[1], X.river[0]]} y={[Y.soilBottom, -0.5]} c={soilCol(C.soil2)} />
      <B x={[X.res[1], X.river[0]]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      <B x={[X.river[1], X.soilR]} y={[Y.soilBottom, -0.5]} c={soilCol(C.soil2)} />
      <B x={[X.river[1], X.soilR]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      {/* solo e chão além do layout (o mundo continua para os lados) */}
      <B x={[-44, X.soilL]} y={[Y.soilBottom, -0.5]} c={soilCol(C.soil2)} />
      <B x={[-44, X.soilL]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      <B x={[X.soilR, 44]} y={[Y.soilBottom, -0.5]} c={soilCol(C.soil2)} />
      <B x={[X.soilR, 44]} y={[-0.5, 0]} c={soilCol(C.soil1)} />
      {/* camadas mais fundas escurecem (leitura do corte) */}
      <B x={[-44, 44]} y={[Y.soilBottom, -4.2]} z={[FACE - 0.6, FACE + 0.002]} c={soilCol(C.soil3)} />
      {/* gramado do lote da casa e das margens (todas as épocas) */}
      <B x={[-44, X.swL[0]]} y={[0, 0.06]} c={C.grass} />
      <B x={[X.river[1], 44]} y={[0, 0.06]} c={C.grass} />
      {/* fundo e paredes de concreto do canal do rio */}
      <B x={[X.river[0], X.river[1]]} y={[Y.soilBottom, Y.riverBed]} c={C.concreteD} />
      <B x={[X.river[0], X.river[0] + 0.12]} y={[Y.riverBed, 0.1]} c={C.concrete} />
      <B x={[X.river[1] - 0.12, X.river[1]]} y={[Y.riverBed, 0.1]} c={C.concrete} />
            {/* água do rio */}
      <B x={[X.river[0] + 0.12, X.river[1] - 0.12]} y={[Y.riverBed, riverLevel]} z={[FAR, FACE - 0.02]} c={mixHex(C.water, C.waterD, 0.35)} o={0.82} />

      {/* ---------- PISCINÃO ---------- */}
      {resVis > 0.01 && (
        <group position={[0, Y.resBottom - 0.15, 0]} scale={[1, resVis, 1]}>
          <group position={[0, -(Y.resBottom - 0.15), 0]}>
            <B x={[X.res[0], X.res[1]]} y={[Y.resBottom - 0.15, Y.resBottom]} z={[ZB, FACE]} c={C.concreteD} />
            <B x={[X.res[0], X.res[0] + 0.12]} y={[Y.resBottom, Y.resTop + 0.15]} z={[ZB, FACE]} c={C.concrete} />
            <B x={[X.res[1] - 0.12, X.res[1]]} y={[Y.resBottom, Y.resTop + 0.15]} z={[ZB, FACE]} c={C.concrete} />
            <B x={[X.res[0], X.res[1]]} y={[Y.resTop, Y.resTop + 0.15]} z={[ZB, FACE]} c={C.concrete} />
            <B x={[X.res[0] + 0.12, X.res[1] - 0.12]} y={[Y.resBottom, Y.resTop]} z={[ZB, ZB + 0.12]} c={C.concreteD} />
            {/* pilares internos */}
            {[0.4, 0.8, 1.15].map((f) => (
              <B key={f} x={[X.res[0] + f - 0.05, X.res[0] + f + 0.05]} y={[Y.resBottom, Y.resTop]} z={[ZB + 0.2, ZB + 0.4]} c={C.concrete} />
            ))}
            {/* água guardada */}
            <B x={[X.res[0] + 0.12, X.res[1] - 0.12]} y={[Y.resBottom, Y.resBottom + (Y.resTop - Y.resBottom) * resFill]} z={[ZB + 0.12, FACE - 0.02]} c={C.water} o={0.8} />
          </group>
        </group>
      )}
      {/* vertedor: da galeria para o piscinão */}
      {resVis > 0.5 && (
        <group>
          <B x={[3.72, 3.98]} y={[Y.resTop + 0.15, Y.pipeIn - 0.15 - (3.85 - X.inlet) * 0.14]} z={[FACE - 0.6, FACE]} c={C.concrete} o={0.5} />
          {weir > 0.02 && <B x={[3.78, 3.92]} y={[Y.resTop - 0.1, -1.2]} z={[FACE - 0.55, FACE - 0.05]} c={C.water} o={0.85 * weir} e={C.cyan} ei={0.2} />}
          {/* tubo de saída lento para o rio */}
          <Tube a={[X.res[1] - 0.12, Y.resBottom + 0.12, FACE - 0.3]} b={[X.river[0] + 0.12, Y.resBottom + 0.02, FACE - 0.3]} r={0.07} c={C.pipe} o={0.6} />
          {outletFlow > 0.02 && <Arrow p={[X.river[0] + 0.3, Y.resBottom + 0.02, FACE]} dir={0} s={0.6} o={outletFlow / 0.3} />}
        </group>
      )}

      {/* ---------- GALERIA PLUVIAL ---------- */}
      <group position={[(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, pa[2]]} rotation={[0, 0, pipeAng]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[pipeR, pipeR, pipeLen, 16, 1, true]} />
          <M c={C.pipe} o={0.35} side={THREE.DoubleSide} />
        </mesh>
        {pipeFill > 0.01 && (
          <mesh position={[0, -pipeR + (pipeR * 2 * pipeFill) / 2, 0]}>
            <boxGeometry args={[pipeLen, pipeR * 2 * pipeFill, pipeR * 1.6]} />
            <M c={C.water} o={0.8} />
          </mesh>
        )}
        {/* setas de fluxo dentro da galeria */}
        {pipeFill > 0.05 &&
          [0, 1, 2, 3].map((i) => {
            const prog = (((gf - s5.startFrame) * 0.025 * pipeFlowSpeed + i / 4) % 1 + 1) % 1;
            return <Arrow key={i} p={[-pipeLen / 2 + 0.3 + prog * (pipeLen - 0.6), -pipeR + 0.1 + pipeR * pipeFill * 0.6, pipeR + 0.05]} dir={0} s={0.8} c={pipeFlowSpeed < 0.3 ? C.red : C.cyan} />;
          })}
      </group>
      {/* poço da boca de lobo até a galeria */}
      <B x={[X.inlet - 0.18, X.inlet + 0.18]} y={[Y.pipeIn, 0]} z={[FACE - 0.62, FACE]} c="#2a2f38" o={0.55} />
      {waterfall > 0.02 && <B x={[X.inlet - 0.08, X.inlet + 0.08]} y={[Y.pipeIn, 0]} z={[FACE - 0.5, FACE - 0.1]} c={C.water} o={0.85 * waterfall} e={C.cyan} ei={0.25} />}
      {/* saída da galeria no rio */}
      <Arrow p={[X.river[0] + 0.32, Y.pipeOut, FACE]} dir={0} s={0.9} c={mixHex("#4dd0ff", "#e53935", outletRed)} o={pipeFill > 0.05 ? 1 : 0} />

      {/* ---------- SUPERFÍCIE NATURAL ---------- */}
      {grassScale > 0.01 && (
        <group>
          <B x={[-44, X.river[0]]} y={[0, 0.075 * grassScale]} c={C.grass} />
          {[-4.1, -3.3, -1.6, -0.4, 0.9, 1.8].map((x, i) => (
            <mesh key={x} position={[x, 0.15 * grassScale, -0.5 - (i % 3) * 0.6]} scale={grassScale}>
              <icosahedronGeometry args={[0.28, 0]} />
              <M c={i % 2 ? C.grass2 : C.leaf} />
            </mesh>
          ))}
          <group scale={[1, grassScale, 1]}>
            <Tree x={-2.4} z={-1.6} />
            <Tree x={1.3} z={-1.9} s={1.2} />
          </group>
        </group>
      )}

      {/* ---------- CIDADE ---------- */}
      {/* área verde à direita (margem) — existe em todas as épocas */}
      <B x={[X.green[0], X.river[0]]} y={[0, 0.06]} c={C.grass} />
      <Tree x={4.3} z={-1.7} s={0.9} />
      {/* rua */}
      {asphalt > 0.01 && (
        <group scale={[1, asphalt, 1]}>
          <mesh position={[0, 0, FAR]}>
            <StreetGeo />
            <M c={C.asphalt} />
          </mesh>
          {/* faixa central */}
          {Array.from({length: 20}).map((_, i) => FACE - 0.4 - i * 2.4).map((z) => (
            <mesh key={z} position={[0, 0.165, z]}>
              <boxGeometry args={[0.08, 0.01, 0.5]} />
              <M c="#f2d14b" />
            </mesh>
          ))}
          {/* linha do caimento (esquemática) */}
          {crown > 0.01 && (
            <group>
              <Tube a={[X.street[0] + 0.1, 0.12, FACE + 0.03]} b={[0, 0.27, FACE + 0.03]} r={0.025} c={C.cyan} o={crown} />
              <Tube a={[0, 0.27, FACE + 0.03]} b={[X.street[1] - 0.1, 0.12, FACE + 0.03]} r={0.025} c={C.cyan} o={crown} />
            </group>
          )}
        </group>
      )}
      {/* calçadas e meio-fio */}
      {sidewalks > 0.01 && (
        <group scale={[1, sidewalks, 1]}>
          <B x={[X.swL[0], X.swL[1]]} y={[0, CURB - 0.035]} c="#8f969f" />
          {/* camada entre as placas: cinza (comum) ou grama nas juntas (permeável), só no topo */}
          <B x={[X.swL[0] + 0.01, X.swL[1] - 0.01]} y={[CURB - 0.035, CURB - 0.02]} z={[FAR, FACE - 0.01]} c={mixHex("#8f969f", "#4c7a3f", perm)} />
          <Pavers x={[X.swL[0], X.swL[1]]} perm={perm} />
          <B x={[X.swL[1] - 0.08, X.swL[1]]} y={[0, CURB + 0.02]} c={C.curb} />
          <B x={[X.swR[0], X.swR[1]]} y={[0, CURB - 0.02]} c="#8f969f" />
          <Pavers x={[X.swR[0], X.swR[1]]} perm={0} />
          <B x={[X.swR[0], X.swR[0] + 0.08]} y={[0, CURB + 0.02]} c={C.curb} />

          {/* boca de lobo: grade na sarjeta */}
          <B x={[X.inlet - 0.22, X.inlet + 0.2]} y={[0.04, 0.075]} z={[FACE - 0.64, FACE - 0.02]} c="#0d1014" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <B key={i} x={[X.inlet - 0.22, X.inlet + 0.2]} y={[0.075, 0.1]} z={[FACE - 0.62 + i * 0.115, FACE - 0.58 + i * 0.115]} c="#c9d1da" />
          ))}
          <B x={[X.inlet - 0.22, X.inlet - 0.18]} y={[0.075, 0.1]} z={[FACE - 0.64, FACE - 0.02]} c="#c9d1da" />
          <B x={[X.inlet + 0.16, X.inlet + 0.2]} y={[0.075, 0.1]} z={[FACE - 0.64, FACE - 0.02]} c="#c9d1da" />
        </group>
      )}
      {/* sarjetas destacadas */}
      {gutterGlow > 0.01 &&
        [X.street[0] + 0.12, X.street[1] - 0.12].map((x) => <B key={x} x={[x - 0.1, x + 0.1]} y={[0.05, 0.075]} z={[ZB, FACE - 0.7]} c={C.cyan} o={gutterGlow * 0.9} e={C.cyan} ei={0.6} />)}
      {/* casa */}
      {house > 0.01 && (
        <group scale={[1, house, 1]}>
          <House green={roofGreen} redirect={redirect} />
        </group>
      )}
      {/* jardim de chuva (canteiro rebaixado entre a calçada direita e a área verde) */}
      {garden > 0.01 && (
        <group scale={[1, garden, 1]}>
          <B x={[X.swR[1] + 0.02, X.green[0] + 0.85]} y={[-0.12, 0.03]} c="#5b3f27" />
          {[0.15, 0.45, 0.75].map((dx, i) => (
            <mesh key={dx} position={[X.swR[1] + dx, 0.18, -0.6 + i * 0.5]}>
              <icosahedronGeometry args={[0.18, 0]} />
              <M c={i % 2 ? "#e57373" : C.leaf} />
            </mesh>
          ))}
        </group>
      )}

      {/* ---------- FLUXO SUPERFICIAL ---------- */}
      {runoff > 0.02 &&
        [-1, 1].flatMap((side) =>
          [0, 1, 2].map((i) => {
            const t = (((gf * 0.02 + i / 3) % 1) + 1) % 1;
            const x = side * (0.2 + t * 1.8);
            return <Arrow key={`${side}-${i}`} p={[x, 0.22 - t * 0.1, FACE - 0.4]} dir={side > 0 ? -0.06 : Math.PI + 0.06} s={0.75 * runoff} o={runoff} />;
          }),
        )}
      {/* setas do sistema completo (s11) */}
      {flowArrowsAll > 0.02 && (
        <group>
          <Arrow p={[X.inlet + 0.02, -0.4, FACE + 0.05]} dir={-Math.PI / 2} s={0.9} o={flowArrowsAll} />
          <Arrow p={[X.river[0] + 0.32, Y.pipeOut, FACE + 0.05]} dir={0} s={0.9} o={flowArrowsAll} />
          <Arrow p={[3.85, Y.resTop + 0.2, FACE + 0.05]} dir={-Math.PI / 2} s={0.8} c="#2E9E4F" o={flowArrowsAll} />
          <Arrow p={[X.swL[0] + 0.4, -0.5, FACE + 0.05]} dir={-Math.PI / 2} s={0.8} c="#2E9E4F" o={flowArrowsAll} />
        </group>
      )}

      {/* ---------- ÁGUA ACUMULADA NA RUA ---------- */}
      {streetWater > 0.02 && asphalt > 0.5 && (
        <group>
          <B x={[X.swL[0] - (streetWater > CURB ? 0 : -0.8), X.swR[1] + (streetWater > CURB ? 0 : -0.8)]} y={[0.02, streetWater + 0.012 * Math.sin(gf * 0.3)]} z={[-14, FACE + 0.01]} c={C.water} o={0.62} />
        </group>
      )}
      {/* jato saindo pela boca de lobo (galeria em carga) */}
      {geyser > 0.02 && (
        <mesh position={[X.inlet, 0.05 + geyser / 2, FACE - 0.3]}>
          <cylinderGeometry args={[0.07, 0.2, geyser, 8]} />
          <M c={C.water} o={0.8} e={C.cyan} ei={0.3} />
        </mesh>
      )}

      {/* ---------- LIXO E LIXEIRA (s6) ---------- */}
      {trashVisible &&
        Array.from({length: 11}).map((_, i) => {
          const bag = i < 3;
          const tx = mapX(trashX) - (i % 4) * 0.05;
          const arrived = mapX(trashX) > X.inlet - 0.3;
          const toBin = trashY;
          const x = toBin > 0 ? tx + (binX - tx) * toBin : arrived ? X.inlet - 0.15 + random("tx" + i) * 0.3 : Math.min(tx, X.inlet - 0.2) - random("tl" + i) * 1.6;
          const y = toBin > 0 ? 0.12 + Math.sin(toBin * Math.PI) * 0.8 + toBin * 0.35 : 0.06 + (bag ? 0.06 : 0.01);
          const z0 = FACE - 0.55 + random("tz" + i) * 0.5;
          const z = toBin > 0 ? z0 + (FACE - 1.9 - z0) * toBin : z0;
          return (
            <mesh key={i} position={[x, y, z]} rotation={[random("r1" + i) * 3, random("r2" + i) * 3, 0]} scale={bag ? [1, 0.8, 1] : [1, 0.12, 0.7]}>
              <icosahedronGeometry args={[bag ? 0.13 : 0.1, 0]} />
              <M c={bag ? (i === 1 ? "#e9eef2" : "#b8c2cc") : i % 2 ? "#d18b2c" : "#7cb342"} />
            </mesh>
          );
        })}
      {gf >= s6.startFrame && gf < S("s7").startFrame && (
        <group position={[binX, CURB, FACE - 1.9]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.6, 10]} />
            <M c="#2E9E4F" />
          </mesh>
        </group>
      )}
      {/* banquinho (s8) */}
      {my > 0.02 && (
        <group position={[mx, CURB, FACE - 0.6]}>
          <B x={[-0.25, 0.25]} y={[0, my]} z={[-0.25, 0.25]} c="#8d6e63" />
        </group>
      )}

      {/* ---------- GRAMA EM FOLHAS E FLORES ---------- */}
      <GrassBlades
        gf={gf}
        seed="lawn"
        areas={[
          {x: [-9, X.houseL - 0.05], z: [-7, FACE - 0.05], n: 700},
          {x: [X.houseR + 0.05, X.swL[0] - 0.05], z: [-7, FACE - 0.05], n: 160},
          {x: [X.houseL, X.houseR], z: [-0.9 + 1.12, FACE - 0.05], n: 60},
          {x: [X.green[0] + 0.05, X.river[0] - 0.05], z: [-7, FACE - 0.05], n: 420},
          {x: [X.river[1] + 0.05, 11], z: [-8, FACE - 0.05], n: 650},
        ]}
      />
      {grassScale > 0.01 && <GrassBlades gf={gf} seed="wild" scale={grassScale * 1.3} areas={[{x: [X.swL[0] - 0.05, X.green[0] + 0.05], z: [-7, FACE - 0.05], n: 900}]} />}
      <Flowers spots={[[-3.4, 0.6], [-3.6, -0.4], [-6.2, 0.3], [-7.1, -1.6], [-5.6, 0.75], [3.4, 0.4], [4.4, -0.6], [3.7, -2.2], [7.0, 0.5], [8.3, -0.8], [9.6, 0.2]]} />
      {grassScale > 0.01 && <Flowers scale={grassScale} spots={[[-1.8, 0.4], [-0.6, -0.8], [0.7, 0.5], [1.6, -1.4], [-1.1, -2.5]]} />}

      {/* ---------- MASCOTE ---------- */}
      {mascotVis > 0.01 && (
        <Mascot position={[mx, CURB + my, FACE - 0.6]} scale={0.58 * mascotVis} pose={mascotPose(gf)} gf={gf} />
      )}

      {/* ---------- BAIRRO AO FUNDO + NÉVOA DE DISTÂNCIA ---------- */}
      <Backdrop city={before(s3) ? city : house} />
      <fog attach="fog" args={[mixHex(mixHex("#cfe2f2", "#5a6576", track("sky.darkness", gf, 0)), "#f7c7a0", clamp01((gf - finalCut) / 15)), camDist + 10, camDist + 60]} />
      {/* ---------- NUVENS E CHUVA ---------- */}
      <Clouds gf={gf} />
      {gf < finalCut + 15 && <Rain gf={gf} density={density} opacity={0.55} floorAt={groundAt} />}
      <ambientLight intensity={0.3} />
      <hemisphereLight args={["#d6ecff", "#5d7a3a", 0.9]} />
      <directionalLight position={[5, 10, 8]} intensity={1.7 - track("sky.darkness", gf, 0) * 0.6} color="#fff1d6" />
      <directionalLight position={[-6, 4, 9]} intensity={0.35} color="#cfe3ff" />
    </group>
  );
};

const Clouds: React.FC<{gf: number}> = ({gf}) => {
  const dark = track("sky.darkness", gf, 0);
  const col = mixHex("#ffffff", "#5b6577", dark);
  const colB = mixHex("#dfe6ee", "#454e5e", dark);
  const drop = dark * 1.0;
  return (
    <group position={[0, 8.0 - drop, -2]}>
      {Array.from({length: 7}).map((_, i) => {
        const x = -6 + i * 2.1 + Math.sin(gf / 140 + i) * 0.25;
        const z = -random("cz" + i) * 2.5;
        const sc = 0.8 + random("cs" + i) * 0.5;
        return (
          <group key={i} position={[x, random("cy" + i) * 0.7, z]} scale={sc}>
            {[[0, 0, 0, 0.75], [0.7, -0.15, 0.1, 0.55], [-0.7, -0.15, 0, 0.6], [0.3, 0.35, -0.1, 0.55], [-0.35, 0.3, 0.1, 0.5]].map(([dx, dy, dz, r], k) => (
              <mesh key={k} position={[dx, dy, dz]}>
                <sphereGeometry args={[r, 20, 14]} />
                <M c={k < 3 ? col : colB} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

export const sceneIds = timed.map((s) => s.id);
export const unused = rad;
