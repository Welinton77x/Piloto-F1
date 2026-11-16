import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Tree, House, V3} from "./Sets5";
import {Dog, sm, StrawHat} from "./Sets9";
import {FireTruck, WaterJet, Bill} from "./Sets13";
import {BigJet, SkyClouds} from "./Sets19";
import {Bg} from "./Sets20";
import {FoamFlood} from "./Sets22";
import {Bucket, ShampooBottle, HairyTowel, TinyBrush, Passport, Bow, HoseNozzle, Stink, Bathroom, TrioEletrico, Terminal, Combine, SoyField, FurRows, CropDuster, PetShop} from "./Sets25";
import {Captions, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBanho.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BANHO = F(words[words.length - 1].e + 0.9);

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
const ENTAO0 = at(0, "entao");
const SE0 = at(0, "se");
const DISSE0 = at(0, "disse");
const EU = [0, at(1, "eu"), at(2, "eu"), at(3, "eu"), at(4, "eu"), at(5, "eu")];
const MAS = [0, at(1, "mas"), at(2, "mas"), at(3, "mas"), at(4, "mas"), at(5, "mas")];
const QUATRO1 = at(1, "quatro");
const QUINTAL1 = at(1, "quintal");
const TRES1 = at(1, "tres");
const SEIS2 = at(2, "seis");
const CACHORRO2 = at(2, "cachorro");
const QUARTA2 = at(2, "quartafeira");
const DEZ3 = at(3, "dez");
const VOANDO3 = at(3, "voando");
const GUARULHOS3 = at(3, "guarulhos");
const PASSAPORTE3 = at(3, "passaporte");
const CINQUENTA4 = at(4, "cinquenta");
const PLANTACAO4 = at(4, "plantacao");
const FAZENDEIRO4 = at(4, "fazendeiro");
const COMPRAR4 = at(4, "comprar");
const DUZENTOS5 = at(5, "duzentos");
const TODOS5 = at(5, "todos");
const NINGUEM5 = at(5, "ninguem");
const PET6 = at(6, "pet");
const MAE6 = at(6, "mae");
const VOCE6 = at(6, "voce");
const MANGUEIRA7 = at(7, "mangueira");

const MAE: ToyLook = {apron: true, shirt: "#2e86de", hairStyle: "ponytail", hair: "#2a1a10", lips: "#c0392b"};
const FARMER: ToyLook = {plaid: "#1f2a44", shirt: "#c0392b", pants: "#3a6aa8", hairStyle: "buzz", hair: "#5a3a20", skin: "#d9a173", belly: 0.5};
const ITEM_R: V3 = [Math.PI / 2, 0, 0];

/* =================== o quintal de casa =================== */
const Yard2: React.FC<{t: number; town?: boolean}> = ({t, town = true}) => (
  <>
    <DayOut />
    {town && (
      <group position={[0, 0, -9]}>
        <Town t={t} galo={false} variant="nova" flat clouds />
      </group>
    )}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
      <planeGeometry args={[30, 12]} />
    </mesh>
    <House p={[-2.6, 0, -3.4]} w={3.4} h={2.7} d={3} wall="#ffd166" roof="#e8414f" />
    {Array.from({length: 12}, (_, i) => (
      <mesh key={i} position={[-0.6 + i * 0.5, 0.45, -3.0]} material={sm("#f2efe6", 0.7)} castShadow>
        <boxGeometry args={[0.12, 0.9, 0.06]} />
      </mesh>
    ))}
    <mesh position={[2.15, 0.65, -3.02]} material={sm("#f2efe6", 0.7)}>
      <boxGeometry args={[5.6, 0.07, 0.05]} />
    </mesh>
    <Tree p={[2.8, 0, -1.8]} s={1.4} />
  </>
);
const DOGP: V3 = [0.2, 0, 0.3];
const YardCam: React.FC<{f: number; a: number; wide?: boolean}> = ({f, a, wide}) => <Cam pos={wide ? [0.4, 2.4, 6.6] : [0.1, 1.6, 4.6]} look={wide ? [0.4, 1.2, -0.5] : [0.1, 0.95, 0]} fov={54} f={f} a={a} />;

/* abertura: o menino, o balde, o cachorro e a mãe */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const mom = easeOut(ramp(f, SE0 - 8, SE0 + 10));
  return (
    <>
      <YardCam f={f} a={a} />
      <Yard2 t={t} />
      <HandToy pose={{...idle(f), pos: [-0.75, 0, 0.3], rotY: 0.3, rShoulder: [-0.25, 0.1, -0.15], rElbow: -0.3, smile: 1}} look={BOY} item={<Bucket p={[0, -0.05, 0.05]} r={[Math.PI, 0, 0]} s={1.3} />} />
      <Dog d={{pos: DOGP, rotY: -0.5, t, blink: blinkCurve(f + 7), tail: 1, tongue: 0.6, mouth: 0.2, legs: "down"}} />
      {mom > 0 && <HandToy pose={{...idle(f + 5), pos: [lerp(3.0, 1.0, mom), 0, -0.3], rotY: -0.7, rShoulder: [-1.3, 0.4, 0.1], rElbow: -0.4, walk: t * 8, walkAmt: mom < 1 ? 1 : 0, mouthOpen: f >= DISSE0 && f < DISSE0 + 50 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 10)) : 0, brow: -0.5}} look={MAE} item={<ShampooBottle p={[0, 0.02, 0.06]} r={ITEM_R} s={1.4} />} />}
    </>
  );
};

/* ① caminhão-pipa */
const Item1: React.FC<ShotProps> = ({f, a, t}) => {
  const jet = f >= MAS[1];
  const fly = clamp((f - MAS[1] - 20) / 45);
  const dogP: V3 = fly > 0 ? [DOGP[0] - fly * 3, 0.3 + Math.sin(fly * Math.PI * 0.6) * 6, DOGP[2] - fly * 6] : DOGP;
  return (
    <>
      <Cam pos={[0.6, 2.2 + fly * 3, 7.0]} look={[0.2, 1.2 + fly * 3.5, -0.5 - fly * 2]} fov={56} f={f} a={a} />
      <Yard2 t={t} />
      <FireTruck p={[3.6, 0, 0.6]} rotY={-Math.PI / 2} t={t} s={0.9} />
      {jet && <WaterJet a={[2.3, 1.8, 0.6]} b={fly > 0.2 ? [dogP[0], dogP[1], dogP[2]] : [DOGP[0], 0.4, DOGP[2]]} k={1} t={t} size={2.5} />}
      <Dog d={{pos: dogP, rotY: -0.5 + fly * 4, t, blink: fly > 0 ? 1 : blinkCurve(f), tail: 1, mouth: jet ? 0.6 : 0.2, walk: fly > 0 ? 1 : 0, run: 3, legs: fly > 0 ? undefined : "down"}} />
      <Toy pose={{...idle(f), pos: [-0.9, 0, 0.6], rotY: 0.6, eyeWide: jet ? 1 : 0.3, mouthOpen: jet ? 0.6 : 0, ...(jet ? ARMS_UP : HOLD)}} look={BOY} />
    </>
  );
};
const Item1b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.5, 3.2]} look={[0.2, 1.0, -1]} fov={52} f={f} a={a} />
    <Bg c="#e9f6fb" />
    <hemisphereLight args={["#ffffff", "#8090a0", 1.0]} />
    <pointLight position={[0, 3, 1.5]} intensity={9} distance={10} decay={1.4} castShadow />
    <Bathroom t={t} />
    <Dog d={{pos: [0.3, 0, -1.3], rotY: 0, t, blink: 0, tail: 0, mouth: 0.3, legs: "down", head: [0.2, 0, 0.2 * Math.sin(t * 30)]}} />
    <Toy pose={{...idle(f), pos: [-0.8, 0, -0.6], rotY: 0.5, eyeWide: 0.6, mouthOpen: 0.3, rShoulder: [-1.0 + 0.1 * Math.sin(t * 40), 0.8, 0], rElbow: -1.8, lShoulder: [-1.0 + 0.1 * Math.cos(t * 40), -0.8, 0], lElbow: -1.8, brow: 1}} look={BOY} />
  </>
);
const Item1c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 30);
  return (
    <>
      <Cam pos={[-2.8, 2.4, -11]} look={[-4, 0.8, -16]} fov={56} f={f} a={a} />
      <DayOut x={-4} z={-14} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <group position={[-4, 0, -16]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sm("#7fcf5a", 0.95)}>
          <planeGeometry args={[5, 4]} />
        </mesh>
        <Dog d={{pos: [0, Math.max(0, 6 * (1 - k)), 0], rotY: 0.4, t, blink: k >= 1 ? 0 : 1, tail: 1, mouth: 0.4, legs: "down"}} s={1.3} />
        <Toy pose={{...idle(f), pos: [1.2, 0, -0.4], rotY: -0.7, eyeWide: 1, mouthOpen: 0.6, brow: 1}} look={{shirt: "#2ecc71", pants: "#101018", hairStyle: "curly", hair: "#2a1a10"}} />
      </group>
    </>
  );
};

/* ② trio elétrico de espuma */
const Item2: React.FC<ShotProps> = ({f, a, t}) => {
  const foam = f >= MAS[2] ? easeOut(ramp(f, MAS[2], MAS[2] + 70)) : 0;
  return (
    <>
      <Cam pos={[0.6, 2.6 + foam * 1.5, 7.6]} look={[0.6, 1.4, -0.5]} fov={58} f={f} a={a} />
      <Yard2 t={t} />
      <TrioEletrico p={[4.0, 0, -0.5]} rotY={0} s={0.8} t={t} />
      <HandToy pose={{...idle(f), pos: [-0.75, 0, 0.3], rotY: 0.6, rShoulder: [-0.25, 0.1, -0.15], rElbow: -0.3, eyeWide: 1, mouthOpen: 0.4}} look={BOY} item={<Bucket p={[0, -0.05, 0.05]} r={[Math.PI, 0, 0]} s={1.3} />} />
      <Dog d={{pos: DOGP, rotY: 0.6, t, blink: blinkCurve(f + 7), tail: 1, tongue: 0.4, legs: "down"}} />
      {f >= MAS[2] && (
        <>
          {Array.from({length: 10}, (_, i) => {
            const q = (t * 0.9 + i / 10) % 1;
            return (
              <mesh key={i} position={[3.0 - q * 4, 3.2 + Math.sin(q * Math.PI) * 1.2, 1.3 - q * 1.5 + (i % 3) * 0.3]} scale={0.25 + q * 0.6} material={sm("#ffffff", 0.9)}>
                <icosahedronGeometry args={[1, 1]} />
              </mesh>
            );
          })}
          <FoamFlood level={foam * 2.4} w={14} d={9} t={t} c={[0, 0, -0.5]} />
        </>
      )}
    </>
  );
};
const Item2b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.45, 2.5]} look={[0.15, 1.25, 0]} fov={46} f={f} a={a} />
    <Yard2 t={t} town={false} />
    <HandToy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.5, 0.3, 0], rElbow: -1.0, eyeWide: 0.4, brow: 1, mouthOpen: 0.2}} look={BOY} item={<ShampooBottle p={[0, 0.02, 0.06]} r={ITEM_R} s={2.2 + 0.1 * Math.sin(t * 20)} empty />} />
  </>
);
const Item2d: React.FC<ShotProps> = ({f, a, t}) => {
  const up = easeOut(ramp(f, a + 6, a + 26));
  return (
    <>
      <Cam pos={[0, 1.6, 4.4]} look={[0, 1.2, 0]} fov={52} f={f} a={a} />
      <DayOut />
      <group position={[0, 0, -9]}>
        <Town t={t} galo={false} variant="nova" flat clouds />
      </group>
      <FoamFlood level={0.9} w={12} d={8} t={t} c={[0, 0, -1]} />
      <Dog d={{pos: [0, -0.6 + up * 0.75, 0.6], rotY: 0, t, blink: blinkCurve(f), tail: 1, tongue: 0.7, mouth: 0.3, legs: "down"}} s={1.3} />
      {up > 0.5 && <Bow p={[0, 1.6, 0.85]} s={1.6} color="#ffd21f" />}
    </>
  );
};

/* ③ turbina de avião */
const Item3: React.FC<ShotProps> = ({f, a, t}) => {
  const blow = f >= MAS[3];
  const k = clamp((f - MAS[3] - 10) / 40);
  return (
    <>
      <Cam pos={[1.8, 2.4, 8.4]} look={[1.0, 1.4, -0.5]} fov={58} f={f} a={a} />
      <Yard2 t={t} />
      <BigJet p={[5.2, 1.6, -0.6]} s={0.8} />
      {blow &&
        Array.from({length: 8}, (_, i) => {
          const q = (t * 2 + i / 8) % 1;
          return (
            <mesh key={i} position={[4.0 - q * 6, 0.9 + (i % 3) * 0.2, 0.5 + (i % 2) * 0.4]}>
              <boxGeometry args={[0.8, 0.03, 0.03]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          );
        })}
      <Dog d={{pos: [DOGP[0] - k * 8, k * 4, DOGP[2]], rotY: -Math.PI / 2 + k * 3, t, blink: blow ? 1 : blinkCurve(f), tail: 1, mouth: blow ? 0.6 : 0.2, walk: k > 0 ? 1 : 0, run: 3, legs: k > 0 ? undefined : "down"}} />
      <Toy pose={{...idle(f), pos: [-0.9, 0, 0.8], rotY: 0.6, eyeWide: blow ? 1 : 0.3, mouthOpen: blow ? 0.5 : 0, rShoulder: blow ? [-1.2, 0.5, 0] : [-0.2, 0, -0.1], rElbow: -1.5}} look={BOY} />
    </>
  );
};
const Item3b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.4, 1.7]} look={[0, 1.2, 0]} fov={46} f={f} a={a} />
    <Yard2 t={t} town={false} />
    <Toy pose={{...idle(f), pos: [0, 0, -0.2], rotY: 0, rShoulder: [-1.3, 0.5, 0], rElbow: -0.6, lShoulder: [-1.3, -0.5, 0], lElbow: -0.6, brow: 1, mouthOpen: 0.3}} look={BOY} />
    <HairyTowel p={[0, 1.15, 0.25]} s={1.1} />
  </>
);
const Item3c: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  const x = s2 * 6;
  return (
    <>
      <Cam pos={[x, 1.0, 6]} look={[x, 0.8, 0]} fov={54} f={f} a={a} punch={4} />
      <SkyClouds x={x} />
      <hemisphereLight args={["#ffffff", "#9fc8ff", 1.2]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <Dog d={{pos: [x, 0.3 + 0.2 * Math.sin(t * 4), 0], rotY: Math.PI / 2, t, blink: 0, tail: 1, tongue: 0.8, mouth: 0.5, walk: 1, run: 4}} s={1.3} />
      <SpeedLines p={[x, 0.2, 0]} />
    </>
  );
};
const Item3d: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.4, 4.2]} look={[0, 1.1, -1]} fov={54} f={f} a={a} />
    <Sky />
    <hemisphereLight args={["#ffffff", "#8090a0", 1.1]} />
    <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={10} />
    <Terminal />
    <Dog d={{pos: [0, 0, 0.6], rotY: 0, t, blink: blinkCurve(f), tail: 1, legs: "down", mouthItem: f >= PASSAPORTE3 - 4 ? <Passport p={[0, -0.02, 0.06]} r={[0.2, 0, 0]} s={1.3} /> : undefined}} s={1.2} />
  </>
);

/* ④ colheitadeira de soja */
const Item4: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeInOut(ramp(f, a + 10, EU[4] - 4));
  return (
    <>
      <Cam pos={[0.8, 2.6, 8.2]} look={[0.6, 1.4, -0.5]} fov={58} f={f} a={a} />
      <Yard2 t={t} />
      <Combine p={[lerp(6, 3.0, k), 0, 0.2]} rotY={-Math.PI / 2} s={0.8} t={t} />
      <Dog d={{pos: DOGP, rotY: 0.8, t, blink: blinkCurve(f), tail: 0.5, legs: "down", mouth: 0.3}} />
      <Toy pose={{...idle(f), pos: [-0.9, 0, 0.8], rotY: 0.6, eyeWide: 0.8, mouthOpen: 0.3}} look={BOY} />
    </>
  );
};
const Item4b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 1.3, 3.3]} look={[0.0, 0.8, 0]} fov={50} f={f} a={a} />
    <Yard2 t={t} town={false} />
    <HandToy pose={{...idle(f), pos: [-0.45, 0, 0.1], rotY: 0.7, rShoulder: [-1.0 + 0.3 * Math.sin(t * 12), 0.6, 0], rElbow: -0.5, brow: 1}} look={BOY} item={<TinyBrush p={[0, 0.02, 0.06]} r={ITEM_R} s={1.0} />} />
    <Dog d={{pos: [0.45, 0, 0.1], rotY: -0.6, t, blink: blinkCurve(f), tail: 0.6, legs: "down"}} />
  </>
);
const Item4c: React.FC<ShotProps> = ({f, a, t}) => {
  const farmer = f >= FAZENDEIRO4 - 4;
  return (
    <>
      <Cam pos={farmer ? [0.5, 1.5, 4.0] : [0.3, 2.0, 5.0]} look={farmer ? [0.4, 0.9, 0] : [0, 0.8, 0]} fov={54} f={f} a={farmer ? FAZENDEIRO4 - 4 : a} />
      <Sky />
      <hemisphereLight args={["#ffffff", "#8a6a4a", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={10} />
      <SoyField />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.5]} material={sm("#8a6a4a", 0.95)} receiveShadow>
        <planeGeometry args={[8, 4]} />
      </mesh>
      {!farmer && <Combine p={[2.6, 0, -4]} rotY={-0.4} s={0.8} t={t} />}
      <Dog d={{pos: [0, 0, 0.4], rotY: 0.3, t, blink: blinkCurve(f), tail: 1, legs: "down", tongue: 0.5}} s={1.2} />
      <FurRows p={[0, 0, 0.4]} rotY={0.3} s={1.2} />
      {farmer && <HandToy pose={{...idle(f), pos: [0.95, 0, 0.1], rotY: -0.6, rShoulder: [-1.4, 0.4, 0], rElbow: -0.3, smile: 1}} look={FARMER} headExtra={<StrawHat />} item={<Bill p={[0, 0.02, 0.06]} s={1.4} />} />}
    </>
  );
};

/* ⑤ avião agrícola de perfume */
const Item5: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0.4, 2.6, 8.4]} look={[0.4, 2.8, -1]} fov={58} f={f} a={a} />
      <Yard2 t={t} />
      <CropDuster p={[4 - s2 * 3.2, 4.6, -1.5]} rotY={Math.PI} s={0.9} t={t} />
      <Dog d={{pos: DOGP, rotY: 0.6, t, blink: blinkCurve(f), tail: 1, legs: "down", head: [-0.4, 0, 0]}} />
      <Toy pose={{...idle(f), pos: [-0.9, 0, 0.8], rotY: 0.4, eyeWide: 0.6, head: [-0.4, 0, 0]}} look={BOY} />
    </>
  );
};
const Item5b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.3, 2.8]} look={[0.1, 0.8, 0]} fov={50} f={f} a={a} />
    <Yard2 t={t} town={false} />
    <Toy pose={{...idle(f), pos: [-0.55, 0, 0.1], rotY: 0.6, rShoulder: [-2.1, 0.7, 0], rElbow: -1.9, eyeWide: 0.2, brow: 1, mouthOpen: 0.2}} look={BOY} />
    <Dog d={{pos: [0.45, 0, 0], rotY: -0.5, t, blink: blinkCurve(f), tail: 1, legs: "down", tongue: 0.6}} />
    <Stink p={[0.45, 0.9, 0]} t={t} />
  </>
);
const Item5c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a, a + 60));
  return (
    <>
      <Cam pos={[0, 12, 18]} look={[0, 1, -4]} fov={58} f={f} a={a} />
      <DayOut />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <CropDuster p={[6 - k * 12, 7, -2]} rotY={Math.PI} s={1.3} t={t} />
      {Array.from({length: 22}, (_, i) => {
        const r = rng(i + 3);
        return (
          <mesh key={i} position={[(r() - 0.5) * 30 * k, 2 + r() * 3, -4 + (r() - 0.5) * 14]} scale={(1.5 + r() * 2) * k}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#ff9fd0" transparent opacity={0.45} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
};
const Item5d: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.0, 5.4]} look={[0, 0.8, 0]} fov={56} f={f} a={a} />
    <DayOut />
    <Town t={t} galo={false} variant="nova" flat clouds />
    {Array.from({length: 9}, (_, i) => {
      const ang = Math.PI * (0.95 + (i / 8) * 1.1);
      return <Dog key={i} d={{pos: [Math.cos(ang) * 1.7, 0, 1.0 + Math.sin(ang) * 1.3], rotY: -ang - Math.PI / 2, t: t + i, blink: blinkCurve(f + i * 9), tail: 1, legs: "down", tongue: 0.5}} s={0.9} />;
    })}
    <Toy pose={{...idle(f), pos: [0, 0, 1.0], rotY: 0.3 * Math.sin(t * 3), eyeWide: 1, mouthOpen: 0.4, brow: 1, rShoulder: [-0.5, 0.5, -0.6], rElbow: -0.5, lShoulder: [-0.5, -0.5, 0.6], lElbow: -0.5}} look={BOY} />
  </>
);

/* final: pet shop e o cachorro com a mangueira */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const out = easeOut(ramp(f, a + 6, a + 30));
  return (
    <>
      <Cam pos={[0.45, 1.6, 5.2]} look={[0.45, 1.2, -0.8]} fov={54} f={f} a={a} />
      <DayOut />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#c9c2b5", 0.9)} receiveShadow>
        <planeGeometry args={[30, 20]} />
      </mesh>
      <PetShop />
      <Dog d={{pos: [lerp(1.4, 0.7, out), 0, lerp(-1.6, 0.4, out)], rotY: -0.3, t, blink: blinkCurve(f), tail: 1, tongue: 0.6, legs: "down", walk: out < 1 ? 1 : 0, run: 1}} />
      <Bow p={[lerp(1.4, 0.7, out) - 0.04, 1.13, lerp(-1.6, 0.4, out) + 0.12]} s={1.4} />
      <Toy pose={{...idle(f), pos: [-0.5, 0, 0.6], rotY: 0.5, smile: 1, ...(f >= VOCE6 ? {rShoulder: [-2.6, 0.2, -0.3], rElbow: -0.3} : {})}} look={BOY} />
      {f >= MAE6 - 4 && <Toy pose={{...idle(f + 5), pos: [1.55, 0, 0.1], rotY: -0.6, smile: 1, eyeWide: 0.5}} look={MAE} />}
    </>
  );
};
const S7: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <YardCam f={f} a={a} />
    <Yard2 t={t} />
    <Dog d={{pos: [0.6, 0, 0.0], rotY: -1.1, t, blink: blinkCurve(f), tail: 1, legs: "down", mouthItem: <HoseNozzle p={[0, -0.02, 0.1]} s={1.2} />}} />
    {f >= MANGUEIRA7 - 6 && <WaterJet a={[0.3, 0.75, 0.15]} b={[-0.6, 1.4, 0.4]} k={1} t={t} />}
    <Toy pose={{...idle(f), pos: [-0.7, 0, 0.4], rotY: 0.7, eyeWide: 1, mouthOpen: 0.6, brow: 1, ...ARMS_UP}} look={BOY} />
  </>
);

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: Item1},
  {from: EU[1] - 3, Comp: Item1b},
  {from: MAS[1] - 3, Comp: Item1},
  {from: QUINTAL1 - 3, Comp: Item1c},
  {from: L(2), Comp: Item2},
  {from: EU[2] - 3, Comp: Item2b},
  {from: MAS[2] - 3, Comp: Item2},
  {from: QUARTA2 - 6, Comp: Item2d},
  {from: L(3), Comp: Item3},
  {from: EU[3] - 3, Comp: Item3b},
  {from: MAS[3] - 3, Comp: Item3},
  {from: VOANDO3 - 4, Comp: Item3c},
  {from: GUARULHOS3 - 3, Comp: Item3d},
  {from: L(4), Comp: Item4},
  {from: EU[4] - 3, Comp: Item4b},
  {from: MAS[4] - 3, Comp: Item4c},
  {from: L(5), Comp: Item5},
  {from: EU[5] - 3, Comp: Item5b},
  {from: MAS[5] - 3, Comp: Item5c},
  {from: TODOS5 - 3, Comp: Item5d},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BANHO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["banho", "cachorro", "sozinho", "primeira", "nao", "faca", "isso", "shampoo", "banheiro", "molhe", "caminhaopipa", "bombeiros", "chuveiro", "esquentar", "quatro", "mil", "litros", "minuto", "vizinho", "tres", "ruas", "espuma", "trio", "eletrico", "acaba", "rapido", "seis", "horas", "quartafeira", "cinzas", "seque", "turbina", "aviao", "toalha", "pelo", "dez", "voando", "guarulhos", "passaporte", "penteie", "colheitadeira", "soja", "escova", "pequena", "cinquenta", "hectares", "plantacao", "fazendeiro", "comprar", "perfume", "agricola", "cheiro", "molhado", "duzentos", "quilometros", "estado", "ninguem", "seguro", "pet", "shop", "esquina", "mae", "voce", "seguir", "perfil", "mangueira"]);
/* ---------- cartões no estilo "guia" ---------- */
const NumBadge: React.FC<{from: number; to: number; n: number}> = ({from, to, n}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10);
  return (
    <div style={{position: "absolute", left: 70, top: 120, width: 96, height: 96, transform: `scale(${s})`, borderRadius: 48, background: "#ffd21f", border: "7px solid #101018", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 60, color: "#101018"}}>
      {n}
    </div>
  );
};
const TopTitle: React.FC<{from: number; to: number; text: string; size?: number}> = ({from, to, text, size = 92}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: 330, width: 960, transform: `translate(-50%,-50%) scale(${s})`, textAlign: "center", fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.0, color: "#ffd21f", WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", textTransform: "uppercase"}}>
      {text}
    </div>
  );
};
const Card: React.FC<{from: number; to: number; y?: number; children: React.ReactNode}> = ({from, to, y = 820, children}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", borderRadius: 36, padding: "30px 46px", boxShadow: "0 10px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(16,16,24,0.12)", fontFamily, color: "#101018", textAlign: "center", minWidth: 520}}>
      {children}
    </div>
  );
};
const InfoCard: React.FC<{from: number; to: number; big: string; unit: string; small: string}> = ({from, to, big, unit, small}) => (
  <Card from={from} to={to}>
    <div style={{fontWeight: 900, fontSize: 120, lineHeight: 1}}>{big}</div>
    <div style={{fontWeight: 900, fontSize: 40, color: "#2e6fd8", marginTop: 8}}>{unit}</div>
    <div style={{fontWeight: 600, fontSize: 32, color: "#7a7f8a", marginTop: 10}}>{small}</div>
  </Card>
);
const TimerCard: React.FC<{from: number; to: number; big: string; small: string}> = ({from, to, big, small}) => (
  <Card from={from} to={to}>
    <div style={{display: "flex", alignItems: "center", gap: 26}}>
      <div style={{fontSize: 96}}>⏱️</div>
      <div style={{textAlign: "left"}}>
        <div style={{fontWeight: 900, fontSize: 90, lineHeight: 1}}>{big}</div>
        <div style={{fontWeight: 600, fontSize: 34, color: "#7a7f8a"}}>{small}</div>
      </div>
    </div>
  </Card>
);
const CheckCard: React.FC<{from: number; to: number; title: string; items: string[]; step?: number}> = ({from, to, title, items, step = 14}) => {
  const f = useCurrentFrame();
  return (
    <Card from={from} to={to}>
      <div style={{fontWeight: 900, fontSize: 46, color: "#2e6fd8", textAlign: "left", marginBottom: 10}}>{title}</div>
      {items.map((it, i) =>
        f >= from + 8 + i * step ? (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 18, fontWeight: 900, fontSize: 52, textAlign: "left", marginTop: 6}}>
            <span style={{display: "inline-flex", width: 52, height: 52, borderRadius: 26, background: "#2ecc71", color: "#ffffff", alignItems: "center", justifyContent: "center", fontSize: 36}}>✓</span>
            {it}
          </div>
        ) : null,
      )}
    </Card>
  );
};
const MapCard: React.FC<{from: number; to: number; a: string; b: string}> = ({from, to, a, b}) => {
  const f = useCurrentFrame();
  const k = easeInOut(clamp((f - from - 6) / 30));
  return (
    <Card from={from} to={to} y={760}>
      <svg width={680} height={300}>
        <ellipse cx={150} cy={170} rx={120} ry={90} fill="#7fdc8a" />
        <ellipse cx={530} cy={170} rx={120} ry={90} fill="#7fdc8a" />
        <path d="M 200 150 Q 340 30 480 150" fill="none" stroke="#e8262d" strokeWidth={8} strokeDasharray="18 14" />
        <text x={150} y={185} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={40} fill="#101018">{a}</text>
        <text x={530} y={185} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={34} fill="#101018">{b}</text>
        <text x={200 + 280 * k} y={150 - Math.sin(k * Math.PI) * 100} textAnchor="middle" fontSize={64}>🐶</text>
      </svg>
    </Card>
  );
};
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


/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const FOLLOW_FROM = L(7) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const ITEMS = ["CAMINHÃO-PIPA", "TRIO ELÉTRICO DE ESPUMA", "TURBINA DE AVIÃO", "COLHEITADEIRA DE SOJA", "AVIÃO AGRÍCOLA"];
const SMALL = ["CHUVEIRO FRIO 🥶", "SHAMPOO ACABANDO 🧴", "TOALHA CHEIA DE PELO", "ESCOVA PEQUENININHA", "CHEIRO DE CACHORRO MOLHADO 🤢"];
export const VideoBanho: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <TopTitle from={4} to={ENTAO0 - 2} text="PRIMEIRA VEZ DANDO BANHO NO CACHORRO?" size={84} />
      <TopTitle from={ENTAO0} to={SE0 - 2} text="NÃO FAÇA ISSO" size={110} />
      <Bubble from={DISSE0} to={L(1) - 2} text="NÃO MOLHA O BANHEIRO, HEIN?" size={44} />
      {[1, 2, 3, 4, 5].map((n) => (
        <React.Fragment key={n}>
          <NumBadge from={L(n)} to={L(n + 1) - 2} n={n} />
          <TopTitle from={L(n) + 4} to={EU[n] - 3} text={ITEMS[n - 1]} size={n === 2 ? 76 : 92} />
          <Tag from={EU[n]} to={MAS[n] - 3} text={SMALL[n - 1]} y={330} />
        </React.Fragment>
      ))}
      <InfoCard from={QUATRO1} to={QUINTAL1 - 4} big="4.000" unit="LITROS POR MINUTO" small="o seu chuveiro: 9" />
      <Tag from={TRES1} to={L(2) - 2} text="3 RUAS PRA FRENTE" y={330} />
      <TimerCard from={SEIS2} to={CACHORRO2 - 3} big="6 HORAS" small="soltando espuma sem parar" />
      <CheckCard from={CACHORRO2} to={L(3) - 2} title="A ESPUMA COBRIU:" items={["o banheiro", "a rua", "o carnaval"]} />
      <InfoCard from={DEZ3} to={VOANDO3 - 6} big="10.000" unit="VOLTAS POR MINUTO" small="a sua toalha: 0" />
      <MapCard from={GUARULHOS3} to={L(4) - 2} a="AQUI" b="GUARULHOS" />
      <InfoCard from={CINQUENTA4} to={FAZENDEIRO4 - 5} big="50" unit="HECTARES POR DIA" small="a sua escova: 0,0001" />
      <Bubble from={COMPRAR4} to={L(5) - 2} text="VENDE?" x={760} y={760} size={64} />
      <InfoCard from={DUZENTOS5} to={TODOS5 - 4} big="200 KM" unit="DE PERFUME" small="o seu borrifo: 10 cm" />
      <CheckCard from={TODOS5} to={NINGUEM5 - 3} title="FICARAM CHEIROSOS:" items={["o cachorro", "o carteiro", "3 cidades"]} step={10} />
      <Ono from={NINGUEM5} to={L(6) - 2} text="QUAL É O MEU?" y={330} size={100} color="#ffffff" />
      <Tag from={PET6} to={MAE6 - 3} text="PET SHOP 🐶" y={330} />
      <Ono from={VOCE6} to={L(7) - 2} text="😉" y={330} size={160} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_BANHO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozbanho.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {[1, 2, 3, 4, 5].map((n) => (
        <SND key={"n" + n} src="sfx7/boing.mp3" from={L(n)} dur={30} v={FXV * 0.4} />
      ))}
      <SND src="sfx11/bark.mp3" from={20} dur={30} v={FXV * 0.35} />
      <SND src="sfx14/sirene.mp3" from={L(1) + 4} dur={40} v={FXV * 0.25} />
      <SND src="sfx11/water.mp3" from={MAS[1]} dur={QUINTAL1 - MAS[1]} v={FXV * 0.35} />
      <SND src="sfx7/pof.mp3" from={QUINTAL1 + 26} dur={20} v={FXV * 0.4} />
      <SND src="sfx13/pagode.mp3" from={L(2)} dur={EU[2] - L(2)} v={FXV * 0.2} />
      <SND src="sfx10/bubble.mp3" from={MAS[2]} dur={L(3) - MAS[2]} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={MAS[3]} dur={GUARULHOS3 - MAS[3]} v={FXV * 0.3} />
      <SND src="sfx9/stamp.mp3" from={PASSAPORTE3} dur={20} v={FXV * 0.45} />
      <SND src="sfx7/truck.mp3" from={L(4)} dur={EU[4] - L(4)} v={FXV * 0.25} />
      <SND src="sfx7/cash.mp3" from={COMPRAR4} dur={30} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={L(5)} dur={EU[5] - L(5)} v={FXV * 0.25} />
      <SND src="sfx14/spray.mp3" from={MAS[5]} dur={40} v={FXV * 0.35} />
      <SND src="sfx11/bark.mp3" from={TODOS5 + 6} dur={30} v={FXV * 0.3} />
      <SND src="sfx3/bell.mp3" from={PET6} dur={30} v={FXV * 0.3} />
      <SND src="sfx11/water.mp3" from={MANGUEIRA7 - 6} dur={TOTAL_BANHO - MANGUEIRA7} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
