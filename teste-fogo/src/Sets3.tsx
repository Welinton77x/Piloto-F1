import React, {useMemo} from "react";
import * as THREE from "three";
import {canvasTex, woodTex, rng} from "./util";
import {Box, Shell} from "./Sets";
import {Steam} from "./Fire";

type V3 = [number, number, number];
const M = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, ...extra});

const skyTex = (key: string, top: string, mid: string, bottom: string) =>
  canvasTex(key, 64, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 512);
  });
const Sky: React.FC<{k: string; c: [string, string, string]}> = ({k, c}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: skyTex(k, ...c), side: THREE.BackSide, fog: false}), [k, c]);
  return (
    <mesh material={m}>
      <sphereGeometry args={[40, 24, 16]} />
    </mesh>
  );
};

const brick = (key: string, base: [number, number, number]) =>
  canvasTex(key, 512, 512, (c, r) => {
    c.fillStyle = "#6a5a50";
    c.fillRect(0, 0, 512, 512);
    const bh = 26, bw = 80;
    for (let y = 0; y < 512 / bh; y++)
      for (let x = -1; x < 512 / bw + 1; x++) {
        const v = 0.8 + r() * 0.3;
        c.fillStyle = `rgb(${base[0] * v},${base[1] * v},${base[2] * v})`;
        c.fillRect(x * bw + (y % 2) * (bw / 2) + 2, y * bh + 2, bw - 4, bh - 4);
      }
  }, [2, 3]);

const cobble = () =>
  canvasTex("cobble2", 512, 512, (c, r) => {
    c.fillStyle = "#3a3632";
    c.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const v = 0.7 + r() * 0.4;
        c.fillStyle = `rgb(${110 * v},${102 * v},${92 * v})`;
        c.beginPath();
        c.ellipse(x * 32 + (y % 2) * 16 + 16, y * 32 + 16, 13, 12, 0, 0, Math.PI * 2);
        c.fill();
      }
  }, [12, 12]);

/* ---------- farmácia de hoje ---------- */
export const Pharmacy: React.FC<{t: number}> = ({t}) => {
  const m = useMemo(
    () => ({
      walk: new THREE.MeshStandardMaterial({
        map: canvasTex("calcada", 256, 256, (c) => {
          c.fillStyle = "#c9c6c0";
          c.fillRect(0, 0, 256, 256);
          c.strokeStyle = "#a9a59e";
          c.lineWidth = 3;
          for (let i = 0; i <= 256; i += 64) {
            c.beginPath();
            c.moveTo(i, 0);
            c.lineTo(i, 256);
            c.moveTo(0, i);
            c.lineTo(256, i);
            c.stroke();
          }
        }, [10, 10]),
        roughness: 0.9,
      }),
      road: M("#3c3f45", 0.9),
      wall: M("#f2f2ef", 0.7),
      glass: new THREE.MeshStandardMaterial({color: "#bfe3f2", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45}),
      frame: M("#2f3a40", 0.4, {metalness: 0.6}),
      green: new THREE.MeshStandardMaterial({color: "#18b45a", emissive: new THREE.Color("#18d46a"), emissiveIntensity: 1.2}),
      sign: new THREE.MeshStandardMaterial({
        map: canvasTex("farmacia", 512, 128, (c) => {
          c.fillStyle = "#0f7a3d";
          c.fillRect(0, 0, 512, 128);
          c.fillStyle = "#ffffff";
          c.font = "bold 78px sans-serif";
          c.textAlign = "center";
          c.fillText("FARMÁCIA", 256, 92);
        }),
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.25,
      }),
      shelf: M("#d9d4cc", 0.6),
      prod: ["#e05050", "#4a8ad8", "#f0c040", "#60c080"].map((c) => M(c, 0.6)),
    }),
    [],
  );
  const pulse = 1 + 0.15 * Math.sin(t * 4);
  m.green.emissiveIntensity = 1.2 * pulse;
  return (
    <group>
      <Sky k="ceu_hoje" c={["#5aa0e6", "#a8d4f6", "#fff0dc"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.walk} receiveShadow>
        <planeGeometry args={[30, 12]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 7]} material={m.road} receiveShadow>
        <planeGeometry args={[30, 6]} />
      </mesh>
      {/* fachada */}
      <Box p={[0, 1.8, -2.6]} s={[8, 3.6, 0.3]} m={m.wall} />
      <Box p={[0, 3.3, -2.4]} s={[4.6, 0.6, 0.1]} m={m.sign} />
      {/* cruz verde */}
      <group position={[3.0, 3.1, -2.2]}>
        <Box p={[0, 0, 0]} s={[0.25, 0.75, 0.08]} m={m.green} shadow={false} />
        <Box p={[0, 0, 0]} s={[0.75, 0.25, 0.08]} m={m.green} shadow={false} />
      </group>
      {/* vitrines e porta de vidro */}
      {[-2.6, 2.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.3, -2.43]} material={m.glass}>
            <planeGeometry args={[2.2, 1.9]} />
          </mesh>
          {[0.7, 1.3, 1.9].map((y, i) => (
            <group key={y}>
              <Box p={[x, y, -2.7]} s={[2.0, 0.04, 0.3]} m={m.shelf} />
              {[-0.7, -0.35, 0, 0.35, 0.7].map((dx, k) => (
                <Box key={k} p={[x + dx, y + 0.12, -2.7]} s={[0.16, 0.2, 0.12]} m={m.prod[(i + k) % 4]} />
              ))}
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.15, -2.43]} material={m.glass}>
        <planeGeometry args={[1.4, 2.3]} />
      </mesh>
      <Box p={[0, 2.33, -2.42]} s={[1.5, 0.06, 0.06]} m={m.frame} />
      <Box p={[-0.72, 1.15, -2.42]} s={[0.06, 2.3, 0.06]} m={m.frame} />
      <Box p={[0.72, 1.15, -2.42]} s={[0.06, 2.3, 0.06]} m={m.frame} />
      <Box p={[0, 1.15, -2.42]} s={[0.03, 2.3, 0.05]} m={m.frame} />
    </group>
  );
};

/** sacolinha de farmácia */
export const Bag: React.FC = () => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: "#f4f4f2", roughness: 0.6, side: THREE.DoubleSide}), []);
  const g = useMemo(() => new THREE.MeshStandardMaterial({color: "#18b45a", roughness: 0.6}), []);
  return (
    <group>
      <mesh position={[0, -0.13, 0]} material={m} castShadow>
        <boxGeometry args={[0.16, 0.2, 0.08]} />
      </mesh>
      <mesh position={[0, -0.13, 0.042]} material={g}>
        <planeGeometry args={[0.06, 0.06]} />
      </mesh>
      <mesh position={[0, -0.01, 0]} rotation={[0, 0, Math.PI / 2]} material={m}>
        <torusGeometry args={[0.04, 0.006, 6, 12, Math.PI]} />
      </mesh>
    </group>
  );
};

/** círculo de luz no chão (portal) */
export const Portal: React.FC<{t: number; power: number; p?: V3}> = ({t, power, p = [0, 0, 0]}) => {
  const ring = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(1.1, 1.3, 1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), []);
  const disk = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: canvasTex("portal", 256, 256, (c) => {
          const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
          g.addColorStop(0, "rgba(230,250,255,1)");
          g.addColorStop(0.5, "rgba(120,210,255,0.6)");
          g.addColorStop(1, "rgba(60,140,255,0)");
          c.fillStyle = g;
          c.fillRect(0, 0, 256, 256);
          c.strokeStyle = "rgba(255,255,255,0.9)";
          c.lineWidth = 4;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            c.beginPath();
            c.moveTo(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80);
            c.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
            c.stroke();
          }
        }),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const beam = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: canvasTex("feixe", 64, 256, (c) => {
          const g = c.createLinearGradient(0, 256, 0, 0);
          g.addColorStop(0, "rgba(200,240,255,0.9)");
          g.addColorStop(1, "rgba(120,200,255,0)");
          c.fillStyle = g;
          c.fillRect(0, 0, 64, 256);
        }),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  if (power <= 0.001) return null;
  ring.opacity = power;
  disk.opacity = power;
  beam.opacity = Math.max(0, power - 0.5) * 0.7;
  return (
    <group position={p}>
      <mesh rotation={[-Math.PI / 2, 0, t * 1.5]} position={[0, 0.01, 0]} material={disk} scale={power}>
        <planeGeometry args={[1.4, 1.4]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={ring} scale={power}>
        <torusGeometry args={[0.62, 0.025, 8, 48]} />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={beam}>
        <cylinderGeometry args={[0.6, 0.62, 3.2, 24, 1, true]} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} color="#8fd8ff" intensity={2.5 * power} distance={3} />
    </group>
  );
};

/* ---------- vitrine que pode estourar ---------- */
export const Shards: React.FC<{t: number; origin: V3; count?: number; spread?: V3; seed?: number; size?: number; speed?: number}> = ({t, origin, count = 40, spread = [1.2, 1.0, 0.1], seed = 4, size = 1, speed = 1}) => {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: count}, () => ({x: (r() - 0.5) * spread[0], y: (r() - 0.5) * spread[1], vx: (r() - 0.5) * 2.2 * speed, vy: r() * 1.8 * speed, vz: (0.8 + r() * 2.2) * speed, rx: r() * 10, ry: r() * 10, s: (0.04 + r() * 0.08) * size}));
  }, [count, seed, spread, size, speed]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: "#d8f2ff", roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: new THREE.Color("#9fd8ff"), emissiveIntensity: 0.08}), []);
  if (t < 0) return null;
  return (
    <group position={origin}>
      {items.map((it, i) => {
        const y = Math.max(-origin[1] + 0.01, it.y + it.vy * t - 4.9 * t * t);
        const ground = y <= -origin[1] + 0.02;
        const tt = ground ? t * 0.3 : t;
        return (
          <mesh key={i} position={[it.x + it.vx * tt, y, it.vz * tt]} rotation={ground ? [-Math.PI / 2, 0, it.rx] : [it.rx + t * 9, it.ry + t * 7, 0]} material={m} scale={it.s}>
            <circleGeometry args={[1, 3]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- Birmingham, 1880 ---------- */
export type BhamVariant = "day" | "night";
export const VITRINE: {p: V3; w: number; h: number} = {p: [0.9, 1.25, -3.42], w: 1.7, h: 1.4};

export const Birmingham: React.FC<{t: number; v?: BhamVariant; vitrineWobble?: number; vitrineBroken?: boolean; plaza?: boolean}> = ({t, v = "day", vitrineWobble = 0, vitrineBroken, plaza}) => {
  const night = v === "night";
  const m = useMemo(
    () => ({
      ground: new THREE.MeshStandardMaterial({map: cobble(), roughness: 0.85}),
      bricks: [brick("b1", [140, 70, 50]), brick("b2", [120, 62, 48]), brick("b3", [150, 90, 62])].map((map) => new THREE.MeshStandardMaterial({map, roughness: 0.9})),
      trim: M("#d8ccb4", 0.8),
      dark: M("#2a2420", 0.6),
      wood: M("#4a2e1e", 0.7),
      shop: new THREE.MeshStandardMaterial({color: "#ffe2a0", emissive: new THREE.Color("#ffb04a"), emissiveIntensity: night ? 0.9 : 0.35, roughness: 0.3}),
      glass: new THREE.MeshStandardMaterial({color: "#cfe6ef", roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.35}),
      win: new THREE.MeshStandardMaterial({color: "#2e3a44", emissive: new THREE.Color("#ffb04a"), emissiveIntensity: night ? 0.5 : 0, roughness: 0.3}),
      lamp: M("#1e1e22", 0.5),
      flame: new THREE.MeshStandardMaterial({color: "#fff0c0", emissive: new THREE.Color("#ffc060"), emissiveIntensity: night ? 2.5 : 0.8}),
      chim: M("#5a3a2a", 0.9),
      stall: M("#7a5a3a", 0.8),
      canvasA: M("#b03030", 0.9),
      canvasB: M("#e8e0c8", 0.9),
      signs: ["SAPATOS", "CHÁ", "RELÓGIOS", "PÃO", "BOTÕES"].map(
        (txt) =>
          new THREE.MeshStandardMaterial({
            map: canvasTex("placa_" + txt, 256, 64, (c) => {
              c.fillStyle = "#1f3a2a";
              c.fillRect(0, 0, 256, 64);
              c.strokeStyle = "#d8b45a";
              c.lineWidth = 4;
              c.strokeRect(4, 4, 248, 56);
              c.fillStyle = "#e8c870";
              c.font = "bold 36px serif";
              c.textAlign = "center";
              c.fillText(txt, 128, 45);
            }),
            roughness: 0.7,
          }),
      ),
    }),
    [night],
  );
  const xs = [-5.4, -3.2, -1.0, 1.2, 3.4, 5.6];
  return (
    <group>
      <Sky k={"bham_" + v} c={night ? ["#06070d", "#151826", "#2a2a38"] : ["#8a8270", "#b9ae94", "#d8caa8"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.ground} receiveShadow>
        <planeGeometry args={[40, 30]} />
      </mesh>
      {/* prédios de tijolo com lojas no térreo */}
      {xs.map((x, i) => {
        const h = 4.2 + (i % 3) * 0.8;
        const isVitrine = i === 3;
        return (
          <group key={i} position={[x, 0, -4.2]}>
            <Box p={[0, h / 2, 0]} s={[2.15, h, 1.5]} m={m.bricks[i % 3]} />
            <Box p={[0, h + 0.1, 0.05]} s={[2.25, 0.2, 1.62]} m={m.trim} />
            {/* chaminé + fumaça */}
            <Box p={[0.6, h + 0.6, 0]} s={[0.35, 1.0, 0.35]} m={m.chim} />
            <Steam t={t + i} origin={[0.6, h + 1.15, 0]} count={10} spread={0.12} rise={2.2} size={0.7} power={0.5} color={night ? "#444" : "#6a6258"} seed={60 + i} life={3} />
            {/* loja */}
            <Box p={[0, 1.6, 0.76]} s={[2.0, 0.42, 0.06]} m={m.wood} />
            <mesh position={[0, 1.6, 0.8]} material={m.signs[i % 5]}>
              <planeGeometry args={[1.6, 0.36]} />
            </mesh>
            {!isVitrine && <Box p={[0.35, 0.82, 0.76]} s={[1.1, 1.05, 0.04]} m={m.shop} />}
            <Box p={[-0.7, 0.75, 0.76]} s={[0.45, 1.5, 0.05]} m={m.wood} />
            {[2.6, 3.6].map((y) =>
              [-0.55, 0.55].map((wx) => (y < h - 0.4 ? <Box key={y + "_" + wx} p={[wx, y, 0.76]} s={[0.5, 0.7, 0.04]} m={m.win} /> : null)),
            )}
          </group>
        );
      })}
      {/* a vitrine (prédio 3) */}
      <group position={VITRINE.p}>
        <mesh position={[0, 0, -0.06]} material={m.shop}>
          <planeGeometry args={[VITRINE.w, VITRINE.h]} />
        </mesh>
        {!vitrineBroken && (
          <mesh material={m.glass} scale={[1 + vitrineWobble * 0.02 * Math.sin(t * 90), 1, 1]} position={[0, 0, vitrineWobble * 0.02 * Math.sin(t * 110)]}>
            <planeGeometry args={[VITRINE.w, VITRINE.h]} />
          </mesh>
        )}
        <Box p={[0, VITRINE.h / 2 + 0.03, 0.02]} s={[VITRINE.w + 0.1, 0.06, 0.06]} m={m.wood} />
        <Box p={[0, -VITRINE.h / 2 - 0.03, 0.02]} s={[VITRINE.w + 0.1, 0.06, 0.06]} m={m.wood} />
      </group>
      {/* lampiões a gás */}
      {[-4.3, 0.1, 4.5].map((x) => (
        <group key={x} position={[x, 0, -2.9]}>
          <Box p={[0, 1.4, 0]} s={[0.07, 2.8, 0.07]} m={m.lamp} />
          <Box p={[0, 2.9, 0]} s={[0.22, 0.3, 0.22]} m={m.lamp} />
          <mesh position={[0, 2.9, 0]} material={m.flame}>
            <sphereGeometry args={[0.08, 10, 8]} />
          </mesh>
          {night && <pointLight position={[0, 2.8, 0.2]} color="#ffb860" intensity={3} distance={6} decay={1.6} />}
        </group>
      ))}
      {/* fábricas ao fundo */}
      {[-7, -2, 4, 8].map((x, i) => (
        <group key={i} position={[x, 0, -14]}>
          <Box p={[0, 2.5, 0]} s={[3.5, 5, 2]} m={m.bricks[(i + 1) % 3]} />
          <mesh position={[0.8, 7, 0]} material={m.chim}>
            <cylinderGeometry args={[0.35, 0.5, 6, 10]} />
          </mesh>
          <Steam t={t + i * 2} origin={[0.8, 10.2, 0]} count={12} spread={0.3} rise={4} size={1.8} power={0.6} color={night ? "#333" : "#5a544c"} seed={80 + i} life={4} />
        </group>
      ))}
      {plaza && <Plaza t={t} m={m} />}
    </group>
  );
};

/* praça com barracas da feira (para a cena do sino) */
const Plaza: React.FC<{t: number; m: {stall: THREE.Material; canvasA: THREE.Material; canvasB: THREE.Material}}> = ({m}) => (
  <group>
    {[-2.4, -0.6, 1.4, 3.0].map((x, i) => (
      <group key={i} position={[x, 0, 0.2 - (i % 2) * 0.8]}>
        <Box p={[0, 0.45, 0]} s={[1.2, 0.9, 0.6]} m={m.stall} />
        {[-0.55, 0.55].map((dx) => (
          <Box key={dx} p={[dx, 1.1, 0.25]} s={[0.05, 1.3, 0.05]} m={m.stall} />
        ))}
        <Box p={[0, 1.8, 0.1]} s={[1.35, 0.06, 0.9]} m={i % 2 ? m.canvasA : m.canvasB} r={[0.25, 0, 0]} />
      </group>
    ))}
  </group>
);

/* ---------- torre do relógio com sino ---------- */
export const BellTower: React.FC<{t: number; swing: number; crack: number; p?: V3}> = ({t, swing, crack, p = [0, 0, -7]}) => {
  const m = useMemo(
    () => ({
      brick: new THREE.MeshStandardMaterial({map: brick("torre", [130, 75, 55]), roughness: 0.9}),
      trim: M("#d8ccb4", 0.8),
      bronze: new THREE.MeshStandardMaterial({color: "#b8863a", roughness: 0.35, metalness: 0.85}),
      crack: new THREE.MeshBasicMaterial({color: "#140a04"}),
      face: new THREE.MeshStandardMaterial({
        map: canvasTex("relogio_torre", 256, 256, (c) => {
          c.fillStyle = "#f2ead6";
          c.beginPath();
          c.arc(128, 128, 124, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#222";
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            c.fillRect(128 + Math.cos(a) * 100 - 4, 128 + Math.sin(a) * 100 - 4, 8, 8);
          }
          c.strokeStyle = "#222";
          c.lineWidth = 8;
          c.beginPath();
          c.moveTo(128, 128);
          c.lineTo(128, 50);
          c.moveTo(128, 128);
          c.lineTo(180, 140);
          c.stroke();
        }),
        emissive: new THREE.Color("#ffe6b0"),
        emissiveIntensity: 0.5,
      }),
    }),
    [],
  );
  const bellGeo = useMemo(() => {
    const pts = [
      [0, 0.62],
      [0.12, 0.6],
      [0.22, 0.5],
      [0.27, 0.3],
      [0.3, 0.1],
      [0.42, -0.05],
      [0.44, -0.1],
      [0.0, -0.1],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  const ang = swing * Math.sin(t * 5.2);
  return (
    <group position={p}>
      <Box p={[0, 4, 0]} s={[2.2, 8, 2.2]} m={m.brick} />
      <mesh position={[0, 6.6, 1.11]} material={m.face}>
        <circleGeometry args={[0.8, 32]} />
      </mesh>
      {/* campanário aberto */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([x, z], i) => (
        <Box key={i} p={[x * 0.95, 8.9, z * 0.95]} s={[0.3, 1.8, 0.3]} m={m.brick} />
      ))}
      <Box p={[0, 9.9, 0]} s={[2.4, 0.3, 2.4]} m={m.trim} />
      <mesh position={[0, 10.6, 0]} material={m.brick}>
        <coneGeometry args={[1.6, 1.2, 4]} />
      </mesh>
      <group position={[0, 9.6, 0]} rotation={[0, 0, ang]}>
        <mesh position={[0, -0.75, 0]} geometry={bellGeo} material={m.bronze} castShadow />
        {crack > 0 && (
          <mesh position={[0.05, -0.55, 0.36]} rotation={[0, 0, 0.3]} material={m.crack} scale={[0.02, 0.4 * crack, 1]}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        )}
      </group>
    </group>
  );
};

/* ---------- loja de relógios ---------- */
const clockFace = (k: string, bg: string) =>
  canvasTex("cf_" + k, 128, 128, (c) => {
    c.fillStyle = bg;
    c.beginPath();
    c.arc(64, 64, 62, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#5a3a1a";
    c.lineWidth = 6;
    c.stroke();
    c.fillStyle = "#222";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6);
    }
  });

export const ClockShop: React.FC<{t: number}> = ({t}) => {
  const m = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({map: woodTex("loja_parede", [110, 66, 40], 6, [3, 1]), roughness: 0.75}),
      floor: new THREE.MeshStandardMaterial({map: woodTex("loja_chao", [90, 56, 34], 8, [3, 3]), roughness: 0.7}),
      counter: M("#5a3a22", 0.6),
      brass: M("#c8a050", 0.3, {metalness: 0.8}),
      hand: M("#1a1a1a", 0.5),
      faces: ["#f4ead2", "#efe2c0", "#e8f0f0", "#f6efe0"].map((c, i) => new THREE.MeshStandardMaterial({map: clockFace(String(i), c), roughness: 0.6})),
      tall: M("#4a2a18", 0.6),
    }),
    [],
  );
  const clocks = useMemo(() => {
    const r = rng(31);
    return Array.from({length: 16}, (_, i) => ({x: -2.4 + (i % 8) * 0.68 + (r() - 0.5) * 0.1, y: 1.4 + Math.floor(i / 8) * 0.75 + (r() - 0.5) * 0.15, s: 0.18 + r() * 0.12, sp: 0.5 + r() * 2, f: i % 4}));
  }, []);
  const pend = Math.sin(t * Math.PI) * 0.35;
  return (
    <group>
      <Shell w={6} d={5} h={3} wall={m.wall} floor={m.floor} />
      {clocks.map((c, i) => (
        <group key={i} position={[c.x, c.y, -2.45]}>
          <mesh material={m.faces[c.f]}>
            <circleGeometry args={[c.s, 24]} />
          </mesh>
          <mesh position={[0, 0, 0.01]} rotation={[0, 0, -t * c.sp]} material={m.hand}>
            <planeGeometry args={[0.015, c.s * 1.6]} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[0, 0, -t * c.sp * 0.08]} material={m.hand}>
            <planeGeometry args={[0.025, c.s * 1.1]} />
          </mesh>
        </group>
      ))}
      {/* relógio de pêndulo */}
      <group position={[2.3, 0, -2.1]}>
        <Box p={[0, 1.1, 0]} s={[0.6, 2.2, 0.4]} m={m.tall} />
        <mesh position={[0, 1.85, 0.21]} material={m.faces[0]}>
          <circleGeometry args={[0.22, 24]} />
        </mesh>
        <group position={[0, 1.55, 0.22]} rotation={[0, 0, pend]}>
          <Box p={[0, -0.4, 0]} s={[0.02, 0.8, 0.02]} m={m.brass} shadow={false} />
          <mesh position={[0, -0.82, 0]} material={m.brass}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 20]} />
          </mesh>
        </group>
      </group>
      {/* balcão e mesa */}
      <Box p={[-1.6, 0.5, -1.2]} s={[1.6, 1.0, 0.6]} m={m.counter} />
      <Box p={[0.4, 0.74, -0.6]} s={[1.0, 0.05, 0.7]} m={m.counter} />
      {[
        [-0.05, -0.9],
        [0.85, -0.9],
        [-0.05, -0.3],
        [0.85, -0.3],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={m.counter} />
      ))}
    </group>
  );
};

/** taça de cristal que vibra (e pode estourar) */
export const WineGlass: React.FC<{t: number; p: V3; wobble: number; broken?: boolean; scale?: number}> = ({t, p, wobble, broken, scale = 1}) => {
  const geo = useMemo(() => {
    const pts = [
      [0, 0],
      [0.07, 0.003],
      [0.075, 0.01],
      [0.012, 0.02],
      [0.01, 0.12],
      [0.03, 0.14],
      [0.06, 0.18],
      [0.068, 0.24],
      [0.06, 0.29],
      [0.057, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color: "#e8f6ff", roughness: 0.02, metalness: 0.4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color("#b8e8ff"), emissiveIntensity: 0.15}), []);
  if (broken) return null;
  const w = wobble * 0.08 * Math.sin(t * 120);
  return (
    <group position={p} scale={scale}>
      <mesh geometry={geo} material={mat} scale={[1 + w, 1, 1 - w]} castShadow />
    </group>
  );
};

/* ---------- carruagem com dois cavalos ---------- */
const Horse: React.FC<{ph: number; m: {body: THREE.Material; dark: THREE.Material; mane: THREE.Material}}> = ({ph, m}) => {
  const leg = (x: number, z: number, o: number) => (
    <group position={[x, 0.95, z]} rotation={[0, 0, Math.sin(ph + o) * 0.6]}>
      <mesh position={[0, -0.45, 0]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.9, 8]} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh position={[0, 1.15 + Math.abs(Math.sin(ph)) * 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={m.body} castShadow>
        <capsuleGeometry args={[0.24, 0.9, 8, 16]} />
      </mesh>
      <mesh position={[0.62, 1.5, 0]} rotation={[0, 0, -0.75]} material={m.body} castShadow>
        <capsuleGeometry args={[0.12, 0.42, 6, 10]} />
      </mesh>
      <mesh position={[0.86, 1.68, 0]} rotation={[0, 0, -0.35]} scale={[1.6, 0.75, 0.7]} material={m.body} castShadow>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
      <mesh position={[0.6, 1.62, 0]} rotation={[0, 0, -0.75]} scale={[0.4, 1.4, 0.3]} material={m.mane}>
        <sphereGeometry args={[0.15, 8, 6]} />
      </mesh>
      <mesh position={[-0.68, 1.15, 0]} rotation={[0, 0, 0.9 + Math.sin(ph * 2) * 0.2]} material={m.mane}>
        <coneGeometry args={[0.06, 0.45, 6]} />
      </mesh>
      {leg(0.42, 0.13, 0)}
      {leg(0.42, -0.13, Math.PI * 0.5)}
      {leg(-0.42, 0.13, Math.PI)}
      {leg(-0.42, -0.13, Math.PI * 1.5)}
    </group>
  );
};

/** carruagem andando ao longo do eixo x (dir = +1 para a direita). ph = fase do galope */
export const Carriage: React.FC<{x: number; z?: number; ph: number; dust?: number; t: number}> = ({x, z = 0, ph, dust = 0, t}) => {
  const m = useMemo(
    () => ({
      body: M("#5a3a24", 0.7),
      body2: M("#3e2a1c", 0.7),
      dark: M("#2a1a10", 0.8),
      mane: M("#1a120c", 0.9),
      coach: M("#1d2a22", 0.5),
      gold: M("#c8a050", 0.3, {metalness: 0.8}),
      wheel: M("#3a2414", 0.7),
      win: M("#2a3540", 0.2),
    }),
    [],
  );
  const wheel = (wx: number, wz: number, r: number) => (
    <group position={[wx, r, wz]} rotation={[0, 0, -ph * 0.35]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.wheel} castShadow>
        <torusGeometry args={[r, 0.04, 8, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} rotation={[0, 0, (k / 4) * Math.PI]} material={m.wheel}>
          <boxGeometry args={[r * 2, 0.03, 0.03]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[x, 0, z]}>
      <group position={[1.9, 0, 0.35]}>
        <Horse ph={ph} m={{body: m.body, dark: m.dark, mane: m.mane}} />
      </group>
      <group position={[1.9, 0, -0.35]}>
        <Horse ph={ph + 0.7} m={{body: m.body2, dark: m.dark, mane: m.mane}} />
      </group>
      {/* cabine */}
      <Box p={[0, 1.35, 0]} s={[1.5, 1.1, 1.2]} m={m.coach} />
      <Box p={[0, 1.95, 0]} s={[1.6, 0.08, 1.3]} m={m.gold} />
      <Box p={[0, 1.4, 0.61]} s={[0.6, 0.5, 0.02]} m={m.win} />
      <Box p={[0.95, 1.0, 0]} s={[0.4, 0.08, 0.9]} m={m.body2} />
      <Box p={[1.4, 0.85, 0]} s={[1.0, 0.06, 0.06]} m={m.dark} />
      {wheel(0.55, 0.62, 0.42)}
      {wheel(0.55, -0.62, 0.42)}
      {wheel(-0.55, 0.62, 0.5)}
      {wheel(-0.55, -0.62, 0.5)}
      {dust > 0 && <Steam t={t} origin={[0.6, 0.1, 0]} count={18} spread={0.8} rise={0.6} size={0.7} power={dust} color="#b8a888" seed={70} life={1.6} />}
    </group>
  );
};

/* ---------- bolha do tempo ---------- */
const bubbleVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`;
const bubbleFrag = /* glsl */ `
uniform float uT; uniform float uP;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  float fr = pow(1.0 - abs(dot(vN, vV)), 2.2);
  float rings = 0.5 + 0.5*sin(vP.y*18.0 - uT*6.0);
  float glow = fr*0.75 + 0.03 + rings*fr*0.35;
  vec3 col = mix(vec3(0.25,0.55,1.0), vec3(0.75,0.95,1.0), fr);
  gl_FragColor = vec4(col*glow*uP, 1.0);
}`;
export const TimeBubble: React.FC<{t: number; power: number; r?: number; p?: V3}> = ({t, power, r = 1.1, p = [0, 1, 0]}) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: bubbleVert, fragmentShader: bubbleFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {uT: {value: 0}, uP: {value: 0}}}), []);
  if (power <= 0.001) return null;
  mat.uniforms.uT.value = t;
  mat.uniforms.uP.value = power;
  return (
    <mesh position={p} scale={r * (0.85 + 0.15 * power)} material={mat}>
      <sphereGeometry args={[1, 40, 28]} />
    </mesh>
  );
};

/* ---------- relógios na vitrine da relojoaria (prédio 2) ---------- */
export const ClockWindow: React.FC<{t: number; spin: number}> = ({t, spin}) => {
  const faces = useMemo(() => ["#f4ead2", "#efe2c0", "#e8f0f0"].map((c, i) => new THREE.MeshStandardMaterial({map: clockFace("v" + i, c), roughness: 0.6, emissive: new THREE.Color("#ffd890"), emissiveIntensity: 0.25})), []);
  const hand = useMemo(() => M("#111", 0.5), []);
  const items = [
    [-0.32, 1.05, 0.14],
    [0.0, 1.1, 0.17],
    [0.32, 1.02, 0.12],
    [-0.18, 0.62, 0.11],
    [0.2, 0.62, 0.13],
  ];
  return (
    <group position={[-0.65, 0, -3.39]}>
      {items.map(([x, y, s], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh material={faces[i % 3]}>
            <circleGeometry args={[s, 24]} />
          </mesh>
          <mesh position={[0, 0, 0.01]} rotation={[0, 0, -(t * (0.5 + i * 0.2) + spin * (8 + i * 3) * t)]} material={hand}>
            <planeGeometry args={[0.012, s * 1.6]} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[0, 0, -(t * 0.05 + spin * (1 + i) * t)]} material={hand}>
            <planeGeometry args={[0.02, s * 1.1]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
