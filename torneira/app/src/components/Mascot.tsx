// Mascote do canal (boné e camisa azuis, selo PD) no estilo 3D liso e arredondado,
// com rosto expressivo e animação de personagem (respira, pisca, fala, reage, gesticula).
import React, {useMemo} from "react";
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {random} from "remotion";
import {rad} from "../lib/anim";

export type Emotion = "happy" | "surprised" | "worried" | "annoyed" | "scared" | "relieved" | "joy" | "grin";
export type MascotPose = {
  emotion: Emotion;
  talk: number; // 0-1 abertura da boca falando
  lArm: [number, number]; // [x, z] graus (x<0 = para frente/cima; z>0 = abre para fora)
  rArm: [number, number];
  umbrella: "open" | "closed" | "none";
  umbrellaTilt: number;
  jump: number; // u (antes da escala)
  shiver: number; // 0-1
  walking: boolean;
};

const col = {
  skin: "#f2c29b",
  skinD: "#e3a982",
  hair: "#4a3022",
  cap: "#2f6fb5",
  capD: "#245a96",
  shirt: "#3d84d6",
  shirtD: "#2f6fb5",
  pants: "#1f2f52",
  shoe: "#f5f6f8",
  sole: "#9aa3ad",
  cheek: "#f59a9a",
  dark: "#2a1c14",
  mouth: "#7a1f1f",
  tongue: "#e86a6a",
};

const Mat: React.FC<{c: string; r?: number; side?: THREE.Side; e?: string; ei?: number}> = ({c, r = 0.65, side, e = "#000000", ei = 0}) => (
  <meshStandardMaterial color={c} roughness={r} metalness={0} side={side ?? THREE.FrontSide} emissive={e} emissiveIntensity={ei} />
);

const RB: React.FC<{w: number; h: number; d: number; r?: number; c: string; position?: [number, number, number]; rotation?: [number, number, number]}> = ({w, h, d, r = 0.06, c, position, rotation}) => {
  const g = useMemo(() => new RoundedBoxGeometry(w, h, d, 4, r), [w, h, d, r]);
  return (
    <mesh geometry={g} position={position} rotation={rotation}>
      <Mat c={c} />
    </mesh>
  );
};

/** arco (sorriso/franzir) */
const Arc: React.FC<{r: number; t: number; up: boolean; position: [number, number, number]; c?: string; arc?: number}> = ({r, t, up, position, c = col.dark, arc = Math.PI * 0.8}) => (
  <mesh position={position} rotation={[0, 0, up ? (Math.PI - arc) / 2 : Math.PI + (Math.PI - arc) / 2]}>
    <torusGeometry args={[r, t, 6, 16, arc]} />
    <Mat c={c} r={0.5} />
  </mesh>
);

const Face: React.FC<{emotion: Emotion; talk: number; blink: number}> = ({emotion, talk, blink}) => {
  const zf = 0.248; // frente da cabeça
  // sobrancelhas: [altura, inclinação em graus (+ = ponta interna para cima)]
  const brow: Record<Emotion, [number, number]> = {
    happy: [0.02, 0],
    relieved: [0.02, 6],
    surprised: [0.07, 0],
    worried: [0.04, 18],
    scared: [0.07, 16],
    annoyed: [-0.01, -18],
    joy: [0.05, 0],
    grin: [0.045, 4],
  };
  const [by, bt] = brow[emotion];
  const eyesClosedHappy = emotion === "joy";
  const eyeScaleY = (emotion === "surprised" || emotion === "scared" ? 1.25 : 1) * (1 - blink * 0.9);
  const open = Math.max(talk, emotion === "surprised" ? 0.55 : emotion === "scared" ? 0.75 : emotion === "joy" ? 0.85 : 0);
  let mouth: React.ReactNode;
  if (emotion === "grin") {
    // sorrisão aberto em "D": metade de baixo de uma elipse, dentes em cima e língua
    mouth = (
      <group position={[0, -0.1, zf + 0.002]}>
        <mesh scale={[0.1, 0.085, 0.02]}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <Mat c={col.mouth} r={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.012, 0.012]} scale={[0.085, 0.018, 0.01]}>
          <sphereGeometry args={[1, 16, 6]} />
          <Mat c="#ffffff" r={0.3} />
        </mesh>
        <mesh position={[0, -0.06, 0.014]} scale={[0.05, 0.022, 0.01]}>
          <sphereGeometry args={[1, 12, 6]} />
          <Mat c={col.tongue} r={0.5} />
        </mesh>
      </group>
    );
  } else if (open > 0.08) {
    const wide = emotion === "joy" || emotion === "happy" || emotion === "relieved" ? 1.25 : emotion === "surprised" ? 0.7 : 1;
    mouth = (
      <group position={[0, -0.135, zf + 0.002]}>
        <mesh scale={[0.075 * wide, 0.02 + 0.06 * open, 0.02]}>
          <sphereGeometry args={[1, 18, 12]} />
          <Mat c={col.mouth} r={0.4} />
        </mesh>
        {open > 0.3 && emotion !== "surprised" && (
          <mesh position={[0, 0.012 + 0.03 * open, 0.012]} scale={[0.055 * wide, 0.012, 0.01]}>
            <sphereGeometry args={[1, 12, 6]} />
            <Mat c="#ffffff" r={0.3} />
          </mesh>
        )}
        {open > 0.3 && (
          <mesh position={[0, -0.015 - 0.025 * open, 0.012]} scale={[0.04 * wide, 0.018, 0.01]}>
            <sphereGeometry args={[1, 12, 6]} />
            <Mat c={col.tongue} r={0.5} />
          </mesh>
        )}
      </group>
    );
  } else if (emotion === "annoyed") {
    mouth = (
      <mesh position={[0, -0.14, zf + 0.004]} scale={[0.07, 0.012, 0.012]}>
        <sphereGeometry args={[1, 12, 6]} />
        <Mat c={col.dark} />
      </mesh>
    );
  } else if (emotion === "worried") {
    mouth = <Arc r={0.05} t={0.011} up position={[0, -0.17, zf + 0.004]} arc={Math.PI * 0.7} />;
  } else {
    mouth = <Arc r={0.06} t={0.012} up={false} position={[0, -0.11, zf + 0.004]} />;
  }
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.105, 0.035, zf]}>
          {eyesClosedHappy ? (
            <Arc r={0.035} t={0.011} up position={[0, -0.015, 0.004]} />
          ) : (
            <group scale={[1, eyeScaleY, 1]}>
              <mesh scale={[0.042, 0.052, 0.02]}>
                <sphereGeometry args={[1, 16, 12]} />
                <Mat c="#1b1410" r={0.3} />
              </mesh>
              <mesh position={[0.014, 0.018, 0.016]} scale={[0.013, 0.013, 0.006]}>
                <sphereGeometry args={[1, 10, 8]} />
                <Mat c="#ffffff" r={0.2} e="#ffffff" ei={0.4} />
              </mesh>
            </group>
          )}
          <group position={[0, 0.085 + by, 0.004]} rotation={[0, 0, rad(s * bt)]}>
            <RB w={0.1} h={0.026} d={0.02} r={0.01} c={col.hair} />
          </group>
          <mesh position={[s * 0.075, -0.085, -0.004]} scale={[0.045, 0.032, 0.012]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={col.cheek} roughness={0.8} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.04, zf + 0.012]} scale={[0.032, 0.026, 0.026]}>
        <sphereGeometry args={[1, 12, 8]} />
        <Mat c={col.skinD} />
      </mesh>
      {mouth}
    </group>
  );
};

const Umbrella: React.FC<{state: "open" | "closed"; tilt: number}> = ({state, tilt}) => (
  <group rotation={[0, 0, rad(tilt)]}>
    <mesh position={[0, -0.1, 0]}>
      <cylinderGeometry args={[0.022, 0.022, 0.2, 10]} />
      <Mat c="#6b4428" />
    </mesh>
    <mesh position={[0.05, -0.2, 0]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[0.05, 0.02, 8, 12, Math.PI]} />
      <Mat c="#6b4428" />
    </mesh>
    <mesh position={[0, 0.6, 0]}>
      <cylinderGeometry args={[0.014, 0.014, 1.2, 8]} />
      <Mat c="#3a3a3a" />
    </mesh>
    {state === "open" ? (
      <group position={[0, 1.2, 0]}>
        {Array.from({length: 8}).map((_, i) => (
          <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
            <coneGeometry args={[0.78, 0.34, 2, 1, true, 0, Math.PI / 4]} />
            <Mat c={i % 2 ? "#ffc400" : "#ffd84d"} side={THREE.DoubleSide} r={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <Mat c="#3a3a3a" />
        </mesh>
      </group>
    ) : (
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.08, 0.7, 10, 1, true]} />
        <Mat c="#ffc400" side={THREE.DoubleSide} />
      </mesh>
    )}
  </group>
);

export type Hand = "fist" | "open" | "point";
const Arm: React.FC<{side: -1 | 1; rot: [number, number]; hand?: Hand; children?: React.ReactNode}> = ({side, rot, hand = "fist", children}) => (
  <group position={[side * 0.345, 0.93, 0]} rotation={[rad(rot[0]), 0, rad(side * rot[1])]}>
    <RB w={0.17} h={0.3} d={0.18} r={0.07} c={col.shirt} position={[0, -0.13, 0]} />
    <RB w={0.15} h={0.22} d={0.16} r={0.06} c={col.skin} position={[0, -0.36, 0]} />
    {hand === "open" ? (
      <group position={[0, -0.53, 0]}>
        {/* palma achatada, dedos juntos e polegar */}
        <mesh scale={[1.25, 1.3, 0.55]}>
          <sphereGeometry args={[0.085, 18, 14]} />
          <Mat c={col.skin} />
        </mesh>
        {[-0.045, -0.015, 0.015, 0.045].map((x, i) => (
          <mesh key={x} position={[x, -0.1 - (i === 1 || i === 2 ? 0.012 : 0), 0]}>
            <capsuleGeometry args={[0.022, 0.06, 4, 8]} />
            <Mat c={col.skin} />
          </mesh>
        ))}
        <mesh position={[side * 0.1, -0.02, 0.01]} rotation={[0, 0, side * rad(-50)]}>
          <capsuleGeometry args={[0.024, 0.05, 4, 8]} />
          <Mat c={col.skin} />
        </mesh>
      </group>
    ) : (
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <Mat c={col.skin} />
      </mesh>
    )}
    {hand === "point" && (
      <mesh position={[0, -0.62, 0]}>
        <capsuleGeometry args={[0.026, 0.12, 4, 8]} />
        <Mat c={col.skin} />
      </mesh>
    )}
    {children && <group position={[0, -0.5, 0]}>{children}</group>}
  </group>
);

/** chave inglesa (segurada pela mão) */
const Wrench: React.FC<{tilt?: number}> = ({tilt = -20}) => (
  <group rotation={[0, 0, rad(tilt)]}>
    <mesh position={[0, 0.17, 0.02]}>
      <boxGeometry args={[0.06, 0.42, 0.035]} />
      <meshStandardMaterial color="#c9d1da" metalness={0.75} roughness={0.3} />
    </mesh>
    {/* cabeça da chave: corpo + duas garras abertas (boca em U) + rosca de ajuste */}
    <mesh position={[0, 0.42, 0.02]}>
      <boxGeometry args={[0.16, 0.08, 0.04]} />
      <meshStandardMaterial color="#c9d1da" metalness={0.75} roughness={0.3} />
    </mesh>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[sd * 0.055, 0.5, 0.02]}>
        <boxGeometry args={[0.05, 0.11, 0.04]} />
        <meshStandardMaterial color="#c9d1da" metalness={0.75} roughness={0.3} />
      </mesh>
    ))}
    <mesh position={[0, 0.34, 0.03]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.025, 0.025, 0.07, 10]} />
      <meshStandardMaterial color="#8a939e" metalness={0.6} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.05, 0.02]}>
      <boxGeometry args={[0.07, 0.1, 0.045]} />
      <meshStandardMaterial color="#5b636e" metalness={0.5} roughness={0.4} />
    </mesh>
  </group>
);

/** cabelo cacheado: cachos (esferas) em volta da cabeça, por baixo do boné */
const CurlyHair: React.FC = () => {
  const curls: [number, number, number, number][] = [];
  for (let ring = 0; ring < 2; ring++)
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + ring * 0.12;
      if (Math.cos(a) > 0.42) continue; // deixa o rosto livre (cachos só nas laterais e atrás)
      const r = 0.07 + random("cr" + i + ring) * 0.035;
      curls.push([Math.sin(a) * (0.3 - ring * 0.02), 0.06 + ring * 0.1 + random("cy" + i) * 0.06, Math.cos(a) * 0.27 - 0.02, r]);
    }
  // franja de cachos saindo por baixo da aba do boné
  for (let i = 0; i < 6; i++) curls.push([-0.2 + i * 0.08, 0.175 + random("fy" + i) * 0.02, 0.21, 0.05]);
  for (let i = 0; i < 14; i++) {
    curls.push([-0.25 + random("tx" + i) * 0.5, -0.05 - random("ty" + i) * 0.12, -0.22 - random("tz" + i) * 0.05, 0.065]);
  }
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) curls.push([sd * (0.27 + random("sx" + i + sd) * 0.03), 0.02 + i * 0.06, 0.05 - i * 0.04, 0.06]);
  return (
    <group>
      {curls.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 12, 10]} />
          <meshStandardMaterial color={i % 3 ? "#5a3520" : "#6b4128"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

export type MascotLook = {hair?: "short" | "curly"; outfit?: "shirt" | "overall"; wrench?: boolean; wrenchTilt?: number; wrenchLeft?: boolean; capLogo?: boolean; lHand?: Hand; rHand?: Hand};

/** logo do canal estampado na frente do boné (lâmpada + "Por Dentro Lab") */
const CapLogo: React.FC = () => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 300;
    const g = c.getContext("2d")!;
    g.lineJoin = "round";
    // lâmpada
    g.strokeStyle = "#FFD400";
    g.lineWidth = 10;
    for (const a of [-60, -30, 0, 30, 60]) {
      const r = (a * Math.PI) / 180;
      g.beginPath();
      g.moveTo(256 + Math.sin(r) * 58, 70 - Math.cos(r) * 58);
      g.lineTo(256 + Math.sin(r) * 80, 70 - Math.cos(r) * 80);
      g.stroke();
    }
    g.fillStyle = "#FFD400";
    g.beginPath();
    g.arc(256, 70, 36, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c9d1da";
    g.fillRect(238, 100, 36, 22);
    // texto
    g.font = '900 86px "Montserrat"';
    g.textAlign = "center";
    g.lineWidth = 16;
    g.strokeStyle = "#0d2457";
    g.strokeText("Por Dentro", 256, 200);
    g.fillStyle = "#ffffff";
    g.fillText("Por Dentro", 256, 200);
    g.font = '900 104px "Montserrat"';
    g.strokeText("Lab", 256, 290);
    g.fillStyle = "#FFD400";
    g.fillText("Lab", 256, 290);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  return (
    <mesh position={[0, 0.375, 0.252]}>
      <planeGeometry args={[0.38, 0.223]} />
      <meshStandardMaterial map={tex} transparent roughness={0.6} />
    </mesh>
  );
};

export const Mascot: React.FC<{position: [number, number, number]; scale?: number; pose: MascotPose; gf: number; look?: MascotLook}> = ({position, scale = 1, pose, gf, look = {}}) => {
  const curly = look.hair === "curly";
  const overall = look.outfit === "overall";
  const period = 95;
  const ph = (gf + Math.floor(random("blink") * period)) % period;
  const blink = ph < 4 ? 1 - Math.abs(ph - 2) / 2 : 0;
  const breath = Math.sin(gf * 0.12) * 0.012;
  const shiver = pose.shiver ? Math.sin(gf * 2.1) * 0.012 * pose.shiver : 0;
  const step = pose.walking ? Math.sin(gf * 0.45) * 22 : 0;
  const headTilt = pose.emotion === "worried" ? -6 : pose.emotion === "joy" ? Math.sin(gf * 0.3) * 6 : Math.sin(gf * 0.05) * 2;
  // guarda-chuva na mão esquerda, sempre na vertical (desfaz a rotação do braço)
  const lx = rad(pose.lArm[0]);
  const lz = rad(-pose.lArm[1]);
  const umbrella =
    pose.umbrella !== "none" ? (
      <group rotation={new THREE.Euler(-lx, 0, -lz, "ZYX")}>
        <Umbrella state={pose.umbrella} tilt={pose.umbrellaTilt} />
      </group>
    ) : null;
  return (
    <group position={[position[0] + shiver, position[1] + pose.jump * scale, position[2]]} scale={scale}>
      <mesh position={[0, 0.005 - pose.jump, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22 / (1 + pose.jump * 3)} depthWrite={false} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} position={[s * 0.13, 0.5, 0]} rotation={[rad(i ? step : -step), 0, 0]}>
          <RB w={0.21} h={0.44} d={0.23} r={0.07} c={overall ? col.shirtD : col.pants} position={[0, -0.22, 0]} />
          <RB w={0.22} h={0.1} d={0.32} r={0.045} c={col.shoe} position={[0, -0.45, 0.04]} />
          <RB w={0.23} h={0.035} d={0.33} r={0.015} c={col.sole} position={[0, -0.49, 0.04]} />
        </group>
      ))}
      <group position={[0, 0.5, 0]} scale={[1, 1 + breath, 1 + breath * 0.5]}>
        <RB w={0.6} h={0.5} d={0.36} r={0.12} c={overall ? col.shirtD : col.shirt} position={[0, 0.25, 0]} />
        {overall && (
          <group>
            {/* zíper, bolso com canetas e símbolo de engrenagem */}
            <RB w={0.03} h={0.42} d={0.02} r={0.01} c="#c9d1da" position={[0, 0.26, 0.182]} />
            <RB w={0.17} h={0.13} d={0.03} r={0.02} c="#1d4a8f" position={[-0.15, 0.3, 0.18]} />
            <RB w={0.025} h={0.1} d={0.02} r={0.01} c="#E53935" position={[-0.19, 0.39, 0.19]} />
            <RB w={0.025} h={0.08} d={0.02} r={0.01} c="#FFC400" position={[-0.14, 0.38, 0.19]} />
            <mesh position={[0.15, 0.3, 0.185]}>
              <torusGeometry args={[0.045, 0.016, 8, 8]} />
              <meshStandardMaterial color="#FFC400" roughness={0.5} />
            </mesh>
          </group>
        )}
        <RB w={0.3} h={0.06} d={0.3} r={0.03} c={col.shirtD} position={[0, 0.5, 0]} />
        <mesh position={[0.13, 0.33, overall ? -5 : 0.182]}>
          <circleGeometry args={[0.065, 20]} />
          <Mat c="#4DD0FF" />
        </mesh>
        <mesh position={[0.13, 0.33, overall ? -5 : 0.183]}>
          <ringGeometry args={[0.065, 0.078, 20]} />
          <Mat c="#ffffff" />
        </mesh>
        <RB w={0.62} h={0.07} d={0.38} r={0.03} c={col.pants} position={[0, 0.02, 0]} />
      </group>
      <Arm side={-1} rot={pose.lArm} hand={look.lHand}>
        {umbrella}
        {look.wrench && look.wrenchLeft ? <group rotation={new THREE.Euler(-rad(pose.lArm[0]), 0, rad(pose.lArm[1]), "ZYX")}><Wrench tilt={look.wrenchTilt} /></group> : null}
      </Arm>
      <Arm side={1} rot={pose.rArm} hand={look.rHand}>{look.wrench && !look.wrenchLeft ? <group rotation={new THREE.Euler(-rad(pose.rArm[0]), 0, -rad(pose.rArm[1]), "ZYX")}><Wrench tilt={look.wrenchTilt} /></group> : null}</Arm>
      <group position={[0, 1.3 + breath * 0.5, 0]} rotation={[0, 0, rad(headTilt)]}>
        <RB w={0.54} h={0.5} d={0.48} r={0.14} c={col.skin} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.275, -0.02, 0]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <Mat c={col.skin} />
          </mesh>
        ))}
        {curly ? (
          <CurlyHair />
        ) : (
          <>
            {/* cabelo por baixo do boné: só aparece nas laterais (costeletas) e na nuca */}
            <RB w={0.565} h={0.16} d={0.42} r={0.06} c={col.hair} position={[0, 0.1, -0.06]} />
            <RB w={0.57} h={0.3} d={0.12} r={0.06} c={col.hair} position={[0, 0.02, -0.2]} />
          </>
        )}
        {/* boné encaixado: copa arredondada sobre o topo da cabeça, faixa, aba na testa e botão */}
        <mesh position={[0, 0.15, -0.01]} scale={[1.0, 0.6, 0.96]}>
          <sphereGeometry args={[0.345, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat c={col.cap} />
        </mesh>
        <mesh position={[0, 0.165, -0.01]} scale={[1.0, 1, 0.96]}>
          <cylinderGeometry args={[0.347, 0.347, 0.05, 32, 1, true]} />
          <Mat c={col.capD} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.358, -0.01]}>
          <sphereGeometry args={[0.03, 12, 8]} />
          <Mat c={col.capD} />
        </mesh>
        <group position={[0, 0.155, 0.29]} rotation={[rad(10), 0, 0]}>
          <mesh position={[0, 0, 0.09]} scale={[1, 0.12, 0.62]}>
            <cylinderGeometry args={[0.22, 0.22, 0.2, 32, 1, false, -Math.PI / 2, Math.PI]} />
            <Mat c={col.capD} />
          </mesh>
        </group>
        {curly && (
          <group position={[0, 0.31, 0.245]}>
            <mesh>
              <circleGeometry args={[0.06, 20]} />
              <meshStandardMaterial color="#FFD400" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.005, 0.002]}>
              <circleGeometry args={[0.03, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff3a0" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}
        <Face emotion={pose.emotion} talk={pose.talk} blink={blink} />
      </group>
    </group>
  );
};
