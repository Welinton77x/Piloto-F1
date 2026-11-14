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
import {Pigeon} from "./Sets6";
import {FlowerArch} from "./Sets10";
import {Dog, Sofa, TV, RoomShell, Beard, sm, rbox} from "./Sets9";
import {DadHead} from "./Sets12";
import {Ball, Stadium, Capivara} from "./Sets17";
import {Campinho, ChineloGoal, BrickGoal, FlipFlop, Space, Satellite, BananaMic, Bouquet, DirtPile, Museum, SafariHat, HouseWindow, CoffeeCup, ChineloStatue, FlyingDuck, Scoreboard, LeatherHat, Accordion, Zabumba, Triangle, Cane, BigGlove} from "./Sets18";
import {HeadGlasses} from "./Sets17";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingFutebol.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_FUTEBOL = F(words[words.length - 1].e + 0.9);

/* ---------- visuais ---------- */
const BOYL: ToyLook = {hoodie: true, socks: "#ffffff", shoe: "#e8414f", sole: "#101018"};
const BOY_CHINELO: ToyLook = {hoodie: true, flipflop: true, shoe: "#2e86de", sole: "#ffffff"};
const JUNINHO: ToyLook = {shirt: "#2ecc71", pants: "#ffffff", hairStyle: "curly", hair: "#2a1a10"};
const AMIGOS: ToyLook[] = [
  {shirt: "#e8414f", pants: "#101018", hairStyle: "spiky", hair: "#2a1a10"},
  {shirt: "#2e86de", pants: "#ffffff", hairStyle: "buzz", hair: "#4a3020"},
  {shirt: "#ffd21f", pants: "#2e86de", hairStyle: "mohawk", hair: "#101018"},
  JUNINHO,
];
const TIO: ToyLook = {shirt: "#c0392b", plaid: "#1f2a44", pants: "#6b5b45", hairStyle: "buzz", hair: "#2a1a10", belly: 1};
const VO: ToyLook = {hairStyle: "bun", hair: "#e6e6e6", shirt: "#8e5aa8", pants: "#5a4a6a", skin: "#f1c8a0"};
const TIA1: ToyLook = {hairStyle: "curly", hair: "#d9d9d9", shirt: "#f06292", pants: "#5a4a6a", skin: "#e9b88a"};
const TIA2: ToyLook = {hairStyle: "bun", hair: "#b0b0b0", shirt: "#26c6da", pants: "#3a3f4a"};
const NOIVA: ToyLook = {dress: true, veil: true, hairStyle: "long", hair: "#5a3a20", lashes: true, lips: "#d6455d"};
const NOIVO: ToyLook = {suit: true, hairStyle: "buzz", hair: "#101018"};
const TECNICO: ToyLook = {suit: true, hairStyle: "bald", skin: "#e9b88a"};
const ARQUEOLOGO: ToyLook = {shirt: "#c9a46a", pants: "#8a6a4a", hairStyle: "buzz", hair: "#5a3a20"};
const MAE: ToyLook = {apron: true, shirt: "#2e86de", hairStyle: "ponytail", hair: "#2a1a10", lips: "#c0392b"};
const FORRO: ToyLook[] = [
  {shirt: "#ff8a1f", pants: "#5a3a20", hairStyle: "buzz"},
  {shirt: "#e8414f", pants: "#3a4a6a", hairStyle: "buzz"},
  {shirt: "#ffd21f", pants: "#5a3a20", hairStyle: "buzz"},
];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const POINT_UP: Pose = {rShoulder: [-2.6, 0, -0.3], rElbow: -0.2};
const SHOUT: Pose = {rShoulder: [-1.4, 0.4, -0.3], rElbow: -1.2, lShoulder: [-1.4, -0.4, 0.3], lElbow: -1.2, mouthOpen: 1, eyeWide: 0.6};

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
    palm.current.matrixWorld.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const HandToy: React.FC<{pose: Pose; look: ToyLook; headExtra?: React.ReactNode; item: React.ReactNode; left?: React.ReactNode}> = ({pose, look, headExtra, item, left}) => {
  const palm = useRef<THREE.Object3D>(null);
  const lpalm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Toy pose={pose} look={look} palmRef={palm} lPalmRef={lpalm} headExtra={headExtra} />
      <InHand palm={palm}>{item}</InHand>
      {left && <InHand palm={lpalm}>{left}</InHand>}
    </>
  );
};

/* ---------- o campinho no bairro ---------- */
const FZ = 8; // campinho fica na grama na frente das casas (z = FZ)
const DayLights: React.FC<{x?: number; z?: number}> = ({x = 0, z = FZ}) => (
  <>
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[x, 1, z]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
  </>
);
const Bairro: React.FC<{t: number; grass?: number}> = ({t, grass = 0}) => (
  <>
    <Town t={t} galo={false} variant="nova" flat clouds />
    <group position={[0, 0, FZ]} rotation={[0, Math.PI / 2, 0]}>
      <Campinho grass={grass} />
    </group>
  </>
);
/** gols ao longo de x: chinelo em x = -8, tijolo em x = +8 */
const Goals: React.FC = () => (
  <>
    <ChineloGoal p={[-8, 0, FZ]} rotY={Math.PI / 2} />
    <BrickGoal p={[8, 0, FZ]} rotY={Math.PI / 2} />
  </>
);
const friendPos = (i: number): V3 => [[-2.6, 0, FZ - 1.8], [2.4, 0, FZ - 2.2], [-1.4, 0, FZ - 3.2], [1.2, 0, FZ - 3.0]][i] as V3;

/* =================== abertura =================== */
const CINCO0 = at(0, "cinco");
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.2, FZ + 6.5]} look={[0, 1.1, FZ - 1]} fov={56} f={f} a={a} />
    <DayLights />
    <Bairro t={t} />
    <Goals />
    {AMIGOS.map((lk, i) => {
      const p = friendPos(i);
      return <Toy key={i} pose={{...idle(f + i * 9), pos: [p[0], Math.abs(Math.sin(t * 6 + i)) * 0.15, p[2]], rotY: (i % 2 ? -0.4 : 0.4), ...(i % 2 ? ARMS_UP : {}), smile: 0.6}} look={lk} />;
    })}
    <Toy pose={{...idle(f), pos: [0, 0, FZ], rotY: 0, brow: 0.5}} look={BOYL} />
    <Ball p={[0.6, 0.15, FZ + 0.6]} s={1.4} />
  </>
);
/* Nº 1 — tomando distância pra chutar */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeInOut(ramp(f, a + 6, a + 60));
  return (
    <>
      <Cam pos={[2.2, 1.6, FZ + 4.5]} look={[0.2, 0.9, FZ]} fov={52} f={f} a={a} />
      <DayLights />
      <Bairro t={t} />
      <Goals />
      <Toy pose={{...idle(f), pos: [lerp(0.2, -0.9, k), 0, FZ + lerp(0.2, 1.2, k)], rotY: 2.4, walk: t * 8, walkAmt: k < 1 ? 1 : 0, brow: -0.5}} look={BOYL} />
      <Ball p={[0.7, 0.15, FZ - 0.2]} s={1.4} />
    </>
  );
};
/* a bola subindo */
const SOBE = at(2, "sobe");
const E2 = at(2, "e", 0);
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a - 6) / FPS;
  const by = k < 0 ? 0.15 : 0.15 + k * 9;
  return (
    <>
      <Cam pos={[2.5, 1.6 + Math.max(0, k) * 4.5, FZ + 5]} look={[0.7, Math.max(1, by - 1), FZ - 0.5]} fov={56} f={f} a={a} />
      <DayLights />
      <Bairro t={t} />
      <Goals />
      <Toy pose={{...idle(f), pos: [-0.1, 0, FZ + 0.6], rotY: 2.4, rShoulder: [-1, 0, -0.6], lShoulder: [-1, 0, 0.6], head: [-0.4, 0, 0], mouthOpen: 0.5, eyeWide: 0.5}} look={BOYL} />
      <Ball p={[0.7, by, FZ - 0.5]} s={1.4} />
    </>
  );
};
const S2b: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  const ang = k * 1.2;
  return (
    <>
      <Cam pos={[0, 0.6, 6]} look={[0, -0.4, 0]} fov={50} f={f} a={a} />
      <Space t={t} />
      <hemisphereLight args={["#ffffff", "#202030", 0.5]} />
      <directionalLight position={[5, 4, 6]} intensity={2.2} />
      <Satellite p={[-1.4, 0.6, 0]} r={[0.3, t * 0.4, 0.2]} s={0.7} />
      <Ball p={[Math.cos(ang) * 1.8, 0.5 + Math.sin(ang) * 0.3, Math.sin(ang) * 1.2]} s={3} />
    </>
  );
};
/* a TV do bairro e o tio narrador */
const TIO3 = at(3, "tio");
const BANANA = at(3, "banana");
const rachaTvTex = (i: number) =>
  canvasTex("tv-racha-" + i, 256, 150, (c) => {
    c.fillStyle = "#c48a52";
    c.fillRect(0, 0, 256, 150);
    c.fillStyle = "#4fae3a";
    c.fillRect(0, 0, 256, 30);
    const r = rng(i + 3);
    const cols = ["#e8414f", "#2e86de", "#ffd21f", "#2ecc71", "#ffd21f"];
    for (let k = 0; k < 5; k++) {
      c.fillStyle = cols[k];
      const x = 30 + r() * 200, y = 50 + r() * 80;
      c.fillRect(x, y, 10, 22);
      c.beginPath();
      c.arc(x + 5, y - 6, 6, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(128 + (i - 1) * 30, 110, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e8262d";
    c.fillRect(8, 8, 60, 18);
    c.fillStyle = "#ffffff";
    c.font = "bold 14px sans-serif";
    c.fillText("AO VIVO", 12, 22);
  });
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const fr = Math.floor(f / 8) % 3;
  const tex = rachaTvTex(fr);
  return (
    <>
      <Cam pos={[0.9, 1.5, 0.6]} look={[-0.2, 1.1, 2.95]} fov={58} f={f} a={a} />
      <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
      <pointLight position={[0.2, 2.9, 0.4]} intensity={9} distance={10} decay={1.4} color="#fff4e0" />
      <RoomShell wall="#ffe3b8" accent="#3a86ff" />
      <TV p={[-0.4, 0, 2.95]} rotY={Math.PI} />
      <mesh position={[-0.4, 1.18, 2.93]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.65, 0.92]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {f >= TIO3 - 2 && (
        <HandToy
          pose={{...idle(f), pos: [0.75, 0, 2.0], rotY: Math.PI + 0.5, rShoulder: [-1.65, 0.45, -0.2], rElbow: -1.7, mouthOpen: 0.4 + 0.4 * Math.abs(Math.sin(t * 11)), eyeWide: 0.5}}
          look={TIO}
          headExtra={<DadHead />}
          item={<BananaMic p={[0, 0.02, 0.06]} r={[0, 0, 1.4]} s={1.4} />}
        />
      )}
    </>
  );
};

/* =================== Nº 2 — o cachorro goleiro =================== */
const BOCA5 = at(5, "boca");
const CORRENDO5 = at(5, "correndo");
const DOG_G: V3 = [-7.6, 0, FZ];
const S4: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-4.6, 1.4, FZ + 1.8]} look={[-7.6, 0.6, FZ]} fov={50} f={f} a={a} />
    <DayLights x={-7} />
    <Bairro t={t} />
    <Goals />
    <Dog d={{pos: DOG_G, rotY: Math.PI / 2, t, blink: blinkCurve(f + 7), tail: 1, tongue: 0.6, mouth: 0.2}} />
  </>
);
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const fly = clamp((f - a) / (BOCA5 - a));
  const caught = f >= BOCA5;
  const run = f >= CORRENDO5;
  const rk = (f - CORRENDO5) / FPS;
  const ballP: V3 = [lerp(-3, -7.2, fly), 0.3 + Math.sin(fly * Math.PI) * 1.2, FZ + lerp(0.5, 0.1, fly)];
  return (
    <>
      <Cam pos={[-4.4, 1.5, FZ + 2.6]} look={[-7.0, 0.7, FZ]} fov={54} f={f} a={a} />
      <DayLights x={-7} />
      <Bairro t={t} />
      <Goals />
      {run ? (
        <Dog d={{pos: [-7.4 - rk * 0, 0, FZ - rk * 5], rotY: Math.PI, walk: 1, run: 3, t, tail: 1, mouthItem: <Ball p={[0, -0.02, 0.06]} s={1.1} />}} />
      ) : (
        <Dog d={{pos: [DOG_G[0], caught ? 0.2 * Math.max(0, 1 - (f - BOCA5) / 8) : 0, DOG_G[2]], rotY: Math.PI / 2, t, blink: blinkCurve(f + 7), tail: 1, legs: caught ? "hold" : "down", legK: 1, mouthItem: caught ? <Ball p={[0, -0.02, 0.06]} s={1.1} /> : undefined, head: [caught ? -0.1 : 0, 0, 0]}} />
      )}
      {!caught && <Ball p={ballP} s={1.4} />}
      {run &&
        AMIGOS.map((lk, i) => <Toy key={i} pose={{...idle(f + i * 9), pos: [-4 - i * 0.4 - rk * 2.5, 0, FZ + 1 - i * 0.5], rotY: -Math.PI / 2 - 0.4, walk: t * 12 + i, walkAmt: 1, ...ARMS_UP, mouthOpen: 0.6}} look={lk} />)}
    </>
  );
};
/* a perseguição pelo bairro (rua ao longo de x) */
const TIAS = at(6, "tias");
const SX = 20;
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  const dx = SX + k * 3.2;
  const tiaFall = easeOut(ramp(f, TIAS + 4, TIAS + 14));
  return (
    <>
      <Cam pos={[dx + 4.5, 1.8, 3.6]} look={[dx - 1, 0.9, 0]} fov={56} f={f} a={a} punch={4} />
      <DayLights x={dx} z={0} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Dog d={{pos: [dx, 0, 0.4], rotY: Math.PI / 2, walk: 1, run: 3, t, tail: 1, mouthItem: <Ball p={[0, -0.02, 0.06]} s={1.1} />}} />
      {AMIGOS.map((lk, i) => (
        <Toy key={i} pose={{...idle(f + i * 9), pos: [dx - 2.2 - i * 0.7, 0, -0.6 + (i % 2) * 0.9], rotY: Math.PI / 2, walk: t * 12 + i, walkAmt: 1, ...ARMS_UP, mouthOpen: 0.6}} look={lk} />
      ))}
      <Toy pose={{...idle(f + 7), ...ARMS_UP, pos: [dx - 3.6, 0, 0.0], rotY: Math.PI / 2, walk: t * 12, walkAmt: 1, mouthOpen: 0.6}} look={BOYL} />
      {f >= TIAS - 10 && (
        <group position={[SX + (TIAS - a) / FPS * 3.2 + 1.5, 0.08, -2.2]}>
          <Sofa p={[0, 0, 0]} color="#d98a5a" />
          {[-0.5, 0.5].map((x, i) => (
            <group key={i} position={[x, 0.45, -0.15 - 0.2 * tiaFall]} rotation={[-0.9 * tiaFall, 0, 0]}>
              <Toy pose={{...idle(f + i * 13), legLift: 1, pos: [0, -0.35, 0], rotY: 0, eyeWide: tiaFall > 0.5 ? 0 : 0.8, blink: tiaFall > 0.5 ? 1 : 0, mouthOpen: 0.6, ...(tiaFall > 0.5 ? ARMS_UP : {})}} look={i ? TIA2 : TIA1} />
            </group>
          ))}
        </group>
      )}
    </>
  );
};
/* o casamento e o buquê */
const PEGA7 = at(7, "pega");
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const throwK = clamp((f - (PEGA7 - 12)) / 12);
  const dogK = (f - (PEGA7 - 22)) / FPS;
  const got = f >= PEGA7;
  const bq: V3 = [lerp(-0.4, 0.1, throwK), 1.4 + Math.sin(throwK * Math.PI) * 1.2, lerp(-0.4, 1.4, throwK)];
  return (
    <>
      <Cam pos={[0.2, 2.0, 6.0]} look={[0, 1.2, -0.2]} fov={56} f={f} a={a} />
      <DayLights x={0} z={0} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <FlowerArch p={[0, 0, -1.4]} />
      <HandToy pose={{...idle(f), pos: [-0.5, 0, -1.0], rotY: f >= PEGA7 - 12 ? Math.PI : 0.2, ...(f >= PEGA7 - 12 ? POINT_UP : {rShoulder: [-1.2, 0.5, 0.2], rElbow: -1.2}), smile: 1}} look={NOIVA} item={f < PEGA7 - 12 ? <Bouquet p={[0, 0, 0.06]} s={1.2} /> : null} />
      <Toy pose={{...idle(f + 11), pos: [0.5, 0, -1.0], rotY: -0.2, smile: 1}} look={NOIVO} />
      {f >= PEGA7 - 12 && !got && <Bouquet p={bq} s={1.6} />}
      {dogK > 0 && (
        <Dog d={{pos: [-4 + dogK * 5.5, got ? 0 : 0.3 * Math.sin(clamp(dogK) * Math.PI), 1.3], rotY: Math.PI / 2, walk: 1, run: 3, t, tail: 1, mouthItem: <group><Ball p={[0, -0.02, 0.06]} s={1.1} />{got && <Bouquet p={[0.12, 0.05, 0.08]} r={[0, 0, -0.6]} s={1.1} />}</group>}} />
      )}
    </>
  );
};
const CACHORRO8 = at(8, "cachorro");
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.7, 4.4]} look={[0, 1.0, -0.2]} fov={52} f={f} a={a} />
    <DayLights x={0} z={0} />
    <Town t={t} galo={false} variant="nova" flat clouds />
    <FlowerArch p={[0, 0, -1.4]} />
    <Toy pose={{...idle(f), pos: [-0.6, 0, -1.0], rotY: 0.4, eyeWide: 1, mouthOpen: 0.7, brow: 1}} look={NOIVA} />
    <Toy pose={{...idle(f + 11), pos: [0.6, 0, -1.0], rotY: -0.4, eyeWide: 1, mouthOpen: 0.5, brow: 1}} look={NOIVO} />
    <Dog d={{pos: [0, 0, 0.6], rotY: 0, t, blink: blinkCurve(f + 7), tail: 1, mouthItem: <group><Ball p={[0, -0.02, 0.06]} s={1.1} /><Bouquet p={[0.12, 0.05, 0.08]} r={[0, 0, -0.6]} s={1.1} /></group>}} />
  </>
);
/* enterrando no quintal e o museu */
const ENTERRA = at(9, "enterra");
const CEM = at(9, "cem");
const MUSEU = at(9, "museu");
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const dig = ramp(f, ENTERRA, CEM - 6);
  return (
    <>
      <Cam pos={[0, 1.4, 3.6]} look={[0, 0.5, 0]} fov={50} f={f} a={a} />
      <DayLights x={0} z={0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
        <planeGeometry args={[40, 40]} />
      </mesh>
      {Array.from({length: 14}, (_, i) => (
        <mesh key={i} position={[-3.4 + i * 0.52, 0.6, -2.2]} material={sm("#f2efe6", 0.7)}>
          <boxGeometry args={[0.14, 1.2, 0.06]} />
        </mesh>
      ))}
      <Tree p={[-2.6, 0, -3.5]} />
      <Tree p={[2.8, 0, -3.8]} s={1.2} />
      <DirtPile p={[0.55, 0, 0.3]} s={0.4 + 1.2 * dig} />
      {dig < 0.6 && <Ball p={[0.2, 0.15 - dig * 0.3, 0.45]} s={1.4} />}
      <Dog d={{pos: [-0.3, 0, 0], rotY: 0.9, walk: 0.001, run: 1, t, tail: 1, head: [0.5, 0, 0], legs: "down"}} />
    </>
  );
};
const S9b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.5, 3.4]} look={[0, 1.1, 0]} fov={50} f={f} a={a} />
    <hemisphereLight args={["#fff2d8", "#3a2a3a", 0.8]} />
    <spotLight position={[0, 4, 1]} angle={0.5} penumbra={0.6} intensity={30} distance={10} castShadow />
    <Museum />
    <group position={[0, 1.25, 0]} rotation={[0.3, t * 0.4, 0.1]}>
      <Ball p={[0, 0, 0]} s={2.2} />
      <mesh scale={1.02}>
        <icosahedronGeometry args={[0.245, 1]} />
        <meshStandardMaterial color="#8a6a3a" transparent opacity={0.45} roughness={1} />
      </mesh>
    </group>
    <Toy pose={{...idle(f), pos: [1.1, 0, 0.4], rotY: -0.6, rShoulder: [-1.3, 0.6, 0.1], rElbow: -0.5, smile: 1}} look={ARQUEOLOGO} headExtra={<><SafariHat /><HeadGlasses /></>} />
  </>
);

/* =================== Nº 3 — o chinelo =================== */
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 0.8, FZ + 3.0]} look={[0, 0.5, FZ]} fov={48} f={f} a={a} />
    <DayLights />
    <Bairro t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, FZ], rotY: 0, smile: 0.7}} look={BOY_CHINELO} />
  </>
);
const GOL11 = at(11, "gol");
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - (a + 30)) / (GOL11 - a - 30));
  const ch: V3 = [lerp(4.4, 8.4, k), 0.2 + Math.sin(k * Math.PI) * 1.6, FZ + lerp(0.3, 0, k)];
  const bl: V3 = [lerp(4.4, 8.6, k), 0.2 + Math.sin(k * Math.PI) * 2.2, FZ + lerp(0.3, 3.5, k)];
  return (
    <>
      <Cam pos={[6.2, 2.0, FZ + 5.2]} look={[6.6, 0.8, FZ]} fov={56} f={f} a={a} />
      <DayLights x={6} />
      <Bairro t={t} />
      <Goals />
      <Toy pose={{...idle(f), pos: [3.9, 0, FZ + 0.3], rotY: Math.PI / 2, smile: f > GOL11 ? 0 : 0.5, eyeWide: f > GOL11 ? 1 : 0, mouthOpen: f > GOL11 ? 0.6 : 0}} look={{...BOY_CHINELO, bareR: true}} />
      {f >= a + 30 ? <FlipFlop p={ch} r={[k * 12, k * 6, 0]} s={2.0} /> : null}
      {f >= a + 30 && k < 1 && <Ball p={bl} s={1.4} />}
    </>
  );
};
/* o VAR: a vó na janela */
const VAR12 = at(12, "var");
const GOLE = at(13, "gole");
const VALEU = at(13, "valeu");
const S12: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.2, FZ + 5]} look={[0, 1.6, FZ - 3]} fov={56} f={f} a={a} />
    <DayLights />
    <Bairro t={t} />
    {AMIGOS.map((lk, i) => (
      <Toy key={i} pose={{...idle(f + i * 9), pos: [-1.5 + i, 0, FZ + 1.5], rotY: Math.PI, head: [-0.35, 0, 0]}} look={lk} />
    ))}
    <Toy pose={{...idle(f), pos: [0, 0, FZ + 2.4], rotY: Math.PI, head: [-0.35, 0, 0]}} look={BOY_CHINELO} />
  </>
);
const VoWindow: React.FC<ShotProps & {close?: boolean}> = ({f, a, t, close}) => {
  const sip = f >= GOLE - 4 && f < GOLE + 22;
  return (
    <>
      <Cam pos={close ? [0, 2.0, 2.2] : [0, 2.0, 4.6]} look={[0, 1.95, 0]} fov={close ? 44 : 54} f={f} a={a} />
      <color attach="background" args={["#9fd8ff"]} />
      <hemisphereLight args={["#ffffff", "#a08a5e", 1.0]} />
      <directionalLight position={[3, 6, 6]} intensity={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} material={sm("#c48a52", 0.95)}>
        <planeGeometry args={[30, 10]} />
      </mesh>
      <HouseWindow />
      <HandToy
        pose={{...idle(f), pos: [0, 0.35, -0.6], rotY: 0, rShoulder: sip ? [-1.9, 0.6, 0.0] : [-1.2, 0.5, 0.1], rElbow: sip ? -1.9 : -1.2, brow: f >= VALEU ? 0 : -0.3, mouthOpen: f >= VALEU && f < VALEU + 40 ? 0.4 + 0.2 * Math.sin(t * 10) : 0, smile: f >= VALEU ? 0.8 : 0, head: f < VALEU && !sip ? [0, 0.25 * Math.sin(t * 1.5), 0.1] : [0, 0, 0]}}
        look={VO}
        headExtra={<HeadGlasses />}
        item={<CoffeeCup p={[0, 0.02, 0.06]} s={1.4} />}
      />
    </>
  );
};
const S12b: React.FC<ShotProps> = (p) => <VoWindow {...p} />;
const S13: React.FC<ShotProps> = (p) => <VoWindow {...p} close />;
/* a estátua do chinelo na praça */
const S14: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.4, 6.4]} look={[0, 2.0, 0]} fov={54} f={f} a={a} />
    <DayLights x={0} z={0} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#d9d4c8", 0.9)} receiveShadow>
      <planeGeometry args={[40, 40]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -9]} material={sm("#7fcf5a", 0.95)}>
      <planeGeometry args={[40, 12]} />
    </mesh>
    <Tree p={[-3.2, 0, -2.5]} s={1.2} />
    <Tree p={[3.4, 0, -2.8]} s={1.1} />
    <ChineloStatue p={[0, 0, 0]} s={1.3} />
    {[[-0.15, 3.95, 0.1], [0.3, 3.7, 0.25]].map((pp, i) => (
      <Pigeon key={i} p={{pos: pp as V3, rotY: i ? -0.5 : 0.6, t, blink: blinkCurve(f + i * 20), peck: 0.3 * Math.max(0, Math.sin(t * 3 + i))}} s={0.9} />
    ))}
  </>
);

/* =================== Nº 4 — a bicicleta =================== */
const PATOS = at(16, "patos");
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 10, a + 40));
  return (
    <>
      <Cam pos={[2.6, 1.5, FZ + 3.2]} look={[0, 1.3, FZ]} fov={52} f={f} a={a} />
      <DayLights />
      <Bairro t={t} />
      <group position={[0, 0.3 + 0.9 * Math.sin(k * Math.PI * 0.9), FZ]} rotation={[0, Math.PI / 2, -2.4 * k]}>
        <Toy pose={{...idle(f), pos: [0, -0.9, 0], rotY: 0, ...ARMS_UP, eyeWide: 1, mouthOpen: 0.5}} look={BOYL} />
      </group>
      <Ball p={[0.1, 1.9, FZ + 0.1]} s={1.4} />
    </>
  );
};
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  const y = 1.2 + k * 1.3;
  return (
    <>
      <Cam pos={[0, y + 0.6, FZ + 5.5]} look={[0, y, FZ]} fov={54} f={f} a={a} punch={4} />
      <DayLights />
      <Bairro t={t} />
      <group position={[0, y, FZ]} rotation={[0, t * 18, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>
          <Toy pose={{...idle(f), pos: [0, -0.95, 0], rotY: 0, ...ARMS_UP, eyeWide: 1, mouthOpen: 0.6}} look={BOYL} />
        </group>
      </group>
      {f >= PATOS - 4 &&
        [[0, 0], [-1, -1], [1, -1], [-2, -2], [2, -2], [-3, -3], [3, -3]].map(([dx, dz], i) => (
          <FlyingDuck key={i} p={[dx * 0.7, y - 0.4 + dz * 0.2, FZ + dz * 0.8 - 1.2]} rotY={Math.PI} t={t + i * 0.2} s={1.2} />
        ))}
    </>
  );
};
/* pousa no Maracanã e o técnico contrata */
const MARACANA17 = at(17, "maracana");
const TECNICO17 = at(17, "tecnico");
const FIGURINHA17 = at(17, "figurinha");
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const land = easeOut(ramp(f, a, a + 16));
  return (
    <>
      <Cam pos={[0, 1.8, 5.2]} look={[0, 1.1, 0]} fov={54} f={f} a={a} />
      <hemisphereLight args={["#ffffff", "#3f7a3a", 1.0]} />
      <directionalLight position={[6, 14, 8]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <Stadium />
      <Toy pose={{...idle(f), pos: [-0.5, lerp(4, 0, land), 0.2], rotY: 0.3, ...(f >= TECNICO17 ? {smile: 1} : {eyeWide: 1, mouthOpen: 0.5, ...ARMS_UP})}} look={BOYL} />
      {f >= TECNICO17 - 4 && (
        <HandToy
          pose={{...idle(f), pos: [0.7, 0, 0.0], rotY: -0.5, rShoulder: [-1.3, 0.8, 0.1], rElbow: -0.4, smile: 1}}
          look={TECNICO}
          item={
            f >= FIGURINHA17 - 2 ? (
              <group position={[0, -0.02, 0.06]}>
                {Array.from({length: 6}, (_, i) => (
                  <mesh key={i} position={[0, i * 0.012, 0]} rotation={[Math.PI / 2, 0, i * 0.15]} material={sm(["#ffd21f", "#2e86de", "#e8414f", "#2ecc71", "#ff8a1f", "#ffffff"][i], 0.6)}>
                    <boxGeometry args={[0.14, 0.2, 0.008]} />
                  </mesh>
                ))}
              </group>
            ) : (
              <mesh position={[0, -0.02, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffffff", 0.7)}>
                <boxGeometry args={[0.22, 0.3, 0.01]} />
              </mesh>
            )
          }
        />
      )}
    </>
  );
};

/* =================== Nº 5 — "o próximo gol ganha" =================== */
const S18: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, FZ + 3.6]} look={[0, 1.2, FZ - 0.5]} fov={52} f={f} a={a} />
    <DayLights />
    <Bairro t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, FZ], rotY: 0, ...SHOUT}} look={JUNINHO} />
    {[0, 1, 2].map((i) => (
      <Toy key={i} pose={{...idle(f + i * 9), pos: [-1.4 + i * 1.4, 0, FZ - 2.2], rotY: 0, eyeWide: 0.8, mouthOpen: 0.3}} look={i === 1 ? BOYL : AMIGOS[i]} />
    ))}
  </>
);
const TRES19 = at(19, "tres");
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const g = ramp(f, TRES19 - 10, L(20));
  return (
    <>
      <Cam pos={[0, 1.8, FZ + 4.6]} look={[0, 1.2, FZ - 1]} fov={54} f={f} a={a} />
      <DayLights />
      <Bairro t={t} grass={g * 0.8} />
      <Scoreboard p={[0, 0, FZ - 4]} s={1.2} />
      {[-1.6, 0, 1.6].map((x, i) => (
        <Toy key={i} pose={{...idle(f + i * 9), pos: [x, 0, FZ - 0.6], rotY: 0, blink: 0.5, brow: -0.2}} look={i === 1 ? BOYL : AMIGOS[i]} headExtra={<Beard g={g} t={t} />} />
      ))}
    </>
  );
};
const FORRO20 = at(20, "forro");
const AVO20 = at(20, "avo");
const CAPIVARAS20 = at(20, "capivaras");
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const palmA = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 2.4, FZ + 7]} look={[0, 1.0, FZ - 0.5]} fov={58} f={f} a={a} />
      <DayLights />
      <Bairro t={t} grass={0.8} />
      {[[-4, -2], [-3, 2.2], [3.6, -2.4], [4.2, 1.8], [-1.8, -3.6], [1.9, -3.4], [-4.8, 0.3], [4.9, -0.2]].map(([x, z], i) => (
        <Tree key={i} p={[x, 0, FZ + z]} s={1.1 + (i % 3) * 0.2} />
      ))}
      {f >= CAPIVARAS20 - 4 && (
        <group position={[-3.0, 0, FZ + 2.2]}>
          <BrickGoal p={[0, 0, 0]} rotY={0} />
          <Capivara p={[-0.4, 0, 0.2]} rotY={0.3} s={0.8} t={t} blink={blinkCurve(f)} sit={1} />
          <Capivara p={[0.5, 0, 0.0]} rotY={-0.4} s={0.6} t={t} blink={blinkCurve(f + 9)} sit={1} />
        </group>
      )}
      {f >= FORRO20 - 6 && (
        <group position={[0.6, 0, FZ + 0.6]}>
          <HandToy pose={{...idle(f), pos: [-0.9, 0, 0], rotY: 0.3, rShoulder: [-1.0, 0.5, -0.2], rElbow: -1.4, lShoulder: [-1.0, -0.5, 0.2], lElbow: -1.4, smile: 1}} look={FORRO[0]} headExtra={<LeatherHat />} item={null} />
          <Accordion p={[-0.9, 1.1, 0.32]} t={t} />
          <Toy pose={{...idle(f + 5), pos: [0, 0, -0.2], rotY: 0, rShoulder: [-0.9, 0.3, -0.2], rElbow: -0.8 - 0.4 * Math.abs(Math.sin(t * 8)), smile: 1}} look={FORRO[1]} headExtra={<LeatherHat />} />
          <Zabumba p={[0, 0.95, 0.12]} />
          <HandToy pose={{...idle(f + 9), pos: [0.9, 0, 0], rotY: -0.3, rShoulder: [-1.6, 0.3, -0.2], rElbow: -1.2, smile: 1}} look={FORRO[2]} headExtra={<LeatherHat />} item={<Triangle p={[0, -0.05, 0.08]} />} />
        </group>
      )}
      {f >= AVO20 - 6 && (
        <HandToy
          pose={{...idle(f), pos: [2.6, 0, FZ + 2.4], rotY: -0.4, rShoulder: [-0.6, 0, -0.2], rElbow: -0.6, blink: 0.4, smile: 0.4}}
          look={{shirt: "#ffd21f", pants: "#2e86de", hairStyle: "buzz", hair: "#e6e6e6"}}
          headExtra={<><HeadGlasses /><Beard g={1} t={t} /></>}
          item={<Cane p={[0, 0, 0.06]} />}
        />
      )}
    </>
  );
};
/* a mãe grita "janta!" e todo mundo corre */
const JANTA = at(22, "janta");
const S22: React.FC<ShotProps> = ({f, a, t}) => {
  const run = (f - JANTA - 4) / FPS;
  return (
    <>
      <Cam pos={[0, 2.0, FZ + 6]} look={[0, 1.2, FZ - 2]} fov={58} f={f} a={a} />
      <DayLights />
      <Bairro t={t} grass={0.8} />
      <Toy pose={{...idle(f), pos: [0.0, 0, 2.9], rotY: 0, ...(f >= JANTA - 4 ? SHOUT : {}), brow: -0.4}} look={MAE} />
      {[...AMIGOS, BOYL].map((lk, i) => {
        const p0: V3 = [-2.4 + i * 1.2, 0, FZ + 0.4 - (i % 2) * 0.8];
        const r = Math.max(0, run);
        return <Toy key={i} pose={{...idle(f + i * 9), pos: [p0[0] * (1 - Math.min(1, r * 0.5)), 0, p0[2] - r * 3], rotY: run > 0 ? Math.PI : 0, walk: t * 12 + i, walkAmt: run > 0 ? 1 : 0}} look={lk} />;
      })}
      {run > 0 && [0, 1].map((i) => <Capivara key={i} p={[-3 + i * 0.7, 0, FZ + 2.2 - Math.max(0, run) * 2.5]} rotY={Math.PI} s={0.7} t={t} walk={1} />)}
      <Ball p={[0.2, 0.15, FZ + 0.6]} s={1.4} />
    </>
  );
};
/* final: você no gol */
const S23: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[-4.6, 1.3, FZ + 0.3]} look={[-8, 1.0, FZ]} fov={52} f={f} a={a} />
      <DayLights x={-7} />
      <Bairro t={t} />
      <ChineloGoal p={[-8, 0, FZ]} rotY={Math.PI / 2} />
      <HandToy
        pose={{...idle(f), pos: [-7.9, 0, FZ], rotY: Math.PI / 2, rShoulder: [-1.6, 0.6, -0.3], rElbow: -0.5, lShoulder: [-1.6, -0.6, 0.3], lElbow: -0.5, eyeWide: 1, mouthOpen: 0.7, brow: 1}}
        look={BOYL}
        item={<BigGlove />}
        left={<BigGlove />}
      />
      {Array.from({length: 8}, (_, i) => {
        const q = (k * 0.8 + i / 8) % 1;
        const r = rng(i + 3);
        return <Ball key={i} p={[lerp(-3, -7.6, q), 0.3 + r() * 1.6 + Math.sin(q * Math.PI) * 0.8, FZ + (r() - 0.5) * 2.6 * (1 - q)]} s={1.4} />;
      })}
    </>
  );
};
/* tela azul atrás do mapa */
const Blank: React.FC<ShotProps> = ({f, a}) => (
  <>
    <Cam pos={[0, 1, 3]} look={[0, 1, 0]} fov={50} f={f} a={a} />
    <color attach="background" args={["#7fc8ff"]} />
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: E2, Comp: S2b},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: MUSEU - 6, Comp: S9b},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
  {from: VAR12 + 4, Comp: S12b},
  {from: L(13), Comp: S13},
  {from: L(14), Comp: S14},
  {from: L(15), Comp: S15},
  {from: L(16), Comp: S16},
  {from: L(17), Comp: Blank},
  {from: MARACANA17 - 2, Comp: S17},
  {from: L(18), Comp: S18},
  {from: L(19), Comp: S19},
  {from: L(20), Comp: S20},
  {from: L(21), Comp: Blank},
  {from: L(22), Comp: S22},
  {from: L(23), Comp: S23},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_FUTEBOL} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["bola", "amigos", "nunca", "cinco", "coisas", "partida", "numero", "um", "dois", "tres", "quatro", "forca", "orbita", "satelite", "tv", "racha", "tio", "narrador", "banana", "microfone", "cachorro", "goleiro", "tudo", "boca", "correndo", "perseguicao", "vinte", "minutos", "quarteiroes", "tias", "desmaiando", "casamento", "buque", "casar", "enterra", "quintal", "cem", "anos", "arqueologo", "museu", "prehistorica", "chinelo", "gol", "sozinho", "var", "vo", "janela", "cafe", "valeu", "almocar", "melhor", "jogador", "estatua", "praca", "bicicleta", "helice", "voando", "patos", "maracana", "final", "tecnico", "figurinha", "proximo", "ganha", "floresta", "capivaras", "forro", "meiocampo", "avo", "mapa", "preservacao", "ambiental", "janta", "empate", "seguir", "perfil"]);
const Tag: React.FC<{from: number; to: number; text: string; x: number; y: number}> = ({from, to, text, x, y}) => {
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
const BigNum: React.FC<{from: number; to: number; text: string; y?: number; size?: number}> = ({from, to, text, y = 330, size = 130}) => <Ono from={from} to={to} text={text} x={540} y={y} size={size} color="#ffffff" rot={-3} />;
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; size?: number}> = ({from, to, text, x, y, size = 50}) => {
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
/** placa grande "Nº X" */
const NumPlate: React.FC<{from: number; to: number; n: number}> = ({from, to, n}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: 540, top: 330, transform: `translate(-50%,-50%) scale(${s}) rotate(${-5 + 1.5 * Math.sin(f / 5)}deg)`, background: "#ffd21f", color: "#101018", fontFamily, fontWeight: 900, fontSize: 150, padding: "10px 60px", borderRadius: 36, border: "10px solid #101018", boxShadow: "0 12px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap"}}>
      Nº {n}
    </div>
  );
};
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const projBR = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapBR: React.FC<{from: number; to: number; mode: "rio" | "reserva"}> = ({from, to, mode}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const pin = mode === "rio" ? projBR(-43.2, -22.9) : projBR(-46.6, -23.5);
  const drop = backOut(ramp(f, from + 3, from + 12));
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
        <g transform={`translate(${pin[0]},${pin[1] - 200 * (1 - drop)})`}>
          {mode === "rio" ? (
            <>
              <path d="M 0 0 C -26 -36, -30 -70, 0 -78 C 30 -70, 26 -36, 0 0 Z" fill="#e8262d" stroke="#101018" strokeWidth={6} />
              <circle cy={-54} r={11} fill="#ffffff" />
            </>
          ) : (
            <path d="M 0 0 C -50 -30, -40 -90, 30 -100 C 30 -40, 20 -20, 0 0 Z" fill="#2ecc71" stroke="#101018" strokeWidth={6} />
          )}
        </g>
      </svg>
      <div style={{position: "absolute", left: pin[0], top: pin[1] - 170, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 40, padding: "4px 16px", whiteSpace: "nowrap"}}>{mode === "rio" ? "MARACANÃ" : "RESERVA DO RACHA"}</div>
    </AbsoluteFill>
  );
};
const FastFwd: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 760, top: 300, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <Ono from={from} to={to} text={text} x={540} y={520} size={120} color="#ffffff" rot={-3} />
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
const NUMS = [L(1), L(4), L(10), L(15), L(18)];
const FOLLOW_FROM = L(23) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoFutebol: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapBR from={L(17)} to={MARACANA17 - 3} mode="rio" />
      <MapBR from={L(21)} to={L(22) - 1} mode="reserva" />
      <FastFwd from={CEM - 4} to={MUSEU - 7} text="100 ANOS" />
      <FastFwd from={TRES19 - 4} to={L(20) - 2} text="3 ANOS" />

      {NUMS.map((x, i) => (
        <NumPlate key={i} from={x + 2} to={(i < 4 ? [L(2), L(5), L(11), L(16)][i] : L(19)) - 3} n={i + 1} />
      ))}

      <Ono from={4} to={CINCO0 - 2} text="?" x={540} y={560} size={200} color="#ffd21f" rot={8} />
      <BigNum from={CINCO0} to={L(1) - 2} text="5 COISAS" y={420} size={140} />
      <Ono from={L(2) + 4} to={SOBE + 10} text="PÁ!" x={540} y={460} size={170} color="#ffd21f" />
      <Tag from={at(2, "satelite") - 2} to={L(3) - 2} text="SATÉLITE" x={540} y={420} />
      <Tag from={at(3, "racha") - 2} to={TIO3 - 3} text="AO VIVO NO BAIRRO" x={540} y={420} />
      <Bubble from={BANANA} to={L(4) - 2} text="GOOOOL… NÃO, PERAÍ" x={540} y={420} size={48} />
      <Ono from={BOCA5 - 2} to={CORRENDO5 + 6} text="AU AU!" x={540} y={460} size={150} color="#ffd21f" />
      <BigNum from={at(6, "vinte")} to={at(6, "tres") - 3} text="22 MIN" y={420} size={150} />
      <BigNum from={at(6, "tres")} to={TIAS - 3} text="3 QUARTEIRÕES" y={420} size={100} />
      <Ono from={TIAS + 6} to={L(7) - 2} text="AI!" x={540} y={460} size={170} color="#ff8fab" />
      <Tag from={PEGA7 - 2} to={L(8) - 2} text="BUQUÊ" x={540} y={420} />
      <Tag from={CACHORRO8 - 2} to={L(9) - 2} text="PRÓXIMO A CASAR" x={540} y={420} />
      <Ono from={GOL11} to={L(12) - 2} text="GOL?" x={540} y={460} size={170} color="#ffd21f" />
      <Tag from={VAR12 - 2} to={L(13) - 2} text="VAR" x={540} y={420} />
      <Bubble from={VALEU - 2} to={L(14) - 2} text="VALEU. E VEM ALMOÇAR." x={540} y={420} size={50} />
      <Tag from={at(14, "melhor") - 2} to={L(15) - 2} text="CRAQUE DO JOGO" x={540} y={420} />
      <Ono from={at(16, "helice")} to={PATOS - 3} text="VRRRRR!" x={540} y={460} size={140} color="#ffffff" />
      <Ono from={PATOS + 4} to={L(17) - 2} text="QUÉN QUÉN!" x={540} y={460} size={130} color="#ffd21f" />
      <Tag from={at(17, "contrata") - 2} to={FIGURINHA17 - 3} text="CONTRATADO" x={540} y={420} />
      <Tag from={FIGURINHA17 - 2} to={L(18) - 2} text="SALÁRIO" x={540} y={420} />
      <Ono from={at(19, "faz")} to={TRES19 - 6} text="0 x 0" x={540} y={460} size={170} color="#ffffff" />
      <Tag from={CAPIVARAS20 - 2} to={FORRO20 - 3} text="CAPIVARAS" x={540} y={420} />
      <Tag from={FORRO20 - 2} to={AVO20 - 3} text="FORRÓ" x={540} y={420} />
      <Tag from={AVO20 - 2} to={L(21) - 2} text="GOLEIRO AVÔ" x={540} y={420} />
      <Bubble from={JANTA - 2} to={at(22, "empate") - 2} text="JANTA!" x={540} y={420} size={90} />
      <BigNum from={at(22, "empate")} to={L(23) - 2} text="EMPATE" y={420} size={150} />
      <Confetti from={at(22, "empate")} to={at(22, "empate") + 60} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_FUTEBOL - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo; o forró é só na cena da banda) ---------- */}
      <Audio src={staticFile("vozfutebol.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {NUMS.map((x) => (
        <SND key={"n" + x} src="sfx7/boing.mp3" from={x + 2} dur={32} v={FXV * 0.7} />
      ))}
      <SND src="sfx2/bat.mp3" from={L(2) + 4} dur={25} v={FXV * 0.5} />
      <SND src="sfx2/whoosh.mp3" from={SOBE} dur={40} v={FXV * 0.35} />
      <SND src="sfx12/satellite.mp3" from={E2} dur={L(3) - E2} v={FXV * 0.3} />
      <SND src="sfx3/crowd.mp3" from={TIO3} dur={L(4) - TIO3} v={FXV * 0.2} />
      <SND src="sfx11/bark.mp3" from={BOCA5} dur={30} v={FXV * 0.45} />
      <SND src="sfx5/run.mp3" from={CORRENDO5} dur={L(7) - CORRENDO5} v={FXV * 0.3} />
      <SND src="sfx12/gasp.mp3" from={TIAS + 4} dur={30} v={FXV * 0.35} />
      <SND src="sfx12/bells.mp3" from={L(7)} dur={PEGA7 - L(7)} v={FXV * 0.25} />
      <SND src="sfx12/throw.mp3" from={PEGA7 - 12} dur={25} v={FXV * 0.35} />
      <SND src="sfx12/gasp.mp3" from={CACHORRO8} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/shovel.mp3" from={ENTERRA} dur={CEM - ENTERRA} v={FXV * 0.35} />
      <SND src="sfx4/clocks.mp3" from={CEM - 4} dur={MUSEU - CEM} v={FXV * 0.25} />
      <SND src="sfx12/tada.mp3" from={MUSEU} dur={40} v={FXV * 0.3} />
      <SND src="sfx2/bat.mp3" from={L(11) + 30} dur={25} v={FXV * 0.45} />
      <SND src="sfx12/slip.mp3" from={GOL11 - 6} dur={25} v={FXV * 0.35} />
      <SND src="sfx3/glass.mp3" from={GOLE} dur={20} v={FXV * 0.2} />
      <SND src="sfx12/tada.mp3" from={at(14, "estatua")} dur={40} v={FXV * 0.35} />
      <SND src="sfx6/pigeon.mp3" from={L(14) + 10} dur={40} v={FXV * 0.25} />
      <SND src="sfx12/tornado.mp3" from={at(16, "gira")} dur={PATOS - at(16, "gira")} v={FXV * 0.3} />
      <SND src="sfx8/wings.mp3" from={PATOS} dur={L(17) - PATOS} v={FXV * 0.35} />
      <SND src="sfx2/cheer.mp3" from={MARACANA17} dur={L(18) - MARACANA17} v={FXV * 0.35} />
      <SND src="sfx3/whistle.mp3" from={L(18) + 4} dur={25} v={FXV * 0.35} />
      <SND src="sfx14/grilos.mp3" from={L(19)} dur={L(20) - L(19)} v={FXV * 0.3} />
      <SND src="sfx14/forro.mp3" from={FORRO20} dur={AVO20 - FORRO20 + 20} v={FXV * 0.2} />
      <SND src="sfx12/tada.mp3" from={L(21) + 4} dur={40} v={FXV * 0.3} />
      <SND src="sfx5/run.mp3" from={JANTA + 6} dur={L(23) - JANTA} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={at(22, "empate")} dur={50} v={FXV * 0.5} />
      <SND src="sfx2/bat.mp3" from={L(23) + 10} dur={20} v={FXV * 0.35} />
      <SND src="sfx2/bat.mp3" from={L(23) + 40} dur={20} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
