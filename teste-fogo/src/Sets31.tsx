import React, {useEffect, useState} from "react";
import * as THREE from "three";
import {continueRender, delayRender, staticFile} from "remotion";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";
import {rng} from "./util";

/* ---------- textura de imagem (espera carregar antes do frame) ---------- */
const texCache = new Map<string, THREE.Texture>();
export const useImgTex = (file: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(texCache.get(file) ?? null);
  const [handle] = useState(() => (texCache.has(file) ? null : delayRender("tex " + file)));
  useEffect(() => {
    if (tex) return;
    new THREE.TextureLoader().load(
      staticFile(file),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        texCache.set(file, t);
        setTex(t);
        if (handle !== null) continueRender(handle);
      },
      undefined,
      () => handle !== null && continueRender(handle),
    );
  }, [file, handle, tex]);
  return tex;
};

/* ---------- copo de açaí da Vibe ---------- */
const CANDY = ["#3a86ff", "#2ecc71", "#ff4d6d", "#ffd21f", "#ff8a1f", "#f06292"];
export const AcaiCup: React.FC<{p?: V3; r?: V3; s?: number; glow?: number; logo?: boolean}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, glow = 0, logo = true}) => {
  const tex = useImgTex("acai/logo.png");
  const acai = sm("#34082f", 0.5, {emissive: "#4a1050", emissiveIntensity: 0.05 + glow * 0.12});
  const cream = sm("#f4ead2", 0.5);
  const cup = sm("#ffffff", 0.1, {transparent: true, opacity: 0.1});
  const R = rng(31);
  const candies = Array.from({length: 10}, (_, i) => {
    const a = R() * Math.PI * 2;
    const d = 0.08 + R() * 0.22;
    return {p: [Math.cos(a) * d, 1.08 + R() * 0.06, Math.sin(a) * d] as V3, c: CANDY[i % CANDY.length]};
  });
  return (
    <group position={p} rotation={r} scale={s}>
      {/* copo transparente */}
      <mesh position={[0, 0.5, 0]} material={cup}>
        <cylinderGeometry args={[0.43, 0.33, 1.0, 28, 1, true]} />
      </mesh>
      {/* açaí com faixas de creme */}
      <mesh position={[0, 0.5, 0]} material={acai} castShadow>
        <cylinderGeometry args={[0.41, 0.31, 0.98, 28]} />
      </mesh>
      {[0.22, 0.52, 0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0.08 * (i - 1), 0, 0.06 * (1 - i)]} material={cream}>
          <cylinderGeometry args={[0.333 + y * 0.085, 0.33 + y * 0.085, 0.035, 28]} />
        </mesh>
      ))}
      {/* cobertura: creme em domo */}
      <mesh position={[0, 1.0, 0]} scale={[1, 0.35, 1]} material={cream}>
        <sphereGeometry args={[0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* bananas */}
      {Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.34, 1.04, Math.sin(a) * 0.34]} rotation={[0.5 * Math.sin(a), 0, -0.5 * Math.cos(a)]} material={sm("#f7e7a8", 0.5)}>
            <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
          </mesh>
        );
      })}
      {/* morangos */}
      {[0.6, 2.4, 4.3].map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.22, 1.14, Math.sin(a) * 0.22]} rotation={[Math.PI, 0, 0.3 * (i - 1)]}>
          <mesh material={sm("#e8262d", 0.35)}>
            <coneGeometry args={[0.09, 0.2, 10]} />
          </mesh>
          <mesh position={[0, -0.11, 0]} material={sm("#2e9e3a", 0.6)}>
            <coneGeometry args={[0.07, 0.04, 6]} />
          </mesh>
        </group>
      ))}
      {/* wafers listrados */}
      {[1.3, 3.4, 5.3].map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.12, 1.17, Math.sin(a) * 0.12]} rotation={[0.3, a, 0.2]}>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[0, -0.045 + k * 0.03, 0]} material={sm(k % 2 ? "#6b3a1e" : "#f3e6cc", 0.6)}>
              <boxGeometry args={[0.13, 0.03, 0.09]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* confeitos coloridos */}
      {candies.map((c, i) => (
        <mesh key={i} position={c.p} material={sm(c.c, 0.25)}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}
      {/* adesivo da Vibe */}
      {logo && tex && (
        <mesh position={[0, 0.5, 0.385]} rotation={[-0.1, 0, 0]}>
          <circleGeometry args={[0.22, 32]} />
          <meshBasicMaterial map={tex} toneMapped={false} transparent />
        </mesh>
      )}
    </group>
  );
};

/* ---------- colher ---------- */
export const Spoon: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.16, 0]} material={sm("#d8dde6", 0.2, {metalness: 0.6})}>
      <cylinderGeometry args={[0.012, 0.016, 0.26, 8]} />
    </mesh>
    <mesh position={[0, 0.0, 0]} scale={[1, 1.4, 0.4]} material={sm("#d8dde6", 0.2, {metalness: 0.6})}>
      <sphereGeometry args={[0.045, 12, 8]} />
    </mesh>
  </group>
);

/* ---------- giroflex de alerta ---------- */
export const Siren: React.FC<{p: V3; t: number; s?: number}> = ({p, t, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.2, 0]} material={sm("#5a5f6a", 0.5)}>
      <cylinderGeometry args={[0.05, 0.06, 2.4, 10]} />
    </mesh>
    <mesh position={[0, 2.5, 0]} material={sm("#e8262d", 0.2, {emissive: "#ff2020", emissiveIntensity: 1.5 + Math.sin(t * 14) * 1.2})}>
      <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 2.46, 0]} material={sm("#2a2a32", 0.5)}>
      <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
    </mesh>
    <pointLight position={[Math.cos(t * 10) * 0.6, 2.6, Math.sin(t * 10) * 0.6]} color="#ff2020" intensity={8} distance={7} />
  </group>
);

/* ---------- laboratório dos especialistas ---------- */
export const Lab: React.FC<{t: number}> = ({t}) => {
  const wall = sm("#dfe9f2", 0.8);
  return (
    <group>
      <mesh position={[0, 2, -2.2]} material={wall} receiveShadow>
        <boxGeometry args={[12, 4, 0.1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c9d3dc", 0.7)} receiveShadow>
        <planeGeometry args={[14, 10]} />
      </mesh>
      {/* bancada */}
      <mesh position={[0, 0.45, -1.4]} geometry={rbox(4.2, 0.9, 0.9, 0.04)} material={sm("#f4f6f8", 0.4)} castShadow receiveShadow />
      {/* frascos borbulhando */}
      {[-1.6, -1.1, 1.2, 1.7].map((x, i) => (
        <group key={i} position={[x, 0.9, -1.4]}>
          <mesh position={[0, 0.16, 0]} material={sm("#ffffff", 0.1, {transparent: true, opacity: 0.35})}>
            <cylinderGeometry args={[0.07, 0.11, 0.32, 14]} />
          </mesh>
          <mesh position={[0, 0.09, 0]} material={sm(["#7a2a8a", "#3ee0c0", "#ffd21f", "#ff4d6d"][i], 0.3, {emissive: ["#7a2a8a", "#3ee0c0", "#ffd21f", "#ff4d6d"][i], emissiveIntensity: 0.6})}>
            <cylinderGeometry args={[0.065, 0.1, 0.17, 14]} />
          </mesh>
          <mesh position={[0, 0.36 + ((t * 0.8 + i * 0.3) % 1) * 0.4, 0]} material={sm("#ffffff", 0.3, {transparent: true, opacity: 0.7})}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* quadro com gráfico */}
      <mesh position={[0, 2.3, -2.12]} geometry={rbox(2.4, 1.3, 0.05, 0.03)} material={sm("#ffffff", 0.6)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.8 + i * 0.4, 1.85 + (0.12 + i * i * 0.04) / 2, -2.08]} material={sm(i === 4 ? "#e8262d" : "#7a2a8a", 0.5)}>
          <boxGeometry args={[0.22, 0.12 + i * i * 0.04, 0.03]} />
        </mesh>
      ))}
    </group>
  );
};
