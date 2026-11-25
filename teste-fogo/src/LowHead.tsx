import React from "react";
import type {Pose} from "./Boy";
import type {ToyLook} from "./Toy";
import {sm} from "./Sets9";

/* Cabeça low-poly facetada (estilo da referência): icosfera, olhos ovais pretos, nariz bolinha, cabelo-capacete. */
const flat = (c: string, r = 0.8) => sm(c, r, {flatShading: true});
export const LowHead: React.FC<{pose: Pose; look: ToyLook}> = ({pose, look}) => {
  const {blink = 0, eyeWide = 0, brow = 0, mouthOpen = 0, smile = 0} = pose;
  const skin = flat(look.skin ?? "#f2cfa8", 0.75);
  const hairM = flat(look.hair ?? "#5a3a1e", 0.85);
  const black = sm("#0c0c10", 0.4);
  const eyeH = Math.max(0.1, 1 - blink) * (1 + eyeWide * 0.3);
  const style = look.hairStyle ?? "bowl";
  return (
    <group>
      <mesh scale={[1, 1.04, 0.97]} material={skin} castShadow>
        <icosahedronGeometry args={[0.34, 1]} />
      </mesh>
      {style !== "bald" && (
        <>
          <mesh position={[0, 0.05, -0.02]} scale={[1.07, 1.0, 1.07]} rotation={[-0.35, 0, 0]} material={hairM} castShadow>
            <sphereGeometry args={[0.34, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {(style === "bun" || style === "ponytail" || style === "long") && (
            <mesh position={[0, 0.2, -0.33]} material={hairM}>
              <icosahedronGeometry args={[0.13, 0]} />
            </mesh>
          )}
        </>
      )}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.115 * sd, 0.02, 0.3]}>
          <mesh scale={[0.058, 0.078 * eyeH, 0.03]} material={black}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.105 + brow * 0.03 + eyeWide * 0.01, -0.005]} rotation={[0, 0, (brow < 0 ? brow * 0.45 : brow * 0.15) * sd]} material={hairM}>
            <boxGeometry args={[0.1, 0.026, 0.03]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.07, 0.33]} material={flat("#e88a7a", 0.7)}>
        <icosahedronGeometry args={[0.047, 0]} />
      </mesh>
      {mouthOpen > 0.05 ? (
        <group position={[0, -0.18, 0.29]}>
          <mesh material={sm("#5a1010", 0.6)}>
            <boxGeometry args={[0.13, 0.04 + mouthOpen * 0.1, 0.02]} />
          </mesh>
          <mesh position={[0, -0.01 - mouthOpen * 0.025, 0.006]} material={sm("#e0505a", 0.6)}>
            <boxGeometry args={[0.09, 0.02 + mouthOpen * 0.025, 0.01]} />
          </mesh>
        </group>
      ) : (
        <group position={[0, -0.17, 0.295]}>
          <mesh material={sm("#3a0c0c", 0.6)}>
            <boxGeometry args={[0.15 + smile * 0.03, 0.07, 0.012]} />
          </mesh>
          <mesh position={[0, 0, 0.007]} material={sm(look.lips ?? "#d8302a", 0.6)}>
            <boxGeometry args={[0.12 + smile * 0.03, 0.045, 0.01]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
