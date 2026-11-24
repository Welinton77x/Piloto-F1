import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

const eyeM = () => sm("#101018", 0.3);

/* ---------- banana (casca no chão / banana viva empresária) ---------- */
export const Banana: React.FC<{p: V3; r?: V3; s?: number; t?: number; peel?: boolean; face?: number; glasses?: boolean; talk?: number; blink?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, peel = false, face = 0, glasses = false, talk = 0, blink = 0}) => {
  const yel = sm("#ffd21f", 0.6);
  if (peel)
    return (
      <group position={p} rotation={r} scale={s}>
        <mesh position={[0, 0.03, 0]} scale={[0.1, 0.05, 0.1]} material={yel}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.57) * 0.13, 0.02, Math.sin(i * 1.57) * 0.13]} rotation={[0, -i * 1.57, Math.PI / 2 - 0.15]} scale={[0.03, 0.14, 0.05]} material={yel}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        ))}
      </group>
    );
  return (
    <group position={p} rotation={r} scale={s}>
      {Array.from({length: 7}, (_, i) => {
        const a = -0.9 + i * 0.3;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.35, 0.35 + Math.cos(a) * 0.35 - 0.35 + i * 0.0, 0]} rotation={[0, 0, -a]} material={yel} castShadow>
            <cylinderGeometry args={[0.12 - Math.abs(i - 3) * 0.015, 0.12 - Math.abs(i - 3) * 0.015, 0.14, 12]} />
          </mesh>
        );
      })}
      <mesh position={[Math.sin(1.05) * 0.35, Math.cos(1.05) * 0.35, 0]} material={sm("#5a3a1a", 0.7)}>
        <cylinderGeometry args={[0.025, 0.03, 0.08, 6]} />
      </mesh>
      {face > 0 && (
        <group position={[0, 0.38, 0.12]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.045 * sd, 0.03, 0]} scale={[0.022, 0.03 * Math.max(0.1, 1 - blink), 0.012]} material={eyeM()}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))}
          <mesh position={[0, -0.04, 0]} scale={[0.035, 0.012 + 0.02 * talk * Math.abs(Math.sin(t * 14)), 0.01]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          {glasses && (
            <group position={[0, 0.03, 0.01]}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.045 * sd, 0, 0]} material={sm("#08080c", 0.1)}>
                  <boxGeometry args={[0.065, 0.04, 0.01]} />
                </mesh>
              ))}
              <mesh material={sm("#08080c", 0.1)}>
                <boxGeometry args={[0.03, 0.01, 0.01]} />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
};

/* ---------- geladeira demiurgo: gigante, 3 olhos, aura ---------- */
export const Demiurgo: React.FC<{p: V3; s?: number; t?: number; blink?: number; mouth?: number; tired?: number; arms?: number}> = ({p, s = 1, t = 0, blink = 0, mouth = 0, tired = 0, arms = 0}) => {
  const body = sm("#e8eef5", 0.35, {metalness: 0.2});
  const eyeY = Math.max(0.08, 1 - blink - tired * 0.5);
  return (
    <group position={p} scale={s}>
      {/* aura */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.2, -0.45 - i * 0.02]} rotation={[0, 0, t * (0.6 + i * 0.3) * (i % 2 ? -1 : 1)]} material={sm(["#b04aff", "#ff4ad8", "#4ad8ff"][i], 0.3, {emissive: ["#b04aff", "#ff4ad8", "#4ad8ff"][i], emissiveIntensity: 1.4, transparent: true, opacity: 0.55})}>
          <torusGeometry args={[1.15 + i * 0.22, 0.04, 8, 6 + i]} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 0]} geometry={rbox(1.2, 2.4, 0.8, 0.12)} material={body} castShadow />
      <mesh position={[0, 1.62, 0.41]} geometry={rbox(1.14, 0.02, 0.02, 0.005)} material={sm("#b8c0cc", 0.4)} />
      <mesh position={[0.45, 1.2, 0.43]} geometry={rbox(0.06, 0.6, 0.05, 0.02)} material={sm("#b8c0cc", 0.3, {metalness: 0.6})} />
      {/* três olhos */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <group key={i} position={[x, i === 1 ? 2.1 : 1.95, 0.42]}>
          <mesh scale={[0.13, 0.13 * eyeY, 0.03]} material={sm("#ffffff", 0.3)}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[Math.sin(t * 1.3 + i) * 0.03, 0, 0.025]} scale={[0.06, 0.06 * eyeY, 0.02]} material={sm("#7a2aff", 0.2, {emissive: "#7a2aff", emissiveIntensity: 1})}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.4, 0.42]} scale={[0.25, 0.04 + 0.12 * mouth, 0.02]} material={sm("#2a1020", 0.5)}>
        <sphereGeometry args={[1, 14, 8]} />
      </mesh>
      {/* bracinhos */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.62 * sd, 1.3, 0]} rotation={[-arms * 1.4 + (arms > 0 ? Math.sin(t * 22 + (sd > 0 ? 0 : Math.PI)) * 0.5 * arms : 0), 0, sd * 0.3]}>
          <mesh position={[0, -0.3, 0]} material={body}>
            <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ---------- portal roxo no chão ---------- */
export const PortalChao: React.FC<{p: V3; s?: number; t?: number; k?: number}> = ({p, s = 1, t = 0, k = 1}) => (
  <group position={p} scale={[s * k, s, s * k]}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.02 + i * 0.004, 0]} rotation={[-Math.PI / 2, 0, t * (2 + i) * (i % 2 ? -1 : 1)]} material={sm(["#5a1a9a", "#9a3aff", "#e08aff"][i], 0.3, {emissive: ["#5a1a9a", "#9a3aff", "#e08aff"][i], emissiveIntensity: 1.3})}>
        <circleGeometry args={[1 - i * 0.3, 7]} />
      </mesh>
    ))}
    <pointLight position={[0, 0.5, 0]} intensity={8 * k} distance={5} color="#b05aff" />
  </group>
);

/* ---------- fundo cósmico (estrelas + planetas coloridos) ---------- */
export const Cosmos: React.FC<{t: number; c1?: string}> = ({t, c1 = "#1a0a3a"}) => (
  <>
    <color attach="background" args={[c1]} />
    <ambientLight intensity={0.8} />
    <directionalLight position={[3, 5, 6]} intensity={2} />
    {Array.from({length: 70}, (_, i) => (
      <mesh key={i} position={[((i * 0.618) % 1) * 24 - 12, ((i * 0.37) % 1) * 20 - 6, -8 - (i % 5)]} material={sm("#ffffff", 0.2, {emissive: "#ffffff", emissiveIntensity: 1})}>
        <sphereGeometry args={[0.03 + (i % 3) * 0.02, 6, 4]} />
      </mesh>
    ))}
    {[
      ["#ff6ad8", -3.5, 5, 0.8],
      ["#4ad8ff", 4, 7, 1.1],
      ["#ffd21f", 3, -1, 0.5],
    ].map(([c, x, y, r], i) => (
      <mesh key={i} position={[x as number, y as number, -10]} rotation={[0, t * 0.3, 0]} material={sm(c as string, 0.6)}>
        <sphereGeometry args={[r as number, 20, 14]} />
      </mesh>
    ))}
  </>
);

/* ---------- nuvem de miojo ---------- */
export const NuvemMiojo: React.FC<{p: V3; s?: number; t?: number}> = ({p, s = 1, t = 0}) => (
  <group position={p} scale={s} rotation={[0, 0, Math.sin(t) * 0.05]}>
    {Array.from({length: 10}, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 1.7) * 0.45, Math.sin(i * 2.3) * 0.15, Math.sin(i * 1.1) * 0.2]} rotation={[i, i * 0.5, 0]} material={sm("#f2d27a", 0.6)}>
        <torusKnotGeometry args={[0.18, 0.03, 40, 6, 2, 3]} />
      </mesh>
    ))}
  </group>
);

/* ---------- peixe (para andar de bicicleta) ---------- */
export const Peixe: React.FC<{p: V3; rotY?: number; s?: number; t?: number; color?: string}> = ({p, rotY = 0, s = 1, t = 0, color = "#ff8a3a"}) => {
  const m = sm(color, 0.5);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh scale={[0.12, 0.2, 0.3]} material={m} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, Math.sin(t * 10) * 0.4]} scale={[1, 1, 0.3]} material={m}>
        <coneGeometry args={[0.15, 0.2, 4]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.1 * sd, 0.06, 0.16]} scale={[0.02, 0.035, 0.035]} material={eyeM()}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- Lua com cara ---------- */
export const LuaCara: React.FC<{p: V3; s?: number; t?: number; angry?: number; blink?: number; mouth?: number}> = ({p, s = 1, t = 0, angry = 0, blink = 0, mouth = 0}) => (
  <group position={p} scale={s} rotation={[0, 0, Math.sin(t * 2) * 0.05]}>
    <mesh material={sm("#e8e4d4", 0.9)} castShadow>
      <sphereGeometry args={[1, 24, 18]} />
    </mesh>
    {[[-0.5, 0.4, 0.15], [0.55, -0.35, 0.12], [-0.3, -0.55, 0.1], [0.4, 0.6, 0.08]].map(([x, y, r], i) => (
      <mesh key={i} position={[x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.98]} scale={[r, r, r * 0.3]} material={sm("#bdb8a6", 0.9)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) => (
      <group key={sd}>
        <mesh position={[0.28 * sd, 0.15, 0.95]} scale={[0.08, 0.11 * Math.max(0.1, 1 - blink), 0.04]} material={eyeM()}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[0.28 * sd, 0.33, 0.93]} rotation={[0, 0, sd * 0.4 * angry]} material={eyeM()}>
          <boxGeometry args={[0.2, 0.04, 0.03]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, -0.25, 0.96]} scale={[0.15, 0.03 + 0.1 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
      <sphereGeometry args={[1, 10, 8]} />
    </mesh>
  </group>
);

/* ---------- relógio de pastéis (o tempo medido em pastéis) ---------- */
export const RelogioPastel: React.FC<{p: V3; s?: number; t?: number}> = ({p, s = 1, t = 0}) => (
  <group position={p} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#f2c46a", 0.6)}>
      <cylinderGeometry args={[0.5, 0.5, 0.08, 7]} />
    </mesh>
    <mesh position={[0, 0, 0.05]} rotation={[0, 0, -t * 3]} material={sm("#5a3a1a", 0.5)}>
      <boxGeometry args={[0.03, 0.4, 0.02]} />
    </mesh>
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 1.047) * 0.38, Math.sin(i * 1.047) * 0.38, 0.05]} rotation={[0, 0, i * 1.047]} scale={[0.09, 0.05, 0.02]} material={sm("#d99a3a", 0.6)}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
    ))}
  </group>
);

/* ---------- gravatinha (para o pombo corretor) ---------- */
export const Gravata: React.FC<{p: V3; s?: number; color?: string}> = ({p, s = 1, color = "#e8262d"}) => (
  <group position={p} scale={s}>
    <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI]} material={sm(color, 0.5)}>
      <coneGeometry args={[0.035, 0.11, 4]} />
    </mesh>
    <mesh position={[0, 0.02, 0]} material={sm(color, 0.5)}>
      <boxGeometry args={[0.04, 0.03, 0.02]} />
    </mesh>
  </group>
);
