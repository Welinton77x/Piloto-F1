import React, {useMemo} from "react";
import * as THREE from "three";
import {canvasTex} from "./util";
import {Box} from "./Sets";

type V3 = [number, number, number];
const M = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color, roughness: rough, ...extra});

/** um olho só, na escuridão. look = direção da pupila [-1..1, -1..1] */
export const Eye: React.FC<{p: V3; look?: [number, number]; scale?: number; open?: number; rotY?: number}> = ({p, look = [0.6, 0], scale = 1, open = 1, rotY = 0}) => {
  const m = useMemo(
    () => ({
      white: new THREE.MeshStandardMaterial({color: "#e8e0d0", roughness: 0.25, emissive: new THREE.Color("#e8e0d0"), emissiveIntensity: 0.12}),
      iris: new THREE.MeshStandardMaterial({color: "#8a6a2a", roughness: 0.3, emissive: new THREE.Color("#c89a3a"), emissiveIntensity: 0.25}),
      pupil: M("#050505", 0.2),
      lid: M("#1a120c", 0.9),
      glint: new THREE.MeshBasicMaterial({color: "#ffffff"}),
    }),
    [],
  );
  return (
    <group position={p} scale={scale} rotation={[0, rotY, 0]}>
      <mesh material={m.white} scale={[0.07, 0.05 * open, 0.03]}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <group position={[look[0] * 0.025, look[1] * 0.012, 0.024]}>
        <mesh material={m.iris} scale={[0.028, 0.028 * Math.max(0.3, open), 0.01]}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[0, 0, 0.006]} material={m.pupil} scale={[0.013, 0.013 * Math.max(0.3, open), 0.006]}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0.009, 0.009, 0.011]} material={m.glint} scale={0.004}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>
      {/* pálpebras grossas e sobrancelha franzida */}
      <mesh position={[0, 0.045, 0.01]} rotation={[0, 0, -0.12]} material={m.lid} scale={[0.09, 0.022, 0.04]}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh position={[0, -0.046, 0.008]} material={m.lid} scale={[0.085, 0.016, 0.035]}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <pointLight position={[0.15, 0.05, 0.25]} color="#ffd8a0" intensity={0.35} distance={0.6} />
    </group>
  );
};

/** beco escuro entre dois muros */
export const Alley: React.FC = () => {
  const m = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({
        map: canvasTex("beco", 256, 256, (c, r) => {
          c.fillStyle = "#1a1210";
          c.fillRect(0, 0, 256, 256);
          for (let y = 0; y < 12; y++)
            for (let x = -1; x < 5; x++) {
              const v = 0.6 + r() * 0.4;
              c.fillStyle = `rgb(${60 * v},${34 * v},${26 * v})`;
              c.fillRect(x * 64 + (y % 2) * 32 + 2, y * 22 + 2, 60, 18);
            }
        }, [2, 4]),
        roughness: 0.95,
      }),
      floor: M("#141210", 0.95),
    }),
    [],
  );
  return (
    <group>
      <Box p={[-0.75, 2, -2]} s={[0.2, 4, 6]} m={m.wall} />
      <Box p={[0.75, 2, -2]} s={[0.2, 4, 6]} m={m.wall} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} material={m.floor}>
        <planeGeometry args={[1.5, 6]} />
      </mesh>
    </group>
  );
};

/** matraca de polícia (gira em volta do cabo) */
export const Rattle: React.FC<{spin: number}> = ({spin}) => {
  const m = useMemo(() => ({wood: M("#8a5a2a", 0.6), dark: M("#4a2e14", 0.7)}), []);
  return (
    <group>
      <mesh position={[0, -0.06, 0]} material={m.dark}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
      </mesh>
      <group position={[0, 0.03, 0]} rotation={[0, spin, 0]}>
        <Box p={[0.1, 0, 0]} s={[0.2, 0.08, 0.05]} m={m.wood} shadow={false} />
        <mesh position={[0, 0, 0]} material={m.dark}>
          <cylinderGeometry args={[0.035, 0.035, 0.06, 10]} />
        </mesh>
      </group>
    </group>
  );
};

/** cartaz de PROCURADO com o rosto do Davi desenhado à mão */
const posterTex = () =>
  canvasTex("procurado", 512, 720, (c, r) => {
    c.fillStyle = "#e8dcb8";
    c.fillRect(0, 0, 512, 720);
    for (let i = 0; i < 2500; i++) {
      c.fillStyle = `rgba(120,90,50,${r() * 0.08})`;
      c.fillRect(r() * 512, r() * 720, 3, 3);
    }
    c.fillStyle = "#2a1a10";
    c.textAlign = "center";
    c.font = "bold 84px serif";
    c.fillText("PROCURADO", 256, 105);
    c.strokeStyle = "#2a1a10";
    c.lineWidth = 3;
    c.strokeRect(96, 140, 320, 330);
    // rosto em traço de lápis
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(256, 310, 95, 110, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    for (let i = 0; i < 9; i++) {
      c.moveTo(170 + i * 20, 230);
      c.lineTo(160 + i * 22 + (r() - 0.5) * 10, 195 + (r() - 0.5) * 10);
    }
    c.stroke();
    c.beginPath();
    c.arc(220, 300, 13, 0, Math.PI * 2);
    c.arc(292, 300, 13, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(256, 315);
    c.lineTo(250, 345);
    c.lineTo(262, 345);
    c.moveTo(225, 375);
    c.quadraticCurveTo(256, 360, 287, 375);
    c.stroke();
    c.font = "bold 46px serif";
    c.fillText("O MENINO QUE SOME", 256, 535);
    c.font = "italic 28px serif";
    c.fillText("visto na rua das fábricas", 256, 580);
    c.font = "24px serif";
    c.fillText("desenhado por uma testemunha", 256, 640);
  });

export const Poster: React.FC<{p: V3; r?: V3}> = ({p, r = [0, 0, 0]}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: posterTex(), roughness: 0.9, side: THREE.DoubleSide}), []);
  return (
    <mesh position={p} rotation={r} material={m}>
      <planeGeometry args={[0.6, 0.85]} />
    </mesh>
  );
};

/** porta de madeira da loja com vidro; atrás, escuridão */
export const ShopDoor: React.FC<{p: V3; shake?: number}> = ({p, shake = 0}) => {
  const m = useMemo(() => ({wood: M("#4a2a16", 0.6), glass: new THREE.MeshStandardMaterial({color: "#8aa0b0", roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.25}), dark: new THREE.MeshBasicMaterial({color: "#040404"}), brass: M("#c8a050", 0.3, {metalness: 0.8})}), []);
  return (
    <group position={[p[0] + shake * 0.01, p[1], p[2]]}>
      <mesh position={[0, 1.1, -0.08]} material={m.dark}>
        <planeGeometry args={[1.0, 2.2]} />
      </mesh>
      <Box p={[0, 0.45, 0]} s={[0.9, 0.9, 0.05]} m={m.wood} />
      <Box p={[0, 2.08, 0]} s={[0.9, 0.16, 0.05]} m={m.wood} />
      <Box p={[-0.41, 1.45, 0]} s={[0.08, 1.1, 0.05]} m={m.wood} />
      <Box p={[0.41, 1.45, 0]} s={[0.08, 1.1, 0.05]} m={m.wood} />
      <mesh position={[0, 1.45, 0]} material={m.glass}>
        <planeGeometry args={[0.74, 1.1]} />
      </mesh>
      <mesh position={[0.32, 0.95, 0.04]} material={m.brass}>
        <sphereGeometry args={[0.035, 10, 8]} />
      </mesh>
    </group>
  );
};

/** colchão de palha */
export const Mattress: React.FC<{p: V3}> = ({p}) => {
  const m = useMemo(() => ({straw: M("#c8a868", 0.95), blanket: M("#6a4a3a", 0.95)}), []);
  return (
    <group position={p}>
      <Box p={[0, 0.08, 0]} s={[0.9, 0.16, 1.9]} m={m.straw} />
      <Box p={[0, 0.18, 0.35]} s={[0.92, 0.06, 1.1]} m={m.blanket} />
    </group>
  );
};

/** quadro de avisos de madeira na calçada, com o cartaz */
export const NoticeBoard: React.FC<{p: V3}> = ({p}) => {
  const m = useMemo(() => ({wood: M("#4a2e1c", 0.7), board: M("#6a4a2e", 0.8)}), []);
  return (
    <group position={p}>
      {[-0.5, 0.5].map((x) => (
        <Box key={x} p={[x, 1.0, 0]} s={[0.07, 2.0, 0.07]} m={m.wood} />
      ))}
      <Box p={[0, 1.45, -0.02]} s={[1.1, 1.1, 0.05]} m={m.board} />
      <Poster p={[0, 1.45, 0.012]} />
    </group>
  );
};
