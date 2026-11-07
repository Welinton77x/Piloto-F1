// Círculo vermelho DENTRO da cena 3D (como no vídeo de exemplo): fica atrás do mascote quando ele está na frente.
// O anel sempre encara a câmera e tem tamanho constante na tela (raio em px), com borda branca para aparecer bem.
import React from "react";
import * as THREE from "three";
import {sceneAt, wordLocal} from "../data/scenes";
import {FOV, poseAt} from "../lib/camera";
import {clamp01} from "../lib/anim";

type Ring = {id: string; word: string; p: [number, number, number]; r: number; dur?: number; fwd?: number};
export const RINGS: Ring[] = [
  {id: "s3", word: "Bombas", p: [-8.4, -1.35, 1.0], r: 130},
  {id: "s4", word: "turva", p: [-5.2, 0.6, 1.0], r: 160},
  {id: "s5", word: "flocos", p: [-1.7, 1.0, 0.7], r: 140},
  {id: "s6", word: "preso", p: [-0.2, 0.4, 1.0], r: 130},
  {id: "s7", word: "micróbios", p: [-0.35, 0.5, 1.04], r: 160},
  {id: "s8", word: "reservatórios", p: [3.5, 1.9, -0.5], r: 180},
  {id: "s9", word: "hidrômetro", p: [8.75, 0.5, 0.75], r: 115},
];

const F = 960 / Math.tan(((FOV / 2) * Math.PI) / 180); // distância focal em px (altura 1920)
const RED = "#FF1E1E";

export const Rings3D: React.FC<{gf: number}> = ({gf}) => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const cam = poseAt(gf).pos;
  return (
    <>
      {RINGS.filter((r) => r.id === s.id).map((r) => {
        const a = wordLocal(s, r.word);
        if (a === undefined) return null;
        const dur = r.dur ?? 80;
        if (f < a - 2 || f > a + dur) return null;
        const draw = clamp01((f - a + 2) / 10);
        const o = 1 - clamp01((f - a - dur + 10) / 10);
        const p = new THREE.Vector3(...r.p);
        const toCam = cam.clone().sub(p).normalize();
        p.addScaledVector(toCam, 0.04 + (r.fwd ?? 0));
        const dist = cam.distanceTo(p);
        const px = dist / F; // 1 px da tela em unidades do mundo, nessa profundidade
        const R = r.r * (1 + 0.04 * Math.sin(f * 0.3)) * px;
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam, p, new THREE.Vector3(0, 1, 0)));
        const len = Math.max(0.001, Math.PI * 2 * draw);
        const start = Math.PI / 2;
        const mat = (c: string, op = 1) => <meshBasicMaterial color={c} transparent opacity={op * o} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />;
        const dot = new THREE.Vector3(Math.cos(start + len), Math.sin(start + len), 0).multiplyScalar(R);
        return (
          <group key={r.word} position={p} quaternion={q}>
            <mesh renderOrder={10}>
              <ringGeometry args={[R - 15 * px, R + 15 * px, 96, 1, start, len]} />
              {mat("#ffffff")}
            </mesh>
            <mesh renderOrder={11} position={[0, 0, 0.002]}>
              <ringGeometry args={[R - 9 * px, R + 9 * px, 96, 1, start, len]} />
              {mat(RED)}
            </mesh>
            <mesh renderOrder={12} position={[dot.x, dot.y, 0.004]}>
              <circleGeometry args={[17 * px * draw, 32]} />
              {mat("#ffffff")}
            </mesh>
            <mesh renderOrder={13} position={[dot.x, dot.y, 0.006]}>
              <circleGeometry args={[12 * px * draw, 32]} />
              {mat(RED)}
            </mesh>
          </group>
        );
      })}
    </>
  );
};
