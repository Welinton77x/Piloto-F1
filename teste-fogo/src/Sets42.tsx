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

/* ---------- demiurgo: cobra gigante com cabeça de leão ---------- */
export const Demiurgo: React.FC<{p: V3; s?: number; t?: number; blink?: number; mouth?: number; tired?: number; arms?: number; rotY?: number}> = ({p, s = 1, t = 0, blink = 0, mouth = 0, tired = 0, arms = 0, rotY = 0}) => {
  const scale = sm("#8fa69c", 0.55);
  const belly = sm("#f2dfb8", 0.6);
  const mane = sm("#c8842a", 0.85);
  const mane2 = sm("#e0a040", 0.85);
  const fur = sm("#e6c690", 0.75);
  const sway = Math.sin(t * 1.6) * 0.06 + (arms > 0 ? Math.sin(t * 20) * 0.1 * arms : 0);
  const droop = tired * 0.5;
  /* pescoço em S: do rolo até a cabeça */
  const neck = Array.from({length: 12}, (_, i) => {
    const k = i / 11;
    return [Math.sin(k * Math.PI * 1.2) * 0.35 + sway * k * 3, 0.45 + k * (1.7 - droop), -0.1 + Math.sin(k * Math.PI) * 0.25 - droop * k * 0.3] as V3;
  });
  const hp = neck[11];
  const eyeY = Math.max(0.08, 1 - blink - tired * 0.5);
  return (
    <group position={p} scale={s} rotation={[0, rotY, 0]}>
      {/* aura suave */}
      <mesh position={[0, 1.3, -0.6]} rotation={[0, 0, t * 0.4]} material={sm("#b04aff", 0.3, {emissive: "#b04aff", emissiveIntensity: 1.2, transparent: true, opacity: 0.35})}>
        <torusGeometry args={[1.4, 0.04, 8, 7]} />
      </mesh>
      {/* rolos do corpo */}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.9]} material={scale} castShadow>
        <torusGeometry args={[0.75, 0.2, 12, 28]} />
      </mesh>
      <mesh position={[0.05, 0.45, 0]} rotation={[Math.PI / 2, 0, 0.5]} scale={[1, 1, 0.9]} material={scale} castShadow>
        <torusGeometry args={[0.5, 0.18, 12, 24]} />
      </mesh>
      {/* rabo (faz o six seven quando arms > 0) */}
      <group position={[0.85, 0.15, 0.3]} rotation={[0, 0, -0.3 - arms * (0.8 + 0.5 * Math.sin(t * 22))]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[i * 0.16, i * 0.05, 0]} material={scale}>
            <sphereGeometry args={[0.15 - i * 0.03, 10, 8]} />
          </mesh>
        ))}
      </group>
      {neck.map((q, i) => (
        <group key={i} position={q}>
          <mesh scale={[0.2 - i * 0.004, 0.2, 0.2 - i * 0.004]} material={scale} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh position={[0, 0, 0.11]} scale={[0.15, 0.17, 0.1]} material={belly}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* cabeça de leão */}
      <group position={[hp[0], hp[1] + 0.25, hp[2] + 0.1]} rotation={[droop * 0.6, sway * 2, 0]}>
        {Array.from({length: 22}, (_, i) => {
          const a = (i / 22) * Math.PI * 2;
          const r = 0.42 + (i % 2) * 0.08;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.9, Math.sin(a) * r, -0.12]} rotation={[0, 0, a - Math.PI / 2]} material={i % 2 ? mane : mane2} castShadow>
              <coneGeometry args={[0.15, 0.42, 6]} />
            </mesh>
          );
        })}
        <mesh position={[0, 0, -0.15]} scale={[0.5, 0.55, 0.3]} material={mane}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh scale={[0.3, 0.34, 0.3]} material={fur} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.2 * sd, 0.3, -0.02]} scale={[0.08, 0.08, 0.04]} material={fur}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.12 * sd, 0.08, 0.26]} scale={[0.06, 0.05 * eyeY, 0.03]} material={sm("#e08a20", 0.3, {emissive: "#a05010", emissiveIntensity: 0.3})}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.12 * sd, 0.08, 0.285]} scale={[0.025, 0.035 * eyeY, 0.01]} material={eyeM()}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh position={[0.12 * sd, 0.15, 0.27]} rotation={[0, 0, sd * -0.2 + tired * sd * 0.3]} material={sm("#8a5a20", 0.6)}>
              <boxGeometry args={[0.12, 0.02, 0.02]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.1, 0.22]} scale={[0.17, 0.13, 0.14]} material={sm("#f2e2c4", 0.7)}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
        <mesh position={[0, -0.04, 0.34]} scale={[0.05, 0.035, 0.03]} material={sm("#c86a6a", 0.5)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
        <mesh position={[0, -0.18, 0.3]} scale={[0.08, 0.015 + 0.05 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      </group>
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
