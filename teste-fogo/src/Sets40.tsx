import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";
import {canvasTex} from "./util";

/* ---------- o botão de desfazer ---------- */
const undoTex = () =>
  canvasTex("undo-icon", 256, 256, (c) => {
    c.fillStyle = "#e8262d";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 26;
    c.lineCap = "round";
    c.beginPath();
    c.arc(140, 140, 62, Math.PI * 1.1, Math.PI * 0.45, false);
    c.stroke();
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(40, 120);
    c.lineTo(110, 70);
    c.lineTo(110, 160);
    c.closePath();
    c.fill();
  });
export const BotaoDesfazer: React.FC<{p: V3; s?: number; press?: number; glow?: number; t?: number}> = ({p, s = 1, press = 0, glow = 0, t = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.08, 0]} material={sm("#2a2a32", 0.5)} castShadow>
      <cylinderGeometry args={[0.42, 0.46, 0.16, 24]} />
    </mesh>
    <mesh position={[0, 0.2 - press * 0.08, 0]} material={sm("#e8262d", 0.3, {emissive: "#ff2020", emissiveIntensity: 0.3 + glow * (0.5 + 0.4 * Math.sin(t * 6))})} castShadow>
      <cylinderGeometry args={[0.32, 0.34, 0.14, 24]} />
    </mesh>
    <mesh position={[0, 0.272 - press * 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.3, 24]} />
      <meshBasicMaterial map={undoTex()} toneMapped={false} />
    </mesh>
  </group>
);

/* ---------- gato ofendido ---------- */
export const Gato: React.FC<{p: V3; r?: V3; s?: number; t?: number; angry?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, angry = 1}) => {
  const fur = sm("#ff9a3a", 0.8);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.25, 0]} scale={[0.22, 0.2, 0.3]} material={fur} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <group position={[0, 0.45, 0.22]}>
        <mesh scale={[0.17, 0.15, 0.15]} material={fur}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.1 * sd, 0.14, 0]} rotation={[0, 0, -sd * 0.3]} material={fur}>
              <coneGeometry args={[0.05, 0.1, 4]} />
            </mesh>
            <mesh position={[0.06 * sd, 0.02, 0.13]} scale={[0.035, 0.022, 0.02]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            {/* sobrancelha brava */}
            <mesh position={[0.06 * sd, 0.06, 0.13]} rotation={[0, 0, sd * 0.5 * angry]} material={sm("#5a2a10", 0.5)}>
              <boxGeometry args={[0.06, 0.012, 0.01]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.03, 0.15]} material={sm("#f48080", 0.5)}>
          <sphereGeometry args={[0.015, 6, 6]} />
        </mesh>
      </group>
      <mesh position={[0, 0.35, -0.3]} rotation={[0.6 + Math.sin(t * 3) * 0.3, 0, 0]} material={fur}>
        <capsuleGeometry args={[0.03, 0.3, 4, 8]} />
      </mesh>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <mesh key={i} position={[0.11 * x, 0.08, 0.15 * z]} material={fur}>
          <capsuleGeometry args={[0.035, 0.12, 4, 8]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- lustre ---------- */
export const Lustre: React.FC<{p: V3; t?: number; swing?: number}> = ({p, t = 0, swing = 0}) => (
  <group position={p} rotation={[0, 0, Math.sin(t * 3) * 0.15 * swing]}>
    <mesh position={[0, -0.3, 0]} material={sm("#c8a040", 0.3, {metalness: 0.6})}>
      <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
    </mesh>
    <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#c8a040", 0.3, {metalness: 0.6})}>
      <torusGeometry args={[0.32, 0.03, 8, 24]} />
    </mesh>
    {Array.from({length: 6}, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.32, -0.55, Math.sin(a) * 0.32]} material={sm("#fff6c0", 0.3, {emissive: "#ffe08a", emissiveIntensity: 1})}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- feixe de trigo ---------- */
export const Trigo: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {Array.from({length: 9}, (_, i) => (
      <group key={i} rotation={[Math.sin(i) * 0.25, i * 0.7, Math.cos(i * 1.3) * 0.25]}>
        <mesh position={[0, 0.18, 0]} material={sm("#d9b050", 0.7)}>
          <cylinderGeometry args={[0.006, 0.006, 0.36, 4]} />
        </mesh>
        <mesh position={[0, 0.4, 0]} scale={[1, 2.2, 1]} material={sm("#e8c060", 0.7)}>
          <sphereGeometry args={[0.03, 6, 6]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#8a5a2a", 0.6)}>
      <torusGeometry args={[0.04, 0.012, 6, 12]} />
    </mesh>
  </group>
);

/* ---------- copo de leite ---------- */
export const CopoLeite: React.FC<{p: V3; k?: number}> = ({p, k = 1}) => (
  <group position={p}>
    <mesh position={[0, 0.1, 0]} material={sm("#ffffff", 0.05, {transparent: true, opacity: 0.35})}>
      <cylinderGeometry args={[0.07, 0.06, 0.2, 14, 1, true]} />
    </mesh>
    {k > 0.02 && (
      <mesh position={[0, 0.01 + 0.09 * k, 0]} material={sm("#fffdf5", 0.5)}>
        <cylinderGeometry args={[0.065, 0.058, 0.18 * k, 14]} />
      </mesh>
    )}
  </group>
);

export {rbox};
