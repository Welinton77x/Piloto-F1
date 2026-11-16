import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Objetos do vídeo "Vai dar banho no cachorro sozinho pela primeira vez?" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const label = (key: string, text: string, bg: string, fg: string, size = 48, w = 512, h = 96) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = "center";
    c.fillText(text, w / 2, h / 2 + size * 0.35);
  });

/* ---------- balde, esponja e frasco de shampoo ---------- */
export const Bucket: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.12, 0]} material={sm("#2e86de", 0.5)} castShadow>
      <cylinderGeometry args={[0.14, 0.11, 0.24, 18, 1, true]} />
    </mesh>
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#2e86de", 0.5)}>
      <circleGeometry args={[0.11, 18]} />
    </mesh>
    <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fd0ff", 0.2)}>
      <circleGeometry args={[0.13, 18]} />
    </mesh>
    <mesh position={[0, 0.24, 0]} rotation={[0, 0, 0]} material={sm("#3a3f4a", 0.4)}>
      <torusGeometry args={[0.14, 0.008, 6, 18, Math.PI]} />
    </mesh>
  </group>
);
export const ShampooBottle: React.FC<{p?: V3; r?: V3; s?: number; empty?: boolean}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, empty = false}) => (
  <group position={p} rotation={r} scale={[s * (empty ? 0.75 : 1), s, s]}>
    <mesh position={[0, 0.12, 0]} geometry={rbox(0.12, 0.24, 0.07, 0.03)} material={sm("#ff8fc8", 0.4)} castShadow />
    <mesh position={[0, 0.27, 0]} material={sm("#ffffff", 0.4)}>
      <cylinderGeometry args={[0.025, 0.03, 0.06, 10]} />
    </mesh>
    <mesh position={[0, 0.12, 0.036]} material={sm("#ffffff", 0.5)}>
      <planeGeometry args={[0.09, 0.08]} />
    </mesh>
  </group>
);
/** toalha cheia de pelo */
export const HairyTowel: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const rr = rng(13);
  const hairs = Array.from({length: 40}, () => [(rr() - 0.5) * 0.7, (rr() - 0.5) * 0.45, rr() * 3] as V3);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh material={sm("#7fc8ff", 0.9, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.8, 0.5, 6, 4]} />
      </mesh>
      {hairs.map(([x, y, a], i) => (
        <mesh key={i} position={[x, y, 0.01]} rotation={[0, 0, a]} material={sm("#c98a4a", 0.8)}>
          <boxGeometry args={[0.06, 0.008, 0.004]} />
        </mesh>
      ))}
    </group>
  );
};
/** escovinha de pelo (pequena) */
export const TinyBrush: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.08, 0]} material={sm("#c8874a", 0.6)}>
      <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
    </mesh>
    <mesh position={[0, 0.18, 0]} geometry={rbox(0.06, 0.05, 0.03, 0.01)} material={sm("#e8414f", 0.5)} />
  </group>
);
/** passaporte */
export const Passport: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.14, 0.2, 0.015, 0.01)} material={sm("#1f3f8a", 0.5)} />
    <mesh position={[0, 0.02, 0.009]} material={sm("#e3b33b", 0.4, {metalness: 0.5})}>
      <circleGeometry args={[0.035, 12]} />
    </mesh>
  </group>
);
/** laço de pet shop (vai na cabeça do cachorro) */
export const Bow: React.FC<{p?: V3; s?: number; color?: string}> = ({p = [0, 0, 0], s = 1, color = "#ff4d8d"}) => (
  <group position={p} scale={s}>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.07 * sd, 0, 0]} rotation={[0, 0, sd * Math.PI / 2]} scale={[1, 1, 0.5]} material={sm(color, 0.4)}>
        <coneGeometry args={[0.06, 0.12, 4]} />
      </mesh>
    ))}
    <mesh material={sm(color, 0.4)}>
      <sphereGeometry args={[0.035, 10, 8]} />
    </mesh>
  </group>
);
/** mangueira presa na boca do cachorro (bico) */
export const HoseNozzle: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#2ecc71", 0.5)}>
      <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
    </mesh>
    <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffd21f", 0.4)}>
      <cylinderGeometry args={[0.02, 0.035, 0.08, 10]} />
    </mesh>
  </group>
);
/** linhas de cheiro (fedô) subindo */
export const Stink: React.FC<{p: V3; t: number; color?: string}> = ({p, t, color = "#7fbf4a"}) => (
  <group position={p}>
    {[-0.2, 0, 0.2].map((x, i) => {
      const q = (t * 0.6 + i / 3) % 1;
      return (
        <group key={i} position={[x, q * 0.7, 0]} rotation={[0, 0, Math.sin(t * 4 + i) * 0.3]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.03 * (k % 2 ? 1 : -1), k * 0.08, 0]} rotation={[0, 0, k % 2 ? 0.6 : -0.6]} material={sm(color, 0.5, {transparent: true, opacity: 1 - q})}>
              <boxGeometry args={[0.02, 0.1, 0.02]} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);

/* ---------- banheiro com chuveiro pingando ---------- */
export const Bathroom: React.FC<{t: number; cold?: boolean}> = ({t, cold = true}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={tm("piso-banho", ladrilhoTex(), 0.4)} receiveShadow>
      <planeGeometry args={[10, 10]} />
    </mesh>
    <mesh position={[0, 2.5, -2.2]} material={tm("parede-banho", azulejoTex(), 0.5)}>
      <planeGeometry args={[10, 5]} />
    </mesh>
    <group position={[0.3, 2.6, -2.0]}>
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
      </mesh>
      <mesh position={[0, -0.05, 0.32]} rotation={[0.3, 0, 0]} material={sm("#cfd4da", 0.25, {metalness: 0.7})}>
        <cylinderGeometry args={[0.15, 0.1, 0.06, 18]} />
      </mesh>
      {Array.from({length: 6}, (_, i) => {
        const q = (t * 1.2 + i / 6) % 1;
        return (
          <mesh key={i} position={[(i % 3 - 1) * 0.06, -0.1 - q * 1.9, 0.35 + (i % 2) * 0.05]} material={sm(cold ? "#bfe6ff" : "#ffffff", 0.2)}>
            <sphereGeometry args={[0.02, 6, 4]} />
          </mesh>
        );
      })}
    </group>
  </group>
);
const azulejoTex = () =>
  canvasTex("azulejo-banho", 256, 256, (c) => {
    c.fillStyle = "#e9f6fb";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#b8d8e8";
    c.lineWidth = 4;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 32, 0);
      c.lineTo(i * 32, 256);
      c.moveTo(0, i * 32);
      c.lineTo(256, i * 32);
      c.stroke();
    }
  }, [3, 2]);
const ladrilhoTex = () =>
  canvasTex("ladrilho-banho", 128, 128, (c) => {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        c.fillStyle = (i + j) % 2 ? "#ffffff" : "#7fc8ff";
        c.fillRect(i * 32, j * 32, 32, 32);
      }
  }, [6, 6]);

/* ---------- trio elétrico com canhão de espuma ---------- */
export const TrioEletrico: React.FC<{p: V3; rotY?: number; s?: number; t: number}> = ({p, rotY = 0, s = 1, t}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 1.1, 0]} geometry={rbox(2.4, 1.6, 6, 0.08)} material={sm("#9b59b6", 0.4)} castShadow />
    <mesh position={[0, 0.75, 3.4]} geometry={rbox(2.2, 1.2, 1.0, 0.1)} material={sm("#ffd21f", 0.4)} castShadow />
    <mesh position={[0, 1.0, 3.91]} material={sm("#9fd8ff", 0.1)}>
      <planeGeometry args={[1.8, 0.5]} />
    </mesh>
    {[[-0.95, 2.6], [0.95, 2.6], [-0.95, -2.2], [0.95, -2.2]].map(([x, z], i) => (
      <mesh key={i} position={[x + Math.sign(x) * 0.25, 0.35, z]} rotation={[0, 0, Math.PI / 2]} material={sm("#1d1f27", 0.6)}>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
      </mesh>
    ))}
    {/* caixas de som no andar de cima */}
    {[-0.6, 0.6].map((x) =>
      [-2, -0.7, 0.7, 2].map((z) => (
        <group key={x + "" + z} position={[x, 2.35, z]}>
          <mesh geometry={rbox(0.9, 0.9, 1.1, 0.04)} material={sm("#1d1f27", 0.4)} />
          <mesh position={[Math.sign(x) * 0.46, 0, 0]} rotation={[0, Math.sign(x) * Math.PI / 2, 0]} scale={1 + 0.06 * Math.max(0, Math.sin(t * 16))} material={sm("#3a3f4a", 0.3)}>
            <circleGeometry args={[0.3, 16]} />
          </mesh>
        </group>
      )),
    )}
    {/* luzes coloridas */}
    {Array.from({length: 8}, (_, i) => {
      const col = ["#ff4d6d", "#ffd21f", "#2ecc71", "#3fb6ff"][i % 4];
      return (
        <mesh key={i} position={[1.21, 1.6, -2.6 + i * 0.75]} rotation={[0, Math.PI / 2, 0]} material={sm(col, 0.3, {emissive: col, emissiveIntensity: (Math.floor(t * 6) + i) % 2 ? 1.6 : 0.2})}>
          <circleGeometry args={[0.15, 12]} />
        </mesh>
      );
    })}
    <mesh position={[1.22, 0.85, 0]} rotation={[0, Math.PI / 2, 0]} material={tm("faixa-trio", label("faixa-trio", "TRIO DA ESPUMA", "#ffd21f", "#9b2a8a", 46), 0.5)}>
      <planeGeometry args={[4.4, 0.8]} />
    </mesh>
    {/* máquina de espuma no teto (aponta pra fora, lado +x) */}
    <group position={[0.2, 3.25, 1.0]}>
      <mesh geometry={rbox(1.1, 0.9, 1.3, 0.1)} material={sm("#ff4d8d", 0.4)} castShadow />
      <mesh position={[0.56, 0.05, 0]} rotation={[0, Math.PI / 2, 0]} material={tm("maquina-espuma", label("maquina-espuma", "ESPUMA", "#ffffff", "#ff4d8d", 70, 256, 96), 0.5)}>
        <planeGeometry args={[1.0, 0.38]} />
      </mesh>
      <mesh position={[0, 0.05, -0.66]} rotation={[0, Math.PI, 0]} material={tm("maquina-espuma", label("maquina-espuma", "ESPUMA", "#ffffff", "#ff4d8d", 70, 256, 96), 0.5)}>
        <planeGeometry args={[1.0, 0.38]} />
      </mesh>
      <group position={[0.75, 0.75, 0]} rotation={[0, 0, -Math.PI / 2 + 0.35]}>
        <mesh material={sm("#cfd4da", 0.3, {metalness: 0.5})}>
          <cylinderGeometry args={[0.32, 0.22, 1.0, 18]} />
        </mesh>
        <mesh position={[0, 0.52, 0]} material={sm("#1d1f27", 0.4)}>
          <cylinderGeometry args={[0.33, 0.33, 0.06, 18]} />
        </mesh>
      </group>
    </group>
  </group>
);

/* ---------- aeroporto (terminal de Guarulhos) ---------- */
export const Terminal: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8c919b", 0.9)} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-14 + i * 4, 0.01, 2]} material={sm("#ffffff", 0.6)}>
        <planeGeometry args={[2, 0.2]} />
      </mesh>
    ))}
    <mesh position={[0, 2.4, -6]} geometry={rbox(20, 4.8, 4, 0.1)} material={sm("#d9dce2", 0.5)} castShadow receiveShadow />
    <mesh position={[0, 2.6, -3.98]} material={sm("#7fc8ff", 0.1, {metalness: 0.3, emissive: "#7fc8ff", emissiveIntensity: 0.2})}>
      <planeGeometry args={[19, 3]} />
    </mesh>
    <mesh position={[0, 4.4, -3.96]} material={tm("placa-gru", label("placa-gru", "AEROPORTO DE GUARULHOS · GRU", "#1f3f8a", "#ffffff", 40, 1024, 96), 0.5)}>
      <planeGeometry args={[10, 0.95]} />
    </mesh>
    <mesh position={[6.5, 5.5, -5]} material={sm("#d9dce2", 0.5)}>
      <cylinderGeometry args={[0.35, 0.45, 6, 12]} />
    </mesh>
    <mesh position={[6.5, 8.8, -5]} material={sm("#3fb6ff", 0.3, {transparent: true, opacity: 0.8})}>
      <cylinderGeometry args={[1.0, 0.7, 0.8, 12]} />
    </mesh>
  </group>
);

/* ---------- colheitadeira de soja ---------- */
export const Combine: React.FC<{p: V3; rotY?: number; s?: number; t: number}> = ({p, rotY = 0, s = 1, t}) => {
  const green = sm("#2e8a3a", 0.5);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.4, -0.4]} geometry={rbox(2.0, 1.8, 3.2, 0.12)} material={green} castShadow />
      <mesh position={[0, 2.6, 0.5]} geometry={rbox(1.3, 1.0, 1.1, 0.08)} material={green} castShadow />
      <mesh position={[0, 2.65, 1.06]} material={sm("#9fd8ff", 0.1)}>
        <planeGeometry args={[1.1, 0.7]} />
      </mesh>
      <mesh position={[0, 3.25, 0.5]} geometry={rbox(1.5, 0.08, 1.3, 0.03)} material={sm("#ffd21f", 0.4)} />
      {[[-1.05, 0.6, 0.75], [1.05, 0.6, 0.75], [-1.05, -1.4, 0.5], [1.05, -1.4, 0.5]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, r, z]} rotation={[t * 3, 0, Math.PI / 2]} material={sm("#1d1f27", 0.6)}>
          <cylinderGeometry args={[r, r, 0.4, 16]} />
        </mesh>
      ))}
      {/* plataforma de corte com o molinete girando */}
      <mesh position={[0, 0.5, 2.0]} geometry={rbox(3.6, 0.3, 0.9, 0.04)} material={sm("#ffd21f", 0.5)} castShadow />
      <group position={[0, 1.0, 2.2]} rotation={[t * 6, 0, 0]}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <mesh key={k} position={[0, Math.cos((k / 6) * Math.PI * 2) * 0.45, Math.sin((k / 6) * Math.PI * 2) * 0.45]} material={sm("#e8414f", 0.5)}>
            <boxGeometry args={[3.4, 0.05, 0.05]} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#3a3f4a", 0.4)}>
          <cylinderGeometry args={[0.06, 0.06, 3.5, 8]} />
        </mesh>
      </group>
      <mesh position={[1.1, 2.4, -1.0]} rotation={[0, 0, -0.9]} material={green}>
        <cylinderGeometry args={[0.15, 0.15, 2.0, 10]} />
      </mesh>
    </group>
  );
};
/** campo de soja em fileiras */
export const SoyField: React.FC<{c?: V3}> = ({c = [0, 0, -8]}) => (
  <group position={c}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8a6a4a", 0.95)} receiveShadow>
      <planeGeometry args={[40, 30]} />
    </mesh>
    {Array.from({length: 18}, (_, i) => (
      <mesh key={i} position={[-17 + i * 2, 0.25, 0]} material={sm("#5aa83a", 0.8)}>
        <boxGeometry args={[0.8, 0.5, 28]} />
      </mesh>
    ))}
  </group>
);
/** pelo do cachorro em fileiras de plantação (vai por cima do corpo) */
export const FurRows: React.FC<{p: V3; rotY?: number; s?: number}> = ({p, rotY = 0, s = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    {[-0.12, -0.04, 0.04, 0.12].map((x) => (
      <mesh key={x} position={[x, 0.62, -0.05]} material={sm("#3f8a2a", 0.8)}>
        <boxGeometry args={[0.04, 0.05, 0.6]} />
      </mesh>
    ))}
  </group>
);

/* ---------- avião agrícola soltando perfume ---------- */
export const CropDuster: React.FC<{p: V3; rotY?: number; s?: number; t: number; spray?: number}> = ({p, rotY = 0, s = 1, t, spray = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#ffd21f", 0.4)} castShadow>
      <capsuleGeometry args={[0.35, 2.2, 8, 16]} />
    </mesh>
    {[0.25, -0.15].map((y) => (
      <mesh key={y} position={[0.3, y, 0]} geometry={rbox(0.7, 0.06, 4.2, 0.02)} material={sm("#e8414f", 0.4)} castShadow />
    ))}
    {[-1.5, 1.5].map((z) => (
      <mesh key={z} position={[0.3, 0.05, z]} material={sm("#3a3f4a", 0.4)}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
      </mesh>
    ))}
    <mesh position={[-1.4, 0.5, 0]} geometry={rbox(0.5, 0.7, 0.06, 0.02)} material={sm("#e8414f", 0.4)} />
    <mesh position={[-1.35, 0.1, 0]} geometry={rbox(0.4, 0.05, 1.2, 0.02)} material={sm("#e8414f", 0.4)} />
    <mesh position={[0.1, 0.45, 0]} material={sm("#9fd8ff", 0.1, {transparent: true, opacity: 0.6})}>
      <sphereGeometry args={[0.25, 12, 8]} />
    </mesh>
    <group position={[1.55, 0, 0]} rotation={[t * 40, 0, 0]}>
      <mesh material={sm("#1d1f27", 0.4)}>
        <boxGeometry args={[0.05, 1.1, 0.1]} />
      </mesh>
    </group>
    {/* nuvem de perfume rosa saindo da asa */}
    {spray > 0 &&
      Array.from({length: 16}, (_, i) => {
        const q = (t * 0.8 + i / 16) % 1;
        return (
          <mesh key={i} position={[-0.6 - q * 4, -0.3 - q * 1.6, (i % 4 - 1.5) * 0.9]} scale={(0.2 + q * 0.9) * spray}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ff9fd0" transparent opacity={(1 - q) * 0.55} depthWrite={false} />
          </mesh>
        );
      })}
  </group>
);

/* ---------- pet shop ---------- */
export const PetShop: React.FC = () => (
  <group>
    <mesh position={[0, 2, -2.4]} geometry={rbox(6, 4, 1, 0.05)} material={sm("#7fd0e8", 0.7)} castShadow receiveShadow />
    <mesh position={[0, 3.5, -1.88]} material={tm("placa-pet", label("placa-pet", "PET SHOP 🐾", "#ff4d8d", "#ffffff", 54), 0.5)}>
      <planeGeometry args={[3.6, 0.7]} />
    </mesh>
    <mesh position={[-1.4, 1.5, -1.89]} material={sm("#bfe6ff", 0.1, {emissive: "#9fd8ff", emissiveIntensity: 0.3})}>
      <planeGeometry args={[2.0, 1.6]} />
    </mesh>
    <mesh position={[1.4, 1.1, -1.89]} material={sm("#8a5a33", 0.6)}>
      <planeGeometry args={[1.2, 2.2]} />
    </mesh>
    {/* toldo listrado */}
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[-2.6 + i * 0.75, 2.85, -1.6]} rotation={[0.5, 0, 0]} material={sm(i % 2 ? "#ffffff" : "#ff4d8d", 0.6)}>
        <boxGeometry args={[0.75, 0.04, 0.8]} />
      </mesh>
    ))}
  </group>
);
