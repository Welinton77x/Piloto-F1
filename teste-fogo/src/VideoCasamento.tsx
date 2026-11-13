import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Clouds, V3} from "./Sets5";
import {Dino} from "./Sets7";
import {Cow, Pot, Noodles, MilkGlass, Planet, PLANET_R} from "./Sets8";
import {Dog, Alien, Rocket, MoonSet, Crater, Helmet, Dust} from "./Sets9";
import {HER_BRIDE, GROOM, Bouquet, PARTY, WeddingChair, CHAIR_SEAT, RoundTable, Cake, BuffetTable, MagicStage, MagicianHat, Cape, Wand, Puff, Satellite, Tornado, WeddingPigeon, Church, CHURCH_PLAT, Hall, HALL, HallParty, Debris} from "./Sets10";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, rng} from "./util";
import W from "./timingCasa.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
/** termina logo depois do "dessas..." pra emendar no "cinco coisas..." (loop) */
export const TOTAL_CASA = F(words[words.length - 1].e + 0.35);

const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const arc = (A: V3, B: V3, k: number, h = 1): V3 => [lerp(A[0], B[0], k), lerp(A[1], B[1], k) + Math.sin(k * Math.PI) * h, lerp(A[2], B[2], k)];

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.matrixWorld.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const AtPalm: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
  const g = useRef<THREE.Group>(null);
  const v = React.useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.set(v.x + offset[0], v.y + offset[1], v.z + offset[2]);
  }, -1);
  return <group ref={g}>{children}</group>;
};

/* ---------- poses da noiva / do noivo ---------- */
const HOLD: Pose = {rShoulder: [-0.62, 0, 0.38], rElbow: -1.05, lShoulder: [-0.62, 0, -0.38], lElbow: -1.05};
const CLASP: Pose = {rShoulder: [-0.9, 0, 0.42], rElbow: -1.35, lShoulder: [-0.9, 0, -0.42], lElbow: -1.35};
const CROSSED: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
const HANDS_UP: Pose = {rShoulder: [-2.6, 0, -0.5], rElbow: -0.25, lShoulder: [-2.6, 0, 0.5], lElbow: -0.25};
const CHEEKS: Pose = {rShoulder: [-1.9, 0, 0.45], rElbow: -2.1, lShoulder: [-1.9, 0, -0.45], lElbow: -2.1};
const SHRUG: Pose = {rShoulder: [-0.5, 0, -0.75], rElbow: -1.3, lShoulder: [-0.5, 0, 0.75], lElbow: -1.3};
/** o buquê nas mãos (pose HOLD), no espaço do corpo */
const BouquetFront: React.FC<{pos: V3; rotY: number; s?: number}> = ({pos, rotY, s = 1.15}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Bouquet p={[0, 0.86, 0.36]} r={[0.35, 0, 0]} s={s} />
  </group>
);

/* ---------- convidados ---------- */
const GUESTS: ToyLook[] = [
  {shirt: "#e74c3c", hair: "#1a1a1a", hairStyle: "spiky"},
  {shirt: "#9b59b6", hair: "#d9b56a", hairStyle: "pigtails", skin: "#f5d0b0"},
  {suit: true, shirt: "#2c3e8f", pants: "#2c3e8f", shoe: "#15161d", sole: "#15161d", hair: "#2a170d", hairStyle: "buzz", skin: "#8d5a3a"},
  {shirt: "#ff6f91", hair: "#7a3a1a", hairStyle: "ponytail"},
  {shirt: "#1abc9c", hair: "#5a3418", hairStyle: "long", skin: "#c58c63"},
  {suit: true, shirt: "#7a7f8c", pants: "#2d3038", shoe: "#15161d", sole: "#15161d", hair: "#1a1a1a", hairStyle: "curly", skin: "#6d4630"},
  {shirt: "#f39c12", hair: "#1a1a1a", hairStyle: "bun"},
  {shirt: "#3498db", hair: "#b0b0b0", hairStyle: "buzz", skin: "#f1c8a0"},
];
const SEATS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let k = 0;
  for (const z of [-0.6, 0.6, 1.8, 3.0, 4.2, 5.4, 6.6])
    for (const sd of [-1, 1])
      for (const x of [1.15, 1.85, 2.55]) {
        if ((k * 7) % 5 !== 3) out.push([x * sd, z, k % GUESTS.length]);
        k++;
      }
  return out;
})();
const SeatedGuests: React.FC<{f: number; t: number; react?: number; look?: number}> = ({f, react = 0, look = 0}) => (
  <>
    {SEATS.map(([x, z, g], i) => (
      <Toy
        key={i}
        pose={{
          ...idle(f + i * 13),
          pos: [x, CHAIR_SEAT + 0.118 - 0.72, z - 0.02],
          rotY: Math.PI,
          legLift: 1.75,
          rShoulder: [-0.35 - 0.6 * react, 0, 0.2],
          rElbow: -0.9 - 0.6 * react,
          lShoulder: [-0.35 - 0.6 * react, 0, -0.2],
          lElbow: -0.9 - 0.6 * react,
          smile: 0.6 + 0.4 * react,
          eyeWide: 0.4 * react,
          head: [0, look * Math.sign(-x) * 0.5, 0],
        }}
        look={GUESTS[g]}
      />
    ))}
  </>
);

/* ---------- ambientes ---------- */
const OutdoorLights: React.FC<{target: V3; ext?: number}> = ({target, ext = 7}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#d8f0ff", 40, 140]} />
    <SunDisc p={[-30, 40, -100]} r={6} />
    <hemisphereLight args={["#e2f2ff", "#a08a5e", 1.15]} />
    <SunLight target={target} dir={[-5, 9, 7]} intensity={2.4} ext={ext} />
  </>
);
/** cerimônia: igreja grande; festa: salão (com o buraco no teto depois que o buquê passa) */
const Venue: React.FC<{f: number; t: number; target: V3; party?: boolean; ceremony?: boolean}> = ({f, t, target, party = true}) =>
  party ? <HallScene f={f} t={t} target={target} /> : <ChurchScene t={t} target={target} />;
const ChurchScene: React.FC<{t: number; target: V3}> = ({t, target}) => (
  <>
    <color attach="background" args={["#f3ead9"]} />
    <hemisphereLight args={["#fff1dc", "#8a6a4a", 0.95]} />
    <SunLight target={target} dir={[5, 9, 4]} intensity={1.6} ext={7} />
    {[0.5, 5.5, 10.5].map((z) => (
      <pointLight key={z} position={[0, 5.8, z]} intensity={7} distance={12} decay={1.6} color="#ffe2b0" />
    ))}
    <pointLight position={[0, 3.5, -3.0]} intensity={5} distance={8} decay={1.6} color="#fff0d8" />
    <Church t={t} />
  </>
);
const HOLE_AT: [number, number] = [13.96, -0.92];
const HallScene: React.FC<{f: number; t: number; target: V3}> = ({f, t, target}) => (
  <>
    <Sky top="#1b2a6b" bottom="#4a6fb0" />
    <hemisphereLight args={["#fff1dc", "#7a5a3a", 0.95]} />
    <SunLight target={target} dir={[3, 9, 4]} intensity={1.3} ext={7} />
    {(
      [
        [PARTY[0], PARTY[2] + 1.0],
        [PARTY[0] - 3.8, PARTY[2] + 5.0],
        [PARTY[0] + 3.8, PARTY[2] + 5.0],
        [PARTY[0] - 3.8, PARTY[2] - 4.2],
        [PARTY[0] + 3.8, PARTY[2] - 4.2],
      ] as [number, number][]
    ).map(([x, z], i) => (
      <pointLight key={i} position={[x, HALL.h - 1.3, z]} intensity={5} distance={9} decay={1.6} color="#ffe2b0" />
    ))}
    <Hall t={t} hole={f >= THROW + 8 ? 1 : 0} holeAt={HOLE_AT} />
    <HallParty />
  </>
);
const SpaceScene: React.FC = () => {
  const stars = React.useMemo(() => {
    const r = rng(77);
    return Array.from({length: 200}, () => [(r() - 0.5) * 90, (r() - 0.5) * 120, -40 - r() * 20] as V3);
  }, []);
  return (
    <>
      <color attach="background" args={["#0a0f2a"]} />
      <hemisphereLight args={["#ffffff", "#203060", 0.9]} />
      <directionalLight position={[6, 5, 8]} intensity={2.4} color="#fff4e0" />
      {stars.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08 + (i % 3) * 0.04, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
};
const MoonScene: React.FC<{t: number}> = ({t}) => (
  <>
    <hemisphereLight args={["#c8d4ff", "#3a3a48", 0.6]} />
    <directionalLight position={[-6, 9, 6]} intensity={2.6} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0006} shadow-normalBias={0.03} />
    <MoonSet t={t} />
  </>
);

/* =================== abertura: no altar =================== */
const GROOM_A: V3 = [-0.55, 0, -2.25];
const BRIDE_A: V3 = [0.55, 0, -2.25];
const PRIEST_P: V3 = [0, CHURCH_PLAT, -3.5];
const Altar: React.FC<{f: number; t: number; groom?: Pose; bride?: Pose; bouquet?: boolean; priest?: {jaw?: number; headYaw?: number; headTilt?: number; arms?: number}}> = ({f, t, groom = {}, bride = {}, bouquet = true, priest = {}}) => (
  <>
    <Dino p={{pos: PRIEST_P, rotY: 0, priest: true, t, blink: blinkCurve(f + 41), tail: 0.3, ...priest}} s={0.85} />
    <Toy pose={{...idle(f), pos: GROOM_A, rotY: 1.15, smile: 0.8, ...groom}} look={GROOM} />
    <Toy pose={{...idle(f + 37), pos: BRIDE_A, rotY: -1.15, smile: 0.9, ...HOLD, ...bride}} look={HER_BRIDE} />
    {bouquet && <BouquetFront pos={BRIDE_A} rotY={-1.15} />}
  </>
);
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 104);
  return (
    <>
      <Cam pos={[lerp(0.3, 0.15, k), lerp(1.9, 1.7, k), lerp(5.6, 3.6, easeInOut(k))]} look={[0, 1.45, -2.6]} fov={50} f={f} a={a} />
      <Venue f={f} t={t} target={[0, 0, -1]} party={false} />
      <Altar f={f} t={t} priest={{jaw: talk(f, 6, 90) * 0.6}} />
      <SeatedGuests f={f} t={t} />
    </>
  );
};
/* "a número cinco aconteceu de verdade" — a noiva levanta a sobrancelha pra câmera */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const look = ramp(f, at(0, "aconteceu") - 4, at(0, "aconteceu") + 4);
  return (
    <>
      <Cam pos={[-0.55, 1.62, lerp(-0.45, -0.7, clamp((f - a) / 80))]} look={[0.5, 1.55, -2.25]} fov={40} f={f} a={a} />
      <Venue f={f} t={t} target={[0, 0, -2]} party={false} />
      <Altar f={f} t={t} bride={{head: [0, 0.55 * look, 0.12 * look], brow: 0.9 * look, smile: 1, pupil: [-0.6 * look, 0]}} />
    </>
  );
};

/* =================== Nº1 — aliança fugitiva =================== */
const POMBO = at(2, "pombo", 0);
const RUN = at(2, "sai");
const dogZ = (f: number) => (f < RUN ? lerp(6.5, 1.0, clamp((f - L(1)) / (RUN - L(1)))) : 1.0);
const S2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.45, 0.95, dogZ(f) - 2.4]} look={[0, 0.6, dogZ(f) + 0.3]} fov={48} f={f} a={a} />
    <Venue f={f} t={t} target={[0, 0, dogZ(f)]} party={false} />
    <Altar f={f} t={t} />
    <SeatedGuests f={f} t={t} look={1} />
    <Dog d={{pos: [0, 0, dogZ(f)], rotY: Math.PI, walk: 1, run: 0.8, bowtie: true, pillow: 1, t, tail: 1, mouth: 0.15, tongue: 0.6, blink: blinkCurve(f + 5), head: [0.1, 0, 0]}} />
  </>
);
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const aww = ramp(f, a + 6, a + 14);
  return (
    <>
      <Cam pos={[0.35, 1.3, dogZ(f) + 2.0]} look={[0.25, 1.15, -2.2]} fov={44} f={f} a={a} />
      <Venue f={f} t={t} target={[0, 0, dogZ(f)]} party={false} />
      <Altar f={f} t={t} bride={{...CLASP, head: [0, 0.3, 0.1], smile: 1, blink: aww > 0.5 ? 0.85 : 0}} bouquet={false} />
      <SeatedGuests f={f} t={t} react={aww} look={1} />
      <Dog d={{pos: [0, 0, dogZ(f)], rotY: Math.PI, walk: 1, run: 0.8, bowtie: true, pillow: 1, t, tail: 1, mouth: 0.15, tongue: 0.6, blink: blinkCurve(f + 5)}} />
    </>
  );
};
/* o pombo pousa; o cachorro sai correndo atrás dele (as alianças vão junto) */
const SHOCK_CUT = at(2, "correndo") + 2;
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const land = clamp((f - (POMBO - 8)) / 12);
  const pPos: V3 = f < RUN + 4 ? arc([2.5, 2.5, 0.6], [0.35, 0, 0.35], easeOut(land), 0.4) : arc([0.35, 0, 0.35], [2.2, 3.6, -0.6], clamp((f - RUN - 4) / 26), 0.6);
  const dz = lerp(1.0, -1.2, clamp((f - RUN) / 30));
  const dx = lerp(0, -1.0, clamp((f - RUN) / 30));
  const flying = f >= RUN + 4;
  const pk = clamp((f - RUN) / 18);
  const shock = ramp(f, RUN, RUN + 5);
  return (
    <>
      {f < SHOCK_CUT ? <Cam pos={[0.0, 1.05, -2.0]} look={[0.2, 0.5, 0.9]} fov={50} f={f} a={a} /> : <Cam pos={[-0.55, 1.62, -0.5]} look={[0.5, 1.5, -2.25]} fov={40} f={f} a={SHOCK_CUT} />}
      <Venue f={f} t={t} target={[0, 0, 0]} party={false} />
      <Altar f={f} t={t} bride={{...(shock > 0.5 ? CHEEKS : HOLD), eyeWide: shock, mouthOpen: 0.6 * shock, brow: shock, smile: 1 - shock}} bouquet={shock < 0.5} groom={{eyeWide: shock, mouthOpen: 0.4 * shock, brow: shock}} />
      <SeatedGuests f={f} t={t} react={shock} look={1} />
      <WeddingPigeon p={{pos: pPos, rotY: flying ? 1.2 : f < POMBO ? -1.4 : Math.PI - 0.6, flap: f < POMBO + 2 || flying ? 1 : 0, t, rings: flying, blink: blinkCurve(f + 3), peck: !flying && f > POMBO + 6 ? 0.6 * Math.abs(Math.sin(t * 6)) : 0}} s={1.5} />
      <Dog d={{pos: [dx, 0, dz], rotY: Math.PI + (f >= RUN ? 0.4 : 0), walk: 1, run: f >= RUN ? 3 : 0.0001, bowtie: true, pillow: f < RUN + 2 ? 1 : 0, t, tail: 1, mouth: f >= RUN ? 0.4 : 0.1, tongue: f >= RUN ? 1 : 0, head: [f >= RUN - 6 && f < RUN ? -0.3 : 0, 0, 0]}} />
      {f >= RUN + 2 && pk < 1 && (
        <group position={arc([0, 0.85, 1.0], [0.6, 0.02, 1.6], pk, 0.6)} rotation={[pk * 5, 0, pk * 2]}>
          <mesh>
            <boxGeometry args={[0.36, 0.09, 0.3]} />
            <meshStandardMaterial color="#fbf6ee" roughness={0.6} />
          </mesh>
        </group>
      )}
    </>
  );
};
/* "...e agora quem tá noivo é o pombo!" — os pombos casando no pedestal de flores; o padre abençoa */
const PEDESTAL: V3 = [0, 0, -2.35];
const Pedestal: React.FC = () => (
  <group position={PEDESTAL}>
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.16, 0.2, 1.0, 20]} />
      <meshStandardMaterial color="#fbf8f2" roughness={0.5} />
    </mesh>
    <mesh position={[0, 1.02, 0]}>
      <cylinderGeometry args={[0.32, 0.3, 0.05, 24]} />
      <meshStandardMaterial color="#fbf8f2" roughness={0.5} />
    </mesh>
    {Array.from({length: 10}, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.3, 1.02, Math.sin(a) * 0.3]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color={["#ffb3c6", "#ffffff", "#ffd1dc"][i % 3]} roughness={0.55} />
        </mesh>
      );
    })}
  </group>
);
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 80);
  const coo = Math.abs(Math.sin(t * 5));
  return (
    <>
      <Cam pos={[lerp(0.15, 0.25, k), 1.85, lerp(0.35, 0.0, k)]} look={[0.05, 1.5, -2.6]} fov={46} f={f} a={a} />
      <Venue f={f} t={t} target={[0, 0, -2]} party={false} />
      <Altar f={f} t={t} bride={{...CROSSED, brow: -0.7, smile: 0.1, head: [-0.1, 0.45, 0.1]}} bouquet={false} groom={{...SHRUG, brow: 0.8, mouthOpen: 0.2, head: [-0.1, -0.35, 0]}} priest={{arms: 0.8 + 0.1 * Math.sin(t * 4), jaw: 0.35 * coo * ramp(f, a + 14, a + 22), headTilt: -0.2}} />
      <Pedestal />
      <WeddingPigeon p={{pos: [PEDESTAL[0] - 0.13, 1.045, PEDESTAL[2]], rotY: 0.25, hat: true, rings: true, chest: 0.5, t, blink: blinkCurve(f), bob: 1}} s={1.25} />
      <WeddingPigeon p={{pos: [PEDESTAL[0] + 0.13, 1.045, PEDESTAL[2]], rotY: -0.25, veil: true, t, blink: blinkCurve(f + 9), bob: 1}} s={1.15} />
    </>
  );
};

/* =================== Nº2 — valsa turbo =================== */
const C_D: V3 = [PARTY[0], 0, PARTY[2] + 0.2];
const SPIN0 = L(4);
const spinAng = (f: number) => {
  const s = (f - L(3)) / FPS;
  const fast = Math.max(0, (f - SPIN0) / FPS);
  return 0.8 * s + 2.5 * fast * fast + 4 * Math.max(0, (f - at(4, "que")) / FPS);
};
const couplePos = (f: number, sideGroom: boolean, lift = 0): {pos: V3; rotY: number} => {
  const th = spinAng(f);
  const r = 0.36;
  const sx = sideGroom ? -1 : 1;
  const x = C_D[0] + Math.cos(th) * r * sx;
  const z = C_D[2] - Math.sin(th) * r * sx;
  const face = Math.atan2(C_D[0] - x, C_D[2] - z);
  return {pos: [x, lift, z], rotY: face};
};
const DANCE: Pose = {rShoulder: [-1.25, 0, 0.3], rElbow: -0.25, lShoulder: [-1.25, 0, -0.3], lElbow: -0.25};
const Dancers: React.FC<{f: number; t: number; bride?: Pose; groom?: Pose; lift?: number}> = ({f, t, bride = {}, groom = {}, lift = 0}) => {
  const g = couplePos(f, true, lift);
  const b = couplePos(f, false, lift);
  return (
    <>
      <Toy pose={{...idle(f), ...g, ...DANCE, smile: 1, ...groom}} look={GROOM} />
      <Toy pose={{...idle(f + 37), ...b, ...DANCE, smile: 1, ...bride}} look={HER_BRIDE} />
    </>
  );
};
const PartyGuests: React.FC<{f: number; t: number; react?: number; hide?: boolean}> = ({f, react = 0, hide = false}) =>
  hide ? null : (
    <>
      {(
        [
          [-3.0, 1.4, 2.3],
          [-2.4, 2.6, 2.7],
          [3.0, 1.6, -2.4],
          [2.5, 2.7, -2.7],
          [-3.1, -0.5, 1.7],
          [3.2, -0.2, -1.7],
        ] as [number, number, number][]
      ).map(([x, z, ry], i) => (
        <Toy key={i} pose={{...idle(f + i * 17), pos: [PARTY[0] + x, 0, PARTY[2] + z], rotY: ry, rShoulder: [-0.6 - 1.9 * react, 0, -0.3], lShoulder: [-0.6 - 1.9 * react, 0, 0.3], rElbow: -1.0 + 0.7 * react, lElbow: -1.0 + 0.7 * react, smile: 0.8, eyeWide: 0.5 * react, mouthOpen: 0.4 * react}} look={GUESTS[(i + 2) % GUESTS.length]} />
      ))}
    </>
  );
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 80);
  return (
    <>
      <Cam pos={[PARTY[0] + lerp(0.8, 0.5, k), 2.6, PARTY[2] + lerp(5.4, 4.6, k)]} look={[PARTY[0], 0.9, PARTY[2] + 0.2]} fov={46} f={f} a={a} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Dancers f={f} t={t} />
      <PartyGuests f={f} t={t} />
    </>
  );
};
/* "não ensaie a valsa no chão encerado" — escorregando */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const slip = ramp(f, at(3, "encerado") - 6, at(3, "encerado") + 4);
  const wob = 0.25 * Math.sin(t * 12) * slip;
  return (
    <>
      <Cam pos={[C_D[0] + (Math.sin(spinAng(f)) - 0.85 * Math.cos(spinAng(f))) * 2.1, 1.9, C_D[2] + (Math.cos(spinAng(f)) + 0.85 * Math.sin(spinAng(f))) * 2.1]} look={[C_D[0], 1.0, C_D[2]]} fov={44} f={f} a={a} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Dancers f={f} t={t} bride={{torso: [0, 0, wob], eyeWide: slip, mouthOpen: 0.5 * slip, brow: slip, smile: 1 - 0.5 * slip}} groom={{torso: [0, 0, -wob], eyeWide: slip, mouthOpen: 0.4 * slip, brow: slip}} />
      <PartyGuests f={f} t={t} />
    </>
  );
};
/* "vocês giram tão rápido..." */
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PARTY[0], 2.2, PARTY[2] + 3.2]} look={[PARTY[0], 1.0, PARTY[2] + 0.2]} fov={46} f={f} a={a} />
    <Venue f={f} t={t} target={PARTY} ceremony={false} />
    <Dancers f={f} t={t} bride={{eyeWide: 0.6, mouthOpen: 0.6, brow: 0.8, head: [-0.2, 0, 0]}} groom={{eyeWide: 0.8, mouthOpen: 0.5, brow: 1}} />
    <Tornado p={[C_D[0], 0, C_D[2]]} k={0.35 * ramp(f, a, a + 50)} t={t} h={2.4} />
    <PartyGuests f={f} t={t} react={ramp(f, a + 20, a + 40)} />
  </>
);
/* "...que viram um tornado e levam a festa inteira junto!" */
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 20);
  const lift = 0.6 * ramp(f, a + 10, a + 40);
  const debris = ramp(f, at(4, "levam") - 4, at(4, "levam") + 20);
  const items = 14;
  return (
    <>
      <Cam pos={[PARTY[0] + 0.5, 2.6, PARTY[2] + 8.5]} look={[PARTY[0], 2.3, PARTY[2]]} fov={52} f={f} a={a} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Tornado p={[C_D[0], 0, C_D[2]]} k={0.35 + 0.65 * k} t={t} h={5} />
      <Dancers f={f} t={t} lift={lift} bride={{eyeWide: 0.4, mouthOpen: 0.7, blink: 0.9, smile: 1, head: [-0.3, 0, 0]}} groom={{eyeWide: 1, mouthOpen: 0.6, brow: 1}} />
      {Array.from({length: items}, (_, i) => {
        const h = 0.6 + (i / items) * 4.0 * debris;
        const r = 0.9 + 0.55 * h;
        const th = t * (5 - i * 0.12) + i * 2.1;
        const p: V3 = [C_D[0] + Math.cos(th) * r * debris, h * debris + 0.02, C_D[2] + Math.sin(th) * r * debris];
        if (debris < 0.01) return null;
        const kind = i % 5;
        return (
          <group key={i} position={p} rotation={[th * 1.3, th, th * 0.7]}>
            {kind === 0 && <WeddingChair p={[0, -0.3, 0]} />}
            {kind === 1 && <Cake p={[0, -0.3, 0]} s={0.7} />}
            {kind === 2 && <Toy pose={{pos: [0, -0.9, 0], rShoulder: [-2.6, 0, -0.5], lShoulder: [-2.6, 0, 0.5], eyeWide: 1, mouthOpen: 0.7, brow: 1}} look={GUESTS[i % GUESTS.length]} />}
            {kind === 3 && <RoundTable p={[0, -0.4, 0]} />}
            {kind === 4 && <Bouquet s={1.6} />}
          </group>
        );
      })}
    </>
  );
};

/* =================== Nº3 — buquê orbital =================== */
const BRIDE_T: V3 = [PARTY[0], 0, PARTY[2] + 0.6];
const THROW = at(6, "jogou") + 2;
const LADIES: [number, number, number][] = [
  [-1.0, -1.6, 0.25],
  [-0.3, -1.9, 0.0],
  [0.45, -1.8, -0.1],
  [1.1, -1.5, -0.3],
];
const Ladies: React.FC<{f: number; up?: number; look?: number}> = ({f, up = 0, look = 0}) => (
  <>
    {LADIES.map(([x, z, ry], i) => (
      <Toy
        key={i}
        pose={{...idle(f + i * 11), pos: [BRIDE_T[0] + x, 0, BRIDE_T[2] + z], rotY: ry, rShoulder: [lerp(-0.3, -2.7, up), 0, -0.3], lShoulder: [lerp(-0.3, -2.7, up), 0, 0.3], rElbow: -0.3, lElbow: -0.3, smile: 0.9, eyeWide: 0.4 * up, head: [-0.6 * look, 0, 0], mouthOpen: 0.3 * look}}
        look={GUESTS[[1, 3, 4, 6][i]]}
      />
    ))}
  </>
);
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[BRIDE_T[0] + 0.6, 1.55, BRIDE_T[2] + 3.4]} look={[BRIDE_T[0], 1.2, BRIDE_T[2] - 1]} fov={48} f={f} a={a} />
    <Venue f={f} t={t} target={PARTY} ceremony={false} />
    <Toy pose={{...idle(f), pos: BRIDE_T, rotY: 0, ...HOLD, smile: 1, brow: 0.3}} look={HER_BRIDE} />
    <BouquetFront pos={BRIDE_T} rotY={0} />
    <Ladies f={f} up={ramp(f, a + 20, a + 30)} />
  </>
);
/* "cuidado com a força" — gira o braço feito arremessadora */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const wind = ramp(f, a + 10, a + 20);
  const ang = (f - a) * 0.45 * wind;
  return (
    <>
      <Cam pos={[BRIDE_T[0] - 0.4, 1.5, BRIDE_T[2] + 2.5]} look={[BRIDE_T[0], 1.4, BRIDE_T[2] - 0.5]} fov={46} f={f} a={a} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Toy pose={{...idle(f), pos: BRIDE_T, rotY: 0.2, rShoulder: [lerp(-0.62, -1.6 + 1.4 * Math.sin(ang), wind), 0, lerp(0.38, -0.3, wind)], rElbow: lerp(-1.05, -0.2, wind), lShoulder: [-0.3, 0, 0.15], lElbow: -1.5, brow: -0.6, smile: 0.7, head: [0.05, 0, 0.08]}} look={HER_BRIDE} palmRef={palm} />
      <InHand palm={palm}>
        <Bouquet p={[0, -0.02, 0.0]} r={[Math.PI, 0, 0]} s={1.1} />
      </InHand>
      <Ladies f={f} up={1} />
      <Sparkles3D />
    </>
  );
};
const Sparkles3D: React.FC = () => null;
/* "A noiva jogou..." — o buquê sobe feito foguete */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - THROW) / 26);
  const bq: V3 = mix([BRIDE_T[0] + 0.2, 2.2, BRIDE_T[2] - 0.2], [BRIDE_T[0] - 2, 30, BRIDE_T[2] - 12], k * k);
  const pose: Pose = f < THROW ? {rShoulder: [-0.4, 0, -0.2], rElbow: -0.3} : {rShoulder: [-2.9, 0, -0.1], rElbow: -0.1};
  return (
    <>
      <Cam pos={[BRIDE_T[0] + 1.2, 0.9, BRIDE_T[2] + 3.2]} look={[BRIDE_T[0] - 0.2, lerp(1.6, 3.2, k), BRIDE_T[2] - 1]} fov={52} f={f} a={a} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Toy pose={{...idle(f), pos: BRIDE_T, rotY: 0.2, ...pose, lShoulder: [-0.3, 0, 0.15], lElbow: -1.5, brow: -0.3, smile: 1, mouthOpen: f >= THROW ? 0.4 : 0}} look={HER_BRIDE} />
      {f >= THROW && k < 1 && (
        <>
          <Bouquet p={bq} r={[k * 12, k * 5, 0]} s={1.2} />
          {[1, 2, 3, 4, 5].map((i) => {
            const kk = Math.max(0, k - i * 0.03);
            const q = mix([BRIDE_T[0] + 0.2, 2.2, BRIDE_T[2] - 0.2], [BRIDE_T[0] - 2, 30, BRIDE_T[2] - 12], kk * kk);
            return (
              <mesh key={i} position={q}>
                <sphereGeometry args={[0.12 - i * 0.015, 10, 8]} />
                <meshStandardMaterial color="#fff3b0" emissive="#ffd36b" emissiveIntensity={2} transparent opacity={0.8 - i * 0.12} />
              </mesh>
            );
          })}
        </>
      )}
      <Ladies f={f} up={1 - ramp(f, THROW + 4, THROW + 14)} look={ramp(f, THROW, THROW + 8)} />
      <Debris p={[HOLE_AT[0], HALL.h, HOLE_AT[1]]} k={(f - THROW - 8) / 30} />
    </>
  );
};
/* no espaço: o buquê dá a volta na Terra e bate num satélite */
const HIT = at(6, "e", 1) - 8;
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const th = -1.3 + (f - a) * 0.055;
  const R = PLANET_R + 1.5;
  const bq: V3 = [Math.cos(th) * R, Math.sin(th) * R * 0.35, Math.sin(th) * R];
  const satTh = -1.3 + (HIT - a) * 0.055;
  const satBase: V3 = [Math.cos(satTh) * R, Math.sin(satTh) * R * 0.35, Math.sin(satTh) * R];
  const hk = clamp((f - HIT) / 30);
  const sat: V3 = f < HIT ? satBase : [satBase[0] + hk * 3, satBase[1] + hk * 2.2, satBase[2] - hk * 1.5];
  return (
    <>
      <Cam pos={[0, 3.2, 19]} look={[0, 0.2, 0]} fov={54} f={f} a={a} />
      <SpaceScene />
      <Planet t={t} queue={0} n={0} spin={t * 0.1} />
      <Bouquet p={bq} r={[t * 4, t * 3, 0]} s={3.4} />
      {[1, 2, 3, 4, 5, 6].map((i) => {
        const tt = th - i * 0.09;
        return (
          <mesh key={i} position={[Math.cos(tt) * R, Math.sin(tt) * R * 0.35, Math.sin(tt) * R]}>
            <sphereGeometry args={[0.2 - i * 0.025, 10, 8]} />
            <meshStandardMaterial color="#fff3b0" emissive="#ffd36b" emissiveIntensity={2} transparent opacity={0.8 - i * 0.11} />
          </mesh>
        );
      })}
      <Satellite p={sat} r={f < HIT ? [0.3, t * 0.5, 0.2] : [hk * 14, hk * 9, hk * 5]} s={1.9} />
      {f >= HIT && f < HIT + 8 && (
        <mesh position={satBase}>
          <sphereGeometry args={[0.5 + (f - HIT) * 0.08, 12, 10]} />
          <meshStandardMaterial color="#fff3b0" emissive="#ffd36b" emissiveIntensity={2.5} transparent opacity={1 - (f - HIT) / 8} />
        </mesh>
      )}
    </>
  );
};
/* "E o wi-fi do bairro caiu!" — todo mundo olhando o celular; a noiva morrendo de vergonha (rindo) */
const S14: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[BRIDE_T[0] + 0.3, 1.5, BRIDE_T[2] + 2.9]} look={[BRIDE_T[0], 1.25, BRIDE_T[2] - 1]} fov={48} f={f} a={a} />
    <Venue f={f} t={t} target={PARTY} ceremony={false} />
    <Toy pose={{...idle(f), pos: BRIDE_T, rotY: 0, rShoulder: [-1.8, 0, 0.45], rElbow: -2.0, lShoulder: [-0.3, 0, 0.15], lElbow: -1.2, blink: 0.85, smile: 1, mouthOpen: 0.2 + 0.15 * Math.abs(Math.sin(t * 9)), brow: 0.8, head: [0.15, 0, 0.1 * Math.sin(t * 6)]}} look={HER_BRIDE} />
    {LADIES.map(([x, z, ry], i) => (
      <group key={i}>
        <Toy pose={{...idle(f + i * 11), pos: [BRIDE_T[0] + x, 0, BRIDE_T[2] + z], rotY: ry, rShoulder: [-1.2, 0, 0.3], rElbow: -1.2, lShoulder: [-1.2, 0, -0.3], lElbow: -1.2, head: [0.5, 0, 0], smile: 0, brow: 0.6, mouthOpen: 0.15}} look={GUESTS[[1, 3, 4, 6][i]]} />
        <group position={[BRIDE_T[0] + x + Math.sin(ry) * 0.42, 1.05, BRIDE_T[2] + z + Math.cos(ry) * 0.42]} rotation={[-0.9, ry, 0]}>
          <mesh>
            <boxGeometry args={[0.13, 0.24, 0.02]} />
            <meshStandardMaterial color="#15161d" />
          </mesh>
          <mesh position={[0, 0, 0.011]}>
            <planeGeometry args={[0.11, 0.2]} />
            <meshStandardMaterial color="#9fd8ff" emissive="#5aa0ff" emissiveIntensity={0.8} />
          </mesh>
        </group>
      </group>
    ))}
  </>
);

/* =================== Nº4 — buffet lácteo =================== */
const BUFFET_P: V3 = [PARTY[0] - 3.2, 0, PARTY[2] - 3.6];
const COW_P: V3 = [BUFFET_P[0], 0, BUFFET_P[2] - 0.62];
const LINE = (k: number): V3 => [BUFFET_P[0] + 0.15 * Math.sin(k), 0, BUFFET_P[2] + 0.66 + k * 0.8];
const LEITE = at(8, "copo");
const BuffetScene: React.FC<{f: number; t: number; cow?: Partial<React.ComponentProps<typeof Cow>["c"]>; palmRef?: React.Ref<THREE.Object3D>; groomPose?: Pose; bridePose?: Pose; lineN?: number; turn?: number}> = ({f, t, cow = {}, palmRef, groomPose = {}, bridePose = {}, lineN = 4, turn = 0}) => (
  <>
    <Venue f={f} t={t} target={BUFFET_P} ceremony={false} />
    <BuffetTable p={BUFFET_P} />
    <Pot p={[BUFFET_P[0] - 0.05, 0.72, BUFFET_P[2] + 0.05]} s={0.8}>
      <Noodles p={[0, 0.62, 0]} s={0.8} strands={5} t={t} />
    </Pot>
    <Cow c={{pos: COW_P, rotY: 0, arms: "hold", armK: 1, chef: true, apron: true, t, blink: blinkCurve(f + 3), mouth: 0.2, ...cow}} palmRef={palmRef} />
    {Array.from({length: lineN}, (_, i) => (
      <Toy key={i} pose={{...idle(f + i * 9), pos: LINE(i), rotY: Math.PI - turn, rShoulder: [-0.8, 0, 0.3], rElbow: -1.1, lShoulder: [-0.8, 0, -0.3], lElbow: -1.1, smile: 0.4 * (1 - turn), brow: 0.3 + 0.6 * turn, mouthOpen: 0.15 * turn, head: [0.35 * turn, 0, 0]}} look={GUESTS[(i + 4) % GUESTS.length]} />
    ))}
    {Array.from({length: lineN}, (_, i) => (
      <group key={"b" + i} position={[LINE(i)[0] + Math.sin(Math.PI - turn) * 0.42, 0.88, LINE(i)[2] + Math.cos(Math.PI - turn) * 0.42]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.07, 0.07, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <Noodles p={[0, 0.04, 0]} s={0.25} strands={3} t={t} />
      </group>
    ))}
    <Toy pose={{...idle(f), pos: LINE(lineN), rotY: Math.PI, smile: 0.6, ...groomPose}} look={GROOM} />
    <Toy pose={{...idle(f + 37), pos: [LINE(lineN)[0] + 0.6, 0, LINE(lineN)[2] + 0.7], rotY: 0.95, smile: 0.8, ...HOLD, ...bridePose}} look={HER_BRIDE} />
  </>
);
const S15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[BUFFET_P[0] + 3.4, 2.1, BUFFET_P[2] + 1.9]} look={[BUFFET_P[0] + 0.1, 1.3, BUFFET_P[2] + 0.3]} fov={50} f={f} a={a} />
    <BuffetScene f={f} t={t} cow={{arms: "up", armK: 0.6 + 0.2 * Math.sin(t * 5), mouth: 0.4}} />
  </>
);
const S16: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[BUFFET_P[0] - 1.0, 2.0, BUFFET_P[2] + 2.5]} look={[BUFFET_P[0], 1.45, BUFFET_P[2] - 0.5]} fov={46} f={f} a={a} />
    <BuffetScene f={f} t={t} cow={{arms: "give", armK: 0.6 + 0.4 * Math.abs(Math.sin(t * 3)), mouth: 0.3}} />
  </>
);
/* "Ela só serve miojo..." — close nas tigelas e no convidado confuso */
const S17: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[BUFFET_P[0] - 1.45, 1.8, BUFFET_P[2] + 1.15]} look={[BUFFET_P[0] - 0.1, 1.3, BUFFET_P[2] - 0.45]} fov={46} f={f} a={a} />
    <BuffetScene f={f} t={t} cow={{arms: "give", armK: 0.5 + 0.4 * Math.abs(Math.sin(t * 4)), mouth: 0.3}} />
  </>
);
/* "...e o último da fila ganha um copo de leite!" — a noiva rindo e consolando */
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const give = ramp(f, LEITE - 10, LEITE);
  const pat = ramp(f, LEITE + 6, LEITE + 12);
  const groomP = LINE(0);
  return (
    <>
      {f < LEITE + 12 ? (
        <Cam pos={[groomP[0] + 2.4, 1.75, groomP[2] + 1.7]} look={[groomP[0] - 0.05, 1.3, groomP[2] - 0.7]} fov={48} f={f} a={a} />
      ) : (
        <Cam pos={[groomP[0] + 0.6 + 0.81 * 2.0, 1.55, groomP[2] + 0.7 + 0.58 * 2.0]} look={[groomP[0] + 0.6, 1.35, groomP[2] + 0.7]} fov={44} f={f} a={LEITE + 12} />
      )}
      <BuffetScene
        f={f}
        t={t}
        lineN={0}
        cow={{arms: give > 0.05 ? "give" : "hold", armK: 1, mouth: 0.2}}
        palmRef={palm}
        groomPose={{rShoulder: [-1.0 * give, 0, -0.1], rElbow: -0.9 * give, brow: 0.8, smile: 0, mouthOpen: 0.15, bags: 0.5}}
        bridePose={{rShoulder: [-1.75, 0, 0.5], rElbow: -2.05, lShoulder: [-0.5, 0, 0.15], lElbow: -1.5, blink: pat > 0.5 ? 0.55 : 0, smile: 1, mouthOpen: 0.35 + 0.25 * pat * Math.abs(Math.sin(t * 9)), brow: 0.7, eyeWide: 0, head: [-0.18 * pat, 0, 0.1 * Math.sin(t * 8) * pat], torso: [-0.06 * pat * Math.abs(Math.sin(t * 9)), 0, 0]}}
      />
      <InHand palm={palm}>
        <MilkGlass p={[0, -0.12, 0]} s={1.1} />
      </InHand>
    </>
  );
};

/* =================== Nº5 — lua de mel antecipada =================== */
const STAGE_P: V3 = [PARTY[0], 0, PARTY[2] - 6.2];
const MAGO_P: V3 = [STAGE_P[0] - 0.75, 0.24, STAGE_P[2] + 0.1];
const NOIVO_P: V3 = [STAGE_P[0] + 0.75, 0.24, STAGE_P[2] + 0.15];
const BRIDE_M: V3 = [STAGE_P[0] + 0.5, 0, STAGE_P[2] + 2.3];
const SUMIR = at(10, "sumir");
const Magician: React.FC<{f: number; t: number; wave?: number; palmRef?: React.Ref<THREE.Object3D>}> = ({f, t, wave = 0, palmRef}) => (
  <>
    <Cape p={MAGO_P} rotY={0.35} t={t} />
    <Toy pose={{...idle(f + 23), pos: MAGO_P, rotY: 0.35, rShoulder: [-1.4 - 0.3 * Math.sin(t * 9) * wave, 0, -0.2], rElbow: -0.3, lShoulder: [-0.4, 0, 0.6], lElbow: -1.2, smile: 1, brow: -0.4, mouthOpen: 0.2 * wave}} look={{suit: true, shirt: "#5b2be0", pants: "#15161d", shoe: "#15161d", sole: "#15161d", hair: "#1a1a1a", hairStyle: "buzz", skin: "#f1c8a0"}} palmRef={palmRef} headExtra={<MagicianHat />} />
  </>
);
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const clap = Math.abs(Math.sin(t * 9)) * ramp(f, a + 10, a + 16);
  return (
    <>
      <Cam pos={[STAGE_P[0] + 3.8, 1.7, STAGE_P[2] + 1.9]} look={[STAGE_P[0] + 0.3, 1.3, STAGE_P[2] + 1.45]} fov={56} f={f} a={a} />
      <Venue f={f} t={t} target={STAGE_P} ceremony={false} />
      <MagicStage p={STAGE_P} />
      <Magician f={f} t={t} />
      <Toy pose={{...idle(f), pos: BRIDE_M, rotY: Math.PI - 0.55, rShoulder: [-1.0, 0, 0.3 + 0.25 * clap], rElbow: -1.3, lShoulder: [-1.0, 0, -0.3 - 0.25 * clap], lElbow: -1.3, smile: 1, eyeWide: 0.4, head: [0, -0.4, 0]}} look={HER_BRIDE} />
      <Toy pose={{...idle(f + 7), pos: [BRIDE_M[0] - 0.8, 0, BRIDE_M[2] - 0.1], rotY: Math.PI + 0.2, smile: 0.9, rShoulder: [-0.6, 0, -0.3], rElbow: -1.0}} look={GROOM} />
    </>
  );
};
/* "Não contrate um mágico pra festa." — o noivo de voluntário no palco */
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[STAGE_P[0] + 0.2, 1.55, STAGE_P[2] + 3.4]} look={[STAGE_P[0], 1.35, STAGE_P[2]]} fov={46} f={f} a={a} />
      <Venue f={f} t={t} target={STAGE_P} ceremony={false} />
      <MagicStage p={STAGE_P} />
      <Magician f={f} t={t} wave={ramp(f, a + 20, a + 30)} palmRef={palm} />
      <InHand palm={palm}>
        <Wand glow={ramp(f, a + 20, a + 40)} />
      </InHand>
      <Toy pose={{...idle(f), pos: NOIVO_P, rotY: -0.25, smile: 0.8, brow: 0.5, rShoulder: [-0.4, 0, -0.2], lShoulder: [-0.4, 0, 0.2], rElbow: -0.6, lElbow: -0.6}} look={GROOM} />
    </>
  );
};
/* "Ele faz o noivo sumir..." — PUF! sobram só os sapatos; a noiva em choque */
const S21: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const gone = f >= SUMIR + 4;
  const shock = ramp(f, SUMIR + 6, SUMIR + 12);
  const reverse = f >= SUMIR + 16;
  return (
    <>
      {reverse ? <Cam pos={[BRIDE_M[0] + 0.1, 1.62, BRIDE_M[2] - 1.35]} look={[BRIDE_M[0], 1.5, BRIDE_M[2]]} fov={42} f={f} a={SUMIR + 16} /> : <Cam pos={[STAGE_P[0] + 0.2, 1.55, STAGE_P[2] + 3.4]} look={[STAGE_P[0], 1.35, STAGE_P[2]]} fov={46} f={f} a={a} punch={0} />}
      <Venue f={f} t={t} target={STAGE_P} ceremony={false} />
      <MagicStage p={STAGE_P} />
      <Magician f={f} t={t} wave={1} palmRef={palm} />
      <InHand palm={palm}>
        <Wand glow={1} />
      </InHand>
      {!gone && <Toy pose={{...idle(f), pos: NOIVO_P, rotY: -0.25, smile: 0.6, eyeWide: ramp(f, SUMIR - 6, SUMIR), brow: 0.8}} look={GROOM} />}
      {gone &&
        [-1, 1].map((sd) => (
          <mesh key={sd} position={[NOIVO_P[0] + 0.125 * sd, NOIVO_P[1] + 0.06, NOIVO_P[2] + 0.05]}>
            <boxGeometry args={[0.2, 0.12, 0.34]} />
            <meshStandardMaterial color="#15161d" roughness={0.4} />
          </mesh>
        ))}
      <Puff p={[NOIVO_P[0], NOIVO_P[1], NOIVO_P[2]]} k={(f - SUMIR) / 26} />
      <Toy pose={{...idle(f), pos: BRIDE_M, rotY: Math.PI - 0.15, ...(shock > 0.5 ? CHEEKS : HOLD), eyeWide: shock, mouthOpen: 0.7 * shock, brow: shock, smile: 1 - shock}} look={HER_BRIDE} />
      {shock < 0.5 && <BouquetFront pos={BRIDE_M} rotY={Math.PI - 0.15} />}
    </>
  );
};
/* "...e a lua de mel começa mais cedo. Na Lua!" */
const NOIVO_LUA: V3 = [0.4, 0, 0.2];
const ALIEN_L: V3 = [1.5, 0, -0.5];
const S22: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const out = ramp(f, at(10, "na") - 4, at(10, "lua", 1) + 10);
  return (
    <>
      <Cam pos={[lerp(0.95, 1.6, out), lerp(1.5, 2.6, out), lerp(3.6, 7.5, easeInOut(out))]} look={[0.95, lerp(1.1, 1.6, out), -0.15]} fov={52} f={f} a={a} />
      <MoonScene t={t} />
      <Crater p={[ALIEN_L[0] + 0.9, 0, ALIEN_L[2] - 0.6]} r={0.6} />
      <Toy pose={{...idle(f), pos: NOIVO_LUA, rotY: 0.35, rShoulder: [-1.0, 0, -0.1], rElbow: -1.1, lShoulder: [-0.2, 0, 0.3], lElbow: -0.4, eyeWide: 0.7, brow: 1, mouthOpen: 0.3, head: [0, 0.4, 0]}} look={GROOM} palmRef={palm} headExtra={<Helmet />} />
      <InHand palm={palm}>
        <group position={[0, -0.02, 0.06]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.12, 3, 1, false, 0, Math.PI / 3]} />
            <meshStandardMaterial color="#fffaf2" roughness={0.5} />
          </mesh>
        </group>
      </InHand>
      <Alien a={{pos: ALIEN_L, rotY: -0.7, offer: 0.6 + 0.3 * Math.sin(t * 6), t, blink: blinkCurve(f + 11), mouth: 0.3}} />
    </>
  );
};

/* =================== Parabéns =================== */
const S23: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 260);
  const tap = Math.max(0, Math.sin(t * 10)) * 0.25;
  const lookUp = ramp(f, at(11, "noivo", 1) - 4, at(11, "noivo", 1) + 6);
  return (
    <>
      <Cam pos={[PARTY[0] + lerp(0.0, 0.2, k), 1.7, PARTY[2] + lerp(5.0, 4.5, k)]} look={[PARTY[0], 1.2, PARTY[2] - 0.2]} fov={50} f={f} a={a} />
      <RoundTable p={[PARTY[0] + 1.3, 0, PARTY[2] + 0.2]} />
      <Venue f={f} t={t} target={PARTY} ceremony={false} />
      <Toy pose={{...idle(f), pos: [PARTY[0], 0, PARTY[2] + 1.2], rotY: 0, ...CROSSED, brow: lerp(-0.6, 0.6, lookUp), smile: 0.4, head: [-0.5 * lookUp, 0, 0], legLift: 0, rShoulder: CROSSED.rShoulder, torso: [0, 0, 0.03 * Math.sin(t * 10)]}} look={HER_BRIDE} />
      <mesh position={[PARTY[0] + 0.12, 0.02 + tap * 0.1, PARTY[2] + 1.35]} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <Dog d={{pos: [PARTY[0] - 1.25, 0, PARTY[2] + 0.7], rotY: 0.3, bowtie: true, t, tail: 1, mouth: 0.2, tongue: 0.8, blink: blinkCurve(f + 5)}} s={0.9} />
      <WeddingPigeon p={{pos: [PARTY[0] + 1.12, 0.675, PARTY[2] + 0.3], rotY: 0.3, hat: true, rings: true, chest: 0.5, t, bob: 1, blink: blinkCurve(f)}} s={1.3} />
      <WeddingPigeon p={{pos: [PARTY[0] + 1.5, 0.675, PARTY[2] + 0.25], rotY: -0.2, veil: true, t, bob: 1, blink: blinkCurve(f + 9)}} s={1.2} />
      <Dino p={{pos: [PARTY[0] - 1.9, 0, PARTY[2] - 1.4], rotY: 0.4, priest: true, t, arms: 0.5 + 0.3 * Math.sin(t * 4), jaw: 0.3, blink: blinkCurve(f + 41)}} s={0.8} />
      <Cow c={{pos: [PARTY[0] + 2.0, 0, PARTY[2] - 1.3], rotY: -0.4, arms: "up", armK: 0.6 + 0.2 * Math.sin(t * 4), chef: true, apron: true, t, mouth: 0.4, blink: blinkCurve(f + 3)}} />
      <PartyGuests f={f} t={t} react={0.3} />
    </>
  );
};
/* "Mas relaxa... a noiva foi te buscar de foguete." */
const ROCKET_L: V3 = [-1.5, 0, -1.2];
const LAND = L(12) + 34;
const S24: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (LAND - a));
  const y = lerp(7, 0, 1 - (1 - k) * (1 - k));
  const flame = f < LAND + 6 ? 1 : 1 - ramp(f, LAND + 6, LAND + 16);
  const out = ramp(f, LAND + 14, LAND + 30);
  const brideP: V3 = [ROCKET_L[0] + 0.7 + 0.6 * out, 0, ROCKET_L[2] + 0.75 + 0.3 * out];
  const run = ramp(f, LAND + 20, LAND + 50);
  const groomP: V3 = mix(NOIVO_LUA, [brideP[0] + 0.85, 0, brideP[2] + 0.05], easeInOut(run));
  return (
    <>
      <Cam pos={[0.2, 1.6, 5.4]} look={[-0.4, lerp(2.2, 1.2, k), -0.6]} fov={50} f={f} a={a} />
      <MoonScene t={t} />
      <Rocket p={[ROCKET_L[0], y, ROCKET_L[2]]} rotY={0.6} flame={flame} t={t} />
      <Dust p={ROCKET_L} k={(f - LAND) / 30} />
      {out > 0.01 && (
        <>
          <Toy pose={{...idle(f), pos: brideP, rotY: 0.6, rShoulder: [-2.6, 0, -0.4], rElbow: -0.2, lShoulder: [-0.62, 0, -0.38], lElbow: -1.05, smile: 1, brow: 0.4, mouthOpen: 0.3}} look={HER_BRIDE} headExtra={<Helmet />} />
        </>
      )}
      <Toy pose={{...idle(f), pos: groomP, rotY: run > 0.02 ? -1.6 : 0.35, walk: run > 0.02 && run < 0.98 ? t * 12 : 0, walkAmt: run > 0.02 && run < 0.98 ? 1 : 0, rShoulder: [-1.2 * run, 0, -0.2], lShoulder: [-1.2 * run, 0, 0.2], eyeWide: 0.6, smile: 1, mouthOpen: 0.4 * run}} look={GROOM} headExtra={<Helmet />} />
      <Alien a={{pos: ALIEN_L, rotY: -0.7, t, blink: blinkCurve(f + 11), mouth: 0.3}} />
    </>
  );
};
/* "Afinal, ela casou com você mesmo sabendo dessas..." — abraço com coraçõezinhos */
const S25: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (TOTAL_CASA - a));
  const c: V3 = [ROCKET_L[0] + 1.75, 0, ROCKET_L[2] + 1.1];
  return (
    <>
      <Cam pos={[c[0] + 0.15, 1.6, c[2] + lerp(3.0, 2.4, k)]} look={[c[0], 1.4, c[2]]} fov={44} f={f} a={a} />
      <MoonScene t={t} />
      <Rocket p={ROCKET_L} rotY={0.6} t={t} />
      <Toy pose={{...idle(f), pos: [c[0] - 0.47, 0, c[2]], rotY: Math.PI / 2 - 0.25, rShoulder: [-1.15, 0, 0.15], rElbow: -0.2, lShoulder: [-1.15, 0, -0.15], lElbow: -0.2, smile: 1, blink: 0.85, head: [0.05, 0.25, 0.1]}} look={HER_BRIDE} headExtra={<Helmet />} />
      <Toy pose={{...idle(f + 9), pos: [c[0] + 0.47, 0, c[2]], rotY: -Math.PI / 2 + 0.25, rShoulder: [-1.15, 0, 0.15], rElbow: -0.2, lShoulder: [-1.15, 0, -0.15], lElbow: -0.2, smile: 1, blink: 0.85, head: [0.05, -0.25, -0.1]}} look={GROOM} headExtra={<Helmet />} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "a", 0), Comp: S1},
  {from: L(1), Comp: S2},
  {from: at(1, "nunca"), Comp: S3},
  {from: L(2), Comp: S4},
  {from: at(2, "e", 0), Comp: S5},
  {from: L(3), Comp: S6},
  {from: at(3, "nao"), Comp: S7},
  {from: L(4), Comp: S8},
  {from: at(4, "que"), Comp: S9},
  {from: L(5), Comp: S10},
  {from: at(5, "cuidado"), Comp: S11},
  {from: L(6), Comp: S12},
  {from: at(6, "e", 0), Comp: S13},
  {from: at(6, "e", 1), Comp: S14},
  {from: L(7), Comp: S15},
  {from: at(7, "nunca"), Comp: S16},
  {from: L(8), Comp: S17},
  {from: at(8, "e", 0), Comp: S18},
  {from: L(9), Comp: S19},
  {from: at(9, "nao"), Comp: S20},
  {from: L(10), Comp: S21},
  {from: at(10, "e", 0), Comp: S22},
  {from: L(11), Comp: S23},
  {from: L(12), Comp: S24},
  {from: at(12, "afinal"), Comp: S25},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CASA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["cinco", "coisas", "nao", "casamento", "verdade", "alianca", "fugitiva", "cachorro", "aliancas", "pombo", "correndo", "noivo", "valsa", "turbo", "encerado", "rapido", "tornado", "festa", "inteira", "buque", "orbital", "forca", "jogou", "volta", "terra", "wifi", "caiu", "buffet", "lacteo", "vaca", "miojo", "ultimo", "copo", "leite", "lua", "mel", "antecipada", "magico", "sumir", "cedo", "parabens", "orbita", "relaxa", "noiva", "foguete", "casou", "dessas"]);
/** coraçõezinhos subindo */
const Hearts: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 9}, (_, i) => {
        const k = (((f - from) / 40 + i / 9) % 1);
        const s = (0.6 + 0.5 * ((i * 37) % 10) / 10) * Math.sin(Math.min(1, k * 3) * Math.PI * 0.5);
        const cx = x + Math.sin(i * 2.3 + k * 4) * 220;
        const cy = y - k * 520;
        return (
          <g key={i} transform={`translate(${cx},${cy}) scale(${s})`} opacity={1 - k * k}>
            <path d="M 0 30 C -60 -10, -40 -60, 0 -28 C 40 -60, 60 -10, 0 30 Z" fill={i % 2 ? "#ff4d6d" : "#ff8fab"} stroke="#101018" strokeWidth={6} />
          </g>
        );
      })}
    </svg>
  );
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
export const VideoCasamento: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(1), L(3), L(5), L(7), L(9)];
  const pb = L(11);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={3} to={at(0, "a", 0) - 3} lines={["5 COISAS", "NO CASAMENTO"]} />
      <StageTitle from={L(1) + 4} to={at(1, "nunca") - 3} kicker="Nº 1" lines={["ALIANÇA", "FUGITIVA"]} />
      <StageTitle from={L(3) + 4} to={at(3, "nao") - 3} kicker="Nº 2" lines={["VALSA", "TURBO"]} />
      <StageTitle from={L(5) + 4} to={at(5, "cuidado") - 3} kicker="Nº 3" lines={["BUQUÊ", "ORBITAL"]} />
      <StageTitle from={L(7) + 4} to={at(7, "nunca") - 3} kicker="Nº 4" lines={["BUFFET", "LÁCTEO"]} />
      <StageTitle from={L(9) + 4} to={at(9, "nao") - 3} kicker="Nº 5" lines={["LUA DE MEL", "ANTECIPADA"]} />

      <Chip from={at(6, "wifi") - 2} to={L(7) - 2} text="📶❌ SEM WI-FI" bg="#5a6b8a" top={300} size={90} />
      <Chip from={at(8, "copo") - 2} to={L(9) - 2} text="🥛 1 COPO DE LEITE" bg="#3a86ff" top={160} size={80} />
      <Chip from={SUMIR + 4} to={at(10, "e", 0) - 2} text="PUF! ✨" bg="#5b2be0" top={300} size={110} />
      <Sparkles from={L(9)} to={at(9, "nao") - 2} x={540} y={900} r={320} />
      <Confetti from={pb} to={pb + 110} />
      <Chip from={pb + 1} to={at(11, "pombo") - 3} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(11, "pombo")} to={L(12) - 2} x={190} y={420} rot={-6} label="POMBO NOIVO">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={20} rx={60} ry={42} fill="#8f97a5" stroke="#101018" strokeWidth={6} />
          <circle cx={30} cy={-25} r={28} fill="#a1a9b6" stroke="#101018" strokeWidth={6} />
          <rect x={14} y={-90} width={34} height={42} fill="#15161d" />
          <rect x={4} y={-52} width={54} height={8} fill="#15161d" />
          <circle cx={38} cy={-28} r={5} fill="#101018" />
        </g>
      </Sticker>
      <Sticker from={at(11, "valsa")} to={L(12) - 2} x={540} y={400} rot={4} label="VALSA TORNADO">
        <g transform="translate(152,105)" stroke="#8fb3d9" strokeWidth={12} fill="none" strokeLinecap="round">
          <path d="M -80 -70 Q 0 -90 80 -70" />
          <path d="M -60 -30 Q 0 -45 60 -30" />
          <path d="M -40 10 Q 0 0 40 10" />
          <path d="M -20 50 Q 0 42 20 50" />
        </g>
      </Sticker>
      <Sticker from={at(11, "buque")} to={L(12) - 2} x={890} y={430} rot={6} label="BUQUÊ EM ÓRBITA">
        <g transform="translate(152,105)">
          <circle r={55} fill="#2f8fe0" stroke="#101018" strokeWidth={6} />
          <ellipse rx={95} ry={28} fill="none" stroke="#ffd21f" strokeWidth={6} strokeDasharray="14 10" />
          <circle cx={85} cy={-12} r={16} fill="#ffb3c6" stroke="#101018" strokeWidth={4} />
        </g>
      </Sticker>
      <Sticker from={at(11, "buffet")} to={L(12) - 2} x={250} y={1620} rot={-4} label="BUFFET DE MIOJO">
        <g transform="translate(152,105)">
          <path d="M -70 -10 Q 0 80 70 -10 Z" fill="#ffffff" stroke="#101018" strokeWidth={6} />
          <path d="M -50 -15 q 10 -25 20 0 q 10 -25 20 0 q 10 -25 20 0 q 10 -25 20 0" stroke="#e6b84a" strokeWidth={8} fill="none" />
        </g>
      </Sticker>
      <Sticker from={at(11, "noivo", 1)} to={L(12) - 2} x={830} y={1620} rot={5} label="NOIVO NA LUA">
        <g transform="translate(152,105)">
          <circle r={62} fill="#c9c9d1" stroke="#101018" strokeWidth={6} />
          <circle cx={-20} cy={-15} r={12} fill="#9a9aa3" />
          <circle cx={25} cy={20} r={9} fill="#9a9aa3" />
          <rect x={-14} y={-90} width={28} height={30} fill="#15161d" />
        </g>
      </Sticker>
      <Hearts from={at(12, "afinal")} to={TOTAL_CASA} x={540} y={1050} />

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozcasa.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 12) * (1 - ramp(fr, TOTAL_CASA - 20, TOTAL_CASA))} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FX * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FX * 0.75} />
      ))}
      <SND src="sfx12/bells.mp3" from={0} dur={90} v={FX * 0.45} />
      <SND src="sfx12/aww.mp3" from={at(1, "nunca") + 6} dur={60} v={FX * 0.5} />
      <SND src="sfx8/coo.mp3" from={POMBO - 6} dur={45} v={FX * 0.6} />
      <SND src="sfx11/bark.mp3" from={RUN - 2} dur={36} v={FX * 0.6} />
      <SND src="sfx12/gasp.mp3" from={RUN + 2} dur={45} v={FX * 0.5} />
      <SND src="sfx8/wings.mp3" from={RUN + 4} dur={40} v={FX * 0.5} />
      <SND src="sfx12/slip.mp3" from={at(3, "encerado") - 4} dur={45} v={FX * 0.6} />
      <SND src="sfx12/tornado.mp3" from={L(4)} dur={L(5) - L(4)} v={FX * 0.55} />
      <SND src="sfx12/throw.mp3" from={THROW - 1} dur={45} v={FX * 0.7} />
      <SND src="sfx12/satellite.mp3" from={HIT - 1} dur={45} v={FX * 0.7} />
      <SND src="sfx12/sadcrowd.mp3" from={at(6, "caiu") - 4} dur={60} v={FX * 0.5} />
      <SND src="sfx10/moo.mp3" from={L(7) + 10} dur={60} v={FX * 0.42} />
      <SND src="sfx10/plim.mp3" from={LEITE + 2} dur={30} v={FX * 0.8} />
      <SND src="sfx12/tada.mp3" from={L(9) + 4} dur={45} v={FX * 0.55} />
      <SND src="sfx12/poof.mp3" from={SUMIR} dur={45} v={FX * 0.8} />
      <SND src="sfx12/gasp.mp3" from={SUMIR + 8} dur={45} v={FX * 0.5} />
      <SND src="sfx7/confetti.mp3" from={pb - 2} dur={61} v={FX * 0.6} />
      {[at(11, "pombo"), at(11, "valsa"), at(11, "buque"), at(11, "buffet"), at(11, "noivo", 1)].map((p, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={p} dur={22} v={FX * 0.55} />
      ))}
      <SND src="sfx11/rocket.mp3" from={L(12)} dur={80} v={FX * 0.6} />
      <SND src="sfx12/kiss.mp3" from={at(12, "afinal") + 6} dur={36} v={FX * 0.6} />
    </AbsoluteFill>
  );
};
