// Logo (foto de perfil) do canal: formato da arte do usuário (círculo azul com raios e engrenagens)
// com o mascote dos vídeos: sorrisão, mão estendida para quem olha e chave inglesa na outra mão.
import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Mascot} from "./components/Mascot";
import type {MascotPose} from "./components/Mascot";

const Gear: React.FC<{x: number; y: number; r: number; o: number; rot?: number}> = ({x, y, r, o, rot = 0}) => {
  const teeth = 9;
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r * 1.22;
    const a2 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    d += `${i === 0 ? "M" : "L"}${x + Math.cos(a) * rr},${y + Math.sin(a) * rr} L${x + Math.cos(a2) * rr},${y + Math.sin(a2) * rr} `;
  }
  return (
    <g opacity={o} transform={`rotate(${rot} ${x} ${y})`}>
      <path d={d + "Z"} fill="#7cc4ff" />
      <circle cx={x} cy={y} r={r * 0.45} fill="#1d5fd6" />
    </g>
  );
};

export const LogoBg: React.FC<{size: number}> = ({size}) => {
  const c = size / 2;
  const rays = Array.from({length: 24});
  return (
    <svg width={size} height={size} style={{position: "absolute", inset: 0}}>
      <defs>
        <radialGradient id="bg" cx="50%" cy="48%" r="60%">
          <stop offset="0%" stopColor="#7fe0ff" />
          <stop offset="28%" stopColor="#2a8cff" />
          <stop offset="70%" stopColor="#1546c8" />
          <stop offset="100%" stopColor="#0a2a8a" />
        </radialGradient>
      </defs>
      <rect width={size} height={size} fill="#0a2a8a" />
      <circle cx={c} cy={c} r={c} fill="url(#bg)" />
      {rays.map((_, i) => {
        const a0 = (i / rays.length) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / rays.length / 2.2;
        const R = size;
        return i % 2 === 0 ? <path key={i} d={`M${c},${c} L${c + Math.cos(a0) * R},${c + Math.sin(a0) * R} L${c + Math.cos(a1) * R},${c + Math.sin(a1) * R} Z`} fill="#ffffff" opacity={0.07} /> : null;
      })}
      <Gear x={size * 0.16} y={size * 0.33} r={size * 0.07} o={0.35} />
      <Gear x={size * 0.12} y={size * 0.56} r={size * 0.09} o={0.3} rot={12} />
      <Gear x={size * 0.85} y={size * 0.38} r={size * 0.06} o={0.3} rot={20} />
      <Gear x={size * 0.88} y={size * 0.6} r={size * 0.08} o={0.25} rot={5} />
      <circle cx={c} cy={c} r={c - size * 0.012} fill="none" stroke="#3fa0ff" strokeWidth={size * 0.022} />
      <circle cx={c} cy={c} r={c - size * 0.03} fill="none" stroke="#9fd8ff" strokeWidth={size * 0.006} opacity={0.8} />
    </svg>
  );
};

const Cam: React.FC = () => {
  const camera = useThree((s) => s.camera);
  camera.position.set(0.05, 1.45, 3.1);
  camera.lookAt(0.0, 1.22, 0);
  camera.updateProjectionMatrix();
  return null;
};

const pose: MascotPose = {emotion: "grin", talk: 0, lArm: [-78, 22], rArm: [-115, 20], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false};

export const Logo: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#0a2a8a"}}>
      <LogoBg size={width} />
      <ThreeCanvas width={width} height={height} camera={{fov: 31, near: 0.05, far: 50, position: [0, 1.3, 3]}}>
        <Cam />
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#e6f4ff", "#2a4fa8", 0.8]} />
        <directionalLight position={[2.5, 4, 5]} intensity={1.8} color="#fff4e0" />
        <directionalLight position={[-3, 2, -2]} intensity={1.1} color="#7fd0ff" />
        <Mascot position={[0, 0, 0]} scale={1} pose={pose} gf={0} look={{capLogo: true, wrench: true, wrenchTilt: 2, lHand: "open"}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
