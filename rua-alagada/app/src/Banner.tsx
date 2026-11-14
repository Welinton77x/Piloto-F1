// Banner do canal (2560×1440) no formato da arte do usuário, com o mascote dos vídeos:
// mundo de blocos, mascote apontando com chave inglesa, logo com lâmpada, slogan, casa moderna
// e placas "Inscreva-se / Ative o sininho / Deixa o like". Tudo o que importa fica na área segura 1546×423.
import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, random, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Mascot} from "./components/Mascot";
import type {MascotPose} from "./components/Mascot";
import {FONT} from "./components/Overlay";

export const SAFE = {w: 1546, h: 423};
const CAM = {pos: [0, 4.2, 22] as [number, number, number], look: [0, 1.9, 0] as [number, number, number], fov: 24};

const M: React.FC<{c: string; e?: string; ei?: number; o?: number}> = ({c, e = "#000000", ei = 0, o = 1}) => (
  <meshStandardMaterial color={c} roughness={0.75} emissive={e} emissiveIntensity={ei} transparent={o < 1} opacity={o} />
);
const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; e?: string; ei?: number; o?: number}> = ({p, s, c, e, ei, o}) => (
  <mesh position={p}>
    <boxGeometry args={s} />
    <M c={c} e={e} ei={ei} o={o} />
  </mesh>
);

/** chão de blocos de grama (instanciado), com variação de altura e tom */
const VoxelGround: React.FC = () => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const S = 0.5, nx = 110, nz = 70;
  const greens = useMemo(() => ["#5fbf3f", "#53b236", "#6ccb48", "#4aa52f"].map((c) => new THREE.Color(c)), []);
  useLayoutEffect(() => {
    const m = ref.current!;
    let k = 0;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const x = -27 + i * S, z = 12 - j * S;
        const h = 0; // chão plano e limpo
        tmp.position.set(x, -0.25 - S / 2 + h * 0.5, z);
        tmp.scale.set(S, S + h, S);
        tmp.updateMatrix();
        m.setMatrixAt(k, tmp.matrix);
        m.setColorAt(k++, greens[Math.floor(random(`c${i}-${j}`) * greens.length)]);
      }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, nx * nz]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
};

/** árvore de blocos */
const VoxelTree: React.FC<{p: [number, number, number]; s?: number; seed: string}> = ({p, s = 1, seed}) => {
  const leaves: [number, number, number][] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = 0; y <= 2; y++)
      for (let z = -1; z <= 1; z++) {
        if (y === 2 && Math.abs(x) + Math.abs(z) > 1) continue;
        if (random(`${seed}${x}${y}${z}`) < 0.12) continue;
        leaves.push([x * 0.42, 1.25 + y * 0.42, z * 0.42]);
      }
  return (
    <group position={p} scale={s}>
      {[0, 1, 2].map((i) => <Box key={i} p={[0, 0.2 + i * 0.42, 0]} s={[0.36, 0.42, 0.36]} c="#7a4f2c" />)}
      {leaves.map((l, i) => <Box key={i} p={l} s={[0.42, 0.42, 0.42]} c={i % 3 ? "#3f9b3a" : "#4aaa41"} />)}
    </group>
  );
};

/** nuvem de blocos */
const VoxelCloud: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {[[0, 0, 0, 1.6], [1.0, -0.15, 0, 1.2], [-1.0, -0.15, 0, 1.2], [0.4, 0.45, 0, 1.0], [-0.5, 0.35, 0, 0.8]].map(([x, y, z, w], i) => (
      <Box key={i} p={[x, y, z]} s={[w, w * 0.55, 0.8]} c={i < 3 ? "#ffffff" : "#f1f6fb"} />
    ))}
  </group>
);

/** casa moderna de dois andares */
const ModernHouse: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Box p={[0, 0.9, 0]} s={[3.2, 1.8, 2.4]} c="#f4f1ea" />
    <Box p={[0.2, 2.6, -0.1]} s={[3.6, 1.6, 2.6]} c="#f4f1ea" />
    <Box p={[0.2, 3.5, -0.1]} s={[3.9, 0.2, 2.9]} c="#3b3f47" />
    {/* painéis de madeira */}
    <Box p={[-1.0, 0.9, 1.21]} s={[0.9, 1.6, 0.04]} c="#a0643c" />
    <Box p={[1.3, 2.6, 1.21]} s={[0.9, 1.4, 0.04]} c="#a0643c" />
    {/* vidros */}
    <Box p={[0.5, 0.9, 1.22]} s={[1.6, 1.3, 0.03]} c="#9fd3ff" e="#bfe6ff" ei={0.25} />
    <Box p={[-0.4, 2.6, 1.22]} s={[2.0, 1.1, 0.03]} c="#9fd3ff" e="#bfe6ff" ei={0.25} />
    {/* sacada */}
    <Box p={[0.2, 1.85, 1.45]} s={[3.6, 0.1, 0.5]} c="#d9d4ca" />
    <Box p={[0.2, 2.1, 1.68]} s={[3.6, 0.45, 0.04]} c="#9fd3ff" o={0.5} />
    <Box p={[0.2, 2.34, 1.68]} s={[3.6, 0.05, 0.06]} c="#3b3f47" />
    {/* luminárias */}
    {[-1.5, 1.6].map((x) => <Box key={x} p={[x, 1.4, 1.26]} s={[0.12, 0.18, 0.06]} c="#ffd27a" e="#ffb84d" ei={0.8} />)}
  </group>
);

const Fence: React.FC<{p: [number, number, number]; n: number}> = ({p, n}) => (
  <group position={p}>
    {Array.from({length: n}).map((_, i) => <Box key={i} p={[i * 0.7, 0.3, 0]} s={[0.14, 0.6, 0.14]} c="#a26b3a" />)}
    <Box p={[(n - 1) * 0.35, 0.42, 0]} s={[(n - 1) * 0.7 + 0.2, 0.09, 0.08]} c="#b87c45" />
    <Box p={[(n - 1) * 0.35, 0.2, 0]} s={[(n - 1) * 0.7 + 0.2, 0.09, 0.08]} c="#b87c45" />
  </group>
);

const Crate: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 0.7}) => (
  <group position={p}>
    <Box p={[0, s / 2, 0]} s={[s, s, s]} c="#c08446" />
    <Box p={[0, s / 2, s / 2 + 0.01]} s={[s * 0.95, 0.08, 0.02]} c="#8a5a2b" />
    <mesh position={[0, s / 2, s / 2 + 0.015]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[s * 1.25, 0.08, 0.02]} />
      <M c="#8a5a2b" />
    </mesh>
  </group>
);

const Cam: React.FC = () => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...CAM.pos);
  camera.lookAt(...CAM.look);
  camera.updateProjectionMatrix();
  return null;
};

// mascote do vídeo, grande à esquerda, apontando para quem vê, chave inglesa na outra mão
const pose: MascotPose = {emotion: "grin", talk: 0, lArm: [-88, 12], rArm: [-60, 28], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false};
const MS = 1.3;
const MX = -2.25, MZ = 10, MOUND_TOP = -0.25 + 3 * 0.5;

const Bulb: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 120 108">
    <defs>
      <radialGradient id="glow" cx="50%" cy="52%" r="50%">
        <stop offset="0%" stopColor="#fff6b0" stopOpacity={0.9} />
        <stop offset="100%" stopColor="#fff6b0" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={60} cy={56} r={50} fill="url(#glow)" />
    {[-70, -40, -12, 12, 40, 70].map((a) => (
      <rect key={a} x={56} y={0} width={8} height={20} rx={4} fill="#FFD400" stroke="#101820" strokeWidth={2.5} transform={`rotate(${a} 60 58)`} />
    ))}
    <circle cx={60} cy={56} r={26} fill="#FFE14D" stroke="#101820" strokeWidth={4} />
    <circle cx={51} cy={47} r={7} fill="#fffbe0" />
    <path d="M50 62 l5 8 l5 -8 l5 8 l5 -8" fill="none" stroke="#c48a00" strokeWidth={3} strokeLinejoin="round" />
    <rect x={47} y={80} width={26} height={16} rx={4} fill="#9aa3ad" stroke="#101820" strokeWidth={4} />
    <line x1={47} y1={88} x2={73} y2={88} stroke="#101820" strokeWidth={3} />
  </svg>
);

const Sign: React.FC<{icon: React.ReactNode; text: string; rot: number}> = ({icon, text, rot}) => (
  <div style={{display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", background: "linear-gradient(180deg, #d98a3d 0%, #b86a26 100%)", border: "5px solid #5a3412", borderRadius: 14, boxShadow: "0 7px 0 rgba(0,0,0,0.35)", transform: `rotate(${rot}deg)`, fontFamily: FONT, fontWeight: 900, fontSize: 36, color: "#fff", WebkitTextStroke: "6px #3d2208", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>
    {icon}
    <span>{text}</span>
  </div>
);

const IconPlay = () => (
  <svg width={64} height={46} viewBox="0 0 64 46">
    <rect x={2} y={2} width={60} height={42} rx={12} fill="#ff0000" stroke="#3d2208" strokeWidth={3} />
    <path d="M26 13 L44 23 L26 33 Z" fill="#fff" />
  </svg>
);
const IconBell = () => (
  <svg width={52} height={52} viewBox="0 0 24 24">
    <path d="M12 2a6 6 0 0 0-6 6v4l-2 4h16l-2-4V8a6 6 0 0 0-6-6z" fill="#FFD400" stroke="#3d2208" strokeWidth={1.4} />
    <circle cx={12} cy={19.5} r={2.3} fill="#FFD400" stroke="#3d2208" strokeWidth={1.2} />
  </svg>
);
const IconLike = () => (
  <svg width={52} height={52} viewBox="0 0 24 24">
    <path d="M2 10h4v11H2z" fill="#1E88E5" stroke="#3d2208" strokeWidth={1.2} />
    <path d="M7 10l4-7c1.5 0 2.5 1 2 3l-1 4h6.5c1.5 0 2.5 1.3 2.1 2.7l-2 6.6c-.3 1-1.2 1.7-2.2 1.7H7z" fill="#1E88E5" stroke="#3d2208" strokeWidth={1.2} />
  </svg>
);

export const Banner: React.FC<{guide?: boolean}> = ({guide}) => {
  const {width, height} = useVideoConfig();
  const sx = (width - SAFE.w) / 2, sy = (height - SAFE.h) / 2;
  const stroke = {WebkitTextStroke: "16px #0d2457", paintOrder: "stroke fill"} as const;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #2f86f0 0%, #6cb8fb 45%, #bfe3ff 75%)"}} />
      <ThreeCanvas width={width} height={height} camera={{fov: CAM.fov, near: 0.1, far: 300, position: CAM.pos}}>
        <Cam />
        <fog attach="fog" args={["#cfe9ff", 38, 95]} />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#e3f2ff", "#5d8a3a", 0.85]} />
        <directionalLight position={[6, 12, 10]} intensity={1.7} color="#fff3dc" />
        <VoxelGround />
        {/* cidade de blocos ao longe */}
        {Array.from({length: 22}).map((_, i) => {
          const h = 1.5 + random("bh" + i) * 3.2;
          return <Box key={i} p={[-32 + i * 3, h / 2 - 0.25, -40 - random("bz" + i) * 6]} s={[2, h, 2]} c={i % 2 ? "#9cc2e8" : "#8bb4de"} />;
        })}
        {/* morros de blocos */}
        {[-14, -6, 4, 13].map((x, i) => (
          <Box key={i} p={[x * 1.6, 0.6, -28]} s={[10, 1.8 + (i % 2), 3]} c="#6fb84f" />
        ))}
        {/* árvores */}
        <VoxelTree p={[-9.0, -0.25, -1]} s={1.9} seed="a" />
        <VoxelTree p={[-5.0, -0.25, -6]} s={1.7} seed="b" />
        <VoxelTree p={[-13.5, -0.25, -4]} s={2.0} seed="c" />
        <VoxelTree p={[-1.0, -0.25, -10]} s={1.6} seed="d" />
        <VoxelTree p={[12.5, -0.25, -3]} s={1.9} seed="e" />
        <VoxelTree p={[15.5, -0.25, 1]} s={1.8} seed="f" />
        <VoxelTree p={[3.0, -0.25, -12]} s={1.6} seed="g" />
        <VoxelTree p={[-16, -0.25, 2]} s={1.8} seed="h" />
        <VoxelTree p={[1.2, -0.25, -4]} s={1.5} seed="i" />
        {/* nuvens de blocos */}
        <VoxelCloud p={[-12, 6.2, -10]} s={1.4} />
        <VoxelCloud p={[-3.5, 6.9, -14]} s={1.2} />
        <VoxelCloud p={[5, 6.4, -11]} s={1.3} />
        <VoxelCloud p={[14, 7.0, -14]} s={1.2} />
        {/* casa moderna, cerca, caixote e caminho de pedra */}
        <ModernHouse p={[7.2, -0.25, -3.5]} s={1.15} />
        <Fence p={[1.0, -0.25, 1.5]} n={7} />
        <Crate p={[0.3, -0.25, 4]} s={0.6} />
        {Array.from({length: 9}).map((_, i) => <Box key={i} p={[1.4 + i * 0.75, -0.23, 3.4]} s={[0.6, 0.06, 0.6]} c={i % 2 ? "#b9bec4" : "#a4aab1"} />)}
        {/* mascote do vídeo */}
        {/* montinho de blocos de grama sob o mascote */}
        {Array.from({length: 3}).flatMap((_, lv) =>
          Array.from({length: 7 - lv * 2}).flatMap((__, i) =>
            Array.from({length: 7 - lv * 2}).map((___, j) => {
              const n = 7 - lv * 2;
              return <Box key={`m${lv}-${i}-${j}`} p={[MX - ((n - 1) / 2) * 0.5 + i * 0.5, -0.25 + 0.25 + lv * 0.5, MZ - ((n - 1) / 2) * 0.5 + j * 0.5]} s={[0.5, 0.5, 0.5]} c={(i + j + lv) % 2 ? "#5fbf3f" : "#53b236"} />;
            }),
          ),
        )}
        <group position={[MX, MOUND_TOP, MZ]} rotation={[0, 0.17, 0]}>
          <Mascot position={[0, 0, 0]} scale={MS} pose={pose} gf={0} look={{capLogo: true, wrench: true, wrenchTilt: 10, lHand: "point"}} />
        </group>
      </ThreeCanvas>
      {/* logo central */}
      <div style={{position: "absolute", left: sx + 380, top: sy - 30, width: 820, height: SAFE.h + 60, background: "radial-gradient(ellipse at center, rgba(13,36,87,0.45) 0%, rgba(13,36,87,0) 70%)"}} />
      <div style={{position: "absolute", left: sx + 380, top: sy, width: 820, height: SAFE.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff"}}>
        <div style={{marginBottom: -36, zIndex: 1}}>
          <Bulb size={150} />
        </div>
        <div style={{fontSize: 110, lineHeight: 0.95, ...stroke}}>Por Dentro</div>
        <div style={{fontSize: 150, lineHeight: 0.88, color: "#FFD400", ...stroke}}>Lab</div>
        <div style={{marginTop: 12, padding: "8px 30px", borderRadius: 40, background: "#14306b", border: "5px solid #0d2457", borderBottom: "7px solid #FFD400", fontSize: 40, fontWeight: 800, whiteSpace: "nowrap"}}>
          Descubra, Construa e <span style={{color: "#FFD400"}}>Aprenda!</span>
        </div>
      </div>
      {/* placas de madeira */}
      <div style={{position: "absolute", left: sx + 1190, top: sy + 70, width: SAFE.w - 1190, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16}}>
        <Sign icon={<IconPlay />} text="INSCREVA-SE" rot={-3} />
        <Sign icon={<IconBell />} text="ATIVE O SININHO" rot={2} />
        <Sign icon={<IconLike />} text="DEIXA O LIKE" rot={-2} />
      </div>
      {guide && <div style={{position: "absolute", left: sx, top: sy, width: SAFE.w, height: SAFE.h, outline: "6px dashed #ff00ff"}} />}
    </AbsoluteFill>
  );
};
