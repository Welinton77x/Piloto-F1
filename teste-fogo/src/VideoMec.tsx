import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, V3, groundY, groundAng} from "./Sets5";
import {Puff, WeddingPigeon} from "./Sets10";
import {Car, CarP, Cup, FruitStall, Pan, Workshop, Octopus, OctoP, CarRobot, Receipt, Fly, Sponge, HairBits, DAD, DadHead, CarKey, Phone, Pandeiro, PaperHat, Bucket} from "./Sets12";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingMec.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  const w = list[Math.min(n, list.length - 1)];
  if (!w || list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(w.s);
};
const atE = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].e);
};
/** termina logo depois do "mecânico." pra emendar no começo (loop) */
export const TOTAL_MEC = F(words[words.length - 1].e + 0.35);

const BOYL: ToyLook = {hoodie: true};
const MOHAWK: ToyLook = {hoodie: true, hairStyle: "mohawk"};
const PASTEL: ToyLook = {shirt: "#ffffff", apron: true, pants: "#3a3d48", hairStyle: "buzz", hair: "#1a1a1a", skin: "#c98f62", shoe: "#2b2e3b", sole: "#ffffff"};
const DANCER1: ToyLook = {shirt: "#ff6fb1", pants: "#2b2e3b", hairStyle: "ponytail", hair: "#5a2a14", lashes: true, lips: "#d4486a", shoe: "#ffffff", sole: "#ff6fb1"};
const DANCER2: ToyLook = {shirt: "#2ecc71", pants: "#f4f4f2", hairStyle: "curly", hair: "#1a1a1a", skin: "#a8714a", shoe: "#2e86de", sole: "#ffffff"};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/* poses de braço (resolvidas numericamente pro boneco) */
const OFFER: Pose = {rShoulder: [-1.28, 0.98, 0.1], rElbow: -0.47};
const OFFER_LOW: Pose = {rShoulder: [-1.0, 0.72, 0.175], rElbow: -0.27};
const PHONE_EAR: Pose = {rShoulder: [-1.654, 0.385, -0.484], rElbow: -1.914};
const CHIN: Pose = {rShoulder: [-1.407, 0.734, 0.259], rElbow: -1.339};
const CROSSED: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HANDS_HEAD: Pose = {rShoulder: [-2.5, 0, 0.35], rElbow: -1.9, lShoulder: [-2.5, 0, -0.35], lElbow: -1.9};
const POINT: Pose = {rShoulder: [-1.5, 0, -0.15], rElbow: -0.05};
const dancePose = (t: number, ph = 0): Pose => ({
  rShoulder: [-2.4 - 0.4 * Math.sin(t * 6 + ph), 0, -0.3], rElbow: -0.5,
  lShoulder: [-0.6 + 0.5 * Math.sin(t * 6 + ph), 0, 0.3], lElbow: -1.2,
  torso: [0, 0, 0.12 * Math.sin(t * 6 + ph)], head: [0, 0.2 * Math.sin(t * 3 + ph), 0.1 * Math.sin(t * 6 + ph)],
  squash: 0.06 * Math.abs(Math.sin(t * 6 + ph)), smile: 1, mouthOpen: 0.3,
});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number; roll?: number}> = ({pos, look, fov, f, a, punch = 7, roll = 0}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  if (roll) c.rotateZ(roll);
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

/* ---------- personagens ---------- */
const Boy: React.FC<{pose: Pose; mohawk?: boolean; palmRef?: React.Ref<THREE.Object3D>; lPalmRef?: React.Ref<THREE.Object3D>}> = ({pose, mohawk = false, palmRef, lPalmRef}) => <Toy pose={pose} look={mohawk ? MOHAWK : BOYL} palmRef={palmRef} lPalmRef={lPalmRef} />;
const Dad: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>}> = ({pose, palmRef}) => <Toy pose={pose} look={DAD} palmRef={palmRef} headExtra={<DadHead />} />;
const Pasteleiro: React.FC<{pose: Pose; palmRef?: React.Ref<THREE.Object3D>}> = ({pose, palmRef}) => <Toy pose={pose} look={PASTEL} palmRef={palmRef} headExtra={<PaperHat />} />;
const CS = 1.6; // escala do carro
/** carro numa posição da rua (segue a ladeira); frente = +x quando rotY = π/2 */
const CarOnRoad: React.FC<{x: number; z: number; rotY?: number; c?: CarP; s?: number; tilt?: number}> = ({x, z, rotY = Math.PI / 2, c, s = CS, tilt = 1}) => (
  <group position={[x, groundY(x), z]} rotation={[0, 0, groundAng(x) * tilt]}>
    <Car p={[0, 0, 0]} rotY={rotY} c={c} s={s} />
  </group>
);

/* ---------- ambientes ---------- */
const StreetScene: React.FC<{t: number; target: V3; ext?: number}> = ({t, target, ext = 9}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 40, 140]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.6} ext={ext} />
    <Town t={t} galo={false} />
  </>
);
const ShopScene: React.FC = () => (
  <>
    <color attach="background" args={["#e9e2d0"]} />
    <hemisphereLight args={["#fff6e6", "#8a8f99", 1.05]} />
    <pointLight position={[0.3, 3.9, 1.6]} intensity={14} distance={16} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 6]} intensity={0.55} />
    <Workshop />
  </>
);

/* =================== 1 — o carro acorda de mau humor =================== */
const CAR0: V3 = [-8, 0, -0.3];
const DAD0: V3 = [-5.3, 0, 1.7];
const BOY0: V3 = [-6.75, 0, 2.15];
const TOSS = at(0, "mecanico") + 4;
const LIGAR = at(0, "ligar");
const ACORDA = at(0, "acorda");
const RECUSA = at(0, "recusa");
/** chave voando do pai pro menino */
const keyFlight = (f: number): V3 | null => {
  if (f < TOSS || f > TOSS + 14) return null;
  const k = (f - TOSS) / 14;
  const p = mix([DAD0[0] - 0.45, 1.25, DAD0[2] - 0.05], [BOY0[0] + 0.15, 1.72, BOY0[2] + 0.3], k);
  return [p[0], p[1] + 0.9 * Math.sin(k * Math.PI), p[2]];
};
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const dpalm = useRef<THREE.Object3D>(null);
  const bpalm = useRef<THREE.Object3D>(null);
  const caught = f >= TOSS + 14;
  const dad = physics("d0" + a, (fr) => {
    const toss = ramp(fr, TOSS - 6, TOSS + 2);
    return {...idle(fr + 13), pos: DAD0, rotY: -0.75, ...OFFER, rShoulder: [lerp(-1.28, -2.2, toss), 0.98 * (1 - toss), 0.1], rElbow: lerp(-0.47, -0.2, toss), mouthOpen: talk(fr, a + 2, TOSS - 4), smile: 0.4, brow: 0.2, head: [0, -0.2, 0]};
  }, a, f);
  const boy = physics("b0" + a, (fr) => {
    const c = ramp(fr, TOSS + 6, TOSS + 13);
    return {...idle(fr), pos: BOY0, rotY: 0.55, rShoulder: [lerp(-0.2, -2.3, c), 0, lerp(0.1, 0.2, c)], rElbow: lerp(-0.3, -0.5, c), smile: 0.5, pupil: [0.6, 0], head: [0, 0.25, 0]};
  }, a, f);
  const kf = keyFlight(f);
  return (
    <>
      <Cam pos={[-5.0, 1.75, 6.3]} look={[-6.4, 1.25, 0.9]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[-6.5, 1, 0.5]} ext={6} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, sleepy: 1}} />
      <Dad pose={dad} palmRef={dpalm} />
      <Boy pose={boy} palmRef={bpalm} />
      {f < TOSS && (
        <InHand palm={dpalm}>
          <CarKey p={[0, -0.02, 0.05]} s={1.6} />
        </InHand>
      )}
      {kf && <CarKey p={kf} r={[f * 0.5, f * 0.3, 0]} s={1.6} />}
      {caught && (
        <InHand palm={bpalm}>
          <CarKey p={[0, -0.02, 0.05]} s={1.6} />
        </InHand>
      )}
    </>
  );
};
/* "...primeiro você precisa ligar o carro." — o menino na porta, gira a chave */
const BOY1: V3 = [-8.35, 0, 1.25];
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const turn = ramp(f, LIGAR, LIGAR + 6);
  const boy = physics("b1" + a, (fr) => ({...idle(fr), pos: BOY1, rotY: Math.PI - 0.35, rShoulder: [-1.75, 0, 0.15], rElbow: -0.35, rWrist: [0, 0, -1.2 * ramp(fr, LIGAR, LIGAR + 6)], head: [0.1, 0, 0]}), a, f);
  const vib = f > LIGAR + 4 ? 1 : 0;
  return (
    <>
      <Cam pos={[-3.9, 1.85, 6.3]} look={[-7.4, 1.1, 0.5]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, sleepy: 1 - 0.1 * turn, shake: 0.4 * vib}} />
      <Boy pose={boy} />
    </>
  );
};
/* "Só que o carro acorda de mau humor..." — close na cara do carro */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const open = easeOut(ramp(f, ACORDA - 2, ACORDA + 10));
  const yawn = ramp(f, ACORDA + 2, ACORDA + 8) * (1 - ramp(f, ACORDA + 22, ACORDA + 30));
  const grump = ramp(f, at(0, "humor") - 6, at(0, "humor") + 2);
  return (
    <>
      <Cam pos={[-1.7, 1.3, 0.2]} look={[-7.0, 0.95, -0.3]} fov={42} f={f} a={a} punch={4} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, sleepy: lerp(1, 0.5, open), mouth: yawn, mood: grump, steam: grump}} />
    </>
  );
};
/* "...e se recusa a sair sem um cafezinho." — o carro balança a "cabeça" */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const no = ramp(f, RECUSA - 4, RECUSA + 2) * (1 - ramp(f, RECUSA + 26, RECUSA + 34));
  const boy = physics("b3" + a, (fr) => ({...idle(fr), pos: [-5.15, 0, -2.0], rotY: -0.55, rShoulder: [-0.3, 0, 0.2], rElbow: -0.4, brow: 0.6, mouthOpen: 0.15, head: [0, -0.35, 0]}), a, f);
  return (
    <>
      <Cam pos={[-2.2, 1.6, 4.4]} look={[-5.8, 1.0, -0.9]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} rotY={Math.PI / 2 + 0.16 * no * Math.sin(t * 13)} c={{t, sleepy: 0.5, mood: 1, steam: 0.6}} />
      <Boy pose={boy} />
    </>
  );
};
/* título: MAU HUMOR AUTOMOTIVO — o carro bufando, o menino de braços cruzados */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b4" + a, (fr) => ({...idle(fr), pos: [-5.15, 0, -2.0], rotY: -0.45, ...CROSSED, brow: -0.4, smile: 0, head: [0.05, 0, 0.1]}), a, f);
  return (
    <>
      <Cam pos={[-2.0, 1.85, 5.0]} look={[-5.8, 1.0, -0.9]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, sleepy: 0.45, mood: 1, steam: 1, shake: 0.3 * Math.max(0, Math.sin(t * 2.5))}} />
      <Boy pose={boy} />
    </>
  );
};

/* =================== 2 — o café (cafeína de motor) =================== */
const SIP = at(2, "cafe") + 6;
const AGITADO = at(2, "agitado");
const DEP = at(2, "sai");
const BUZINA = at(2, "buzinando");
const BOY5: V3 = [-5.55, 0, -0.15];
/** posição do carro correndo (x) */
const carX = (f: number) => {
  if (f < DEP) return CAR0[0];
  const tt = (f - DEP) / FPS;
  return tt < 1.5 ? CAR0[0] + 2 * tt * tt : CAR0[0] + 4.5 + 6 * (tt - 1.5);
};
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const sip = ramp(f, SIP - 4, SIP + 4) * (1 - ramp(f, SIP + 22, SIP + 30));
  const boy = physics("b5" + a, (fr) => ({...idle(fr), pos: BOY5, rotY: -Math.PI / 2 + 0.25, ...OFFER_LOW, smile: 0.7, head: [0.2, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[-5.5, 1.6, 5.3]} look={[-6.45, 1.0, -0.3]} fov={46} f={f} a={a} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, sleepy: 0.45 * (1 - sip), mood: 1 - sip, mouth: 0.5 * sip, smile: sip}} />
      <Boy pose={boy} palmRef={palm} />
      <InHand palm={palm}>
        <group rotation={[0, 0, -0.9 * sip]}>
          <Cup p={[0, -0.04, 0.06]} s={1.5} />
        </group>
      </InHand>
    </>
  );
};
/* "...e ele fica tão agitado" — olhos arregalados, tremendo */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const ag = ramp(f, AGITADO - 6, AGITADO + 2);
  return (
    <>
      <Cam pos={[-1.9, 1.3, 0.0]} look={[-7.0, 0.95, -0.3]} fov={44} f={f} a={a} punch={5} />
      <StreetScene t={t} target={[-7.5, 1, 0.3]} ext={5} />
      <CarOnRoad x={CAR0[0]} z={CAR0[2]} c={{t, wide: ag, smile: 1, shake: 0.5 + ag, bounce: 0.3 * ag, steam: ag}} />
    </>
  );
};
/* "...que sai correndo sozinho pela cidade, buzinando forró!" */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const x = carX(f);
  const boy = physics("b7" + a, (fr) => ({...idle(fr), pos: [-5.7, 0, 2.1], rotY: 1.0, ...HANDS_HEAD, eyeWide: 0.8, mouthOpen: 0.45, brow: 0.9}), a, f);
  return (
    <>
      <Cam pos={[-3.7, 1.8, 7.8]} look={[-4.9, 1.1, 0]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[x, groundY(x) + 1, 0]} ext={9} />
      <CarOnRoad x={x} z={CAR0[2]} c={{t, wide: 1, smile: 1, bounce: 1, spin: -t * 14, mouth: f > BUZINA ? 0.4 + 0.4 * Math.abs(Math.sin(t * 9)) : 0}} />
      <Boy pose={boy} />
    </>
  );
};
/* título: CAFEÍNA DE MOTOR — o carro pulando na ladeira, o menino correndo atrás */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const x = carX(f);
  const bx = x - 3.3;
  const boy = physics("b8" + a, (fr) => ({...idle(fr), pos: [carX(fr) - 3.3, groundY(carX(fr) - 3.3), 0.9], rotY: Math.PI / 2, walk: (fr / FPS) * 13, walkAmt: 1, eyeWide: 0.6, mouthOpen: 0.4, brow: 0.7}), a, f);
  const mid = x - 1.6;
  return (
    <>
      <Cam pos={[mid, groundY(mid) + 2.2, 9.5]} look={[mid, groundY(mid) + 1.0, 0]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[mid, groundY(mid) + 1, 0]} ext={10} />
      <CarOnRoad x={x} z={CAR0[2]} c={{t, wide: 1, smile: 1, bounce: 1, spin: -t * 14, mouth: 0.4 + 0.4 * Math.abs(Math.sin(t * 9))}} />
      <group position={[bx, groundY(bx), 0]} rotation={[0, 0, groundAng(bx) * 0.5]}>
        <Boy pose={{...boy, pos: [0, 0, 0.9]}} />
      </group>
    </>
  );
};

/* =================== 3 — o pombo que só voa de ré (carona reversa) =================== */
const PS = 7; // pombo gigante
const BOTTOM = groundY(30);
const BOY9: V3 = [27.5, BOTTOM, 1.4];
const POMBO = at(4, "pombo", 0);
const MAS = at(4, "mas");
const PIG_LAND: V3 = [29.9, BOTTOM, 0.2];
const pigPos = (f: number): V3 => {
  if (f < MAS) {
    const k = easeOut(clamp((f - (POMBO - 22)) / 26));
    return [lerp(34, PIG_LAND[0], k), lerp(BOTTOM + 9, BOTTOM, k), lerp(-3, PIG_LAND[2], k)];
  }
  const k = (f - MAS) / FPS;
  return [PIG_LAND[0] + 1.6 * k * k + 0.5 * k, BOTTOM + Math.min(6.5, 2.2 * k * k), PIG_LAND[2]];
};
/** menino montado no pombo (espaço do pombo) */
const Rider: React.FC<{f: number; a: number; look?: number}> = ({f, a, look = 1}) => {
  const pose = physics("rider" + a, (fr) => ({...idle(fr), pos: [0, 1.88, -0.35], rotY: 0, legLift: 1, rShoulder: [-0.9, 0, 0.25], rElbow: -0.6, lShoulder: [-0.9, 0, -0.25], lElbow: -0.6, head: [0, 1.15 * look, 0], eyeWide: 0.7, mouthOpen: 0.35, brow: 0.8, hair: [0.15 * Math.sin(fr / 3), 0]}), a, f);
  return <Boy pose={pose} />;
};
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const p = pigPos(f);
  const land = f > POMBO + 4;
  const boy = physics("b9" + a, (fr) => {
    const look = ramp(fr, POMBO - 10, POMBO);
    return {...idle(fr), pos: BOY9, rotY: lerp(0.2, 0.9, look), rShoulder: [0, 0, -1.25], rElbow: -0.15, smile: 0.6 * (1 - look), eyeWide: look, mouthOpen: 0.4 * look, brow: 0.8 * look, head: [-0.25 * look, 0, 0]};
  }, a, f);
  return (
    <>
      <Cam pos={[28.2, BOTTOM + 2.1, 8.8]} look={[28.6, BOTTOM + 1.7, 0]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[29, BOTTOM + 1, 0]} ext={8} />
      <WeddingPigeon p={{pos: p, rotY: -Math.PI / 2 + 0.55, t, flap: land ? 0 : 1, blink: blinkCurve(f + 40)}} s={PS} />
      <Boy pose={boy} />
    </>
  );
};
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const p = pigPos(f);
  return (
    <>
      <Cam pos={[p[0] - 0.6, p[1] + 2.4, 10.5]} look={[p[0] + 0.4, p[1] + 2.3, 0]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[p[0], p[1], 0]} ext={10} />
      <group position={p} rotation={[0, -Math.PI / 2, 0]}>
        <WeddingPigeon p={{pos: [0, 0, 0], t, flap: 1, blink: 0}} s={PS} />
        <Rider f={f} a={a} look={ramp(f, MAS + 10, MAS + 20)} />
      </group>
    </>
  );
};
/* título: CARONA REVERSA — voando de ré por cima das casas */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  const p: V3 = [38 + 2.2 * k, BOTTOM + 7.2 + 0.25 * Math.sin(k * 3), -5.4];
  return (
    <>
      <Cam pos={[p[0] - 1.2, p[1] + 1.2, 7.5]} look={[p[0] + 0.3, p[1] + 1.4, p[2]]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[p[0], BOTTOM, -5]} ext={12} />
      <group position={p} rotation={[0, -Math.PI / 2, 0]}>
        <WeddingPigeon p={{pos: [0, 0, 0], t, flap: 1, blink: 0}} s={PS} />
        <Rider f={f} a={a} look={1} />
      </group>
    </>
  );
};

/* =================== 4 — a feira (camuflagem hortifrúti) =================== */
const FX0 = -31;
const MELON_CAR: V3 = [FX0 - 0.55, 0, 1.0];
const BOY12: V3 = [FX0 + 1.75, 0, 2.1];
const PAST12: V3 = [FX0 + 0.85, 0, -0.05];
const DISF = at(6, "disfarcado");
const HONK = L(7) + 14;
const DROP = L(7) + 24;
const FeiraScene: React.FC<{t: number}> = ({t}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 40, 140]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={[FX0 + 1, 1, 0.8]} dir={[-6, 10, 7]} intensity={2.6} ext={7} />
    <Town t={t} galo={false} flat clear={[FX0 - 5, FX0 + 5]} />
    <FruitStall p={[FX0 - 2.6, 0, -0.9]} kind="frutas" colors={["#2ecc71", "#ffffff"]} />
    <FruitStall p={[FX0, 0, -0.9]} kind="melancia" />
    <FruitStall p={[FX0 + 2.6, 0, -0.9]} kind="pastel" colors={["#ffd21f", "#ffffff"]} />
  </>
);
const pastelPose = (fr: number, point = 1): Pose => ({...idle(fr + 31), pos: PAST12, rotY: -0.95, rShoulder: [lerp(-0.2, -1.5, point), 0, lerp(-0.1, 0.05, point)], rElbow: -0.05, lShoulder: [-0.5, 0, -0.2], lElbow: -1.2, eyeWide: 0.6 * point, mouthOpen: 0.35 * point, brow: 0.6 * point, head: [0, -0.3 * point, 0]});
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const ppalm = useRef<THREE.Object3D>(null);
  const boy = physics("b12" + a, (fr) => ({...idle(fr), pos: BOY12, rotY: -0.75, rShoulder: [-0.4, 0, 0.1], rElbow: -0.5, brow: 0.3, head: [0, -0.2, 0], pupil: [-0.6, 0]}), a, f);
  const past = physics("p12" + a, (fr) => pastelPose(fr, ramp(fr, DISF - 12, DISF - 4)), a, f);
  return (
    <>
      <Cam pos={[FX0 + 1.0, 2.0, 7.9]} look={[FX0 + 0.55, 1.05, 0.6]} fov={56} f={f} a={a} />
      <FeiraScene t={t} />
      <Car p={MELON_CAR} rotY={0.1} c={{t, melon: 1, blink: blinkCurve(f + 11)}} s={1.15} />
      <Pasteleiro pose={past} palmRef={ppalm} />
      <InHand palm={ppalm}>
        <Pan p={[0, -0.02, 0.05]} r={[0, Math.PI / 2, 0]} s={1.2} t={t} />
      </InHand>
      <Boy pose={boy} />
    </>
  );
};
/* "...disfarçado de melancia." — close na melancia de faróis piscando */
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const bl = (Math.floor((f - a) / 7) % 2) * ramp(f, a + 6, a + 8);
  return (
    <>
      <Cam pos={[FX0 - 0.15, 1.3, 5.9]} look={[FX0 - 0.5, 0.8, 1.2]} fov={44} f={f} a={a} punch={4} />
      <FeiraScene t={t} />
      <Car p={MELON_CAR} rotY={0.1} c={{t, melon: 1, blink: bl}} s={1.15} />
    </>
  );
};
/* título: CAMUFLAGEM HORTIFRÚTI — a melancia buzina e o disfarce cai */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const melon = 1 - easeInOut(ramp(f, DROP, DROP + 8));
  const honk = ramp(f, HONK - 2, HONK + 2) * (1 - ramp(f, HONK + 10, HONK + 14));
  const boy = physics("b14" + a, (fr) => ({...idle(fr), pos: BOY12, rotY: -0.75, ...HANDS_HEAD, eyeWide: ramp(fr, DROP, DROP + 6), mouthOpen: 0.45 * ramp(fr, DROP, DROP + 6), brow: 0.8}), a, f);
  const past = physics("p14" + a, (fr) => pastelPose(fr, 1), a, f);
  return (
    <>
      <Cam pos={[FX0 + 1.0, 1.9, 7.6]} look={[FX0 + 0.55, 1.05, 0.6]} fov={56} f={f} a={a} />
      <FeiraScene t={t} />
      <Car p={MELON_CAR} rotY={0.1} c={{t, melon, mouth: honk, wide: 1 - melon, smile: f > DROP + 8 ? 1 : 0, shake: honk}} s={1.15} />
      <Puff p={[MELON_CAR[0], 0.9, MELON_CAR[2]]} k={(f - DROP) / 22} color="#7ed957" />
      <Pasteleiro pose={past} />
      <Boy pose={boy} />
    </>
  );
};

/* =================== 5 — a oficina do polvo (oficina tentacular) =================== */
const CAR_W: V3 = [-1.35, 0, -1.2];
const OCTO_W: V3 = [1.0, 0, -0.9];
const POLVO = at(8, "polvo");
const COM = at(8, "com");
const CORTA = at(8, "corta");
const CABELO = at(8, "cabelo");
const MOH = atE(8, "cabelo") + 2; // vira moicano
const OS = 1.15; // escala do polvo
const S15: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = easeInOut(clamp((f - a) / (b - a - 4)));
  const cz = lerp(4.6, CAR_W[2], k);
  const boy = physics("b15" + a, (fr) => {
    const kk = easeInOut(clamp((fr - a) / (b - a - 4)));
    return {...idle(fr), pos: [0.35, 0, lerp(5.6, 0.9, kk)], rotY: Math.PI, walk: (fr / FPS) * 8, walkAmt: 1 - ramp(fr, b - 8, b), smile: 0.5};
  }, a, f);
  return (
    <>
      <Cam pos={[0.9, 2.0, 8.2]} look={[-0.5, 1.1, -0.8]} fov={52} f={f} a={a} />
      <ShopScene />
      <Car p={[CAR_W[0], 0, cz]} rotY={0} c={{t, smile: 1, spin: -cz * 1.5}} s={CS} />
      <Boy pose={boy} />
    </>
  );
};
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const spin = easeOut(ramp(f, POLVO - 8, POLVO + 4));
  const hi = ramp(f, POLVO, POLVO + 6) * (1 - ramp(f, POLVO + 30, POLVO + 40));
  return (
    <>
      <Cam pos={[1.6, 1.55, 2.9]} look={[1.0, 1.15, -0.9]} fov={48} f={f} a={a} punch={5} />
      <ShopScene />
      <Car p={CAR_W} rotY={0} c={{t, smile: 1}} s={CS} />
      <Octopus o={{pos: OCTO_W, rotY: lerp(Math.PI, -0.2, spin), t, blink: blinkCurve(f + 5), mouth: 0.6 * hi, thumbs: hi, work: 0.3, s: OS}} />
    </>
  );
};
/* "Com oito braços, ele troca o pneu, o óleo, a bateria..." */
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 140);
  return (
    <>
      <Cam pos={[lerp(2.4, 1.8, k), 2.0, lerp(5.6, 5.0, k)]} look={[-0.2, 1.05, -1.0]} fov={52} f={f} a={a} />
      <ShopScene />
      <Car p={CAR_W} rotY={0} c={{t, smile: 1, wide: 0.5, bounce: 0.15}} s={CS} />
      <Octopus o={{pos: [0.75, 0, -0.75], rotY: -0.45, t, tools: true, work: 1, blink: blinkCurve(f + 5), mouth: 0.3 + 0.2 * Math.sin(t * 5), s: OS}} />
    </>
  );
};
/* "...e ainda corta o seu cabelo." — tesoura e o moicano */
const BOY18: V3 = [0.55, 0, 0.75];
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const cut = f >= CORTA - 4;
  const moh = f >= MOH;
  const boy = physics("b18" + a, (fr) => ({...idle(fr), pos: BOY18, rotY: 0.15, rShoulder: [-0.3, 0, 0.15], rElbow: -0.4, lShoulder: [-0.3, 0, -0.15], lElbow: -0.4, eyeWide: fr >= MOH ? 0.2 : 0.8, mouthOpen: fr >= MOH ? 0 : 0.3, brow: fr >= MOH ? -0.2 : 0.8, smile: fr >= MOH ? 1 : 0, pupil: [0, 1]}), a, f);
  const sc: V3 = [0.2 * Math.sin(t * 4), 1.92 + 0.06 * Math.sin(t * 7), 1.38 + 0.12 * Math.cos(t * 4)];
  return (
    <>
      <Cam pos={[1.75, 1.75, 3.6]} look={[0.55, 1.45, 0.3]} fov={46} f={f} a={a} />
      <ShopScene />
      <Car p={CAR_W} rotY={0} c={{t, smile: 1}} s={CS} />
      <Octopus o={{pos: [0.55, 0, -0.55], rotY: 0.1, t, tools: true, work: 1, scissors: cut && !moh ? sc : undefined, blink: blinkCurve(f + 5), mouth: 0.4, s: 1.0}} />
      <Boy pose={boy} mohawk={moh} />
      <HairBits p={[BOY18[0], 1.85, BOY18[2]]} k={cut && f < MOH + 20 ? 1 : 0} t={t} />
      <Puff p={[BOY18[0], 2.0, BOY18[2]]} k={(f - MOH + 3) / 18} color="#5a3a26" />
    </>
  );
};
/* título: OFICINA TENTACULAR — no espelho com o moicano, o polvo fazendo joinha */
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b19" + a, (fr) => ({...idle(fr), pos: [-3.2, 0, -1.3], rotY: -Math.PI / 2 + 0.45, rShoulder: [-2.5, 0, 0.35], rElbow: -1.9, smile: 1, brow: -0.3, head: [0, 0, 0.08]}), a, f);
  return (
    <>
      <Cam pos={[-4.2, 1.85, 0.6]} look={[-2.9, 1.4, -1.4]} fov={52} f={f} a={a} />
      <ShopScene />
      <Boy pose={boy} mohawk />
      <Octopus o={{pos: [-1.7, 0, -2.4], rotY: -0.9, t, thumbs: 1, mouth: 0.5, blink: blinkCurve(f + 5), s: OS}} />
    </>
  );
};

/* =================== 6 — o parafuso a mais (engenharia de molusco) =================== */
const MAIS = at(10, "mais");
const TRX = -18;
const ROBO = at(10, "robo");
const TR = ROBO - 4; // vira robô
const QUE2 = at(10, "que", 1);
const RS = 1.45; // robô gigante
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const tight = ramp(f, MAIS - 8, MAIS);
  return (
    <>
      <Cam pos={[1.0, 1.95, 3.1]} look={[-0.8, 1.05, -0.5]} fov={46} f={f} a={a} punch={4} />
      <ShopScene />
      <Car p={CAR_W} rotY={0} c={{t, smile: 1 - tight, wide: tight, shake: f > MAIS ? 0.6 : 0}} s={CS} />
      <Octopus o={{pos: [0.75, 0, -0.75], rotY: -0.45, t, tools: true, work: 1, tips: {1: [-0.1 - 0.05 * Math.sin(t * 20) * tight, 1.15, 1.55]}, blink: blinkCurve(f + 5), mouth: 0.2, s: OS}} />
    </>
  );
};
const robotK = (f: number) => backOut(ramp(f, TR, TR + 14));
const StreetT: React.FC<{t: number}> = ({t}) => <StreetScene t={t} target={[TRX, 1.5, 1]} ext={8} />;
const S21: React.FC<ShotProps> = ({f, a, t}) => {
  const shake = ramp(f, a, a + 6);
  const boy = physics("b21" + a, (fr) => ({...idle(fr), pos: [TRX + 2.15, 0, 2.7], rotY: -0.65, ...HANDS_HEAD, eyeWide: ramp(fr, TR, TR + 6), mouthOpen: 0.5 * ramp(fr, TR, TR + 6), brow: 0.9, head: [-0.3, 0, 0]}), a, f, );
  return (
    <>
      <Cam pos={[TRX - 0.1, 2.6, 13.0]} look={[TRX - 0.1, 2.4, 0.4]} fov={52} f={f} a={a} />
      <StreetT t={t} />
      {f < TR + 2 && <Car p={[TRX, 0, 0.4]} rotY={0} c={{t, wide: 1, shake: 1.5 * shake, bounce: 0.3 * shake}} s={CS} />}
      <CarRobot p={[TRX, 0, 0.4]} rotY={0} t={t} k={robotK(f)} mic={false} dance={0} s={RS} />
      <Puff p={[TRX, 1.2, 0.6]} k={(f - TR + 2) / 24} color="#ffe9c9" />
      <Boy pose={boy} mohawk />
      <Octopus o={{pos: [TRX - 2.3, 0, 2.5], rotY: 0.6, t, thumbs: 0.6, mouth: 0.6, blink: 0, s: OS}} />
    </>
  );
};
/* "...que só quer ser cantor de pagode." */
const S22: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[TRX + 1.3, 2.7, 7.4]} look={[TRX, 3.3, 0.4]} fov={50} f={f} a={a} />
    <StreetT t={t} />
    <CarRobot p={[TRX, 0, 0.4]} rotY={-0.15} t={t} mic dance={ramp(f, a + 8, a + 20)} mouth={0.2 + 0.6 * Math.abs(Math.sin(t * 7))} s={RS} />
  </>
);
/* título: ENGENHARIA DE MOLUSCO — robô cantando, pasteleiro no pandeiro, todo mundo dançando */
const S23: React.FC<ShotProps> = ({f, a, t}) => {
  const ppalm = useRef<THREE.Object3D>(null);
  const past = physics("p23" + a, (fr) => ({...idle(fr), pos: [TRX + 2.3, 0, 2.0], rotY: -0.35, rShoulder: [-1.5, 0.3, 0.2], rElbow: -0.9 - 0.25 * Math.sin((fr / FPS) * 14), lShoulder: [-1.2, -0.3, -0.3], lElbow: -1.1, smile: 1, mouthOpen: 0.3, head: [0, 0, 0.1 * Math.sin((fr / FPS) * 7)]}), a, f);
  return (
    <>
      <Cam pos={[TRX + 0.1, 2.6, 13.6]} look={[TRX + 0.1, 2.2, 0.6]} fov={52} f={f} a={a} />
      <StreetT t={t} />
      <CarRobot p={[TRX, 0, 0.0]} rotY={0} t={t} mic dance={1} mouth={0.2 + 0.6 * Math.abs(Math.sin(t * 7))} s={RS} />
      <Pasteleiro pose={past} palmRef={ppalm} />
      <InHand palm={ppalm}>
        <Pandeiro p={[0, -0.02, 0.17]} r={[0, 0, 0]} s={1.3} />
      </InHand>
      <Toy pose={{...idle(f + 50), pos: [TRX - 2.2, 0, 2.3], rotY: 0.35, ...dancePose(t, 1)}} look={DANCER1} />
      <Toy pose={{...idle(f + 70), pos: [TRX + 0.9, 0, 3.4], rotY: -0.1, ...dancePose(t, 2.2)}} look={DANCER2} />
      <Boy pose={{...idle(f), pos: [TRX - 0.9, 0, 3.6], rotY: 0.15, ...dancePose(t, 0)}} mohawk />
      <Octopus o={{pos: [TRX - 3.1, 0, 0.6], rotY: 0.5, t, thumbs: 0.5 + 0.5 * Math.sin(t * 6), mouth: 0.5, s: OS}} />
    </>
  );
};

/* =================== 7 — a conta (inflação de polvo) =================== */
const CONTA = at(12, "conta");
const OITO = at(12, "oito", 0);
const EVOCE = at(12, "e", 0);
const DINHEIRO = at(12, "dinheiro");
const OCTO_C: V3 = [0.95, 0, -0.75];
const RC_TIP: V3 = [-0.55, 1.75, 0.75]; // ponta do braço com a conta (espaço do polvo)
const receiptLen = (f: number) => 3.6 * easeOut(ramp(f, CONTA - 2, CONTA + 40)) + 1.4 * ramp(f, OITO, OITO + 40);
const BOY_C: V3 = [-0.55, 0, 1.0];
const ContaOcto: React.FC<{f: number; t: number; extra?: Partial<OctoP>}> = ({f, t, extra = {}}) => (
  <Octopus o={{pos: OCTO_C, rotY: -0.45, t, blink: blinkCurve(f + 5), mouth: 0.3, tips: {7: RC_TIP}, s: OS, ...extra}}>
    <Receipt p={[RC_TIP[0], RC_TIP[1] - 0.02, RC_TIP[2] + 0.02]} len={receiptLen(f)} hang={RC_TIP[1] - 0.02} />
  </Octopus>
);
const S24: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b24" + a, (fr) => ({...idle(fr), pos: BOY_C, rotY: 0.6, rShoulder: [-0.3, 0, 0.1], rElbow: -0.4, eyeWide: ramp(fr, CONTA + 10, CONTA + 20) * 0.7, brow: 0.6, pupil: [0.3, -0.6], head: [0.2, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.3, 1.9, 5.8]} look={[0.15, 1.05, -0.3]} fov={52} f={f} a={a} />
      <ShopScene />
      <Car p={[-2.6, 0, -2.4]} rotY={0.3} c={{t, smile: 1}} s={CS} />
      <ContaOcto f={f} t={t} />
      <Boy pose={boy} mohawk />
    </>
  );
};
/* "Oito braços... oito vezes o preço." — o polvo mostrando os oito braços */
const FAN: Record<number, V3> = Object.fromEntries(
  [0, 1, 2, 5, 6].map((i) => {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    return [i, [Math.sin(a) * 1.05, 1.55 + 0.35 * Math.cos(a), Math.cos(a) * 0.45 + 0.2] as V3];
  }),
);
const S25: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 2, a + 12));
  const tips: Record<number, V3> = {7: RC_TIP};
  for (const i of [0, 1, 2, 5, 6]) {
    const w = FAN[i];
    tips[i] = [w[0], lerp(0.04, w[1], k) + 0.06 * Math.sin(t * 8 + i), w[2]];
  }
  return (
    <>
      <Cam pos={[0.65, 1.6, 3.6]} look={[0.75, 1.3, -0.7]} fov={50} f={f} a={a} punch={4} />
      <ShopScene />
      <Octopus o={{pos: OCTO_C, rotY: -0.25, t, blink: blinkCurve(f + 5), mouth: 0.5, tips, s: OS}}>
        <Receipt p={[RC_TIP[0], RC_TIP[1] - 0.02, RC_TIP[2] + 0.02]} len={receiptLen(f)} hang={RC_TIP[1] - 0.02} />
      </Octopus>
    </>
  );
};
/* "E você não tem dinheiro nenhum." — bolsos vazios e uma mosca */
const FLY0 = EVOCE + 18;
const Pockets: React.FC<{pos: V3; rotY: number; k: number}> = ({pos, rotY, k}) =>
  k < 0.01 ? null : (
    <group position={pos} rotation={[0, rotY, 0]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.29 * sd, 0.5, 0.02]} rotation={[0, 0, 0.45 * sd]} scale={[1, k, 1]} material={new THREE.MeshStandardMaterial({color: "#f4f4f2", roughness: 0.8})}>
          <boxGeometry args={[0.15, 0.2, 0.035]} />
        </mesh>
      ))}
    </group>
  );
const S26: React.FC<ShotProps> = ({f, a, t}) => {
  const out = easeOut(ramp(f, EVOCE + 4, EVOCE + 12));
  const boy = physics("b26" + a, (fr) => {
    const o = ramp(fr, EVOCE + 2, EVOCE + 10);
    return {...idle(fr), pos: BOY_C, rotY: 0.25, rShoulder: [-0.15 * o, 0, -0.35 * o], rElbow: -0.35 * o, lShoulder: [-0.15 * o, 0, 0.35 * o], lElbow: -0.35 * o, smile: 0, brow: lerp(0, 0.7, o), mouthOpen: 0.2 * ramp(fr, DINHEIRO - 4, DINHEIRO + 4), pupil: [0, -1]};
  }, a, f);
  const fk = ramp(f, FLY0, FLY0 + 30);
  return (
    <>
      <Cam pos={[-0.3, 1.3, 3.7]} look={[-0.5, 1.25, 0.9]} fov={46} f={f} a={a} />
      <ShopScene />
      <ContaOcto f={f} t={t} />
      <Boy pose={boy} mohawk />
      <Pockets pos={BOY_C} rotY={0.25} k={out} />
      {f >= FLY0 && <Fly p={[BOY_C[0] - 0.2 + 0.5 * fk, 0.62 + 1.1 * fk, BOY_C[2] + 0.2 + 0.4 * fk]} t={t} k={fk} />}
    </>
  );
};
/* título: INFLAÇÃO DE POLVO — boca aberta; o polvo batendo os oito pés */
const S27: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b27" + a, (fr) => ({...idle(fr), pos: BOY_C, rotY: 0.55, rShoulder: [-0.15, 0, -0.35], rElbow: -0.35, lShoulder: [-0.15, 0, 0.35], lElbow: -0.35, eyeWide: 1, mouthOpen: 0.75, brow: 1, head: [0.15, 0.2, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.2, 1.85, 5.8]} look={[0.15, 1.05, -0.3]} fov={52} f={f} a={a} />
      <ShopScene />
      <ContaOcto f={f} t={t} extra={{tapFeet: 1, mouth: 0, lean: 0.06 * Math.sin(t * 11)}} />
      <Boy pose={boy} mohawk />
      <Pockets pos={BOY_C} rotY={0.55} k={1} />
      <Fly p={[BOY_C[0] + 0.3, 1.55, BOY_C[2] + 0.5]} t={t} />
    </>
  );
};

/* =================== 8 — o pai lavando o polvo (pagamento paterno) =================== */
const DEIXA = at(14, "deixa");
const LAVANDO = at(14, "lavando");
const OCTO_L: V3 = [0.7, 0, -1.0];
const DAD_L: V3 = [2.45, 0, -0.35];
const WASH_TIP: V3 = [1.3, 1.0, 0.75]; // braço 1 levantado pro pai lavar (espaço do polvo, rotY 0)
const WashOcto: React.FC<{f: number; t: number}> = ({f, t}) => (
  <Octopus o={{pos: OCTO_L, rotY: 0, t, shades: true, foam: 1, mouth: 0, work: 0, tips: {1: [WASH_TIP[0], WASH_TIP[1] + 0.03 * Math.sin(t * 9), WASH_TIP[2]]}, lean: -0.08, s: OS}} />
);
const scrub = (fr: number): Pose => ({rShoulder: [-1.28 + 0.12 * Math.sin((fr / FPS) * 16), 0.98, 0.1], rElbow: -0.47 - 0.25 * Math.sin((fr / FPS) * 16)});
const Foam: React.FC<{t: number; c: V3}> = ({t, c}) => (
  <>
    {Array.from({length: 10}, (_, i) => {
      const k = (t * 0.35 + i / 10) % 1;
      return (
        <mesh key={i} position={[c[0] + 0.5 * Math.sin(i * 2.4), c[1] + k * 1.6, c[2] + 0.4 * Math.cos(i * 1.7)]}>
          <sphereGeometry args={[0.035 + 0.025 * (i % 3), 10, 8]} />
          <meshStandardMaterial color="#e6f6ff" roughness={0.1} transparent opacity={0.55 * (1 - k)} />
        </mesh>
      );
    })}
  </>
);
/* "Então você paga do único jeito possível..." — o menino tem uma ideia */
const S28: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b28" + a, (fr) => ({...idle(fr), pos: BOY_C, rotY: 0.2, ...CHIN, smile: ramp(fr, a + 20, a + 30), brow: lerp(0.2, -0.5, ramp(fr, a + 20, a + 30)), pupil: [-0.8, 0.4], head: [0.05, 0, -0.1]}), a, f);
  return (
    <>
      <Cam pos={[-0.25, 1.65, 3.1]} look={[-0.5, 1.5, 0.9]} fov={42} f={f} a={a} />
      <ShopScene />
      <ContaOcto f={f} t={t} />
      <Boy pose={boy} mohawk />
    </>
  );
};
/* "...deixa o seu pai trabalhando na oficina..." */
const S29: React.FC<ShotProps> = ({f, a, b, t}) => {
  const spalm = useRef<THREE.Object3D>(null);
  const dad = physics("d29" + a, (fr) => ({...idle(fr + 13), pos: DAD_L, rotY: -1.2, rShoulder: [-0.9, 0.3, 0.1], rElbow: -0.9, brow: 0.7, mouthOpen: 0.25, head: [0, 0.5, 0]}), a, f);
  const boy = physics("b29" + a, (fr) => {
    const k = clamp((fr - a) / (b - a));
    return {...idle(fr), pos: [lerp(-0.25, -0.9, k), 0, lerp(1.5, 2.4, k)], rotY: 0.35, rShoulder: [-2.7, 0, -0.3 + 0.35 * Math.sin((fr / FPS) * 12)], rElbow: -0.5, smile: 1, brow: -0.3, walk: (fr / FPS) * 8, walkAmt: 0.7};
  }, a, f);
  return (
    <>
      <Cam pos={[0.9, 2.1, 8.2]} look={[0.85, 1.05, -0.3]} fov={56} f={f} a={a} />
      <ShopScene />
      <WashOcto f={f} t={t} />
      <Bucket p={[2.1, 0, 0.55]} t={t} />
      <Dad pose={dad} palmRef={spalm} />
      <InHand palm={spalm}>
        <Sponge p={[0, -0.03, 0.06]} s={1.3} />
      </InHand>
      <Boy pose={boy} mohawk />
    </>
  );
};
/* "...lavando os braços do polvo." */
const S30: React.FC<ShotProps> = ({f, a, t}) => {
  const spalm = useRef<THREE.Object3D>(null);
  const dad = physics("d30" + a, (fr) => ({...idle(fr + 13), pos: DAD_L, rotY: -1.75, ...scrub(fr), brow: 0.5, mouthOpen: 0, smile: 0, head: [0.15, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[1.9, 1.75, 4.2]} look={[1.85, 1.1, -0.5]} fov={48} f={f} a={a} />
      <ShopScene />
      <WashOcto f={f} t={t} />
      <Bucket p={[2.1, 0, 0.55]} t={t} />
      <Dad pose={dad} palmRef={spalm} />
      <InHand palm={spalm}>
        <Sponge p={[0, -0.03, 0.06]} s={1.3} />
      </InHand>
      <Foam t={t} c={[1.9, 0.9, -0.3]} />
    </>
  );
};
/* título: PAGAMENTO PATERNO — o pai olhando pra câmera: "sério isso?" */
const S31: React.FC<ShotProps> = ({f, a, t}) => {
  const spalm = useRef<THREE.Object3D>(null);
  const look = ramp(f, a + 6, a + 16);
  const dad = physics("d31" + a, (fr) => {
    const lk = ramp(fr, a + 6, a + 16);
    return {...idle(fr + 13), pos: DAD_L, rotY: lerp(-1.75, -0.35, lk), ...scrub(fr), rShoulder: [lerp(-1.28, -0.7, lk), 0.6, 0.1], brow: -0.25, smile: 0, mouthOpen: 0, head: [0.1, 0, -0.08 * lk], blink: 0.25};
  }, a, f);
  return (
    <>
      <Cam pos={[2.0, 1.75, 2.6 + 0.3 * (1 - look)]} look={[2.1, 1.55, -0.4]} fov={44} f={f} a={a} punch={3} />
      <ShopScene />
      <WashOcto f={f} t={t} />
      <Dad pose={dad} palmRef={spalm} />
      <InHand palm={spalm}>
        <Sponge p={[0, -0.03, 0.06]} s={1.3} />
      </InHand>
      <Foam t={t} c={[1.3, 0.9, -0.6]} />
    </>
  );
};

/* =================== 9 — Parabéns + volta pro começo =================== */
const PB = L(16);
const ETROCOU = at(16, "e", 0);
const S32: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b32" + a, (fr) => ({...idle(fr), pos: [TRX + 0.4, 0, 3.4], rotY: 0.1, ...ARMS_UP, rShoulder: [-2.9 + 0.2 * Math.sin((fr / FPS) * 9), 0, -0.35], smile: 1, mouthOpen: 0.4, squash: 0.08 * Math.abs(Math.sin((fr / FPS) * 9))}), a, f);
  return (
    <>
      <Cam pos={[TRX + 0.4, 2.2, 9.6]} look={[TRX + 0.2, 2.1, 0.8]} fov={52} f={f} a={a} />
      <StreetT t={t} />
      <CarRobot p={[TRX, 0, 0.0]} rotY={0} t={t} mic dance={1} mouth={0.2 + 0.6 * Math.abs(Math.sin(t * 7))} s={RS} />
      <Boy pose={boy} mohawk />
    </>
  );
};
const S33: React.FC<ShotProps> = ({f, a, t}) => {
  const spalm = useRef<THREE.Object3D>(null);
  const dad = physics("d33" + a, (fr) => ({...idle(fr + 13), pos: DAD_L, rotY: -1.75, ...scrub(fr), brow: 0.5}), a, f);
  return (
    <>
      <Cam pos={[1.75, 2.0, 6.0]} look={[1.6, 1.05, -0.5]} fov={52} f={f} a={a} />
      <ShopScene />
      <WashOcto f={f} t={t} />
      <Bucket p={[2.1, 0, 0.55]} t={t} />
      <Dad pose={dad} palmRef={spalm} />
      <InHand palm={spalm}>
        <Sponge p={[0, -0.03, 0.06]} s={1.3} />
      </InHand>
      <Foam t={t} c={[1.9, 0.9, -0.3]} />
    </>
  );
};
/* "E agora, lá da oficina, o seu pai liga..." — o celular toca */
const LIGA = at(17, "liga");
const EPEDE = at(17, "e", 1);
const BOY34: V3 = [TRX + 1.6, 0, 3.3];
const S34: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boy = physics("b34" + a, (fr) => {
    const ans = ramp(fr, LIGA - 8, LIGA + 2);
    return {...idle(fr), pos: BOY34, rotY: -0.25, rShoulder: [lerp(-1.1, -1.654, ans), lerp(0, 0.385, ans), lerp(0.2, -0.484, ans)], rElbow: lerp(-0.9, -1.914, ans), smile: 0.6, pupil: [0, -0.8 * (1 - ans)], head: [0.2 * (1 - ans), 0, 0]};
  }, a, f);
  const ring = f < LIGA - 6 ? 1 : 0;
  return (
    <>
      <Cam pos={[TRX + 1.0, 2.0, 7.4]} look={[TRX + 0.6, 1.9, 0.6]} fov={50} f={f} a={a} />
      <StreetT t={t} />
      <CarRobot p={[TRX - 0.6, 0, -0.2]} rotY={0.2} t={t} mic dance={1} mouth={0.2 + 0.6 * Math.abs(Math.sin(t * 7))} s={RS} />
      <Boy pose={boy} palmRef={palm} mohawk />
      <InHand palm={palm}>
        <Phone p={[0, -0.03, 0.04]} r={[0, 0, 0]} s={1.3} ring={ring} t={t} />
      </InHand>
    </>
  );
};
/* "...e pede pra você levar o carro no mecânico." — engole seco, olha pro robô */
const S35: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boy = physics("b35" + a, (fr) => {
    const lk = ramp(fr, at(17, "carro") - 8, at(17, "carro"));
    return {...idle(fr), pos: BOY34, rotY: -0.25, ...PHONE_EAR, eyeWide: lerp(0.3, 1, lk), brow: lerp(0.3, 1, lk), mouthOpen: 0.1 + 0.2 * lk, smile: 0, head: [0, 0.7 * lk, 0.05], pupil: [0.8 * lk, 0.3]};
  }, a, f);
  return (
    <>
      <Cam pos={[TRX + 1.5, 2.0, 6.4]} look={[TRX + 1.3, 1.9, 0.6]} fov={44} f={f} a={a} punch={4} />
      <StreetT t={t} />
      <CarRobot p={[TRX - 0.6, 0, -0.2]} rotY={0.2} t={t} mic dance={1} mouth={0.2 + 0.6 * Math.abs(Math.sin(t * 7))} s={RS} />
      <Boy pose={boy} palmRef={palm} mohawk />
      <InHand palm={palm}>
        <Phone p={[0, -0.03, 0.04]} s={1.3} t={t} />
      </InHand>
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: at(0, "so"), Comp: S2},
  {from: at(0, "e", 0), Comp: S3},
  {from: L(1), Comp: S4},
  {from: L(2), Comp: S5},
  {from: at(2, "e", 0), Comp: S6},
  {from: at(2, "que"), Comp: S7},
  {from: L(3), Comp: S8},
  {from: L(4), Comp: S9},
  {from: MAS, Comp: S10},
  {from: L(5), Comp: S11},
  {from: L(6), Comp: S12},
  {from: DISF, Comp: S13},
  {from: L(7), Comp: S14},
  {from: L(8), Comp: S15},
  {from: at(8, "e", 0), Comp: S16},
  {from: COM, Comp: S17},
  {from: at(8, "e", 2), Comp: S18},
  {from: L(9), Comp: S19},
  {from: L(10), Comp: S20},
  {from: at(10, "e", 0), Comp: S21},
  {from: QUE2, Comp: S22},
  {from: L(11), Comp: S23},
  {from: L(12), Comp: S24},
  {from: OITO, Comp: S25},
  {from: EVOCE, Comp: S26},
  {from: L(13), Comp: S27},
  {from: L(14), Comp: S28},
  {from: DEIXA, Comp: S29},
  {from: LAVANDO, Comp: S30},
  {from: L(15), Comp: S31},
  {from: PB, Comp: S32},
  {from: ETROCOU, Comp: S33},
  {from: L(17), Comp: S34},
  {from: EPEDE, Comp: S35},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_MEC} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["pai", "carro", "mecanico", "ligar", "humor", "cafezinho", "automotivo", "cafe", "agitado", "correndo", "cidade", "forro", "cafeina", "motor", "pombo", "re", "carona", "reversa", "feira", "melancia", "camuflagem", "hortifruti", "polvo", "oito", "bracos", "pneu", "oleo", "bateria", "cabelo", "oficina", "tentacular", "parafuso", "robo", "gigante", "pagode", "engenharia", "molusco", "conta", "braco", "preco", "dinheiro", "inflacao", "lavando", "pagamento", "paterno", "parabens", "moicano", "revisao", "liga"]);
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; color?: string; size?: number}> = ({from, to, text, x, y, color = "#101018", size = 70}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 400, top: y, width: 800, display: "flex", justifyContent: "center", transform: `scale(${s}) rotate(-3deg)`}}>
      <div style={{background: "#fff", color, fontFamily, fontWeight: 900, fontSize: size, padding: "16px 40px", borderRadius: 40, border: "8px solid #101018", textAlign: "center", lineHeight: 1.05, boxShadow: "0 10px 0 rgba(0,0,0,0.25)"}}>{text}</div>
    </div>
  );
};
/** notinhas musicais */
const Notes: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {Array.from({length: 6}, (_, i) => {
        const k = ((f - from) / 36 + i / 6) % 1;
        return (
          <div key={i} style={{position: "absolute", left: x + Math.sin(i * 2.1 + k * 5) * 260, top: y - k * 420, fontSize: 80 + 30 * (i % 2), color: ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f"][i % 4], WebkitTextStroke: "5px #101018", paintOrder: "stroke fill", opacity: 1 - k * k, transform: `rotate(${-15 + i * 9}deg)`, fontFamily}}>
            {i % 2 ? "♪" : "♫"}
          </div>
        );
      })}
    </>
  );
};
/** cartão "seguir o perfil" (aparece no fim, aperta o botão e vira "Seguindo") */
const HANDLE = "@e.naoepossivel";
const FollowCard: React.FC<{from: number; to: number; tap: number}> = ({from, to, tap}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 8, to));
  const done = f >= tap + 2;
  const press = 1 - 0.08 * Math.sin(clamp((f - tap + 3) / 6) * Math.PI);
  // dedinho chegando e apertando
  const hk = easeInOut(ramp(f, tap - 18, tap - 2));
  const hx = lerp(1000, 760, hk);
  const hy = lerp(1820, 1590, hk) + (f >= tap - 2 && f < tap + 4 ? 14 : 0);
  const hOp = 1 - ramp(f, tap + 10, tap + 18);
  return (
    <>
      <div style={{position: "absolute", left: 70, top: 1440, width: 940, height: 230, transform: `scale(${s})`, transformOrigin: "50% 50%"}}>
        <div style={{position: "absolute", inset: 0, background: "#ffffff", borderRadius: 48, boxShadow: "0 14px 0 rgba(0,0,0,0.22), 0 0 0 6px rgba(16,16,24,0.9)", display: "flex", alignItems: "center", padding: "0 34px", gap: 26}}>
          <div style={{width: 160, height: 160, borderRadius: "50%", overflow: "hidden", border: "6px solid #ffd21f", flexShrink: 0, background: "#eee"}}>
            <Img src={staticFile("perfil.png")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </div>
          <div style={{flex: 1, fontFamily, fontWeight: 900, fontSize: 54, color: "#101018", letterSpacing: -1, whiteSpace: "nowrap"}}>{HANDLE}</div>
          <div
            style={{
              flexShrink: 0,
              transform: `scale(${press})`,
              background: done ? "#e4e4ea" : "#ffd21f",
              color: done ? "#3a3a44" : "#101018",
              fontFamily,
              fontWeight: 900,
              fontSize: 46,
              padding: "20px 30px",
              borderRadius: 30,
              border: done ? "5px solid #c9c9d2" : "5px solid #101018",
              whiteSpace: "nowrap",
            }}
          >
            {done ? "Seguindo ✓" : "+ Seguir"}
          </div>
        </div>
      </div>
      {hOp > 0.01 && f >= tap - 20 && (
        <div style={{position: "absolute", left: hx, top: hy, fontSize: 130, opacity: hOp, transform: "rotate(-20deg)", filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.3))"}}>👆</div>
      )}
    </>
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
const FOLLOW_FROM = L(17) + 8;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoMec: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(1), L(3), L(5), L(7), L(9), L(11), L(13), L(15)];
  const end = (i: number) => (i < 17 ? L(i + 1) - 3 : TOTAL_MEC);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={L(1) + 4} to={end(1)} lines={["MAU HUMOR", "AUTOMOTIVO"]} />
      <StageTitle from={L(3) + 4} to={end(3)} lines={["CAFEÍNA", "DE MOTOR"]} />
      <StageTitle from={L(5) + 4} to={end(5)} lines={["CARONA", "REVERSA"]} />
      <StageTitle from={L(7) + 4} to={end(7)} lines={["CAMUFLAGEM", "HORTIFRÚTI"]} />
      <StageTitle from={L(9) + 4} to={end(9)} lines={["OFICINA", "TENTACULAR"]} />
      <StageTitle from={L(11) + 4} to={end(11)} lines={["ENGENHARIA", "DE MOLUSCO"]} />
      <StageTitle from={L(13) + 4} to={end(13)} lines={["INFLAÇÃO", "DE POLVO"]} />
      <StageTitle from={L(15) + 4} to={end(15)} lines={["PAGAMENTO", "PATERNO"]} />

      <Bubble from={at(0, "cafezinho") - 4} to={L(1) - 2} text="☕ ?" x={540} y={330} size={110} />
      <Notes from={BUZINA} to={L(4) - 2} x={500} y={900} />
      <Bubble from={at(4, "carona") - 4} to={MAS - 2} text="CARONA? 👍" x={540} y={330} />
      <Chip from={at(4, "re") - 2} to={L(5) - 3} text="◀◀ RÉ" bg="#e8262d" top={300} size={100} />
      <Sparkles from={MAIS - 2} to={MAIS + 24} x={420} y={900} r={200} />
      <Chip from={MAIS} to={MAIS + 30} text="PLIM! 🔩" bg="#3a86ff" top={300} size={100} />
      <Notes from={QUE2 + 6} to={L(12) - 2} x={480} y={700} />
      <Chip from={OITO - 2} to={EVOCE - 3} text="CONTA: x8 😱" bg="#e8262d" top={290} size={96} />
      <Confetti from={PB} to={PB + 120} />
      <Chip from={PB + 1} to={at(16, "cafe") - 3} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(16, "cafe")} to={ETROCOU - 3} x={190} y={420} rot={-6} label="CAFÉ PRO CARRO">
        <g transform="translate(152,105)">
          <path d="M -50 -30 L 50 -30 L 38 60 L -38 60 Z" fill="#ffffff" stroke="#101018" strokeWidth={6} />
          <path d="M 50 -10 c 40 0 40 45 0 45" fill="none" stroke="#101018" strokeWidth={8} />
          <ellipse cx={0} cy={-30} rx={50} ry={10} fill="#5a3418" stroke="#101018" strokeWidth={5} />
          <path d="M -15 -55 q 10 -15 0 -30 M 15 -55 q 10 -15 0 -30" stroke="#9aa0aa" strokeWidth={6} fill="none" />
        </g>
      </Sticker>
      <Sticker from={at(16, "pombo")} to={ETROCOU - 3} x={540} y={400} rot={4} label="POMBO DE RÉ">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={20} rx={62} ry={50} fill="#9aa3b2" stroke="#101018" strokeWidth={6} />
          <circle cx={-48} cy={-32} r={30} fill="#b4bcc8" stroke="#101018" strokeWidth={6} />
          <circle cx={-56} cy={-38} r={6} fill="#101018" />
          <path d="M -78 -30 L -96 -24 L -78 -20 Z" fill="#3a3a44" />
          <path d="M 30 -60 L 80 -60 M 70 -72 L 82 -60 L 70 -48" stroke="#e8262d" strokeWidth={9} fill="none" strokeLinecap="round" />
        </g>
      </Sticker>
      <Sticker from={at(16, "achou")} to={ETROCOU - 3} x={890} y={430} rot={6} label="CARRO-MELANCIA">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={10} rx={78} ry={58} fill="#3f9a35" stroke="#101018" strokeWidth={6} />
          <path d="M -40 -40 q -10 50 0 100 M 0 -48 q -10 55 0 115 M 40 -40 q -10 50 0 100" stroke="#1f5e1a" strokeWidth={10} fill="none" />
          <circle cx={-26} cy={14} r={15} fill="#fff" stroke="#101018" strokeWidth={4} />
          <circle cx={26} cy={14} r={15} fill="#fff" stroke="#101018" strokeWidth={4} />
          <circle cx={-24} cy={16} r={7} fill="#101018" />
          <circle cx={28} cy={16} r={7} fill="#101018" />
        </g>
      </Sticker>
      <Sticker from={at(16, "moicano")} to={ETROCOU - 3} x={540} y={1020} rot={-4} label="MOICANO">
        <g transform="translate(152,110)">
          <circle cx={0} cy={15} r={58} fill="#dfac80" stroke="#101018" strokeWidth={6} />
          <path d="M -14 -40 L -6 -95 L 4 -45 L 12 -100 L 18 -42 Z" fill="#3b2416" stroke="#101018" strokeWidth={5} />
          <circle cx={-20} cy={15} r={8} fill="#101018" />
          <circle cx={20} cy={15} r={8} fill="#101018" />
          <path d="M -16 38 q 16 14 32 0" stroke="#101018" strokeWidth={6} fill="none" />
        </g>
      </Sticker>
      <Chip from={at(16, "revisao") - 2} to={L(17) - 3} text="1 PAI = 1 REVISÃO 🔧" bg="#2e8b57" top={290} size={78} />

      <Captions words={words} keys={KEYS} />

      <FollowCard from={FOLLOW_FROM} to={TOTAL_MEC - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozmec.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 12) * (1 - ramp(fr, TOTAL_MEC - 20, TOTAL_MEC)) * (1 - 0.7 * ramp(fr, QUE2, QUE2 + 10) * (1 - ramp(fr, L(12) - 10, L(12))))} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FX * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FX * 0.75} />
      ))}
      <SND src="sfx3/lock.mp3" from={LIGAR} dur={30} v={FX * 0.6} />
      <SND src="sfx7/truck.mp3" from={LIGAR + 4} dur={40} v={FX * 0.45} />
      <SND src="sfx9/yawn.mp3" from={ACORDA} dur={45} v={FX * 0.5} />
      <SND src="sfx13/growl.mp3" from={at(0, "humor") - 2} dur={50} v={FX * 0.4} />
      <SND src="sfx11/water.mp3" from={SIP - 6} dur={30} v={FX * 0.45} />
      <SND src="sfx9/wobble.mp3" from={AGITADO - 4} dur={40} v={FX * 0.5} />
      <SND src="sfx7/brake.mp3" from={DEP - 2} dur={40} v={FX * 0.45} />
      <SND src="sfx14/forro.mp3" from={BUZINA - 2} dur={L(4) - BUZINA} v={FX * 0.55} loop />
      <SND src="sfx5/run.mp3" from={L(3)} dur={L(4) - L(3)} v={FX * 0.4} loop />
      <SND src="sfx8/wings.mp3" from={POMBO - 20} dur={40} v={FX * 0.6} />
      <SND src="sfx8/coo.mp3" from={POMBO + 6} dur={40} v={FX * 0.5} />
      <SND src="sfx8/wings.mp3" from={MAS} dur={L(6) - MAS} v={FX * 0.45} loop />
      <SND src="sfx14/re.mp3" from={MAS + 10} dur={L(6) - MAS - 10} v={FX * 0.4} loop />
      <SND src="sfx5/crowdday.mp3" from={L(6)} dur={L(8) - L(6)} v={FX * 0.35} />
      <SND src="sfx14/buzina.mp3" from={HONK - 2} dur={30} v={FX * 0.55} />
      <SND src="sfx12/poof.mp3" from={DROP} dur={40} v={FX * 0.7} />
      <SND src="sfx10/rattle.mp3" from={COM} dur={at(8, "e", 2) - COM} v={FX * 0.45} loop />
      <SND src="sfx14/tesoura.mp3" from={CORTA - 4} dur={MOH - CORTA + 6} v={FX * 0.55} loop />
      <SND src="sfx12/poof.mp3" from={MOH - 3} dur={40} v={FX * 0.5} />
      <SND src="sfx10/plim.mp3" from={MAIS} dur={30} v={FX * 0.7} />
      <SND src="sfx11/grow.mp3" from={TR - 6} dur={50} v={FX * 0.6} />
      <SND src="sfx7/crash.mp3" from={TR} dur={40} v={FX * 0.45} />
      <SND src="sfx13/pagode.mp3" from={QUE2 + 4} dur={L(12) - QUE2 - 4} v={FX * 0.55} loop />
      <SND src="sfx14/papel.mp3" from={CONTA - 2} dur={50} v={FX * 0.5} />
      <SND src="sfx7/cash.mp3" from={at(12, "preco") - 2} dur={40} v={FX * 0.55} />
      <SND src="sfx10/fly.mp3" from={FLY0} dur={L(14) - FLY0} v={FX * 0.45} />
      <SND src="sfx12/gasp.mp3" from={L(13) + 2} dur={40} v={FX * 0.45} />
      <SND src="sfx9/stamp.mp3" from={L(13) + 8} dur={L(14) - L(13) - 8} v={FX * 0.3} loop />
      <SND src="sfx10/bubble.mp3" from={DEIXA} dur={L(16) - DEIXA} v={FX * 0.4} loop />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FX * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FX * 0.45} />
      {["cafe", "pombo", "achou", "moicano"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(16, w)} dur={22} v={FX * 0.55} />
      ))}
      <SND src="sfx3/ring.mp3" from={L(17) - 4} dur={LIGA - L(17)} v={FX * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FX * 0.8} />
    </AbsoluteFill>
  );
};
