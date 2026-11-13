import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";

/* ===== Vídeo "Se você quiser fazer um bolo, mas está com medo" ===== */

/** chapéu de cozinheiro (toque) — fica no espaço da cabeça do boneco (headExtra) */
export const ChefHat: React.FC<{tilt?: number}> = ({tilt = 0}) => {
  const white = sm("#fbfbf8", 0.6);
  const shade = sm("#ececE6", 0.65);
  return (
    <group position={[0, 0.2, -0.005]} rotation={[-0.06, 0, 0.07 + tilt]}>
      {/* faixa */}
      <mesh position={[0, 0.12, 0]} material={white} castShadow>
        <cylinderGeometry args={[0.292, 0.28, 0.24, 36]} />
      </mesh>
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.288, 0.12, Math.cos(a) * 0.288]} material={shade}>
            <capsuleGeometry args={[0.008, 0.16, 4, 6]} />
          </mesh>
        );
      })}
      {/* copa fofa */}
      <mesh position={[0, 0.37, 0]} scale={[1, 0.6, 1]} material={white} castShadow>
        <sphereGeometry args={[0.38, 32, 22]} />
      </mesh>
      {Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        return (
          <mesh key={"p" + i} position={[Math.sin(a) * 0.26, 0.37 + 0.03 * Math.sin(i * 2.1), Math.cos(a) * 0.26]} scale={[1, 0.82, 1]} material={white} castShadow>
            <sphereGeometry args={[0.185, 20, 14]} />
          </mesh>
        );
      })}
      <mesh position={[0.02, 0.5, 0]} scale={[1, 0.7, 1]} material={white} castShadow>
        <sphereGeometry args={[0.24, 22, 16]} />
      </mesh>
    </group>
  );
};

/** óculos escuro preto — espaço da cabeça; k: 1 = nos olhos, 0 = levantado na testa */
export const Shades: React.FC<{k?: number; glint?: number}> = ({k = 1, glint = 0}) => {
  const black = sm("#0b0b10", 0.12, {metalness: 0.25});
  const frame = sm("#15151c", 0.3);
  const glare = sm("#ffffff", 0.2, {emissive: "#ffffff", emissiveIntensity: 0.25 + 1.6 * glint, transparent: true, opacity: 0.75});
  return (
    <group position={[0, -0.026 + (1 - k) * 0.2, (1 - k) * 0.02]} rotation={[-(1 - k) * 0.5, 0, 0]}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.113 * sd, 0, 0.3]} rotation={[0, 0.33 * sd, 0]}>
          <mesh geometry={rbox(0.172, 0.118, 0.032, 0.042)} material={black} castShadow />
          {/* brilho na lente */}
          <mesh position={[-0.03, 0.018, 0.0175]} rotation={[0, 0, -0.75]} scale={[0.012, 0.042, 0.004]} material={glare}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh position={[0.005, 0.012, 0.0175]} rotation={[0, 0, -0.75]} scale={[0.007, 0.026, 0.004]} material={glare}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* ponte */}
      <mesh position={[0, 0.022, 0.318]} geometry={rbox(0.075, 0.028, 0.026, 0.012)} material={frame} />
      {/* hastes até as orelhas */}
      {[-1, 1].map((sd) => {
        const a = new THREE.Vector3(0.2 * sd, 0.022, 0.275);
        const b = new THREE.Vector3(0.345 * sd, 0.012, 0.0);
        const m = a.clone().add(b).multiplyScalar(0.5);
        const d = b.clone().sub(a);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        return (
          <mesh key={"h" + sd} position={[m.x, m.y, m.z]} quaternion={q} material={frame}>
            <capsuleGeometry args={[0.012, d.length(), 4, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
export const lerpV = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
