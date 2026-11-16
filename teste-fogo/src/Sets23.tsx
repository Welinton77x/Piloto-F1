import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";
import {ObjFace} from "./Sets22";

/* ===== Objetos do vídeo "Se você quer pagar um boleto, mas ele está chorando dentro de uma melancia" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- boleto (papel com código de barras e carinha) ---------- */
const boletoTex = () =>
  canvasTex("boleto-papel", 256, 360, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 360);
    c.fillStyle = "#101018";
    c.font = "bold 34px sans-serif";
    c.fillText("BOLETO", 20, 44);
    c.font = "20px sans-serif";
    c.fillText("VENCE HOJE", 20, 74);
    c.fillStyle = "#e8262d";
    c.font = "bold 28px sans-serif";
    c.fillText("R$ 89,90", 20, 108);
    c.fillStyle = "#101018";
    for (let i = 0; i < 40; i++) c.fillRect(20 + i * 5.4, 290, i % 3 ? 2 : 4, 50);
  });
export const Boleto: React.FC<{p?: V3; r?: V3; s?: number; t?: number; cry?: number; mood?: "happy" | "sad" | "sleep" | "scared"}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, t = 0, cry = 0, mood = "sad"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={tm("boleto-papel", boletoTex(), 0.8, {side: THREE.DoubleSide})} castShadow>
      <planeGeometry args={[0.5, 0.7]} />
    </mesh>
    <group position={[0, 0.0, 0.01]} scale={0.8}>
      <ObjFace mood={mood} cry={cry} t={t} mouth={cry > 0 ? 0.6 : 0} />
    </group>
  </group>
);

/* ---------- melancia aberta ---------- */
export const Watermelon: React.FC<{p: V3; s?: number; open?: number; bite?: number}> = ({p, s = 1, open = 1, bite = 0}) => (
  <group position={p} scale={s}>
    {/* metade de baixo */}
    <group scale={[1, 1 - bite, 1]}>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 0.85, 0.85]} material={sm("#2e8a3a", 0.6)} castShadow>
        <sphereGeometry args={[0.55, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.351, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.85, 1]} material={sm("#e8414f", 0.6)}>
        <circleGeometry args={[0.53, 24]} />
      </mesh>
      {Array.from({length: 10}, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.3) * 0.3, 0.355, Math.sin(i * 2.3) * 0.22]} rotation={[-Math.PI / 2, 0, i]} scale={[0.025, 0.04, 1]} material={sm("#101018", 0.5)}>
          <circleGeometry args={[1, 8]} />
        </mesh>
      ))}
    </group>
    {/* tampa (metade de cima) aberta pra trás */}
    {open > 0 && bite < 0.5 && (
      <group position={[0, 0.36, -0.46]} rotation={[-open * 1.4, 0, 0]}>
        <mesh position={[0, 0, 0.46]} scale={[1, 0.85, 0.85]} material={sm("#2e8a3a", 0.6)} castShadow>
          <sphereGeometry args={[0.55, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
    )}
  </group>
);

/* ---------- bode (normal) com luvas de goleiro aposentado ---------- */
export const Goat: React.FC<{p: V3; rotY?: number; s?: number; t?: number; chew?: number; blink?: number; walk?: number; gloves?: boolean; tie?: boolean; stamp?: number}> = ({p, rotY = 0, s = 1, t = 0, chew = 0, blink = 0, walk = 0, gloves = false, tie = false, stamp = 0}) => {
  const fur = sm("#f2ede2", 0.85);
  const dark = sm("#8a6a4a", 0.7);
  const ph = t * 6;
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.75, 0]} scale={[0.32, 0.3, 0.55]} material={fur} castShadow receiveShadow>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      {/* cabeça */}
      <group position={[0, 1.1, 0.55]} rotation={[0.3, 0, 0]}>
        <mesh scale={[0.17, 0.18, 0.26]} material={fur} castShadow>
          <sphereGeometry args={[1, 14, 12]} />
        </mesh>
        {/* barbicha mastigando */}
        <mesh position={[0, -0.2 - 0.02 * Math.abs(Math.sin(t * 14)) * chew, 0.18]} scale={[0.05, 0.1, 0.05]} material={sm("#d9cfbf", 0.9)}>
          <coneGeometry args={[1, 1.4, 6]} />
        </mesh>
        <mesh position={[0, -0.09, 0.24]} scale={[0.06, 0.03 + 0.03 * Math.abs(Math.sin(t * 14)) * chew, 0.03]} material={sm("#3a1510", 0.5)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.12 * sd, 0.05, 0.12]} scale={[0.035, 0.03 * eyeY, 0.02]} material={sm("#f2c25a", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh position={[0.125 * sd, 0.05, 0.135]} scale={[0.022, 0.008 * eyeY, 0.01]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            {/* chifres e orelhas */}
            <mesh position={[0.07 * sd, 0.2, -0.05]} rotation={[-0.6, 0, 0.3 * sd]} material={dark}>
              <coneGeometry args={[0.03, 0.22, 6]} />
            </mesh>
            <mesh position={[0.18 * sd, 0.04, -0.04]} rotation={[0, 0, sd * 1.2]} scale={[0.04, 0.1, 0.03]} material={fur}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
        {tie && (
          <group position={[0, -0.28, -0.05]}>
            <mesh geometry={rbox(0.07, 0.05, 0.04, 0.01)} material={sm("#e8262d", 0.5)} />
            <mesh position={[0, -0.12, 0.0]} scale={[1, 1, 0.4]} material={sm("#e8262d", 0.5)}>
              <coneGeometry args={[0.06, 0.22, 4]} />
            </mesh>
          </group>
        )}
      </group>
      {/* patas */}
      {(
        [
          [0.17, 0.35, 0],
          [-0.17, 0.35, Math.PI],
          [0.17, -0.35, Math.PI],
          [-0.17, -0.35, 0],
        ] as [number, number, number][]
      ).map(([x, z, k], i) => (
        <group key={i} position={[x, 0.55, z]} rotation={[0.5 * Math.sin(ph + k) * walk - (i === 0 ? stamp * 1.2 : 0), 0, 0]}>
          <mesh position={[0, -0.27, 0]} material={fur} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.55, 8]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={sm("#3a3f4a", 0.5)}>
            <cylinderGeometry args={[0.045, 0.045, 0.06, 8]} />
          </mesh>
          {gloves && i < 2 && (
            <mesh position={[0, -0.5, 0.02]} geometry={rbox(0.14, 0.16, 0.12, 0.04)} material={sm("#2ecc71", 0.6)} />
          )}
        </group>
      ))}
      <mesh position={[0, 0.9, -0.55]} rotation={[0.8, 0, 0]} material={fur}>
        <coneGeometry args={[0.05, 0.15, 6]} />
      </mesh>
    </group>
  );
};

/* ---------- carteirinha do CPF ---------- */
const cpfTex = () =>
  canvasTex("cpf-bode", 256, 160, (c) => {
    c.fillStyle = "#cfe8c8";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = "#2e6fd8";
    c.fillRect(0, 0, 256, 34);
    c.fillStyle = "#ffffff";
    c.font = "bold 24px sans-serif";
    c.fillText("CPF", 12, 25);
    c.fillStyle = "#f2ede2";
    c.fillRect(14, 48, 74, 92);
    c.fillStyle = "#8a6a4a";
    c.beginPath();
    c.arc(51, 86, 22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#101018";
    c.font = "bold 20px sans-serif";
    c.fillText("SR. BODE", 100, 72);
    c.font = "16px sans-serif";
    c.fillText("123.456.789-BÉ", 100, 100);
  });
export const CpfCard: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <mesh position={p} rotation={r} scale={s} material={tm("cpf-bode", cpfTex(), 0.4, {side: THREE.DoubleSide})}>
    <planeGeometry args={[0.6, 0.38]} />
  </mesh>
);

/* ---------- agência do banco ---------- */
const bancoTex = () =>
  canvasTex("banco-sertao", 512, 96, (c) => {
    c.fillStyle = "#1f5fbf";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#ffd21f";
    c.font = "bold 50px sans-serif";
    c.textAlign = "center";
    c.fillText("BANCO DO SERTÃO", 256, 66);
  });
const gerenteTex = () =>
  canvasTex("placa-gerente", 256, 64, (c) => {
    c.fillStyle = "#3a2a1a";
    c.fillRect(0, 0, 256, 64);
    c.fillStyle = "#ffd21f";
    c.font = "bold 34px sans-serif";
    c.textAlign = "center";
    c.fillText("GERENTE", 128, 45);
  });
export const BankOffice: React.FC<{sweet?: number}> = ({sweet = 0}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9d4c8", 0.6)} receiveShadow>
      <planeGeometry args={[14, 14]} />
    </mesh>
    <mesh position={[0, 2.5, -2.6]} material={sm("#e9eef2", 0.9)} receiveShadow>
      <boxGeometry args={[10, 5, 0.2]} />
    </mesh>
    <mesh position={[0, 3.6, -2.48]} material={tm("banco-sertao", bancoTex(), 0.5)}>
      <planeGeometry args={[3.6, 0.68]} />
    </mesh>
    {/* mesa do gerente */}
    <group position={[0, 0, -0.6]}>
      <mesh position={[0, 0.78, 0]} geometry={rbox(2.2, 0.1, 1.0, 0.03)} material={sm("#6b4a2a", 0.5)} castShadow receiveShadow />
      <mesh position={[0, 0.4, 0.38]} geometry={rbox(2.1, 0.75, 0.08, 0.02)} material={sm("#5a3a20", 0.6)} castShadow />
      <mesh position={[0, 0.91, 0.4]} rotation={[-0.3, 0, 0]} material={tm("placa-gerente", gerenteTex(), 0.4)}>
        <planeGeometry args={[0.7, 0.17]} />
      </mesh>
      <mesh position={[-0.7, 0.86, -0.1]} geometry={rbox(0.5, 0.06, 0.35, 0.01)} material={sm("#ffffff", 0.7)} />
      <mesh position={[0.75, 1.1, -0.2]} geometry={rbox(0.55, 0.38, 0.05, 0.02)} material={sm("#1d1f27", 0.3)} />
      <mesh position={[0.75, 1.1, -0.17]} material={sm("#3fb6ff", 0.3, {emissive: "#3fb6ff", emissiveIntensity: 0.5})}>
        <planeGeometry args={[0.48, 0.3]} />
      </mesh>
    </group>
    {/* doce escorrendo pelas paredes quando o banco fica "doce" */}
    {sweet > 0.01 &&
      Array.from({length: 9}, (_, i) => (
        <mesh key={i} position={[-4 + i, 4.9 - sweet * 1.2, -2.48]} scale={[0.35, 0.6 + sweet * 1.6 + (i % 3) * 0.3, 1]} material={sm("#c8874a", 0.25, {metalness: 0.1})}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
  </group>
);
/** carimbo */
export const Stamp: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.08, 0]} material={sm("#e8262d", 0.5)}>
      <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
    </mesh>
    <mesh position={[0, 0.0, 0]} material={sm("#1d1f27", 0.5)}>
      <boxGeometry args={[0.14, 0.04, 0.1]} />
    </mesh>
  </group>
);

/* ---------- coqueiro (com carinha quando quer) ---------- */
export const CoconutTree: React.FC<{p: V3; s?: number; face?: boolean; t?: number; lean?: number; mood?: "happy" | "sad" | "sleep" | "scared"}> = ({p, s = 1, face = true, t = 0, lean = 0.12, mood = "happy"}) => (
  <group position={p} scale={s} rotation={[0, 0, lean]}>
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[0, 0.35 + i * 0.55, 0]} material={sm(i % 2 ? "#8a6a4a" : "#7a5a3a", 0.8)} castShadow>
        <cylinderGeometry args={[0.16 - i * 0.012, 0.19 - i * 0.012, 0.56, 10]} />
      </mesh>
    ))}
    <group position={[0, 3.45, 0]}>
      {Array.from({length: 8}, (_, i) => (
        <mesh key={i} rotation={[0.9 + 0.08 * Math.sin(t * 2 + i), (i / 8) * Math.PI * 2, 0]} position={[0, 0, 0]} material={sm(i % 2 ? "#3f9a35" : "#4fae3a", 0.8, {side: THREE.DoubleSide})} castShadow>
          <coneGeometry args={[0.28, 1.6, 4, 1, true]} />
        </mesh>
      ))}
      {[[0.15, -0.15, 0.1], [-0.15, -0.18, 0.05], [0, -0.2, -0.15]].map((q, i) => (
        <mesh key={i} position={q as V3} material={sm("#6b4a2a", 0.7)}>
          <sphereGeometry args={[0.13, 12, 10]} />
        </mesh>
      ))}
    </group>
    {face && (
      <group position={[0, 2.2, 0.17]}>
        <ObjFace s={0.9} mood={mood} t={t} />
      </group>
    )}
  </group>
);

/* ---------- jet ski ---------- */
export const JetSki: React.FC<{p: V3; rotY?: number; s?: number; t?: number}> = ({p, rotY = 0, s = 1, t = 0}) => (
  <group position={[p[0], p[1] + 0.05 * Math.sin(t * 5), p[2]]} rotation={[0.06 * Math.sin(t * 4), rotY, 0]} scale={s}>
    <mesh position={[0, 0.25, 0]} geometry={rbox(0.8, 0.4, 2.0, 0.15)} material={sm("#ffd21f", 0.4)} castShadow />
    <mesh position={[0, 0.25, 1.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]} material={sm("#ffd21f", 0.4)}>
      <coneGeometry args={[0.4, 0.5, 4]} />
    </mesh>
    <mesh position={[0, 0.5, -0.2]} geometry={rbox(0.5, 0.16, 0.9, 0.06)} material={sm("#1d1f27", 0.5)} />
    <mesh position={[0, 0.65, 0.5]} rotation={[0, 0, Math.PI / 2]} material={sm("#1d1f27", 0.5)}>
      <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
    </mesh>
    {[0, 1, 2].map((i) => {
      const q = (t * 2 + i / 3) % 1;
      return (
        <mesh key={i} position={[(i - 1) * 0.3, 0.05, -1.1 - q * 1.6]} rotation={[-Math.PI / 2, 0, 0]} scale={0.25 + q * 0.4}>
          <circleGeometry args={[1, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={(1 - q) * 0.7} />
        </mesh>
      );
    })}
  </group>
);
/* ---------- pelicano (normal) ---------- */
export const Pelican: React.FC<{p: V3; rotY?: number; s?: number; t?: number}> = ({p, rotY = 0, s = 1, t = 0}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.35, 0]} scale={[0.22, 0.22, 0.32]} material={sm("#f4f4f0", 0.7)}>
      <sphereGeometry args={[1, 14, 10]} />
    </mesh>
    <mesh position={[0, 0.65, 0.18]} material={sm("#f4f4f0", 0.7)}>
      <cylinderGeometry args={[0.05, 0.07, 0.35, 8]} />
    </mesh>
    <mesh position={[0, 0.85, 0.22]} material={sm("#f4f4f0", 0.7)}>
      <sphereGeometry args={[0.09, 10, 8]} />
    </mesh>
    <mesh position={[0, 0.8, 0.45]} rotation={[Math.PI / 2 + 0.2, 0, 0]} scale={[1, 1, 0.6]} material={sm("#f2a32b", 0.5)}>
      <coneGeometry args={[0.06, 0.42, 8]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.05 * sd, 0.88, 0.28]} material={sm("#101018", 0.3)}>
        <sphereGeometry args={[0.018, 6, 4]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) => (
      <mesh key={"w" + sd} position={[0.2 * sd, 0.4, -0.02]} rotation={[0, 0, sd * (0.2 + 0.15 * Math.sin(t * 6))]} scale={[0.05, 0.16, 0.28]} material={sm("#d9d9d4", 0.7)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    ))}
  </group>
);

/* ---------- rapadura ---------- */
export const Rapadura: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <mesh position={p} rotation={r} scale={s} geometry={rbox(0.32, 0.12, 0.22, 0.03)} material={sm("#8a4a1a", 0.6)} castShadow />
);
/* ---------- rio (água + margens de terra) ---------- */
export const River: React.FC<{t: number}> = ({t}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02 * Math.sin(t * 2), 0]} material={sm("#3a8ab0", 0.25, {metalness: 0.1})} receiveShadow>
      <planeGeometry args={[200, 14]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, sd * 12]} material={sm("#d9b77a", 0.95)}>
        <planeGeometry args={[200, 10]} />
      </mesh>
    ))}
  </group>
);
