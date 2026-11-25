import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- casquinha de sorvete ---------- */
export const IceCream: React.FC<{p?: V3; r?: V3; s?: number; flavor?: string; melt?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, flavor = "#ff9ec7", melt = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]} material={sm("#d9a05a", 0.7)}>
      <coneGeometry args={[0.08, 0.26, 12]} />
    </mesh>
    <mesh position={[0, 0.04 - melt * 0.05, 0]} scale={[1, 1 - melt * 0.5, 1]} material={sm(flavor, 0.5)}>
      <sphereGeometry args={[0.1, 14, 10]} />
    </mesh>
    {melt > 0 &&
      [0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.08, -0.02 - melt * 0.06 * (i + 1), Math.sin(i * 2.1) * 0.08]} material={sm(flavor, 0.4)}>
          <capsuleGeometry args={[0.015, 0.04 + melt * 0.08, 4, 6]} />
        </mesh>
      ))}
  </group>
);

/* ---------- bloco de gelo (banhista virou picolé) ---------- */
export const IceBlock: React.FC<{p: V3; s?: number; children?: React.ReactNode}> = ({p, s = 1, children}) => (
  <group position={p} scale={s}>
    {children}
    <mesh position={[0, 0.95, 0]} geometry={rbox(1.0, 1.95, 0.8, 0.08)} material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.45})} />
    {/* palito do picolé */}
    <mesh position={[0, -0.15, 0]} material={sm("#e8c48a", 0.7)}>
      <boxGeometry args={[0.16, 0.35, 0.04]} />
    </mesh>
  </group>
);

/* ---------- poça com gravata (o pinguim derretido) ---------- */
export const PuddleTie: React.FC<{p: V3; s?: number; k?: number}> = ({p, s = 1, k = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[k, k * 0.7, 1]} material={sm("#4aa0e0", 0.05, {transparent: true, opacity: 0.8})}>
      <circleGeometry args={[0.6, 24]} />
    </mesh>
    <group position={[0.1, 0.03, 0.05]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <mesh material={sm("#e8262d", 0.5)}>
        <coneGeometry args={[0.07, 0.24, 4]} />
      </mesh>
      <mesh position={[0, 0.14, 0]} material={sm("#b81d22", 0.5)}>
        <boxGeometry args={[0.07, 0.06, 0.02]} />
      </mesh>
    </group>
  </group>
);

/* ---------- raio laser ---------- */
export const Laser: React.FC<{a: V3; b: V3; k?: number}> = ({a, b, k = 1}) => {
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const rz = Math.atan2(dx, dy);
  const rx = Math.atan2(dz, Math.sqrt(dx * dx + dy * dy));
  return (
    <group position={mid} rotation={[rx, 0, -rz]}>
      <mesh>
        <cylinderGeometry args={[0.08 * k, 0.08 * k, len, 10]} />
        <meshBasicMaterial color="#ff3030" toneMapped={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.18 * k, 0.18 * k, len, 10]} />
        <meshBasicMaterial color="#ff8080" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ---------- rato astronauta ---------- */
export const RatAstro: React.FC<{p: V3; rotY?: number; s?: number; t?: number; ph?: number}> = ({p, rotY = 0, s = 1, t = 0, ph = 0}) => {
  const fur = sm("#9a9aa6", 0.8);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.25 + Math.abs(Math.sin(t * 6 + ph)) * 0.04, 0]} scale={[0.15, 0.2, 0.14]} material={sm("#f2f2f2", 0.6)}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <group position={[0, 0.52, 0.02]}>
        <mesh scale={[0.12, 0.11, 0.13]} material={fur}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, -0.02, 0.13]} material={sm("#f48080", 0.5)}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.1 * sd, 0.1, 0]} scale={[0.07, 0.07, 0.02]} material={sm("#f4a0b0", 0.6)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.045 * sd, 0.03, 0.1]} material={sm("#101018", 0.2)}>
              <sphereGeometry args={[0.018, 8, 6]} />
            </mesh>
          </group>
        ))}
        {/* capacete de vidro */}
        <mesh material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.3})}>
          <sphereGeometry args={[0.2, 16, 12]} />
        </mesh>
      </group>
      <mesh position={[0, 0.12, -0.15]} rotation={[0.8, 0, 0]} material={sm("#f4a0b0", 0.6)}>
        <cylinderGeometry args={[0.01, 0.015, 0.3, 6]} />
      </mesh>
    </group>
  );
};

/* ---------- carrinho de sorvete lunar ---------- */
export const SorveteCart: React.FC<{p: V3; rotY?: number; s?: number}> = ({p, rotY = 0, s = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.5, 0]} geometry={rbox(1.0, 0.6, 0.6, 0.05)} material={sm("#ffd21f", 0.5)} castShadow />
    <mesh position={[0, 1.25, 0]} material={sm("#7ed957", 0.5)}>
      <coneGeometry args={[0.8, 0.35, 16]} />
    </mesh>
    <mesh position={[0, 0.95, 0]} material={sm("#cfd4da", 0.4)}>
      <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
    </mesh>
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.15, 0.31]} rotation={[0, 0, Math.PI / 2]} material={sm("#24272d", 0.6)}>
        <cylinderGeometry args={[0.15, 0.15, 0.06, 16]} />
      </mesh>
    ))}
    {/* queijos à venda */}
    {[-0.25, 0.05, 0.3].map((x, i) => (
      <mesh key={i} position={[x, 0.86, 0.1]} rotation={[0, i, 0]} material={sm("#ffcf3a", 0.6)}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 3]} />
      </mesh>
    ))}
  </group>
);
