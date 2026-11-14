import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Vídeo "Se o seu tênis estiver com chulé" ===== */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = matCache.get(key);
  if (!m) matCache.set(key, (m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra})));
  return m;
};

/* ---------- olhinhos genéricos (só aparecem quando o objeto ganha vida) ---------- */
const LittleEye: React.FC<{p: V3; r: number; k: number; blink?: number; look?: [number, number]; wide?: number}> = ({p, r, k, blink = 0, look = [0, 0], wide = 0}) => {
  if (k < 0.01) return null;
  const sy = Math.max(0.08, 1 - blink) * (1 + 0.2 * wide);
  return (
    <group position={p} scale={[k, k * sy, k]}>
      <mesh scale={[r, r * 1.15, r * 0.55]} material={sm("#ffffff", 0.15)}>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      <mesh position={[look[0] * r * 0.3, look[1] * r * 0.3, r * 0.45]} scale={[r * 0.55, r * 0.65, r * 0.25]} material={sm("#0c0c10", 0.1)}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <mesh position={[look[0] * r * 0.3 + r * 0.18, look[1] * r * 0.3 + r * 0.25, r * 0.62]} scale={r * 0.17} material={sm("#ffffff", 0.1, {emissive: "#ffffff", emissiveIntensity: 0.4})}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
    </group>
  );
};

/* ---------- o tênis (branco de sola laranja, igual ao do boneco) — frente = +z ----------
   alive = 0: tênis comum (sem cara). alive > 0: os olhos e a boca "brotam" (escala). */
export type SneakerP = {alive?: number; blink?: number; mood?: number; smile?: number; mouth?: number; tongue?: number; look?: [number, number]; arms?: "down" | "crossed" | "up" | "wave"; t?: number; bowtie?: boolean; color?: string; sole?: string; wide?: number; hop?: number};
export const Sneaker: React.FC<{p?: V3; r?: V3; s?: number; c?: SneakerP}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, c = {}}) => {
  const {alive = 0, blink = 0, mood = 0, smile = 0, mouth = 0, tongue = 0, look = [0, 0], arms = "down", t = 0, bowtie = false, color = "#f4f4f2", sole = "#f08a1c", wide = 0, hop = 0} = c;
  const up = sm(color, 0.45);
  const so = sm(sole, 0.5);
  const dark = sm("#1d1f27", 0.5);
  const lace = sm("#2b2e3b", 0.6);
  const k = alive;
  const y0 = hop * Math.abs(Math.sin(t * 9)) * 0.12;
  return (
    <group position={p} rotation={r} scale={s}>
      <group position={[0, y0, 0]}>
        {/* solado */}
        <mesh position={[0, 0.05, 0.02]} geometry={rbox(0.42, 0.1, 1.0, 0.045)} material={so} castShadow receiveShadow />
        <mesh position={[0, 0.105, 0.02]} geometry={rbox(0.43, 0.035, 1.01, 0.015)} material={sm("#ffffff", 0.5)} />
        {/* cabedal: calcanhar + gáspea + bico */}
        <mesh position={[0, 0.3, -0.27]} geometry={rbox(0.39, 0.4, 0.44, 0.14)} material={up} castShadow />
        <mesh position={[0, 0.23, 0.04]} geometry={rbox(0.38, 0.27, 0.44, 0.11)} material={up} castShadow />
        <mesh position={[0, 0.2, 0.25]} scale={[0.19, 0.12, 0.25]} material={up} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* biqueira e detalhe lateral laranja */}
        <mesh position={[0, 0.14, 0.33]} scale={[0.2, 0.07, 0.19]} material={so}>
          <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.196 * sd, 0.27, -0.12]} rotation={[0, (Math.PI / 2) * sd, -0.35 * sd]} geometry={rbox(0.28, 0.06, 0.01, 0.02)} material={so} />
        ))}
        {/* boca do tênis (abertura) e lingueta */}
        <mesh position={[0, 0.5, -0.3]} scale={[0.14, 0.02, 0.15]} material={dark}>
          <sphereGeometry args={[1, 16, 8]} />
        </mesh>
        <mesh position={[0, 0.48, -0.1]} rotation={[-0.35, 0, 0]} geometry={rbox(0.2, 0.22, 0.04, 0.05)} material={up} castShadow />
        {/* cadarços cruzados */}
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.375 - i * 0.04, -0.03 + i * 0.075]} rotation={[0.55, 0, 0]}>
            <mesh material={lace}>
              <boxGeometry args={[0.24, 0.016, 0.022]} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.125 * sd, 0, 0]} material={sm("#c9ced6", 0.3, {metalness: 0.5})}>
                <cylinderGeometry args={[0.014, 0.014, 0.03, 8]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* laço do cadarço; com vida, as pontas viram bracinhos */}
        {k < 0.5 ? (
          <group position={[0, 0.43, -0.07]}>
            {[-1, 1].map((sd) => (
              <group key={sd}>
                <mesh position={[0.05 * sd, 0.0, -0.01]} rotation={[Math.PI / 2 - 0.2, 0, sd * 0.4]} scale={[1, 0.6, 1]} material={lace}>
                  <torusGeometry args={[0.035, 0.009, 6, 12]} />
                </mesh>
                <mesh position={[0.035 * sd, -0.04, 0.04]} rotation={[0.9, 0, sd * 0.3]} material={lace}>
                  <boxGeometry args={[0.012, 0.09, 0.012]} />
                </mesh>
              </group>
            ))}
          </group>
        ) : (
          [-1, 1].map((sd) => {
            const w = 0.12 * Math.sin(t * 10);
            const P: Record<string, V3[]> = {
              down: [[0.04, 0.43, -0.07], [0.16, 0.44, -0.04], [0.25, 0.32, 0.0], [0.27, 0.18, 0.04]],
              crossed: [[0.04, 0.43, -0.07], [0.14, 0.43, 0.02], [0.06, 0.43, 0.12], [-0.12, 0.42, 0.14]],
              up: [[0.04, 0.43, -0.07], [0.13, 0.55, -0.06], [0.2, 0.7, -0.02], [0.24 + w * 0.3, 0.84, 0.0]],
              wave: sd > 0 ? [[0.04, 0.43, -0.07], [0.15, 0.53, -0.05], [0.24, 0.66, -0.02], [0.3 + w, 0.8, 0.0]] : [[0.04, 0.43, -0.07], [0.16, 0.44, -0.04], [0.25, 0.32, 0.0], [0.27, 0.18, 0.04]],
            };
            const pts = P[arms].map(([x, y, z]) => new THREE.Vector3(x * sd, y, z));
            const curve = new THREE.CatmullRomCurve3(pts);
            const tip = pts[pts.length - 1];
            return (
              <group key={"a" + sd}>
                <mesh material={lace}>
                  <tubeGeometry args={[curve, 16, 0.014 * Math.max(0.3, k), 6, false]} />
                </mesh>
                <mesh position={tip} material={sm("#c9ced6", 0.3, {metalness: 0.5})}>
                  <sphereGeometry args={[0.025, 8, 6]} />
                </mesh>
              </group>
            );
          })
        )}
        {/* carinha (só quando ganha vida) */}
        {k > 0.01 && (
          <group>
            {[-1, 1].map((sd) => (
              <group key={sd}>
                <LittleEye p={[0.085 * sd, 0.31, 0.38]} r={0.055} k={k} blink={blink} look={look} wide={wide} />
                {k > 0.5 && <mesh position={[0.085 * sd, 0.39 + 0.02 * wide, 0.39]} rotation={[0.5, 0, sd * (-0.5 * mood + 0.2 * wide)]} scale={k} geometry={rbox(0.09, 0.018, 0.018, 0.008)} material={dark} />}
              </group>
            ))}
            <group position={[0, 0.2, 0.48]} rotation={[0.5, 0, 0]} scale={k}>
              {mouth > 0.05 || tongue > 0.05 ? (
                <>
                  <mesh scale={[0.06, 0.02 + 0.04 * Math.max(mouth, tongue * 0.6), 0.02]} material={sm("#3a1510", 0.5)}>
                    <sphereGeometry args={[1, 14, 10]} />
                  </mesh>
                  {tongue > 0.05 && (
                    <mesh position={[0, -0.03 * tongue, 0.025]} rotation={[0.6, 0, 0]} scale={[0.035, 0.05 * tongue, 0.015]} material={sm("#e2606e", 0.45)}>
                      <sphereGeometry args={[1, 12, 8]} />
                    </mesh>
                  )}
                </>
              ) : (
                <mesh rotation={[0, 0, smile > 0.3 ? Math.PI + 0.6 : 0.6]} material={sm("#3a1510", 0.5)}>
                  <torusGeometry args={[0.04, 0.009, 6, 14, Math.PI * 0.6]} />
                </mesh>
              )}
            </group>
            {bowtie && (
              <group position={[0, 0.47, -0.02]} scale={k}>
                {[-1, 1].map((sd) => (
                  <mesh key={sd} position={[0.045 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={sm("#15161d", 0.4)}>
                    <coneGeometry args={[0.04, 0.08, 4]} />
                  </mesh>
                ))}
                <mesh material={sm("#15161d", 0.4)}>
                  <sphereGeometry args={[0.018, 8, 6]} />
                </mesh>
              </group>
            )}
          </group>
        )}
      </group>
    </group>
  );
};

/* ---------- o chinelo do pai (sola amarela, tira azul) ----------
   em pé (personagem) quando stand = true; deitado no chão quando false. Cara só quando alive > 0. */
const footShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.17, 0, 0.17, 0.25, 0.13, 0.42);
  s.bezierCurveTo(0.11, 0.55, 0.2, 0.75, 0.15, 0.9);
  s.bezierCurveTo(0.1, 1.02, -0.1, 1.02, -0.15, 0.9);
  s.bezierCurveTo(-0.2, 0.75, -0.11, 0.55, -0.13, 0.42);
  s.bezierCurveTo(-0.17, 0.25, -0.17, 0, 0, 0);
  return s;
};
let footGeo: THREE.ExtrudeGeometry | null = null;
const getFootGeo = () => {
  if (!footGeo) footGeo = new THREE.ExtrudeGeometry(footShape(), {depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 24});
  return footGeo;
};
export type ChineloP = {alive?: number; blink?: number; veil?: number; smile?: number; mouth?: number; look?: [number, number]};
export const Chinelo: React.FC<{p?: V3; r?: V3; s?: number; c?: ChineloP; stand?: boolean}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, c = {}, stand = true}) => {
  const {alive = 0, blink = 0, veil = 0, smile = 0, mouth = 0, look = [0, 0]} = c;
  const k = alive;
  const strap = sm("#2e86de", 0.45);
  return (
    <group position={p} rotation={r} scale={s}>
      <group rotation={stand ? [0, 0, 0] : [-Math.PI / 2, 0, 0]} position={stand ? [0, 0, 0] : [0, 0.03, 0.5]}>
        <mesh geometry={getFootGeo()} position={[0, 0, -0.03]} material={sm("#ffd21f", 0.55)} castShadow receiveShadow />
        {/* tira em V */}
        {(() => {
          const post = new THREE.Vector3(0, 0.8, 0.04);
          return [-1, 1].map((sd) => {
            const curve = new THREE.QuadraticBezierCurve3(post, new THREE.Vector3(0.1 * sd, 0.68, 0.16), new THREE.Vector3(0.14 * sd, 0.47, 0.04));
            return (
              <mesh key={sd} material={strap} castShadow>
                <tubeGeometry args={[curve, 16, 0.028, 8, false]} />
              </mesh>
            );
          });
        })()}
        <mesh position={[0, 0.8, 0.05]} material={strap}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
        {/* carinha */}
        {k > 0.01 && (
          <group>
            {[-1, 1].map((sd) => (
              <group key={sd}>
                <LittleEye p={[0.06 * sd, 0.62, 0.05]} r={0.045} k={k} blink={blink} look={look} />
                {veil > 0.5 &&
                  [0, 1, 2].map((i) => (
                    <mesh key={i} position={[0.06 * sd + sd * (0.02 + i * 0.012), 0.675 + i * 0.006, 0.07]} rotation={[0, 0, sd * (0.6 + i * 0.35)]} scale={k} material={sm("#15161d", 0.5)}>
                      <boxGeometry args={[0.025, 0.006, 0.006]} />
                    </mesh>
                  ))}
                <mesh position={[0.11 * sd, 0.55, 0.045]} scale={[0.03 * k, 0.018 * k, 0.008]} material={sm("#ff8fab", 0.6)}>
                  <sphereGeometry args={[1, 10, 8]} />
                </mesh>
              </group>
            ))}
            <group position={[0, 0.38, 0.045]} scale={k}>
              {mouth > 0.05 ? (
                <mesh scale={[0.035, 0.012 + 0.03 * mouth, 0.012]} material={sm("#3a1510", 0.5)}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              ) : (
                <mesh rotation={[0, 0, smile > 0.3 ? Math.PI + 0.6 : 0.6]} material={sm("#3a1510", 0.5)}>
                  <torusGeometry args={[0.035, 0.008, 6, 14, Math.PI * 0.6]} />
                </mesh>
              )}
            </group>
          </group>
        )}
        {/* véu de noiva + tiarinha */}
        {veil > 0.01 && (
          <group position={[0, 0.9, -0.02]} scale={veil}>
            <mesh position={[0, -0.32, -0.06]} rotation={[0.12, 0, 0]} material={sm("#ffffff", 0.6, {transparent: true, opacity: 0.65, side: THREE.DoubleSide})}>
              <coneGeometry args={[0.26, 0.75, 24, 1, true, Math.PI * 0.5, Math.PI]} />
            </mesh>
            <mesh position={[0, 0.03, 0.03]} rotation={[0.3, 0, 0]} material={sm("#e3b33b", 0.3, {metalness: 0.6})}>
              <torusGeometry args={[0.08, 0.012, 6, 20, Math.PI]} />
            </mesh>
            {[-0.05, 0, 0.05].map((x) => (
              <mesh key={x} position={[x, 0.1 + (x === 0 ? 0.02 : 0), 0.03]} material={sm("#ffffff", 0.3, {emissive: "#ffffff", emissiveIntensity: 0.3})}>
                <sphereGeometry args={[0.015, 8, 6]} />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </group>
  );
};

/* ---------- o Chulé: nuvenzinha com carinha (verde → rosa com perfume) ---------- */
export type ChuleP = {pos?: V3; s?: number; t?: number; pink?: number; mouth?: number; smile?: number; mustache?: number; blink?: number; arms?: "down" | "opera" | "up" | "mic" | "sign" | "wave"; look?: [number, number]; blush?: number; rotY?: number; wide?: number; sad?: number};
const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 0.42],
  [0.34, 0.08, -0.05, 0.3],
  [-0.34, 0.06, -0.05, 0.31],
  [0.18, 0.3, -0.08, 0.3],
  [-0.2, 0.3, -0.06, 0.28],
  [0.02, 0.38, -0.12, 0.27],
  [0.45, -0.12, -0.1, 0.22],
  [-0.46, -0.12, -0.08, 0.22],
  [0.2, -0.22, -0.02, 0.26],
  [-0.2, -0.22, -0.02, 0.26],
];
export const Chule: React.FC<{c: ChuleP}> = ({c}) => {
  const {pos = [0, 0, 0], s = 1, t = 0, pink = 0, mouth = 0, smile = 1, mustache = 0, blink = 0, arms = "down", look = [0, 0], blush = 0, rotY = 0, wide = 0, sad = 0} = c;
  const col = new THREE.Color("#8fd14f").lerp(new THREE.Color("#ff9ccf"), pink);
  const col2 = new THREE.Color("#6fb23a").lerp(new THREE.Color("#ff7ab8"), pink);
  const m1 = sm("#" + col.getHexString(), 0.85, {emissive: "#" + col.getHexString(), emissiveIntensity: 0.15});
  const m2 = sm("#" + col2.getHexString(), 0.85, {emissive: "#" + col2.getHexString(), emissiveIntensity: 0.12});
  const bob = 0.05 * Math.sin(t * 2.4);
  const handPos = (sd: number): V3 => {
    switch (arms) {
      case "opera":
        return sd < 0 ? [-0.18, -0.02, 0.4] : [0.78, 0.35 + 0.05 * Math.sin(t * 5), 0.15];
      case "up":
        return [0.62 * sd, 0.62 + 0.06 * Math.sin(t * 8 + sd), 0.05];
      case "mic":
        return sd > 0 ? [0.32, -0.02, 0.48] : [-0.68, 0.28 + 0.08 * Math.sin(t * 5), 0.1];
      case "sign":
        return sd > 0 ? [0.45, -0.05, 0.45] : [-0.62, -0.18, 0.1];
      case "wave":
        return sd > 0 ? [0.7, 0.45 + 0.12 * Math.sin(t * 10), 0.1] : [-0.62, -0.25, 0.05];
      default:
        return [0.62 * sd, -0.28, 0.05];
    }
  };
  return (
    <group position={[pos[0], pos[1] + bob * s, pos[2]]} rotation={[0, rotY, 0]} scale={s}>
      {PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x + 0.015 * Math.sin(t * 3 + i), y + 0.015 * Math.cos(t * 2.6 + i), z]} material={i % 3 === 1 ? m2 : m1} castShadow>
          <sphereGeometry args={[r, 22, 16]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={"h" + sd} position={handPos(sd)} material={m1} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
      ))}
      {arms === "mic" && (
        <group position={handPos(1)} rotation={[0.4, 0, 0.5]}>
          <mesh position={[0, -0.06, 0.02]} material={sm("#2b2e3b", 0.35)}>
            <cylinderGeometry args={[0.025, 0.02, 0.2, 10]} />
          </mesh>
          <mesh position={[0, 0.06, 0.02]} material={sm("#9aa0aa", 0.25, {metalness: 0.6})}>
            <sphereGeometry args={[0.05, 12, 10]} />
          </mesh>
        </group>
      )}
      {arms === "sign" && (
        <group position={handPos(1)} rotation={[0, 0, -0.6]}>
          <mesh position={[0, 0.08, 0.02]} material={sm("#2b2e3b", 0.5)}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
          </mesh>
        </group>
      )}
      {/* rosto */}
      {[-1, 1].map((sd) => (
        <LittleEye key={"e" + sd} p={[0.13 * sd, 0.08 + 0.02 * wide, 0.4]} r={0.075} k={1} blink={blink} look={look} wide={wide} />
      ))}
      {sad > 0.01 &&
        [-1, 1].map((sd) => (
          <mesh key={"sb" + sd} position={[0.13 * sd, 0.2, 0.44]} rotation={[0, 0, sd * 0.35 * sad]} geometry={rbox(0.11, 0.02, 0.02, 0.008)} material={sm("#2a170d", 0.5)} />
        ))}
      {blush > 0.01 &&
        [-1, 1].map((sd) => (
          <mesh key={"b" + sd} position={[0.25 * sd, -0.02, 0.36]} scale={[0.06, 0.035, 0.01]} material={sm("#ff4d6d", 0.6, {transparent: true, opacity: blush})}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      {mouth > 0.05 ? (
        <mesh position={[0, -0.1, 0.43]} scale={[0.07 + 0.02 * mouth, 0.02 + 0.07 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ) : (
        <mesh position={[0, -0.08, 0.43]} rotation={[0, 0, smile > 0.3 ? Math.PI + 0.55 : 0.55]} material={sm("#3a1510", 0.5)}>
          <torusGeometry args={[0.06, 0.012, 6, 16, Math.PI * 0.62]} />
        </mesh>
      )}
      {mustache > 0.01 && (
        <group position={[0, -0.03, 0.45]} scale={mustache}>
          {[-1, 1].map((sd) => (
            <group key={"m" + sd}>
              <mesh position={[0.06 * sd, 0, 0]} rotation={[0, 0, -0.25 * sd]} scale={[0.07, 0.022, 0.025]} material={sm("#2a170d", 0.5)}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh position={[0.13 * sd, 0.025, -0.01]} rotation={[0, 0, sd * 0.6]} material={sm("#2a170d", 0.5)}>
                <torusGeometry args={[0.02, 0.008, 6, 12, Math.PI * 1.4]} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

/* ---------- o sol com carinha ---------- */
export const SunFace: React.FC<{p: V3; r?: number; t?: number; faint?: number; green?: number; sniff?: number; band?: boolean; blink?: number}> = ({p, r = 3, t = 0, faint = 0, green = 0, sniff = 0, band = false, blink = 0}) => {
  const col = new THREE.Color("#ffd23a").lerp(new THREE.Color("#a6d64a"), green);
  const hex = "#" + col.getHexString();
  const body = sm(hex, 0.5, {emissive: hex, emissiveIntensity: 0.9});
  const dark = sm("#5a3a10", 0.5);
  const xEye = faint > 0.5;
  return (
    <group position={p}>
      <mesh material={body}>
        <sphereGeometry args={[r, 32, 24]} />
      </mesh>
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + t * 0.2;
        const rr = r * (1.22 + 0.05 * Math.sin(t * 3 + i));
        return (
          <mesh key={i} position={[Math.cos(a) * rr, Math.sin(a) * rr, -0.2]} rotation={[0, 0, a - Math.PI / 2]} material={body}>
            <coneGeometry args={[r * 0.13, r * 0.35, 8]} />
          </mesh>
        );
      })}
      {[-1, 1].map((sd) =>
        xEye ? (
          <group key={sd} position={[r * 0.33 * sd, r * 0.18, r * 0.94]}>
            {[-1, 1].map((k) => (
              <mesh key={k} rotation={[0, 0, k * 0.785]} geometry={rbox(r * 0.26, r * 0.06, r * 0.04, r * 0.02)} material={dark} />
            ))}
          </group>
        ) : (
          <group key={sd} position={[r * 0.33 * sd, r * 0.18, r * 0.93]} scale={[1, Math.max(0.1, 1 - blink), 1]}>
            <mesh scale={[r * 0.14, r * 0.17, r * 0.05]} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <mesh position={[0, 0, r * 0.04]} scale={[r * 0.08, r * 0.1, r * 0.03]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
          </group>
        ),
      )}
      {/* nariz franzindo quando cheira */}
      <mesh position={[0, -r * 0.02 + sniff * r * 0.03, r * 0.98]} scale={[r * 0.07 * (1 + 0.3 * sniff), r * 0.06, r * 0.05]} material={sm("#f2a23a", 0.5)}>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>
      {faint > 0.3 ? (
        <group position={[0, -r * 0.35, r * 0.9]}>
          <mesh scale={[r * 0.16, r * 0.07, r * 0.04]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[r * 0.05, -r * 0.1, r * 0.03]} rotation={[0.3, 0, -0.2]} scale={[r * 0.08, r * 0.13, r * 0.03]} material={sm("#e2606e", 0.45)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, -r * 0.33, r * 0.9]} rotation={[0, 0, Math.PI + 0.55]} material={sm("#5a3a10", 0.5)}>
          <torusGeometry args={[r * 0.22, r * 0.035, 8, 20, Math.PI * 0.62]} />
        </mesh>
      )}
      {[-1, 1].map((sd) => (
        <mesh key={"c" + sd} position={[r * 0.55 * sd, -r * 0.15, r * 0.84]} scale={[r * 0.13, r * 0.08, r * 0.03]} material={sm("#ff8a5c", 0.6, {emissive: "#ff8a5c", emissiveIntensity: 0.6})}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
      {band && (
        <group position={[r * 0.45, r * 0.68, r * 0.62]} rotation={[-0.6, 0.45, 0.6]}>
          <mesh geometry={rbox(r * 0.7, r * 0.2, r * 0.04, r * 0.08)} material={sm("#f2c9a0", 0.7)} />
          <mesh position={[0, 0, r * 0.025]} geometry={rbox(r * 0.22, r * 0.14, r * 0.02, r * 0.04)} material={sm("#fff0e0", 0.8)} />
        </group>
      )}
    </group>
  );
};

/* ---------- quintal (cenário novo: lateral da casa com janela, muro, varal, morro) ---------- */
export const SILL: V3 = [-2.02, 1.32, -2.2]; // parapeito da janela (onde ficam os tênis)
const tijoloTex = () =>
  canvasTex("muro-tijolo", 256, 128, (c) => {
    c.fillStyle = "#c9714f";
    c.fillRect(0, 0, 256, 128);
    c.strokeStyle = "#e8d8c4";
    c.lineWidth = 4;
    for (let y = 0; y <= 128; y += 32) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(256, y);
      c.stroke();
      for (let x = (y / 32) % 2 ? 32 : 0; x <= 256; x += 64) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 32);
        c.stroke();
      }
    }
  }, [6, 1]);
const gramaTex = () =>
  canvasTex("grama-quintal", 256, 256, (c, r) => {
    c.fillStyle = "#7cc756";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      c.fillStyle = r() > 0.5 ? "#6cb548" : "#8fd466";
      c.fillRect(r() * 256, r() * 256, 2, 6);
    }
  }, [10, 10]);
export const Backyard: React.FC<{t: number; night?: number}> = ({t, night = 0}) => {
  const wall = sm("#f7c873", 0.85);
  const trim = sm("#ffffff", 0.6);
  const clothes = ["#ff4d6d", "#3a86ff", "#ffd21f", "#2ecc71", "#c39bd3"];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} material={tm("grama-quintal", gramaTex(), 0.9)} receiveShadow>
        <planeGeometry args={[40, 40]} />
      </mesh>
      {/* casa (parede lateral) com janela */}
      <mesh position={[-2.6, 1.8, -3]} material={wall} receiveShadow castShadow>
        <boxGeometry args={[1.0, 3.6, 8]} />
      </mesh>
      <mesh position={[-2.6, 3.85, -3]} rotation={[0, 0, 0]} material={sm("#d9534f", 0.6)} castShadow>
        <boxGeometry args={[1.4, 0.3, 8.4]} />
      </mesh>
      <mesh position={[-2.09, 1.9, -2.2]} material={sm("#2a3550", 0.3)}>
        <boxGeometry args={[0.02, 1.0, 1.1]} />
      </mesh>
      {[-0.56, 0.56].map((z) => (
        <mesh key={z} position={[-2.07, 1.9, -2.2 + z]} material={trim}>
          <boxGeometry args={[0.06, 1.1, 0.08]} />
        </mesh>
      ))}
      <mesh position={[-2.07, 2.46, -2.2]} material={trim}>
        <boxGeometry args={[0.06, 0.08, 1.2]} />
      </mesh>
      <mesh position={[-1.98, SILL[1] - 0.04, -2.2]} geometry={rbox(0.32, 0.08, 1.35, 0.02)} material={trim} castShadow receiveShadow />
      {/* luz da janela acesa à noite */}
      {night > 0.01 && (
        <mesh position={[-2.075, 1.9, -2.2]} rotation={[0, Math.PI / 2, 0]} material={sm("#ffe7a0", 0.5, {emissive: "#ffd36b", emissiveIntensity: 1.2 * night})}>
          <planeGeometry args={[1.0, 0.9]} />
        </mesh>
      )}
      <mesh position={[-2.08, 0.95, 0.4]} material={sm("#7a4a28", 0.6)}>
        <boxGeometry args={[0.04, 1.9, 0.9]} />
      </mesh>
      {/* muro de tijolo no fundo */}
      <mesh position={[1.5, 0.9, -7]} material={tm("muro-tijolo", tijoloTex(), 0.85)} receiveShadow>
        <boxGeometry args={[9, 1.8, 0.25]} />
      </mesh>
      {/* varal com roupas */}
      {[-0.6, 3.6].map((x) => (
        <mesh key={x} position={[x, 0.9, -4.6]} material={sm("#8a8f99", 0.4)}>
          <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        </mesh>
      ))}
      <mesh position={[1.5, 1.75, -4.6]} rotation={[0, 0, Math.PI / 2]} material={sm("#eeeeee", 0.5)}>
        <cylinderGeometry args={[0.008, 0.008, 4.2, 6]} />
      </mesh>
      {clothes.map((c, i) => (
        <mesh key={i} position={[-0.1 + i * 0.75, 1.48 + 0.02 * Math.sin(t * 2 + i), -4.6]} rotation={[0, 0, 0.04 * Math.sin(t * 2.2 + i)]} geometry={rbox(i % 2 ? 0.45 : 0.5, i % 2 ? 0.55 : 0.48, 0.02, 0.04)} material={sm(c, 0.8)} castShadow />
      ))}
      {/* árvore e vasos */}
      <mesh position={[4.6, 1.0, -5.4]} material={sm("#7a4a28", 0.7)}>
        <cylinderGeometry args={[0.15, 0.2, 2.0, 10]} />
      </mesh>
      {[[4.6, 2.6, -5.4, 1.1], [4.1, 2.2, -5.0, 0.8], [5.1, 2.3, -5.7, 0.8]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={sm(i ? "#4c9a35" : "#5fae3e", 0.8)} castShadow>
          <icosahedronGeometry args={[r, 1]} />
        </mesh>
      ))}
      {[[-1.7, 0, -6.2, "#e8414f"], [-1.2, 0, -6.4, "#ffd21f"]].map(([x, y, z, c], i) => (
        <group key={"v" + i} position={[x as number, y as number, z as number]}>
          <mesh position={[0, 0.2, 0]} material={sm("#c0623a", 0.7)}>
            <cylinderGeometry args={[0.2, 0.15, 0.4, 14]} />
          </mesh>
          <mesh position={[0, 0.5, 0]} material={sm(c as string, 0.6)}>
            <sphereGeometry args={[0.2, 12, 10]} />
          </mesh>
        </group>
      ))}
      {/* morros atrás do muro (onde o sol cai) */}
      {[-14, 0, 14].map((x, i) => (
        <mesh key={"m" + i} position={[x, -5, -45 - i * 3]} scale={[16, 10 + i, 8]} material={sm(i % 2 ? "#6fbf55" : "#5cae48", 0.9)}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
};
/** céu do quintal: dia → noite (k = 0..1), com estrelas */
export const SkyDome: React.FC<{night: number; t?: number}> = ({night, t = 0}) => {
  const top = new THREE.Color("#3d97e6").lerp(new THREE.Color("#0b1033"), night);
  const bot = new THREE.Color("#cfefff").lerp(new THREE.Color("#2a2f6a"), night);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {top: {value: new THREE.Color()}, bot: {value: new THREE.Color()}},
        vertexShader: "varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 vp; void main(){ float h = clamp(vp.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bot, top, h),1.0); }",
      }),
    [],
  );
  mat.uniforms.top.value.copy(top);
  mat.uniforms.bot.value.copy(bot);
  const stars = useMemo(() => {
    const r = rng(9);
    return Array.from({length: 120}, () => {
      const a = r() * Math.PI * 2;
      const e = 0.12 + r() * 1.2;
      return [Math.cos(a) * Math.cos(e) * 150, Math.sin(e) * 150, Math.sin(a) * Math.cos(e) * 150, 0.4 + r() * 0.6] as [number, number, number, number];
    });
  }, []);
  return (
    <group>
      <mesh material={mat}>
        <sphereGeometry args={[180, 32, 16]} />
      </mesh>
      {night > 0.05 &&
        stars.map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={s * (0.8 + 0.2 * Math.sin(t * 3 + i))} material={sm("#ffffff", 0.2, {emissive: "#ffffff", emissiveIntensity: 1.5, transparent: true, opacity: night})}>
            <sphereGeometry args={[0.35, 6, 4]} />
          </mesh>
        ))}
    </group>
  );
};

/* ---------- perfume gigante ---------- */
export const Perfume: React.FC<{p?: V3; r?: V3; s?: number; level?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, level = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.2, 0]} geometry={rbox(0.32, 0.4, 0.18, 0.06)} material={sm("#ffd1ea", 0.05, {transparent: true, opacity: 0.55, metalness: 0.1})} />
    {level > 0.01 && <mesh position={[0, 0.03 + 0.17 * level, 0]} geometry={rbox(0.28, 0.34 * level, 0.15, 0.05)} material={sm("#ff5fb0", 0.2, {emissive: "#ff5fb0", emissiveIntensity: 0.25})} />}
    <mesh position={[0, 0.44, 0]} material={sm("#e3b33b", 0.25, {metalness: 0.7})}>
      <cylinderGeometry args={[0.06, 0.07, 0.09, 16]} />
    </mesh>
    <mesh position={[0, 0.53, 0]} material={sm("#e3b33b", 0.25, {metalness: 0.7})}>
      <sphereGeometry args={[0.06, 14, 10]} />
    </mesh>
    <mesh position={[0, 0.2, 0.092]} material={sm("#ffffff", 0.4)}>
      <planeGeometry args={[0.18, 0.08]} />
    </mesh>
  </group>
);
/** névoa de perfume (bolinhas rosas) saindo de p na direção dir */
export const Mist: React.FC<{p: V3; dir: V3; k: number; t: number; color?: string}> = ({p, dir, k, t, color = "#ff9ccf"}) => {
  if (k < 0.01) return null;
  return (
    <group position={p}>
      {Array.from({length: 18}, (_, i) => {
        const q = (t * 0.9 + i / 18) % 1;
        const sp = 0.15 + 0.5 * q;
        return (
          <mesh key={i} position={[dir[0] * q * 1.2 + Math.sin(i * 2.1) * sp * 0.4, dir[1] * q * 1.2 + Math.cos(i * 1.7) * sp * 0.3, dir[2] * q * 1.2 + Math.sin(i * 1.3) * sp * 0.4]} material={sm(color, 0.9, {transparent: true, opacity: 0.55 * (1 - q) * k})}>
            <sphereGeometry args={[0.05 + 0.12 * q, 10, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- show de talentos ---------- */
const cortinaTex = () =>
  canvasTex("cortina-palco", 256, 256, (c) => {
    for (let x = 0; x < 256; x += 32) {
      const g = c.createLinearGradient(x, 0, x + 32, 0);
      g.addColorStop(0, "#7a0f1f");
      g.addColorStop(0.5, "#c8233a");
      g.addColorStop(1, "#7a0f1f");
      c.fillStyle = g;
      c.fillRect(x, 0, 32, 256);
    }
  }, [3, 1]);
const painelShowTex = () =>
  canvasTex("painel-show", 1024, 512, (c, r) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#1a1050");
    g.addColorStop(1, "#4a1a8a");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 70; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
      c.beginPath();
      c.arc(r() * 1024, r() * 512, 1 + r() * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.font = "bold 120px sans-serif";
    c.textAlign = "center";
    c.lineWidth = 14;
    c.strokeStyle = "#101018";
    c.strokeText("SHOW DE", 512, 200);
    c.strokeText("TALENTOS", 512, 330);
    c.fillStyle = "#ffd21f";
    c.fillText("SHOW DE", 512, 200);
    c.fillText("TALENTOS", 512, 330);
  });
const placaTex = () =>
  canvasTex("placa-10", 256, 192, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 192);
    c.strokeStyle = "#101018";
    c.lineWidth = 12;
    c.strokeRect(6, 6, 244, 180);
    c.fillStyle = "#e8262d";
    c.font = "bold 140px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("10", 128, 100);
  });
export const STAGE = {z: -3.2, top: 0.6, w: 7, d: 3};
export const TalentStage: React.FC<{t: number; lights?: number}> = ({t, lights = 1}) => {
  const {z, top, w, d} = STAGE;
  return (
    <group>
      <color attach="background" args={["#120a26"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={sm("#24183d", 0.6)} receiveShadow>
        <planeGeometry args={[30, 30]} />
      </mesh>
      {/* palco */}
      <mesh position={[0, top / 2, z]} geometry={rbox(w, top, d, 0.05)} material={sm("#3a2a1a", 0.4)} receiveShadow castShadow />
      <mesh position={[0, top + 0.005, z]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#6b4a2a", 0.25, {metalness: 0.1})} receiveShadow>
        <planeGeometry args={[w - 0.1, d - 0.1]} />
      </mesh>
      {Array.from({length: 9}, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.4 + i * ((w - 0.8) / 8), top - 0.1, z + d / 2 + 0.01]} material={sm("#fff3c4", 0.3, {emissive: "#ffd36b", emissiveIntensity: 1.5 + Math.sin(t * 6 + i)})}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
      ))}
      {/* painel e cortinas */}
      <mesh position={[0, 2.8, z - d / 2 - 0.05]} material={tm("painel-show", painelShowTex(), 0.5, {emissive: "#ffffff", emissiveMap: painelShowTex(), emissiveIntensity: 0.55})}>
        <planeGeometry args={[w - 1.2, 3.4]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(w / 2 - 0.3) * sd, 2.6, z - d / 2 + 0.2]} material={tm("cortina-palco", cortinaTex(), 0.8)} castShadow>
          <boxGeometry args={[1.2, 5.2, 0.15]} />
        </mesh>
      ))}
      <mesh position={[0, 5.0, z - d / 2 + 0.2]} material={tm("cortina-palco", cortinaTex(), 0.8)}>
        <boxGeometry args={[w + 0.4, 0.8, 0.2]} />
      </mesh>
      {/* holofotes (cones de luz) */}
      {lights > 0.01 &&
        [-2.2, 0, 2.2].map((x, i) => (
          <mesh key={"h" + i} position={[x * 0.6, 3.6, z + 0.2]} rotation={[0, 0, -x * 0.12 + 0.12 * Math.sin(t * 1.5 + i)]} material={sm(["#ff9ccf", "#fff3c4", "#9fd8ff"][i], 0.9, {transparent: true, opacity: 0.06 * lights, emissive: ["#ff9ccf", "#fff3c4", "#9fd8ff"][i], emissiveIntensity: 0.6, depthWrite: false})}>
            <coneGeometry args={[1.2, 5.6, 24, 1, true]} />
          </mesh>
        ))}
      {/* mesa dos jurados */}
      <mesh position={[0, 0.45, 2.2]} geometry={rbox(4.6, 0.9, 0.7, 0.05)} material={sm("#1d1f27", 0.4)} castShadow receiveShadow />
      <mesh position={[0, 0.55, 1.84]} material={sm("#ffd21f", 0.4, {emissive: "#ffd21f", emissiveIntensity: 0.3})}>
        <planeGeometry args={[4.4, 0.08]} />
      </mesh>
    </group>
  );
};
/** plaquinha "10" (segura pelo cabo) */
export const Plaque: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.18, 0]} material={sm("#7a4a28", 0.6)}>
      <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
    </mesh>
    <mesh position={[0, 0.42, 0.01]} material={tm("placa-10", placaTex(), 0.6, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.32, 0.24]} />
    </mesh>
  </group>
);
/** troféu dourado */
export const Trophy: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const gold = sm("#ffcc33", 0.2, {metalness: 0.8, emissive: "#6a4a00", emissiveIntensity: 0.4});
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.05, 0]} geometry={rbox(0.24, 0.1, 0.24, 0.02)} material={sm("#3a2a1a", 0.5)} />
      <mesh position={[0, 0.16, 0]} material={gold}>
        <cylinderGeometry args={[0.03, 0.05, 0.14, 12]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} material={gold}>
        <cylinderGeometry args={[0.16, 0.05, 0.26, 20, 1, true]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.17 * sd, 0.36, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={gold}>
          <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- dinheiro ---------- */
export const Bill: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.3, 0.06, 0.14, 0.01)} material={sm("#3fae5a", 0.6)} castShadow />
    <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9f5c8", 0.6)}>
      <planeGeometry args={[0.08, 0.13]} />
    </mesh>
  </group>
);
export const MoneyPile: React.FC<{p: V3; s?: number; n?: number}> = ({p, s = 1, n = 60}) => {
  const items = useMemo(() => {
    const r = rng(77);
    const out: [V3, number][] = [];
    for (let i = 0; i < n; i++) {
      const lay = Math.floor(i / 14);
      const rad = Math.max(0.1, 1.0 - lay * 0.22) * Math.sqrt(r());
      const a = r() * Math.PI * 2;
      out.push([[Math.cos(a) * rad, 0.03 + lay * 0.07, Math.sin(a) * rad], r() * 3]);
    }
    return out;
  }, [n]);
  return (
    <group position={p} scale={s}>
      {items.map(([q, a], i) => (
        <Bill key={i} p={q} r={[0, a, 0]} />
      ))}
    </group>
  );
};
/** notas caindo do céu */
export const MoneyRain: React.FC<{c: V3; t: number; k?: number; size?: [number, number]}> = ({c, t, k = 1, size = [4, 4]}) => {
  if (k < 0.01) return null;
  return (
    <group position={c}>
      {Array.from({length: 26}, (_, i) => {
        const q = (t * 0.35 + i / 26) % 1;
        return (
          <mesh key={i} position={[Math.sin(i * 7.3) * size[0] * 0.5 + 0.2 * Math.sin(t * 3 + i), 4 - q * 4.2, Math.cos(i * 3.1) * size[1] * 0.5]} rotation={[t * 3 + i, t * 2 + i, 0.3 * i]} material={sm("#3fae5a", 0.6, {side: THREE.DoubleSide})}>
            <planeGeometry args={[0.3, 0.14]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- skate ---------- */
export const Skate: React.FC<{p?: V3; r?: V3; s?: number; spin?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, spin = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.14, 0]} geometry={rbox(0.3, 0.035, 1.0, 0.04)} material={sm("#3a86ff", 0.5)} castShadow />
    <mesh position={[0, 0.16, 0]} geometry={rbox(0.28, 0.01, 0.96, 0.03)} material={sm("#1d1f27", 0.9)} />
    {[-0.33, 0.33].map((z) =>
      [-1, 1].map((sd) => (
        <mesh key={`${z}${sd}`} position={[0.12 * sd, 0.05, z]} rotation={[spin, 0, Math.PI / 2]} material={sm("#ffd21f", 0.4)}>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 14]} />
        </mesh>
      )),
    )}
  </group>
);

/* ---------- caminhão de bombeiro (frente = +z) ---------- */
const bombeiroTex = () =>
  canvasTex("bombeiros", 512, 96, (c) => {
    c.fillStyle = "#ffffff";
    c.font = "bold 72px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("BOMBEIROS", 256, 52);
  });
export const FireTruck: React.FC<{p: V3; rotY?: number; t?: number; s?: number}> = ({p, rotY = 0, t = 0, s = 1}) => {
  const red = sm("#d62828", 0.35, {metalness: 0.15});
  const steel = sm("#c9ced6", 0.3, {metalness: 0.6});
  const glass = sm("#9fd8ff", 0.1, {metalness: 0.2});
  const on = Math.sin(t * 14) > 0;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.05, -0.6]} geometry={rbox(2.2, 1.5, 4.2, 0.12)} material={red} castShadow receiveShadow />
      <mesh position={[0, 1.15, 2.05]} geometry={rbox(2.2, 1.7, 1.4, 0.2)} material={red} castShadow />
      <mesh position={[0, 1.55, 2.76]} geometry={rbox(1.9, 0.6, 0.03, 0.08)} material={glass} />
      {[-1, 1].map((sd) => (
        <mesh key={"j" + sd} position={[1.105 * sd, 1.55, 2.1]} rotation={[0, (Math.PI / 2) * sd, 0]} geometry={rbox(0.9, 0.5, 0.02, 0.06)} material={glass} />
      ))}
      <mesh position={[0, 0.55, 2.8]} geometry={rbox(2.2, 0.25, 0.12, 0.05)} material={steel} />
      {[-1, 1].map((sd) => (
        <mesh key={"f" + sd} position={[0.75 * sd, 0.85, 2.77]} scale={[1, 1, 0.4]} material={sm("#fff6c8", 0.2, {emissive: "#ffe9a0", emissiveIntensity: 0.8})}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
      ))}
      {/* sirene */}
      {[-1, 1].map((sd) => (
        <mesh key={"s" + sd} position={[0.45 * sd, 2.08, 2.1]} geometry={rbox(0.5, 0.16, 0.3, 0.05)} material={sm(sd < 0 ? "#ff3b3b" : "#3a86ff", 0.3, {emissive: sd < 0 ? "#ff3b3b" : "#3a86ff", emissiveIntensity: (sd < 0) === on ? 2.2 : 0.2})} />
      ))}
      {/* escada */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={"e" + x} position={[x, 1.95, -0.6]} material={steel}>
          <boxGeometry args={[0.06, 0.06, 4.0]} />
        </mesh>
      ))}
      {Array.from({length: 9}, (_, i) => (
        <mesh key={"d" + i} position={[0, 1.95, -2.4 + i * 0.45]} material={steel}>
          <boxGeometry args={[0.8, 0.04, 0.04]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={"t" + sd} position={[1.106 * sd, 1.15, -0.6]} rotation={[0, (Math.PI / 2) * sd, 0]} material={tm("bombeiros", bombeiroTex(), 0.5, {transparent: true})}>
          <planeGeometry args={[2.6, 0.5]} />
        </mesh>
      ))}
      {/* rodas */}
      {[-1, 1].map((sd) =>
        [-1.9, 0.3, 2.0].map((z) => (
          <group key={`${sd}${z}`} position={[1.0 * sd, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={sm("#1d1f27", 0.6)} castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.3, 22]} />
            </mesh>
            <mesh position={[0, 0.16 * sd, 0]} material={steel}>
              <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
            </mesh>
          </group>
        )),
      )}
      {/* carretel da mangueira */}
      <mesh position={[1.12, 1.0, -1.8]} rotation={[0, 0, Math.PI / 2]} material={sm("#e3b33b", 0.4)}>
        <cylinderGeometry args={[0.38, 0.38, 0.2, 20]} />
      </mesh>
    </group>
  );
};
/** jato d'água de a até b (parábola de bolinhas azuis) */
export const WaterJet: React.FC<{a: V3; b: V3; k: number; t: number; arc?: number; color?: string; size?: number}> = ({a, b, k, t, arc = 1.2, color = "#7fd0ff", size = 1}) => {
  if (k < 0.01) return null;
  return (
    <group>
      {Array.from({length: 40}, (_, i) => {
        const q = ((t * 1.6 + i / 40) % 1) * k;
        const x = lerp(a[0], b[0], q);
        const y = lerp(a[1], b[1], q) + arc * 4 * q * (1 - q);
        const z = lerp(a[2], b[2], q);
        return (
          <mesh key={i} position={[x + 0.04 * Math.sin(i) * size, y + 0.04 * Math.cos(i * 1.7) * size, z]} material={sm(color, 0.1, {transparent: true, opacity: 0.75, emissive: color, emissiveIntensity: 0.2})}>
            <sphereGeometry args={[(0.07 + 0.05 * q) * size, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** chuva (verde de chulé) */
export const Rain: React.FC<{c: V3; size: [number, number, number]; t: number; k?: number; color?: string; n?: number}> = ({c, size, t, k = 1, color = "#8fd14f", n = 220}) => {
  const drops = useMemo(() => {
    const r = rng(5);
    return Array.from({length: n}, () => [r() - 0.5, r(), r() - 0.5, 0.6 + r() * 0.8] as [number, number, number, number]);
  }, [n]);
  if (k < 0.01) return null;
  const m = sm(color, 0.3, {transparent: true, opacity: 0.75 * k, emissive: color, emissiveIntensity: 0.25});
  return (
    <group position={c}>
      {drops.map(([x, y, z, sp], i) => {
        const q = (y + t * sp * 0.9) % 1;
        return (
          <mesh key={i} position={[x * size[0], size[1] * (1 - q), z * size[2]]} material={m}>
            <boxGeometry args={[0.025, 0.28, 0.025]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** guarda-chuva (segura pelo cabo) */
export const Umbrella: React.FC<{p?: V3; r?: V3; s?: number; color?: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, color = "#ff4d6d"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.35, 0]} material={sm("#2b2e3b", 0.5)}>
      <cylinderGeometry args={[0.012, 0.012, 0.75, 8]} />
    </mesh>
    <mesh position={[0, 0.78, 0]} material={sm(color, 0.6, {side: THREE.DoubleSide})} castShadow>
      <coneGeometry args={[0.55, 0.25, 8, 1, true]} />
    </mesh>
  </group>
);
/** capacete de bombeiro (espaço da cabeça) */
export const FireHelmet: React.FC = () => (
  <group position={[0, 0.2, -0.02]} rotation={[-0.1, 0, 0]}>
    <mesh scale={[1.08, 0.7, 1.12]} material={sm("#d62828", 0.35)} castShadow>
      <sphereGeometry args={[0.37, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.01, -0.06]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]} material={sm("#d62828", 0.35, {side: THREE.DoubleSide})}>
      <ringGeometry args={[0.36, 0.48, 28]} />
    </mesh>
    <mesh position={[0, 0.16, 0.36]} rotation={[-0.3, 0, 0]} geometry={rbox(0.16, 0.18, 0.02, 0.03)} material={sm("#ffd21f", 0.3, {metalness: 0.4})} />
  </group>
);
/** prendedor de roupa no nariz (espaço da cabeça) */
export const NoseClip: React.FC<{color?: string; gold?: boolean}> = ({color = "#ff4d6d", gold = false}) => {
  const m = gold ? sm("#ffcc33", 0.2, {metalness: 0.8, emissive: "#6a4a00", emissiveIntensity: 0.4}) : sm(color, 0.45);
  return (
    <group position={[0, -0.075, 0.33]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0, 0.028 * sd, 0.05]} rotation={[0.18 * sd, 0, 0]} geometry={rbox(0.05, 0.03, 0.16, 0.012)} material={m} castShadow />
      ))}
      <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]} material={sm("#c9ced6", 0.3, {metalness: 0.7})}>
        <torusGeometry args={[0.022, 0.006, 6, 12]} />
      </mesh>
    </group>
  );
};

/* ---------- estúdio da previsão do tempo ---------- */
const mapaTex = () =>
  canvasTex("mapa-tempo", 1024, 640, (c) => {
    c.fillStyle = "#1b5fa8";
    c.fillRect(0, 0, 1024, 640);
    c.fillStyle = "#7ed957";
    c.beginPath();
    c.moveTo(150, 120);
    c.bezierCurveTo(420, 40, 700, 90, 880, 200);
    c.bezierCurveTo(950, 380, 760, 560, 520, 590);
    c.bezierCurveTo(300, 600, 120, 480, 110, 320);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(90,180,40,0.85)";
    for (let i = 0; i < 7; i++) {
      const x = 250 + (i % 4) * 160;
      const y = 220 + Math.floor(i / 4) * 170;
      c.beginPath();
      c.arc(x, y, 50, 0, Math.PI * 2);
      c.arc(x + 45, y - 20, 40, 0, Math.PI * 2);
      c.arc(x - 45, y - 15, 38, 0, Math.PI * 2);
      c.fill();
    }
    c.font = "bold 70px sans-serif";
    c.textAlign = "center";
    c.lineWidth = 10;
    c.strokeStyle = "#101018";
    c.strokeText("100% CHULÉ", 512, 610);
    c.fillStyle = "#ffffff";
    c.fillText("100% CHULÉ", 512, 610);
    c.textAlign = "left";
    c.font = "bold 56px sans-serif";
    c.fillStyle = "#ffffff";
    c.fillText("PREVISÃO DO TEMPO", 40, 72);
  });
export const WeatherStudio: React.FC = () => (
  <group>
    <color attach="background" args={["#0f1b33"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#26324d", 0.5)} receiveShadow>
      <planeGeometry args={[20, 20]} />
    </mesh>
    <mesh position={[0, 2.0, -2.5]} geometry={rbox(5.4, 3.4, 0.15, 0.06)} material={sm("#101018", 0.4)} />
    <mesh position={[0, 2.0, -2.42]} material={tm("mapa-tempo", mapaTex(), 0.5, {emissive: "#ffffff", emissiveMap: mapaTex(), emissiveIntensity: 0.6})}>
      <planeGeometry args={[5.1, 3.15]} />
    </mesh>
    <mesh position={[0, 0.02, -0.6]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#3a86ff", 0.4, {emissive: "#3a86ff", emissiveIntensity: 0.3})}>
      <ringGeometry args={[1.2, 1.3, 40]} />
    </mesh>
  </group>
);

/* ---------- passarela de moda ---------- */
const modaTex = () =>
  canvasTex("moda-prendedor", 512, 384, (c) => {
    c.fillStyle = "#1a1030";
    c.fillRect(0, 0, 512, 384);
    c.font = "bold 84px sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#ffffff";
    c.fillText("FASHION", 256, 150);
    c.fillStyle = "#ffd21f";
    c.fillText("NASAL", 256, 260);
  });
export const Runway: React.FC<{t: number}> = ({t}) => (
  <group>
    <color attach="background" args={["#1a1030"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#2a1d45", 0.6)} receiveShadow>
      <planeGeometry args={[30, 30]} />
    </mesh>
    <mesh position={[0, 0.2, -1]} geometry={rbox(1.8, 0.4, 10, 0.04)} material={sm("#f4f4f2", 0.25)} receiveShadow castShadow />
    {Array.from({length: 12}, (_, i) =>
      [-1, 1].map((sd) => (
        <mesh key={`${i}${sd}`} position={[0.92 * sd, 0.3, -5.6 + i * 0.85]} material={sm("#ff9ccf", 0.3, {emissive: "#ff5fb0", emissiveIntensity: 1.2 + 0.8 * Math.sin(t * 6 + i)})}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
      )),
    )}
    <mesh position={[0, 2.6, -6.2]} geometry={rbox(4.0, 3.0, 0.1, 0.05)} material={sm("#ff5fb0", 0.4, {emissive: "#ff5fb0", emissiveIntensity: 0.5})} />
    <mesh position={[0, 2.6, -6.13]} material={tm("moda-prendedor", modaTex(), 0.5, {emissive: "#ffffff", emissiveMap: modaTex(), emissiveIntensity: 0.5})}>
      <planeGeometry args={[3.7, 2.7]} />
    </mesh>
  </group>
);

/* ---------- loja de tênis ---------- */
const lojaTex = () =>
  canvasTex("loja-tenis", 1024, 200, (c) => {
    c.fillStyle = "#101018";
    c.fillRect(0, 0, 1024, 200);
    c.font = "bold 110px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#ffd21f";
    c.fillText("TÊNIS & CIA", 512, 108);
  });
export const ShoeStore: React.FC = () => {
  const cols = ["#e8414f", "#3a86ff", "#2ecc71", "#ffd21f", "#ff6fb1", "#f4f4f2", "#1d1f27", "#ff8a1f"];
  return (
    <group>
      <color attach="background" args={["#f2e6d8"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c9a27a", 0.5)} receiveShadow>
        <planeGeometry args={[20, 20]} />
      </mesh>
      <mesh position={[0, 2.2, -3]} material={sm("#f7efe4", 0.85)} receiveShadow>
        <boxGeometry args={[12, 4.4, 0.2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[4.2 * sd, 2.2, 0]} material={sm("#f7efe4", 0.85)}>
          <boxGeometry args={[0.2, 4.4, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 3.65, -2.88]} material={tm("loja-tenis", lojaTex(), 0.5, {emissive: "#ffffff", emissiveMap: lojaTex(), emissiveIntensity: 0.35})}>
        <planeGeometry args={[4.4, 0.86]} />
      </mesh>
      {/* prateleiras com tênis coloridos */}
      {[0.7, 1.4, 2.1, 2.8].map((y, r) => (
        <group key={y}>
          <mesh position={[0, y, -2.7]} geometry={rbox(7.4, 0.06, 0.5, 0.02)} material={sm("#7a4a28", 0.6)} castShadow />
          {Array.from({length: 7}, (_, i) => (
            <Sneaker key={i} p={[-3.0 + i * 1.0, y + 0.03, -2.65]} r={[0, 0.5, 0]} s={0.42} c={{color: cols[(i + r * 3) % cols.length], sole: cols[(i + r * 3 + 3) % cols.length]}} />
          ))}
        </group>
      ))}
      {/* banquinho e espelho */}
      <mesh position={[1.9, 0.25, -0.6]} geometry={rbox(1.6, 0.12, 0.5, 0.05)} material={sm("#3a86ff", 0.5)} castShadow />
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[1.9 + x, 0.1, -0.6]} material={sm("#1d1f27", 0.4)}>
          <boxGeometry args={[0.06, 0.2, 0.4]} />
        </mesh>
      ))}
      <group position={[-4.08, 1.5, -0.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={rbox(1.0, 1.9, 0.05, 0.04)} material={sm("#e3b33b", 0.3, {metalness: 0.5})} />
        <mesh position={[0, 0, 0.03]} material={sm("#cfeaf7", 0.08, {emissive: "#9fd8ff", emissiveIntensity: 0.25})}>
          <planeGeometry args={[0.88, 1.78]} />
        </mesh>
      </group>
    </group>
  );
};
/** caixa de tênis */
export const ShoeBox: React.FC<{p?: V3; r?: V3; s?: number; open?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, open = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.12, 0]} geometry={rbox(0.5, 0.24, 0.32, 0.02)} material={sm("#ff8a1f", 0.6)} castShadow />
    <group position={[0, 0.25, -0.16]} rotation={[-open * 1.9, 0, 0]}>
      <mesh position={[0, 0.01, 0.16]} geometry={rbox(0.52, 0.05, 0.34, 0.02)} material={sm("#101018", 0.5)} />
    </group>
  </group>
);
