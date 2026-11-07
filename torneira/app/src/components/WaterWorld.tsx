// Vídeo 2 — diorama em corte do caminho da água: represa → ETA → reservatório → rede → casa → torneira.
// Estilo liso e colorido do canal. Cada peça lê seu estado de track(alvo, frameGlobal).
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {S, sceneAt} from "../data/scenes";
import {track} from "../lib/track";
import {clamp01, mixHex} from "../lib/anim";
import {poseAt} from "../lib/camera";
import {Mascot} from "./Mascot";
import {mascotLook, mascotPose} from "../lib/mascotPose";

export const FACE = 1;
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

/** micróbio: bolinha com espinhos */
const Microbe: React.FC<{p: [number, number, number]; s?: number; c?: string}> = ({p, s = 1, c = "#7ed957"}) =>
  s < 0.02 ? null : (
    <group position={p} scale={s}>
      <mesh>
        <sphereGeometry args={[0.07, 14, 10]} />
        <M c={c} e={c} ei={0.25} />
      </mesh>
      {Array.from({length: 6}).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0]} rotation={[0, 0, a - Math.PI / 2]}>
            <coneGeometry args={[0.018, 0.05, 6]} />
            <M c={c} />
          </mesh>
        );
      })}
      <mesh position={[0.025, 0.02, 0.06]}>
        <sphereGeometry args={[0.014, 8, 6]} />
        <M c="#1b1b1b" />
      </mesh>
      <mesh position={[-0.025, 0.02, 0.06]}>
        <sphereGeometry args={[0.014, 8, 6]} />
        <M c="#1b1b1b" />
      </mesh>
    </group>
  );

/** tanque aberto da ETA, em corte (frente de vidro) */
const Tank: React.FC<{x: [number, number]; h?: number; children?: React.ReactNode}> = ({x, h = 1.5, children}) => (
  <group>
    <B x={[x[0], x[1]]} y={[GROUND, GROUND + 0.1]} z={[-1.6, FACE]} c={C.concreteD} />
    <B x={[x[0], x[0] + 0.08]} y={[GROUND, GROUND + h]} z={[-1.6, FACE]} c={C.concrete} />
    <B x={[x[1] - 0.08, x[1]]} y={[GROUND, GROUND + h]} z={[-1.6, FACE]} c={C.concrete} />
    <B x={[x[0], x[1]]} y={[GROUND, GROUND + h]} z={[-1.6, -1.5]} c={C.concreteD} />
    {/* frente de vidro (corte) */}
    <B x={[x[0], x[1]]} y={[GROUND + 0.1, GROUND + h]} z={[FACE - 0.02, FACE]} c="#dff4ff" o={0.12} />
    {children}
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

/** ondinhas na superfície da água */
const Ripples: React.FC<{gf: number; x: [number, number]; y: number}> = ({gf, x, y}) => (
  <group>
    {Array.from({length: 7}).map((_, i) => {
      const t = ((gf * 0.012 + random("rp" + i)) % 1);
      return (
        <mesh key={i} position={[x[0] + 0.4 + random("rx" + i) * (x[1] - x[0] - 0.8), y + 0.012, FACE - 0.4 - random("rz" + i) * 3]} rotation={[-Math.PI / 2, 0, 0]} scale={0.15 + t * 0.6}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.45 * (1 - t)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/* ================= MUNDO ================= */
export const WaterWorld: React.FC<{gf: number}> = ({gf}) => {
  const rootRef = useRef<THREE.Group>(null);
  useShadows(rootRef);
  const s2 = S("s2"), s3 = S("s3"), s4 = S("s4"), s5 = S("s5"), s7 = S("s7"), s8 = S("s8"), s11 = S("s11");
  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);

  // estados
  const faucetHandle = track("faucet.handle", gf, 0);
  const tapStream = track("tapStream.opacity", gf, 0);
  const glassFill = track("glass.fill", gf, 0);
  const wallGlow = gf < s2.startFrame ? Math.max(0, Math.sin(gf * 0.25)) * track("wallPipe.glow", gf, 0) : 0;
  const pumpSpeed = track("pump.rotor", gf, 0);
  const adutora = track("adutora.fill", gf, 0);
  const cluster = track("particles.cluster", gf, 0);
  const flocScale = track("flocs.scale", gf, 0);
  const flocY = track("flocs.y", gf, 0);
  const sludge = track("sludge.height", gf, 0);
  const clarity = track("water.clarity", gf, 0);
  const trapped = track("trappedDirt.opacity", gf, 0);
  const microbesY = track("microbes.y", gf, 0);
  const microbesPop = track("microbes.pop", gf, 1);
  const chlorineDrip = track("chlorine.drip", gf, 0);
  const residual = track("residualGlow.opacity", gf, 0);
  const rise = track("rise.fill", gf, 0);
  const towerFill = track("tower.fill", gf, 0.2);
  const downArrows = track("downArrows.opacity", gf, 0);
  const meterDial = track("meter.dial", gf, 0);
  const riser = track("riser.fill", gf, 0);
  const roofTank = track("roofTank.fill", gf, 0.3);
  const stage = gf >= s11.startFrame ? track("flowHighlight.stage", gf, 0) : -1;
  const lit = (i: number) => (stage < 0 ? 0 : clamp01(stage - i + 1));
  // depois que cada etapa acontece, ela continua funcionando
  const after = (s: typeof s3) => gf >= s.startFrame;
  const etaRunning = after(s3);
  const flowT = gf * 0.02;

  // partículas e flocos (coagulação/floculação)
  const nP = 70;
  const particles = useMemo(
    () =>
      Array.from({length: nP}).map((_, i) => ({
        x: -5.9 + random("px" + i) * 2.8,
        y: 0.2 + random("py" + i) * 1.0,
        z: FACE - 0.15 - random("pz" + i) * 0.5,
        c: Math.floor(random("pc" + i) * 6),
      })),
    [],
  );
  const flocCenters = useMemo(() => Array.from({length: 6}).map((_, i) => ({x: -4.25 + (i % 3) * 0.42, y: 0.45 + Math.floor(i / 3) * 0.45, z: FACE - 0.3})), []);

  const houseX = 10.5;

  return (
    <group ref={rootRef}>
      {/* ---------- SOLO EM CORTE E CHÃO ---------- */}
      {/* solo, com a bacia da represa recortada */}
      <B x={[-40, -14]} y={[-12, -0.5]} c={C.soil2} />
      <B x={[-40, -14]} y={[-0.5, 0]} c={C.soil1} />
      <B x={[-14, -9]} y={[-12, -2.2]} c={C.soil3} />
      <B x={[-9, 40]} y={[-12, -0.5]} c={C.soil2} />
      <B x={[-9, 40]} y={[-0.5, 0]} c={C.soil1} />
      <B x={[-40, 40]} y={[-12, -4]} z={[FACE - 0.5, FACE + 0.002]} c={C.soil3} />
      {/* gramado */}
      <B x={[-40, -14]} y={[0, 0.06]} c={C.grass} />
      <B x={[-9, 5]} y={[0, 0.06]} c={C.grass} />
      <B x={[9, 40]} y={[0, 0.06]} c={C.grass} />

      {/* ---------- REPRESA ---------- */}
      <B x={[-14, -9]} y={[-2.2, -0.35]} c={mixHex(C.water, C.turbid, 0.35)} o={0.85} />
      <mesh position={[-11.5, -0.349, (FACE + FAR) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, FACE - FAR]} />
        <meshStandardMaterial color="#5a9fc4" roughness={0.12} metalness={0.25} transparent opacity={0.55} />
      </mesh>
      <Ripples gf={gf} x={[-14, -9]} y={-0.35} />
      <Rocks spots={[[-14.3, 0.6, 1.1], [-14.6, -0.4, 0.8], [-8.7, -1.5, 0.9], [-14.2, -2.2, 1.2], [-8.75, 0.9, 0.6], [-6.6, 0.5, 0.7], [2.0, 0.7, 0.8], [4.6, 0.6, 0.9], [12.9, 0.4, 1.0], [5.3, -2.2, 0.8]]} />
      {/* folhas boiando e terra na água */}
      {Array.from({length: 10}).map((_, i) => (
        <mesh key={"lf" + i} position={[-13.6 + random("lx" + i) * 4.2 + Math.sin(gf / 90 + i) * 0.15, -0.33, FACE - 0.2 - random("lz" + i) * 3]} rotation={[-Math.PI / 2, 0, random("lr" + i) * 6]} scale={[1, 0.6, 1]}>
          <circleGeometry args={[0.12, 10]} />
          <M c={i % 2 ? "#d18b2c" : "#7cb342"} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({length: 40}).map((_, i) => (
        <mesh key={"dt" + i} position={[-13.8 + random("dx" + i) * 4.6, -2.0 + ((random("dy" + i) * 1.6 + Math.sin(gf / 50 + i) * 0.05 + 3.2) % 1.6), FACE + 0.01]}>
          <sphereGeometry args={[0.025 + random("ds" + i) * 0.03, 8, 6]} />
          <M c="#6b4a2b" />
        </mesh>
      ))}
      {Array.from({length: 8}).map((_, i) => (
        <Microbe key={"mb" + i} p={[-13.4 + random("mx" + i) * 4, -1.9 + random("my" + i) * 1.4 + Math.sin(gf / 30 + i) * 0.05, FACE + 0.03]} s={0.8} c={i % 2 ? "#7ed957" : "#b388ff"} />
      ))}
      <Tree x={-15.5} z={-1.5} s={1.3} />
      <Tree x={-16.8} z={-4.5} s={1.1} y={0} />
      <Tree x={-8.2} z={-2.6} s={1.0} />

      {/* ---------- CAPTAÇÃO E ADUTORA ---------- */}
      {/* grade da tomada d'água */}
      {[0, 1, 2, 3].map((i) => <B key={"gr" + i} x={[-9.15, -9.1]} y={[-1.6 + i * 0.25, -1.5 + i * 0.25]} z={[FACE - 0.6, FACE]} c="#5b636e" />)}
      {/* casa de bombas */}
      <B x={[-8.9, -7.9]} y={[0, 0.9]} z={[-0.6, 0.6]} c="#e6dccb" />
      <B x={[-9.0, -7.8]} y={[0.9, 1.0]} z={[-0.7, 0.7]} c={C.roof} />
      <B x={[-8.1, -7.9]} y={[0.42, 0.62]} z={[0.6, 0.66]} c="#3b4250" />
      <mesh position={[-8.0, 0.52, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.04 - (pumpSpeed > 0.5 ? 0.02 : 0), 16]} />
        <M c="#E53935" e="#E53935" ei={pumpSpeed > 0.5 ? 0.6 : 0.1} />
      </mesh>
      <group position={[-8.4, -1.25, FACE + 0.05]} rotation={[0, 0, gf * pumpSpeed * 0.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.2, 20]} />
          <M c="#4a7fb8" metal={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0.11]}>
            <boxGeometry args={[0.04, 0.5, 0.02]} />
            <M c="#e6edf3" />
          </mesh>
        ))}
      </group>
      <Pipe a={[-9.1, -1.25, FACE]} b={[-8.7, -1.25, FACE]} r={0.16} fill={adutora > 0 ? 1 : 0} glow={lit(0)} />
      <Pipe a={[-8.1, -1.25, FACE]} b={[-6.4, -1.25, FACE]} r={0.2} fill={clamp01(adutora * 2)} glow={lit(0)} />
      <Pipe a={[-6.4, -1.25, FACE]} b={[-6.4, -1.25, -0.4]} r={0.2} fill={clamp01(adutora * 2 - 1)} glow={lit(0)} />
      <Pipe a={[-6.4, -1.25, -0.4]} b={[-6.4, 1.7, -0.4]} r={0.2} fill={clamp01(adutora * 3 - 1.5)} glow={lit(0)} />
      <Pipe a={[-6.4, 1.7, -0.4]} b={[-5.7, 1.7, -0.4]} r={0.2} fill={clamp01(adutora * 3 - 2)} glow={lit(0)} />
      {etaRunning &&
        [0, 1, 2].map((i) => {
          const t = (((flowT + i / 3) % 1) + 1) % 1;
          return <Arrow key={"aa" + i} p={[-8.0 + t * 1.5, -1.25, FACE + 0.25]} dir={0} s={0.7} o={adutora > 0.3 && gf < s4.startFrame ? 1 : 0} />;
        })}

      {/* ---------- ETA: MISTURA/COAGULAÇÃO + FLOCULAÇÃO ---------- */}
      <Tank x={[-6, -3]}>
        <B x={[-5.92, -3.08]} y={[0.1, 1.3]} z={[-1.5, FACE - 0.03]} c={mixHex(C.turbid, "#6fae9a", cluster * 0.3)} o={0.55} />
        {/* pás do floculador */}
        {[-4.0, -3.5].map((x, i) => (
          <group key={x} position={[x, 0.75, FACE - 0.4]} rotation={[0, 0, gf * 0.06 * (etaRunning ? 1 : 0) + i]}>
            <B x={[-0.02, 0.02]} y={[-0.4, 0.4]} z={[-0.02, 0.02]} c="#5b636e" />
            <B x={[-0.4, 0.4]} y={[-0.02, 0.02]} z={[-0.02, 0.02]} c="#5b636e" />
          </group>
        ))}
        {/* parede divisória mistura | floculação */}
        <B x={[-4.55, -4.48]} y={[0.1, 1.15]} z={[-1.5, FACE - 0.03]} c={C.concrete} />
      </Tank>
      {/* dosador do produto (coagulante) */}
      <B x={[-5.6, -5.2]} y={[1.7, 2.1]} z={[FACE - 0.6, FACE - 0.2]} c="#f5f6f8" />
      <B x={[-5.62, -5.56]} y={[1.5, 1.7]} z={[FACE - 0.6, FACE - 0.2]} c="#9aa3ad" />
      <B x={[-6.05, -5.55]} y={[1.44, 1.52]} z={[FACE - 0.45, FACE - 0.35]} c="#9aa3ad" />
      <B x={[-5.45, -5.35]} y={[1.3, 1.7]} z={[FACE - 0.45, FACE - 0.35]} c="#9aa3ad" />
      {track("doser.drip", gf, 0) > 0.01 &&
        gf < s5.startFrame + 30 &&
        [0, 1, 2].map((i) => {
          const t = ((gf * 0.05 + i / 3) % 1);
          return (
            <mesh key={"dd" + i} position={[-5.4, 1.28 - t * 0.5, FACE - 0.4]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <M c="#ffffff" e="#ffffff" ei={0.4} />
            </mesh>
          );
        })}
      {/* partículas que se juntam em flocos */}
      {particles.map((p, i) => {
        const cc = flocCenters[p.c];
        const ang = (i / nP) * Math.PI * 2;
        const tx = cc.x + Math.cos(ang) * 0.07, ty = cc.y + Math.sin(ang * 3) * 0.06;
        const k = clamp01(cluster);
        const x = p.x + (tx - p.x) * k + Math.sin(gf / 40 + i) * 0.02 * (1 - k);
        const y = p.y + (ty - p.y) * k;
        if (gf < s4.startFrame - 1) return null;
        return (
          <mesh key={"pt" + i} position={[x, y, p.z * (1 - k) + cc.z * k]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <M c="#6b4a2b" />
          </mesh>
        );
      })}
      {flocCenters.map((c, i) => (
        <mesh key={"fc" + i} position={[c.x, c.y, c.z]} scale={flocScale}>
          <icosahedronGeometry args={[0.12, 1]} />
          <M c="#c9a77a" o={0.9} />
        </mesh>
      ))}

      {/* ---------- DECANTAÇÃO ---------- */}
      <Tank x={[-3, -1]}>
        <B x={[-2.92, -1.08]} y={[0.1, 1.3]} z={[-1.5, FACE - 0.03]} c={mixHex(C.turbid, C.waterClear, clarity)} o={0.5} />
        <B x={[-2.92, -1.08]} y={[0.1, 0.1 + sludge]} z={[-1.5, FACE - 0.03]} c={C.sludge} />
      </Tank>
      {after(s5) &&
        Array.from({length: 9}).map((_, i) => {
          const y0 = 0.6 + random("fy" + i) * 0.6;
          const y = Math.max(0.12 + sludge * 0.6, y0 + flocY * (0.6 + random("fv" + i) * 0.4));
          return (
            <mesh key={"df" + i} position={[-2.8 + random("fx" + i) * 1.6, y, FACE - 0.2 - random("fz" + i) * 0.3]}>
              <icosahedronGeometry args={[0.09, 1]} />
              <M c="#c9a77a" />
            </mesh>
          );
        })}

      {/* ---------- FILTRAÇÃO ---------- */}
      <Tank x={[-1, 0.3]}>
        <B x={[-0.92, 0.22]} y={[0.1, 0.35]} z={[-1.5, FACE - 0.03]} c={C.gravel} />
        <B x={[-0.92, 0.22]} y={[0.35, 0.8]} z={[-1.5, FACE - 0.03]} c={C.sand} />
        <B x={[-0.92, 0.22]} y={[0.8, 1.3]} z={[-1.5, FACE - 0.03]} c={C.waterClear} o={0.45} />
      </Tank>
      {/* sujeira presa na areia */}
      {Array.from({length: 18}).map((_, i) => (
        <mesh key={"tr" + i} position={[-0.85 + random("tx" + i) * 1.0, 0.72 + random("ty" + i) * 0.07, FACE - 0.03]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <M c="#6b4a2b" o={trapped} />
        </mesh>
      ))}
      {/* gotas descendo pelas camadas */}
      {after(S("s6")) &&
        Array.from({length: 8}).map((_, i) => {
          const t = ((gf * 0.012 + random("gd" + i)) % 1);
          return (
            <mesh key={"gd" + i} position={[-0.85 + random("gx" + i) * 1.0, 1.2 - t * 1.05, FACE - 0.02]} scale={[1, 1.4, 1]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <M c={C.cyan} e={C.cyan} ei={0.4} />
            </mesh>
          );
        })}
      {/* micróbios que passam pelo filtro (s7) */}
      {gf >= s7.startFrame &&
        Array.from({length: 5}).map((_, i) => {
          const inFilter = gf < s7.startFrame + s7.durationInFrames * 0.37;
          const y = inFilter ? 1.15 + microbesY * 1.05 - (i % 2) * 0.1 : 0.7 + Math.sin(gf / 20 + i) * 0.15;
          const x = inFilter ? -0.75 + i * 0.2 : 0.55 + (i % 3) * 0.3;
          return <Microbe key={"fm" + i} p={[x, y, FACE + 0.04]} s={inFilter ? 1.1 : microbesPop * 1.1} c={i % 2 ? "#7ed957" : "#b388ff"} />;
        })}

      {/* ---------- DESINFECÇÃO (CLORO) ---------- */}
      <Tank x={[0.3, 1.5]}>
        <B x={[0.38, 1.42]} y={[0.1, 1.3]} z={[-1.5, FACE - 0.03]} c={C.waterClear} o={0.5} e={C.cyan} ei={residual * 0.5} />
      </Tank>
      <B x={[0.7, 1.1]} y={[1.7, 2.2]} z={[FACE - 0.6, FACE - 0.2]} c="#7ed957" />
      <B x={[1.08, 1.14]} y={[1.5, 1.7]} z={[FACE - 0.6, FACE - 0.2]} c="#9aa3ad" />
      <B x={[1.12, 1.55]} y={[1.44, 1.52]} z={[FACE - 0.45, FACE - 0.35]} c="#9aa3ad" />
      <B x={[0.85, 0.95]} y={[1.3, 1.7]} z={[FACE - 0.45, FACE - 0.35]} c="#9aa3ad" />
      {chlorineDrip > 0.01 &&
        gf < s8.startFrame &&
        [0, 1, 2].map((i) => {
          const t = ((gf * 0.05 + i / 3) % 1);
          return (
            <mesh key={"cd" + i} position={[0.9, 1.28 - t * 0.5, FACE - 0.4]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <M c="#b6f28c" e="#b6f28c" ei={0.6} />
            </mesh>
          );
        })}
      {/* ligações entre os tanques */}
      <Pipe a={[-3.05, 1.2, FACE - 0.3]} b={[-2.95, 1.2, FACE - 0.3]} r={0.08} fill={after(s5) ? 1 : 0} glow={lit(1)} />
      <Pipe a={[-1.05, 1.2, FACE - 0.3]} b={[-0.95, 1.2, FACE - 0.3]} r={0.08} fill={after(S("s6")) ? 1 : 0} glow={lit(1)} />
      <Pipe a={[0.25, 0.2, FACE - 0.3]} b={[0.35, 0.2, FACE - 0.3]} r={0.08} fill={after(s7) ? 1 : 0} glow={lit(1)} />

      {/* ---------- SUBIDA AO RESERVATÓRIO (MORRO) ---------- */}
      <mesh position={[3.5, -1.4, -0.5]} scale={[1.45, 2.0, 1.45]}>
        <sphereGeometry args={[1.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M c={C.grass2} />
      </mesh>
      <Pipe a={[1.5, 0.2, FACE - 0.3]} b={[2.4, 0.2, FACE - 0.3]} r={0.12} fill={clamp01(rise * 3)} glow={Math.max(lit(2), residual * 0.6)} />
      <Pipe a={[2.4, 0.2, FACE - 0.3]} b={[3.1, 1.05, FACE - 0.3]} r={0.12} fill={clamp01(rise * 3 - 1)} glow={Math.max(lit(2), residual * 0.6)} />
      <Pipe a={[3.1, 1.05, FACE - 0.3]} b={[3.1, 1.4, FACE - 0.3]} r={0.12} fill={clamp01(rise * 3 - 2)} glow={Math.max(lit(2), residual * 0.6)} />
      {/* reservatório elevado */}
      <group position={[3.5, 1.0, -0.5]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 1.8, 40, 1, true]} />
          <M c="#e8eef5" o={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <coneGeometry args={[0.95, 0.4, 40]} />
          <M c="#5b7fa8" />
        </mesh>
        <mesh position={[0, 0.02 + (1.7 * towerFill) / 2, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1.7 * towerFill, 40]} />
          <M c={C.water} o={0.85} e={C.cyan} ei={0.15 + lit(3) * 0.6} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.08, 40]} />
          <M c={C.concreteD} />
        </mesh>
      </group>
      {gf >= s8.startFrame && gf < S("s9").startFrame &&
        [0, 1, 2].map((i) => {
          const t = (((flowT * 1.5 + i / 3) % 1) + 1) % 1;
          return <Arrow key={"up" + i} p={[2.4 + t * 0.7, 0.2 + t * 0.85, FACE + 0.02]} dir={Math.atan2(0.85, 0.7)} s={0.7} o={rise > 0.1 ? 1 : 0} />;
        })}
      {/* descida por gravidade até a rede */}
      <Pipe a={[3.9, 1.05, FACE - 0.3]} b={[5.0, -0.8, FACE]} r={0.12} fill={downArrows > 0.05 || after(S("s9")) ? 1 : 0} glow={lit(3)} />
      {[0, 1, 2].map((i) => {
        const t = (((flowT * 1.5 + i / 3) % 1) + 1) % 1;
        return <Arrow key={"dn" + i} p={[3.9 + t * 1.1, 1.05 - t * 1.85, FACE + 0.02]} dir={Math.atan2(-1.85, 1.1)} s={0.7} c="#2E9E4F" o={gf < S("s9").startFrame ? downArrows : 0} />;
      })}

      {/* ---------- RUA E REDE DE DISTRIBUIÇÃO ---------- */}
      <B x={[5, 9]} y={[0, 0.08]} c={C.asphalt} />
      <B x={[5, 5.6]} y={[0, 0.16]} c={C.sidewalk} />
      <B x={[8.4, 9]} y={[0, 0.16]} c={C.sidewalk} />
      {Array.from({length: 14}).map((_, i) => <B key={"lm" + i} x={[6.95, 7.05]} y={[0.08, 0.09]} z={[FACE - 0.6 - i * 2.4, FACE - 0.1 - i * 2.4]} c="#f2d14b" />)}
      <Pipe a={[5.0, -0.8, FACE]} b={[9.2, -0.8, FACE]} r={0.16} fill={after(S("s9")) || downArrows > 0.5 ? 1 : 0} glow={lit(4)} />
      {after(S("s9")) &&
        gf < S("s10").startFrame &&
        [0, 1, 2].map((i) => {
          const t = (((flowT + i / 3) % 1) + 1) % 1;
          return <Arrow key={"mn" + i} p={[5.3 + t * 3.6, -0.8, FACE + 0.2]} dir={0} s={0.7} />;
        })}

      {/* ---------- CASA EM CORTE ---------- */}
      <B x={[9, 12.6]} y={[0, 0.1]} z={[-2.6, FACE]} c="#d9c7a7" />
      <B x={[9, 9.12]} y={[0.1, 2.3]} z={[-2.6, FACE]} c={C.wall} />
      <B x={[12.48, 12.6]} y={[0.1, 2.3]} z={[-2.6, FACE]} c={C.wall} />
      <B x={[9, 12.6]} y={[0.1, 2.3]} z={[-2.7, -2.6]} c="#f1e4cc" />
      <B x={[8.9, 12.7]} y={[2.3, 2.42]} z={[-2.8, FACE + 0.1]} c="#b9b1a2" />
      {/* azulejo da cozinha */}
      {Array.from({length: 5}).map((_, i) => <B key={"az" + i} x={[9.9 + i * 0.36, 10.22 + i * 0.36]} y={[1.0, 1.5]} z={[-2.6, -2.58]} c={i % 2 ? "#cfe8f5" : "#e6f4fb"} />)}
      {/* bancada, pia e torneira */}
      <B x={[9.9, 11.7]} y={[0.1, 0.92]} z={[-2.6, -1.8]} c="#8a5a2b" />
      <B x={[9.85, 11.75]} y={[0.92, 0.98]} z={[-2.6, -1.75]} c="#e9ecef" />
      <B x={[10.25, 10.85]} y={[0.86, 0.985]} z={[-2.3, -1.85]} c="#aab3bd" />
      <group position={[houseX + 0.05, 0.98, -2.5]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
          <M c="#c9d1da" metal={0.7} rough={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.26, 12]} />
          <M c="#c9d1da" metal={0.7} rough={0.3} />
        </mesh>
        <group position={[0, 0.45, 0]} rotation={[0, (faucetHandle * Math.PI) / 180, 0]}>
          <B x={[-0.02, 0.02]} y={[0, 0.03]} z={[-0.02, 0.12]} c="#E53935" />
        </group>
        {tapStream > 0.02 && (
          <mesh position={[0, 0.2, 0.25]}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 10]} />
            <M c={C.cyan} o={0.8 * tapStream} e={C.cyan} ei={0.4} />
          </mesh>
        )}
        {/* copo */}
        <group position={[0, 0.0, 0.25]}>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.07, 0.06, 0.22, 20, 1, true]} />
            <M c="#e6f4ff" o={0.4} side={THREE.DoubleSide} />
          </mesh>
          {glassFill > 0.01 && (
            <mesh position={[0, 0.005 + (0.2 * glassFill) / 2, 0]}>
              <cylinderGeometry args={[0.065, 0.058, 0.2 * glassFill, 20]} />
              <M c={C.water} o={0.85} />
            </mesh>
          )}
        </group>
      </group>
      {/* hidrômetro no muro + ramal */}
      <Pipe a={[8.75, -0.8, FACE]} b={[8.76, -0.8, FACE]} r={0.08} fill={after(S("s9")) ? 1 : 0} glow={lit(4)} />
      <Pipe a={[8.75, -0.8, FACE]} b={[8.75, 0.35, FACE - 0.3]} r={0.08} fill={after(S("s9")) ? 1 : 0} glow={lit(4)} />
      <group position={[8.75, 0.5, FACE - 0.25]}>
        <B x={[-0.18, 0.18]} y={[-0.14, 0.14]} z={[-0.1, 0.1]} c="#3b4250" />
        <mesh position={[0, 0, 0.105]}>
          <circleGeometry args={[0.11, 24]} />
          <M c="#f5f6f8" />
        </mesh>
        <group position={[0, 0, 0.11]} rotation={[0, 0, -(meterDial * Math.PI) / 180]}>
          <B x={[-0.008, 0.008]} y={[0, 0.09]} z={[0, 0.005]} c="#E53935" />
        </group>
      </group>
      {/* subida até a caixa d'água */}
      <Pipe a={[8.75, 0.64, FACE - 0.3]} b={[8.75, 0.8, FACE - 0.3]} r={0.07} fill={riser > 0.02 ? 1 : 0} glow={lit(5)} />
      <Pipe a={[8.75, 0.8, FACE - 0.3]} b={[9.06, 0.8, -1.5]} r={0.07} fill={riser > 0.05 ? 1 : 0} glow={lit(5)} />
      <Pipe a={[9.06, 0.8, -1.5]} b={[9.06, 2.75, -1.5]} r={0.07} fill={riser} glow={lit(5)} />
      <Pipe a={[9.06, 2.75, -1.5]} b={[10.4, 2.75, -0.6]} r={0.07} fill={riser > 0.95 ? 1 : 0} glow={lit(5)} />
      {/* caixa d'água azul no telhado (corte) */}
      <group position={[11.0, 2.42, -0.6]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.75, 0.6, 0.9, 40, 1, true]} />
          <M c={C.tank} o={0.55} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.08, 40]} />
          <M c="#245a96" />
        </mesh>
        <mesh position={[0, 0.02 + (0.85 * roofTank) / 2, 0]}>
          <cylinderGeometry args={[0.6 + 0.12 * roofTank, 0.58, 0.85 * roofTank, 40]} />
          <M c={C.water} o={0.85} e={C.cyan} ei={0.15 + lit(5) * 0.6} />
        </mesh>
      </group>
      {/* descida da caixa até a torneira */}
      <Pipe a={[11.0, 2.42, -0.6]} b={[11.0, 2.5, -0.6]} r={0.05} fill={1} glow={lit(6)} />
      <Pipe a={[11.0, 2.5, -0.6]} b={[houseX + 0.05, 2.5, -2.55]} r={0.05} fill={1} glow={lit(6)} />
      <Pipe a={[houseX + 0.05, 2.5, -2.55]} b={[houseX + 0.05, 1.38, -2.55]} r={0.05} fill={1} glow={lit(6)} />
      {gf >= S("s10").startFrame &&
        gf < s11.startFrame &&
        [0, 1].map((i) => {
          const t = (((flowT * 1.4 + i / 2) % 1) + 1) % 1;
          return <Arrow key={"hd" + i} p={[houseX + 0.05, 2.25 - t * 0.7, -2.4]} dir={-Math.PI / 2} s={0.6} c="#2E9E4F" />;
        })}
      {/* brilho na parede no gancho: "de onde vem?" */}
      {wallGlow > 0.02 && <B x={[houseX - 0.01, houseX + 0.11]} y={[1.4, 2.3]} z={[-2.6, -2.5]} c={C.cyan} e={C.cyan} ei={wallGlow} o={0.8} />}

      {/* ---------- GRAMA, ÁRVORES, BAIRRO ---------- */}
      <GrassBlades
        gf={gf}
        seed="t"
        areas={[
          {x: [-18, -14.1], z: [-6, FACE - 0.05], n: 500},
          {x: [-8.8, -6.1], z: [-6, FACE - 0.05], n: 300},
          {x: [1.6, 2.2], z: [-4, FACE - 0.05], n: 60},
          {x: [12.7, 18], z: [-6, FACE - 0.05], n: 500},
        ]}
      />
      <Pine x={-18} z={-8} s={1.5} />
      <Pine x={-11} z={-9} s={1.3} />
      <Pine x={6} z={-10} s={1.4} />
      <Pine x={14} z={-9} s={1.5} />
      <Tree x={1.8} z={-3} s={1.0} />
      <Tree x={13.5} z={-1.5} s={1.2} />
      <Tree x={6.2} z={-5} s={1.1} />
      {[[7.2, -7], [10.8, -7], [-2.5, -6]].map(([x, z], i) => (
        <group key={"bh" + i} position={[x, 0, z]}>
          <B x={[-0.9, 0.9]} y={[0, 1.4]} z={[-1, 1]} c={["#f2e6d0", "#dfe9f2", "#f5d9b8"][i]} />
          <B x={[-1.0, 1.0]} y={[1.4, 1.55]} z={[-1.1, 1.1]} c={["#b24a36", "#4f6d8f", "#b24a36"][i]} />
        </group>
      ))}
      {[[-24, -30, 10], [-6, -34, 13], [14, -32, 11], [30, -28, 9]].map(([x, z, r], i) => (
        <mesh key={"hl" + i} position={[x, -r * 0.55, z]} scale={[1.6, 1, 1]}>
          <sphereGeometry args={[r, 32, 16]} />
          <M c={i % 2 ? "#7fb35a" : "#8cc063"} />
        </mesh>
      ))}

      {/* ---------- MASCOTE (na cozinha) ---------- */}
      {(() => {
        // o mascote acompanha a água: aparece ao lado de cada etapa (como o personagem da referência)
        const id = sceneAt(gf).id;
        const P: Record<string, [number, number, number] | null> = {
          s1: [9.6, 0.1, -0.6],
          s2: [-8.8, 0.06, 0.75],
          s3: [-7.5, 0.06, 1.0],
          s4: [-6.1, 0.6, 1.35], // no banquinho, despejando o produto
          s5: [-2.6, 0.06, 1.5], // na frente do decantador
          s6: [-0.75, 0.06, 1.5], // na frente do filtro
          s7: [1.95, 0.6, 1.0], // no banquinho, pingando o cloro
          s8: [2.3, 0.06, 1.3],
          s9: [8.05, 0.08, 0.35],
          s10: [9.6, 0.1, -0.6],
          s11: [9.6, 0.1, -0.6],
        };
        const p = P[id];
        if (!p) return null;
        return (
          <group>
            {p[1] > 0.3 && (
              // banquinho de madeira para alcançar o topo do tanque
              <group position={[p[0], 0, p[2]]}>
                <B x={[-0.32, 0.32]} y={[p[1] - 0.08, p[1]]} z={[-0.28, 0.28]} c="#a0643c" />
                {[-0.26, 0.26].map((dx) => <B key={dx} x={[dx - 0.04, dx + 0.04]} y={[0.06, p[1] - 0.08]} z={[-0.24, 0.24]} c="#8a5a2b" />)}
              </group>
            )}
            <Mascot position={p} scale={0.8} pose={mascotPose(gf)} gf={gf} look={mascotLook(gf)} />
          </group>
        );
      })()}

      <Clouds gf={gf} />
      <fog attach="fog" args={["#d6ecfb", camDist + 10, camDist + 60]} />
      <ambientLight intensity={0.3} />
      <hemisphereLight args={["#d6ecff", "#5d7a3a", 0.9]} />
      <SunLight gf={gf} />
      <directionalLight position={[-6, 4, 9]} intensity={0.35} color="#cfe3ff" />
    </group>
  );
};
