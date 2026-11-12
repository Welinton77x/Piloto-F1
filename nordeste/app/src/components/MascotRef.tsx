// Mascote do vídeo 6 no estilo do personagem da referência (vídeo dos tornados):
// cabeça grande e arredondada, corpo baixinho e "fofinho", cabelo em cuia, blusão AZUL com capuz e cordões,
// mochila com alças cinza, calça azul-escura, tênis branco com sola laranja. Sem boné/chapéu e sem bolinha no peito.
// Usa o mesmo MascotPose do mascote antigo (braços [x, z] em graus, emoção, pulo, tremor, andar, quadril).
import React from "react";
import * as THREE from "three";
import {random} from "remotion";
import {Face, Mat, RB} from "./Mascot";
import type {MascotPose} from "./Mascot";
import {mixHex, rad} from "../lib/anim";

export type RefLook = {hot?: number; tongue?: boolean; sweat?: number; backpack?: boolean; lHand?: "fist" | "open" | "point"; rHand?: "fist" | "open" | "point"};

const C = {
  skin: "#e9b98f", skinD: "#d9a27a", hair: "#4a3022", hairD: "#3a251a",
  hoodie: "#2f7fd6", hoodieD: "#2463ad", string: "#ffffff", strap: "#5f6b78", pack: "#2463ad",
  pants: "#1c2a4a", shoe: "#f5f6f8", sole: "#ff8f2e",
};

// medidas (unidades do mascote; altura total ≈ 2,0)
const LEG = 0.52; // comprimento da perna (curta)
const HIP = LEG + 0.12; // altura do quadril
const TORSO_H = 0.6;
const SH_Y = HIP + TORSO_H - 0.1; // altura do ombro
const HEAD_Y = HIP + TORSO_H + 0.36; // centro da cabeça

const Hand: React.FC<{kind?: "fist" | "open" | "point"; skin: string}> = ({kind = "fist", skin}) => (
  <group position={[0, -0.6, 0]}>
    <mesh scale={kind === "open" ? [1.15, 1.2, 0.7] : [1, 1, 1]}>
      <sphereGeometry args={[0.105, 18, 14]} />
      <Mat c={skin} />
    </mesh>
    {kind === "point" && (
      <mesh position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
        <Mat c={skin} />
      </mesh>
    )}
  </group>
);

const Arm: React.FC<{side: -1 | 1; rot: [number, number]; hand?: "fist" | "open" | "point"; skin: string}> = ({side, rot, hand, skin}) => (
  <group position={[side * 0.42, SH_Y, 0]} rotation={[rad(rot[0]), 0, rad(side * rot[1])]}>
    {/* manga inteira do blusão (braço gordinho) e punho */}
    <RB w={0.21} h={0.5} d={0.22} r={0.1} c={C.hoodie} position={[0, -0.24, 0]} />
    <RB w={0.2} h={0.06} d={0.21} r={0.03} c={C.hoodieD} position={[0, -0.48, 0]} />
    <Hand kind={hand} skin={skin} />
  </group>
);

export const MascotRef: React.FC<{position?: [number, number, number]; scale?: number; pose: MascotPose; gf: number; look?: RefLook}> = ({position = [0, 0, 0], scale = 1, pose, gf, look = {}}) => {
  const hot = look.hot ?? 0;
  const skin = mixHex(C.skin, "#f08a72", hot * 0.45);
  const period = 95;
  const ph = (gf + Math.floor(random("blinkR") * period)) % period;
  const blink = ph < 4 ? 1 - Math.abs(ph - 2) / 2 : 0;
  const breath = Math.sin(gf * 0.12) * 0.012;
  const sway = Math.sin(gf * 0.06) * 0.03; // nunca fica parado: balanço leve
  const shiver = pose.shiver ? Math.sin(gf * 2.1) * 0.014 * pose.shiver : 0;
  const step = pose.walking ? Math.sin(gf * 0.45) * 28 : 0;
  const hip = pose.hip ?? 0;
  const press = pose.legPress ?? [0, 0];
  const headTilt = pose.emotion === "worried" ? -6 : pose.emotion === "joy" ? Math.sin(gf * 0.3) * 6 : Math.sin(gf * 0.05) * 3;
  const sweat = look.sweat ?? hot;
  return (
    <group position={[position[0] + shiver, position[1] + pose.jump * scale, position[2]]} scale={scale}>
      {/* sombra fica no chão quando ele pula */}
      <mesh position={[0, 0.005 - pose.jump, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22 / (1 + pose.jump * 3)} depthWrite={false} />
      </mesh>
      <group rotation={[0, 0, sway * 0.15]}>
        {/* pernas curtas + tênis */}
        {[-1, 1].map((s, i) => (
          <group key={s} position={[s * 0.15, HIP, 0]} rotation={[rad(i ? step : -step) - rad(hip) + rad(press[i] ?? 0), 0, 0]}>
            <RB w={0.25} h={LEG} d={0.26} r={0.1} c={C.pants} position={[0, -LEG / 2, 0]} />
            <RB w={0.27} h={0.13} d={0.38} r={0.06} c={C.shoe} position={[0, -LEG - 0.03, 0.05]} />
            <RB w={0.28} h={0.04} d={0.39} r={0.02} c={C.sole} position={[0, -LEG - 0.1, 0.05]} />
          </group>
        ))}
        {/* tronco: blusão azul fofinho */}
        <group position={[0, HIP, 0]} scale={[1, 1 + breath, 1 + breath * 0.5]}>
          <RB w={0.76} h={TORSO_H} d={0.48} r={0.18} c={C.hoodie} position={[0, TORSO_H / 2, 0]} />
          {/* barra e bolso canguru */}
          <RB w={0.77} h={0.08} d={0.49} r={0.04} c={C.hoodieD} position={[0, 0.04, 0]} />
          <RB w={0.42} h={0.17} d={0.03} r={0.04} c={C.hoodieD} position={[0, 0.18, 0.24]} />
          {/* cordões do capuz */}
          {[-0.06, 0.06].map((x) => <RB key={x} w={0.025} h={0.2} d={0.02} r={0.01} c={C.string} position={[x, TORSO_H - 0.14, 0.245]} />)}
          {/* gola/capuz em volta do pescoço */}
          <mesh position={[0, TORSO_H - 0.01, -0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]}>
            <torusGeometry args={[0.2, 0.07, 12, 24]} />
            <Mat c={C.hoodieD} />
          </mesh>
          {/* alças da mochila (cinza) passando pelos ombros */}
          {[-0.25, 0.25].map((x) => <RB key={x} w={0.08} h={TORSO_H * 0.92} d={0.03} r={0.015} c={C.strap} position={[x, TORSO_H * 0.5, 0.235]} />)}
          {look.backpack !== false && (
            <group position={[0, TORSO_H * 0.55, -0.32]}>
              <RB w={0.58} h={0.62} d={0.24} r={0.1} c={C.pack} />
              <RB w={0.42} h={0.24} d={0.06} r={0.05} c={C.hoodieD} position={[0, -0.12, -0.14]} />
            </group>
          )}
        </group>
        <Arm side={-1} rot={pose.lArm} hand={look.lHand} skin={skin} />
        <Arm side={1} rot={pose.rArm} hand={look.rHand} skin={skin} />
        {/* cabeça grande e arredondada */}
        <group position={[0, HEAD_Y + breath * 0.5, 0]} rotation={[0, 0, rad(headTilt)]}>
          <RB w={0.74} h={0.68} d={0.64} r={0.26} c={skin} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.37, -0.04, 0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.08, 12, 10]} />
              <Mat c={skin} />
            </mesh>
          ))}
          {/* capacete amarelo igual ao da referência: cúpula baixa e larga, faixa marrom embaixo,
              aba fina e larga em volta, pino retangular no topo e uma manchinha escura na lateral */}
          <mesh position={[0, 0.2, -0.01]} scale={[1.14, 0.78, 1.14]}>
            <sphereGeometry args={[0.37, 44, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f2c014" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.2, -0.01]}>
            <cylinderGeometry args={[0.425, 0.425, 0.06, 44]} />
            <Mat c="#3a2416" />
          </mesh>
          <mesh position={[0, 0.17, 0.01]}>
            <cylinderGeometry args={[0.6, 0.6, 0.03, 52]} />
            <meshStandardMaterial color="#f2c014" roughness={0.42} />
          </mesh>
          <RB w={0.12} h={0.07} d={0.2} r={0.025} c="#e0aa08" position={[0, 0.49, -0.01]} />
          {/* cabelo aparecendo pouco por baixo (costeletas e nuca) */}
          {[-1, 1].map((s2) => <RB key={"sb" + s2} w={0.05} h={0.16} d={0.22} r={0.025} c={C.hair} position={[s2 * 0.38, 0.08, -0.08]} />)}
          <mesh position={[0, 0.06, -0.2]} scale={[1.0, 0.6, 0.55]}>
            <sphereGeometry args={[0.37, 28, 16]} />
            <Mat c={C.hair} />
          </mesh>
          {/* rosto (o mesmo do canal, ampliado para a cabeça maior) */}
          <group position={[0, -0.04, 0]} scale={1.3}>
            <Face emotion={pose.emotion} talk={pose.talk} blink={blink} />
          </group>
          {/* língua de fora no calor */}
          {look.tongue && (
            <mesh position={[0, -0.25, 0.32]} rotation={[0.5, 0, 0]} scale={[0.07, 0.1, 0.03]}>
              <sphereGeometry args={[1, 14, 10]} />
              <Mat c="#e86a6a" r={0.4} />
            </mesh>
          )}
          {/* gotas de suor azuis do lado da cabeça (como na referência) */}
          {sweat > 0.05 &&
            [-1, 1].map((s, k) => {
              const ph2 = ((gf * 0.025 + k * 0.5) % 1);
              return (
                <group key={"sw" + s} position={[s * 0.4, 0.05 - ph2 * 0.25, 0.12]}>
                  <mesh scale={[0.7, 1, 0.7]}>
                    <sphereGeometry args={[0.05 * sweat, 12, 10]} />
                    <meshStandardMaterial color="#7fd0ff" roughness={0.1} metalness={0.1} emissive="#7fd0ff" emissiveIntensity={0.35} transparent opacity={0.95 - ph2 * 0.5} />
                  </mesh>
                  <mesh position={[0, 0.05 * sweat, 0]} rotation={[0, 0, 0]}>
                    <coneGeometry args={[0.035 * sweat, 0.07 * sweat, 12]} />
                    <meshStandardMaterial color="#7fd0ff" roughness={0.1} emissive="#7fd0ff" emissiveIntensity={0.35} transparent opacity={0.95 - ph2 * 0.5} />
                  </mesh>
                </group>
              );
            })}
        </group>
      </group>
    </group>
  );
};
export const _t = THREE;
