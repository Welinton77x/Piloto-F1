// Mascote do canal (macacão/camisa/boné azuis), versão do vídeo da F1 simplificada + guarda-chuva.
import React from "react";
import * as THREE from "three";
import {rad} from "../lib/anim";

const Mat: React.FC<{color: string}> = ({color}) => <meshStandardMaterial color={color} flatShading roughness={0.8} />;
const Cap: React.FC<{r: number; l: number; color: string; position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number]}> = ({r, l, color, position, rotation, scale}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <capsuleGeometry args={[r, l, 3, 8]} />
    <Mat color={color} />
  </mesh>
);

const c = {shirt: "#2f6fb5", pants: "#27598f", cap: "#2f6fb5", skin: "#f0bf98", shoe: "#3b2a1f", belt: "#5b3d24"};

export const Mascot: React.FC<{
  position: [number, number, number];
  scale?: number;
  umbrellaTilt?: number; // graus
  umbrellaOpen?: number; // 0-1
  wave?: number; // graus do braço direito
  walking?: boolean;
  gf: number;
}> = ({position, scale = 1, umbrellaTilt = 0, umbrellaOpen = 1, wave = 0, walking = false, gf}) => {
  const step = walking ? Math.sin(gf * 0.5) * 18 : 0;
  const ub = Math.max(0.15, umbrellaOpen);
  return (
    <group position={position} scale={scale}>
      {[-0.1, 0.1].map((x, i) => (
        <group key={x} position={[x, 0.45, 0]} rotation={[rad(i ? step : -step), 0, 0]}>
          <Cap r={0.085} l={0.3} color={c.pants} position={[0, -0.15, 0]} />
          <mesh position={[0, -0.39, 0.05]} scale={[1, 0.65, 1.55]}>
            <icosahedronGeometry args={[0.1, 1]} />
            <Mat color={c.shoe} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0.52, 0]}>
        <Cap r={0.19} l={0.14} color={c.shirt} position={[0, 0.25, 0]} scale={[1.08, 1, 0.8]} />
        <mesh scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.2, 0.19, 0.09, 10]} />
          <Mat color={c.belt} />
        </mesh>
        {/* braço esquerdo levantado, segurando o cabo do guarda-chuva na mão */}
        <group position={[-0.28, 0.4, 0]} rotation={[rad(-60), 0, rad(-15)]}>
          <Cap r={0.07} l={0.2} color={c.shirt} position={[0, -0.17, 0]} />
          <mesh position={[0, -0.36, 0]}>
            <icosahedronGeometry args={[0.085, 1]} />
            <Mat color={c.skin} />
          </mesh>
          {/* o guarda-chuva sai da mão e fica na vertical (desfaz a rotação do braço) */}
          <group position={[0, -0.36, 0]} rotation={new THREE.Euler(rad(60), 0, rad(15), "ZYX")}>
            <group rotation={[0, 0, rad(umbrellaTilt)]}>
              {/* cabo em J abaixo da mão */}
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
                <Mat color="#5b3d24" />
              </mesh>
              <mesh position={[0.05, -0.2, 0]} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.05, 0.018, 5, 8, Math.PI]} />
                <Mat color="#5b3d24" />
              </mesh>
              {/* haste */}
              <mesh position={[0, 0.58, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 1.16, 6]} />
                <Mat color="#3a3a3a" />
              </mesh>
              {/* cobertura em gomos, aberta acima da cabeça */}
              <group position={[0, 1.16 - (1 - ub) * 0.2, 0]} scale={[ub, 1 + (1 - ub) * 0.8, ub]}>
                <mesh>
                  <coneGeometry args={[0.72, 0.3, 8, 1, true]} />
                  <meshStandardMaterial color="#FFC400" flatShading side={THREE.DoubleSide} roughness={0.7} />
                </mesh>
                {Array.from({length: 8}).map((_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return (
                    <mesh key={i} position={[Math.sin(a) * 0.7, -0.15, Math.cos(a) * 0.7]}>
                      <icosahedronGeometry args={[0.025, 0]} />
                      <Mat color="#d39e00" />
                    </mesh>
                  );
                })}
                <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.012, 0.02, 0.1, 6]} />
                  <Mat color="#3a3a3a" />
                </mesh>
              </group>
            </group>
          </group>
        </group>
        {/* braço direito: acena (+wave) */}
        <group position={[0.28, 0.4, 0]} rotation={[0, 0, rad(wave + 5)]}>
          <Cap r={0.07} l={0.2} color={c.shirt} position={[0, -0.17, 0]} />
          <mesh position={[0, -0.36, 0]}>
            <icosahedronGeometry args={[0.085, 1]} />
            <Mat color={c.skin} />
          </mesh>
        </group>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.14, 8]} />
          <Mat color={c.skin} />
        </mesh>
        <group position={[0, 0.78, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.32, 2]} />
            <Mat color={c.skin} />
          </mesh>
          {/* cabelo (nuca e laterais) e orelhas */}
          <mesh position={[0, -0.02, -0.06]} scale={[1.02, 0.9, 0.95]}>
            <sphereGeometry args={[0.325, 12, 8, Math.PI * 0.6, Math.PI * 0.8, 0.9, 1.0]} />
            <meshStandardMaterial color="#3b2a1f" flatShading side={THREE.DoubleSide} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.31, -0.04, 0.02]} scale={[0.5, 1, 0.8]}>
              <icosahedronGeometry args={[0.07, 1]} />
              <Mat color={c.skin} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, -0.01]}>
            <sphereGeometry args={[0.335, 12, 6, 0, Math.PI * 2, 0, 1.05]} />
            <Mat color={c.cap} />
          </mesh>
          <mesh position={[0, 0.1, 0.3]} rotation={[rad(-8), 0, 0]} scale={[1, 0.25, 1]}>
            <cylinderGeometry args={[0.2, 0.22, 0.2, 10, 1, false, -Math.PI / 2, Math.PI]} />
            <Mat color={c.cap} />
          </mesh>
          {[-0.1, 0.1].map((x) => (
            <group key={x}>
              <mesh position={[x, 0, 0.3]} scale={[1, 1.35, 0.5]}>
                <icosahedronGeometry args={[0.04, 1]} />
                <Mat color="#1b1b1b" />
              </mesh>
              <mesh position={[x * 1.6, -0.1, 0.29]} scale={[1, 0.7, 0.4]}>
                <icosahedronGeometry args={[0.04, 1]} />
                <Mat color="#ff8a80" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.1, 0.31]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.014, 5, 10, Math.PI]} />
            <Mat color="#8a3b2a" />
          </mesh>
        </group>
      </group>
    </group>
  );
};
