import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";

/* ===== Vídeo "Se você quer comer pastel de feira, mas hoje é segunda-feira" ===== */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mc = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = mc.get(key);
  if (!m) mc.set(key, (m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra})));
  return m;
};

/* ---------- pastel ---------- */
export const Pastel: React.FC<{p?: V3; r?: V3; s?: number; frozen?: number; fry?: number; bite?: boolean}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, frozen = 0, fry = 0, bite = false}) => {
  const c = new THREE.Color("#f2c46a").lerp(new THREE.Color("#c98a2a"), fry).lerp(new THREE.Color("#a8d8ff"), frozen);
  const hex = "#" + c.getHexString();
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} material={sm(hex, 0.6, {emissive: frozen > 0.5 ? "#5ab8f0" : "#000000", emissiveIntensity: 0.25 * frozen})} castShadow>
        <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]} material={sm(hex, 0.6)}>
        <circleGeometry args={[0.3, 24, 0, Math.PI]} />
      </mesh>
      {/* bordinha marcada com garfo */}
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 8) * Math.PI;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.29, 0.01, -Math.sin(a) * 0.18]} rotation={[0, a, 0]} material={sm(i % 2 ? hex : "#d8a24a", 0.6)}>
            <boxGeometry args={[0.04, 0.02, 0.015]} />
          </mesh>
        );
      })}
      {frozen > 0.4 &&
        [0, 1, 2].map((i) => (
          <mesh key={"g" + i} position={[-0.15 + i * 0.15, 0.08, -0.05]} rotation={[0, i, 0.4]} material={sm("#e6f7ff", 0.1, {transparent: true, opacity: 0.8})}>
            <octahedronGeometry args={[0.05, 0]} />
          </mesh>
        ))}
      {bite && (
        <mesh position={[0.24, 0.0, -0.05]} material={sm("#fff3d6", 0.7)}>
          <sphereGeometry args={[0.09, 12, 8]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- a girafa pasteleira (frente = +z) ---------- */
const girafaTex = () =>
  canvasTex("girafa-pele", 256, 256, (c, r) => {
    c.fillStyle = "#f3b64a";
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = "#9a5a22";
    for (let i = 0; i < 26; i++) {
      const x = r() * 256;
      const y = r() * 256;
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const rr = 14 + r() * 10;
        c[k ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
    }
  }, [3, 3]);
export type GirafaP = {pos?: V3; rotY?: number; t?: number; blink?: number; mouth?: number; smile?: number; neck?: number; sad?: number; look?: [number, number]; s?: number; walk?: number; headDown?: number};
export const NECK_TOP = (neck = 1) => 2.0 + 3.2 * neck; // altura da base da cabeça (escala 1)
export const Girafa: React.FC<{g: GirafaP; children?: React.ReactNode}> = ({g, children}) => {
  const {pos = [0, 0, 0], rotY = 0, t = 0, blink = 0, mouth = 0, smile = 1, neck = 1, sad = 0, look = [0, 0], s = 1, walk = 0, headDown = 0} = g;
  const skin = tm("girafa-pele", girafaTex(), 0.7);
  const dark = sm("#6a3a14", 0.6);
  const top = NECK_TOP(neck);
  const nz = 0.55 + 0.25 * headDown;
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {/* pernas */}
      {[-1, 1].map((sx) =>
        [-0.45, 0.45].map((z) => {
          const sw = walk * 0.35 * Math.sin(t * 6 + (sx > 0 ? 0 : Math.PI) + (z > 0 ? 0 : Math.PI));
          return (
            <group key={`${sx}${z}`} position={[0.24 * sx, 1.35, z]} rotation={[sw, 0, 0]}>
              <mesh position={[0, -0.65, 0]} material={skin} castShadow>
                <cylinderGeometry args={[0.07, 0.06, 1.3, 10]} />
              </mesh>
              <mesh position={[0, -1.3, 0.02]} material={dark}>
                <cylinderGeometry args={[0.075, 0.08, 0.1, 10]} />
              </mesh>
            </group>
          );
        }),
      )}
      {/* corpo */}
      <mesh position={[0, 1.55, 0]} scale={[0.45, 0.42, 0.75]} material={skin} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={[0, 1.6, -0.78]} rotation={[0.6, 0, 0]} material={skin}>
        <cylinderGeometry args={[0.02, 0.03, 0.6, 6]} />
      </mesh>
      {/* avental branco */}
      <mesh position={[0, 1.55, 0.38]} scale={[0.36, 0.34, 0.25]} material={sm("#ffffff", 0.8)}>
        <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, Math.PI * 0.2, Math.PI * 0.6]} />
      </mesh>
      {/* pescoço comprido */}
      <mesh position={[0, (1.7 + top) / 2, nz / 2 + 0.2]} rotation={[nz * 0.12, 0, 0]} material={skin} castShadow>
        <cylinderGeometry args={[0.13, 0.2, top - 1.6, 14]} />
      </mesh>
      {/* crina */}
      <mesh position={[0, (1.8 + top) / 2, nz / 2 + 0.06]} rotation={[nz * 0.12, 0, 0]} material={dark}>
        <boxGeometry args={[0.04, top - 1.8, 0.05]} />
      </mesh>
      {/* cabeça */}
      <group position={[0, top + 0.1, nz + 0.25]} rotation={[0.25 * headDown, 0, 0]}>
        <mesh scale={[0.24, 0.24, 0.32]} material={skin} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[0, -0.06, 0.3]} scale={[0.17, 0.15, 0.2]} material={sm("#e9a440", 0.6)}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={"n" + sd} position={[0.06 * sd, -0.03, 0.48]} material={dark}>
            <sphereGeometry args={[0.02, 8, 6]} />
          </mesh>
        ))}
        {/* ossicones e orelhas */}
        {[-1, 1].map((sd) => (
          <group key={"o" + sd}>
            <mesh position={[0.08 * sd, 0.3, -0.06]} material={skin}>
              <cylinderGeometry args={[0.025, 0.03, 0.18, 8]} />
            </mesh>
            <mesh position={[0.08 * sd, 0.4, -0.06]} material={dark}>
              <sphereGeometry args={[0.045, 10, 8]} />
            </mesh>
            <mesh position={[0.24 * sd, 0.12, -0.05]} rotation={[0, 0, sd * 1.1]} scale={[0.05, 0.11, 0.03]} material={skin}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          </group>
        ))}
        {/* olhos + óculos redondos */}
        {[-1, 1].map((sd) => (
          <group key={"e" + sd} position={[0.12 * sd, 0.07, 0.24]} rotation={[0, 0.35 * sd, 0]}>
            <group scale={[1, eyeY, 1]}>
              <mesh scale={[0.07, 0.075, 0.035]} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
              <mesh position={[look[0] * 0.02, look[1] * 0.02, 0.03]} scale={[0.04, 0.045, 0.02]} material={sm("#0c0c10", 0.1)}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
            </group>
            <mesh position={[0, 0, 0.04]} material={sm("#2b2e3b", 0.3, {metalness: 0.4})}>
              <torusGeometry args={[0.085, 0.01, 6, 20]} />
            </mesh>
            {sad > 0.01 && <mesh position={[0, 0.1, 0.03]} rotation={[0, 0, -sd * 0.4 * sad]} geometry={rbox(0.1, 0.015, 0.015, 0.006)} material={dark} />}
          </group>
        ))}
        {mouth > 0.05 ? (
          <mesh position={[0, -0.15, 0.42]} scale={[0.07, 0.02 + 0.05 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.13, 0.44]} rotation={[0.3, 0, smile > 0.3 ? Math.PI + 0.5 : 0.5]} material={sm("#3a1510", 0.5)}>
            <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI * 0.62]} />
          </mesh>
        )}
        {/* touca branca */}
        <group position={[0, 0.2, -0.04]}>
          <mesh scale={[1, 0.55, 1]} material={sm("#ffffff", 0.7)}>
            <sphereGeometry args={[0.24, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
        <group position={[0, -0.13, 0.45]}>{children}</group>
      </group>
    </group>
  );
};

/* ---------- placa de calendário "SEGUNDA" ---------- */
const calTex = () =>
  canvasTex("calendario-segunda", 256, 320, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 320);
    c.fillStyle = "#e8262d";
    c.fillRect(0, 0, 256, 80);
    c.fillStyle = "#ffffff";
    c.font = "bold 48px sans-serif";
    c.textAlign = "center";
    c.fillText("SEGUNDA", 128, 56);
    c.fillStyle = "#101018";
    c.font = "bold 170px sans-serif";
    c.fillText("22", 128, 260);
  });
export const Calendar: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(1.0, 1.25, 0.06, 0.04)} material={sm("#d9d9d9", 0.6)} castShadow />
    <mesh position={[0, 0, 0.035]} material={tm("cal", calTex(), 0.6)}>
      <planeGeometry args={[0.94, 1.18]} />
    </mesh>
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.66, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={sm("#8c919b", 0.3, {metalness: 0.6})}>
        <torusGeometry args={[0.05, 0.012, 6, 12]} />
      </mesh>
    ))}
  </group>
);
/** barraca fechada (lona baixada) */
export const ClosedStall: React.FC<{p: V3; rotY?: number; color?: string}> = ({p, rotY = 0, color = "#e8414f"}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    {[-0.9, 0.9].map((x) => (
      <mesh key={x} position={[x, 1.0, 0]} material={sm("#8a8f99", 0.4)}>
        <cylinderGeometry args={[0.03, 0.03, 2.0, 8]} />
      </mesh>
    ))}
    <mesh position={[0, 1.0, 0.02]} material={sm(color, 0.8, {side: THREE.DoubleSide})} castShadow>
      <boxGeometry args={[1.9, 1.9, 0.04]} />
    </mesh>
    <mesh position={[0, 1.0, 0.06]} material={tm("fechado", canvasTex("fechado-placa", 256, 96, (c) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, 256, 96);
      c.fillStyle = "#e8262d";
      c.font = "bold 58px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("FECHADO", 128, 52);
    }), 0.6)}>
      <planeGeometry args={[0.9, 0.34]} />
    </mesh>
  </group>
);

/** plaquinha "FECHADO" de calçada (cavalete pequeno) */
export const ClosedSign: React.FC<{p: V3; rotY?: number; s?: number}> = ({p, rotY = 0, s = 1}) => {
  const face = tm("fechado-cav", canvasTex("fechado-cavalete", 128, 160, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 128, 160);
    c.strokeStyle = "#e8262d";
    c.lineWidth = 10;
    c.strokeRect(6, 6, 116, 148);
    c.fillStyle = "#e8262d";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("FECHADO", 64, 80);
  }), 0.6);
  const wood = sm("#6a4a32", 0.6);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0, 0.34, 0.12 * sd]} rotation={[0.17 * sd, sd > 0 ? 0 : Math.PI, 0]}>
          <mesh geometry={rbox(0.5, 0.68, 0.03, 0.01)} material={wood} castShadow />
          <mesh position={[0, 0.02, 0.017]} material={face}>
            <planeGeometry args={[0.42, 0.56]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ---------- cubo de gelo suando + ventilador ---------- */
export const IceCube: React.FC<{p: V3; t: number; s?: number}> = ({p, t, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.3, 0]} geometry={rbox(0.6, 0.6, 0.6, 0.08)} material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.85, emissive: "#9fd8ff", emissiveIntensity: 0.25})} castShadow />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.12 * sd, 0.4, 0.31]}>
        <mesh scale={[0.05, 0.06, 0.02]} material={sm("#ffffff", 0.2)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.015]} scale={[0.025, 0.03, 0.012]} material={sm("#0c0c10", 0.1)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 0.25, 0.31]} scale={[0.07, 0.03, 0.02]} material={sm("#3a1510", 0.5)}>
      <sphereGeometry args={[1, 10, 8]} />
    </mesh>
    {/* gotas de suor */}
    {[0, 1, 2].map((i) => {
      const q = (t * 0.9 + i / 3) % 1;
      return (
        <mesh key={i} position={[0.32 * (i - 1) * 0.9, 0.55 - q * 0.6, 0.32]} material={sm("#7fd0ff", 0.1, {transparent: true, opacity: 1 - q})}>
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
      );
    })}
    {/* poça */}
    <mesh position={[0, 0.005, 0.15]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#9fd8ff", 0.05, {transparent: true, opacity: 0.6})}>
      <circleGeometry args={[0.55, 24]} />
    </mesh>
  </group>
);
export const Fan: React.FC<{p: V3; rotY?: number; t: number; s?: number}> = ({p, rotY = 0, t, s = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.03, 0]} material={sm("#3a86ff", 0.4)}>
      <cylinderGeometry args={[0.25, 0.28, 0.06, 20]} />
    </mesh>
    <mesh position={[0, 0.45, 0]} material={sm("#3a86ff", 0.4)}>
      <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
    </mesh>
    <group position={[0, 0.9, 0.05]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.3, {metalness: 0.5, wireframe: true})}>
        <cylinderGeometry args={[0.32, 0.32, 0.16, 16, 1, true]} />
      </mesh>
      <group rotation={[0, 0, t * 25]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI * 2]} position={[0, 0, 0]} material={sm("#ffffff", 0.4)}>
            <boxGeometry args={[0.08, 0.5, 0.01]} />
          </mesh>
        ))}
      </group>
    </group>
  </group>
);

/* ---------- estúdio do programa de culinária ---------- */
const cozinhaTVTex = () =>
  canvasTex("cozinha-tv", 1024, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#ff8a1f");
    g.addColorStop(1, "#e8414f");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 512);
    c.font = "bold 130px sans-serif";
    c.textAlign = "center";
    c.lineWidth = 14;
    c.strokeStyle = "#101018";
    c.strokeText("CHEF DA", 512, 210);
    c.strokeText("SEMANA", 512, 350);
    c.fillStyle = "#ffffff";
    c.fillText("CHEF DA", 512, 210);
    c.fillText("SEMANA", 512, 350);
  });
export const CookStudio: React.FC<{desk?: boolean}> = ({desk = true}) => (
  <group>
    <color attach="background" args={["#2a1840"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#e9e2d0", 0.5)} receiveShadow>
      <planeGeometry args={[30, 30]} />
    </mesh>
    <mesh position={[0, 2.6, -3.8]} material={tm("cozinha-tv", cozinhaTVTex(), 0.5, {emissive: "#ffffff", emissiveMap: cozinhaTVTex(), emissiveIntensity: 0.45})}>
      <planeGeometry args={[7, 3.5]} />
    </mesh>
    {/* bancada */}
    <mesh position={[0, 0.45, -1.6]} geometry={rbox(3.2, 0.9, 0.9, 0.05)} material={sm("#ffffff", 0.4)} castShadow receiveShadow />
    <mesh position={[0, 0.92, -1.6]} geometry={rbox(3.3, 0.06, 1.0, 0.02)} material={sm("#2b2e3b", 0.3)} />
    {/* panelas penduradas */}
    {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
      <mesh key={x} position={[x, 2.0, -3.6]} rotation={[Math.PI / 2, 0, 0]} material={sm(["#c9ced6", "#e8414f", "#c9ced6", "#ffd21f"][i], 0.3, {metalness: 0.5})}>
        <cylinderGeometry args={[0.22, 0.2, 0.08, 18]} />
      </mesh>
    ))}
    {/* mesa dos jurados */}
    {desk && <mesh position={[0, 0.45, 2.3]} geometry={rbox(4.0, 0.9, 0.7, 0.05)} material={sm("#1d1f27", 0.4)} castShadow />}
  </group>
);

/* ---------- meteoro de carinha (pegando fogo) ---------- */
export const Meteor: React.FC<{p: V3; t: number; s?: number; mouth?: number; fire?: number; rotY?: number}> = ({p, t, s = 1, mouth = 0, fire = 1, rotY = 0}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh material={sm("#6a5a4a", 0.9)} castShadow>
      <dodecahedronGeometry args={[0.6, 1]} />
    </mesh>
    {[[-0.25, 0.25, 0.45], [0.3, -0.2, 0.45], [0.05, 0.4, 0.35]].map(([x, y, z], i) => (
      <mesh key={i} position={[x, y, z]} scale={[0.12, 0.12, 0.05]} material={sm("#4a3d32", 0.9)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.18 * sd, 0.1, 0.55]}>
        <mesh scale={[0.1, 0.11, 0.04]} material={sm("#ffffff", 0.2)}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.03]} scale={[0.05, 0.06, 0.02]} material={sm("#0c0c10", 0.1)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, -0.18, 0.57]} scale={[0.12, 0.03 + 0.08 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
      <sphereGeometry args={[1, 12, 8]} />
    </mesh>
    {/* rabo de fogo */}
    {fire > 0.01 &&
      Array.from({length: 10}, (_, i) => {
        const q = (t * 2 + i / 10) % 1;
        return (
          <mesh key={"f" + i} position={[0.1 * Math.sin(i * 3), 0.3 + q * 1.2, -0.2 - q * 0.9]} material={sm(i % 2 ? "#ff8a1f" : "#ffd21f", 0.5, {emissive: i % 2 ? "#ff5a1f" : "#ffd21f", emissiveIntensity: 1.5, transparent: true, opacity: (1 - q) * fire})}>
            <sphereGeometry args={[0.35 * (1 - q * 0.6), 10, 8]} />
          </mesh>
        );
      })}
  </group>
);

/* ---------- pato (flutuando) ---------- */
export const Duck: React.FC<{p: V3; r?: V3; s?: number; t?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[0.3, 0.24, 0.4]} material={sm("#ffd84a", 0.5, {emissive: "#ffd84a", emissiveIntensity: 0.25})} castShadow>
      <sphereGeometry args={[1, 18, 12]} />
    </mesh>
    <mesh position={[0, 0.28, 0.25]} material={sm("#ffd84a", 0.5, {emissive: "#ffd84a", emissiveIntensity: 0.25})}>
      <sphereGeometry args={[0.17, 16, 12]} />
    </mesh>
    <mesh position={[0, 0.25, 0.43]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.45]} material={sm("#ff9a1f", 0.5)}>
      <coneGeometry args={[0.08, 0.16, 12]} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.09 * sd, 0.33, 0.37]} material={sm("#0c0c10", 0.1)}>
        <sphereGeometry args={[0.025, 8, 6]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) => (
      <mesh key={"a" + sd} position={[0.28 * sd, 0.03, -0.02]} rotation={[0, 0, sd * (0.3 + 0.4 * Math.sin(t * 8))]} scale={[0.05, 0.16, 0.25]} material={sm("#f5c93a", 0.5, {emissive: "#f5c93a", emissiveIntensity: 0.2})}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    ))}
  </group>
);

/* ---------- boné (espaço da cabeça) ---------- */
export const Cap: React.FC<{color?: string}> = ({color = "#e8414f"}) => (
  <group position={[0, 0.22, 0]} rotation={[-0.12, 0, 0]}>
    <mesh scale={[1.04, 0.6, 1.04]} material={sm(color, 0.6)} castShadow>
      <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.0, 0.36]} rotation={[0.15, 0, 0]} geometry={rbox(0.42, 0.03, 0.28, 0.012)} material={sm(color, 0.6)} />
  </group>
);

/* ---------- fachada de casa à noite com janela (final) ---------- */
export const HouseFront: React.FC<{lit?: boolean}> = ({lit = true}) => (
  <group>
    <color attach="background" args={["#0b1030"]} />
    <mesh position={[0, 2.5, -0.1]} material={sm("#f7a8b8", 0.85)} receiveShadow>
      <boxGeometry args={[8, 5, 0.2]} />
    </mesh>
    <mesh position={[0, 5.2, 0.2]} rotation={[0, 0, 0]} material={sm("#3a6ea5", 0.7)}>
      <boxGeometry args={[8.6, 0.4, 0.9]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]} material={sm("#3a5a2a", 0.9)}>
      <planeGeometry args={[30, 10]} />
    </mesh>
    {/* janela */}
    <group position={[0, 2.4, 0.02]}>
      {[[0, 0.75, 1.9, 0.12], [0, -0.75, 1.9, 0.12], [-0.9, 0, 0.12, 1.6], [0.9, 0, 0.12, 1.6], [0, 0, 0.06, 1.5]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.04]} geometry={rbox(w, h, 0.1, 0.02)} material={sm("#ffffff", 0.5)} />
      ))}
      <mesh position={[0, 0, 0]} material={sm(lit ? "#ffe7a0" : "#1a2050", 0.5, {emissive: lit ? "#ffd36b" : "#000000", emissiveIntensity: lit ? 0.9 : 0})}>
        <planeGeometry args={[1.7, 1.4]} />
      </mesh>
    </group>
    <mesh position={[2.6, 1.0, 0.03]} geometry={rbox(0.9, 2.0, 0.06, 0.03)} material={sm("#7a4a28", 0.6)} />
  </group>
);
export const lerpV = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
