import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Tree, V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {SchoolDesk} from "./Sets7";
import {Cap, Duck} from "./Sets15";
import {HeadGlasses} from "./Sets17";
import {BigJet, SkyClouds, BedroomC} from "./Sets19";
import {Bg} from "./Sets20";
import {Beach} from "./Sets21";
import {SchoolBus, Kangaroo, SchoolHouse, SantaHat, GiftBox, SurpriseTest, Koala, KoalaClass, Medal, DuckRing, Diploma, CardMachine, BigCoffee, NightWindow, Crack, DirectorOffice, Debris, OFFICE_H, HOLE} from "./Sets27";
import {Captions, StageTitle, Confetti, Zzz, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingOnibus.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_ONIBUS = F(words[words.length - 1].e + 0.9);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HOLD: Pose = {rShoulder: [-1.0, 0.35, 0.05], rElbow: -1.3};
// eslint-disable-next-line
const _SIP: Pose = {rShoulder: [-1.15, 0.12, 0.05], rElbow: -1.8, head: [-0.18, 0, 0]};
const RUN = (t: number, i = 0): Pose => ({walk: t * 16 + i, walkAmt: 1.3, rShoulder: [-0.9 * Math.sin(t * 16 + i), 0, -0.15], rElbow: -1.2, lShoulder: [0.9 * Math.sin(t * 16 + i), 0, 0.15], lElbow: -1.2, torso: [0.25, 0, 0]});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};
const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 900;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    const m = palm.current.matrixWorld.clone();
    const par = g.current.parent;
    if (par) {
      par.updateWorldMatrix(true, false);
      m.premultiply(par.matrixWorld.clone().invert());
    }
    m.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const HandToy: React.FC<{pose: Pose; look: ToyLook; headExtra?: React.ReactNode; item: React.ReactNode}> = ({pose, look, headExtra, item}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Toy pose={pose} look={look} palmRef={palm} headExtra={headExtra} />
      <InHand palm={palm}>{item}</InHand>
    </>
  );
};
const KitchenLights: React.FC<{night?: boolean}> = ({night = false}) => (
  <>
    <hemisphereLight args={[night ? "#9fb0ff" : "#fff6e6", "#b08a60", night ? 0.6 : 1.0]} />
    <pointLight position={[0.3, 3.2, 1.6]} intensity={night ? 7 : 10} distance={12} decay={1.4} color="#fff4e0" castShadow />
  </>
);
const DayOut: React.FC<{x?: number; z?: number}> = ({x = 0, z = 0}) => (
  <>
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[x, 1, z]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
  </>
);
/** coração batendo (na frente do peito) */
const Heart: React.FC<{p: V3; s: number}> = ({p, s}) => {
  const m = sm("#e8262d", 0.3, {emissive: "#e8262d", emissiveIntensity: 0.6});
  return (
    <group position={p} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.06 * sd, 0.05, 0]} material={m}>
          <sphereGeometry args={[0.08, 14, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI]} material={m}>
        <coneGeometry args={[0.135, 0.18, 16]} />
      </mesh>
    </group>
  );
};
/** risquinhos de velocidade atrás de quem corre */
const SpeedLines: React.FC<{p: V3; dir?: number}> = ({p, dir = -1}) => {
  const r = rng(9);
  const ls = Array.from({length: 7}, () => [r() * 2.2, 0.3 + r() * 1.4, (r() - 0.5) * 0.4] as V3);
  return (
    <group position={p}>
      {ls.map((q, i) => (
        <mesh key={i} position={[dir * (0.6 + q[0]), q[1], q[2]]}>
          <boxGeometry args={[0.9 + (i % 3) * 0.4, 0.025, 0.025]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- horários ---------- */
const PERDEU0 = at(0, "perdeu");
const ENTAO0 = at(0, "entao");
const CANGURU0 = at(0, "canguru");
const CINCO0 = at(0, "cinco");
const EUCALIPTO0 = at(0, "eucalipto");
const PULA1 = at(1, "pula");
const ATRAVESSA1 = at(1, "atravessa");
const POUSA1 = at(1, "pousa");
const ENXERGA3 = at(3, "enxerga");
const ACHA3 = at(3, "acha");
const PAPAI3 = at(3, "papai");
const TERCA3 = at(3, "tercafeira");
const PRESENTE4 = at(4, "presente");
const ABRE4 = at(4, "abre");
const PROVA4 = at(4, "prova");
const PULA6 = at(6, "pula");
const MAS6 = at(6, "mas");
const TOMA6 = at(6, "toma");
const PULA6B = at(6, "pula", 1);
const AUSTRALIA6 = at(6, "australia");
const COALA7 = at(7, "coala");
const DORMIR7 = at(7, "dormir");
const VINTE7 = at(7, "vinte");
const DEZ9 = at(9, "dez");
const MELHOR9 = at(9, "melhor");
const ONIBUS10 = at(10, "onibus");
const BOIANDO10 = at(10, "boiando");
const MOTORISTA10 = at(10, "motorista");
const PORQUE10 = at(10, "porque");
const PARABENS11 = at(11, "parabens");
const DIPLOMA11 = at(11, "diploma");
const CANGURU11 = at(11, "canguru");
const DOLAR11 = at(11, "dolar");
const CANGURU12 = at(12, "canguru");
const CINCO12 = at(12, "cinco");

const BAG: ToyLook = {hoodie: true, backpack: "#2e86de"};
const DIRETORA: ToyLook = {suit: true, shirt: "#24345a", pants: "#24345a", shoe: "#101018", hairStyle: "bun", hair: "#5a3a20", lips: "#c0392b", skin: "#e0b08a", lashes: true};
const MOTORISTA: ToyLook = {shirt: "#ffffff", pants: "#1f2a44", hairStyle: "buzz", hair: "#3a2a1a", belly: 0.6, skin: "#c68a5a"};
const K_S = 1.3;
const PHONE = <mesh position={[0, 0.02, 0.06]} rotation={[Math.PI / 2, 0, 0]} geometry={rbox(0.12, 0.22, 0.02, 0.01)} material={sm("#1d1f27", 0.3)} />;

/** menino dentro da bolsa do canguru (só cabeça e ombros pra fora) */
const InPouch: React.FC<{f: number; extra?: Pose; headExtra?: React.ReactNode}> = ({f, extra = {}, headExtra}) => (
  <group scale={0.5} position={[0, -0.55, 0.02]}>
    <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.6, 0, -0.3], rElbow: -0.6, lShoulder: [-1.6, 0, 0.3], lElbow: -0.6, smile: 1, ...extra}} look={BOY} headExtra={headExtra} />
  </group>
);

/* =================== rua de casa =================== */
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -7]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={sm("#4a4d57", 0.9)} receiveShadow>
      <planeGeometry args={[60, 4.5]} />
    </mesh>
    {Array.from({length: 14}, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-26 + i * 4, 0.01, 0]} material={sm("#ffffff", 0.6)}>
        <planeGeometry args={[1.6, 0.12]} />
      </mesh>
    ))}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 3.6]} material={sm("#c9c2b5", 0.9)} receiveShadow>
      <planeGeometry args={[60, 2.8]} />
    </mesh>
  </>
);
/* 0 — o ônibus indo embora e o menino correndo */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  return (
    <>
      <Cam pos={[-1.6 + s2 * 0.9, 1.9, 7.0]} look={[1.2 + s2 * 1.6, 1.2, 0]} fov={58} f={f} a={a} />
      <Street t={t} />
      <SchoolBus p={[2.5 + s2 * 3.2, 0, -0.6]} spin={-s2 * 8} />
      <Toy pose={{...idle(f), pos: [-0.4 + s2 * 1.6, 0, 1.6], rotY: Math.PI / 2, ...RUN(t), mouthOpen: 0.5, eyeWide: 1}} look={BAG} />
    </>
  );
};
/* chamando o canguru no celular */
const S0b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.5, 4.4]} look={[0, 1.15, 1.6]} fov={50} f={f} a={a} />
    <Street t={t} />
    <HandToy pose={{...idle(f), pos: [0, 0, 1.6], rotY: 0, rShoulder: [-1.3, 0.3, 0.1], rElbow: -1.3, smile: 0.6, head: [0.2, 0, 0]}} look={BAG} item={PHONE} />
  </>
);
/* o canguru chega pulando */
const S0c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 20);
  const land = f - a - 20;
  const sq = land >= 0 && land < 10 ? Math.sin((land / 10) * Math.PI) : 0;
  return (
    <>
      <Cam pos={[0.1, 2.0, 7.6]} look={[0.1, 1.6, 1.4]} fov={58} f={f} a={a} />
      <Street t={t} />
      <Kangaroo p={[lerp(6, 0.85, k), Math.sin(k * Math.PI) * 2.5, 1.4]} rotY={-0.6 + k * 0.2} s={K_S} t={t} squash={sq} legs={k < 1 ? 1 : 0} />
      <HandToy pose={{...idle(f), pos: [-0.9, 0, 1.7], rotY: 0.5, rShoulder: [-1.3, 0.3, 0.1], rElbow: -1.3, eyeWide: k >= 1 ? 1 : 0.3, mouthOpen: k >= 1 ? 0.4 : 0}} look={BAG} item={PHONE} />
      {f >= EUCALIPTO0 - 4 &&
        Array.from({length: 10}, (_, i) => {
          const q = ((t * 0.6 + i / 10) % 1);
          return (
            <mesh key={i} position={[1.1 + Math.sin(i * 2 + t) * 1.2, 0.6 + q * 2.6, 1.4 + Math.cos(i * 3) * 0.8]} rotation={[t * 2 + i, i, 0]} scale={[0.14, 0.04, 0.06]} material={sm("#6aa58a", 0.8)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          );
        })}
    </>
  );
};

/* =================== o pulo até a escola =================== */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const crouch = ramp(f, a + 4, PULA1 + 4);
  const up = clamp((f - PULA1 - 4) / 20);
  return (
    <>
      <Cam pos={[1.2, 1.7 + up * 5, 6.0]} look={[0.4, 1.7 + up * 7, 1.2]} fov={58} f={f} a={a} />
      <Street t={t} />
      <Kangaroo p={[0.4, up * up * 14, 1.3]} rotY={0.25} s={K_S} t={t} squash={up > 0 ? -0.2 : crouch * 0.5} legs={up > 0 ? 1 : 0} pouch={<InPouch f={f} extra={up > 0 ? {eyeWide: 1, mouthOpen: 0.6, ...ARMS_UP} : {}} />} />
    </>
  );
};
const S1b: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 1.0, 7]} look={[0, 1.4, 0]} fov={56} f={f} a={a} punch={4} />
      <SkyClouds x={0} />
      <hemisphereLight args={["#ffffff", "#9fc8ff", 1.2]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      {Array.from({length: 6}, (_, i) => (
        <mesh key={i} position={[(i % 3 - 1) * 2.8, 6 - ((s2 * 9 + i * 2.2) % 13), -1 - (i % 2) * 2]} scale={[1.6, 0.6, 0.9]} material={sm("#ffffff", 0.95)}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
      <BigJet p={[8 - s2 * 7, 0.6, -9]} s={0.35} />
      <Kangaroo p={[0, -0.6, 0]} rotY={0.2} s={K_S} t={t} squash={-0.2} legs={1} pouch={<InPouch f={f} extra={{eyeWide: 1, mouthOpen: 0.6, hairLift: 1, ...ARMS_UP}} />} />
      <SpeedLines p={[0, 0, 0]} />
    </>
  );
};
/* pátio da escola */
const SchoolYard: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut x={0} z={-3} />
    <group position={[0, 0, -14]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={sm("#c9c2b5", 0.9)} receiveShadow>
      <planeGeometry args={[40, 30]} />
    </mesh>
    <SchoolHouse p={[0, 0, -3]} />
    <Tree p={[-5.6, 0, -2]} s={1.3} />
    <Tree p={[5.8, 0, -1.6]} s={1.2} />
  </>
);
const ROOF_Y = 4.22;
const S1c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 18);
  const land = f - a - 18;
  const sq = land >= 0 && land < 10 ? Math.sin((land / 10) * Math.PI) : 0;
  return (
    <>
      <Cam pos={[2.5, 3.2, 9.5]} look={[0.2, 4.0, -3]} fov={60} f={f} a={a} />
      <SchoolYard t={t} />
      <Kangaroo p={[0.2, ROOF_Y + (1 - k) * 8, -3]} rotY={0.1} s={K_S} t={t} squash={sq} legs={k < 1 ? 1 : 0} pouch={<InPouch f={f} extra={{eyeWide: 1, mouthOpen: 0.4, hairLift: k < 1 ? 1 : 0}} />} />
    </>
  );
};
/* "transporte saltitante": no telhado, o menino já fora da bolsa */
const S2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, ROOF_Y + 1.8, 3.8]} look={[0.1, ROOF_Y + 1.3, -3]} fov={60} f={f} a={a} />
    <SchoolYard t={t} />
    <Kangaroo p={[0.8, ROOF_Y, -3.4]} rotY={-0.3} s={K_S} t={t} />
    <Toy pose={{...idle(f), pos: [-0.7, ROOF_Y, -2.6], rotY: 0.3, ...ARMS_UP, smile: 1, mouthOpen: 0.4, hairLift: 0.6}} look={BAG} />
    <Crack p={[0.1, ROOF_Y + 0.01, -3.0]} s={0.5 + 2.2 * clamp((f - a - 20) / 50)} />
  </>
);
/* =================== 3–6 — dentro da sala da diretora =================== */
const OfficeLights: React.FC = () => (
  <>
    <Bg c="#e9dcc3" />
    <hemisphereLight args={["#fff6e6", "#8a6a4a", 1.0]} />
    <pointLight position={[0.2, 3.2, 1.2]} intensity={10} distance={12} decay={1.4} color="#fff4e0" castShadow />
  </>
);
const K_IN = 1.05;
const KANG_O: V3 = [1.45, 0, 0.3];
const BOY_O: V3 = [0.1, 0, 0.75];
const DIR_O: V3 = [-0.5, 0, -2.05];
/* a diretora na mesa, o teto racha e quebra; os dois caem dentro da sala */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const crack = clamp((f - ENXERGA3 + 10) / 50);
  const fall = f >= ACHA3 - 4 ? clamp((f - ACHA3 + 4) / 14) : -1;
  const broken = fall >= 0 ? 1 : 0;
  const land = f - (ACHA3 + 10);
  const sq = land >= 0 && land < 10 ? Math.sin((land / 10) * Math.PI) : 0;
  const close = f >= PAPAI3 - 4;
  const hat = close ? easeOut(clamp((f - PAPAI3 + 4) / 8)) : 0;
  const y = fall < 0 ? 99 : (1 - fall * fall) * (OFFICE_H + 0.5);
  return (
    <>
      {close ? (
        <Cam pos={[0.3, 1.45, 3.6]} look={[0.15, 1.25, BOY_O[2]]} fov={48} f={f} a={PAPAI3 - 4} />
      ) : (
        <Cam pos={[0.3, 1.8, 4.6]} look={[0.2, 1.7, -0.8]} fov={62} f={f} a={broken ? ACHA3 - 4 : a} punch={broken ? 10 : 7} />
      )}
      <OfficeLights />
      <DirectorOffice broken={broken} crack={crack} t={t} />
      <Debris k={fall < 0 ? 0 : (f - ACHA3 + 4) / 22} at={[HOLE[0], OFFICE_H, HOLE[2]]} />
      <Toy pose={{...idle(f), pos: DIR_O, rotY: 0.15, head: [-0.5, 0, 0], eyeWide: crack > 0 ? 1 : 0.3, mouthOpen: broken ? 0.7 : crack > 0.3 ? 0.3 : 0, brow: crack > 0 ? 1 : 0, ...(broken ? ARMS_UP : {})}} look={DIRETORA} headExtra={<HeadGlasses />} />
      {fall >= 0 && (
        <>
          <Kangaroo p={[KANG_O[0], y, KANG_O[2]]} rotY={-0.4} s={K_IN} t={t} squash={sq} legs={fall < 1 ? 1 : 0} />
          <Toy pose={{...idle(f), pos: [BOY_O[0], y, BOY_O[2]], rotY: 0, eyeWide: close ? 0.8 : 1, mouthOpen: close ? 0.1 : 0.6, smile: close ? 0.8 : 0, hairLift: fall < 1 ? 1 : 0, ...(fall < 1 ? ARMS_UP : {})}} look={BAG} headExtra={hat > 0 ? <SantaHat k={hat} /> : undefined} />
        </>
      )}
    </>
  );
};
/* 4 — o presente por cima da mesa */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const opened = f >= ABRE4;
  const lid = opened ? easeOut(clamp((f - ABRE4) / 10)) : 0;
  const fly = f >= PROVA4 - 6 ? easeOut(clamp((f - PROVA4 + 6) / 12)) : 0;
  const give = easeInOut(clamp((f - PRESENTE4) / 20));
  const giftP: V3 = opened ? [BOY_O[0], 1.0, BOY_O[2] + 0.42] : [lerp(-0.5, -0.1, give), 0.86, lerp(-1.6, -0.6, give)];
  return (
    <>
      <Cam pos={opened ? [0.5, 1.6, 3.5] : [-2.6, 2.0, 3.4]} look={opened ? [0.1, 1.3, BOY_O[2]] : [0.4, 1.1, -0.5]} fov={opened ? 52 : 60} f={f} a={opened ? ABRE4 - 3 : a} />
      <OfficeLights />
      <DirectorOffice broken={1} t={t} />
      <Kangaroo p={KANG_O} rotY={-0.4} s={K_IN} t={t} />
      <Toy pose={{...idle(f), pos: BOY_O, rotY: opened ? 0 : Math.PI - 0.3, rShoulder: [-1.2, 0.35, 0.1], rElbow: -0.9, lShoulder: [-1.2, -0.35, -0.1], lElbow: -0.9, eyeWide: fly > 0 ? 1 : 0.4, mouthOpen: fly > 0 ? 0.7 : 0.1, brow: fly > 0 ? 1 : 0, smile: fly > 0 ? 0 : 1}} look={BAG} headExtra={<SantaHat />} />
      {!opened && <Toy pose={{...idle(f + 4), pos: [-0.5, 0, -1.15], rotY: 0.15, rShoulder: [-1.5, 0.2, 0], rElbow: -0.3, lShoulder: [-1.5, -0.2, 0], lElbow: -0.3, smile: 1}} look={DIRETORA} headExtra={<HeadGlasses />} />}
      <GiftBox p={giftP} s={1.0} open={lid} />
      {fly > 0 && <SurpriseTest p={[BOY_O[0], 1.3 + fly * 0.45, BOY_O[2] + 0.45 + fly * 0.1]} r={[0, 0, 0.08 * Math.sin(t * 5)]} s={1.6} />}
    </>
  );
};
/* 5 — armadilha natalina: close na prova */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 60);
  return (
    <>
      <Cam pos={[0.1, 1.5, lerp(2.8, 2.3, k)]} look={[0.1, 1.4, BOY_O[2]]} fov={46} f={f} a={a} />
      <OfficeLights />
      <DirectorOffice broken={1} t={t} />
      <Toy pose={{...idle(f), pos: BOY_O, rotY: 0, rShoulder: [-1.4, 0.3, 0.1], rElbow: -0.8, lShoulder: [-1.4, -0.3, -0.1], lElbow: -0.8, eyeWide: 1, mouthOpen: 0.7, brow: 1}} look={BAG} headExtra={<SantaHat />} />
      <SurpriseTest p={[BOY_O[0], 1.22, BOY_O[2] + 0.55]} r={[0, 0, 0.05 * Math.sin(t * 8)]} s={1.4} />
    </>
  );
};
/* 6 — de volta na bolsa, o café, e o pulo pelo buraco do teto */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const hop = clamp((f - PULA6) / 16);
  const inPouch = hop >= 1;
  const tired = f >= MAS6 - 3 ? 1 : 0;
  const coffee = f >= TOMA6 - 3;
  const drink = coffee ? clamp((f - TOMA6) / 30) : 0;
  const wired = f >= PULA6B - 20;
  const up = clamp((f - PULA6B + 6) / 12);
  const kp: V3 = [lerp(KANG_O[0], HOLE[0], up), up * up * 8, lerp(KANG_O[2], HOLE[2], up)];
  return (
    <>
      <Cam pos={[0.2, 1.9, 4.6]} look={[0.6, 1.8, -0.4]} fov={62} f={f} a={coffee ? TOMA6 - 3 : a} />
      <OfficeLights />
      <DirectorOffice broken={1} t={t} />
      <Toy pose={{...idle(f), pos: DIR_O, rotY: 0.3, eyeWide: 1, brow: 1, mouthOpen: up > 0 ? 0.6 : 0.2, head: [up > 0 ? -0.5 : 0, 0.3, 0]}} look={DIRETORA} headExtra={<HeadGlasses />} />
      <Kangaroo p={kp} rotY={-0.4} s={K_IN} t={t} tired={wired ? 0 : tired} squash={wired && up <= 0 ? 0.06 * Math.sin(t * 40) : up > 0 ? -0.2 : 0} legs={up > 0 ? 1 : 0} pouch={inPouch ? <InPouch f={f} extra={{eyeWide: wired ? 1 : 0.5, mouthOpen: wired ? 0.5 : 0}} headExtra={<SantaHat />} /> : undefined} />
      {!inPouch && <Toy pose={{...idle(f), pos: [lerp(BOY_O[0], KANG_O[0], hop), Math.sin(hop * Math.PI) * 0.8, lerp(BOY_O[2], KANG_O[2] + 0.3, hop)], rotY: 0.8, ...(f >= PULA6 ? ARMS_UP : {}), eyeWide: 0.8}} look={BAG} headExtra={<SantaHat />} />}
      {coffee && up <= 0 && <BigCoffee p={[KANG_O[0] + 0.1, 2.05 * K_IN + drink * 0.12, KANG_O[2] + 0.55 * K_IN]} r={[-drink * 1.0, -0.4, 0]} s={1.5} />}
    </>
  );
};

/* =================== 7–9 — escola de coala na Austrália =================== */
const ClassLights: React.FC = () => (
  <>
    <Bg c="#cfe8c0" />
    <hemisphereLight args={["#fff6e6", "#8a6a4a", 1.0]} />
    <pointLight position={[0, 3.6, 1.6]} intensity={11} distance={12} decay={1.4} color="#fff4e0" castShadow />
  </>
);
const KOALAS: V3[] = [[-1.15, 0, 0.6], [1.15, 0, 0.6], [-0.6, 0, 2.2], [0.6, 0, 2.2]];
const BOYDESK: V3 = [0, 0, 1.0];
const ClassRoom: React.FC<{f: number; t: number; sleep: number; clap?: number}> = ({f, t, sleep, clap = 0}) => (
  <>
    <ClassLights />
    <KoalaClass />
    {KOALAS.map((p, i) => (
      <React.Fragment key={i}>
        <SchoolDesk p={[p[0], 0, p[2] - 0.45]} rotY={Math.PI} />
        <Koala p={[p[0], 0, p[2]]} rotY={Math.PI} s={1.15} sleep={clap > 0 ? 0 : sleep} t={t + i} clap={clap} />
      </React.Fragment>
    ))}
    <SchoolDesk p={[BOYDESK[0], 0, BOYDESK[2] - 0.45]} rotY={Math.PI} />
  </>
);
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const sleep = f >= DORMIR7 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.2, 1.75, -2.3]} look={[0, 0.85, 1.3]} fov={64} f={f} a={a} />
      <ClassRoom f={f} t={t} sleep={sleep} />
      <Koala p={[1.55, 0, -1.9]} rotY={-0.4} s={1.3} glasses t={t} head={-0.1} />
      <Toy pose={{...idle(f), pos: [BOYDESK[0], 0, BOYDESK[2]], rotY: Math.PI, ...(sleep ? {torso: [0.3, 0, 0], head: [0.15, 0, 0.55], blink: 1, rShoulder: [-1.2, 0, 0], lShoulder: [-1.2, 0, 0], rElbow: -1.5, lElbow: -1.5} : {eyeWide: 0.6, mouthOpen: 0.5 * Math.abs(Math.sin(t * 2)), rShoulder: [-2.4, 0, -0.3], rElbow: -1.8})}} look={BAG} />
    </>
  );
};
/* 7 (começo) — o coala de óculos lá na frente */
const S7a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.1, 1.9, 2.0]} look={[0.1, 1.0, -1.7]} fov={58} f={f} a={a} />
    <ClassRoom f={f} t={t} sleep={1} />
    <Koala p={[0.62, 0, -1.9]} rotY={-0.6} s={1.3} glasses t={t} />
    <Toy pose={{...idle(f), pos: [-0.45, 0, -1.55], rotY: 0.9, eyeWide: 0.6, smile: 0.3}} look={BAG} />
  </>
);
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.4, 2.1, -2.35]} look={[0, 0.75, 1.3]} fov={66} f={f} a={a} />
    <ClassRoom f={f} t={t} sleep={1} />
    <Koala p={[1.55, 0, -1.9]} rotY={-0.4} s={1.3} glasses sleep={1} t={t} />
    <Toy pose={{...idle(f), pos: [BOYDESK[0], 0, BOYDESK[2]], rotY: Math.PI, torso: [0.3, 0, 0], head: [0.15, 0, 0.55], blink: 1, rShoulder: [-1.2, 0, 0], lShoulder: [-1.2, 0, 0], rElbow: -1.5, lElbow: -1.5}} look={BAG} />
  </>
);
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.7, -2.2]} look={[0, 0.9, 1.3]} fov={62} f={f} a={a} />
    <ClassRoom f={f} t={t} sleep={0} clap={1} />
    <Toy pose={{...idle(f), pos: [BOYDESK[0], 0, BOYDESK[2]], rotY: Math.PI, torso: [0.3, 0, 0], head: [0.15, 0, 0.55], blink: 1, rShoulder: [-1.2, 0, 0], lShoulder: [-1.2, 0, 0], rElbow: -1.5, lElbow: -1.5}} look={BAG} />
    <Medal p={[BOYDESK[0], 1.02, BOYDESK[2] - 0.32]} s={1.3} />
  </>
);

/* =================== 10 — o ônibus boiando no mar =================== */
const AusBeach: React.FC<{t: number}> = ({t}) => (
  <>
    <Sky />
    <hemisphereLight args={["#d6ecff", "#c8a870", 1.1]} />
    <SunLight target={[0, 1, -3]} dir={[-6, 10, 7]} intensity={2.6} ext={14} />
    <Beach t={t} />
  </>
);
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(clamp((f - a) / 70));
  const busX = lerp(14, 2.0, k);
  return (
    <>
      {f >= MOTORISTA10 - 3 ? (
        <Cam pos={[3.0, 3.6, 0.2]} look={[2.0, 3.6, -9]} fov={50} f={f} a={MOTORISTA10 - 3} />
      ) : (
        <Cam pos={[0.2, 2.2, 6.5]} look={[1.0, 1.6, -6]} fov={60} f={f} a={a} />
      )}
      <AusBeach t={t} />
      <SchoolBus p={[busX, -1.0, -9]} rotY={Math.PI} float t={t} />
      <group position={[busX - 0.6, 1.9, -9]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0.2, rShoulder: [-2.6, 0, -0.4 + 0.3 * Math.sin(t * 8)], rElbow: -0.3, smile: 1, mouthOpen: 0.3}} look={MOTORISTA} headExtra={<Cap />} />
        <DuckRing p={[0, 0.85, 0]} s={1.0} />
      </group>
      <Duck p={[busX + 1.6, 2.28, -9]} r={[0, -0.6, 0]} s={1.4} t={t} />
      {f < MOTORISTA10 - 3 && (
        <>
          <Kangaroo p={[-1.0, 0, 0.3]} rotY={-0.4 + Math.PI} s={K_S} t={t} plaque={false} />
          <Toy pose={{...idle(f), pos: [0.2, 0, 1.6], rotY: Math.PI, ...(f >= ONIBUS10 ? ARMS_UP : {})}} look={BAG} headExtra={<SantaHat />} />
          <Koala p={[1.5, 0, 1.4]} rotY={Math.PI} s={1.1} t={t} glasses />
        </>
      )}
    </>
  );
};

/* =================== 11 — parabéns =================== */
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.9, 6.2]} look={[0.1, 1.5, 0]} fov={56} f={f} a={f >= CANGURU11 - 3 ? CANGURU11 - 3 : a} />
    <AusBeach t={t} />
    <SchoolBus p={[3.5, -1.0, -9]} rotY={Math.PI} float t={t} />
    <HandToy pose={{...idle(f), pos: [-0.6, 0, 0.6], rotY: 0.25, rShoulder: [-2.5, 0.2, -0.2], rElbow: -0.4, smile: 1, mouthOpen: 0.3}} look={BAG} headExtra={<SantaHat />} item={f >= DIPLOMA11 - 4 ? <Diploma p={[0, 0.02, 0.06]} r={[0, 0, 0]} s={2.4} /> : null} />
    <Medal p={[-0.6, 1.02, 0.92]} s={1.3} />
    <Kangaroo p={[1.0, 0, 0.0]} rotY={-0.35} s={K_S} t={t} />
    {f >= CANGURU11 - 4 && <CardMachine p={[0.62, 1.95, 0.75]} r={[0, -0.35, 0]} s={2.6} />}
  </>
);

/* =================== 12 — o canguru na janela de madrugada =================== */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const peek = easeOut(clamp((f - CANGURU12 + 6) / 16));
  return (
    <>
      <Cam pos={[1.8, 1.8, 1.8]} look={[-0.1, 1.2, -1.6]} fov={60} f={f} a={a} />
      <BedroomC night />
      <hemisphereLight args={["#9fb0ff", "#403050", 0.6]} />
      <pointLight position={[0.4, 2.0, 0.2]} intensity={4} distance={7} decay={1.5} color="#bfd0ff" castShadow />
      {/* janela com o céu da madrugada */}
      <mesh position={[-1.6, 1.7, -2.49]} material={sm("#0b1030", 0.4, {emissive: "#141c50", emissiveIntensity: 0.6})}>
        <planeGeometry args={[1.4, 1.1]} />
      </mesh>
      <group position={[-1.6, 1.7 - (1 - peek) * 0.9, -2.455]} scale={[1, 1, 0.08]}>
        <group position={[0, -2.0 * K_S * 0.5, 0]}>
          <Kangaroo p={[0, -0.4, 0]} s={K_S * 0.5} t={t} plaque={false} />
        </group>
      </group>
      <mesh position={[-1.6, 0.85, -2.4]} material={sm("#a8d8f0", 0.9)}>
        <planeGeometry args={[1.7, 0.6]} />
      </mesh>
      <NightWindow p={[-1.6, 1.7, -2.47]} />
      <group position={[0, 0.84, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: f >= CINCO12 ? 0 : 1, eyeWide: f >= CINCO12 ? 1 : 0, mouthOpen: f >= CINCO12 ? 0.6 : 0.1, head: [0, 0.45, 0]}} look={PIJAMA_O} />
      </group>
    </>
  );
};
const PIJAMA_O: ToyLook = {shirt: "#7fb8ff", pants: "#7fb8ff", socks: "#ffffff"};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0 - 3, Comp: S0b},
  {from: CANGURU0 - 3, Comp: S0c},
  {from: L(1), Comp: S1},
  {from: ATRAVESSA1 - 3, Comp: S1b},
  {from: POUSA1 - 12, Comp: S1c},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7a},
  {from: DORMIR7 - 6, Comp: S7},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ONIBUS} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["escola", "perdeu", "onibus", "escolar", "canguru", "aplicativo", "cinco", "estrelas", "eucalipto", "pula", "nuvens", "pousa", "telhado", "diretoria", "transporte", "saltitante", "diretora", "papai", "noel", "tercafeira", "presente", "laco", "prova", "surpresa", "matematica", "armadilha", "natalina", "fugir", "bolsa", "cansado", "cafe", "tres", "litros", "australia", "coala", "oculos", "dormir", "vinte", "duas", "horas", "intercambio", "sonolento", "dez", "melhor", "aluno", "continente", "boiando", "mar", "motorista", "boia", "patinho", "perdido", "parabens", "faltou", "diploma", "corrida", "dolar", "australiano", "seguir", "perfil", "amanha", "manha"]);
const Tag: React.FC<{from: number; to: number; text: string; x?: number; y?: number}> = ({from, to, text, x = 540, y = 420}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 8) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: 54, padding: "12px 28px", borderRadius: 40, boxShadow: "0 4px 0 rgba(0,0,0,0.25)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10}}>
      <span style={{width: 18, height: 18, borderRadius: 9, background: "#101018", display: "inline-block"}} />
      {text}
    </div>
  );
};
const Ono: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number; color?: string; rot?: number}> = ({from, to, text, x = 540, y = 460, size = 150, color = "#ffd21f", rot = -8}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`, fontFamily, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap", letterSpacing: 2}}>
      {text}
    </div>
  );
};
const BigNum: React.FC<{from: number; to: number; text: string; y?: number; size?: number}> = ({from, to, text, y = 420, size = 140}) => <Ono from={from} to={to} text={text} x={540} y={y} size={size} color="#ffffff" rot={-3} />;
const Bubble: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number}> = ({from, to, text, x = 540, y = 420, size = 50}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: size, padding: "18px 30px", borderRadius: 34, border: "6px solid #101018", whiteSpace: "nowrap", textAlign: "center"}}>
      {text}
      <div style={{position: "absolute", left: "45%", bottom: -34, width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "34px solid #101018"}} />
    </div>
  );
};
const FastFwd: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 760, top: 300, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <Ono from={from} to={to} text={text} x={540} y={540} size={110} color="#ffffff" rot={-3} />
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(260,370)">
          <circle r={85} fill="#ffffff" stroke="#101018" strokeWidth={12} />
          <line x1={0} y1={0} x2={55 * Math.sin(a)} y2={-55 * Math.cos(a)} stroke="#101018" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={36 * Math.sin(a / 12)} y2={-36 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={12} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};
const HANDLE = "@e.naoepossivel";
const FollowCard: React.FC<{from: number; to: number; tap: number}> = ({from, to, tap}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 8, to));
  const done = f >= tap + 2;
  const press = 1 - 0.1 * Math.sin(clamp((f - tap + 3) / 6) * Math.PI);
  return (
    <div style={{position: "absolute", left: 230, top: 1540, width: 620, height: 140, transform: `scale(${s})`, transformOrigin: "50% 50%"}}>
      <div style={{position: "absolute", inset: 0, background: "#ffffff", borderRadius: 34, boxShadow: "0 8px 0 rgba(0,0,0,0.22), 0 0 0 4px rgba(16,16,24,0.9)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16}}>
        <div style={{width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "4px solid #ffd21f", flexShrink: 0, background: "#eee"}}>
          <Img src={staticFile("perfil.png")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </div>
        <div style={{flex: 1, fontFamily, fontWeight: 900, fontSize: 34, color: "#101018", letterSpacing: -0.5, whiteSpace: "nowrap"}}>{HANDLE}</div>
        <div style={{flexShrink: 0, transform: `scale(${press})`, background: done ? "#e4e4ea" : "#ffd21f", color: done ? "#3a3a44" : "#101018", fontFamily, fontWeight: 900, fontSize: 28, padding: "12px 18px", borderRadius: 22, border: done ? "4px solid #c9c9d2" : "4px solid #101018", whiteSpace: "nowrap"}}>
          {done ? "Seguindo ✓" : "+ Seguir"}
        </div>
      </div>
    </div>
  );
};


/* ---------- celular com o app do canguru ---------- */
const AppCard: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const k = clamp((f - from - 6) / (to - from - 14));
  return (
    <div style={{position: "absolute", left: 540, top: 760, transform: `translate(-50%,-50%) scale(${s}) rotate(-4deg)`, width: 380, height: 640, borderRadius: 48, background: "#15151c", padding: 18, boxShadow: "0 12px 0 rgba(0,0,0,0.25)"}}>
      <div style={{width: "100%", height: "100%", borderRadius: 32, background: "#e8f1e0", position: "relative", overflow: "hidden", fontFamily}}>
        <svg width={344} height={604} style={{position: "absolute", left: 0, top: 0}}>
          {[90, 200, 300, 420, 520].map((y) => <rect key={y} x={0} y={y} width={344} height={22} fill="#ffffff" />)}
          {[70, 180, 270].map((x) => <rect key={x} x={x} y={0} width={22} height={604} fill="#ffffff" />)}
          <path d="M 81 560 L 81 420 L 191 420 L 191 210 L 281 210 L 281 100" fill="none" stroke="#2e6fd8" strokeWidth={8} strokeDasharray="14 10" />
        </svg>
        <div style={{position: "absolute", left: 81 + (281 - 81) * k - 30, top: 560 - (560 - 100) * k - 40, fontSize: 60}}>🦘</div>
        <div style={{position: "absolute", left: 60, top: 530, fontSize: 50}}>📍</div>
        <div style={{position: "absolute", left: 0, right: 0, bottom: 0, background: "#ffffff", padding: "14px 0", textAlign: "center", fontWeight: 900, fontSize: 30, color: "#101018"}}>
          CANGURU A CAMINHO<br />
          <span style={{color: "#f5b301", fontSize: 34}}>★★★★★</span>
        </div>
      </div>
    </div>
  );
};
/* ---------- mapa-múndi (o mapa que você mandou): o pulo do Brasil até a Austrália ---------- */
const WorldHop: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const k = easeInOut(clamp((f - from - 8) / (to - from - 22)));
  const M = {x: 20, y: 560, s: 1040 / 696};
  const A = [M.x + 226 * M.s, M.y + 252 * M.s];
  const B = [M.x + 581 * M.s, M.y + 277 * M.s];
  const x = lerp(A[0], B[0], k);
  const y = lerp(A[1], B[1], k) - Math.sin(k * Math.PI) * 420;
  const pin = (P: number[], txt: string, dx: number) => (
    <>
      <div style={{position: "absolute", left: P[0] - 26, top: P[1] - 26, width: 52, height: 52, borderRadius: 26, background: "#ffd21f", border: "6px solid #101018"}} />
      <div style={{position: "absolute", left: P[0] + dx, top: P[1] + 40, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 44, padding: "4px 16px", whiteSpace: "nowrap"}}>{txt}</div>
    </>
  );
  return (
    <AbsoluteFill style={{background: "#4fa8e8"}}>
      <Img src={staticFile("mapa-mundi.png")} style={{position: "absolute", left: M.x, top: M.y, width: 1040}} />
      <svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
        <path d={`M ${A[0]} ${A[1]} Q ${(A[0] + B[0]) / 2} ${A[1] - 840} ${B[0]} ${B[1]}`} fill="none" stroke="#e8262d" strokeWidth={9} strokeDasharray="24 16" />
      </svg>
      {pin(A, "BRASIL", 0)}
      {pin(B, "AUSTRÁLIA", -60)}
      <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${-20 + k * 40}deg)`, fontSize: 150}}>🦘</div>
    </AbsoluteFill>
  );
};

/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const TITLES: [number, string[]][] = [
  [L(2), ["TRANSPORTE", "SALTITANTE"]],
  [L(5), ["ARMADILHA", "NATALINA"]],
  [L(8), ["INTERCÂMBIO", "SONOLENTO"]],
];
const FOLLOW_FROM = L(12) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoOnibus: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <AppCard from={ENTAO0} to={CANGURU0 - 4} />
      <WorldHop from={PULA6B - 4} to={L(7) - 1} />
      {TITLES.map(([x, lines], i) => {
        const next = [L(3), L(6), L(9)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={PERDEU0 - 4} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Tag from={PERDEU0} to={ENTAO0 - 3} text="PERDEU O ÔNIBUS" />
      <Tag from={CINCO0} to={EUCALIPTO0 - 3} text="★★★★★" />
      <Tag from={EUCALIPTO0} to={L(1) - 2} text="CHEIRO DE EUCALIPTO 🌿" />
      <Ono from={PULA1 + 2} to={ATRAVESSA1 - 4} text="BOING!" size={160} />
      <Ono from={POUSA1 + 6} to={L(2) - 2} text="PLOFT!" size={150} color="#ffffff" />
      <Tag from={PAPAI3} to={TERCA3 - 3} text="PAPAI NOEL?" />
      <Tag from={TERCA3} to={L(4) - 2} text="TERÇA-FEIRA 📅" />
      <Tag from={PRESENTE4} to={ABRE4 - 3} text="PRESENTE 🎁" />
      <Tag from={PROVA4} to={L(5) - 2} text="PROVA SURPRESA" />
      <Tag from={MAS6} to={TOMA6 - 3} text="CANGURU CANSADO 😴" />
      <BigNum from={TOMA6 + 4} to={PULA6B - 6} text="☕ 3 LITROS" size={120} />
      <Tag from={COALA7 + 6} to={DORMIR7 - 6} text="PROFESSOR COALA" />
      <BigNum from={VINTE7} to={L(8) - 2} text="22 HORAS 💤" size={120} />
      <Zzz from={DORMIR7 + 4} to={L(9) - 2} x={560} y={900} />
      <BigNum from={DEZ9} to={MELHOR9 - 4} text="NOTA 10" size={150} />
      <Tag from={MELHOR9} to={L(10) - 2} text="MELHOR ALUNO DO CONTINENTE 🏆" />
      <Tag from={ONIBUS10} to={BOIANDO10 - 3} text="O ÔNIBUS!" />
      <Ono from={BOIANDO10} to={MOTORISTA10 - 4} text="SPLASH!" size={150} color="#7fd0ff" />
      <Ono from={PORQUE10 + 4} to={L(11) - 2} text="QUACK!" size={140} color="#ffd21f" />
      <Confetti from={PARABENS11} to={PARABENS11 + 70} />
      <Tag from={DIPLOMA11} to={CANGURU11 - 3} text="DIPLOMA DE COALA 🎓" />
      <BigNum from={DOLAR11} to={L(12) - 2} text="AU$ 8.000" size={130} />
      <Tag from={CANGURU12 + 4} to={CINCO12 - 3} text="🦘 SEU CANGURU CHEGOU!" />
      <BigNum from={CINCO12} to={TOTAL_ONIBUS - 1} text="05:00" size={150} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_ONIBUS - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozonibus.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx7/bus.mp3" from={0} dur={ENTAO0 - 3} v={FXV * 0.3} />
      <SND src="sfx10/plim.mp3" from={ENTAO0} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/boing.mp3" from={CANGURU0 + 15} dur={30} v={FXV * 0.4} />
      <SND src="sfx7/boing.mp3" from={PULA1 + 2} dur={30} v={FXV * 0.45} />
      <SND src="sfx2/wind.mp3" from={ATRAVESSA1} dur={POUSA1 - ATRAVESSA1} v={FXV * 0.3} />
      <SND src="sfx2/land.mp3" from={POUSA1 + 6} dur={30} v={FXV * 0.4} />
      <SND src="sfx12/bells.mp3" from={PAPAI3} dur={50} v={FXV * 0.3} />
      <SND src="sfx14/papel.mp3" from={ABRE4} dur={30} v={FXV * 0.4} />
      <SND src="sfx11/drama.mp3" from={PROVA4} dur={45} v={FXV * 0.35} />
      <SND src="sfx7/boing.mp3" from={PULA6} dur={30} v={FXV * 0.35} />
      <SND src="sfx16/glup.mp3" from={TOMA6 + 4} dur={40} v={FXV * 0.4} />
      <SND src="sfx7/boing.mp3" from={PULA6B} dur={30} v={FXV * 0.5} />
      <SND src="sfx11/whistle.mp3" from={PULA6B + 4} dur={40} v={FXV * 0.25} />
      <SND src="sfx7/snore.mp3" from={DORMIR7} dur={L(9) - DORMIR7} v={FXV * 0.3} />
      <SND src="sfx2/cheer.mp3" from={MELHOR9} dur={L(10) - MELHOR9} v={FXV * 0.2} />
      <SND src="sfx7/waves.mp3" from={L(10)} dur={L(11) - L(10)} v={FXV * 0.25} />
      <SND src="sfx9/splat.mp3" from={BOIANDO10} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS11} dur={50} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={PARABENS11} dur={50} v={FXV * 0.3} />
      <SND src="sfx7/cash.mp3" from={DOLAR11} dur={30} v={FXV * 0.4} />
      <SND src="sfx10/plim.mp3" from={CANGURU12 + 4} dur={30} v={FXV * 0.4} />
      <SND src="sfx9/alarm.mp3" from={CINCO12} dur={50} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
