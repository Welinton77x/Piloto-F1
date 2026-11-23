import React from "react";
import * as THREE from "three";
import type {Pose} from "./Boy";
import type {ToyLook} from "./Toy";
import {sm, rbox} from "./Sets9";

/* Personagem "bloquinho" low-poly: cabeça de caixa, olhos de pontinho, corpo de caixa.
   Mesma interface do Toy (pose / look / palmRef / lPalmRef / headExtra), mesma altura
   (ombro em 1.27, cabeça ~1.65), então funciona nas cenas que já existem. */
type V3 = [number, number, number];

const Arm: React.FC<{side: 1 | -1; shoulder: V3; elbow: number; sleeve: THREE.Material; skin: THREE.Material; palmRef?: React.Ref<THREE.Object3D>}> = ({side, shoulder, elbow, sleeve, skin, palmRef}) => (
  <group position={[0.3 * side, 1.27, 0]} rotation={shoulder}>
    <mesh position={[0.02 * side, -0.14, 0]} geometry={rbox(0.15, 0.32, 0.15, 0.04)} material={sleeve} castShadow />
    <group position={[0.02 * side, -0.3, 0]} rotation={[elbow, 0, 0]}>
      <mesh position={[0, -0.13, 0]} geometry={rbox(0.14, 0.28, 0.14, 0.04)} material={sleeve} castShadow />
      <group position={[0, -0.31, 0]}>
        <mesh geometry={rbox(0.13, 0.12, 0.13, 0.04)} material={skin} castShadow />
        <object3D ref={palmRef} position={[0, -0.04, 0]} />
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
    rShoulder = [0, 0, -0.12],
    rElbow = -0.15,
    lShoulder = [0, 0, 0.12],
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
  const skin = sm(look.skin ?? "#e8b48a", 0.7);
  const shirt = sm(look.shirt ?? (hoodie ? "#ffcd2e" : "#3a86ff"), 0.75);
  const pants = sm(look.pants ?? "#2a4aa8", 0.8);
  const hair = sm(look.hair ?? "#5a3a1e", 0.8);
  const shoe = sm(look.shoe ?? "#ffffff", 0.5);
  const sole = sm(look.sole ?? "#ff8a1f", 0.6);
  const dark = sm("#101018", 0.3);
  const legSwing = Math.sin(walk) * 0.55 * walkAmt;
  const bob = Math.abs(Math.sin(walk)) * 0.05 * walkAmt;
  const sq = 1 - squash * 0.12;
  const eyeH = Math.max(0.12, 1 - blink) * (1 + eyeWide * 0.35);
  const style = look.hairStyle ?? "bowl";
  const bald = style === "bald";
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, rotY, 0]} scale={[1 + squash * 0.06, sq, 1 + squash * 0.06]}>
      {/* pernas */}
      {[1, -1].map((sd) => {
        const sw = sd === 1 ? legSwing : -legSwing;
        return (
          <group key={sd} position={[0.12 * sd, 0.74, 0]} rotation={[-legLift * 1.4 + sw, 0, 0]}>
            <mesh position={[0, -0.18, 0]} geometry={rbox(0.19, 0.38, 0.2, 0.04)} material={pants} castShadow />
            <group position={[0, -0.38, 0]} rotation={[legLift * 1.6, 0, 0]}>
              <mesh position={[0, -0.14, 0]} geometry={rbox(0.18, 0.3, 0.19, 0.04)} material={pants} castShadow />
              <mesh position={[0, -0.31, 0.04]} geometry={rbox(0.2, 0.1, 0.3, 0.04)} material={shoe} castShadow />
              <mesh position={[0, -0.355, 0.04]} geometry={rbox(0.21, 0.035, 0.31, 0.015)} material={sole} />
            </group>
          </group>
        );
      })}
      {/* tronco */}
      <group position={[0, 0.74, 0]} rotation={torso}>
        <group scale={[1 + breathe * 0.015, 1 + breathe * 0.02, 1]}>
          <mesh position={[0, 0.3, 0]} geometry={rbox(0.5, 0.62, 0.32, 0.06)} material={shirt} castShadow />
          {hoodie && (
            <>
              {/* capuz nas costas */}
              <mesh position={[0, 0.56, -0.17]} geometry={rbox(0.36, 0.16, 0.1, 0.04)} material={shirt} />
              {/* bolso canguru */}
              <mesh position={[0, 0.14, 0.165]} geometry={rbox(0.3, 0.14, 0.02, 0.02)} material={sm("#f0b818", 0.75)} />
              {/* cordinhas */}
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.06 * sd, 0.47, 0.165]} material={dark}>
                  <boxGeometry args={[0.015, 0.14, 0.01]} />
                </mesh>
              ))}
            </>
          )}
          {look.suit && <mesh position={[0, 0.42, 0.165]} geometry={rbox(0.14, 0.3, 0.01, 0.01)} material={sm("#ffffff", 0.6)} />}
          {look.apron && <mesh position={[0, 0.2, 0.17]} geometry={rbox(0.42, 0.5, 0.02, 0.02)} material={sm("#f8f8f5", 0.6)} />}
        </group>
        {/* braços (posição relativa ao corpo inteiro: compensa o 0.74) */}
        <group position={[0, -0.74, 0]}>
          <Arm side={-1} shoulder={rShoulder} elbow={rElbow} sleeve={shirt} skin={skin} palmRef={palmRef} />
          <Arm side={1} shoulder={lShoulder} elbow={lElbow} sleeve={shirt} skin={skin} palmRef={lPalmRef} />
        </group>
        {/* cabeça de caixa */}
        <group position={[0, 0.66, 0]} rotation={head}>
          <mesh position={[0, 0.06, 0]} geometry={rbox(0.12, 0.08, 0.12, 0.02)} material={skin} />
          <group position={[0, 0.36, 0]} scale={1.22}>
            <mesh geometry={rbox(0.5, 0.48, 0.46, 0.07)} material={skin} castShadow />
            {/* cabelo em bloco */}
            {!bald && (
              <>
                <mesh position={[0, 0.22, -0.01]} geometry={rbox(0.54, 0.14, 0.5, 0.05)} material={hair} castShadow />
                <mesh position={[0, 0.13, 0.215]} geometry={rbox(0.5, 0.08, 0.06, 0.03)} material={hair} />
                <mesh position={[0, 0.05, -0.22]} geometry={rbox(0.54, 0.3, 0.08, 0.04)} material={hair} />
                {[-1, 1].map((sd) => (
                  <mesh key={sd} position={[0.255 * sd, 0.08, -0.04]} geometry={rbox(0.05, 0.22, 0.36, 0.02)} material={hair} />
                ))}
                {(style === "bun" || style === "ponytail" || style === "long") && <mesh position={[0, 0.2, -0.3]} geometry={rbox(0.2, 0.2, 0.16, 0.06)} material={hair} />}
              </>
            )}
            {/* olhos de pontinho com brilho */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[0.11 * sd, 0.02, 0.232]}>
                <mesh scale={[1, eyeH, 1]} material={dark}>
                  <boxGeometry args={[0.085, 0.105, 0.02]} />
                </mesh>
                {blink < 0.5 && (
                  <mesh position={[0.015, 0.02 * eyeH, 0.011]} material={sm("#ffffff", 0.3)}>
                    <boxGeometry args={[0.022, 0.022, 0.005]} />
                  </mesh>
                )}
                {/* sobrancelha grossa */}
                <mesh position={[0, 0.085 + brow * 0.025 + eyeWide * 0.01, 0.006]} rotation={[0, 0, (brow < 0 ? brow * 0.45 : brow * 0.15) * sd]} material={hair}>
                  <boxGeometry args={[0.1, 0.028, 0.02]} />
                </mesh>
                {/* bochecha */}
                <mesh position={[0.04 * sd, -0.07, -0.003]} material={sm("#ff8f8f", 0.6, {transparent: true, opacity: 0.5})}>
                  <boxGeometry args={[0.06, 0.03, 0.01]} />
                </mesh>
              </group>
            ))}
            {/* boca */}
            {mouthOpen > 0.05 ? (
              <group position={[0, -0.12, 0.232]}>
                <mesh material={sm("#5a1a1a", 0.6)}>
                  <boxGeometry args={[0.1, 0.03 + mouthOpen * 0.08, 0.02]} />
                </mesh>
                <mesh position={[0, -0.01 - mouthOpen * 0.02, 0.006]} material={sm("#e0707a", 0.6)}>
                  <boxGeometry args={[0.06, 0.02 + mouthOpen * 0.02, 0.01]} />
                </mesh>
              </group>
            ) : (
              <group position={[0, -0.12, 0.232]}>
                <mesh material={sm(look.lips ?? "#5a1a1a", 0.6)}>
                  <boxGeometry args={[0.1 + smile * 0.03, 0.022, 0.015]} />
                </mesh>
                {smile > 0.3 &&
                  [-1, 1].map((sd) => (
                    <mesh key={sd} position={[0.06 * sd, 0.015, 0]} rotation={[0, 0, sd * 0.6]} material={sm(look.lips ?? "#5a1a1a", 0.6)}>
                      <boxGeometry args={[0.03, 0.018, 0.015]} />
                    </mesh>
                  ))}
              </group>
            )}
            {look.lashes &&
              [-1, 1].map((sd) => (
                <mesh key={"l" + sd} position={[0.15 * sd, 0.07, 0.235]} rotation={[0, 0, sd * 0.5]} material={dark}>
                  <boxGeometry args={[0.04, 0.012, 0.01]} />
                </mesh>
              ))}
            {headExtra && <group position={[0, -0.06, 0]}>{headExtra}</group>}
          </group>
        </group>
      </group>
    </group>
  );
};
