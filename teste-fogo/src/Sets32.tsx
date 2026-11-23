import React from "react";
import {sm, rbox, texMat} from "./Sets9";
import {V3} from "./Sets5";
import {canvasTex} from "./util";

/* ---------- baleia ---------- */
export const Whale: React.FC<{p: V3; rotY?: number; s?: number; t?: number; mouth?: number; blink?: number; spout?: number}> = ({p, rotY = 0, s = 1, t = 0, mouth = 0, blink = 0, spout = 0}) => {
  const blue = sm("#3d6fb6", 0.5);
  const belly = sm("#dfe9f5", 0.6);
  const sway = Math.sin(t * 2) * 0.15;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* corpo */}
      <mesh position={[0, 0.9, 0]} scale={[1.6, 0.9, 0.95]} material={blue} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={[0.15, 0.62, 0]} scale={[1.35, 0.55, 0.8]} material={belly}>
        <sphereGeometry args={[1, 20, 12]} />
      </mesh>
      {/* rabo */}
      <group position={[-1.55, 1.0, 0]} rotation={[0, 0, 0.35 + sway]}>
        <mesh position={[-0.35, 0, 0]} scale={[0.6, 0.35, 0.35]} material={blue}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[-0.85, 0.25, 0.3 * sd]} rotation={[0.5 * sd, 0, 0.6]} scale={[0.45, 0.08, 0.3]} material={blue}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      </group>
      {/* nadadeiras */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.5, 0.45, 0.85 * sd]} rotation={[0.6 * sd, 0.3 * sd, -0.4]} scale={[0.4, 0.07, 0.22]} material={blue}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
      {/* olhos */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[1.15, 1.15, 0.55 * sd]}>
          <mesh scale={[0.16, 0.16 * Math.max(0.1, 1 - blink), 0.16]} material={sm("#ffffff", 0.3)}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[0.08, 0, 0.06 * sd]} scale={[0.08, 0.09 * Math.max(0.1, 1 - blink), 0.08]} material={sm("#101018", 0.3)}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        </group>
      ))}
      {/* boca */}
      <mesh position={[1.42, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.25, 0.75, 0.06 + mouth * 0.2]} material={sm("#2a0f1a", 0.6)}>
        <cylinderGeometry args={[1, 1, 1, 18, 1, false, 0, Math.PI]} />
      </mesh>
      {/* esguicho */}
      {spout > 0 &&
        [0, 1, 2, 3, 4].map((i) => {
          const k = (t * 1.5 + i * 0.2) % 1;
          return (
            <mesh key={i} position={[0.3 + Math.sin(i * 2) * 0.2 * k, 1.8 + k * 1.2 * spout, Math.cos(i * 2) * 0.2 * k]} scale={0.12 * (1 - k * 0.5)} material={sm("#bfe6ff", 0.2, {transparent: true, opacity: 0.8})}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          );
        })}
    </group>
  );
};

/* ---------- pepino ---------- */
export const Pepino: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#3f8a2e", 0.6)}>
      <capsuleGeometry args={[0.07, 0.3, 6, 12]} />
    </mesh>
    {[-0.1, 0, 0.1].map((x, i) => (
      <mesh key={i} position={[x, 0.06, 0.03]} material={sm("#a6d36a", 0.6)}>
        <sphereGeometry args={[0.012, 6, 4]} />
      </mesh>
    ))}
  </group>
);

/* ---------- loja da Vibe ---------- */
const shopSign = () =>
  canvasTex("vibeshop", 1024, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "#5a1a7a");
    g.addColorStop(1, "#9a3aba");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 256);
    c.fillStyle = "#ffffff";
    c.font = "900 120px sans-serif";
    c.textAlign = "center";
    c.fillText("VIBE", 512, 140);
    c.fillStyle = "#ffd21f";
    c.font = "800 56px sans-serif";
    c.fillText("GOURMET AÇAÍ", 512, 215);
  });
export const VibeShop: React.FC<{p: V3; rotY?: number; s?: number}> = ({p, rotY = 0, s = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 1.4, 0]} geometry={rbox(3.4, 2.8, 2.0, 0.06)} material={sm("#f4ecf8", 0.7)} castShadow receiveShadow />
    {/* letreiro */}
    <mesh position={[0, 2.45, 1.02]}>
      <planeGeometry args={[3.0, 0.75]} />
      <meshBasicMaterial map={shopSign()} toneMapped={false} />
    </mesh>
    {/* toldo listrado */}
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[-1.5 + 0.2 + i * 0.37, 1.95, 1.25]} rotation={[0.5, 0, 0]} material={sm(i % 2 ? "#ffffff" : "#8a2aaa", 0.6)}>
        <boxGeometry args={[0.37, 0.04, 0.6]} />
      </mesh>
    ))}
    {/* porta e vitrine */}
    <mesh position={[-0.7, 0.85, 1.01]} geometry={rbox(0.8, 1.6, 0.04, 0.02)} material={sm("#5a2a1a", 0.6)} />
    <mesh position={[0.75, 1.05, 1.01]} geometry={rbox(1.4, 1.0, 0.04, 0.02)} material={sm("#bfe6ff", 0.1, {emissive: "#bfe6ff", emissiveIntensity: 0.3})} />
  </group>
);

/* ---------- garrafinha de açaí (sabores) ---------- */
export type Sabor = "ninho" | "nutella" | "morango" | "pacoca";
const SABOR: Record<Sabor, {cream: string; top: string}> = {
  ninho: {cream: "#f7f1de", top: "#ffffff"},
  nutella: {cream: "#8a5636", top: "#4a2614"},
  morango: {cream: "#f6bfcc", top: "#e8262d"},
  pacoca: {cream: "#e8cf9a", top: "#b98a4e"},
};
const marbleTex = (sabor: Sabor) =>
  canvasTex("marble-" + sabor, 512, 1024, (c, r) => {
    const cream = SABOR[sabor].cream;
    c.fillStyle = "#3a0c3c";
    c.fillRect(0, 0, 512, 1024);
    c.lineCap = "round";
    // faixas de creme onduladas (marmorizado)
    for (let k = 0; k < 11; k++) {
      const y0 = r() * 1024;
      c.strokeStyle = cream;
      c.lineWidth = 22 + r() * 50;
      c.beginPath();
      c.moveTo(-40, y0);
      for (let x = 0; x <= 560; x += 70) c.lineTo(x, y0 + Math.sin(x / 90 + k) * (40 + r() * 60) + (r() - 0.5) * 40);
      c.stroke();
    }
    // manchas de açaí por cima, pra quebrar o padrão
    for (let k = 0; k < 18; k++) {
      c.fillStyle = r() < 0.5 ? "#4a1450" : "#2e0830";
      c.beginPath();
      c.ellipse(r() * 512, r() * 1024, 20 + r() * 60, 15 + r() * 40, r() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }, [1, 1]);
export const Garrafinha: React.FC<{p?: V3; r?: V3; s?: number; sabor: Sabor; glow?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, sabor}) => {
  const c = SABOR[sabor];
  const cream = sm(c.cream, 0.45);
  const fill = texMat("marble-" + sabor, marbleTex(sabor));
  const glass = sm("#ffffff", 0.05, {transparent: true, opacity: 0.18});
  return (
    <group position={p} rotation={r} scale={s}>
      {/* recheio marmorizado */}
      <mesh position={[0, 0.6, 0]} material={fill} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 1.16, 32]} />
      </mesh>
      {/* ombro da garrafa (creme) */}
      <mesh position={[0, 1.25, 0]} material={cream}>
        <cylinderGeometry args={[0.17, 0.3, 0.16, 32]} />
      </mesh>
      {/* gargalo cheio de creme */}
      <mesh position={[0, 1.42, 0]} material={cream}>
        <cylinderGeometry args={[0.165, 0.165, 0.2, 24]} />
      </mesh>
      {/* plástico transparente por fora */}
      <mesh position={[0, 0.6, 0]} material={glass}>
        <cylinderGeometry args={[0.315, 0.315, 1.2, 32, 1, true]} />
      </mesh>
      <mesh position={[0, 1.27, 0]} material={glass}>
        <cylinderGeometry args={[0.185, 0.315, 0.16, 32, 1, true]} />
      </mesh>
      {/* rosca do gargalo */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 1.38 + k * 0.05, 0]} material={sm("#ffffff", 0.1, {transparent: true, opacity: 0.45})}>
          <torusGeometry args={[0.18, 0.008, 6, 24]} />
        </mesh>
      ))}
      {/* reflexo */}
      <mesh position={[-0.17, 0.65, 0.26]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[0.05, 0.95]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
      {/* cobertura saindo pela boca */}
      <mesh position={[0, 1.52, 0]} scale={[1, 0.6, 1]} material={sm(c.top, 0.6)}>
        <sphereGeometry args={[0.175, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {sabor === "morango" && (
        <group position={[0, 1.68, 0]} rotation={[Math.PI, 0, 0.2]}>
          <mesh material={sm("#e8262d", 0.35)}>
            <coneGeometry args={[0.1, 0.22, 10]} />
          </mesh>
          <mesh position={[0, -0.12, 0]} material={sm("#2e9e3a", 0.6)}>
            <coneGeometry args={[0.08, 0.05, 6]} />
          </mesh>
        </group>
      )}
      {(sabor === "pacoca" || sabor === "ninho") &&
        Array.from({length: 9}, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.8) * 0.09, 1.6 + (i % 3) * 0.015, Math.sin(i * 0.8) * 0.09]} rotation={[i, i * 2, 0]} material={sm(sabor === "pacoca" ? "#c99a5a" : "#fffdf5", 0.8)}>
            <boxGeometry args={[0.045, 0.035, 0.045]} />
          </mesh>
        ))}
      {sabor === "nutella" &&
        Array.from({length: 4}, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 1.6) * 0.15, 1.5 - (i % 2) * 0.05, Math.sin(i * 1.6) * 0.15]} material={sm("#4a2614", 0.3)}>
            <sphereGeometry args={[0.045, 10, 8]} />
          </mesh>
        ))}
    </group>
  );
};
