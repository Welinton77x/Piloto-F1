import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, V3} from "./Sets5";
import {WeddingPigeon} from "./Sets10";
import {Cow} from "./Sets8";
import {Dog, DogP, Sofa, TV, RoomShell, sm} from "./Sets9";
import {Octopus} from "./Sets12";
import {Chinelo} from "./Sets13";
import {Remote, RemoteP, REMOTE_LEG, IRBeams, TVStatic, Biscuit, DustPuff, ChalkOutline, Tape, Armchair, Newspaper, Book, PlainFridge, Caminito, HeartSign, Sock, MiniStage, PlaneCabin, Cuia, Pasture} from "./Sets16";
import {Captions, StageTitle, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingControle.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_CONTROLE = F(words[words.length - 1].e + 0.9);

const BOYL: ToyLook = {hoodie: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const OFFER: Pose = {rShoulder: [-1.28, 0.98, 0.1], rElbow: -0.47};

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};
const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 600;
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
/** cachorro detetive (sempre com chapéu xadrez e sobretudo) */
const DET = (d: DogP): DogP => ({detective: true, ...d});

/* ---------- sala ---------- */
const SOFA_Z = -1.25;
const TV_P: V3 = [0, 0, 2.95];
const LivingRoom: React.FC<{night?: boolean; tvLight?: number}> = ({night = false, tvLight = 0}) => (
  <>
    {night ? <color attach="background" args={["#0b1030"]} /> : <Sky />}
    <hemisphereLight args={night ? ["#5a6aa8", "#201a30", 0.45] : ["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.2, 2.9, 0.4]} intensity={night ? 1.5 : 10} distance={10} decay={1.4} color={night ? "#8090d0" : "#fff4e0"} castShadow shadow-mapSize={[1024, 1024]} />
    {!night && <directionalLight position={[2, 4, 4]} intensity={0.5} />}
    {tvLight > 0 && <pointLight position={[0, 1.3, 1.6]} intensity={4 * tvLight} distance={5} decay={1.6} color="#bfe6ff" />}
    <RoomShell wall={night ? "#6a5a8a" : "#ffe3b8"} accent="#3a86ff" openWindow />
    <Sofa p={[0, 0, SOFA_Z]} />
    {!night && (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -14]} material={sm("#7fcf5a", 0.95)}>
          <planeGeometry args={[60, 22]} />
        </mesh>
        <directionalLight position={[3, 6, -8]} intensity={1.2} />
      </>
    )}
  </>
);

/* =================== 1 — a TV sem controle e o cachorro detetive =================== */
const MAS0 = at(0, "mas");
const ENTAO0 = at(0, "entao");
const FAREJADOR = at(0, "farejador");
const DETETIVE = at(0, "detetive");
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.75, -2.3]} look={[0, 1.15, 2.95]} fov={46} f={f} a={a} />
    <LivingRoom tvLight={0.8} />
    <TV p={TV_P} rotY={Math.PI} />
    <TVStatic p={TV_P} rotY={Math.PI} f={f} />
    <Toy pose={{...idle(f), pos: [0, 0, 0.7], rotY: 0, rShoulder: [-2.6, 0, -0.6], rElbow: -1.9, head: [0, 0.25 * Math.sin(t * 2), 0.15]}} look={BOYL} />
  </>
);
/* o menino revirando o sofá: almofadas voando */
const S0b: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 1.45, 3.4]} look={[0, 0.95, -0.6]} fov={50} f={f} a={a} />
      <LivingRoom />
      <Toy pose={{...idle(f), pos: [0, 0, -0.25], rotY: 0, ...ARMS_UP, brow: 0.7, mouthOpen: 0.4, eyeWide: 0.6}} look={BOYL} />
      {[0, 1, 2].map((i) => {
        const q = ((k * 1.1 + i / 3) % 1);
        const sd = i === 1 ? 0 : i === 0 ? -1 : 1;
        return (
          <mesh key={i} position={[sd * 1.1 * q, 1.0 + 1.6 * q - 2.0 * q * q, -0.6 + 0.4 * q]} rotation={[q * 6, q * 4, 0]}>
            <boxGeometry args={[0.36, 0.34, 0.12]} />
            <meshStandardMaterial color={["#ffd21f", "#3cb3a5", "#ff8a5c"][i]} roughness={0.85} />
          </mesh>
        );
      })}
    </>
  );
};
const DOG1: V3 = [0.5, 0, 0.25];
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 2, FAREJADOR - 2));
  const sat = f >= FAREJADOR - 2;
  return (
    <>
      <Cam pos={[0.0, 1.4, 3.15]} look={[0.0, 0.85, -0.4]} fov={62} f={f} a={a} />
      <LivingRoom />
      <Toy pose={{...idle(f), pos: [-0.5, 0, -0.35], rotY: 0.45, smile: 0.6, eyeWide: 0.4, head: [0, 0.3, 0]}} look={BOYL} />
      {sat ? (
        <Dog d={DET({pos: DOG1, rotY: -0.35, legs: "point", legK: backOut(ramp(f, FAREJADOR, FAREJADOR + 10)), lupa: true, t, blink: blinkCurve(f + 7), tail: 1, mouth: 0.1, head: [0, 0.1, -0.1]})} />
      ) : (
        <Dog d={DET({pos: [lerp(2.8, DOG1[0], k), 0, DOG1[2]], rotY: -Math.PI / 2, walk: 1, run: 1, t, blink: blinkCurve(f + 7), tail: 1})} />
      )}
    </>
  );
};
/* 🌀 "O polvo tem três corações, e nenhum deles sabe o seu nome." */
const S2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.35, 3.1]} look={[0, 1.0, 0]} fov={46} f={f} a={a} punch={10} />
    <color attach="background" args={["#ffd9a8"]} />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.5, 3, 2]} intensity={10} distance={10} decay={1.4} color="#fff4e0" castShadow />
    <mesh position={[0, 2, -1.2]}>
      <planeGeometry args={[8, 5]} />
      <meshStandardMaterial color="#c9e4d0" roughness={0.9} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#b07a45" roughness={0.7} />
    </mesh>
    <Armchair p={[0, 0, -0.3]} color="#b5523b" />
    <Octopus o={{pos: [0, 0.5, -0.2], rotY: 0, t, s: 0.62, blink: blinkCurve(f + 5), mouth: 0, wrench: false}} />
  </>
);
/* "Mas o cachorro fareja o sofá inteiro..." */
const ENCONTRA = at(2, "encontra");
const DOIS = at(2, "dois");
const S3: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.15, 1.45, 3.0]} look={[-0.2, 0.6, -0.5]} fov={50} f={f} a={a} />
    <LivingRoom />
    <Dog d={DET({pos: [0.05 + 0.2 * Math.sin(t * 2), 0, -0.3], rotY: -Math.PI / 2, walk: 0.001, run: 1, sniff: 1, t, tail: 1, head: [0.45, -0.75 + 0.2 * Math.sin(t * 5), 0]})} />
  </>
);
const S3b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.15, 2.6]} look={[0, 0.85, -0.3]} fov={46} f={f} a={a} />
    <LivingRoom />
    <Dog d={DET({pos: [0, 0, -0.35], rotY: 0, t, blink: blinkCurve(f + 3), tail: 1, mouthItem: <Biscuit p={[0, -0.02, 0.06]} r={[0, 0, 0.2]} s={1.1} />})} />
    <DustPuff p={[0.15, 0.85, 0.1]} t={t} k={1} />
  </>
);

/* =================== 2 — o mapa: fugiu pra Argentina =================== */
const FUGIU = at(3, "fugiu");
const ARGENTINA = at(3, "argentina");
const S4: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.15, 2.6]} look={[0, 0.85, -0.3]} fov={46} f={f} a={a} />
    <color attach="background" args={["#7fc8ff"]} />
  </>
);
/* título: ABANDONO REMOTO — o sofá com o contorno de giz e fita */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0.0, 1.55 + 0.05 * k, 1.1]} look={[0, 0.45, SOFA_Z + 0.05]} fov={50} f={f} a={a} />
      <LivingRoom />
      <ChalkOutline p={[0.0, 0.475, SOFA_Z + 0.08]} r={[-Math.PI / 2, 0, 0.5]} s={1.2} />
      <Tape a={[-1.2, 0.95, SOFA_Z + 0.55]} b={[1.2, 0.65, SOFA_Z + 0.5]} />
      <Tape a={[-1.2, 0.6, SOFA_Z + 0.6]} b={[1.2, 0.9, SOFA_Z + 0.55]} />
    </>
  );
};
/* 🌀 "A vaca não sabe que dá leite. Ela acha que é um hobby." */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 1.6, 4.0]} look={[0, 1.3, 0]} fov={48} f={f} a={a} punch={10} />
      <Pasture />
      <hemisphereLight args={["#ffffff", "#5a8a3a", 1.0]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Cow c={{pos: [0, 0, 0], rotY: 0, arms: "hold", armK: 1, t, blink: blinkCurve(f + 3), glasses: true, headTilt: 0.12}} palmRef={palm} />
      <InHand palm={palm}>
        <Newspaper p={[0, 0.05, 0.12]} r={[Math.PI / 2, 0, 0]} s={1} />
      </InHand>
    </>
  );
};

/* =================== 3 — Buenos Aires: o controle vivo dançando tango =================== */
const E6 = at(6, "e", 1);
const VIVO = at(6, "vivo");
const DANCANDO = at(6, "dancando");
const TANGO6 = at(6, "tango");
const BUENOS = at(6, "buenos");
const RS = 1.5; // escala do controle em Buenos Aires
const BAScene: React.FC = () => (
  <>
    <hemisphereLight args={["#ffffff", "#a08a6e", 1.0]} />
    <directionalLight position={[3, 7, 6]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
    <Caminito />
  </>
);
/** controle de pé, vivo, dançando tango */
const TangoRemote: React.FC<{p: V3; t: number; f: number; alive?: number; c?: Partial<RemoteP>; spin?: number}> = ({p, t, f, alive = 1, c = {}, spin = 0}) => (
  <Remote
    p={[p[0] + 0.25 * Math.sin(t * 2.2), p[1] + REMOTE_LEG * RS + 0.03 * Math.abs(Math.sin(t * 7)), p[2]]}
    r={[0, 0.5 * Math.sin(t * 2.2) + spin, 0.12 * Math.sin(t * 4.4)]}
    s={RS}
    c={{alive, t, blink: blinkCurve(f + 11), rose: true, dance: 1, arms: "tango", ...c}}
  />
);
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const up = backOut(ramp(f, VIVO - 2, VIVO + 9));
  const lying = f < VIVO - 2;
  const danc = f >= DANCANDO - 2;
  return (
    <>
      <Cam pos={[0, lerp(1.0, 1.35, up), lerp(2.6, 3.6, up)]} look={[0, lerp(0.3, 0.85, up), 0.3]} fov={48} f={f} a={a} />
      <BAScene />
      {danc ? (
        <TangoRemote p={[0, 0, 0.3]} t={t} f={f} />
      ) : (
        <Remote
          p={[0, lying ? 0.04 * RS : lerp(0.04 * RS, REMOTE_LEG * RS, up), 0.3]}
          r={[lying ? -Math.PI / 2 : lerp(-Math.PI / 2, 0, clamp(up)), 0, lying ? 0.4 : lerp(0.4, 0, clamp(up))]}
          s={RS}
          c={{alive: lying ? 0 : clamp(up), t, blink: blinkCurve(f + 11), arms: "up", mouth: 0.5}}
        />
      )}
    </>
  );
};
/* título: TANGO INFRAVERMELHO */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.4, 3.0]} look={[0, 1.0, 0.3]} fov={48} f={f} a={a} />
    <BAScene />
    <TangoRemote p={[0, 0, 0.3]} t={t} f={f} spin={t * 3} c={{ir: 0.6 + 0.4 * Math.abs(Math.sin(t * 9))}} />
    <IRBeams p={[0.25 * Math.sin(t * 2.2), REMOTE_LEG * RS + 0.31 * RS, 0.3]} t={t} k={1} />
  </>
);
/* fã-clube: palquinho, plateia de chinelos e meias com cartaz */
const FAMOSO = at(8, "famoso");
const FANS: {x: number; z: number; kind: "c" | "m"; col: string}[] = [
  {x: -1.0, z: 0.55, kind: "m", col: "#ffffff"},
  {x: -0.5, z: 0.8, kind: "c", col: ""},
  {x: 0.0, z: 0.6, kind: "m", col: "#ffd21f"},
  {x: 0.5, z: 0.8, kind: "c", col: ""},
  {x: 1.0, z: 0.55, kind: "m", col: "#74b9e8"},
];
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const flash = f >= FAMOSO ? Math.max(0, Math.sin(t * 9)) ** 8 : 0;
  return (
    <>
      <Cam pos={[0, 2.5, 5.6]} look={[0, 0.95, -0.4]} fov={44} f={f} a={a} />
      <BAScene />
      <MiniStage p={[0, 0, -0.6]} />
      <Remote p={[0, 0.3 + REMOTE_LEG * RS, -0.5]} r={[0, 0, 0.08 * Math.sin(t * 3)]} s={RS} c={{alive: 1, t, blink: blinkCurve(f + 11), arms: "wave", smile: 1}} />
      {FANS.map((fn, i) => (
        <group key={i}>
          {fn.kind === "m" ? <Sock p={[fn.x, 0, fn.z]} rotY={Math.PI} s={0.8} color={fn.col} /> : <Chinelo p={[fn.x, 0, fn.z]} r={[0, Math.PI, 0]} s={0.6} />}
          <HeartSign p={[fn.x + 0.05, 0.85 + 0.06 * Math.sin(t * 6 + i), fn.z - 0.05]} r={[0, 0, 0.15 * Math.sin(t * 5 + i)]} s={1.0} />
        </group>
      ))}
      {flash > 0.05 && <pointLight position={[0, 1.6, 2.2]} intensity={14 * flash} distance={6} decay={1.4} color="#ffffff" />}
    </>
  );
};
/* 🌀 "Se você gritar batata dentro da geladeira, a luz apaga de vergonha." */
const APAGA = at(9, "apaga");
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.2, 2.7]} look={[0, 1.0, 0]} fov={48} f={f} a={a} punch={10} />
    <color attach="background" args={["#2a2f3a"]} />
    <hemisphereLight args={["#c8d0e0", "#202030", 0.35]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#d9d4c8" roughness={0.6} />
    </mesh>
    <mesh position={[0, 2, -0.5]}>
      <planeGeometry args={[8, 5]} />
      <meshStandardMaterial color="#9ab7c9" roughness={0.9} />
    </mesh>
    <PlainFridge p={[0, 0, 0]} light={1 - ramp(f, APAGA, APAGA + 4)} />
  </>
);
/* o cachorro aperta o botão de desligar */
const APERTA = at(10, "aperta");
const DESLIGAR = at(10, "desligar");
const RP12: V3 = [0.3, 0, 0.35];
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 2, APERTA - 4));
  const sat = f >= APERTA - 4;
  const off = ramp(f, DESLIGAR, DESLIGAR + 8);
  const fall = easeInOut(ramp(f, DESLIGAR + 10, DESLIGAR + 22));
  const tt = Math.min(t, DESLIGAR / FPS);
  return (
    <>
      <Cam pos={[-0.05, 1.4, 4.2]} look={[-0.05, 0.8, 0.3]} fov={54} f={f} a={a} />
      <BAScene />
      {f < DESLIGAR ? (
        <TangoRemote p={RP12} t={t} f={f} />
      ) : (
        <Remote
          p={[RP12[0] + 0.25 * Math.sin(tt * 2.2), lerp(lerp(REMOTE_LEG * RS, 0.31 * RS, off), 0.04 * RS, fall), RP12[2] + 0.31 * RS * fall]}
          r={[-Math.PI / 2 * fall, 0.5 * Math.sin(tt * 2.2) * (1 - fall), 0]}
          s={RS}
          c={{alive: 1 - off, t, blink: 0, rose: off < 0.5, arms: "tango", mouth: 0.6}}
        />
      )}
      {sat ? (
        <Dog d={DET({pos: [-0.45, 0, 0.45], rotY: 0.9, legs: "point", legK: backOut(ramp(f, APERTA - 4, APERTA + 4)), t, blink: blinkCurve(f + 7), tail: 1, mouth: f > DESLIGAR + 10 ? 0.3 : 0})} />
      ) : (
        <Dog d={DET({pos: [lerp(-2.6, -0.45, k), 0, 0.45], rotY: Math.PI / 2, walk: 1, run: 0.6, t, tail: 0.3})} />
      )}
    </>
  );
};
/* título: DESLIGAMENTO DIPLOMÁTICO — voltando de avião com o controle na boca */
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.25, 1.25, 2.4]} look={[0.2, 1.0, -0.3]} fov={48} f={f} a={a} />
    <hemisphereLight args={["#ffffff", "#606878", 1.0]} />
    <pointLight position={[0.5, 2.6, 1.5]} intensity={8} distance={8} decay={1.4} castShadow />
    <PlaneCabin t={t} />
    <Dog d={DET({pos: [0, 0.5, 0.0], rotY: 0, t, glasses: true, tail: 1, mouthItem: <Remote p={[0, -0.02, 0.05]} r={[0, 0, Math.PI / 2]} s={0.55} c={{alive: 0}} />})} s={0.85} />
  </>
);

/* =================== 4 — Parabéns, o pombo e o cachorro atrás do sofá =================== */
const PB = L(12);
const RECUPEROU = at(12, "recuperou");
const QUARENTA = at(12, "quarenta");
const ARGENTINO = at(12, "argentino");
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const tv = ramp(f, RECUPEROU, RECUPEROU + 6);
  return (
    <>
      <Cam pos={[0.05, 1.4, 3.2]} look={[0.05, 0.95, -0.5]} fov={50} f={f} a={a} />
      <LivingRoom tvLight={tv} />
      <Toy pose={{...idle(f), pos: [-0.45, 0, -0.3], rotY: 0.15, ...OFFER, smile: 1, mouthOpen: 0.2}} look={BOYL} palmRef={palm} />
      <InHand palm={palm}>
        <Remote p={[0, -0.02, 0.08]} r={[Math.PI / 2, 0, 0]} s={0.4} c={{alive: 0, ir: tv * Math.max(0, Math.sin(t * 20))}} />
      </InHand>
      <Dog d={DET({pos: [0.6, 0, -0.25], rotY: -0.3, legs: "hold", legK: 1, scarf: true, t, blink: blinkCurve(f + 7), tail: 1, mouth: 0.1})} />
      <Cuia p={[0.53, 0.78, 0.14]} r={[0.15, 0, 0]} s={1.3} />
    </>
  );
};
/* 🌀 "E lembre-se: o pombo não sabe ler. Ele só finge." */
const S15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 0.85, 2.9]} look={[0, 0.6, 0]} fov={44} f={f} a={a} punch={10} />
    <color attach="background" args={["#ffe3b8"]} />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.6, 2, 1.6]} intensity={6} distance={8} decay={1.4} castShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#b07a45" roughness={0.7} />
    </mesh>
    <WeddingPigeon p={{pos: [0, 0, 0], rotY: 0, t, blink: blinkCurve(f + 3), glasses: true, bob: 1}} s={2.2} />
    <Book p={[0, 0.42, 0.42]} r={[-0.25, 0, 0]} s={1.05} />
  </>
);
/* final: sala à noite, o cachorro detetive aparecendo atrás do sofá */
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const up = easeOut(ramp(f, a + 8, a + 30));
  return (
    <>
      <Cam pos={[0, 1.3, 2.5]} look={[0, 1.1, SOFA_Z]} fov={48} f={f} a={a} />
      <LivingRoom night />
      <pointLight position={[0.8, 1.6, 0.8]} intensity={2.5} distance={4} decay={1.6} color="#ffd9a0" />
      <pointLight position={[0, 1.6, SOFA_Z + 0.4]} intensity={3} distance={2.5} decay={1.5} color="#c8d4ff" />
      <Dog d={DET({pos: [0, lerp(-0.6, 0.38, up), SOFA_Z - 0.75], rotY: 0, legs: "point", legK: up, lupa: true, t, blink: blinkCurve(f + 7), tail: 0, sniff: 0.6, mouth: 0})} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: MAS0, Comp: S0b},
  {from: ENTAO0, Comp: S1},
  {from: L(1), Comp: S2},
  {from: L(2), Comp: S3},
  {from: ENCONTRA - 2, Comp: S3b},
  {from: L(3), Comp: S4},
  {from: L(4), Comp: S5},
  {from: L(5), Comp: S6},
  {from: L(6), Comp: S4},
  {from: E6, Comp: S8},
  {from: L(7), Comp: S9},
  {from: L(8), Comp: S10},
  {from: L(9), Comp: S11},
  {from: L(10), Comp: S12},
  {from: L(11), Comp: S13},
  {from: PB, Comp: S14},
  {from: L(13), Comp: S15},
  {from: L(14), Comp: S16},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CONTROLE} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["tv", "controle", "cachorro", "farejador", "detetive", "polvo", "coracoes", "nome", "sofa", "biscoito", "dois", "mil", "nove", "brasil", "fugiu", "argentina", "abandono", "remoto", "vaca", "leite", "hobby", "aviao", "buenos", "aires", "vivo", "tango", "infravermelho", "famoso", "faclube", "batata", "geladeira", "vergonha", "botao", "desligar", "desligamento", "diplomatico", "parabens", "quarenta", "reais", "passagem", "argentino", "pombo", "ler", "finge", "seguir", "perfil", "noite"]);
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
const RandomFact: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: 540, top: 300, transform: `translate(-50%,-50%) scale(${s}) rotate(${-4 + 2 * Math.sin(f / 4)}deg)`, background: "#ff5fb0", color: "#ffffff", fontFamily, fontWeight: 900, fontSize: 60, padding: "14px 34px", borderRadius: 26, border: "7px solid #101018", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap"}}>
      🌀 FATO ALEATÓRIO
    </div>
  );
};
/** mapa da América do Sul (Brasil + Argentina) */
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const AR: [number, number][] = [[-62.5, -22.0], [-64.3, -22.8], [-65.7, -22.1], [-66.8, -22.4], [-68.2, -24.4], [-68.6, -27.0], [-69.6, -29.0], [-70.5, -31.5], [-70.0, -34.0], [-71.0, -36.5], [-71.4, -39.0], [-71.7, -42.0], [-71.8, -45.0], [-72.2, -48.0], [-73.0, -50.0], [-72.5, -52.0], [-68.6, -52.6], [-69.0, -51.5], [-68.0, -50.0], [-67.6, -48.5], [-65.8, -47.5], [-67.4, -46.0], [-65.0, -45.0], [-65.2, -43.5], [-64.0, -42.4], [-63.8, -41.0], [-62.3, -40.6], [-62.3, -39.0], [-58.0, -38.6], [-56.8, -36.5], [-57.3, -35.3], [-58.4, -34.0], [-58.4, -33.2], [-58.2, -31.5], [-57.6, -30.2], [-55.6, -27.4], [-54.6, -25.6], [-57.6, -27.4], [-58.2, -24.6], [-60.0, -23.8]];
const proj = (lon: number, lat: number): [number, number] => [190 + (lon + 75) * 16.5, 190 + (6 - lat) * 16.5];
const pathD = (pts: [number, number][]) => pts.map(([lo, la], i) => `${i ? "L" : "M"} ${proj(lo, la)[0].toFixed(0)} ${proj(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
const SP: [number, number] = [-46.6, -23.5];
const BA: [number, number] = [-58.4, -34.6];
/** caminho das pegadas: sai de casa, roda o Brasil e desce pra Argentina */
const TRAIL: [number, number][] = [SP, [-44, -19], [-41, -12], [-44, -6], [-50, -6], [-55, -11], [-52, -18], [-53, -26], [-56.5, -30.5], BA];
const trailPts = (() => {
  const pts = TRAIL.map(([lo, la]) => proj(lo, la));
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = seg[seg.length - 1];
  const out: {x: number; y: number; a: number}[] = [];
  for (let d = 0, k = 0; d <= total; d += 34, k++) {
    let i = 1;
    while (i < seg.length - 1 && seg[i] < d) i++;
    const u = (d - seg[i - 1]) / (seg[i] - seg[i - 1]);
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const a = Math.atan2(y1 - y0, x1 - x0);
    const side = k % 2 ? 1 : -1;
    out.push({x: lerp(x0, x1, u) + Math.cos(a + Math.PI / 2) * 9 * side, y: lerp(y0, y1, u) + Math.sin(a + Math.PI / 2) * 9 * side, a});
  }
  return out;
})();
const Paw: React.FC<{x: number; y: number; a: number}> = ({x, y, a}) => (
  <g transform={`translate(${x},${y}) rotate(${(a * 180) / Math.PI + 90})`}>
    <ellipse cx={0} cy={4} rx={7} ry={6} fill="#5a3a22" />
    {[-7, -2.5, 2.5, 7].map((dx, i) => (
      <circle key={i} cx={dx} cy={-5 - (i === 1 || i === 2 ? 3 : 0)} r={2.6} fill="#5a3a22" />
    ))}
  </g>
);
const SAMap: React.FC<{from: number; to: number; mode: "trail" | "plane"; trailTo?: number}> = ({from, to, mode, trailTo = to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const P = proj(...SP);
  const Q = proj(...BA);
  const n = mode === "trail" ? Math.floor(trailPts.length * clamp((f - from - 4) / (trailTo - from - 4))) : 0;
  const pk = easeInOut(clamp((f - from - 6) / (to - from - 14)));
  const cx = (P[0] + Q[0]) / 2 - 160, cy = (P[1] + Q[1]) / 2;
  const plx = (1 - pk) * (1 - pk) * P[0] + 2 * (1 - pk) * pk * cx + pk * pk * Q[0];
  const ply = (1 - pk) * (1 - pk) * P[1] + 2 * (1 - pk) * pk * cy + pk * pk * Q[1];
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={pathD(BR)} fill="#ffc35a" stroke="#c9822a" strokeWidth={7} strokeLinejoin="round" />
        <path d={pathD(AR)} fill="#9fd1f0" stroke="#4a8ab8" strokeWidth={7} strokeLinejoin="round" />
        {mode === "trail" && trailPts.slice(0, n).map((p, i) => <Paw key={i} {...p} />)}
        {mode === "plane" && (
          <path d={`M ${P[0]} ${P[1]} Q ${cx} ${cy} ${Q[0]} ${Q[1]}`} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="14 12" />
        )}
        <circle cx={P[0]} cy={P[1]} r={12} fill="#101018" />
        <circle cx={Q[0]} cy={Q[1]} r={12} fill="#e8262d" stroke="#101018" strokeWidth={4} />
      </svg>
      <div style={{position: "absolute", left: 420, top: 380, transform: "translate(-50%,-50%)", fontFamily, fontWeight: 900, fontSize: 56, color: "#8a5a10"}}>BRASIL</div>
      <div style={{position: "absolute", left: 245, top: 900, transform: "translate(-50%,-50%) rotate(-70deg)", fontFamily, fontWeight: 900, fontSize: 46, color: "#2a5a88"}}>ARGENTINA</div>
      <div style={{position: "absolute", left: P[0] + 20, top: P[1] - 70, background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 32, padding: "2px 12px"}}>🏠 CASA</div>
      {mode === "plane" && (
        <div style={{position: "absolute", left: plx, top: ply, transform: `translate(-50%,-50%) rotate(${110 + 30 * (pk - 0.5)}deg)`, fontSize: 110}}>✈️</div>
      )}
    </AbsoluteFill>
  );
};
const FastFwd: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 800, top: 1010, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(900,880)">
          <circle r={85} fill="#ffffff" stroke="#101018" strokeWidth={12} />
          <line x1={0} y1={0} x2={55 * Math.sin(a)} y2={-55 * Math.cos(a)} stroke="#101018" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={36 * Math.sin(a / 12)} y2={-36 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={12} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};
const Flash: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const v = Math.max(0, Math.sin((f / FPS) * 9)) ** 8;
  return <AbsoluteFill style={{background: "#ffffff", opacity: 0.55 * v}} />;
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
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
const FOLLOW_FROM = L(14) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const FACTS = [L(1), L(5), L(9), L(13)];
const FACT_END = [L(2), L(6), L(10), L(14)];
export const VideoControle: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(4), L(7), L(11)];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <SAMap from={L(3)} to={L(4) - 1} mode="trail" trailTo={ARGENTINA} />
      <SAMap from={L(6)} to={E6 - 1} mode="plane" />
      <FastFwd from={L(6) + 8} to={E6 - 2} />
      <Flash from={FAMOSO} to={L(9) - 2} />

      <StageTitle from={L(4) + 4} to={L(5) - 3} lines={["ABANDONO", "REMOTO"]} />
      <StageTitle from={L(7) + 4} to={L(8) - 3} lines={["TANGO", "INFRAVERMELHO"]} />
      <StageTitle from={L(11) + 4} to={L(12) - 3} lines={["DESLIGAMENTO", "DIPLOMÁTICO"]} />
      {FACTS.map((x, i) => (
        <RandomFact key={i} from={x + 2} to={FACT_END[i] - 3} />
      ))}

      <Ono from={4} to={MAS0 + 2} text="?" x={540} y={560} size={230} color="#ffd21f" rot={8} />
      <Tag from={at(0, "controle") - 2} to={ENTAO0 - 2} text="TV SEM CONTROLE" x={540} y={420} />
      <Tag from={DETETIVE - 2} to={L(1) - 2} text="DETETIVE" x={720} y={520} />
      <Ono from={at(2, "fareja")} to={ENCONTRA - 4} text="SNIF SNIF!" x={540} y={460} size={120} color="#ffffff" />
      <BigNum from={DOIS} to={L(3) - 2} text="2009" y={420} size={170} />
      <Tag from={FUGIU - 2} to={L(4) - 2} text="FUGIU!" x={540} y={1150} />
      <Tag from={BUENOS - 2} to={E6 - 2} text="BUENOS AIRES" x={540} y={1150} />
      <Ono from={TANGO6} to={L(7) - 2} text="TCHÁ-TCHÁ!" x={540} y={420} size={120} color="#ff5fb0" />
      <Tag from={at(8, "faclube") - 2} to={L(9) - 2} text="FÃ-CLUBE" x={540} y={420} />
      <Ono from={at(9, "batata")} to={APAGA - 2} text="BATATA!" x={540} y={520} size={130} color="#ffd21f" />
      <Ono from={DESLIGAR + 2} to={L(11) - 2} text="BIP!" x={600} y={500} size={170} color="#e8262d" />
      <Confetti from={PB} to={PB + 120} />
      <Ono from={PB} to={at(12, "voce") - 2} text="PARABÉNS!" x={540} y={380} size={130} color="#ff4d6d" rot={-4} />
      <BigNum from={QUARENTA} to={at(12, "e", 0) - 2} text="R$ 40.000" y={420} size={140} />
      <Sticker from={at(12, "controle")} to={L(13) - 3} x={190} y={430} rot={-6} label="CONTROLE DE VOLTA">
        <g transform="translate(152,105)">
          <rect x={-22} y={-70} width={44} height={140} rx={12} fill="#1d1f27" />
          <circle cx={-8} cy={-52} r={7} fill="#e8262d" />
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={-14 + i * 9.5} cy={-25} r={4} fill={["#e8414f", "#2ecc71", "#ffd21f", "#3a86ff"][i]} />)}
        </g>
      </Sticker>
      <Sticker from={at(12, "passagem")} to={L(13) - 3} x={540} y={400} rot={4} label="PASSAGEM">
        <g transform="translate(152,105)">
          <text x={0} y={30} textAnchor="middle" fontSize={110}>✈️</text>
        </g>
      </Sticker>
      <Sticker from={ARGENTINO} to={L(13) - 3} x={890} y={430} rot={6} label="CACHORRO ARGENTINO">
        <g transform="translate(152,105)">
          <rect x={-70} y={-55} width={140} height={36} fill="#74b9e8" />
          <rect x={-70} y={-19} width={140} height={36} fill="#ffffff" />
          <rect x={-70} y={17} width={140} height={36} fill="#74b9e8" />
          <circle cx={0} cy={-1} r={12} fill="#f6b40e" />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      <FollowCard from={FOLLOW_FROM} to={TOTAL_CONTROLE - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozcontrole.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.18} />
      ))}
      {titles.map((x) => (
        <SND key={"b" + x} src="sfx7/boing.mp3" from={x + 3} dur={32} v={FXV * 0.75} />
      ))}
      {FACTS.map((x) => (
        <SND key={"r" + x} src="sfx10/ding.mp3" from={x + 2} dur={30} v={FXV * 0.32} />
      ))}
      <SND src="sfx15/static.mp3" from={0} dur={MAS0} v={FXV * 0.12} />
      <SND src="sfx12/throw.mp3" from={MAS0 + 4} dur={30} v={FXV * 0.4} />
      <SND src="sfx3/door.mp3" from={ENTAO0 + 2} dur={40} v={FXV * 0.35} />
      <SND src="sfx11/bark.mp3" from={FAREJADOR + 2} dur={30} v={FXV * 0.35} />
      <SND src="sfx8/sniff.mp3" from={at(2, "fareja")} dur={ENCONTRA - at(2, "fareja")} v={FXV * 0.45} />
      <SND src="sfx12/poof.mp3" from={ENCONTRA} dur={30} v={FXV * 0.35} />
      <SND src="sfx2/steps.mp3" from={L(3) + 6} dur={FUGIU - L(3)} v={FXV * 0.25} />
      <SND src="sfx10/moo.mp3" from={L(5) + 8} dur={50} v={FXV * 0.3} />
      <SND src="sfx14/papel.mp3" from={at(5, "hobby")} dur={30} v={FXV * 0.35} />
      <SND src="sfx2/plane.mp3" from={L(6) + 4} dur={E6 - L(6)} v={FXV * 0.35} />
      <SND src="sfx15/tango.mp3" from={DANCANDO} dur={72} v={FXV * 0.45} />
      <SND src="sfx15/tango.mp3" from={L(7) + 2} dur={72} v={FXV * 0.45} />
      <SND src="sfx14/zap.mp3" from={L(7) + 6} dur={30} v={FXV * 0.3} />
      <SND src="sfx2/cheer.mp3" from={FAMOSO} dur={L(9) - FAMOSO} v={FXV * 0.35} />
      <SND src="sfx8/snap.mp3" from={FAMOSO + 4} dur={20} v={FXV * 0.4} />
      <SND src="sfx8/snap.mp3" from={FAMOSO + 25} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/bonk.mp3" from={APAGA} dur={20} v={FXV * 0.35} />
      <SND src="sfx15/tango.mp3" from={L(10)} dur={72} v={FXV * 0.35} />
      <SND src="sfx8/beep.mp3" from={DESLIGAR + 2} dur={20} v={FXV * 0.5} />
      <SND src="sfx8/poweroff.mp3" from={DESLIGAR + 6} dur={30} v={FXV * 0.4} />
      <SND src="sfx2/plane.mp3" from={L(11)} dur={PB - L(11)} v={FXV * 0.25} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FXV * 0.45} />
      <SND src="sfx7/cash.mp3" from={QUARENTA} dur={30} v={FXV * 0.4} />
      {["controle", "passagem"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(12, w)} dur={22} v={FXV * 0.45} />
      ))}
      <SND src="sfx7/pof.mp3" from={ARGENTINO} dur={22} v={FXV * 0.45} />
      <SND src="sfx8/coo.mp3" from={L(13) + 6} dur={40} v={FXV * 0.35} />
      <SND src="sfx8/sniff.mp3" from={L(14) + 10} dur={40} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
