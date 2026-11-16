import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";
import {ObjFace} from "./Sets22";

/* ===== Objetos do vídeo "Se você quer devolver a panela da sua tia, mas a panela virou vereadora" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const textTex = (key: string, text: string, bg: string, fg: string, w = 512, h = 96, size = 50) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = "center";
    c.fillText(text, w / 2, h / 2 + size * 0.35);
  });
/** placa com texto */
export const Sign: React.FC<{p: V3; r?: V3; w: number; h: number; text: string; bg?: string; fg?: string; size?: number}> = ({p, r = [0, 0, 0], w, h, text, bg = "#ffffff", fg = "#101018", size = 50}) => (
  <mesh position={p} rotation={r} material={tm("sign-" + text + bg, textTex("sign-" + text + bg, text, bg, fg, 512, Math.round((512 * h) / w), size), 0.5, {side: THREE.DoubleSide})}>
    <planeGeometry args={[w, h]} />
  </mesh>
);

/* ---------- a panela (com carinha e faixa de vereadora) ---------- */
export const Pot: React.FC<{p: V3; rotY?: number; s?: number; t?: number; mood?: "happy" | "sad" | "sleep" | "scared"; mouth?: number; sash?: boolean; cry?: number; hop?: number}> = ({p, rotY = 0, s = 1, t = 0, mood = "happy", mouth = 0, sash = true, cry = 0, hop = 0}) => {
  const metal = sm("#c9ced6", 0.25, {metalness: 0.75});
  return (
    <group position={[p[0], p[1] + Math.abs(Math.sin(t * 7)) * 0.08 * hop, p[2]]} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.3, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.38, 0.34, 0.6, 28]} />
      </mesh>
      {/* tampa e pegador */}
      <mesh position={[0, 0.63, 0]} scale={[1, 0.25, 1]} material={metal}>
        <sphereGeometry args={[0.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.74, 0]} material={sm("#1d1f27", 0.4)}>
        <sphereGeometry args={[0.06, 12, 8]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.45 * sd, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#1d1f27", 0.4)}>
          <torusGeometry args={[0.07, 0.025, 6, 14, Math.PI]} />
        </mesh>
      ))}
      <group position={[0, 0.36, 0.37]}>
        <ObjFace s={0.95} mood={mood} t={t} mouth={mouth} cry={cry} />
      </group>
      {sash && (
        <group position={[0, 0.1, 0]} rotation={[0, 0, 0.2]}>
          <mesh material={sm("#2ecc71", 0.6)}>
            <cylinderGeometry args={[0.395, 0.375, 0.08, 28, 1, true]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- fax ---------- */
export const FaxMachine: React.FC<{p: V3; s?: number; paper?: number}> = ({p, s = 1, paper = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.1, 0]} geometry={rbox(0.5, 0.2, 0.4, 0.04)} material={sm("#e6e6e0", 0.5)} castShadow />
    <mesh position={[-0.15, 0.22, 0.05]} geometry={rbox(0.12, 0.06, 0.25, 0.02)} material={sm("#1d1f27", 0.4)} />
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0.08 + i * 0.07, 0.205, 0.1]} material={sm("#3a3f4a", 0.4)}>
        <boxGeometry args={[0.05, 0.01, 0.05]} />
      </mesh>
    ))}
    {paper > 0 && (
      <mesh position={[0.05, 0.2, -0.2 - paper * 0.2]} rotation={[-0.4, 0, 0]} material={sm("#ffffff", 0.7, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.3, 0.1 + paper * 0.35]} />
      </mesh>
    )}
  </group>
);

/* ---------- Câmara (salão com tribuna) ---------- */
export const Chamber: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8a2a2a", 0.8)} receiveShadow>
      <planeGeometry args={[16, 16]} />
    </mesh>
    <mesh position={[0, 3, -3.2]} material={sm("#e9dcc0", 0.9)} receiveShadow>
      <boxGeometry args={[12, 6, 0.2]} />
    </mesh>
    {[-3.5, -1.2, 1.2, 3.5].map((x) => (
      <mesh key={x} position={[x, 2.5, -3.0]} material={sm("#ffffff", 0.6)}>
        <cylinderGeometry args={[0.25, 0.28, 5, 14]} />
      </mesh>
    ))}
    <Sign p={[0, 4.3, -3.08]} w={4.4} h={0.6} text="CÂMARA DE CURITIBA" bg="#1f3f8a" fg="#ffd21f" size={44} />
    {/* bandeiras */}
    {[-2.3, 2.3].map((x, i) => (
      <group key={x} position={[x, 0, -2.6]}>
        <mesh position={[0, 1.4, 0]} material={sm("#cfd4da", 0.3, {metalness: 0.6})}>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 8]} />
        </mesh>
        <mesh position={[0.35, 2.4, 0]} material={sm(i ? "#2ecc71" : "#ffffff", 0.7, {side: THREE.DoubleSide})}>
          <planeGeometry args={[0.7, 0.45]} />
        </mesh>
      </group>
    ))}
  </group>
);
/** tribuna (púlpito) */
export const Lectern: React.FC<{p: V3; s?: number; text?: string}> = ({p, s = 1, text = "VOTE PASTEL"}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.55, 0]} geometry={rbox(1.0, 1.1, 0.6, 0.04)} material={sm("#6b4a2a", 0.6)} castShadow />
    <Sign p={[0, 0.65, 0.31]} w={0.9} h={0.3} text={text} bg="#ffd21f" fg="#101018" size={60} />
    <mesh position={[0.2, 1.25, 0.1]} rotation={[0.4, 0, 0]} material={sm("#1d1f27", 0.4)}>
      <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
    </mesh>
    <mesh position={[0.2, 1.4, 0.16]} material={sm("#1d1f27", 0.4)}>
      <sphereGeometry args={[0.04, 10, 8]} />
    </mesh>
  </group>
);

/* ---------- Avenida Paulista (prédios dos dois lados) ---------- */
const PAU = ["#9fb4c8", "#c8b89f", "#7f8fa8", "#d9d4c8", "#a8c8d8", "#b8a8c8"];
export const Paulista: React.FC<{sticky?: number}> = ({sticky = 0}) => {
  const r = rng(5);
  const bl = Array.from({length: 14}, (_, i) => ({h: 8 + r() * 10, w: 3 + r() * 1.5, c: PAU[i % PAU.length]}));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#3a3f4a", 0.9)} receiveShadow>
        <planeGeometry args={[12, 80]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} rotation={[-Math.PI / 2, 0, 0]} position={[sd * 7.5, 0.05, 0]} material={sm("#c9c2b5", 0.9)} receiveShadow>
          <planeGeometry args={[3, 80]} />
        </mesh>
      ))}
      {Array.from({length: 10}, (_, i) => (
        <mesh key={"f" + i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 20 - i * 6]} material={sm("#ffffff", 0.6)}>
          <planeGeometry args={[0.2, 2.5]} />
        </mesh>
      ))}
      {bl.map((b, i) => {
        const sd = i % 2 ? 1 : -1;
        const z = 18 - Math.floor(i / 2) * 6;
        return (
          <group key={i} position={[sd * (9 + b.w / 2), 0, z]}>
            <mesh position={[0, b.h / 2, 0]} geometry={rbox(b.w, b.h, 5, 0.05)} material={sm(b.c, 0.7)} castShadow receiveShadow />
            {Array.from({length: Math.floor(b.h / 1.4)}, (_, k) => (
              <mesh key={k} position={[-sd * (b.w / 2 + 0.01), 1.0 + k * 1.4, 0]} rotation={[0, -sd * Math.PI / 2, 0]} material={sm("#bfe6ff", 0.2, {emissive: "#9fd8ff", emissiveIntensity: 0.2})}>
                <planeGeometry args={[4.4, 0.7]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* poças grudentas de guaraná */}
      {sticky > 0.01 &&
        Array.from({length: 14}, (_, i) => (
          <mesh key={"p" + i} rotation={[-Math.PI / 2, 0, 0]} position={[(r() - 0.5) * 10, 0.02, 10 - i * 2.4]} scale={0.5 + sticky * (0.8 + (i % 3) * 0.4)} material={sm("#3fae2a", 0.15, {transparent: true, opacity: 0.85})}>
            <circleGeometry args={[1, 18]} />
          </mesh>
        ))}
    </group>
  );
};
/** respingo de guaraná (gotas voando) */
export const GuaranaSplash: React.FC<{p: V3; k: number}> = ({p, k}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p}>
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * k * 0.8, 0.3 + Math.sin(k * Math.PI) * 0.6, Math.sin(a) * k * 0.8]} scale={0.06 * (1 - k * 0.5)} material={sm("#3fae2a", 0.2)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- elefante bombeiro (normal, com capacete) ---------- */
export const Elephant: React.FC<{p: V3; rotY?: number; s?: number; t?: number; trunkUp?: number; helmet?: boolean; blink?: number}> = ({p, rotY = 0, s = 1, t = 0, trunkUp = 0, helmet = true, blink = 0}) => {
  const skin = sm("#9aa0aa", 0.8);
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.3, 0]} scale={[0.8, 0.75, 1.1]} material={skin} castShadow receiveShadow>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      {[
        [0.45, 0.6],
        [-0.45, 0.6],
        [0.45, -0.6],
        [-0.45, -0.6],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} material={skin} castShadow>
          <cylinderGeometry args={[0.2, 0.22, 0.9, 12]} />
        </mesh>
      ))}
      <group position={[0, 1.7, 1.05]}>
        <mesh scale={[0.55, 0.55, 0.5]} material={skin} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.6 * sd, 0.05, -0.15]} rotation={[0, sd * 0.4, 0]} scale={[0.4, 0.5, 0.06]} material={sm("#8a909a", 0.8)}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
            <mesh position={[0.22 * sd, 0.12, 0.43]} scale={[0.05, 0.06 * eyeY, 0.03]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh position={[0.18 * sd, -0.25, 0.42]} rotation={[0.6, 0, 0]} material={sm("#f7f5ef", 0.4)}>
              <coneGeometry args={[0.05, 0.3, 8]} />
            </mesh>
          </group>
        ))}
        {/* tromba */}
        {Array.from({length: 6}, (_, i) => {
          const a = -0.5 - i * (0.2 - trunkUp * 0.45);
          let y = -0.1, z = 0.45;
          for (let k = 0; k < i; k++) {
            const aa = -0.5 - k * (0.2 - trunkUp * 0.45);
            y += Math.sin(aa) * 0.18;
            z += Math.cos(aa) * 0.18;
          }
          return (
            <mesh key={i} position={[0, y, z]} rotation={[Math.PI / 2 + a, 0, 0]} material={skin}>
              <cylinderGeometry args={[0.13 - i * 0.012, 0.14 - i * 0.012, 0.2, 10]} />
            </mesh>
          );
        })}
        {helmet && (
          <group position={[0, 0.45, 0]}>
            <mesh scale={[1, 0.6, 1.05]} material={sm("#e8262d", 0.4)}>
              <sphereGeometry args={[0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.2, 1]} material={sm("#c0262d", 0.4)}>
              <ringGeometry args={[0.38, 0.55, 20]} />
            </mesh>
            <mesh position={[0, 0.1, 0.4]} material={sm("#ffd21f", 0.4)}>
              <boxGeometry args={[0.18, 0.16, 0.02]} />
            </mesh>
          </group>
        )}
      </group>
      <mesh position={[0, 1.3, -1.15]} rotation={[0.6 + 0.2 * Math.sin(t * 3), 0, 0]} material={skin}>
        <cylinderGeometry args={[0.03, 0.05, 0.6, 6]} />
      </mesh>
    </group>
  );
};
/** espuma de sabão */
export const SoapFoam: React.FC<{p: V3; n?: number; spread?: number; t: number; k?: number}> = ({p, n = 30, spread = 3, t, k = 1}) => {
  const r = rng(29);
  const pts = Array.from({length: n}, () => [(r() - 0.5) * spread * 2, r() * 0.5, (r() - 0.5) * spread, 0.2 + r() * 0.5, r() * 6] as [number, number, number, number, number]);
  return (
    <group position={p}>
      {pts.map(([x, y, z, rr, ph], i) => (
        <mesh key={i} position={[x, y + 0.05 * Math.sin(t * 2 + ph), z]} scale={rr * k} material={sm("#ffffff", 0.9, {transparent: true, opacity: 0.95})}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
};
