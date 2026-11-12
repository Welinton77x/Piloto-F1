import React, {useMemo} from "react";
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type {Pose} from "./Boy";

/* ===== Personagem estilo "boneco de vinil": formas lisas e arredondadas, cabeção, olhos pretos brilhantes,
   bochecha rosada, cabelo em cuia com aba grossa. Usa a mesma Pose do Boy (mesmos movimentos). ===== */

export type ToyLook = {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  shoe?: string;
  sole?: string;
  backpack?: string; // mochila nas costas (cor)
  hoodie?: boolean; // casaco com capuz, manga comprida e cordinhas pretas
  hairStyle?: "bowl" | "spiky" | "curly" | "ponytail" | "pigtails" | "long" | "bun" | "buzz";
  jelly?: number; // 0..1 coberto de gelatina de morango
};

const sm = (color: string, rough = 0.55, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});

const useToyMats = (L: ToyLook) =>
  useMemo(
    () => ({
      skin: sm(L.skin ?? "#dfac80", 0.5),
      skinDark: sm("#c98f62", 0.55),
      shirt: sm(L.shirt ?? "#ffcd2e", 0.6),
      shirtDark: sm("#e7a816", 0.6),
      pants: sm(L.pants ?? "#2f55b0", 0.65),
      pantsHem: sm(new THREE.Color(L.pants ?? "#2f55b0").multiplyScalar(0.8).getStyle(), 0.65),
      hair: sm(L.hair ?? "#3b2416", 0.45, {side: THREE.DoubleSide}),
      shoe: sm(L.shoe ?? "#f4f4f2", 0.45),
      sole: sm(L.sole ?? "#f08a1c", 0.5),
      eye: sm("#0c0c10", 0.12, {metalness: 0.1}),
      white: sm("#ffffff", 0.2),
      brow: sm("#2a170d", 0.5),
      mouth: sm("#3a1510", 0.5),
      tongue: sm("#e2606e", 0.45),
      blush: sm("#f3a0a6", 0.6),
      bag: sm("#a88094", 0.7),
      pack: sm(L.backpack ?? "#2f6fd6", 0.5),
      packDark: sm(new THREE.Color(L.backpack ?? "#2f6fd6").multiplyScalar(0.75).getStyle(), 0.5),
      strap: sm("#4a5260", 0.6),
      cord: sm("#141414", 0.45),
      jelly: sm("#e8303f", 0.15, {transparent: true, opacity: 0.85, metalness: 0.05}),
    }),
    [L.skin, L.shirt, L.pants, L.hair, L.shoe, L.sole, L.backpack],
  );

/* proporções medidas no boneco de referência (altura total ≈ 2,0):
   tênis 0–0,13 · pernas até 0,70 · tronco 0,70–1,415 · cabeça (com cabelo) 1,445–2,0 */
const HIP = 0.72;
const TORSO_BOT = 0.7;
const TORSO_TOP = 1.415;
const HIPX = 0.125;
const SHX = 0.36;
const SHY = 1.325;
const THIGH = 0.3;
const PANT_R = 0.118;
const SHIN = 0.29;


/* linha do cabelo (altura no espaço da cabeça) em função do ângulo em volta da cabeça (0 = frente, ±π = nuca) */
const HAIR_R = 0.345;
const HAIR_SC: [number, number, number] = [1.05, 0.93, 1.02];
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const RING_Y = 0.15; // altura do rolo de cabelo (acima das sobrancelhas e das orelhas)
const ringR = () => {
  const yy = RING_Y / HAIR_SC[1];
  return Math.sqrt(HAIR_R * HAIR_R - yy * yy);
};
/** borda de baixo do cabelo de trás (altura), conforme o ângulo em volta da cabeça (|a| de ~1,9 até π) */
const backEdge = (a: number) => {
  const k = sstep(1.9, 2.6, Math.abs(a));
  return 0.05 + (-0.11 - 0.05) * k + 0.014 * Math.sin(a * 6) * k;
};
const HEAD_R = 0.32;
const HEAD_SC: [number, number, number] = [1, 0.96, 0.94];
/** ponto na pele da cabeça (um tiquinho pra fora) */
const onHead = (a: number, y: number, out = 1.018): THREE.Vector3 => {
  const yu = y / HEAD_SC[1];
  const r = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - yu * yu));
  return new THREE.Vector3(r * Math.sin(a) * HEAD_SC[0] * out, y * out, r * Math.cos(a) * HEAD_SC[2] * out);
};
const makeHair = () => {
  // cuia baixa e lisa em cima
  const cap = new THREE.SphereGeometry(HAIR_R, 64, 24, 0, Math.PI * 2, 0, Math.acos(RING_Y / HAIR_SC[1] / HAIR_R));
  cap.scale(...HAIR_SC);
  // rolo grosso em volta da cabeça toda
  const ring = new THREE.TorusGeometry(ringR(), 0.064, 18, 72);
  ring.rotateX(Math.PI / 2);
  ring.scale(HAIR_SC[0], 1, HAIR_SC[2]);
  ring.translate(0, RING_Y, 0);
  // cabelo de trás: camada colada na cabeça, do rolo até a borda ondulada
  const NA = 64;
  const NY = 10;
  const a0 = 1.85;
  const verts: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= NA; i++) {
    const a = a0 + (i / NA) * (Math.PI * 2 - 2 * a0);
    const yb = backEdge(a);
    for (let j = 0; j <= NY; j++) {
      const y = lerpN(RING_Y + 0.02, yb, j / NY);
      const v = onHead(a, y);
      verts.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < NA; i++)
    for (let j = 0; j < NY; j++) {
      const p = i * (NY + 1) + j;
      const q = (i + 1) * (NY + 1) + j;
      index.push(p, p + 1, q, q, p + 1, q + 1);
    }
  const back = new THREE.BufferGeometry();
  back.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  back.setIndex(index);
  back.computeVertexNormals();
  return {shell: cap, rim: ring, edge: back};
};
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- outros cabelos (para os figurantes): touca lisa + detalhes ---------- */
const capGeo = (() => {
  let g: THREE.SphereGeometry | null = null;
  return () => {
    if (!g) {
      g = new THREE.SphereGeometry(0.335, 40, 24, 0, Math.PI * 2, 0, 1.28);
      g.rotateX(-0.42);
      g.scale(1.03, 0.98, 1.03);
    }
    return g;
  };
})();
const fib = (n: number, minY: number) =>
  Array.from({length: n}, (_, i) => {
    const y = 1 - (i / (n - 1)) * (1 - minY);
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    return [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number];
  });
const OtherHair: React.FC<{style: string; m: THREE.Material}> = ({style, m}) => {
  const cap = <mesh geometry={capGeo()} material={m} castShadow />;
  if (style === "buzz") return cap;
  if (style === "spiky")
    return (
      <>
        {cap}
        {fib(11, 0.45).map(([x, y, z], i) => (
          <mesh key={i} position={[x * 0.31, y * 0.31 + 0.02, z * 0.31 - 0.02]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y + 0.4, z).normalize())} material={m} castShadow>
            <coneGeometry args={[0.065, 0.17, 12]} />
          </mesh>
        ))}
      </>
    );
  if (style === "curly")
    return (
      <>
        {cap}
        {fib(26, -0.15).filter(([, , z], i) => !(z > 0.55 && i > 6)).map(([x, y, z], i) => (
          <mesh key={i} position={[x * 0.34, y * 0.33 + 0.03, z * 0.33 - 0.03]} material={m} castShadow>
            <sphereGeometry args={[0.095, 14, 10]} />
          </mesh>
        ))}
      </>
    );
  if (style === "bun")
    return (
      <>
        {cap}
        <mesh position={[0, 0.33, -0.1]} material={m} castShadow>
          <sphereGeometry args={[0.13, 18, 14]} />
        </mesh>
      </>
    );
  if (style === "ponytail")
    return (
      <>
        {cap}
        <mesh position={[0, 0.12, -0.33]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ff5c8a", 0.5)}>
          <torusGeometry args={[0.05, 0.02, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.05, -0.4]} rotation={[0.35, 0, 0]} material={m} castShadow>
          <capsuleGeometry args={[0.075, 0.24, 8, 14]} />
        </mesh>
      </>
    );
  if (style === "pigtails")
    return (
      <>
        {cap}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.33 * sd, 0.02, -0.08]}>
            <mesh position={[0.06 * sd, -0.08, 0]} rotation={[0, 0, 0.35 * sd]} material={m} castShadow>
              <capsuleGeometry args={[0.07, 0.16, 8, 14]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#ff5c8a", 0.5)}>
              <torusGeometry args={[0.045, 0.018, 8, 16]} />
            </mesh>
          </group>
        ))}
      </>
    );
  // long
  return (
    <>
      {cap}
      <mesh position={[0, -0.12, -0.22]} material={m} castShadow>
        <capsuleGeometry args={[0.2, 0.32, 10, 20]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.27 * sd, -0.1, -0.06]} material={m} castShadow>
          <capsuleGeometry args={[0.08, 0.3, 8, 14]} />
        </mesh>
      ))}
    </>
  );
};

export const Toy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; look?: ToyLook}> = ({pose, palmRef, look = {}}) => {
  const m = useToyMats(look);
  const hairGeo = useMemo(makeHair, []);
  const geo = useMemo(
    () => ({
      torso: new RoundedBoxGeometry(0.53, TORSO_TOP - TORSO_BOT, 0.37, 5, 0.11),
      shoe: new RoundedBoxGeometry(0.2, 0.12, 0.34, 4, 0.055),
      pack: new RoundedBoxGeometry(0.47, 0.6, 0.22, 4, 0.085),
      pocket: new RoundedBoxGeometry(0.34, 0.2, 0.07, 3, 0.03),
      strapF: new RoundedBoxGeometry(0.065, 0.6, 0.03, 2, 0.012),
      hoodie: new RoundedBoxGeometry(0.58, TORSO_TOP - TORSO_BOT + 0.02, 0.41, 5, 0.13),
      hem: new RoundedBoxGeometry(0.585, 0.09, 0.415, 3, 0.04),
      kpocket: new RoundedBoxGeometry(0.38, 0.17, 0.04, 3, 0.03),
      hoodBack: new RoundedBoxGeometry(0.4, 0.2, 0.12, 3, 0.06),
      strapT: new RoundedBoxGeometry(0.065, 0.03, 0.42, 2, 0.012),
      sole: new RoundedBoxGeometry(0.21, 0.035, 0.35, 3, 0.015),
    }),
    [],
  );
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
    brow = 0,
    mouthOpen = 0,
    smile = 0,
    breathe = 0,
    squash = 0,
    hairLift = 0,
    walk = 0,
    walkAmt = 0,
    legLift = 0,
    bags = 0,
  } = pose;
  const eyeY = Math.max(0.08, (1 - blink) * (1 + eyeWide * 0.2));
  const browUp = brow * 0.025 + eyeWide * 0.015;
  const browRot = brow < 0 ? brow * 0.4 : brow * 0.12;

  const arm = (side: 1 | -1, shoulder: [number, number, number], elbow: number, wrist: [number, number, number], ref?: React.Ref<THREE.Object3D>) => (
    <group position={[SHX * side, SHY, 0]} rotation={shoulder}>
      {look.hoodie ? (
        /* manga comprida do casaco (fofinha) */
        <mesh position={[0, -0.12, 0]} material={m.shirt} castShadow>
          <capsuleGeometry args={[0.112, 0.17, 6, 14]} />
        </mesh>
      ) : (
        <>
          {/* manga curta da camiseta */}
          <mesh position={[0, -0.07, 0]} material={m.shirt} castShadow>
            <capsuleGeometry args={[0.112, 0.08, 6, 14]} />
          </mesh>
          {/* braço */}
          <mesh position={[0, -0.14, 0]} material={m.skin} castShadow>
            <capsuleGeometry args={[0.09, 0.16, 6, 14]} />
          </mesh>
        </>
      )}
      <group position={[0, -0.26, 0]} rotation={[elbow, 0, 0]}>
        {look.hoodie ? (
          <>
            <mesh position={[0, -0.1, 0]} material={m.shirt} castShadow>
              <capsuleGeometry args={[0.106, 0.14, 6, 14]} />
            </mesh>
            {/* punho */}
            <mesh position={[0, -0.215, 0]} material={m.shirtDark} castShadow>
              <capsuleGeometry args={[0.1, 0.03, 6, 14]} />
            </mesh>
          </>
        ) : (
          <mesh position={[0, -0.11, 0]} material={m.skin} castShadow>
            <capsuleGeometry args={[0.088, 0.16, 6, 14]} />
          </mesh>
        )}
        <group position={[0, -0.25, 0]} rotation={wrist}>
          {/* mão de bolinha */}
          <mesh position={[0, -0.045, 0]} material={m.skin} castShadow>
            <sphereGeometry args={[0.095, 18, 14]} />
          </mesh>
          <object3D ref={ref} position={[0, -0.06, 0.09]} />
        </group>
      </group>
    </group>
  );

  return (
    <group position={[pos[0], pos[1] + 0.022 * walkAmt * (Math.cos(2 * walk) - 1), pos[2]]} rotation={[0, rotY, 0]} scale={[1 + squash * 0.5, 1 - squash, 1 + squash * 0.5]}>
      {/* pernas: calça azul, tênis branco com sola laranja */}
      {[-1, 1].map((sd) => {
        const ph = walk + (sd > 0 ? 0 : Math.PI);
        const A = 0.38 * walkAmt;
        const thigh = Math.sin(ph) * A;
        const swing = walkAmt > 0 ? Math.max(0, -Math.cos(ph)) : 0;
        const knee = 0.95 * walkAmt * swing + 0.08 * walkAmt + Math.max(0, legLift) * 0.9;
        const hipRot = thigh - 0.9 * legLift;
        const foot = -(hipRot + knee) * (walkAmt > 0 ? 0.7 : 0);
        return (
          <group key={sd} position={[HIPX * sd, HIP, 0]} rotation={[hipRot, 0, 0]}>
            <mesh position={[0, -THIGH / 2 + 0.03, 0]} material={m.pants} castShadow receiveShadow>
              <cylinderGeometry args={[PANT_R, PANT_R, THIGH + 0.06, 24]} />
            </mesh>
            <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
              <mesh material={m.pants} castShadow>
                <sphereGeometry args={[PANT_R, 24, 16]} />
              </mesh>
              <mesh position={[0, -SHIN / 2 + 0.01, 0]} material={m.pants} castShadow receiveShadow>
                <cylinderGeometry args={[PANT_R, PANT_R + 0.004, SHIN - 0.02, 24]} />
              </mesh>
              <mesh position={[0, -SHIN + 0.035, 0]} material={m.pantsHem} castShadow>
                <cylinderGeometry args={[PANT_R + 0.008, PANT_R + 0.008, 0.045, 24]} />
              </mesh>
              <group position={[0, -SHIN, 0]} rotation={[foot, 0, 0]}>
                <mesh position={[0, -0.055, 0.05]} geometry={geo.shoe} material={m.shoe} castShadow />
                <mesh position={[0, -0.112, 0.05]} geometry={geo.sole} material={m.sole} />
              </group>
            </group>
          </group>
        );
      })}
      {/* tronco: gira em volta do quadril */}
      <group position={[0, HIP, 0]} rotation={torso}>
        <group position={[0, -HIP, 0]}>
          {look.hoodie ? (
            <>
              {/* casaco amarelo com capuz, bolso canguru, barra e cordinhas pretas */}
              <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.hoodie} material={m.shirt} castShadow receiveShadow />
              <mesh position={[0, TORSO_BOT + 0.03, 0]} geometry={geo.hem} material={m.shirtDark} castShadow />
              <mesh position={[0, 0.9, 0.2]} geometry={geo.kpocket} material={m.shirtDark} castShadow />
              {/* gola do capuz */}
              <mesh position={[0, TORSO_TOP + 0.005, -0.01]} rotation={[-Math.PI / 2, 0, 0]} material={m.shirt} castShadow>
                <torusGeometry args={[0.17, 0.07, 10, 28, Math.PI]} />
              </mesh>
              <mesh position={[0, TORSO_TOP - 0.005, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={m.shirtDark}>
                <torusGeometry args={[0.13, 0.03, 8, 24]} />
              </mesh>
              {/* capuz dobrado nas costas */}
              <mesh position={[0, TORSO_TOP - 0.08, -0.215]} rotation={[0.25, 0, 0]} geometry={geo.hoodBack} material={m.shirt} castShadow />
              {/* cordinhas pretas */}
              {[-1, 1].map((sd) => (
                <group key={sd} position={[0.055 * sd, TORSO_TOP - 0.03, 0.215]} rotation={[0.08, 0, 0.04 * sd]}>
                  <mesh position={[0, -0.1, 0]} material={m.cord}>
                    <capsuleGeometry args={[0.013, 0.17, 4, 8]} />
                  </mesh>
                  <mesh position={[0, -0.2, 0]} material={m.cord}>
                    <capsuleGeometry args={[0.02, 0.025, 4, 8]} />
                  </mesh>
                </group>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.torso} material={m.shirt} castShadow receiveShadow />
              {/* gola */}
              <mesh position={[0, TORSO_TOP - 0.01, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={m.shirtDark}>
                <torusGeometry args={[0.11, 0.026, 8, 20]} />
              </mesh>
            </>
          )}
          {look.backpack && (
            <>
              {/* mochila nas costas + alças passando pela frente */}
              <mesh position={[0, 1.06, -0.3]} geometry={geo.pack} material={m.pack} castShadow />
              <mesh position={[0, 0.9, -0.425]} geometry={geo.pocket} material={m.packDark} castShadow />
              <mesh position={[0, 1.37, -0.29]} rotation={[0, Math.PI / 2, 0]} material={m.packDark}>
                <torusGeometry args={[0.05, 0.014, 8, 16, Math.PI]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <group key={sd}>
                  <mesh position={[0.15 * sd, 1.1, look.hoodie ? 0.214 : 0.197]} geometry={geo.strapF} material={m.strap} castShadow />
                  <mesh position={[0.15 * sd, TORSO_TOP + (look.hoodie ? 0.02 : 0.005), -0.02]} geometry={geo.strapT} material={m.strap} />
                </group>
              ))}
            </>
          )}
          {(look.jelly ?? 0) > 0.01 &&
            [[-0.15, 1.2, 0.19, 0.09], [0.12, 0.95, 0.19, 0.11], [0.2, 1.3, 0.17, 0.07], [-0.05, 0.82, 0.19, 0.08], [0.0, 1.05, 0.2, 0.06]].map(([x, y, z, r], i) => (
              <mesh key={"j" + i} position={[x, y, z]} scale={[(look.jelly ?? 0) * 1, (look.jelly ?? 0) * 0.8, (look.jelly ?? 0) * 0.5]} material={m.jelly}>
                <sphereGeometry args={[r, 14, 10]} />
              </mesh>
            ))}
          {arm(-1, rShoulder, rElbow, rWrist, palmRef)}
          {arm(1, lShoulder, lElbow, lWrist)}
          {/* cabeça */}
          <group position={[0, TORSO_TOP + 0.29, 0]} rotation={head} scale={0.875}>
            <mesh scale={[1, 0.96, 0.94]} material={m.skin} castShadow>
              <sphereGeometry args={[0.32, 40, 30]} />
            </mesh>
            {/* orelhas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.315 * sd, -0.02, -0.01]} scale={[0.45, 0.9, 0.7]} material={m.skin}>
                <sphereGeometry args={[0.075, 16, 12]} />
              </mesh>
            ))}
            {/* cabelo: uma peça lisa só, com a borda grossa e arredondada seguindo a linha do cabelo */}
            {(look.hairStyle ?? "bowl") === "bowl" ? (
              <>
                <mesh geometry={hairGeo.shell} material={m.hair} castShadow />
                <mesh geometry={hairGeo.rim} material={m.hair} castShadow />
                <mesh geometry={hairGeo.edge} material={m.hair} castShadow />
              </>
            ) : (
              <OtherHair style={look.hairStyle!} m={m.hair} />
            )}
            {hairLift > 0.3 &&
              [[-0.12, 0.2], [0.05, -0.15], [0.16, 0.3], [-0.05, 0.5]].map(([x, r], i) => (
                <mesh key={i} position={[x, 0.33, -0.02 + i * 0.03]} rotation={[0.2 * i - 0.3, 0, r]} scale={hairLift} material={m.hair}>
                  <coneGeometry args={[0.045, 0.16, 10]} />
                </mesh>
              ))}
            {/* sobrancelhas grossas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.115 * sd, 0.062 + browUp, 0.285]} rotation={[-0.3, 0.3 * sd, Math.PI / 2 - browRot * sd]} material={m.brow}>
                <capsuleGeometry args={[0.022, 0.065, 4, 10]} />
              </mesh>
            ))}
            {/* olhos pretos brilhantes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[0.11 * sd + pupil[0] * 0.01, -0.03 + pupil[1] * 0.01, 0.27]} rotation={[0, 0.33 * sd, 0]} scale={[1 + eyeWide * 0.15, eyeY, 1]}>
                <mesh scale={[0.052, 0.062, 0.024]} material={m.eye}>
                  <sphereGeometry args={[1, 20, 14]} />
                </mesh>
                <mesh position={[0.018, 0.024, 0.02]} scale={0.015} material={m.white}>
                  <sphereGeometry args={[1, 10, 8]} />
                </mesh>
              </group>
            ))}
            {/* olheiras */}
            {bags > 0.01 &&
              [-1, 1].map((sd) => (
                <mesh key={sd} position={[0.11 * sd, -0.095, 0.262]} rotation={[0, 0.3 * sd, 0]} scale={[0.045, 0.014 * bags, 0.01]} material={m.bag}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              ))}
            {/* bochechas */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.18 * sd, -0.1, 0.24]} rotation={[0, 0.55 * sd, 0]} scale={[0.05, 0.034, 0.012]} material={m.blush}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
            ))}
            {/* nariz */}
            <mesh position={[0, -0.075, 0.3]} material={m.skinDark}>
              <sphereGeometry args={[0.03, 14, 10]} />
            </mesh>
            {/* boca */}
            {mouthOpen > 0.05 ? (
              <group position={[0, -0.155, 0.278]}>
                <mesh scale={[0.05 - mouthOpen * 0.01, 0.014 + mouthOpen * 0.045, 0.02]} material={m.mouth}>
                  <sphereGeometry args={[1, 16, 12]} />
                </mesh>
                <mesh position={[0, -0.012 - mouthOpen * 0.018, 0.008]} scale={[0.028, 0.01 + mouthOpen * 0.014, 0.014]} material={m.tongue}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              </group>
            ) : (
              <mesh position={[0, -0.125, 0.282]} rotation={[0.15, 0, Math.PI + (Math.PI - Math.PI * (0.55 + smile * 0.25)) / 2]} material={m.mouth}>
                <torusGeometry args={[0.042, 0.009, 8, 24, Math.PI * (0.55 + smile * 0.25)]} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
