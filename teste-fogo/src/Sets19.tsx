import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";
import {useThree} from "@react-three/fiber";

/** cor de fundo da cena (funciona mesmo dentro de um group) */
export const Bg: React.FC<{c: string}> = ({c}) => {
  const {scene} = useThree();
  scene.background = new THREE.Color(c);
  return null;
};

/* ===== Objetos do vídeo "Nunca tome café às 9 da manhã" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- caneca de café com fumacinha ---------- */
export const Mug: React.FC<{p?: V3; r?: V3; s?: number; t?: number; steam?: number; color?: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, t = 0, steam = 1, color = "#e8414f"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.06, 0]} material={sm(color, 0.4)} castShadow>
      <cylinderGeometry args={[0.065, 0.058, 0.13, 18]} />
    </mesh>
    <mesh position={[0, 0.118, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#4a2a12", 0.25)}>
      <circleGeometry args={[0.058, 18]} />
    </mesh>
    <mesh position={[0.075, 0.065, 0]} rotation={[0, 0, Math.PI / 2]} material={sm(color, 0.4)}>
      <torusGeometry args={[0.032, 0.011, 8, 14]} />
    </mesh>
    {steam > 0.01 &&
      [0, 1, 2].map((i) => {
        const q = (t * 0.7 + i / 3) % 1;
        return (
          <mesh key={i} position={[0.025 * Math.sin(t * 3 + i * 2), 0.16 + q * 0.32, 0]} scale={(0.03 + q * 0.035) * steam}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={(1 - q) * 0.75} depthWrite={false} />
          </mesh>
        );
      })}
  </group>
);

/* ---------- relógio de parede com ponteiros ---------- */
export const WallClock: React.FC<{p: V3; h: number; m: number; s?: number}> = ({p, h, m, s = 1}) => {
  const ha = -((h % 12) + m / 60) * (Math.PI / 6);
  const ma = -(m / 60) * Math.PI * 2;
  return (
    <group position={p} scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#e8414f", 0.4)}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 36]} />
      </mesh>
      <mesh position={[0, 0, 0.032]} material={sm("#ffffff", 0.4)}>
        <circleGeometry args={[0.44, 36]} />
      </mesh>
      {Array.from({length: 12}, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.37, Math.cos((i / 12) * Math.PI * 2) * 0.37, 0.036]} material={sm("#101018", 0.4)}>
          <circleGeometry args={[i % 3 === 0 ? 0.035 : 0.018, 10]} />
        </mesh>
      ))}
      <group position={[0, 0, 0.045]} rotation={[0, 0, ha]}>
        <mesh position={[0, 0.11, 0]} material={sm("#101018", 0.4)}>
          <boxGeometry args={[0.045, 0.24, 0.01]} />
        </mesh>
      </group>
      <group position={[0, 0, 0.055]} rotation={[0, 0, ma]}>
        <mesh position={[0, 0.16, 0]} material={sm("#101018", 0.4)}>
          <boxGeometry args={[0.03, 0.33, 0.01]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.065]} material={sm("#e8414f", 0.4)}>
        <circleGeometry args={[0.03, 12]} />
      </mesh>
    </group>
  );
};

/* ---------- cozinha: mesa no meio, balcão, cafeteira, geladeira e relógio ---------- */
export const CafeKitchen: React.FC<{h: number; m: number; night?: boolean; calendar?: React.ReactNode}> = ({h, m, night = false, calendar}) => {
  const wall = sm(night ? "#4a5a8a" : "#ffe08a", 0.9);
  return (
    <group>
      <Bg c={night ? "#1a2244" : "#9fd8ff"} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={tm("piso-cafe", pisoTex(), 0.6)} receiveShadow>
        <planeGeometry args={[14, 14]} />
      </mesh>
      {/* parede do fundo com janela */}
      {(
        [
          [-2.6, 2.5, 4.8, 5],
          [3.1, 2.5, 3.4, 5],
          [0.9, 0.7, 1.2, 1.4],
          [0.9, 4.1, 1.2, 1.8],
        ] as [number, number, number, number][]
      ).map(([x, y, w, hh], i) => (
        <mesh key={i} position={[x, y, -2.6]} material={wall} receiveShadow>
          <boxGeometry args={[w, hh, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0.9, 2.3, -2.75]} material={sm(night ? "#0c1230" : "#bfe8ff", 0.4, {emissive: night ? "#000000" : "#9fd8ff", emissiveIntensity: 0.3})}>
        <planeGeometry args={[1.3, 1.9]} />
      </mesh>
      {night && <mesh position={[1.2, 2.9, -2.72]} material={sm("#fff6c0", 0.3, {emissive: "#fff6c0", emissiveIntensity: 1.2})}><circleGeometry args={[0.16, 16]} /></mesh>}
      {[-0.65, 0.65].map((dx) => (
        <mesh key={dx} position={[0.9 + dx, 2.3, -2.5]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[0.08, 1.9, 0.12]} />
        </mesh>
      ))}
      {/* paredes dos lados */}
      {[-4.8, 4.8].map((x) => (
        <mesh key={x} position={[x, 2.5, 1]} material={wall}>
          <boxGeometry args={[0.2, 5, 8]} />
        </mesh>
      ))}
      {/* balcão com cafeteira */}
      <group position={[-2.6, 0, -2.1]}>
        <mesh position={[0, 0.47, 0]} geometry={rbox(3.2, 0.94, 0.8, 0.05)} material={sm("#2e86de", 0.5)} castShadow receiveShadow />
        <mesh position={[0, 0.97, 0]} geometry={rbox(3.3, 0.08, 0.85, 0.03)} material={sm("#f2f2ee", 0.35)} castShadow />
        <group position={[0.6, 1.0, 0]}>
          <mesh position={[0, 0.25, -0.05]} geometry={rbox(0.38, 0.5, 0.32, 0.04)} material={sm("#1d1f27", 0.4)} castShadow />
          <mesh position={[0, 0.1, 0.08]} material={sm("#cfefff", 0.1, {transparent: true, opacity: 0.6})}>
            <cylinderGeometry args={[0.1, 0.09, 0.2, 14]} />
          </mesh>
          <mesh position={[0, 0.06, 0.08]} material={sm("#4a2a12", 0.3)}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 14]} />
          </mesh>
        </group>
      </group>
      {/* geladeira */}
      <mesh position={[3.8, 1.2, -1.9]} geometry={rbox(1.1, 2.4, 1.0, 0.12)} material={sm("#e9f6fb", 0.4)} castShadow receiveShadow />
      {/* relógio */}
      <WallClock p={[-1.2, 3.2, -2.45]} h={h} m={m} s={0.9} />
      {calendar}
      {/* mesa e cadeira */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.78, 0]} geometry={rbox(1.6, 0.08, 1.0, 0.03)} material={sm("#c8874a", 0.6)} castShadow receiveShadow />
        {[[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.39, z]} material={sm("#8a5a33", 0.6)} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.78, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.83, 0]} material={sm("#ffffff", 0.6)}>
          <boxGeometry args={[1.2, 0.01, 0.7]} />
        </mesh>
      </group>
    </group>
  );
};
const pisoTex = () =>
  canvasTex("piso-cafe", 256, 256, (c) => {
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        c.fillStyle = (i + j) % 2 ? "#ffffff" : "#e8414f";
        c.fillRect(i * 32, j * 32, 32, 32);
      }
  }, [4, 4]);

/* ---------- calendário de parede que vira a folha ---------- */
const calTex = (day: string, num: string) =>
  canvasTex("cal-" + day, 256, 300, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 300);
    c.fillStyle = "#e8262d";
    c.fillRect(0, 0, 256, 80);
    c.fillStyle = "#ffffff";
    c.font = "bold 46px sans-serif";
    c.textAlign = "center";
    c.fillText(day, 128, 58);
    c.fillStyle = "#101018";
    c.font = "bold 150px sans-serif";
    c.fillText(num, 128, 240);
  });
export const FlipCalendar: React.FC<{p: V3; s?: number; flip: number}> = ({p, s = 1, flip}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0, -0.01]} material={tm("cal-QUINTA", calTex("QUINTA", "16"), 0.6)}>
      <planeGeometry args={[0.8, 0.94]} />
    </mesh>
    {flip < 1 && (
      <group position={[0, 0.47, 0.005]} rotation={[-flip * Math.PI * 0.95, 0, 0]}>
        <mesh position={[0, -0.47, 0]} material={tm("cal-TERÇA", calTex("TERÇA", "14"), 0.6, {side: THREE.DoubleSide})}>
          <planeGeometry args={[0.8, 0.94]} />
        </mesh>
      </group>
    )}
    <mesh position={[0, 0.5, 0.01]} material={sm("#1d1f27", 0.4)}>
      <boxGeometry args={[0.84, 0.06, 0.03]} />
    </mesh>
  </group>
);

/* ---------- cérebro que acorda (sai da cabeça) ---------- */
export const Brain: React.FC<{p: V3; s?: number; wake: number; t: number}> = ({p, s = 1, wake, t}) => {
  const pink = sm("#f49ac1", 0.5);
  const r = rng(5);
  const lumps = Array.from({length: 11}, () => [(r() - 0.5) * 0.36, (r() - 0.3) * 0.16, (r() - 0.5) * 0.24] as V3);
  return (
    <group position={p} scale={s}>
      {lumps.map((q, i) => (
        <mesh key={i} position={q} material={pink} castShadow>
          <sphereGeometry args={[0.11, 12, 10]} />
        </mesh>
      ))}
      {/* olhinhos que abrem */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.07 * sd, 0.02, 0.2]}>
          <mesh scale={[0.045, 0.045 * Math.max(0.08, wake), 0.02]} material={sm("#ffffff", 0.3)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh position={[0, 0, 0.015]} scale={[0.022, 0.022 * Math.max(0.08, wake), 0.01]} material={sm("#101018", 0.3)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* raios de energia */}
      {wake > 0.5 &&
        Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + t * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.35, 0.05 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.3]} rotation={[0, -a, 0.4]}>
              <Bolt s={0.6} />
            </group>
          );
        })}
    </group>
  );
};
/** raio amarelo em zigue-zague */
export const Bolt: React.FC<{s?: number; p?: V3; r?: V3}> = ({s = 1, p = [0, 0, 0], r = [0, 0, 0]}) => {
  const m = sm("#ffd21f", 0.3, {emissive: "#ffb000", emissiveIntensity: 1.2});
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0.02, 0.08, 0]} rotation={[0, 0, -0.5]} material={m}>
        <boxGeometry args={[0.04, 0.18, 0.03]} />
      </mesh>
      <mesh position={[0.0, -0.0, 0]} rotation={[0, 0, 0.9]} material={m}>
        <boxGeometry args={[0.04, 0.12, 0.03]} />
      </mesh>
      <mesh position={[-0.02, -0.08, 0]} rotation={[0, 0, -0.5]} material={m}>
        <boxGeometry args={[0.04, 0.18, 0.03]} />
      </mesh>
    </group>
  );
};

/* ---------- prédio de apartamentos que dança ---------- */
export const Building: React.FC<{p: V3; beat: number; t: number; children?: React.ReactNode}> = ({p, beat, t, children}) => {
  const wall = sm("#f4a261", 0.8);
  const sway = 0.06 * Math.sin(t * Math.PI * 2 * 1.6);
  return (
    <group position={p}>
      <group rotation={[0, 0, sway]} scale={[1 - beat * 0.05, 1 + beat * 0.07, 1]}>
        <mesh position={[0, 4, 0]} geometry={rbox(6, 8, 3, 0.1)} material={wall} castShadow receiveShadow />
        <mesh position={[0, 8.1, 0]} geometry={rbox(6.3, 0.25, 3.3, 0.05)} material={sm("#c0392b", 0.6)} />
        {[0, 1, 2, 3].map((fl) =>
          [-1.9, 0, 1.9].map((x) => (
            <group key={fl + "" + x} position={[x, 1.2 + fl * 1.9, 1.51]}>
              <mesh material={sm("#fff4c8", 0.4, {emissive: "#ffe9a0", emissiveIntensity: 0.25})}>
                <planeGeometry args={[1.2, 1.2]} />
              </mesh>
              <mesh position={[0, -0.66, 0.08]} geometry={rbox(1.4, 0.1, 0.25, 0.02)} material={sm("#ffffff", 0.5)} />
            </group>
          )),
        )}
        {children}
      </group>
    </group>
  );
};

/* ---------- nuvens dobradinhas (empilhadas igual toalha) ---------- */
export const FoldedClouds: React.FC<{p: V3; n?: number; s?: number}> = ({p, n = 5, s = 1}) => (
  <group position={p} scale={s}>
    {Array.from({length: n}, (_, i) => (
      <group key={i} position={[0.03 * Math.sin(i * 2), 0.17 + i * 0.32, 0]}>
        <mesh geometry={rbox(1.4, 0.3, 0.9, 0.14)} material={sm("#ffffff", 0.7)} castShadow />
        <mesh position={[0.71, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#f2f6ff", 0.7)}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 12, 1, false, 0, Math.PI]} />
        </mesh>
      </group>
    ))}
  </group>
);
/** brilhinhos de limpeza */
export const Sparkles: React.FC<{p: V3; t: number; spread?: number; n?: number}> = ({p, t, spread = 1.5, n = 8}) => {
  const r = rng(11);
  const pts = Array.from({length: n}, () => [(r() - 0.5) * spread * 2, r() * spread * 1.4, (r() - 0.5) * spread] as V3);
  return (
    <group position={p}>
      {pts.map((q, i) => {
        const k = 0.5 + 0.5 * Math.sin(t * 8 + i * 1.7);
        return (
          <group key={i} position={q} scale={0.06 + 0.1 * k} rotation={[0, 0, t * 2 + i]}>
            {[0, Math.PI / 2].map((a) => (
              <mesh key={a} rotation={[0, 0, a]} material={sm("#ffffff", 0.2, {emissive: "#fff6c0", emissiveIntensity: 1.5})}>
                <boxGeometry args={[1, 0.18, 0.05]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
/** vassoura */
export const Broom: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.0, 0]} material={sm("#c8874a", 0.6)}>
      <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
    </mesh>
    <mesh position={[0, -0.68, 0]} geometry={rbox(0.32, 0.22, 0.08, 0.03)} material={sm("#ffd21f", 0.8)} />
  </group>
);

/* ---------- metrô (vagões) ---------- */
export const MetroTrain: React.FC<{p: V3; cars?: number}> = ({p, cars = 3}) => (
  <group position={p}>
    {Array.from({length: cars}, (_, i) => (
      <group key={i} position={[-i * 4.3, 0, 0]}>
        <mesh position={[0, 1.2, 0]} geometry={rbox(4.1, 1.9, 1.8, 0.25)} material={sm("#cfd4da", 0.35, {metalness: 0.4})} castShadow />
        <mesh position={[0, 0.6, 0.91]} material={sm("#e8262d", 0.4)}>
          <planeGeometry args={[4.0, 0.25]} />
        </mesh>
        {[-1.3, 0, 1.3].map((x) => (
          <mesh key={x} position={[x, 1.45, 0.91]} material={sm("#20304a", 0.2)}>
            <planeGeometry args={[0.9, 0.6]} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);
/** túnel do metrô (paredes com luzes passando) */
export const Tunnel: React.FC<{x: number}> = ({x}) => (
  <group>
    <Bg c={"#14161c"} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} material={sm("#3a3f4a", 0.9)} receiveShadow>
      <planeGeometry args={[80, 10]} />
    </mesh>
    <mesh position={[x, 2.5, -2.2]} material={sm("#5a606c", 0.9)}>
      <planeGeometry args={[80, 5]} />
    </mesh>
    {Array.from({length: 14}, (_, i) => {
      const lx = Math.round(x / 3) * 3 + (i - 7) * 3;
      return (
        <mesh key={i} position={[lx, 3.4, -2.1]} material={sm("#fff4c8", 0.3, {emissive: "#fff0b0", emissiveIntensity: 1.5})}>
          <boxGeometry args={[1.2, 0.12, 0.05]} />
        </mesh>
      );
    })}
    {[-0.5, 0.5].map((z) => (
      <mesh key={z} position={[x, 0.03, z + 0.8]} material={sm("#8c919b", 0.3, {metalness: 0.6})}>
        <boxGeometry args={[80, 0.05, 0.08]} />
      </mesh>
    ))}
  </group>
);

/* ---------- avião grande de lado, com o piloto na janela da cabine ---------- */
export const BigJet: React.FC<{p: V3; s?: number; children?: React.ReactNode}> = ({p, s = 1, children}) => {
  const white = sm("#f4f6f8", 0.4);
  const blue = sm("#2e6fd8", 0.4);
  return (
    <group position={p} scale={s}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={white} castShadow>
        <capsuleGeometry args={[0.9, 6.5, 10, 24]} />
      </mesh>
      <mesh position={[0, -0.3, 0.02]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.005, 1.01]} material={blue}>
        <capsuleGeometry args={[0.9, 6.5, 10, 24, ]} />
      </mesh>
      {/* janelinhas */}
      {Array.from({length: 10}, (_, i) => (
        <mesh key={i} position={[-2.6 + i * 0.5, 0.25, 0.86]} material={sm("#20304a", 0.2)}>
          <circleGeometry args={[0.11, 12]} />
        </mesh>
      ))}
      {/* cabine com vidro grande (piloto aparece) */}
      <mesh position={[3.65, 0.35, 0.55]} rotation={[0, 0.9, 0]} material={sm("#bfe6ff", 0.05, {transparent: true, opacity: 0.35})}>
        <planeGeometry args={[0.9, 0.55]} />
      </mesh>
      {children}
      {/* asa e cauda */}
      <mesh position={[0.2, -0.35, 1.2]} rotation={[0, -0.35, 0]} geometry={rbox(1.6, 0.1, 3.0, 0.03)} material={white} castShadow />
      <mesh position={[-3.9, 1.2, 0]} rotation={[0, 0, 0.4]} geometry={rbox(1.2, 1.7, 0.12, 0.03)} material={blue} castShadow />
      <mesh position={[0.6, -0.95, 1.2]} rotation={[0, 0, Math.PI / 2]} material={sm("#c9ced6", 0.4)}>
        <cylinderGeometry args={[0.35, 0.3, 1.2, 14]} />
      </mesh>
    </group>
  );
};
/** céu com nuvens fofas (cenário do avião) */
export const SkyClouds: React.FC<{x: number}> = ({x}) => {
  const r = rng(21);
  const cl = Array.from({length: 18}, () => [(r() - 0.5) * 60, -2 - r() * 4, -6 - r() * 14, 1 + r() * 1.5] as [number, number, number, number]);
  return (
    <group>
      <Bg c={"#7fc8ff"} />
      {cl.map(([cx, cy, cz, cs], i) => {
        const xx = ((((cx - x * 0.6) % 60) + 90) % 60) - 30 + x;
        return (
          <group key={i} position={[xx, cy, cz]} scale={cs}>
            {[[-0.6, 0, 0, 0.7], [0, 0.25, 0, 0.9], [0.65, 0, 0, 0.7]].map(([a, b, c, rr], k) => (
              <mesh key={k} position={[a, b, c]} material={sm("#ffffff", 0.8)}>
                <icosahedronGeometry args={[rr, 1]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/* ---------- escritório do pai ---------- */
const plaqTex = () =>
  canvasTex("plaq-chefe", 256, 64, (c) => {
    c.fillStyle = "#3a2a1a";
    c.fillRect(0, 0, 256, 64);
    c.fillStyle = "#ffd21f";
    c.font = "bold 40px sans-serif";
    c.textAlign = "center";
    c.fillText("CHEFE", 128, 47);
  });
export const Office: React.FC = () => (
  <group>
    <Bg c={"#cfe8ff"} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a6a8a", 0.95)} receiveShadow>
      <planeGeometry args={[14, 14]} />
    </mesh>
    <mesh position={[0, 2.5, -2.6]} material={sm("#e9eef2", 0.9)} receiveShadow>
      <boxGeometry args={[10, 5, 0.2]} />
    </mesh>
    {/* janela com prédios */}
    <mesh position={[0, 2.5, -2.48]} material={sm("#9fd8ff", 0.4, {emissive: "#9fd8ff", emissiveIntensity: 0.25})}>
      <planeGeometry args={[3.4, 1.8]} />
    </mesh>
    {[-1.2, -0.4, 0.5, 1.3].map((x, i) => (
      <mesh key={x} position={[x, 1.9 + (i % 2) * 0.25, -2.46]} material={sm("#6b7b9a", 0.6)}>
        <planeGeometry args={[0.6, 1.0 + (i % 2) * 0.5]} />
      </mesh>
    ))}
    {/* mesa do chefe */}
    <group position={[0, 0, -0.4]}>
      <mesh position={[0, 0.78, 0]} geometry={rbox(2.4, 0.1, 1.1, 0.03)} material={sm("#6b4a2a", 0.5)} castShadow receiveShadow />
      <mesh position={[0, 0.4, 0.4]} geometry={rbox(2.3, 0.75, 0.08, 0.02)} material={sm("#5a3a20", 0.6)} castShadow />
      <mesh position={[0, 0.91, 0.42]} rotation={[-0.3, 0, 0]} material={tm("plaq-chefe", plaqTex(), 0.4)}>
        <planeGeometry args={[0.7, 0.17]} />
      </mesh>
      {/* computador */}
      <mesh position={[-0.75, 1.15, -0.2]} geometry={rbox(0.7, 0.45, 0.05, 0.02)} material={sm("#1d1f27", 0.3)} />
      <mesh position={[-0.75, 1.15, -0.17]} material={sm("#3fb6ff", 0.3, {emissive: "#3fb6ff", emissiveIntensity: 0.5})}>
        <planeGeometry args={[0.62, 0.37]} />
      </mesh>
      {/* pilha de papel */}
      <mesh position={[0.8, 0.95, -0.1]} geometry={rbox(0.32, 0.22, 0.42, 0.01)} material={sm("#ffffff", 0.7)} />
    </group>
    {/* cadeirão */}
    <mesh position={[0, 1.2, -1.3]} geometry={rbox(1.0, 1.4, 0.2, 0.08)} material={sm("#1d1f27", 0.5)} castShadow />
    {/* plantinha */}
    <group position={[2.6, 0, -1.8]}>
      <mesh position={[0, 0.3, 0]} material={sm("#e8414f", 0.6)}>
        <cylinderGeometry args={[0.3, 0.24, 0.6, 12]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={sm("#3f9a35", 0.8)}>
        <icosahedronGeometry args={[0.5, 0]} />
      </mesh>
    </group>
  </group>
);
/** gravata (vai no headExtra, embaixo do queixo) */
export const NeckTie: React.FC<{color?: string}> = ({color = "#e8262d"}) => (
  <group position={[0, -0.42, 0.24]}>
    <mesh geometry={rbox(0.08, 0.06, 0.04, 0.01)} material={sm(color, 0.5)} />
    <mesh position={[0, -0.17, 0.0]} rotation={[0.08, 0, 0]} scale={[1, 1, 0.4]} material={sm(color, 0.5)}>
      <coneGeometry args={[0.07, 0.3, 4]} />
    </mesh>
  </group>
);

/* ---------- galinha (normal) e ovo ---------- */
export const Hen: React.FC<{p: V3; rotY?: number; s?: number; t?: number; blink?: number; stare?: number; jump?: number}> = ({p, rotY = 0, s = 1, t = 0, blink = 0, stare = 0, jump = 0}) => {
  const white = sm("#f4efe6", 0.7);
  const red = sm("#e8262d", 0.5);
  const yel = sm("#f2a32b", 0.5);
  const eyeY = Math.max(0.1, 1 - blink) * (1 + stare * 0.5);
  return (
    <group position={[p[0], p[1] + jump * 0.25, p[2]]} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.42, 0]} scale={[0.26, 0.24, 0.32]} material={white} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      <mesh position={[0, 0.5, -0.32]} rotation={[0.8, 0, 0]} scale={[0.14, 0.22, 0.08]} material={white} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.24 * sd, 0.44, -0.02]} scale={[0.05, 0.15, 0.22]} material={sm("#e9e2d4", 0.7)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.72, 0.22]}>
        <mesh scale={[0.14, 0.15, 0.14]} material={white} castShadow>
          <sphereGeometry args={[1, 14, 12]} />
        </mesh>
        {[-0.04, 0.0, 0.04].map((z, i) => (
          <mesh key={i} position={[0, 0.15, z]} material={red}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        ))}
        <mesh position={[0, -0.02, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={yel}>
          <coneGeometry args={[0.035, 0.09, 6]} />
        </mesh>
        <mesh position={[0, -0.09, 0.11]} scale={[0.03, 0.05, 0.02]} material={red}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.075 * sd, 0.03, 0.1]}>
            <mesh scale={[0.032, 0.032 * eyeY, 0.02]} material={sm("#ffffff", 0.3)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0, 0, 0.016]} scale={[0.016, 0.016 * eyeY, 0.01]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
      </group>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.11, 0.02]} material={yel}>
          <cylinderGeometry args={[0.014, 0.014, 0.22, 6]} />
        </mesh>
      ))}
    </group>
  );
};
export const Egg: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <mesh position={p} scale={[0.07 * s, 0.09 * s, 0.07 * s]} material={sm("#f6ead6", 0.5)} castShadow>
    <sphereGeometry args={[1, 14, 12]} />
  </mesh>
);
/** quintal com cerca e grama */
export const Yard: React.FC = () => (
  <group>
    <Bg c={"#9fd8ff"} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
      <planeGeometry args={[40, 40]} />
    </mesh>
    {Array.from({length: 16}, (_, i) => (
      <mesh key={i} position={[-4 + i * 0.52, 0.55, -2.4]} material={sm("#f2efe6", 0.7)} castShadow>
        <boxGeometry args={[0.14, 1.1, 0.06]} />
      </mesh>
    ))}
    <mesh position={[0, 0.8, -2.42]} material={sm("#f2efe6", 0.7)}>
      <boxGeometry args={[8.4, 0.08, 0.05]} />
    </mesh>
  </group>
);

/* ---------- cabelo antena de rádio (vai no headExtra) ---------- */
export const HairAntenna: React.FC<{k: number; t: number}> = ({k, t}) => (
  <group position={[0, 0.3, 0]}>
    <mesh position={[0, 0.25 * k, 0]} scale={[1, k, 1]} material={sm("#2a170d", 0.5)}>
      <cylinderGeometry args={[0.015, 0.025, 0.5, 6]} />
    </mesh>
    <mesh position={[0, 0.5 * k + 0.03, 0]} scale={k} material={sm("#e8262d", 0.3, {emissive: "#e8262d", emissiveIntensity: 0.6 + 0.6 * Math.max(0, Math.sin(t * 8))})}>
      <sphereGeometry args={[0.05, 10, 8]} />
    </mesh>
    {k > 0.9 &&
      [0, 1, 2].map((i) => {
        const q = (t * 0.8 + i / 3) % 1;
        return (
          <mesh key={i} position={[0, 0.53, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.1 + q * 0.5}>
            <torusGeometry args={[1, 0.05, 6, 28]} />
            <meshStandardMaterial color="#3fb6ff" emissive="#3fb6ff" emissiveIntensity={0.8} transparent opacity={(1 - q) * 0.8} depthWrite={false} />
          </mesh>
        );
      })}
  </group>
);
/** nota musical 3D */
export const Note: React.FC<{p: V3; s?: number; color?: string}> = ({p, s = 1, color = "#101018"}) => (
  <group position={p} scale={s}>
    <mesh scale={[1.2, 0.9, 0.6]} rotation={[0, 0, 0.4]} material={sm(color, 0.3)}>
      <sphereGeometry args={[0.05, 10, 8]} />
    </mesh>
    <mesh position={[0.05, 0.12, 0]} material={sm(color, 0.3)}>
      <boxGeometry args={[0.014, 0.24, 0.014]} />
    </mesh>
    <mesh position={[0.09, 0.22, 0]} rotation={[0, 0, -0.6]} material={sm(color, 0.3)}>
      <boxGeometry args={[0.08, 0.025, 0.014]} />
    </mesh>
  </group>
);

/* ---------- praça (piso, chafariz, bancos) ---------- */
export const Square: React.FC = () => (
  <group>
    <Bg c={"#9fd8ff"} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={tm("piso-praca", pracaTex(), 0.8)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    <group position={[0, 0, -6]}>
      <mesh position={[0, 0.3, 0]} material={sm("#d9d4c8", 0.7)}>
        <cylinderGeometry args={[1.8, 1.9, 0.6, 28]} />
      </mesh>
      <mesh position={[0, 0.58, 0]} material={sm("#4aa8d8", 0.2)}>
        <cylinderGeometry args={[1.6, 1.6, 0.04, 28]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={sm("#d9d4c8", 0.7)}>
        <cylinderGeometry args={[0.15, 0.2, 1.0, 12]} />
      </mesh>
    </group>
    {[-4.5, 4.5].map((x) => (
      <group key={x} position={[x, 0, -3]} rotation={[0, x < 0 ? 0.5 : -0.5, 0]}>
        <mesh position={[0, 0.45, 0]} geometry={rbox(1.6, 0.08, 0.5, 0.02)} material={sm("#8a5a33", 0.6)} castShadow />
        <mesh position={[0, 0.75, -0.22]} geometry={rbox(1.6, 0.5, 0.06, 0.02)} material={sm("#8a5a33", 0.6)} castShadow />
        {[-0.7, 0.7].map((dx) => (
          <mesh key={dx} position={[dx, 0.22, 0]} material={sm("#2a2d33", 0.5)}>
            <boxGeometry args={[0.06, 0.44, 0.4]} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);
const pracaTex = () =>
  canvasTex("piso-praca", 256, 256, (c) => {
    c.fillStyle = "#e3dccb";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#c9bfa8";
    c.lineWidth = 4;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 32, 0);
      c.lineTo(i * 32, 256);
      c.moveTo(0, i * 32);
      c.lineTo(256, i * 32);
      c.stroke();
    }
  }, [12, 12]);

/* ---------- quarto com cama ---------- */
export const BedroomC: React.FC<{night?: boolean}> = ({night = false}) => (
  <group>
    <Bg c={night ? "#1a2244" : "#9fd8ff"} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c8874a", 0.7)} receiveShadow>
      <planeGeometry args={[14, 14]} />
    </mesh>
    <mesh position={[0, 2.5, -2.6]} material={sm("#a8d8f0", 0.9)} receiveShadow>
      <boxGeometry args={[10, 5, 0.2]} />
    </mesh>
    {/* cama */}
    <group position={[0, 0, -0.8]}>
      <mesh position={[0, 0.3, 0]} geometry={rbox(1.6, 0.4, 2.6, 0.06)} material={sm("#8a5a33", 0.6)} castShadow receiveShadow />
      <mesh position={[0, 0.58, 0]} geometry={rbox(1.5, 0.2, 2.5, 0.08)} material={sm("#ffffff", 0.8)} castShadow />
      <mesh position={[0, 0.72, -0.95]} geometry={rbox(1.0, 0.18, 0.45, 0.08)} material={sm("#fff4c8", 0.8)} castShadow />
      <mesh position={[0, 1.0, -1.3]} geometry={rbox(1.6, 1.4, 0.12, 0.04)} material={sm("#8a5a33", 0.6)} castShadow />
      <mesh position={[0, 0.7, 0.35]} geometry={rbox(1.56, 0.12, 1.7, 0.05)} material={sm("#ff7b54", 0.8)} castShadow />
    </group>
  </group>
);
/** fita adesiva nos olhos (headExtra) — peel 0 = colada, 1 = arrancada pra cima */
export const EyeTape: React.FC<{peel: number}> = ({peel}) => (
  <group>
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.11 * sd, 0.04 + peel * 0.18, 0.29 - peel * 0.02]} rotation={[-peel * 1.2, 0, sd * 0.15 + peel * sd * 0.6]}>
        <mesh material={sm("#d8c8a0", 0.6, {transparent: true, opacity: 0.92})}>
          <boxGeometry args={[0.15, 0.06, 0.008]} />
        </mesh>
      </group>
    ))}
  </group>
);

/* ---------- mesa do jantar com prato de purê ---------- */
export const DinnerPlate: React.FC<{p: V3; splat?: number}> = ({p, splat = 0}) => (
  <group position={p}>
    <mesh material={sm("#ffffff", 0.3)} castShadow>
      <cylinderGeometry args={[0.32, 0.26, 0.04, 24]} />
    </mesh>
    <mesh position={[0, 0.05, 0]} scale={[1 + splat * 0.6, 1 - splat * 0.6, 1 + splat * 0.6]} material={sm("#f6dc8a", 0.7)}>
      <sphereGeometry args={[0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    {splat > 0.3 &&
      Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.38 * splat, 0.04 + 0.2 * splat * Math.sin(splat * Math.PI), Math.sin(a) * 0.38 * splat]} material={sm("#f6dc8a", 0.7)}>
            <sphereGeometry args={[0.035, 8, 6]} />
          </mesh>
        );
      })}
  </group>
);

/* ---------- garrafa térmica gigante ---------- */
export const Thermos: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.3, 0]} material={sm("#e8262d", 0.35, {metalness: 0.2})} castShadow>
      <cylinderGeometry args={[0.12, 0.12, 0.6, 20]} />
    </mesh>
    <mesh position={[0, 0.64, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.6})}>
      <cylinderGeometry args={[0.09, 0.12, 0.1, 20]} />
    </mesh>
    <mesh position={[0, 0.74, 0]} material={sm("#1d1f27", 0.4)}>
      <cylinderGeometry args={[0.08, 0.09, 0.1, 16]} />
    </mesh>
    <mesh position={[0, 0.3, 0.121]} material={sm("#ffffff", 0.5)}>
      <boxGeometry args={[0.16, 0.05, 0.005]} />
    </mesh>
    <mesh position={[0.15, 0.35, 0]} rotation={[0, 0, 0]} material={sm("#1d1f27", 0.4)}>
      <torusGeometry args={[0.08, 0.018, 6, 14, Math.PI]} />
    </mesh>
  </group>
);
