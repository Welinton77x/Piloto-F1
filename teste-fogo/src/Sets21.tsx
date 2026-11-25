import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {rng} from "./util";

/* ===== Objetos do vídeo "Se você quer acordar cedo, mas o despertador fugiu" ===== */

/* ---------- despertador de dois sininhos (com perninhas quando foge) ---------- */
export const AlarmClock: React.FC<{p: V3; rotY?: number; s?: number; t?: number; legs?: boolean; walk?: number; ring?: number; bundle?: boolean; scared?: number}> = ({p, rotY = 0, s = 1, t = 0, legs = false, walk = 0, ring = 0, bundle = false, scared = 0}) => {
  const red = sm("#e8262d", 0.35, {metalness: 0.2});
  const gold = sm("#e3b33b", 0.3, {metalness: 0.6});
  const shake = ring > 0 ? 0.08 * Math.sin(t * 60) * ring : 0;
  const hop = legs ? Math.abs(Math.sin(walk * 2)) * 0.06 : 0;
  return (
    <group position={[p[0], p[1] + hop, p[2]]} rotation={[0, rotY, shake]} scale={s}>
      <group position={[0, legs ? 0.32 : 0.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={red} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 28]} />
        </mesh>
        <mesh position={[0, 0, 0.062]} material={sm("#ffffff", 0.4)}>
          <circleGeometry args={[0.155, 28]} />
        </mesh>
        {/* ponteiros (marcam 6h) */}
        <mesh position={[0, -0.05, 0.068]} material={sm("#101018", 0.4)}>
          <boxGeometry args={[0.018, 0.1, 0.005]} />
        </mesh>
        <mesh position={[0, 0.06, 0.07]} material={sm("#101018", 0.4)}>
          <boxGeometry args={[0.012, 0.12, 0.005]} />
        </mesh>
        {/* carinha (só quando está com medo / fugindo) */}
        {(legs || scared > 0) && (
          <group position={[0, -0.02, 0.07]}>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.05 * sd, 0.03, 0]} scale={[0.022, 0.03 * (1 + scared * 0.4), 0.01]} material={sm("#101018", 0.3)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            ))}
            <mesh position={[0, -0.05, 0]} scale={[0.03 + scared * 0.01, 0.012 + scared * 0.02, 0.01]} material={sm("#3a1510", 0.4)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        )}
        {/* sininhos e martelinho */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.12 * sd, 0.17, 0]} rotation={[0, 0, -0.5 * sd]}>
            <mesh material={gold}>
              <sphereGeometry args={[0.07, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.02 * Math.sin(t * 50) * ring, 0.22, 0]} material={gold}>
          <boxGeometry args={[0.02, 0.08, 0.02]} />
        </mesh>
        {/* pezinhos de base */}
        {!legs &&
          [-1, 1].map((sd) => (
            <mesh key={sd} position={[0.1 * sd, -0.18, 0]} material={gold}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          ))}
      </group>
      {legs &&
        [-1, 1].map((sd) => (
          <group key={sd} position={[0.07 * sd, 0.15, 0]} rotation={[0.6 * Math.sin(walk + (sd > 0 ? 0 : Math.PI)), 0, 0]}>
            <mesh position={[0, -0.07, 0]} material={sm("#101018", 0.5)}>
              <cylinderGeometry args={[0.012, 0.012, 0.14, 6]} />
            </mesh>
            <mesh position={[0, -0.14, 0.025]} scale={[1, 0.6, 1.5]} material={sm("#101018", 0.5)}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
          </group>
        ))}
      {bundle && (
        <group position={[0.16, 0.55, -0.05]} rotation={[0, 0, -0.6]}>
          <mesh material={sm("#8a5a33", 0.6)}>
            <cylinderGeometry args={[0.01, 0.01, 0.4, 6]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={sm("#e8414f", 0.8)}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
/** ondinhas de som (anéis que crescem) */
export const SoundRings: React.FC<{p: V3; t: number; color?: string; size?: number; vertical?: boolean}> = ({p, t, color = "#ffd21f", size = 1, vertical = false}) => (
  <group position={p} rotation={vertical ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
    {[0, 1, 2].map((i) => {
      const q = (t * 1.2 + i / 3) % 1;
      return (
        <mesh key={i} scale={(0.2 + q * 1.4) * size}>
          <torusGeometry args={[1, 0.05, 6, 32]} />
          <meshBasicMaterial color={color} transparent opacity={(1 - q) * 0.85} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- criado-mudo com a marquinha onde ficava o relógio ---------- */
export const Nightstand: React.FC<{p: V3; mark?: boolean}> = ({p, mark = true}) => (
  <group position={p}>
    <mesh position={[0, 0.3, 0]} geometry={rbox(0.6, 0.6, 0.45, 0.04)} material={sm("#c8874a", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 0.35, 0.23]} material={sm("#8a5a33", 0.6)}>
      <sphereGeometry args={[0.03, 8, 6]} />
    </mesh>
    {mark && (
      <mesh position={[0, 0.605, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#f2e6cc", 0.8)}>
        <ringGeometry args={[0.13, 0.17, 24]} />
      </mesh>
    )}
  </group>
);

/* ---------- praia ---------- */
export const Beach: React.FC<{t: number}> = ({t}) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#f3d9a0", 0.95)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03 + 0.02 * Math.sin(t * 2), -9]} material={sm("#2ea8de", 0.2, {metalness: 0.1})}>
      <planeGeometry args={[80, 14]} />
    </mesh>
  </>
);
export const Coconut: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#6b4a2a", 0.8)}>
      <sphereGeometry args={[0.1, 12, 10]} />
    </mesh>
    <mesh position={[0.03, 0.12, 0]} rotation={[0, 0, -0.3]} material={sm("#ff4d6d", 0.5)}>
      <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
    </mesh>
  </group>
);

/* ---------- fanfarra: chapéu alto, tambor e corneta ---------- */
export const Shako: React.FC = () => (
  <group position={[0, 0.3, 0]}>
    <mesh position={[0, 0.12, 0]} material={sm("#101018", 0.5)}>
      <cylinderGeometry args={[0.27, 0.3, 0.34, 20]} />
    </mesh>
    <mesh position={[0, -0.02, 0.24]} rotation={[0.4, 0, 0]} geometry={rbox(0.4, 0.02, 0.14, 0.01)} material={sm("#101018", 0.3)} />
    <mesh position={[0, 0.12, 0.28]} material={sm("#e3b33b", 0.3, {metalness: 0.6})}>
      <circleGeometry args={[0.07, 12]} />
    </mesh>
    <mesh position={[0, 0.38, 0]} material={sm("#ffffff", 0.7)}>
      <sphereGeometry args={[0.08, 10, 8]} />
    </mesh>
    <mesh position={[0, 0.5, 0]} scale={[0.6, 1.4, 0.6]} material={sm("#e8262d", 0.7)}>
      <sphereGeometry args={[0.08, 10, 8]} />
    </mesh>
  </group>
);
export const BandDrum: React.FC<{p?: V3; t?: number; s?: number}> = ({p = [0, 0, 0], t = 0, s = 1}) => (
  <group position={p} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#ffffff", 0.5)}>
      <cylinderGeometry args={[0.22, 0.22, 0.24, 20]} />
    </mesh>
    {[-0.125, 0.125].map((z) => (
      <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8262d", 0.4)}>
        <torusGeometry args={[0.22, 0.02, 6, 20]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.08 * sd, 0.28 + 0.05 * Math.sin(t * 16 + sd), 0.14]} rotation={[0.5, 0, 0.3 * sd]} material={sm("#c8874a", 0.6)}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
      </mesh>
    ))}
  </group>
);
export const Cornet: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const g = sm("#e3b33b", 0.25, {metalness: 0.7});
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.12, 0]} material={g}>
        <cylinderGeometry args={[0.015, 0.015, 0.26, 8]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={g}>
        <coneGeometry args={[0.07, 0.12, 14, 1, true]} />
      </mesh>
    </group>
  );
};

/* ---------- urso (normal, de quatro) ---------- */
export const Bear: React.FC<{p: V3; rotY?: number; s?: number; t?: number; eyes?: number; walk?: number; lie?: number; snore?: number; hug?: number; polar?: boolean}> = ({polar = false, p, rotY = 0, s = 1, t = 0, eyes = 1, walk = 0, lie = 0, snore = 0, hug = 0}) => {
  const fur = sm(polar ? "#f2f1ea" : "#7a4a2a", 0.9);
  const furL = sm(polar ? "#dcdad0" : "#a8744a", 0.9);
  const ph = t * 5;
  const breathe = 1 + 0.04 * Math.sin(t * 2) + snore * 0.05 * Math.sin(t * 3);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[0, 0, lie * Math.PI * 0.5]} position={[0, -lie * 0.2, 0]}>
        <mesh position={[0, 0.75, 0]} scale={[0.6 * breathe, 0.55 * breathe, 0.85]} material={fur} castShadow receiveShadow>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        {/* cabeça */}
        <group position={[0, 1.0 + hug * 0.3, 0.85]}>
          <mesh scale={[0.4, 0.37, 0.38]} material={fur} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
          </mesh>
          <mesh position={[0, -0.08, 0.3]} scale={[0.2, 0.15, 0.17]} material={furL}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[0, -0.02, 0.46]} scale={[0.07, 0.05, 0.04]} material={sm("#1d1c1f", 0.3)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          {snore > 0.01 && (
            <mesh position={[0, -0.16, 0.42]} scale={[0.06, 0.03 + 0.03 * Math.abs(Math.sin(t * 3)), 0.03]} material={sm("#3a1510", 0.4)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          )}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh position={[0.28 * sd, 0.28, -0.05]} scale={[0.12, 0.12, 0.07]} material={fur}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              <mesh position={[0.28 * sd, 0.28, 0.0]} scale={[0.07, 0.07, 0.04]} material={furL}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
              <mesh position={[0.15 * sd, 0.1, 0.33]} scale={[0.04, 0.045 * Math.max(0.12, eyes), 0.02]} material={sm("#101018", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
        </group>
        {/* patas */}
        {(
          [
            [0.32, 0.45, 0],
            [-0.32, 0.45, Math.PI],
            [0.32, -0.45, Math.PI],
            [-0.32, -0.45, 0],
          ] as [number, number, number][]
        ).map(([x, z, k], i) => (
          <group key={i} position={[x, 0.42, z]} rotation={[0.5 * Math.sin(ph + k) * walk - (i < 2 ? hug * 1.4 : 0), 0, i < 2 ? -hug * 0.5 * Math.sign(x) : 0]}>
            <mesh position={[0, -0.2, 0]} material={fur} castShadow>
              <capsuleGeometry args={[0.13, 0.3, 4, 10]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.85, -0.8]} material={fur}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
};
/** caverna de pedra (urso hibernando) */
export const Cave: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#f4f8fc", 0.8)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    <mesh position={[0, 0, -0.6]} scale={[3.4, 2.6, 3]} material={sm("#6b6f78", 0.95, {flatShading: true, side: THREE.DoubleSide})}>
      <sphereGeometry args={[1, 10, 8, Math.PI * 1.06, Math.PI * 0.88, 0, Math.PI / 2]} />
    </mesh>
    {[-4, 3.6, -2.4, 4.6].map((x, i) => (
      <mesh key={i} position={[x, 0.4, -3 - i]} scale={[1.6, 1.0, 1.2]} material={sm("#e6f0f8", 0.8, {flatShading: true})}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    ))}
  </>
);

/* ---------- carneirinho (normal) ---------- */
export const Sheep: React.FC<{p: V3; rotY?: number; s?: number; t?: number; walk?: number; jump?: number; bag?: boolean}> = ({p, rotY = 0, s = 1, t = 0, walk = 0, jump = 0, bag = false}) => {
  const wool = sm("#f7f5ef", 0.95);
  const dark = sm("#2a2a30", 0.6);
  const r = rng(6);
  const puffs = Array.from({length: 9}, () => [(r() - 0.5) * 0.4, 0.45 + (r() - 0.3) * 0.2, (r() - 0.5) * 0.55] as V3);
  return (
    <group position={[p[0], p[1] + jump, p[2]]} rotation={[0, rotY, 0]} scale={s}>
      {puffs.map((q, i) => (
        <mesh key={i} position={q} material={wool} castShadow>
          <sphereGeometry args={[0.18, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0.38]} scale={[0.13, 0.15, 0.16]} material={dark}>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.06 * sd, 0.6, 0.5]} material={sm("#ffffff", 0.3)}>
          <sphereGeometry args={[0.022, 8, 6]} />
        </mesh>
      ))}
      {[
        [0.12, 0.18],
        [-0.12, 0.18],
        [0.12, -0.18],
        [-0.12, -0.18],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[0.5 * Math.sin(t * 8 + i * 1.6) * walk, 0, 0]} material={dark}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
        </mesh>
      ))}
      {bag && <mesh position={[0.24, 0.3, 0.1]} geometry={rbox(0.14, 0.12, 0.08, 0.02)} material={sm("#8a5a33", 0.6)} />}
    </group>
  );
};
export const Fence: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    {[-0.5, 0, 0.5].map((x) => (
      <mesh key={x} position={[x, 0.35, 0]} material={sm("#c8874a", 0.7)} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
      </mesh>
    ))}
    {[0.25, 0.55].map((y) => (
      <mesh key={y} position={[0, y, 0]} material={sm("#c8874a", 0.7)}>
        <boxGeometry args={[1.2, 0.07, 0.05]} />
      </mesh>
    ))}
  </group>
);

/* ---------- caixa de papelão (esconderijo) ---------- */
export const Cardboard: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.25, 0]} geometry={rbox(0.7, 0.5, 0.55, 0.02)} material={sm("#c89a5a", 0.8)} castShadow />
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.35 * sd + 0.1 * sd, 0.5, 0]} rotation={[0, 0, -sd * 0.8]} material={sm("#b8884a", 0.8)}>
        <boxGeometry args={[0.3, 0.02, 0.55]} />
      </mesh>
    ))}
  </group>
);
