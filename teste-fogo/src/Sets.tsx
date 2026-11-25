import React, {useMemo} from "react";
import * as THREE from "three";
import {canvasTex, woodTex, rng} from "./util";

const M = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, ...extra});
type V3 = [number, number, number];

export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; shadow?: boolean}> = ({p, s, m, r, shadow = true}) => (
  <mesh position={p} rotation={r} material={m} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);

/* ---------- texturas ---------- */
const tiles = (key: string, base: string, grout: string, n: number, rep: [number, number]) =>
  canvasTex(key, 512, 512, (c, r) => {
    c.fillStyle = grout;
    c.fillRect(0, 0, 512, 512);
    const s = 512 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        c.fillStyle = base;
        c.globalAlpha = 0.9 + r() * 0.1;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      }
    c.globalAlpha = 1;
  }, rep);

const brick = () =>
  canvasTex("brick", 512, 512, (c, r) => {
    c.fillStyle = "#8a6a5a";
    c.fillRect(0, 0, 512, 512);
    const bh = 32, bw = 96;
    for (let y = 0; y < 512 / bh; y++)
      for (let x = -1; x < 512 / bw + 1; x++) {
        const v = 0.85 + r() * 0.25;
        c.fillStyle = `rgb(${178 * v},${98 * v},${72 * v})`;
        c.fillRect(x * bw + (y % 2) * (bw / 2) + 3, y * bh + 3, bw - 6, bh - 6);
      }
  }, [3, 3]);

const chalkboard = () =>
  canvasTex("chalk", 1024, 512, (c) => {
    c.fillStyle = "#24453a";
    c.fillRect(0, 0, 1024, 512);
    c.strokeStyle = "rgba(255,255,255,0.85)";
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.lineWidth = 5;
    // triângulo do fogo
    c.beginPath();
    c.moveTo(260, 90);
    c.lineTo(110, 380);
    c.lineTo(410, 380);
    c.closePath();
    c.stroke();
    c.font = "bold 34px sans-serif";
    c.fillText("CALOR", 40, 230);
    c.fillText("O₂", 360, 230);
    c.fillText("COMBUSTÍVEL", 140, 440);
    c.font = "bold 44px sans-serif";
    c.fillText("PROVA DE QUÍMICA", 520, 120);
    c.font = "32px sans-serif";
    c.fillText("C + O₂ → CO₂ + calor", 540, 220);
    c.fillText("ignição do algodão ≈ 400 °C", 540, 290);
    c.fillText("chama ≈ 1000 °C", 540, 360);
  });

const skyTex = (key: string, top: string, mid: string, bottom: string) =>
  canvasTex(key, 64, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 512);
  });

const asphalt = () =>
  canvasTex("asphalt", 512, 512, (c, r) => {
    c.fillStyle = "#4a4d55";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
      c.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${r() * 0.08})`;
      c.fillRect(r() * 512, r() * 512, 2, 2);
    }
    c.fillStyle = "#e8e2c8";
    for (let y = 0; y < 512; y += 128) c.fillRect(248, y + 20, 16, 70);
  }, [1, 6]);

const grassTex = () =>
  canvasTex("grass", 512, 512, (c, r) => {
    c.fillStyle = "#5f9a45";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const v = 0.75 + r() * 0.5;
      c.fillStyle = `rgba(${70 * v},${140 * v},${50 * v},0.6)`;
      c.fillRect(r() * 512, r() * 512, 2, 5 + r() * 6);
    }
  }, [8, 8]);

/* ---------- casca de cômodo genérico ---------- */
export const Shell: React.FC<{w: number; d: number; h: number; wall: THREE.Material; floor: THREE.Material; back?: React.ReactNode}> = ({w, d, h, wall, floor}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
      <planeGeometry args={[w, d]} />
    </mesh>
    <mesh position={[0, h / 2, -d / 2]} material={wall} receiveShadow>
      <planeGeometry args={[w, h]} />
    </mesh>
    <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wall} receiveShadow>
      <planeGeometry args={[d, h]} />
    </mesh>
    <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wall} receiveShadow>
      <planeGeometry args={[d, h]} />
    </mesh>
    <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={wall}>
      <planeGeometry args={[w, d]} />
    </mesh>
  </group>
);

export const InteriorLights: React.FC<{color?: string; key1?: V3; power?: number; fill?: string}> = ({color = "#ffe6c8", key1 = [1.5, 2.8, 2.5], power = 1, fill = "#ffffff"}) => (
  <>
    <hemisphereLight args={[fill, "#4a3828", 0.55 * power]} />
    <directionalLight position={key1} intensity={2.4 * power} color={color} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    <pointLight position={[0, 2.5, 2]} intensity={1.6 * power} distance={8} decay={1.5} color={color} />
  </>
);

/* ---------- cozinha ---------- */
export const Kitchen: React.FC = () => {
  const m = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({map: tiles("ktiles", "#f2efe6", "#c9c3b4", 10, [4, 2]), roughness: 0.4}),
      floor: new THREE.MeshStandardMaterial({map: tiles("kfloor", "#d9c39a", "#8f7a58", 8, [4, 4]), roughness: 0.6}),
      cab: M("#3f7f74", 0.6),
      top: M("#e9e4da", 0.35),
      steel: M("#b8bec6", 0.25, {metalness: 0.7}),
      dark: M("#2b2b30", 0.5),
      fridge: M("#eef2f4", 0.3),
      sky: new THREE.MeshBasicMaterial({map: skyTex("ksky", "#9fd0ff", "#d8ecff", "#b9e3a0")}),
      wood: new THREE.MeshStandardMaterial({map: woodTex("kwood", [130, 80, 48], 4, [1, 1]), roughness: 0.6}),
    }),
    [],
  );
  return (
    <group>
      <Shell w={6} d={5} h={3} wall={m.wall} floor={m.floor} />
      {/* bancada ao fundo */}
      <Box p={[0, 0.45, -2.2]} s={[4.5, 0.9, 0.6]} m={m.cab} />
      <Box p={[0, 0.92, -2.2]} s={[4.6, 0.05, 0.64]} m={m.top} />
      <Box p={[0, 2.1, -2.32]} s={[4.5, 0.7, 0.35]} m={m.cab} />
      {[-1.6, -0.5, 0.6, 1.7].map((x) => (
        <Box key={x} p={[x, 0.5, -1.89]} s={[0.04, 0.04, 0.02]} m={m.steel} shadow={false} />
      ))}
      {/* fogão */}
      <Box p={[1.2, 0.955, -2.2]} s={[0.8, 0.02, 0.5]} m={m.dark} />
      {/* janela */}
      <mesh position={[-1, 1.75, -2.49]} material={m.sky}>
        <planeGeometry args={[1.2, 0.8]} />
      </mesh>
      <Box p={[-1, 1.75, -2.47]} s={[1.3, 0.05, 0.05]} m={m.wood} />
      <Box p={[-1, 2.17, -2.47]} s={[1.3, 0.06, 0.06]} m={m.wood} />
      <Box p={[-1, 1.33, -2.47]} s={[1.3, 0.06, 0.06]} m={m.wood} />
      {/* geladeira */}
      <Box p={[2.6, 0.95, -2.0]} s={[0.75, 1.9, 0.7]} m={m.fridge} />
      <Box p={[2.25, 1.3, -1.64]} s={[0.03, 0.4, 0.03]} m={m.steel} />
      {/* mesa no meio */}
      <Box p={[-0.6, 0.74, 0.1]} s={[1.2, 0.05, 0.8]} m={m.wood} />
      {[
        [-1.1, -0.2],
        [-0.1, -0.2],
        [-1.1, 0.4],
        [-0.1, 0.4],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={m.wood} />
      ))}
    </group>
  );
};

/** Panela com pipoca estourando (t em segundos desde que começou) */
export const PopcornPan: React.FC<{t: number; heat: number}> = ({t, heat}) => {
  const m = useMemo(() => ({pan: M("#3a3a40", 0.35, {metalness: 0.6}), handle: M("#1d1d20", 0.6), corn: M("#fff6dc", 0.9), kernel: M("#f2c14e", 0.6)}), []);
  const pops = useMemo(() => {
    const r = rng(77);
    return Array.from({length: 45}, () => ({at: 0.4 + r() * 2.2, x: (r() - 0.5) * 0.22, z: (r() - 0.5) * 0.22, vx: (r() - 0.5) * 0.6, vz: (r() - 0.5) * 0.6, vy: 1.2 + r() * 1.3, s: 0.025 + r() * 0.015}));
  }, []);
  return (
    <group>
      <mesh material={m.pan} castShadow>
        <cylinderGeometry args={[0.17, 0.14, 0.09, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.pan}>
        <circleGeometry args={[0.14, 24]} />
      </mesh>
      <Box p={[0.32, 0.02, 0]} s={[0.3, 0.03, 0.05]} m={m.handle} />
      {pops.map((p, i) => {
        const k = t * (0.6 + heat * 0.8) - p.at;
        if (k < 0) {
          return (
            <mesh key={i} position={[p.x * 0.6, -0.03, p.z * 0.6]} material={m.kernel}>
              <sphereGeometry args={[0.01, 6, 5]} />
            </mesh>
          );
        }
        // salto balístico, depois repousa dentro/ao redor da panela
        const tt = Math.min(k, (2 * p.vy) / 4.5);
        const y = Math.max(-0.02, p.vy * tt - 2.25 * tt * tt);
        return (
          <mesh key={i} position={[p.x + p.vx * tt * 0.4, y, p.z + p.vz * tt * 0.4]} rotation={[k * 6, k * 4, 0]} scale={Math.min(1, k * 8)} material={m.corn}>
            <icosahedronGeometry args={[p.s, 0]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- banheiro ---------- */
export const Bathroom: React.FC = () => {
  const m = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({map: tiles("btiles", "#8fc4d9", "#e8f2f5", 12, [5, 3]), roughness: 0.25}),
      floor: new THREE.MeshStandardMaterial({map: tiles("bfloor", "#e9eef0", "#9aa7ad", 8, [4, 4]), roughness: 0.4}),
      chrome: M("#d6dde3", 0.15, {metalness: 0.9}),
      white: M("#f5f7f8", 0.3),
      glass: new THREE.MeshStandardMaterial({color: "#dff3ff", roughness: 0.05, transparent: true, opacity: 0.18}),
    }),
    [],
  );
  return (
    <group>
      <Shell w={4} d={4} h={2.8} wall={m.wall} floor={m.floor} />
      {/* chuveiro */}
      <Box p={[0, 2.3, -1.85]} s={[0.04, 0.04, 0.35]} m={m.chrome} />
      <mesh position={[0, 2.25, -1.65]} rotation={[0.3, 0, 0]} material={m.chrome}>
        <cylinderGeometry args={[0.12, 0.08, 0.06, 24]} />
      </mesh>
      <mesh position={[0.35, 1.2, -1.97]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome}>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
      </mesh>
      {/* box de vidro */}
      <mesh position={[1.0, 1.1, -0.9]} rotation={[0, Math.PI / 2, 0]} material={m.glass}>
        <planeGeometry args={[2.2, 2.2]} />
      </mesh>
      {/* pia e espelho */}
      <Box p={[-1.5, 0.85, -1.75]} s={[0.7, 0.12, 0.45]} m={m.white} />
      <Box p={[-1.5, 1.6, -1.98]} s={[0.6, 0.8, 0.02]} m={m.chrome} />
    </group>
  );
};

/** Gotas do chuveiro que viram vapor perto do Caio */
export const ShowerDrops: React.FC<{t: number; origin: V3; evap: number}> = ({t, origin, evap}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: "#cfefff", roughness: 0.05, transparent: true, opacity: 0.75}), []);
  const drops = useMemo(() => {
    const r = rng(5);
    return Array.from({length: 60}, () => ({x: (r() - 0.5) * 0.4, z: (r() - 0.5) * 0.4, ph: r(), sp: 2.5 + r()}));
  }, []);
  return (
    <group position={origin}>
      {drops.map((d, i) => {
        const fall = ((t * d.sp * 0.5 + d.ph) % 1) * 1.4;
        if (fall > 1.4 - 0.9 * evap) return null; // evaporam antes de chegar
        return (
          <mesh key={i} position={[d.x * (1 + fall * 0.5), -fall, d.z * (1 + fall * 0.5)]} scale={[0.008, 0.035, 0.008]} material={m}>
            <sphereGeometry args={[1, 6, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- sala de aula ---------- */
export const Desk: React.FC<{p: V3; m: {wood: THREE.Material; metal: THREE.Material}; paper?: THREE.Material}> = ({p, m, paper}) => (
  <group position={p}>
    <Box p={[0, 0.72, 0]} s={[0.75, 0.04, 0.5]} m={m.wood} />
    {[
      [-0.33, -0.2],
      [0.33, -0.2],
      [-0.33, 0.2],
      [0.33, 0.2],
    ].map(([x, z], i) => (
      <Box key={i} p={[x, 0.36, z]} s={[0.03, 0.72, 0.03]} m={m.metal} />
    ))}
    {paper && <Box p={[0.05, 0.745, 0.03]} s={[0.26, 0.004, 0.34]} m={paper} r={[0, 0.2, 0]} shadow={false} />}
  </group>
);

export const Classroom: React.FC = () => {
  const m = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({map: brick(), roughness: 0.9}),
      floor: new THREE.MeshStandardMaterial({map: woodTex("cfloor", [140, 88, 54], 10, [3, 3]), roughness: 0.65}),
      board: new THREE.MeshStandardMaterial({map: chalkboard(), roughness: 0.9}),
      frame: M("#5a3a22", 0.6),
      wood: new THREE.MeshStandardMaterial({map: woodTex("cdesk", [150, 100, 60], 3, [1, 1]), roughness: 0.6}),
      metal: M("#37404c", 0.4, {metalness: 0.5}),
      paper: M("#fbfaf4", 0.9),
      sky: new THREE.MeshBasicMaterial({map: skyTex("csky", "#a9d4ff", "#e6f2ff", "#a5d48a")}),
      clock: M("#f6f2ea", 0.5),
      dark: M("#222", 0.5),
    }),
    [],
  );
  return (
    <group>
      <Shell w={8} d={8} h={3.2} wall={m.wall} floor={m.floor} />
      {/* quadro-negro */}
      <Box p={[0, 1.65, -3.97]} s={[3.6, 1.6, 0.05]} m={m.frame} />
      <mesh position={[0, 1.65, -3.94]} material={m.board}>
        <planeGeometry args={[3.4, 1.45]} />
      </mesh>
      {/* relógio */}
      <mesh position={[2.6, 2.6, -3.95]} rotation={[Math.PI / 2, 0, 0]} material={m.clock}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
      </mesh>
      <Box p={[2.6, 2.66, -3.92]} s={[0.02, 0.14, 0.01]} m={m.dark} shadow={false} />
      <Box p={[2.66, 2.6, -3.92]} s={[0.12, 0.02, 0.01]} m={m.dark} shadow={false} />
      {/* janelas na lateral */}
      {[-2, 0.2, 2.4].map((z) => (
        <group key={z} position={[-3.98, 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={m.sky}>
            <planeGeometry args={[1.3, 1.2]} />
          </mesh>
          <Box p={[0, 0, 0.02]} s={[1.35, 0.05, 0.04]} m={m.frame} />
          <Box p={[0, 0, 0.02]} s={[0.05, 1.25, 0.04]} m={m.frame} />
        </group>
      ))}
      {/* fileiras de carteiras */}
      {[-1.6, 0, 1.6].map((x) =>
        [-1.6, -0.3, 1.0, 2.3].map((z) => <Desk key={x + "_" + z} p={[x, 0, z]} m={m} paper={m.paper} />),
      )}
      {/* mesa do professor */}
      <Box p={[1.8, 0.75, -3.0]} s={[1.4, 0.06, 0.7]} m={m.wood} />
      <Box p={[1.8, 0.37, -3.0]} s={[1.3, 0.72, 0.6]} m={m.frame} />
    </group>
  );
};

/* ---------- exterior: rua do colégio / quintal do churrasco ---------- */
type Variant = "winter" | "sunny" | "dusk";
const SKY: Record<Variant, [string, string, string]> = {
  winter: ["#8fa6c2", "#c9d6e3", "#e8eef3"],
  sunny: ["#4fa3f0", "#a8d6ff", "#e9f5ff"],
  dusk: ["#2b2350", "#a1507a", "#f2a65a"],
};

export const Exterior: React.FC<{variant: Variant; kind: "school" | "yard"}> = ({variant, kind}) => {
  const m = useMemo(
    () => ({
      sky: new THREE.MeshBasicMaterial({map: skyTex("sky_" + variant, ...SKY[variant]), side: THREE.BackSide, fog: false}),
      road: new THREE.MeshStandardMaterial({map: asphalt(), roughness: 0.9}),
      walk: M("#b9b4aa", 0.9),
      grass: new THREE.MeshStandardMaterial({map: grassTex(), roughness: 1, color: variant === "winter" ? "#b9c9b0" : "#ffffff"}),
      brick: new THREE.MeshStandardMaterial({map: brick(), roughness: 0.9}),
      trim: M("#efe6d6", 0.7),
      win: M(variant === "dusk" ? "#ffd27a" : "#7fa7c9", 0.2, {emissive: new THREE.Color(variant === "dusk" ? "#ffb347" : "#000"), emissiveIntensity: variant === "dusk" ? 0.8 : 0}),
      door: M("#6b3b24", 0.6),
      trunk: M("#6b4a30", 0.9),
      leaf: M(variant === "winter" ? "#7d8f74" : "#3f8a3c", 0.9),
      fence: new THREE.MeshStandardMaterial({map: woodTex("fence", [170, 120, 75], 6, [1, 1]), roughness: 0.8}),
      sign: M("#1f3d7a", 0.6),
    }),
    [variant],
  );
  const trees = useMemo(() => {
    const r = rng(kind === "school" ? 3 : 9);
    return Array.from({length: 9}, (_, i) => ({x: -9 + i * 2.3 + (r() - 0.5), z: -7 - r() * 3, s: 0.8 + r() * 0.6}));
  }, [kind]);
  return (
    <group>
      <mesh material={m.sky}>
        <sphereGeometry args={[30, 24, 16]} />
      </mesh>
      {kind === "school" ? (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]} material={m.road} receiveShadow>
            <planeGeometry args={[40, 4]} />
          </mesh>
          <Box p={[0, 0.06, -0.5]} s={[40, 0.12, 2]} m={m.walk} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -6]} material={m.grass} receiveShadow>
            <planeGeometry args={[40, 9]} />
          </mesh>
          {/* fachada do colégio */}
          <group position={[0, 0, -4.2]}>
            <Box p={[0, 2.2, 0]} s={[12, 4.4, 1]} m={m.brick} />
            <Box p={[0, 4.5, 0.05]} s={[12.2, 0.25, 1.1]} m={m.trim} />
            {[-4.5, -2.5, 2.5, 4.5].map((x) =>
              [1.4, 3.2].map((y) => (
                <group key={x + "_" + y}>
                  <Box p={[x, y, 0.51]} s={[1.1, 0.9, 0.04]} m={m.win} />
                  <Box p={[x, y - 0.5, 0.56]} s={[1.25, 0.08, 0.12]} m={m.trim} />
                </group>
              )),
            )}
            <Box p={[0, 1.1, 0.51]} s={[1.6, 2.2, 0.06]} m={m.door} />
            <Box p={[0, 2.6, 0.56]} s={[3.2, 0.5, 0.08]} m={m.sign} />
          </group>
        </>
      ) : (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.grass} receiveShadow>
            <planeGeometry args={[40, 30]} />
          </mesh>
          {Array.from({length: 30}, (_, i) => (
            <Box key={i} p={[-7.5 + i * 0.5, 0.75, -3.5]} s={[0.4, 1.5, 0.06]} m={m.fence} />
          ))}
          <Box p={[0, 1.2, -3.45]} s={[15, 0.08, 0.06]} m={m.fence} />
          <Box p={[0, 0.4, -3.45]} s={[15, 0.08, 0.06]} m={m.fence} />
        </>
      )}
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.8, 0]} material={m.trunk} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.6, 8]} />
          </mesh>
          <mesh position={[0, 2.2, 0]} material={m.leaf} castShadow>
            <icosahedronGeometry args={[1.0, 1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const ExteriorLights: React.FC<{variant: Variant}> = ({variant}) => {
  const cfg = {
    winter: {hemi: ["#cfe0ff", "#5b6470", 0.9], sun: "#dfe9ff", si: 1.4, pos: [3, 6, 4]},
    sunny: {hemi: ["#cfe8ff", "#6b5a3a", 0.8], sun: "#fff1d6", si: 3.2, pos: [4, 7, 3]},
    dusk: {hemi: ["#8a6aa8", "#3a2430", 0.55], sun: "#ff9a55", si: 2.0, pos: [-6, 2.5, 2]},
  }[variant];
  return (
    <>
      <hemisphereLight args={[cfg.hemi[0] as string, cfg.hemi[1] as string, cfg.hemi[2] as number]} />
      <directionalLight position={cfg.pos as V3} intensity={cfg.si} color={cfg.sun} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    </>
  );
};

/** Churrasqueira com brasas */
export const Grill: React.FC<{t: number}> = ({t}) => {
  const m = useMemo(
    () => ({
      body: M("#2b2b2e", 0.5, {metalness: 0.4}),
      grate: M("#888", 0.3, {metalness: 0.8}),
      coal: new THREE.MeshStandardMaterial({color: "#2a1208", emissive: new THREE.Color("#ff4a10"), emissiveIntensity: 1.5}),
      meat: M("#8a3b22", 0.6),
    }),
    [],
  );
  m.coal.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 9) * Math.sin(t * 3.3);
  return (
    <group>
      <Box p={[0, 0.8, 0]} s={[1.2, 0.3, 0.55]} m={m.body} />
      {[-0.5, 0.5].map((x) => (
        <Box key={x} p={[x, 0.33, 0]} s={[0.06, 0.66, 0.06]} m={m.body} />
      ))}
      <Box p={[0, 0.93, 0]} s={[1.1, 0.03, 0.47]} m={m.coal} shadow={false} />
      {Array.from({length: 9}, (_, i) => (
        <Box key={i} p={[-0.48 + i * 0.12, 1.0, 0]} s={[0.012, 0.012, 0.5]} m={m.grate} shadow={false} />
      ))}
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x, 1.04, 0]} rotation={[0, 0, Math.PI / 2]} material={m.meat} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 6, 10]} />
        </mesh>
      ))}
    </group>
  );
};
