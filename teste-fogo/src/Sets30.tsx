import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Face} from "./Sets28";

/* ===== Objetos do vídeo "Lavar a roupa" ===== */
const BLACK = "#15151c";
const SOCKC = ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f", "#c86bfa", "#ff9f1c", "#ffffff"];

/* ---------- meia ---------- */
export const Meia: React.FC<{p: V3; r?: V3; s?: number; c?: string}> = ({p, r = [0, 0, 0], s = 1, c = "#ff4d6d"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.12, 0]} material={sm(c, 0.85)} castShadow>
      <capsuleGeometry args={[0.05, 0.2, 4, 10]} />
    </mesh>
    <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm(c, 0.85)} castShadow>
      <capsuleGeometry args={[0.05, 0.1, 4, 10]} />
    </mesh>
    <mesh position={[0, 0.25, 0]} material={sm("#ffffff", 0.85)}>
      <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
    </mesh>
  </group>
);

/* ---------- máquina de lavar com cara (ofendida ou feliz) ---------- */
export const Maquina: React.FC<{p: V3; rotY?: number; s?: number; t?: number; mood?: "mad" | "happy" | "sad"; spin?: number; shake?: number; mouth?: number}> = ({p, rotY = 0, s = 1, t = 0, mood = "happy", spin = 0, shake = 0, mouth = 0}) => {
  const body = sm("#f2f4f7", 0.35);
  const sh = shake * 0.03 * Math.sin(t * 45);
  return (
    <group position={[p[0] + sh, p[1] + Math.abs(sh) * 0.5, p[2]]} rotation={[0, rotY, shake * 0.03 * Math.sin(t * 38)]} scale={s}>
      <mesh position={[0, 0.6, 0]} geometry={rbox(1.0, 1.2, 0.85, 0.08)} material={body} castShadow receiveShadow />
      <mesh position={[0, 1.12, 0.3]} geometry={rbox(0.98, 0.14, 0.2, 0.03)} material={sm("#d9dde3", 0.4)} />
      {[-0.3, -0.15].map((x) => (
        <mesh key={x} position={[x, 1.12, 0.41]} rotation={[Math.PI / 2, 0, 0]} material={sm("#3a86ff", 0.4)}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
        </mesh>
      ))}
      {/* porta redonda com a roupa girando */}
      <group position={[0, 0.52, 0.43]}>
        <mesh material={sm("#b8bec8", 0.3, {metalness: 0.6})}>
          <torusGeometry args={[0.3, 0.05, 10, 32]} />
        </mesh>
        <mesh position={[0, 0, -0.02]} material={sm("#7fd0ff", 0.1, {transparent: true, opacity: 0.55})}>
          <circleGeometry args={[0.28, 28]} />
        </mesh>
        <group position={[0, 0, -0.06]} rotation={[0, 0, t * (2 + spin * 14)]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.57) * 0.13, Math.sin(i * 1.57) * 0.13, 0]} material={sm(SOCKC[i], 0.8)}>
              <sphereGeometry args={[0.07, 10, 8]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* rosto em cima da porta */}
      <Face p={[0, 0.92, 0.43]} s={0.9} brow={mood === "mad" ? -1 : 0} scared={mood === "sad" ? 0.6 : 0} smile={mood === "happy" ? 1 : 0} mouth={mouth} />
      {[[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]} material={sm(BLACK, 0.5)}>
          <cylinderGeometry args={[0.04, 0.05, 0.04, 10]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- caranguejo encanador (boné e chave inglesa) ---------- */
export const Caranguejo: React.FC<{p: V3; rotY?: number; s?: number; t?: number; work?: number; fold?: number}> = ({p, rotY = 0, s = 1, t = 0, work = 0, fold = 0}) => {
  const red = sm("#e8412c", 0.45);
  const walk = 0.04 * Math.sin(t * 12);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.32, 0]} scale={[0.42, 0.22, 0.32]} material={red} castShadow>
        <sphereGeometry args={[1, 22, 14]} />
      </mesh>
      {[-1, 1].map((sd) =>
        [0, 1, 2].map((k) => (
          <mesh key={sd + "" + k} position={[0.38 * sd, 0.18 + walk * (k % 2 ? 1 : -1), -0.12 + k * 0.12]} rotation={[0, 0, 0.9 * sd]} material={red}>
            <capsuleGeometry args={[0.025, 0.22, 4, 8]} />
          </mesh>
        )),
      )}
      {/* garras */}
      {[-1, 1].map((sd) => (
        <group key={"g" + sd} position={[0.34 * sd, 0.42 + (work > 0 ? 0.1 * Math.sin(t * 10 + sd) : 0), 0.28]} rotation={[-0.3 - fold * 0.6 * Math.abs(Math.sin(t * 6)), 0, 0]}>
          <mesh position={[0, 0, 0.1]} scale={[0.1, 0.08, 0.14]} material={red} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh position={[0.03 * sd, 0.03, 0.22]} rotation={[0.3, 0, 0]} scale={[0.04, 0.03, 0.07]} material={red}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        </group>
      ))}
      {work > 0 && (
        <group position={[0.34, 0.5, 0.42]} rotation={[0, 0, 0.6 * Math.sin(t * 10)]}>
          <mesh material={sm("#b8bec8", 0.3, {metalness: 0.7})}>
            <boxGeometry args={[0.04, 0.3, 0.03]} />
          </mesh>
          <mesh position={[0, 0.17, 0]} material={sm("#b8bec8", 0.3, {metalness: 0.7})}>
            <torusGeometry args={[0.04, 0.015, 6, 12, Math.PI * 1.4]} />
          </mesh>
        </group>
      )}
      {/* olhos em antenas */}
      {[-1, 1].map((sd) => (
        <group key={"o" + sd} position={[0.1 * sd, 0.5, 0.18]}>
          <mesh position={[0, 0.06, 0]} material={red}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
          </mesh>
          <mesh position={[0, 0.14, 0]} material={sm("#ffffff", 0.3)}>
            <sphereGeometry args={[0.05, 12, 10]} />
          </mesh>
          <mesh position={[0, 0.14, 0.04]} material={sm(BLACK, 0.2)}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* boné azul */}
      <group position={[0, 0.55, -0.02]}>
        <mesh scale={[1, 0.5, 1]} material={sm("#2e6fd8", 0.6)}>
          <sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.0, 0.2]} rotation={[-0.15, 0, 0]} scale={[1, 0.2, 0.8]} material={sm("#2e6fd8", 0.6)}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 16, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- sábio das meias perdidas (capa de meias, barba e chapéu) ---------- */
export const Sabio: React.FC<{p: V3; rotY?: number; s?: number; t?: number; mouth?: number; shy?: number; arms?: number}> = ({p, rotY = 0, s = 1, t = 0, mouth = 0, shy = 0, arms = 0}) => {
  const robe = sm("#4a3a8a", 0.7);
  const skin = sm("#f1c08f", 0.6);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.7, 0]} material={robe} castShadow>
        <coneGeometry args={[0.55, 1.4, 20]} />
      </mesh>
      {/* capa coberta de meias de todas as cores */}
      {Array.from({length: 26}, (_, i) => {
        const a = (i / 26) * Math.PI * 2 * 3;
        const y = 0.15 + (i / 26) * 1.0;
        const r = 0.5 - (i / 26) * 0.32;
        return <Meia key={i} p={[Math.sin(a) * r, y, Math.cos(a) * r]} r={[0, a, 0.4 * Math.sin(i)]} s={0.85} c={SOCKC[i % SOCKC.length]} />;
      })}
      {/* braços */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.35 * sd, 1.05 + arms * 0.25, 0.1]} rotation={[0.3 - arms * 1.2, 0, (0.9 - arms * 0.5) * sd]} material={robe}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        </mesh>
      ))}
      {/* cabeça */}
      <group position={[0, 1.55, 0]} rotation={[shy * 0.4, 0, 0]}>
        <mesh material={skin} castShadow>
          <sphereGeometry args={[0.26, 22, 16]} />
        </mesh>
        <Face p={[0, 0.03, 0.24]} s={0.8} blink={shy > 0.5 ? 1 : 0} smile={mouth > 0 ? 0 : 1} mouth={mouth} />
        {shy > 0.3 &&
          [-1, 1].map((sd) => (
            <mesh key={sd} position={[0.15 * sd, -0.04, 0.2]} scale={[1, 0.6, 0.3]} material={sm("#ff6b8a", 0.5)}>
              <sphereGeometry args={[0.06, 10, 8]} />
            </mesh>
          ))}
        {/* barba longa */}
        <mesh position={[0, -0.28, 0.12]} rotation={[Math.PI, 0, 0]} material={sm("#f2f2f2", 0.9)} castShadow>
          <coneGeometry args={[0.2, 0.55, 14]} />
        </mesh>
        {/* chapéu de mago */}
        <mesh position={[0, 0.36, -0.02]} rotation={[-0.2, 0, 0.1 * Math.sin(t * 2)]} material={robe} castShadow>
          <coneGeometry args={[0.26, 0.6, 18]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={robe}>
          <torusGeometry args={[0.28, 0.05, 8, 24]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- lavanderia ---------- */
export const Lavanderia: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9e8f2", 0.7)} receiveShadow>
      <planeGeometry args={[12, 12]} />
    </mesh>
    {Array.from({length: 7}, (_, i) =>
      Array.from({length: 7}, (_, j) => (
        <mesh key={i + "" + j} rotation={[-Math.PI / 2, 0, 0]} position={[-3 + i, 0.003, -3 + j]} material={sm((i + j) % 2 ? "#c9d9e6" : "#e8f1f8", 0.7)}>
          <planeGeometry args={[0.98, 0.98]} />
        </mesh>
      )),
    )}
    <mesh position={[0, 1.8, -2.6]} material={sm("#bfe6d8", 0.85)} receiveShadow>
      <boxGeometry args={[10, 3.6, 0.2]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[3.4 * sd, 1.8, 0]} material={sm("#bfe6d8", 0.85)} receiveShadow>
        <boxGeometry args={[0.2, 3.6, 6]} />
      </mesh>
    ))}
    {/* porta (pra tia bater) */}
    <mesh position={[-2.2, 1.05, -2.48]} geometry={rbox(0.9, 2.1, 0.06, 0.03)} material={sm("#a0704a", 0.6)} />
    <mesh position={[-1.9, 1.0, -2.43]} material={sm("#e3b33b", 0.3, {metalness: 0.6})}>
      <sphereGeometry args={[0.04, 8, 6]} />
    </mesh>
    {/* varal com meias */}
    <mesh position={[1.4, 2.6, -2.3]} rotation={[0, 0, Math.PI / 2]} material={sm("#ffffff", 0.5)}>
      <cylinderGeometry args={[0.01, 0.01, 2.6, 6]} />
    </mesh>
    {[0.4, 1.0, 1.6, 2.2].map((x, i) => (
      <Meia key={x} p={[x, 2.33, -2.28]} r={[0, 0, Math.PI]} s={1.2} c={SOCKC[i]} />
    ))}
    {/* ralo no chão */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.006, 0.6]} material={sm("#9aa1ad", 0.3, {metalness: 0.6})}>
      <ringGeometry args={[0.12, 0.2, 20]} />
    </mesh>
  </group>
);

/* ---------- espuma ---------- */
export const Espuma: React.FC<{p: V3; s?: number; t?: number}> = ({p, s = 1, t = 0}) => (
  <group position={p} scale={s}>
    {Array.from({length: 14}, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 2.3) * 0.8, 0.2 + (i % 4) * 0.25 + 0.04 * Math.sin(t * 3 + i), Math.cos(i * 1.7) * 0.5]} material={sm("#ffffff", 0.9)}>
        <sphereGeometry args={[0.25 + (i % 3) * 0.08, 12, 10]} />
      </mesh>
    ))}
  </group>
);

/* ---------- chuva de meias ---------- */
export const ChuvaMeias: React.FC<{t: number; c?: V3; n?: number; w?: number}> = ({t, c = [0, 0, 0], n = 40, w = 6}) => (
  <group position={c}>
    {Array.from({length: n}, (_, i) => {
      const x = Math.sin(i * 12.9898) * w;
      const z = Math.cos(i * 4.1) * 2 - 1;
      const y = 7 - ((t * (1.5 + (i % 5) * 0.3) + i * 0.47) % 7);
      return <Meia key={i} p={[x, y, z]} r={[t * 3 + i, i, t * 2]} s={1.6} c={SOCKC[i % SOCKC.length]} />;
    })}
  </group>
);
export {SOCKC};
export const _three = THREE;
