import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Vídeo "Se você quer tomar banho quente, mas o chuveiro tá dando choque" ===== */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mc = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = mc.get(key);
  if (!m) mc.set(key, (m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra})));
  return m;
};

/* ---------- banheiro ---------- */
const azulejoTex = (a: string, b: string) =>
  canvasTex("azulejo-" + a + b, 256, 256, (c) => {
    c.fillStyle = b;
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = a;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) c.fillRect(x * 64 + 3, y * 64 + 3, 58, 58);
  }, [6, 4]);
export const BATH = {x0: -2.2, x1: 2.2, z0: -2.2, h: 3.2};
export const SHOWER_P: V3 = [-1.0, 2.35, -2.05]; // ponto onde fica o chuveiro (parede do fundo)
export const WINDOW_B: V3 = [0.45, 2.3, -2.17];
export const Bathroom: React.FC<{steam?: number; dark?: number}> = ({steam = 0, dark = 0}) => {
  const {x0, x1, z0, h} = BATH;
  const W = x1 - x0;
  const wall = tm("azulejo-a", azulejoTex("#bfe6f5", "#e8f6fb"), 0.3);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={tm("piso-banheiro", azulejoTex("#8fa8c8", "#c9d6e6"), 0.4)} receiveShadow>
        <planeGeometry args={[W, 6]} />
      </mesh>
      {/* parede do fundo com o vão da janela */}
      {(() => {
        const wx0 = WINDOW_B[0] - 0.36, wx1 = WINDOW_B[0] + 0.36, wy0 = WINDOW_B[1] - 0.26, wy1 = WINDOW_B[1] + 0.26;
        const parts: [number, number, number, number][] = [
          [x0, wx0, 0, h],
          [wx1, x1, 0, h],
          [wx0, wx1, 0, wy0],
          [wx0, wx1, wy1, h],
        ];
        return parts.map(([a0, a1, b0, b1], i) => (
          <mesh key={"pw" + i} position={[(a0 + a1) / 2, (b0 + b1) / 2, z0 - 0.1]} material={wall} receiveShadow>
            <boxGeometry args={[a1 - a0, b1 - b0, 0.2]} />
          </mesh>
        ));
      })()}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(W / 2 + 0.1) * sd, h / 2, z0 + 3]} material={wall} receiveShadow>
          <boxGeometry args={[0.2, h, 6]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, z0 + 3]} material={sm("#f4f6f8", 0.9)}>
        <planeGeometry args={[W, 6]} />
      </mesh>
      {/* box com cortina */}
      <mesh position={[-1.0, 0.04, -1.45]} geometry={rbox(1.6, 0.08, 1.4, 0.03)} material={sm("#ffffff", 0.3)} receiveShadow />
      <mesh position={[-1.0, 2.6, -0.75]} rotation={[0, 0, Math.PI / 2]} material={sm("#c9ced6", 0.3, {metalness: 0.6})}>
        <cylinderGeometry args={[0.02, 0.02, 1.7, 8]} />
      </mesh>
      {Array.from({length: 4}, (_, i) => (
        <mesh key={i} position={[-1.78 + i * 0.07, 1.6, -0.75 + 0.04 * (i % 2)]} material={sm("#ffd21f", 0.7, {side: THREE.DoubleSide})}>
          <boxGeometry args={[0.07, 2.0, 0.02]} />
        </mesh>
      ))}
      {/* pia e espelho */}
      <mesh position={[1.45, 0.85, -1.9]} geometry={rbox(0.8, 0.12, 0.5, 0.04)} material={sm("#ffffff", 0.25)} castShadow />
      <mesh position={[1.45, 0.42, -1.95]} material={sm("#ffffff", 0.3)}>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 14]} />
      </mesh>
      <mesh position={[1.45, 1.75, -2.17]} geometry={rbox(0.7, 0.9, 0.04, 0.05)} material={sm("#cfeaf7", 0.08, {emissive: "#9fd8ff", emissiveIntensity: 0.25})} />
      {/* janelinha (onde o poraquê espia no fim) */}
      <group position={[WINDOW_B[0], WINDOW_B[1], WINDOW_B[2]]}>
        {[[0, 0.3, 0.85, 0.07], [0, -0.3, 0.85, 0.07], [-0.4, 0, 0.07, 0.65], [0.4, 0, 0.07, 0.65], [0, 0, 0.04, 0.55]].map(([x, y, w, hh], i) => (
          <mesh key={i} position={[x, y, 0.02]} geometry={rbox(w, hh, 0.08, 0.02)} material={sm("#ffffff", 0.5)} />
        ))}
        <mesh position={[0, 0, 0.035]} material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.18, depthWrite: false})}>
          <planeGeometry args={[0.72, 0.52]} />
        </mesh>
        {/* lá fora: céu atrás da janela */}
        <mesh position={[0, 0, -1.6]} material={sm(dark > 0.5 ? "#101a44" : "#9fd8ff", 0.9, {emissive: dark > 0.5 ? "#101a44" : "#bfe6ff", emissiveIntensity: 0.6})}>
          <planeGeometry args={[4, 3]} />
        </mesh>
      </group>
      {/* vaso */}
      <group position={[0.35, 0, -1.75]}>
        <mesh position={[0, 0.22, 0]} material={sm("#ffffff", 0.3)} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.44, 16]} />
        </mesh>
        <mesh position={[0, 0.45, 0.05]} scale={[1, 0.25, 1.25]} material={sm("#ffffff", 0.3)}>
          <sphereGeometry args={[0.22, 16, 10]} />
        </mesh>
        <mesh position={[0, 0.7, -0.22]} geometry={rbox(0.42, 0.42, 0.18, 0.04)} material={sm("#ffffff", 0.3)} castShadow />
      </group>
      {/* tapete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.005, -0.2]} material={sm("#ff8fab", 0.9)}>
        <circleGeometry args={[0.45, 24]} />
      </mesh>
      {steam > 0.01 && (
        <mesh position={[0, 1.6, -1]} material={sm("#ffffff", 1, {transparent: true, opacity: 0.25 * steam, depthWrite: false})}>
          <boxGeometry args={[W - 0.1, h - 0.2, 2.2]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- chuveiro elétrico (o "chuveirinho" branco com fios) ---------- */
export const ElectricShower: React.FC<{p?: V3; heat?: number; t?: number; spark?: number; shake?: number}> = ({p = SHOWER_P, heat = 0, t = 0, spark = 0, shake = 0}) => {
  const col = new THREE.Color("#f4f4f2").lerp(new THREE.Color("#ff3b1f"), heat);
  const hex = "#" + col.getHexString();
  const sx = shake * 0.02 * Math.sin(t * 60);
  return (
    <group position={[p[0] + sx, p[1], p[2]]}>
      {/* cano */}
      <mesh position={[0, 0.25, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.3, {metalness: 0.6})}>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 8]} />
      </mesh>
      {/* corpo do chuveiro */}
      <mesh position={[0, 0.1, 0.28]} geometry={rbox(0.24, 0.32, 0.2, 0.08)} material={sm(hex, 0.35, {emissive: hex, emissiveIntensity: 0.9 * heat})} castShadow />
      <mesh position={[0, -0.08, 0.32]} rotation={[0, 0, 0]} material={sm(hex, 0.35, {emissive: hex, emissiveIntensity: 0.9 * heat})}>
        <cylinderGeometry args={[0.16, 0.12, 0.08, 20]} />
      </mesh>
      {/* chave de temperatura */}
      <mesh position={[0.12, 0.18, 0.38]} rotation={[Math.PI / 2, 0, 0]} material={sm("#3a86ff", 0.4)}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
      </mesh>
      {/* fios saindo (o famoso "gambiarra") */}
      {[-1, 1].map((sd) => {
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.08 * sd, 0.24, 0.22), new THREE.Vector3(0.18 * sd, 0.42, 0.16), new THREE.Vector3(0.22 * sd, 0.75, 0.06), new THREE.Vector3(0.24 * sd, 0.95, 0.02)]);
        return (
          <mesh key={sd} material={sm(sd < 0 ? "#e8414f" : "#1d1f27", 0.5)}>
            <tubeGeometry args={[curve, 16, 0.012, 6, false]} />
          </mesh>
        );
      })}
      <Sparks p={[0, 0.25, 0.32]} k={spark} t={t} />
    </group>
  );
};
/** faíscas amarelas */
export const Sparks: React.FC<{p: V3; k: number; t: number; size?: number}> = ({p, k, t, size = 1}) => {
  if (k < 0.01) return null;
  const f = Math.floor(t * 30);
  const r = rng(f * 13 + 7);
  return (
    <group position={p} scale={size}>
      {Array.from({length: 10}, (_, i) => {
        const a = r() * Math.PI * 2;
        const e = (r() - 0.3) * 1.4;
        const l = 0.12 + r() * 0.25;
        return (
          <mesh key={i} position={[Math.cos(a) * l * 0.6, Math.sin(e) * l * 0.6, Math.sin(a) * l * 0.6 + 0.05]} rotation={[0, -a, e + Math.PI / 2]} material={sm("#fff3a0", 0.2, {emissive: "#ffd21f", emissiveIntensity: 3 * k})}>
            <boxGeometry args={[0.012, l, 0.012]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** raio em zigue-zague de a até b */
export const Bolt: React.FC<{a: V3; b: V3; k: number; t: number; color?: string}> = ({a, b, k, t, color = "#fff59a"}) => {
  if (k < 0.01) return null;
  const r = rng(Math.floor(t * 20) * 3 + 1);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const j = i === 0 || i === 8 ? 0 : 0.12;
    pts.push(new THREE.Vector3(lerp(a[0], b[0], u) + (r() - 0.5) * j, lerp(a[1], b[1], u) + (r() - 0.5) * j, lerp(a[2], b[2], u) + (r() - 0.5) * j));
  }
  return (
    <mesh material={sm(color, 0.2, {emissive: color, emissiveIntensity: 3 * k})}>
      <tubeGeometry args={[new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0), 32, 0.02, 5, false]} />
    </mesh>
  );
};
/** vapor / erupção de água fervendo (bolinhas brancas subindo) */
export const SteamJet: React.FC<{p: V3; k: number; t: number; h?: number; spread?: number}> = ({p, k, t, h = 2.6, spread = 0.6}) => {
  if (k < 0.01) return null;
  return (
    <group position={p}>
      {Array.from({length: 34}, (_, i) => {
        const q = (t * 1.3 + i / 34) % 1;
        const a = i * 2.4;
        return (
          <mesh key={i} position={[Math.cos(a) * spread * q, -0.1 - q * 0.2 + (i % 2 ? q * h * 0.25 : -q * 1.2), Math.sin(a) * spread * q * 0.6 + 0.3]} material={sm(i % 4 ? "#ffffff" : "#bfe6ff", 0.9, {transparent: true, opacity: 0.7 * (1 - q) * k, depthWrite: false})}>
            <sphereGeometry args={[(0.08 + 0.3 * q) * k, 10, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- o poraquê eletricista (frente = +z) ---------- */
export type PoraqueP = {pos?: V3; rotY?: number; t?: number; glow?: number; mouth?: number; blink?: number; helmet?: boolean; shades?: boolean; wiggle?: number; s?: number; look?: [number, number]; smile?: number; coil?: number};
export const Poraque: React.FC<{p: PoraqueP}> = ({p}) => {
  const {pos = [0, 0, 0], rotY = 0, t = 0, glow = 0, mouth = 0, blink = 0, helmet = true, shades = false, wiggle = 1, s = 1, look = [0, 0], smile = 1, coil = 0} = p;
  const body = new THREE.Color("#5a6b3a").lerp(new THREE.Color("#ffe14a"), glow);
  const hex = "#" + body.getHexString();
  const skin = sm(hex, 0.45, {emissive: glow > 0 ? "#ffd21f" : "#000000", emissiveIntensity: 0.55 * glow});
  const belly = sm(glow > 0.5 ? "#fff6b0" : "#d9a86a", 0.5, {emissive: glow > 0 ? "#ffe14a" : "#000000", emissiveIntensity: glow});
  // corpo: curva em S (cabeça erguida na frente, rabo atrás). coil > 0 = enrolado (no poste)
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      if (coil > 0.5) {
        const a = u * Math.PI * 4.2;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.32, 0.3 + (1 - u) * 1.1, Math.sin(a) * 0.32));
      } else {
        const sw = Math.sin(u * 5 - t * 6 * wiggle) * 0.18 * u;
        pts.push(new THREE.Vector3(sw, 0.62 - 0.35 * u * u + 0.12 * Math.sin(u * 3), 0.3 - 1.6 * u));
      }
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [t, wiggle, coil]);
  const geo = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, 48, 1, 14, false);
    const P = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      const c = curve.getPointAt(u);
      const r = 0.16 * (1 - 0.75 * u * u) * (u < 0.08 ? 0.75 + 3 * u : 1);
      for (let j = 0; j <= 14; j++) {
        const k = i * 15 + j;
        v.fromBufferAttribute(P, k).sub(c).multiplyScalar(r).add(c);
        P.setXYZ(k, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals();
    return g;
  }, [curve]);
  const head = curve.getPointAt(0);
  const tan = curve.getTangentAt(0);
  const yaw = Math.atan2(-tan.x, -tan.z);
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <mesh geometry={geo} material={skin} castShadow />
      {/* barbatana de baixo */}
      {[0.35, 0.55, 0.75].map((u) => {
        const q = curve.getPointAt(u);
        return (
          <mesh key={u} position={[q.x, q.y - 0.12 * (1 - 0.6 * u), q.z]} scale={[0.02, 0.06, 0.12]} material={belly}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        );
      })}
      <group position={[head.x, head.y, head.z]} rotation={[0, yaw, 0]}>
        {/* cabeça arredondada */}
        <mesh position={[0, 0.02, 0.06]} scale={[0.17, 0.15, 0.2]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[0, -0.06, 0.1]} scale={[0.13, 0.06, 0.15]} material={belly}>
          <sphereGeometry args={[1, 16, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.09 * sd, 0.08, 0.17]} rotation={[0, 0.3 * sd, 0]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.05, 0.055, 0.03]} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
            <mesh position={[look[0] * 0.015, look[1] * 0.015, 0.025]} scale={[0.027, 0.03, 0.015]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.01, 0.015, 0.04]} scale={0.008} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          </group>
        ))}
        {shades && (
          <group position={[0, 0.085, 0.215]}>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.085 * sd, 0, 0]} rotation={[0, 0.3 * sd, 0]} geometry={rbox(0.11, 0.07, 0.015, 0.03)} material={sm("#0b0b10", 0.1)} />
            ))}
          </group>
        )}
        {mouth > 0.05 ? (
          <mesh position={[0, -0.03, 0.245]} scale={[0.06, 0.012 + 0.035 * mouth, 0.02]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.02, 0.25]} rotation={[0.2, 0, smile > 0.3 ? Math.PI + 0.5 : 0.5]} material={sm("#3a1510", 0.5)}>
            <torusGeometry args={[0.05, 0.009, 6, 14, Math.PI * 0.65]} />
          </mesh>
        )}
        {/* bigodinhos de peixe */}
        {[-1, 1].map((sd) => (
          <mesh key={"b" + sd} position={[0.07 * sd, -0.04, 0.22]} rotation={[0, 0, sd * -0.4]} material={sm("#3a2a10", 0.5)}>
            <cylinderGeometry args={[0.004, 0.002, 0.14, 4]} />
          </mesh>
        ))}
        {helmet && (
          <group position={[0, 0.15, 0.04]} rotation={[-0.15, 0, 0]}>
            <mesh scale={[1, 0.62, 1.05]} material={sm("#ffd21f", 0.35)} castShadow>
              <sphereGeometry args={[0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.0, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.3, 1]} material={sm("#ffd21f", 0.35, {side: THREE.DoubleSide})}>
              <ringGeometry args={[0.16, 0.21, 20, 1, Math.PI, Math.PI]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
/** aquário com rodinhas (o "carrinho" do poraquê) — o poraquê vai dentro */
export const Aquarium: React.FC<{p: V3; rotY?: number; t?: number; spin?: number; children?: React.ReactNode}> = ({p, rotY = 0, spin = 0, children}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.2, 0]} geometry={rbox(0.9, 0.08, 1.5, 0.03)} material={sm("#3a86ff", 0.4)} castShadow />
    {[-0.38, 0.38].map((x) =>
      [-0.6, 0.6].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.09, z]} rotation={[spin, 0, Math.PI / 2]} material={sm("#1d1f27", 0.5)}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 14]} />
        </mesh>
      )),
    )}
    <mesh position={[0, 0.62, 0]} geometry={rbox(0.86, 0.8, 1.46, 0.04)} material={sm("#bfe9ff", 0.05, {transparent: true, opacity: 0.25, depthWrite: false})} />
    <mesh position={[0, 0.5, 0]} geometry={rbox(0.82, 0.56, 1.42, 0.03)} material={sm("#5ab8f0", 0.05, {transparent: true, opacity: 0.3, depthWrite: false})} />
    <group position={[0, 0.22, 0.35]}>{children}</group>
  </group>
);

/* ---------- tucano guarda de trânsito (frente = +z) ---------- */
export type TucanoP = {pos?: V3; rotY?: number; t?: number; blink?: number; whistle?: number; flap?: number; peck?: number; s?: number; glowEyes?: number; beakTilt?: number; grab?: number};
export const Tucano: React.FC<{p: TucanoP}> = ({p}) => {
  const {pos = [0, 0, 0], rotY = 0, t = 0, blink = 0, whistle = 0, flap = 0, peck = 0, s = 1, glowEyes = 0, beakTilt = 0, grab = 0} = p;
  const wp: V3 = [lerp(0, 0.07, whistle), lerp(0.02, 0.36, whistle), lerp(0.36, 0.4, whistle)];
  const black = sm("#15161d", 0.5);
  const fa = flap * (0.5 + 0.5 * Math.sin(t * 30));
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {/* pernas */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.12 * sd, 0.2, 0]} material={sm("#3a86ff", 0.5)}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.85, 0]} rotation={[0.3 * peck, 0, 0]}>
        <mesh scale={[0.32, 0.48, 0.3]} material={black} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        {/* peito branco/amarelo */}
        <mesh position={[0, 0.15, 0.17]} scale={[0.22, 0.24, 0.16]} material={sm("#fff4c8", 0.5)}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <mesh position={[0, -0.18, 0.2]} scale={[0.18, 0.06, 0.1]} material={sm("#e8414f", 0.5)}>
          <sphereGeometry args={[1, 14, 8]} />
        </mesh>
        {/* asas */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.3 * sd, 0.08, -0.02]} rotation={[sd < 0 ? -1.3 * grab : 0, 0, sd * (0.15 + 1.2 * fa) + (sd < 0 ? 0.5 * grab : 0)]}>
            <mesh position={[0.04 * sd, -0.15, 0]} scale={[0.07, 0.3, 0.2]} material={black} castShadow>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          </group>
        ))}
        {/* rabo */}
        <mesh position={[0, -0.35, -0.3]} rotation={[0.7, 0, 0]} scale={[0.12, 0.04, 0.3]} material={black}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        {/* cabeça */}
        <group position={[0, 0.5, 0.04]}>
          <mesh scale={[0.22, 0.22, 0.22]} material={black} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.13 * sd, 0.03, 0.12]} rotation={[0, 0.6 * sd, 0]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.075, 0.075, 0.03]} material={sm("#3ab0ff", 0.3)}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
              <mesh position={[0, 0, 0.02]} scale={[0.045, 0.045, 0.02]} material={sm("#ffffff", 0.2, {emissive: "#ffffff", emissiveIntensity: glowEyes * 2})}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh position={[0, 0, 0.035]} scale={[0.025, 0.028, 0.012]} material={sm("#0c0c10", 0.1)}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
            </group>
          ))}
          {/* bicão laranja com ponta preta */}
          <group position={[0, -0.02, 0.17]} rotation={[0.25 + beakTilt, 0, 0]}>
            <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.7]} material={sm("#ff9a1f", 0.35)} castShadow>
              <coneGeometry args={[0.13, 0.6, 18]} />
            </mesh>
            <mesh position={[0, 0.035, 0.12]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]} material={sm("#ffd21f", 0.35)}>
              <cylinderGeometry args={[0.12, 0.13, 0.25, 18]} />
            </mesh>
            <mesh position={[0, 0, 0.56]} scale={[0.03, 0.025, 0.04]} material={black}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
          {/* quepe de guarda */}
          <group position={[0, 0.17, -0.02]} rotation={[-0.12, 0, 0]}>
            <mesh material={sm("#1f3f9a", 0.5)} castShadow>
              <cylinderGeometry args={[0.2, 0.18, 0.12, 20]} />
            </mesh>
            <mesh position={[0, 0.07, 0]} material={sm("#1f3f9a", 0.5)}>
              <cylinderGeometry args={[0.24, 0.2, 0.03, 20]} />
            </mesh>
            <mesh position={[0, -0.03, 0.17]} rotation={[0.3, 0, 0]} geometry={rbox(0.26, 0.02, 0.12, 0.01)} material={sm("#15161d", 0.3)} />
            <mesh position={[0, 0.02, 0.185]} material={sm("#ffd21f", 0.3, {metalness: 0.6})}>
              <sphereGeometry args={[0.025, 8, 6]} />
            </mesh>
          </group>
        </group>
        {/* cordinha no pescoço + apito (pendurado no peito ou na boca) */}
        <mesh position={[0, 0.34, 0.03]} rotation={[Math.PI / 2 - 0.25, 0, 0]} material={sm("#e8414f", 0.6)}>
          <torusGeometry args={[0.19, 0.012, 6, 24]} />
        </mesh>
        <mesh material={sm("#e8414f", 0.6)}>
          <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.3, 0.21), new THREE.Vector3((wp[0]) * 0.5, (0.3 + wp[1]) / 2 - 0.04, (0.21 + wp[2]) / 2 + 0.04), new THREE.Vector3(wp[0], wp[1] + 0.02, wp[2] - 0.03)]), 10, 0.01, 5, false]} />
        </mesh>
        <group position={wp} rotation={[whistle > 0.5 ? -0.2 : 0.3, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.25, {metalness: 0.75})}>
            <cylinderGeometry args={[0.03, 0.035, 0.11, 10]} />
          </mesh>
          <mesh position={[0, 0.03, -0.01]} material={sm("#c9ced6", 0.25, {metalness: 0.75})}>
            <sphereGeometry args={[0.04, 10, 8]} />
          </mesh>
        </group>
        {/* colete refletivo */}
        <mesh position={[0, -0.05, 0.02]} scale={[0.335, 0.2, 0.315]} material={sm("#c6ff3a", 0.5, {emissive: "#8fd14f", emissiveIntensity: 0.2})}>
          <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.35]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- acessórios do boneco (espaço da cabeça) ---------- */
export const ShowerCap: React.FC = () => (
  <group position={[0, 0.17, -0.03]}>
    <mesh scale={[1.12, 0.8, 1.12]} material={sm("#ff8fab", 0.6)} castShadow>
      <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#ff6f97", 0.6)}>
      <torusGeometry args={[0.395, 0.035, 8, 28]} />
    </mesh>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[Math.cos(i) * 0.22, 0.18 + 0.03 * (i % 2), Math.sin(i) * 0.22]} material={sm("#ffffff", 0.6)}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>
    ))}
  </group>
);
/** toalha no ombro (pendurada abaixo da cabeça) */
export const TowelShoulder: React.FC = () => (
  <group position={[0.22, -0.4, 0]}>
    <mesh position={[0, -0.02, 0]} geometry={rbox(0.26, 0.08, 0.5, 0.03)} material={sm("#3ab0ff", 0.9)} castShadow />
    <mesh position={[0.08, -0.25, 0.22]} rotation={[0, 0, -0.1]} geometry={rbox(0.24, 0.45, 0.05, 0.02)} material={sm("#3ab0ff", 0.9)} />
    <mesh position={[0.08, -0.25, -0.22]} rotation={[0, 0, -0.1]} geometry={rbox(0.24, 0.45, 0.05, 0.02)} material={sm("#3ab0ff", 0.9)} />
  </group>
);
/** capacete de astronauta (bolha de vidro) */
export const AstroHelmet: React.FC<{fog?: number}> = ({fog = 0}) => (
  <group position={[0, 0.02, 0]}>
    <mesh material={sm("#d9f2ff", 0.05, {transparent: true, opacity: 0.25 + 0.5 * fog, depthWrite: false})}>
      <sphereGeometry args={[0.5, 28, 20]} />
    </mesh>
    <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.3, {metalness: 0.5})}>
      <torusGeometry args={[0.33, 0.06, 10, 28]} />
    </mesh>
  </group>
);

/* ---------- carrinho simples (sem cara) ---------- */
export const PlainCar: React.FC<{p: V3; rotY?: number; color?: string; s?: number}> = ({p, rotY = 0, color = "#e8414f", s = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.45, 0]} geometry={rbox(1.6, 0.5, 3.0, 0.15)} material={sm(color, 0.35, {metalness: 0.15})} castShadow />
    <mesh position={[0, 0.88, -0.2]} geometry={rbox(1.4, 0.45, 1.6, 0.15)} material={sm(color, 0.35, {metalness: 0.15})} castShadow />
    <mesh position={[0, 0.88, -0.2]} geometry={rbox(1.42, 0.3, 1.5, 0.08)} material={sm("#9fd8ff", 0.1, {metalness: 0.2})} />
    {[-1, 1].map((sd) =>
      [-0.95, 0.95].map((z) => (
        <mesh key={`${sd}${z}`} position={[0.78 * sd, 0.3, z]} rotation={[0, 0, Math.PI / 2]} material={sm("#1d1f27", 0.6)}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        </mesh>
      )),
    )}
    {[-1, 1].map((sd) => (
      <mesh key={"f" + sd} position={[0.5 * sd, 0.5, 1.51]} scale={[1, 1, 0.3]} material={sm("#fff6c8", 0.2, {emissive: "#ffe9a0", emissiveIntensity: 0.6})}>
        <sphereGeometry args={[0.12, 12, 8]} />
      </mesh>
    ))}
  </group>
);

/* ---------- represa de Itaipu ---------- */
const itaipuTex = () =>
  canvasTex("itaipu-placa", 512, 128, (c) => {
    c.fillStyle = "#1f3f9a";
    c.fillRect(0, 0, 512, 128);
    c.fillStyle = "#ffffff";
    c.font = "bold 84px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("ITAIPU", 256, 70);
  });
export const Dam: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 6]} material={sm("#5fae3e", 0.9)} receiveShadow>
      <planeGeometry args={[80, 40]} />
    </mesh>
    {/* rio embaixo */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3]} material={sm("#3a86c8", 0.2, {emissive: "#1f5fa0", emissiveIntensity: 0.15})}>
      <planeGeometry args={[30, 6]} />
    </mesh>
    {/* paredão */}
    <mesh position={[0, 6, -4]} geometry={rbox(36, 12, 3, 0.2)} material={sm("#c9c4b8", 0.8)} castShadow receiveShadow />
    {Array.from({length: 9}, (_, i) => (
      <mesh key={i} position={[-14 + i * 3.5, 6, -2.45]} geometry={rbox(0.6, 12, 0.3, 0.05)} material={sm("#b0aa9c", 0.8)} />
    ))}
    {/* vertedouro: cachoeiras */}
    {[-8, -4, 0, 4, 8].map((x, i) => (
      <mesh key={"w" + i} position={[x, 5, -2.35]} material={sm("#d9f2ff", 0.2, {transparent: true, opacity: 0.8, emissive: "#9fd8ff", emissiveIntensity: 0.3 + 0.15 * Math.sin(t * 8 + i)})}>
        <planeGeometry args={[2.2, 10]} />
      </mesh>
    ))}
    <mesh position={[0, 11.2, -2.4]} material={tm("itaipu-placa", itaipuTex(), 0.5, {emissive: "#ffffff", emissiveMap: itaipuTex(), emissiveIntensity: 0.3})}>
      <planeGeometry args={[6, 1.5]} />
    </mesh>
    {/* torres de energia */}
    {[-12, 12].map((x) => (
      <group key={x} position={[x, 0, 1]}>
        {[-0.5, 0.5].map((dx) => (
          <mesh key={dx} position={[dx, 3, 0]} rotation={[0, 0, -dx * 0.12]} material={sm("#8c919b", 0.4, {metalness: 0.5})}>
            <boxGeometry args={[0.12, 6, 0.12]} />
          </mesh>
        ))}
        <mesh position={[0, 5.6, 0]} material={sm("#8c919b", 0.4, {metalness: 0.5})}>
          <boxGeometry args={[2.4, 0.12, 0.12]} />
        </mesh>
      </group>
    ))}
  </group>
);
/** capacete de astronauta tipo traje espacial (casco branco + viseira dourada espelhada) — espaço da cabeça */
export const EvaHelmet: React.FC<{visor?: number}> = ({visor = 1}) => (
  <group position={[0, 0.02, 0]}>
    <mesh material={sm("#f4f4f2", 0.35)} castShadow>
      <sphereGeometry args={[0.52, 32, 24]} />
    </mesh>
    {/* abertura da frente com viseira dourada */}
    <mesh position={[0, 0.02, 0.1]} rotation={[0, 0, 0]} scale={[0.92, 0.82, 0.92]} material={sm("#d4a017", 0.08, {metalness: 0.9, emissive: "#7a5a10", emissiveIntensity: 0.35 * visor, transparent: visor < 1, opacity: 0.35 + 0.65 * visor})}>
      <sphereGeometry args={[0.5, 28, 18, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.22, Math.PI * 0.5]} />
    </mesh>
    {/* lanternas laterais */}
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.42 * sd, 0.22, 0.18]}>
        <mesh geometry={rbox(0.1, 0.1, 0.16, 0.03)} material={sm("#c9ced6", 0.4)} />
        <mesh position={[0, 0, 0.085]} material={sm("#fff6c8", 0.2, {emissive: "#ffe9a0", emissiveIntensity: 1})}>
          <circleGeometry args={[0.035, 12]} />
        </mesh>
      </group>
    ))}
    {/* anel do pescoço */}
    <mesh position={[0, -0.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#8c919b", 0.3, {metalness: 0.6})}>
      <torusGeometry args={[0.36, 0.07, 10, 28]} />
    </mesh>
  </group>
);
/** equipamento do traje (painel no peito, mochila de suporte de vida, faixas) — no espaço do corpo (pos/rotY do boneco) */
export const EvaGear: React.FC<{pos: V3; rotY: number; t?: number}> = ({pos, rotY, t = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {/* painel de controle no peito */}
    <mesh position={[0, 1.12, 0.3]} geometry={rbox(0.4, 0.22, 0.14, 0.03)} material={sm("#e6e6e6", 0.4)} castShadow />
    {[-0.12, -0.04, 0.04, 0.12].map((x, i) => (
      <mesh key={i} position={[x, 1.14, 0.375]} material={sm(["#e8414f", "#3a86ff", "#ffd21f", "#2ecc71"][i], 0.3, {emissive: ["#e8414f", "#3a86ff", "#ffd21f", "#2ecc71"][i], emissiveIntensity: 0.4 + 0.4 * Math.abs(Math.sin(t * 3 + i))})}>
        <cylinderGeometry args={[0.022, 0.022, 0.02, 10]} />
      </mesh>
    ))}
    {/* mangueiras do painel */}
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.17 * sd, 1.0, 0.27]} rotation={[0.3, 0, 0]} material={sm("#c9ced6", 0.4)}>
        <torusGeometry args={[0.07, 0.018, 6, 12, Math.PI]} />
      </mesh>
    ))}
    {/* mochila grande de suporte de vida */}
    <mesh position={[0, 1.15, -0.36]} geometry={rbox(0.62, 0.72, 0.3, 0.06)} material={sm("#f4f4f2", 0.4)} castShadow />
    <mesh position={[0, 1.42, -0.36]} geometry={rbox(0.5, 0.14, 0.32, 0.04)} material={sm("#d9d9d9", 0.4)} />
    {/* faixas e emblemas genéricos nos braços/peito */}
    <mesh position={[-0.13, 1.3, 0.24]} material={sm("#2e5bd0", 0.4)}>
      <circleGeometry args={[0.05, 16]} />
    </mesh>
    {/* botas brancas grossas */}
    {[-1, 1].map((sd) => (
      <mesh key={"bt" + sd} position={[0.125 * sd, 0.08, 0.05]} geometry={rbox(0.24, 0.17, 0.38, 0.06)} material={sm("#f4f4f2", 0.4)} castShadow />
    ))}
  </group>
);
