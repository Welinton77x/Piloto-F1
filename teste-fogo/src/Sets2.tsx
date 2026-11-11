import React, {useMemo} from "react";
import * as THREE from "three";
import {canvasTex, rng} from "./util";
import {Box, Shell} from "./Sets";

type V3 = [number, number, number];
const M = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, ...extra});

const sky = (key: string, top: string, mid: string, bottom: string) =>
  canvasTex(key, 64, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 512);
  });

const SkyDome: React.FC<{k: string; c: [string, string, string]}> = ({k, c}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: sky(k, ...c), side: THREE.BackSide, fog: false}), [k, c]);
  return (
    <mesh material={m}>
      <sphereGeometry args={[40, 24, 16]} />
    </mesh>
  );
};

/* ---------- caminhão militar (com caixotes amarrados) ---------- */
export const Truck: React.FC<{p: V3; ry?: number; crate?: {y: number; x?: number; rx: number; show: boolean}}> = ({p, ry = 0, crate}) => {
  const m = useMemo(() => ({body: M("#55603a", 0.8), dark: M("#222", 0.6), tire: M("#151515", 0.9), glass: M("#9fb8c8", 0.1), wood: M("#a0723f", 0.8), rope: M("#c9b48a", 0.9), star: M("#f2f2f2", 0.6)}), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.75, 0]} s={[1.9, 0.12, 4.2]} m={m.dark} />
      <Box p={[0, 1.3, 1.55]} s={[1.9, 1.0, 1.1]} m={m.body} />
      <Box p={[0, 1.55, 2.11]} s={[1.6, 0.45, 0.02]} m={m.glass} />
      <Box p={[0, 0.95, -0.55]} s={[1.95, 0.35, 3.0]} m={m.body} />
      {[
        [-0.95, 1.55],
        [0.95, 1.55],
        [-0.95, -1.3],
        [0.95, -1.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.42, z]} rotation={[0, 0, Math.PI / 2]} material={m.tire} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 20]} />
        </mesh>
      ))}
      {/* caixotes */}
      {[
        [-0.45, -0.3],
        [0.45, -0.3],
        [-0.45, -1.2],
        [0.45, -1.2],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 1.42, z]} s={[0.8, 0.6, 0.8]} m={m.wood} />
      ))}
      {crate?.show && <Box p={[crate.x ?? 0, 2.02 + crate.y, -0.75]} s={[0.8, 0.6, 0.8]} m={m.wood} r={[crate.rx, 0, 0.1 + (crate.x ?? 0) * 0.6]} />}
      <Box p={[0, 1.75, -0.75]} s={[1.98, 0.03, 0.04]} m={m.rope} />
    </group>
  );
};

/* ---------- Rio de Janeiro, 1944 ---------- */
export const RioStreet: React.FC<{usa?: boolean}> = ({usa}) => {
  const m = useMemo(
    () => ({
      street: new THREE.MeshStandardMaterial({
        map: canvasTex("paralelepipedo", 512, 512, (c, r) => {
          c.fillStyle = "#7b746a";
          c.fillRect(0, 0, 512, 512);
          for (let y = 0; y < 16; y++)
            for (let x = 0; x < 16; x++) {
              const v = 0.8 + r() * 0.35;
              c.fillStyle = `rgb(${150 * v},${140 * v},${125 * v})`;
              c.fillRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28);
            }
        }, [10, 10]),
        roughness: 0.9,
      }),
      walk: M("#d8cfbf", 0.9),
      trim: M("#f4efe4", 0.7),
      win: M("#3d5a6b", 0.3),
      door: M("#5b3a22", 0.6),
      trunk: M("#8a6a44", 0.9),
      leaf: M("#3f8f3f", 0.8),
      table: M("#6b4a2a", 0.6),
      cloth: M("#2f6f3f", 0.9),
      fac: (usa ? ["#8a4a36", "#a35a40", "#7a4030", "#9a6a4a", "#6e3a2a"] : ["#f2c46b", "#9fd0c8", "#f0a3a3", "#c8d98f", "#f4e3b0"]).map((c) => M(c, 0.85)),
      lamp: M("#2a2a2e", 0.5),
      bulb: new THREE.MeshStandardMaterial({color: "#fff2c0", emissive: new THREE.Color("#ffd27a"), emissiveIntensity: 0.6}),
      banner: new THREE.MeshStandardMaterial({
        map: canvasTex("usarmy", 512, 128, (c) => {
          c.fillStyle = "#1f3a6b";
          c.fillRect(0, 0, 512, 128);
          c.fillStyle = "#f4efe4";
          c.font = "bold 64px sans-serif";
          c.textAlign = "center";
          c.fillText("U.S. ARMY", 256, 70);
          c.font = "bold 30px sans-serif";
          c.fillText("RECRUITING STATION", 256, 112);
        }),
        roughness: 0.8,
      }),
    }),
    [],
  );
  return (
    <group>
      <SkyDome k={usa ? "usa" : "rio"} c={usa ? ["#6f9fd0", "#b9d3ea", "#f2ead8"] : ["#3e93e8", "#9fd0ff", "#fff3d8"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.street} receiveShadow>
        <planeGeometry args={[40, 30]} />
      </mesh>
      <Box p={[0, 0.07, -3.3]} s={[40, 0.14, 2]} m={m.walk} />
      {/* casarões coloridos */}
      {Array.from({length: 7}, (_, i) => (
        <group key={i} position={[-9 + i * 3, 0, -5.2]}>
          <Box p={[0, 2.2, 0]} s={[2.95, 4.4, 1.5]} m={m.fac[i % 5]} />
          <Box p={[0, 4.5, 0.05]} s={[3.05, 0.22, 1.65]} m={m.trim} />
          {[-0.8, 0.8].map((x) =>
            [1.4, 3.2].map((y) => (
              <group key={x + "_" + y}>
                <Box p={[x, y, 0.76]} s={[0.6, 1.0, 0.04]} m={y < 2 && x > 0 ? m.door : m.win} />
                <Box p={[x, y + 0.58, 0.8]} s={[0.75, 0.1, 0.1]} m={m.trim} />
              </group>
            )),
          )}
        </group>
      ))}
      {/* palmeiras (Rio) ou postes de luz (EUA) */}
      {usa && [-6.5, -1.2, 4.5].map((x) => (
        <group key={x} position={[x, 0, -3.6]}>
          <Box p={[0, 1.6, 0]} s={[0.08, 3.2, 0.08]} m={m.lamp} />
          <mesh position={[0, 3.25, 0]} material={m.bulb}>
            <sphereGeometry args={[0.14, 12, 10]} />
          </mesh>
        </group>
      ))}
      {!usa && [-6.5, -1.2, 4.5].map((x, i) => (
        <group key={i} position={[x, 0, -3.6]}>
          <mesh position={[0, 2.2, 0]} rotation={[0, 0, 0.06]} material={m.trunk} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 4.4, 8]} />
          </mesh>
          {Array.from({length: 7}, (_, k) => (
            <mesh key={k} position={[Math.cos((k / 7) * 6.28) * 0.6, 4.35, Math.sin((k / 7) * 6.28) * 0.6]} rotation={[Math.sin((k / 7) * 6.28) * 0.9, 0, -Math.cos((k / 7) * 6.28) * 0.9]} scale={[0.25, 1.3, 0.05]} material={m.leaf} castShadow>
              <sphereGeometry args={[0.6, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* mesa de alistamento */}
      <group position={[2.2, 0, -1.6]}>
        <Box p={[0, 0.75, 0]} s={[1.6, 0.06, 0.8]} m={m.table} />
        <Box p={[0, 0.45, 0.38]} s={[1.6, 0.6, 0.02]} m={usa ? m.banner : m.cloth} />
        {usa && <Box p={[0, 2.9, -3.55]} s={[2.6, 0.65, 0.04]} m={m.banner} />}
        {[-0.7, 0.7].map((x) => (
          <Box key={x} p={[x, 0.37, -0.3]} s={[0.05, 0.74, 0.05]} m={m.table} />
        ))}
      </group>
    </group>
  );
};

/* ---------- sala do exame médico ---------- */
export const MedRoom: React.FC = () => {
  const m = useMemo(
    () => ({
      wall: M("#9cbfa8", 0.9),
      floor: new THREE.MeshStandardMaterial({
        map: canvasTex("ladrilho", 256, 256, (c) => {
          for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
            c.fillStyle = (x + y) % 2 ? "#e9e3d6" : "#3b3b40";
            c.fillRect(x * 32, y * 32, 32, 32);
          }
        }, [6, 6]),
        roughness: 0.5,
      }),
      metal: M("#c9ccd1", 0.25, {metalness: 0.8}),
      wood: M("#6b4a2a", 0.6),
      paper: M("#fbf6e8", 0.9),
      chart: new THREE.MeshStandardMaterial({
        map: canvasTex("snellen", 256, 384, (c) => {
          c.fillStyle = "#fbf8ef";
          c.fillRect(0, 0, 256, 384);
          c.fillStyle = "#111";
          const rows = ["E", "F P", "T O Z", "L P E D", "P E C F D"];
          rows.forEach((t, i) => {
            c.font = `bold ${70 - i * 12}px serif`;
            c.textAlign = "center";
            c.fillText(t, 128, 80 + i * 62);
          });
        }),
        roughness: 0.9,
      }),
    }),
    [],
  );
  return (
    <group>
      <Shell w={6} d={5} h={3} wall={m.wall} floor={m.floor} />
      <mesh position={[-1.6, 1.6, -2.48]} material={m.chart}>
        <planeGeometry args={[0.7, 1.05]} />
      </mesh>
      {/* balança */}
      <group position={[-0.45, 0, -1.6]}>
        <Box p={[0, 0.06, 0]} s={[0.5, 0.08, 0.5]} m={m.metal} />
        <Box p={[0, 0.9, -0.22]} s={[0.05, 1.7, 0.05]} m={m.metal} />
        <Box p={[0.15, 1.7, -0.22]} s={[0.4, 0.04, 0.04]} m={m.metal} />
      </group>
      {/* mesa do médico */}
      <group position={[1.3, 0, -1.4]}>
        <Box p={[0, 0.75, 0]} s={[1.4, 0.06, 0.7]} m={m.wood} />
        <Box p={[0, 0.37, -0.3]} s={[1.3, 0.72, 0.05]} m={m.wood} />
        <Box p={[-0.2, 0.785, 0.05]} s={[0.3, 0.005, 0.4]} m={m.paper} shadow={false} />
      </group>
    </group>
  );
};

/* ---------- convés do navio ---------- */
export const ShipDeck: React.FC<{t: number}> = ({t}) => {
  const m = useMemo(
    () => ({
      deck: M("#8a8f94", 0.8),
      rail: M("#e8e8e8", 0.5),
      hull: M("#4e5a63", 0.7),
      sea: new THREE.MeshStandardMaterial({color: "#2f6f9f", roughness: 0.25, metalness: 0.2}),
      foam: M("#eef6fb", 0.9),
      chimney: M("#3a3f45", 0.6),
    }),
    [],
  );
  return (
    <group>
      <SkyDome k="mar" c={["#6fa7d6", "#b8d8f0", "#e8f2f8"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5 + Math.sin(t * 0.8) * 0.05, 0]} material={m.sea}>
        <planeGeometry args={[120, 120]} />
      </mesh>
      <Box p={[0, -0.75, 0]} s={[8, 1.5, 22]} m={m.hull} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={m.deck} receiveShadow>
        <planeGeometry args={[8, 22]} />
      </mesh>
      {[-3.95, 3.95].map((x) => (
        <group key={x}>
          <Box p={[x, 1.0, 0]} s={[0.05, 0.05, 22]} m={m.rail} />
          <Box p={[x, 0.5, 0]} s={[0.04, 0.04, 22]} m={m.rail} />
          {Array.from({length: 22}, (_, i) => (
            <Box key={i} p={[x, 0.5, -10.5 + i]} s={[0.04, 1.0, 0.04]} m={m.rail} />
          ))}
        </group>
      ))}
      <mesh position={[0, 2.5, -6]} material={m.chimney} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 5, 16]} />
      </mesh>
    </group>
  );
};

/* ---------- montanha nevada (dia / noite / madrugada) ---------- */
type SnowVariant = "day" | "night" | "dawn";
const SNOWSKY: Record<SnowVariant, [string, string, string]> = {
  day: ["#9aa9b8", "#cfd8e0", "#eef2f5"],
  night: ["#05080f", "#101a2c", "#24334a"],
  dawn: ["#1f2a4a", "#6a5a8a", "#e8a88a"],
};

export const Snowfield: React.FC<{variant: SnowVariant; seed?: number; trench?: boolean}> = ({variant, seed = 1, trench}) => {
  const m = useMemo(
    () => ({
      snow: new THREE.MeshStandardMaterial({color: variant === "night" ? "#b9c6d8" : "#f4f7fb", roughness: 0.95}),
      trunk: M("#4a3626", 0.9),
      pine: M(variant === "night" ? "#1f3a33" : "#2f5a48", 0.9),
      cap: M("#f6f8fb", 0.95),
      rock: M("#6d6f73", 0.95, {flatShading: true}),
      bag: M("#8a7a55", 0.95),
      log: M("#5a4028", 0.9),
    }),
    [variant],
  );
  // relevo: plano com ondulações determinísticas
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 60, 80, 80);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const d = Math.max(0, -y - 4); // sobe ao fundo (morros)
      const h = Math.sin(x * 0.35 + seed) * 0.25 + Math.cos(y * 0.4 + seed * 2) * 0.2 + d * d * 0.06 + Math.sin(x * 0.12) * d * 0.25;
      pos.setZ(i, h * (Math.abs(x) < 3 && y > -3 && y < 4 ? 0.15 : 1));
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  const trees = useMemo(() => {
    const r = rng(seed * 13 + 5);
    return Array.from({length: 26}, () => {
      const x = (r() - 0.5) * 26;
      const z = -4 - r() * 14;
      return {x: Math.abs(x) < 1.5 ? x + 3 : x, z, s: 0.7 + r() * 0.8};
    });
  }, [seed]);
  const rocks = useMemo(() => {
    const r = rng(seed * 7 + 2);
    return Array.from({length: 10}, () => ({x: (r() - 0.5) * 14, z: -1 - r() * 8, s: 0.3 + r() * 0.7, ry: r() * 6}));
  }, [seed]);
  return (
    <group>
      <SkyDome k={"snow_" + variant} c={SNOWSKY[variant]} />
      <mesh geometry={ground} rotation={[-Math.PI / 2, 0, 0]} material={m.snow} receiveShadow />
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.5, 0]} material={m.trunk}>
            <cylinderGeometry args={[0.08, 0.1, 1, 6]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <group key={k}>
              <mesh position={[0, 1.0 + k * 0.55, 0]} material={m.pine} castShadow>
                <coneGeometry args={[0.75 - k * 0.2, 0.9, 8]} />
              </mesh>
              <mesh position={[0, 1.18 + k * 0.55, 0]} material={m.cap}>
                <coneGeometry args={[0.5 - k * 0.14, 0.5, 8]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.3, r.z]} rotation={[0, r.ry, 0]} scale={[r.s * 1.3, r.s * 0.8, r.s]} material={m.rock} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
        </mesh>
      ))}
      {trench && <Sandbags m={m} />}
    </group>
  );
};

/** muro de sacos de areia + troncos (a trincheira), em z = -0.6, de x -3 a 3 */
const Sandbags: React.FC<{m: {bag: THREE.Material; log: THREE.Material; cap: THREE.Material}}> = ({m}) => (
  <group position={[0, 0, -0.6]}>
    {[0, 1, 2].map((row) =>
      Array.from({length: 12}, (_, i) => (
        <mesh key={row + "_" + i} position={[-3 + i * 0.52 + (row % 2) * 0.26, 0.14 + row * 0.24, 0]} scale={[0.27, 0.13, 0.2]} material={m.bag} castShadow receiveShadow>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      )),
    )}
    {Array.from({length: 12}, (_, i) => (
      <mesh key={"c" + i} position={[-3 + i * 0.52, 0.78, -0.02]} scale={[0.25, 0.05, 0.18]} material={m.cap}>
        <sphereGeometry args={[1, 10, 6]} />
      </mesh>
    ))}
  </group>
);

export const SnowLights: React.FC<{variant: SnowVariant}> = ({variant}) => {
  const c = {
    day: {hemi: ["#dfe8f2", "#7a8290", 1.0], sun: "#f2f4ff", si: 1.6, pos: [3, 6, 4]},
    night: {hemi: ["#6a84b8", "#101820", 0.75], sun: "#9db4ff", si: 0.7, pos: [-3, 6, 2]},
    dawn: {hemi: ["#a08ac0", "#2a2030", 0.6], sun: "#ffb48a", si: 1.4, pos: [-6, 2, -4]},
  }[variant];
  return (
    <>
      <hemisphereLight args={[c.hemi[0] as string, c.hemi[1] as string, c.hemi[2] as number]} />
      <directionalLight position={c.pos as V3} intensity={c.si} color={c.sun} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    </>
  );
};

/* ---------- neve caindo ---------- */
const flakeTex = () =>
  canvasTex("flake", 32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });

export const Snowfall: React.FC<{t: number; center: V3; count?: number; size?: number; speed?: number; wind?: number}> = ({t, center, count = 600, size = 0.035, speed = 0.8, wind = 0.3}) => {
  const seeds = useMemo(() => {
    const r = rng(99);
    return Array.from({length: count}, () => [r(), r(), r(), r()]);
  }, [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const mat = useMemo(() => new THREE.PointsMaterial({map: flakeTex(), size, transparent: true, depthWrite: false, color: "#ffffff"}), [size]);
  const arr = geo.attributes.position.array as Float32Array;
  const H = 5;
  seeds.forEach(([a, b, c, d], i) => {
    const y = H - (((t * speed * (0.7 + d * 0.6)) / H + a) % 1) * H;
    arr[i * 3] = center[0] + (b - 0.5) * 8 + Math.sin(t * 1.3 + d * 9) * 0.15 + (H - y) * wind * 0.2;
    arr[i * 3 + 1] = center[1] + y - 0.5;
    arr[i * 3 + 2] = center[2] + (c - 0.5) * 8;
  });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

/* ---------- avião ao longe (silhueta) ---------- */
export const Plane: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => {
  const m = useMemo(() => M("#2b2f36", 0.6), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={m}>
        <capsuleGeometry args={[0.18, 1.6, 6, 10]} />
      </mesh>
      <Box p={[0.1, 0, 0]} s={[0.5, 0.05, 2.6]} m={m} shadow={false} />
      <Box p={[-0.85, 0.15, 0]} s={[0.3, 0.04, 0.9]} m={m} shadow={false} />
      <Box p={[-0.85, 0.3, 0]} s={[0.25, 0.35, 0.04]} m={m} shadow={false} />
    </group>
  );
};
