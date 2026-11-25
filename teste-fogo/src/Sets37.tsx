import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- o filtro de barro (com carinha) ---------- */
export const Filtro: React.FC<{p: V3; rotY?: number; s?: number; t?: number; cry?: number; laugh?: number; blink?: number}> = ({p, rotY = 0, s = 1, t = 0, cry = 0, laugh = 0, blink = 0}) => {
  const clay = sm("#c8643a", 0.85);
  const clayD = sm("#a84e2a", 0.85);
  const shake = laugh > 0 ? Math.sin(t * 30) * 0.03 * laugh : cry > 0 ? Math.sin(t * 12) * 0.015 * cry : 0;
  return (
    <group position={p} rotation={[0, rotY, shake]} scale={s}>
      <mesh position={[0, 0.3, 0]} material={clay} castShadow>
        <cylinderGeometry args={[0.32, 0.28, 0.6, 24]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={clayD}>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 24]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={clay} castShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.56, 24]} />
      </mesh>
      <mesh position={[0, 1.22, 0]} scale={[1, 0.45, 1]} material={clayD}>
        <sphereGeometry args={[0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 1.36, 0]} material={clayD}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
      {/* torneirinha */}
      <group position={[0, 0.2, 0.3]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#d8dde6", 0.2, {metalness: 0.6})}>
          <cylinderGeometry args={[0.03, 0.03, 0.12, 10]} />
        </mesh>
        <mesh position={[0, -0.04, 0.06]} material={sm("#d8dde6", 0.2, {metalness: 0.6})}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 10]} />
        </mesh>
      </group>
      {/* rosto */}
      <group position={[0, 0.95, 0.3]}>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.11 * sd, 0.06, 0]}>
            <mesh scale={[0.07, 0.08 * Math.max(0.1, 1 - blink - laugh * 0.8), 0.03]} material={sm("#ffffff", 0.3)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
            <mesh position={[0, -0.01, 0.025]} scale={[0.04, 0.045 * Math.max(0.1, 1 - blink - laugh * 0.8), 0.02]} material={sm("#101018", 0.2)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            {/* sobrancelha triste */}
            <mesh position={[0, 0.11, 0.02]} rotation={[0, 0, sd * (cry > 0 ? 0.45 : laugh > 0 ? -0.2 : 0)]} material={sm("#5a2a14", 0.6)}>
              <boxGeometry args={[0.1, 0.02, 0.02]} />
            </mesh>
            {/* lágrimas caindo */}
            {cry > 0 &&
              [0, 1, 2].map((i) => {
                const k = (t * 1.8 + i * 0.33) % 1;
                return (
                  <mesh key={i} position={[0.02 * sd, -0.08 - k * 0.6, 0.03 + k * 0.05]} scale={[0.025, 0.035, 0.025]} material={sm("#7fd0ff", 0.1, {transparent: true, opacity: 0.85 * cry})}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                );
              })}
          </group>
        ))}
        {laugh > 0 ? (
          <mesh position={[0, -0.1, 0.01]} scale={[0.1, 0.06 + 0.03 * Math.abs(Math.sin(t * 20)), 0.03]} material={sm("#3a1010", 0.6)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.12, 0.01]} rotation={[0, 0, cry > 0 ? 0 : Math.PI]}>
            <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#3a1010" />
          </mesh>
        )}
      </group>
    </group>
  );
};

/* ---------- peixe terapeuta (óculos e prancheta) ---------- */
export const PeixeTerapeuta: React.FC<{p: V3; rotY?: number; s?: number; t?: number; cry?: number}> = ({p, rotY = 0, s = 1, t = 0, cry = 0}) => {
  const body = sm("#ff8a1f", 0.4);
  return (
    <group position={p} rotation={[0, rotY, Math.sin(t * 3) * 0.08]} scale={s}>
      <mesh scale={[0.42, 0.3, 0.16]} material={body} castShadow>
        <sphereGeometry args={[1, 18, 12]} />
      </mesh>
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2 + Math.sin(t * 8) * 0.3]} scale={[1, 1, 0.3]} material={body}>
        <coneGeometry args={[0.22, 0.3, 4]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.3]} scale={[0.2, 0.12, 0.05]} material={sm("#e8641a", 0.4)}>
        <coneGeometry args={[1, 1, 3]} />
      </mesh>
      {/* olhos com óculos */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.22, 0.08, 0.14 * sd]}>
          <mesh scale={[0.06, 0.07, 0.04]} material={sm("#ffffff", 0.3)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh position={[0.02, 0, 0.025 * sd]} material={sm("#101018", 0.2)}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.01, 0, 0.02 * sd]} material={sm("#101018", 0.3)}>
            <torusGeometry args={[0.075, 0.01, 6, 16]} />
          </mesh>
          {cry > 0 &&
            [0, 1].map((i) => {
              const k = (t * 2 + i * 0.5) % 1;
              return (
                <mesh key={i} position={[0.05, -0.08 - k * 0.4, 0.05 * sd]} scale={0.025} material={sm("#7fd0ff", 0.1)}>
                  <sphereGeometry args={[1, 6, 6]} />
                </mesh>
              );
            })}
        </group>
      ))}
      <mesh position={[0.38, -0.08, 0]} scale={[0.04, 0.03, 0.08]} material={sm("#3a1010", 0.5)}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      {/* prancheta */}
      <group position={[0.15, -0.28, 0.22]} rotation={[0.3, 0.4, -0.2]}>
        <mesh geometry={rbox(0.24, 0.3, 0.015, 0.01)} material={sm("#8a5a2a", 0.6)} />
        <mesh position={[0, -0.02, 0.009]}>
          <planeGeometry args={[0.2, 0.22]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- bolhas subindo ---------- */
export const Bolhas: React.FC<{p: V3; t: number; n?: number; spread?: number; h?: number; s?: number}> = ({p, t, n = 14, spread = 1, h = 3, s = 1}) => (
  <group position={p}>
    {Array.from({length: n}, (_, i) => {
      const k = (t * 0.6 + i / n) % 1;
      return (
        <mesh key={i} position={[Math.sin(i * 2.3 + t) * spread * (0.3 + k), k * h, Math.cos(i * 1.7) * spread * 0.5]} scale={(0.05 + ((i * 7) % 5) * 0.02) * s}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#e6f7ff" transparent opacity={0.55} roughness={0.05} />
        </mesh>
      );
    })}
  </group>
);
