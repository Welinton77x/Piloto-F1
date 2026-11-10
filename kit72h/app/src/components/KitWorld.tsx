// Vídeo 5 — casa em corte num temporal: energia, água e comunicação param; o kit de 72 h é montado na mesa.
// Estilo liso do canal. Estados derivados do frame global.
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {clamp01, mixHex} from "../lib/anim";
import {poseAt} from "../lib/camera";
import {Mascot} from "./Mascot";

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
const SunLight: React.FC<{gf: number; k?: number}> = ({gf, k = 1}) => {
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
  return <directionalLight ref={ref} intensity={1.75 * k} color="#fff1d6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.02} />;
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




/* ================= KIT 72 H ================= */
import {L, easeInOut, easeOut} from "../lib/anim";
import {ITEMS, W, end, flashlightOn, inS, itemK, packK, power, rain, start} from "../lib/story";
import {mascotLook, mascotPose} from "../lib/mascotPose";

const H = {
  floor: "#d9b98f", wallIn: "#f5e6cc", wallOut: "#f2d3a2", roof: "#b5523b", wood: "#8d6e63", woodL: "#a1887f",
  street: "#3b414d", side: "#cfd3d8", flood: "#7a6a4a", white: "#f5f7fa", metal: "#9aa3ad", dark: "#263238",
};
export const TABLE = {x0: -0.6, x1: 1.4, z0: -1.25, z1: 0.0, top: 0.86};
export const PACK_FLOOR: [number, number, number] = [1.95, 0.15, -0.55];
export const HOOK: [number, number, number] = [3.0, 1.2, -1.2];


/** segmento cilíndrico entre dois pontos */
const Seg: React.FC<{a: [number, number, number]; b: [number, number, number]; r: number; c: string; e?: string; ei?: number}> = ({a, b, r, c, e, ei}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return (
    <mesh position={va.clone().add(vb).multiplyScalar(0.5)} quaternion={q}>
      <cylinderGeometry args={[r, r, d.length(), 12]} />
      <M c={c} e={e} ei={ei} rough={0.5} />
    </mesh>
  );
};

/** queda com quique amortecido (gravidade + perda de energia a cada batida): altura acima do apoio */
export const dropBounce = (f: number, h0 = 0.9) => {
  if (f < 0) return h0;
  const g = 0.0042; // u/frame²
  let v = 0, y = h0;
  for (let i = 0; i < f; i++) {
    v -= g;
    y += v;
    if (y < 0) {
      y = 0;
      v = -v * 0.42;
      if (Math.abs(v) < 0.004) v = 0;
    }
  }
  return Math.max(0, y);
};
/** inclinação de "assentar": balança e para */
const settle = (f: number) => (f < 0 ? 0 : Math.sin(f * 0.6) * 0.35 * Math.exp(-f * 0.08));

/** posições dos 8 itens em cima da mesa */
const slot = (i: number): [number, number, number] => [TABLE.x0 + 0.3 + (i % 4) * 0.47, TABLE.top, i < 4 ? -0.92 : -0.36];

const ItemMesh: React.FC<{i: number}> = ({i}) => {
  switch (ITEMS[i].k) {
    case "agua":
      return (
        <group>
          {[-0.12, 0, 0.12].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.3, 16]} />
                <M c="#4fc3f7" o={0.75} />
              </mesh>
              <mesh position={[0, 0.33, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.04, 10]} />
                <M c="#1565c0" />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "comida":
      return (
        <group>
          {[-0.1, 0.03].map((x) => (
            <group key={x} position={[x, 0.07, 0.04]}>
              <mesh>
                <cylinderGeometry args={[0.055, 0.055, 0.13, 18]} />
                <M c={H.metal} metal={0.5} rough={0.4} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.057, 0.057, 0.07, 18]} />
                <M c={x < 0 ? "#e53935" : "#fbc02d"} />
              </mesh>
            </group>
          ))}
          <B x={[0.06, 0.2]} y={[0, 0.2]} z={[-0.12, -0.02]} c="#ff8f00" />
          <B x={[-0.16, 0.0]} y={[0, 0.03]} z={[-0.13, -0.08]} c="#8d6e63" />
        </group>
      );
    case "lanterna":
      return (
        <group>
          <group position={[-0.05, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.22, 14]} />
              <M c="#ffc400" />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.06, 0.045, 0.05, 16]} />
              <M c="#37474f" />
            </mesh>
          </group>
          {Array.from({length: 6}).map((_, k) => (
            <mesh key={k} position={[-0.12 + k * 0.05, 0.04, 0.12]}>
              <cylinderGeometry args={[0.018, 0.018, 0.08, 10]} />
              <M c={k % 2 ? "#212121" : "#c62828"} />
            </mesh>
          ))}
        </group>
      );
    case "radio":
      return (
        <group>
          <B x={[-0.16, 0.16]} y={[0, 0.17]} z={[-0.06, 0.06]} c="#d32f2f" />
          <mesh position={[-0.07, 0.085, 0.061]}>
            <circleGeometry args={[0.055, 18]} />
            <M c="#263238" />
          </mesh>
          <B x={[0.02, 0.13]} y={[0.1, 0.14]} z={[0.06, 0.065]} c="#fff59d" />
          <B x={[0.12, 0.13]} y={[0.17, 0.45]} z={[-0.005, 0.005]} c={H.metal} />
        </group>
      );
    case "carregador":
      return (
        <group>
          <B x={[-0.14, 0.0]} y={[0, 0.04]} z={[-0.06, 0.06]} c="#212121" />
          {[0, 1, 2, 3].map((k) => <B key={k} x={[-0.12 + k * 0.025, -0.105 + k * 0.025]} y={[0.04, 0.045]} z={[0.03, 0.05]} c="#69f0ae" />)}
          <group position={[0.1, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
            <mesh>
              <planeGeometry args={[0.18, 0.24]} />
              <meshStandardMaterial color="#fffde7" side={THREE.DoubleSide} />
            </mesh>
            {[0, 1, 2].map((k) => <B key={k} x={[-0.07, 0.07]} y={[0.07 - k * 0.05, 0.075 - k * 0.05]} z={[0.001, 0.002]} c="#1565c0" />)}
          </group>
        </group>
      );
    case "remedios":
      return (
        <group>
          <B x={[-0.18, 0.02]} y={[0, 0.14]} z={[-0.08, 0.08]} c="#ffffff" />
          <B x={[-0.09, -0.07]} y={[0.03, 0.11]} z={[0.08, 0.085]} c="#e53935" />
          <B x={[-0.12, -0.04]} y={[0.06, 0.08]} z={[0.08, 0.085]} c="#e53935" />
          <mesh position={[0.1, 0.06, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 14]} />
            <M c="#ff8a65" />
          </mesh>
        </group>
      );
    case "documentos":
      return (
        <group>
          <B x={[-0.13, 0.13]} y={[0, 0.03]} z={[-0.09, 0.09]} c="#1e3a8a" />
          <B x={[-0.1, 0.1]} y={[0.03, 0.035]} z={[-0.06, 0.06]} c="#43a047" />
          <B x={[-0.16, 0.16]} y={[0, 0.06]} z={[-0.12, 0.12]} c="#e3f2fd" o={0.35} />
          <B x={[-0.16, 0.16]} y={[0.055, 0.065]} z={[0.1, 0.12]} c="#1e88e5" />
        </group>
      );
    default:
      return (
        <group>
          <B x={[-0.18, 0.0]} y={[0, 0.07]} z={[-0.1, 0.06]} c="#1e88e5" />
          <B x={[0.03, 0.12]} y={[0, 0.06]} z={[-0.04, 0.04]} c="#f8bbd0" />
          <B x={[0.04, 0.16]} y={[0, 0.02]} z={[0.08, 0.1]} c="#80deea" />
          <B x={[-0.16, -0.04]} y={[0, 0.12]} z={[0.08, 0.14]} c="#ffb74d" />
        </group>
      );
  }
};

/** casinha simples da vizinhança (luzes apagadas no temporal) */
const SmallHouse: React.FC<{x: number; z: number; c: string; r: string; lit: number}> = ({x, z, c, r, lit}) => (
  <group position={[x, 0, z]}>
    <B x={[-1.4, 1.4]} y={[0, 1.8]} z={[-1.2, 1.2]} c={c} />
    <mesh position={[0, 1.8 + 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.15, 1.1, 4]} />
      <M c={r} />
    </mesh>
    {[-0.7, 0.7].map((wx) => <B key={wx} x={[wx - 0.3, wx + 0.3]} y={[0.9, 1.4]} z={[1.2, 1.23]} c={lit > 0.5 ? "#ffe082" : "#455a64"} e={lit > 0.5 ? "#ffd54f" : "#000000"} ei={lit > 0.5 ? 0.8 : 0} />)}
  </group>
);

/* ================= MUNDO ================= */
export const KitWorld: React.FC<{gf: number}> = ({gf}) => {
  const rootRef = useRef<THREE.Group>(null);
  useShadows(rootRef);
  const t = gf;
  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);
  const pw = power(t);
  const storm = t >= start("s2") && t < start("s8");
  const flood = t < start("s2") ? 0 : t < start("s7") ? L(t, W("s2", "enchente", 1) - 10, W("s2", "Terceira"), 0.05, 0.32, easeInOut) : L(t, start("s7"), end("s7"), 0.32, 0.05);
  const pf = t - (W("s2", "energia") - 10);
  // tomba acelerando (gravidade) e quica no chão antes de parar
  const poleFall = pf < 0 ? 0 : pf < 16 ? 1.25 * (pf / 16) ** 2 : 1.25 - Math.abs(Math.sin((pf - 16) * 0.45)) * 0.12 * Math.exp(-(pf - 16) * 0.12);
  const lightning = storm && ((t % 97) < 3 || (t % 151) < 2) ? 1 : 0;
  const tapRun = t < W("s2", "Segunda") + 12 ? 1 : 0;
  const pipeBurst = t >= W("s2", "romper") - 4 && t < start("s4") ? 1 : 0;
  const pumpOn = t < W("s2", "bomba") ? 1 : 0;
  const tankLvl = L(t, W("s2", "bomba"), W("s2", "Segunda"), 0.85, 0.15);
  const towerBat = t < W("s2", "antenas") ? 1 : L(t, W("s2", "antenas"), W("s2", "Depois"), 1, 0.05);
  const rescue = inS("s3", t);
  const boatX = rescue ? L(t, start("s3"), end("s3"), -12, 14) : -40;
  const flash = flashlightOn(t);
  const candle = inS("s5", t) && t < W("s5", "lanterna") + 25;
  const pack = packK(t);
  const toHook = L(t, W("s7", "mochila") + 30, W("s7", "porta") - 4, 0, 1, easeInOut);
  const worn = t >= W("s7", "pegar") - 6;
  const ml = mascotLook(t), mp = mascotPose(t);
  const rainK = rain(t);

  const packPos = new THREE.Vector3(...PACK_FLOOR).lerp(new THREE.Vector3(...HOOK), toHook);

  return (
    <group ref={rootRef}>
      {/* ---------- CHÃO, RUA E ENCHENTE ---------- */}
      <B x={[-40, 40]} y={[-0.4, 0.04]} z={[-40, 1.6]} c={C.grass} />
      <B x={[-40, 40]} y={[-0.4, 0.1]} z={[1.6, 2.4]} c={H.side} />
      <B x={[-40, 40]} y={[-0.4, 0.0]} z={[2.4, 6.5]} c={H.street} />
      <B x={[-40, 40]} y={[-0.4, 0.1]} z={[6.5, 7.3]} c={H.side} />
      <B x={[-40, 40]} y={[-0.4, 0.04]} z={[7.3, 40]} c={C.grass} />
      {Array.from({length: 20}).map((_, k) => <B key={"ln" + k} x={[-38 + k * 4, -36.5 + k * 4]} y={[0, 0.012]} z={[4.4, 4.5]} c="#f2d14b" />)}
      {flood > 0.06 && (
        <mesh position={[0, flood, 4.45]}>
          <boxGeometry args={[80, 0.02, 9]} />
          <meshStandardMaterial color={H.flood} roughness={0.15} metalness={0.2} transparent opacity={0.85} />
        </mesh>
      )}

      {/* ---------- CASA EM CORTE ---------- */}
      <B x={[-3.3, 3.3]} y={[0, 0.15]} z={[-2.5, 1.3]} c={H.floor} />
      <B x={[-3.3, 3.3]} y={[0.15, 2.6]} z={[-2.5, -2.35]} c={H.wallIn} />
      <B x={[-3.3, -3.15]} y={[0.15, 2.6]} z={[-2.5, 1.3]} c={H.wallIn} />
      {/* parede direita com a porta (vão entre z -0.15 e 0.75) */}
      <B x={[3.15, 3.3]} y={[0.15, 2.6]} z={[-2.5, -0.15]} c={H.wallIn} />
      <B x={[3.15, 3.3]} y={[0.15, 2.6]} z={[0.75, 1.3]} c={H.wallIn} />
      <B x={[3.15, 3.3]} y={[2.1, 2.6]} z={[-0.15, 0.75]} c={H.wallIn} />
      <group position={[3.22, 0.15, -0.15]} rotation={[0, t >= W("s7", "sair") ? -1.2 : 0, 0]}>
        <B x={[-0.04, 0.04]} y={[0, 1.95]} z={[0, 0.9]} c={H.wood} />
      </group>
      {/* telhado */}
      <group position={[0, 2.6, -0.6]}>
        <mesh position={[-1.75, 0.55, 0]} rotation={[0, 0, 0.32]}>
          <boxGeometry args={[3.9, 0.12, 4.2]} />
          <M c={H.roof} />
        </mesh>
        <mesh position={[1.75, 0.55, 0]} rotation={[0, 0, -0.32]}>
          <boxGeometry args={[3.9, 0.12, 4.2]} />
          <M c={H.roof} />
        </mesh>
      </group>
      {/* janela na parede do fundo (mostra o temporal) */}
      <B x={[-1.0, 0.2]} y={[1.2, 2.0]} z={[-2.36, -2.33]} c={storm ? mixHex("#1c2a44", "#ffffff", lightning * 0.8) : "#9fd3f2"} e={lightning ? "#ffffff" : "#000000"} ei={lightning} />
      {/* luminária do teto */}
      <mesh position={[0.4, 2.45, -0.6]}>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color={pw ? "#fff3c4" : "#757575"} emissive={pw ? "#ffe082" : "#000000"} emissiveIntensity={pw ? 1.5 : 0} />
      </mesh>
      <pointLight position={[0.4, 2.2, -0.6]} intensity={pw ? 2.2 : 0} distance={8} color="#ffe0b2" />
      {/* cozinha: geladeira, pia com torneira */}
      <B x={[-3.1, -2.35]} y={[0.15, 2.05]} z={[-2.3, -1.6]} c={H.white} />
      <B x={[-2.4, -2.37]} y={[1.0, 1.4]} z={[-1.62, -1.58]} c={H.metal} />
      <B x={[-3.08, -2.38]} y={[1.75, 1.78]} z={[-1.62, -1.6]} c={pw ? "#4fc3f7" : "#90a4ae"} e={pw ? "#4fc3f7" : "#000000"} ei={pw ? 0.9 : 0} />
      <B x={[-2.3, -1.0]} y={[0.15, 0.95]} z={[-2.35, -1.75]} c={H.woodL} />
      <B x={[-2.2, -1.1]} y={[0.95, 1.0]} z={[-2.3, -1.8]} c="#e0e0e0" />
      <Seg a={[-1.65, 1.0, -2.25]} b={[-1.65, 1.3, -2.25]} r={0.025} c={H.metal} />
      <Seg a={[-1.65, 1.3, -2.25]} b={[-1.65, 1.3, -2.05]} r={0.025} c={H.metal} />
      {tapRun > 0 && <B x={[-1.665, -1.635]} y={[1.0, 1.28]} z={[-2.065, -2.035]} c="#4fc3f7" o={0.8} />}
      {/* TV */}
      <B x={[1.4, 2.7]} y={[1.25, 1.95]} z={[-2.34, -2.3]} c="#111111" />
      <B x={[1.45, 2.65]} y={[1.3, 1.9]} z={[-2.3, -2.29]} c={pw ? "#1e88e5" : "#111111"} e={pw ? "#64b5f6" : "#000000"} ei={pw ? 0.8 : 0} />
      {/* mesa e banco */}
      <B x={[TABLE.x0, TABLE.x1]} y={[TABLE.top - 0.06, TABLE.top]} z={[TABLE.z0, TABLE.z1]} c={H.wood} />
      {[[TABLE.x0 + 0.06, TABLE.z0 + 0.06], [TABLE.x1 - 0.06, TABLE.z0 + 0.06], [TABLE.x0 + 0.06, TABLE.z1 - 0.06], [TABLE.x1 - 0.06, TABLE.z1 - 0.06]].map(([x, z], k) => (
        <B key={"tl" + k} x={[x - 0.04, x + 0.04]} y={[0.15, TABLE.top - 0.06]} z={[z - 0.04, z + 0.04]} c={H.wood} />
      ))}
      {/* gancho perto da porta */}
      <B x={[3.08, 3.15]} y={[1.45, 1.5]} z={[-1.25, -1.15]} c={H.dark} />

      {/* ---------- ITENS DO KIT NA MESA ---------- */}
      {ITEMS.map((_, i) => {
        const k = itemK(i, t);
        if (k <= 0.001) return null;
        const p0 = new THREE.Vector3(...slot(i));
        const into = clamp01(pack * 1.4 - i * 0.05);
        if (into >= 0.999) return null;
        const p = p0.clone().lerp(new THREE.Vector3(PACK_FLOOR[0], PACK_FLOOR[1] + 0.45, PACK_FLOOR[2]), easeInOut(into));
        const fl = t - (W(ITEMS[i].w[0], ITEMS[i].w[1]) - 4);
        const hb = dropBounce(fl);
        p.y += Math.sin(into * Math.PI) * 0.6 + (into > 0 ? 0 : hb);
        const sq = into > 0 || hb > 0.01 ? 1 : 1 - 0.18 * Math.max(0, Math.sin(fl * 0.9)) * Math.exp(-fl * 0.12);
        const sc = Math.min(1, k * 3) * (1 - into * 0.7);
        return (
          <group key={"it" + i} position={p} rotation={[settle(fl) * 0.5, into * 4, settle(fl)]} scale={[sc * (2 - sq), sc * sq, sc * (2 - sq)]}>
            <ItemMesh i={i} />
          </group>
        );
      })}
      {/* vela (s5): risco de incêndio */}
      {candle && (
        <group position={[TABLE.x1 - 0.15, TABLE.top, -0.15]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
            <M c="#fffde7" />
          </mesh>
          <mesh position={[0, 0.22, 0]} scale={[1, 1.6 + Math.sin(t * 0.8) * 0.2, 1]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshBasicMaterial color="#ffb300" />
          </mesh>
          <pointLight position={[0, 0.3, 0]} intensity={0.8} distance={3} color="#ffb74d" />
        </group>
      )}
      {/* mochila: no chão aberta (recebendo os itens), depois no gancho, depois nas costas */}
      {!worn && (
        <group position={packPos} rotation={[toHook >= 1 ? Math.sin((t - W("s7", "porta")) * 0.35) * 0.12 * Math.exp(-Math.max(0, t - W("s7", "porta")) * 0.05) : 0, -0.4, pack > 0 && pack < 1 ? Math.sin(t * 0.9) * 0.05 : 0]}>
          <B x={[-0.26, 0.26]} y={[0, 0.6]} z={[-0.14, 0.14]} c="#2e7d32" />
          <B x={[-0.2, 0.2]} y={[0.06, 0.3]} z={[0.14, 0.2]} c="#1b5e20" />
          <B x={[-0.24, 0.24]} y={[0.58, 0.62]} z={[-0.12, 0.12]} c={pack > 0.98 ? "#ffc400" : "#1b5e20"} />
          {pack < 0.98 && <B x={[-0.22, 0.22]} y={[0.6, 0.61]} z={[-0.1, 0.1]} c="#0b3d0e" />}
        </group>
      )}
      {/* luz da lanterna */}
      {flash && ml.at && (
        <spotLight position={[ml.at[0] + 0.3, 1.25, ml.at[2] + 0.2]} target-position={[0.5, TABLE.top, -0.6]} angle={0.6} penumbra={0.6} intensity={6} distance={7} color="#fff6d5" />
      )}

      {/* ---------- LÁ FORA: poste, cano, prédio com bomba, antena, bote ---------- */}
      <group position={[-6.2, 0.1, 2.0]} rotation={[0, 0, poleFall]}>
        <B x={[-0.07, 0.07]} y={[0, 3.6]} z={[-0.07, 0.07]} c="#6d4c41" />
        <B x={[-0.5, 0.5]} y={[3.3, 3.38]} z={[-0.05, 0.05]} c="#5d4037" />
      </group>
      {Array.from({length: 4}).map((_, k) => <Seg key={"wire" + k} a={[-6.2 + (poleFall > 0.5 ? -k * 0.4 : 0), poleFall > 0.5 ? 0.15 : 3.35, 2.0]} b={[-3.3, 2.4 - k * 0.05, 1.2]} r={0.01} c="#212121" />)}
      {/* cano rompido na calçada */}
      <Seg a={[-6.0, 0.15, 2.0]} b={[-4.8, 0.15, 2.0]} r={0.08} c="#cfd6de" />
      <Seg a={[-4.6, 0.15, 2.0]} b={[-3.4, 0.15, 2.0]} r={0.08} c="#cfd6de" />
      {pipeBurst > 0 &&
        Array.from({length: 14}).map((_, k) => {
          const s = ((t * 0.05 + random("jt" + k)) % 1);
          return (
            <mesh key={"jt" + k} position={[-4.7 + (random("jx" + k) - 0.5) * 0.3 * s, 0.15 + s * 1.2 - s * s * 0.9, 2.0 + (random("jz" + k) - 0.5) * 0.4 * s]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <M c="#4fc3f7" e="#4fc3f7" ei={0.3} />
            </mesh>
          );
        })}
      {/* prédio com a bomba e a caixa d'água (em corte) */}
      <group position={[-10, 0, -1]}>
        <B x={[-2, 2]} y={[0, 6]} z={[-2, -1.8]} c="#f7c59f" />
        <B x={[-2, -1.8]} y={[0, 6]} z={[-2, 1.5]} c="#f7c59f" />
        <B x={[1.8, 2]} y={[0, 6]} z={[-2, 1.5]} c="#f7c59f" />
        {[1.5, 3.0, 4.5].map((y) => <B key={y} x={[-1.8, 1.8]} y={[y, y + 0.12]} z={[-1.8, 1.5]} c="#cfd8dc" />)}
        <B x={[-2, 2]} y={[6, 6.15]} z={[-2, 1.5]} c="#90a4ae" />
        {/* bomba no térreo */}
        <group position={[1.0, 0.35, 0.6]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.5, 18]} />
            <M c={pumpOn ? "#1e88e5" : "#546e7a"} e={pumpOn ? "#1e88e5" : "#000000"} ei={pumpOn ? 0.3 : 0} />
          </mesh>
        </group>
        <Seg a={[1.0, 0.6, 0.6]} b={[1.0, 6.3, 0.6]} r={0.06} c="#cfd6de" />
        {/* caixa d'água no topo */}
        <group position={[0.6, 6.15, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.7, 0.6, 1.0, 24, 1, true]} />
            <M c="#1e88e5" o={0.45} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.02 + tankLvl * 0.45, 0]}>
            <cylinderGeometry args={[0.62, 0.6, tankLvl * 0.9, 24]} />
            <M c="#4fc3f7" o={0.85} />
          </mesh>
        </group>
      </group>
      {/* antena de celular com bateria */}
      <group position={[9, 0, -2]}>
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], k) => <Seg key={k} a={[x, 0, z]} b={[x * 0.2, 8, z * 0.2]} r={0.05} c="#b0bec5" />)}
        {[2, 4, 6].map((y) => <B key={y} x={[-0.42, 0.42]} y={[y, y + 0.05]} z={[-0.42, 0.42]} c="#b0bec5" />)}
        {[0, 1, 2].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI * 2) / 3, 0]}>
            <B x={[-0.12, 0.12]} y={[7.2, 8.0]} z={[0.22, 0.3]} c="#eceff1" />
          </group>
        ))}
        <mesh position={[0, 8.15, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={towerBat > 0.1 && t % 30 < 15 ? 2 : 0} />
        </mesh>
        {/* gabinete da bateria com nível */}
        <group position={[1.2, 0, 0.8]}>
          <B x={[-0.4, 0.4]} y={[0, 1.2]} z={[-0.3, 0.3]} c="#cfd8dc" />
          <B x={[-0.3, 0.3]} y={[0.15, 0.15 + 0.9 * towerBat]} z={[0.3, 0.32]} c={towerBat > 0.3 ? "#43a047" : "#e53935"} e={towerBat > 0.3 ? "#43a047" : "#e53935"} ei={0.6} />
        </group>
      </group>
      {/* bote de resgate passando pela rua alagada (s3) */}
      {rescue && (
        <group position={[boatX, flood + 0.05, 4.2]} scale={1.6}>
          <B x={[-0.9, 0.9]} y={[0, 0.3]} z={[-0.45, 0.45]} c="#ff7043" />
          <B x={[-0.8, 0.8]} y={[0.3, 0.32]} z={[-0.4, 0.4]} c="#bf360c" />
          <B x={[-0.2, 0.0]} y={[0.3, 0.9]} z={[-0.12, 0.08]} c="#ffd54f" />
        </group>
      )}
      {/* vizinhança */}
      {[[-15, -3, "#f8e1e7", "#4f6d8f"], [6, -6, "#dfe9f2", "#c9563c"], [14, -2, "#fff3c4", "#6d4c41"], [-6, -8, "#e3f1df", "#b24a36"], [-20, 10, "#d7ccc8", "#4f6d8f"], [12, 11, "#f5d9b8", "#c9563c"]].map(([x, z, c, r], k) => (
        <SmallHouse key={"sh" + k} x={x as number} z={z as number} c={c as string} r={r as string} lit={pw} />
      ))}
      <Tree x={-5.5} z={-3.5} s={1.1} />
      <Tree x={5.0} z={-3.0} s={1.0} />

      {/* respingos da chuva batendo no chão e ondinhas na enchente */}
      {rainK > 0.2 && (() => {
        const tg = poseAt(gf).target;
        return Array.from({length: 40}).map((_, k) => {
          const ph = ((t * 0.06 + random("sp" + k)) % 1);
          const x = tg.x + (random("spx" + k) - 0.5) * 12, z = tg.z + (random("spz" + k) - 0.5) * 9;
          const onStreet = z > 2.4 && z < 6.5;
          const y = onStreet ? Math.max(0.02, flood) + 0.012 : 0.06;
          return (
            <mesh key={"sp" + k} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={0.05 + ph * (onStreet ? 0.35 : 0.18)}>
              <ringGeometry args={[0.8, 1, 16]} />
              <meshBasicMaterial color="#e3f2fd" transparent opacity={0.6 * (1 - ph) * rainK} depthWrite={false} />
            </mesh>
          );
        });
      })()}

      {/* chuva */}
      {rainK > 0.02 && (() => {
        const tg = poseAt(gf).target;
        return Array.from({length: 160}).map((_, k) => {
          const x = tg.x + (random("rx" + k) - 0.5) * 18, z = tg.z + (random("rz" + k) - 0.5) * 14;
          const y = 10 - ((t * 0.35 + random("ry" + k) * 10) % 10);
          return (
            <mesh key={"r" + k} position={[x, y, z]} rotation={[0, 0, 0.12]}>
              <boxGeometry args={[0.012, 0.35, 0.012]} />
              <meshBasicMaterial color="#cfe8ff" transparent opacity={0.55 * rainK} />
            </mesh>
          );
        });
      })()}

      {/* ---------- MASCOTE ---------- */}
      {ml.at && (
        <group position={ml.at} rotation={[0, ml.ry ?? 0, 0]}>
          <Mascot position={[0, 0, 0]} scale={0.8} pose={mp} gf={gf} look={{...ml, backpack: worn || inS("s1", t) || inS("s8", t)}} />
        </group>
      )}

      <Clouds gf={gf} />
      <fog attach="fog" args={[storm ? "#2c3a55" : "#d6ecfb", camDist + 10, camDist + 55]} />
      <ambientLight intensity={storm ? 0.95 : 0.34} color={storm ? "#b8c8ea" : "#ffffff"} />
      <hemisphereLight args={[storm ? "#7f93c2" : "#d6ecff", "#4e5a4a", storm ? 1.0 : 0.9]} />
      <SunLight gf={gf} k={storm ? 0.35 : 1} />
      {lightning > 0 && <directionalLight position={[3, 10, 5]} intensity={3} color="#e3f2fd" />}
      <directionalLight position={[-6, 4, 9]} intensity={storm ? 0.25 : 0.35} color="#cfe3ff" />
    </group>
  );
};
