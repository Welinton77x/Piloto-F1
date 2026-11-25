import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- o bolo fujão (com cara, bracinhos e pezinhos) ---------- */
export const BoloChar: React.FC<{p: V3; rotY?: number; s?: number; t?: number; blink?: number; mouth?: number; smile?: number; hat?: boolean; shades?: boolean; suitcase?: number; hop?: number; arms?: number; look?: number}> = ({p, rotY = 0, s = 1, t = 0, blink = 0, mouth = 0, smile = 1, hat = false, shades = false, suitcase = 0, hop = 0, arms = 0, look = 0}) => {
  const sponge = sm("#f2c58a", 0.7);
  const choco = sm("#5a2a14", 0.5);
  const cream = sm("#fffaf0", 0.45);
  const foot = (sd: number) => Math.max(0, Math.sin(t * 12 + sd)) * 0.05 * hop;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* pezinhos */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.16 * sd, 0.05 + foot(sd * 1.5), 0.05]} scale={[0.09, 0.05, 0.13]} material={sm("#e8412c", 0.5)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.1, 0]}>
        {/* camadas */}
        <mesh position={[0, 0.16, 0]} material={sponge} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 28]} />
        </mesh>
        <mesh position={[0, 0.33, 0]} material={choco}>
          <cylinderGeometry args={[0.425, 0.425, 0.06, 28]} />
        </mesh>
        <mesh position={[0, 0.5, 0]} material={sponge}>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 28]} />
        </mesh>
        {/* cobertura escorrendo */}
        <mesh position={[0, 0.66, 0]} material={cream}>
          <cylinderGeometry args={[0.44, 0.44, 0.06, 28]} />
        </mesh>
        {Array.from({length: 9}, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.7) * 0.43, 0.6 - (i % 3) * 0.04, Math.sin(i * 0.7) * 0.43]} material={cream}>
            <capsuleGeometry args={[0.035, 0.08 + (i % 3) * 0.05, 4, 8]} />
          </mesh>
        ))}
        {/* cereja */}
        <mesh position={[0, 0.76, 0]} material={sm("#e8262d", 0.3)}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        {/* rosto */}
        <group position={[0, 0.42, 0.42]} rotation={[0, look, 0]}>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.12 * sd, 0.06, 0]}>
              <mesh scale={[0.06, 0.07 * Math.max(0.1, 1 - blink), 0.03]} material={sm("#ffffff", 0.3)}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh position={[0, -0.005, 0.025]} scale={[0.035, 0.042 * Math.max(0.1, 1 - blink), 0.02]} material={sm("#101018", 0.3)}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
            </group>
          ))}
          {mouth > 0.05 ? (
            <mesh position={[0, -0.1, 0.01]} scale={[0.07, 0.03 + mouth * 0.05, 0.02]} material={sm("#3a1010", 0.6)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ) : (
            <mesh position={[0, -0.08, 0.005]} rotation={[0, 0, Math.PI]} scale={[1, smile, 1]}>
              <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
              <meshStandardMaterial color="#3a1010" />
            </mesh>
          )}
          {shades && (
            <group position={[0, 0.06, 0.04]}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.12 * sd, 0, 0]} geometry={rbox(0.15, 0.09, 0.02, 0.02)} material={sm("#101018", 0.1)} />
              ))}
              <mesh geometry={rbox(0.12, 0.02, 0.02, 0.005)} material={sm("#101018", 0.1)} />
            </group>
          )}
        </group>
        {/* bracinhos */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.43 * sd, 0.4, 0]} rotation={[0, 0, sd * (0.9 + arms * 1.6 + Math.sin(t * 6) * 0.1 * arms)]}>
            <mesh position={[0, -0.12, 0]} material={sm("#f2c58a", 0.7)}>
              <capsuleGeometry args={[0.035, 0.18, 4, 8]} />
            </mesh>
          </group>
        ))}
        {/* chapéu de festa */}
        {hat && (
          <group position={[0.15, 0.85, 0]} rotation={[0, 0, -0.3]}>
            <mesh material={sm("#3a86ff", 0.5)}>
              <coneGeometry args={[0.12, 0.3, 14]} />
            </mesh>
            <mesh position={[0, 0.16, 0]} material={sm("#ffd21f", 0.4)}>
              <sphereGeometry args={[0.04, 8, 6]} />
            </mesh>
          </group>
        )}
      </group>
      {/* malinha */}
      {suitcase > 0 && (
        <group position={[0.58, 0.22, 0.05]} scale={suitcase}>
          <mesh geometry={rbox(0.3, 0.24, 0.12, 0.03)} material={sm("#8a3a1a", 0.5)} castShadow />
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]} material={sm("#3a1a0a", 0.5)}>
            <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
          </mesh>
          <mesh position={[0, 0, 0.065]} geometry={rbox(0.3, 0.04, 0.01, 0.005)} material={sm("#e8b020", 0.4)} />
        </group>
      )}
    </group>
  );
};

/* ---------- nave do hamster (rodinha dentro de uma cúpula) ---------- */
export const HamsterShip: React.FC<{p: V3; r?: V3; s?: number; t?: number; run?: number; broken?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, run = 1, broken = 0}) => {
  const fur = sm("#e8a85a", 0.8);
  const spin = t * 8 * run;
  return (
    <group position={p} rotation={r} scale={s}>
      {/* casco */}
      <mesh position={[0, 0, 0]} scale={[1.4, 0.35, 1.4]} material={sm("#cfd4da", 0.3, {metalness: 0.5})} castShadow>
        <sphereGeometry args={[1, 28, 14]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ff8a1f", 0.4, {emissive: "#ff8a1f", emissiveIntensity: 0.6})}>
        <torusGeometry args={[1.38, 0.05, 8, 40]} />
      </mesh>
      {/* cúpula de vidro */}
      <mesh position={[0, 0.25, 0]} material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.25})}>
        <sphereGeometry args={[0.95, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* rodinha */}
      <group position={[0.35, 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        {broken < 1 ? (
          <group rotation={[0, 0, spin]}>
            <mesh material={sm("#3a86ff", 0.4)}>
              <torusGeometry args={[0.42, 0.03, 8, 30]} />
            </mesh>
            {Array.from({length: 8}, (_, i) => (
              <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI * 2]} position={[0, 0, 0]} material={sm("#3a86ff", 0.4)}>
                <boxGeometry args={[0.02, 0.84, 0.02]} />
              </mesh>
            ))}
          </group>
        ) : (
          Array.from({length: 5}, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 1.3) * (0.4 + t * 0.2), Math.sin(i * 1.3) * (0.4 + t * 0.2), 0]} rotation={[i, t * 3, i]} material={sm("#3a86ff", 0.4)}>
              <boxGeometry args={[0.3, 0.03, 0.03]} />
            </mesh>
          ))
        )}
      </group>
      {/* hamster correndo */}
      <group position={[0.35, 0.42 + Math.abs(Math.sin(spin * 2)) * 0.03, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh scale={[0.17, 0.14, 0.22]} material={fur}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, -0.02, 0.17]} scale={[0.12, 0.1, 0.1]} material={sm("#fff2dc", 0.8)}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.07 * sd, 0.05, 0.22]} material={sm("#101018", 0.2)}>
              <sphereGeometry args={[0.025, 8, 6]} />
            </mesh>
            <mesh position={[0.1 * sd, 0.12, 0.08]} material={sm("#f4a0a0", 0.6)}>
              <sphereGeometry args={[0.045, 8, 6]} />
            </mesh>
            <mesh position={[0.08 * sd, -0.12, 0.05 + Math.sin(spin * 3 + sd) * 0.05]} material={sm("#f4c0a0", 0.6)}>
              <sphereGeometry args={[0.03, 6, 6]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.01, 0.27]} material={sm("#f48080", 0.5)}>
          <sphereGeometry args={[0.018, 6, 6]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- a mãe planeta ---------- */
export const PlanetMom: React.FC<{p: V3; s?: number; t?: number; mad?: number}> = ({p, s = 1, t = 0, mad = 1}) => (
  <group position={p} scale={s} rotation={[0, 0, Math.sin(t) * 0.05]}>
    <mesh material={sm("#c86bfa", 0.6)}>
      <sphereGeometry args={[1, 32, 20]} />
    </mesh>
    {[[0.4, 0.5, 0.2], [-0.5, -0.2, 0.15], [0.1, -0.6, 0.12]].map(([x, y, r], i) => (
      <mesh key={i} position={[x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.98]} material={sm("#a64ad8", 0.7)}>
        <circleGeometry args={[r, 16]} />
      </mesh>
    ))}
    {/* anel */}
    <mesh rotation={[1.2, 0.2, 0]} material={sm("#ffd21f", 0.5, {transparent: true, opacity: 0.85})}>
      <torusGeometry args={[1.5, 0.08, 6, 48]} />
    </mesh>
    {/* rosto bravo */}
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.3 * sd, 0.2, 0.92]}>
        <mesh scale={[0.13, 0.15, 0.05]} material={sm("#ffffff", 0.3)}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <mesh position={[0, -0.02, 0.05]} scale={[0.07, 0.08, 0.03]} material={sm("#101018", 0.3)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[0.02 * sd, 0.2, 0.04]} rotation={[0, 0, -sd * 0.5 * mad]} material={sm("#3a1a4a", 0.5)}>
          <boxGeometry args={[0.28, 0.05, 0.04]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, -0.3, 0.95]} rotation={[0, 0, 0]} scale={[0.25, 0.08 + 0.06 * Math.abs(Math.sin(t * 5)), 0.05]} material={sm("#3a1010", 0.6)}>
      <sphereGeometry args={[1, 14, 8]} />
    </mesh>
  </group>
);

/* ---------- ovo fugitivo (com pernas) ---------- */
export const EggGuy: React.FC<{p: V3; rotY?: number; s?: number; t?: number; ph?: number}> = ({p, rotY = 0, s = 1, t = 0, ph = 0}) => (
  <group position={p} rotation={[0, rotY, Math.sin(t * 8 + ph) * 0.15]} scale={s}>
    <mesh position={[0, 0.36 + Math.abs(Math.sin(t * 8 + ph)) * 0.06, 0]} scale={[0.17, 0.22, 0.17]} material={sm("#fff6e6", 0.4)} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <group key={sd}>
        <mesh position={[0.06 * sd, 0.42, 0.15]} material={sm("#101018", 0.2)}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
        <mesh position={[0.07 * sd, 0.08, 0]} rotation={[Math.sin(t * 16 + ph + sd) * 0.4, 0, 0]} material={sm("#e8a020", 0.5)}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
        </mesh>
      </group>
    ))}
  </group>
);

/* ---------- faca ---------- */
export const Faca: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.18, 0]} geometry={rbox(0.06, 0.26, 0.01, 0.005)} material={sm("#d8dde6", 0.15, {metalness: 0.7})} />
    <mesh position={[0, 0, 0]} geometry={rbox(0.05, 0.12, 0.03, 0.01)} material={sm("#3a1a0a", 0.6)} />
  </group>
);

/* ---------- portal girando ---------- */
export const Portal: React.FC<{p: V3; r?: V3; s?: number; t?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0, i * 0.01]} rotation={[0, 0, t * (2 + i) * (i % 2 ? -1 : 1)]}>
        <circleGeometry args={[0.9 - i * 0.25, 7 - i]} />
        <meshBasicMaterial color={["#c86bfa", "#3ee0c0", "#ffffff"][i]} toneMapped={false} />
      </mesh>
    ))}
  </group>
);

/* ---------- galáxia de chantilly ---------- */
export const ChantillyGalaxy: React.FC<{p: V3; s?: number; t?: number; k?: number}> = ({p, s = 1, t = 0, k = 1}) => (
  <group position={p} scale={s} rotation={[1.1, 0, t * 0.3]}>
    {Array.from({length: 90}, (_, i) => {
      const arm = i % 3;
      const d = (i / 90) * 2.4 * k;
      const a = d * 2.2 + (arm * Math.PI * 2) / 3;
      return (
        <mesh key={i} position={[Math.cos(a) * d, Math.sin(a) * d, ((i * 37) % 10) * 0.02]} scale={0.06 + ((i * 13) % 5) * 0.015}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={i % 4 === 0 ? "#ffb3d9" : "#fffaf0"} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);
