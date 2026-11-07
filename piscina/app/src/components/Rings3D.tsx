// Círculo vermelho DENTRO da cena 3D (como no vídeo de exemplo): todo vermelho e atrás do mascote quando ele está na frente.
// O anel sempre encara a câmera e tem tamanho constante na tela (raio em px), com borda branca para aparecer bem.
import React from "react";
import * as THREE from "three";
import {sceneAt, wordLocal} from "../data/scenes";
import {FOV, poseAt} from "../lib/camera";
import {clamp01} from "../lib/anim";

type Ring = {id: string; word: string; p: [number, number, number]; r: number; dur?: number; fwd?: number};
export const RINGS: Ring[] = [
  // pedido do usuário: círculo vermelho só em 3 pontos importantes
  {id: "s4", word: "trincava", p: [4.3, -0.55, 1.5], r: 150, dur: 40},
  {id: "s7", word: "areia", p: [7.2, -0.62, 1.2], r: 130, dur: 75},
  {id: "s8", word: "pH", p: [-2.35, 0.25, 1.1], r: 110, dur: 75},
]

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
        return (
          <group key={r.word} position={p} quaternion={q}>
            <mesh renderOrder={11}>
              <ringGeometry args={[R - 11 * px, R + 11 * px, 96, 1, start, len]} />
              {mat(RED)}
            </mesh>
          </group>
        );
      })}
    </>
  );
};
