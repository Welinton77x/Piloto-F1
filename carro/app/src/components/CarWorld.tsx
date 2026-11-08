// Vídeo 4 — rua da cidade: uma carroça de madeira vira um carro, peça por peça (formato da referência da bicicleta).
// Estilo liso e colorido do canal. Estados derivados do tempo efetivo te(gf) (que volta no rebobinar).
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



/* ================= CARRO ================= */
import {L, easeOut} from "../lib/anim";
import {W, boxesX, carSpeed, carX, failing, lightX, parts, potholeX, rew, start, end, te} from "../lib/story";
import {mascotLook, mascotPose} from "../lib/mascotPose";

const K = {
  wood: "#b97a45", woodD: "#8a5a2b", woodL: "#d39b62", metal: "#9aa3ad", metalD: "#5f6872", steel: "#c9d1da",
  rubber: "#22262b", rim: "#d5dbe1", red: "#e53935", body: "#e53935", bodyD: "#b71c1c", glass: "#9fd3f2",
  asphalt: "#3b414d", lane: "#f2d14b", curb: "#c9cdd3", sidewalk: "#d9dce1", orange: "#ff7a1a", hot: "#ff4d1a",
};
const WR = 0.42; // raio da roda
const WX = 1.05, WZ = 0.95; // posição das rodas (local do carro)

/** cilindro com eixo em z (rodas, discos de freio) */
const Zcyl: React.FC<{r: number; w: number; c: string; p?: [number, number, number]; e?: string; ei?: number; seg?: number}> = ({r, w, c, p = [0, 0, 0], e, ei, seg = 28}) => (
  <mesh position={p} rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[r, r, w, seg]} />
    <M c={c} e={e} ei={ei} rough={0.6} />
  </mesh>
);
/** cilindro com eixo em x (eixo de transmissão, embreagem) */
const Xcyl: React.FC<{r: number; w: number; c: string; p?: [number, number, number]; o?: number; e?: string; ei?: number}> = ({r, w, c, p = [0, 0, 0], o, e, ei}) => (
  <mesh position={p} rotation={[0, 0, Math.PI / 2]}>
    <cylinderGeometry args={[r, r, w, 24]} />
    <M c={c} o={o} e={e} ei={ei} rough={0.5} />
  </mesh>
);
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

/** roda: madeira com raios (antes) ou pneu de borracha com aro (depois); spin = ângulo; steer = esterço */
const Wheel: React.FC<{tire: number; spin: number; side: 1 | -1; brake: number; heat: number}> = ({tire, spin, side, brake, heat}) => (
  <group>
    <group rotation={[0, 0, -spin]}>
      {tire < 0.5 ? (
        <group scale={1 - tire}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[WR - 0.04, 0.045, 10, 32]} />
            <M c={K.woodD} />
          </mesh>
          {Array.from({length: 8}).map((_, i) => (
            <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI]}>
              <boxGeometry args={[0.04, (WR - 0.04) * 2, 0.04]} />
              <M c={K.wood} />
            </mesh>
          ))}
          <Zcyl r={0.07} w={0.1} c={K.woodD} />
        </group>
      ) : (
        <group scale={tire}>
          <Zcyl r={WR + 0.02} w={0.24} c={K.rubber} seg={32} />
          <Zcyl r={WR - 0.13} w={0.26} c={K.rim} p={[0, 0, 0]} />
          {Array.from({length: 5}).map((_, i) => (
            <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.14, Math.sin((i / 5) * Math.PI * 2) * 0.14, side * 0.135]}>
              <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
              <M c={K.metalD} />
            </mesh>
          ))}
          {/* gomos do pneu (mostram o giro) */}
          {Array.from({length: 12}).map((_, i) => (
            <mesh key={"g" + i} position={[Math.cos((i / 12) * Math.PI * 2) * (WR + 0.02), Math.sin((i / 12) * Math.PI * 2) * (WR + 0.02), 0]} rotation={[0, 0, (i / 12) * Math.PI * 2]}>
              <boxGeometry args={[0.03, 0.06, 0.25]} />
              <M c="#3a3f45" />
            </mesh>
          ))}
        </group>
      )}
    </group>
    {/* freio a disco (não gira com o raio visual da roda, só o disco) */}
    {brake > 0.01 && (
      <group position={[0, 0, side * 0.15]} scale={brake}>
        <group rotation={[0, 0, -spin]}>
          <Zcyl r={0.26} w={0.03} c={mixHex(K.steel, K.hot, heat)} e={K.hot} ei={heat * 1.2} />
          {Array.from({length: 6}).map((_, i) => (
            <mesh key={i} position={[Math.cos((i / 6) * Math.PI * 2) * 0.17, Math.sin((i / 6) * Math.PI * 2) * 0.17, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
              <M c={K.metalD} />
            </mesh>
          ))}
        </group>
        {/* pinça vermelha com as pastilhas, no alto do disco */}
        <B x={[-0.1, 0.1]} y={[0.15, 0.3]} z={[-0.06, 0.06]} c={K.red} />
      </group>
    )}
  </group>
);

/** motor: 1 cilindro (s2) → 4 cilindros (s3); pistões sobem e descem, faíscas e explosões; virabrequim gira */
const Engine: React.FC<{t: number; k: number; crank: number; four: number; heat: number; rpm: number; jolty: boolean}> = ({t, k, crank, four, heat, rpm, jolty}) => {
  const n = four > 0.5 ? 4 : 1;
  const zs = n === 4 ? [-0.27, -0.09, 0.09, 0.27] : [0];
  const order = [0, 2, 3, 1];
  const ang = t * rpm;
  const blockC = mixHex("#7d8791", K.hot, heat);
  return (
    <group position={[1.02, 0.68, 0]} scale={k}>
      {/* cárter */}
      <B x={[-0.2, 0.2]} y={[0, 0.16]} z={[-0.38, 0.38]} c={blockC} e={K.hot} ei={heat * 0.8} />
      {/* virabrequim (barra torta) girando, ao longo de z */}
      {crank > 0.01 && (
        <group position={[0, 0.08, 0]} rotation={[0, 0, 0]} scale={crank}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.8, 10]} />
            <M c="#ffc400" e="#ffc400" ei={0.25} />
          </mesh>
          {zs.map((z, i) => {
            const a = ang + (order.indexOf(i) * Math.PI) / 2 * (n === 4 ? 1 : 0);
            return (
              <group key={"cw" + i} position={[0, 0, z]} rotation={[0, 0, -a]}>
                <B x={[-0.025, 0.025]} y={[0, 0.07]} z={[-0.03, 0.03]} c="#ffc400" />
              </group>
            );
          })}
        </group>
      )}
      {zs.map((z, i) => {
        const a = ang + (n === 4 ? (order.indexOf(i) * Math.PI) / 2 : 0);
        const py = 0.32 + 0.07 * Math.cos(a); // pistão
        const fire = (((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) < 0.9; // explosão logo depois do topo
        const pinY = 0.08 + 0.07 * Math.cos(a), pinX = 0.07 * Math.sin(a);
        return (
          <group key={"cy" + i} position={[0, 0, z]}>
            {/* cilindro transparente (corte) */}
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.36, 20, 1, true]} />
              <M c={mixHex("#7fc8f2", K.hot, heat)} o={0.45} side={THREE.DoubleSide} e={K.hot} ei={heat * 0.6} />
            </mesh>
            {/* vela + faísca */}
            <mesh position={[0, 0.57, 0]}>
              <cylinderGeometry args={[0.02, 0.025, 0.07, 8]} />
              <M c="#eceff1" />
            </mesh>
            {fire && (
              <mesh position={[0, py + 0.09, 0]}>
                <sphereGeometry args={[0.07, 12, 10]} />
                <meshBasicMaterial color="#ffb300" transparent opacity={0.85} />
              </mesh>
            )}
            {/* pistão */}
            <Seg a={[0, py, 0]} b={[0, py + 0.06, 0]} r={0.072} c="#455a64" />
            {/* biela */}
            {crank > 0.01 && <Seg a={[0, py, 0]} b={[pinX * (jolty ? 1.2 : 1), pinY, 0]} r={0.012} c="#90a4ae" />}
          </group>
        );
      })}
      {/* fumaça do superaquecimento */}
      {heat > 0.3 &&
        Array.from({length: 10}).map((_, i) => {
          const s = ((t * 0.02 + random("sm" + i)) % 1);
          return (
            <mesh key={"sm" + i} position={[(random("sx" + i) - 0.5) * 0.3, 0.6 + s * 1.2, (random("sz" + i) - 0.5) * 0.5]} scale={0.08 + s * 0.2}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#7a7f86" transparent opacity={(1 - s) * 0.6 * heat} depthWrite={false} />
            </mesh>
          );
        })}
    </group>
  );
};

/** prédio da rua (procedural) */
const Building: React.FC<{i: number; x: number}> = ({i, x}) => {
  const w = 3.2 + random("bw" + i) * 1.4, h = 3 + random("bh" + i) * 4.5;
  const cols = ["#f4a6a6", "#a8d5f2", "#f7d794", "#b8e0b0", "#d7b8f0", "#f9c38c", "#c9e4de", "#f2b8c6"];
  const c = cols[Math.floor(random("bc" + i) * cols.length)];
  const fl = Math.floor(h / 1.1);
  return (
    <group position={[x, 0, -7.5]}>
      <B x={[-w / 2, w / 2]} y={[0, h]} z={[-2, 2]} c={c} />
      <B x={[-w / 2 - 0.05, w / 2 + 0.05]} y={[h, h + 0.15]} z={[-2.05, 2.05]} c={mixHex(c, "#000000", 0.2)} />
      {Array.from({length: fl}).map((_, r) =>
        [-1, 0, 1].map((cx) => (
          <B key={r + "-" + cx} x={[cx * (w / 3.2) - 0.32, cx * (w / 3.2) + 0.32]} y={[0.7 + r * 1.1, 1.25 + r * 1.1]} z={[2, 2.04]} c={r === 0 && cx === 0 ? "#6d4c41" : "#cfe9fb"} />
        )),
      )}
    </group>
  );
};

/* ================= MUNDO ================= */
export const CarWorld: React.FC<{gf: number}> = ({gf}) => {
  const rootRef = useRef<THREE.Group>(null);
  useShadows(rootRef);
  const t = te(gf);
  const X = carX(t);
  const camDist = poseAt(gf).pos.distanceTo(poseAt(gf).target);
  const P = parts(t);
  const inS = (id: string) => t >= start(id) && t < end(id);
  const spin = X / WR;

  // falhas e reações do carro
  const jolt = failing("s3", t) ? Math.abs(Math.sin(t * 0.55)) * 0.12 : !P.four && P.engine > 0.5 && carSpeed(t) > 0 ? Math.abs(Math.sin(t * 0.55)) * 0.05 : 0;
  const pitch = failing("s3", t) ? Math.sin(t * 0.55) * 0.05 : 0;
  const heat = failing("s4", t) ? L(t, rew("s4").P, rew("s4").P + 30, 0, 1) : 0;
  const tip = failing("s7", t) ? L(t, rew("s7").P + 6, rew("s7").R - 2, 0, 0.42, easeOut) : 0; // quase tomba
  const axleTurn = failing("s7", t) ? L(t, rew("s7").P, rew("s7").P + 10, 0, 0.45) : 0; // eixo inteiro virando
  const steer = P.steering > 0.5 && inS("s7") && !failing("s7", t) ? Math.sin((t - W("s7", "volante")) * 0.08) * 0.35 : inS("s6") ? 0.25 : 0;
  const hole = inS("s8") ? t - W("s8", "buraco") : -1;
  const bump = hole >= 0 && hole < 40 ? Math.sin(hole * 0.45) * Math.exp(-hole * (P.springs > 0.5 ? 0.25 : 0.06)) * (P.springs > 0.5 ? 0.05 : 0.22) : 0;
  const yaw = inS("s6") ? Math.sin((t - start("s6")) * 0.05) * 0.18 : failing("s7", t) ? 0.25 : 0;
  const braking = inS("s9") && t > W("s9", "freio") && t < W("s9", "calor") + 30;
  const bheat = braking ? L(t, W("s9", "freio"), W("s9", "calor"), 0, 1) * (1 - L(t, W("s9", "calor") + 10, W("s9", "calor") + 30, 0, 1)) : 0;
  const rpm = P.four > 0.5 ? 0.6 : 0.35;
  const clutchGap = inS("s5") && t > W("s5", "discos") && t < W("s5", "câmbio") ? Math.max(0, Math.sin((t - W("s5", "discos")) * 0.12)) * 0.1 : 0;
  const gearSel = inS("s5") ? (t < W("s5", "Quinta") ? 1 : 5) : 5;
  const light = inS("s5") ? (t < rew("s5").R ? "red" : t < W("s5", "Primeira") ? "red" : "green") : null;
  const ml = mascotLook(t), mp = mascotPose(t);
  const lo = (lo0: number) => lo0; // ajuda de leitura

  const tiles = useMemo(() => Array.from({length: 26}, (_, k) => k), []);
  const base = Math.floor((X - 40) / 5.5);

  return (
    <group ref={rootRef}>
      {/* ---------- RUA ---------- */}
      <B x={[X - 80, X + 80]} y={[-0.4, 0]} z={[-2.4, 2.4]} c={K.asphalt} />
      <B x={[X - 80, X + 80]} y={[-0.4, 0.12]} z={[2.4, 3.6]} c={K.sidewalk} />
      <B x={[X - 80, X + 80]} y={[-0.4, 0.12]} z={[-5.4, -2.4]} c={K.sidewalk} />
      <B x={[X - 80, X + 80]} y={[0.12, 0.14]} z={[2.4, 2.5]} c={K.curb} />
      <B x={[X - 80, X + 80]} y={[-0.4, 0.06]} z={[3.6, 30]} c={C.grass} />
      <B x={[X - 80, X + 80]} y={[-0.4, 0.06]} z={[-60, -9.5]} c={C.grass} />
      {Array.from({length: 40}).map((_, k) => {
        const lx = (Math.floor(X / 3) - 20 + k) * 3;
        return <B key={"ln" + lx} x={[lx, lx + 1.5]} y={[0, 0.012]} z={[-0.06, 0.06]} c={K.lane} />;
      })}
      {tiles.map((k) => {
        const i = base + k;
        return <Building key={"bd" + i} i={i} x={i * 5.5} />;
      })}
      {tiles.map((k) => {
        const i = base + k;
        return random("tr" + i) < 0.45 ? <Tree key={"tr" + i} x={i * 5.5 + 2.7} z={-4.4} s={0.9} /> : null;
      })}
      {/* faixa de pedestre */}
      {[Math.floor(X / 40) * 40 + 26, Math.floor(X / 40) * 40 + 66].map((cx) =>
        Array.from({length: 7}).map((_, j) => <B key={"cw" + cx + j} x={[cx, cx + 1.4]} y={[0, 0.013]} z={[-2.2 + j * 0.65, -1.9 + j * 0.65]} c="#f5f6f8" />),
      )}

      {/* semáforo (s5) */}
      {light && (
        <group position={[lightX(), 0.12, -2.8]}>
          <B x={[-0.06, 0.06]} y={[0, 3.0]} z={[-0.06, 0.06]} c="#37474f" />
          <B x={[-0.06, 0.06]} y={[2.9, 3.0]} z={[0, 1.4]} c="#37474f" />
          <B x={[-0.18, 0.18]} y={[2.1, 3.0]} z={[1.25, 1.55]} c="#263238" />
          {(["red", "#ffc400", "green"] as const).map((c, j) => {
            const on = (light === "red" && j === 0) || (light === "green" && j === 2);
            const col = j === 0 ? "#ff2d2d" : j === 1 ? "#ffc400" : "#2ecc71";
            return (
              <mesh key={c} position={[0, 2.85 - j * 0.28, 1.56]}>
                <circleGeometry args={[0.1, 20]} />
                <meshStandardMaterial color={on ? col : "#3a3f45"} emissive={on ? col : "#000000"} emissiveIntensity={on ? 1.6 : 0} />
              </mesh>
            );
          })}
          <B x={[-0.3, 0.3]} y={[-0.11, -0.1]} z={[0.3, 5.0]} c="#f5f6f8" />
        </group>
      )}
      {/* buraco (s8) */}
      {inS("s8") && (
        <mesh position={[potholeX(), 0.006, 0.95]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.3, 0.8, 1]}>
          <circleGeometry args={[0.32, 20]} />
          <meshStandardMaterial color="#1c1f24" />
        </mesh>
      )}
      {/* caixas (s9) */}
      {inS("s9") &&
        [[0, 0, 0], [0, 0.6, 0], [0, 0, 0.62], [0, 0, -0.62], [0, 0.6, 0.62], [0, 1.2, 0.3]].map(([dx, dy, dz], i) => (
          <B key={"bx" + i} x={[boxesX() + dx - 0.29, boxesX() + dx + 0.29]} y={[dy, dy + 0.58]} z={[dz - 0.29, dz + 0.29]} c={i % 2 ? "#c8955c" : "#d9a66b"} />
        ))}
      {/* fumaça do pneu na curva (s6) */}
      {inS("s6") && t < W("s6", "Então") &&
        Array.from({length: 10}).map((_, i) => {
          const s = ((t * 0.03 + random("ts" + i)) % 1);
          return (
            <mesh key={"ts" + i} position={[X - WX - s * 1.4, 0.15 + s * 0.5, WZ + 0.1]} scale={0.12 + s * 0.25}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#e0e0e0" transparent opacity={(1 - s) * 0.55} depthWrite={false} />
            </mesh>
          );
        })}

      {/* ---------- CARRO ---------- */}
      <group position={[X, jolt + Math.max(0, bump), 0]} rotation={[tip, yaw, pitch + (bump < 0 ? bump * 0.4 : 0)]}>
        {/* rodas e eixos */}
        {[WX, -WX].map((wx) =>
          [WZ, -WZ].map((wz) => {
            const front = wx > 0;
            const st = front ? (P.steering > 0.5 ? steer * (wz > 0 ? 1.15 : 0.9) : 0) : 0;
            const ax = front && axleTurn > 0 ? 0 : 0;
            return (
              <group key={wx + "," + wz} position={[wx, WR, wz]} rotation={[0, st + ax, 0]}>
                <Wheel tire={P.tires} spin={spin * (inS("s6") && wz > 0 && P.diff > 0.5 ? 1.08 : 1)} side={wz > 0 ? 1 : -1} brake={P.brakes} heat={bheat} />
              </group>
            );
          }),
        )}
        {/* eixo traseiro (com diferencial no meio a partir do s6) */}
        <Seg a={[-WX, WR, -WZ]} b={[-WX, WR, WZ]} r={0.035} c={K.metalD} />
        {P.diff > 0.01 && (
          <group position={[-WX, WR, 0]} scale={P.diff}>
            <mesh>
              <sphereGeometry args={[0.2, 20, 14]} />
              <M c="#cfd8dc" o={0.35} side={THREE.DoubleSide} />
            </mesh>
            <group rotation={[0, 0, -spin]}>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[0.05, 0, 0]}>
                <torusGeometry args={[0.14, 0.03, 8, 24]} />
                <M c="#ffc400" e="#ffc400" ei={0.2} />
              </mesh>
            </group>
            {[-1, 1].map((s) => (
              <group key={s} position={[0, 0, s * 0.08]} rotation={[0, 0, spin * (s > 0 && inS("s6") ? 1.2 : 1)]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[0.07, 0.06, 12]} />
                  <M c="#ff9800" />
                </mesh>
              </group>
            ))}
            {[-1, 1].map((s) => (
              <group key={"p" + s} position={[0, s * 0.08, 0]} rotation={[0, 0, Math.PI / 2 + spin]}>
                <mesh>
                  <coneGeometry args={[0.05, 0.05, 10]} />
                  <M c="#ff5722" />
                </mesh>
              </group>
            ))}
          </group>
        )}
        {/* eixo da frente: inteiro (carroça) ou com articulações (direção) */}
        <group position={[WX, WR, 0]} rotation={[0, P.steering > 0.5 ? 0 : axleTurn, 0]}>
          <Seg a={[0, 0, -WZ]} b={[0, 0, WZ]} r={0.035} c={K.metalD} />
        </group>
        {P.steering > 0.01 && (
          <group scale={[1, 1, 1]}>
            {[WZ - 0.12, -WZ + 0.12].map((z) => <B key={"kn" + z} x={[WX - 0.06, WX + 0.06]} y={[WR - 0.08, WR + 0.08]} z={[z - 0.05, z + 0.05]} c="#ffc400" />)}
            <Seg a={[WX - 0.18, WR, -WZ + 0.1]} b={[WX - 0.18, WR, WZ - 0.1]} r={0.025 * P.steering} c="#ffc400" />
            <Seg a={[WX - 0.18, WR, 0]} b={[0.3, 1.05, 0]} r={0.025 * P.steering} c={K.metalD} />
            <group position={[0.28, 1.08, 0]} rotation={[0, 0, -0.9]}>
              <group rotation={[0, steer * 3, 0]}>
                <mesh rotation={[0, 0, 0]} scale={P.steering}>
                  <torusGeometry args={[0.17, 0.025, 10, 28]} />
                  <M c="#263238" />
                </mesh>
              </group>
            </group>
          </group>
        )}
        {/* molas e amortecedores */}
        {P.springs > 0.01 &&
          [WX, -WX].map((wx) =>
            [WZ - 0.12, -WZ + 0.12].map((wz) => {
              const comp = 1 - Math.max(0, -bump) * 3;
              return (
                <group key={"sp" + wx + wz} position={[wx, WR, wz]} scale={[P.springs, P.springs * comp, P.springs]}>
                  {Array.from({length: 5}).map((_, i) => (
                    <mesh key={i} position={[0, 0.04 + i * 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[0.06, 0.012, 6, 16]} />
                      <M c="#43a047" />
                    </mesh>
                  ))}
                  <Seg a={[0.09, 0, 0]} b={[0.09, 0.22, 0]} r={0.02} c="#ffc400" />
                </group>
              );
            }),
          )}

        {/* plataforma de madeira da carroça */}
        <B x={[-1.45, 1.45]} y={[0.55, 0.68]} z={[-0.75, 0.75]} c={K.wood} />
        {[-0.75, 0.75].map((z) => <B key={"sb" + z} x={[-1.45, 0.65]} y={[0.68, 0.92]} z={[z - 0.03, z + 0.03]} c={K.woodD} />)}
        <B x={[-1.48, -1.42]} y={[0.68, 0.92]} z={[-0.75, 0.75]} c={K.woodD} />
        {/* banco */}
        <B x={[-0.5, 0.05]} y={[0.68, 0.9]} z={[-0.6, 0.6]} c={K.woodL} />
        <B x={[-0.55, -0.45]} y={[0.9, 1.35]} z={[-0.6, 0.6]} c={K.woodL} />
        {/* malas */}
        <B x={[-1.35, -0.75]} y={[0.68, 1.05]} z={[-0.55, 0.0]} c="#8e5a3c" />
        <B x={[-1.3, -0.8]} y={[0.68, 0.98]} z={[0.08, 0.6]} c="#3f6fb5" />
        <B x={[-1.25, -0.85]} y={[1.05, 1.25]} z={[-0.45, -0.05]} c="#e57373" />

        {/* motor */}
        {P.engine > 0.01 && <Engine t={t} k={P.engine} crank={P.crank} four={P.four} heat={heat} rpm={rpm} jolty={failing("s3", t)} />}
        {/* radiador na frente + canos de água */}
        {P.radiator > 0.01 && (
          <group scale={P.radiator}>
            <B x={[1.42, 1.5]} y={[0.62, 1.22]} z={[-0.42, 0.42]} c="#455a64" />
            {Array.from({length: 9}).map((_, i) => <B key={"fin" + i} x={[1.5, 1.52]} y={[0.66, 1.18]} z={[-0.38 + i * 0.095, -0.36 + i * 0.095]} c="#90a4ae" />)}
            <Seg a={[1.1, 1.02, 0.3]} b={[1.44, 1.12, 0.3]} r={0.03} c="#e53935" />
            <Seg a={[1.1, 0.75, -0.3]} b={[1.44, 0.7, -0.3]} r={0.03} c="#1e88e5" />
          </group>
        )}
        {/* embreagem (dois discos) + câmbio + eixo cardã até o diferencial */}
        {P.clutch > 0.01 && (
          <group scale={P.clutch}>
            <group position={[0.72, 0.78, 0]}>
              <group rotation={[t * rpm, 0, 0]}>
                <Xcyl r={0.17} w={0.03} c="#ff7043" p={[0.04, 0, 0]} />
              </group>
              <group rotation={[clutchGap > 0.05 ? 0 : t * rpm, 0, 0]}>
                <Xcyl r={0.17} w={0.03} c="#29b6f6" p={[-0.04 - clutchGap, 0, 0]} />
              </group>
            </group>
          </group>
        )}
        {P.gearbox > 0.01 && (
          <group scale={P.gearbox}>
            <B x={[0.15, 0.6]} y={[0.62, 0.98]} z={[-0.2, 0.2]} c="#cfd8dc" o={0.3} />
            {[[0.25, 1], [0.38, 2], [0.5, 5]].map(([x, g]) => {
              const sel = g === gearSel;
              const rIn = g === 1 ? 0.05 : g === 2 ? 0.07 : 0.11, rOut = g === 1 ? 0.12 : g === 2 ? 0.1 : 0.06;
              return (
                <group key={"gr" + g}>
                  <group position={[x, 0.88, 0]} rotation={[t * rpm, 0, 0]}>
                    <Xcyl r={rIn} w={0.05} c={sel ? "#ffc400" : "#90a4ae"} e={sel ? "#ffc400" : undefined} ei={sel ? 0.4 : 0} />
                  </group>
                  <group position={[x, 0.88 - rIn - rOut, 0]} rotation={[-t * rpm * (rIn / rOut), 0, 0]}>
                    <Xcyl r={rOut} w={0.05} c={sel ? "#ff9800" : "#78909c"} e={sel ? "#ff9800" : undefined} ei={sel ? 0.4 : 0} />
                  </group>
                </group>
              );
            })}
            <Seg a={[0.15, 0.7, 0]} b={[-WX + 0.15, WR + 0.02, 0]} r={0.03} c={K.metalD} />
          </group>
        )}

        {/* carroceria final (s10): lataria vermelha, vidros, faróis, limpador */}
        {P.body > 0.01 && (
          <group scale={[1, P.body, 1]}>
            <B x={[-1.6, 1.6]} y={[0.55, 1.02]} z={[-0.82, 0.82]} c={K.body} />
            <B x={[0.6, 1.6]} y={[1.02, 1.08]} z={[-0.8, 0.8]} c={K.bodyD} />
            <B x={[-1.0, 0.55]} y={[1.02, 2.0]} z={[-0.78, 0.78]} c={K.glass} o={0.3} />
            <B x={[-1.05, 0.6]} y={[2.0, 2.08]} z={[-0.8, 0.8]} c={K.body} />
            <B x={[-1.6, -1.0]} y={[1.02, 1.12]} z={[-0.8, 0.8]} c={K.bodyD} />
            {/* rodas aparecem por baixo: recortes escuros */}
            {[WX, -WX].map((wx) => [0.83, -0.83].map((z) => <B key={"wh" + wx + z} x={[wx - 0.5, wx + 0.5]} y={[0.55, 0.72]} z={[z - 0.01, z + 0.01]} c="#1b1b1b" />))}
          </group>
        )}
        {P.lights > 0.01 &&
          [0.55, -0.55].map((z) => (
            <group key={"hl" + z}>
              <mesh position={[1.61, 0.88, z]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.13, 20]} />
                <meshStandardMaterial color="#fff7c2" emissive="#fff3a0" emissiveIntensity={1.8 * P.lights} />
              </mesh>
              <mesh position={[2.4, 0.6, z]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.45, 1.6, 20, 1, true]} />
                <meshBasicMaterial color="#fff6c0" transparent opacity={0.18 * P.lights} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[-1.61, 0.88, z]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.1, 16]} />
                <meshStandardMaterial color="#ff5252" emissive="#ff1744" emissiveIntensity={P.lights} />
              </mesh>
            </group>
          ))}
        {P.wiper > 0.01 && (
          <group position={[0.56, 1.06, -0.3]} rotation={[0, 0, 0]}>
            <group rotation={[Math.sin(t * 0.25) * 0.9, 0, 0]}>
              <B x={[-0.015, 0.015]} y={[0, 0.45]} z={[-0.015, 0.015]} c="#212121" />
            </group>
          </group>
        )}

        {/* mascote (na carroça / no carro) */}
        {ml.at && (
          <group position={ml.at} rotation={[0, ml.ry ?? Math.PI / 2, 0]}>
            <Mascot position={ml.pivotHip ? [0, -0.66 * 0.8, 0] : [0, 0, 0]} scale={0.8} pose={mp} gf={gf} look={ml} />
            {P.belt > 0.01 && (
              <group position={[0, 0.66 * 0.8 * 0 + 0.0, 0]}>
                <mesh position={[0.02, 0.58, 0.15]} rotation={[0, 0, 0.75]}>
                  <boxGeometry args={[0.06, 0.62 * P.belt, 0.02]} />
                  <M c="#37474f" />
                </mesh>
              </group>
            )}
          </group>
        )}
      </group>

      <Clouds gf={gf} />
      <fog attach="fog" args={["#d6ecfb", camDist + 14, camDist + 75]} />
      <ambientLight intensity={0.34} />
      <hemisphereLight args={["#d6ecff", "#5d7a3a", 0.9]} />
      <SunLight gf={gf} />
      <directionalLight position={[-6, 4, 9]} intensity={0.35} color="#cfe3ff" />
      {lo(0) && null}
    </group>
  );
};
