import React, {useMemo} from "react";
import * as THREE from "three";
import {rng} from "./util";

export type Pose = {
  pos?: [number, number, number];
  rotY?: number;
  head?: [number, number, number];
  torso?: [number, number, number];
  rShoulder?: [number, number, number]; // braço direito (lado -x quando ele olha para +z)
  rElbow?: number;
  rWrist?: [number, number, number];
  lShoulder?: [number, number, number];
  lElbow?: number;
  lWrist?: [number, number, number];
  blink?: number; // 0 aberto .. 1 fechado
  eyeWide?: number; // 0..1
  pupil?: [number, number];
  glow?: number; // olhos em brasa
  brow?: number; // -1 bravo .. 0 neutro .. 1 surpreso
  mouthOpen?: number; // 0..1
  smile?: number; // 0..1 (sorriso de canto)
  breathe?: number;
  rFist?: number; // 0 mão aberta .. 1 fechada
  squash?: number; // >0 amassa (aterrissagem), <0 estica
  hair?: [number, number]; // balanço do cabelo (inércia)
  hairLift?: number; // cabelo levantando com o calor
  walk?: number; // fase da caminhada (radianos)
  walkAmt?: number; // 0 parado .. 1 andando
  heat?: number; // pele avermelhando (calor)
  legLift?: number; // 0..1 pernas dobradas (sentado/pulando)
};

const SKIN = "#f1c08f";
const SHIRT = "#d4302a";
const PANTS = "#6d7480";
const HAIR = "#a4501f";
const SHOE = "#2c2f3a";

const std = (color: string, rough = 0.75, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});

/** Visual do personagem (o Caio usa o padrão; figurantes trocam cores e acessórios) */
export type Look = {
  skin?: string;
  shirt?: string;
  trim?: string;
  pants?: string;
  hair?: string;
  hairStyle?: "spiky" | "short" | "bald";
  shorts?: boolean;
  coat?: string; // casaco por cima (inverno)
  scarf?: string;
  cap?: string; // boné
  glasses?: boolean;
};

const useMats = (L: Look) =>
  useMemo(
    () => ({
      skin: std(L.skin ?? SKIN, 0.6),
      shirt: std(L.shirt ?? SHIRT, 0.85),
      trim: std(L.trim ?? "#8f1712", 0.8),
      pants: std(L.pants ?? PANTS, 0.9),
      hair: std(L.hair ?? HAIR, 0.55),
      coat: std(L.coat ?? "#335", 0.9),
      scarf: std(L.scarf ?? "#c33", 0.95),
      cap: std(L.cap ?? "#235", 0.7),
      frame: std("#222", 0.4),
      shoe: std(SHOE, 0.6),
      white: std("#ffffff", 0.3),
      dark: std("#2a1a12", 0.3),
      mouth: std("#5b1d1d", 0.6),
      tongue: std("#e0707a", 0.6),
      blush: new THREE.MeshBasicMaterial({color: "#ff8f8f", transparent: true, opacity: 0.35, depthWrite: false}),
      pupil: new THREE.MeshStandardMaterial({color: "#3a2416", roughness: 0.3, emissive: new THREE.Color("#ff6a00"), emissiveIntensity: 0}),
      sole: std("#e9e9ee", 0.7),
    }),
    [L.skin, L.shirt, L.trim, L.pants, L.hair, L.coat, L.scarf, L.cap],
  );

/* Cabelo espetado: direções determinísticas */
const useSpikes = () =>
  useMemo(() => {
    const r = rng(42);
    const list: {p: THREE.Vector3; q: THREE.Quaternion; s: number}[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const add = (dir: THREE.Vector3, s: number, rad = 0.235) => {
      dir.normalize();
      list.push({p: dir.clone().multiplyScalar(rad), q: new THREE.Quaternion().setFromUnitVectors(up, dir), s});
    };
    // coroa e nuca
    for (let i = 0; i < 26; i++) {
      const theta = 0.15 + r() * 1.35; // ângulo a partir do topo
      const phi = Math.PI * 0.15 + r() * Math.PI * 1.7; // evita a testa (phi ~ 0 = frente)
      const d = new THREE.Vector3(Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi));
      d.y += 0.35;
      add(d, 0.8 + r() * 0.55);
    }
    // franja caindo sobre a testa
    for (let i = 0; i < 6; i++) {
      const x = -0.75 + i * 0.3 + (r() - 0.5) * 0.1;
      add(new THREE.Vector3(x * 0.55, 0.55 + r() * 0.15, 0.9), 0.55 + r() * 0.25, 0.25);
    }
    return list;
  }, []);

const Arm: React.FC<{
  side: 1 | -1;
  shoulder: [number, number, number];
  elbow: number;
  wrist: [number, number, number];
  fist: number;
  m: ReturnType<typeof useMats>;
  palmRef?: React.Ref<THREE.Object3D>;
  coat?: boolean;
}> = ({side, shoulder, elbow, wrist, fist, m, palmRef, coat}) => (
  <group position={[0.27 * side, 1.27, 0]} rotation={shoulder}>
    <mesh position={[0.005 * side, -0.06, 0]} material={coat ? m.coat : m.shirt} castShadow scale={coat ? 1.15 : 1}>
      <capsuleGeometry args={[0.085, 0.07, 8, 16]} />
    </mesh>
    <mesh position={[0, -0.17, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? 1.35 : 1}>
      <capsuleGeometry args={[0.058, 0.16, 8, 16]} />
    </mesh>
    <group position={[0, -0.3, 0]} rotation={[elbow, 0, 0]}>
      <mesh position={[0, -0.12, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? 1.35 : 1}>
        <capsuleGeometry args={[0.052, 0.17, 8, 16]} />
      </mesh>
      <group position={[0, -0.27, 0]} rotation={wrist}>
        {/* palma */}
        <mesh position={[0, -0.05, 0]} scale={[1, 1.1 - 0.35 * fist, 0.62]} material={m.skin} castShadow>
          <sphereGeometry args={[0.068, 20, 16]} />
        </mesh>
        {/* dedos (somem quando fecha) */}
        {[-1, 0, 1].map((k) => (
          <mesh key={k} position={[k * 0.03, -0.12 + 0.05 * fist, 0.005 + 0.03 * fist]} rotation={[-1.4 * fist, 0, 0]} material={m.skin} castShadow>
            <capsuleGeometry args={[0.016, 0.05 * (1 - 0.6 * fist), 6, 8]} />
          </mesh>
        ))}
        {/* polegar */}
        <mesh position={[-0.062 * side, -0.035, 0.02]} rotation={[0.3, 0, 0.7 * side]} material={m.skin} castShadow>
          <capsuleGeometry args={[0.019, 0.045, 6, 8]} />
        </mesh>
        {/* ponto da palma onde nasce a chama */}
        <object3D ref={palmRef} position={[0, -0.06, 0.07]} />
      </group>
    </group>
  </group>
);

export const Boy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; look?: Look}> = ({pose, palmRef, look = {}}) => {
  const m = useMats(look);
  const coat = !!look.coat;
  const style = look.hairStyle ?? "spiky";
  const spikes = useSpikes();
  const {
    pos = [0, 0, 0],
    rotY = 0,
    head = [0, 0, 0],
    torso = [0, 0, 0],
    rShoulder = [0, 0, -0.08],
    rElbow = -0.15,
    rWrist = [0, 0, 0],
    lShoulder = [0, 0, 0.08],
    lElbow = -0.15,
    lWrist = [0, 0, 0],
    blink = 0,
    eyeWide = 0,
    pupil = [0, 0],
    glow = 0,
    brow = 0,
    mouthOpen = 0,
    smile = 0,
    breathe = 0,
    rFist = 0,
    squash = 0,
    hair = [0, 0],
    hairLift = 0,
    walk = 0,
    walkAmt = 0,
    heat = 0,
    legLift = 0,
  } = pose;
  m.skin.emissive.set("#ff2a00");
  m.skin.emissiveIntensity = heat * 0.6;
  m.pupil.emissiveIntensity = glow * 6;
  const eyeY = (1 - blink) * (1 + eyeWide * 0.25);
  const browY = 0.105 + brow * 0.03 + eyeWide * 0.015;
  const browRot = brow < 0 ? brow * 0.35 : brow * 0.12;
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={[1 + squash * 0.5, 1 - squash, 1 + squash * 0.5]}>
      {/* pernas */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.1 * s, 0.78, 0]} rotation={[Math.sin(walk + (s > 0 ? 0 : Math.PI)) * 0.5 * walkAmt - 0.9 * legLift, 0, 0]}>
          <group position={[0, -0.78, 0]}>
          {look.shorts ? (
            <>
              <mesh position={[0, 0.6, 0]} material={m.pants} castShadow receiveShadow>
                <capsuleGeometry args={[0.095, 0.16, 8, 16]} />
              </mesh>
              <mesh position={[0, 0.3, 0]} material={m.skin} castShadow receiveShadow>
                <capsuleGeometry args={[0.068, 0.42, 8, 16]} />
              </mesh>
            </>
          ) : (
            <mesh position={[0, 0.42, 0]} material={m.pants} castShadow receiveShadow>
              <capsuleGeometry args={[0.085, 0.5, 8, 16]} />
            </mesh>
          )}
          <mesh position={[0, 0.06, 0.04]} scale={[1, 0.7, 1.5]} material={m.shoe} castShadow>
            <sphereGeometry args={[0.085, 16, 12]} />
          </mesh>
          <mesh position={[0, 0.02, 0.04]} scale={[1.05, 0.25, 1.55]} material={m.sole}>
            <sphereGeometry args={[0.085, 16, 12]} />
          </mesh>
          </group>
        </group>
      ))}
      <group rotation={torso} position={[0, 0, 0]}>
        {/* tronco */}
        <mesh position={[0, 1.07 + breathe * 0.006, 0]} scale={[1, 1, 0.7]} material={m.shirt} castShadow receiveShadow>
          <capsuleGeometry args={[0.2, 0.3, 10, 24]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} scale={[1, 1, 0.7]} material={m.pants} castShadow>
          <cylinderGeometry args={[0.185, 0.17, 0.28, 24]} />
        </mesh>
        {/* gola */}
        <mesh position={[0, 1.3, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.75, 1]} material={m.trim}>
          <torusGeometry args={[0.085, 0.022, 8, 20]} />
        </mesh>
        {/* pescoço */}
        <mesh position={[0, 1.33, 0]} material={m.skin}>
          <cylinderGeometry args={[0.055, 0.06, 0.12, 12]} />
        </mesh>
        <Arm side={-1} shoulder={rShoulder} elbow={rElbow} wrist={rWrist} fist={rFist} m={m} palmRef={palmRef} coat={coat} />
        <Arm side={1} shoulder={lShoulder} elbow={lElbow} wrist={lWrist} fist={0} m={m} coat={coat} />
        {coat && (
          <>
            <mesh position={[0, 1.02, 0]} scale={[1.18, 1.05, 0.9]} material={m.coat} castShadow>
              <capsuleGeometry args={[0.2, 0.34, 10, 24]} />
            </mesh>
            <mesh position={[0, 1.33, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.scarf} castShadow>
              <torusGeometry args={[0.1, 0.045, 10, 20]} />
            </mesh>
            <mesh position={[0.06, 1.18, 0.15]} rotation={[0.2, 0, 0.15]} material={m.scarf}>
              <boxGeometry args={[0.07, 0.22, 0.03]} />
            </mesh>
          </>
        )}
        {/* cabeça */}
        <group position={[0, 1.6, 0]} rotation={head}>
          <mesh scale={[1, 1.04, 0.96]} material={m.skin} castShadow>
            <sphereGeometry args={[0.27, 40, 32]} />
          </mesh>
          {/* orelhas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.262 * s, -0.02, 0]} scale={[0.5, 1, 0.8]} material={m.skin}>
              <sphereGeometry args={[0.06, 12, 10]} />
            </mesh>
          ))}
          <group rotation={[hair[0] - 0.12 * hairLift, 0, hair[1]]} position={[0, 0.03 * hairLift, 0]} scale={[1, 1 + 0.12 * hairLift, 1]}>
          {/* calota do cabelo */}
          {style !== "bald" && <mesh position={[0, 0.02, -0.01]} rotation={[0.12, 0, 0]} material={m.hair} castShadow>
            <sphereGeometry args={[0.285, 32, 16, 0, Math.PI * 2, 0, 1.3]} />
          </mesh>}
          {style === "bald" && [-1, 1].map((sd) => (
            <mesh key={sd} position={[0.24 * sd, 0.02, -0.06]} scale={[0.35, 0.7, 0.9]} material={m.hair}>
              <sphereGeometry args={[0.14, 12, 10]} />
            </mesh>
          ))}
          {style !== "bald" && spikes.map((sp, i) => (
            <mesh key={i} position={sp.p} quaternion={sp.q} scale={style === "short" ? sp.s * 0.45 : sp.s} material={m.hair} castShadow>
              <coneGeometry args={[0.09, 0.3, 7]} />
            </mesh>
          ))}
          </group>
          {look.cap && (
            <group position={[0, 0.1, 0]} rotation={[-0.15, 0, 0]}>
              <mesh material={m.cap} castShadow>
                <sphereGeometry args={[0.29, 28, 14, 0, Math.PI * 2, 0, 1.35]} />
              </mesh>
              <mesh position={[0, 0.04, 0.27]} rotation={[-0.15, 0, 0]} scale={[1, 0.12, 0.75]} material={m.cap} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 24, 1, false, -Math.PI / 2, Math.PI]} />
              </mesh>
            </group>
          )}
          {look.glasses &&
            [-1, 1].map((sd) => (
              <mesh key={sd} position={[0.095 * sd, 0.015, 0.262]} material={m.frame}>
                <torusGeometry args={[0.062, 0.009, 8, 24]} />
              </mesh>
            ))}
          {/* olhos */}
          {[-1, 1].map((s) => (
            <group key={s} position={[0.095 * s, 0.015, 0.228]} scale={[1, Math.max(0.06, eyeY), 1]}>
              <mesh scale={[0.05, 0.066, 0.03]} material={m.white}>
                <sphereGeometry args={[1, 20, 16]} />
              </mesh>
              <mesh position={[pupil[0] * 0.018, pupil[1] * 0.018 - 0.004, 0.024]} scale={[0.029 * (1 - eyeWide * 0.2), 0.034 * (1 - eyeWide * 0.2), 0.012]} material={m.pupil}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[pupil[0] * 0.018 + 0.01, pupil[1] * 0.018 + 0.012, 0.035]} scale={0.009} material={m.white}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          {/* sobrancelhas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.095 * s, browY, 0.245]} rotation={[-0.25, 0, -browRot * s]} material={m.hair}>
              <boxGeometry args={[0.085, 0.02, 0.02]} />
            </mesh>
          ))}
          {/* nariz */}
          <mesh position={[0, -0.04, 0.262]} scale={[1, 0.8, 0.8]} material={m.skin}>
            <sphereGeometry args={[0.022, 12, 10]} />
          </mesh>
          {/* bochechas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.155 * s, -0.06, 0.2]} rotation={[0, 0.6 * s, 0]} material={m.blush}>
              <circleGeometry args={[0.03, 16]} />
            </mesh>
          ))}
          {/* boca */}
          {mouthOpen > 0.05 ? (
            <group position={[0, -0.11, 0.238]}>
              <mesh scale={[0.045 - mouthOpen * 0.01, 0.012 + mouthOpen * 0.04, 0.02]} material={m.mouth}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[0, -0.01 - mouthOpen * 0.015, 0.008]} scale={[0.025, 0.01 + mouthOpen * 0.012, 0.015]} material={m.tongue}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
            </group>
          ) : (
            <mesh position={[0.008, -0.072, 0.236]} rotation={[0.25, 0, 1.5 * Math.PI - (Math.PI * (0.5 + smile * 0.2)) / 2 + smile * 0.3]} material={m.mouth}>
              <torusGeometry args={[0.036, 0.007, 8, 20, Math.PI * (0.5 + smile * 0.2)]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};
