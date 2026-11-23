import React from "react";
import * as THREE from "three";
import type {Pose} from "./Boy";
import type {ToyLook} from "./Toy";
import {sm} from "./Sets9";
import {LowHead} from "./LowHead";

/* Personagem low-poly FACETADO (estilo "boneco de jogo antigo"):
   cabeça grande facetada, olhos redondos pretos grandes, corpo e membros finos, sombreamento chapado.
   Mesma interface do Toy (pose / look / palmRef / lPalmRef / headExtra) e mesmas alturas (ombro 1.27). */
type V3 = [number, number, number];
const flat = (c: string, r = 0.8) => sm(c, r, {flatShading: true});

const Arm: React.FC<{side: 1 | -1; shoulder: V3; elbow: number; sleeve: THREE.Material; skin: THREE.Material; palmRef?: React.Ref<THREE.Object3D>}> = ({side, shoulder, elbow, sleeve, skin, palmRef}) => (
  <group position={[0.22 * side, 1.27, 0]} rotation={shoulder}>
    {/* manga bufante facetada */}
    <mesh position={[0.01 * side, -0.06, 0]} scale={[1, 1.1, 1]} material={sleeve} castShadow>
      <icosahedronGeometry args={[0.1, 0]} />
    </mesh>
    <mesh position={[0, -0.2, 0]} material={skin} castShadow>
      <cylinderGeometry args={[0.032, 0.03, 0.26, 6]} />
    </mesh>
    <group position={[0, -0.3, 0]} rotation={[elbow, 0, 0]}>
      <mesh position={[0, -0.14, 0]} material={skin} castShadow>
        <cylinderGeometry args={[0.03, 0.028, 0.3, 6]} />
      </mesh>
      <group position={[0, -0.33, 0]}>
        <mesh material={skin} castShadow>
          <icosahedronGeometry args={[0.07, 0]} />
        </mesh>
        <object3D ref={palmRef} position={[0, -0.03, 0]} />
      </group>
    </group>
  </group>
);

/* barra em zigue-zague (pontas triangulares) */
const Jagged: React.FC<{r: number; y: number; mat: THREE.Material; n?: number; h?: number}> = ({r, y, mat, n = 9, h = 0.07}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.sin(a) * r, y - h / 2 - (i % 2) * 0.02, Math.cos(a) * r]} rotation={[0, a, Math.PI]} material={mat}>
          <coneGeometry args={[0.055, h + (i % 2) * 0.03, 3]} />
        </mesh>
      );
    })}
  </>
);

export const BlockToy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; lPalmRef?: React.Ref<THREE.Object3D>; look?: ToyLook; headExtra?: React.ReactNode}> = ({pose, palmRef, lPalmRef, look = {}, headExtra}) => {
  const {
    pos = [0, 0, 0],
    rotY = 0,
    head = [0, 0, 0],
    torso = [0, 0, 0],
    rShoulder = [0, 0, -0.1],
    rElbow = -0.15,
    lShoulder = [0, 0, 0.1],
    lElbow = -0.15,
    blink = 0,
    eyeWide = 0,
    brow = 0,
    mouthOpen = 0,
    smile = 0,
    breathe = 0,
    walk = 0,
    walkAmt = 0,
    legLift = 0,
    squash = 0,
  } = pose;
  const hoodie = look.hoodie ?? false;
  const skin = flat(look.skin ?? "#e8b48a", 0.75);
  const shirt = flat(look.shirt ?? (hoodie ? "#ffcd2e" : "#3a86ff"), 0.8);
  const pants = flat(look.pants ?? "#2a4aa8", 0.85);
  const hairM = flat(look.hair ?? "#4a2e16", 0.85);
  const shoe = flat(look.shoe ?? "#ffffff", 0.6);
  const sole = flat(look.sole ?? "#ff8a1f", 0.6);
  const black = sm("#0c0c10", 0.4);
  const legSwing = Math.sin(walk) * 0.55 * walkAmt;
  const bob = Math.abs(Math.sin(walk)) * 0.05 * walkAmt;
  const sq = 1 - squash * 0.12;
  const eyeH = Math.max(0.1, 1 - blink) * (1 + eyeWide * 0.3);
  const style = look.hairStyle ?? "bowl";
  const bald = style === "bald";
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, rotY, 0]} scale={[1 + squash * 0.06, sq, 1 + squash * 0.06]}>
      {/* short facetado com barra em pontas */}
      <mesh position={[0, 0.7, 0]} material={pants} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.2, 7]} />
      </mesh>
      {[1, -1].map((sd) => {
        const sw = sd === 1 ? legSwing : -legSwing;
        return (
          <group key={sd} position={[0.09 * sd, 0.7, 0]} rotation={[-legLift * 1.4 + sw, 0, 0]}>
            <mesh position={[0, -0.1, 0]} material={pants} castShadow>
              <cylinderGeometry args={[0.1, 0.11, 0.18, 6]} />
            </mesh>
            <Jagged r={0.1} y={-0.19} mat={pants} n={6} h={0.06} />
            <mesh position={[0, -0.3, 0]} material={skin} castShadow>
              <cylinderGeometry args={[0.035, 0.033, 0.24, 6]} />
            </mesh>
            <group position={[0, -0.4, 0]} rotation={[legLift * 1.6, 0, 0]}>
              <mesh position={[0, -0.12, 0]} material={skin} castShadow>
                <cylinderGeometry args={[0.033, 0.03, 0.26, 6]} />
              </mesh>
              <mesh position={[0, -0.27, 0.04]} scale={[0.09, 0.06, 0.14]} material={shoe} castShadow>
                <dodecahedronGeometry args={[1, 0]} />
              </mesh>
              <mesh position={[0, -0.31, 0.04]} material={sole}>
                <boxGeometry args={[0.14, 0.025, 0.25]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* tronco magro */}
      <group position={[0, 0.74, 0]} rotation={torso}>
        <group scale={[1 + breathe * 0.015, 1 + breathe * 0.02, 1]}>
          <mesh position={[0, 0.3, 0]} material={shirt} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 0.52, 7]} />
          </mesh>
          <Jagged r={0.24} y={0.04} mat={shirt} n={11} h={0.08} />
          {hoodie && (
            <>
              <mesh position={[0, 0.5, -0.12]} scale={[1, 0.55, 0.6]} material={shirt}>
                <icosahedronGeometry args={[0.16, 0]} />
              </mesh>
              <mesh position={[0, 0.16, 0.225]} rotation={[-0.08, 0, 0]} material={flat("#e8b41a", 0.8)}>
                <boxGeometry args={[0.2, 0.1, 0.02]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.045 * sd, 0.44, 0.2]} material={black}>
                  <boxGeometry args={[0.014, 0.12, 0.01]} />
                </mesh>
              ))}
            </>
          )}
          {look.suit && <mesh position={[0, 0.4, 0.17]} material={flat("#ffffff", 0.6)}><boxGeometry args={[0.1, 0.26, 0.01]} /></mesh>}
          {look.apron && <mesh position={[0, 0.2, 0.18]} material={flat("#f8f8f5", 0.6)}><boxGeometry args={[0.32, 0.46, 0.02]} /></mesh>}
        </group>
        <group position={[0, -0.74, 0]}>
          <Arm side={-1} shoulder={rShoulder} elbow={rElbow} sleeve={shirt} skin={skin} palmRef={palmRef} />
          <Arm side={1} shoulder={lShoulder} elbow={lElbow} sleeve={shirt} skin={skin} palmRef={lPalmRef} />
        </group>
        {/* pescoço + cabeça low-poly da referência */}
        <group position={[0, 0.58, 0]} rotation={head}>
          <mesh position={[0, 0.04, 0]} material={skin}>
            <cylinderGeometry args={[0.05, 0.06, 0.08, 6]} />
          </mesh>
          <group position={[0, 0.33, 0]}>
            <LowHead pose={pose} look={look} />
            {headExtra && <group position={[0, -0.1, 0]}>{headExtra}</group>}
          </group>
        </group>
      </group>
    </group>
  );
};
