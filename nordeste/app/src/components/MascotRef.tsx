// Mascote do vídeo 6 com as PROPORÇÕES do personagem da referência (vídeo dos tornados):
// corpo alto (cabeça ≈ 1/4 da altura), blusão comprido e fofo, pernas compridas, braços longos que chegam no
// meio da coxa (com cotovelo), cabelo castanho em cúpula arredondada com borda roliça na testa.
// Blusão AZUL com capuz e cordões, mochila com alças cinza, calça azul-escura, tênis branco com sola laranja.
// Usa o mesmo MascotPose do mascote antigo (braços [x, z] em graus, emoção, pulo, tremor, andar, quadril)
// + alcance opcional (lReach/rReach): ponto onde a mão deve chegar, resolvido por cinemática inversa.
import React from "react";
import * as THREE from "three";
import {random} from "remotion";
import {Face, Mat, RB} from "./Mascot";
import type {MascotPose} from "./Mascot";
import {mixHex, rad} from "../lib/anim";

type HandKind = "fist" | "open" | "point";
type V3 = [number, number, number];
export type RefLook = {bottle?: number; bottleTilt?: number; drink?: number; hot?: number; tongue?: boolean; sweat?: number; backpack?: boolean; lHand?: HandKind; rHand?: HandKind; lReach?: V3; rReach?: V3};

const C = {
  skin: "#e9b98f", skinD: "#d9a27a", hair: "#4a3022", hairD: "#3a251a", hairL: "#5a3a28",
  hoodie: "#2f7fd6", hoodieD: "#2463ad", string: "#ffffff", strap: "#5f6b78", pack: "#2463ad",
  pants: "#1c2a4a", shoe: "#f5f6f8", sole: "#ff8f2e",
};

// medidas (unidades do mascote; altura total ≈ 2,55 → com a escala 0,85 do vídeo ≈ 2,2)
const LEG = 0.82; // perna comprida como na referência
const HIP = LEG + 0.12; // altura do quadril (inclui o tênis)
const TORSO_H = 0.92; // blusão comprido
export const SH_Y = HIP + TORSO_H - 0.14; // altura do ombro
export const HEAD_Y = HIP + TORSO_H + 0.3; // centro da cabeça
export const SH_X = 0.46;
const UPPER = 0.42; // braço
const FORE = 0.44; // antebraço até o centro da mão
const BEND0 = 10; // cotovelo nunca fica 100% esticado

const Hand: React.FC<{kind?: HandKind; skin: string}> = ({kind = "fist", skin}) => (
  <group>
    <mesh scale={kind === "open" ? [1.15, 1.2, 0.7] : [1, 1, 1]}>
      <sphereGeometry args={[0.105, 18, 14]} />
      <Mat c={skin} />
    </mesh>
    {/* polegar (como a mão de luva da referência) */}
    <mesh position={[-0.07, 0.02, 0.06]} scale={[0.6, 0.9, 0.6]}>
      <sphereGeometry args={[0.06, 12, 10]} />
      <Mat c={skin} />
    </mesh>
    {kind === "point" && (
      <mesh position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.03, 0.1, 4, 8]} />
        <Mat c={skin} />
      </mesh>
    )}
  </group>
);

/* ---------- cinemática do braço ---------- */
const armQuat = (side: -1 | 1, rot: [number, number]) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(rot[0]), 0, rad(side * rot[1]), "XYZ"));
const elbowQuat = (bend: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -rad(bend));
const handPos = (side: -1 | 1, rot: [number, number], bend: number, off: V3) => {
  const q1 = armQuat(side, rot);
  const e = new THREE.Vector3(0, -UPPER, 0).applyQuaternion(q1);
  const f = new THREE.Vector3(0, -FORE, 0).applyQuaternion(elbowQuat(bend)).applyQuaternion(q1);
  return {hand: new THREE.Vector3(side * SH_X + off[0], SH_Y + off[1], off[2]).add(e).add(f), elbow: e};
};
const ikCache = new Map<string, {rot: [number, number]; bend: number}>();
/** acha [x, z] do ombro e a dobra do cotovelo para a mão chegar no alvo (busca em grade + refinamento) */
export const solveArm = (side: -1 | 1, target: V3, off: V3 = [0, 0, 0]) => {
  const key = side + ":" + target.map((v) => v.toFixed(2)).join(",") + ":" + off.map((v) => v.toFixed(2)).join(",");
  const hit = ikCache.get(key);
  if (hit) return hit;
  const T = new THREE.Vector3(...target);
  const cost = (rx: number, rz: number, b: number) => {
    const {hand, elbow} = handPos(side, [rx, rz], b, off);
    // cotovelo para fora e para baixo (natural), nunca cruzando o corpo
    const out = Math.max(0, 0.12 - side * elbow.x);
    const up = Math.max(0, elbow.y + 0.05);
    return hand.distanceToSquared(T) + 0.05 * out * out + 0.02 * up * up;
  };
  let best = {c: 1e9, rx: 0, rz: 0, b: BEND0};
  for (let rx = -180; rx <= 40; rx += 6)
    for (let rz = -40; rz <= 110; rz += 6)
      for (let b = 0; b <= 150; b += 6) {
        const c = cost(rx, rz, b);
        if (c < best.c) best = {c, rx, rz, b};
      }
  for (const st of [3, 1, 0.5]) {
    let improved = true;
    while (improved) {
      improved = false;
      for (const [dx, dz, db] of [[st, 0, 0], [-st, 0, 0], [0, st, 0], [0, -st, 0], [0, 0, st], [0, 0, -st]]) {
        const b = Math.max(0, Math.min(160, best.b + db));
        const c = cost(best.rx + dx, best.rz + dz, b);
        if (c < best.c - 1e-9) {
          best = {c, rx: best.rx + dx, rz: best.rz + dz, b};
          improved = true;
        }
      }
    }
  }
  const res = {rot: [best.rx, best.rz] as [number, number], bend: best.b};
  ikCache.set(key, res);
  return res;
};

const Arm: React.FC<{side: -1 | 1; rot: [number, number]; bend: number; hand?: HandKind; skin: string; off?: V3; children?: React.ReactNode}> = ({side, rot, bend, hand, skin, off = [0, 0, 0], children}) => (
  <group position={[side * SH_X + off[0], SH_Y + off[1], off[2]]} rotation={[rad(rot[0]), 0, rad(side * rot[1])]}>
    {/* ombro redondo do blusão */}
    <mesh scale={[1, 0.95, 1]}>
      <sphereGeometry args={[0.15, 18, 14]} />
      <Mat c={C.hoodie} />
    </mesh>
    {/* braço (manga gordinha) */}
    <RB w={0.25} h={UPPER + 0.06} d={0.25} r={0.11} c={C.hoodie} position={[0, -UPPER / 2, 0]} />
    <group position={[0, -UPPER, 0]} rotation={[-rad(bend), 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.122, 16, 12]} />
        <Mat c={C.hoodie} />
      </mesh>
      {/* antebraço + punho mais largo (como na referência) */}
      <RB w={0.24} h={FORE - 0.06} d={0.24} r={0.1} c={C.hoodie} position={[0, -(FORE - 0.1) / 2, 0]} />
      <RB w={0.27} h={0.08} d={0.27} r={0.035} c={C.hoodieD} position={[0, -FORE + 0.12, 0]} />
      <group position={[0, -FORE, 0]}>
        <Hand kind={hand} skin={skin} />
        {children}
      </group>
    </group>
  </group>
);

/** garrafa d'água na mão (fica de pé em relação ao corpo; ao beber, a tampa vai na boca e o fundo sobe) */
const UP = new THREE.Vector3(0, 1, 0);
// direção da tampa quando está bebendo: para o lado da boca, para baixo e para trás → fundo da garrafa para cima e de lado (visível de frente)
const SIP = new THREE.Vector3(-0.85, -0.42, -0.3).normalize();
const Bottle: React.FC<{undo: THREE.Quaternion; level: number; drink?: number}> = ({undo, level, drink = 0}) => {
  const dir = UP.clone().lerp(SIP, drink).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
  return (
    <group quaternion={undo}>
      <group quaternion={q}>
        <group position={[0, 0.1 * drink, 0.04 * (1 - drink)]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.28, 18]} />
            <meshStandardMaterial color="#bfe9ff" transparent opacity={0.55} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.06 + 0.14 * level, 0]}>
            <cylinderGeometry args={[0.058, 0.058, Math.max(0.005, 0.28 * level), 18]} />
            <meshStandardMaterial color="#4fc3f7" transparent opacity={0.8} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.05, 12]} />
            <meshStandardMaterial color="#1565c0" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** gole: ombro gira um pouco para frente, cabeça inclina para trás e a tampa encosta na boca */
const SH_OFF: V3 = [-0.06, 0.05, 0.1];
const HEAD_BACK = 15;
const MOUTH = (() => {
  // boca no rosto (ampliado 1,3×): ≈ 0,17 abaixo do centro da cabeça, na frente; gira junto com a cabeça para trás
  const m = new THREE.Vector3(0, -0.21, 0.34).applyAxisAngle(new THREE.Vector3(1, 0, 0), -rad(HEAD_BACK));
  return new THREE.Vector3(0, HEAD_Y, 0).add(m);
})();
const DRINK_HAND: V3 = (() => {
  const h = MOUTH.clone().addScaledVector(SIP, -0.37);
  return [h.x, h.y, h.z];
})();

export const MascotRef: React.FC<{position?: V3; scale?: number; pose: MascotPose; gf: number; look?: RefLook}> = ({position = [0, 0, 0], scale = 1, pose, gf, look = {}}) => {
  const hot = look.hot ?? 0;
  const skin = mixHex(C.skin, "#f08a72", hot * 0.45);
  const period = 95;
  const ph = (gf + Math.floor(random("blinkR") * period)) % period;
  const blink = ph < 4 ? 1 - Math.abs(ph - 2) / 2 : 0;
  const breath = Math.sin(gf * 0.12) * 0.012;
  const sway = Math.sin(gf * 0.06) * 0.03; // nunca fica parado: balanço leve
  const shiver = pose.shiver ? Math.sin(gf * 2.1) * 0.014 * pose.shiver : 0;
  const step = pose.walking ? Math.sin(gf * 0.45) * 28 : 0;
  const hip = pose.hip ?? 0;
  const press = pose.legPress ?? [0, 0];
  const dk = look.drink ?? 0;
  const headTilt = pose.emotion === "worried" ? -6 : pose.emotion === "joy" ? Math.sin(gf * 0.3) * 6 : Math.sin(gf * 0.05) * 3;
  const sweat = look.sweat ?? hot;

  // braços: ângulos da pose, ou alcance (IK) quando a pose pede a mão num ponto; gole mistura com o alcance da boca
  const arm = (side: -1 | 1) => {
    const reach = side < 0 ? pose.lReach ?? look.lReach : pose.rReach ?? look.rReach;
    let base = reach ? solveArm(side, reach) : {rot: side < 0 ? pose.lArm : pose.rArm, bend: BEND0};
    if (side > 0 && reach && pose.rReach2) {
      // vai e volta entre dois alvos já resolvidos: interpola os ângulos (movimento liso, sem saltos da IK)
      const b2 = solveArm(1, pose.rReach2), k = pose.rReachK ?? 0;
      base = {rot: [base.rot[0] + (b2.rot[0] - base.rot[0]) * k, base.rot[1] + (b2.rot[1] - base.rot[1]) * k], bend: base.bend + (b2.bend - base.bend) * k};
    }
    if (side > 0 && dk > 0) {
      const d = solveArm(1, DRINK_HAND, SH_OFF);
      return {
        rot: [base.rot[0] + (d.rot[0] - base.rot[0]) * dk, base.rot[1] + (d.rot[1] - base.rot[1]) * dk] as [number, number],
        bend: base.bend + (d.bend - base.bend) * dk,
        off: SH_OFF.map((v) => v * dk) as V3,
      };
    }
    return {...base, off: [0, 0, 0] as V3};
  };
  const L = arm(-1), R = arm(1);
  const undo = armQuat(1, R.rot).multiply(elbowQuat(R.bend)).invert();

  return (
    <group position={[position[0] + shiver, position[1] + pose.jump * scale, position[2]]} scale={scale}>
      {/* sombra fica no chão quando ele pula */}
      <mesh position={[0, 0.005 - pose.jump, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22 / (1 + pose.jump * 3)} depthWrite={false} />
      </mesh>
      <group rotation={[0, 0, sway * 0.15]}>
        {/* pernas compridas + tênis */}
        {[-1, 1].map((s, i) => (
          <group key={s} position={[s * 0.17, HIP, 0]} rotation={[rad(i ? step : -step) - rad(hip) + rad(press[i] ?? 0), 0, 0]}>
            <RB w={0.29} h={LEG + 0.02} d={0.3} r={0.12} c={C.pants} position={[0, -LEG / 2 + 0.02, 0]} />
            <RB w={0.29} h={0.14} d={0.42} r={0.065} c={C.shoe} position={[0, -LEG - 0.03, 0.06]} />
            <RB w={0.3} h={0.045} d={0.43} r={0.02} c={C.sole} position={[0, -LEG - 0.1, 0.06]} />
          </group>
        ))}
        {/* tronco: blusão azul comprido e fofo */}
        <group position={[0, HIP - 0.04, 0]} scale={[1, 1 + breath, 1 + breath * 0.5]}>
          <RB w={0.8} h={TORSO_H} d={0.52} r={0.24} c={C.hoodie} position={[0, TORSO_H / 2, 0]} />
          {/* barra e bolso canguru */}
          <RB w={0.78} h={0.1} d={0.5} r={0.05} c={C.hoodieD} position={[0, 0.05, 0]} />
          <RB w={0.46} h={0.22} d={0.03} r={0.05} c={C.hoodieD} position={[0, 0.24, 0.26]} />
          {/* cordões do capuz */}
          {[-0.07, 0.07].map((x) => <RB key={x} w={0.028} h={0.26} d={0.02} r={0.012} c={C.string} position={[x, TORSO_H - 0.2, 0.265]} />)}
          {/* capuz atrás do pescoço + gola */}
          <mesh position={[0, TORSO_H - 0.02, -0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.85, 1]}>
            <torusGeometry args={[0.21, 0.08, 12, 24]} />
            <Mat c={C.hoodieD} />
          </mesh>
          {/* alças da mochila (cinza) passando pelos ombros */}
          {[-0.26, 0.26].map((x) => <RB key={x} w={0.09} h={TORSO_H * 0.92} d={0.03} r={0.015} c={C.strap} position={[x, TORSO_H * 0.5, 0.255]} />)}
          {look.backpack !== false && (
            <group position={[0, TORSO_H * 0.55, -0.36]}>
              <RB w={0.64} h={0.74} d={0.26} r={0.11} c={C.pack} />
              <RB w={0.46} h={0.28} d={0.06} r={0.05} c={C.hoodieD} position={[0, -0.14, -0.15]} />
            </group>
          )}
        </group>
        <Arm side={-1} rot={L.rot} bend={L.bend} hand={look.lHand} skin={skin} />
        <Arm side={1} rot={R.rot} bend={R.bend} off={R.off} hand={look.rHand} skin={skin}>
          {(look.bottle ?? 0) > 0 && <Bottle undo={undo} level={look.bottle ?? 1} drink={dk} />}
        </Arm>
        {/* cabeça arredondada */}
        <group position={[0, HEAD_Y + breath * 0.5, 0]} rotation={[rad(-HEAD_BACK * dk), 0, rad(headTilt * (1 - dk))]}>
          <RB w={0.74} h={0.68} d={0.64} r={0.28} c={skin} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.37, -0.04, 0]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.08, 12, 10]} />
              <Mat c={skin} />
            </mesh>
          ))}
          {/* cabelo igual ao da referência: cúpula arredondada e baixa em cima da cabeça,
              com uma borda roliça na testa (as sobrancelhas ficam logo abaixo) e a nuca coberta */}
          <mesh position={[0, 0.17, -0.02]} scale={[1.02, 0.6, 0.98]}>
            <sphereGeometry args={[0.39, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat c={C.hair} />
          </mesh>
          <mesh position={[0, 0.17, -0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1.02, 0.98, 1]}>
            <torusGeometry args={[0.375, 0.06, 14, 48]} />
            <Mat c={C.hairD} />
          </mesh>
          {/* nuca */}
          <mesh position={[0, 0.06, -0.18]} scale={[1.0, 0.7, 0.55]}>
            <sphereGeometry args={[0.37, 28, 16]} />
            <Mat c={C.hair} />
          </mesh>
          {/* rosto (o mesmo do canal, ampliado para a cabeça maior) */}
          <group position={[0, -0.04, 0]} scale={1.3}>
            <Face emotion={pose.emotion} talk={pose.talk} blink={blink} />
          </group>
          {/* língua de fora no calor */}
          {look.tongue && (
            <mesh position={[0, -0.25, 0.32]} rotation={[0.5, 0, 0]} scale={[0.07, 0.1, 0.03]}>
              <sphereGeometry args={[1, 14, 10]} />
              <Mat c="#e86a6a" r={0.4} />
            </mesh>
          )}
          {/* gotas de suor azuis do lado da cabeça (como na referência) */}
          {sweat > 0.05 &&
            [-1, 1].map((s, k) => {
              const ph2 = ((gf * 0.025 + k * 0.5) % 1);
              return (
                <group key={"sw" + s} position={[s * 0.4, 0.05 - ph2 * 0.25, 0.12]}>
                  <mesh scale={[0.7, 1, 0.7]}>
                    <sphereGeometry args={[0.05 * sweat, 12, 10]} />
                    <meshStandardMaterial color="#7fd0ff" roughness={0.1} metalness={0.1} emissive="#7fd0ff" emissiveIntensity={0.35} transparent opacity={0.95 - ph2 * 0.5} />
                  </mesh>
                  <mesh position={[0, 0.05 * sweat, 0]}>
                    <coneGeometry args={[0.035 * sweat, 0.07 * sweat, 12]} />
                    <meshStandardMaterial color="#7fd0ff" roughness={0.1} emissive="#7fd0ff" emissiveIntensity={0.35} transparent opacity={0.95 - ph2 * 0.5} />
                  </mesh>
                </group>
              );
            })}
        </group>
      </group>
    </group>
  );
};
export const _t = THREE;
