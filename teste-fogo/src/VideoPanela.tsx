import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, House, Bicycle, V3} from "./Sets5";
import {Pigeon} from "./Sets6";
import {sm, rbox} from "./Sets9";
import {Penguin} from "./Sets11";
import {WaterJet} from "./Sets13";
import {Pastel} from "./Sets15";
import {HeadGlasses} from "./Sets17";
import {CafeKitchen} from "./Sets19";
import {Bg} from "./Sets20";
import {ObjFace} from "./Sets22";
import {Sign, Pot, FaxMachine, Chamber, Lectern, Paulista, GuaranaSplash, Elephant, SoapFoam} from "./Sets24";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingPanela.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_PANELA = F(words[words.length - 1].e + 0.9);

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
const VEREADORA0 = at(0, "vereadora");
const CURITIBA0 = at(0, "curitiba");
const ENTAO0 = at(0, "entao");
const PINGUIM0 = at(0, "pinguim");
const FAX0 = at(0, "fax");
const ENTALA1 = at(1, "entala");
const GANHA1 = at(1, "ganha");
const NOVENTA1 = at(1, "noventa");
const QUATROCENTOS3 = at(3, "quatrocentos");
const BICICLETA3 = at(3, "bicicleta");
const PAULISTA3 = at(3, "paulista");
const GUARANA4 = at(4, "guarana");
const ESTOURAM4 = at(4, "estouram");
const GRUDENTA4 = at(4, "grudenta");
const ELEFANTE6 = at(6, "elefante");
const LAVA6 = at(6, "lava");
const BANHO6 = at(6, "banho");
const APARECE7 = at(7, "aparece");
const FEIJOADA7 = at(7, "feijoada");
const CHORA7 = at(7, "chora");
const PARABENS9 = at(9, "parabens");
const PANELA9 = at(9, "panela");
const PASTEL9 = at(9, "pastel");
const GUARANA9 = at(9, "guarana");
const DEVOLVEU9 = at(9, "devolveu");
const TIA9 = at(9, "tia");
const VOTO10 = at(10, "voto");

const PASTEL_R: V3 = [Math.PI / 2, 0, 0];
const CROWD: ToyLook[] = [
  {shirt: "#e8414f", pants: "#101018", hairStyle: "spiky", hair: "#2a1a10"},
  {shirt: "#2ecc71", pants: "#2e86de", hairStyle: "ponytail", hair: "#5a3a20", lips: "#c0392b"},
  {shirt: "#9b59b6", pants: "#101018", hairStyle: "curly", hair: "#101018"},
  {shirt: "#ff8a1f", pants: "#5a4a3a", hairStyle: "bun", hair: "#d9d9d9"},
];

/** pastel com carinha e faixa */
const PastelChar: React.FC<{p: V3; s?: number; t: number; mouth?: number; sash?: boolean; fax?: boolean}> = ({p, s = 1, t, mouth = 0, sash = false, fax = false}) => (
  <group position={p} scale={s}>
    <group rotation={[Math.PI / 2 - 0.25, 0, 0]}>
      <Pastel p={[0, 0, 0]} r={[0, 0, 0]} s={2.2} fry={1} />
    </group>
    <group position={[0, 0.02, 0.32]}>
      <ObjFace s={0.8} mood="happy" t={t} mouth={mouth} />
    </group>
    {sash && (
      <mesh position={[0, -0.05, 0.3]} rotation={[0, 0, 0.6]} material={sm("#2ecc71", 0.6)}>
        <boxGeometry args={[0.1, 0.7, 0.02]} />
      </mesh>
    )}
    {fax && (
      <mesh position={[0.15, 0.2, 0.1]} rotation={[0, 0, -0.5]} material={sm("#ffffff", 0.7, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.3, 0.4]} />
      </mesh>
    )}
  </group>
);
const ChamberLights: React.FC = () => (
  <>
    <Bg c="#cfe8ff" />
    <hemisphereLight args={["#fff6e6", "#8a6a5a", 1.0]} />
    <pointLight position={[0, 3.6, 2]} intensity={12} distance={14} decay={1.4} castShadow />
  </>
);

/* =================== a panela vereadora =================== */
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.5, 3.4]} look={[0, 1.1, 0]} fov={52} f={f} a={a} />
    <KitchenLights />
    <CafeKitchen h={10} m={0} />
    <Toy pose={{...idle(f), pos: [-0.3, 0, 0.6], rotY: 0.4, ...ARMS_UP, eyeWide: 1, mouthOpen: 0.5, brow: 1}} look={BOY} />
    <mesh position={[0.5, 0.86, 0.1]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#c9ced6", 0.5)}>
      <ringGeometry args={[0.3, 0.4, 24]} />
    </mesh>
  </>
);
const PotSpeech: React.FC<{f: number; a: number; t: number; close?: boolean; feijoada?: boolean}> = ({f, a, t, close, feijoada}) => (
  <>
    <Cam pos={close ? [0, 1.8, 2.8] : [0, 2.0, 5.2]} look={close ? [0, 1.55, 0] : [0, 1.5, -0.4]} fov={52} f={f} a={a} />
    <ChamberLights />
    <Chamber />
    <Lectern p={[0, 0, 0]} text={feijoada ? "FEIJOADA" : "VOTE PANELA"} />
    <Pot p={[0, 1.12, 0.0]} s={0.75} t={t} mouth={0.3 + 0.4 * Math.abs(Math.sin(t * 10))} hop={1} />
  </>
);
const S0b: React.FC<ShotProps> = ({f, a, t}) => <PotSpeech f={f} a={a} t={t} />;
/* o pinguim advogado do fax */
const S0c: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.3, 2.8]} look={[0, 0.9, 0]} fov={50} f={f} a={a} />
    <ChamberLights />
    <Chamber />
    <mesh position={[0.45, 0.39, 0.1]} geometry={rbox(1.0, 0.78, 0.7, 0.04)} material={sm("#6b4a2a", 0.6)} castShadow />
    <FaxMachine p={[0.45, 0.78, 0.1]} s={1.2} paper={f >= FAX0 ? clamp((f - FAX0) / 20) : 0} />
    <Penguin p={[-0.45, 0, 0.2]} rotY={0.4} t={t} blink={blinkCurve(f)} s={1.3} />
    <group position={[-0.45, 0, 0.2]} rotation={[0, 0.4, 0]} scale={1.3}>
      <mesh position={[0, 0.62, 0.2]} material={sm("#e8262d", 0.5)} scale={[1, 1, 0.4]}>
        <coneGeometry args={[0.05, 0.2, 4]} />
      </mesh>
      <mesh position={[0.25, 0.25, 0.05]} geometry={rbox(0.3, 0.22, 0.08, 0.02)} material={sm("#3a2a1a", 0.5)} />
    </group>
  </>
);
/* o fax entala no pastel, e o pastel ganha */
const S1a: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (ENTALA1 - a));
  return (
    <>
      <Cam pos={[0, 1.6, 4.2]} look={[0, 1.2, 0]} fov={52} f={f} a={a} />
      <ChamberLights />
      <Chamber />
      <mesh position={[lerp(-2.2, 0.6, k), 1.4 + Math.sin(k * Math.PI) * 0.8, lerp(1, 0, k)]} rotation={[0.3, k * 8, 0.4]} material={sm("#ffffff", 0.7, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.35, 0.45]} />
      </mesh>
      <mesh position={[0.6, 0.39, 0]} geometry={rbox(1.0, 0.78, 0.7, 0.04)} material={sm("#d9d4c8", 0.6)} castShadow />
      <PastelChar p={[0.6, 0.95, 0]} s={1} t={t} />
    </>
  );
};
const S1b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, 3.6]} look={[0, 1.35, 0]} fov={52} f={f} a={a} />
    <ChamberLights />
    <Chamber />
    <Lectern p={[0, 0, 0]} text="VOTE PASTEL" />
    <PastelChar p={[0, 1.4, 0.05]} s={1.1} t={t} mouth={0.3 + 0.3 * Math.abs(Math.sin(t * 9))} sash={f >= GANHA1} fax />
  </>
);
/* a posse e o protesto dos pombos de bicicleta na Paulista */
const BikePigeon: React.FC<{p: V3; t: number; i: number; burst?: number}> = ({p, t, i, burst = 0}) => (
  <group position={p} rotation={[0, Math.PI, burst > 0.5 ? 0.3 : 0]}>
    <Bicycle p={[0, burst > 0.5 ? -0.15 : 0, 0]} rotY={Math.PI / 2} spin={burst > 0.5 ? 0 : t * 10 + i} color={["#e8414f", "#2e86de", "#ffd21f", "#2ecc71"][i % 4]} />
    <Pigeon p={{pos: [0, 0.75, 0], rotY: 0, t: t + i, bob: Math.sin(t * 8 + i), blink: blinkCurve(i * 7 + t * 30), chest: 0.4}} s={0.85} />
    <group position={[0.18, 1.2, 0]}>
      <mesh position={[0, 0.35, 0]} material={sm("#c8874a", 0.6)}>
        <cylinderGeometry args={[0.01, 0.01, 0.7, 4]} />
      </mesh>
      <Sign p={[0, 0.7, 0.01]} r={[0, Math.PI, 0]} w={0.5} h={0.28} text={["MAIS MILHO", "FORA PASTEL", "PÃO JÁ", "MIGALHA!"][i % 4]} bg="#ffffff" fg="#e8262d" size={70} />
    </group>
  </group>
);
const PaulistaScene: React.FC<{f: number; a: number; t: number; burst?: number; sticky?: number; pigeons?: boolean; elephant?: boolean; foam?: number; pot?: boolean; crowd?: boolean}> = ({f, a, t, burst = 0, sticky = 0, pigeons = true, elephant = false, foam = 0, pot = false, crowd = false}) => {
  const s2 = (f - a) / FPS;
  const zr = pigeons && burst < 0.5 ? s2 * 1.6 : 0;
  return (
    <>
      <Cam pos={[0.3, 1.8, 5.4]} look={[0, 1.0, -1.0]} fov={56} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#8a8a8a", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={14} />
      <Paulista sticky={sticky} />
      {pigeons &&
        Array.from({length: 8}, (_, i) => {
          const z = -4 + Math.floor(i / 4) * 2.2 + zr;
          const x = -2.4 + (i % 4) * 1.6;
          return (
            <group key={i}>
              <BikePigeon p={[x, 0, z]} t={t} i={i} burst={burst} />
              <GuaranaSplash p={[x, 0, z]} k={burst} />
            </group>
          );
        })}
      {elephant && (
        <>
          <Elephant p={[-1.1, 0, -2.0]} rotY={0.6} s={0.95} t={t} trunkUp={f >= BANHO6 ? 1 : 0.4} blink={blinkCurve(f)} />
          <WaterJet a={[-0.45, 2.0, -0.9]} b={f >= BANHO6 ? [-1.0, 3.0, -2.0] : [1.8, 0, 2.5]} k={1} t={t} />
        </>
      )}
      {foam > 0 && <SoapFoam p={[0, 0, 0]} n={40} spread={5} t={t} k={foam} />}
      {pot && (
        <>
          <Lectern p={[0, 0, 1.0]} text="FEIJOADA" />
          <Pot p={[0, 1.12, 1.0]} s={0.75} t={t} mouth={0.3 + 0.4 * Math.abs(Math.sin(t * 10))} hop={1} />
        </>
      )}
      {crowd &&
        CROWD.map((lk, i) => <Toy key={i} pose={{...idle(f + i * 9), pos: [[-1.7, 1.7, -1.4, 1.4][i], 0, [1.8, 1.8, 0.4, 0.4][i]], rotY: i % 2 ? -1.0 : 1.0, blink: 1, mouthOpen: 0.4, brow: 0.8}} look={lk} />)}
    </>
  );
};
const S3a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, 3.6]} look={[0, 1.35, 0]} fov={52} f={f} a={a} />
    <ChamberLights />
    <Chamber />
    <Lectern p={[0, 0, 0]} text="POSSE" />
    <PastelChar p={[0, 1.4, 0.05]} s={1.1} t={t} mouth={0.2} sash />
  </>
);
const S3b: React.FC<ShotProps> = ({f, a, t}) => <PaulistaScene f={f} a={a} t={t} />;
const S4: React.FC<ShotProps> = ({f, a, t}) => <PaulistaScene f={f} a={a} t={t} burst={clamp((f - ESTOURAM4) / 20)} sticky={easeOut(ramp(f, ESTOURAM4 + 6, GRUDENTA4 + 10))} />;
const S5: React.FC<ShotProps> = ({f, a, t}) => <PaulistaScene f={f} a={a} t={t} burst={1} sticky={1} />;
const S6: React.FC<ShotProps> = ({f, a, t}) => <PaulistaScene f={f} a={a} t={t} pigeons={false} sticky={1 - 0.7 * clamp((f - LAVA6) / 60)} elephant foam={clamp((f - LAVA6) / 40) * 0.8} />;
const S7: React.FC<ShotProps> = ({f, a, t}) => <PaulistaScene f={f} a={a} t={t} pigeons={false} foam={1} pot={f >= APARECE7 - 4} crowd={f >= CHORA7 - 4} />;
/* parabéns: a panela agora é a sua tia */
const PotAunt: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.4, 3.4]} look={[0, 1.0, 0]} fov={52} f={f} a={a} />
    <KitchenLights />
    <CafeKitchen h={18} m={0} />
    <Pot p={[0.45, 0.84, 0.05]} s={0.75} t={t} sash={false} mouth={0.2} />
    <group position={[0.45, 0.84, 0.05]} scale={0.75}>
      <mesh position={[0, 0.95, -0.05]} material={sm("#d9d9d9", 0.6)}>
        <sphereGeometry args={[0.16, 14, 10]} />
      </mesh>
      <group position={[0, 0.4, 0.4]} scale={1.1}>
        <HeadGlasses color="#8a5a2b" />
      </group>
    </group>
    <Toy pose={{...idle(f), pos: [-0.5, 0, 0.35], rotY: 0.5, rShoulder: [-1.4, 0.6, 0], rElbow: -0.4, smile: 1}} look={BOY} />
  </>
);
const S9: React.FC<ShotProps> = (p) => {
  const {f} = p;
  if (f >= DEVOLVEU9 - 3) return <PotAunt {...p} a={DEVOLVEU9 - 3} />;
  if (f >= GUARANA9 - 3) return <S5 {...p} a={GUARANA9 - 3} />;
  if (f >= PASTEL9 - 3) return <S1b {...p} f={GANHA1 + 10} a={PASTEL9 - 3} />;
  if (f >= PANELA9 - 3) return <PotSpeech f={f} a={PANELA9 - 3} t={p.t} />;
  return <PotSpeech f={f} a={p.a} t={p.t} close />;
};
/* final: a panela pede o seu voto na porta */
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.2, 4.6]} look={[0, 1.05, 0]} fov={52} f={f} a={a} />
    <DayOut />
    <House p={[0, 0, -1.8]} w={3.6} h={2.8} d={3} wall="#ffd166" roof="#e8414f" />
    <Pot p={[0.1, 0, 0.3]} s={1.0} t={t} mouth={0.3 + 0.3 * Math.abs(Math.sin(t * 9))} hop={0.5} />
    <Sign p={[0.1, 1.25, 0.32]} w={0.9} h={0.32} text="VOTE PANELA" bg="#2ecc71" fg="#ffffff" size={66} />
  </>
);

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: VEREADORA0 - 6, Comp: S0b},
  {from: ENTAO0 - 4, Comp: S0c},
  {from: L(1), Comp: S1a},
  {from: ENTALA1 - 4, Comp: S1b},
  {from: L(2), Comp: S1b},
  {from: L(3), Comp: S3a},
  {from: QUATROCENTOS3 - 4, Comp: S3b},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S7},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_PANELA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["panela", "tia", "vereadora", "curitiba", "advogado", "pinguim", "fax", "camara", "entala", "pastel", "eleicao", "noventa", "democracia", "frita", "posse", "quatrocentos", "pombos", "protesto", "bicicleta", "avenida", "paulista", "pneus", "guarana", "estouram", "grudenta", "engarrafamento", "gaseificado", "elefante", "bombeiro", "tromba", "banho", "espuma", "discurso", "feijoada", "chora", "pronunciamento", "culinario", "parabens", "vereador", "devolveu", "seguir", "perfil", "voto", "porta"]);
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
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const projBR = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapCity: React.FC<{from: number; to: number; lon: number; lat: number; label: string; icon: string}> = ({from, to, lon, lat, label, icon}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const P = projBR(lon, lat);
  const drop = Math.min(1, (f - from) / 10);
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <div style={{position: "absolute", left: P[0], top: P[1] - 200 * (1 - drop), transform: "translate(-50%,-100%)", fontSize: 110}}>{icon}</div>
      <div style={{position: "absolute", left: P[0], top: P[1] + 20, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 44, padding: "4px 16px", whiteSpace: "nowrap"}}>{label}</div>
    </AbsoluteFill>
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
const TITLES: [number, string[]][] = [
  [L(2), ["DEMOCRACIA", "FRITA"]],
  [L(5), ["ENGARRAFAMENTO", "GASEIFICADO"]],
  [L(8), ["PRONUNCIAMENTO", "CULINÁRIO"]],
];
const FOLLOW_FROM = L(10) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoPanela: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapCity from={CURITIBA0 - 2} to={ENTAO0 - 6} lon={-49.3} lat={-25.4} label="CURITIBA" icon="🍲" />
      <MapCity from={PAULISTA3 - 2} to={L(4) - 2} lon={-46.6} lat={-23.5} label="AVENIDA PAULISTA" icon="🐦🚲" />
      {TITLES.map(([x, lines], i) => {
        const next = [L(3), L(6), L(9)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={VEREADORA0 - 8} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Tag from={VEREADORA0} to={CURITIBA0 - 3} text="VEREADORA" />
      <Tag from={PINGUIM0} to={FAX0 - 2} text="ADVOGADO" />
      <Ono from={FAX0 + 4} to={L(1) - 2} text="BIIIIP… KRRRR" size={100} color="#ffffff" />
      <Ono from={ENTALA1 + 2} to={GANHA1 - 4} text="PLOFT!" />
      <BigNum from={NOVENTA1} to={L(2) - 2} text="99%" size={190} />
      <BigNum from={QUATROCENTOS3} to={BICICLETA3 - 2} text="400 POMBOS" size={110} />
      <Ono from={ESTOURAM4} to={GRUDENTA4 - 3} text="PÁ! PÁ! PÁ!" size={130} color="#2ecc71" />
      <Tag from={GRUDENTA4} to={L(5) - 2} text="CIDADE GRUDENTA" />
      <Tag from={ELEFANTE6 + 4} to={BANHO6 - 3} text="ELEFANTE BOMBEIRO" />
      <Ono from={BANHO6} to={L(7) - 2} text="SPLASH!" size={140} color="#7fd0ff" />
      <Tag from={FEIJOADA7} to={CHORA7 - 3} text="DISCURSO DA FEIJOADA" />
      <Ono from={CHORA7} to={L(8) - 2} text="BUÁÁÁ!" size={140} color="#9fe0ff" />
      <Confetti from={PARABENS9} to={PARABENS9 + 60} />
      <Tag from={TIA9} to={L(10) - 2} text="TIA PANELA" />
      <Ono from={VOTO10} to={TOTAL_PANELA - 70} text="TOC TOC!" size={120} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_PANELA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozpanela.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx3/crowd.mp3" from={VEREADORA0 - 6} dur={ENTAO0 - VEREADORA0} v={FXV * 0.2} />
      <SND src="sfx8/beep.mp3" from={FAX0 + 2} dur={30} v={FXV * 0.3} />
      <SND src="sfx14/papel.mp3" from={L(1)} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/pof.mp3" from={ENTALA1 + 2} dur={20} v={FXV * 0.45} />
      <SND src="sfx2/cheer.mp3" from={GANHA1} dur={L(2) - GANHA1} v={FXV * 0.3} />
      <SND src="sfx8/crowdcoo.mp3" from={QUATROCENTOS3} dur={L(4) - QUATROCENTOS3} v={FXV * 0.3} />
      <SND src="sfx2/boom.mp3" from={ESTOURAM4} dur={30} v={FXV * 0.3} />
      <SND src="sfx14/spray.mp3" from={ESTOURAM4 + 4} dur={30} v={FXV * 0.3} />
      <SND src="sfx14/sirene.mp3" from={ELEFANTE6 - 4} dur={30} v={FXV * 0.25} />
      <SND src="sfx11/water.mp3" from={LAVA6} dur={L(7) - LAVA6} v={FXV * 0.3} />
      <SND src="sfx12/sadcrowd.mp3" from={CHORA7} dur={L(8) - CHORA7} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={PARABENS9} dur={50} v={FXV * 0.4} />
      <SND src="sfx5/knock.mp3" from={VOTO10} dur={30} v={FXV * 0.45} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
