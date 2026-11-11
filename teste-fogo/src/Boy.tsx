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
  bags?: number; // 0..1 olheiras (sono)
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
  helmet?: string; // capacete militar
  helmetEar?: boolean; // orelha pintada no capacete (o "Eco")
  slim?: number; // 1 normal, <1 mais magro
  mustache?: string;
  palito?: boolean; // estilo palito: membros finos, tronco reto, cabeça pequena
  bobby?: boolean; // capacete alto de policial inglês
  bowler?: string; // chapéu-coco
  gloves?: string; // luvas
  ghost?: number; // 0..1 opacidade (rastro/borrão)
  lowpoly?: boolean; // facetado (estilo low-poly)
  headScale?: number; // cabeção (estilo cartoon)
};

const useMats = (L: Look) =>
  useMemo(
    () => ({
      skin: std(L.skin ?? SKIN, 0.6, {flatShading: !!L.lowpoly}),
      shirt: std(L.shirt ?? SHIRT, 0.85, {flatShading: !!L.lowpoly}),
      trim: std(L.trim ?? "#8f1712", 0.8, {flatShading: !!L.lowpoly}),
      pants: std(L.pants ?? PANTS, 0.9, {flatShading: !!L.lowpoly}),
      hair: std(L.hair ?? HAIR, 0.55, {flatShading: !!L.lowpoly}),
      coat: std(L.coat ?? "#335", 0.9),
      scarf: std(L.scarf ?? "#c33", 0.95),
      cap: std(L.cap ?? "#235", 0.7),
      frame: std("#222", 0.4),
      helmet: std(L.helmet ?? "#4d5a32", 0.75),
      bobbyHat: std("#1c2333", 0.5),
      bowler: std(L.bowler ?? "#151515", 0.45),
      hand: std(L.gloves ?? L.skin ?? SKIN, L.gloves ? 0.45 : 0.6, {flatShading: !!L.lowpoly}),
      badge: std("#d8dce4", 0.25, {metalness: 0.9}),
      earPaint: std("#f2e6c8", 0.8),
      mustache: std(L.mustache ?? "#1a1a1a", 0.8),
      shoe: std(SHOE, 0.6, {flatShading: !!L.lowpoly}),
      white: std("#ffffff", 0.3),
      dark: std("#2a1a12", 0.3),
      mouth: std("#5b1d1d", 0.6),
      tongue: std("#e0707a", 0.6),
      blush: new THREE.MeshBasicMaterial({color: "#ff8f8f", transparent: true, opacity: 0.35, depthWrite: false}),
      pupil: new THREE.MeshStandardMaterial({color: "#3a2416", roughness: 0.3, emissive: new THREE.Color("#ff6a00"), emissiveIntensity: 0}),
      sole: std("#e9e9ee", 0.7),
    }),
    [L.skin, L.shirt, L.trim, L.pants, L.hair, L.coat, L.scarf, L.cap, L.helmet, L.mustache, L.bowler, L.gloves, L.lowpoly],
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
  th?: number;
  q: (n: number) => number;
}> = ({side, shoulder, elbow, wrist, fist, m, palmRef, coat, th = 1, q}) => (
  <group position={[0.27 * side, 1.27, 0]} rotation={shoulder}>
    <mesh position={[0.005 * side, -0.06, 0]} material={coat ? m.coat : m.shirt} castShadow scale={coat ? 1.15 : 1}>
      <capsuleGeometry args={[0.085 * th, 0.07, q(8), q(16)]} />
    </mesh>
    {th < 1 ? (
      /* palito: braço vai do ombro ao cotovelo sem vão */
      <mesh position={[0, -0.15, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? [1.4, 1, 1.4] : 1}>
        <capsuleGeometry args={[0.058 * th, 0.3 - 0.116 * th, q(8), q(16)]} />
      </mesh>
    ) : (
      <mesh position={[0, -0.17, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? 1.35 : 1}>
        <capsuleGeometry args={[0.058, 0.16, q(8), q(16)]} />
      </mesh>
    )}
    <group position={[0, -0.3, 0]} rotation={[elbow, 0, 0]}>
      {th < 1 ? (
        <>
          {/* cotovelo, antebraço até o pulso e pulso */}
          <mesh material={coat ? m.coat : m.skin} castShadow scale={coat ? 1.4 : 1}>
            <sphereGeometry args={[0.056 * th, q(12), q(10)]} />
          </mesh>
          <mesh position={[0, -0.135, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? [1.4, 1, 1.4] : 1}>
            <capsuleGeometry args={[0.052 * th, 0.27 - 0.104 * th, q(8), q(16)]} />
          </mesh>
          <mesh position={[0, -0.27, 0]} material={m.hand} castShadow>
            <sphereGeometry args={[0.05 * th, q(12), q(10)]} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, -0.12, 0]} material={coat ? m.coat : m.skin} castShadow scale={coat ? 1.35 : 1}>
          <capsuleGeometry args={[0.052, 0.17, q(8), q(16)]} />
        </mesh>
      )}
      <group position={[0, -0.27, 0]} rotation={wrist} scale={0.4 + 0.6 * th}>
        {/* palma */}
        <mesh position={[0, -0.05, 0]} scale={[1, 1.1 - 0.35 * fist, 0.62]} material={m.hand} castShadow>
          <sphereGeometry args={[0.068, q(20), q(16)]} />
        </mesh>
        {/* dedos (somem quando fecha) */}
        {[-1, 0, 1].map((k) => (
          <mesh key={k} position={[k * 0.03, -0.12 + 0.05 * fist, 0.005 + 0.03 * fist]} rotation={[-1.4 * fist, 0, 0]} material={m.hand} castShadow>
            <capsuleGeometry args={[0.016, 0.05 * (1 - 0.6 * fist), q(6), q(8)]} />
          </mesh>
        ))}
        {/* polegar */}
        <mesh position={[-0.062 * side, -0.035, 0.02]} rotation={[0.3, 0, 0.7 * side]} material={m.hand} castShadow>
          <capsuleGeometry args={[0.019, 0.045, q(6), q(8)]} />
        </mesh>
        {/* ponto da palma onde nasce a chama */}
        <object3D ref={palmRef} position={[0, -0.06, 0.07]} />
      </group>
    </group>
  </group>
);

const clampH = (v: number) => Math.max(-0.3, Math.min(0.3, v));
const Q1 = (n: number) => n;
const Q3 = (n: number) => Math.max(3, Math.round(n * 0.3));

export const Boy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; look?: Look}> = ({pose, palmRef, look = {}}) => {
  const m = useMats(look);
  if (look.ghost !== undefined) {
    for (const v of Object.values(m)) {
      const mat = v as THREE.Material;
      mat.transparent = true;
      mat.opacity = look.ghost;
      mat.depthWrite = false;
    }
  }
  const coat = !!look.coat;
  const style = look.hairStyle ?? "spiky";
  const lt = look.palito ? 0.5 : 1; // espessura de braços/pernas
  const sl = (look.slim ?? 1) * (look.palito ? 0.66 : 1); // largura do tronco
  const slz = (look.slim ?? 1) * (look.palito ? 0.6 : 1);
  const hs = look.palito ? 0.66 : look.headScale ?? 1; // tamanho da cabeça
  const q = look.lowpoly ? Q3 : Q1;
  const hipX = look.palito ? 0.115 * sl : 0.1; // perna presa dentro do quadril
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
    bags = 0,
  } = pose;
  m.skin.emissive.set("#ff2a00");
  m.skin.emissiveIntensity = heat * 0.6;
  m.pupil.emissiveIntensity = glow * 6;
  const eyeY = (1 - blink) * (1 + eyeWide * 0.25);
  const browY = 0.105 + brow * 0.03 + eyeWide * 0.015;
  const browRot = brow < 0 ? brow * 0.35 : brow * 0.12;
  return (
    <group position={[pos[0], pos[1] + 0.025 * walkAmt * (Math.cos(2 * walk) - 1), pos[2]]} rotation={[0, rotY, 0]} scale={[1 + squash * 0.5, 1 - squash, 1 + squash * 0.5]}>
      {/* pernas: coxa + canela com joelho; o pé fica mais plano no chão */}
      {[-1, 1].map((sd) => {
        const ph = walk + (sd > 0 ? 0 : Math.PI);
        const A = 0.38 * walkAmt;
        const thigh = Math.sin(ph) * A; // + = perna pra trás
        const swing = walkAmt > 0 ? Math.max(0, -Math.cos(ph)) : 0; // perna indo pra frente
        const knee = 0.95 * walkAmt * swing + 0.08 * walkAmt + Math.max(0, legLift) * 0.9;
        const hipRot = thigh - 0.9 * legLift;
        const foot = -(hipRot + knee) * (walkAmt > 0 ? 0.7 : 0) + (legLift > 0 ? 0 : 0);
        const shoeR = 0.085 * (0.4 + 0.6 * lt);
        return (
          <group key={sd} position={[hipX * sd, 0.78, 0]} rotation={[hipRot, 0, 0]}>
            {/* coxa */}
            {look.shorts ? (
              <>
                <mesh position={[0, -0.15, 0]} material={m.pants} castShadow receiveShadow>
                  <capsuleGeometry args={[(look.palito ? 0.072 : 0.095) * lt, 0.16, q(8), q(16)]} />
                </mesh>
                <mesh position={[0, -0.3, 0]} material={m.skin} castShadow receiveShadow>
                  <capsuleGeometry args={[0.068 * lt, 0.1, q(8), q(12)]} />
                </mesh>
              </>
            ) : (
              <mesh position={[0, -0.18, 0]} material={m.pants} castShadow receiveShadow>
                <capsuleGeometry args={[0.085 * lt, 0.36 - 0.17 * lt * 0.5, q(8), q(16)]} />
              </mesh>
            )}
            {/* joelho */}
            <group position={[0, -0.36, 0]} rotation={[knee, 0, 0]}>
              <mesh material={look.shorts ? m.skin : m.pants} castShadow>
                <sphereGeometry args={[(look.shorts ? 0.068 : 0.085) * lt, q(12), q(10)]} />
              </mesh>
              {/* canela */}
              <mesh position={[0, -0.16, 0]} material={look.shorts ? m.skin : m.pants} castShadow receiveShadow>
                <capsuleGeometry args={[(look.shorts ? 0.068 : 0.085) * lt * 0.95, 0.3 - 0.1 * lt, q(8), q(16)]} />
              </mesh>
              {/* pé */}
              <group position={[0, -0.33, 0]} rotation={[foot, 0, 0]}>
                <mesh position={[0, -0.03, 0.04]} scale={[1, 0.7, 1.5]} material={m.shoe} castShadow>
                  <sphereGeometry args={[shoeR, q(16), q(12)]} />
                </mesh>
                <mesh position={[0, -0.07, 0.04]} scale={[1.05, 0.25, 1.55]} material={m.sole}>
                  <sphereGeometry args={[shoeR, q(16), q(12)]} />
                </mesh>
              </group>
            </group>
          </group>
        );
      })}
      <group rotation={torso}>
        <group scale={[sl, 1, slz]}>
        {/* tronco */}
        <mesh position={[0, 1.07 + breathe * 0.006, 0]} scale={[1, 1, 0.7]} material={m.shirt} castShadow receiveShadow>
          <capsuleGeometry args={[0.2, 0.3, q(10), q(24)]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} scale={[1, 1, 0.7]} material={m.pants} castShadow>
          <cylinderGeometry args={[0.185, 0.17, 0.28, q(24)]} />
        </mesh>
        {/* gola */}
        <mesh position={[0, 1.3, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.75, 1]} material={m.trim}>
          <torusGeometry args={[0.085, 0.022, 8, 20]} />
        </mesh>
        {/* pescoço */}
        <mesh position={[0, 1.33, 0]} material={m.skin}>
          <cylinderGeometry args={[0.055 * lt, 0.06 * lt, 0.14, q(12)]} />
        </mesh>
        </group>
        <group position={[-0.27 * (sl - 1), 0, 0]}>
          <Arm side={-1} shoulder={rShoulder} elbow={rElbow} wrist={rWrist} fist={rFist} m={m} palmRef={palmRef} coat={coat} th={lt} q={q} />
        </group>
        <group position={[0.27 * (sl - 1), 0, 0]}>
          <Arm side={1} shoulder={lShoulder} elbow={lElbow} wrist={lWrist} fist={0} m={m} coat={coat} th={lt} q={q} />
        </group>
        <group scale={[sl, 1, slz]}>
        {coat && (
          <>
            <mesh position={[0, 1.02, 0]} scale={[1.18, 1.05, 0.9]} material={m.coat} castShadow>
              <capsuleGeometry args={[0.2, 0.34, q(10), q(24)]} />
            </mesh>
            {look.scarf && (
              <>
                <mesh position={[0, 1.33, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.scarf} castShadow>
                  <torusGeometry args={[0.1, 0.045, 10, 20]} />
                </mesh>
                <mesh position={[0.06, 1.18, 0.15]} rotation={[0.2, 0, 0.15]} material={m.scarf}>
                  <boxGeometry args={[0.07, 0.22, 0.03]} />
                </mesh>
              </>
            )}
          </>
        )}
        </group>
        {/* cabeça */}
        <group position={[0, look.palito ? 1.52 : 1.6 + 0.22 * (hs - 1), 0]} rotation={head} scale={hs}>
          <mesh scale={[1, 1.04, 0.96]} material={m.skin} castShadow>
            <sphereGeometry args={[0.27, q(40), q(32)]} />
          </mesh>
          {/* orelhas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.262 * s, -0.02, 0]} scale={[0.5, 1, 0.8]} material={m.skin}>
              <sphereGeometry args={[0.06, q(12), q(10)]} />
            </mesh>
          ))}
          <group rotation={[clampH(hair[0]) - 0.12 * hairLift, 0, clampH(hair[1])]} position={[0, 0.03 * hairLift, 0]} scale={[1, 1 + 0.12 * hairLift, 1]}>
          {/* calota do cabelo */}
          {style !== "bald" && <mesh position={[0, 0.02, -0.01]} rotation={[0.12, 0, 0]} material={m.hair} castShadow>
            <sphereGeometry args={[0.285, q(32), q(16), 0, Math.PI * 2, 0, 1.3]} />
          </mesh>}
          {style === "bald" && [-1, 1].map((sd) => (
            <mesh key={sd} position={[0.24 * sd, 0.02, -0.06]} scale={[0.35, 0.7, 0.9]} material={m.hair}>
              <sphereGeometry args={[0.14, q(12), q(10)]} />
            </mesh>
          ))}
          {style !== "bald" && spikes.map((sp, i) => (
            <mesh key={i} position={sp.p} quaternion={sp.q} scale={look.helmet || look.bobby || look.bowler ? sp.s * 0.3 : style === "short" ? sp.s * 0.45 : sp.s} material={m.hair} castShadow>
              <coneGeometry args={[0.09, 0.3, 7]} />
            </mesh>
          ))}
          </group>
          {look.cap && (
            <group position={[0, 0.1, 0]} rotation={[-0.15, 0, 0]}>
              <mesh material={m.cap} castShadow>
                <sphereGeometry args={[0.29, q(28), q(14), 0, Math.PI * 2, 0, 1.35]} />
              </mesh>
              <mesh position={[0, 0.04, 0.27]} rotation={[-0.15, 0, 0]} scale={[1, 0.12, 0.75]} material={m.cap} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 24, 1, false, -Math.PI / 2, Math.PI]} />
              </mesh>
            </group>
          )}
          {look.bowler && (
            <group position={[0, 0.2, -0.01]} rotation={[-0.08, 0, 0]}>
              <mesh material={m.bowler} castShadow scale={[1, 0.85, 1.05]}>
                <sphereGeometry args={[0.25, q(28), q(16), 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
              <mesh position={[0, 0.0, 0]} material={m.bowler} castShadow>
                <cylinderGeometry args={[0.36, 0.37, 0.025, q(32)]} />
              </mesh>
              <mesh position={[0, 0.03, 0]} material={m.frame}>
                <cylinderGeometry args={[0.252, 0.252, 0.035, q(32)]} />
              </mesh>
            </group>
          )}
          {look.bobby && (
            <group position={[0, 0.12, -0.01]}>
              <mesh material={m.bobbyHat} scale={[1.0, 1.55, 1.05]} castShadow>
                <sphereGeometry args={[0.29, q(28), q(18), 0, Math.PI * 2, 0, 1.7]} />
              </mesh>
              <mesh position={[0, -0.02, 0]} material={m.bobbyHat}>
                <cylinderGeometry args={[0.33, 0.34, 0.025, q(28)]} />
              </mesh>
              <mesh position={[0, 0.2, 0.29]} rotation={[-0.25, 0, 0]} material={m.badge}>
                <circleGeometry args={[0.07, 6]} />
              </mesh>
              <mesh position={[0, 0.5, 0]} material={m.badge}>
                <sphereGeometry args={[0.035, q(10), q(8)]} />
              </mesh>
            </group>
          )}
          {look.helmet && (
            <group position={[0, 0.07, -0.01]}>
              <mesh material={m.helmet} castShadow scale={[1.08, 0.95, 1.1]}>
                <sphereGeometry args={[0.3, q(28), q(14), 0, Math.PI * 2, 0, 1.45]} />
              </mesh>
              <mesh position={[0, 0.035, 0]} rotation={[0, 0, 0]} material={m.helmet} castShadow>
                <cylinderGeometry args={[0.36, 0.37, 0.02, q(32)]} />
              </mesh>
              {look.helmetEar && (
                <group position={[0, 0.17, 0.25]} rotation={[-0.55, 0, 0]}>
                  <mesh material={m.earPaint} scale={[0.07, 0.1, 0.012]}>
                    <sphereGeometry args={[1, 16, 12]} />
                  </mesh>
                  <mesh position={[0.005, 0, 0.008]} material={m.helmet} scale={[0.035, 0.06, 0.008]}>
                    <sphereGeometry args={[1, 12, 10]} />
                  </mesh>
                </group>
              )}
            </group>
          )}
          {look.mustache && (
            <mesh position={[0, -0.065, 0.255]} scale={[0.07, 0.016, 0.02]} material={m.mustache}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
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
          {/* olheiras */}
          {bags > 0.01 &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[0.095 * s, -0.045, 0.235]} rotation={[-0.3, 0, 0]} scale={[0.05, 0.022 * bags, 0.012]} material={m.mouth}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
            ))}
          {/* sobrancelhas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.095 * s, browY, 0.245]} rotation={[-0.25, 0, -browRot * s]} material={m.hair}>
              <boxGeometry args={[0.085, 0.02, 0.02]} />
            </mesh>
          ))}
          {/* nariz */}
          <mesh position={[0, -0.04, 0.262]} scale={[1, 0.8, 0.8]} material={m.skin}>
            <sphereGeometry args={[0.022, q(12), q(10)]} />
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
