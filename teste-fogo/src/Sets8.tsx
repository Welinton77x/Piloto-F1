import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {canvasTex, clamp, lerp, rng} from "./util";
import type {V3} from "./Sets5";

/* ===== Objetos do vídeo "Miojo em 3 minutos" — mesmo estilo liso/arredondado do personagem ===== */

const sm = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (color: string, rough = 0.5, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const k = color + rough + JSON.stringify(extra);
    let m = cache.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});
      cache.set(k, m);
    }
    return m;
  };
})();
const texMat = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (key: string, tex: THREE.Texture, rough = 0.7) => {
    let m = cache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({map: tex, roughness: rough});
      cache.set(key, m);
    }
    return m;
  };
})();
const rbox = (() => {
  const cache = new Map<string, THREE.BufferGeometry>();
  return (w: number, h: number, d: number, r = 0.06) => {
    const k = `${w}|${h}|${d}|${r}`;
    let g = cache.get(k);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
      cache.set(k, g);
    }
    return g;
  };
})();

/* ---------- carinha genérica (olhos brilhantes + boca) ---------- */
export type FaceP = {blink?: number; laugh?: number; mouth?: number; sleepy?: number};
const Face: React.FC<{p: V3; s?: number; f?: FaceP; r?: V3}> = ({p, s = 1, f = {}, r = [0, 0, 0]}) => {
  const {blink = 0, laugh = 0, mouth = 0, sleepy = 0} = f;
  const eye = sm("#0c0c10", 0.12);
  const white = sm("#ffffff", 0.2);
  const dark = sm("#3a1510", 0.5);
  const tongue = sm("#e2606e", 0.45);
  const eyeY = Math.max(0.08, 1 - blink - 0.55 * sleepy);
  return (
    <group position={p} rotation={r} scale={s}>
      {[-1, 1].map((sd) =>
        laugh > 0.5 ? (
          /* olhos fechados de rir: ^ ^ */
          <mesh key={sd} position={[0.13 * sd, 0.06, 0]} rotation={[0, 0, Math.PI]} material={eye}>
            <torusGeometry args={[0.045, 0.014, 8, 16, Math.PI]} />
          </mesh>
        ) : (
          <group key={sd} position={[0.13 * sd, 0.06, 0]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.05, 0.06, 0.025]} material={eye}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <mesh position={[0.018, 0.022, 0.02]} scale={0.014} material={white}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ),
      )}
      {mouth > 0.05 || laugh > 0.05 ? (
        <group position={[0, -0.07, 0]}>
          <mesh scale={[0.07 + 0.03 * laugh, 0.02 + 0.06 * Math.max(mouth, laugh), 0.02]} material={dark}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, -0.02 - 0.02 * Math.max(mouth, laugh), 0.012]} scale={[0.04, 0.015 + 0.015 * Math.max(mouth, laugh), 0.012]} material={tongue}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI + 0.3 * Math.PI]} material={dark}>
          <torusGeometry args={[0.05, 0.012, 8, 20, Math.PI * 0.4]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- cozinha ---------- */
const tileTex = () =>
  canvasTex("piso-xadrez", 512, 512, (c) => {
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        c.fillStyle = (i + j) % 2 ? "#f4f1e8" : "#4a90d9";
        c.fillRect(i * 64, j * 64, 64, 64);
      }
  }, [3, 3]);
const wallTex = () =>
  canvasTex("azulejo-cozinha", 512, 512, (c) => {
    c.fillStyle = "#fff6dc";
    c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "#ead9ad";
    c.lineWidth = 4;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 64, 0);
      c.lineTo(i * 64, 512);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i * 64);
      c.lineTo(512, i * 64);
      c.stroke();
    }
  }, [4, 2]);
export const WINDOW_P: V3 = [1.6, 2.1, -2.45];
export const Kitchen: React.FC<{t: number; clockMin?: number}> = ({t, clockMin = 0}) => {
  const counter = sm("#e8412c", 0.5);
  const top = sm("#f2f2ee", 0.35);
  const steel = sm("#cfd4da", 0.3, {metalness: 0.6});
  const dark = sm("#2a2d33", 0.6);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={texMat("piso-xadrez", tileTex(), 0.6)} receiveShadow>
        <planeGeometry args={[12, 12]} />
      </mesh>
      {/* parede do fundo com janela */}
      <group position={[0, 0, -2.6]}>
        <mesh position={[-2.5, 2.5, 0]} material={texMat("azulejo-cozinha", wallTex(), 0.8)} receiveShadow>
          <boxGeometry args={[6.4, 5, 0.2]} />
        </mesh>
        <mesh position={[4.15, 2.5, 0]} material={texMat("azulejo-cozinha", wallTex(), 0.8)} receiveShadow>
          <boxGeometry args={[3.5, 5, 0.2]} />
        </mesh>
        <mesh position={[WINDOW_P[0], 0.75, 0]} material={texMat("azulejo-cozinha", wallTex(), 0.8)} receiveShadow>
          <boxGeometry args={[1.4, 1.5, 0.2]} />
        </mesh>
        <mesh position={[WINDOW_P[0], 4.1, 0]} material={texMat("azulejo-cozinha", wallTex(), 0.8)} receiveShadow>
          <boxGeometry args={[1.4, 1.8, 0.2]} />
        </mesh>
        {/* moldura */}
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[WINDOW_P[0] + x, 2.35, 0.08]} material={sm("#ffffff", 0.5)}>
            <boxGeometry args={[0.1, 1.8, 0.3]} />
          </mesh>
        ))}
        <mesh position={[WINDOW_P[0], 3.22, 0.08]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[1.5, 0.1, 0.3]} />
        </mesh>
        <mesh position={[WINDOW_P[0], 1.5, 0.15]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[1.6, 0.08, 0.45]} />
        </mesh>
      </group>
      {/* paredes laterais */}
      <mesh position={[-4.2, 2.5, 0]} material={sm("#ffd98a", 0.9)}>
        <boxGeometry args={[0.2, 5, 12]} />
      </mesh>
      {/* balcão com fogão */}
      <group position={[-0.6, 0, -2.0]}>
        <mesh position={[0, 0.47, 0]} geometry={rbox(3.4, 0.94, 0.9, 0.06)} material={counter} castShadow receiveShadow />
        <mesh position={[0, 0.97, 0]} geometry={rbox(3.5, 0.08, 0.95, 0.03)} material={top} castShadow receiveShadow />
        {/* bocas do fogão */}
        {[[-0.35, -0.15], [0.35, -0.15], [-0.35, 0.2], [0.35, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.02, z]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
            <torusGeometry args={[0.13, 0.025, 8, 24]} />
          </mesh>
        ))}
        {/* puxadores */}
        {[-1.2, -0.4, 0.4, 1.2].map((x) => (
          <mesh key={x} position={[x, 0.7, 0.47]} material={steel}>
            <boxGeometry args={[0.3, 0.04, 0.04]} />
          </mesh>
        ))}
      </group>
      {/* geladeira */}
      <group position={[-3.2, 0, -1.9]}>
        <mesh position={[0, 1.2, 0]} geometry={rbox(1.1, 2.4, 1.0, 0.12)} material={sm("#e9f6fb", 0.4)} castShadow receiveShadow />
        <mesh position={[0.4, 1.5, 0.52]} material={steel}>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
        </mesh>
      </group>
      {/* relógio de parede grande */}
      <group position={[-1.5, 3.4, -2.45]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#ffffff", 0.4)}>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 32]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]} material={sm("#2f6fd6", 0.4)}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
        </mesh>
        <group position={[0, 0, 0.05]} rotation={[0, 0, -clockMin / 60 * Math.PI * 2]}>
          <mesh position={[0, 0.17, 0]} material={sm("#222", 0.4)}>
            <boxGeometry args={[0.03, 0.34, 0.01]} />
          </mesh>
        </group>
        <group position={[0, 0, 0.05]} rotation={[0, 0, -Math.PI * 2 * 0.75]}>
          <mesh position={[0, 0.11, 0]} material={sm("#222", 0.4)}>
            <boxGeometry args={[0.045, 0.22, 0.01]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/* ---------- panela (com carinha opcional) e a água-bolinha ---------- */
export type PotP = {laugh?: number; tilt?: number; shake?: number; face?: number; t?: number};
export const Pot: React.FC<{p: V3; s?: number; pot?: PotP; children?: React.ReactNode}> = ({p, s = 1, pot = {}, children}) => {
  const {laugh = 0, tilt = 0, shake = 0, face = 0, t = 0} = pot;
  const steel = sm("#c8ced6", 0.25, {metalness: 0.7});
  const dark = sm("#2a2d33", 0.5);
  const jx = shake * 0.03 * Math.sin(t * 60);
  return (
    <group position={[p[0] + jx, p[1], p[2]]} rotation={[0, 0, tilt]} scale={s}>
      <mesh position={[0, 0.22, 0]} material={steel} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.33, 0.44, 32, 1, true]} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={steel}>
        <circleGeometry args={[0.33, 32]} />
      </mesh>
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
        <torusGeometry args={[0.36, 0.02, 8, 32]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.43 * sd, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
          <torusGeometry args={[0.06, 0.022, 8, 16]} />
        </mesh>
      ))}
      {face > 0.01 && <Face p={[0, 0.22, 0.345]} s={0.9 * face} f={{laugh, blink: 0}} />}
      {children}
    </group>
  );
};
/** a água: uma bolinha azul com carinha, dentro da panela */
export type WaterP = {sleepy?: number; laugh?: number; yawn?: number; eyeOpen?: number; t?: number; boil?: number};
export const WaterBlob: React.FC<{w?: WaterP}> = ({w = {}}) => {
  const {sleepy = 0, laugh = 0, yawn = 0, t = 0, boil = 0} = w;
  const bounce = laugh * Math.abs(Math.sin(t * 14)) * 0.08;
  const water = sm("#6cc8f2", 0.08, {emissive: new THREE.Color("#2a7fb0"), emissiveIntensity: 0.15, transparent: true, opacity: 0.92});
  return (
    <group position={[0, 0.52 + bounce, 0]}>
      <mesh scale={[0.34, 0.26 + 0.05 * laugh - 0.03 * sleepy, 0.34]} material={water} castShadow>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>
      <Face p={[0, 0.08, 0.335]} s={0.95} r={[-0.2, 0, 0]} f={{sleepy, laugh, mouth: yawn, blink: sleepy > 0.9 ? 1 : 0}} />
      {/* bolhas fervendo */}
      {boil > 0.01 &&
        Array.from({length: 10}, (_, i) => {
          const k = ((t * (1.4 + (i % 3) * 0.4) + i * 0.13) % 1);
          const a = i * 2.39;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.22, 0.1 + k * 0.5, Math.sin(a) * 0.2]} scale={(0.03 + 0.03 * (i % 2)) * boil * (1 - k * 0.5)} material={water}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          );
        })}
      {boil > 0.01 &&
        [0, 1, 2].map((i) => {
          const k = ((t * 0.6 + i / 3) % 1);
          return (
            <mesh key={"v" + i} position={[Math.sin(t * 2 + i) * 0.1, 0.4 + k * 1.0, 0]} scale={(0.12 + 0.18 * k) * boil} material={sm("#ffffff", 1, {transparent: true, opacity: 0.6 * (1 - k)})}>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
          );
        })}
    </group>
  );
};

/* ---------- miojo ---------- */
const pacoteTex = () =>
  canvasTex("pacote-miojo", 256, 192, (c) => {
    c.fillStyle = "#e8262d";
    c.fillRect(0, 0, 256, 192);
    c.fillStyle = "#ffd21f";
    c.font = "bold 56px sans-serif";
    c.textAlign = "center";
    c.fillText("MIOJO", 128, 80);
    c.font = "bold 26px sans-serif";
    c.fillStyle = "#ffffff";
    c.fillText("3 MINUTOS", 128, 130);
  });
export const MiojoPack: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.26, 0.2, 0.06, 0.02)} material={sm("#e8262d", 0.4)} castShadow />
    <mesh position={[0, 0, 0.031]} material={texMat("pacote-miojo", pacoteTex(), 0.5)}>
      <planeGeometry args={[0.24, 0.18]} />
    </mesh>
  </group>
);
/** bloco de macarrão (com fios soltos) */
export const Noodles: React.FC<{p?: V3; r?: V3; s?: number; strands?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, strands = 6, t = 0}) => {
  const curves = useMemo(
    () =>
      Array.from({length: 8}, (_, i) => {
        const rr = rng(i * 7 + 3);
        const pts = Array.from({length: 7}, (_, k) => new THREE.Vector3((rr() - 0.5) * 0.25, -k * 0.06, (rr() - 0.5) * 0.2));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.012, 5, false);
      }),
    [],
  );
  const noodle = sm("#f6d36a", 0.45);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh geometry={rbox(0.3, 0.12, 0.24, 0.05)} material={noodle} castShadow />
      {Array.from({length: 7}, (_, i) => (
        <mesh key={i} position={[-0.12 + i * 0.04, 0.062, 0]} rotation={[0, 0, Math.sin(i) * 0.3]} material={sm("#e8c050", 0.5)}>
          <torusGeometry args={[0.035, 0.008, 6, 12]} />
        </mesh>
      ))}
      {curves.slice(0, strands).map((g, i) => (
        <mesh key={i} geometry={g} position={[-0.1 + (i % 4) * 0.07, -0.04, (i % 2 ? 0.08 : -0.08)]} rotation={[0, 0, 0.1 * Math.sin(t * 6 + i)]} material={noodle} />
      ))}
    </group>
  );
};

/* ---------- vaca (em pé, estilo boneco) ---------- */
export type CowP = {
  pos?: V3;
  rotY?: number;
  blink?: number;
  mouth?: number;
  headTilt?: number;
  headYaw?: number;
  arms?: "down" | "up" | "crossed" | "give" | "hold" | "eat";
  armK?: number;
  walk?: number;
  walkAmt?: number;
  chef?: boolean;
  apron?: boolean;
  miojoHat?: boolean;
  happy?: number; // olhos de estrelinha / bochecha
  brow?: number;
  lean?: number;
  t?: number;
};
export const Cow: React.FC<{c: CowP; s?: number; palmRef?: React.Ref<THREE.Object3D>}> = ({c, s = 1, palmRef}) => {
  const {pos = [0, 0, 0], rotY = 0, blink = 0, mouth = 0, headTilt = 0, headYaw = 0, arms = "down", armK = 1, walk = 0, walkAmt = 0, chef = false, apron = false, miojoHat = false, happy = 0, brow = 0, lean = 0, t = 0} = c;
  const white = sm("#fbfbf6", 0.55);
  const spot = sm("#26262a", 0.5);
  const pink = sm("#f6a8b8", 0.5);
  const hoof = sm("#3a2a22", 0.5);
  const horn = sm("#f2e3c0", 0.45);
  const eye = sm("#0c0c10", 0.12);
  const shine = sm("#ffffff", 0.2);
  const sw = Math.sin(walk) * 0.4 * walkAmt;
  // ombros: [x rot, z rot] por pose de braço
  const armRot = (sd: number): [number, number, number] => {
    const k = armK;
    switch (arms) {
      case "up":
        return [-2.6 * k, 0, sd * (0.3 + 0.2 * k)];
      case "crossed":
        // antebraços na frente do peito, um acima do outro (ângulos resolvidos numericamente)
        return sd > 0 ? [-1.405 * k, -1.061 * k, -0.736 * k] : [-1.192 * k, 1.046 * k, 0.66 * k];
      case "give":
        return sd > 0 ? [-1.3 * k, 0, 0.15] : [0.1, 0, 0.15 * sd];
      case "hold":
        return [-1.0 * k, 0, -sd * 0.35 * k];
      case "eat":
        return sd > 0 ? [-2.0 * k, 0, -0.6 * k] : [-0.4, 0, 0.2 * sd];
      default:
        return [-sw * sd, 0, sd * 0.15];
    }
  };
  const elbow = (sd: number) => (arms === "crossed" ? (sd > 0 ? -0.939 : -0.818) * armK : arms === "eat" && sd > 0 ? -1.4 * armK : arms === "hold" ? -0.9 * armK : -0.2);
  const eyeY = Math.max(0.08, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[lean, 0, 0]}>
        {/* pernas */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.15 * sd, 0.62, 0]} rotation={[sw * sd, 0, 0]}>
            <mesh position={[0, -0.27, 0]} material={white} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.55, 20]} />
            </mesh>
            <mesh position={[0, -0.56, 0.02]} geometry={rbox(0.24, 0.12, 0.28, 0.05)} material={hoof} castShadow />
          </group>
        ))}
        {/* corpo */}
        <mesh position={[0, 1.02, 0]} geometry={rbox(0.62, 0.8, 0.46, 0.18)} material={white} castShadow receiveShadow />
        {[[0.18, 1.15, 0.2, 0.1], [-0.2, 0.85, 0.22, 0.08], [0.1, 0.8, -0.22, 0.12], [-0.22, 1.2, -0.2, 0.09]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[r * 1.4, r, 0.03]} rotation={[0, z > 0 ? 0 : Math.PI, 0]} material={spot}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        ))}
        {apron && (
          <mesh position={[0, 0.98, 0.24]} geometry={rbox(0.46, 0.6, 0.02, 0.01)} material={sm("#ffffff", 0.6)} />
        )}
        {/* rabinho */}
        <mesh position={[0, 0.9, -0.28]} rotation={[0.6 + 0.2 * Math.sin(t * 4), 0, 0]} material={white}>
          <capsuleGeometry args={[0.025, 0.3, 4, 8]} />
        </mesh>
        {/* braços */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.38 * sd, 1.3, 0]} rotation={armRot(sd)}>
            <mesh position={[0, -0.18, 0]} material={white} castShadow>
              <capsuleGeometry args={[0.085, 0.24, 8, 14]} />
            </mesh>
            <group position={[0, -0.36, 0]} rotation={[elbow(sd), 0, 0]}>
              <mesh position={[0, -0.12, 0]} material={white} castShadow>
                <capsuleGeometry args={[0.08, 0.16, 8, 14]} />
              </mesh>
              <mesh position={[0, -0.27, 0]} material={hoof} castShadow>
                <sphereGeometry args={[0.09, 14, 10]} />
              </mesh>
              {sd > 0 && <object3D ref={palmRef} position={[0, -0.3, 0.08]} />}
            </group>
          </group>
        ))}
        {/* cabeça */}
        <group position={[0, 1.72, 0.04]} rotation={[headTilt, headYaw, 0, "YXZ"]}>
          <mesh geometry={rbox(0.62, 0.52, 0.5, 0.2)} material={white} castShadow />
          <mesh position={[0.16, 0.12, 0.2]} scale={[0.1, 0.09, 0.08]} material={spot}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          {/* focinho rosa */}
          <mesh position={[0, -0.13, 0.26]} geometry={rbox(0.5, 0.26, 0.16, 0.08)} material={pink} castShadow />
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.1 * sd, -0.1, 0.345]} scale={[0.03, 0.04, 0.01]} material={sm("#b06070", 0.5)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ))}
          {/* boca */}
          {mouth > 0.05 ? (
            <mesh position={[0, -0.2, 0.34]} scale={[0.08, 0.02 + 0.05 * mouth, 0.02]} material={sm("#5a1a24", 0.5)}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          ) : (
            <mesh position={[0, -0.19, 0.345]} rotation={[0, 0, Math.PI + 0.3 * Math.PI]} material={sm("#5a1a24", 0.5)}>
              <torusGeometry args={[0.06, 0.012, 8, 20, Math.PI * 0.4]} />
            </mesh>
          )}
          {/* olhos */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.14 * sd, 0.08, 0.255]} scale={[1, eyeY, 1]}>
              {happy > 0.5 ? (
                <mesh rotation={[0, 0, 0]} scale={0.6} material={sm("#ffd21f", 0.3, {emissive: new THREE.Color("#ffb000"), emissiveIntensity: 0.4})}>
                  <octahedronGeometry args={[0.08, 0]} />
                </mesh>
              ) : (
                <>
                  <mesh scale={[0.05, 0.06, 0.025]} material={eye}>
                    <sphereGeometry args={[1, 16, 12]} />
                  </mesh>
                  <mesh position={[0.018, 0.022, 0.02]} scale={0.014} material={shine}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                </>
              )}
            </group>
          ))}
          {/* sobrancelhas (só quando brava/desconfiada) */}
          {brow !== 0 &&
            [-1, 1].map((sd) => (
              <mesh key={sd} position={[0.14 * sd, 0.17, 0.26]} rotation={[0, 0, sd * 0.35 * brow]} material={spot}>
                <capsuleGeometry args={[0.014, 0.07, 4, 8]} />
              </mesh>
            ))}
          {/* bochechas */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.24 * sd, -0.02, 0.24]} rotation={[0, 0.5 * sd, 0]} scale={[0.05, 0.03, 0.01]} material={sm("#ff9aa8", 0.6)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ))}
          {/* orelhas e chifres */}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh position={[0.36 * sd, 0.1, 0]} rotation={[0, 0, sd * -0.5]} scale={[0.14, 0.06, 0.08]} material={white}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
              <mesh position={[0.38 * sd, 0.1, 0.03]} rotation={[0, 0, sd * -0.5]} scale={[0.1, 0.035, 0.03]} material={pink}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh position={[0.2 * sd, 0.32, 0]} rotation={[0, 0, sd * -0.4]} material={horn} castShadow>
                <coneGeometry args={[0.05, 0.16, 12]} />
              </mesh>
            </group>
          ))}
          {/* chapéu de cozinheira */}
          {chef && (
            <group position={[0, 0.34, -0.02]}>
              <mesh material={sm("#ffffff", 0.6)}>
                <cylinderGeometry args={[0.2, 0.2, 0.18, 24]} />
              </mesh>
              {[[-0.1, 0], [0.1, 0], [0, 0.06], [0, -0.08]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.18, z]} material={sm("#ffffff", 0.6)}>
                  <sphereGeometry args={[0.14, 16, 12]} />
                </mesh>
              ))}
            </group>
          )}
          {/* miojo de chapéu */}
          {miojoHat && <Noodles p={[0, 0.33, 0]} s={1.3} strands={8} t={t} />}
        </group>
      </group>
    </group>
  );
};

/* ---------- patinete ---------- */
export const Scooter: React.FC<{p: V3; rotY?: number; spin?: number}> = ({p, rotY = 0, spin = 0}) => {
  const red = sm("#e8412c", 0.4, {metalness: 0.2});
  const dark = sm("#24272d", 0.6);
  const steel = sm("#cfd4da", 0.3, {metalness: 0.6});
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.12, 0]} geometry={rbox(0.24, 0.05, 0.9, 0.02)} material={red} castShadow />
      {[-0.42, 0.45].map((z) => (
        <mesh key={z} position={[0, 0.08, z]} rotation={[spin, 0, Math.PI / 2]} material={dark} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0.45]} rotation={[-0.15, 0, 0]} material={steel} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.95, 10]} />
      </mesh>
      <mesh position={[0, 1.0, 0.52]} rotation={[0, 0, Math.PI / 2]} material={steel}>
        <cylinderGeometry args={[0.022, 0.022, 0.5, 10]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.25 * sd, 1.0, 0.52]} rotation={[0, 0, Math.PI / 2]} material={dark}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 10]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- restaurante "MIOJO DA MIMOSA" ---------- */
const placaTex = () =>
  canvasTex("placa-mimosa", 1024, 256, (c) => {
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 1024, 256);
    c.strokeStyle = "#e8412c";
    c.lineWidth = 18;
    c.strokeRect(9, 9, 1006, 238);
    c.fillStyle = "#e8412c";
    c.font = "bold 120px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("MIOJO DA MIMOSA", 512, 136);
  });
const awningTex = () =>
  canvasTex("toldo", 256, 32, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? "#ffffff" : "#e8412c";
      c.fillRect(i * 32, 0, 32, 32);
    }
  });
export const Restaurant: React.FC<{p: V3; s?: number; open?: number}> = ({p, s = 1, open = 1}) => {
  const k = clamp(open);
  if (k <= 0) return null;
  return (
    <group position={p} scale={[s * k, s * (0.2 + 0.8 * k), s * k]}>
      <mesh position={[0, 1.4, -1.3]} geometry={rbox(3.4, 2.8, 0.2, 0.08)} material={sm("#fff1d0", 0.8)} castShadow receiveShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.6 * sd, 1.4, -0.3]} geometry={rbox(0.2, 2.8, 2.2, 0.08)} material={sm("#fff1d0", 0.8)} castShadow receiveShadow />
      ))}
      <mesh position={[0, 2.85, -0.25]} geometry={rbox(3.6, 0.18, 2.4, 0.08)} material={sm("#e8412c", 0.6)} castShadow />
      <mesh position={[0, 0.01, -0.3]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9c8a0", 0.8)}>
        <planeGeometry args={[3.2, 2.0]} />
      </mesh>
      {/* prateleira com pacotes de miojo no fundo */}
      <mesh position={[0, 1.8, -1.15]} geometry={rbox(2.6, 0.06, 0.25, 0.02)} material={sm("#c98a4b", 0.7)} />
      {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((x) => (
        <mesh key={x} position={[x, 1.93, -1.12]} geometry={rbox(0.26, 0.2, 0.06, 0.02)} material={sm("#e8262d", 0.4)} />
      ))}
      {/* balcão */}
      <mesh position={[0, 0.55, 0.85]} geometry={rbox(3.2, 1.1, 0.6, 0.08)} material={sm("#e8412c", 0.5)} castShadow receiveShadow />
      <mesh position={[0, 1.13, 0.85]} geometry={rbox(3.3, 0.08, 0.7, 0.03)} material={sm("#f2f2ee", 0.4)} castShadow />

      {/* toldo listrado */}
      <mesh position={[0, 2.45, 1.0]} rotation={[0.45, 0, 0]} material={texMat("toldo", awningTex(), 0.7)} castShadow>
        <boxGeometry args={[3.5, 0.05, 1.0]} />
      </mesh>
      {/* placa */}
      <mesh position={[0, 3.15, 0.62]} material={texMat("placa-mimosa", placaTex(), 0.6)} castShadow>
        <boxGeometry args={[3.2, 0.8, 0.1]} />
      </mesh>
      {/* sininho */}
      <group position={[1.1, 1.22, 0.95]}>
        <mesh material={sm("#f2c94c", 0.3, {metalness: 0.7})}>
          <sphereGeometry args={[0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, -0.01, 0]} material={sm("#3a3a3a", 0.5)}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- copo de leite ---------- */
export const MilkGlass: React.FC<{p?: V3; r?: V3; s?: number; level?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, level = 0.85}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.11, 0]} material={sm("#dff3ff", 0.05, {transparent: true, opacity: 0.35})}>
      <cylinderGeometry args={[0.065, 0.055, 0.22, 20, 1, true]} />
    </mesh>
    <mesh position={[0, 0.11 * level, 0]} material={sm("#ffffff", 0.4)}>
      <cylinderGeometry args={[0.06, 0.054, 0.22 * level, 20]} />
    </mesh>
  </group>
);

/* ---------- planeta com a fila em volta ---------- */
export const PLANET_R = 3;
const continents = (() => {
  const r = rng(51);
  return Array.from({length: 9}, () => {
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    return {d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)), s: 0.6 + r() * 0.9};
  });
})();
/** posição de um ponto da fila (k = 0..1 ao longo do equador inclinado), um pouco acima da superfície */
export const queuePoint = (k: number, h = 0): V3 => {
  const a = Math.PI / 2 - k * Math.PI * 2 * 0.985;
  const v = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);
  const r = PLANET_R + h;
  return [v.x * r, v.y * r, v.z * r];
};
export const Planet: React.FC<{t: number; queue: number; n?: number; spin?: number}> = ({t, queue, n = 140, spin = 0}) => {
  const ocean = sm("#2f8fe0", 0.35);
  const land = sm("#5cbf4a", 0.6);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const geos = useMemo(() => {
    const b = new THREE.CapsuleGeometry(0.06, 0.1, 4, 10);
    b.translate(0, 0.11, 0);
    const h = new THREE.SphereGeometry(0.06, 12, 8);
    h.translate(0, 0.27, 0);
    return {b, h};
  }, []);
  const mats = useMemo(() => ({b: new THREE.MeshStandardMaterial({roughness: 0.5}), h: new THREE.MeshStandardMaterial({color: "#e0b08a", roughness: 0.5})}), []);
  const cols = ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#ff6f91", "#f39c12", "#1abc9c"].map((c) => new THREE.Color(c));
  useFrame(() => {
    const B = bodyRef.current;
    const H = headRef.current;
    if (!B || !H) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const shown = Math.floor(n * clamp(queue));
    for (let i = 0; i < n; i++) {
      const p = queuePoint(i / n);
      const v = new THREE.Vector3(...p);
      q.setFromUnitVectors(up, v.clone().normalize());
      m.compose(v, q, new THREE.Vector3(1, i < shown ? 1 : 0.0001, 1));
      B.setMatrixAt(i, m);
      H.setMatrixAt(i, m);
      B.setColorAt(i, cols[i % cols.length]);
    }
    B.instanceMatrix.needsUpdate = true;
    H.instanceMatrix.needsUpdate = true;
    if (B.instanceColor) B.instanceColor.needsUpdate = true;
  }, -1);
  return (
    <group rotation={[0, spin, 0]}>
      <mesh material={ocean} receiveShadow>
        <sphereGeometry args={[PLANET_R, 48, 32]} />
      </mesh>
      {continents.map((c, i) => {
        const p = c.d.clone().multiplyScalar(PLANET_R * 0.985);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.d);
        return (
          <mesh key={i} position={p} quaternion={q} scale={[c.s, 0.12, c.s * 0.8]} material={land}>
            <sphereGeometry args={[1, 20, 10]} />
          </mesh>
        );
      })}
      <instancedMesh ref={bodyRef} args={[geos.b, mats.b, n]} frustumCulled={false} />
      <instancedMesh ref={headRef} args={[geos.h, mats.h, n]} frustumCulled={false} />
    </group>
  );
};
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
