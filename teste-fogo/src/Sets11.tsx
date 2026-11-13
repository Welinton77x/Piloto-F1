import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Vídeo "Se você quiser fazer um bolo, mas está com medo" ===== */

/** chapéu de cozinheiro (toque) — fica no espaço da cabeça do boneco (headExtra) */
export const ChefHat: React.FC<{tilt?: number}> = ({tilt = 0}) => {
  const white = sm("#fbfbf8", 0.6);
  const shade = sm("#ececE6", 0.65);
  return (
    <group position={[0, 0.2, -0.005]} rotation={[-0.06, 0, 0.07 + tilt]}>
      {/* faixa */}
      <mesh position={[0, 0.12, 0]} material={white} castShadow>
        <cylinderGeometry args={[0.292, 0.28, 0.24, 36]} />
      </mesh>
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.288, 0.12, Math.cos(a) * 0.288]} material={shade}>
            <capsuleGeometry args={[0.008, 0.16, 4, 6]} />
          </mesh>
        );
      })}
      {/* copa fofa */}
      <mesh position={[0, 0.37, 0]} scale={[1, 0.6, 1]} material={white} castShadow>
        <sphereGeometry args={[0.38, 32, 22]} />
      </mesh>
      {Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        return (
          <mesh key={"p" + i} position={[Math.sin(a) * 0.26, 0.37 + 0.03 * Math.sin(i * 2.1), Math.cos(a) * 0.26]} scale={[1, 0.82, 1]} material={white} castShadow>
            <sphereGeometry args={[0.185, 20, 14]} />
          </mesh>
        );
      })}
      <mesh position={[0.02, 0.5, 0]} scale={[1, 0.7, 1]} material={white} castShadow>
        <sphereGeometry args={[0.24, 22, 16]} />
      </mesh>
    </group>
  );
};

/** óculos escuro preto — espaço da cabeça; k: 1 = nos olhos, 0 = levantado na testa */
export const Shades: React.FC<{k?: number; glint?: number}> = ({k = 1, glint = 0}) => {
  const black = sm("#0b0b10", 0.12, {metalness: 0.25});
  const frame = sm("#15151c", 0.3);
  const glare = sm("#ffffff", 0.2, {emissive: "#ffffff", emissiveIntensity: 0.25 + 1.6 * glint, transparent: true, opacity: 0.75});
  return (
    <group position={[0, -0.026 + (1 - k) * 0.2, (1 - k) * 0.02]} rotation={[-(1 - k) * 0.5, 0, 0]}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.113 * sd, 0, 0.3]} rotation={[0, 0.33 * sd, 0]}>
          <mesh geometry={rbox(0.172, 0.118, 0.032, 0.042)} material={black} castShadow />
          {/* brilho na lente */}
          <mesh position={[-0.03, 0.018, 0.0175]} rotation={[0, 0, -0.75]} scale={[0.012, 0.042, 0.004]} material={glare}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh position={[0.005, 0.012, 0.0175]} rotation={[0, 0, -0.75]} scale={[0.007, 0.026, 0.004]} material={glare}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* ponte */}
      <mesh position={[0, 0.022, 0.318]} geometry={rbox(0.075, 0.028, 0.026, 0.012)} material={frame} />
      {/* hastes até as orelhas */}
      {[-1, 1].map((sd) => {
        const a = new THREE.Vector3(0.2 * sd, 0.022, 0.275);
        const b = new THREE.Vector3(0.345 * sd, 0.012, 0.0);
        const m = a.clone().add(b).multiplyScalar(0.5);
        const d = b.clone().sub(a);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        return (
          <mesh key={"h" + sd} position={[m.x, m.y, m.z]} quaternion={q} material={frame}>
            <capsuleGeometry args={[0.012, d.length(), 4, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
export const lerpV = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/* ======================= cozinha do bolo ======================= */

const tex = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const k = "m-" + key;
  const c = (tex as unknown as {cache?: Map<string, THREE.Material>}).cache ?? new Map<string, THREE.Material>();
  (tex as unknown as {cache?: Map<string, THREE.Material>}).cache = c;
  let m = c.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    c.set(k, m);
  }
  return m as THREE.MeshStandardMaterial;
};
const azulejoTex = () =>
  canvasTex("azulejo-bolo", 512, 512, (c) => {
    c.fillStyle = "#fdf3e1";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2) {
          c.fillStyle = "#ffd9e2";
          c.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
        }
      }
    c.strokeStyle = "#ead9c0";
    c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 64, 0);
      c.lineTo(i * 64, 512);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i * 64);
      c.lineTo(512, i * 64);
      c.stroke();
    }
  }, [5, 2]);
const pisoBoloTex = () =>
  canvasTex("piso-bolo", 512, 512, (c) => {
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        c.fillStyle = (i + j) % 2 ? "#fbfbf6" : "#e8414f";
        c.fillRect(i * 64, j * 64, 64, 64);
      }
  }, [4, 4]);
export const K = {backZ: -3.0, x0: -4.6, x1: 4.6, h: 3.6};
const espacoTex = () =>
  canvasTex("janela-espaco", 256, 200, (c, r) => {
    c.fillStyle = "#0a0f2a";
    c.fillRect(0, 0, 256, 200);
    for (let i = 0; i < 60; i++) {
      c.fillStyle = "#ffffff";
      c.fillRect(r() * 256, r() * 200, 2, 2);
    }
    c.fillStyle = "#2f8fe0";
    c.beginPath();
    c.arc(180, 150, 55, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#5cbf4a";
    c.beginPath();
    c.ellipse(165, 135, 22, 14, 0.4, 0, Math.PI * 2);
    c.fill();
  });
export const ISLAND: V3 = [0.2, 0, -0.7];
export const ISLAND_TOP = 0.95;
export const OVEN_P: V3 = [1.95, 0, -2.55];
export const FRIDGE_P: V3 = [-2.1, 0, -2.5];
export const SINK_P: V3 = [-0.25, 0, -2.6];
/** cozinha (paredes, piso, bancada com pia, armários, janela, ilha). frozen: 0..1 gelo; snow: 0..1 farinha */
export const BakeKitchen: React.FC<{frozen?: number; flour?: number; space?: boolean}> = ({frozen = 0, flour = 0, space = false}) => {
  const {backZ, x0, x1, h} = K;
  const W = x1 - x0;
  const cab = sm("#7fc8b8", 0.5);
  const top = sm("#f4efe6", 0.35);
  const ice = sm("#cfefff", 0.15, {transparent: true, opacity: 0.55 * frozen, depthWrite: false});
  const icicle = sm("#dff6ff", 0.1, {transparent: true, opacity: 0.85});
  const floury = sm("#ffffff", 0.9, {transparent: true, opacity: 0.85 * flour, depthWrite: false});
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={tex("piso", pisoBoloTex(), 0.45)} receiveShadow>
        <planeGeometry args={[W, 9]} />
      </mesh>
      <mesh position={[0, h / 2, backZ - 0.1]} material={tex("azulejo", azulejoTex(), 0.6)} receiveShadow>
        <boxGeometry args={[W, h, 0.2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(W / 2 + 0.1) * sd, h / 2, 0]} material={sm("#ffe7b8", 0.85)} receiveShadow>
          <boxGeometry args={[0.2, h, 9]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} material={sm("#fffaf0", 0.9)}>
        <planeGeometry args={[W, 9]} />
      </mesh>
      {/* janela */}
      <group position={[-0.05, 2.35, backZ + 0.01]}>
        <mesh material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[1.25, 1.0, 0.06]} />
        </mesh>
        <mesh position={[0, 0, 0.035]} material={space ? tex("janela-espaco", espacoTex(), 0.4, {emissive: "#ffffff", emissiveMap: espacoTex(), emissiveIntensity: 0.9}) : sm("#9fd8ff", 0.2, {emissive: "#bfe6ff", emissiveIntensity: 0.7})}>
          <planeGeometry args={[1.1, 0.85]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[0.04, 0.85, 0.03]} />
        </mesh>
      </group>
      {/* bancada do fundo com a pia */}
      <group position={[-0.05, 0, backZ + 0.45]}>
        <mesh position={[0, 0.45, 0]} geometry={rbox(2.75, 0.9, 0.85, 0.04)} material={cab} castShadow receiveShadow />
        <mesh position={[0, 0.93, 0]} geometry={rbox(2.85, 0.07, 0.9, 0.02)} material={top} castShadow receiveShadow />
        {[-0.9, 0, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.7, 0.43]} material={sm("#ffffff", 0.3)}>
            <boxGeometry args={[0.22, 0.03, 0.02]} />
          </mesh>
        ))}
        {/* pia */}
        <group position={[SINK_P[0] + 0.05, 0.965, 0]}>
          <mesh material={sm("#c9ced6", 0.25, {metalness: 0.6})}>
            <boxGeometry args={[0.9, 0.012, 0.6]} />
          </mesh>
          <mesh position={[0, 0.0, -0.33]} material={sm("#c9ced6", 0.25, {metalness: 0.6})}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 10]} />
          </mesh>
          <mesh position={[0, 0.25, -0.2]} rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.25, {metalness: 0.6})}>
            <torusGeometry args={[0.13, 0.022, 8, 16, Math.PI]} />
          </mesh>
        </group>
      </group>
      {/* armários de cima */}
      {[-1.0, 0.9, -3.4, 3.3].map((x) => (
        <group key={x} position={[x, 2.95, backZ + 0.2]}>
          <mesh geometry={rbox(1.05, 0.8, 0.4, 0.04)} material={cab} castShadow />
          <mesh position={[0.35, -0.25, 0.21]} material={sm("#ffffff", 0.3)}>
            <boxGeometry args={[0.03, 0.18, 0.02]} />
          </mesh>
        </group>
      ))}
      {/* ilha no meio */}
      <group position={ISLAND}>
        <mesh position={[0, 0.45, 0]} geometry={rbox(2.3, 0.9, 1.0, 0.05)} material={sm("#f7b267", 0.55)} castShadow receiveShadow />
        <mesh position={[0, ISLAND_TOP - 0.025, 0]} geometry={rbox(2.45, 0.07, 1.1, 0.025)} material={top} castShadow receiveShadow />
        {[-0.75, 0, 0.75].map((x) => (
          <mesh key={x} position={[x, 0.55, 0.505]} material={sm("#e08a3a", 0.6)}>
            <boxGeometry args={[0.6, 0.6, 0.02]} />
          </mesh>
        ))}
      </group>
      {/* gelo: chão escorregadio + pinguelos de gelo nas bordas */}
      {frozen > 0.01 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={ice}>
            <planeGeometry args={[W, 9]} />
          </mesh>
          {Array.from({length: 22}, (_, i) => {
            const onIsland = i < 9;
            const x = onIsland ? ISLAND[0] - 1.1 + (i / 8) * 2.2 : -1.35 + ((i - 9) / 12) * 2.6;
            const z = onIsland ? ISLAND[2] + 0.56 : backZ + 0.9;
            const y = onIsland ? ISLAND_TOP - 0.06 : 0.9;
            const l = (0.12 + 0.12 * ((i * 37) % 10) / 10) * frozen;
            return (
              <mesh key={i} position={[x, y - l / 2, z]} rotation={[Math.PI, 0, 0]} material={icicle}>
                <coneGeometry args={[0.025, l, 6]} />
              </mesh>
            );
          })}
        </>
      )}
      {/* farinha por cima de tudo */}
      {flour > 0.01 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} material={floury}>
            <planeGeometry args={[W, 9]} />
          </mesh>
          <mesh position={[ISLAND[0], ISLAND_TOP + 0.015, ISLAND[2]]} material={floury}>
            <boxGeometry args={[2.4, 0.02, 1.05]} />
          </mesh>
        </>
      )}
    </group>
  );
};

/* ---------- forno com cara ---------- */
export type OvenP = {mood?: number; eyes?: number; rage?: number; shake?: number; blink?: number; t?: number; flame?: number; heat?: number};
export const Oven: React.FC<{p: V3; o?: OvenP; rotY?: number}> = ({p, o = {}, rotY = 0}) => {
  const {mood = 0, eyes = 1, rage = 0, shake = 0, blink = 0, t = 0, flame = 0, heat = 0} = o;
  const body = sm("#e9edf2", 0.35, {metalness: 0.3});
  const dark = sm("#1a1c22", 0.3);
  const glowCol = new THREE.Color("#ff3b2f").lerp(new THREE.Color("#ffd23f"), heat);
  const eyeM = sm("#" + glowCol.getHexString(), 0.3, {emissive: "#" + glowCol.getHexString(), emissiveIntensity: 1.2 + 1.5 * rage + 1.5 * heat});
  const sx = shake * 0.03 * Math.sin(t * 60);
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={[p[0] + sx, p[1], p[2]]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.5, 0]} geometry={rbox(1.0, 1.0, 0.85, 0.06)} material={body} castShadow receiveShadow />
      <mesh position={[0, 1.02, 0]} geometry={rbox(1.02, 0.05, 0.87, 0.02)} material={dark} />
      {[-0.22, 0.22].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.05, z]} rotation={[Math.PI / 2, 0, 0]} material={sm("#3a3d48", 0.4)}>
            <torusGeometry args={[0.1, 0.018, 6, 20]} />
          </mesh>
        )),
      )}
      {/* painel com botões = sobrancelhas bravas */}
      <mesh position={[0, 1.15, -0.38]} geometry={rbox(1.0, 0.26, 0.08, 0.03)} material={body} castShadow />
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.2 * sd, 0.86 + 0.02 * mood, 0.43]} rotation={[0, 0, sd * (0.25 + 0.35 * mood)]}>
          <mesh geometry={rbox(0.26, 0.05, 0.03, 0.02)} material={dark} />
        </group>
      ))}
      {/* porta com vidro: os "olhos" */}
      <mesh position={[0, 0.48, 0.43]} geometry={rbox(0.86, 0.62, 0.03, 0.04)} material={dark} />
      {[-1, 1].map((sd) => (
        <mesh key={"e" + sd} position={[0.19 * sd, 0.58, 0.448]} scale={[1, eyeY * eyes, 1]} material={eyeM}>
          <circleGeometry args={[0.085, 24]} />
        </mesh>
      ))}
      {/* boca (grade) */}
      <mesh position={[0, 0.24, 0.447]} rotation={[0, 0, Math.PI * 0.2]} material={eyeM}>
        <torusGeometry args={[0.13, 0.022, 6, 20, Math.PI * 0.6]} />
      </mesh>
      <mesh position={[0, 0.82, 0.455]} material={sm("#c9ced6", 0.25, {metalness: 0.6})}>
        <boxGeometry args={[0.6, 0.04, 0.04]} />
      </mesh>
      {(rage > 0.01 || heat > 0.01) && <pointLight position={[0, 0.5, 0.9]} intensity={1.5 * (rage + heat)} distance={3} decay={2} color={"#" + glowCol.getHexString()} />}
      {flame > 0.01 && (
        <group position={[0, -0.05, 0]} scale={[flame, flame * (1 + 0.2 * Math.sin(t * 50)), flame]}>
          <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]} material={sm("#ffb020", 0.4, {emissive: "#ff7a00", emissiveIntensity: 2.4, transparent: true, opacity: 0.92})}>
            <coneGeometry args={[0.45, 1.2, 20]} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation={[Math.PI, 0, 0]} material={sm("#fff3b0", 0.4, {emissive: "#fff3b0", emissiveIntensity: 2.6})}>
            <coneGeometry args={[0.25, 0.7, 16]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- geladeira apaixonada ---------- */
export type FridgeP = {love?: number; open?: number; blink?: number; t?: number; kiss?: number};
export const Fridge: React.FC<{p: V3; f?: FridgeP; rotY?: number}> = ({p, f = {}, rotY = 0}) => {
  const {love = 0, open = 0, blink = 0, t = 0, kiss = 0} = f;
  const body = sm("#d9f1fb", 0.35);
  const door = sm("#c4e8f6", 0.35);
  const eyeY = Math.max(0.1, 1 - blink);
  const heart = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.06);
    s.bezierCurveTo(-0.13, 0.02, -0.08, 0.12, 0, 0.06);
    s.bezierCurveTo(0.08, 0.12, 0.13, 0.02, 0, -0.06);
    return new THREE.ShapeGeometry(s);
  }, []);
  const pulse = 1 + 0.12 * love * Math.sin(t * 9);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.15, 0]} geometry={rbox(1.15, 2.3, 0.85, 0.12)} material={body} castShadow receiveShadow />
      {/* interior (aparece com a porta aberta) */}
      <mesh position={[0, 0.85, 0.4]} material={sm("#ffffff", 0.4, {emissive: "#e8f6ff", emissiveIntensity: 0.8 * open})}>
        <planeGeometry args={[1.0, 1.4]} />
      </mesh>
      {/* porta de cima (freezer) */}
      <mesh position={[0, 1.88, 0.44]} geometry={rbox(1.1, 0.78, 0.06, 0.05)} material={door} castShadow />
      {/* porta de baixo — abre pro lado (dobradiça na esquerda) */}
      <group position={[-0.55, 0, 0.44]} rotation={[0, -1.7 * open, 0]}>
        <mesh position={[0.55, 0.78, 0]} geometry={rbox(1.1, 1.42, 0.06, 0.05)} material={door} castShadow />
        <mesh position={[0.98, 0.95, 0.05]} material={sm("#a8b3c0", 0.3, {metalness: 0.5})}>
          <boxGeometry args={[0.04, 0.45, 0.04]} />
        </mesh>
      </group>
      {/* rosto na porta do freezer */}
      <group position={[0, 1.9, 0.48]}>
        {[-1, 1].map((sd) =>
          love > 0.5 ? (
            <mesh key={sd} position={[0.2 * sd, 0.06, 0.005]} scale={1.15 * pulse} geometry={heart} material={sm("#ff4d6d", 0.4, {emissive: "#ff4d6d", emissiveIntensity: 0.4})} />
          ) : (
            <group key={sd} position={[0.2 * sd, 0.06, 0]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.07, 0.085, 0.03]} material={sm("#0c0c10", 0.1)}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[0.02, 0.03, 0.025]} scale={0.02} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ),
        )}
        {[-1, 1].map((sd) => (
          <mesh key={"b" + sd} position={[0.33 * sd, -0.08, 0.01]} scale={[0.08, 0.045, 0.01]} material={sm("#ff8fab", 0.6, {transparent: true, opacity: 0.4 + 0.6 * love})}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
        ))}
        {kiss > 0.5 ? (
          <mesh position={[0, -0.13, 0.02]} scale={[0.05, 0.05, 0.03]} material={sm("#e8414f", 0.4)}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.12, 0.01]} rotation={[0, 0, Math.PI + 0.35 * Math.PI / 2]} material={sm("#3a1510", 0.5)}>
            <torusGeometry args={[0.08, 0.014, 8, 20, Math.PI * 0.65]} />
          </mesh>
        )}
      </group>
    </group>
  );
};
/** vento gelado / névoa saindo da geladeira */
export const ColdMist: React.FC<{p: V3; k: number; t: number; dir?: V3}> = ({p, k, t, dir = [0, 0, 1]}) => {
  if (k < 0.01) return null;
  const m = sm("#e8f8ff", 0.9, {transparent: true, opacity: 0.55 * k, depthWrite: false});
  return (
    <group position={p}>
      {Array.from({length: 16}, (_, i) => {
        const ph = (t * 0.9 + i / 16) % 1;
        const d = ph * 3.2;
        return (
          <mesh key={i} position={[dir[0] * d + Math.sin(i * 2.1) * 0.4 * ph, 0.6 + Math.sin(i * 1.3) * 0.5 - 0.3 * ph, dir[2] * d + Math.cos(i * 1.7) * 0.4 * ph]} material={m}>
            <sphereGeometry args={[0.15 + 0.35 * ph, 12, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** neve/farinha caindo (partículas) numa caixa */
export const Snowfall: React.FC<{c: V3; size: V3; k: number; t: number; n?: number}> = ({c, size, k, t, n = 160}) => {
  const pts = useMemo(() => {
    const r = rng(19);
    return Array.from({length: n}, () => [r(), r(), r(), r()] as [number, number, number, number]);
  }, [n]);
  if (k < 0.01) return null;
  const m = sm("#ffffff", 0.9, {transparent: true, opacity: 0.95 * k});
  return (
    <group position={c}>
      {pts.map(([a, b, d, e], i) => {
        const y = size[1] * (1 - ((b + t * (0.12 + 0.08 * e)) % 1));
        return (
          <mesh key={i} position={[(a - 0.5) * size[0] + 0.05 * Math.sin(t * 2 + i), y, (d - 0.5) * size[2]]} material={m}>
            <sphereGeometry args={[0.018 + 0.016 * e, 6, 4]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** saco de farinha */
export const FlourSack: React.FC<{p: V3; r?: V3; s?: number; burst?: number}> = ({p, r = [0, 0, 0], s = 1, burst = 0}) => {
  if (burst >= 1) return null;
  const sack = sm("#f3e7cf", 0.85);
  return (
    <group position={p} rotation={r} scale={s * (1 + 0.5 * burst)}>
      <mesh position={[0, 0.2, 0]} geometry={rbox(0.32, 0.4, 0.2, 0.08)} material={sack} castShadow />
      <mesh position={[0, 0.43, 0]} geometry={rbox(0.24, 0.08, 0.14, 0.03)} material={sack} />
      <mesh position={[0, 0.2, 0.101]} material={tex("farinha", canvasTex("rotulo-farinha", 256, 256, (c) => {
        c.fillStyle = "#f3e7cf";
        c.fillRect(0, 0, 256, 256);
        c.fillStyle = "#e8414f";
        c.font = "bold 58px sans-serif";
        c.textAlign = "center";
        c.fillText("FARINHA", 128, 110);
        c.fillStyle = "#c9a35a";
        c.beginPath();
        c.ellipse(128, 175, 30, 45, 0, 0, Math.PI * 2);
        c.fill();
      }), 0.85)}>
        <planeGeometry args={[0.28, 0.28]} />
      </mesh>
    </group>
  );
};
/** boneco de neve de farinha (o menino coberto): bolas + chapéu + óculos */
export const FlourSnowman: React.FC<{p: V3; rotY?: number; k?: number; t?: number; shiver?: number}> = ({p, rotY = 0, k = 1, t = 0, shiver = 0}) => {
  if (k < 0.01) return null;
  const snow = sm("#fbfbf8", 0.9);
  const sx = shiver * 0.015 * Math.sin(t * 45);
  return (
    <group position={[p[0] + sx, p[1], p[2]]} rotation={[0, rotY, 0]} scale={[k, k, k]}>
      <mesh position={[0, 0.45, 0]} material={snow} castShadow>
        <sphereGeometry args={[0.5, 28, 20]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={snow} castShadow>
        <sphereGeometry args={[0.38, 26, 18]} />
      </mesh>
      <group position={[0, 1.72, 0]} scale={0.95}>
        <mesh material={snow} castShadow>
          <sphereGeometry args={[0.32, 26, 18]} />
        </mesh>
        <group scale={0.98}>
          <ChefHat />
          <Shades />
        </group>
        <mesh position={[0, -0.08, 0.33]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ff8a3d", 0.5)}>
          <coneGeometry args={[0.035, 0.16, 10]} />
        </mesh>
        <mesh position={[0, -0.17, 0.29]} rotation={[0.2, 0, Math.PI]} material={sm("#3a1510", 0.5)}>
          <torusGeometry args={[0.05, 0.01, 6, 14, Math.PI * 0.7]} />
        </mesh>
      </group>
      {[0.6, 0.85, 1.1].map((y) => (
        <mesh key={y} position={[0, y + 0.25, 0.35 - (y - 0.6) * 0.15]} material={sm("#15161d", 0.4)}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.45 * sd, 1.25, 0]} rotation={[0, 0, sd * (-0.9 + 0.15 * Math.sin(t * 8 + sd))]} material={sm("#8a5a2b", 0.8)}>
          <cylinderGeometry args={[0.02, 0.02, 0.55, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- pinguim ---------- */
export const Penguin: React.FC<{p: V3; rotY?: number; t?: number; walk?: number; phone?: boolean; blink?: number; dance?: number; s?: number}> = ({p, rotY = 0, t = 0, walk = 0, phone = false, blink = 0, dance = 0, s = 1}) => {
  const black = sm("#1d2230", 0.5);
  const white = sm("#fbfbf8", 0.5);
  const orange = sm("#ff9a1f", 0.45);
  const wob = walk * 0.12 * Math.sin(t * 14) + dance * 0.2 * Math.sin(t * 9);
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={p} rotation={[0, rotY, wob]} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.12 * sd, 0.03 + 0.04 * walk * Math.max(0, Math.sin(t * 14 + (sd > 0 ? 0 : Math.PI))), 0.12]} scale={[0.09, 0.03, 0.14]} material={orange} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]} scale={[0.32, 0.42, 0.3]} material={black} castShadow>
        <sphereGeometry args={[1, 26, 20]} />
      </mesh>
      <mesh position={[0, 0.42, 0.13]} scale={[0.24, 0.34, 0.18]} material={white}>
        <sphereGeometry args={[1, 22, 16]} />
      </mesh>
      <group position={[0, 0.92, 0.02]}>
        <mesh scale={[0.25, 0.23, 0.24]} material={black} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <mesh position={[0, -0.01, 0.07]} scale={[0.21, 0.18, 0.18]} material={white}>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        <mesh position={[0, -0.06, 0.27]} rotation={[Math.PI / 2, 0, 0]} material={orange}>
          <coneGeometry args={[0.045, 0.1, 12]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.085 * sd, 0.025, 0.235]} rotation={[0, 0.35 * sd, 0]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.05, 0.062, 0.024]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            <mesh position={[0.015, 0.022, 0.02]} scale={0.014} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={"c" + sd} position={[0.15 * sd, -0.07, 0.2]} rotation={[0, 0.6 * sd, 0]} scale={[0.04, 0.025, 0.01]} material={sm("#ff8fab", 0.6)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
      </group>
      {/* asas; a direita segura o celular */}
      {[-1, 1].map((sd) => (
        <group key={"w" + sd} position={[0.3 * sd, 0.62, 0.0]} rotation={[sd > 0 && phone ? -1.2 : -0.1 + dance * 0.6 * Math.sin(t * 9 + sd), 0, sd * (0.25 + dance * 0.5)]}>
          <mesh position={[0, -0.18, 0]} scale={[0.05, 0.22, 0.11]} material={black} castShadow>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          {sd > 0 && phone && (
            <group position={[0, -0.36, 0.06]} rotation={[0.3, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.09, 0.16, 0.015]} />
                <meshStandardMaterial color="#15161d" />
              </mesh>
              <mesh position={[0, 0, 0.009]}>
                <planeGeometry args={[0.075, 0.135]} />
                <meshStandardMaterial color="#9fd8ff" emissive="#5aa0ff" emissiveIntensity={0.9} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

/* ---------- ovos e pintinhos ---------- */
export const EggBowl: React.FC<{p: V3; shake?: number; crack?: number; t?: number; n?: number; batter?: number; eyes?: number; scared?: number}> = ({p, shake = 0, crack = 0, t = 0, n = 5, batter = 0, eyes = 0, scared = 0}) => {
  const egg = sm("#fff3df", 0.45);
  const bowl = sm("#ff8fab", 0.35);
  return (
    <group position={p}>
      <mesh position={[0, 0.13, 0]} material={bowl} castShadow>
        <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={bowl}>
        <torusGeometry args={[0.3, 0.02, 8, 32]} />
      </mesh>
      {batter > 0.01 && (
        <mesh position={[0, 0.13 - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#f2d39a", 0.35)}>
          <circleGeometry args={[0.28 * batter, 28]} />
        </mesh>
      )}
      {crack < 1 &&
        Array.from({length: n}, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          const sh = shake * 0.06 * Math.sin(t * 50 + i * 2);
          return (
            <group key={i} position={[Math.cos(a) * 0.13, 0.17, Math.sin(a) * 0.13]} rotation={[sh, 0, sh * 1.3 + 0.3 * Math.cos(a)]}>
              <mesh scale={[0.085, 0.11, 0.085]} material={egg} castShadow>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              {eyes > 0.01 &&
                [-1, 1].map((sd) => (
                  <group key={"o" + sd} position={[0.03 * sd, 0.025, 0.075]} scale={[eyes, eyes * (1 + 0.4 * scared), eyes]}>
                    <mesh scale={[0.014, 0.018, 0.008]} material={sm("#0c0c10", 0.1)}>
                      <sphereGeometry args={[1, 10, 8]} />
                    </mesh>
                    <mesh position={[0.004, 0.006, 0.006]} scale={0.004} material={sm("#ffffff", 0.2)}>
                      <sphereGeometry args={[1, 6, 4]} />
                    </mesh>
                  </group>
                ))}
              {eyes > 0.01 && scared > 0.3 && (
                <mesh position={[0, -0.03, 0.08]} scale={[0.012, 0.016, 0.006]} material={sm("#3a1510", 0.5)}>
                  <sphereGeometry args={[1, 8, 6]} />
                </mesh>
              )}
              {crack > 0.05 && (
                <mesh position={[0, 0.03, 0.084]} rotation={[0, 0, 0]} material={sm("#5a4a3a", 0.6)}>
                  <torusGeometry args={[0.05 * crack, 0.004, 4, 8, Math.PI]} />
                </mesh>
              )}
            </group>
          );
        })}
    </group>
  );
};
export type ChickP = {pos?: V3; rotY?: number; run?: number; t?: number; blink?: number; peep?: number; jump?: number; hat?: boolean; inst?: "pandeiro" | "cavaco" | "mic" | "none"; play?: number; flap?: number; s?: number};
export const Chick: React.FC<{c: ChickP}> = ({c}) => {
  const {pos = [0, 0, 0], rotY = 0, run = 0, t = 0, blink = 0, peep = 0, jump = 0, hat = false, inst = "none", play = 0, flap = 0, s = 1} = c;
  const fluff = sm("#ffd84a", 0.7);
  const fluff2 = sm("#ffe680", 0.7);
  const orange = sm("#ff9a1f", 0.45);
  const eyeY = Math.max(0.1, 1 - blink);
  const hop = Math.abs(Math.sin(t * 16)) * 0.04 * run + jump;
  const fa = flap > 0 ? flap * (0.5 + 0.5 * Math.sin(t * 35)) : 0;
  return (
    <group position={[pos[0], pos[1] + hop, pos[2]]} rotation={[0, rotY, 0.08 * run * Math.sin(t * 16)]} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.035 * sd, 0.02, 0.0]} rotation={[0.5 * run * Math.sin(t * 16 + (sd > 0 ? 0 : Math.PI)), 0, 0]}>
          <mesh position={[0, 0.0, 0.025]} scale={[0.025, 0.008, 0.035]} material={orange}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} material={orange}>
            <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.11, 0]} scale={[0.09, 0.085, 0.09]} material={fluff} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={"w" + sd} position={[0.085 * sd, 0.115, -0.005]} rotation={[0, 0, sd * (0.3 + 1.2 * fa)]} scale={[0.02, 0.045, 0.04]} material={fluff2}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.215, 0.02]}>
        <mesh scale={[0.07, 0.068, 0.07]} material={fluff} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[0, 0.07, -0.01]} rotation={[0, 0, 0.3]} scale={[0.012, 0.03, 0.012]} material={fluff2}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
        {/* bico abre quando pia */}
        <mesh position={[0, -0.005 + 0.006 * peep, 0.072]} rotation={[Math.PI / 2 - 0.25 * peep, 0, 0]} material={orange}>
          <coneGeometry args={[0.02, 0.035, 8]} />
        </mesh>
        <mesh position={[0, -0.015 - 0.006 * peep, 0.068]} rotation={[Math.PI / 2 + 0.35 * peep, 0, 0]} material={orange}>
          <coneGeometry args={[0.016, 0.028, 8]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.03 * sd, 0.018, 0.058]} rotation={[0, 0.4 * sd, 0]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.014, 0.017, 0.008]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.004, 0.006, 0.006]} scale={0.004} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={"c" + sd} position={[0.05 * sd, -0.01, 0.05]} rotation={[0, 0.6 * sd, 0]} scale={[0.012, 0.008, 0.004]} material={sm("#ff8fab", 0.6)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        ))}
        {hat && (
          <group position={[0, 0.055, 0]} scale={0.22}>
            <ChefHat />
          </group>
        )}
      </group>
      {inst === "pandeiro" && (
        <group position={[0.07, 0.17 + 0.03 * play * Math.abs(Math.sin(t * 14)), 0.09]} rotation={[0.3, 0, 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#c98a4e", 0.5)}>
            <torusGeometry args={[0.055, 0.012, 6, 18]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#fbf6e8", 0.6)}>
            <circleGeometry args={[0.05, 18]} />
          </mesh>
        </group>
      )}
      {inst === "cavaco" && (
        <group position={[0.0, 0.13, 0.1]} rotation={[0, 0, -0.9 + 0.05 * Math.sin(t * 10) * play]}>
          <mesh scale={[0.05, 0.065, 0.02]} material={sm("#a0612e", 0.5)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={sm("#5a3418", 0.5)}>
            <boxGeometry args={[0.018, 0.13, 0.012]} />
          </mesh>
          <mesh position={[0, 0.0, 0.021]} material={sm("#2a170d", 0.5)}>
            <circleGeometry args={[0.015, 10]} />
          </mesh>
        </group>
      )}
      {inst === "mic" && (
        <group position={[0, 0, 0.13]}>
          <mesh position={[0, 0.12, 0]} material={sm("#2b2e3b", 0.4)}>
            <cylinderGeometry args={[0.004, 0.004, 0.24, 6]} />
          </mesh>
          <mesh position={[0, 0.25, -0.01]} material={sm("#8c8f99", 0.3, {metalness: 0.5})}>
            <sphereGeometry args={[0.018, 10, 8]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
/** casca quebrada */
export const Shell: React.FC<{p: V3; r?: number}> = ({p, r = 0}) => (
  <group position={p} rotation={[0, r, 0]}>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.05 * sd, 0.03, 0]} rotation={[sd * 0.5, 0, sd * 1.2]} scale={[0.07, 0.08, 0.07]} material={sm("#fff3df", 0.45, {side: THREE.DoubleSide})}>
        <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    ))}
  </group>
);

/* ---------- a massa do bolo (prefeita) ---------- */
export type BatterP = {pos?: V3; rise?: number; dance?: number; t?: number; blink?: number; mouth?: number; sash?: boolean; crown?: number; wave?: number; s?: number; arms?: "down" | "up" | "wave" | "shake"};
const faixaTex = () =>
  canvasTex("faixa-prefeita", 512, 96, (c) => {
    c.fillStyle = "#2e8b57";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 36, 512, 24);
    c.fillStyle = "#ffffff";
    c.font = "bold 54px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.strokeStyle = "#101018";
    c.lineWidth = 8;
    c.strokeText("PREFEITA", 256, 50);
    c.fillText("PREFEITA", 256, 50);
  });
export const Batter: React.FC<{b: BatterP}> = ({b}) => {
  const {pos = [0, 0, 0], rise = 1, dance = 0, t = 0, blink = 0, mouth = 0, sash = false, crown = 0, s = 1, arms = "down"} = b;
  const batter = sm("#f7dd8f", 0.12);
  const eyeY = Math.max(0.1, 1 - blink);
  const sway = dance * 0.25 * Math.sin(t * 7);
  const squash = 1 + dance * 0.08 * Math.sin(t * 14);
  const armRot = (sd: number): V3 => {
    switch (arms) {
      case "up":
        return [0, 0, sd * (2.4 + 0.2 * Math.sin(t * 10 + sd))];
      case "wave":
        return [0, 0, sd > 0 ? 2.3 + 0.4 * Math.sin(t * 9) : 0.5];
      case "shake":
        return sd > 0 ? [-1.2, 0, 0.6] : [0, 0, -0.5];
      default:
        return [0, 0, sd * (0.6 + dance * 0.8 * Math.abs(Math.sin(t * 7 + sd)))];
    }
  };
  if (rise < 0.01) return null;
  return (
    <group position={pos} scale={s}>
      <group position={[0, -0.35 * (1 - rise), 0]} rotation={[0, 0, sway]} scale={[1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash)]}>
        <mesh position={[0, 0.22, 0]} scale={[0.26, 0.26, 0.24]} material={batter} castShadow>
          <sphereGeometry args={[1, 26, 20]} />
        </mesh>
        <mesh position={[0, 0.46, 0]} scale={[0.17, 0.16, 0.16]} material={batter} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <mesh position={[0.02, 0.6, 0]} rotation={[0, 0, -0.4]} scale={[0.05, 0.08, 0.05]} material={batter}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        {/* pingos escorrendo */}
        {[-0.15, 0.08, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 0.07 + i * 0.02, 0.2]} scale={[0.035, 0.07, 0.035]} material={batter}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
        {/* rosto */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.08 * sd, 0.3, 0.22]} rotation={[0, 0.3 * sd, 0]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.04, 0.05, 0.02]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            <mesh position={[0.012, 0.018, 0.016]} scale={0.011} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={"c" + sd} position={[0.17 * sd, 0.24, 0.17]} rotation={[0, 0.7 * sd, 0]} scale={[0.04, 0.025, 0.01]} material={sm("#ff8fab", 0.6)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
        {mouth > 0.05 ? (
          <mesh position={[0, 0.2, 0.235]} scale={[0.05, 0.02 + 0.04 * mouth, 0.02]} material={sm("#7a1f2a", 0.5)}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        ) : (
          <mesh position={[0, 0.21, 0.238]} rotation={[0.1, 0, Math.PI + 0.35 * Math.PI / 2]} material={sm("#3a1510", 0.5)}>
            <torusGeometry args={[0.05, 0.01, 6, 16, Math.PI * 0.65]} />
          </mesh>
        )}
        {/* bracinhos */}
        {[-1, 1].map((sd) => (
          <group key={"a" + sd} position={[0.24 * sd, 0.26, 0]} rotation={armRot(sd)}>
            <mesh position={[0, -0.1, 0]} material={batter} castShadow>
              <capsuleGeometry args={[0.035, 0.14, 6, 10]} />
            </mesh>
          </group>
        ))}
        {sash && (
          <mesh position={[0, 0.22, 0.0]} rotation={[0, 0, -0.75]} material={tex("faixa", faixaTex(), 0.6, {side: THREE.DoubleSide})}>
            <cylinderGeometry args={[0.27, 0.27, 0.075, 32, 1, true]} />
          </mesh>
        )}
        {crown > 0.01 && (
          <group position={[0, 0.6 + 0.35 * (1 - crown), 0]} scale={crown}>
            <mesh material={sm("#ffd21f", 0.25, {metalness: 0.7})}>
              <cylinderGeometry args={[0.11, 0.11, 0.06, 20, 1, true]} />
            </mesh>
            {Array.from({length: 6}, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.105, 0.06, Math.sin(a) * 0.105]} material={sm("#ffd21f", 0.25, {metalness: 0.7})}>
                  <coneGeometry args={[0.025, 0.07, 6]} />
                </mesh>
              );
            })}
          </group>
        )}
      </group>
    </group>
  );
};
/** palanque com faixa "VOTE MASSA" */
const voteTex = () =>
  canvasTex("vote-massa", 512, 160, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 512, 160);
    c.strokeStyle = "#2e8b57";
    c.lineWidth = 14;
    c.strokeRect(7, 7, 498, 146);
    c.fillStyle = "#2e8b57";
    c.font = "bold 76px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("VOTE MASSA", 256, 84);
  });
export const Podium: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.2, 0]} geometry={rbox(0.7, 0.4, 0.45, 0.04)} material={sm("#2e8b57", 0.6)} castShadow />
    <mesh position={[0, 0.2, 0.227]} material={tex("vote", voteTex(), 0.6)}>
      <planeGeometry args={[0.66, 0.2]} />
    </mesh>
    <mesh position={[0.18, 0.45, 0.1]} material={sm("#2b2e3b", 0.4)}>
      <cylinderGeometry args={[0.006, 0.006, 0.2, 6]} />
    </mesh>
    <mesh position={[0.18, 0.56, 0.1]} material={sm("#8c8f99", 0.3, {metalness: 0.5})}>
      <sphereGeometry args={[0.025, 10, 8]} />
    </mesh>
  </group>
);

/* ---------- a cozinha voando (vista de fora) + disco voador ---------- */
export const FlyingKitchen: React.FC<{p: V3; r?: V3; s?: number; flame?: number; t?: number; open?: boolean}> = ({p, r = [0, 0, 0], s = 1, flame = 0, t = 0, open = false}) => {
  const wall = sm("#ffe7b8", 0.8);
  const roof = sm("#e8414f", 0.6);
  return (
    <group position={p} rotation={r} scale={s}>
      {/* caixa da cozinha (frente aberta tipo casinha de boneca quando open) */}
      <mesh position={[0, 1.0, -1.0]} geometry={rbox(3.0, 2.0, 0.12, 0.04)} material={tex("az2", azulejoTex(), 0.6)} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.5 * sd, 1.0, 0]} geometry={rbox(0.12, 2.0, 2.0, 0.04)} material={wall} castShadow />
      ))}
      <mesh position={[0, 0.03, 0]} geometry={rbox(3.0, 0.08, 2.0, 0.03)} material={tex("piso2", pisoBoloTex(), 0.5)} receiveShadow />
      <mesh position={[0, 2.05, 0]} geometry={rbox(3.2, 0.12, 2.2, 0.04)} material={roof} castShadow />
      {!open && <mesh position={[0, 1.0, 1.0]} geometry={rbox(3.0, 2.0, 0.12, 0.04)} material={wall} castShadow />}
      {!open && (
        <mesh position={[0, 1.1, 1.07]} material={sm("#fff3b0", 0.3, {emissive: "#ffd36b", emissiveIntensity: 1.2})}>
          <planeGeometry args={[1.0, 0.7]} />
        </mesh>
      )}
      {/* foguetes embaixo (o forno virou propulsor) */}
      {flame > 0.01 && (
        <group position={[0, -0.05, 0]} scale={[flame, flame * (1 + 0.2 * Math.sin(t * 50)), flame]}>
          {[-0.8, 0.8].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]} material={sm("#ffb020", 0.4, {emissive: "#ff7a00", emissiveIntensity: 2.4, transparent: true, opacity: 0.92})}>
                <coneGeometry args={[0.45, 1.8, 20]} />
              </mesh>
              <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]} material={sm("#fff3b0", 0.4, {emissive: "#fff3b0", emissiveIntensity: 2.6})}>
                <coneGeometry args={[0.25, 1.0, 16]} />
              </mesh>
            </group>
          ))}
          <pointLight position={[0, -1.2, 0]} intensity={8} distance={8} decay={2} color="#ffb040" />
        </group>
      )}
    </group>
  );
};
export const UFO: React.FC<{p: V3; r?: V3; s?: number; t?: number; beam?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, beam = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1, 0.22, 1]} material={sm("#c9ced6", 0.25, {metalness: 0.7})} castShadow>
      <sphereGeometry args={[0.9, 32, 16]} />
    </mesh>
    <mesh position={[0, 0.15, 0]} scale={[1, 0.8, 1]} material={sm("#9fe8ff", 0.05, {transparent: true, opacity: 0.6, emissive: "#3ac8ff", emissiveIntensity: 0.3})}>
      <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    {Array.from({length: 10}, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + t * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.82, -0.02, Math.sin(a) * 0.82]} material={sm(i % 2 ? "#ffd21f" : "#ff4d6d", 0.3, {emissive: i % 2 ? "#ffd21f" : "#ff4d6d", emissiveIntensity: 1.6})}>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
      );
    })}
    {beam > 0.01 && (
      <mesh position={[0, -1.6, 0]} material={sm("#b8ffd0", 0.2, {transparent: true, opacity: 0.25 * beam, emissive: "#7affb0", emissiveIntensity: 1, depthWrite: false})}>
        <cylinderGeometry args={[0.3, 1.0, 3.2, 24, 1, true]} />
      </mesh>
    )}
  </group>
);
/** luzes coloridas de show */
export const PartyLights: React.FC<{p: V3; t: number; k?: number}> = ({p, t, k = 1}) => {
  if (k < 0.01) return null;
  const cols = ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f"];
  return (
    <group position={p}>
      {cols.map((c, i) => {
        const a = t * 2 + i * 1.6;
        return <pointLight key={i} position={[Math.cos(a) * 0.9, 0.9, Math.sin(a) * 0.5 + 0.4]} intensity={2.2 * k} distance={2.5} decay={2} color={c} />;
      })}
    </group>
  );
};

/** radinho (som) */
export const Radio: React.FC<{p: V3; r?: V3; s?: number; on?: number; t?: number}> = ({p, r = [0, 0, 0], s = 1, on = 0, t = 0}) => {
  const pulse = 1 + 0.08 * on * Math.abs(Math.sin(t * 12));
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.13, 0]} geometry={rbox(0.5, 0.26, 0.16, 0.04)} material={sm("#e8414f", 0.45)} castShadow />
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.15 * sd, 0.13, 0.081]} scale={[pulse, pulse, 1]}>
          <mesh material={sm("#2b2e3b", 0.4)}>
            <circleGeometry args={[0.075, 20]} />
          </mesh>
          <mesh position={[0, 0, 0.002]} material={sm("#5a5d68", 0.4)}>
            <circleGeometry args={[0.03, 16]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, -0.03]} rotation={[Math.PI / 2, 0, 0]} material={sm("#2b2e3b", 0.4)}>
        <torusGeometry args={[0.16, 0.012, 6, 20, Math.PI]} />
      </mesh>
      <mesh position={[0, 0.2, 0.082]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: on * 1.2})}>
        <planeGeometry args={[0.09, 0.03]} />
      </mesh>
    </group>
  );
};
