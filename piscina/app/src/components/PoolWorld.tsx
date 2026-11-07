// Vídeo 3 — quintal em corte: o buraco vira piscina, camada por camada (desconstrução).
// Estilo liso e colorido do canal. Estados derivados do tempo efetivo te(gf) (que volta no rebobinar).
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {sceneAt} from "../data/scenes";
import {clamp01, mixHex} from "../lib/anim";
import {poseAt} from "../lib/camera";
import {Mascot} from "./Mascot";
import {mascotLook, mascotPose, neighborLand, neighborLook, neighborPose} from "../lib/mascotPose";

export const FACE = 1.5;
const FAR = -40;
const GROUND = 0;

const C = {
  soil1: "#8a5f3a", soil2: "#74502f", soil3: "#5e4128", grass: "#7ccf52", grass2: "#5db443",
  water: "#3fa9f5", waterClear: "#5ec4ff", turbid: "#8c6b3f", concrete: "#c9d1da", concreteD: "#9aa4ae",
  pipe: "#cfd6de", asphalt: "#3b414d", sidewalk: "#d3d7dd", wall: "#f6ecd9", roof: "#c9563c", cyan: "#4DD0FF",
  trunk: "#7a4f2c", leaf: "#3f9b3a", sand: "#e8cf93", gravel: "#9aa3ad", sludge: "#5a4024", tank: "#2f6fb5",
};

const M: React.FC<{c: string; o?: number; e?: string; ei?: number; metal?: number; side?: THREE.Side; rough?: number}> = ({c, o = 1, e = "#000000", ei = 0, metal = 0, side, rough = 0.8}) => (
  <meshStandardMaterial color={c} transparent={o < 1} opacity={o} depthWrite={o >= 1} emissive={e} emissiveIntensity={ei} metalness={metal} roughness={rough} side={side ?? THREE.FrontSide} />
);

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

/** cano entre dois pontos; fill (0-1) desenha a água dentro, do ponto a para o b; glow acende o cano */
const Pipe: React.FC<{a: [number, number, number]; b: [number, number, number]; r: number; fill?: number; glow?: number; o?: number}> = ({a, b, r, fill = 0, glow = 0, o = 0.4}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const fl = len * clamp01(fill);
  const fmid = va.clone().add(dir.clone().normalize().multiplyScalar(fl / 2));
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <cylinderGeometry args={[r, r, len, 16, 1, true]} />
        <M c={mixHex(C.pipe, C.cyan, glow)} o={o + glow * 0.4} e={C.cyan} ei={glow * 0.9} side={THREE.DoubleSide} />
      </mesh>
      {fl > 0.01 && (
        <mesh position={fmid} quaternion={q}>
          <cylinderGeometry args={[r * 0.78, r * 0.78, fl, 14]} />
          <M c={C.water} o={0.85} e={C.cyan} ei={0.15 + glow * 0.6} />
        </mesh>
      )}
    </group>
  );
};

const Arrow: React.FC<{p: [number, number, number]; dir: number; s?: number; c?: string; o?: number}> = ({p, dir, s = 1, c = C.cyan, o = 1}) =>
  o < 0.02 ? null : (
    <group position={p} rotation={[0, 0, dir]} scale={s}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.09, 0.22, 12]} />
        <M c={c} o={o} e={c} ei={0.5} />
      </mesh>
      <mesh position={[-0.17, 0, 0]}>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <M c={c} o={o} e={c} ei={0.5} />
      </mesh>
    </group>
  );

const Tree: React.FC<{x: number; z: number; s?: number; y?: number}> = ({x, z, s = 1, y = 0}) => (
  <group position={[x, y, z]} scale={s}>
    <mesh position={[0, 0.55, 0]}>
      <cylinderGeometry args={[0.08, 0.13, 1.1, 12]} />
      <M c={C.trunk} />
    </mesh>
    <mesh position={[0, 1.45, 0]} scale={[1, 0.95, 1]}>
      <sphereGeometry args={[0.72, 32, 20]} />
      <M c={C.leaf} />
    </mesh>
    <mesh position={[0.42, 1.2, 0.2]}>
      <sphereGeometry args={[0.45, 24, 16]} />
      <M c="#4aaa41" />
    </mesh>
    <mesh position={[-0.38, 1.25, -0.15]}>
      <sphereGeometry args={[0.48, 24, 16]} />
      <M c="#378f34" />
    </mesh>
  </group>
);

const Pine: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
      <M c={C.trunk} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.7 + i * 0.42, 0]}>
        <coneGeometry args={[0.55 - i * 0.13, 0.75, 16]} />
        <M c={i % 2 ? "#2f7d3a" : "#2a7034"} />
      </mesh>
    ))}
  </group>
);

type Area = {x: [number, number]; z: [number, number]; n: number; y?: number};
const GrassBlades: React.FC<{areas: Area[]; gf: number; seed: string}> = ({areas, gf, seed}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const total = areas.reduce((a, b) => a + b.n, 0);
  const pts = useMemo(() => {
    const out: {x: number; z: number; y: number; h: number; r: number; c: number; ph: number}[] = [];
    areas.forEach((a, ai) => {
      for (let i = 0; i < a.n; i++) {
        const id = `${seed}${ai}-${i}`;
        out.push({x: a.x[0] + random(id + "x") * (a.x[1] - a.x[0]), z: a.z[0] + random(id + "z") * (a.z[1] - a.z[0]), y: a.y ?? 0, h: 0.16 + random(id + "h") * 0.3, r: random(id + "r") * Math.PI, c: random(id + "c"), ph: random(id + "p") * 6.28});
      }
    });
    return out;
  }, [areas, seed]);
  const colors = useMemo(() => ["#5fb33c", "#4a9c33", "#78c94f", "#3f8a2e"].map((c) => new THREE.Color(c)), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    pts.forEach((b, i) => {
      tmp.position.set(b.x, b.y + b.h / 2 + 0.04, b.z);
      tmp.rotation.set(Math.sin(gf * 0.06 + b.ph) * 0.12, b.r, Math.sin(gf * 0.05 + b.ph) * 0.1);
      tmp.scale.set(1, b.h, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, colors[Math.floor(b.c * colors.length)]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} frustumCulled={false}>
      <coneGeometry args={[0.03, 1, 4]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
};

const Clouds: React.FC<{gf: number}> = ({gf}) => (
  <group position={[0, 9, -6]}>
    {Array.from({length: 9}).map((_, i) => {
      const x = -15 + i * 3.6 + Math.sin(gf / 160 + i) * 0.3;
      const sc = 0.9 + random("cs" + i) * 0.6;
      return (
        <group key={i} position={[x, random("cy" + i) * 1.2, -random("cz" + i) * 3]} scale={sc}>
          {[[0, 0, 0, 0.75], [0.7, -0.15, 0.1, 0.55], [-0.7, -0.15, 0, 0.6], [0.3, 0.35, -0.1, 0.55], [-0.35, 0.3, 0.1, 0.5]].map(([dx, dy, dz, r], k) => (
            <mesh key={k} position={[dx, dy, dz]}>
              <sphereGeometry args={[r, 20, 14]} />
              <M c={k < 3 ? "#ffffff" : "#e8eef5"} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);



/** sol com sombras suaves; a área de sombra acompanha o ponto para onde a câmera olha */
const SunLight: React.FC<{gf: number}> = ({gf}) => {
  const ref = useRef<THREE.DirectionalLight>(null);
  const {target} = poseAt(gf);
  useLayoutEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.position.set(target.x + 5, target.y + 10, target.z + 8);
    l.target.position.copy(target);
    l.target.updateMatrixWorld();
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -8; c.right = 8; c.top = 8; c.bottom = -8; c.near = 0.5; c.far = 40;
    c.updateProjectionMatrix();
  });
  return <directionalLight ref={ref} intensity={1.75} color="#fff1d6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.02} />;
};

/** liga sombras em tudo (menos grama instanciada e coisas transparentes) */
const useShadows = (ref: React.RefObject<THREE.Group | null>) =>
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      const transparent = Array.isArray(mat) ? false : mat?.transparent;
      m.receiveShadow = true;
      m.castShadow = !(o as THREE.InstancedMesh).isInstancedMesh && !transparent;
    });
  });

/** pedras arredondadas */
const Rocks: React.FC<{spots: [number, number, number][]}> = ({spots}) => (
  <group>
    {spots.map(([x, z, s], i) => (
      <mesh key={i} position={[x, 0.04, z]} scale={[s * 1.3, s * 0.7, s]} rotation={[0, i * 1.7, 0]}>
        <dodecahedronGeometry args={[0.22, 1]} />
        <M c={i % 3 ? "#9aa3ad" : "#b8c0c8"} />
      </mesh>
    ))}
  </group>
);


/* ================= PISCINA ================= */
import {L, easeIn, easeInOut, easeOut} from "../lib/anim";
import {W, end, failing, rew, start, te, undoneS2, RW} from "../lib/story";

// medidas (u3d ≈ metros, esquemático): piscina 6 × 3 × 1,5 de escavação; corte na frente (z = FACE)
export const PX0 = -1.5, PX1 = 4.5, PZ0 = -1.5, PD = 1.5, CT = 0.2;
const LEAN = 0.08; // concreto magro
const FL = -PD + LEAN; // topo do concreto magro
const IN = {x0: PX0 + CT, x1: PX1 - CT, z0: PZ0 + CT, y0: FL + CT}; // interior da casca de concreto
export const WATER_TOP = -0.2;
const HOLE = {x0: 0, x1: 3, z0: -0.6}; // buraco "na pá" do começo
// rachaduras do fundo (x, z), em zigue-zague, saindo da emenda do meio
const CRACKS: [number, number][][] = [
  [[1.5, -1.4], [1.35, -0.9], [1.6, -0.4], [1.42, 0.1], [1.62, 0.6], [1.45, 1.1], [1.55, 1.5]],
  [[1.45, -0.3], [0.9, -0.55], [0.5, -0.35], [0.0, -0.7], [-0.6, -0.5]],
  [[1.6, 0.6], [2.2, 0.85], [2.7, 0.55], [3.3, 0.95], [3.9, 0.7]],
  [[1.4, 1.1], [0.8, 1.3], [0.2, 1.05]],
  [[1.55, -0.9], [2.3, -1.2], [3.0, -0.95]],
];
const MR = {x0: 6, x1: 7.6, z0: -0.5, y0: -1.2}; // casa de máquinas enterrada

const P = {
  soilTop: "#9a6a40", soilMid: "#7d5332", soilDeep: "#64412a", clay: "#b87a45", mud: "#6b4a2b",
  concrete: "#c4c9cf", concreteD: "#a3aab2", lean: "#d6d9dc", rebar: "#c8642c", waterproof: "#3d6f86",
  tile: "#2f9de0", tileL: "#5bc0f0", grout: "#e9f3f8", coping: "#efe6d4", water: "#3fb4f0", green: "#5e9d3a",
  yellow: "#f2b705", dark: "#2b2f36", pipe: "#f1f3f5", pipeD: "#c9ced4",
};

/** caixa com faixas de solo (grama fina em cima, terra clara, terra escura) */
const Soil: React.FC<{x: [number, number]; y?: [number, number]; z?: [number, number]; grass?: boolean; tint?: number}> = ({x, y = [-12, 0], z = [FAR, FACE], grass = true, tint = 0}) => {
  const bands: [number, number, string][] = [[-0.55, 0, P.soilTop], [-1.6, -0.55, P.soilMid], [-12, -1.6, P.soilDeep]];
  return (
    <group>
      {bands.map(([a, b, c]) => {
        const lo = Math.max(a, y[0]), hi = Math.min(b, y[1]);
        return hi - lo > 0.001 ? <B key={c} x={x} y={[lo, hi]} z={z} c={mixHex(c, "#f3e2c8", tint)} o={tint > 0.01 ? 1 - tint * 0.55 : 1} /> : null;
      })}
      {grass && y[1] >= 0 && <B x={x} y={[0, 0.06]} z={z} c={C.grass} />}
    </group>
  );
};

/** cano opaco por uma lista de pontos; show (0-1) desenha do começo ao fim; setas de fluxo quando flow */
const PipePath: React.FC<{pts: [number, number, number][]; r?: number; show: number; flow?: number; gf: number; c?: string}> = ({pts, r = 0.07, show, flow = 0, gf, c = P.pipe}) => {
  if (show <= 0.001) return null;
  const segs = pts.slice(1).map((b, i) => {
    const a = pts[i];
    return {a: new THREE.Vector3(...a), b: new THREE.Vector3(...b), len: new THREE.Vector3(...b).distanceTo(new THREE.Vector3(...a))};
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  let acc = 0;
  const lim = total * clamp01(show);
  const at = (d: number) => {
    let r0 = 0;
    for (const s of segs) {
      if (d <= r0 + s.len) return {p: s.a.clone().lerp(s.b, (d - r0) / s.len), dir: s.b.clone().sub(s.a).normalize()};
      r0 += s.len;
    }
    const l = segs[segs.length - 1];
    return {p: l.b.clone(), dir: l.b.clone().sub(l.a).normalize()};
  };
  return (
    <group>
      {segs.map((s, i) => {
        const l0 = acc;
        acc += s.len;
        const vis = Math.min(s.len, Math.max(0, lim - l0));
        if (vis <= 0.001) return null;
        const dir = s.b.clone().sub(s.a).normalize();
        const mid = s.a.clone().add(dir.clone().multiplyScalar(vis / 2));
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <group key={i}>
            <mesh position={mid} quaternion={q}>
              <cylinderGeometry args={[r, r, vis, 16]} />
              <M c={c} rough={0.4} />
            </mesh>
            <mesh position={s.a}>
              <sphereGeometry args={[r * 1.15, 12, 10]} />
              <M c={P.pipeD} rough={0.4} />
            </mesh>
          </group>
        );
      })}
      {flow > 0.01 &&
        Array.from({length: Math.max(2, Math.round(total / 0.7))}).map((_, i, arr) => {
          const d = (((gf * 0.035 + i / arr.length) % 1) + 1) % 1 * total;
          const {p, dir} = at(d);
          return <Arrow key={"fa" + i} p={[p.x, p.y, p.z + r + 0.04]} dir={Math.atan2(dir.y, dir.x)} s={0.55} c="#00c2ff" o={flow} />;
        })}
    </group>
  );
};

/** miniescavadeira amarela (braço anima) */
const Excavator: React.FC<{x: number; z: number; t: number; o: number}> = ({x, z, t, o}) => {
  if (o <= 0.01) return null;
  const boom = -0.5 + Math.sin(t * 0.09) * 0.25;
  const stick = 1.0 + Math.sin(t * 0.09 + 1) * 0.35;
  return (
    <group position={[x, 0.06, z]} scale={0.95 * o}>
      <B x={[-0.65, 0.65]} y={[0, 0.28]} z={[-0.45, 0.45]} c="#2f3338" />
      {[-0.42, 0.42].map((dz) => <B key={dz} x={[-0.7, 0.7]} y={[0.02, 0.26]} z={[dz - 0.06, dz + 0.06]} c="#1f2226" />)}
      <B x={[-0.5, 0.55]} y={[0.28, 0.75]} z={[-0.4, 0.4]} c={P.yellow} />
      <B x={[0.0, 0.52]} y={[0.75, 1.25]} z={[-0.32, 0.32]} c={P.yellow} />
      <B x={[0.05, 0.47]} y={[0.82, 1.18]} z={[0.321, 0.33]} c="#9fd3f2" />
      <group position={[-0.5, 0.65, 0]} rotation={[0, 0, Math.PI - 0.9 + boom]}>
        <B x={[0, 1.5]} y={[-0.09, 0.09]} z={[-0.09, 0.09]} c={P.yellow} />
        <group position={[1.5, 0, 0]} rotation={[0, 0, -stick]}>
          <B x={[0, 1.1]} y={[-0.07, 0.07]} z={[-0.08, 0.08]} c="#e0a800" />
          <group position={[1.1, 0, 0]} rotation={[0, 0, -0.8]}>
            <B x={[0, 0.35]} y={[-0.16, 0.16]} z={[-0.18, 0.18]} c="#3a3f45" />
          </group>
        </group>
      </group>
    </group>
  );
};

/** betoneira girando */
const Mixer: React.FC<{x: number; z: number; t: number; o: number}> = ({x, z, t, o}) =>
  o <= 0.01 ? null : (
    <group position={[x, 0.06, z]} scale={o}>
      <B x={[-0.35, 0.35]} y={[0, 0.5]} z={[-0.08, 0.08]} c="#5b636e" />
      <group position={[0, 0.85, 0]} rotation={[0, 0, 0.6]}>
        <group rotation={[0, t * 0.15, 0]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.42, 0.7, 20]} />
            <M c="#f07b1d" rough={0.5} />
          </mesh>
          <B x={[-0.43, -0.38]} y={[-0.3, 0.3]} z={[-0.05, 0.05]} c="#ffd23f" />
        </group>
      </group>
    </group>
  );


/** água em caixa (corte) com superfície brilhante */
const WaterBox: React.FC<{x: [number, number]; y0: number; top: number; z: [number, number]; color?: string; o?: number}> = ({x, y0, top, z, color = P.water, o = 0.62}) =>
  top - y0 < 0.01 ? null : (
    <group>
      <B x={x} y={[y0, top]} z={z} c={color} o={o} />
      <mesh position={[(x[0] + x[1]) / 2, top + 0.003, (z[0] + z[1]) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[x[1] - x[0], z[1] - z[0]]} />
        <meshStandardMaterial color={mixHex(color, "#ffffff", 0.35)} roughness={0.08} metalness={0.2} transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  );

/** pastilhas: grade instanciada, revelada em onda da esquerda para a direita */
const Tiles: React.FC<{reveal: number; dy: number}> = ({reveal, dy}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const cells = useMemo(() => {
    const out: {p: [number, number, number]; r: [number, number, number]; x: number; c: number}[] = [];
    const s = 0.25, t = 0.022;
    for (let x = IN.x0 + s / 2; x < IN.x1; x += s) for (let z = IN.z0 + s / 2; z < FACE; z += s) out.push({p: [x, IN.y0 + 0.02 + t / 2, z], r: [-Math.PI / 2, 0, 0], x, c: random(`t${x}${z}`)});
    for (let x = IN.x0 + s / 2; x < IN.x1; x += s) for (let y = IN.y0 + s / 2; y < 0; y += s) out.push({p: [x, y, IN.z0 + 0.02 + t / 2], r: [0, 0, 0], x, c: random(`b${x}${y}`)});
    for (const [wx, k] of [[IN.x0 + 0.02 + t / 2, 0], [IN.x1 - 0.02 - t / 2, 1]] as const)
      for (let z = IN.z0 + s / 2; z < FACE; z += s) for (let y = IN.y0 + s / 2; y < 0; y += s) out.push({p: [wx, y, z], r: [0, Math.PI / 2, 0], x: k ? IN.x1 : IN.x0, c: random(`w${k}${z}${y}`)});
    return out;
  }, []);
  const cols = useMemo(() => [P.tile, P.tileL, "#2489cc"].map((c) => new THREE.Color(c)), []);
  const span = IN.x1 - IN.x0;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    cells.forEach((c, i) => {
      const k = clamp01((reveal * (span + 1) - (c.x - IN.x0)) / 0.6);
      tmp.position.set(c.p[0], c.p[1] + dy + (1 - k) * 0.25, c.p[2]);
      tmp.rotation.set(...c.r);
      tmp.scale.setScalar(Math.max(0.0001, k));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, cols[c.c < 0.6 ? 0 : c.c < 0.85 ? 1 : 2]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} frustumCulled={false}>
      <boxGeometry args={[0.225, 0.225, 0.022]} />
      <meshStandardMaterial roughness={0.25} metalness={0.05} />
    </instancedMesh>
  );
};

/** casa simples ao fundo, à esquerda */
const House: React.FC = () => (
  <group position={[-7.2, 0.06, -2.2]}>
    <B x={[-1.8, 1.8]} y={[0, 2.2]} z={[-1.6, 1.6]} c="#f6ecd9" />
    <mesh position={[0, 2.2 + 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.85, 1.4, 4]} />
      <M c="#c9563c" />
    </mesh>
    <B x={[0.9, 1.5]} y={[0, 1.3]} z={[1.6, 1.64]} c="#8a5a2b" />
    <B x={[-1.3, -0.4]} y={[1.0, 1.7]} z={[1.6, 1.64]} c="#9fd3f2" />
  </group>
);

/* ================= MUNDO ================= */
export const PoolWorld: React.FC<{gf: number}> = ({gf}) => {
  const rootRef = useRef<THREE.Group>(null);
  useShadows(rootRef);
  const t = te(gf); // tempo efetivo (volta no rebobinar)
  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);
  const inS = (id: string) => t >= start(id) && t < end(id);
  const after = (id: string) => t >= start(id);

  /* ---- s1/s2: buraco na pá, água sumindo, barranco desmoronando ---- */
  const clean2 = undoneS2(gf);
  const holeD = clean2 ? 0 : inS("s1") ? L(t, W("s1", "cava") - 6, W("s1", "Bora"), 0, 1.0, easeInOut) : inS("s2") ? 1.0 : 0;
  const s2water = !inS("s2") || clean2 ? 0 : t < W("s2", "some") ? L(t, start("s2"), W("s2", "some"), 0.25, 0.7) : L(t, W("s2", "some"), W("s2", "paredes"), 0.7, 0.05, easeIn);
  const collapse = !inS("s2") || clean2 ? 0 : L(t, W("s2", "desmoronam") - 6, W("s2", "desmoronam") + 18, 0, 1, easeIn);
  const hose = (inS("s1") && t > W("s1", "Bora") - 10) || (inS("s2") && !clean2 && t < W("s2", "some") + 10);

  /* ---- s3: projeto, escavação, compactação, concreto magro; "E se?" fundo afunda ---- */
  const blue = inS("s3") ? L(t, W("s3", "projeto") - 4, W("s3", "canos") + 10, 0, 1) * (1 - L(t, W("s3", "cava") - 5, W("s3", "cava") + 10, 0, 1)) : 0;
  const pitD = after("s3") ? (inS("s3") ? L(t, W("s3", "cava") - 4, W("s3", "socado"), 0, PD, easeInOut) : PD) : 0;
  const excav = inS("s3") ? L(t, W("s3", "máquina") - 20, W("s3", "máquina") - 4, 0, 1) * (1 - L(t, W("s3", "magro") + 10, W("s3", "magro") + 25, 0, 1)) : 0;
  const compactor = inS("s3") && t > W("s3", "socado") - 6 && t < W("s3", "magro") + 6;
  const lean = after("s3") ? (inS("s3") ? L(t, W("s3", "magro") - 6, W("s3", "magro") + 18, 0, 1) : 1) : 0;
  const sink = failing("s3", t) ? L(t, rew("s3").P + 12, rew("s3").P + 45, 0, 1, easeIn) : 0;

  /* ---- s4: 1 m³ = 1.000 kg, 25 t, "E se?" parede trinca, vergalhões + concreto ---- */
  const cube = inS("s4") ? L(t, start("s4") + 4, start("s4") + 20, 0, 1, easeOut) * (1 - L(t, W("s4", "Uma") - 4, W("s4", "Uma") + 10, 0, 1)) : 0;
  const nCubes = inS("s4") ? (t < rew("s4").R + RW ? L(t, W("s4", "Uma"), W("s4", "toneladas"), 0, 36) : 0) : 0;
  const arrows = inS("s4") && t > W("s4", "empurrando") - 4 && t < rew("s4").R ? 1 : 0;
  const plainWall = failing("s4", t) ? L(t, rew("s4").P, rew("s4").P + 12, 0, 1) : 0;
  const crack4 = failing("s4", t) ? L(t, W("s4", "trincava") - 4, W("s4", "trincava") + 14, 0, 1) : 0;
  const rebar = after("s4") ? (inS("s4") ? L(t, W("s4", "gaiola") - 6, W("s4", "envolve"), 0, 1) : 1) : 0;
  const shell = after("s4") ? (inS("s4") ? L(t, W("s4", "envolve") - 4, W("s4", "armado") + 6, 0, 1, easeInOut) : 1) : 0;
  const mixer = inS("s4") ? L(t, W("s4", "envolve") - 20, W("s4", "envolve") - 6, 0, 1) : 0;

  /* ---- s5: poros, "E se?" vaza e esvazia, impermeabilização, teste de estanqueidade ---- */
  const leakWater = failing("s5", t) ? L(t, rew("s5").P + 4, rew("s5").P + 16, 0, 1) : 0;
  const leakLevel = L(t, rew("s5").P + 16, rew("s5").R - 4, WATER_TOP - 0.05, -0.85);
  const wproof = after("s5") ? (inS("s5") ? L(t, W("s5", "impermeabilização") - 4, W("s5", "veda") + 20, 0, 1) : 1) : 0;
  const testLvl = inS("s5") ? L(t, W("s5", "enche") - 4, W("s5", "enche") + 30, 0, 1) : inS("s6") ? L(t, start("s6"), start("s6") + 20, 1, 0) : 0;

  /* ---- s6: pastilhas e borda ---- */
  const tiles = after("s6") ? (inS("s6") ? L(t, start("s6") + 6, W("s6", "rejunte") + 15, 0, 1) : 1) : 0;
  const coping = after("s6") ? (inS("s6") ? L(t, W("s6", "borda") - 6, W("s6", "antiderrapante") + 6, 0, 1) : 1) : 0;

  /* ---- s7: piscina cheia, fica verde, canos + casa de máquinas, volta azul ---- */
  const fill = after("s7") ? (inS("s7") ? L(t, start("s7"), start("s7") + 25, 0, 1, easeOut) : 1) : 0;
  const greenK = inS("s7") ? L(t, W("s7", "dias"), W("s7", "verde") + 8, 0, 1) * (1 - L(t, W("s7", "volta"), W("s7", "volta") + 60, 0, 1)) : 0;
  const leaves = inS("s7") && t > W("s7", "caem") - 10 ? 1 - L(t, W("s7", "volta"), W("s7", "volta") + 50, 0, 1) : 0;
  const pDrain = after("s7") ? (inS("s7") ? L(t, W("s7", "ralo") - 4, W("s7", "ralo") + 20, 0, 1) : 1) : 0;
  const pSkim = after("s7") ? (inS("s7") ? L(t, W("s7", "skimmer") - 4, W("s7", "skimmer") + 20, 0, 1) : 1) : 0;
  const room = after("s7") ? (inS("s7") ? L(t, W("s7", "ralo") - 8, W("s7", "ralo") + 8, 0, 1) : 1) : 0;
  const pump = after("s7") ? (inS("s7") ? L(t, W("s7", "bomba") - 4, W("s7", "bomba") + 10, 0, 1, easeOut) : 1) : 0;
  const filt = after("s7") ? (inS("s7") ? L(t, W("s7", "filtro") - 4, W("s7", "filtro") + 10, 0, 1, easeOut) : 1) : 0;
  const pRet = after("s7") ? (inS("s7") ? L(t, W("s7", "filtro") + 6, W("s7", "bocais") + 6, 0, 1) : 1) : 0;
  const flow = after("s7") && t > W("s7", "bomba") ? 1 : 0;
  const lid = inS("s7") ? L(t, W("s7", "máquinas") - 10, W("s7", "máquinas") + 10, 0, 1.15, easeOut) : 0;

  /* ---- s8: cloro (gotas) e kit de pH ---- */
  const bottle = inS("s8") && t >= W("s8", "cloro") && t < W("s8", "cloro") + 45 ? 1 : 0; // gotas do frasco que o mascote segura
  const kit = after("s8") && t < start("s9") ? L(t, W("s8", "pH") - 10, W("s8", "pH"), 0, 1, easeOut) : 0;

  /* ---- s9: vista explodida e mergulho ---- */
  const explode = 0; // vista explodida removida a pedido do usuário
  const splashT = inS("s9") ? t - (W("s9", "pular") + 30) : -1;

  // água da piscina (s5 vazamento / teste, s7+ cheia)
  let lvl = -9, wColor = P.water;
  if (leakWater > 0) lvl = Math.max(IN.y0 + 0.01, leakLevel * leakWater + (IN.y0 - 0.0) * (1 - leakWater));
  if (testLvl > 0) lvl = IN.y0 + (WATER_TOP - IN.y0) * testLvl;
  if (fill > 0) {
    lvl = IN.y0 + (WATER_TOP - IN.y0) * fill;
    wColor = mixHex(P.water, P.green, greenK);
  }
  const ex = (k: number) => explode * k; // deslocamento da camada na vista explodida

  // buraco/escavação: terra que ainda preenche a área da piscina
  const fillTop = -pitD;
  const leaks = (leakWater > 0 ? 1 : 0) || crack4 > 0.3;

  return (
    <group ref={rootRef}>
      {/* ---------- SOLO EM CORTE ---------- */}
      <Soil x={[-40, PX0]} />
      <Soil x={[PX1, MR.x0]} />
      <Soil x={[MR.x0, MR.x1]} y={[-12, MR.y0]} grass={false} />
      <Soil x={[MR.x0, MR.x1]} y={[MR.y0, 0]} z={[FAR, MR.z0]} />
      {room < 0.5 && <Soil x={[MR.x0, MR.x1]} y={[MR.y0, 0]} z={[MR.z0, FACE]} />}
      <Soil x={[MR.x1, 40]} />
      <Soil x={[PX0, PX1]} z={[FAR, PZ0]} />
      <Soil x={[PX0, PX1]} y={[-12, -PD]} z={[PZ0, FACE]} grass={false} />
      {/* terra dentro da área da piscina (antes de escavar), com o buraco da pá */}
      {pitD < PD - 0.001 && (
        <group>
          {holeD > 0.001 ? (
            <>
              <Soil x={[PX0, HOLE.x0]} y={[-PD, fillTop]} z={[PZ0, FACE]} />
              <Soil x={[HOLE.x1, PX1]} y={[-PD, fillTop]} z={[PZ0, FACE]} />
              <Soil x={[HOLE.x0, HOLE.x1]} y={[-PD, fillTop]} z={[PZ0, HOLE.z0]} />
              <Soil x={[HOLE.x0, HOLE.x1]} y={[-PD, -holeD]} z={[HOLE.z0, FACE]} grass={false} />
            </>
          ) : (
            <Soil x={[PX0, PX1]} y={[-PD, fillTop]} z={[PZ0, FACE]} grass={fillTop >= -0.001} />
          )}
        </group>
      )}
      {/* monte de terra tirada do buraco */}
      {holeD > 0.05 && (
        <mesh position={[4.0, 0.06, -0.3]} scale={[1, holeD * 0.7, 1]}>
          <coneGeometry args={[0.7, 1, 20]} />
          <M c={P.soilTop} />
        </mesh>
      )}
      {/* mangueira enchendo o buraco */}
      {hose && (
        <group>
          <PipePath pts={[[-3.6, 0.08, 0.2], [-1.0, 0.08, 0.5], [0.3, 0.35, 0.7]]} r={0.045} show={1} gf={gf} c="#43a047" />
          {inS("s2") && <B x={[0.33, 0.39]} y={[-holeD + s2water, 0.35]} z={[0.67, 0.73]} c={P.water} o={0.8} />}
        </group>
      )}
      {/* água no buraco de terra: some no chão (gotas descendo) */}
      {s2water > 0.01 && <WaterBox x={[HOLE.x0 + 0.02, HOLE.x1 - 0.02]} y0={-holeD} top={-holeD + s2water} z={[HOLE.z0 + 0.02, FACE]} color={mixHex(P.water, P.mud, collapse * 0.8)} />}
      {inS("s2") && !clean2 && t > W("s2", "some") - 10 &&
        Array.from({length: 18}).map((_, i) => {
          const k = ((t - W("s2", "some") + 10) * 0.012 + random("sd" + i)) % 1;
          return (
            <mesh key={"sd" + i} position={[HOLE.x0 + 0.2 + random("sx" + i) * 2.6, -holeD - k * 2.2, FACE + 0.01]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <M c={P.water} e={P.water} ei={0.3} />
            </mesh>
          );
        })}
      {/* barranco desmoronando: cunhas de terra escorregando para dentro + lama */}
      {collapse > 0.01 && (
        <group>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd < 0 ? HOLE.x0 + 0.35 * collapse : HOLE.x1 - 0.35 * collapse, -0.35 - 0.35 * collapse, (HOLE.z0 + FACE) / 2]} rotation={[0, 0, sd * (0.6 + collapse * 0.4)]}>
              <boxGeometry args={[0.5, 0.8, FACE - HOLE.z0]} />
              <M c={P.soilMid} />
            </mesh>
          ))}
          <B x={[HOLE.x0, HOLE.x1]} y={[-holeD, -holeD + 0.3 * collapse]} z={[HOLE.z0, FACE]} c={P.mud} />
        </group>
      )}

      {/* ---------- s3: projeto, máquina, compactador, concreto magro ---------- */}
      {blue > 0.01 && (
        <group>
          <B x={[PX0, PX1]} y={[0.06, 0.12]} z={[FACE - 0.14, FACE]} c="#1e88e5" e="#1e88e5" ei={1.2} o={blue} />
          <B x={[PX0, PX1]} y={[0.06, 0.12]} z={[PZ0, PZ0 + 0.14]} c="#1e88e5" e="#1e88e5" ei={1.2} o={blue} />
          <B x={[PX0, PX0 + 0.14]} y={[0.06, 0.12]} z={[PZ0, FACE]} c="#1e88e5" e="#1e88e5" ei={1.2} o={blue} />
          <B x={[PX1 - 0.14, PX1]} y={[0.06, 0.12]} z={[PZ0, FACE]} c="#1e88e5" e="#1e88e5" ei={1.2} o={blue} />
          {/* régua de profundidade */}
          <B x={[PX0 - 0.35, PX0 - 0.28]} y={[-1.4 * blue, 0.3]} z={[FACE - 0.05, FACE + 0.02]} c="#ffd23f" />
        </group>
      )}
      <Excavator x={6.4} z={0.4} t={t} o={excav} />
      {compactor && (
        <group position={[L(t, W("s3", "socado") - 6, W("s3", "magro"), PX0 + 0.5, PX1 - 0.5), -PD + Math.abs(Math.sin(t * 0.9)) * 0.06, 0.6]}>
          <B x={[-0.2, 0.2]} y={[0, 0.25]} z={[-0.2, 0.2]} c="#e65100" />
          <B x={[-0.03, 0.03]} y={[0.25, 0.9]} z={[-0.03, 0.03]} c="#37474f" />
        </group>
      )}
      {/* concreto magro (no "E se?" o fundo se parte: metade afunda e aparecem rachaduras grandes) */}
      {lean > 0.001 && (
        <group>
          <B x={[PX0, Math.min(1.5, PX0 + (PX1 - PX0) * lean)]} y={[-PD, FL]} z={[PZ0, FACE]} c={P.lean} />
          {lean > 0.5 && (
            <group position={[1.5, -sink * 0.32, 0]} rotation={[0, 0, sink * 0.09]}>
              <B x={[0, PX0 + (PX1 - PX0) * lean - 1.5]} y={[-PD, FL]} z={[PZ0, FACE]} c={P.lean} />
            </group>
          )}
          {sink > 0.02 &&
            CRACKS.map((cr, i) => {
              const k = clamp01(sink * 1.6 - i * 0.12);
              return k <= 0 ? null : (
                <group key={"cr" + i}>
                  {cr.slice(1).map((q, j) => {
                    const p0 = cr[j];
                    if (j / (cr.length - 1) > k) return null;
                    const dx = q[0] - p0[0], dz = q[1] - p0[1];
                    const len = Math.hypot(dx, dz);
                    return (
                      <mesh key={j} position={[(p0[0] + q[0]) / 2, FL + 0.006 - (p0[0] > 1.5 ? sink * 0.3 : 0), (p0[1] + q[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
                        <boxGeometry args={[len + 0.03, 0.012, 0.035 + 0.04 * sink]} />
                        <meshBasicMaterial color="#1b1b1b" />
                      </mesh>
                    );
                  })}
                </group>
              );
            })}
          {sink > 0.05 && <B x={[1.47, 1.53]} y={[-PD - 0.2, FL]} z={[FACE - 0.001, FACE + 0.012]} c="#1b1b1b" o={sink} />}
        </group>
      )}

      {/* ---------- s4: cubo de 1 m³ na balança, 25 t na piscina, setas, parede trincando ---------- */}
      {cube > 0.01 && (
        <group position={[-3.4, 0.06, 0.6]} scale={cube}>
          <B x={[-0.75, 0.75]} y={[0, 0.14]} z={[-0.7, 0.7]} c="#5b636e" />
          <B x={[0.45, 0.72]} y={[0.14, 0.34]} z={[0.55, 0.69]} c="#263238" />
          <B x={[-0.5, 0.5]} y={[0.14, 1.14]} z={[-0.5, 0.5]} c={P.water} o={0.7} />
        </group>
      )}
      {nCubes > 0.5 &&
        Array.from({length: Math.floor(nCubes)}).map((_, i) => {
          const layer = Math.floor(i / 18), k = i % 18, ix = k % 6, iz = Math.floor(k / 6);
          return <B key={"c" + i} x={[PX0 + ix + 0.04, PX0 + ix + 0.96]} y={[FL + layer * 0.7 + 0.03, FL + layer * 0.7 + 0.67]} z={[PZ0 + iz + 0.04, PZ0 + iz + 0.96]} c={P.water} o={0.55} />;
        })}
      {arrows > 0 &&
        [[PX0 + 0.25, -0.55, Math.PI], [PX0 + 0.25, -1.0, Math.PI], [PX1 - 0.25, -0.55, 0], [PX1 - 0.25, -1.0, 0], [0.5, FL + 0.15, -Math.PI / 2], [2.5, FL + 0.15, -Math.PI / 2]].map(([x, y, d], i) => (
          <Arrow key={"pa" + i} p={[x, y, FACE + 0.05]} dir={d} s={1.6 + Math.sin(gf * 0.3 + i) * 0.15} c="#ff2d2d" />
        ))}
      {plainWall > 0.01 && (
        <group>
          <B x={[PX0, PX0 + CT]} y={[FL, 0]} z={[PZ0, FACE]} c={P.concreteD} o={plainWall} />
          <B x={[PX1 - CT, PX1]} y={[FL, 0]} z={[PZ0, FACE]} c={P.concreteD} o={plainWall} />
          {crack4 > 0.01 && (
            <group>
              {[[0, -0.15, 0.4], [0.1, -0.45, -0.5], [-0.05, -0.75, 0.6], [0.06, -1.05, -0.3]].map(([dx, y, r], i) => (
                <B key={"ck" + i} x={[PX1 - CT - 0.005 + dx * 0.2, PX1 - 0.04]} y={[y - 0.16 * crack4, y + 0.02]} z={[FACE - 0.001, FACE + 0.012]} c="#1b1b1b" />
              ))}
              {Array.from({length: 10}).map((_, i) => {
                const k = ((t * 0.02 + random("lk" + i)) % 1);
                return (
                  <mesh key={"lk" + i} position={[PX1 + 0.1 + k * 1.2, -0.5 - random("ly" + i) * 0.6 - k * 0.4, FACE + 0.02]}>
                    <sphereGeometry args={[0.05, 8, 6]} />
                    <M c={P.water} e={P.water} ei={0.3} />
                  </mesh>
                );
              })}
            </group>
          )}
        </group>
      )}
      {/* vergalhões: grade laranja no fundo e nas paredes */}
      {rebar > 0.001 && (
        <group position={[0, ex(0.2), 0]}>
          {Array.from({length: 13}).map((_, i) => (i / 13 < rebar ? <B key={"rx" + i} x={[PX0 + 0.1 + i * 0.48, PX0 + 0.13 + i * 0.48]} y={[FL + 0.08, FL + 0.11]} z={[PZ0 + 0.1, FACE]} c={P.rebar} /> : null))}
          {Array.from({length: 7}).map((_, i) => (i / 7 < rebar ? <B key={"rz" + i} x={[PX0 + 0.1, PX1 - 0.1]} y={[FL + 0.11, FL + 0.14]} z={[PZ0 + 0.1 + i * 0.48, PZ0 + 0.13 + i * 0.48]} c={P.rebar} /> : null))}
          {Array.from({length: 13}).map((_, i) => (i / 13 < rebar * 1.2 - 0.2 ? <B key={"rv" + i} x={[PX0 + 0.1 + i * 0.48, PX0 + 0.13 + i * 0.48]} y={[FL + 0.08, -0.05]} z={[PZ0 + 0.09, PZ0 + 0.12]} c={P.rebar} /> : null))}
          {[PX0 + 0.09, PX1 - 0.12].map((x) => Array.from({length: 7}).map((_, i) => (i / 7 < rebar * 1.2 - 0.2 ? <B key={"rs" + x + i} x={[x, x + 0.03]} y={[FL + 0.08, -0.05]} z={[PZ0 + 0.1 + i * 0.48, PZ0 + 0.13 + i * 0.48]} c={P.rebar} /> : null)))}
          {[-1.0, -0.55, -0.15].map((y) => (rebar > 0.6 ? <B key={"rh" + y} x={[PX0 + 0.09, PX1 - 0.09]} y={[y, y + 0.03]} z={[PZ0 + 0.09, PZ0 + 0.12]} c={P.rebar} /> : null))}
        </group>
      )}
      <Mixer x={6.3} z={-0.6} t={t} o={mixer} />
      {/* casca de concreto armado: fundo e paredes subindo */}
      {shell > 0.001 && (
        <group position={[0, ex(0), 0]}>
          <B x={[PX0, PX1]} y={[FL, FL + CT * clamp01(shell * 3)]} z={[PZ0, FACE]} c={P.concrete} />
          {shell > 0.33 && (
            <group>
              {(() => {
                const top = FL + CT + (0 - FL - CT) * clamp01((shell - 0.33) / 0.67);
                return (
                  <>
                    <B x={[PX0, PX0 + CT]} y={[FL + CT, top]} z={[PZ0, FACE]} c={P.concrete} />
                    <B x={[PX1 - CT, PX1]} y={[FL + CT, top]} z={[PZ0, FACE]} c={P.concrete} />
                    <B x={[PX0 + CT, PX1 - CT]} y={[FL + CT, top]} z={[PZ0, PZ0 + CT]} c={P.concreteD} />
                  </>
                );
              })()}
            </group>
          )}
        </group>
      )}

      {/* ---------- s5: impermeabilização (rolo) e vazamento ---------- */}
      {wproof > 0.001 && (
        <group position={[0, ex(0.45), 0]}>
          <B x={[IN.x0, IN.x0 + (IN.x1 - IN.x0) * wproof]} y={[IN.y0, IN.y0 + 0.02]} z={[IN.z0, FACE]} c={P.waterproof} />
          <B x={[IN.x0, IN.x0 + (IN.x1 - IN.x0) * wproof]} y={[IN.y0, 0]} z={[IN.z0, IN.z0 + 0.02]} c={P.waterproof} />
          {wproof > 0.05 && <B x={[IN.x0, IN.x0 + 0.02]} y={[IN.y0, 0]} z={[IN.z0, FACE]} c={P.waterproof} />}
          {wproof > 0.95 && <B x={[IN.x1 - 0.02, IN.x1]} y={[IN.y0, 0]} z={[IN.z0, FACE]} c={P.waterproof} />}
          {wproof < 0.999 && inS("s5") && (
            <group position={[IN.x0 + (IN.x1 - IN.x0) * wproof, IN.y0 + 0.1, 0.6]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
                <M c="#5d8ea6" />
              </mesh>
              <B x={[-0.02, 0.02]} y={[0, 0.9]} z={[-0.02, 0.02]} c="#455a64" />
            </group>
          )}
        </group>
      )}
      {leakWater > 0.01 &&
        Array.from({length: 16}).map((_, i) => {
          const k = ((t * 0.018 + random("pl" + i)) % 1);
          const left = i % 2 === 0;
          return (
            <mesh key={"pl" + i} position={[left ? PX0 - 0.1 - k * 1.4 : PX1 + 0.1 + k * 1.4, -0.3 - random("py" + i) * 1.0 - k * 0.5, FACE + 0.02]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <M c={P.water} e={P.water} ei={0.3} />
            </mesh>
          );
        })}
      {/* marca de nível do teste de estanqueidade */}
      {testLvl > 0.9 && inS("s5") && <B x={[IN.x1 - 0.03, IN.x1 - 0.01]} y={[WATER_TOP - 0.02, WATER_TOP + 0.02]} z={[0.2, FACE]} c="#ff2d2d" e="#ff2d2d" ei={0.5} />}

      {/* ---------- s6: pastilhas e borda ---------- */}
      {tiles > 0.001 && <Tiles reveal={tiles} dy={ex(0.9)} />}
      {coping > 0.001 && (
        <group position={[0, ex(1.75), 0]}>
          {Array.from({length: 16}).map((_, i) => {
            const k = clamp01(coping * 16 - i);
            return k > 0 ? <B key={"cb" + i} x={[PX0 - 0.25 + i * 0.4375, PX0 - 0.25 + (i + 1) * 0.4375 - 0.02]} y={[0, 0.09 * k]} z={[PZ0 - 0.3, PZ0 + CT]} c={P.coping} /> : null;
          })}
          {[PX0 - 0.25, PX1 - CT].map((x, j) =>
            Array.from({length: 7}).map((_, i) => {
              const k = clamp01(coping * 7 - i);
              return k > 0 ? <B key={"cs" + j + i} x={[x, x + 0.45]} y={[0, 0.09 * k]} z={[PZ0 + CT + i * 0.43, PZ0 + CT + (i + 1) * 0.43 - 0.02]} c={P.coping} /> : null;
            }),
          )}
        </group>
      )}

      {/* ---------- água ---------- */}
      {lvl > -5 && (
        <group position={[0, ex(1.3), 0]}>
          <WaterBox x={[IN.x0 + 0.04, IN.x1 - 0.04]} y0={IN.y0 + 0.04} top={lvl} z={[IN.z0 + 0.04, FACE]} color={wColor} />
        </group>
      )}
      {/* folhas caindo e boiando */}
      {leaves > 0.01 &&
        Array.from({length: 14}).map((_, i) => {
          const d0 = W("s7", "caem") - 10 + random("lf" + i) * 40;
          const y = Math.max(WATER_TOP + 0.01, 2.5 - (t - d0) * 0.06);
          if (t < d0) return null;
          return (
            <mesh key={"lf" + i} position={[IN.x0 + 0.3 + random("lx" + i) * 4.9 + Math.sin(t * 0.05 + i) * 0.1, y, IN.z0 + 0.3 + random("lz" + i) * 2.4]} rotation={[-Math.PI / 2 + Math.sin(t * 0.1 + i) * 0.4, 0, random("lr" + i) * 6]} scale={leaves}>
              <circleGeometry args={[0.09, 6]} />
              <M c={i % 3 ? "#7a9a2e" : "#a0642c"} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

      {/* ---------- s7: hidráulica em corte e casa de máquinas ---------- */}
      {pDrain > 0 && <B x={[1.25, 1.75]} y={[IN.y0 + 0.04, IN.y0 + 0.06]} z={[0.35, 0.85]} c="#eceff1" />}
      {pSkim > 0 && <B x={[IN.x1 - 0.05, IN.x1 + 0.02]} y={[WATER_TOP - 0.18, WATER_TOP + 0.08]} z={[0.9, 1.35]} c="#eceff1" />}
      {pRet > 0 && <B x={[IN.x0 - 0.01, IN.x0 + 0.06]} y={[-0.55, -0.45]} z={[1.05, 1.25]} c="#eceff1" />}
      <PipePath gf={gf} show={pDrain} flow={flow} pts={[[1.5, IN.y0, FACE + 0.03], [1.5, -1.75, FACE + 0.03], [6.35, -1.75, FACE + 0.03], [6.35, -0.95, FACE + 0.03]]} />
      <PipePath gf={gf} show={pSkim} flow={flow} pts={[[IN.x1, -0.3, FACE + 0.03], [5.6, -0.3, FACE + 0.03], [5.6, -0.95, FACE + 0.03], [6.15, -0.95, FACE + 0.03]]} />
      <PipePath gf={gf} show={pRet} flow={flow} pts={[[7.2, -0.25, FACE + 0.03], [7.85, -0.25, FACE + 0.03], [7.85, -2.05, FACE + 0.03], [-1.85, -2.05, FACE + 0.03], [-1.85, -0.5, FACE + 0.03], [IN.x0, -0.5, FACE + 0.03]]} />
      <PipePath gf={gf} show={pump > 0.5 && filt > 0.5 ? 1 : 0} flow={flow} pts={[[6.55, -0.95, FACE + 0.03], [6.9, -0.95, FACE + 0.03]]} />
      {room > 0.01 && (
        <group>
          <B x={[MR.x0, MR.x1]} y={[MR.y0, MR.y0 + 0.08]} z={[MR.z0, FACE]} c={P.concreteD} />
          <B x={[MR.x0, MR.x0 + 0.08]} y={[MR.y0, 0]} z={[MR.z0, FACE]} c={P.concrete} />
          <B x={[MR.x1 - 0.08, MR.x1]} y={[MR.y0, 0]} z={[MR.z0, FACE]} c={P.concrete} />
          <B x={[MR.x0, MR.x1]} y={[MR.y0, 0]} z={[MR.z0, MR.z0 + 0.08]} c={P.concreteD} />
          {/* tampa articulada no fundo */}
          <group position={[(MR.x0 + MR.x1) / 2, 0.06, MR.z0]} rotation={[-lid, 0, 0]}>
            <B x={[-(MR.x1 - MR.x0) / 2, (MR.x1 - MR.x0) / 2]} y={[0, 0.07]} z={[0, FACE - MR.z0]} c="#8d9399" />
          </group>
          {/* bomba (motor azul) */}
          {pump > 0.01 && (
            <group position={[6.35, -0.95, 1.15]} scale={pump}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.16, 0.16, 0.4, 20]} />
                <M c="#1e88e5" rough={0.4} />
              </mesh>
              <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.13, 0.13, 0.12, 20]} />
                <M c="#eceff1" />
              </mesh>
              <B x={[-0.22, 0.3]} y={[-0.25, -0.16]} z={[-0.15, 0.15]} c="#455a64" />
            </group>
          )}
          {/* filtro de areia em corte: tanque, areia e cascalho */}
          {filt > 0.01 && (
            <group position={[7.2, MR.y0 + 0.08, 1.15]} scale={filt}>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.28, 0.28, 0.8, 24, 1, true]} />
                <M c="#e0e4e8" o={0.45} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.88, 0]}>
                <sphereGeometry args={[0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <M c="#e0e4e8" />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.16, 24]} />
                <M c="#8d8f91" />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.36, 24]} />
                <M c="#e8cf93" />
              </mesh>
              <B x={[-0.3, 0.3]} y={[0, 0.06]} z={[-0.3, 0.3]} c="#455a64" />
            </group>
          )}
        </group>
      )}

      {/* ---------- s8: cloro e kit de pH ---------- */}
      {bottle > 0.6 &&
        Array.from({length: 10}).map((_, i) => {
          const k = ((t * 0.05 + random("cd" + i)) % 1);
          return (
            <mesh key={"cd" + i} position={[-1.12 + random("cx" + i) * 0.12, 0.75 - k * 0.95, 0.9]}>
              <sphereGeometry args={[0.035, 8, 6]} />
              <M c="#e9fbff" e="#bff3ff" ei={0.6} />
            </mesh>
          );
        })}
      {kit > 0.01 && (
        <group position={[-2.35, 0.06, 1.1]} scale={kit}>
          <B x={[-0.28, 0.28]} y={[0, 0.12]} z={[-0.18, 0.18]} c="#263238" />
          {[[-0.12, "#f9d71c"], [0.0, "#ff7043"], [0.12, "#e53935"]].map(([x, c]) => (
            <mesh key={String(x)} position={[x as number, 0.27, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
              <M c={c as string} o={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* ---------- s9: respingo do mergulho ---------- */}
      {splashT >= 0 && splashT < 30 &&
        Array.from({length: 26}).map((_, i) => {
          const a = random("sa" + i) * Math.PI * 2, v = 0.05 + random("sv" + i) * 0.06;
          const x = 1.2 + Math.cos(a) * v * splashT, z = 0.7 + Math.sin(a) * v * splashT * 0.6;
          const y = WATER_TOP + (0.16 + random("sy" + i) * 0.1) * splashT - 0.012 * splashT * splashT;
          return y < WATER_TOP - 0.05 ? null : (
            <mesh key={"sp" + i} position={[x, y, z]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <M c="#e3f7ff" e="#bfefff" ei={0.4} />
            </mesh>
          );
        })}

      {/* ---------- cenário ---------- */}
      <House />
      {/* casas da vizinhança (pedido do usuário) */}
      {[[-3.2, -8.2, "#f5d9b8", "#b24a36"], [2.2, -8.6, "#dfe9f2", "#4f6d8f"], [7.4, -8.2, "#fff3c4", "#c9563c"], [12.6, -7.0, "#e3f1df", "#6d4c41"], [-12.5, -6.5, "#f8e1e7", "#4f6d8f"]].map(([x, z, wc, rc], i) => (
        <group key={"vh" + i} position={[x as number, 0.06, z as number]} scale={0.9 + (i % 2) * 0.15}>
          <B x={[-1.6, 1.6]} y={[0, 1.9]} z={[-1.3, 1.3]} c={wc as string} />
          <mesh position={[0, 1.9 + 0.6, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[2.45, 1.2, 4]} />
            <M c={rc as string} />
          </mesh>
          <B x={[-0.3, 0.3]} y={[0, 1.1]} z={[1.3, 1.34]} c="#8a5a2b" />
          <B x={[-1.25, -0.6]} y={[0.9, 1.45]} z={[1.3, 1.34]} c="#9fd3f2" />
          <B x={[0.6, 1.25]} y={[0.9, 1.45]} z={[1.3, 1.34]} c="#9fd3f2" />
        </group>
      ))}
      <B x={[-12, 12]} y={[0.06, 1.0]} z={[-4.6, -4.4]} c="#ece3d3" />
      <Tree x={-3.6} z={-3.4} s={1.1} />
      <Tree x={9.2} z={-3.0} s={1.2} />
      <Pine x={11} z={-6} s={1.3} />
      <GrassBlades
        gf={gf}
        seed="p"
        areas={[
          {x: [-12, -2.2], z: [-4.2, FACE - 0.05], n: 420},
          {x: [8.0, 14], z: [-4.2, FACE - 0.05], n: 300},
          {x: [-1.8, 5.5], z: [-4.2, -2.0], n: 160},
        ]}
      />
      {[[-9, -30, 10], [4, -34, 13], [22, -32, 11]].map(([x, z, r], i) => (
        <mesh key={"hl" + i} position={[x, -r * 0.55, z]} scale={[1.6, 1, 1]}>
          <sphereGeometry args={[r, 32, 16]} />
          <M c={i % 2 ? "#7fb35a" : "#8cc063"} />
        </mesh>
      ))}

      {/* ---------- VIZINHO ENGRAÇADO: pula do muro no lamaçal ---------- */}
      {(() => {
        const nl = neighborLook(t);
        if (!nl.at) return null;
        return <Mascot position={nl.at} scale={0.8} pose={neighborPose(t)} gf={gf} look={nl} />;
      })()}
      {(() => {
        const st = t - neighborLand();
        if (st < 0 || st > 32 || undoneS2(gf) || !inS("s2")) return null;
        return Array.from({length: 24}).map((_, i) => {
          const a = random("ms" + i) * Math.PI * 2, v = 0.04 + random("mv" + i) * 0.05;
          const y = -0.7 + (0.14 + random("my" + i) * 0.08) * st - 0.011 * st * st;
          return y < -0.8 ? null : (
            <mesh key={"ms" + i} position={[2.1 + Math.cos(a) * v * st, y, 0.35 + Math.sin(a) * v * st * 0.6]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <M c={P.mud} />
            </mesh>
          );
        });
      })()}

      {/* ---------- MASCOTE ---------- */}
      {(() => {
        const mp = mascotPose(t);
        const ml = mascotLook(t);
        if (!ml.at) return null;
        return (
          <group position={ml.at} rotation={[0, ml.ry ?? 0, 0]}>
            <Mascot position={[0, 0, 0]} scale={0.8} pose={mp} gf={gf} look={ml} />
          </group>
        );
      })()}

      <Clouds gf={gf} />
      <fog attach="fog" args={["#d6ecfb", camDist + 12, camDist + 70]} />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#d6ecff", "#5d7a3a", 0.9]} />
      <SunLight gf={gf} />
      <directionalLight position={[-6, 4, 9]} intensity={0.35} color="#cfe3ff" />
      {sceneAt(gf) && null}
      {leaks && null}
    </group>
  );
};
