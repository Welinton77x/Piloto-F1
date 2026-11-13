import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import type {ToyLook} from "./Toy";
import {sm} from "./Sets9";

/* ===== Casamento: noiva, noivo e objetos ===== */

/** a noiva (feita a partir da foto: cabelo preto liso comprido repartido no meio, pele morena) */
const HER_BASE: ToyLook = {skin: "#b8846a", hair: "#141114", hairStyle: "straight", lashes: true, lips: "#a4505a"};
export const HER_CASUAL: ToyLook = {...HER_BASE, polo: true, shirt: "#6a4c3a", pants: "#4a72a8", flare: true, shoe: "#efe3cf", sole: "#9a6a44"};
export const HER_BRIDE: ToyLook = {...HER_BASE, dress: true, veil: true, shirt: "#fbfaf6"};
/** o noivo (o boneco do canal) de terno */
export const GROOM: ToyLook = {suit: true, shirt: "#1d1f27", pants: "#1d1f27", shoe: "#15161d", sole: "#15161d"};

/** buquê de flores (cabinhos pra baixo; segura em y=0) */
export const Bouquet: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const flowers: [number, number, number, string][] = [
    [0, 0.2, 0, "#ffffff"],
    [0.08, 0.17, 0.05, "#ffb3c6"],
    [-0.08, 0.17, 0.04, "#ffffff"],
    [0.05, 0.16, -0.08, "#ffd1dc"],
    [-0.06, 0.16, -0.07, "#ffb3c6"],
    [0.11, 0.12, -0.02, "#ffffff"],
    [-0.11, 0.12, 0.0, "#ffd1dc"],
    [0.0, 0.14, 0.1, "#ffd1dc"],
  ];
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, -0.05, 0]} material={sm("#5c9e3e", 0.6)}>
        <cylinderGeometry args={[0.035, 0.025, 0.22, 10]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#f7f1e3", 0.5)}>
        <torusGeometry args={[0.04, 0.018, 8, 16]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={"l" + i} position={[Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.1]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} scale={[0.05, 0.11, 0.025]} material={sm("#4c9a35", 0.6)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        );
      })}
      {flowers.map(([x, y, z, c], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={sm(c, 0.55)} castShadow>
            <sphereGeometry args={[0.055, 14, 10]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm(new THREE.Color(c).multiplyScalar(0.9).getStyle(), 0.6)}>
            <torusGeometry args={[0.03, 0.012, 6, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
