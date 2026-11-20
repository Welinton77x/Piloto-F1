import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";
import {Face} from "./Sets28";

/* ===== Objetos do vídeo "Pastel na Antártida" ===== */

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
const GOLD = "#e8a73a";

/* ---------- garrafa de óleo medrosa ---------- */
const oleoTex = () =>
  canvasTex("rotulo-oleo", 256, 200, (c) => {
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 256, 200);
    c.fillStyle = "#e8262d";
    c.fillRect(0, 70, 256, 64);
    c.fillStyle = "#ffffff";
    c.font = "bold 50px sans-serif";
    c.textAlign = "center";
    c.fillText("ÓLEO", 128, 120);
  });
export const Oleo: React.FC<{p: V3; rotY?: number; s?: number; t?: number; scared?: number; walk?: number; arms?: number; r?: V3}> = ({p, rotY = 0, s = 1, t = 0, scared = 0, walk = 0, arms = 0, r}) => {
  const shake = scared * 0.02 * Math.sin(t * 50);
  const glass = sm("#f5c542", 0.15, {transparent: true, opacity: 0.85, emissive: "#a07010", emissiveIntensity: 0.15});
  return (
    <group position={[p[0] + shake, p[1], p[2]]} rotation={r ?? [0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={"l" + sd} position={[0.07 * sd, 0.07 + (walk ? 0.04 * Math.max(0, Math.sin(t * 14 + sd * 1.6)) : 0), 0]} material={sm(BLACK, 0.5)} castShadow>
          <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]} material={glass} castShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.5, 22]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={glass}>
        <cylinderGeometry args={[0.06, 0.15, 0.14, 18]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={sm("#e8262d", 0.4)}>
        <cylinderGeometry args={[0.065, 0.065, 0.07, 14]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={tm("rotulo-oleo", oleoTex(), 0.5)}>
        <cylinderGeometry args={[0.163, 0.17, 0.2, 22, 1, true]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={"a" + sd} position={[0.18 * sd, 0.45, 0.02]} rotation={[0, 0, (0.6 + arms * 1.8 + scared * 0.3 * Math.sin(t * 30)) * sd]} material={sm(BLACK, 0.5)}>
          <capsuleGeometry args={[0.018, 0.12, 4, 8]} />
        </mesh>
      ))}
      <Face p={[0, 0.55, 0.16]} s={0.55} scared={scared} mouth={scared > 0.5 ? 0.6 : 0} smile={scared > 0.5 ? 0 : 1} />
    </group>
  );
};

/* ---------- vó fritadeira (touca de cozinheira e óculos de vó) ---------- */
export const VoFritadeira: React.FC<{p: V3; rotY?: number; s?: number; t?: number; boil?: number; mouth?: number; basket?: number; wink?: number; phone?: number}> = ({p, rotY = 0, s = 1, t = 0, boil = 0, mouth = 0, basket = 0, wink = 0, phone = 0}) => {
  const steel = sm("#d9dde3", 0.25, {metalness: 0.7});
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.5, 0]} geometry={rbox(1.1, 1.0, 0.8, 0.08)} material={steel} castShadow receiveShadow />
      <mesh position={[0, 1.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#d8a020", 0.15, {emissive: "#a06000", emissiveIntensity: 0.25 + boil * 0.4})}>
        <planeGeometry args={[0.9, 0.6]} />
      </mesh>
      {boil > 0 &&
        Array.from({length: 14}, (_, i) => {
          const q = (t * 1.5 + i / 14) % 1;
          return (
            <mesh key={i} position={[-0.38 + (i % 7) * 0.13, 1.02 + q * 0.1 * boil, -0.2 + Math.floor(i / 7) * 0.3]} scale={0.05 * (1 - q)}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#fff3b0" transparent opacity={0.7} />
            </mesh>
          );
        })}
      {/* cesta de fritura */}
      <group position={[0.15, 1.0 + basket * 0.35, 0.05]}>
        <mesh position={[0, 0.05, 0]} material={sm("#b8bec8", 0.3, {metalness: 0.6, wireframe: true})}>
          <boxGeometry args={[0.5, 0.18, 0.38]} />
        </mesh>
        <mesh position={[0.5, 0.12, 0]} rotation={[0, 0, Math.PI / 2 - 0.3]} material={sm(BLACK, 0.4)}>
          <capsuleGeometry args={[0.03, 0.4, 4, 8]} />
        </mesh>
      </group>
      {/* rosto na frente */}
      <Face p={[0, 0.55, 0.41]} s={1.25} mouth={mouth} smile={1} blink={wink > 0 ? 0 : 0} />
      {wink > 0 && (
        <mesh position={[0.15, 0.62, 0.45]} material={sm(BLACK, 0.3)}>
          <boxGeometry args={[0.13, 0.03, 0.02]} />
        </mesh>
      )}
      <group position={[0, 0.62, 0.45]}>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.15 * sd, 0, 0]} material={sm("#c9a26a", 0.3, {metalness: 0.6})}>
            <torusGeometry args={[0.12, 0.013, 8, 20]} />
          </mesh>
        ))}
        <mesh material={sm("#c9a26a", 0.3, {metalness: 0.6})}>
          <boxGeometry args={[0.07, 0.013, 0.013]} />
        </mesh>
      </group>
      {/* bochechas */}
      {[-1, 1].map((sd) => (
        <mesh key={"b" + sd} position={[0.3 * sd, 0.4, 0.405]} scale={[1, 0.6, 0.2]} material={sm("#ff9fb0", 0.6)}>
          <sphereGeometry args={[0.07, 12, 8]} />
        </mesh>
      ))}
      {/* touca de cozinheira (presa atrás, em cima) */}
      <group position={[-0.25, 1.05, -0.3]}>
        <mesh position={[0, 0.1, 0]} material={sm("#ffffff", 0.9)}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 18]} />
        </mesh>
        {[[-0.1, 0.32, 0], [0.1, 0.32, 0], [0, 0.4, 0.05], [0, 0.34, -0.1]].map((q, i) => (
          <mesh key={i} position={q as V3} material={sm("#ffffff", 0.9)} castShadow>
            <sphereGeometry args={[0.15, 14, 10]} />
          </mesh>
        ))}
      </group>
      {/* pés */}
      {[[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]].map(([x, z], i) => (
        <mesh key={"p" + i} position={[x, 0.03, z]} material={sm(BLACK, 0.5)}>
          <cylinderGeometry args={[0.05, 0.06, 0.06, 10]} />
        </mesh>
      ))}
      {phone > 0 && (
        <group position={[0.1, 1.05 + (1 - phone) * 0.8, 0]} rotation={[0.3 + (1 - phone) * 3, 0.4, 0]}>
          <mesh geometry={rbox(0.14, 0.26, 0.025, 0.012)} material={sm("#1d1f27", 0.3)} />
          <mesh position={[0, 0, 0.014]} material={sm("#5fb8ef", 0.3, {emissive: "#3a86ff", emissiveIntensity: 0.6})}>
            <planeGeometry args={[0.12, 0.22]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- patins (embaixo do pinguim) ---------- */
export const Skates: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.1 * sd, 0, 0]}>
        <mesh position={[0, 0.06, 0]} geometry={rbox(0.12, 0.08, 0.26, 0.03)} material={sm("#ffffff", 0.5)} />
        <mesh position={[0, 0.01, 0]} material={sm("#c9ccd3", 0.2, {metalness: 0.8})}>
          <boxGeometry args={[0.015, 0.03, 0.3]} />
        </mesh>
      </group>
    ))}
  </group>
);

/* ---------- trenó de madeira ---------- */
export const Treno: React.FC<{p: V3; rotY?: number; s?: number; children?: React.ReactNode}> = ({p, rotY = 0, s = 1, children}) => {
  const wood = sm("#b5652e", 0.6);
  const rail = sm("#c9ccd3", 0.25, {metalness: 0.7});
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.45 * sd, 0, 0]}>
          <mesh position={[0, 0.05, 0]} material={rail}>
            <boxGeometry args={[0.05, 0.05, 1.8]} />
          </mesh>
          <mesh position={[0, 0.2, 0.95]} rotation={[0, Math.PI / 2, 0]} material={rail}>
            <torusGeometry args={[0.15, 0.025, 6, 14, Math.PI]} />
          </mesh>
          {[-0.6, 0, 0.6].map((z) => (
            <mesh key={z} position={[0, 0.17, z]} material={rail}>
              <boxGeometry args={[0.04, 0.24, 0.04]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.32, 0]} geometry={rbox(1.05, 0.08, 1.6, 0.03)} material={wood} castShadow receiveShadow />
      <mesh position={[0, 0.55, -0.78]} geometry={rbox(1.05, 0.45, 0.07, 0.03)} material={wood} castShadow />
      {children}
    </group>
  );
};

/* ---------- foca garçom (gravata borboleta e bandeja) ---------- */
export const Foca: React.FC<{p: V3; rotY?: number; s?: number; t?: number; mouth?: number; tray?: boolean; bill?: boolean; blink?: number}> = ({p, rotY = 0, s = 1, t = 0, mouth = 0, tray = true, bill = false, blink = 0}) => {
  const skin = sm("#8a96a8", 0.5);
  const belly = sm("#c9d1dc", 0.6);
  const sway = 0.06 * Math.sin(t * 2);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.45, -0.1]} rotation={[0.25, 0, 0]} scale={[0.42, 0.55, 0.5]} material={skin} castShadow>
        <sphereGeometry args={[1, 22, 16]} />
      </mesh>
      <mesh position={[0, 0.42, 0.18]} rotation={[0.25, 0, 0]} scale={[0.3, 0.42, 0.2]} material={belly}>
        <sphereGeometry args={[1, 18, 12]} />
      </mesh>
      {/* rabo */}
      <mesh position={[0, 0.08, -0.62]} rotation={[0.2, 0, 0]} scale={[0.3, 0.06, 0.18]} material={skin} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      {/* cabeça */}
      <group position={[0, 1.08 + sway * 0.3, 0.06]} rotation={[0, 0, sway]}>
        <mesh scale={[0.32, 0.3, 0.3]} material={skin} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        <mesh position={[0, -0.06, 0.24]} scale={[0.16, 0.11, 0.1]} material={belly}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, -0.01, 0.33]} scale={[0.05, 0.035, 0.03]} material={sm(BLACK, 0.3)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        {[-1, 1].map((sd) =>
          [0, 1, 2].map((k) => (
            <mesh key={sd + "" + k} position={[0.12 * sd, -0.06 - k * 0.025, 0.31]} rotation={[0, 0, (0.15 - k * 0.15) * sd]} material={sm("#ffffff", 0.4)}>
              <boxGeometry args={[0.14, 0.006, 0.006]} />
            </mesh>
          )),
        )}
        {[-1, 1].map((sd) => (
          <mesh key={"e" + sd} position={[0.12 * sd, 0.08, 0.25]} scale={[0.055, 0.065 * Math.max(0.1, 1 - blink), 0.04]} material={sm(BLACK, 0.15)}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        ))}
        {mouth > 0.05 && (
          <mesh position={[0, -0.13, 0.27]} scale={[0.05, 0.02 + mouth * 0.04, 0.02]} material={sm("#5a1a20", 0.5)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        )}
      </group>
      {/* gravata borboleta */}
      <group position={[0, 0.86, 0.3]}>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.06 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={sm("#d8262d", 0.5)}>
            <coneGeometry args={[0.055, 0.1, 4]} />
          </mesh>
        ))}
        <mesh material={sm("#a01a20", 0.5)}>
          <sphereGeometry args={[0.03, 8, 6]} />
        </mesh>
      </group>
      {/* nadadeiras + bandeja */}
      <mesh position={[-0.36, 0.62, 0.15]} rotation={[0.3, 0, -0.9]} scale={[0.07, 0.2, 0.12]} material={skin} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <mesh position={[0.4, 0.82, 0.22]} rotation={[-0.8, 0, 0.9]} scale={[0.07, 0.2, 0.12]} material={skin} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      {tray && (
        <group position={[0.52, 0.98, 0.3]}>
          <mesh material={sm("#c9ccd3", 0.2, {metalness: 0.8})}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
          </mesh>
          {bill && (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.3]} material={sm("#ffffff", 0.8)}>
              <planeGeometry args={[0.16, 0.22]} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};

/* ---------- peixinho no aquário redondo ---------- */
export const FishBowl: React.FC<{p: V3; s?: number; t?: number; sad?: number}> = ({p, s = 1, t = 0, sad = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.2, 0]} material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.35, depthWrite: false})}>
      <sphereGeometry args={[0.22, 24, 18]} />
    </mesh>
    <mesh position={[0, 0.17, 0]} material={sm("#5fb8ef", 0.1, {transparent: true, opacity: 0.35, depthWrite: false})}>
      <sphereGeometry args={[0.2, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65]} />
    </mesh>
    <group position={[0.04 * Math.sin(t * 2), 0.18, 0.02]} rotation={[0, 0.3 * Math.sin(t * 2), 0]}>
      <mesh scale={[0.08, 0.06, 0.04]} material={sm("#ff8a1f", 0.4)}>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
      <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#ff8a1f", 0.4)}>
        <coneGeometry args={[0.045, 0.06, 6]} />
      </mesh>
      {/* olhos de cachorro pidão */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.045, 0.015, 0.035 * sd]} scale={1 + sad * 0.4} material={sm(BLACK, 0.1)}>
          <sphereGeometry args={[0.014, 8, 6]} />
        </mesh>
      ))}
    </group>
  </group>
);

/* ---------- pastel (normal ou "de vento": estufado e oco) ---------- */
export const Pastel: React.FC<{p: V3; r?: V3; s?: number; puff?: number}> = ({p, r = [0, 0, 0], s = 1, puff = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1, 0.25 + puff * 0.55, 0.7]} material={sm(GOLD, 0.5)} castShadow>
      <sphereGeometry args={[0.25, 22, 14, 0, Math.PI]} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} material={sm("#c9822a", 0.5)}>
      <torusGeometry args={[0.25, 0.02, 6, 22, Math.PI]} />
    </mesh>
    {Array.from({length: 9}, (_, i) => (
      <mesh key={i} position={[-0.22 + i * 0.055, 0.0, 0.0]} rotation={[0, 0, 0]} material={sm("#b8701f", 0.5)}>
        <boxGeometry args={[0.012, 0.03, 0.05]} />
      </mesh>
    ))}
  </group>
);

/* ---------- crocotó (bolinha crocante com olhos) ---------- */
export const Crocoto: React.FC<{p: V3; s?: number; t?: number; squish?: number}> = ({p, s = 1, t = 0, squish = 0}) => {
  if (squish >= 1) return null;
  const sq = 1 - squish * 0.7;
  return (
    <group position={p} scale={[s * (1 + squish * 0.5), s * sq, s * (1 + squish * 0.5)]}>
      <mesh position={[0, 0.35, 0]} material={sm("#e8a73a", 0.7)} castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
      </mesh>
      {Array.from({length: 14}, (_, i) => {
        const a = i * 2.39, b = Math.acos(1 - (2 * (i + 0.5)) / 14);
        return (
          <mesh key={i} position={[Math.sin(b) * Math.cos(a) * 0.35, 0.35 + Math.cos(b) * 0.35, Math.sin(b) * Math.sin(a) * 0.35]} rotation={[a, b, 0]} material={sm("#c9822a", 0.7)}>
            <boxGeometry args={[0.08, 0.04, 0.08]} />
          </mesh>
        );
      })}
      <Face p={[0, 0.4, 0.33]} s={0.8} smile={1} blink={squish > 0.3 ? 1 : 0} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.12 * sd, 0.04 + 0.03 * Math.abs(Math.sin(t * 10 + sd)), 0]} material={sm(BLACK, 0.5)}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- monte de farofa e chuva de farofa ---------- */
export const FarofaPile: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.15, 0]} scale={[1, 0.45, 1]} material={sm("#e6c27a", 0.95)} castShadow receiveShadow>
      <sphereGeometry args={[0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    {Array.from({length: 30}, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 2.4) * 0.5 * Math.sqrt(i / 30), 0.05 + 0.2 * (1 - i / 30), Math.cos(i * 2.4) * 0.5 * Math.sqrt(i / 30)]} material={sm(i % 3 ? "#d9a85a" : "#a8702a", 0.9)}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
      </mesh>
    ))}
  </group>
);
export const FarofaRain: React.FC<{t: number; c?: V3; n?: number}> = ({t, c = [0, 0, 0], n = 70}) => (
  <group position={c}>
    {Array.from({length: n}, (_, i) => {
      const x = Math.sin(i * 12.9898) * 4;
      const z = Math.cos(i * 4.1) * 2 - 1;
      const y = 6 - ((t * (2 + (i % 5) * 0.4) + i * 0.37) % 6);
      return (
        <mesh key={i} position={[x, y, z]} rotation={[t * 4 + i, i, 0]} material={sm(i % 3 ? "#d9a85a" : "#a8702a", 0.9)}>
          <boxGeometry args={[0.05, 0.04, 0.05]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- queijo e presunto de patins ---------- */
export const QueijoPresunto: React.FC<{p: V3; t?: number}> = ({p, t = 0}) => {
  const glide = 0.4 * Math.sin(t * 2);
  return (
    <group position={[p[0] + glide, p[1], p[2]]} rotation={[0, 0, -glide * 0.2]}>
      {/* queijo */}
      <group position={[-0.35, 0, 0]}>
        <mesh position={[0, 0.45, 0]} rotation={[0, 0.3, 0]} material={sm("#ffd21f", 0.5)} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.5, 3]} />
        </mesh>
        {[[0.08, 0.5, 0.2], [-0.1, 0.35, 0.18], [0.15, 0.3, 0.12]].map((q, i) => (
          <mesh key={i} position={q as V3} material={sm("#e8b81a", 0.6)}>
            <sphereGeometry args={[0.05, 8, 6]} />
          </mesh>
        ))}
        <Face p={[0, 0.5, 0.2]} s={0.55} smile={1} />
        <Skates p={[0, 0, 0]} s={0.8} />
      </group>
      {/* presunto */}
      <group position={[0.35, 0, 0]}>
        <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#f2a0a8", 0.5)} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
        </mesh>
        <mesh position={[0, 0.45, 0.065]} material={sm("#ffffff", 0.6)}>
          <torusGeometry args={[0.25, 0.015, 6, 22]} />
        </mesh>
        <Face p={[0, 0.48, 0.07]} s={0.55} smile={1} />
        <Skates p={[0, 0, 0]} s={0.8} />
      </group>
      {/* de mãos dadas */}
      <mesh position={[0, 0.45, 0.05]} rotation={[0, 0, Math.PI / 2]} material={sm(BLACK, 0.5)}>
        <capsuleGeometry args={[0.02, 0.2, 4, 8]} />
      </mesh>
    </group>
  );
};

/* ---------- lugares ---------- */
/** Antártida: gelo, icebergs ao fundo */
export const Antarctica: React.FC<{t?: number; hole?: number; melt?: number}> = ({t = 0, hole = 0, melt = 0}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#eaf6ff", 0.6)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
    {melt > 0 && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sm("#7fd0ff", 0.1, {transparent: true, opacity: 0.6 * melt})}>
        <circleGeometry args={[1.2 + melt * 1.4, 32]} />
      </mesh>
    )}
    {hole > 0 && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[hole * 2.2, 32]} />
        <meshBasicMaterial color="#0b1530" />
      </mesh>
    )}
    {[[-6, -12, 3], [5, -15, 4], [-12, -20, 5], [12, -22, 6], [0, -26, 5]].map(([x, z, s], i) => (
      <mesh key={i} position={[x, s * 0.4, z]} rotation={[0, i, 0]} scale={[s, s * 0.8, s * 0.7]} material={sm(i % 2 ? "#cfeaff" : "#e6f5ff", 0.5)} castShadow>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    ))}
    {Array.from({length: 20}, (_, i) => (
      <mesh key={"n" + i} position={[Math.sin(i * 7.1) * 8, 6 - ((t * 0.6 + i * 0.31) % 6), -3 - (i % 5) * 1.5]}>
        <sphereGeometry args={[0.05, 6, 4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    ))}
  </group>
);
/** dimensão crocante: chão de casquinha de pastel com bolhas douradas */
const crustTex = () =>
  canvasTex("casquinha", 512, 512, (c, r) => {
    c.fillStyle = "#e8a73a";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 220; i++) {
      c.fillStyle = r() > 0.5 ? "rgba(255,220,140,0.6)" : "rgba(170,100,30,0.45)";
      c.beginPath();
      c.ellipse(r() * 512, r() * 512, 6 + r() * 20, 5 + r() * 14, r() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }, [6, 6]);
export const CrunchWorld: React.FC<{t: number; farofa?: number}> = ({t, farofa = 0}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={farofa > 0.5 ? sm("#e6c27a", 0.95) : tm("casquinha", crustTex(), 0.7)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    {Array.from({length: 10}, (_, i) => {
      const x = Math.sin(i * 2.7) * 7;
      const z = -3 - (i % 4) * 3.5;
      return farofa > 0.5 ? (
        <FarofaPile key={i} p={[x, 0, z]} s={2 + (i % 3)} />
      ) : (
        <mesh key={i} position={[x, 0.5, z]} scale={[1.2, 0.8, 1.2]} rotation={[0, i, 0]} material={tm("casquinha", crustTex(), 0.7)} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      );
    })}
    {farofa > 0.5 && <FarofaRain t={t} c={[0, 0, -1]} />}
  </group>
);

/* ---------- gorro de lã (espaço da cabeça) ---------- */
export const Gorro: React.FC<{color?: string}> = ({color = "#2e6fd8"}) => (
  <group position={[0, 0.17, -0.02]} rotation={[-0.15, 0, 0]}>
    <mesh scale={[1, 0.75, 0.96]} material={sm(color, 0.95)} castShadow>
      <sphereGeometry args={[0.36, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.96, 1]} material={sm("#ffffff", 0.95)}>
      <torusGeometry args={[0.35, 0.06, 10, 28]} />
    </mesh>
    <mesh position={[0, 0.3, 0]} material={sm("#ffffff", 0.95)} castShadow>
      <sphereGeometry args={[0.09, 12, 10]} />
    </mesh>
  </group>
);
