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
      hair: sm(L.hair ?? "#3b2416", 0.45),
      shoe: sm(L.shoe ?? "#f4f4f2", 0.45),
      sole: sm(L.sole ?? "#f08a1c", 0.5),
      eye: sm("#0c0c10", 0.12, {metalness: 0.1}),
      white: sm("#ffffff", 0.2),
      brow: sm("#2a170d", 0.5),
      mouth: sm("#3a1510", 0.5),
      tongue: sm("#e2606e", 0.45),
      blush: sm("#f3a0a6", 0.6),
      bag: sm("#a88094", 0.7),
    }),
    [L.skin, L.shirt, L.pants, L.hair, L.shoe, L.sole],
  );

/* proporções medidas no boneco de referência (altura total ≈ 2,0):
   tênis 0–0,13 · pernas até 0,70 · tronco 0,70–1,415 · cabeça (com cabelo) 1,445–2,0 */
const HIP = 0.72;
const TORSO_BOT = 0.7;
const TORSO_TOP = 1.415;
const HR = 0.34; // raio do cabelo
const HT = Math.acos(0.135 / HR); // borda do cabelo na altura da testa (logo acima das sobrancelhas)
const HIPX = 0.125;
const SHX = 0.36;
const SHY = 1.325;
const THIGH = 0.3;
const SHIN = 0.29;

export const Toy: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>; look?: ToyLook}> = ({pose, palmRef, look = {}}) => {
  const m = useToyMats(look);
  const geo = useMemo(
    () => ({
      torso: new RoundedBoxGeometry(0.53, TORSO_TOP - TORSO_BOT, 0.37, 5, 0.11),
      shoe: new RoundedBoxGeometry(0.2, 0.12, 0.34, 4, 0.055),
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
      {/* manga curta da camiseta */}
      <mesh position={[0, -0.07, 0]} material={m.shirt} castShadow>
        <capsuleGeometry args={[0.112, 0.08, 6, 14]} />
      </mesh>
      {/* braço */}
      <mesh position={[0, -0.14, 0]} material={m.skin} castShadow>
        <capsuleGeometry args={[0.09, 0.16, 6, 14]} />
      </mesh>
      <group position={[0, -0.26, 0]} rotation={[elbow, 0, 0]}>
        <mesh position={[0, -0.11, 0]} material={m.skin} castShadow>
          <capsuleGeometry args={[0.088, 0.16, 6, 14]} />
        </mesh>
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
            <mesh position={[0, -THIGH / 2, 0]} material={m.pants} castShadow receiveShadow>
              <capsuleGeometry args={[0.116, THIGH - 0.06, 6, 14]} />
            </mesh>
            <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
              <mesh position={[0, -SHIN / 2, 0]} material={m.pants} castShadow receiveShadow>
                <capsuleGeometry args={[0.112, SHIN - 0.08, 6, 14]} />
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
          <mesh position={[0, (TORSO_BOT + TORSO_TOP) / 2 + breathe * 0.004, 0]} scale={[1, 1 + breathe * 0.008, 1]} geometry={geo.torso} material={m.shirt} castShadow receiveShadow />
          {/* gola */}
          <mesh position={[0, TORSO_TOP - 0.01, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={m.shirtDark}>
            <torusGeometry args={[0.11, 0.026, 8, 20]} />
          </mesh>
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
            {/* cabelo em cuia: calota cheia inclinada pra trás (alto na testa, desce até a nuca) com borda grossa */}
            <group position={[0, 0.0, -0.015]} rotation={[-0.12, 0, 0]} scale={[1.06, 0.97, 1.07]}>
              <mesh material={m.hair} castShadow>
                <sphereGeometry args={[HR, 40, 22, 0, Math.PI * 2, 0, HT]} />
              </mesh>
              <mesh position={[0, HR * Math.cos(HT), 0]} rotation={[Math.PI / 2, 0, 0]} material={m.hair} castShadow>
                <torusGeometry args={[HR * Math.sin(HT), 0.068, 16, 48]} />
              </mesh>
            </group>
            {/* cabelo de trás: cobre a nuca, termina logo atrás das orelhas */}
            <mesh position={[0, 0.0, -0.01]} scale={[1.03, 0.98, 1.0]} material={m.hair} castShadow>
              <sphereGeometry args={[0.333, 36, 24, Math.PI + 0.16, Math.PI - 0.32, 0, 2.0]} />
            </mesh>
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
