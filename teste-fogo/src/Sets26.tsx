import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";

/* ===== Objetos do vídeo "Vai jogar GTA 6 pela primeira vez?" ===== */
/* O jogo aparece só como uma cidade genérica low-poly na tela, sem logo, arte ou personagens oficiais. */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const glowMat = (key: string, t: THREE.Texture, k = 0.95) => tm(key, t, 0.35, {emissive: "#ffffff", emissiveMap: t, emissiveIntensity: k});
const label = (key: string, text: string, bg: string, fg: string, size = 48, w = 512, h = 96) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = "center";
    c.fillText(text, w / 2, h / 2 + size * 0.35);
  });

/* ---------- tela do jogo (cidade genérica na beira da praia, ao pôr do sol) ---------- */
const drawGame = (c: CanvasRenderingContext2D, r: () => number, crash = false) => {
  const W = 640, H = 360;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#ff6fb5");
  g.addColorStop(0.45, "#ffb347");
  g.addColorStop(0.6, "#ffd88a");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#fff3b0";
  c.beginPath();
  c.arc(470, 150, 46, 0, Math.PI * 2);
  c.fill();
  // prédios
  for (let i = 0; i < 16; i++) {
    const x = i * 42 - 10, h = 60 + r() * 110;
    c.fillStyle = ["#5a3d8a", "#7a4a9e", "#4a3a7a", "#8a5aa8"][i % 4];
    c.fillRect(x, 215 - h, 38, h);
    c.fillStyle = "#ffe07a";
    for (let y = 225 - h; y < 205; y += 16) for (let k = 0; k < 3; k++) if (r() > 0.45) c.fillRect(x + 5 + k * 11, y, 6, 8);
  }
  // mar e areia
  c.fillStyle = "#2ec4e6";
  c.fillRect(0, 215, W, 30);
  c.fillStyle = "#f3d9a0";
  c.fillRect(0, 245, W, 20);
  // rua
  c.fillStyle = "#3a3a46";
  c.fillRect(0, 265, W, 95);
  c.fillStyle = "#ffffff";
  for (let x = 0; x < W; x += 60) c.fillRect(x, 310, 34, 6);
  // coqueiros
  for (const x of [60, 250, 560]) {
    c.fillStyle = "#7a5230";
    c.fillRect(x, 175, 7, 90);
    c.fillStyle = "#2e9e4a";
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.ellipse(x + 3 + Math.cos(k * 1.3) * 18, 175 + Math.sin(k * 1.3) * 6, 26, 7, k * 1.3, 0, Math.PI * 2);
      c.fill();
    }
  }
  // poste
  c.fillStyle = "#c9c9d1";
  c.fillRect(392, 205, 9, 110);
  c.fillRect(392, 205, 34, 7);
  // carrinho vermelho
  const cx = crash ? 352 : 200;
  c.save();
  c.translate(cx, 300);
  if (crash) c.rotate(-0.25);
  c.fillStyle = "#e8262d";
  c.fillRect(-46, -22, 92, 26);
  c.fillRect(-26, -40, 52, 20);
  c.fillStyle = "#9fe3ff";
  c.fillRect(-20, -36, 18, 13);
  c.fillRect(4, -36, 18, 13);
  c.fillStyle = "#101018";
  c.beginPath();
  c.arc(-26, 6, 11, 0, Math.PI * 2);
  c.arc(28, 6, 11, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // HUD: minimapa e estrelas
  c.fillStyle = "rgba(16,16,24,0.6)";
  c.beginPath();
  c.arc(56, 306, 40, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#ffffff";
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = "#ffd21f";
  c.beginPath();
  c.moveTo(56, 292);
  c.lineTo(64, 314);
  c.lineTo(48, 314);
  c.fill();
  c.font = "bold 30px sans-serif";
  c.fillStyle = "#ffffff";
  c.fillText("★★☆☆☆", 470, 40);
  c.fillStyle = "#7dff8a";
  c.fillText("$ 1.000", 22, 40);
  if (crash) {
    c.font = "bold 70px sans-serif";
    c.textAlign = "center";
    c.lineWidth = 10;
    c.strokeStyle = "#101018";
    c.strokeText("BATEU!", 380, 150);
    c.fillStyle = "#ffd21f";
    c.fillText("BATEU!", 380, 150);
    c.font = "60px sans-serif";
    c.fillText("💥", 405, 250);
  }
};
const banner = (c: CanvasRenderingContext2D, text: string, bg: string, fg = "#ffffff", y = 180, size = 56) => {
  c.fillStyle = bg;
  c.fillRect(0, y - size * 0.95, 640, size * 1.5);
  c.font = `bold ${size}px sans-serif`;
  c.textAlign = "center";
  c.fillStyle = fg;
  c.fillText(text, 320, y + size * 0.3);
};
export type ScreenMode = "game" | "crash" | "low" | "mission" | "save" | "clock" | "off" | `load${number}`;
export const screenTex = (mode: ScreenMode) =>
  canvasTex("tela-gta6-" + mode, 640, 360, (c, r) => {
    if (mode.startsWith("load")) {
      const p = Number(mode.slice(4));
      c.fillStyle = "#0b1030";
      c.fillRect(0, 0, 640, 360);
      const gg = c.createLinearGradient(0, 0, 640, 360);
      gg.addColorStop(0, "#3b3fc9");
      gg.addColorStop(1, "#ff6fa5");
      c.fillStyle = gg;
      c.fillRect(0, 0, 640, 360);
      c.font = "bold 150px sans-serif";
      c.textAlign = "center";
      c.lineWidth = 8;
      c.strokeStyle = "#ffffff";
      c.shadowColor = "#ffffff";
      c.shadowBlur = 24;
      c.strokeText("VI", 320, 175);
      c.shadowBlur = 0;
      c.fillStyle = "#ffffff";
      c.fillText("VI", 320, 175);
      c.shadowBlur = 0;
      c.font = "bold 36px sans-serif";
      c.fillText(`BAIXANDO... ${p}%`, 320, 240);
      c.fillStyle = "rgba(16,16,40,0.6)";
      c.fillRect(70, 270, 500, 34);
      c.fillStyle = "#3ee07a";
      c.fillRect(70, 270, Math.max(8, 5 * p), 34);
      c.font = "bold 24px sans-serif";
      c.fillStyle = "#ffffff";
      c.fillText(p < 50 ? "tempo restante: 3 anos" : "quase lá...", 320, 335);
      return;
    }
    if (mode === "clock") {
      c.fillStyle = "#05060f";
      c.fillRect(0, 0, 640, 360);
      c.font = "bold 150px monospace";
      c.textAlign = "center";
      c.fillStyle = "#ff3b3b";
      c.shadowColor = "#ff3b3b";
      c.shadowBlur = 25;
      c.fillText("00:00", 320, 215);
      c.shadowBlur = 0;
      c.font = "bold 34px sans-serif";
      c.fillStyle = "#ffffff";
      c.fillText("LANÇAMENTO", 320, 290);
      return;
    }
    if (mode === "save") {
      c.fillStyle = "#101018";
      c.fillRect(0, 0, 640, 360);
      c.textAlign = "center";
      c.font = "bold 66px sans-serif";
      c.fillStyle = "#ff3b3b";
      c.fillText("SAVE APAGADO", 320, 170);
      c.font = "bold 30px sans-serif";
      c.fillStyle = "#ffffff";
      c.fillText("progresso: 0%", 320, 230);
      c.fillText("😭", 320, 300);
      return;
    }
    if (mode === "off") {
      c.fillStyle = "#101018";
      c.fillRect(0, 0, 640, 360);
      return;
    }
    drawGame(c, r, mode === "crash");
    if (mode === "low") banner(c, "🔋 BATERIA FRACA", "rgba(232,38,45,0.9)");
    if (mode === "mission") banner(c, "ÚLTIMA MISSÃO", "rgba(16,16,24,0.8)", "#ffd21f");
  });

/** TV com rack e videogame, tela trocando de modo */
export const GameTV: React.FC<{p: V3; rotY?: number; s?: number; mode?: ScreenMode; on?: number; rack?: boolean}> = ({p, rotY = 0, s = 1, mode = "game", on = 1, rack = true}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    {rack && (
      <>
        <mesh position={[0, 0.25, 0]} geometry={rbox(1.9, 0.5, 0.5, 0.05)} material={sm("#f2f2f2", 0.5)} castShadow receiveShadow />
        <mesh position={[-0.45, 0.56, 0.05]} geometry={rbox(0.5, 0.12, 0.34, 0.04)} material={sm("#20222c", 0.35)} castShadow />
        <mesh position={[-0.45, 0.56, 0.222]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: 1.5})}>
          <planeGeometry args={[0.3, 0.012]} />
        </mesh>
      </>
    )}
    <mesh position={[0, 0.54, -0.05]} material={sm("#101018", 0.4)}>
      <boxGeometry args={[0.3, 0.06, 0.18]} />
    </mesh>
    <mesh position={[0, 0.62, -0.05]} material={sm("#101018", 0.4)}>
      <boxGeometry args={[0.06, 0.12, 0.05]} />
    </mesh>
    <mesh position={[0, 1.18, -0.05]} geometry={rbox(1.75, 1.02, 0.07, 0.03)} material={sm("#101018", 0.3)} castShadow />
    <mesh position={[0, 1.18, -0.013]} material={glowMat("tela-gta6-" + mode + (on < 1 ? "-d" : ""), screenTex(mode), 0.95 * on)}>
      <planeGeometry args={[1.65, 0.92]} />
    </mesh>
    {on > 0.01 && <pointLight position={[0, 1.2, 0.6]} intensity={1.6 * on} distance={4} decay={2} color="#ffd0a0" />}
  </group>
);

/* ---------- antena parabólica gigante ---------- */
export const GiantDish: React.FC<{p: V3; s?: number; tilt?: number; beam?: number; t?: number}> = ({p, s = 1, tilt = 0.5, beam = 0, t = 0}) => {
  const white = sm("#eef1f5", 0.4, {side: THREE.DoubleSide});
  const metal = sm("#9aa1ad", 0.35, {metalness: 0.6});
  return (
    <group position={p} scale={s}>
      {/* base e mastro */}
      <mesh position={[0, 0.15, 0]} geometry={rbox(1.2, 0.3, 1.2, 0.05)} material={metal} castShadow />
      <mesh position={[0, 1.0, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 1.7, 14]} />
      </mesh>
      <group position={[0, 1.9, 0]} rotation={[-tilt, 0, 0]}>
        {/* prato (calota de esfera) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.9]} material={white} castShadow>
          <sphereGeometry args={[2.4, 40, 16, 0, Math.PI * 2, Math.PI * 0.78, Math.PI * 0.22]} />
        </mesh>
        <mesh position={[0, 0, -1.45]} material={sm("#ff5fb0", 0.4)} castShadow>
          <torusGeometry args={[1.5, 0.06, 8, 40]} />
        </mesh>
        {/* braços do receptor */}
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.7, Math.sin(a) * 0.7, -0.4]} rotation={[0, 0, a]} material={metal}>
              <boxGeometry args={[0.05, 0.05, 2.1]} />
            </mesh>
          );
        })}
        <mesh position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]} material={sm("#3a3f4a", 0.4)}>
          <cylinderGeometry args={[0.18, 0.12, 0.4, 14]} />
        </mesh>
        {/* raio de download */}
        {beam > 0.01 && (
          <mesh position={[0, 0, 0.75 + 25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35 + 0.08 * Math.sin(t * 20), 0.7, 50, 16, 1, true]} />
            <meshBasicMaterial color="#7dfcff" transparent opacity={0.45 * beam} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  );
};

/* ---------- estação espacial genérica ---------- */
export const SpaceStation: React.FC<{p: V3; s?: number; r?: V3}> = ({p, s = 1, r = [0, 0, 0]}) => {
  const hull = sm("#e8eaee", 0.4);
  const gold = sm("#e3b33b", 0.3, {metalness: 0.6});
  const panelTex = useMemo(
    () =>
      canvasTex("painel-solar", 256, 128, (c) => {
        c.fillStyle = "#1c3a7a";
        c.fillRect(0, 0, 256, 128);
        c.strokeStyle = "#7aa0e8";
        c.lineWidth = 3;
        for (let x = 0; x <= 256; x += 32) {
          c.beginPath();
          c.moveTo(x, 0);
          c.lineTo(x, 128);
          c.stroke();
        }
        for (let y = 0; y <= 128; y += 32) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(256, y);
          c.stroke();
        }
      }),
    [],
  );
  return (
    <group position={p} scale={s} rotation={r}>
      {/* treliça central */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#b8bec8", 0.4, {metalness: 0.5})}>
        <boxGeometry args={[0.3, 9, 0.3]} />
      </mesh>
      {/* módulos */}
      {[-1.2, 0, 1.2].map((x, i) => (
        <mesh key={i} position={[x * 0.5, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={i === 1 ? gold : hull}>
          <cylinderGeometry args={[0.38, 0.38, 2.2, 18]} />
        </mesh>
      ))}
      <mesh position={[0, -0.45, 1.3]} material={hull}>
        <sphereGeometry args={[0.45, 18, 14]} />
      </mesh>
      {/* painéis solares */}
      {[-3.6, -2.4, 2.4, 3.6].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0, 0, 1.25 * sd]} rotation={[-Math.PI / 2, 0, 0]} material={tm("painel-solar", panelTex, 0.3, {side: THREE.DoubleSide, metalness: 0.3})}>
              <planeGeometry args={[1.0, 2.1]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* antena (sem sinal) */}
      <mesh position={[0.6, 0.6, 0]} material={sm("#d9dde3", 0.3, {side: THREE.DoubleSide})}>
        <coneGeometry args={[0.35, 0.25, 18, 1, true]} />
      </mesh>
    </group>
  );
};

/* ---------- carta / conta (folha com texto) ---------- */
const paperTex = (key: string, title: string, lines: string[], accent: string) =>
  canvasTex(key, 256, 340, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 340);
    c.fillStyle = accent;
    c.fillRect(0, 0, 256, 60);
    c.fillStyle = "#ffffff";
    c.font = "bold 28px sans-serif";
    c.textAlign = "center";
    c.fillText(title, 128, 40);
    c.fillStyle = "#101018";
    c.font = "bold 26px sans-serif";
    lines.forEach((l, i) => c.fillText(l, 128, 110 + i * 44));
    c.fillStyle = "#c9ccd3";
    for (let y = 110 + lines.length * 44; y < 320; y += 22) c.fillRect(30, y, 196, 6);
  });
export const Letter: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0, 0]} material={tm("carta-espaco", paperTex("carta-espaco", "RECLAMAÇÃO", ["Estação", "Espacial 🚀", "SEM WI-FI!"], "#2e6fd8"), 0.8, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.2, 0.27]} />
    </mesh>
  </group>
);
export const LightBill: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={tm("conta-guarani", paperTex("conta-guarani", "CONTA DE LUZ", ["TOTAL:", "₲ 9.000.000", "(guaranis)"], "#e8262d"), 0.8, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.2, 0.27]} />
    </mesh>
  </group>
);

/* ---------- sirene (buzina) de navio ---------- */
export const ShipHorn: React.FC<{p: V3; rotY?: number; s?: number; blow?: number; t?: number; up?: boolean}> = ({p, rotY = 0, s = 1, blow = 0, t = 0, up = false}) => {
  const red = sm("#d8262d", 0.35);
  const chrome = sm("#dfe3ea", 0.15, {metalness: 0.8});
  const shake = blow * 0.03 * Math.sin(t * 60);
  return (
    <group position={[p[0] + shake, p[1], p[2]]} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.08, 0]} geometry={rbox(0.5, 0.16, 0.36, 0.03)} material={sm("#2a2e3b", 0.5)} castShadow />
      {[-0.11, 0.11].map((x, i) => (
        <group key={i} position={[x, up ? 0.2 : 0.3, 0]} rotation={[up ? 0.3 : Math.PI / 2 - 0.25, 0, (up ? 0.12 : 0) * (i ? -1 : 1)]}>
          <mesh position={[0, -0.05, 0]} material={chrome} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 0.3, 14]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={red} castShadow>
            <cylinderGeometry args={[0.16, 0.04, 0.42, 20, 1, true]} />
          </mesh>
          <mesh position={[0, 0.49, 0]} rotation={[Math.PI / 2, 0, 0]} material={chrome}>
            <torusGeometry args={[0.16, 0.015, 8, 24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.17, 0.19]} material={tm("buzina-navio", label("buzina-navio", "NAVIO", "#ffd21f", "#101018", 56, 256, 80), 0.5)}>
        <planeGeometry args={[0.34, 0.1]} />
      </mesh>
    </group>
  );
};

/* ---------- telão de estádio ---------- */
export const BigScreen: React.FC<{p: V3; rotY?: number; s?: number; mode?: ScreenMode}> = ({p, rotY = 0, s = 1, mode = "game"}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[5.2 * sd, 3, -0.3]} material={sm("#5a5f6a", 0.5, {metalness: 0.4})} castShadow>
        <boxGeometry args={[0.5, 6, 0.5]} />
      </mesh>
    ))}
    <mesh position={[0, 8.5, -0.25]} geometry={rbox(11.6, 6.6, 0.4, 0.1)} material={sm("#1a1c24", 0.4)} castShadow />
    <mesh position={[0, 8.5, -0.04]} material={glowMat("telao-" + mode, screenTex(mode), 1.1)}>
      <planeGeometry args={[11, 6.1]} />
    </mesh>
  </group>
);

/* ---------- caixa de pizza ---------- */
export const PizzaBox: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.4, 0.06, 0.4, 0.01)} material={sm("#d9b07a", 0.85)} castShadow receiveShadow />
    <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tm("caixa-pizza", label("caixa-pizza", "PIZZA", "#d9b07a", "#c0392b", 70, 256, 256), 0.85)}>
      <planeGeometry args={[0.36, 0.36]} />
    </mesh>
  </group>
);
export const PizzaStack: React.FC<{p: V3; n: number; s?: number; seed?: number}> = ({p, n, s = 1, seed = 0}) => (
  <group position={p} scale={s}>
    {Array.from({length: n}, (_, i) => (
      <PizzaBox key={i} p={[0.015 * Math.sin(i * 2.1 + seed), 0.03 + i * 0.062, 0.015 * Math.cos(i * 1.7 + seed)]} r={[0, 0.08 * Math.sin(i * 1.3 + seed), 0]} />
    ))}
  </group>
);
/** balcão de pizzaria com placa e "CNPJ" na parede */
export const PizzeriaSet: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.5, 0]} geometry={rbox(2.6, 1.0, 0.6, 0.04)} material={sm("#c0392b", 0.55)} castShadow receiveShadow />
    <mesh position={[0, 1.02, 0]} geometry={rbox(2.7, 0.05, 0.7, 0.02)} material={sm("#f2efe6", 0.5)} castShadow />
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[-1.1 + i * 0.44, 0.5, 0.302]} material={sm(i % 2 ? "#ffffff" : "#2ecc71", 0.6)}>
        <planeGeometry args={[0.22, 0.98]} />
      </mesh>
    ))}
    <mesh position={[0, 2.55, -0.25]} geometry={rbox(2.6, 0.6, 0.08, 0.03)} material={sm("#101018", 0.4)} />
    <mesh position={[0, 2.55, -0.205]} material={glowMat("placa-pizzaria", label("placa-pizzaria", "PIZZARIA DO GAMER 🍕", "#101018", "#ffd21f", 64, 1024, 200), 0.8)}>
      <planeGeometry args={[2.5, 0.5]} />
    </mesh>
    <mesh position={[1.05, 1.75, -0.24]} material={tm("cnpj", label("cnpj", "CNPJ 00.000.006/0001-06", "#ffffff", "#101018", 34, 512, 96), 0.6)}>
      <planeGeometry args={[0.8, 0.15]} />
    </mesh>
  </group>
);

/* ---------- cabo grossão da usina até a casa ---------- */
export const PowerCable: React.FC<{pts: V3[]; r?: number; glow?: number}> = ({pts, r = 0.08, glow = 0}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), [pts]);
  return (
    <mesh material={sm("#1d1f27", 0.5, {emissive: "#ffe14d", emissiveIntensity: glow})} castShadow>
      <tubeGeometry args={[curve, 80, r, 10, false]} />
    </mesh>
  );
};

/* ---------- calendário de parede com o ano ---------- */
const yearTex = (y: number) =>
  canvasTex("ano-" + y, 256, 300, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 300);
    c.fillStyle = "#e8262d";
    c.fillRect(0, 0, 256, 70);
    c.fillStyle = "#ffffff";
    c.font = "bold 44px sans-serif";
    c.textAlign = "center";
    c.fillText("ANO", 128, 50);
    c.fillStyle = "#101018";
    c.font = "bold 92px sans-serif";
    c.fillText(String(y), 128, 200);
    c.fillStyle = "#c9ccd3";
    for (let i = 0; i < 7; i++) c.fillRect(22 + i * 31, 240, 22, 22);
  });
export const YearCal: React.FC<{p: V3; s?: number; year: number; flip?: number}> = ({p, s = 1, year, flip = 0}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0, 0]} material={tm("ano-" + year, yearTex(year), 0.6)}>
      <planeGeometry args={[0.6, 0.7]} />
    </mesh>
    {flip > 0.01 && flip < 1 && (
      <group position={[0, 0.35, 0.01]} rotation={[-flip * Math.PI * 0.9, 0, 0]}>
        <mesh position={[0, -0.35, 0]} material={tm("ano-" + (year - 1), yearTex(year - 1), 0.6, {side: THREE.DoubleSide})}>
          <planeGeometry args={[0.6, 0.7]} />
        </mesh>
      </group>
    )}
    <mesh position={[0, 0.37, 0.01]} material={sm("#101018", 0.4)}>
      <boxGeometry args={[0.5, 0.03, 0.02]} />
    </mesh>
  </group>
);

/* ---------- confete 3D ---------- */
export const Confetti3D: React.FC<{c: V3; w?: number; h?: number; t: number; n?: number}> = ({c, w = 6, h = 4, t, n = 60}) => (
  <group position={c}>
    {Array.from({length: n}, (_, i) => {
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const r1 = a - Math.floor(a);
      const b = Math.sin(i * 78.233) * 12345.678;
      const r2 = b - Math.floor(b);
      const y = h - ((t * (0.8 + r2) + r1 * h) % h);
      return (
        <mesh key={i} position={[(r1 - 0.5) * w, y, (r2 - 0.5) * w * 0.6]} rotation={[t * 5 + i, t * 3 + i * 2, 0]}>
          <planeGeometry args={[0.07, 0.04]} />
          <meshBasicMaterial color={["#ff4d6d", "#ffd21f", "#2ecc71", "#3a86ff", "#ff9f1c", "#c86bfa"][i % 6]} side={THREE.DoubleSide} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- placa da usina (na frente do paredão) ---------- */
export const ItaipuSign: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0, -0.06]} geometry={rbox(6.4, 1.7, 0.1, 0.05)} material={sm("#ffffff", 0.5)} />
    <mesh material={glowMat("placa-itaipu-2", label("placa-itaipu-2", "ITAIPU", "#1f4fa8", "#ffffff", 120, 768, 200), 0.4)}>
      <planeGeometry args={[6.2, 1.5]} />
    </mesh>
  </group>
);

/* ---------- capa do jogo: degradê roxo→rosa, coqueiros e "VI" em neon ---------- */
const palm = (c: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string) => {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = color;
  c.strokeStyle = color;
  // tronco
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(14, 130, -6, 260);
  c.stroke();
  // folhas
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.38;
    const len = 120 + (k % 3) * 18;
    c.save();
    c.rotate(a + Math.PI / 2);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -22, len, 18);
    c.quadraticCurveTo(len * 0.5, 4, 0, 6);
    c.fill();
    for (let j = 1; j < 9; j++) {
      const t = j / 9, px = len * t, py = -22 * 4 * t * (1 - t) + 18 * t * t;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + 10, py + 22);
      c.lineTo(px + 16, py + 2);
      c.fill();
    }
    c.restore();
  }
  c.restore();
};
const coverTex = () =>
  canvasTex("capa-vi", 512, 680, (c) => {
    const g = c.createLinearGradient(0, 0, 512, 680);
    g.addColorStop(0, "#3b3fc9");
    g.addColorStop(0.5, "#9a4fc4");
    g.addColorStop(1, "#ff6fa5");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 680);
    palm(c, 470, 60, 1.0, 0.5, "rgba(70,30,120,0.55)");
    palm(c, 30, 520, 1.1, -0.9, "rgba(120,30,110,0.5)");
    palm(c, 520, 420, 0.9, 0.9, "rgba(110,40,140,0.45)");
    // letras "V" e "I" vazadas, com coqueiros dentro
    const V = [[70, 220], [215, 220], [256, 330], [300, 220], [318, 220], [218, 470]];
    const vPath = () => {
      c.beginPath();
      c.moveTo(70, 220);
      c.lineTo(214, 220);
      c.lineTo(250, 330);
      c.lineTo(290, 220);
      c.lineTo(320, 220);
      c.lineTo(222, 470);
      c.lineTo(196, 470);
      c.closePath();
    };
    void V;
    const iPath = () => {
      c.beginPath();
      c.rect(340, 220, 92, 250);
    };
    const inner: [() => void, number, number, number][] = [
      [vPath, 205, 300, 0.95],
      [iPath, 386, 275, 0.85],
    ];
    for (const [path, px, py, ps] of inner) {
      // contorno neon com um vãozinho
      c.save();
      path();
      c.shadowColor = "#ffffff";
      c.shadowBlur = 30;
      c.lineWidth = 22;
      c.strokeStyle = "#ffffff";
      c.stroke();
      c.restore();
      c.save();
      path();
      c.lineWidth = 10;
      c.strokeStyle = "#9a4fc4";
      c.stroke();
      c.fillStyle = "#ffffff";
      c.fill();
      c.clip();
      palm(c, px, py, ps, 0.12, "#8a45c0");
      c.restore();
    }
  });
export const GameBoxVI: React.FC<{p?: V3; r?: V3; s?: number; glow?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, glow = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.5, 0.66, 0.07, 0.02)} material={sm("#2a1850", 0.4)} castShadow />
    <mesh position={[0, 0, 0.0365]} material={glowMat("capa-vi", coverTex(), 0.12)}>
      <planeGeometry args={[0.47, 0.63]} />
    </mesh>
    {glow > 0.01 && <pointLight position={[0, 0.2, 0.6]} intensity={0.8 * glow} distance={2} decay={2} color="#ff8fd0" />}
  </group>
);

/* ---------- despertador digital (23:59 → 00:00) ---------- */
const clockTex = (txt: string) =>
  canvasTex("relogio-" + txt, 256, 128, (c) => {
    c.fillStyle = "#0a0a10";
    c.fillRect(0, 0, 256, 128);
    c.font = "bold 92px monospace";
    c.textAlign = "center";
    c.fillStyle = "#ff3b3b";
    c.shadowColor = "#ff3b3b";
    c.shadowBlur = 16;
    c.fillText(txt, 128, 98);
  });
export const DigitalClock: React.FC<{p: V3; rotY?: number; s?: number; time: string; ring?: number; t?: number}> = ({p, rotY = 0, s = 1, time, ring = 0, t = 0}) => {
  const sh = ring * 0.025 * Math.sin(t * 70);
  return (
    <group position={[p[0] + sh, p[1] + Math.abs(sh), p[2]]} rotation={[0, rotY, ring * 0.08 * Math.sin(t * 55)]} scale={s}>
      <mesh position={[0, 0.09, 0]} geometry={rbox(0.36, 0.18, 0.14, 0.03)} material={sm("#2a2e3b", 0.4)} castShadow />
      <mesh position={[0, 0.095, 0.071]} material={glowMat("relogio-" + time, clockTex(time), 1.2)}>
        <planeGeometry args={[0.31, 0.15]} />
      </mesh>
      <mesh position={[0, 0.19, 0]} material={sm(ring > 0 ? "#ff3b3b" : "#5a5f6a", 0.4, {emissive: ring > 0 ? "#ff3b3b" : "#000000", emissiveIntensity: ring})}>
        <boxGeometry args={[0.1, 0.03, 0.06]} />
      </mesh>
    </group>
  );
};

/* ---------- livro aberto, fino (capas pra fora, páginas pra quem lê) ---------- */
const bookLabel = (key: string, text: string, size: number) =>
  canvasTex(key, 256, 340, (c) => {
    c.fillStyle = "#c0262d";
    c.fillRect(0, 0, 256, 340);
    c.strokeStyle = "#ffd21f";
    c.lineWidth = 8;
    c.strokeRect(14, 14, 228, 312);
    c.fillStyle = "#ffd21f";
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = "center";
    c.fillText(text, 128, 180);
  });
export const OpenBook: React.FC<{p: V3; r?: V3; s?: number; open?: number}> = ({p, r = [0, 0, 0], s = 1, open = 0.5}) => {
  const page = sm("#fbf7ee", 0.8);
  const cover = sm("#c0262d", 0.5);
  return (
    <group position={p} rotation={r} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} rotation={[0, sd * open, 0]}>
          <mesh position={[0.105 * sd, 0, 0]} geometry={rbox(0.21, 0.29, 0.012, 0.004)} material={cover} castShadow />
          <mesh position={[0.1 * sd, 0, -0.012]} material={page}>
            <boxGeometry args={[0.195, 0.27, 0.014]} />
          </mesh>
          <mesh position={[0.105 * sd, 0, 0.0065]} material={tm("livro-" + sd, sd > 0 ? bookLabel("livro-1", "MATEMÁTICA", 34) : bookLabel("livro--1", "+ − × ÷", 52), 0.6)}>
            <planeGeometry args={[0.2, 0.28]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
