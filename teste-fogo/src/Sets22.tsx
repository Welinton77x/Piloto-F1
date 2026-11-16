import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Objetos do vídeo "Se você quer dormir, mas o travesseiro entrou pra uma banda de pagode" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/** carinha (olhos, boca, lágrimas) pra objetos com sentimento — fica na frente (+z) */
export const ObjFace: React.FC<{s?: number; mood?: "happy" | "sad" | "sleep" | "scared"; cry?: number; t?: number; mouth?: number}> = ({s = 1, mood = "happy", cry = 0, t = 0, mouth = 0}) => {
  const eyeH = mood === "sleep" ? 0.01 : mood === "scared" ? 0.06 : 0.045;
  return (
    <group scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.11 * sd, 0.04, 0]}>
          <mesh scale={[0.04, eyeH, 0.015]} material={sm("#101018", 0.3)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          {mood !== "sleep" && (
            <mesh position={[0.012, 0.018, 0.012]} scale={0.012} material={sm("#ffffff", 0.2)}>
              <sphereGeometry args={[1, 6, 4]} />
            </mesh>
          )}
          {mood === "sad" && (
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, -0.35 * sd]} material={sm("#101018", 0.4)}>
              <boxGeometry args={[0.07, 0.014, 0.01]} />
            </mesh>
          )}
          {cry > 0.01 &&
            [0, 1].map((i) => {
              const q = (t * 1.5 + i * 0.5) % 1;
              return (
                <mesh key={i} position={[0.01 * sd, -0.05 - q * 0.3, 0.01]} scale={0.022 * cry} material={sm("#9fe0ff", 0.1, {transparent: true, opacity: 0.85})}>
                  <sphereGeometry args={[1, 8, 6]} />
                </mesh>
              );
            })}
        </group>
      ))}
      <mesh position={[0, -0.07, 0]} scale={[0.06, 0.02 + mouth * 0.04, 0.012]} material={sm("#3a1510", 0.4)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      {mood !== "sad" && mouth < 0.1 && (
        <mesh position={[0, -0.06, 0.004]} rotation={[0, 0, Math.PI]} material={sm("#3a1510", 0.4)}>
          <torusGeometry args={[0.045, 0.01, 6, 14, Math.PI]} />
        </mesh>
      )}
      {[-1, 1].map((sd) => (
        <mesh key={"b" + sd} position={[0.18 * sd, -0.03, -0.004]} scale={[0.035, 0.022, 0.01]} material={sm("#f3a0a6", 0.6)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- travesseiro com carinha ---------- */
export const Pillow: React.FC<{p: V3; r?: V3; s?: number; t?: number; mood?: "happy" | "sad" | "sleep" | "scared"; cry?: number; mouth?: number; bounce?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, mood = "happy", cry = 0, mouth = 0, bounce = 0}) => (
  <group position={[p[0], p[1] + Math.abs(Math.sin(t * 6)) * 0.06 * bounce, p[2]]} rotation={r} scale={s}>
    <mesh geometry={rbox(0.75, 0.48, 0.24, 0.12)} material={sm("#fff4c8", 0.8)} castShadow />
    <group position={[0, 0.02, 0.125]}>
      <ObjFace s={0.9} mood={mood} cry={cry} t={t} mouth={mouth} />
    </group>
  </group>
);
/* ---------- colchão com carinha ---------- */
export const Mattress: React.FC<{p: V3; r?: V3; s?: number; t?: number; mood?: "happy" | "sad" | "sleep" | "scared"; mouth?: number; faceTop?: boolean}> = ({p, r = [0, 0, 0], s = 1, t = 0, mood = "happy", mouth = 0, faceTop = false}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(1.4, 0.3, 2.2, 0.1)} material={sm("#f2f2ee", 0.8)} castShadow />
    {[-0.7, -0.35, 0, 0.35, 0.7].map((z) => (
      <mesh key={z} position={[0, 0.152, z]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#d6e6f2", 0.8)}>
        <circleGeometry args={[0.03, 8]} />
      </mesh>
    ))}
    <mesh position={[0, 0, 0]} material={sm("#7fb0d8", 0.8)}>
      <boxGeometry args={[1.41, 0.06, 2.21]} />
    </mesh>
    {faceTop ? (
      <group position={[0, 0.16, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ObjFace s={2.2} mood={mood} t={t} mouth={mouth} />
      </group>
    ) : (
      <group position={[0, 0.02, 1.105]}>
        <ObjFace s={1.2} mood={mood} t={t} mouth={mouth} />
      </group>
    )}
  </group>
);

/* ---------- palco do pagode + cavaquinho ---------- */
export const Cavaquinho: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1, 1.15, 0.45]} material={sm("#c8874a", 0.5)}>
      <sphereGeometry args={[0.09, 14, 10]} />
    </mesh>
    <mesh position={[0, 0.0, 0.042]} material={sm("#3a2410", 0.5)}>
      <circleGeometry args={[0.025, 10]} />
    </mesh>
    <mesh position={[0, 0.2, 0]} material={sm("#5a3a20", 0.5)}>
      <boxGeometry args={[0.03, 0.26, 0.02]} />
    </mesh>
  </group>
);
const pagodeTex = () =>
  canvasTex("faixa-pagode", 512, 96, (c) => {
    c.fillStyle = "#2a1450";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#ffd21f";
    c.font = "bold 54px sans-serif";
    c.textAlign = "center";
    c.fillText("PAGODE DO FAROL", 256, 68);
  });
export const PagodeStage: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    <mesh position={[0, 0.25, 0]} geometry={rbox(5, 0.5, 2.6, 0.04)} material={sm("#3a2a1a", 0.6)} receiveShadow castShadow />
    <mesh position={[0, 2.2, -1.2]} material={sm("#1a1240", 0.8)}>
      <planeGeometry args={[5, 3.6]} />
    </mesh>
    <mesh position={[0, 3.6, -1.15]} material={tm("faixa-pagode", pagodeTex(), 0.6)}>
      <planeGeometry args={[4.4, 0.8]} />
    </mesh>
    {Array.from({length: 7}, (_, i) => {
      const on = (Math.floor(t * 4) + i) % 3 === 0;
      const col = ["#ff4d6d", "#ffd21f", "#2ecc71", "#3fb6ff"][i % 4];
      return (
        <mesh key={i} position={[-2.1 + i * 0.7, 3.05, -1.1]} material={sm(col, 0.3, {emissive: col, emissiveIntensity: on ? 1.6 : 0.2})}>
          <sphereGeometry args={[0.1, 10, 8]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- mesa de DJ (o jacaré fica atrás) ---------- */
export const DJDesk: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    <mesh position={[0, 0.45, 0]} geometry={rbox(1.6, 0.9, 0.7, 0.04)} material={sm("#1d1f27", 0.4)} castShadow />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.45 * sd, 0.92, 0]}>
        <mesh material={sm("#2a2d33", 0.4)}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
        </mesh>
        <mesh position={[0, 0.025, 0]} rotation={[0, t * 6 * sd, 0]} material={sm("#101018", 0.3)}>
          <cylinderGeometry args={[0.19, 0.19, 0.01, 24]} />
        </mesh>
        <mesh position={[0.05, 0.035, 0]} rotation={[0, t * 6 * sd, 0]} material={sm("#e8262d", 0.4)}>
          <boxGeometry args={[0.08, 0.005, 0.04]} />
        </mesh>
      </group>
    ))}
    {Array.from({length: 6}, (_, i) => {
      const on = (Math.floor(t * 8) + i) % 2 === 0;
      const col = ["#ff4d6d", "#3fb6ff", "#2ecc71"][i % 3];
      return (
        <mesh key={i} position={[-0.5 + i * 0.2, 0.6, 0.36]} material={sm(col, 0.3, {emissive: col, emissiveIntensity: on ? 1.8 : 0.1})}>
          <boxGeometry args={[0.12, 0.08, 0.01]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- casarões coloridos do Pelourinho numa ladeira ---------- */
const PELO = ["#f4a6c8", "#7fd0e8", "#ffd166", "#9be08a", "#f08a5d", "#c3a6f4", "#ffffff", "#7fb0f0"];
export const Pelourinho: React.FC<{slope?: number; snow?: number}> = ({slope = 0.18, snow = 0}) => (
  <group>
    {/* ladeira de pedra */}
    <mesh rotation={[-Math.PI / 2 + slope, 0, 0]} position={[0, 0, -6]} material={sm(snow > 0.5 ? "#f7f9fc" : "#b8aa98", 0.95)} receiveShadow>
      <planeGeometry args={[7, 30]} />
    </mesh>
    {[-1, 1].map((sd) =>
      Array.from({length: 7}, (_, i) => {
        const z = 4 - i * 3.2;
        const y = (4 - z) * Math.tan(slope) * 0.98;
        const col = PELO[(i * 3 + (sd > 0 ? 1 : 0)) % PELO.length];
        return (
          <group key={sd + "" + i} position={[3.9 * sd, y, z]} rotation={[0, -sd * Math.PI / 2, 0]}>
            <mesh position={[0, 2.2, 0]} geometry={rbox(3.1, 4.4, 1.2, 0.04)} material={sm(col, 0.8)} castShadow receiveShadow />
            {[-0.9, 0, 0.9].map((x) =>
              [1.3, 3.0].map((wy) => (
                <group key={x + "" + wy} position={[x, wy, 0.61]}>
                  <mesh material={sm("#3a6a4a", 0.6)}>
                    <planeGeometry args={[0.55, 0.9]} />
                  </mesh>
                  <mesh position={[0, 0.5, 0.01]} material={sm("#ffffff", 0.6)}>
                    <planeGeometry args={[0.7, 0.12]} />
                  </mesh>
                </group>
              )),
            )}
            <mesh position={[0, 4.5, 0]} geometry={rbox(3.3, 0.2, 1.4, 0.04)} material={sm("#ffffff", 0.6)} />
          </group>
        );
      }),
    )}
  </group>
);
/** chão da ladeira (altura y em função de z) */
export const peloY = (z: number, slope = 0.18) => (4 - z) * Math.tan(slope) * 0.98;

/* ---------- Farol da Barra ---------- */
export const Lighthouse: React.FC<{p: V3; s?: number; t?: number}> = ({p, s = 1, t = 0}) => (
  <group position={p} scale={s}>
    {/* forte embaixo */}
    <mesh position={[0, 0.6, 0]} geometry={rbox(5, 1.2, 4, 0.05)} material={sm("#e9dcc0", 0.9)} castShadow receiveShadow />
    {/* torre listrada */}
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[0, 1.6 + i * 0.7, 0]} material={sm(i % 2 ? "#101018" : "#ffffff", 0.6)} castShadow>
        <cylinderGeometry args={[0.58 - i * 0.03, 0.6 - i * 0.03, 0.7, 20]} />
      </mesh>
    ))}
    <mesh position={[0, 5.9, 0]} material={sm("#cfefff", 0.1, {emissive: "#fff6c0", emissiveIntensity: 0.8 + 0.6 * Math.max(0, Math.sin(t * 3))})}>
      <cylinderGeometry args={[0.42, 0.42, 0.6, 16]} />
    </mesh>
    <mesh position={[0, 6.4, 0]} material={sm("#e8262d", 0.5)}>
      <coneGeometry args={[0.55, 0.5, 16]} />
    </mesh>
  </group>
);
/* ---------- espuma subindo (enchente de espuma) ---------- */
export const FoamFlood: React.FC<{level: number; w?: number; d?: number; t: number; c?: V3}> = ({level, w = 16, d = 12, t, c = [0, 0, 0]}) => {
  const r = rng(91);
  const blobs = Array.from({length: 70}, () => [(r() - 0.5) * w, (r() - 0.5) * d, 0.5 + r() * 0.8, r() * 6] as [number, number, number, number]);
  if (level < 0.01) return null;
  return (
    <group position={c}>
      {blobs.map(([x, z, rr, ph], i) => (
        <mesh key={i} position={[x, level - rr * 0.5 + 0.08 * Math.sin(t * 2 + ph), z]} scale={rr} material={sm("#ffffff", 0.9)}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- esquis e bastões (pra boneco de turista) ---------- */
export const Skis: React.FC = () => (
  <group>
    {[-0.12, 0.12].map((x) => (
      <mesh key={x} position={[x, 0.02, 0.15]} geometry={rbox(0.1, 0.03, 1.5, 0.015)} material={sm("#e8262d", 0.4)} />
    ))}
  </group>
);

/* ---------- mesa do rodízio de pizza ---------- */
const pizzaTex = () =>
  canvasTex("pizza-top", 128, 128, (c) => {
    c.fillStyle = "#e3a85a";
    c.beginPath();
    c.arc(64, 64, 62, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e8432a";
    c.beginPath();
    c.arc(64, 64, 52, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffe08a";
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.arc(64 + Math.cos(i * 2.3) * 32, 64 + Math.sin(i * 2.3) * 32, 10, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#8a1a1a";
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.arc(64 + Math.cos(i * 1.7 + 1) * 22, 64 + Math.sin(i * 1.7 + 1) * 22, 6, 0, Math.PI * 2);
      c.fill();
    }
  });
export const Pizza: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#cfd4da", 0.3, {metalness: 0.5})}>
      <cylinderGeometry args={[0.3, 0.3, 0.02, 24]} />
    </mesh>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tm("pizza-top", pizzaTex(), 0.6)}>
      <circleGeometry args={[0.28, 24]} />
    </mesh>
  </group>
);
export const Pudim: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#ffffff", 0.3)}>
      <cylinderGeometry args={[0.2, 0.2, 0.02, 18]} />
    </mesh>
    <mesh position={[0, 0.1, 0]} material={sm("#f2c25a", 0.4)}>
      <cylinderGeometry args={[0.1, 0.13, 0.18, 18]} />
    </mesh>
    <mesh position={[0, 0.2, 0]} material={sm("#8a4a1a", 0.3)}>
      <cylinderGeometry args={[0.1, 0.1, 0.02, 18]} />
    </mesh>
  </group>
);
export const RodizioRoom: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c8874a", 0.7)} receiveShadow>
      <planeGeometry args={[14, 14]} />
    </mesh>
    <mesh position={[0, 2.5, -2.6]} material={sm("#e8414f", 0.8)}>
      <boxGeometry args={[10, 5, 0.2]} />
    </mesh>
    {[-2, 2].map((x) => (
      <mesh key={x} position={[x, 2.0, -2.48]} material={sm("#9fd8ff", 0.3, {emissive: "#9fd8ff", emissiveIntensity: 0.3})}>
        <planeGeometry args={[1.4, 1.2]} />
      </mesh>
    ))}
    <mesh position={[0, 3.3, -2.48]} material={tm("faixa-rodizio", rodizioTex(), 0.6)}>
      <planeGeometry args={[3.2, 0.6]} />
    </mesh>
    {/* mesa com toalha xadrez */}
    <mesh position={[0, 0.78, 0]} geometry={rbox(2.2, 0.08, 1.3, 0.03)} material={tm("toalha-xadrez", toalhaTex(), 0.8)} castShadow receiveShadow />
    {[[-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.39, z]} material={sm("#5a3a20", 0.6)}>
        <cylinderGeometry args={[0.04, 0.04, 0.78, 8]} />
      </mesh>
    ))}
  </group>
);
const rodizioTex = () =>
  canvasTex("faixa-rodizio", 512, 96, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#2e8a3a";
    c.font = "bold 50px sans-serif";
    c.textAlign = "center";
    c.fillText("RODÍZIO BH", 256, 66);
  });
const toalhaTex = () =>
  canvasTex("toalha-xadrez", 128, 128, (c) => {
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        c.fillStyle = (i + j) % 2 ? "#ffffff" : "#e8262d";
        c.fillRect(i * 16, j * 16, 16, 16);
      }
  });

/* ---------- helicóptero ---------- */
export const Helicopter: React.FC<{p: V3; rotY?: number; s?: number; t: number}> = ({p, rotY = 0, s = 1, t}) => (
  <group position={p} rotation={[0, rotY, 0.05 * Math.sin(t * 2)]} scale={s}>
    <mesh scale={[1.3, 0.8, 0.8]} material={sm("#2e86de", 0.4)} castShadow>
      <sphereGeometry args={[0.7, 18, 14]} />
    </mesh>
    <mesh position={[0.55, 0.12, 0]} scale={[0.6, 0.55, 0.7]} material={sm("#bfe6ff", 0.1, {transparent: true, opacity: 0.6})}>
      <sphereGeometry args={[0.7, 16, 12]} />
    </mesh>
    <mesh position={[-1.4, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#2e86de", 0.4)}>
      <cylinderGeometry args={[0.1, 0.2, 1.6, 10]} />
    </mesh>
    <mesh position={[-2.15, 0.35, 0]} rotation={[t * 30, 0, 0]} material={sm("#3a3f4a", 0.4)}>
      <boxGeometry args={[0.04, 0.8, 0.08]} />
    </mesh>
    <mesh position={[0, 0.65, 0]} material={sm("#3a3f4a", 0.4)}>
      <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
    </mesh>
    <group position={[0, 0.78, 0]} rotation={[0, t * 25, 0]}>
      {[0, Math.PI / 2].map((a) => (
        <mesh key={a} rotation={[0, a, 0]} material={sm("#1d1f27", 0.4)}>
          <boxGeometry args={[3.4, 0.03, 0.14]} />
        </mesh>
      ))}
    </group>
    {[-0.35, 0.35].map((z) => (
      <mesh key={z} position={[0, -0.72, z]} rotation={[0, 0, Math.PI / 2]} material={sm("#3a3f4a", 0.4)}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
      </mesh>
    ))}
  </group>
);

/* ---------- interior do ônibus ---------- */
export const BusInterior: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a606c", 0.9)} receiveShadow>
      <planeGeometry args={[4, 20]} />
    </mesh>
    {[-1.4, 1.4].map((x) => (
      <group key={x}>
        <mesh position={[x, 1.6, 0]} material={sm("#f2f2ee", 0.8)}>
          <boxGeometry args={[0.1, 3.2, 20]} />
        </mesh>
        {Array.from({length: 6}, (_, i) => (
          <mesh key={i} position={[x * 0.97, 1.75, -6 + i * 2.2]} material={sm("#7fc8ff", 0.3, {emissive: "#9fd8ff", emissiveIntensity: 0.4})}>
            <boxGeometry args={[0.02, 0.9, 1.7]} />
          </mesh>
        ))}
        {Array.from({length: 5}, (_, i) => (
          <group key={"s" + i} position={[x * 0.62, 0, -5 + i * 2.2]}>
            <mesh position={[0, 0.45, 0]} geometry={rbox(0.9, 0.18, 0.7, 0.05)} material={sm("#2e4a8a", 0.7)} />
            <mesh position={[0, 0.9, -0.3]} geometry={rbox(0.9, 0.8, 0.14, 0.05)} material={sm("#2e4a8a", 0.7)} />
          </group>
        ))}
      </group>
    ))}
    <mesh position={[0, 3.2, 0]} material={sm("#e9eef2", 0.8)}>
      <boxGeometry args={[3, 0.1, 20]} />
    </mesh>
    {[-0.5, 0.5].map((x) => (
      <mesh key={x} position={[x, 2.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
        <cylinderGeometry args={[0.025, 0.025, 20, 8]} />
      </mesh>
    ))}
    {[-3, 0.5, 3.5].map((z) => (
      <mesh key={z} position={[0.5, 1.4, z]} material={sm("#ffd21f", 0.3, {metalness: 0.4})}>
        <cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
      </mesh>
    ))}
    {Math.sin(t) > 5 && null}
  </group>
);

/** monóculo (vai na cabeça da capivara, perto do olho) */
export const Monocle: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh material={sm("#e3b33b", 0.3, {metalness: 0.7})}>
      <torusGeometry args={[0.06, 0.01, 8, 18]} />
    </mesh>
    <mesh material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.4})}>
      <circleGeometry args={[0.06, 16]} />
    </mesh>
    <mesh position={[0.02, -0.12, 0]} rotation={[0, 0, 0.3]} material={sm("#e3b33b", 0.3, {metalness: 0.7})}>
      <cylinderGeometry args={[0.004, 0.004, 0.2, 4]} />
    </mesh>
  </group>
);
/** faixa de prefeito (verde e amarela, no peito do boneco — vai no headExtra) */
export const MayorSash: React.FC = () => (
  <group position={[0, -0.7, 0.2]} rotation={[0, 0, 0.7]}>
    <mesh material={sm("#2ecc71", 0.6)}>
      <boxGeometry args={[0.09, 0.8, 0.02]} />
    </mesh>
    <mesh position={[0, 0, 0.012]} material={sm("#ffd21f", 0.6)}>
      <boxGeometry args={[0.03, 0.8, 0.01]} />
    </mesh>
  </group>
);
