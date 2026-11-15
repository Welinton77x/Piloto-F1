import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";
import {useThree} from "@react-three/fiber";

/* ===== Objetos do vídeo "Se você quer fazer churrasco, mas acabou o carvão" ===== */

export const Bg: React.FC<{c: string}> = ({c}) => {
  const {scene} = useThree();
  scene.background = new THREE.Color(c);
  return null;
};
const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- churrasqueira de tijolo e saco de carvão vazio ---------- */
export const Grill: React.FC<{p: V3; s?: number; fire?: boolean; t?: number}> = ({p, s = 1, fire = false, t = 0}) => {
  const brick = sm("#b5543a", 0.85);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.5, 0]} geometry={rbox(1.4, 1.0, 0.8, 0.04)} material={brick} castShadow receiveShadow />
      <mesh position={[0, 1.02, 0]} geometry={rbox(1.5, 0.06, 0.9, 0.02)} material={sm("#8a8f99", 0.4)} castShadow />
      <mesh position={[0, 1.3, -0.35]} geometry={rbox(1.4, 0.6, 0.1, 0.02)} material={brick} castShadow />
      <mesh position={[0, 1.95, -0.3]} geometry={rbox(0.5, 1.4, 0.4, 0.04)} material={brick} castShadow />
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => (
        <mesh key={x} position={[x, 1.07, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#3a3f4a", 0.4, {metalness: 0.5})}>
          <cylinderGeometry args={[0.01, 0.01, 0.8, 6]} />
        </mesh>
      ))}
      {fire &&
        [0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.3 + i * 0.3, 1.12 + 0.05 * Math.sin(t * 9 + i), 0]} scale={[1, 1 + 0.2 * Math.sin(t * 11 + i), 1]} material={sm("#ff8a1f", 0.3, {emissive: "#ff5a00", emissiveIntensity: 1.6})}>
            <coneGeometry args={[0.1, 0.3, 8]} />
          </mesh>
        ))}
    </group>
  );
};
const carvaoTex = () =>
  canvasTex("saco-carvao", 128, 160, (c) => {
    c.fillStyle = "#e9dcc0";
    c.fillRect(0, 0, 128, 160);
    c.fillStyle = "#101018";
    c.font = "bold 26px sans-serif";
    c.textAlign = "center";
    c.fillText("CARVÃO", 64, 60);
    c.fillStyle = "#e8262d";
    c.font = "bold 30px sans-serif";
    c.fillText("VAZIO", 64, 110);
  });
export const CoalBag: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s} rotation={[0, 0, 0.25]}>
    <mesh position={[0, 0.25, 0]} scale={[1, 1, 0.35]} material={sm("#e9dcc0", 0.9)} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
    </mesh>
    <mesh position={[0, 0.25, 0.09]} material={tm("saco-carvao", carvaoTex(), 0.9)}>
      <planeGeometry args={[0.46, 0.46]} />
    </mesh>
  </group>
);

/* ---------- espeto com picanha ---------- */
export const Skewer: React.FC<{p?: V3; r?: V3; s?: number; cook?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, cook = 0, t = 0}) => {
  const meat = new THREE.Color("#d4566a").lerp(new THREE.Color("#7a3a1a"), cook).getStyle();
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.35, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
      </mesh>
      <mesh position={[0, -0.12, 0]} material={sm("#5a3a20", 0.6)}>
        <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
      </mesh>
      <group position={[0, 0.65, 0]}>
        <mesh scale={[0.16, 0.13, 0.1]} material={sm(meat, 0.6)} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <mesh position={[0, 0.1, 0]} scale={[0.15, 0.05, 0.095]} material={sm(cook > 0.5 ? "#f2d27a" : "#f7efe2", 0.5)}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      </group>
      {cook > 0.2 &&
        [0, 1, 2].map((i) => {
          const q = (t * 1.2 + i / 3) % 1;
          return (
            <mesh key={i} position={[0.03 * Math.sin(i * 3 + t * 4), 0.78 + q * 0.4, 0]} scale={0.04 + q * 0.06}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={(1 - q) * 0.7} depthWrite={false} />
            </mesh>
          );
        })}
    </group>
  );
};

/* ---------- linguiça ---------- */
const SAUS = ["#9a3a2a", "#b5472f", "#d9a06a"];
export const Sausage: React.FC<{p: V3; r?: V3; s?: number; kind?: number}> = ({p, r = [0, 0, 0], s = 1, kind = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm(SAUS[kind % 3], 0.45)} castShadow>
      <capsuleGeometry args={[0.07, 0.28, 6, 10]} />
    </mesh>
    {[-0.08, 0.08].map((x) => (
      <mesh key={x} position={[x, 0.065, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#5a1a10", 0.6)}>
        <boxGeometry args={[0.02, 0.06, 0.02]} />
      </mesh>
    ))}
  </group>
);
/** chuva de linguiça numa região (área x,z) */
export const SausageRain: React.FC<{c: V3; w: number; d: number; h: number; t: number; n?: number; speed?: number}> = ({c, w, d, h, t, n = 40, speed = 4}) => {
  const r = rng(31);
  const items = Array.from({length: n}, () => [r() - 0.5, r() - 0.5, r(), r() * 6, Math.floor(r() * 3)] as [number, number, number, number, number]);
  return (
    <group position={c}>
      {items.map(([x, z, ph, rot, k], i) => {
        const y = h - ((t * speed / h + ph) % 1) * h;
        return <Sausage key={i} p={[x * w, y, z * d]} r={[rot + t * 3, rot, rot * 0.5 + t * 2]} s={1.4} kind={k} />;
      })}
    </group>
  );
};

/* ---------- o vulcão (normal; olhinhos e boca só quando pede) ---------- */
export const Volcano: React.FC<{p: V3; s?: number; t: number; face?: number; mouth?: number; tongue?: number; apron?: boolean; hat?: boolean; glow?: number}> = ({p, s = 1, t, face = 0, mouth = 0, tongue = 0, apron = false, hat = false, glow = 1}) => {
  const rock = sm("#6b5244", 0.95, {flatShading: true});
  const rockD = sm("#4a3a30", 0.95, {flatShading: true});
  const lava = sm("#ff7a1a", 0.3, {emissive: "#ff4a00", emissiveIntensity: 1.2 * glow});
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 2.0, 0]} material={rock} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 3.6, 4, 9, 2, true]} />
      </mesh>
      <mesh position={[0, 4.0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lava}>
        <circleGeometry args={[1.08, 18]} />
      </mesh>
      <mesh position={[0, 3.98, 0]} rotation={[Math.PI / 2, 0, 0]} material={rockD}>
        <torusGeometry args={[1.1, 0.12, 6, 18]} />
      </mesh>
      {/* escorridos de lava */}
      {[0.3, 2.4, 4.4].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 1.75, 3.0, Math.cos(a) * 1.75]} rotation={[Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]} material={lava}>
          <boxGeometry args={[0.22, 1.9, 0.08]} />
        </mesh>
      ))}
      {face > 0.01 && (
        <group position={[0, 2.4, 2.2]} rotation={[-0.32, 0, 0]} scale={face}>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.55 * sd, 0.35, 0.02]}>
              <mesh scale={[0.32, 0.38, 0.1]} material={sm("#ffffff", 0.3)}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[0, -0.05, 0.08]} scale={[0.15, 0.18, 0.06]} material={sm("#101018", 0.3)}>
                <sphereGeometry args={[1, 12, 10]} />
              </mesh>
              <mesh position={[0.05, 0.02, 0.13]} scale={0.05} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.45, 0.02]} scale={[0.55, 0.12 + 0.3 * mouth, 0.1]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
          {tongue > 0.01 && (
            <mesh position={[0.25 * tongue, -0.45 + 0.05 * Math.sin(t * 8), 0.12]} scale={[0.22 * tongue, 0.1, 0.06]} material={sm("#e2607a", 0.4)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          )}
        </group>
      )}
      {apron && (
        <group position={[0, 1.1, 3.0]} rotation={[-0.56, 0, 0]}>
          <mesh material={sm("#ffffff", 0.7, {side: THREE.DoubleSide})}>
            <planeGeometry args={[1.8, 1.7]} />
          </mesh>
          <mesh position={[0, 0.2, 0.01]} material={sm("#e8262d", 0.6)}>
            <planeGeometry args={[0.7, 0.35]} />
          </mesh>
        </group>
      )}
      {hat && (
        <group position={[0, 4.15, 0]}>
          <mesh position={[0, 0.35, 0]} material={sm("#ffffff", 0.7)}>
            <cylinderGeometry args={[1.0, 0.95, 0.7, 20]} />
          </mesh>
          {[-0.5, 0, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.85, 0]} material={sm("#ffffff", 0.7)}>
              <sphereGeometry args={[0.55, 14, 10]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
/** paisagem em volta do vulcão */
export const VolcanoLand: React.FC<{sky?: string}> = ({sky = "#ffc48a"}) => {
  const r = rng(8);
  const rocks = Array.from({length: 14}, () => [(r() - 0.5) * 30, -4 - r() * 20, 0.3 + r() * 0.8] as V3);
  return (
    <>
      <Bg c={sky} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8a7a5a", 0.95)} receiveShadow>
        <planeGeometry args={[120, 120]} />
      </mesh>
      {rocks.map(([x, z, s2], i) => (
        <mesh key={i} position={[x, s2 * 0.4, z]} scale={s2} material={sm("#6b5244", 0.95, {flatShading: true})}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </>
  );
};
/** borda da cratera (de perto): pedras e lava borbulhando */
export const CraterRim: React.FC<{t: number}> = ({t}) => {
  const lava = sm("#ff7a1a", 0.3, {emissive: "#ff4a00", emissiveIntensity: 1.3});
  return (
    <>
      <Bg c="#ffb070" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, -2.2]} material={lava}>
        <circleGeometry args={[3.2, 28]} />
      </mesh>
      {Array.from({length: 9}, (_, i) => {
        const q = (t * 0.8 + i / 9) % 1;
        const a = i * 2.3;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.8, -1.2 + q * 0.4, -2.2 + Math.sin(a) * 1.6]} scale={(0.1 + 0.15 * Math.sin(q * Math.PI))} material={lava}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        );
      })}
      {/* chão de pedra na borda */}
      <mesh position={[0, -0.25, 1.6]} geometry={rbox(9, 0.5, 2.8, 0.1)} material={sm("#5a4438", 0.95, {flatShading: true})} receiveShadow />
      {[-3, -1.6, 1.7, 3.1].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.5 - (i % 2) * 0.4]} scale={0.5 + (i % 2) * 0.3} material={sm("#6b5244", 0.95, {flatShading: true})} castShadow>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -6.5]} material={sm("#4a3a30", 0.95, {flatShading: true})}>
        <cylinderGeometry args={[6, 6.5, 4, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8]} />
      </mesh>
    </>
  );
};

/* ---------- transporte da montagem ---------- */
export const Boat: React.FC<{p: V3; rotY?: number; s?: number; t?: number}> = ({p, rotY = 0, s = 1, t = 0}) => (
  <group position={[p[0], p[1] + 0.05 * Math.sin(t * 3), p[2]]} rotation={[0.04 * Math.sin(t * 2.4), rotY, 0.05 * Math.sin(t * 2)]} scale={s}>
    <mesh position={[0, 0.25, 0]} geometry={rbox(2.6, 0.5, 1.1, 0.2)} material={sm("#e8414f", 0.5)} castShadow />
    <mesh position={[0, 0.52, 0]} geometry={rbox(2.5, 0.06, 1.0, 0.04)} material={sm("#c8874a", 0.6)} />
    <mesh position={[1.35, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#e8414f", 0.5)}>
      <coneGeometry args={[0.5, 0.5, 4]} />
    </mesh>
  </group>
);
export const Water: React.FC<{t: number}> = ({t}) => (
  <>
    <Bg c="#9fd8ff" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 * Math.sin(t * 2), 0]} material={sm("#2e86de", 0.25, {metalness: 0.1})} receiveShadow>
      <planeGeometry args={[200, 200]} />
    </mesh>
  </>
);
/** cabo da tirolesa */
export const ZipLine: React.FC<{a: V3; b: V3}> = ({a, b}) => {
  const mid = new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(0.5);
  const dir = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={mid} quaternion={q} material={sm("#20222c", 0.5)}>
      <cylinderGeometry args={[0.02, 0.02, len, 6]} />
    </mesh>
  );
};

/* ---------- TV com a previsão do tempo ---------- */
export const forecastTex = () =>
  canvasTex("previsao-farofa", 512, 288, (c) => {
    c.fillStyle = "#1f5fbf";
    c.fillRect(0, 0, 512, 288);
    c.fillStyle = "#ffffff";
    c.font = "bold 30px sans-serif";
    c.fillText("PREVISÃO DO TEMPO", 24, 44);
    c.fillStyle = "#f3d38a";
    c.beginPath();
    c.ellipse(150, 170, 110, 80, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 40; i++) {
      c.fillStyle = i % 2 ? "#c89a4a" : "#e6c072";
      c.fillRect(60 + ((i * 37) % 180), 110 + ((i * 53) % 120), 6, 6);
    }
    c.fillStyle = "#ffd21f";
    c.font = "bold 92px sans-serif";
    c.fillText("50%", 285, 165);
    c.fillStyle = "#ffffff";
    c.font = "bold 34px sans-serif";
    c.fillText("DE FAROFA", 290, 215);
  });

/* ---------- bombeiro carregando pão e vinagrete ---------- */
export const Baguette: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#e3a85a", 0.7)} castShadow>
      <capsuleGeometry args={[0.07, 0.5, 6, 12]} />
    </mesh>
    {[-0.15, 0, 0.15].map((x) => (
      <mesh key={x} position={[x, 0.065, 0]} rotation={[0, 0, 0.6]} material={sm("#f2d27a", 0.7)}>
        <boxGeometry args={[0.02, 0.06, 0.06]} />
      </mesh>
    ))}
  </group>
);
export const VinaigretteJar: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const rr = rng(3);
  const bits = Array.from({length: 14}, () => [(rr() - 0.5) * 0.1, rr() * 0.16, (rr() - 0.5) * 0.1, Math.floor(rr() * 3)] as [number, number, number, number]);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.1, 0]} material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.45})}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
      </mesh>
      {bits.map(([x, y, z, k], i) => (
        <mesh key={i} position={[x, 0.02 + y, z]} material={sm(["#e8262d", "#2ecc71", "#f2f2f2"][k], 0.5)}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, 0.215, 0]} material={sm("#e8262d", 0.4)}>
        <cylinderGeometry args={[0.085, 0.085, 0.03, 16]} />
      </mesh>
    </group>
  );
};

/* ---------- braço de escavadeira com a pá ---------- */
export const ExcavatorArm: React.FC<{p: V3; s?: number; lift: number}> = ({p, s = 1, lift}) => {
  const yel = sm("#ffc21f", 0.5);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.4, 0]} geometry={rbox(1.2, 0.8, 1.2, 0.08)} material={yel} castShadow />
      <group position={[0, 0.8, 0]} rotation={[0, 0, -0.9 + lift * 0.5]}>
        <mesh position={[0, 1.2, 0]} geometry={rbox(0.3, 2.4, 0.3, 0.05)} material={yel} castShadow />
        <group position={[0, 2.4, 0]} rotation={[0, 0, -1.4 + lift * 0.4]}>
          <mesh position={[0, 0.9, 0]} geometry={rbox(0.25, 1.8, 0.25, 0.05)} material={yel} castShadow />
          <group position={[0, 1.8, 0]} rotation={[0, 0, -0.6 - lift * 1.2]}>
            <mesh position={[0, 0.3, 0]} geometry={rbox(0.9, 0.6, 0.7, 0.05)} material={sm("#5a5f6b", 0.4, {metalness: 0.4})} castShadow />
          </group>
        </group>
      </group>
    </group>
  );
};
/** picanha gigante (na chapa do vulcão) */
export const GiantSteak: React.FC<{p: V3; s?: number; r?: V3}> = ({p, s = 1, r = [0, 0, 0]}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1.2, 0.35, 0.8]} material={sm("#8a3a1e", 0.6)} castShadow>
      <sphereGeometry args={[1, 18, 12]} />
    </mesh>
    <mesh position={[0, 0.24, -0.3]} scale={[1.1, 0.14, 0.4]} material={sm("#f2d27a", 0.5)}>
      <sphereGeometry args={[1, 14, 10]} />
    </mesh>
    {[-0.5, 0, 0.5].map((x) => (
      <mesh key={x} position={[x, 0.33, 0.1]} rotation={[0, 0.6, 0]} material={sm("#3a1a0a", 0.6)}>
        <boxGeometry args={[0.08, 0.02, 0.9]} />
      </mesh>
    ))}
  </group>
);

/* ---------- a Terra com a pilha de linguiça ---------- */
export const EarthBall: React.FC<{p: V3; s?: number; t: number; pile?: number}> = ({p, s = 1, t, pile = 1}) => {
  const r = rng(12);
  const conts = Array.from({length: 7}, () => [r() * Math.PI * 2, (r() - 0.5) * 2.2, 0.35 + r() * 0.3] as [number, number, number]);
  return (
    <group position={p} scale={s}>
      <group rotation={[0.3, t * 0.3, 0]}>
        <mesh material={sm("#2e86de", 0.5)}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        {conts.map(([lon, lat, rr], i) => (
          <mesh key={i} position={[Math.cos(lon) * Math.cos(lat * 0.6), Math.sin(lat * 0.6), Math.sin(lon) * Math.cos(lat * 0.6)]} scale={[rr, rr * 0.6, rr]} material={sm("#3fae4a", 0.7)}>
            <sphereGeometry args={[0.5, 12, 8]} />
          </mesh>
        ))}
      </group>
      {pile > 0.01 &&
        Array.from({length: 18}, (_, i) => {
          const row = Math.floor(i / 6);
          const k = i % 6;
          return <Sausage key={i} p={[-0.45 + k * 0.18 + row * 0.08, 0.98 + row * 0.13, (k % 2) * 0.12 - 0.06]} r={[0, k * 0.4, 0.2 * (k % 3 - 1)]} s={1.5 * pile} kind={i} />;
        })}
    </group>
  );
};
/** anel pontilhado da órbita */
export const OrbitRing: React.FC<{p: V3; r: number}> = ({p, r}) => (
  <group position={p}>
    {Array.from({length: 60}, (_, i) => {
      const a = (i / 60) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      );
    })}
  </group>
);

/* ---------- mesa comprida da família ---------- */
export const LongTable: React.FC<{p: V3; food?: number}> = ({p, food = 1}) => (
  <group position={p}>
    <mesh position={[0, 0.78, 0]} geometry={rbox(5.0, 0.08, 1.2, 0.03)} material={sm("#c8874a", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 0.83, 0]} material={sm("#ffffff", 0.7)}>
      <boxGeometry args={[4.9, 0.01, 1.1]} />
    </mesh>
    {[[-2.3, -0.5], [2.3, -0.5], [-2.3, 0.5], [2.3, 0.5]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.39, z]} material={sm("#8a5a33", 0.6)}>
        <cylinderGeometry args={[0.05, 0.05, 0.78, 8]} />
      </mesh>
    ))}
    {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
      <group key={x} position={[x, 0.85, 0.1]}>
        <mesh material={sm("#ffffff", 0.3)}>
          <cylinderGeometry args={[0.36, 0.3, 0.05, 20]} />
        </mesh>
        {food > 0.01 &&
          [0, 1, 2, 3].map((k) => <Sausage key={k} p={[-0.15 + (k % 2) * 0.3, 0.07 + Math.floor(k / 2) * 0.1, -0.08 + Math.floor(k / 2) * 0.12]} r={[0, 0.3 * k, 0]} s={1.2 * food} kind={i + k} />)}
      </group>
    ))}
    {food > 0.01 && (
      <mesh position={[0, 0.9, -0.3]} scale={[1, 0.6, 1]} material={sm("#e8c27a", 0.8)}>
        <sphereGeometry args={[0.25, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    )}
  </group>
);

/* ---------- rede de dormir entre dois postes ---------- */
export const Hammock: React.FC<{p: V3; sway?: number}> = ({p, sway = 0}) => (
  <group position={p}>
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} position={[x, 1.0, 0]} material={sm("#8a5a33", 0.7)} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 2.0, 8]} />
      </mesh>
    ))}
    <group position={[0, 1.6, 0]} rotation={[sway, 0, 0]}>
      <mesh position={[0, -0.55, 0]} scale={[1.45, 0.4, 0.55]} material={sm("#2ecc71", 0.8, {side: THREE.DoubleSide})} castShadow>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.5 * sd, -0.25, 0]} rotation={[0, 0, sd * 1.2]} material={sm("#e3d6c0", 0.7)}>
          <cylinderGeometry args={[0.012, 0.012, 0.7, 4]} />
        </mesh>
      ))}
    </group>
  </group>
);

/* ---------- montanha de farofa e colher gigante ---------- */
export const FarofaHill: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => {
  const r = rng(17);
  const dots = Array.from({length: 50}, () => [r() * Math.PI * 2, r()] as [number, number]);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.9, 0]} material={sm("#e6c072", 0.95, {flatShading: true})} castShadow receiveShadow>
        <coneGeometry args={[1.6, 1.8, 16, 3]} />
      </mesh>
      {dots.map(([a, h], i) => {
        const rad = 1.6 * (1 - h) + 0.02;
        return (
          <mesh key={i} position={[Math.cos(a) * rad, h * 1.8, Math.sin(a) * rad]} material={sm(i % 3 ? "#c89a4a" : "#9a6a2a", 0.9)}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
          </mesh>
        );
      })}
    </group>
  );
};
export const BigSpoon: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.3, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
      <cylinderGeometry args={[0.025, 0.03, 0.7, 8]} />
    </mesh>
    <mesh position={[0, 0.72, 0.03]} scale={[0.14, 0.2, 0.06]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
      <sphereGeometry args={[1, 14, 10]} />
    </mesh>
  </group>
);
