// Logo (foto de perfil) do canal. Formato inspirado na referência do usuário (personagem pensativo à frente de
// uma esfera grande, anel dourado em volta, objetos flutuando e brilhos), com identidade própria do Por Dentro Lab:
// mascote dos vídeos, lâmpada acesa gigante, engrenagem, gota de chuva, nuvem e chave inglesa.
import React from "react";
import * as THREE from "three";
import {AbsoluteFill, random, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Mascot} from "./components/Mascot";
import type {MascotPose} from "./components/Mascot";

const Cam: React.FC = () => {
  const camera = useThree((s) => s.camera);
  camera.position.set(0.12, 1.55, 4.35);
  camera.lookAt(0.1, 1.5, 0);
  camera.updateProjectionMatrix();
  return null;
};

/** lâmpada gigante acesa (vidro + filamento + rosca) */
const BigBulb: React.FC = () => (
  <group position={[0.45, 2.0, -1.5]} rotation={[0, 0, THREE.MathUtils.degToRad(38)]}>
    <mesh>
      <sphereGeometry args={[1.15, 48, 32]} />
      <meshStandardMaterial color="#ffd23d" emissive="#ffb300" emissiveIntensity={0.28} roughness={0.35} metalness={0} />
    </mesh>
    <mesh position={[-0.35, 0.35, 0.8]}>
      <sphereGeometry args={[0.22, 24, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} transparent opacity={0.7} />
    </mesh>
    <mesh position={[0, -0.1, 0.9]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.18, 0.03, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#ff8a00" emissive="#ff8a00" emissiveIntensity={1} />
    </mesh>
    <mesh position={[0, -1.15, 0]}>
      <cylinderGeometry args={[0.5, 0.62, 0.35, 32]} />
      <meshStandardMaterial color="#ffd84d" emissive="#ffb000" emissiveIntensity={0.3} roughness={0.3} />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[0, -1.42 - i * 0.14, 0]}>
        <cylinderGeometry args={[0.5 - i * 0.02, 0.5 - i * 0.02, 0.12, 32]} />
        <meshStandardMaterial color={i % 2 ? "#9aa3ad" : "#c9d1da"} metalness={0.7} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

const Gear3D: React.FC<{p: [number, number, number]; r: number; c: string; rot?: number}> = ({p, r, c, rot = 0}) => (
  <group position={p} rotation={[1.2, 0.4, rot]}>
    <mesh>
      <cylinderGeometry args={[r, r, r * 0.35, 24]} />
      <meshStandardMaterial color={c} metalness={0.6} roughness={0.35} />
    </mesh>
    {Array.from({length: 8}).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * r * 1.1, 0, Math.sin(a) * r * 1.1]} rotation={[0, -a, 0]}>
          <boxGeometry args={[r * 0.35, r * 0.35, r * 0.3]} />
          <meshStandardMaterial color={c} metalness={0.6} roughness={0.35} />
        </mesh>
      );
    })}
    <mesh>
      <cylinderGeometry args={[r * 0.35, r * 0.35, r * 0.4, 16]} />
      <meshStandardMaterial color="#2a2f38" />
    </mesh>
  </group>
);

const Drop3D: React.FC<{p: [number, number, number]; s: number}> = ({p, s}) => (
  <group position={p} scale={s} rotation={[0, 0, 0.2]}>
    <mesh>
      <sphereGeometry args={[0.5, 24, 16]} />
      <meshStandardMaterial color="#3fa9f5" emissive="#1e88e5" emissiveIntensity={0.25} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.55, 0]}>
      <coneGeometry args={[0.43, 0.75, 24]} />
      <meshStandardMaterial color="#3fa9f5" emissive="#1e88e5" emissiveIntensity={0.25} roughness={0.2} />
    </mesh>
    <mesh position={[-0.18, 0.12, 0.38]}>
      <sphereGeometry args={[0.1, 12, 8]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
    </mesh>
  </group>
);

const Cloud3D: React.FC<{p: [number, number, number]; s: number}> = ({p, s}) => (
  <group position={p} scale={s}>
    {[[0, 0, 0, 0.5], [0.45, -0.08, 0, 0.36], [-0.45, -0.08, 0, 0.38], [0.15, 0.25, 0, 0.36]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 20, 14]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    ))}
  </group>
);

const Wrench3D: React.FC<{p: [number, number, number]; s: number}> = ({p, s}) => (
  <group position={p} scale={s} rotation={[0.2, 0.3, -0.7]}>
    <mesh>
      <boxGeometry args={[0.14, 1.0, 0.08]} />
      <meshStandardMaterial color="#c9d1da" metalness={0.8} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0.55, 0]}>
      <boxGeometry args={[0.36, 0.16, 0.08]} />
      <meshStandardMaterial color="#c9d1da" metalness={0.8} roughness={0.25} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[sd * 0.13, 0.7, 0]}>
        <boxGeometry args={[0.1, 0.22, 0.08]} />
        <meshStandardMaterial color="#c9d1da" metalness={0.8} roughness={0.25} />
      </mesh>
    ))}
  </group>
);

/** anel dourado em volta do mascote */
const GoldRing: React.FC = () => (
  <mesh position={[0.1, 1.15, -0.1]} rotation={[THREE.MathUtils.degToRad(-72), THREE.MathUtils.degToRad(6), THREE.MathUtils.degToRad(-12)]}>
    <torusGeometry args={[1.25, 0.04, 12, 96]} />
    <meshStandardMaterial color="#ffc400" emissive="#ff9f00" emissiveIntensity={0.9} metalness={0.4} roughness={0.3} />
  </mesh>
);

// pose pensativa: mão direita no queixo (ângulos calculados para alcançar o queixo), esquerda à frente do corpo
const pose: MascotPose = {emotion: "grin", talk: 0, lArm: [-45, -18], rArm: [-113.5, -39], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false};

const Sparkles: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
    {Array.from({length: 14}).map((_, i) => {
      const a = random("sa" + i) * Math.PI * 2;
      const r = size * (0.3 + random("sr" + i) * 0.17);
      const x = size / 2 + Math.cos(a) * r, y = size / 2 + Math.sin(a) * r;
      const s = size * (i % 3 === 0 ? 0.03 : 0.016);
      return <path key={i} d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z`} fill={i % 4 === 0 ? "#ffffff" : "#ffd84d"} opacity={0.95} />;
    })}
    {Array.from({length: 10}).map((_, i) => (
      <circle key={"d" + i} cx={size / 2 + Math.cos(random("da" + i) * 6.28) * size * (0.25 + random("dr" + i) * 0.2)} cy={size / 2 + Math.sin(random("da" + i) * 6.28) * size * (0.25 + random("dr" + i) * 0.2)} r={size * 0.006} fill="#ffd84d" />
    ))}
  </svg>
);

export const Logo: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 55% 40%, #1b2f5e 0%, #0b1226 45%, #05070d 75%)"}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 34, near: 0.05, far: 50, position: [0, 1.5, 4.5]}}>
        <Cam />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#fff4d6", "#1d3a7a", 0.75]} />
        <directionalLight position={[2.5, 4, 5]} intensity={1.7} color="#fff4e0" />
        <pointLight position={[0.9, 2.2, 0.6]} intensity={1.6} distance={5} color="#ffd84d" />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#7fd0ff" />
        <BigBulb />
        <GoldRing />
        <Gear3D p={[-0.85, 2.1, -0.3]} r={0.16} c="#b8c2cc" rot={0.4} />
        <Drop3D p={[-0.86, 1.32, 0.1]} s={0.2} />
        <Cloud3D p={[0.95, 2.3, -0.4]} s={0.3} />

        <Gear3D p={[0.45, 2.55, -0.7]} r={0.1} c="#ffc400" rot={1.1} />
        <mesh position={[-0.45, 2.5, -0.6]}>
          <sphereGeometry args={[0.12, 20, 14]} />
          <meshStandardMaterial color="#e57373" roughness={0.5} />
        </mesh>
        <Mascot position={[0, 0, 0]} scale={1} pose={pose} gf={30} look={{capLogo: true}} />
      </ThreeCanvas>
      <Sparkles size={width} />
    </AbsoluteFill>
  );
};
