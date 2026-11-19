import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";

/* ===== Objetos do vídeo "Brigadeiro na Lua" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const BLACK = "#15151c";
const SPRINKLE = ["#ff4d6d", "#ffd21f", "#2ecc71", "#3a86ff", "#ff9f1c", "#c86bfa", "#ffffff"];

/** carinha genérica (olhos grandes + boca) no plano z=0, olhando pra +z */
export const Face: React.FC<{p: V3; s?: number; blink?: number; scared?: number; mouth?: number; smile?: number; brow?: number}> = ({p, s = 1, blink = 0, scared = 0, mouth = 0, smile = 0, brow = 0}) => {
  const white = sm("#ffffff", 0.3);
  const black = sm(BLACK, 0.25);
  const eh = Math.max(0.08, 1 - blink) * (1 + scared * 0.25);
  return (
    <group position={p} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.12 * sd, 0.05, 0]}>
          <mesh scale={[0.085 * (1 + scared * 0.2), 0.1 * eh, 0.03]} material={white}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, -0.01, 0.025]} scale={[0.045 * (1 - scared * 0.3), 0.055 * eh * (1 - scared * 0.3), 0.02]} material={black}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh position={[0, 0.14 + brow * 0.03 + scared * 0.03, 0.01]} rotation={[0, 0, (-brow * 0.3 + scared * 0.25) * sd]} material={black}>
            <boxGeometry args={[0.1, 0.022, 0.02]} />
          </mesh>
        </group>
      ))}
      {mouth > 0.05 ? (
        <mesh position={[0, -0.12, 0.01]} scale={[0.07, 0.03 + mouth * 0.06, 0.02]} material={sm("#5a1a20", 0.5)}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ) : (
        <mesh position={[0, -0.11, 0.01]} rotation={[0, 0, Math.PI]} material={black}>
          <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI * (smile > 0 ? 1 : 0.6)]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- lata de leite condensado medrosa ---------- */
const lataTex = () =>
  canvasTex("lata-leite", 512, 200, (c) => {
    c.fillStyle = "#2e6fd8";
    c.fillRect(0, 0, 512, 200);
    c.fillStyle = "#ffffff";
    c.fillRect(0, 60, 512, 80);
    c.fillStyle = "#2e6fd8";
    c.font = "bold 46px sans-serif";
    c.textAlign = "center";
    c.fillText("LEITE CONDENSADO", 256, 116);
  });
export const Lata: React.FC<{p: V3; rotY?: number; s?: number; t?: number; scared?: number; walk?: number; arms?: number; r?: V3}> = ({p, rotY = 0, s = 1, t = 0, scared = 0, walk = 0, arms = 0, r}) => {
  const metal = sm("#d9dde3", 0.25, {metalness: 0.7});
  const shake = scared * 0.02 * Math.sin(t * 50);
  return (
    <group position={[p[0] + shake, p[1], p[2]]} rotation={r ?? [0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={"l" + sd} position={[0.09 * sd, 0.08 + (walk ? 0.04 * Math.max(0, Math.sin(t * 14 + sd * 1.6)) : 0), 0]} material={sm(BLACK, 0.5)} castShadow>
          <capsuleGeometry args={[0.025, 0.12, 4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.38, 0]} material={tm("lata-leite", lataTex(), 0.4)} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.42, 28]} />
      </mesh>
      {[0.17, 0.59].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={metal}>
          <cylinderGeometry args={[0.225, 0.225, 0.03, 28]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={"a" + sd} position={[0.25 * sd, 0.4, 0.02]} rotation={[0, 0, (0.6 + arms * 1.8 + scared * 0.3 * Math.sin(t * 30)) * sd]} material={sm(BLACK, 0.5)}>
          <capsuleGeometry args={[0.02, 0.14, 4, 8]} />
        </mesh>
      ))}
      <Face p={[0, 0.43, 0.215]} s={0.7} scared={scared} mouth={scared > 0.5 ? 0.6 : 0} smile={scared > 0.5 ? 0 : 1} />
    </group>
  );
};

/* ---------- tia geladeira (óculos de vó e colar de pérolas) ---------- */
export const TiaGeladeira: React.FC<{p: V3; rotY?: number; s?: number; open?: number; lock?: number; blink?: number; mouth?: number; wink?: number}> = ({p, rotY = 0, s = 1, open = 0, lock = 0, blink = 0, mouth = 0, wink = 0}) => {
  const body = sm("#f2f4f7", 0.35);
  const handle = sm("#b8bec8", 0.25, {metalness: 0.6});
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.0, 0]} geometry={rbox(1.0, 2.0, 0.8, 0.1)} material={body} castShadow receiveShadow />
      {/* porta de baixo (abre) */}
      <group position={[-0.5, 0.65, 0.41]} rotation={[0, -open * 1.6, 0]}>
        <mesh position={[0.5, 0, 0.02]} geometry={rbox(0.98, 1.2, 0.06, 0.04)} material={body} castShadow />
        <mesh position={[0.88, 0.25, 0.07]} material={handle}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
        </mesh>
      </group>
      {open > 0.05 && (
        <group position={[0, 0.65, 0.2]}>
          <mesh material={sm("#dff3ff", 0.4, {emissive: "#cfeaff", emissiveIntensity: 0.6})}>
            <boxGeometry args={[0.88, 1.1, 0.3]} />
          </mesh>
          {[-0.2, 0.2].map((y) => (
            <mesh key={y} position={[0, y, 0.12]} material={sm("#ffffff", 0.3, {transparent: true, opacity: 0.7})}>
              <boxGeometry args={[0.86, 0.02, 0.2]} />
            </mesh>
          ))}
        </group>
      )}
      {/* porta de cima com o rosto */}
      <mesh position={[0, 1.66, 0.42]} geometry={rbox(0.98, 0.66, 0.06, 0.04)} material={body} castShadow />
      <mesh position={[0.4, 1.55, 0.47]} material={handle}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
      </mesh>
      <Face p={[0, 1.7, 0.46]} s={1.15} blink={blink} mouth={mouth} smile={1} />
      {wink > 0 && (
        <mesh position={[0.14, 1.76, 0.5]} material={sm(BLACK, 0.3)}>
          <boxGeometry args={[0.12, 0.025, 0.02]} />
        </mesh>
      )}
      {/* óculos de vó */}
      <group position={[0, 1.76, 0.5]}>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.14 * sd, 0, 0]} material={sm("#c9a26a", 0.3, {metalness: 0.6})}>
            <torusGeometry args={[0.11, 0.012, 8, 20]} />
          </mesh>
        ))}
        <mesh material={sm("#c9a26a", 0.3, {metalness: 0.6})}>
          <boxGeometry args={[0.07, 0.012, 0.012]} />
        </mesh>
      </group>
      {/* colar de pérolas */}
      {Array.from({length: 13}, (_, i) => {
        const a = -0.9 + (i / 12) * 1.8;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.36, 1.36 - Math.cos(a) * 0.1, 0.47]} material={sm("#fff8ee", 0.2)}>
            <sphereGeometry args={[0.035, 10, 8]} />
          </mesh>
        );
      })}
      {/* cadeado gigante */}
      {lock > 0 && (
        <group position={[0, 0.95, 0.52]} scale={lock}>
          <mesh geometry={rbox(0.5, 0.4, 0.14, 0.04)} material={sm("#e3b33b", 0.3, {metalness: 0.6})} castShadow />
          <mesh position={[0, 0.25, 0]} material={sm("#c9ccd3", 0.25, {metalness: 0.8})}>
            <torusGeometry args={[0.16, 0.035, 8, 20, Math.PI]} />
          </mesh>
          <mesh position={[0, -0.02, 0.075]} material={sm(BLACK, 0.4)}>
            <cylinderGeometry args={[0.035, 0.035, 0.01, 12]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- primo batedeira de óculos escuros ---------- */
export const PrimoBatedeira: React.FC<{p: V3; rotY?: number; s?: number; t?: number; spin?: number; mouth?: number; tilt?: number}> = ({p, rotY = 0, s = 1, t = 0, spin = 1, mouth = 0, tilt = 0}) => {
  const red = sm("#e8414f", 0.35);
  const chrome = sm("#d9dde3", 0.2, {metalness: 0.8});
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.08, 0.1]} geometry={rbox(0.7, 0.16, 0.9, 0.06)} material={red} castShadow />
      <mesh position={[0, 0.55, -0.22]} geometry={rbox(0.36, 0.9, 0.3, 0.1)} material={red} castShadow />
      {/* tigela */}
      <mesh position={[0, 0.32, 0.18]} material={chrome} castShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.32, 24, 1, true]} />
      </mesh>
      {/* cabeça (com o rosto) */}
      <group position={[0, 1.02, 0.02]} rotation={[tilt, 0, 0]}>
        <mesh scale={[0.32, 0.24, 0.5]} material={red} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <Face p={[0, 0.02, 0.4]} s={0.75} mouth={mouth} smile={1} />
        {/* óculos escuros */}
        <group position={[0, 0.07, 0.44]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.09 * sd, 0, 0]} scale={[1, 0.7, 0.3]} material={sm(BLACK, 0.1, {metalness: 0.3})}>
              <sphereGeometry args={[0.08, 14, 10]} />
            </mesh>
          ))}
          <mesh material={sm(BLACK, 0.2)}>
            <boxGeometry args={[0.24, 0.02, 0.02]} />
          </mesh>
        </group>
        {/* batedores girando */}
        {[-0.07, 0.07].map((x) => (
          <group key={x} position={[x, -0.32, 0.18]} rotation={[0, t * 30 * spin, 0]}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} rotation={[0, (k * Math.PI) / 3, 0]} material={chrome}>
                <torusGeometry args={[0.05, 0.007, 6, 14]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};

/* ---------- lula bombeira ---------- */
export const Lula: React.FC<{p: V3; rotY?: number; s?: number; t?: number; blink?: number; mouth?: number; reach?: number; zap?: boolean}> = ({p, rotY = 0, s = 1, t = 0, blink = 0, mouth = 0, reach = 0, zap = false}) => {
  const skin = sm("#ff8a7a", 0.55);
  const spots = sm("#e9604f", 0.6);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* manto */}
      <mesh position={[0, 1.15, -0.05]} rotation={[-0.15, 0, 0]} scale={[0.36, 0.7, 0.34]} material={skin} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={"b" + sd} position={[0.32 * sd, 1.5, -0.1]} rotation={[0, 0, -0.6 * sd]} scale={[0.18, 0.28, 0.05]} material={skin} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      {[[0.15, 1.35], [-0.18, 1.1], [0.08, 0.95], [-0.05, 1.55]].map(([x, y], i) => (
        <mesh key={"s" + i} position={[x, y, 0.27]} scale={[0.05, 0.05, 0.02]} material={spots}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      <Face p={[0, 0.72, 0.3]} s={0.95} blink={blink} mouth={mouth} smile={1} />
      {/* capacete de bombeiro */}
      <group position={[0, 1.78, -0.1]} rotation={[-0.2, 0, 0]}>
        <mesh scale={[1, 0.65, 1]} material={sm("#d62828", 0.35)} castShadow>
          <sphereGeometry args={[0.3, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0, 0.06]} scale={[1, 1, 1.3]} rotation={[Math.PI / 2, 0, 0]} material={sm("#d62828", 0.35)}>
          <cylinderGeometry args={[0.38, 0.38, 0.02, 24]} />
        </mesh>
        <mesh position={[0, 0.1, 0.28]} material={sm("#ffd21f", 0.3, {metalness: 0.4})}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
        </mesh>
      </group>
      {/* 8 tentáculos ondulando */}
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const isReach = i === 0 && reach > 0;
        return (
          <group key={i} position={[Math.sin(a) * 0.2, 0.45, Math.cos(a) * 0.2]} rotation={isReach ? [-1.2 * reach, 0, 0] : [0.35 * Math.cos(a) + 0.1 * Math.sin(t * 3 + i), a, 0.25 * Math.sin(t * 2.5 + i)]}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[0, -0.14 - k * 0.13, 0.03 * k]} rotation={[0.25 * Math.sin(t * 3 + i + k), 0, 0]} material={skin} castShadow>
                <capsuleGeometry args={[0.055 - k * 0.012, 0.12, 4, 8]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {zap && (
        <mesh position={[0, 0.2, 0.55]} material={sm("#fff59a", 0.2, {emissive: "#ffe14d", emissiveIntensity: 2})}>
          <icosahedronGeometry args={[0.12 + 0.04 * Math.sin(t * 40), 0]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- bambolete (bambolê de gelatina com olhos) e o pudim ---------- */
export const Bambolete: React.FC<{p: V3; s?: number; t?: number; spin?: number; pudim?: number}> = ({p, s = 1, t = 0, spin = 0, pudim = 0}) => {
  if (pudim > 0.5) return <Pudim p={p} s={s * 0.9} t={t} />;
  const wob = 1 + 0.06 * Math.sin(t * 9);
  return (
    <group position={p} scale={[s * wob, s / wob, s]}>
      <group rotation={[Math.PI / 2 - 0.3, 0, t * 6 * spin]}>
        <mesh material={sm("#3ee0a0", 0.15, {transparent: true, opacity: 0.8, emissive: "#1fa070", emissiveIntensity: 0.3})} castShadow>
          <torusGeometry args={[0.55, 0.16, 16, 40]} />
        </mesh>
      </group>
      <Face p={[0, 0.0, 0.6]} s={1.1} smile={1} />
    </group>
  );
};
export const Pudim: React.FC<{p: V3; s?: number; t?: number; face?: boolean}> = ({p, s = 1, t = 0, face = true}) => {
  const wob = 1 + 0.04 * Math.sin(t * 8);
  return (
    <group position={p} scale={[s * wob, s / wob, s]}>
      <mesh position={[0, 0.3, 0]} material={sm("#f6d27a", 0.35)} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.6, 28]} />
      </mesh>
      <mesh position={[0, 0.63, 0]} material={sm("#8a4a14", 0.2)}>
        <cylinderGeometry args={[0.46, 0.46, 0.08, 28]} />
      </mesh>
      {Array.from({length: 6}, (_, i) => (
        <mesh key={i} position={[Math.sin(i) * 0.4, 0.45, Math.cos(i) * 0.42]} scale={[0.06, 0.18, 0.06]} material={sm("#8a4a14", 0.2)}>
          <sphereGeometry args={[1, 8, 8]} />
        </mesh>
      ))}
      {face && <Face p={[0, 0.32, 0.53]} s={0.9} smile={1} />}
    </group>
  );
};

/* ---------- panela de brigadeiro que morde ---------- */
export const BrigMonster: React.FC<{p: V3; s?: number; t?: number; bite?: number}> = ({p, s = 1, t = 0, bite = 0}) => {
  const choco = sm("#4a2414", 0.35);
  const open = 0.3 + 0.5 * Math.abs(Math.sin(t * 6)) * bite;
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.3, 0]} material={sm("#c9ccd3", 0.25, {metalness: 0.7})} castShadow>
        <cylinderGeometry args={[0.55, 0.5, 0.6, 28]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.68 * sd, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={sm(BLACK, 0.4)}>
          <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        </mesh>
      ))}
      {/* mandíbula de cima (domo de brigadeiro) */}
      <group position={[0, 0.6, -0.4]} rotation={[-open, 0, 0]}>
        <mesh position={[0, 0, 0.4]} scale={[0.54, 0.35, 0.54]} material={choco} castShadow>
          <sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {Array.from({length: 7}, (_, i) => (
          <mesh key={i} position={[-0.36 + i * 0.12, -0.03, 0.88]} rotation={[Math.PI, 0, 0]} material={sm("#ffffff", 0.3)}>
            <coneGeometry args={[0.04, 0.1, 6]} />
          </mesh>
        ))}
        <Face p={[0, 0.2, 0.86]} s={0.8} brow={-1} />
        {Array.from({length: 18}, (_, i) => (
          <mesh key={"g" + i} position={[Math.sin(i * 2.3) * 0.38, 0.22 + (i % 3) * 0.04, 0.4 + Math.cos(i * 1.7) * 0.36]} rotation={[i, i * 2, 0]} material={sm(SPRINKLE[i % SPRINKLE.length], 0.5)}>
            <capsuleGeometry args={[0.012, 0.04, 3, 6]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#7a1a20", 0.6)}>
        <circleGeometry args={[0.5, 24]} />
      </mesh>
    </group>
  );
};

/* ---------- panela da Lua (só sai granulado) ---------- */
export const Panela: React.FC<{p: V3; s?: number; t?: number; spit?: number}> = ({p, s = 1, t = 0, spit = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.22, 0]} material={sm("#c9ccd3", 0.25, {metalness: 0.7})} castShadow>
      <cylinderGeometry args={[0.42, 0.38, 0.44, 28]} />
    </mesh>
    <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a2a14", 0.5)}>
      <circleGeometry args={[0.39, 24]} />
    </mesh>
    <mesh position={[0.62, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} material={sm(BLACK, 0.4)}>
      <capsuleGeometry args={[0.035, 0.36, 4, 8]} />
    </mesh>
    {spit > 0 &&
      Array.from({length: 40}, (_, i) => {
        const q = (t * 1.4 + i / 40) % 1;
        const a = i * 2.39;
        return (
          <mesh key={i} position={[Math.cos(a) * q * 0.9, 0.45 + Math.sin(q * Math.PI) * 1.1, Math.sin(a) * q * 0.9]} rotation={[i, q * 8, 0]} material={sm(SPRINKLE[i % SPRINKLE.length], 0.5)}>
            <capsuleGeometry args={[0.018, 0.06, 3, 6]} />
          </mesh>
        );
      })}
  </group>
);

/* ---------- granulados soltos no chão / num monte ---------- */
export const SprinklePile: React.FC<{p: V3; n?: number; r?: number}> = ({p, n = 60, r = 0.6}) => (
  <group position={p}>
    {Array.from({length: n}, (_, i) => {
      const a = i * 2.39;
      const d = Math.sqrt(i / n) * r;
      return (
        <mesh key={i} position={[Math.cos(a) * d, 0.02 + (1 - d / r) * 0.15, Math.sin(a) * d]} rotation={[i, i * 1.7, 0]} material={sm(SPRINKLE[i % SPRINKLE.length], 0.5)}>
          <capsuleGeometry args={[0.02, 0.07, 3, 6]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- almofadinha com um granulado só ---------- */
export const Cushion: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh scale={[1, 0.35, 1]} material={sm("#8e44ad", 0.7)} castShadow>
      <sphereGeometry args={[0.2, 18, 12]} />
    </mesh>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
      <mesh key={i} position={[0.17 * x, 0, 0.17 * z]} material={sm("#ffd21f", 0.4)}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>
    ))}
    <mesh position={[0, 0.08, 0]} rotation={[0, 0.5, Math.PI / 2]} material={sm("#ff4d6d", 0.4, {emissive: "#ff4d6d", emissiveIntensity: 0.3})}>
      <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
    </mesh>
  </group>
);

/* ---------- carrinho de granulado (vai atrás do patinete) ---------- */
export const SprinkleCart: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.45, 0]} geometry={rbox(0.7, 0.4, 0.5, 0.04)} material={sm("#ff9fd0", 0.5)} castShadow />
    <mesh position={[0, 0.66, 0]} geometry={rbox(0.66, 0.06, 0.46, 0.02)} material={sm("#ffffff", 0.5)} />
    <SprinklePile p={[0, 0.68, 0]} n={40} r={0.25} />
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.25 * sd, 0.15, 0.27]} rotation={[0, 0, Math.PI / 2]} material={sm(BLACK, 0.5)}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 14]} />
      </mesh>
    ))}
  </group>
);

/* ---------- tobogã gigante (torre + tubo em zigue-zague subindo até as nuvens) ---------- */
export const Toboga: React.FC<{p: V3; h?: number}> = ({p, h = 30}) => {
  const tube = sm("#3a86ff", 0.35);
  const tube2 = sm("#ffd21f", 0.35, {wireframe: true});
  const pts = Array.from({length: 26}, (_, i) => new THREE.Vector3(Math.sin(i * 0.9) * 2.0, i * (h / 25), Math.cos(i * 0.9) * 1.2));
  const curve = new THREE.CatmullRomCurve3(pts);
  return (
    <group position={p}>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={sx + "" + sz} position={[0.9 * sx, h / 2, 0.9 * sz - 0.6]} material={sm("#c9ccd3", 0.4, {metalness: 0.4})}>
            <boxGeometry args={[0.15, h, 0.15]} />
          </mesh>
        )),
      )}
      <mesh material={tube} castShadow>
        <tubeGeometry args={[curve, 220, 0.45, 12, false]} />
      </mesh>
      <mesh material={tube2}>
        <tubeGeometry args={[curve, 220, 0.47, 6, false]} />
      </mesh>
    </group>
  );
};
/** escada com a fila de bonequinhos (seguidores) */
export const StairQueue: React.FC<{p: V3; n?: number; t?: number; gap?: number}> = ({p, n = 14, t = 0, gap = 6}) => (
  <group position={p}>
    {Array.from({length: n}, (_, i) => {
      const y = i * 0.32;
      const z = -i * 0.38;
      return (
        <group key={i} position={[0, y, z]}>
          <mesh position={[0, -0.05, 0]} material={sm("#c9ccd3", 0.5)} receiveShadow>
            <boxGeometry args={[1.0, 0.1, 0.4]} />
          </mesh>
          {i !== gap && (
            <group position={[0, 0, 0]} scale={0.32}>
              <mesh position={[0, 0.9, 0]} material={sm(SPRINKLE[(i * 3) % 6], 0.6)} castShadow>
                <capsuleGeometry args={[0.28, 0.7, 4, 10]} />
              </mesh>
              <mesh position={[0, 1.75, 0]} material={sm(["#f1c08f", "#c68a5a", "#8d5a3b", "#e0b08a"][i % 4], 0.6)} castShadow>
                <sphereGeometry args={[0.3, 14, 12]} />
              </mesh>
              <mesh position={[0, 1.75 + 0.03 * Math.sin(t * 4 + i), 0.27]} material={sm(BLACK, 0.3)}>
                <boxGeometry args={[0.2, 0.05, 0.02]} />
              </mesh>
            </group>
          )}
        </group>
      );
    })}
  </group>
);

/* ---------- chocolate de touca tomando banho de pudim ---------- */
export const ChocoBath: React.FC<{p: V3; s?: number; t?: number}> = ({p, s = 1, t = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.35, 0]} geometry={rbox(1.8, 0.7, 0.9, 0.3)} material={sm("#ffffff", 0.3)} castShadow />
    <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#f6d27a", 0.3)}>
      <planeGeometry args={[1.6, 0.72]} />
    </mesh>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[-0.6 + i * 0.2, 0.68 + 0.02 * Math.sin(t * 3 + i), 0.15 * Math.sin(i * 2)]} material={sm("#8a4a14", 0.2)}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
    ))}
    <group position={[0.15, 0.95, 0]} rotation={[0, 0, -0.5]}>
      <mesh geometry={rbox(0.36, 0.6, 0.1, 0.03)} material={sm("#4a2414", 0.4)} castShadow />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <mesh key={r + "" + c} position={[-0.08 + c * 0.16, -0.18 + r * 0.18, 0.052]} geometry={rbox(0.13, 0.15, 0.02, 0.01)} material={sm("#5a2e1a", 0.4)} />
        )),
      )}
      <Face p={[0, 0.05, 0.07]} s={0.6} blink={1} smile={1} />
      <group position={[0, 0.33, 0]}>
        <mesh scale={[1, 0.6, 0.7]} material={sm("#ff9fd0", 0.8)}>
          <sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} material={sm("#ff9fd0", 0.8)}>
          <torusGeometry args={[0.2, 0.03, 8, 20]} />
        </mesh>
      </group>
    </group>
  </group>
);

/* ---------- lugares ---------- */
/** chão lunar cinza-lilás com crateras, a Terra no céu */
export const LunaGround: React.FC<{t?: number}> = ({t = 0}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c7c2d6", 0.95)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
    {[[-3, -4, 1.4], [4, -6, 2.0], [-6, -10, 2.6], [2.5, -1.5, 0.7], [7, -14, 3], [-1.5, 3.5, 0.6]].map(([x, z, r], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sm("#a8a2bd", 0.95)}>
          <circleGeometry args={[r, 28]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={sm("#d8d3e6", 0.95)}>
          <torusGeometry args={[r, r * 0.12, 6, 28]} />
        </mesh>
      </group>
    ))}
    <group position={[-9, 10, -30]} rotation={[0.3, t * 0.1, 0.2]}>
      <mesh material={sm("#2f8fe0", 0.5, {emissive: "#123a66", emissiveIntensity: 0.6})}>
        <sphereGeometry args={[3, 32, 24]} />
      </mesh>
      {[[1, 1, 1.4], [-1.2, -0.4, 1.0], [0.4, -1.6, 0.8]].map(([x, y, r], i) => (
        <mesh key={i} position={[x * 1.6, y * 1.4, 2.2]} scale={[r, r * 0.7, 0.5]} material={sm("#5fbf4a", 0.6)}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
    </group>
    {Array.from({length: 40}, (_, i) => (
      <mesh key={"e" + i} position={[Math.sin(i * 7.1) * 30, 6 + Math.abs(Math.cos(i * 3.3)) * 18, -25 - (i % 5) * 3]}>
        <sphereGeometry args={[0.08 + (i % 3) * 0.05, 6, 4]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    ))}
  </group>
);
/** dimensão mole: chão de gelatina que treme, bolhas e montinhos */
export const JellyWorld: React.FC<{t: number; pudim?: number}> = ({t, pudim = 0}) => {
  const groundC = pudim > 0.5 ? "#f6d27a" : "#ff8fc8";
  const blobC = pudim > 0.5 ? "#8a4a14" : "#3ee0c0";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03 * Math.sin(t * 6), 0]} material={sm(groundC, 0.2, {emissive: groundC, emissiveIntensity: 0.15})} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
      {Array.from({length: 12}, (_, i) => {
        const x = Math.sin(i * 2.7) * 7;
        const z = -3 - (i % 4) * 3.5;
        const w = 1 + 0.12 * Math.sin(t * 7 + i);
        return (
          <mesh key={i} position={[x, 0.6 * w, z]} scale={[1.1 / w, 1.2 * w, 1.1 / w]} material={sm(blobC, 0.15, {transparent: true, opacity: 0.85})} castShadow>
            <sphereGeometry args={[0.9, 20, 14]} />
          </mesh>
        );
      })}
      {Array.from({length: 16}, (_, i) => (
        <mesh key={"b" + i} position={[Math.sin(i * 5.1) * 6, 1 + ((t * 0.6 + i * 0.37) % 1) * 7, -2 - (i % 5) * 2.5]}>
          <sphereGeometry args={[0.15 + (i % 3) * 0.08, 12, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
};
/** rasgo no céu (portal) */
export const SkyRip: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => (
  <group position={p} scale={[k, k * 1.6, 1]}>
    <mesh rotation={[0, 0, 0.3 + 0.05 * Math.sin(t * 6)]}>
      <circleGeometry args={[1.2, 7]} />
      <meshBasicMaterial color="#ff5fb0" toneMapped={false} />
    </mesh>
    <mesh position={[0, 0, 0.01]} rotation={[0, 0, -0.2]}>
      <circleGeometry args={[0.85, 6]} />
      <meshBasicMaterial color="#3ee0c0" toneMapped={false} />
    </mesh>
  </group>
);
/** parque aquático: piscina e chão */
export const WaterPark: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#f2e3c9", 0.9)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, 0.02 + 0.01 * Math.sin(t * 3), -1.5]} material={sm("#3fc3ee", 0.15, {emissive: "#1f8fc0", emissiveIntensity: 0.25})}>
      <planeGeometry args={[5, 3.5]} />
    </mesh>
    {[[-4, -3], [5.5, -4], [-5, 1.5]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 1.2, 0]} material={sm("#8a6a4a", 0.7)}>
          <cylinderGeometry args={[0.04, 0.05, 2.4, 8]} />
        </mesh>
        <mesh position={[0, 2.35, 0]} rotation={[0, i, 0]} material={sm(["#ff4d6d", "#ffd21f", "#2ecc71"][i], 0.6, {side: THREE.DoubleSide})}>
          <coneGeometry args={[1.0, 0.45, 8, 1, true]} />
        </mesh>
      </group>
    ))}
  </group>
);
