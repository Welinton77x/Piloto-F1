import React, {useMemo} from "react";
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {canvasTex, clamp, lerp} from "./util";
import {lp, V3} from "./Sets5";

/* ===== Objetos do vídeo "Faltar na aula": escola com carinha, piscina de gelatina, dinossauro de massinha, sala de aula ===== */

const sm = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (color: string, rough = 0.5, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const k = color + rough + JSON.stringify(extra);
    let m = cache.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});
      cache.set(k, m);
    }
    return m;
  };
})();
const texMat = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (key: string, tex: THREE.Texture, rough = 0.7) => {
    let m = cache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({map: tex, roughness: rough});
      cache.set(key, m);
    }
    return m;
  };
})();
const rbox = (() => {
  const cache = new Map<string, THREE.BufferGeometry>();
  return (w: number, h: number, d: number, r = 0.06) => {
    const k = `${w}|${h}|${d}|${r}`;
    let g = cache.get(k);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 3, r);
      cache.set(k, g);
    }
    return g;
  };
})();

/* ---------- escola (com carinha quando fica doente) ---------- */
const placaTex = () =>
  canvasTex("placa-escola", 512, 128, (c) => {
    c.fillStyle = "#2f6fd6";
    c.fillRect(0, 0, 512, 128);
    c.fillStyle = "#ffffff";
    c.font = "bold 84px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("ESCOLA", 256, 70);
  });
export const SCHOOL_W = 7;
export const SCHOOL_H = 4.4;
export const SCHOOL_D = 4;
/** janelas da frente (x, y) — as duas do meio de cima viram olhos */
export const WINDOWS: [number, number][] = [
  [-2.5, 1.35], [-1.25, 1.35], [1.25, 1.35], [2.5, 1.35],
  [-2.5, 3.05], [-1.0, 3.05], [1.0, 3.05], [2.5, 3.05],
];
export type SchoolState = {
  sick?: number; // 0..1 cara de doente (olhos, bochecha)
  hot?: number; // telhado vermelho + fumacinha
  drip?: number; // porta escorrendo
  thermo?: number; // termômetro na porta
  inflate?: number; // incha antes do espirro
  sneeze?: number; // 0..1 o espirro (sacode pra frente)
  eyesClosed?: number;
  t?: number;
  open?: number; // janelas abertas (vidro some)
};
export const School: React.FC<{p: V3; s?: SchoolState}> = ({p, s = {}}) => {
  const {sick = 0, hot = 0, drip = 0, thermo = 0, inflate = 0, sneeze = 0, eyesClosed = 0, t = 0, open = 0} = s;
  const wall = sm("#f6e3b4", 0.8);
  const trim = sm("#e7a845", 0.7);
  const roof = sm(new THREE.Color("#d9534f").lerp(new THREE.Color("#ff2a1a"), hot).getStyle(), 0.6, {emissive: new THREE.Color("#ff3010"), emissiveIntensity: 0.35 * hot});
  const glass = sm("#8fd0f2", 0.2, {metalness: 0.1});
  const dark = sm("#2a1a14", 0.8);
  const white = sm("#ffffff", 0.3);
  const pupil = sm("#101014", 0.15);
  const blush = sm("#ff8a8a", 0.6, {transparent: true, opacity: 0.85});
  const sx = 1 + 0.08 * inflate - 0.05 * Math.sin(Math.PI * sneeze);
  const sy = 1 + 0.1 * inflate - 0.12 * Math.sin(Math.PI * sneeze);
  const lean = -0.12 * Math.sin(Math.PI * clamp(sneeze * 1.3)) + 0.04 * inflate;
  const eyeH = Math.max(0.12, 1 - 0.45 * sick - eyesClosed);
  return (
    <group position={p}>
      <group rotation={[lean, 0, 0]} scale={[sx, sy, sx]}>
        <mesh position={[0, SCHOOL_H / 2, 0]} geometry={rbox(SCHOOL_W, SCHOOL_H, SCHOOL_D, 0.15)} material={wall} castShadow receiveShadow />
        <mesh position={[0, 0.25, SCHOOL_D / 2 + 0.01]} material={trim}>
          <boxGeometry args={[SCHOOL_W - 0.1, 0.5, 0.06]} />
        </mesh>
        {/* telhado */}
        <mesh position={[0, SCHOOL_H + 0.25, 0]} geometry={rbox(SCHOOL_W + 0.5, 0.5, SCHOOL_D + 0.5, 0.18)} material={roof} castShadow />
        <mesh position={[0, SCHOOL_H + 0.85, SCHOOL_D / 2 - 0.2]} material={texMat("placa-escola", placaTex(), 0.6)} castShadow>
          <boxGeometry args={[3.2, 0.8, 0.12]} />
        </mesh>
        {/* janelas (as do meio de cima viram olhos) */}
        {WINDOWS.map(([x, y], i) => {
          const isEye = i === 5 || i === 6;
          return (
            <group key={i} position={[x, y, SCHOOL_D / 2 + 0.03]}>
              <mesh material={white}>
                <boxGeometry args={[0.95, 0.95, 0.08]} />
              </mesh>
              {isEye && sick > 0.01 ? (
                <group position={[0, 0, 0.05]}>
                  <mesh scale={[0.42, 0.42 * eyeH, 0.05]} material={white}>
                    <sphereGeometry args={[1, 20, 14]} />
                  </mesh>
                  <mesh position={[0, -0.04 * (1 - eyeH), 0.04]} scale={[0.2, 0.22 * eyeH, 0.05]} material={pupil}>
                    <sphereGeometry args={[1, 16, 12]} />
                  </mesh>
                  <mesh position={[0.06, 0.07 * eyeH, 0.08]} scale={0.05 * eyeH} material={white}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                  {/* pálpebra caída (doente) */}
                  <mesh position={[0, 0.42 * eyeH, 0.06]} scale={[0.46, 0.42 * (1 - eyeH) + 0.03, 0.04]} material={wall}>
                    <sphereGeometry args={[1, 16, 10]} />
                  </mesh>
                </group>
              ) : (
                <mesh position={[0, 0, 0.03]} material={glass} visible={open < 0.5}>
                  <boxGeometry args={[0.8, 0.8, 0.06]} />
                </mesh>
              )}
              {!isEye && open >= 0.5 && (
                <mesh position={[0, 0, 0.0]} material={dark}>
                  <boxGeometry args={[0.8, 0.8, 0.07]} />
                </mesh>
              )}
            </group>
          );
        })}
        {/* bochechas vermelhas */}
        {sick > 0.01 &&
          [-1, 1].map((sd) => (
            <mesh key={sd} position={[2.3 * sd, 2.25, SCHOOL_D / 2 + 0.05]} scale={[0.5 * sick, 0.32 * sick, 0.03]} material={blush}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          ))}
        {/* porta (boca) */}
        <group position={[0, 0.95, SCHOOL_D / 2 + 0.04]}>
          <mesh material={trim}>
            <boxGeometry args={[1.5, 1.8, 0.1]} />
          </mesh>
          <mesh position={[0, -0.05, 0.03]} material={sm("#7a4a2a", 0.7)}>
            <boxGeometry args={[1.25, 1.6, 0.08]} />
          </mesh>
          {/* termômetro saindo da porta */}
          {thermo > 0.01 && (
            <group position={[0.15, 0.2, 0.25]} rotation={[0.5, 0, -0.7]} scale={thermo}>
              <mesh material={white}>
                <capsuleGeometry args={[0.08, 1.0, 6, 12]} />
              </mesh>
              <mesh position={[0, -0.55, 0.0]} material={sm("#e8303f", 0.3)}>
                <sphereGeometry args={[0.13, 14, 10]} />
              </mesh>
              <mesh position={[0, -0.15, 0.06]} material={sm("#e8303f", 0.3)}>
                <boxGeometry args={[0.05, 0.75, 0.04]} />
              </mesh>
            </group>
          )}
          {/* escorrendo */}
          {drip > 0.01 &&
            [-0.4, 0.05, 0.42].map((x, i) => {
              const k = ((t * 1.1 + i * 0.37) % 1);
              return (
                <group key={i}>
                  <mesh position={[x, 0.82 - 0.25 * drip, 0.08]} scale={[0.07, 0.25 * drip, 0.05]} material={sm("#9ee86a", 0.15, {transparent: true, opacity: 0.9})}>
                    <sphereGeometry args={[1, 10, 8]} />
                  </mesh>
                  <mesh position={[x, 0.6 - k * 1.6, 0.1]} scale={0.06 * drip * (1 - k * 0.5)} material={sm("#9ee86a", 0.15, {transparent: true, opacity: 0.9})}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                </group>
              );
            })}
        </group>
        {/* fumacinha de febre no telhado */}
        {hot > 0.01 &&
          [-2, -0.6, 0.8, 2.2].map((x, i) => {
            const k = ((t * 0.5 + i * 0.27) % 1);
            return (
              <mesh key={i} position={[x + Math.sin(t * 2 + i) * 0.2, SCHOOL_H + 0.6 + k * 1.6, (i % 2 ? -0.5 : 0.6)]} scale={(0.25 + 0.35 * k) * hot} material={sm("#ffffff", 1, {transparent: true, opacity: 0.75 * (1 - k)})}>
                <icosahedronGeometry args={[1, 1]} />
              </mesh>
            );
          })}
      </group>
      {/* mastro com bandeira */}
      <mesh position={[SCHOOL_W / 2 + 0.8, 2.5, 1.2]} material={sm("#c8ccd2", 0.3, {metalness: 0.6})} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 5, 8]} />
      </mesh>
      <mesh position={[SCHOOL_W / 2 + 1.25, 4.6, 1.2]} rotation={[0, 0, 0.05 * Math.sin(t * 4)]} material={sm("#2ecc71", 0.6, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.9, 0.55]} />
      </mesh>
    </group>
  );
};

/** rajada do espirro: linhas de vento */
export const SneezeBlast: React.FC<{p: V3; k: number}> = ({p, k}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p}>
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 0.3 + k * 4;
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.5, k * 3]} rotation={[0, 0, a]} material={sm("#ffffff", 1, {transparent: true, opacity: 0.8 * (1 - k)})}>
            <boxGeometry args={[0.7, 0.07, 0.07]} />
          </mesh>
        );
      })}
      {Array.from({length: 20}, (_, i) => (
        <mesh key={"g" + i} position={[Math.sin(i * 2.3) * k * 3, Math.cos(i * 1.7) * k * 2, k * (2 + (i % 5))]} scale={0.08 * (1 - k)} material={sm("#9ee86a", 0.2)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- piscina com gelatina de morango ---------- */
export const POOL_W = 5;
export const POOL_D = 3.6;
export const JellyPool: React.FC<{p: V3; t: number; wobble?: number; level?: number}> = ({p, t, wobble = 0.3, level = 0.05}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(POOL_W - 0.5, POOL_D - 0.5, 36, 26);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, wobble * (0.12 * Math.sin(x * 1.8 + t * 9) * Math.cos(z * 2.1 - t * 7) + 0.06 * Math.sin((x + z) * 3 + t * 13)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const jelly = sm("#e3263a", 0.12, {emissive: new THREE.Color("#a00010"), emissiveIntensity: 0.25, transparent: true, opacity: 0.93});
  const tile = sm("#e9f6fb", 0.4);
  return (
    <group position={p}>
      {/* borda de azulejo */}
      {[
        [0, -POOL_D / 2, POOL_W, 0.3],
        [0, POOL_D / 2, POOL_W, 0.3],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.08, z]} geometry={rbox(w, 0.16, d, 0.05)} material={tile} receiveShadow castShadow />
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(POOL_W / 2) * sd, 0.08, 0]} geometry={rbox(0.3, 0.16, POOL_D, 0.05)} material={tile} receiveShadow castShadow />
      ))}
      <mesh position={[0, level, 0]} geometry={geo} material={jelly} receiveShadow />
      {/* morangos boiando */}
      {[[-1.4, 0.8], [0.9, -0.9], [1.6, 0.6], [-0.5, -1.1], [0.2, 1.0]].map(([x, z], i) => (
        <group key={i} position={[x, level + 0.08 + 0.05 * Math.sin(t * 6 + i) * wobble * 3, z]} rotation={[0.3 * Math.sin(i), i, 0.2]}>
          <mesh scale={[0.14, 0.17, 0.14]} material={sm("#ff3048", 0.35)}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={sm("#3fae3a", 0.6)}>
            <coneGeometry args={[0.09, 0.06, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** respingos de gelatina */
export const JellySplash: React.FC<{p: V3; k: number; n?: number}> = ({p, k, n = 12}) => {
  if (k <= 0 || k >= 1) return null;
  const m = sm("#e3263a", 0.15);
  return (
    <group position={p}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const v = 1 + (i % 3) * 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * v * k, 2.2 * k - 3 * k * k, Math.sin(a) * v * k]} scale={0.09 * (1 - k * 0.6)} material={m}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};

/** rachadura no chão (cresce com k) */
export const Crack: React.FC<{p: V3; k: number; len?: number; rotY?: number}> = ({p, k, len = 6, rotY = 0}) => {
  const geo = useMemo(() => {
    const pts: [number, number][] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) pts.push([-len / 2 + (i / n) * len, (i % 2 ? 1 : -1) * 0.18]);
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], 0);
    pts.forEach(([x, z]) => s.lineTo(x, z + 0.25));
    pts.slice().reverse().forEach(([x, z]) => s.lineTo(x, z - 0.25));
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [len]);
  if (k <= 0) return null;
  return (
    <mesh position={[p[0], p[1] + 0.02, p[2]]} rotation={[0, rotY, 0]} scale={[clamp(k * 1.2), 1, 0.3 + 1.7 * k]} geometry={geo} material={sm("#1a120c", 0.9)} />
  );
};

/* ---------- dinossauro de massinha ---------- */
export type DinoPose = {
  pos?: V3;
  rotY?: number;
  jaw?: number; // boca aberta
  blink?: number;
  headTilt?: number;
  headYaw?: number;
  arms?: number; // braços pra cima
  sit?: number;
  tail?: number; // balanço do rabo
  glasses?: boolean;
  backpack?: boolean;
  sneeze?: number;
  pupil?: [number, number];
  t?: number;
  priest?: boolean; // batina preta, gola branca, estola dourada e livro
};
export const Dino: React.FC<{p: DinoPose; s?: number}> = ({p, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, jaw = 0, blink = 0, headTilt = 0, headYaw = 0, arms = 0, sit = 0, tail = 0, glasses = false, backpack = false, sneeze = 0, pupil = [0, 0], t = 0, priest = false} = p;
  const skin = sm("#6cc24a", 0.55);
  const belly = sm("#dff2a8", 0.6);
  const spike = sm("#ff9f40", 0.5);
  const eye = sm("#0c0c10", 0.12);
  const white = sm("#ffffff", 0.2);
  const mouth = sm("#7a1f2a", 0.5);
  const blushM = sm("#ff9aa2", 0.6);
  const legY = 0.55 - 0.3 * sit;
  const eyeY = Math.max(0.08, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {/* pernas */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.32 * sd, legY, 0]} rotation={[-1.2 * sit, 0, 0]}>
          <mesh position={[0, -0.25, 0]} material={skin} castShadow>
            <capsuleGeometry args={[0.2, 0.25, 8, 16]} />
          </mesh>
          <mesh position={[0, -0.5, 0.1]} scale={[1, 0.6, 1.4]} material={skin} castShadow>
            <sphereGeometry args={[0.2, 16, 12]} />
          </mesh>
        </group>
      ))}
      <group position={[0, legY + 0.1, 0]}>
        {/* corpo e barriga */}
        <mesh position={[0, 0.55, 0]} scale={[0.6, 0.75, 0.55]} material={skin} castShadow>
          <sphereGeometry args={[1, 28, 22]} />
        </mesh>
        <mesh position={[0, 0.5, 0.3]} scale={[0.42, 0.58, 0.3]} material={belly}>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        {/* rabo */}
        {Array.from({length: 5}, (_, i) => {
          const k = i / 4;
          const sw = Math.sin(t * 3 + i * 0.6) * 0.15 * (0.5 + tail) * k;
          return (
            <mesh key={i} position={[sw, 0.25 - k * 0.15, -0.45 - k * 0.75]} scale={0.32 * (1 - k * 0.65)} material={skin} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          );
        })}
        {/* espinhos nas costas */}
        {Array.from({length: 6}, (_, i) => (
          <mesh key={i} position={[0, 1.15 - i * 0.2, -0.32 - i * 0.08 - (i > 2 ? 0.05 * i : 0)]} rotation={[-0.6 - i * 0.15, 0, 0]} material={spike} castShadow>
            <coneGeometry args={[0.09, 0.22, 10]} />
          </mesh>
        ))}
        {/* bracinhos */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.45 * sd, 0.8, 0.25]} rotation={[-0.8 - 1.6 * arms, 0, sd * (0.4 + 0.5 * arms)]}>
            <mesh position={[0, -0.14, 0]} material={skin} castShadow>
              <capsuleGeometry args={[0.07, 0.16, 6, 12]} />
            </mesh>
          </group>
        ))}
        {/* roupa de padre */}
        {priest && (
          <group>
            <mesh position={[0, 0.52, 0]} scale={[0.635, 0.79, 0.585]} material={sm("#1c1c24", 0.6)} castShadow>
              <sphereGeometry args={[1, 28, 22]} />
            </mesh>
            <mesh position={[0, 1.12, 0.04]} rotation={[Math.PI / 2 - 0.25, 0, 0]} material={sm("#ffffff", 0.4)}>
              <torusGeometry args={[0.27, 0.04, 10, 28]} />
            </mesh>
            <mesh position={[0, 1.08, 0.33]} rotation={[-0.4, 0, 0]} material={sm("#ffffff", 0.4)}>
              <boxGeometry args={[0.1, 0.07, 0.02]} />
            </mesh>
            {[-1, 1].map((sd) => {
              const a = new THREE.Vector3(0.1 * sd, 1.08, 0.36);
              const b = new THREE.Vector3(0.16 * sd, 0.22, 0.56);
              const m = a.clone().add(b).multiplyScalar(0.5);
              const d = b.clone().sub(a);
              const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
              return (
                <mesh key={sd} position={[m.x, m.y + 0.0, m.z + 0.06]} quaternion={q} scale={[1, 1, 0.4]} material={sm("#f2d16b", 0.4)}>
                  <capsuleGeometry args={[0.05, d.length(), 6, 10]} />
                </mesh>
              );
            })}
            {/* livro nas mãozinhas */}
            <group position={[0, 0.66, 0.66]} rotation={[-0.9, 0, 0]}>
              <mesh material={sm("#3a1d12", 0.5)} castShadow>
                <boxGeometry args={[0.34, 0.05, 0.26]} />
              </mesh>
              <mesh position={[0, 0.0, 0.0]} material={sm("#fbf6e8", 0.8)}>
                <boxGeometry args={[0.32, 0.035, 0.24]} />
              </mesh>
              <mesh position={[0.05, -0.04, 0.08]} material={sm("#e8414f", 0.5)}>
                <boxGeometry args={[0.02, 0.06, 0.1]} />
              </mesh>
            </group>
          </group>
        )}
        {/* mochila */}
        {backpack && (
          <group position={[0, 0.7, -0.5]}>
            <mesh geometry={rbox(0.6, 0.6, 0.25, 0.08)} material={sm("#e8412c", 0.5)} castShadow />
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.42 * sd, 0.1, 0.35]} rotation={[0, 0, 0.3 * sd]} material={sm("#4a5260", 0.6)}>
                <boxGeometry args={[0.07, 0.5, 0.05]} />
              </mesh>
            ))}
          </group>
        )}
        {/* cabeça grande */}
        <group position={[0, 1.45, 0.15]} rotation={[headTilt - 0.25 * sneeze, headYaw, 0]}>
          <mesh scale={[0.5, 0.45, 0.48]} material={skin} castShadow>
            <sphereGeometry args={[1, 28, 22]} />
          </mesh>
          {/* focinho */}
          <mesh position={[0, -0.08, 0.35]} scale={[0.38, 0.26, 0.3]} material={skin} castShadow>
            <sphereGeometry args={[1, 24, 18]} />
          </mesh>
          {/* narinas */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.09 * sd, 0.0, 0.63]} scale={0.025} material={eye}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))}
          {/* boca / mandíbula */}
          <group position={[0, -0.2, 0.3]} rotation={[0.5 * jaw, 0, 0]}>
            <mesh position={[0, -0.04, 0.05]} scale={[0.32, 0.12, 0.26]} material={skin} castShadow>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
          </group>
          {jaw > 0.05 && (
            <mesh position={[0, -0.18, 0.42]} scale={[0.22, 0.1 * jaw, 0.12]} material={mouth}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          )}
          {/* sorriso fechado */}
          {jaw <= 0.05 && (
            <mesh position={[0, -0.17, 0.52]} rotation={[0.3, 0, Math.PI + 0.35 * Math.PI]} material={mouth}>
              <torusGeometry args={[0.12, 0.014, 8, 24, Math.PI * 0.3]} />
            </mesh>
          )}
          {/* olhos grandes brilhantes */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.2 * sd, 0.15, 0.36]} rotation={[0, 0.35 * sd, 0]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.12, 0.13, 0.06]} material={white}>
                <sphereGeometry args={[1, 18, 14]} />
              </mesh>
              <mesh position={[pupil[0] * 0.03, pupil[1] * 0.03, 0.045]} scale={[0.075, 0.085, 0.04]} material={eye}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[0.03 + pupil[0] * 0.03, 0.04 + pupil[1] * 0.03, 0.08]} scale={0.022} material={white}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          {/* bochechas */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.34 * sd, -0.05, 0.33]} rotation={[0, 0.7 * sd, 0]} scale={[0.07, 0.045, 0.02]} material={blushM}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ))}
          {/* óculos redondos de estudante */}
          {glasses &&
            [-1, 1].map((sd) => (
              <mesh key={sd} position={[0.2 * sd, 0.15, 0.47]} rotation={[0, 0.35 * sd, 0]} material={sm("#2a2a30", 0.3, {metalness: 0.4})}>
                <torusGeometry args={[0.13, 0.018, 8, 24]} />
              </mesh>
            ))}
          {glasses && (
            <mesh position={[0, 0.17, 0.52]} material={sm("#2a2a30", 0.3, {metalness: 0.4})}>
              <boxGeometry args={[0.12, 0.02, 0.02]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

/* ---------- sala de aula ---------- */
const lousaTex = () =>
  canvasTex("lousa-dino", 1024, 400, (c) => {
    c.fillStyle = "#24543a";
    c.fillRect(0, 0, 1024, 400);
    c.strokeStyle = "#8a5a33";
    c.lineWidth = 24;
    c.strokeRect(0, 0, 1024, 400);
    c.fillStyle = "#f4f4ea";
    c.font = "bold 92px sans-serif";
    c.textAlign = "center";
    c.fillText("PROVA HOJE!", 512, 140);
    c.font = "bold 64px sans-serif";
    c.fillText("2 + 2 = ?", 330, 270);
    c.fillText("3 x 3 = ?", 740, 270);
  });
export const Classroom2: React.FC<{dinoDesk?: boolean}> = () => {
  const wall = sm("#ffe7a8", 0.9);
  const wall2 = sm("#a8dfd2", 0.9);
  const floor = sm("#d9a86c", 0.75);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
        <planeGeometry args={[14, 14]} />
      </mesh>
      <mesh position={[0, 2.5, -4]} material={wall} receiveShadow>
        <boxGeometry args={[14, 5, 0.2]} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} material={wall2} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
      </mesh>
      <mesh position={[5, 2.5, 0]} material={wall2} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
      </mesh>
      {/* lousa */}
      <mesh position={[0, 2.4, -3.88]} material={texMat("lousa-dino", lousaTex(), 0.9)}>
        <boxGeometry args={[4.6, 1.8, 0.05]} />
      </mesh>
      {/* janelas na parede da esquerda */}
      {[-1.5, 1.5].map((z) => (
        <group key={z} position={[-4.88, 2.6, z]}>
          <mesh material={sm("#ffffff", 0.4)}>
            <boxGeometry args={[0.05, 1.6, 1.8]} />
          </mesh>
          <mesh position={[0.02, 0, 0]} material={sm("#9fd8ff", 0.2, {emissive: new THREE.Color("#9fd8ff"), emissiveIntensity: 0.6})}>
            <boxGeometry args={[0.05, 1.4, 1.6]} />
          </mesh>
        </group>
      ))}
      {/* relógio */}
      <group position={[3.2, 3.6, -3.88]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#ffffff", 0.4)}>
          <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
        </mesh>
        <mesh position={[0, 0.1, 0.04]} material={sm("#222", 0.4)}>
          <boxGeometry args={[0.03, 0.22, 0.01]} />
        </mesh>
      </group>
    </group>
  );
};
export const SchoolDesk: React.FC<{p: V3; rotY?: number; s?: number; tag?: boolean}> = ({p, rotY = 0, s = 1, tag}) => {
  const wood = sm("#e0b07a", 0.6);
  const metal = sm("#3a7bd5", 0.4, {metalness: 0.3});
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.74, 0]} geometry={rbox(0.9, 0.06, 0.6, 0.025)} material={wood} castShadow receiveShadow />
      {[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]} material={metal} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.74, 8]} />
        </mesh>
      ))}
      {/* cadeira */}
      <group position={[0, 0, 0.62]}>
        <mesh position={[0, 0.45, 0]} geometry={rbox(0.5, 0.05, 0.45, 0.02)} material={wood} castShadow />
        <mesh position={[0, 0.75, 0.2]} geometry={rbox(0.5, 0.4, 0.05, 0.02)} material={wood} castShadow />
        {[[-0.21, -0.18], [0.21, -0.18], [-0.21, 0.18], [0.21, 0.18]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.225, z]} material={metal}>
            <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
          </mesh>
        ))}
      </group>
      {tag && (
        <mesh position={[0, 0.78, 0.22]} rotation={[-0.5, 0, 0]} material={texMat("seu-lugar", seuLugarTex(), 0.6)}>
          <boxGeometry args={[0.5, 0.14, 0.01]} />
        </mesh>
      )}
    </group>
  );
};
const seuLugarTex = () =>
  canvasTex("seu-lugar", 256, 72, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 72);
    c.fillStyle = "#e8412c";
    c.font = "bold 40px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("VOCÊ", 128, 38);
  });

/** folha de prova (com a nota 10 quando `graded`) */
const provaTex = (graded: boolean) =>
  canvasTex("prova" + (graded ? "10" : ""), 256, 340, (c) => {
    c.fillStyle = "#fbfaf4";
    c.fillRect(0, 0, 256, 340);
    c.fillStyle = "#2a2a30";
    c.font = "bold 26px sans-serif";
    c.fillText("PROVA", 20, 40);
    c.font = "18px sans-serif";
    c.fillText("Nome: Dino", 20, 72);
    c.strokeStyle = "#9ab";
    c.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      c.beginPath();
      c.moveTo(20, 110 + i * 26);
      c.lineTo(236, 110 + i * 26);
      c.stroke();
    }
    c.fillStyle = "#3a3a90";
    c.font = "italic 18px sans-serif";
    c.fillText("2 + 2 = 4  ✓", 26, 132);
    c.fillText("T-rex > você ✓", 26, 184);
    if (graded) {
      c.strokeStyle = "#e8262d";
      c.lineWidth = 8;
      c.beginPath();
      c.arc(185, 70, 50, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#e8262d";
      c.font = "bold 62px sans-serif";
      c.textAlign = "center";
      c.fillText("10", 185, 92);
    }
  });
export const TestPaper: React.FC<{p?: V3; r?: V3; s?: number; graded?: boolean}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, graded = false}) => (
  <mesh position={p} rotation={r} scale={s} material={texMat("prova" + (graded ? "10" : ""), provaTex(graded), 0.85)} castShadow>
    <boxGeometry args={[0.3, 0.4, 0.004]} />
  </mesh>
);
export const Pencil: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={sm("#ffcf33", 0.5)}>
      <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
    </mesh>
    <mesh position={[0, -0.09, 0]} rotation={[Math.PI, 0, 0]} material={sm("#e8c08a", 0.6)}>
      <coneGeometry args={[0.012, 0.03, 6]} />
    </mesh>
  </group>
);
export const Tissue: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[0.12, 0.1, 0.05]} material={sm("#ffffff", 0.9)}>
      <icosahedronGeometry args={[1, 1]} />
    </mesh>
  </group>
);

/** jardim simples: grama, calçada, árvores, céu já vem do Sky */
export const Yard: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={lp("#86d260")} receiveShadow>
      <planeGeometry args={[120, 120]} />
    </mesh>
    <mesh position={[0, 0.01, 1.6]} rotation={[-Math.PI / 2, 0, 0]} material={lp("#dcd5c6")} receiveShadow>
      <planeGeometry args={[60, 3]} />
    </mesh>
  </group>
);
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
