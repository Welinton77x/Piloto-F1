import React from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, V3, LampPost} from "./Sets5";
import {Pot, Noodles} from "./Sets8";
import {Phone} from "./Sets12";
import {Shades} from "./Sets11";
import {Bathroom, ElectricShower, Sparks, Bolt, SteamJet, Poraque, PoraqueP, Aquarium, Tucano, ShowerCap, TowelShoulder, AstroHelmet, EvaHelmet, EvaGear, PlainCar, Dam, SHOWER_P, WINDOW_B} from "./Sets14";
import {Captions, StageTitle, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingChuveiro.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_CHUV = F(words[words.length - 1].e + 0.8);

const BOYL: ToyLook = {hoodie: true};
const ASTRO: ToyLook = {shirt: "#f4f4f2", pants: "#f4f4f2", shoe: "#f4f4f2", sole: "#c9ced6"};
const PEOPLE: ToyLook[] = [
  {shirt: "#ff6fb1", pants: "#2b2e3b", hairStyle: "ponytail", hair: "#5a2a14", lashes: true, lips: "#d4486a"},
  {shirt: "#2ecc71", pants: "#f4f4f2", hairStyle: "curly", hair: "#1a1a1a", skin: "#a8714a"},
  {shirt: "#3a86ff", pants: "#3a3d48", hairStyle: "spiky", hair: "#3b2416", skin: "#e0b088"},
  {shirt: "#ffd21f", pants: "#6b5b45", hairStyle: "bun", hair: "#2a1a10", lashes: true, lips: "#c0392b", skin: "#c98f62"},
  {shirt: "#c39bd3", pants: "#1d1f27", hairStyle: "buzz", hair: "#1a1a1a", skin: "#8d5a3b"},
  {shirt: "#ff8a1f", pants: "#2f55b0", hairStyle: "bowl", hair: "#6a3a1a"},
];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const OFFER: Pose = {rShoulder: [-1.28, 0.98, 0.1], rElbow: -0.47};
const POT_HAND: V3 = [-0.22, 1.12, 0.55];
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const SHOCK: Pose = {rShoulder: [-0.4, 0, -1.0], rElbow: -0.3, lShoulder: [-0.4, 0, 1.0], lElbow: -0.3, eyeWide: 1, mouthOpen: 0.7, brow: 1, hairLift: 1};

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};
const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 500;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};

/* ---------- ambientes ---------- */
const BathScene: React.FC<{t: number; steam?: number; dark?: number; flicker?: number}> = ({steam = 0, dark = 0, flicker = 0, t}) => {
  const fl = flicker > 0 && Math.sin(t * 40) > 0.3 ? 0.4 : 1;
  return (
    <>
      <color attach="background" args={[dark > 0.5 ? "#0b1030" : "#dff3fb"]} />
      <hemisphereLight args={["#f2fbff", "#7a8aa0", (dark > 0.5 ? 0.45 : 1.0) * fl]} />
      <pointLight position={[0, 3.0, 0.6]} intensity={(dark > 0.5 ? 4 : 11) * fl} distance={10} decay={1.4} color="#fff6e8" castShadow shadow-mapSize={[1024, 1024]} />
      <Bathroom steam={steam} dark={dark} />
    </>
  );
};
const FX = -20;
const StreetScene: React.FC<{t: number; dark?: number; lit?: boolean}> = ({t, dark = 0, lit = false}) => (
  <>
    {dark > 0.5 ? <Sky top="#05081c" bottom="#1a2050" /> : <Sky />}
    <fog attach="fog" args={[dark > 0.5 ? "#10142c" : "#cdeeff", 30, 130]} />
    {dark < 0.5 && <SunDisc p={[-40, 45, -110]} r={6} />}
    <hemisphereLight args={[dark > 0.5 ? "#4a5aa0" : "#d6ecff", dark > 0.5 ? "#101020" : "#a08a5e", dark > 0.5 ? (lit ? 0.7 : 0.25) : 1.2]} />
    <SunLight target={[FX, 1, 0]} dir={[-6, 10, 7]} intensity={dark > 0.5 ? (lit ? 0.6 : 0.12) : 2.6} color={dark > 0.5 ? "#9fb4ff" : "#fff1d6"} ext={10} />
    <Town t={t} galo={false} variant="nova" dark={dark > 0.5} lit={lit ? () => true : undefined} lamps={dark < 0.5 || lit} />
  </>
);
const Boy: React.FC<{pose: Pose; look?: ToyLook; extra?: React.ReactNode}> = ({pose, look = BOYL, extra}) => (
  <Toy
    pose={pose}
    look={look}
    headExtra={
      extra ?? (
        <>
          <ShowerCap />
          <TowelShoulder />
        </>
      )
    }
  />
);

/* =================== 1 — chuveiro dando choque, o poraquê eletricista =================== */
const CHOQUE0 = at(0, "choque");
const ENTAO0 = at(0, "entao");
const PORAQUE0 = at(0, "poraque");
const BOY_SH: V3 = [-1.0, 0.08, -1.35];
const zap = (f: number, at0: number) => (f >= at0 - 2 && f < at0 + 22 ? 1 : 0);
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const z = zap(f, CHOQUE0);
  const pose: Pose = z ? {...idle(f), pos: BOY_SH, rotY: 0.15, ...SHOCK, torso: [0, 0, 0.06 * Math.sin(t * 50)]} : {...idle(f), pos: BOY_SH, rotY: 0.15, rShoulder: [-2.2, 0, 0.3], rElbow: -1.0, smile: f < CHOQUE0 ? 0.8 : 0, brow: f < CHOQUE0 ? 0 : 0.6, head: [-0.2, 0, 0]};
  return (
    <>
      <Cam pos={[-0.55, 1.6, 2.4]} look={[-0.9, 1.5, -1.4]} fov={52} f={f} a={a} />
      <BathScene t={t} flicker={z} />
      <ElectricShower t={t} spark={z} shake={z} />
      <Boy pose={pose} />
      {z > 0 && <Bolt a={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.35]} b={[BOY_SH[0], 2.0, BOY_SH[2] + 0.05]} k={1} t={t} />}
    </>
  );
};
const AQ_IN = (f: number): V3 => [lerp(2.8, 0.75, easeOut(ramp(f, ENTAO0 + 30, PORAQUE0 + 2))), 0, -0.35];
const PoraqueInTank: React.FC<{p: V3; rotY?: number; t: number; f: number; po?: PoraqueP; spin?: number}> = ({p, rotY = -Math.PI / 2, t, f, po = {}, spin = 0}) => (
  <Aquarium p={p} rotY={rotY} spin={spin}>
    <Poraque p={{pos: [0, 0, 0], t, blink: blinkCurve(f + 17), s: 0.85, ...po}} />
  </Aquarium>
);
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const p = AQ_IN(f);
  const pose: Pose = {...idle(f), pos: BOY_SH, rotY: 0.6, rShoulder: [-0.3, 0, -0.3], lShoulder: [-0.3, 0, 0.3], hairLift: 1, brow: 0.6, pupil: [0.8, 0], head: [0, 0.5, 0]};
  return (
    <>
      <Cam pos={[0.1, 1.4, 3.0]} look={[-0.15, 1.0, -0.8]} fov={62} f={f} a={a} />
      <BathScene t={t} />
      <ElectricShower t={t} />
      <Boy pose={pose} />
      <PoraqueInTank p={p} t={t} f={f} spin={-p[0] * 4} po={{mouth: f > PORAQUE0 ? 0.4 : 0, rotY: 0.6}} />
    </>
  );
};
/* "Mas o poraquê dá um choque tão forte... que o chuveiro esquenta, esquenta..." */
const CHOQUE1 = at(1, "choque");
const ESQ = at(1, "esquenta", 0);
const E1 = at(1, "e", 0);
const heatK = (f: number) => ramp(f, ESQ, E1);
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const z = f >= CHOQUE1 - 4 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.7, 1.75, 2.4]} look={[-0.45, 1.5, -1.3]} fov={56} f={f} a={a} />
      <BathScene t={t} flicker={z * (1 - heatK(f))} />
      <ElectricShower t={t} heat={heatK(f)} spark={z} shake={z} />
      <PoraqueInTank p={[0.15, 0, -0.55]} t={t} f={f} po={{glow: z, mouth: 0.5 * z, rotY: 0.9, wiggle: 2}} />
      {z > 0 && <Bolt a={[0.05, 1.15, -0.4]} b={[SHOWER_P[0] + 0.1, SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.35]} k={1} t={t} />}
    </>
  );
};
/* "...e vira um vulcão de água fervendo." */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a + 2, a + 10);
  const pose: Pose = {...idle(f), pos: [0.25, 0, -0.2], rotY: -0.4, ...SHOCK, heat: k};
  return (
    <>
      <Cam pos={[0.1, 1.7, 3.4]} look={[-0.5, 1.6, -1.2]} fov={58} f={f} a={a} punch={4} />
      <BathScene t={t} steam={k * 0.6} />
      <ElectricShower t={t} heat={1} shake={1} />
      <SteamJet p={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.2]} k={k} t={t} spread={0.9} />
      <Boy pose={pose} />
      <PoraqueInTank p={[1.3, 0, -1.0]} t={t} f={f} po={{glow: 0.3, mouth: 0.6, rotY: 0.6}} />
    </>
  );
};
/* título: ERUPÇÃO CHUVEIRAL */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const pose: Pose = {...idle(f), pos: [0.1, 0, 0.2], rotY: 0.1, rShoulder: [-0.2, 0, -0.4], lShoulder: [-0.2, 0, 0.4], heat: 0.8, mouthOpen: 0.3, brow: 0.5, blink: 0.4};
  return (
    <>
      <Cam pos={[0.1, 1.65, 3.6]} look={[-0.2, 1.4, -1.0]} fov={56} f={f} a={a} />
      <BathScene t={t} steam={0.8} />
      <ElectricShower t={t} heat={1} />
      <SteamJet p={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.2]} k={0.7} t={t} spread={0.9} />
      <Boy pose={pose} />
      <PoraqueInTank p={[1.2, 0, -1.0]} t={t} f={f} po={{smile: 1, rotY: 0.4}} />
    </>
  );
};

/* =================== 2 — miojo e a fila dos vizinhos =================== */
const MIOJO = at(3, "miojo");
const E3 = at(3, "e", 0);
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const cooked = f >= at(3, "segundos");
  return (
    <>
      <Cam pos={[-0.7, 1.75, 1.5]} look={[-1.0, 1.25, -1.5]} fov={52} f={f} a={a} />
      <BathScene t={t} steam={0.4} />
      <ElectricShower t={t} heat={1} />
      <SteamJet p={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.2]} k={0.4} t={t} spread={0.5} />
      <Boy pose={{...idle(f), pos: [-1.0, 0.08, -1.0], rotY: 0, ...OFFER, rShoulder: [-1.5, 0.6, 0.1], smile: 1, eyeWide: cooked ? 0.8 : 0}} />
      <Pot p={[-1.15, 1.32, -0.55]} s={0.38} pot={{t}}>
        {cooked && <Noodles p={[0, 0.3, 0]} s={0.9} t={t} />}
      </Pot>
    </>
  );
};
const QUEUE_N = 9;
const Neighbor: React.FC<{p: V3; rotY: number; f: number; t: number; i: number; walk?: number}> = ({p, rotY, f, t, i, walk = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Toy pose={{...idle(f + i * 13), pos: [0, 0, 0], rotY: 0, ...OFFER, smile: 0.8, walk: t * 7 + i, walkAmt: walk}} look={PEOPLE[i % PEOPLE.length]} />
    <Pot p={POT_HAND} s={0.32} pot={{t}} />
  </group>
);
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 90);
  return (
    <>
      <Cam pos={[FX + 2.5, 2.4, 9.5]} look={[FX - 0.5, 1.2, 1.5]} fov={56} f={f} a={a} />
      <StreetScene t={t} />
      {Array.from({length: QUEUE_N}, (_, i) => {
        const x = FX + 3.4 - i * 1.0 + 0.25 * Math.sin(i * 2) + (i > 6 ? k * 0.3 : 0);
        return <Neighbor key={i} p={[x, 0.08, 2.15]} rotY={Math.PI / 2} f={f} t={t} i={i} walk={0} />;
      })}
    </>
  );
};

/* =================== 3 — Paulista travada, o tucano guarda =================== */
const ENTAO4 = at(4, "entao");
const TUCANO4 = at(4, "tucano");
const TUC: V3 = [FX + 1.58, 0.98, 2.1];
const TS = 0.45; // tucano no tamanho de verdade
const Podium: React.FC = () => (
  <group position={[TUC[0], 0.08, TUC[2]]}>
    <mesh position={[0, 0.45, 0]}>
      <cylinderGeometry args={[0.32, 0.36, 0.9, 20]} />
      <meshStandardMaterial color="#f4f4f2" roughness={0.6} />
    </mesh>
    {[0.25, 0.55].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <cylinderGeometry args={[0.345, 0.35, 0.1, 20]} />
        <meshStandardMaterial color="#e8414f" roughness={0.6} />
      </mesh>
    ))}
  </group>
);
const POST: V3 = [FX + 1.9, 0.08, 2.25];
const Jam: React.FC<{t: number}> = ({t}) => (
  <>
    {[-7.5, -3.6, 0.3, 4.2, 8.1].map((x, i) => (
      <PlainCar key={"a" + i} p={[FX + x, 0, -0.75]} rotY={Math.PI / 2} color={["#e8414f", "#3a86ff", "#ffd21f", "#2ecc71", "#f4f4f2"][i]} s={0.85} />
    ))}
    {[-5.5, -1.6, 2.3, 6.2].map((x, i) => (
      <PlainCar key={"b" + i} p={[FX + x, 0, 0.8]} rotY={-Math.PI / 2} color={["#9b59b6", "#ff8a1f", "#1d1f27", "#e8414f"][i]} s={0.85} />
    ))}
  </>
);
const S7: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.5, 3.2, 10.5]} look={[FX, 1.0, 0.5]} fov={58} f={f} a={a} />
    <StreetScene t={t} />
    <Jam t={t} />
    {Array.from({length: 7}, (_, i) => (
      <Neighbor key={i} p={[FX + 3.2 - i * 1.05, 0.08, 2.2]} rotY={Math.PI / 2} f={f} t={t} i={i} />
    ))}
  </>
);
const tucIn = (f: number): V3 => {
  const k = easeOut(ramp(f, ENTAO4, TUCANO4 - 2));
  return [lerp(FX - 2.5, TUC[0], k), TUC[1] + 1.6 * Math.sin(k * Math.PI) * (1 - k) + 1.2 * (1 - k), TUC[2]];
};
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const p = tucIn(f);
  const walking = f < TUCANO4 - 2;
  return (
    <>
      <Cam pos={[FX + 0.9, 1.9, 6.2]} look={[FX + 1.2, 1.25, 2.1]} fov={52} f={f} a={a} />
      <StreetScene t={t} />
      <Jam t={t} />
      <LampPost p={POST} on />
      <Podium />
      <Tucano p={{pos: p, rotY: walking ? Math.PI / 2 : 0.2, t, blink: blinkCurve(f + 3), s: TS, whistle: 0, flap: walking ? 1 : 0}} />
    </>
  );
};
/* "O tucano apita com tanta força... que o bico bate no poste... e apaga a luz da cidade inteira." */
const APITA = at(5, "apita");
const grabK = (f: number) => ramp(f, APITA - 16, APITA - 8) * (1 - ramp(f, APITA + 2, APITA + 10));
const whistleK = (f: number) => ramp(f, APITA - 9, APITA - 2) * (1 - ramp(f, at(5, "poste") - 12, at(5, "poste") - 6));
const POSTE5 = at(5, "poste");
const E5 = at(5, "e", 0);
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const swing = easeInOut(ramp(f, POSTE5 - 6, POSTE5));
  const hit = f >= POSTE5 && f < POSTE5 + 14;
  return (
    <>
      <Cam pos={[FX + 1.3, 1.75, 5.0]} look={[FX + 1.6, 1.35, 2.1]} fov={50} f={f} a={a} />
      <StreetScene t={t} />
      <Jam t={t} />
      <LampPost p={POST} on />
      <Podium />
      <Tucano p={{pos: TUC, rotY: lerp(0.2, 1.35, swing), t, blink: hit ? 1 : blinkCurve(f + 3), s: TS, whistle: whistleK(f), grab: grabK(f), flap: f >= APITA + 6 && f < POSTE5 - 14 ? 0.6 : 0, beakTilt: hit ? -0.3 : 0}} />
      <Sparks p={[POST[0] - 0.05, 1.6, POST[2]]} k={hit ? 1 : 0} t={t} size={1.2} />
    </>
  );
};
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const out = f >= a + 6;
  return (
    <>
      <Cam pos={[FX + 1.2, 2.2, 6.4]} look={[FX + 1.2, 1.7, 1.5]} fov={56} f={f} a={a} />
      <StreetScene t={t} dark={out ? 1 : 0} />
      <Jam t={t} />
      <LampPost p={POST} on={!out} />
      <Podium />
      <Tucano p={{pos: TUC, rotY: 1.35, t, blink: 0, s: TS, whistle: 0, glowEyes: out ? 1 : 0}} />
    </>
  );
};
/* título: BLECAUTE BICUDO — só os olhinhos brilhando */
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 1.55, 1.7, 3.3]} look={[TUC[0], 1.5, TUC[2]]} fov={44} f={f} a={a} />
    <StreetScene t={t} dark={1} />
    <LampPost p={POST} on={false} />
    <Podium />
    <Tucano p={{pos: TUC, rotY: 0.1, t, blink: blinkCurve(f + 3) * 0.8, s: TS, whistle: 0, glowEyes: 1}} />
  </>
);

/* =================== 4 — poraquê no poste (enguia pública) =================== */
const ILUMINA = at(7, "ilumina");
const litK = (f: number) => f >= ILUMINA;
const PostPoraque: React.FC<{f: number; t: number; glow: number}> = ({f, t, glow}) => <Poraque p={{pos: [POST[0], POST[1] + 2.0, POST[2]], t, coil: 1, glow, blink: blinkCurve(f + 17), s: 0.85, rotY: -0.3, smile: 1, helmet: true}} />;
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const lit = litK(f);
  const g = ramp(f, ILUMINA - 4, ILUMINA + 4);
  return (
    <>
      <Cam pos={[FX + 0.8, 2.6, 7.6]} look={[FX + 1.2, 2.2, 1.5]} fov={56} f={f} a={a} />
      <StreetScene t={t} dark={1} lit={lit} />
      <LampPost p={POST} on={false} />
      <PostPoraque f={f} t={t} glow={g} />
      {g > 0.01 && <pointLight position={[POST[0], 3.2, POST[2] + 0.4]} intensity={14 * g} distance={10} decay={1.5} color="#fff2a0" />}
      <Toy pose={{...idle(f), pos: [FX + 0.6, 0.08, 2.4], rotY: 0.4, ...ARMS_UP, smile: 1, mouthOpen: 0.3}} look={BOYL} headExtra={<><ShowerCap /><TowelShoulder /></>} />
    </>
  );
};
/* título: ENGUIA PÚBLICA — mariposas em volta */
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 1.5, 2.6, 6.6]} look={[POST[0], 2.6, POST[2]]} fov={50} f={f} a={a} />
    <StreetScene t={t} dark={1} lit />
    <LampPost p={POST} on={false} />
    <PostPoraque f={f} t={t} glow={1} />
    <pointLight position={[POST[0], 3.2, POST[2] + 0.4]} intensity={14} distance={10} decay={1.5} color="#fff2a0" />
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[POST[0] + 0.7 * Math.cos(t * 3 + i), 3.0 + 0.4 * Math.sin(t * 4 + i * 2), POST[2] + 0.7 * Math.sin(t * 3 + i)]}>
        <boxGeometry args={[0.08, 0.01, 0.05]} />
        <meshStandardMaterial color="#e8dcc0" />
      </mesh>
    ))}
  </>
);

/* =================== 5 — influencer e Itaipu =================== */
const E9 = at(9, "e", 0);
const ITAIPU = at(9, "itaipu");
const S14: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.6, 1.6, 4.2]} look={[FX + 0.3, 0.95, 1.0]} fov={50} f={f} a={a} />
    <StreetScene t={t} />
    <PoraqueInTank p={[FX + 0.3, 0.08, 1.0]} rotY={0.15} t={t} f={f} po={{glow: 0.4, shades: true, helmet: false, smile: 1, mouth: 0.3 * Math.abs(Math.sin(t * 6))}} />
    <Phone p={[FX - 0.05, 1.55, 1.75]} r={[0, 0.5, 0.15]} s={2.4} t={t} ring={0.4} />
  </>
);
const S16: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[1.0, 2.4, 19.5]} look={[0, 4.6, -2]} fov={56} f={f} a={a} />
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={[0, 2, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={12} />
    <Dam t={t} />
    <PoraqueInTank p={[0.3, 0, 14.2]} rotY={0.25} t={t} f={f} po={{glow: 0.6, shades: true, helmet: false, smile: 1}} />
  </>
);

/* =================== 6 — de volta ao choque: roupa de astronauta =================== */
const ENTAO10 = at(10, "entao");
const CAPACETE = at(10, "capacete");
const ROUPA = at(10, "roupa");
const POR10 = at(10, "por");
const HardHat: React.FC = () => (
  <group position={[0, 0.2, -0.02]} rotation={[-0.1, 0, 0]}>
    <mesh scale={[1.1, 0.7, 1.15]}>
      <sphereGeometry args={[0.37, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#ffd21f" roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.0, 0.25]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.2, 1]}>
      <ringGeometry args={[0.36, 0.48, 24, 1, Math.PI, Math.PI]} />
      <meshStandardMaterial color="#ffd21f" roughness={0.35} side={THREE.DoubleSide} />
    </mesh>
  </group>
);
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const z = zap(f, at(10, "choque"));
  return (
    <>
      <Cam pos={[-0.55, 1.6, 2.4]} look={[-0.9, 1.5, -1.4]} fov={52} f={f} a={a} />
      <BathScene t={t} flicker={z} />
      <ElectricShower t={t} spark={z} shake={z} />
      <Boy pose={z ? {...idle(f), pos: BOY_SH, rotY: 0.15, ...SHOCK, torso: [0, 0, 0.06 * Math.sin(t * 50)]} : {...idle(f), pos: BOY_SH, rotY: 0.15, brow: 0.7, mouthOpen: 0.2, hairLift: 1}} />
      {z > 0 && <Bolt a={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.35]} b={[BOY_SH[0], 2.0, BOY_SH[2] + 0.05]} k={1} t={t} />}
    </>
  );
};
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const hat = f >= CAPACETE - 2;
  return (
    <>
      <Cam pos={[-0.6, 1.55, 2.2]} look={[-0.9, 1.35, -1.4]} fov={52} f={f} a={a} />
      <BathScene t={t} />
      <ElectricShower t={t} spark={0.4} />
      <Toy pose={{...idle(f), pos: BOY_SH, rotY: 0.15, rShoulder: [-0.6, 0, -0.5], lShoulder: [-0.6, 0, 0.5], rElbow: -0.8, lElbow: -0.8, brow: -0.3, smile: 0.4}} look={{hoodie: true, shoe: "#ffd21f", sole: "#2b2e3b"}} headExtra={hat ? <HardHat /> : <ShowerCap />} />
    </>
  );
};
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const ff = f >= POR10;
  return (
    <>
      <Cam pos={[-0.55, 1.65, 2.5]} look={[-0.9, 1.45, -1.4]} fov={52} f={f} a={a} />
      <BathScene t={t} steam={0.3} />
      <ElectricShower t={t} spark={1} heat={0.4} />
      <SteamJet p={[SHOWER_P[0], SHOWER_P[1] - 0.05, SHOWER_P[2] + 0.2]} k={0.35} t={t} spread={0.4} />
      <Toy pose={{...idle(f), pos: BOY_SH, rotY: 0.15 + (ff ? 0.3 * Math.sin(t * 20) : 0), rShoulder: [-0.4, 0, -0.5 + (ff ? 0.4 * Math.sin(t * 25) : 0)], lShoulder: [-0.4, 0, 0.5], smile: 0.6, brow: -0.2}} look={ASTRO} headExtra={<EvaHelmet />} />
      <EvaGear pos={BOY_SH} rotY={0.15 + (ff ? 0.3 * Math.sin(t * 20) : 0)} t={t} />
    </>
  );
};

/* =================== 7 — Parabéns + ameaça de seguir =================== */
const PB = L(11);
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const off = f >= a + 14;
  return (
    <>
      <Cam pos={[-0.2, 1.7, 3.0]} look={[-0.6, 1.5, -1.0]} fov={54} f={f} a={a} />
      <BathScene t={t} steam={0.5} />
      <ElectricShower t={t} />
      <Toy pose={{...idle(f), pos: [-0.5, 0, -0.6], rotY: 0.15, ...ARMS_UP, smile: 1, mouthOpen: 0.4, heat: 0.6, hairLift: 1}} look={ASTRO} headExtra={off ? undefined : <EvaHelmet visor={0.5} />} />
      <EvaGear pos={[-0.5, 0, -0.6]} rotY={0.15} t={t} />
      {off && <SteamJet p={[-0.5, 2.4, -0.6]} k={1 - ramp(f, a + 14, a + 60)} t={t} spread={0.3} h={1} />}
    </>
  );
};
const S21: React.FC<ShotProps> = ({f, a, t}) => {
  const peek = easeOut(ramp(f, a + 6, a + 22));
  const py = lerp(1.25, 1.66, peek);
  return (
    <>
      <Cam pos={[0.35, 2.15, 1.5]} look={[WINDOW_B[0], WINDOW_B[1] - 0.15, WINDOW_B[2]]} fov={44} f={f} a={a} />
      <BathScene t={t} dark={1} />
      <ElectricShower t={t} />
      <Poraque p={{pos: [WINDOW_B[0], py, WINDOW_B[2] - 0.62], rotY: 0, t, blink: blinkCurve(f + 17), s: 1.0, smile: 1, helmet: true, look: [0, -0.2], glow: 0.15, wiggle: 0.3}} />
      <pointLight position={[WINDOW_B[0], 2.4, WINDOW_B[2] - 0.2]} intensity={2.5} distance={2} decay={1.5} color="#fff2a0" />
      <Sparks p={[WINDOW_B[0] + 0.16, py + 0.75, WINDOW_B[2] - 0.2]} k={Math.sin(t * 5) > 0.6 ? 1 : 0} t={t} />
    </>
  );
};
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0, Comp: S1},
  {from: L(1), Comp: S2},
  {from: E1, Comp: S3},
  {from: L(2), Comp: S4},
  {from: L(3), Comp: S5},
  {from: E3, Comp: S6},
  {from: L(4), Comp: S7},
  {from: ENTAO4, Comp: S8},
  {from: L(5), Comp: S9},
  {from: E5, Comp: S10},
  {from: L(6), Comp: S11},
  {from: L(7), Comp: S12},
  {from: L(8), Comp: S13},
  {from: L(9), Comp: S14},
  {from: ITAIPU - 2, Comp: S16},
  {from: L(10), Comp: S17},
  {from: ENTAO10, Comp: S18},
  {from: ROUPA - 2, Comp: S19},
  {from: PB, Comp: S20},
  {from: L(12), Comp: S21},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CHUV} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D (estilo da referência) ======================= */
const KEYS = new Set(["banho", "quente", "chuveiro", "choque", "eletricista", "poraque", "vulcao", "fervendo", "erupcao", "chuveiral", "miojo", "tres", "segundos", "quinhentos", "vizinhos", "fila", "avenida", "paulista", "transito", "tucano", "apita", "bico", "poste", "luz", "blecaute", "bicudo", "ilumina", "enguia", "publica", "famoso", "influencer", "energia", "itaipu", "luva", "capacete", "astronauta", "seis", "horas", "parabens", "peixe", "seguir", "perfil", "noite"]);
/** etiqueta branca "• TEXTO" apontando algo */
const Tag: React.FC<{from: number; to: number; text: string; x: number; y: number}> = ({from, to, text, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 8) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: 30, padding: "8px 18px", borderRadius: 30, boxShadow: "0 4px 0 rgba(0,0,0,0.25)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10}}>
      <span style={{width: 12, height: 12, borderRadius: 6, background: "#101018", display: "inline-block"}} />
      {text}
    </div>
  );
};
/** onomatopeia grande */
const Ono: React.FC<{from: number; to: number; text: string; x: number; y: number; size?: number; color?: string; rot?: number}> = ({from, to, text, x, y, size = 150, color = "#ffd21f", rot = -8}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`, fontFamily, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap", letterSpacing: 2}}>
      {text}
    </div>
  );
};
/** número grande */
const BigNum: React.FC<{from: number; to: number; text: string; y?: number; size?: number}> = ({from, to, text, y = 330, size = 130}) => <Ono from={from} to={to} text={text} x={540} y={y} size={size} color="#ffffff" rot={-3} />;
/** mapa do Brasil: São Paulo → Itaipu */
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const proj = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapBR: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const k = easeInOut(ramp(f, from + 6, to - 6));
  const A = proj(-46.6, -23.5);
  const B = proj(-54.6, -25.4);
  const C: [number, number] = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 120];
  const qx = (1 - k) * (1 - k) * A[0] + 2 * (1 - k) * k * C[0] + k * k * B[0];
  const qy = (1 - k) * (1 - k) * A[1] + 2 * (1 - k) * k * C[1] + k * k * B[1];
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${proj(lo, la)[0].toFixed(0)} ${proj(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const label = (txt: string, p: [number, number], dx: number) => (
    <div style={{position: "absolute", left: p[0] + dx, top: p[1] - 120, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 36, padding: "4px 14px", whiteSpace: "nowrap"}}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#7ed957" stroke="#3f8f2c" strokeWidth={8} strokeLinejoin="round" />
        <path d={`M ${A[0]} ${A[1]} Q ${C[0]} ${C[1]} ${B[0]} ${B[1]}`} fill="none" stroke="#ffffff" strokeWidth={9} strokeDasharray="26 18" />
        {[A, B].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y})`}>
            <path d="M 0 0 C -22 -30, -26 -60, 0 -66 C 26 -60, 22 -30, 0 0 Z" fill="#e8262d" stroke="#101018" strokeWidth={5} />
            <circle cy={-46} r={9} fill="#ffffff" />
          </g>
        ))}
        <g transform={`translate(${qx},${qy})`}>
          <circle r={30} fill="#ffe14a" stroke="#101018" strokeWidth={6} />
          <text y={12} textAnchor="middle" fontSize={34}>⚡</text>
        </g>
      </svg>
      {label("SÃO PAULO", A, 40)}
      {label("ITAIPU", B, -40)}
    </AbsoluteFill>
  );
};
/** relógio acelerado + ⏩ */
const FastFwd: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 820, top: 300, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(200,380)">
          <circle r={95} fill="#ffffff" stroke="#101018" strokeWidth={12} />
          <line x1={0} y1={0} x2={60 * Math.sin(a)} y2={-60 * Math.cos(a)} stroke="#101018" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={40 * Math.sin(a / 12)} y2={-40 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={12} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};
/** cartão "seguir o perfil" */
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
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
const FOLLOW_FROM = L(12) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoChuveiro: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(2), L(6), L(8)];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapBR from={E9} to={ITAIPU - 3} />

      <StageTitle from={L(2) + 4} to={L(3) - 3} lines={["ERUPÇÃO", "CHUVEIRAL"]} />
      <StageTitle from={L(6) + 4} to={L(7) - 3} lines={["BLECAUTE", "BICUDO"]} />
      <StageTitle from={L(8) + 4} to={L(9) - 3} lines={["ENGUIA", "PÚBLICA"]} />

      <Ono from={4} to={at(0, "mas") + 4} text="?" x={440} y={330} size={200} color="#ffd21f" rot={8} />
      <Ono from={CHOQUE0 - 2} to={CHOQUE0 + 24} text="ZZZT!" x={540} y={420} />
      <Tag from={at(0, "chuveiro") - 2} to={ENTAO0 - 2} text="CHUVEIRO NERVOSO" x={330} y={560} />
      <Tag from={PORAQUE0 - 2} to={L(1) - 2} text="PORAQUÊ" x={760} y={900} />
      <Ono from={E1 + 4} to={L(2) - 2} text="BOOM!" x={540} y={400} size={170} color="#ff8a1f" />
      <Tag from={MIOJO - 2} to={E3 - 2} text="3 SEGUNDOS" x={720} y={620} />
      <BigNum from={at(3, "quinhentos") - 2} to={L(4) - 3} text="500 VIZINHOS" />
      <Tag from={at(3, "fila") - 2} to={L(4) - 3} text="FILA DO MIOJO" x={540} y={760} />
      <Tag from={at(4, "avenida") - 2} to={ENTAO4 - 2} text="AVENIDA PAULISTA" x={540} y={560} />
      <Ono from={at(4, "trava")} to={ENTAO4 - 2} text="BIIIII!" x={540} y={400} size={120} color="#ffffff" />
      <Tag from={TUCANO4 - 2} to={L(5) - 2} text="TUCANO" x={560} y={640} />
      <Ono from={APITA} to={APITA + 26} text="PRIIII!" x={540} y={400} size={120} color="#ffffff" />
      <Ono from={POSTE5} to={POSTE5 + 26} text="PLÉC!" x={600} y={560} size={150} />
      <Ono from={E5 + 10} to={L(6) - 2} text="cri cri…" x={540} y={560} size={90} color="#ffffff" rot={0} />
      <Tag from={ILUMINA - 2} to={L(8) - 2} text="ILUMINAÇÃO PÚBLICA" x={540} y={560} />
      <Tag from={at(9, "influencer") - 2} to={E9 - 2} text="INFLUENCER DE ENERGIA" x={540} y={600} />
      <BigNum from={E9 + 6} to={ITAIPU - 3} text="1.000 KM" y={250} size={130} />
      <Tag from={ITAIPU} to={L(10) - 2} text="ITAIPU" x={540} y={560} />
      <Ono from={at(10, "choque") - 2} to={at(10, "choque") + 22} text="ZZZT!" x={540} y={420} />
      <Tag from={CAPACETE - 2} to={ROUPA - 4} text="CAPACETE" x={560} y={520} />
      <Tag from={ROUPA} to={POR10 - 2} text="ROUPA DE ASTRONAUTA" x={540} y={560} />
      <BigNum from={at(10, "seis") - 2} to={L(11) - 3} text="6 HORAS" y={600} size={140} />
      <FastFwd from={POR10} to={L(11) - 3} />
      <Confetti from={PB} to={PB + 120} />
      <Ono from={PB} to={at(11, "voce") - 2} text="PARABÉNS!" x={540} y={380} size={130} color="#ff4d6d" rot={-4} />
      <Sticker from={at(11, "astronauta")} to={L(12) - 3} x={190} y={420} rot={-6} label="CHUVEIRO-VULCÃO">
        <g transform="translate(152,105)">
          <path d="M -60 60 L -20 -30 L 20 -30 L 60 60 Z" fill="#8a5a3a" stroke="#101018" strokeWidth={6} />
          <rect x={-22} y={-60} width={44} height={34} rx={8} fill="#ffffff" stroke="#101018" strokeWidth={5} />
          <path d="M -10 -70 q 10 -25 0 -40 M 12 -70 q 10 -25 0 -40" stroke="#bfe6ff" strokeWidth={8} fill="none" />
        </g>
      </Sticker>
      <Sticker from={at(11, "miojo")} to={L(12) - 3} x={540} y={400} rot={4} label="MIOJO DE CHUVEIRO">
        <g transform="translate(152,105)">
          <rect x={-60} y={-10} width={120} height={70} rx={10} fill="#c8ced6" stroke="#101018" strokeWidth={6} />
          <path d="M -45 -10 q 10 -30 20 0 q 10 -30 20 0 q 10 -30 20 0 q 10 -30 20 0" stroke="#f2d27a" strokeWidth={10} fill="none" />
        </g>
      </Sticker>
      <Sticker from={at(11, "peixe")} to={L(12) - 3} x={890} y={430} rot={6} label="LUZ DE PEIXE">
        <g transform="translate(152,105)">
          <path d="M -70 0 C -40 -40, 40 -40, 70 0 C 40 40, -40 40, -70 0 Z" fill="#ffe14a" stroke="#101018" strokeWidth={6} />
          <circle cx={-40} cy={-6} r={8} fill="#101018" />
          <path d="M 10 -50 l -15 30 h 20 l -15 30" stroke="#ff8a1f" strokeWidth={8} fill="none" />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      <FollowCard from={FOLLOW_FROM} to={TOTAL_CHUV - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozchuveiro.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FXV * 0.75} />
      ))}
      <SND src="sfx11/water.mp3" from={0} dur={CHOQUE0} v={FXV * 0.3} />
      <SND src="sfx14/zap.mp3" from={CHOQUE0 - 2} dur={24} v={FXV * 0.5} />
      <SND src="sfx3/bell.mp3" from={ENTAO0 + 10} dur={40} v={FXV * 0.35} />
      <SND src="sfx10/scooter.mp3" from={ENTAO0 + 30} dur={PORAQUE0 - ENTAO0 - 28} v={FXV * 0.3} />
      <SND src="sfx14/zap.mp3" from={CHOQUE1 - 4} dur={24} v={FXV * 0.55} />
      <SND src="sfx11/rocket.mp3" from={E1} dur={60} v={FXV * 0.45} />
      <SND src="sfx2/boom.mp3" from={E1 + 4} dur={50} v={FXV * 0.4} />
      <SND src="sfx10/bubble.mp3" from={L(3)} dur={E3 - L(3)} v={FXV * 0.35} loop />
      <SND src="sfx5/crowdday.mp3" from={E3} dur={L(5) - E3} v={FXV * 0.3} />
      <SND src="sfx14/buzina.mp3" from={at(4, "trava")} dur={30} v={FXV * 0.45} />
      <SND src="sfx14/buzina.mp3" from={at(4, "trava") + 14} dur={30} v={FXV * 0.4} />
      <SND src="sfx3/whistle.mp3" from={APITA} dur={40} v={FXV * 0.5} />
      <SND src="sfx10/bonk.mp3" from={POSTE5} dur={25} v={FXV * 0.6} />
      <SND src="sfx14/zap.mp3" from={POSTE5 + 2} dur={24} v={FXV * 0.4} />
      <SND src="sfx8/poweroff.mp3" from={E5 + 4} dur={40} v={FXV * 0.5} />
      <SND src="sfx10/plim.mp3" from={ILUMINA} dur={30} v={FXV * 0.6} />
      <SND src="sfx10/ding.mp3" from={at(9, "influencer")} dur={30} v={FXV * 0.5} />
      <SND src="sfx7/whoosh.mp3" from={E9 + 6} dur={30} v={FXV * 0.3} />
      <SND src="sfx11/water.mp3" from={ITAIPU} dur={L(10) - ITAIPU} v={FXV * 0.35} />
      <SND src="sfx14/zap.mp3" from={at(10, "choque") - 2} dur={24} v={FXV * 0.5} />
      <SND src="sfx3/ticking.mp3" from={POR10} dur={L(11) - POR10} v={FXV * 0.45} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FXV * 0.45} />
      {["astronauta", "miojo", "peixe"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(11, w)} dur={22} v={FXV * 0.45} />
      ))}
      <SND src="sfx14/zap.mp3" from={L(12) + 20} dur={24} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
