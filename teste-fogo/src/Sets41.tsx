import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- camelo ---------- */
export const Camelo: React.FC<{p: V3; rotY?: number; s?: number; t?: number; walk?: number; blink?: number}> = ({p, rotY = 0, s = 1, t = 0, walk = 0, blink = 0}) => {
  const fur = sm("#c99a55", 0.85);
  const dark = sm("#8a6230", 0.8);
  const sw = Math.sin(t * 10) * 0.4 * walk;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.05, 0]} scale={[0.32, 0.3, 0.6]} material={fur} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[0, 1.35, z]} scale={[0.2, 0.25, 0.2]} material={fur} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
      {/* pescoço e cabeça */}
      <mesh position={[0, 1.35, 0.62]} rotation={[0.5, 0, 0]} material={fur} castShadow>
        <capsuleGeometry args={[0.09, 0.5, 4, 10]} />
      </mesh>
      <group position={[0, 1.66, 0.82]}>
        <mesh scale={[0.13, 0.13, 0.22]} material={fur} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
        <mesh position={[0, -0.04, 0.17]} scale={[0.1, 0.08, 0.08]} material={dark}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.1 * sd, 0.06, 0.05]} scale={[0.035, 0.04 * Math.max(0.1, 1 - blink), 0.02]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh position={[0.08 * sd, 0.1, -0.08]} material={fur}>
              <coneGeometry args={[0.03, 0.08, 5]} />
            </mesh>
          </group>
        ))}
      </group>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <group key={i} position={[0.15 * x, 0.85, 0.38 * z]} rotation={[(i % 2 ? sw : -sw), 0, 0]}>
          <mesh position={[0, -0.4, 0]} material={fur} castShadow>
            <capsuleGeometry args={[0.05, 0.75, 4, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.0, -0.6]} rotation={[-0.5, 0, 0]} material={dark}>
        <capsuleGeometry args={[0.02, 0.25, 4, 6]} />
      </mesh>
    </group>
  );
};

/* ---------- patinete gigante (o camelo vai em cima) ---------- */
export const Patinete: React.FC<{p: V3; rotY?: number; s?: number; t?: number}> = ({p, rotY = 0, s = 1, t = 0}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.14, 0]} geometry={rbox(0.5, 0.06, 1.6, 0.03)} material={sm("#3a86ff", 0.4)} castShadow />
    {[-0.7, 0.7].map((z) => (
      <mesh key={z} position={[0, 0.1, z]} rotation={[t * 12, 0, Math.PI / 2]} material={sm("#222228", 0.5)}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 14]} />
      </mesh>
    ))}
    <mesh position={[0, 0.75, 0.75]} material={sm("#cfd4da", 0.3, {metalness: 0.5})}>
      <cylinderGeometry args={[0.025, 0.025, 1.25, 8]} />
    </mesh>
    <mesh position={[0, 1.37, 0.75]} rotation={[0, 0, Math.PI / 2]} material={sm("#222228", 0.5)}>
      <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
    </mesh>
  </group>
);

/* ---------- múmia ---------- */
export const Mumia: React.FC<{p: V3; rotY?: number; s?: number; t?: number; arm?: number; unravel?: number}> = ({p, rotY = 0, s = 1, t = 0, arm = 0, unravel = 0}) => {
  const band = sm("#ece2c6", 0.95);
  const band2 = sm("#d8ccaa", 0.95);
  return (
    <group position={p} rotation={[0, rotY + unravel * t * 18, 0]} scale={s}>
      {unravel > 0 &&
        Array.from({length: 16}, (_, i) => {
          const a = i * 0.7;
          const r = 0.3 + i * 0.09 * unravel;
          return (
            <mesh key={"r" + i} position={[Math.cos(a) * r, 0.2 + i * 0.07, Math.sin(a) * r]} rotation={[0, -a, 0.3]} material={band}>
              <boxGeometry args={[0.25, 0.08, 0.01]} />
            </mesh>
          );
        })}
      {Array.from({length: 9}, (_, i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.13, 0]} rotation={[0, 0, Math.sin(i * 2.3) * 0.12]} material={i % 2 ? band : band2} castShadow>
          <cylinderGeometry args={[i > 6 ? 0.2 : 0.22, i > 6 ? 0.2 : 0.22, 0.14, 12]} />
        </mesh>
      ))}
      <group position={[0, 1.5, 0]}>
        <mesh scale={[0.2, 0.22, 0.2]} material={band} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.03, 0.15]} scale={[0.16, 0.05, 0.06]} material={sm("#20140a", 0.6)}>
          <sphereGeometry args={[1, 10, 6]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.06 * sd, 0.03, 0.2]} material={sm("#ffe66a", 0.3, {emissive: "#ffd21f", emissiveIntensity: 1})}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.27 * sd, 1.2, 0]} rotation={[-1.3 - (sd === -1 ? arm * 0.3 * Math.sin(t * 8) : 0), 0, 0]}>
          <mesh position={[0, -0.25, 0]} material={band} castShadow>
            <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ---------- mesinha de dominó ---------- */
export const Domino: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.5, 0]} geometry={rbox(0.9, 0.05, 0.6, 0.02)} material={sm("#2a7a3a", 0.7)} castShadow />
    <mesh position={[0, 0.25, 0]} material={sm("#5a3a1a", 0.6)}>
      <cylinderGeometry args={[0.05, 0.08, 0.5, 8]} />
    </mesh>
    {Array.from({length: 6}, (_, i) => (
      <group key={i} position={[-0.3 + i * 0.12, 0.54, Math.sin(i) * 0.1]} rotation={[0, i * 0.4, 0]}>
        <mesh geometry={rbox(0.05, 0.02, 0.1, 0.005)} material={sm("#ffffff", 0.4)} />
        <mesh position={[0, 0.012, 0.025]} material={sm("#111", 0.4)}>
          <sphereGeometry args={[0.008, 6, 4]} />
        </mesh>
      </group>
    ))}
  </group>
);

/* ---------- óculos (para a galinha) ---------- */
export const Oculos: React.FC<{p: V3; s?: number; dark?: boolean}> = ({p, s = 1, dark = false}) => (
  <group position={p} scale={s}>
    {[-1, 1].map((sd) => (
      <group key={sd}>
        <mesh position={[0.07 * sd, 0, 0]} material={sm("#111118", 0.3)}>
          <torusGeometry args={[0.055, 0.012, 6, 16]} />
        </mesh>
        {dark && (
          <mesh position={[0.07 * sd, 0, 0]} material={sm("#08080c", 0.1)}>
            <circleGeometry args={[0.055, 16]} />
          </mesh>
        )}
      </group>
    ))}
    <mesh material={sm("#111118", 0.3)}>
      <boxGeometry args={[0.04, 0.012, 0.012]} />
    </mesh>
  </group>
);

/* ---------- frigideira ---------- */
export const Frigideira: React.FC<{p: V3; t?: number; fire?: number}> = ({p, t = 0, fire = 1}) => (
  <group position={p}>
    <mesh position={[0, 0.05, 0]} material={sm("#2a2a30", 0.4, {metalness: 0.4})} castShadow>
      <cylinderGeometry args={[0.3, 0.24, 0.1, 20, 1, true]} />
    </mesh>
    <mesh position={[0, 0.01, 0]} material={sm("#d9a040", 0.2, {emissive: "#a06010", emissiveIntensity: 0.4})}>
      <cylinderGeometry args={[0.27, 0.24, 0.02, 20]} />
    </mesh>
    <mesh position={[0.45, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#3a2010", 0.6)}>
      <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
    </mesh>
    {fire > 0 &&
      Array.from({length: 6}, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * 0.15, -0.08, Math.sin(i) * 0.15]} scale={[1, 1 + 0.3 * Math.sin(t * 20 + i), 1]} material={sm("#ff8a1f", 0.3, {emissive: "#ff5a00", emissiveIntensity: 1.5})}>
          <coneGeometry args={[0.05, 0.14 * fire, 6]} />
        </mesh>
      ))}
  </group>
);

/* ---------- fogão de feira ---------- */
export const Fogareiro: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.4, 0]} geometry={rbox(0.8, 0.8, 0.6, 0.04)} material={sm("#dfe3e8", 0.4, {metalness: 0.3})} castShadow />
    <mesh position={[0, 0.81, 0]} material={sm("#222", 0.5)}>
      <cylinderGeometry args={[0.18, 0.18, 0.02, 14]} />
    </mesh>
  </group>
);

/* ---------- raios do pastel-sol ---------- */
export const Raios: React.FC<{p: V3; s?: number; t?: number; k?: number}> = ({p, s = 1, t = 0, k = 1}) => (
  <group position={p} scale={s * k} rotation={[0, 0, t * 0.5]}>
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.25, Math.sin(a) * 1.25, -0.05]} rotation={[0, 0, a - Math.PI / 2]} material={sm("#ffd23a", 0.4, {emissive: "#ffb000", emissiveIntensity: 1.3})}>
          <coneGeometry args={[0.16, 0.5, 4]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- vapor de raiva ---------- */
export const Vapor: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    {Array.from({length: 6}, (_, i) => {
      const k = (t * 1.6 + i / 6) % 1;
      const sd = i % 2 ? 1 : -1;
      return (
        <mesh key={i} position={[sd * (0.25 + k * 0.25), k * 0.8, 0]} scale={0.04 + k * 0.07} material={sm("#ffffff", 0.9, {transparent: true, opacity: 1 - k})}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- flamingo (dança / vira abajur) ---------- */
export const Flamingo: React.FC<{p: V3; rotY?: number; s?: number; t?: number; dance?: number; lamp?: number; blink?: number}> = ({p, rotY = 0, s = 1, t = 0, dance = 0, lamp = 0, blink = 0}) => {
  const pink = sm("#ff7fae", 0.7);
  const sway = Math.sin(t * 10) * 0.25 * dance;
  return (
    <group position={p} rotation={[0, rotY, sway * 0.5]} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.05 * sd, 0.45, 0]} rotation={[0, 0, sd === 1 ? Math.max(0, Math.sin(t * 10)) * 0.6 * dance : 0]} material={sm("#e8608a", 0.6)}>
          <cylinderGeometry args={[0.015, 0.015, 0.9, 6]} />
        </mesh>
      ))}
      <group position={[0, 0.95, 0]} rotation={[0, 0, sway]}>
        <mesh scale={[0.2, 0.17, 0.3]} material={pink} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.18 * sd, 0.03, -0.02]} rotation={[0, 0, sd * (0.4 + dance * 0.8 * Math.abs(Math.sin(t * 10)))]} scale={[0.04, 0.12, 0.2]} material={sm("#ff5a96", 0.7)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.3, 0.2]} rotation={[-0.3, 0, 0]} material={pink}>
          <capsuleGeometry args={[0.035, 0.42, 4, 8]} />
        </mesh>
        <group position={[0, 0.56, 0.3]}>
          <mesh scale={[0.08, 0.08, 0.09]} material={pink}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.03, 0.1]} rotation={[1.9, 0, 0]} material={sm("#1a1a1a", 0.4)}>
            <coneGeometry args={[0.03, 0.12, 6]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.055 * sd, 0.02, 0.05]} scale={[0.015, 0.02 * Math.max(0.1, 1 - blink), 0.01]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))}
          {lamp > 0 && (
            <group position={[0, 0.12, 0]} scale={lamp}>
              <mesh position={[0, 0.12, 0]} material={sm("#fff2c0", 0.5, {emissive: "#ffd870", emissiveIntensity: 1.2, side: 2})}>
                <cylinderGeometry args={[0.12, 0.25, 0.25, 16, 1, true]} />
              </mesh>
              <pointLight position={[0, 0.05, 0]} intensity={6} distance={5} color="#ffd890" />
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

/* ---------- bomba de posto de SUCO ---------- */
export const BombaSuco: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.7, 0]} geometry={rbox(0.5, 1.4, 0.35, 0.05)} material={sm("#ff8a1f", 0.5)} castShadow />
    <mesh position={[0, 1.0, 0.18]} geometry={rbox(0.36, 0.3, 0.02, 0.02)} material={sm("#1a1a22", 0.3)} />
    <mesh position={[0, 1.55, 0]} material={sm("#ffb020", 0.5, {emissive: "#ff8a1f", emissiveIntensity: 0.3})}>
      <sphereGeometry args={[0.2, 16, 12]} />
    </mesh>
    <mesh position={[0, 1.55, 0.17]} rotation={[0, 0, 0]} material={sm("#3cb04a", 0.6)}>
      <coneGeometry args={[0.05, 0.1, 6]} />
    </mesh>
    <mesh position={[0.28, 0.8, 0.05]} rotation={[0, 0, 0.2]} material={sm("#222", 0.5)}>
      <capsuleGeometry args={[0.02, 0.5, 4, 6]} />
    </mesh>
  </group>
);

/* ---------- chuva de pipoca ---------- */
export const PipocaChuva: React.FC<{c: V3; t: number; n?: number; w?: number}> = ({c, t, n = 50, w = 4}) => (
  <group position={c}>
    {Array.from({length: n}, (_, i) => {
      const x = ((i * 0.618) % 1) * w - w / 2;
      const z = ((i * 0.381) % 1) * 2 - 1;
      const y = 4 - ((t * 1.6 + i * 0.137) % 1) * 4.5;
      return (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 2, t * 3 + i]} material={sm("#fff6d0", 0.8)}>
          <dodecahedronGeometry args={[0.06, 0]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- piscina ---------- */
export const Piscina: React.FC<{p: V3; t?: number; splash?: number}> = ({p, t = 0, splash = 0}) => (
  <group position={p}>
    <mesh position={[0, 0.06, 0]} geometry={rbox(2.6, 0.12, 1.6, 0.04)} material={sm("#f2f2f2", 0.6)} receiveShadow />
    <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#3ab0e8", 0.15, {emissive: "#1a70a8", emissiveIntensity: 0.4})}>
      <planeGeometry args={[2.4, 1.4]} />
    </mesh>
    {splash > 0 &&
      Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 0.2 + splash * 0.7;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.15 + Math.sin(splash * Math.PI) * (0.6 + (i % 3) * 0.2), Math.sin(a) * r * 0.6]} material={sm("#bfe8ff", 0.2, {transparent: true, opacity: 1 - splash})}>
            <sphereGeometry args={[0.07, 8, 6]} />
          </mesh>
        );
      })}
  </group>
);
