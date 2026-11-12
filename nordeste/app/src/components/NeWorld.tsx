// Vídeo 6 — sertão nordestino, globo, mapa do El Niño, cidade à noite e quarto com ventilador.
// Estilo liso do canal. Estados derivados do frame global.
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {clamp01, mixHex} from "../lib/anim";
import {poseAt} from "../lib/camera";

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





/* ================= NORDESTE ================= */
import {MascotRef} from "./MascotRef";
import {useThree} from "@react-three/fiber";
import {heat, skyDark} from "../lib/story";

/** O pós-processamento perde a transparência do canvas → o céu vira um degradê desenhado na própria cena */
const SkyBg: React.FC<{gf: number; set: string}> = ({gf, set}) => {
  const {scene} = useThree();
  const {canvas, tex} = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4; c.height = 256;
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return {canvas: c, tex: tx};
  }, []);
  const h = heat(gf), dark = skyDark(gf);
  let top = mixHex(mixHex("#86c4f0", "#ffb347", h * 0.7), "#14213f", dark);
  let bot = mixHex(mixHex("#dff0fb", "#ffe0a3", h * 0.8), "#2c3d66", dark);
  if (set === "globe") { top = "#05081a"; bot = "#121b3f"; }
  if (set === "map") { top = "#9fd3f5"; bot = "#e3f3fd"; }
  useLayoutEffect(() => {
    const g = canvas.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top); gr.addColorStop(0.7, bot); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    tex.needsUpdate = true;
    scene.background = tex;
  });
  return null;
};
import {L, easeInOut, easeOut} from "../lib/anim";
import {SET, W, airArc, airDown, airUp, cloudsGone, end, failing, inS, ninoK, setAt, start, te} from "../lib/story";
import {mascotLook, mascotPose, MASCOT_SCALE} from "../lib/mascotPose";

const N = {
  sand: "#e9c48a", sandD: "#d9a86a", crack: "#8a5a32", wet: "#8f6a45", dry: "#c98f55", hot: "#ff5a2a",
  cactus: "#4f8f4a", cactusD: "#3d7a3a", caat: "#8a6a4a", juaz: "#3f8f3a", taipa: "#c98c5a", roof: "#a0522d",
  sea: "#2e9fd6", seaD: "#1f7fb3", palm: "#4caf50", trunk: "#8a5a32", land: "#7cc36a", landD: "#5aa54c",
};

/** mandacaru (cacto com braços) */
const Cactus: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.8, 0]}>
      <capsuleGeometry args={[0.16, 1.3, 6, 14]} />
      <M c={N.cactus} />
    </mesh>
    {[-1, 1].map((k) => (
      <group key={k} position={[k * 0.28, 0.85 + (k > 0 ? 0.2 : 0), 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 0.2, 4, 10]} />
          <M c={N.cactusD} />
        </mesh>
        <mesh position={[k * 0.14, 0.3, 0]}>
          <capsuleGeometry args={[0.11, 0.45, 4, 10]} />
          <M c={N.cactus} />
        </mesh>
      </group>
    ))}
  </group>
);
/** árvore seca da caatinga (galhos sem folha) */
const DryTree: React.FC<{x: number; z: number; s?: number}> = ({x, z, s = 1}) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0.08]}>
      <cylinderGeometry args={[0.05, 0.09, 1.2, 8]} />
      <M c={N.caat} />
    </mesh>
    {[[-0.35, 1.2, 0.6], [0.3, 1.3, -0.7], [0.05, 1.45, 0.2], [-0.2, 1.0, -1.1]].map(([dx, y, r], k) => (
      <mesh key={k} position={[dx * 0.6, y, 0]} rotation={[0, k, r]}>
        <cylinderGeometry args={[0.02, 0.04, 0.7, 6]} />
        <M c={N.caat} />
      </mesh>
    ))}
  </group>
);
/** juazeiro: árvore verde da caatinga que dá sombra */
const Juazeiro: React.FC<{x: number; z: number}> = ({x, z}) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.12, 0.2, 1.6, 10]} />
      <M c={N.trunk} />
    </mesh>
    {[[0, 2.0, 0, 1.25], [0.8, 1.75, 0.3, 0.8], [-0.8, 1.8, -0.2, 0.85], [0.2, 2.4, -0.4, 0.8]].map(([dx, y, dz, r], k) => (
      <mesh key={k} position={[dx, y, dz]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[r, 24, 16]} />
        <M c={k % 2 ? "#4a9a3f" : N.juaz} />
      </mesh>
    ))}
  </group>
);
/** casinha de taipa */
const Taipa: React.FC<{x: number; z: number}> = ({x, z}) => (
  <group position={[x, 0, z]}>
    <B x={[-1.4, 1.4]} y={[0, 1.7]} z={[-1.1, 1.1]} c={N.taipa} />
    <mesh position={[0, 2.15, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.2, 1.0, 4]} />
      <M c={N.roof} />
    </mesh>
    <B x={[-0.3, 0.3]} y={[0, 1.15]} z={[1.1, 1.14]} c="#5d3a1e" />
    <B x={[0.65, 1.15]} y={[0.8, 1.25]} z={[1.1, 1.14]} c="#3e2a1a" />
  </group>
);
/** coqueiro */
const Palm: React.FC<{x: number; z: number; s?: number; gf: number}> = ({x, z, s = 1, gf}) => (
  <group position={[x, 0, z]} scale={s}>
    {Array.from({length: 6}).map((_, k) => (
      <mesh key={k} position={[Math.sin(k * 0.3) * 0.15 * k * 0.3, 0.3 + k * 0.5, 0]} rotation={[0, 0, -0.06 * k]}>
        <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
        <M c={N.trunk} />
      </mesh>
    ))}
    <group position={[0.35, 3.2, 0]}>
      {Array.from({length: 7}).map((_, k) => (
        <group key={k} rotation={[0, (k / 7) * Math.PI * 2, -0.7 + Math.sin(gf * 0.08 + k) * 0.08]}>
          <mesh position={[0.6, 0, 0]} scale={[1, 0.12, 0.35]}>
            <sphereGeometry args={[0.65, 12, 8]} />
            <M c={N.palm} />
          </mesh>
        </group>
      ))}
    </group>
  </group>
);

/** ondas de calor subindo do chão (miragem) */
const HeatHaze: React.FC<{gf: number; x: number; z: number; w: number; k: number}> = ({gf, x, z, w, k}) =>
  k <= 0.02 ? null : (
    <group>
      {Array.from({length: 7}).map((_, i) => {
        const ph = ((gf * 0.012 + i / 7) % 1);
        return (
          <mesh key={i} position={[x + (random("hx" + i) - 0.5) * w, 0.2 + ph * 3.2, z + (random("hz" + i) - 0.5) * 4]} rotation={[0, 0, Math.sin(gf * 0.1 + i) * 0.2]}>
            <planeGeometry args={[1.6, 0.12]} />
            <meshBasicMaterial color="#fff2c8" transparent opacity={0.22 * k * Math.sin(ph * Math.PI)} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );

/** chão rachado (linhas escuras em zigue-zague) */
const Cracks: React.FC<{x: number; z: number; r: number; c?: string; o?: number}> = ({x, z, r, c = N.crack, o = 1}) => (
  <group position={[x, 0.065, z]}>
    {Array.from({length: 9}).map((_, i) => {
      const a = random("ca" + x + i) * Math.PI * 2, len = 0.4 + random("cl" + x + i) * r;
      const cx = (random("cx" + x + i) - 0.5) * r * 1.6, cz = (random("cz" + x + i) - 0.5) * r * 1.2;
      return (
        <mesh key={i} position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, a]}>
          <planeGeometry args={[len, 0.035]} />
          <meshBasicMaterial color={c} transparent opacity={o} />
        </mesh>
      );
    })}
  </group>
);

/** América do Sul estilizada (lon/lat → mapa) */
const MAP_S = 0.32;
const ll = (lon: number, lat: number): [number, number] => [SET.map + (lon + 58) * MAP_S, -(lat + 18) * MAP_S];
const SA = [[-77, 8], [-72, 11.5], [-62, 10.5], [-55, 6], [-50, 1], [-44, -2.5], [-38, -4], [-35, -6], [-35, -9.5], [-39, -15], [-40.5, -21], [-44.5, -23.5], [-48.5, -26], [-53, -33.5], [-58, -38], [-62, -39], [-65, -42], [-68, -50], [-69, -55], [-74, -51], [-74, -42], [-71.5, -32], [-70.5, -18], [-76, -13], [-81, -5], [-80, -1], [-77.5, 3]];
const NE = [[-48, -1.5], [-44, -2.5], [-38, -4], [-35, -6], [-35, -9.5], [-39, -15], [-39.7, -18], [-44, -15.5], [-46.5, -13], [-46.5, -9], [-48.5, -5.5]];
const shapeOf = (pts: number[][]) => {
  const sh = new THREE.Shape();
  pts.forEach(([lo, la], i) => {
    const [x, z] = ll(lo, la);
    // ExtrudeGeometry trabalha no plano XY: usamos (x, -z) e depois giramos o mapa para deitar no chão
    if (i === 0) sh.moveTo(x - SET.map, -z);
    else sh.lineTo(x - SET.map, -z);
  });
  return sh;
};

/** seta grossa ao longo de uma curva (tubo + ponta) */
const CurveArrow: React.FC<{pts: THREE.Vector3[]; k: number; c: string; r?: number}> = ({pts, k, c, r = 0.16}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);
  if (k <= 0.01) return null;
  const tube = new THREE.TubeGeometry(curve, 48, r, 10, false);
  tube.setDrawRange(0, Math.floor(tube.index!.count * clamp01(k) / 6) * 6);
  const tip = curve.getPointAt(clamp01(k));
  const tan = curve.getTangentAt(clamp01(k));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={tip} quaternion={q}>
        <coneGeometry args={[r * 2.4, r * 4, 16]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
};

/** nuvem fofa (some quando o ar desce) */
const Puff: React.FC<{p: [number, number, number]; s: number; o: number}> = ({p, s, o}) =>
  o <= 0.01 ? null : (
    <group position={p} scale={s * (0.6 + 0.4 * o)}>
      {[[0, 0, 0, 0.7], [0.65, -0.1, 0, 0.5], [-0.6, -0.1, 0.1, 0.55], [0.2, 0.35, 0, 0.5]].map(([dx, dy, dz, r], k) => (
        <mesh key={k} position={[dx, dy, dz]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={o} depthWrite={o > 0.95} />
        </mesh>
      ))}
    </group>
  );

/* ================= MUNDO ================= */
export const NeWorld: React.FC<{gf: number}> = ({gf}) => {
  const rootRef = useRef<THREE.Group>(null);
  useShadows(rootRef);
  const t = te(gf);
  const set = setAt(t);
  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);
  const ml = mascotLook(t), mp = mascotPose(t);
  const night = set === "city";
  const seaSide = inS("s3", t);
  const soilK = inS("s4", t) ? L(t, start("s4") + 4, start("s4") + 20, 0, 1) : 0;
  const dryHeat = inS("s4", t) ? L(t, W("s4", "seca") - 6, W("s4", "ar") + 10, 0, 1) : 0;
  const shadeK = inS("s9", t) || inS("s10", t);
  const nk = ninoK(t);
  const cityHeat = inS("s5", t) ? L(t, W("s5", "soltam") - 10, W("s5", "noite") + 10, 0.2, 1) : 0;

  // América do Sul (geometria fixa)
  const saGeo = useMemo(() => new THREE.ExtrudeGeometry(shapeOf(SA), {depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.05, bevelSegments: 2}), []);
  const neGeo = useMemo(() => new THREE.ShapeGeometry(shapeOf(NE)), []);

  // pontos das setas do El Niño
  const pac = ll(-86, -6), neC = ll(-41, -8);
  const upPts = useMemo(() => [new THREE.Vector3(pac[0], 0.3, pac[1]), new THREE.Vector3(pac[0], 2.5, pac[1]), new THREE.Vector3(pac[0], 5.0, pac[1])], [pac[0], pac[1]]);
  const arcPts = useMemo(() => [new THREE.Vector3(pac[0], 5.2, pac[1]), new THREE.Vector3((pac[0] + neC[0]) / 2, 7.2, (pac[1] + neC[1]) / 2), new THREE.Vector3(neC[0], 5.2, neC[1])], [pac[0], pac[1], neC[0], neC[1]]);
  const downPts = useMemo(() => [new THREE.Vector3(neC[0], 5.0, neC[1]), new THREE.Vector3(neC[0], 2.6, neC[1]), new THREE.Vector3(neC[0], 0.7, neC[1])], [neC[0], neC[1]]);

  return (
    <group ref={rootRef}>
      {/* ================= SERTÃO (x = 0) ================= */}
      {set === "sertao" && (
        <group>
          {/* chão de terra seca, com o mar à direita (litoral) */}
          <B x={[-60, 9]} y={[-0.4, 0.06]} z={[-60, 30]} c={N.sand} />
          <B x={[9, 14]} y={[-0.4, 0.04]} z={[-60, 30]} c="#f3dfae" />
          <mesh position={[40, 0.0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[52, 90]} />
            <meshStandardMaterial color={N.sea} roughness={0.15} metalness={0.2} />
          </mesh>
          {Array.from({length: 10}).map((_, i) => {
            const ph = ((gf * 0.01 + i / 10) % 1);
            return (
              <mesh key={"wv" + i} position={[14.3 + ph * 2, 0.02, -8 + i * 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 1.5]} />
                <meshBasicMaterial color="#e3f6ff" transparent opacity={0.7 * (1 - ph)} />
              </mesh>
            );
          })}
          <Palm x={11} z={-2} s={1.0} gf={gf} />
          <Palm x={12.5} z={-6} s={1.15} gf={gf} />
          <Palm x={10.5} z={-9} s={0.9} gf={gf} />
          {/* brisa do mar (s3) */}
          {seaSide && t < W("s3", "Então") &&
            Array.from({length: 8}).map((_, i) => {
              const ph = ((gf * 0.02 + i / 8) % 1);
              return (
                <mesh key={"bz" + i} position={[16 - ph * 9, 0.9 + (i % 4) * 0.45, -1 + (i % 3) * 0.8]}>
                  <boxGeometry args={[1.0, 0.035, 0.035]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.85 * Math.sin(ph * Math.PI)} />
                </mesh>
              );
            })}
          {/* rachaduras espalhadas e pedrinhas */}
          {[[-3, 2], [2.5, 3], [-6, -1], [4, -2], [-1, 5], [6, 1.5], [-8, 3]].map(([x, z], i) => <Cracks key={"cr" + i} x={x} z={z} r={1.1} />)}
          <Rocks spots={[[-2.6, 0.06, 1.2], [3.2, 0.06, 2.1], [-5, 0.06, 2.6], [1.4, 0.06, -2.2]]} />
          {/* vegetação da caatinga */}
          <Cactus x={-2.4} z={-1.8} s={1.1} />
          <Cactus x={3.4} z={-4.5} s={1.4} />
          <Cactus x={-7} z={-6} s={1.6} />
          <Cactus x={6.5} z={-2} s={0.9} />
          <DryTree x={1.8} z={-2.6} s={1.3} />
          <DryTree x={-5.5} z={-3} s={1.5} />
          <DryTree x={5.5} z={-7} s={1.6} />
          <Juazeiro x={-4.6} z={-0.4} />
          <Taipa x={-9} z={-5} />
          {/* morros ao fundo */}
          {[[-20, -40, 9], [5, -45, 12], [25, -42, 8]].map(([x, z, r], i) => (
            <mesh key={"mr" + i} position={[x, -r * 0.55, z]} scale={[1.7, 1, 1]}>
              <sphereGeometry args={[r, 32, 16]} />
              <M c={i % 2 ? "#d8a56a" : "#c99659"} />
            </mesh>
          ))}
          {/* chão úmido x chão seco (s4) */}
          {soilK > 0.01 && (
            <group>
              <mesh position={[-1.6, 0.07, 1.6]} rotation={[-Math.PI / 2, 0, 0]} scale={soilK}>
                <circleGeometry args={[0.9, 32]} />
                <meshStandardMaterial color={N.wet} roughness={0.3} />
              </mesh>
              <mesh position={[1.6, 0.07, 1.6]} rotation={[-Math.PI / 2, 0, 0]} scale={soilK}>
                <circleGeometry args={[0.9, 32]} />
                <meshStandardMaterial color={mixHex(N.dry, N.hot, dryHeat)} emissive={N.hot} emissiveIntensity={dryHeat * 0.6} roughness={0.8} />
              </mesh>
              <Cracks x={1.6} z={1.6} r={0.6} c="#5a3418" />
              {/* vapor saindo do chão úmido (o calor vira evaporação) */}
              {Array.from({length: 8}).map((_, i) => {
                const ph = ((gf * 0.02 + i / 8) % 1);
                return (
                  <mesh key={"vp" + i} position={[-1.6 + (random("vx" + i) - 0.5) * 1.2, 0.2 + ph * 1.6, 1.6 + (random("vz" + i) - 0.5) * 0.8]} scale={0.1 + ph * 0.18}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.55 * (1 - ph) * soilK} depthWrite={false} />
                  </mesh>
                );
              })}
              {/* setas de calor entrando no chão seco */}
              {Array.from({length: 3}).map((_, i) => {
                const ph = ((gf * 0.03 + i / 3) % 1);
                return (
                  <group key={"ha" + i} position={[1.3 + i * 0.3, 1.6 - ph * 1.4, 1.6]} rotation={[0, 0, -Math.PI / 2]}>
                    <mesh position={[0.15, 0, 0]}>
                      <boxGeometry args={[0.3, 0.06, 0.06]} />
                      <meshBasicMaterial color="#ff7043" transparent opacity={soilK * Math.sin(ph * Math.PI)} />
                    </mesh>
                    <mesh position={[0.36, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                      <coneGeometry args={[0.09, 0.16, 10]} />
                      <meshBasicMaterial color="#ff7043" transparent opacity={soilK * Math.sin(ph * Math.PI)} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          )}
          <HeatHaze gf={gf} x={0} z={-1} w={14} k={inS("s3", t) ? L(t, W("s3", "interior") - 10, W("s3", "sertão"), 0, 1) : 1} />
          {/* sol enorme */}
          <mesh position={[-6, 15, -30]}>
            <sphereGeometry args={[3.2, 32, 24]} />
            <meshBasicMaterial color="#fff2a8" fog={false} />
          </mesh>
          <mesh position={[-6, 15, -30.5]}>
            <circleGeometry args={[5.2, 40]} />
            <meshBasicMaterial color="#ffd54f" transparent opacity={0.35 + 0.08 * Math.sin(gf * 0.15)} fog={false} />
          </mesh>
          {/* sombra da copa do juazeiro (onde ele se esconde do sol) */}
          {shadeK && (
            <mesh position={[-4.4, 0.075, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.5, 32]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
            </mesh>
          )}
        </group>
      )}

      {/* ================= GLOBO (sol a pino) ================= */}
      {set === "globe" && (() => {
        const G = new THREE.Vector3(SET.globe, 4, -2);
        const sun = new THREE.Vector3(SET.globe - 6.6, 4, -2);
        const pt = (latDeg: number) => {
          const la = (latDeg * Math.PI) / 180;
          return new THREE.Vector3(G.x - Math.cos(la) * 3.02, G.y + Math.sin(la) * 3.02, G.z);
        };
        const ne = pt(-7), sul = pt(-30);
        const k = L(t, W("s2", "raios") - 6, W("s2", "chão") + 10, 0, 1);
        const beam = (to: THREE.Vector3, w: number, c: string) => {
          const from = new THREE.Vector3(sun.x + 1.0, to.y, to.z);
          const d = to.clone().sub(from);
          const len = d.length() * k;
          const mid = from.clone().add(d.clone().normalize().multiplyScalar(len / 2));
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
          return (
            <mesh position={mid} quaternion={q}>
              <cylinderGeometry args={[w, w, len, 16, 1, true]} />
              <meshBasicMaterial color={c} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          );
        };
        const spot = (p: THREE.Vector3, latDeg: number, sx: number, c: string, o: number) => {
          const la = (latDeg * Math.PI) / 180;
          const n = new THREE.Vector3(-Math.cos(la), Math.sin(la), 0);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
          return (
            <group position={p.clone().addScaledVector(n, 0.02)} quaternion={q}>
              <mesh scale={[1, sx, 1]}>
                <circleGeometry args={[0.32, 24]} />
                <meshBasicMaterial color={c} transparent opacity={o * k} />
              </mesh>
            </group>
          );
        };
        return (
          <group>
            <mesh position={[SET.globe, -0.5, -2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[80, 60]} />
              <meshStandardMaterial color="#13284a" />
            </mesh>
            <mesh position={G} rotation={[0, 0.9, 0]}>
              <sphereGeometry args={[3, 48, 32]} />
              <meshStandardMaterial color="#2e86c1" roughness={0.5} />
            </mesh>
            {/* continentes simplificados */}
            {[[-15, 0.9, 0.9], [10, 0.75, 0.7], [-35, 0.6, 0.5], [35, 0.7, 0.8]].map(([lat, w, h], i) => {
              const p = pt(lat);
              return (
                <mesh key={"ct" + i} position={p.clone().add(new THREE.Vector3(0.05, 0, 0))} scale={[0.3, h, w]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color={N.land} roughness={0.7} />
                </mesh>
              );
            })}
            {/* linha do Equador */}
            <mesh position={G} rotation={[0, 0, 0]}>
              <torusGeometry args={[3.04, 0.035, 8, 80]} />
              <meshBasicMaterial color="#ff5252" />
            </mesh>
            <mesh position={new THREE.Vector3(G.x, G.y, G.z)} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[3.04, 0.035, 8, 80]} />
              <meshBasicMaterial color="#ff5252" />
            </mesh>
            {/* sol e raios: no Nordeste chegam retos (mancha pequena e forte), no Sul inclinados (mancha grande e fraca) */}
            <mesh position={sun}>
              <sphereGeometry args={[1.1, 28, 20]} />
              <meshBasicMaterial color="#ffd54f" />
            </mesh>
            {beam(ne, 0.3, "#fff176")}
            {beam(sul, 0.3, "#fff9c4")}
            {spot(ne, -7, 1.0, "#ffeb3b", 0.95)}
            {spot(sul, -30, 1.9, "#fff59d", 0.5)}
            <pointLight position={[SET.globe - 6, 6, 6]} intensity={2} distance={30} />
          </group>
        );
      })()}

      {/* ================= MAPA DA AMÉRICA DO SUL (El Niño) ================= */}
      {set === "map" && (
        <group>
          <mesh position={[SET.map, -0.05, -2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[80, 70]} />
            <meshStandardMaterial color={N.sea} roughness={0.25} metalness={0.1} />
          </mesh>
          {/* água quente do El Niño perto do Peru */}
          {nk > 0.01 && (
            <mesh position={[ll(-88, -4)[0], 0.0, ll(-88, -4)[1]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6 * nk, 1.1 * nk, 1]}>
              <circleGeometry args={[3.2, 40]} />
              <meshStandardMaterial color={mixHex("#ff9e57", "#e53935", nk)} emissive="#ff5722" emissiveIntensity={0.25 + 0.15 * Math.sin(gf * 0.15)} transparent opacity={0.85} />
            </mesh>
          )}
          <group position={[SET.map, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={saGeo}>
              <meshStandardMaterial color={N.land} roughness={0.7} />
            </mesh>
            {/* Nordeste destacado */}
            <mesh geometry={neGeo} position={[0, 0, 0.32]}>
              <meshStandardMaterial color={mixHex("#ffb74d", "#e53935", cloudsGone(t))} roughness={0.6} />
            </mesh>
          </group>
          {/* setas do ar: sobe no Pacífico, arco, desce no Nordeste */}
          <CurveArrow pts={upPts} k={airUp(t)} c="#ff7043" />
          <CurveArrow pts={arcPts} k={airArc(t)} c="#ffffff" r={0.13} />
          <CurveArrow pts={downPts} k={airDown(t)} c="#4fc3f7" />
          {/* nuvens sobre o Nordeste que somem quando o ar desce */}
          {[[-42, -4, 1.1], [-38, -9, 0.9], [-44, -12, 1.0]].map(([lo, la, s], i) => {
            const [x, z] = ll(lo, la);
            return <Puff key={"pf" + i} p={[x, 2.2 + i * 0.2, z]} s={s} o={inS("s7", t) ? 1 - cloudsGone(t) : 0} />;
          })}
          {/* sol forte em cima do Nordeste depois que as nuvens somem */}
          {cloudsGone(t) > 0.5 && (
            <mesh position={[neC[0], 6.5, neC[1]]}>
              <sphereGeometry args={[0.6 * cloudsGone(t), 20, 16]} />
              <meshBasicMaterial color="#ffd54f" />
            </mesh>
          )}
        </group>
      )}

      {/* ================= CIDADE À NOITE (ilha de calor) ================= */}
      {set === "city" && (
        <group>
          <B x={[SET.city - 30, SET.city + 30]} y={[-0.4, 0.02]} z={[-30, 30]} c="#3b414d" />
          {Array.from({length: 12}).map((_, i) => {
            const h = 2.5 + random("ch" + i) * 5;
            const x = SET.city - 14 + i * 2.6;
            const cols = ["#f4a261", "#e9c46a", "#f1faee", "#a8dadc", "#e76f51", "#ffcdb2"];
            return (
              <group key={"bd" + i} position={[x, 0, -6 - (i % 2) * 2]}>
                <B x={[-1.1, 1.1]} y={[0, h]} z={[-1, 1]} c={cols[i % cols.length]} />
                {Array.from({length: Math.floor(h / 0.9)}).map((__, r) => (
                  <B key={r} x={[-0.6, 0.6]} y={[0.5 + r * 0.9, 0.85 + r * 0.9]} z={[1, 1.02]} c={random("lw" + i + r) > 0.5 ? "#ffe082" : "#37474f"} e="#ffd54f" ei={random("lw" + i + r) > 0.5 ? 0.7 : 0} />
                ))}
              </group>
            );
          })}
          {/* calor saindo do asfalto */}
          {Array.from({length: 14}).map((_, i) => {
            const ph = ((gf * 0.014 + i / 14) % 1);
            return (
              <mesh key={"cw" + i} position={[SET.city - 8 + (random("cwx" + i)) * 16, 0.1 + ph * 3, -2 + random("cwz" + i) * 4]} rotation={[0, 0, Math.sin(gf * 0.1 + i) * 0.3]}>
                <planeGeometry args={[1.3, 0.1]} />
                <meshBasicMaterial color="#ff8a50" transparent opacity={0.4 * cityHeat * Math.sin(ph * Math.PI)} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
          {/* cama do boneco na calçada da casa (corte) */}
          <group position={[SET.city, 0, 2]}>
            <B x={[-1.4, 1.4]} y={[0, 0.02]} z={[-1.6, 1.4]} c="#d7ccc8" />
            <B x={[-1.1, 1.1]} y={[0.02, 0.45]} z={[-0.55, 0.55]} c="#8d6e63" />
            <B x={[-1.05, 1.05]} y={[0.45, 0.62]} z={[-0.5, 0.5]} c="#eceff1" />
            <B x={[-1.05, -0.65]} y={[0.62, 0.74]} z={[-0.4, 0.4]} c="#ffffff" />
            <B x={[-1.1, -1.0]} y={[0.02, 1.1]} z={[-0.55, 0.55]} c="#6d4c41" />
          </group>
          <mesh position={[SET.city + 9, 13, -30]}>
            <sphereGeometry args={[1.8, 28, 20]} />
            <meshBasicMaterial color="#fff8e1" fog={false} />
          </mesh>
        </group>
      )}

      {/* ================= QUARTO COM VENTILADOR ================= */}
      {set === "room" && (
        <group>
          <B x={[SET.room - 4, SET.room + 4]} y={[-0.2, 0.05]} z={[-3, 3]} c="#d7b98f" />
          <B x={[SET.room - 4, SET.room + 4]} y={[0.05, 3.2]} z={[-3, -2.85]} c="#fde7c8" />
          <B x={[SET.room - 4, SET.room - 3.85]} y={[0.05, 3.2]} z={[-3, 3]} c="#f8d9b0" />
          <B x={[SET.room + 0.6, SET.room + 2.2]} y={[1.3, 2.4]} z={[-2.86, -2.83]} c="#ffe9a8" e="#ffe082" ei={0.4} />
          {/* termômetro na parede: 36 °C o tempo todo (o ventilador não muda a temperatura do ar) */}
          <group position={[SET.room - 2.2, 1.8, -2.83]}>
            <B x={[-0.18, 0.18]} y={[-0.6, 0.6]} z={[0, 0.03]} c="#ffffff" />
            <B x={[-0.035, 0.035]} y={[-0.45, 0.35]} z={[0.03, 0.05]} c="#e53935" />
            <mesh position={[0, -0.5, 0.05]}>
              <sphereGeometry args={[0.08, 14, 10]} />
              <M c="#e53935" />
            </mesh>
          </group>
          {/* ventilador de pé, girando, com linhas de vento */}
          <group position={[SET.room - 1.2, 0.05, 0.2]} rotation={[0, 0.6, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.35, 0.4, 0.06, 24]} />
              <M c="#eceff1" />
            </mesh>
            <B x={[-0.04, 0.04]} y={[0.05, 1.25]} z={[-0.04, 0.04]} c="#cfd8dc" />
            <group position={[0, 1.35, 0.1]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
                <M c="#eceff1" />
              </mesh>
              <mesh position={[0, 0, 0.12]}>
                <torusGeometry args={[0.45, 0.02, 8, 40]} />
                <M c="#b0bec5" />
              </mesh>
              <group position={[0, 0, 0.12]} rotation={[0, 0, failing("s8", t) ? 0 : gf * 0.9]}>
                {[0, 1, 2].map((k) => (
                  <mesh key={k} rotation={[0, 0, (k * Math.PI * 2) / 3]} position={[0, 0, 0]}>
                    <boxGeometry args={[0.12, 0.8, 0.02]} />
                    <meshStandardMaterial color="#4fc3f7" transparent opacity={0.85} />
                  </mesh>
                ))}
              </group>
              {Array.from({length: 7}).map((_, i) => {
                const ph = ((gf * 0.035 + i / 7) % 1);
                return (
                  <mesh key={"wl" + i} position={[(random("wlx" + i) - 0.5) * 0.6, (random("wly" + i) - 0.5) * 0.6, 0.3 + ph * 2.2]}>
                    <boxGeometry args={[0.03, 0.03, 0.5]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.8 * Math.sin(ph * Math.PI)} />
                  </mesh>
                );
              })}
            </group>
          </group>
          <pointLight position={[SET.room, 2.6, 0.5]} intensity={1.6} distance={10} color="#fff3e0" />
        </group>
      )}

      {/* ---------- MASCOTE ---------- */}
      {ml.at && (
        <group position={ml.at} rotation={[0, ml.ry ?? 0, 0]}>
          <group rotation={[ml.rx ?? 0, 0, ml.rz ?? 0]}>
            <MascotRef pose={mp} gf={gf} look={ml} scale={MASCOT_SCALE} />
          </group>
        </group>
      )}
      {/* gotas de suor caindo do rosto com gravidade e espirrando no chão (só no sertão) */}
      {ml.at && set === "sertao" && (ml.sweat ?? ml.hot ?? 0) > 0.3 && !ml.rx &&
        Array.from({length: 3}).map((_, i) => {
          const per = 34, ph = (gf + i * 11) % per;
          const fall = ph / per; // 0 → 1
          const y0 = ml.at![1] + 1.55 * MASCOT_SCALE;
          const y = y0 - 9.8 * (fall * 0.55) ** 2 * 0.9;
          const side = i % 2 ? 1 : -1;
          const gx = ml.at![0] + side * 0.36 * MASCOT_SCALE, gz = ml.at![2] + 0.1;
          if (y <= 0.08) {
            const sp = clamp01((y0 - 0.08 - y) / 0.6);
            return (
              <mesh key={"sd" + i} position={[gx, 0.075, gz]} rotation={[-Math.PI / 2, 0, 0]} scale={0.04 + sp * 0.12}>
                <ringGeometry args={[0.7, 1, 16]} />
                <meshBasicMaterial color="#9fdcff" transparent opacity={0.7 * (1 - sp)} depthWrite={false} />
              </mesh>
            );
          }
          return (
            <mesh key={"sd" + i} position={[gx, y, gz]} scale={[0.7, 1, 0.7]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshStandardMaterial color="#7fd0ff" emissive="#7fd0ff" emissiveIntensity={0.3} />
            </mesh>
          );
        })}
      {/* poeira quando o pé bate no chão quente (pulinhos e aterrissagens) */}
      {ml.at && set === "sertao" && (ml.dust ?? 0) > 0.01 &&
        Array.from({length: 10}).map((_, i) => {
          const d = ml.dust!;
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={"du" + i} position={[ml.at![0] + Math.cos(a) * 0.5 * d, 0.1 + 0.25 * Math.sin(d * Math.PI), ml.at![2] + Math.sin(a) * 0.35 * d]} scale={0.07 + 0.1 * d}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#e6c08a" transparent opacity={0.7 * (1 - d)} depthWrite={false} />
            </mesh>
          );
        })}

      <SkyBg gf={gf} set={set} />
      <Clouds gf={gf} />
      <fog attach="fog" args={[night ? "#1b2440" : set === "sertao" ? "#ffe2b0" : "#cfe8ff", camDist + 14, camDist + 70]} />
      <ambientLight intensity={night ? 0.35 : 0.42} color={night ? "#8fa3d6" : "#ffffff"} />
      <hemisphereLight args={[night ? "#3d4f80" : set === "sertao" ? "#fff3d6" : "#d6ecff", night ? "#1a1a2e" : "#c99659", night ? 0.6 : 0.9]} />
      <SunLight gf={gf} k={night ? 0.15 : set === "sertao" ? 1.25 : 0.9} />
      <directionalLight position={[-6, 4, 9]} intensity={0.35} color="#cfe3ff" />
      {easeOut(0) + easeInOut(0) + 0 * end("s1") + 0 * W("s1", "sol") && null}
    </group>
  );
};
