import React from "react";
import * as THREE from "three";
import type {Pose} from "./Boy";
import type {ToyLook} from "./Toy";
import {sm} from "./Sets9";

/* Personagem low-poly FACETADO (estilo "boneco de jogo antigo"):
   cabeça grande facetada, olhos redondos pretos grandes, corpo e membros finos, sombreamento chapado.
   Mesma interface do Toy (pose / look / palmRef / lPalmRef / headExtra) e mesmas alturas (ombro 1.27). */
type V3 = [number, number, number];
const flat = (c: string, r = 0.8) => sm(c, r, {flatShading: true});

const Arm: React.FC<{side: 1 | -1; shoulder: V3; elbow: number; sleeve: THREE.Material; skin: THREE.Material; palmRef?: React.Ref<THREE.Object3D>}> = ({side, shoulder, elbow, sleeve, skin, palmRef}) => (
  <group position={[0.22 * side, 1.27, 0]} rotation={shoulder}>
    <mesh position={[0, -0.15, 0]} material={sleeve} castShadow>
      <cylinderGeometry args={[0.065, 0.06, 0.32, 6]} />
    </mesh>
    <group position={[0, -0.3, 0]} rotation={[elbow, 0, 0]}>
      <mesh position={[0, -0.14, 0]} material={sleeve} castShadow>
        <cylinderGeometry args={[0.06, 0.055, 0.3, 6]} />
      </mesh>
      <group position={[0, -0.33, 0]}>
        <mesh scale={[1, 1.15, 0.8]} material={skin} castShadow>
          <icosahedronGeometry args={[0.065, 0]} />
        </mesh>
        <object3D ref={palmRef} position={[0, -0.03, 0]} />
      </group>
    </group>
  </group>
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
      {/* pernas finas */}
      {[1, -1].map((sd) => {
        const sw = sd === 1 ? legSwing : -legSwing;
        return (
          <group key={sd} position={[0.09 * sd, 0.74, 0]} rotation={[-legLift * 1.4 + sw, 0, 0]}>
            <mesh position={[0, -0.18, 0]} material={pants} castShadow>
              <cylinderGeometry args={[0.075, 0.07, 0.38, 6]} />
            </mesh>
            <group position={[0, -0.37, 0]} rotation={[legLift * 1.6, 0, 0]}>
              <mesh position={[0, -0.15, 0]} material={pants} castShadow>
                <cylinderGeometry args={[0.068, 0.065, 0.32, 6]} />
              </mesh>
              {/* tênis */}
              <mesh position={[0, -0.32, 0.05]} scale={[0.11, 0.07, 0.17]} material={shoe} castShadow>
                <dodecahedronGeometry args={[1, 0]} />
              </mesh>
              <mesh position={[0, -0.37, 0.05]} material={sole}>
                <boxGeometry args={[0.17, 0.03, 0.3]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* tronco magro */}
      <group position={[0, 0.74, 0]} rotation={torso}>
        <group scale={[1 + breathe * 0.015, 1 + breathe * 0.02, 1]}>
          <mesh position={[0, 0.27, 0]} material={shirt} castShadow>
            <cylinderGeometry args={[0.2, 0.17, 0.56, 6]} />
          </mesh>
          {hoodie && (
            <>
              <mesh position={[0, 0.5, -0.12]} scale={[1, 0.55, 0.6]} material={shirt}>
                <icosahedronGeometry args={[0.16, 0]} />
              </mesh>
              <mesh position={[0, 0.13, 0.155]} rotation={[-0.15, 0, 0]} material={flat("#e8b41a", 0.8)}>
                <boxGeometry args={[0.2, 0.1, 0.02]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.045 * sd, 0.42, 0.18]} material={black}>
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
        {/* pescoço + cabeça grande facetada */}
        <group position={[0, 0.58, 0]} rotation={head}>
          <mesh position={[0, 0.05, 0]} material={skin}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 6]} />
          </mesh>
          <group position={[0, 0.36, 0]}>
            {/* crânio: cilindro de 8 lados levemente afunilado = facetado */}
            <mesh rotation={[0, Math.PI / 8, 0]} material={skin} castShadow>
              <cylinderGeometry args={[0.3, 0.27, 0.56, 8, 2]} />
            </mesh>
            <mesh position={[0, -0.29, 0]} rotation={[0, Math.PI / 8, 0]} material={skin}>
              <cylinderGeometry args={[0.27, 0.2, 0.06, 8]} />
            </mesh>
            {/* cabelo em placas */}
            {!bald && (
              <>
                <mesh position={[0, 0.3, -0.01]} rotation={[0, Math.PI / 8, 0]} material={hairM} castShadow>
                  <cylinderGeometry args={[0.31, 0.32, 0.12, 8]} />
                </mesh>
                <mesh position={[0, 0.25, 0.27]} rotation={[0.25, 0, 0]} material={hairM}>
                  <boxGeometry args={[0.46, 0.1, 0.08]} />
                </mesh>
                <mesh position={[0, 0.05, -0.24]} rotation={[0, Math.PI / 8, 0]} material={hairM}>
                  <cylinderGeometry args={[0.3, 0.29, 0.36, 8, 1, true, Math.PI * 0.55, Math.PI * 0.9]} />
                </mesh>
                {(style === "bun" || style === "ponytail" || style === "long") && (
                  <mesh position={[0, 0.25, -0.32]} material={hairM}>
                    <icosahedronGeometry args={[0.12, 0]} />
                  </mesh>
                )}
              </>
            )}
            {/* olhos redondos pretos grandes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[0.12 * sd, 0.03, 0.272]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, eyeH]} material={black}>
                  <cylinderGeometry args={[0.072, 0.072, 0.02, 10]} />
                </mesh>
                {/* sobrancelha grossa */}
                <mesh position={[0, 0.115 + brow * 0.03 + eyeWide * 0.01, 0.004]} rotation={[0, 0, (brow < 0 ? brow * 0.45 : brow * 0.15) * sd]} material={hairM}>
                  <boxGeometry args={[0.15, 0.04, 0.03]} />
                </mesh>
              </group>
            ))}
            {/* nariz */}
            <mesh position={[0, -0.06, 0.285]} rotation={[0.2, 0, 0]} material={skin}>
              <coneGeometry args={[0.04, 0.08, 4]} />
            </mesh>
            {/* boca */}
            {mouthOpen > 0.05 ? (
              <group position={[0, -0.17, 0.27]}>
                <mesh material={sm("#5a1010", 0.6)}>
                  <boxGeometry args={[0.13, 0.04 + mouthOpen * 0.1, 0.02]} />
                </mesh>
                <mesh position={[0, -0.01 - mouthOpen * 0.025, 0.006]} material={sm("#e0505a", 0.6)}>
                  <boxGeometry args={[0.09, 0.02 + mouthOpen * 0.025, 0.01]} />
                </mesh>
              </group>
            ) : (
              <group position={[0, -0.17, 0.27]}>
                <mesh material={sm(look.lips ?? "#4a1a10", 0.6)}>
                  <boxGeometry args={[0.11 + smile * 0.03, 0.025, 0.015]} />
                </mesh>
                {smile > 0.3 &&
                  [-1, 1].map((sd) => (
                    <mesh key={sd} position={[0.065 * sd, 0.017, 0]} rotation={[0, 0, sd * 0.6]} material={sm(look.lips ?? "#4a1a10", 0.6)}>
                      <boxGeometry args={[0.035, 0.022, 0.015]} />
                    </mesh>
                  ))}
              </group>
            )}
            {look.lashes &&
              [-1, 1].map((sd) => (
                <mesh key={"l" + sd} position={[0.19 * sd, 0.09, 0.27]} rotation={[0, 0, sd * 0.5]} material={black}>
                  <boxGeometry args={[0.05, 0.014, 0.01]} />
                </mesh>
              ))}
            {headExtra && <group position={[0, -0.1, 0]}>{headExtra}</group>}
          </group>
        </group>
      </group>
    </group>
  );
};
