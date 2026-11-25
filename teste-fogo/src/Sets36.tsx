import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- bicho-preguiça ---------- */
export const Sloth: React.FC<{p: V3; rotY?: number; s?: number; t?: number; lie?: number; blink?: number; reach?: number}> = ({p, rotY = 0, s = 1, t = 0, lie = 0, blink = 0.6, reach = 0}) => {
  const fur = sm("#8a6a4a", 0.95);
  const face = sm("#e8d2b0", 0.8);
  const mask = sm("#4a3020", 0.8);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[-lie * Math.PI * 0.5, 0, 0]} position={[0, lie * 0.15, 0]}>
        <mesh position={[0, 0.7, 0]} scale={[0.42, 0.55, 0.36]} material={fur} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <group position={[0, 1.38, 0.05]} rotation={[0, 0, Math.sin(t * 0.8) * 0.08]}>
          <mesh scale={[0.3, 0.27, 0.27]} material={fur}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, -0.02, 0.17]} scale={[0.24, 0.18, 0.12]} material={face}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh position={[0.1 * sd, 0.02, 0.24]} rotation={[0, 0, sd * 0.4]} scale={[0.09, 0.045, 0.03]} material={mask}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              <mesh position={[0.1 * sd, 0.02, 0.27]} scale={[0.025, 0.025 * Math.max(0.1, 1 - blink), 0.015]} material={sm("#101018", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.06, 0.29]} material={sm("#2a1a10", 0.5)}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
          <mesh position={[0, -0.12, 0.27]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.04, 0.008, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
        </group>
        {/* braços compridos com garras */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.38 * sd, 1.0, 0.05]} rotation={[-0.4 - reach * 1.2, 0, sd * (0.5 + 0.1 * Math.sin(t * 0.7))]}>
            <mesh position={[0, -0.32, 0]} material={fur}>
              <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
            </mesh>
            {[-1, 0, 1].map((k) => (
              <mesh key={k} position={[k * 0.035, -0.68, 0.02]} rotation={[0.4, 0, 0]} material={sm("#e8dcc8", 0.5)}>
                <coneGeometry args={[0.015, 0.1, 6]} />
              </mesh>
            ))}
          </group>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.18 * sd, 0.15, 0.05]} material={fur}>
            <capsuleGeometry args={[0.09, 0.2, 4, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ---------- maleta de executivo ---------- */
export const Briefcase: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.36, 0.26, 0.1, 0.02)} material={sm("#3a2214", 0.4)} castShadow />
    <mesh position={[0, 0.16, 0]} material={sm("#1d1f27", 0.4)}>
      <torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} />
    </mesh>
    {[-0.1, 0.1].map((x) => (
      <mesh key={x} position={[x, 0.08, 0.055]} geometry={rbox(0.04, 0.03, 0.01, 0.004)} material={sm("#e8b020", 0.3, {metalness: 0.5})} />
    ))}
  </group>
);

/* ---------- óculos de rico ---------- */
export const RichShades: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.11 * sd, 0, 0]} geometry={rbox(0.16, 0.09, 0.02, 0.02)} material={sm("#101018", 0.1)} />
    ))}
    <mesh geometry={rbox(0.1, 0.02, 0.02, 0.005)} material={sm("#e8b020", 0.3, {metalness: 0.6})} />
  </group>
);
