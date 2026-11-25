import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";
import {signTex} from "./Sets33";

/* ---------- cama solta ---------- */
export const Cama: React.FC<{p: V3; r?: V3; s?: number; children?: React.ReactNode}> = ({p, r = [0, 0, 0], s = 1, children}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.2, 0]} geometry={rbox(1.2, 0.3, 2.1, 0.05)} material={sm("#8a5a33", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 0.42, 0]} geometry={rbox(1.12, 0.18, 2.0, 0.07)} material={sm("#ffffff", 0.8)} castShadow />
    <mesh position={[0, 0.55, -0.72]} geometry={rbox(0.8, 0.14, 0.38, 0.07)} material={sm("#fff4c8", 0.8)} />
    <mesh position={[0, 0.54, 0.3]} geometry={rbox(1.14, 0.1, 1.3, 0.05)} material={sm("#3a86ff", 0.8)} />
    <mesh position={[0, 0.75, -1.03]} geometry={rbox(1.2, 1.0, 0.1, 0.04)} material={sm("#8a5a33", 0.6)} castShadow />
    {children}
  </group>
);

/* ---------- balde de pipoca ---------- */
export const BaldePipoca: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[0, 0.15, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]} material={sm(i % 2 ? "#ffffff" : "#e8262d", 0.6)}>
        <cylinderGeometry args={[0.16, 0.12, 0.3, 3, 1, true, 0, Math.PI / 4]} />
      </mesh>
    ))}
    {Array.from({length: 12}, (_, i) => (
      <mesh key={"p" + i} position={[Math.cos(i * 1.3) * 0.09, 0.3 + (i % 3) * 0.03, Math.sin(i * 1.3) * 0.09]} material={sm("#fff6d0", 0.8)}>
        <dodecahedronGeometry args={[0.035, 0]} />
      </mesh>
    ))}
  </group>
);

/* ---------- escada ---------- */
export const Escada: React.FC<{p: V3; r?: V3; h?: number}> = ({p, r = [0, 0, 0], h = 3}) => (
  <group position={p} rotation={r}>
    {[-0.22, 0.22].map((x) => (
      <mesh key={x} position={[x, h / 2, 0]} material={sm("#cfd4da", 0.4, {metalness: 0.4})}>
        <boxGeometry args={[0.05, h, 0.05]} />
      </mesh>
    ))}
    {Array.from({length: Math.floor(h / 0.3)}, (_, i) => (
      <mesh key={i} position={[0, 0.25 + i * 0.3, 0]} material={sm("#cfd4da", 0.4, {metalness: 0.4})}>
        <boxGeometry args={[0.44, 0.03, 0.04]} />
      </mesh>
    ))}
  </group>
);

/* ---------- placa do hotel dos pombos ---------- */
export const PlacaHotel: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    {[-0.5, 0.5].map((x) => (
      <mesh key={x} position={[x, 0.35, 0]} material={sm("#5a3a1a", 0.6)}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
      </mesh>
    ))}
    <mesh position={[0, 0.85, 0.03]}>
      <planeGeometry args={[1.3, 0.55]} />
      <meshBasicMaterial map={signTex("hotelpombo", "HOTEL\n★★★★★", "#2a0a3a", "#ffd21f", 512, 220, 80)} toneMapped={false} />
    </mesh>
  </group>
);
