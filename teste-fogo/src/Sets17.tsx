import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Objetos do vídeo "Se você quer arrumar o quarto, mas a bagunça é enorme" (o tamanduá) ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const UP = new THREE.Vector3(0, 1, 0);
/** cilindro ligando dois pontos */
export const Segment: React.FC<{a: V3; b: V3; r: number; mat: THREE.Material; r2?: number}> = ({a, b, r, mat, r2}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const len = Math.max(0.0001, d.length());
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  const mid = A.clone().add(B).multiplyScalar(0.5);
  return (
    <mesh position={mid} quaternion={q} material={mat}>
      <cylinderGeometry args={[r2 ?? r, r, len, 10]} />
    </mesh>
  );
};

/* ---------- tamanduá-bandeira (frente = +z), animal normal de quatro patas ---------- */
export type TamP = {
  t?: number;
  walk?: number; // 0..1 andando
  run?: number;
  blink?: number;
  sleep?: number; // 0..1 dormindo (olhos fechados, deitado)
  sniff?: number;
  belly?: number; // 0..1 barriga cheia
  tongue?: V3 | null; // ponta da língua no espaço do tamanduá (null = guardada)
  headDown?: number; // 0..1 focinho pro chão
  headYaw?: number;
  sneeze?: number; // 0..1 (sobe a cabeça e espirra)
  wifi?: number; // 0..1 risquinhos de Wi-Fi em cima
  lie?: number; // 0..1 deitado de lado no tapete
};
export const TAM_TIP: V3 = [0, 0.62, 1.42]; // ponta do focinho (sem cabeça abaixada)
export const Tamandua: React.FC<{p: V3; rotY?: number; s?: number; c?: TamP}> = ({p, rotY = 0, s = 1, c = {}}) => {
  const {t = 0, walk = 0, run = 1, blink = 0, sleep = 0, sniff = 0, belly = 0, tongue = null, headDown = 0, headYaw = 0, sneeze = 0, wifi = 0, lie = 0} = c;
  // estilo "papercraft": facetado (flat shading), cinza, peito branco espetado, faixa preta, rabo em leque
  const grey = sm("#8b8f96", 0.8, {flatShading: true});
  const greyD = sm("#5b5f66", 0.85, {flatShading: true});
  const dark = sm("#2e3035", 0.8, {flatShading: true});
  const white = sm("#f2f0ea", 0.85, {flatShading: true});
  const pink = sm("#e9a497", 0.7, {flatShading: true});
  const ph = t * 8 * run;
  const sw = (k: number) => 0.45 * Math.sin(ph + k) * walk;
  const bob = 0.025 * Math.abs(Math.sin(ph)) * walk;
  const eyeY = Math.max(0.08, 1 - Math.max(blink, sleep));
  const sniffW = 1 + 0.15 * sniff * Math.abs(Math.sin(t * 26));
  const pitch = headDown * 0.55 - sneeze * 0.45 + 0.02 * sniff * Math.sin(t * 13);
  const bS = 1 + 0.35 * belly;
  const neck: V3 = [0, 0.82, 0.52];
  const tipLocal = new THREE.Vector3(0, -0.1, 0.92);
  tipLocal.applyEuler(new THREE.Euler(pitch, headYaw, 0, "YXZ"));
  const tip: V3 = [neck[0] + tipLocal.x, neck[1] + tipLocal.y, neck[2] + tipLocal.z];
  // direção do focinho (do pescoço até a ponta) no espaço da cabeça
  const snoutDir = new THREE.Vector3(0, -0.1, 0.92).normalize();
  const snoutQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), snoutDir);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[0, 0, lie * 1.35]}>
        <group position={[0, bob - lie * 0.22, 0]}>
          {/* corpo: frente cinza clara, traseira cinza escura */}
          <mesh position={[0, 0.8, 0.12]} scale={[0.33 * bS, 0.38 * bS, 0.5]} material={grey} castShadow receiveShadow>
            <sphereGeometry args={[1, 9, 7]} />
          </mesh>
          <mesh position={[0, 0.74, -0.38]} scale={[0.3 * bS, 0.34 * bS, 0.42]} material={greyD} castShadow receiveShadow>
            <sphereGeometry args={[1, 9, 7]} />
          </mesh>
          {/* faixa preta com borda branca, do peito subindo pelo ombro */}
          <group position={[0, 0.84, 0.05]} rotation={[-0.9, 0, 0]} scale={[bS * 1.04, bS * 1.12, 1]}>
            <mesh position={[0, 0, 0.05]} material={white}>
              <torusGeometry args={[0.33, 0.03, 4, 14]} />
            </mesh>
            <mesh material={dark}>
              <torusGeometry args={[0.335, 0.06, 4, 14]} />
            </mesh>
          </group>
          {/* peito branco espetado (franja de pelo) */}
          {Array.from({length: 9}, (_, i) => {
            const a = (i / 8 - 0.5) * 2.2;
            return (
              <mesh key={"pf" + i} position={[Math.sin(a) * 0.32 * bS, 0.52 - 0.05 * Math.cos(a * 2), 0.34 + Math.cos(a) * 0.14]} rotation={[Math.PI + 0.45, 0, -a * 0.4]} material={white} castShadow>
                <coneGeometry args={[0.09, 0.34, 4]} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.68, 0.46]} scale={[0.27 * bS, 0.26, 0.16]} material={white}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          {/* rabo em leque, cheio de pontas */}
          <group position={[0, 0.85, -0.78]} rotation={[-0.55 + 0.05 * Math.sin(t * 3), 0, 0]}>
            <mesh position={[0, 0.0, -0.32]} scale={[0.08, 0.36, 0.42]} material={greyD} castShadow>
              <sphereGeometry args={[1, 6, 6]} />
            </mesh>
            {Array.from({length: 11}, (_, i) => {
              const a = -0.2 + (i / 10) * 2.6;
              return (
                <mesh key={"r" + i} position={[0, -Math.cos(a) * 0.36, -0.32 - Math.sin(a) * 0.42]} rotation={[-a + Math.PI / 2, 0, 0]} material={i % 2 ? dark : greyD} castShadow>
                  <coneGeometry args={[0.06, 0.26, 4]} />
                </mesh>
              );
            })}
          </group>
          {/* patas: da frente brancas, de trás escuras */}
          {(
            [
              [0.2, 0.32, 0, 1],
              [-0.2, 0.32, Math.PI, 1],
              [0.2, -0.45, Math.PI, 0],
              [-0.2, -0.45, 0, 0],
            ] as [number, number, number, number][]
          ).map(([x, z, k, front], i) => (
            <group key={i} position={[x, 0.62, z]} rotation={[sw(k), 0, 0]}>
              <mesh position={[0, -0.3, 0]} material={front ? white : dark} castShadow>
                <cylinderGeometry args={[0.1, 0.075, 0.5, 6]} />
              </mesh>
              {front === 1 && (
                <mesh position={[0, -0.18, 0.05]} rotation={[Math.PI + 0.2, 0, 0]} material={white}>
                  <coneGeometry args={[0.11, 0.2, 5]} />
                </mesh>
              )}
              <mesh position={[0, -0.58, 0.05]} scale={[1, 0.5, 1.4]} material={dark} castShadow>
                <sphereGeometry args={[0.09, 6, 5]} />
              </mesh>
            </group>
          ))}
          {/* cabeça: cone comprido que afina até a ponta escura */}
          <group position={neck} rotation={[pitch, headYaw, 0, "YXZ"]}>
            <mesh position={[0, 0.0, 0.0]} scale={[0.21, 0.22, 0.24]} material={grey} castShadow>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh position={[0, -0.05, 0.46]} quaternion={snoutQ} material={grey} castShadow>
              <cylinderGeometry args={[0.05, 0.19, 0.86, 7]} />
            </mesh>
            <mesh position={[0, -0.095, 0.88]} quaternion={snoutQ} material={dark}>
              <cylinderGeometry args={[0.035 * sniffW, 0.055 * sniffW, 0.1, 7]} />
            </mesh>
            {/* olhinho com mancha rosa */}
            {[-1, 1].map((sd) => (
              <group key={"e" + sd} position={[0.165 * sd, 0.06, 0.13]} rotation={[0, 0.9 * sd, 0]}>
                <mesh scale={[0.06, 0.055, 0.015]} material={pink}>
                  <sphereGeometry args={[1, 10, 8]} />
                </mesh>
                <group position={[0, 0, 0.012]} scale={[1, eyeY, 1]}>
                  <mesh scale={[0.03, 0.03, 0.01]} material={sm("#7a1f1f", 0.3)}>
                    <sphereGeometry args={[1, 10, 8]} />
                  </mesh>
                  <mesh position={[0, 0, 0.006]} scale={[0.015, 0.015, 0.006]} material={sm("#0c0c10", 0.2)}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                  <mesh position={[0.008, 0.01, 0.01]} scale={0.006} material={sm("#ffffff", 0.2)}>
                    <sphereGeometry args={[1, 6, 4]} />
                  </mesh>
                </group>
              </group>
            ))}
            {/* orelhinhas rosadas */}
            {[-1, 1].map((sd) => (
              <mesh key={"o" + sd} position={[0.13 * sd, 0.17, -0.06]} rotation={[0, 0, -0.3 * sd]} material={pink}>
                <coneGeometry args={[0.04, 0.07, 4]} />
              </mesh>
            ))}
            {/* listra de cima da cabeça */}
            <mesh position={[0, 0.17, 0.1]} rotation={[-0.25, 0, 0]} scale={[0.03, 0.02, 0.22]} material={greyD}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          </group>
          {/* língua comprida */}
          {tongue && <Segment a={tip} b={tongue} r={0.025} mat={sm("#e2607a", 0.4)} />}
          {tongue && (
            <mesh position={tongue} material={sm("#e2607a", 0.4)}>
              <sphereGeometry args={[0.04, 10, 8]} />
            </mesh>
          )}
        </group>
      </group>
      {/* risquinhos de Wi-Fi */}
      {wifi > 0.01 && (
        <group position={[0, 1.55 - lie * 0.75, 0]} scale={wifi * (1 + 0.05 * Math.sin(t * 6))}>
          {[0.12, 0.25, 0.38].map((r, i) => (
            <mesh key={r} position={[0, -0.12, 0]} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[r, 0.035, 8, 24, Math.PI / 2]} />
              <meshStandardMaterial color="#3fb6ff" emissive="#3fb6ff" emissiveIntensity={0.6 + 0.6 * ((Math.floor(t * 4) + i) % 3 === 0 ? 1 : 0)} />
            </mesh>
          ))}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#3fb6ff" emissive="#3fb6ff" emissiveIntensity={1} />
          </mesh>
        </group>
      )}
      {/* zzz dormindo */}
      {sleep > 0.5 &&
        [0, 1, 2].map((i) => {
          const q = (t * 0.6 + i / 3) % 1;
          return (
            <mesh key={"z" + i} position={[0.2 + 0.3 * q, 1.1 + 0.6 * q, 0.6]} scale={0.06 + 0.05 * q}>
              <torusGeometry args={[1, 0.25, 6, 4]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={1 - q} />
            </mesh>
          );
        })}
    </group>
  );
};
/** posição (no espaço do tamanduá) da ponta do focinho, pra começar a língua */
export const tamTip = (headDown = 0, headYaw = 0): V3 => {
  const v = new THREE.Vector3(0, -0.1, 0.92).applyEuler(new THREE.Euler(headDown * 0.55, headYaw, 0, "YXZ"));
  return [v.x, 0.82 + v.y, 0.52 + v.z];
};

/* ---------- capivara (normal) ---------- */
export const Capivara: React.FC<{p: V3; rotY?: number; s?: number; t?: number; walk?: number; blink?: number; sit?: number}> = ({p, rotY = 0, s = 1, t = 0, walk = 0, blink = 0, sit = 0}) => {
  const fur = sm("#8a5a3a", 0.9);
  const dark = sm("#5a3a24", 0.9);
  const ph = t * 6;
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <group position={[0, 0.02 * Math.abs(Math.sin(ph)) * walk - sit * 0.12, 0]}>
        <mesh position={[0, 0.5, 0]} scale={[0.36, 0.34, 0.55]} material={fur} castShadow receiveShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <group position={[0, 0.66, 0.5]}>
          <mesh geometry={rbox(0.36, 0.34, 0.5, 0.14)} material={fur} castShadow />
          <mesh position={[0, -0.04, 0.24]} geometry={rbox(0.3, 0.24, 0.1, 0.08)} material={dark} />
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh position={[0.17 * sd, 0.08, 0.08]} scale={[0.02, 0.03 * eyeY, 0.025]} material={sm("#0c0c10", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
              <mesh position={[0.12 * sd, 0.2, -0.12]} scale={[0.05, 0.05, 0.03]} material={dark}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
              <mesh position={[0.05 * sd, 0.0, 0.295]} scale={[0.02, 0.012, 0.01]} material={sm("#1d1c1f", 0.3)}>
                <sphereGeometry args={[1, 6, 4]} />
              </mesh>
            </group>
          ))}
        </group>
        {(
          [
            [0.2, 0.3, 0],
            [-0.2, 0.3, Math.PI],
            [0.2, -0.32, Math.PI],
            [-0.2, -0.32, 0],
          ] as [number, number, number][]
        ).map(([x, z, k], i) => (
          <mesh key={i} position={[x, 0.18, z]} rotation={[0.4 * Math.sin(ph + k) * walk, 0, 0]} material={fur} castShadow>
            <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ---------- formigas e formigueiro ---------- */
export const Ants: React.FC<{from: V3; to: V3; n?: number; t: number; s?: number}> = ({from, to, n = 14, t, s = 1}) => (
  <group>
    {Array.from({length: n}, (_, i) => {
      const q = (t * 0.35 + i / n) % 1;
      const x = from[0] + (to[0] - from[0]) * q, y = from[1] + (to[1] - from[1]) * q, z = from[2] + (to[2] - from[2]) * q;
      return (
        <group key={i} position={[x, y, z]} scale={s} rotation={[0, Math.atan2(to[0] - from[0], to[2] - from[2]), 0]}>
          {[-0.03, 0, 0.03].map((zz, k) => (
            <mesh key={k} position={[0, 0.015, zz]} material={sm("#2a1410", 0.5)}>
              <sphereGeometry args={[k === 1 ? 0.012 : 0.016, 8, 6]} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);
export const AntHill: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0, 0]} scale={[1, 0.6, 1]} material={sm("#a8743e", 0.95)} castShadow receiveShadow>
      <sphereGeometry args={[0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.36, 0]} material={sm("#3a2410", 0.9)}>
      <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
    </mesh>
  </group>
);

/* ---------- bagunça do quarto ---------- */
const MESS_COLS = ["#e8414f", "#2e86de", "#2ecc71", "#ffd21f", "#ff8a1f", "#9b59b6", "#f06292", "#26c6da"];
export const Mess: React.FC<{seed?: number; n?: number; w?: number; d?: number; hide?: number}> = ({seed = 7, n = 60, w = 4, d = 3, hide = 0}) => {
  const r = rng(seed);
  const items = Array.from({length: n}, () => ({x: (r() - 0.5) * w, z: (r() - 0.5) * d, y: r(), rot: r() * 6, k: Math.floor(r() * 4), c: MESS_COLS[Math.floor(r() * MESS_COLS.length)], h: r()}));
  return (
    <group>
      {items.map((it, i) =>
        i / n < hide ? null : (
          <group key={i} position={[it.x, 0.02 + it.y * 0.9 * it.h, it.z]} rotation={[it.rot * 0.3, it.rot, it.rot * 0.2]}>
            {it.k === 0 && <mesh geometry={rbox(0.35, 0.05, 0.28, 0.02)} material={sm(it.c, 0.9)} castShadow />}
            {it.k === 1 && (
              <mesh material={sm(it.c, 0.9)} castShadow>
                <capsuleGeometry args={[0.04, 0.16, 4, 8]} />
              </mesh>
            )}
            {it.k === 2 && <mesh geometry={rbox(0.2, 0.2, 0.2, 0.03)} material={sm(it.c, 0.6)} castShadow />}
            {it.k === 3 && (
              <mesh material={sm(it.c, 0.5)} castShadow>
                <sphereGeometry args={[0.1, 12, 10]} />
              </mesh>
            )}
          </group>
        ),
      )}
    </group>
  );
};
export const Sock: React.FC<{p?: V3; r?: V3; s?: number; color?: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, color = "#ffffff"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.1, 0]} material={sm(color, 0.85)} castShadow>
      <capsuleGeometry args={[0.04, 0.16, 4, 8]} />
    </mesh>
    <mesh position={[0, 0.0, 0.05]} scale={[1, 0.7, 1.6]} material={sm(color, 0.85)}>
      <sphereGeometry args={[0.042, 10, 8]} />
    </mesh>
    <mesh position={[0, 0.17, 0]} material={sm("#e8414f", 0.8)}>
      <cylinderGeometry args={[0.042, 0.042, 0.025, 12]} />
    </mesh>
  </group>
);
const deverTex = () =>
  canvasTex("dever-casa", 128, 160, (c) => {
    c.fillStyle = "#fbfbf6";
    c.fillRect(0, 0, 128, 160);
    c.strokeStyle = "#9ad1f0";
    for (let y = 30; y < 160; y += 14) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(128, y);
      c.stroke();
    }
    c.fillStyle = "#101018";
    c.font = "bold 18px sans-serif";
    c.fillText("DEVER", 10, 22);
    c.fillStyle = "#555";
    for (let y = 40; y < 150; y += 14) c.fillRect(10, y, 60 + ((y * 7) % 50), 3);
  });
export const Homework: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={tm("dever-casa", deverTex(), 0.8, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.24, 0.3]} />
    </mesh>
  </group>
);
export const GameConsole: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.36, 0.1, 0.26, 0.04)} material={sm("#20222c", 0.35)} castShadow />
    <mesh position={[0, 0.051, 0.06]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: 1.2})}>
      <planeGeometry args={[0.2, 0.012]} />
    </mesh>
  </group>
);
export const FishTank: React.FC<{p?: V3; s?: number; t?: number}> = ({p = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.15, 0]} material={sm("#bfe8ff", 0.05, {transparent: true, opacity: 0.35})}>
      <boxGeometry args={[0.4, 0.3, 0.25]} />
    </mesh>
    <mesh position={[0, 0.12, 0]} material={sm("#5ec8ff", 0.1, {transparent: true, opacity: 0.45})}>
      <boxGeometry args={[0.38, 0.22, 0.23]} />
    </mesh>
    <group position={[0.08 * Math.sin(t * 2), 0.14, 0]} rotation={[0, Math.cos(t * 2) > 0 ? 0 : Math.PI, 0]}>
      <mesh scale={[0.06, 0.04, 0.02]} material={sm("#ff8a1f", 0.4)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#ff8a1f", 0.4)}>
        <coneGeometry args={[0.03, 0.04, 8]} />
      </mesh>
    </group>
  </group>
);
export const Router: React.FC<{p?: V3; r?: V3; s?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.3, 0.06, 0.2, 0.02)} material={sm("#f2f2f2", 0.4)} castShadow />
    {[-0.1, 0.1].map((x) => (
      <mesh key={x} position={[x, 0.12, -0.08]} material={sm("#20222c", 0.4)}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 8]} />
      </mesh>
    ))}
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[-0.09 + i * 0.06, 0.031, 0.101]} material={sm("#2ecc71", 0.3, {emissive: "#2ecc71", emissiveIntensity: (Math.floor(t * 8) + i) % 2 ? 1.5 : 0.3})}>
        <sphereGeometry args={[0.01, 6, 4]} />
      </mesh>
    ))}
  </group>
);
export const RockingChair: React.FC<{p?: V3; rotY?: number; t?: number; s?: number}> = ({p = [0, 0, 0], rotY = 0, t = 0, s = 1}) => {
  const wood = sm("#8a5a2b", 0.6);
  return (
    <group position={p} rotation={[0.08 * Math.sin(t * 1.5), rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.28 * sd, 0.06, 0]} rotation={[0, Math.PI / 2, 0]} material={wood}>
          <torusGeometry args={[0.5, 0.025, 6, 20, 0.9]} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]} geometry={rbox(0.6, 0.06, 0.55, 0.02)} material={wood} castShadow />
      <mesh position={[0, 0.85, -0.25]} rotation={[-0.15, 0, 0]} geometry={rbox(0.6, 0.8, 0.05, 0.02)} material={wood} castShadow />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[0.27 * sx, 0.25, 0.22 * sz]} material={wood}>
            <cylinderGeometry args={[0.02, 0.02, 0.42, 6]} />
          </mesh>
        )),
      )}
    </group>
  );
};

/* ---------- acessórios no espaço da cabeça do boneco ---------- */
export const HeadGlasses: React.FC<{color?: string}> = ({color = "#1d1f27"}) => (
  <group position={[0, -0.03, 0.29]}>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.11 * sd, 0, 0]} rotation={[0, 0.25 * sd, 0]} material={sm(color, 0.3)}>
        <torusGeometry args={[0.07, 0.01, 8, 22]} />
      </mesh>
    ))}
    <mesh material={sm(color, 0.3)}>
      <boxGeometry args={[0.08, 0.014, 0.014]} />
    </mesh>
  </group>
);
export const PilotCap: React.FC = () => (
  <group position={[0, 0.26, 0.0]} rotation={[-0.1, 0, 0]}>
    <mesh material={sm("#1f2a44", 0.5)} castShadow>
      <cylinderGeometry args={[0.31, 0.27, 0.16, 24]} />
    </mesh>
    <mesh position={[0, 0.09, 0]} material={sm("#ffffff", 0.5)}>
      <cylinderGeometry args={[0.32, 0.31, 0.04, 24]} />
    </mesh>
    <mesh position={[0, -0.05, 0.25]} rotation={[0.3, 0, 0]} geometry={rbox(0.36, 0.02, 0.14, 0.01)} material={sm("#0c0c10", 0.3)} />
    <mesh position={[0, 0.02, 0.29]} material={sm("#e3b33b", 0.3, {metalness: 0.6})}>
      <boxGeometry args={[0.1, 0.05, 0.01]} />
    </mesh>
  </group>
);
export const MummyWrap: React.FC = () => (
  <group>
    {[0.2, 0.08, -0.05, -0.17].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[0.15 * (i % 2 ? 1 : -1), 0, 0.1 * (i % 2 ? -1 : 1)]} material={sm("#e9e2cf", 0.95)}>
        <torusGeometry args={[0.31 - Math.abs(y) * 0.2, 0.035, 6, 24]} />
      </mesh>
    ))}
  </group>
);
export const Whistle: React.FC = () => (
  <group position={[0.02, -0.17, 0.3]} rotation={[0, 0, 0.2]}>
    <mesh material={sm("#c9ced6", 0.25, {metalness: 0.8})}>
      <capsuleGeometry args={[0.025, 0.06, 4, 8]} />
    </mesh>
  </group>
);

/* ---------- estádio (final do campeonato) ---------- */
const torcidaTex = () =>
  canvasTex("torcida", 512, 128, (c) => {
    const r = rng(5);
    c.fillStyle = "#3a3f4a";
    c.fillRect(0, 0, 512, 128);
    const cols = ["#e8414f", "#ffffff", "#2e86de", "#ffd21f", "#2ecc71", "#101018", "#ff8a1f"];
    for (let y = 4; y < 128; y += 8)
      for (let x = 2; x < 512; x += 7) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.fillRect(x + (r() - 0.5) * 2, y, 5, 6);
      }
  });
const gramadoTex = () =>
  canvasTex("gramado", 256, 256, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? "#3fae4a" : "#4cbd56";
      c.fillRect(0, i * 32, 256, 32);
    }
  });
export const Stadium: React.FC = () => {
  const line = sm("#ffffff", 0.6);
  return (
    <>
      <color attach="background" args={["#7fc8ff"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={tm("gramado", gramadoTex(), 0.9)} receiveShadow>
        <planeGeometry args={[22, 34]} />
      </mesh>
      {/* linhas do campo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={line}>
        <ringGeometry args={[2.2, 2.32, 48]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={line}>
        <planeGeometry args={[20, 0.12]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 15.5 * sd]} material={line}>
            <planeGeometry args={[20, 0.12]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12.5 * sd]} material={line}>
            <planeGeometry args={[8, 0.12]} />
          </mesh>
        </group>
      ))}
      {/* arquibancada (anel inclinado com torcida) */}
      <mesh position={[0, 3.2, 0]} scale={[1, 1, 1.45]} material={tm("torcida", torcidaTex(), 0.9, {side: THREE.DoubleSide})}>
        <cylinderGeometry args={[19, 13, 6.5, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 6.6, 0]} scale={[1, 1, 1.45]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9dde3", 0.6, {side: THREE.DoubleSide})}>
        <ringGeometry args={[17, 21, 64]} />
      </mesh>
    </>
  );
};
export const Goal: React.FC<{p: V3; rotY?: number; net?: number}> = ({p, rotY = 0, net = 1}) => {
  const post = sm("#ffffff", 0.4);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.8 * sd, 0.6, 0]} material={post} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]} material={post} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3.7, 10]} />
      </mesh>
      {net > 0.01 && (
        <mesh position={[0, 0.6, -0.5]} rotation={[0.35, 0, 0]} scale={[1, net, 1]} material={sm("#ffffff", 0.9, {wireframe: true, transparent: true, opacity: 0.7})}>
          <planeGeometry args={[3.6, 1.3, 18, 7]} />
        </mesh>
      )}
    </group>
  );
};
export const Ball: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#ffffff", 0.4)} castShadow>
      <icosahedronGeometry args={[0.11, 1]} />
    </mesh>
    <mesh scale={1.01} material={sm("#101018", 0.4, {wireframe: true})}>
      <icosahedronGeometry args={[0.11, 0]} />
    </mesh>
  </group>
);

/* ---------- avião de passageiros ---------- */
export const Airliner: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => {
  const white = sm("#f4f6f8", 0.4);
  const blue = sm("#2e6fd8", 0.4);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={white} castShadow>
        <capsuleGeometry args={[0.45, 3.6, 8, 20]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.01, 1, 0.3]} material={blue}>
        <capsuleGeometry args={[0.45, 3.6, 8, 20]} />
      </mesh>
      {Array.from({length: 12}, (_, i) => (
        <mesh key={i} position={[0.44, 0.12, -1.4 + i * 0.26]} rotation={[0, Math.PI / 2, 0]} material={sm("#20304a", 0.2)}>
          <circleGeometry args={[0.06, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 2.15]} rotation={[0.5, 0, 0]} material={sm("#20304a", 0.2)}>
        <boxGeometry args={[0.5, 0.18, 0.05]} />
      </mesh>
      <mesh position={[0, -0.15, 0.1]} geometry={rbox(5.2, 0.08, 1.0, 0.03)} material={white} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.3 * sd, -0.4, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.4)}>
          <cylinderGeometry args={[0.2, 0.18, 0.7, 14]} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, -2.1]} rotation={[-0.3, 0, 0]} geometry={rbox(0.08, 1.1, 0.7, 0.03)} material={blue} castShadow />
      <mesh position={[0, 0.15, -2.15]} geometry={rbox(1.8, 0.06, 0.5, 0.02)} material={white} />
      {/* rodinhas */}
      {[[-0.6, -0.65, 0.3], [0.6, -0.65, 0.3], [0, -0.65, 1.6]].map((w, i) => (
        <mesh key={i} position={w as V3} rotation={[0, 0, Math.PI / 2]} material={sm("#1d1f27", 0.6)}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 12]} />
        </mesh>
      ))}
    </group>
  );
};
/* ---------- caminhão de mudança ---------- */
const mudancaTex = () =>
  canvasTex("mudanca", 256, 96, (c) => {
    c.fillStyle = "#f4f6f8";
    c.fillRect(0, 0, 256, 96);
    c.fillStyle = "#e8414f";
    c.font = "bold 40px sans-serif";
    c.textAlign = "center";
    c.fillText("MUDANÇAS", 128, 60);
  });
export const MovingTruck: React.FC<{p: V3; rotY?: number; s?: number; t?: number}> = ({p, rotY = 0, s = 1, t = 0}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 1.1, -0.4]} geometry={rbox(1.4, 1.4, 2.6, 0.06)} material={sm("#f4f6f8", 0.5)} castShadow />
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.705 * sd, 1.15, -0.4]} rotation={[0, (Math.PI / 2) * sd, 0]} material={tm("mudanca", mudancaTex(), 0.5)}>
        <planeGeometry args={[2.2, 0.8]} />
      </mesh>
    ))}
    <mesh position={[0, 0.85, 1.35]} geometry={rbox(1.35, 0.9, 0.9, 0.12)} material={sm("#e8414f", 0.4)} castShadow />
    <mesh position={[0, 1.05, 1.81]} rotation={[-0.1, 0, 0]} material={sm("#9fd8ff", 0.1)}>
      <planeGeometry args={[1.1, 0.4]} />
    </mesh>
    {[[-0.65, 1.3], [0.65, 1.3], [-0.65, -1.2], [0.65, -1.2]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.3, z]} rotation={[t * 6, 0, Math.PI / 2]} material={sm("#1d1f27", 0.7)}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
      </mesh>
    ))}
  </group>
);

/* ---------- lugares do mundo ---------- */
export const EiffelTower: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => {
  const m = sm("#7a5a3a", 0.6);
  return (
    <group position={p} scale={s}>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
        <Segment key={i} a={[1.2 * x, 0, 1.2 * z]} b={[0.45 * x, 2.2, 0.45 * z]} r={0.12} r2={0.08} mat={m} />
      ))}
      <mesh position={[0, 2.25, 0]} geometry={rbox(1.3, 0.14, 1.3, 0.02)} material={m} />
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
        <Segment key={"b" + i} a={[0.45 * x, 2.3, 0.45 * z]} b={[0.18 * x, 4.6, 0.18 * z]} r={0.07} r2={0.05} mat={m} />
      ))}
      <mesh position={[0, 4.65, 0]} geometry={rbox(0.55, 0.1, 0.55, 0.02)} material={m} />
      <Segment a={[0, 4.7, 0]} b={[0, 6.3, 0]} r={0.09} r2={0.03} mat={m} />
      {/* arco de baixo */}
      <mesh position={[0, 0.95, 1.0]} material={m}>
        <torusGeometry args={[0.75, 0.06, 6, 20, Math.PI]} />
      </mesh>
    </group>
  );
};
export const Pyramid: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <mesh position={[p[0], p[1] + 1.6 * s, p[2]]} rotation={[0, Math.PI / 4, 0]} scale={s} material={sm("#e3c27a", 0.9)} castShadow receiveShadow>
    <coneGeometry args={[2.2, 3.2, 4]} />
  </mesh>
);
export const Desert: React.FC = () => (
  <>
    <color attach="background" args={["#ffd9a0"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#f0d090", 0.95)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
  </>
);
export const Snow: React.FC = () => (
  <>
    <color attach="background" args={["#cfe8ff"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#f4f8fc", 0.8)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
    {[-6, -2, 3, 7].map((x, i) => (
      <mesh key={i} position={[x, 0.8, -9 - i * 2]} scale={[2.4, 1.5, 1.6]} material={sm("#e6f0f8", 0.7)}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    ))}
  </>
);
export const OpenSea: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#8fd0ff"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 * Math.sin(t * 2), 0]} material={sm("#2e86de", 0.25, {metalness: 0.1})} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
  </>
);
export const Pantanal: React.FC = () => (
  <>
    <color attach="background" args={["#9fd8ff"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8ccf5a", 0.95)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sm("#c9a46a", 0.95)}>
      <planeGeometry args={[2.2, 80]} />
    </mesh>
    {[[-5, -6], [6, -8], [-7, -14], [5, -16]].map(([x, z], i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]} scale={[2.2, 1.2, 1]} material={sm("#4aa8d8", 0.2)}>
        <circleGeometry args={[1.4, 24]} />
      </mesh>
    ))}
    {[[-4, -3], [4.5, -4], [-6, -10], [7, -12], [-3, -18]].map(([x, z], i) => (
      <group key={"tr" + i} position={[x, 0, z]}>
        <mesh position={[0, 1.0, 0]} material={sm("#7a5a3a", 0.8)}>
          <cylinderGeometry args={[0.12, 0.16, 2, 8]} />
        </mesh>
        <mesh position={[0, 2.3, 0]} scale={[1.3, 0.9, 1.3]} material={sm("#3f9a35", 0.85)}>
          <icosahedronGeometry args={[0.9, 0]} />
        </mesh>
      </group>
    ))}
  </>
);

/* ---------- praça de alimentação do shopping ---------- */
const lojaTex = (name: string, col: string) =>
  canvasTex("loja-" + name, 256, 64, (c) => {
    c.fillStyle = col;
    c.fillRect(0, 0, 256, 64);
    c.fillStyle = "#ffffff";
    c.font = "bold 36px sans-serif";
    c.textAlign = "center";
    c.fillText(name, 128, 46);
  });
export const FoodCourt: React.FC = () => (
  <>
    <color attach="background" args={["#f2efe6"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#e6e0d2", 0.4)} receiveShadow>
      <planeGeometry args={[40, 40]} />
    </mesh>
    {[["PASTEL", "#e8414f"], ["SUSHI", "#2e86de"], ["BURGER", "#ff8a1f"], ["AÇAÍ", "#9b59b6"], ["PIZZA", "#2ecc71"]].map(([n, col], i) => (
      <group key={n} position={[-6 + i * 3, 0, -6]}>
        <mesh position={[0, 1.6, 0]} geometry={rbox(2.8, 3.2, 1.2, 0.05)} material={sm("#fbfbf6", 0.6)} />
        <mesh position={[0, 2.8, 0.61]} material={tm("loja-" + n, lojaTex(n, col), 0.5)}>
          <planeGeometry args={[2.4, 0.6]} />
        </mesh>
        <mesh position={[0, 1.0, 0.65]} geometry={rbox(2.4, 0.9, 0.1, 0.03)} material={sm(col, 0.5)} />
      </group>
    ))}
    {[[-4, 1], [-1.5, 2.5], [2, 1.5], [4.5, 2.8], [-4.5, 4]].map(([x, z], i) => (
      <group key={"m" + i} position={[x, 0, z]}>
        <mesh position={[0, 0.72, 0]} material={sm("#ffffff", 0.4)}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 20]} />
        </mesh>
        <mesh position={[0, 0.36, 0]} material={sm("#8c919b", 0.4)}>
          <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
        </mesh>
      </group>
    ))}
  </>
);

/* ---------- paraquedas ---------- */
export const Parachute: React.FC<{p: V3; t: number; s?: number}> = ({p, t, s = 1}) => (
  <group position={p} rotation={[0, 0, 0.08 * Math.sin(t * 1.5)]} scale={s}>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[0, 1.6, 0]} material={sm(i % 2 ? "#ffffff" : "#e8414f", 0.6, {side: THREE.DoubleSide})}>
        <sphereGeometry args={[0.9, 6, 8, (i / 8) * Math.PI * 2, Math.PI / 4, 0, Math.PI / 2.4]} />
      </mesh>
    ))}
    {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
      <Segment key={i} a={[0.6 * x, 1.75, 0.6 * z]} b={[0.15 * x, 0.6, 0.1 * z]} r={0.006} mat={sm("#ffffff", 0.6)} />
    ))}
  </group>
);

/* ---------- celular com tela (grupo da família, travado etc.) ---------- */
export const BigPhone: React.FC<{p?: V3; r?: V3; s?: number; screen: THREE.Texture; key2: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, screen, key2}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.5, 0.95, 0.06, 0.06)} material={sm("#1d1f27", 0.3)} castShadow />
    <mesh position={[0, 0, 0.031]} material={tm(key2, screen, 0.3, {emissive: "#ffffff", emissiveMap: screen, emissiveIntensity: 0.9})}>
      <planeGeometry args={[0.44, 0.86]} />
    </mesh>
  </group>
);
