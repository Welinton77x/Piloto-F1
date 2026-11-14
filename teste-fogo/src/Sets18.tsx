import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Objetos do vídeo "Nunca faça essas 5 coisas jogando bola com os amigos" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- campinho de terra do bairro (comprido em z) ---------- */
const terraTex = () =>
  canvasTex("terra-campinho", 256, 256, (c) => {
    const r = rng(11);
    c.fillStyle = "#c48a52";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      c.fillStyle = r() < 0.5 ? "rgba(150,100,55,0.35)" : "rgba(220,170,110,0.35)";
      c.fillRect(r() * 256, r() * 256, 2 + r() * 4, 2 + r() * 4);
    }
    for (let i = 0; i < 14; i++) {
      c.fillStyle = "rgba(110,170,70,0.7)";
      c.beginPath();
      c.ellipse(r() * 256, r() * 256, 8 + r() * 14, 5 + r() * 8, r() * 3, 0, Math.PI * 2);
      c.fill();
    }
  });
export const FIELD_L = 18; // comprimento (z de -9 a 9)
export const Campinho: React.FC<{grass?: number}> = ({grass = 0}) => {
  const t = terraTex();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 5);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={tm("terra-campinho", t, 0.95)} receiveShadow>
        <planeGeometry args={[11, FIELD_L]} />
      </mesh>
      {grass > 0.01 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sm("#5fae3e", 0.9, {transparent: true, opacity: grass})}>
          <planeGeometry args={[11, FIELD_L]} />
        </mesh>
      )}
      {/* linhas de cal tortas */}
      <mesh rotation={[-Math.PI / 2, 0, 0.02]} position={[0, 0.012, 0]} material={sm("#f4f0e6", 0.9)}>
        <planeGeometry args={[10, 0.1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={sm("#f4f0e6", 0.9)}>
        <ringGeometry args={[1.5, 1.6, 30]} />
      </mesh>
    </group>
  );
};
/** gol de chinelo: dois chinelos de dedo no chão marcando a trave */
export const FlipFlop: React.FC<{p?: V3; r?: V3; s?: number; color?: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, color = "#2e86de"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.02, 0]} scale={[0.1, 0.02, 0.27]} material={sm("#ffffff", 0.6)} castShadow>
      <sphereGeometry args={[1, 16, 8]} />
    </mesh>
    <mesh position={[0, 0.04, 0.03]} rotation={[0, 0, Math.PI / 2]} material={sm(color, 0.5)}>
      <torusGeometry args={[0.07, 0.013, 6, 16, Math.PI]} />
    </mesh>
    <mesh position={[0, 0.06, 0.15]} material={sm(color, 0.5)}>
      <sphereGeometry args={[0.018, 8, 6]} />
    </mesh>
  </group>
);
export const ChineloGoal: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <FlipFlop p={[-1.3, 0, 0]} s={2.2} />
    <FlipFlop p={[1.3, 0, 0]} s={2.2} color="#e8414f" />
  </group>
);
export const BrickGoal: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => {
  const brick = sm("#b5523b", 0.85);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-1.3, 1.3].map((x) =>
        [0, 1, 2].map((k) => <mesh key={`${x}${k}`} position={[x, 0.09 + k * 0.17, 0]} rotation={[0, k * 0.4, 0]} geometry={rbox(0.36, 0.16, 0.2, 0.02)} material={brick} castShadow />),
      )}
    </group>
  );
};
/** gol de verdade (trave branca e rede) pra final */
export const BarrierWall: React.FC<{z: number; w?: number}> = ({z, w = 12}) => (
  <mesh position={[0, 0.6, z]} geometry={rbox(w, 1.2, 0.2, 0.02)} material={sm("#d9cfbd", 0.9)} receiveShadow />
);

/* ---------- a Terra vista do espaço, satélite ---------- */
const terraPlanetaTex = () =>
  canvasTex("planeta-terra", 512, 256, (c) => {
    c.fillStyle = "#2e86de";
    c.fillRect(0, 0, 512, 256);
    const r = rng(4);
    c.fillStyle = "#4fae3a";
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      c.ellipse(r() * 512, 40 + r() * 176, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 18; i++) {
      c.beginPath();
      c.ellipse(r() * 512, r() * 256, 18 + r() * 30, 5 + r() * 6, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
export const Space: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#05060f"]} />
    <mesh position={[0, -5.2, -2]} rotation={[0.3, t * 0.1, 0]} material={tm("planeta-terra", terraPlanetaTex(), 0.7)}>
      <sphereGeometry args={[5, 48, 32]} />
    </mesh>
    {Array.from({length: 60}, (_, i) => {
      const r = rng(i + 50);
      return (
        <mesh key={i} position={[(r() - 0.5) * 30, (r() - 0.2) * 20, -12 - r() * 6]}>
          <sphereGeometry args={[0.03 + r() * 0.03, 6, 4]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
        </mesh>
      );
    })}
  </>
);
export const Satellite: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.4, 0.4, 0.5, 0.04)} material={sm("#e3b33b", 0.3, {metalness: 0.7})} />
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.75 * sd, 0, 0]} material={sm("#2a4a8a", 0.2, {metalness: 0.5})}>
        <boxGeometry args={[1.0, 0.02, 0.4]} />
      </mesh>
    ))}
    <mesh position={[0, 0.3, 0]} rotation={[Math.PI, 0, 0]} material={sm("#d9dde3", 0.3)}>
      <coneGeometry args={[0.16, 0.12, 16, 1, true]} />
    </mesh>
  </group>
);

/* ---------- banana-microfone ---------- */
export const BananaMic: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, 0]} material={sm("#ffd21f", 0.5)} castShadow>
      <torusGeometry args={[0.14, 0.035, 8, 16, Math.PI * 0.8]} />
    </mesh>
    <mesh position={[0.14, 0, 0]} material={sm("#5a3a1a", 0.6)}>
      <sphereGeometry args={[0.02, 6, 4]} />
    </mesh>
  </group>
);

/* ---------- buquê ---------- */
export const Bouquet: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.08, 0]} material={sm("#2e8b3a", 0.6)}>
      <cylinderGeometry args={[0.03, 0.02, 0.18, 8]} />
    </mesh>
    {Array.from({length: 7}, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <mesh key={i} position={[i ? Math.cos(a) * 0.06 : 0, 0.04 + (i ? 0 : 0.02), i ? Math.sin(a) * 0.06 : 0]} material={sm(["#ffffff", "#ff8fab", "#ffd1dc"][i % 3], 0.6)}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
      );
    })}
  </group>
);
export const DirtPile: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <mesh position={p} scale={[s, s * 0.5, s]} material={sm("#7a5230", 0.95)} castShadow receiveShadow>
    <sphereGeometry args={[0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
  </mesh>
);

/* ---------- museu ---------- */
const placaMuseuTex = () =>
  canvasTex("placa-museu", 512, 160, (c) => {
    c.fillStyle = "#e3b33b";
    c.fillRect(0, 0, 512, 160);
    c.fillStyle = "#3a2a10";
    c.fillRect(8, 8, 496, 144);
    c.fillStyle = "#f4e2b0";
    c.font = "bold 38px serif";
    c.textAlign = "center";
    c.fillText("BOLA PRÉ-HISTÓRICA", 256, 66);
    c.fillText("DO RACHA", 256, 116);
  });
export const Museum: React.FC = () => (
  <>
    <color attach="background" args={["#3a2a3a"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8a5a3a", 0.5)} receiveShadow>
      <planeGeometry args={[14, 14]} />
    </mesh>
    <mesh position={[0, 2.5, -2.5]} material={sm("#7a2a3a", 0.9)}>
      <planeGeometry args={[14, 5]} />
    </mesh>
    {[-2.6, 2.6].map((x) => (
      <group key={x} position={[x, 1.8, -2.45]}>
        <mesh geometry={rbox(1.2, 1.5, 0.06, 0.02)} material={sm("#e3b33b", 0.4, {metalness: 0.5})} />
        <mesh position={[0, 0, 0.035]} material={sm(x < 0 ? "#5a8aa8" : "#a8885a", 0.8)}>
          <planeGeometry args={[1.0, 1.3]} />
        </mesh>
      </group>
    ))}
    {/* pedestal e vitrine */}
    <mesh position={[0, 0.5, 0]} geometry={rbox(1.0, 1.0, 1.0, 0.03)} material={sm("#f2efe6", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 1.4, 0]} material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.25})}>
      <boxGeometry args={[0.9, 0.8, 0.9]} />
    </mesh>
    <mesh position={[0, 0.7, 0.505]} material={tm("placa-museu", placaMuseuTex(), 0.5)}>
      <planeGeometry args={[0.9, 0.28]} />
    </mesh>
  </>
);
export const SafariHat: React.FC = () => (
  <group position={[0, 0.25, 0]}>
    <mesh scale={[1.05, 0.7, 1.05]} material={sm("#c9a46a", 0.7)} castShadow>
      <sphereGeometry args={[0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.01, 0]} material={sm("#c9a46a", 0.7)}>
      <cylinderGeometry args={[0.46, 0.46, 0.02, 24]} />
    </mesh>
  </group>
);

/* ---------- fachada de casa com janela aberta (a vó do VAR) ---------- */
export const HouseWindow: React.FC<{wall?: string}> = ({wall = "#f7a8b8"}) => {
  const wm = sm(wall, 0.85);
  const W0 = -0.9, W1 = 0.9, H0 = 1.3, H1 = 2.6;
  return (
    <group>
      {[
        [-4, W0, 0, 4.5],
        [W1, 4, 0, 4.5],
        [W0, W1, 0, H0],
        [W0, W1, H1, 4.5],
      ].map(([x0, x1, y0, y1], i) => (
        <mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} material={wm} receiveShadow>
          <boxGeometry args={[x1 - x0, y1 - y0, 0.2]} />
        </mesh>
      ))}
      {[[0, H1, 1.9, 0.12], [0, H0, 1.9, 0.12], [W0, (H0 + H1) / 2, 0.12, 1.4], [W1, (H0 + H1) / 2, 0.12, 1.4]].map(([x, y, w, h], i) => (
        <mesh key={"m" + i} position={[x, y, 0.12]} geometry={rbox(w, h, 0.1, 0.02)} material={sm("#ffffff", 0.5)} />
      ))}
      <mesh position={[0, 2.3, -2]} material={sm("#ffe9c8", 0.9)}>
        <planeGeometry args={[4, 3]} />
      </mesh>
      <pointLight position={[0, 2.2, -0.8]} intensity={2} distance={3} decay={1.5} color="#fff2d8" />
      <mesh position={[0, 4.6, 0.3]} geometry={rbox(8.6, 0.3, 0.9, 0.04)} material={sm("#3a6ea5", 0.7)} />
      {/* parapeito com vaso */}
      <mesh position={[0, H0 - 0.05, 0.3]} geometry={rbox(2.0, 0.08, 0.4, 0.02)} material={sm("#ffffff", 0.5)} />
    </group>
  );
};
export const CoffeeCup: React.FC<{p?: V3; s?: number}> = ({p = [0, 0, 0], s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#ffffff", 0.4)}>
      <cylinderGeometry args={[0.05, 0.04, 0.08, 14]} />
    </mesh>
    <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a3a1a", 0.3)}>
      <circleGeometry args={[0.045, 14]} />
    </mesh>
    <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#ffffff", 0.4)}>
      <torusGeometry args={[0.025, 0.008, 6, 12]} />
    </mesh>
  </group>
);

/* ---------- estátua do chinelo na praça ---------- */
export const ChineloStatue: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => {
  const gold = sm("#e3b33b", 0.25, {metalness: 0.75, emissive: "#5a3a00", emissiveIntensity: 0.25});
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.6, 0]} geometry={rbox(1.6, 1.2, 1.6, 0.04)} material={sm("#d9d4c8", 0.8)} castShadow receiveShadow />
      <group position={[0, 1.2, 0]} rotation={[-0.25, 0.4, 0]}>
        <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.45, 1.2, 0.08]} material={gold} castShadow>
          <sphereGeometry args={[1, 24, 12]} />
        </mesh>
        <mesh position={[0, 1.1, 0.12]} rotation={[0, 0, 0]} material={gold}>
          <torusGeometry args={[0.3, 0.06, 8, 20, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- pato normal voando ---------- */
export const FlyingDuck: React.FC<{p: V3; rotY?: number; t: number; s?: number}> = ({p, rotY = 0, t, s = 1}) => {
  const fl = Math.sin(t * 14);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh scale={[0.12, 0.11, 0.26]} material={sm("#8a6a4a", 0.7)}>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.06, 0.26]} scale={[0.075, 0.07, 0.08]} material={sm("#2e7a4a", 0.5)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      <mesh position={[0, 0.05, 0.36]} rotation={[Math.PI / 2, 0, 0]} scale={[1.3, 1, 0.5]} material={sm("#e3a32b", 0.5)}>
        <coneGeometry args={[0.03, 0.08, 8]} />
      </mesh>
      <mesh position={[0, 0.03, 0.19]} material={sm("#ffffff", 0.6)}>
        <torusGeometry args={[0.07, 0.012, 6, 14]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.14 * sd, 0.03, 0]} rotation={[0, 0, sd * 0.6 * fl]} scale={[0.2, 0.015, 0.11]} material={sm("#6a5a4a", 0.7)}>
          <sphereGeometry args={[1, 10, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- placar ---------- */
const placarTex = () =>
  canvasTex("placar-0x0", 256, 128, (c) => {
    c.fillStyle = "#101018";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#ffd21f";
    c.font = "bold 76px monospace";
    c.textAlign = "center";
    c.fillText("0 x 0", 128, 92);
  });
export const Scoreboard: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {[-0.9, 0.9].map((x) => (
      <mesh key={x} position={[x, 1.0, 0]} material={sm("#5a3a1a", 0.7)}>
        <cylinderGeometry args={[0.06, 0.06, 2, 8]} />
      </mesh>
    ))}
    <mesh position={[0, 2.2, 0]} material={tm("placar-0x0", placarTex(), 0.5, {emissive: "#ffd21f", emissiveIntensity: 0.15})}>
      <planeGeometry args={[2, 1]} />
    </mesh>
  </group>
);

/* ---------- banda de forró ---------- */
export const LeatherHat: React.FC = () => (
  <group position={[0, 0.27, 0]}>
    <mesh material={sm("#8a5a2b", 0.7)}>
      <cylinderGeometry args={[0.2, 0.28, 0.2, 16]} />
    </mesh>
    <mesh position={[0, -0.07, 0]} rotation={[0, 0, 0]} scale={[1, 0.25, 1]} material={sm("#8a5a2b", 0.7)}>
      <torusGeometry args={[0.38, 0.08, 6, 20]} />
    </mesh>
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[Math.cos((i / 6) * Math.PI) * 0.36, -0.02, 0.06 + Math.sin((i / 6) * Math.PI) * 0.1]} rotation={[0, 0, Math.PI / 4]} material={sm("#e3b33b", 0.4)}>
        <octahedronGeometry args={[0.03, 0]} />
      </mesh>
    ))}
  </group>
);
export const Accordion: React.FC<{p?: V3; t?: number}> = ({p = [0, 0, 0], t = 0}) => {
  const open = 1 + 0.25 * Math.sin(t * 6);
  return (
    <group position={p}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.14 * sd * open, 0, 0]} geometry={rbox(0.12, 0.34, 0.2, 0.02)} material={sm(sd < 0 ? "#e8414f" : "#2e86de", 0.4)} />
      ))}
      <mesh scale={[open, 1, 1]} material={sm("#ffffff", 0.7)}>
        <boxGeometry args={[0.17, 0.3, 0.18]} />
      </mesh>
    </group>
  );
};
export const Zabumba: React.FC<{p?: V3}> = ({p = [0, 0, 0]}) => (
  <group position={p} rotation={[0, 0, Math.PI / 2]}>
    <mesh material={sm("#c0392b", 0.5)}>
      <cylinderGeometry args={[0.2, 0.2, 0.18, 20]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0, 0.091 * sd, 0]} rotation={[sd > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0]} material={sm("#f4ead2", 0.7)}>
        <circleGeometry args={[0.19, 20]} />
      </mesh>
    ))}
  </group>
);
export const Triangle: React.FC<{p?: V3}> = ({p = [0, 0, 0]}) => (
  <group position={p}>
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.sin(a + Math.PI / 3) * 0.06, Math.cos(a + Math.PI / 3) * 0.06, 0]} rotation={[0, 0, -a - Math.PI / 3 + Math.PI / 2]} material={sm("#c9ced6", 0.2, {metalness: 0.8})}>
          <cylinderGeometry args={[0.006, 0.006, 0.2, 6]} />
        </mesh>
      );
    })}
  </group>
);
export const Cane: React.FC<{p?: V3}> = ({p = [0, 0, 0]}) => (
  <group position={p}>
    <mesh position={[0, -0.45, 0]} material={sm("#6a4a2a", 0.6)}>
      <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
    </mesh>
    <mesh position={[0.05, 0, 0]} rotation={[0, 0, 0]} material={sm("#6a4a2a", 0.6)}>
      <torusGeometry args={[0.05, 0.02, 6, 12, Math.PI]} />
    </mesh>
  </group>
);
/** luva de goleiro gigante (na mão do boneco) */
export const BigGlove: React.FC<{color?: string}> = ({color = "#2ecc71"}) => (
  <group position={[0, -0.04, 0.02]}>
    <mesh geometry={rbox(0.24, 0.26, 0.12, 0.06)} material={sm(color, 0.5)} castShadow />
    <mesh position={[0, -0.12, 0]} material={sm("#ffffff", 0.5)}>
      <cylinderGeometry args={[0.08, 0.08, 0.06, 14]} />
    </mesh>
  </group>
);
export const SuitTie: React.FC = () => null;
