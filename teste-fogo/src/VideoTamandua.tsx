import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3} from "./Sets5";
import {Dog, Sofa, MoonSet, sm, rbox} from "./Sets9";
import {Penguin} from "./Sets11";
import {DAD, DadHead} from "./Sets12";
import {ShowerCap, EvaHelmet, EvaGear} from "./Sets14";
import {Duck, Cap} from "./Sets15";
import {Tamandua, TamP, tamTip, Capivara, Ants, AntHill, Mess, Sock, Homework, GameConsole, FishTank, Router, RockingChair, HeadGlasses, PilotCap, MummyWrap, Whistle, Stadium, Goal, Ball, Airliner, MovingTruck, EiffelTower, Pyramid, Desert, Snow, OpenSea, Pantanal, FoodCourt, Parachute, BigPhone} from "./Sets17";
import {Captions, StageTitle, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingTamandua.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_TAMANDUA = F(words[words.length - 1].e + 0.9);

/* ---------- visuais dos personagens ---------- */
const BOYL: ToyLook = {hoodie: true};
const VO: ToyLook = {hairStyle: "bun", hair: "#e6e6e6", shirt: "#8e5aa8", pants: "#5a4a6a", skin: "#f1c8a0", shoe: "#5a3a2a"};
const VIZ: ToyLook = {shirt: "#9ad1f0", pants: "#9ad1f0", hairStyle: "buzz", hair: "#4a3020", socks: "#ffffff"};
const TIO: ToyLook = {shirt: "#2ecc71", pants: "#3a4a6a", hairStyle: "spiky", hair: "#2a1a10"};
const NOIVA: ToyLook = {dress: true, veil: true, hairStyle: "long", hair: "#5a3a20", lashes: true, lips: "#d6455d"};
const GOLEIRO: ToyLook = {shirt: "#ff8a1f", pants: "#101018", hairStyle: "spiky", hair: "#101018"};
const PILOTO: ToyLook = {shirt: "#ffffff", pants: "#1f2a44", hairStyle: "buzz", hair: "#3a2a1a"};
const JUIZ: ToyLook = {shirt: "#101018", pants: "#101018", hairStyle: "bald", shoe: "#101018"};
const TECNICO: ToyLook = {polo: true, shirt: "#2e86de", pants: "#3a3f4a", hairStyle: "buzz", hair: "#101018"};
const ASTRO: ToyLook = {shirt: "#f4f4f2", pants: "#f4f4f2", shoe: "#f4f4f2", sole: "#c9ced6"};
const MUMIA: ToyLook = {skin: "#e9e2cf", shirt: "#efe8d4", pants: "#efe8d4", plaid: "#cfc6ae", hairStyle: "bald", shoe: "#e9e2cf", sole: "#cfc6ae"};
const CROWD_LOOKS: ToyLook[] = [
  {shirt: "#e8414f", hairStyle: "curly"},
  {shirt: "#2e86de", hairStyle: "ponytail", hair: "#5a3a20"},
  {shirt: "#ffd21f", hairStyle: "buzz"},
  {shirt: "#9b59b6", hairStyle: "pigtails", hair: "#2a1a10"},
  {shirt: "#2ecc71", hairStyle: "mohawk"},
  {shirt: "#ff8a1f", hairStyle: "straight", hair: "#101018"},
  {shirt: "#f06292", hairStyle: "long", hair: "#a4501f"},
  {shirt: "#26c6da", hairStyle: "bowl"},
];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const PHONE_UP: Pose = {rShoulder: [-2.5, 0, -0.25], rElbow: -0.3};
const PHONE_LOOK: Pose = {rShoulder: [-1.1, 0.2, 0.2], rElbow: -1.3, head: [0.25, 0, 0]};
const SIT: Pose = {legLift: 1};

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
const PhoneProp: React.FC<{lit?: boolean}> = ({lit = true}) => (
  <group position={[0, -0.03, 0.05]} rotation={[0.2, 0, 0]}>
    <mesh geometry={rbox(0.11, 0.2, 0.02, 0.02)} material={sm("#1d1f27", 0.3)} />
    <mesh position={[0, 0, 0.011]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: lit ? 1 : 0.05})}>
      <planeGeometry args={[0.095, 0.17]} />
    </mesh>
  </group>
);
/** boneco segurando o celular */
const PhoneToy: React.FC<{pose: Pose; look: ToyLook; headExtra?: React.ReactNode; lit?: boolean}> = ({pose, look, headExtra, lit = true}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Toy pose={pose} look={look} palmRef={palm} headExtra={headExtra} />
      <InHand palm={palm}>
        <PhoneProp lit={lit} />
      </InHand>
    </>
  );
};

/* ======================= o quarto (montado aqui pra poder sumir porta, telhado e tapete) ======================= */
const RW = 6, RZ0 = -2.6, RZ1 = 3.2, RH = 3.2;
const WIN_X0 = -0.7, WIN_X1 = 0.7, WIN_Y0 = 1.2, WIN_Y1 = 2.3;
const DOOR_Z = 0.8; // porta na parede da direita (x = +3)
const Room: React.FC<{roof?: number; door?: number; rug?: number; night?: boolean; wall?: string}> = ({roof = 1, door = 1, rug = 1, night = false, wall = "#9ad6f2"}) => {
  const wm = sm(night ? "#3a4a7a" : wall, 0.9);
  const parts: [number, number, number, number][] = [
    [-RW / 2, WIN_X0, 0, RH],
    [WIN_X1, RW / 2, 0, RH],
    [WIN_X0, WIN_X1, 0, WIN_Y0],
    [WIN_X0, WIN_X1, WIN_Y1, RH],
  ];
  return (
    <group>
      {night ? <color attach="background" args={["#0b1030"]} /> : <Sky />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (RZ0 + RZ1) / 2]} material={sm("#c48a52", 0.6)} receiveShadow>
        <planeGeometry args={[RW, RZ1 - RZ0]} />
      </mesh>
      {rug > 0.01 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.3]} scale={rug} material={sm("#ff8fab", 0.95)} receiveShadow>
          <circleGeometry args={[1.6, 40]} />
        </mesh>
      )}
      {/* parede do fundo com janela */}
      {parts.map(([x0, x1, y0, y1], i) => (
        <mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, RZ0]} material={wm} receiveShadow>
          <boxGeometry args={[x1 - x0, y1 - y0, 0.12]} />
        </mesh>
      ))}
      {[[0, WIN_Y1, 1.5, 0.08], [0, WIN_Y0, 1.5, 0.08], [WIN_X0, (WIN_Y0 + WIN_Y1) / 2, 0.08, 1.2], [WIN_X1, (WIN_Y0 + WIN_Y1) / 2, 0.08, 1.2]].map(([x, y, w, h], i) => (
        <mesh key={"j" + i} position={[x, y, RZ0 + 0.08]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[w, h, 0.06]} />
        </mesh>
      ))}
      {/* lá fora */}
      <mesh position={[0, 2, RZ0 - 6]} material={sm(night ? "#101a44" : "#8fd0ff", 0.9, {emissive: night ? "#101a44" : "#8fd0ff", emissiveIntensity: 0.6})}>
        <planeGeometry args={[30, 14]} />
      </mesh>
      {/* parede esquerda */}
      <mesh position={[-RW / 2, RH / 2, (RZ0 + RZ1) / 2]} rotation={[0, Math.PI / 2, 0]} material={wm} receiveShadow>
        <planeGeometry args={[RZ1 - RZ0, RH]} />
      </mesh>
      {/* parede direita com vão da porta */}
      <mesh position={[RW / 2, RH / 2, (RZ0 + DOOR_Z - 0.55) / 2]} rotation={[0, -Math.PI / 2, 0]} material={wm}>
        <planeGeometry args={[DOOR_Z - 0.55 - RZ0, RH]} />
      </mesh>
      <mesh position={[RW / 2, RH / 2, (DOOR_Z + 0.55 + RZ1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={wm}>
        <planeGeometry args={[RZ1 - DOOR_Z - 0.55, RH]} />
      </mesh>
      <mesh position={[RW / 2, (2.2 + RH) / 2, DOOR_Z]} rotation={[0, -Math.PI / 2, 0]} material={wm}>
        <planeGeometry args={[1.1, RH - 2.2]} />
      </mesh>
      {door > 0.01 && (
        <mesh position={[RW / 2 - 0.03, 1.1, DOOR_Z]} scale={door} geometry={rbox(0.06, 2.2, 1.1, 0.02)} material={sm("#8a4f2a", 0.6)} />
      )}
      {/* teto */}
      {roof > 0.01 && (
        <mesh position={[0, RH, (RZ0 + RZ1) / 2]} rotation={[Math.PI / 2, 0, 0]} scale={[roof, roof, 1]} material={sm("#fbf7ee", 0.9, {side: THREE.DoubleSide})}>
          <planeGeometry args={[RW, RZ1 - RZ0]} />
        </mesh>
      )}
      {/* cama */}
      <group position={[-2.0, 0, -1.6]}>
        <mesh position={[0, 0.25, 0]} geometry={rbox(1.3, 0.5, 1.9, 0.05)} material={sm("#8a5a2b", 0.6)} castShadow />
        <mesh position={[0, 0.55, 0.05]} geometry={rbox(1.2, 0.14, 1.8, 0.06)} material={sm("#3a86ff", 0.8)} />
        <mesh position={[0, 0.66, -0.7]} geometry={rbox(0.7, 0.14, 0.32, 0.07)} material={sm("#ffffff", 0.8)} />
      </group>
    </group>
  );
};
const RoomLights: React.FC<{dim?: number}> = ({dim = 1}) => (
  <>
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0 * dim]} />
    <pointLight position={[0.3, 2.9, 0.8]} intensity={10 * dim} distance={12} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 4]} intensity={0.5 * dim} />
  </>
);

/* ---------- objetos que o tamanduá aspira (posição no mundo) ---------- */
const TAM0: V3 = [0.1, 0, -0.9];
type Item = {w: number; pos: V3; kind: "sock" | "dever" | "game" | "vo" | "fish" | "wifi"};
const it = (line: number, word: string, n: number, pos: V3, kind: Item["kind"]): Item => ({w: at(line, word, n), pos, kind});
const ITEMS: Item[] = [
  it(1, "meias", 0, [0.9, 0.05, 0.9], "sock"),
  it(1, "dever", 0, [-0.8, 0.03, 1.0], "dever"),
  it(1, "videogame", 0, [1.3, 0.06, 0.1], "game"),
  it(1, "vo", 0, [-0.95, 0, 0.85], "vo"),
  it(1, "peixinho", 0, [1.7, 0.75, -0.9], "fish"),
  it(1, "wifi", 0, [-1.5, 0.95, -1.4], "wifi"),
];
const SUCK = 12; // frames da língua puxando
/** progresso da aspiração de um item: 0 parado, 0..1 indo pra boca, >1 sumiu */
const suckK = (f: number, w: number) => (f < w ? 0 : (f - w) / SUCK);
const ItemMesh: React.FC<{kind: Item["kind"]; t: number; f: number}> = ({kind, t, f}) => {
  switch (kind) {
    case "sock":
      return (
        <group>
          <Sock r={[0, 0, Math.PI / 2]} color="#ffffff" />
          <Sock p={[0.15, 0, 0.05]} r={[0, 0.5, Math.PI / 2]} color="#ffd21f" />
        </group>
      );
    case "dever":
      return <Homework r={[-Math.PI / 2, 0, 0.3]} s={1.4} />;
    case "game":
      return <GameConsole s={1.2} />;
    case "vo":
      return (
        <group>
          <RockingChair t={t} />
          <Toy pose={{...idle(f), ...SIT, pos: [0, 0.1, -0.02], rotY: 0, blink: 1, head: [0.25, 0, 0.15]}} look={VO} headExtra={<HeadGlasses />} />
        </group>
      );
    case "fish":
      return (
        <group>
          <mesh position={[0, -0.4, 0]} geometry={rbox(0.5, 0.75, 0.4, 0.03)} material={sm("#ffffff", 0.6)} />
          <FishTank t={t} s={1.2} />
        </group>
      );
    case "wifi":
      return (
        <group>
          <mesh position={[0, -0.04, 0]} geometry={rbox(0.5, 0.06, 0.3, 0.02)} material={sm("#ffffff", 0.6)} />
          <Router t={t} />
        </group>
      );
  }
};
/** item que pode estar sendo puxado pela língua */
const Suckable: React.FC<{item: Item; f: number; t: number; tamP: V3; tip: V3; s?: number}> = ({item, f, t, tamP, tip, s = 1}) => {
  const k = suckK(f, item.w);
  if (k > 1) return null;
  const m = easeInOut(clamp((k - 0.35) / 0.65));
  const tipW: V3 = [tamP[0] + tip[0], tamP[1] + tip[1], tamP[2] + tip[2]];
  const p: V3 = [lerp(item.pos[0], tipW[0], m), lerp(item.pos[1], tipW[1], m), lerp(item.pos[2], tipW[2], m)];
  return (
    <group position={p} scale={s * (1 - 0.85 * m)} rotation={[0, m * 4, 0]}>
      <ItemMesh kind={item.kind} t={t} f={f} />
    </group>
  );
};
/** posição da língua (espaço do tamanduá) de acordo com o item sendo puxado */
const tongueFor = (f: number, items: Item[], tamP: V3, tip: V3): V3 | null => {
  for (const item of items) {
    const k = suckK(f, item.w);
    if (k > 0 && k <= 1) {
      const out = easeOut(clamp(k / 0.35));
      const m = easeInOut(clamp((k - 0.35) / 0.65));
      const tgt: V3 = [item.pos[0] - tamP[0], item.pos[1] - tamP[1], item.pos[2] - tamP[2]];
      const reach: V3 = [lerp(tip[0], tgt[0], out), lerp(tip[1], tgt[1], out), lerp(tip[2], tgt[2], out)];
      return [lerp(reach[0], tip[0], m), lerp(reach[1], tip[1], m), lerp(reach[2], tip[2], m)];
    }
  }
  return null;
};

/* =================== 1 — o quarto e o tamanduá aspirador =================== */
const ECO = at(0, "eco");
const ENTAO0 = at(0, "entao");
const TAMANDUA0 = at(0, "tamandua");
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.9, 5.8]} look={[0, 1.05, -0.4]} fov={54} f={f} a={a} />
    <RoomLights />
    <Room />
    <Mess n={90} w={5} d={4} />
    <Toy pose={{...idle(f), pos: [0, 0.35, 0.6], rotY: 0, ...(f >= ECO ? {mouthOpen: 0.8, ...ARMS_UP} : {brow: 0.6, rShoulder: [-2.6, 0, -0.6], rElbow: -1.9}), eyeWide: f >= ECO ? 0.6 : 0}} look={BOYL} />
  </>
);
const S0b: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 4, TAMANDUA0 - 4));
  return (
    <>
      <Cam pos={[-1.2, 1.6, 3.4]} look={[1.4, 0.7, 0.3]} fov={54} f={f} a={a} />
      <RoomLights />
      <Room />
      <Mess n={90} w={5} d={4} />
      <Toy pose={{...idle(f), pos: [-0.3, 0.35, 0.4], rotY: 1.0, smile: 0.4, eyeWide: 0.3}} look={BOYL} />
      <Tamandua p={[lerp(3.6, 1.3, k), 0, DOOR_Z - 0.3 * k]} rotY={-Math.PI / 2 + 0.6 * k} c={{t, walk: 1 - k * 0.8, sniff: 1, headDown: 0.4, blink: blinkCurve(f + 9)}} />
    </>
  );
};
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const tip = tamTip(0.15, 0);
  const tongue = tongueFor(f, ITEMS, TAM0, tip);
  const nGone = ITEMS.filter((x) => suckK(f, x.w) > 0.3).length;
  return (
    <>
      <Cam pos={[0, 2.5, 5.2]} look={[0, 0.7, -0.2]} fov={58} f={f} a={a} />
      <RoomLights />
      <Room />
      <Mess n={90} w={5} d={4} hide={clamp(nGone / ITEMS.length)} />
      <Tamandua p={TAM0} rotY={0} c={{t, sniff: 0.4, headDown: 0.15, blink: blinkCurve(f + 9), tongue, belly: nGone / ITEMS.length * 0.6}} />
      {ITEMS.map((item, i) => (
        <Suckable key={i} item={item} f={f} t={t} tamP={TAM0} tip={tip} />
      ))}
    </>
  );
};
/* título: ASPIRADOR SILVESTRE */
const S2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, 3.6]} look={[0, 0.8, -0.6]} fov={50} f={f} a={a} />
    <RoomLights />
    <Room />
    <Tamandua p={TAM0} rotY={0.2} c={{t, belly: 1, blink: blinkCurve(f + 9), headDown: -0.2}} />
  </>
);
/* "Mas ele não para": tapete, porta, telhado e o vizinho pela janela */
const TAPETE = at(3, "tapete");
const PORTA = at(3, "porta");
const TELHADO = at(3, "telhado");
const VIZINHO3 = at(3, "vizinho");
const TAM3: V3 = [0, 0, 0.2];
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const rug = 1 - easeInOut(ramp(f, TAPETE, TAPETE + 12));
  const door = 1 - easeInOut(ramp(f, PORTA + 2, PORTA + 14));
  const roof = 1 - easeInOut(ramp(f, TELHADO + 2, TELHADO + 16));
  const vz = easeInOut(ramp(f, VIZINHO3 + 4, VIZINHO3 + 30));
  const yaw = f < PORTA ? 0 : f < TELHADO ? -1.2 : f < VIZINHO3 ? 0 : Math.PI;
  const tipL = tamTip(f >= TELHADO && f < VIZINHO3 ? -0.6 : 0.2, 0);
  let tongue: V3 | null = null;
  const reach = (w: number, tgt: V3) => {
    const k = (f - w) / 14;
    if (k > 0 && k < 1) {
      const o = Math.sin(k * Math.PI);
      tongue = [lerp(tipL[0], tgt[0], o), lerp(tipL[1], tgt[1], o), lerp(tipL[2], tgt[2], o)];
    }
  };
  reach(TAPETE, [0.2, 0.05, 1.6]);
  reach(TELHADO + 2, [0, RH - 0.9, 0.9]);
  // a porta e o vizinho: o corpo vira e a língua vai na direção deles (espaço local, já rotacionado)
  if (f >= PORTA && f < PORTA + 16) reach(PORTA, [0, 0.9, 2.6]);
  if (f >= VIZINHO3 + 2 && f < VIZINHO3 + 18) reach(VIZINHO3 + 2, [0, 1.3, 2.4]);
  const vizP: V3 = [lerp(0, 0, vz), lerp(1.0, 0.5, vz), lerp(RZ0 - 0.6, TAM3[2] - 0.8, vz)];
  return (
    <>
      <Cam pos={[-0.3, 2.3, 4.0]} look={[0.2, 1.1, -0.6]} fov={60} f={f} a={a} />
      <RoomLights />
      <Room rug={rug} door={door} roof={roof} />
      <Tamandua p={TAM3} rotY={yaw} c={{t, belly: 1, sniff: 0.4, blink: blinkCurve(f + 9), tongue}} />
      {f >= VIZINHO3 - 10 && f < VIZINHO3 + 30 && (
        <group position={vizP} scale={1 - 0.8 * vz} rotation={[0.6 * vz, 0, 0.3 * vz]}>
          <Toy pose={{...idle(f), pos: [0, -0.6, 0], rotY: 0, eyeWide: 1, mouthOpen: 0.7, ...ARMS_UP}} look={VIZ} headExtra={<ShowerCap />} />
          <Duck p={[0.4, 0.7, 0.3]} s={0.35} t={t} />
        </group>
      )}
    </>
  );
};
/* internet na barriga, a senha e o podcast */
const SENHA = at(4, "senha");
const PODCAST = at(4, "podcast");
const S4: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.7, 4.3]} look={[0, 1.0, -0.4]} fov={52} f={f} a={a} />
    <RoomLights />
    <Room roof={0} door={0} rug={0} />
    <Tamandua p={[0.35, 0, -0.5]} rotY={-0.9} c={{t, belly: 1, blink: blinkCurve(f + 9), wifi: backOut(ramp(f, a + 4, a + 14))}} />
  </>
);
/* a família grudada no tamanduá */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const palmD = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 3.2, 5.0]} look={[0, 0.55, -0.6]} fov={56} f={f} a={a} />
      <RoomLights />
      <Room roof={0} door={0} rug={0} wall="#ffe3b8" />
      <Tamandua p={[0, 0, 0.75]} rotY={Math.PI / 2} c={{t, belly: 1, lie: 1, blink: blinkCurve(f + 9), wifi: 1}} />
      <PhoneToy pose={{...idle(f), ...SIT, ...PHONE_LOOK, pos: [-1.05, -0.35, -0.45], rotY: 0.2, smile: 0.5}} look={DAD} headExtra={<DadHead />} />
      <PhoneToy pose={{...idle(f + 13), ...SIT, ...PHONE_UP, pos: [0.05, -0.35, -0.35], rotY: 0, mouthOpen: 0.5 + 0.3 * Math.sin(t * 9), smile: 1}} look={TIO} headExtra={<Cap color="#e8414f" />} />
      <Dog d={{pos: [1.05, 0, -0.35], rotY: -0.25, legs: "hold", legK: 1, t, blink: blinkCurve(f + 31), tail: 1, tongue: 0.6, mouth: 0.3}} />
      <group position={[1.03, 0.62, 0.17]} rotation={[-0.4, -0.25, 0]}>
        <PhoneProp />
      </group>
    </>
  );
};
/* o tamanduá pula a janela atrás de formiga */
const PULA = at(6, "pula");
const LEVANDO = at(6, "levando");
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const j = easeInOut(ramp(f, PULA, PULA + 22));
  const gone = f > PULA + 22;
  return (
    <>
      <Cam pos={[0, 2.0, 5.8]} look={[0, 1.2, -1.0]} fov={58} f={f} a={a} />
      <RoomLights />
      <Room roof={0} door={0} rug={0} wall="#ffe3b8" />
      {!gone && <Tamandua p={[0, lerp(0, 1.35, Math.sin(j * Math.PI * 0.6)) + 1.0 * j, lerp(-0.6, RZ0 - 1.2, j)]} rotY={Math.PI} s={lerp(1, 0.7, j)} c={{t, belly: 1, walk: f < PULA ? 1 : 0.3, run: 1.6, sniff: 1, headDown: 0.3, wifi: 1}} />}
      <PhoneToy pose={{...idle(f), ...PHONE_UP, pos: [-1.1, 0, 0.6], rotY: 0.2, brow: 0.8, mouthOpen: 0.4}} look={DAD} headExtra={<DadHead />} lit={!gone} />
      <PhoneToy pose={{...idle(f + 13), ...PHONE_UP, pos: [0.1, 0, 0.9], rotY: 0, brow: 0.8, mouthOpen: 0.5}} look={TIO} headExtra={<Cap color="#e8414f" />} lit={!gone} />
      <Dog d={{pos: [1.1, 0, 0.7], rotY: -0.3, t, blink: blinkCurve(f + 31), tail: 0.2, head: [0.2, 0.3, 0]}} />
    </>
  );
};

/* =================== 2 — a procissão atrás do Wi-Fi =================== */
const NOIVA7 = at(7, "noiva");
const GOLEIRO7 = at(7, "goleiro");
const PILOTO7 = at(7, "piloto");
const AVIAO7 = at(7, "aviao");
const CAMINHAO7 = at(7, "caminhao");
const PX = 4; // cidade: rua ao longo de x
const crowdPos = (i: number): V3 => {
  const r = rng(i * 13 + 5);
  return [-1.8 - (i % 6) * 0.7 - r() * 0.3, 0, -1.1 + Math.floor(i / 6) * 0.55 + (r() - 0.5) * 0.2];
};
const Procession: React.FC<{f: number; t: number; x: number; show: {noiva: boolean; goleiro: boolean; piloto: boolean; aviao: boolean; caminhao: boolean}}> = ({f, t, x, show}) => (
  <group position={[x, 0, 0]}>
    <Tamandua p={[0, 0, 0]} rotY={Math.PI / 2} c={{t, walk: 1, run: 1.2, sniff: 1, headDown: 0.45, belly: 1, wifi: 1}} />
    {Array.from({length: 24}, (_, i) => {
      const p = crowdPos(i);
      return <PhoneToy key={i} pose={{...idle(f + i * 7), ...PHONE_UP, pos: p, rotY: Math.PI / 2, walk: t * 9 + i, walkAmt: 1, mouthOpen: 0.3}} look={CROWD_LOOKS[i % CROWD_LOOKS.length]} />;
    })}
    {show.noiva && <PhoneToy pose={{...idle(f), ...PHONE_UP, pos: [-1.3, 0, 1.15], rotY: Math.PI / 2, walk: t * 9, walkAmt: 1}} look={NOIVA} />}
    {show.goleiro && <PhoneToy pose={{...idle(f + 5), ...PHONE_UP, pos: [-1.5, 0, -1.6], rotY: Math.PI / 2, walk: t * 9 + 2, walkAmt: 1}} look={GOLEIRO} />}
    {show.piloto && <PhoneToy pose={{...idle(f + 9), ...PHONE_UP, pos: [-2.2, 0, 1.6], rotY: Math.PI / 2, walk: t * 9 + 4, walkAmt: 1}} look={PILOTO} headExtra={<PilotCap />} />}
    {show.aviao && <Airliner p={[-8.5, 0.8, 0.2]} r={[0, Math.PI / 2, 0]} s={1.4} />}
    {show.caminhao && <MovingTruck p={[-13, 0, -0.3]} rotY={Math.PI / 2} t={t} />}
  </group>
);
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const x = PX + (f - a) / FPS * 1.6;
  const show = {noiva: f >= NOIVA7 - 2, goleiro: f >= GOLEIRO7 - 2, piloto: f >= PILOTO7 - 2, aviao: f >= AVIAO7 - 2, caminhao: f >= CAMINHAO7 - 2};
  const focus = f >= CAMINHAO7 - 2 ? -13 : f >= AVIAO7 - 2 ? -8.5 : 0;
  const camX = x + 5.5 + focus * 0.55;
  const high = f >= AVIAO7 - 2;
  return (
    <>
      <Cam pos={high ? [x + focus + 4, 6.5, 8] : [camX, 2.4, 2.2]} look={high ? [x + focus, 1.0, 0] : [x + focus * 0.55 - 1.0, 1.0, 0]} fov={58} f={f} a={a} punch={4} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[x, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={14} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Procession f={f} t={t} x={x} show={show} />
    </>
  );
};
/* título: MIGRAÇÃO DIGITAL — vista de cima */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const x = PX + (f - a) / FPS * 1.6 + 10;
  return (
    <>
      <Cam pos={[x - 2, 17, 6]} look={[x - 5.5, 0, 0]} fov={55} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[x, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={18} />
      <Town t={t} galo={false} variant="nova" flat clouds={false} />
      <Procession f={f} t={t} x={x} show={{noiva: true, goleiro: true, piloto: true, aviao: true, caminhao: true}} />
    </>
  );
};

/* =================== 3 — o Maracanã =================== */
const MARACANA = at(9, "maracana");
const BOLA = at(10, "bola");
const REDE = at(10, "rede");
const JUIZ10 = at(10, "juiz");
const GOL10 = at(10, "gol", 1);
const COMEMORA = at(10, "comemora");
const StadiumLights: React.FC = () => (
  <>
    <hemisphereLight args={["#ffffff", "#3f7a3a", 1.0]} />
    <directionalLight position={[6, 14, 8]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
  </>
);
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, MARACANA, MARACANA + 40));
  return (
    <>
      <Cam pos={[0, 6, 14]} look={[0, 1.5, 0]} fov={60} f={f} a={a} />
      <StadiumLights />
      <Stadium />
      <AntHill p={[0, 0, 0]} s={1.4} />
      <Tamandua p={[lerp(-6, -1.8, k), 0, lerp(4, 1.2, k)]} rotY={0.9} s={1.2} c={{t, walk: 1 - k * 0.7, sniff: 1, headDown: 0.5, belly: 1, wifi: 1}} />
      {Array.from({length: 10}, (_, i) => {
        const p = crowdPos(i);
        return <PhoneToy key={i} pose={{...idle(f + i * 7), ...PHONE_UP, pos: [p[0] * 0.8 - 5 + 3 * k, 0, p[2] + 4.5], rotY: 0.9, walk: t * 9 + i, walkAmt: 1 - k}} look={CROWD_LOOKS[i % CROWD_LOOKS.length]} />;
      })}
      <Ball p={[2.0, 0.11, 1.5]} s={1.4} />
    </>
  );
};
const TAMM: V3 = [-1.2, 0, 1.0];
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const tip = tamTip(0.55, 0);
  const ballK = easeInOut(ramp(f, BOLA + 4, BOLA + 14));
  let tongue: V3 | null = f < BOLA ? [1.05, 0.15, 1.1] : null;
  if (f >= BOLA && f < BOLA + 14) {
    const k = (f - BOLA) / 14;
    const o = Math.sin(k * Math.PI);
    tongue = [lerp(tip[0], 2.5, o), lerp(tip[1], 0.12, o), lerp(tip[2], 1.6, o)];
  }
  const ballP: V3 = [lerp(TAMM[0] + 2.5, TAMM[0] + tip[0], ballK), 0.15, lerp(TAMM[2] + 1.6, TAMM[2] + tip[2], ballK)];
  return (
    <>
      <Cam pos={[-0.3, 2.4, 6.5]} look={[-0.5, 0.7, 0.6]} fov={52} f={f} a={a} />
      <StadiumLights />
      <Stadium />
      <AntHill p={[0, 0, 0]} s={1.4} />
      <Ants from={[0.0, 0.4, 0.3]} to={[TAMM[0] + tip[0], TAMM[1] + tip[1], TAMM[2] + tip[2]]} n={24} t={t} s={2.2} />
      <Tamandua p={TAMM} rotY={1.15} s={1.2} c={{t, sniff: 0.6, headDown: 0.55, belly: 1, blink: blinkCurve(f + 9), tongue, wifi: 1}} />
      {ballK < 1 && <Ball p={ballP} s={1.4 * (1 - 0.8 * ballK)} />}
    </>
  );
};
/* a rede do gol e o juiz */
const S10b: React.FC<ShotProps> = ({f, a, t}) => {
  const net = 1 - easeInOut(ramp(f, REDE + 2, REDE + 16));
  return (
    <>
      <Cam pos={[0, 1.6, 9.2]} look={[0, 1.0, 13.5]} fov={52} f={f} a={a} />
      <StadiumLights />
      <Stadium />
      <Goal p={[0, 0, 15.5]} rotY={Math.PI} net={net} />
      {net > 0.05 && net < 0.98 && (
        <mesh position={[0.6, 0.7, lerp(14.5, 9.5, 1 - net)]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e2607a", 0.4)}>
          <cylinderGeometry args={[0.03, 0.03, 4, 8]} />
        </mesh>
      )}
    </>
  );
};
const S10c: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const cheer = f >= COMEMORA;
  return (
    <>
      <Cam pos={[0, 1.6, 4.0]} look={[0, 1.2, 0]} fov={50} f={f} a={a} />
      <StadiumLights />
      <Stadium />
      <Toy pose={{...idle(f), pos: [0, 0, 0.3], rotY: 0, rShoulder: f >= GOL10 - 6 ? [-2.7, 0, -0.4] : [-0.3, 0, -0.1], rElbow: -0.2, brow: -0.2, smile: 0, mouthOpen: f >= GOL10 && f < GOL10 + 30 ? 0.6 : 0}} look={JUIZ} headExtra={<Whistle />} palmRef={palm} />
      {cheer &&
        Array.from({length: 6}, (_, i) => (
          <Toy key={i} pose={{...idle(f + i * 5), ...ARMS_UP, pos: [-2.6 + i * 1.05, Math.abs(Math.sin(t * 8 + i)) * 0.25, -2.8], rotY: 0, mouthOpen: 0.7, eyeWide: 0.5}} look={CROWD_LOOKS[i]} />
        ))}
    </>
  );
};

/* =================== 4 — internet travada, semáforos e o avião no shopping =================== */
const FIGURINHAS = at(11, "figurinhas");
const BRASIL11 = at(11, "brasil");
const SEMAFOROS = at(11, "semaforos");
const E11 = at(11, "e", 1);
const POUSA = at(11, "pousa");
const SHOPPING = at(11, "shopping");
/** conversa do grupo da família no estilo WhatsApp (n = quantas figurinhas de formiga já chegaram) */
const drawAnt = (c: CanvasRenderingContext2D, ax: number, ay: number, k: number) => {
  c.save();
  c.translate(ax, ay);
  c.scale(k, k);
  c.fillStyle = "#3a1a10";
  c.strokeStyle = "#3a1a10";
  c.lineWidth = 3;
  for (let l = -1; l <= 1; l++) {
    c.beginPath();
    c.moveTo(l * 9, 0);
    c.lineTo(l * 15, 22);
    c.moveTo(l * 9, 0);
    c.lineTo(l * 15, -22);
    c.stroke();
  }
  [-22, 0, 20].forEach((dx, kk) => {
    c.beginPath();
    c.ellipse(dx, 0, kk === 1 ? 11 : 15, kk === 1 ? 10 : 13, 0, 0, Math.PI * 2);
    c.fill();
  });
  c.beginPath();
  c.moveTo(-30, -8);
  c.lineTo(-44, -26);
  c.moveTo(-30, 8);
  c.lineTo(-44, -14);
  c.stroke();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(-26, -4, 4, 0, Math.PI * 2);
  c.fill();
  c.restore();
};
const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};
const grupoTex = (n: number) =>
  canvasTex("whats-familia-" + n, 512, 992, (c) => {
    // papel de parede bege com rabiscos
    c.fillStyle = "#efe7dd";
    c.fillRect(0, 0, 512, 992);
    c.strokeStyle = "rgba(160,140,120,0.18)";
    c.lineWidth = 3;
    const r = rng(3);
    for (let i = 0; i < 60; i++) {
      const x = r() * 512, y = 120 + r() * 800;
      c.beginPath();
      c.arc(x, y, 8 + r() * 10, 0, Math.PI * (1 + r()));
      c.stroke();
    }
    // barra de cima
    c.fillStyle = "#075e54";
    c.fillRect(0, 0, 512, 110);
    c.fillStyle = "#ffffff";
    c.font = "bold 40px sans-serif";
    c.fillText("‹", 14, 70);
    c.fillStyle = "#ffd21f";
    c.beginPath();
    c.arc(76, 56, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#075e54";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.fillText("F", 76, 67);
    c.textAlign = "left";
    c.fillStyle = "#ffffff";
    c.font = "bold 32px sans-serif";
    c.fillText("Família", 120, 52);
    c.font = "22px sans-serif";
    c.fillStyle = "#cfe9e5";
    c.fillText(n > 0 ? "Formiga está digitando..." : "Vó, Pai, Tio, você", 120, 84);
    // mensagens
    type Msg = {who: string; col: string; text?: string; me?: boolean; audio?: boolean; ant?: boolean; time: string};
    const msgs: Msg[] = [
      {who: "Tio", col: "#e8414f", text: "Alguém com sinal?", time: "14:01"},
      {who: "Pai", col: "#2e86de", text: "O tamanduá saiu", time: "14:01"},
      {who: "Você", col: "", text: "Ele levou a vó", me: true, time: "14:02"},
      {who: "Vó", col: "#9b59b6", audio: true, time: "14:02"},
    ];
    for (let i = 0; i < n; i++) msgs.push({who: "Formiga", col: "#8a5a2b", ant: true, time: "14:03"});
    // as mensagens mais novas ficam embaixo: começa de baixo pra cima
    let y = 900;
    const out: {m: Msg; y: number; h: number}[] = [];
    for (let i = msgs.length - 1; i >= 0 && y > 120; i--) {
      const m = msgs[i];
      const h = m.ant ? 150 : m.audio ? 96 : m.me ? 70 : 96;
      y -= h + 14;
      out.push({m, y, h});
    }
    for (const {m, y: yy, h} of out) {
      if (yy < 116) continue;
      const w = m.ant ? 190 : m.audio ? 330 : Math.max(200, c.measureText(m.text ?? "").width + 60);
      const x = m.me ? 512 - w - 18 : 18;
      if (!m.ant) {
        c.fillStyle = m.me ? "#dcf8c6" : "#ffffff";
        roundRect(c, x, yy, w, h, 16);
        c.fill();
      }
      if (!m.me && !m.ant) {
        c.fillStyle = m.col;
        c.font = "bold 22px sans-serif";
        c.fillText(m.who, x + 16, yy + 30);
      }
      c.fillStyle = "#101018";
      c.font = "26px sans-serif";
      if (m.text) c.fillText(m.text, x + 16, yy + (m.me ? 44 : 70));
      if (m.audio) {
        c.fillStyle = "#34b7f1";
        c.beginPath();
        c.moveTo(x + 22, yy + 46);
        c.lineTo(x + 46, yy + 62);
        c.lineTo(x + 22, yy + 78);
        c.fill();
        c.fillStyle = "#7d8b8a";
        for (let b = 0; b < 26; b++) c.fillRect(x + 62 + b * 9, yy + 62 - (4 + ((b * 7) % 13)), 5, 2 * (4 + ((b * 7) % 13)));
        c.font = "18px sans-serif";
        c.fillText("0:42", x + 62, yy + 90);
      }
      if (m.ant) {
        c.fillStyle = "#ffffff";
        roundRect(c, x + 6, yy + 6, 150, 120, 20);
        c.fill();
        drawAnt(c, x + 84, yy + 66, 1.55);
      }
      c.fillStyle = "#7d8b8a";
      c.font = "18px sans-serif";
      c.fillText(m.time + (m.me ? "  ✓✓" : ""), x + w - (m.me ? 110 : 70), yy + h - 10);
      if (m.me) {
        c.fillStyle = "#34b7f1";
        c.fillText("✓✓", x + w - 50, yy + h - 10);
      }
    }
    // barra de digitar
    c.fillStyle = "#efe7dd";
    c.fillRect(0, 912, 512, 80);
    c.fillStyle = "#ffffff";
    roundRect(c, 12, 924, 400, 56, 28);
    c.fill();
    c.fillStyle = "#9aa3a2";
    c.font = "24px sans-serif";
    c.fillText("Mensagem", 40, 960);
    c.fillStyle = "#128c7e";
    c.beginPath();
    c.arc(462, 952, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffffff";
    c.fillRect(456, 936, 12, 22);
    c.fillRect(450, 960, 24, 4);
  });
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const n = f < FIGURINHAS - 4 ? 0 : 1 + Math.floor(clamp((f - FIGURINHAS - 6) / 60) * 9);
  const shake = f >= FIGURINHAS ? 0.03 * Math.sin(t * 60) : 0;
  return (
    <>
      <Cam pos={[0, 1.3, 2.0]} look={[0, 1.25, 0]} fov={44} f={f} a={a} />
      <color attach="background" args={["#ffd9a8"]} />
      <hemisphereLight args={["#ffffff", "#b08a60", 1.2]} />
      <pointLight position={[0.5, 2.5, 2]} intensity={6} distance={8} decay={1.4} />
      <BigPhone p={[shake, 1.25, 0]} r={[0, 0, shake * 2]} s={1.2} screen={grupoTex(n)} key2={"whats-" + n} />
    </>
  );
};
const TrafficLight: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    <mesh position={[0, 1.5, 0]} material={sm("#3a3f4a", 0.5)}>
      <cylinderGeometry args={[0.06, 0.07, 3, 10]} />
    </mesh>
    <mesh position={[0, 3.2, 0]} geometry={rbox(0.4, 1.0, 0.3, 0.05)} material={sm("#20222c", 0.4)} />
    {["#e8262d", "#ffd21f", "#2ecc71"].map((col, i) => {
      const on = Math.floor(t * 4) % 2 === 0 && i === 1;
      return (
        <mesh key={col} position={[0, 3.5 - i * 0.3, 0.16]} material={sm(col, 0.3, {emissive: col, emissiveIntensity: on ? 2.5 : 0.08})}>
          <circleGeometry args={[0.1, 16]} />
        </mesh>
      );
    })}
  </group>
);
const S11c: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PX + 1.5, 2.2, 5.5]} look={[PX + 1.5, 2.2, 0]} fov={54} f={f} a={a} />
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[PX, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={10} />
    <Town t={t} galo={false} variant="nova" flat clouds />
    {[-0.6, 1.5, 3.6].map((dx, i) => (
      <TrafficLight key={i} p={[PX + dx, 0, 1.8 - i * 0.2]} t={t + i * 0.13} />
    ))}
  </>
);
const S11d: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, POUSA - 4, SHOPPING + 4));
  return (
    <>
      <Cam pos={[0, 2.6, 9.5]} look={[0, 1.3, 0]} fov={56} f={f} a={a} />
      <FoodCourt />
      <hemisphereLight args={["#ffffff", "#b0a080", 1.1]} />
      <pointLight position={[0, 6, 4]} intensity={20} distance={20} decay={1.3} castShadow />
      <Airliner p={[lerp(-12, 0, k), lerp(4, 0.8, k), lerp(-2, 0.5, k)]} r={[lerp(0.25, 0, k), Math.PI / 2 - 0.35, lerp(-0.2, 0, k)]} s={1.3} />
      {f >= SHOPPING &&
        [[-3.6, 3], [3.4, 3.2], [-2.2, 4.5]].map(([x, z], i) => <Toy key={i} pose={{...idle(f + i * 9), pos: [x, 0, z], rotY: x < 0 ? 0.6 : -0.6, eyeWide: 1, mouthOpen: 0.6, brow: 1}} look={CROWD_LOOKS[i + 3]} />)}
    </>
  );
};

/* =================== 5 — o técnico do Japão =================== */
const DESLIGA = at(13, "desliga");
const LIGA = at(13, "liga");
const ShopLights: React.FC<{on: number}> = ({on}) => (
  <>
    <hemisphereLight args={["#ffffff", "#606878", 0.15 + 0.85 * on]} />
    <pointLight position={[0, 2.8, 1.5]} intensity={0.5 + 9 * on} distance={10} decay={1.4} castShadow shadow-mapSize={[1024, 1024]} />
  </>
);
const TechShop: React.FC = () => (
  <>
    <color attach="background" args={["#2a2f3a"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#cfd5de", 0.5)} receiveShadow>
      <planeGeometry args={[12, 12]} />
    </mesh>
    <mesh position={[0, 2, -1.6]} material={sm("#b8d8f0", 0.8)}>
      <planeGeometry args={[8, 4]} />
    </mesh>
    {[-1.6, -0.6, 0.6, 1.6].map((x, i) => (
      <group key={i} position={[x, 1.7, -1.5]}>
        <mesh geometry={rbox(0.7, 0.45, 0.06, 0.02)} material={sm("#1d1f27", 0.3)} />
        <mesh position={[0, 0, 0.035]} material={sm(["#3fb6ff", "#2ecc71", "#ffd21f", "#ff8a1f"][i], 0.3, {emissive: ["#3fb6ff", "#2ecc71", "#ffd21f", "#ff8a1f"][i], emissiveIntensity: 0.5})}>
          <planeGeometry args={[0.62, 0.38]} />
        </mesh>
      </group>
    ))}
    {/* balcão */}
    <mesh position={[0, 0.5, 0.2]} geometry={rbox(3.0, 1.0, 0.8, 0.05)} material={sm("#ffffff", 0.5)} castShadow receiveShadow />
  </>
);
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const on = f < DESLIGA + 2 ? 1 : f < LIGA + 2 ? 0 : 1;
  return (
    <>
      <Cam pos={[-0.15, 1.9, 4.8]} look={[-0.15, 1.2, 0]} fov={52} f={f} a={a} />
      <ShopLights on={on} />
      <TechShop />
      <Tamandua p={[0.45, 1.0, 0.2]} rotY={-0.5} s={0.62} c={{t, belly: 1, sleep: on ? 0 : 1, blink: blinkCurve(f + 9), wifi: on ? 1 : 0}} />
      <Toy pose={{...idle(f), pos: [-0.85, 0, -0.5], rotY: 0.4, brow: -0.2, rShoulder: f >= DESLIGA - 4 && f < LIGA + 10 ? [-1.5, 0.5, 0] : [-0.3, 0, -0.1], rElbow: -0.3}} look={TECNICO} headExtra={<HeadGlasses />} />
    </>
  );
};
const S14: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.7, 3.4]} look={[-0.2, 1.2, 0]} fov={50} f={f} a={a} />
    <ShopLights on={1} />
    <TechShop />
    <Tamandua p={[0.45, 1.0, 0.2]} rotY={-0.5} s={0.62} c={{t, belly: 1, blink: blinkCurve(f + 9), wifi: 1}} />
    <Toy pose={{...idle(f), pos: [-0.75, 0, -0.3], rotY: 0.2, rShoulder: [-1.4, 0, -0.3], rElbow: -1.5, rFist: 1, smile: 1}} look={TECNICO} headExtra={<HeadGlasses />} />
  </>
);

/* =================== 6 — 5G: Lua e Pantanal =================== */
const LUA15 = at(15, "lua");
const PANTANAL = at(15, "pantanal");
const CAPIVARA15 = at(15, "capivara");
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[PX, 6, 12]} look={[PX, 4, 0]} fov={58} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[PX, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Tamandua p={[PX, 0, 1.0]} rotY={0.3} s={1.3} c={{t, belly: 1, blink: blinkCurve(f + 9), wifi: 1}} />
      {[0, 1, 2, 3].map((i) => {
        const q = (k * 0.7 + i / 4) % 1;
        return (
          <mesh key={i} position={[PX, 3 + q * 6, 1]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1 + q * 8, 0.12, 6, 48]} />
            <meshStandardMaterial color="#3fb6ff" emissive="#3fb6ff" emissiveIntensity={1.2} transparent opacity={1 - q} />
          </mesh>
        );
      })}
    </>
  );
};
const S15b: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 1.75, 3.3]} look={[0, 1.45, 0.6]} fov={48} f={f} a={a} />
      <hemisphereLight args={["#dfe6ff", "#202030", 0.7]} />
      <directionalLight position={[6, 10, 6]} intensity={2.0} castShadow />
      <MoonSet t={t} />
      <Toy pose={{...idle(f), pos: [0, 0, 0.6], rotY: 0, rShoulder: [-1.1, 0.4, 0.1], rElbow: -1.2, brow: 0.8, mouthOpen: 0.4}} look={ASTRO} palmRef={palm} headExtra={<EvaHelmet open />} />
      <EvaGear pos={[0, 0, 0.6]} rotY={0} t={t} />
      <InHand palm={palm}>
        <BigPhone p={[0, 0.02, 0.12]} r={[0.3, 0, 0]} s={0.55} screen={grupoTex(10)} key2="whats-10" />
      </InHand>
    </>
  );
};
const S15c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={f >= CAPIVARA15 - 2 ? [1.5, 2.2, -4] : [0, 3.6, 8]} look={f >= CAPIVARA15 - 2 ? [0, 0.5, -10] : [0, 0.6, -4]} fov={54} f={f} a={f >= CAPIVARA15 - 2 ? CAPIVARA15 - 2 : a} />
      <hemisphereLight args={["#ffffff", "#5a8a3a", 1.0]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <Pantanal />
      {Array.from({length: 7}, (_, i) => (
        <Tamandua key={i} p={[(i % 2 ? 0.35 : -0.35), 0, -14 + i * 2.1 + k * 1.2]} rotY={0} s={0.8} c={{t: t + i * 0.3, walk: 1, sniff: 1, headDown: 0.3}} />
      ))}
      {f >= CAPIVARA15 - 2 && <Capivara p={[0, 0, -14 - 2.1 + k * 1.2]} s={1.0} t={t} walk={1} blink={blinkCurve(f)} />}
    </>
  );
};

/* =================== 7 — alergia, o espirro e tudo voando =================== */
const ESPIRRA = at(16, "espirra");
const ManyTams: React.FC<{t: number; f: number}> = ({t, f}) => (
  <>
    {Array.from({length: 9}, (_, i) => {
      const r = rng(i * 7 + 3);
      return <Tamandua key={i} p={[-3 + (i % 3) * 3 + (r() - 0.5), 0, -3 - Math.floor(i / 3) * 2.4]} rotY={(r() - 0.5) * 1.5} s={0.85} c={{t: t + i, sniff: 1, blink: blinkCurve(f + i * 11), headDown: 0.2}} />;
    })}
  </>
);
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const pre = clamp((f - (ESPIRRA - 26)) / 26);
  const sneeze = f >= ESPIRRA ? Math.max(0, 1 - (f - ESPIRRA) / 10) : pre * 0.8;
  const close = f >= ESPIRRA - 26;
  return (
    <>
      <Cam pos={close ? [2.8, 1.5, 2.6] : [0, 3.2, 7]} look={close ? [0.35, 0.95, 0.1] : [0, 0.8, -2.5]} fov={close ? 46 : 56} f={f} a={close ? ESPIRRA - 26 : a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#86d260", 0.95)} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
      {!close && <ManyTams t={t} f={f} />}
      <Tamandua p={[0, 0, -0.6]} rotY={0} c={{t, belly: 1, sniff: 1, sneeze, blink: f >= ESPIRRA && f < ESPIRRA + 6 ? 1 : blinkCurve(f + 9)}} />
    </>
  );
};
/* tudo voando pro céu */
const FLY_KINDS: Item["kind"][] = ["sock", "dever", "game", "fish", "wifi"];
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 2.0, 7]} look={[0, 3.5, 0]} fov={60} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#86d260", 0.95)} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
      <Tamandua p={[0, 0, -0.6]} rotY={0} c={{t, belly: 0, sneeze: Math.max(0, 1 - k * 2), blink: blinkCurve(f + 9)}} />
      {FLY_KINDS.map((kind, i) => {
        const ang = -0.9 + i * 0.45;
        const d = k * 4;
        return (
          <group key={kind} position={[Math.sin(ang) * d, 1.2 + d * 1.6, 0.5]} rotation={[k * 3 + i, k * 4, 0]} scale={1.4}>
            <ItemMesh kind={kind} t={t} f={f} />
          </group>
        );
      })}
      <group position={[1.2 * k, 1.4 + k * 3.0, 0.2]} rotation={[0, 0, k * 2]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, ...ARMS_UP, mouthOpen: 0.7, eyeWide: 1}} look={VIZ} headExtra={<ShowerCap />} />
      </group>
      <group position={[-1.3 * k, 1.3 + k * 2.6, 0.2]} rotation={[0, 0, -k * 1.5]} scale={0.9}>
        <ItemMesh kind="vo" t={t} f={f} />
      </group>
    </>
  );
};
/* montagem pelo mundo */
const TORRE = at(18, "torre");
const EGITO = at(18, "egito");
const ANTARTIDA = at(18, "antartida");
const PEIXINHO18 = at(18, "peixinho");
const VIZINHO18 = at(18, "vizinho");
const MUMIA18 = at(18, "mumia");
/** prédios de Paris (pedra creme, telhado de ardósia, varandinhas) e cafés */
const PARIS_B: {x: number; z: number; w: number; h: number; ry: number}[] = [
  {x: -4.6, z: -1.0, w: 3.0, h: 4.4, ry: Math.PI / 2},
  {x: -4.6, z: -4.4, w: 3.4, h: 5.0, ry: Math.PI / 2},
  {x: -4.6, z: 2.4, w: 3.0, h: 4.0, ry: Math.PI / 2},
  {x: 4.6, z: -1.0, w: 3.0, h: 4.8, ry: -Math.PI / 2},
  {x: 4.6, z: -4.4, w: 3.4, h: 4.4, ry: -Math.PI / 2},
  {x: 4.6, z: 2.4, w: 3.0, h: 4.2, ry: -Math.PI / 2},
  {x: -6.5, z: -9.5, w: 4.0, h: 5.2, ry: 0},
  {x: -2.2, z: -10, w: 4.0, h: 4.6, ry: 0},
  {x: 2.2, z: -10, w: 4.0, h: 5.0, ry: 0},
  {x: 6.5, z: -9.5, w: 4.0, h: 4.6, ry: 0},
];
const ParisBuilding: React.FC<{w: number; h: number}> = ({w, h}) => {
  const stone = sm("#efe2c8", 0.85);
  const roof = sm("#6f7a86", 0.6);
  const win = sm("#3a4a5a", 0.3);
  const iron = sm("#1d1f27", 0.5);
  const cols = Math.max(2, Math.floor(w / 0.8));
  const rows = Math.max(3, Math.floor((h - 1.3) / 0.85));
  return (
    <group>
      <mesh position={[0, h / 2, 0]} geometry={rbox(w, h, 2.4, 0.03)} material={stone} castShadow receiveShadow />
      {/* telhado mansarda */}
      <mesh position={[0, h + 0.35, -0.1]} rotation={[0, Math.PI / 4, 0]} scale={[w / 1.9, 1, 2.2 / 1.9]} material={roof} castShadow>
        <cylinderGeometry args={[0.9, 1.34, 0.7, 4, 1]} />
      </mesh>
      {Array.from({length: cols}, (_, i) => (
        <mesh key={"lu" + i} position={[-w / 2 + (i + 0.5) * (w / cols), h + 0.3, 0.95]} geometry={rbox(0.26, 0.32, 0.2, 0.03)} material={stone} />
      ))}
      {/* janelas com varandinha de ferro */}
      {Array.from({length: rows}, (_, r) =>
        Array.from({length: cols}, (_, c) => {
          const x = -w / 2 + (c + 0.5) * (w / cols);
          const y = 1.4 + r * 0.85;
          return (
            <group key={`${r}-${c}`} position={[x, y, 1.21]}>
              <mesh material={win}>
                <planeGeometry args={[0.36, 0.55]} />
              </mesh>
              <mesh position={[0, -0.27, 0.06]} material={iron}>
                <boxGeometry args={[0.46, 0.05, 0.12]} />
              </mesh>
              <mesh position={[0, -0.18, 0.12]} material={iron}>
                <boxGeometry args={[0.46, 0.16, 0.01]} />
              </mesh>
            </group>
          );
        }),
      )}
      {/* térreo: café de toldo vermelho */}
      <mesh position={[0, 0.55, 1.21]} material={sm("#5a3a2a", 0.6)}>
        <planeGeometry args={[w * 0.8, 0.9]} />
      </mesh>
      <mesh position={[0, 1.12, 1.45]} rotation={[0.45, 0, 0]} geometry={rbox(w * 0.85, 0.04, 0.6, 0.01)} material={sm("#c0392b", 0.7)} castShadow />
    </group>
  );
};
const ParisStreet: React.FC = () => (
  <group>
    {/* calçadão de pedra e a grama do Champ de Mars */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={sm("#d9cfbd", 0.95)} receiveShadow>
      <planeGeometry args={[7.2, 40]} />
    </mesh>
    {PARIS_B.map((b, i) => (
      <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.ry, 0]}>
        <ParisBuilding w={b.w} h={b.h} />
      </group>
    ))}
    {/* postes e árvores */}
    {[-2.8, 2.8].map((x) =>
      [-6, -2, 2, 6].map((z) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} material={sm("#3a5a3a", 0.8)}>
            <cylinderGeometry args={[0.07, 0.09, 1.8, 6]} />
          </mesh>
          <mesh position={[0, 2.2, 0]} scale={[1, 1.2, 1]} material={sm("#4f9a3a", 0.85)}>
            <icosahedronGeometry args={[0.7, 0]} />
          </mesh>
        </group>
      )),
    )}
  </group>
);
const SParis: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a, a + 18));
  return (
    <>
      <Cam pos={[0, 3.0, 10.5]} look={[0, 3.2, 0]} fov={56} f={f} a={a} />
      <color attach="background" args={["#9fd8ff"]} />
      <hemisphereLight args={["#ffffff", "#7a9a5a", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8ccf5a", 0.95)}>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <ParisStreet />
      <EiffelTower p={[0, 0, 0]} />
      <Sock p={[0.45, lerp(9, 3.9, k), 0.6]} r={[0, 0, 0.2]} s={5} color="#ffffff" />
      <Sock p={[-0.45, lerp(10, 3.5, k), 0.7]} r={[0, 0.5, -0.2]} s={5} color="#ffd21f" />
    </>
  );
};
const SEgito: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 1.6, 4.4]} look={[0, 1.2, 0]} fov={52} f={f} a={a} />
      <Desert />
      <hemisphereLight args={["#fff2d8", "#c9a46a", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <Pyramid p={[-3, 0, -8]} s={1.6} />
      <Pyramid p={[3.5, 0, -10]} s={1.2} />
      <Toy pose={{...idle(f), pos: [0, 0, 0.3], rotY: 0, rShoulder: [-1.2, 0.5, 0.2], rElbow: -1.0, head: [0.35, 0, 0], brow: -0.4}} look={MUMIA} headExtra={<MummyWrap />} palmRef={palm} />
      <Homework p={[0.15, 1.0, 0.75]} r={[-0.9, 0, 0]} s={2.2} />
      <InHand palm={palm}>
        <mesh position={[0, -0.03, 0.05]} rotation={[0.6, 0, 0]} material={sm("#ffd21f", 0.5)}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
        </mesh>
      </InHand>
    </>
  );
};
const SAntartida: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.0, 3.2]} look={[0, 0.5, 0]} fov={48} f={f} a={a} />
    <Snow />
    <hemisphereLight args={["#ffffff", "#9ab7c9", 1.2]} />
    <directionalLight position={[4, 8, 6]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
    <GameConsole p={[0.35, 0.06, 0.5]} r={[0, -0.3, 0]} s={1.6} />
    <Penguin p={[-0.45, 0, 0]} rotY={0.5} t={t} blink={blinkCurve(f + 5)} s={1.0} />
  </>
);
const SMar: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 1.2, 3.2]} look={[0, 0.2, 0]} fov={48} f={f} a={a} />
      <OpenSea t={t} />
      <hemisphereLight args={["#ffffff", "#2e86de", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.0} />
      <group position={[0.4 * Math.sin(k * 2), 0.15 + 0.12 * Math.abs(Math.sin(k * 3)), 0.5]} rotation={[0, Math.PI / 2 + 0.3 * Math.sin(k * 2), 0.2 * Math.sin(k * 3)]} scale={5}>
        <mesh scale={[0.06, 0.04, 0.02]} material={sm("#ff8a1f", 0.4)}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
        <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#ff8a1f", 0.4)}>
          <coneGeometry args={[0.03, 0.04, 8]} />
        </mesh>
      </group>
    </>
  );
};
const SCama: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a, a + 14));
  return (
    <>
      <Cam pos={[-0.9, 2.2, 2.9]} look={[-1.5, 0.7, -1.3]} fov={54} f={f} a={a} />
      <RoomLights />
      <Room roof={0} door={0} rug={0} />
      <group position={[-2.0, lerp(4, 0.72, k), -0.7]} rotation={[-Math.PI / 2 * k, 0, 0]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, eyeWide: 0.5, smile: 0.5, rShoulder: [-1.4, 0, -0.3], rElbow: -1.5}} look={VIZ} headExtra={<ShowerCap />} />
      </group>
      <Toy pose={{...idle(f), pos: [-0.8, 0, -0.5], rotY: -0.6, eyeWide: 1, mouthOpen: 0.6, brow: 1}} look={BOYL} />
    </>
  );
};
/* a vó de paraquedas */
const SPA = at(19, "melhor");
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const y = lerp(3.5, 0.2, easeOut(ramp(f, a, SPA - 10)));
  return (
    <>
      <Cam pos={[0, 2.4, 6.5]} look={[0, 2.2, 0]} fov={52} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#86d260", 0.95)}>
        <planeGeometry args={[60, 60]} />
      </mesh>
      <group position={[0, y, 0]}>
        <Parachute p={[0, 1.0, 0]} t={t} s={1.4} />
        <group rotation={[0, 0, 0.05 * Math.sin(t * 1.5)]}>
          <RockingChair p={[0, 0, 0]} t={t} />
          <Toy pose={{...idle(f), ...SIT, pos: [0, 0.1, -0.02], rotY: 0, smile: 1, mouthOpen: f >= SPA ? 0.4 + 0.2 * Math.sin(t * 9) : 0}} look={VO} headExtra={<><HeadGlasses />{[-1, 1].map((sd) => <mesh key={sd} position={[0.11 * sd, -0.03, 0.31]} rotation={[Math.PI / 2, 0, 0]} material={sm("#8fd16a", 0.6)}><cylinderGeometry args={[0.06, 0.06, 0.015, 16]} /></mesh>)}</>} />
        </group>
      </group>
    </>
  );
};

/* =================== 8 — Parabéns e o final =================== */
const PB = L(21);
const MIL21 = at(21, "mil");
const S21: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.4, 4.6]} look={[0, 0.8, -0.6]} fov={58} f={f} a={a} />
    <RoomLights />
    <Room roof={0} door={0} rug={0} />
    {[[-1.9, -0.2, 0.6], [1.9, -0.4, -0.7], [-0.9, 1.4, 0.3], [1.2, 1.3, -0.3], [0.5, -1.6, 2.6], [-1.2, -1.9, 1.2], [2.2, 1.6, -1.2]].map(([x, z, r], i) => (
      <Tamandua key={i} p={[x, 0, z]} rotY={r} s={0.75} c={{t: t + i, blink: blinkCurve(f + i * 11), sniff: 0.5}} />
    ))}
    <Toy pose={{...idle(f), ...ARMS_UP, pos: [0, 0, 0.3], rotY: 0, smile: 1, mouthOpen: 0.4}} look={BOYL} />
    <Capivara p={[-2.0, 0.62, -1.3]} rotY={0.5} s={0.6} t={t} blink={blinkCurve(f + 4)} />
  </>
);
const S22: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeInOut(ramp(f, a + 10, a + 60));
  const back = easeInOut(ramp(f, a + 62, a + 80));
  const reach = k * (1 - back);
  const rp: V3 = [0.3, 1.25, -2.0];
  const TP: V3 = [0, 0.75, RZ0 - 1.55];
  const tl = tamTip(0, 0);
  const tipW: V3 = [TP[0] + tl[0], TP[1] + tl[1], TP[2] + tl[2]];
  const end: V3 = [lerp(tipW[0], rp[0], reach), lerp(tipW[1], rp[1], reach), lerp(tipW[2], rp[2], reach)];
  return (
    <>
      <Cam pos={[0.2, 1.7, 1.8]} look={[0, 1.4, RZ0]} fov={52} f={f} a={a} />
      <hemisphereLight args={["#6a7ab8", "#201a30", 0.8]} />
      <pointLight position={[0.5, 1.8, -1.0]} intensity={4} distance={4} decay={1.6} color="#ffd9a0" />
      <Room night roof={1} door={1} />
      <Tamandua p={TP} rotY={0} c={{t, sniff: 1, blink: blinkCurve(f + 9)}} />
      <pointLight position={[0, 1.6, RZ0 - 0.4]} intensity={2.5} distance={2.5} decay={1.5} color="#c8d4ff" />
      <mesh position={[0.3, 1.0, -2.25]} geometry={rbox(0.7, 0.06, 0.45, 0.02)} material={sm("#8a5a2b", 0.6)} />
      {reach < 0.98 || back < 0.02 ? (
        <group position={back > 0 ? [lerp(rp[0], tipW[0], back), lerp(rp[1], tipW[1], back), lerp(rp[2], tipW[2], back)] : rp}>
          <Router t={t} />
        </group>
      ) : null}
      {f > a + 10 && (
        <mesh position={[(tipW[0] + end[0]) / 2, (tipW[1] + end[1]) / 2, (tipW[2] + end[2]) / 2]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(end[0] - tipW[0], end[1] - tipW[1], end[2] - tipW[2]).normalize())} material={sm("#e2607a", 0.4)}>
          <cylinderGeometry args={[0.03, 0.03, Math.max(0.01, Math.hypot(end[0] - tipW[0], end[1] - tipW[1], end[2] - tipW[2])), 10]} />
        </mesh>
      )}
    </>
  );
};

/* ---------- tela "vazia" (atrás dos mapas) ---------- */
const Blank: React.FC<ShotProps> = ({f, a}) => (
  <>
    <Cam pos={[0, 1, 3]} look={[0, 1, 0]} fov={50} f={f} a={a} />
    <color attach="background" args={["#7fc8ff"]} />
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0, Comp: S0b},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: Blank},
  {from: MARACANA - 2, Comp: S9},
  {from: L(10), Comp: S10},
  {from: REDE - 2, Comp: S10b},
  {from: JUIZ10 - 2, Comp: S10c},
  {from: L(11), Comp: S11},
  {from: BRASIL11 - 2, Comp: Blank},
  {from: SEMAFOROS - 2, Comp: S11c},
  {from: E11 - 2, Comp: S11d},
  {from: L(12), Comp: Blank},
  {from: L(13), Comp: Blank},
  {from: DESLIGA - 10, Comp: S13},
  {from: L(14), Comp: S14},
  {from: L(15), Comp: S15},
  {from: LUA15 - 2, Comp: S15b},
  {from: PANTANAL - 2, Comp: S15c},
  {from: L(16), Comp: S16},
  {from: L(17), Comp: S17},
  {from: L(18), Comp: SParis},
  {from: EGITO - 2, Comp: SEgito},
  {from: ANTARTIDA - 2, Comp: SAntartida},
  {from: PEIXINHO18 - 2, Comp: SMar},
  {from: VIZINHO18 - 4, Comp: SCama},
  {from: L(19), Comp: S19},
  {from: L(20), Comp: Blank},
  {from: PB, Comp: S21},
  {from: L(22), Comp: S22},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_TAMANDUA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["quarto", "bagunca", "eco", "aspirador", "tamandua", "meias", "dever", "videogame", "vo", "peixinho", "aquario", "wifi", "silvestre", "tapete", "porta", "telhado", "vizinho", "banho", "internet", "barriga", "senha", "podcast", "familia", "sinal", "futebol", "live", "cachorro", "videochamada", "namorada", "fome", "janela", "formiga", "trezentas", "noiva", "goleiro", "penalti", "piloto", "aviao", "caminhao", "mudanca", "migracao", "digital", "formigueiro", "maracana", "final", "cinco", "mil", "formigas", "bola", "rede", "gol", "juiz", "estadio", "figurinhas", "brasil", "trava", "semaforos", "shopping", "infestacao", "virtual", "tecnico", "japao", "planeta", "desliga", "liga", "manutencao", "zoologica", "ge", "lua", "astronauta", "pantanal", "tamanduas", "capivara", "alergia", "espirra", "tudo", "mundo", "torre", "eiffel", "egito", "mumia", "antartida", "pinguim", "mar", "feliz", "cama", "roupao", "paraquedas", "spa", "espirro", "intercontinental", "parabens", "franca", "arrumado", "seguir", "perfil", "noite"]);
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
/** balão de fala */
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; size?: number; audio?: boolean}> = ({from, to, text, x, y, size = 50, audio = false}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: audio ? "#dcf8c6" : "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: size, padding: "18px 30px", borderRadius: 34, border: "6px solid #101018", whiteSpace: "nowrap", textAlign: "center", display: "flex", alignItems: "center", gap: 16}}>
      {audio && <span style={{fontSize: size * 0.9}}>▶ 〰〰</span>}
      {text}
      <div style={{position: "absolute", left: "45%", bottom: -34, width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "34px solid #101018"}} />
    </div>
  );
};
const Live: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 8) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: 420, transform: `translate(-50%,-50%) scale(${s})`, background: "#e8262d", color: "#ffffff", fontFamily, fontWeight: 900, fontSize: 52, padding: "10px 26px", borderRadius: 14, whiteSpace: "nowrap"}}>
      ● AO VIVO · PODCAST DA BARRIGA
    </div>
  );
};
/** mapa do Brasil (alfinete no Rio / tudo cinza travado) */
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const projBR = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapBR: React.FC<{from: number; to: number; mode: "rio" | "trava" | "pantanal"}> = ({from, to, mode}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const grey = mode === "trava" ? clamp((f - from) / 20) : 0;
  const pin = mode === "rio" ? projBR(-43.2, -22.9) : projBR(-56.5, -17.5);
  const drop = backOut(ramp(f, from + 3, from + 12));
  const fill = `rgb(${Math.round(lerp(255, 150, grey))},${Math.round(lerp(195, 150, grey))},${Math.round(lerp(90, 150, grey))})`;
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill={fill} stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
        {mode !== "trava" && (
          <g transform={`translate(${pin[0]},${pin[1] - 200 * (1 - drop)})`}>
            <path d="M 0 0 C -26 -36, -30 -70, 0 -78 C 30 -70, 26 -36, 0 0 Z" fill="#e8262d" stroke="#101018" strokeWidth={6} />
            <circle cy={-54} r={11} fill="#ffffff" />
          </g>
        )}
      </svg>
      {mode !== "trava" && <div style={{position: "absolute", left: pin[0], top: pin[1] - 150, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 40, padding: "4px 16px"}}>{mode === "rio" ? "MARACANÃ" : "PANTANAL"}</div>}
      {mode === "trava" && <div style={{position: "absolute", left: 540, top: 700, transform: `translate(-50%,-50%) rotate(${(f - from) * 6}deg)`, fontSize: 200}}>⏳</div>}
    </AbsoluteFill>
  );
};
/** mapa-múndi simplificado */
const CONTS: [number, number][][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-60, 55], [-55, 48], [-70, 43], [-76, 35], [-81, 25], [-97, 26], [-105, 20], [-90, 15], [-83, 9], [-78, 8], [-92, 15], [-105, 22], [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -35], [-65, -42], [-68, -52], [-72, -50], [-74, -40], [-71, -30], [-70, -18], [-76, -12], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [14, 67], [25, 71], [40, 68], [45, 55], [40, 45], [28, 41], [22, 38], [15, 40], [12, 44], [5, 43], [0, 38]],
  [[-17, 15], [-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [42, 0], [40, -15], [35, -25], [20, -35], [15, -28], [12, -15], [9, -1], [8, 4], [-8, 4], [-13, 8]],
  [[40, 45], [45, 55], [40, 68], [60, 70], [80, 73], [110, 77], [140, 72], [170, 68], [180, 65], [160, 58], [140, 52], [135, 43], [128, 35], [121, 30], [120, 22], [108, 20], [105, 10], [100, 13], [98, 8], [100, 2], [95, 15], [90, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 27], [48, 30], [35, 32], [35, 37]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 44], [145, 44], [141, 38], [136, 33]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [140, -38], [131, -32], [115, -34]],
  [[-180, -68], [-120, -72], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -68], [180, -80], [-180, -80]],
];
const projW = (lon: number, lat: number): [number, number] => [540 + lon * 2.85, 760 - lat * 3.3];
const PLACES: Record<string, [number, number, string]> = {
  casa: [-43.2, -22.9, "🏠"],
  japao: [139.7, 35.7, "🇯🇵"],
  paris: [2.35, 48.85, "🧦"],
  egito: [31.2, 30.0, "📄"],
  antartida: [10, -72, "🎮"],
  mar: [-25, -10, "🐟"],
};
const WorldMap: React.FC<{from: number; to: number; mode: "japao" | "tudo"}> = ({from, to, mode}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const J = projW(139.7, 35.7), B = projW(-43.2, -22.9);
  const pk = easeInOut(clamp((f - from - 30) / (to - from - 40)));
  const cx = (J[0] + B[0]) / 2, cy = Math.min(J[1], B[1]) - 220;
  const plx = (1 - pk) * (1 - pk) * J[0] + 2 * (1 - pk) * pk * cx + pk * pk * B[0];
  const ply = (1 - pk) * (1 - pk) * J[1] + 2 * (1 - pk) * pk * cy + pk * pk * B[1];
  const pins = mode === "japao" ? ["japao", "casa"] : ["casa", "paris", "egito", "antartida", "mar"];
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        {CONTS.map((pts, i) => (
          <path key={i} d={pts.map(([lo, la], k) => `${k ? "L" : "M"} ${projW(lo, la)[0].toFixed(0)} ${projW(lo, la)[1].toFixed(0)}`).join(" ") + " Z"} fill={i === 7 ? "#f4f8fc" : "#ffc35a"} stroke="#c9822a" strokeWidth={4} strokeLinejoin="round" />
        ))}
        {mode === "japao" && <path d={`M ${J[0]} ${J[1]} Q ${cx} ${cy} ${B[0]} ${B[1]}`} fill="none" stroke="#ffffff" strokeWidth={6} strokeDasharray="14 12" />}
        {mode === "tudo" &&
          pins.slice(1).map((k) => {
            const P = projW(PLACES[k][0], PLACES[k][1]);
            return <path key={k} d={`M ${B[0]} ${B[1]} Q ${(P[0] + B[0]) / 2} ${Math.min(P[1], B[1]) - 160} ${P[0]} ${P[1]}`} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="12 10" />;
          })}
      </svg>
      {pins.map((k, i) => {
        const P = projW(PLACES[k][0], PLACES[k][1]);
        const s = pop(f, from + 4 + i * 5, 10);
        return (
          <div key={k} style={{position: "absolute", left: P[0], top: P[1], transform: `translate(-50%,-100%) scale(${s})`, fontSize: 70}}>
            {PLACES[k][2]}
          </div>
        );
      })}
      {mode === "japao" && <div style={{position: "absolute", left: plx, top: ply, transform: `translate(-50%,-50%) rotate(${200 + 40 * (pk - 0.5)}deg)`, fontSize: 100}}>✈️</div>}
    </AbsoluteFill>
  );
};
const FastFwd: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 800, top: 1040, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(900,1000)">
          <circle r={70} fill="#ffffff" stroke="#101018" strokeWidth={10} />
          <line x1={0} y1={0} x2={46 * Math.sin(a)} y2={-46 * Math.cos(a)} stroke="#101018" strokeWidth={9} strokeLinecap="round" />
          <line x1={0} y1={0} x2={30 * Math.sin(a / 12)} y2={-30 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={10} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};
const Blackout: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return <AbsoluteFill style={{background: "#000", opacity: 0.55}} />;
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
const FOLLOW_FROM = L(22) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const TITLES: [number, string[]][] = [
  [L(2), ["ASPIRADOR", "SILVESTRE"]],
  [L(8), ["MIGRAÇÃO", "DIGITAL"]],
  [L(12), ["INFESTAÇÃO", "VIRTUAL"]],
  [L(14), ["MANUTENÇÃO", "ZOOLÓGICA"]],
  [L(20), ["ESPIRRO", "INTERCONTINENTAL"]],
];
export const VideoTamandua: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapBR from={L(9)} to={MARACANA - 3} mode="rio" />
      <MapBR from={BRASIL11 - 2} to={SEMAFOROS - 3} mode="trava" />
      <MapBR from={L(12)} to={L(13) - 1} mode="trava" />
      <WorldMap from={L(13)} to={DESLIGA - 11} mode="japao" />
      <FastFwd from={at(13, "atravessa")} to={DESLIGA - 12} />
      <WorldMap from={L(20)} to={PB - 1} mode="tudo" />
      <Blackout from={DESLIGA + 2} to={LIGA + 1} />

      {TITLES.map(([x, lines], i) => {
        const next = [L(3), L(9), L(13), L(15), L(21)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      {/* 1 */}
      <Ono from={4} to={ECO - 2} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Ono from={ECO + 2} to={ENTAO0 - 2} text="OI… oi… oi…" x={540} y={300} size={110} color="#ffffff" rot={-4} />
      <Tag from={at(0, "bagunca") - 2} to={ECO - 2} text="BAGUNÇA" x={540} y={420} />
      <Tag from={TAMANDUA0 - 2} to={L(1) - 2} text="TAMANDUÁ" x={540} y={420} />
      {ITEMS.map((item, i) => (
        <Ono key={i} from={item.w} to={item.w + 14} text="SLURP!" x={[380, 700, 420, 680, 400, 660][i]} y={[420, 470, 520, 420, 480, 440][i]} size={110} color="#ff8fab" rot={i % 2 ? 6 : -6} />
      ))}
      <Tag from={at(1, "vo") - 2} to={at(1, "peixinho") - 4} text="VÓ" x={540} y={620} />
      <Tag from={at(1, "wifi") - 2} to={L(2) - 2} text="WI-FI" x={540} y={620} />
      {[TAPETE, PORTA, TELHADO, VIZINHO3].map((w, i) => (
        <Ono key={"s" + i} from={w + 2} to={w + 16} text="SLURP!" x={[400, 680, 420, 660][i]} y={[460, 420, 400, 460][i]} size={110} color="#ff8fab" rot={i % 2 ? 6 : -6} />
      ))}
      <Tag from={VIZINHO3 + 4} to={L(4) - 2} text="VIZINHO" x={540} y={620} />
      <Tag from={SENHA - 2} to={at(4, "e", 0) - 2} text="SENHA: TAMANDUÁ" x={540} y={420} />
      <Bubble from={at(4, "e", 0)} to={PODCAST - 2} text="TÁ ESCURO, MAS O SINAL TÁ ÓTIMO" x={540} y={330} size={42} audio />
      <Live from={PODCAST - 2} to={L(5) - 2} />
      <Tag from={at(5, "sinal") - 2} to={L(6) - 2} text="SINAL CHEIO" x={540} y={420} />
      <Tag from={PULA + 16} to={L(7) - 2} text="SEM SINAL" x={540} y={420} />
      {/* 2 */}
      <BigNum from={L(7)} to={NOIVA7 - 4} text="300" y={420} size={170} />
      <Tag from={NOIVA7 - 2} to={GOLEIRO7 - 3} text="NOIVA" x={540} y={420} />
      <Tag from={GOLEIRO7 - 2} to={PILOTO7 - 3} text="GOLEIRO" x={540} y={420} />
      <Tag from={PILOTO7 - 2} to={CAMINHAO7 - 3} text="PILOTO" x={540} y={420} />
      <Tag from={CAMINHAO7 - 2} to={L(8) - 2} text="MUDANÇAS" x={540} y={420} />
      {/* 3 */}
      <Tag from={at(9, "final") - 2} to={L(10) - 2} text="FINAL" x={540} y={420} />
      <BigNum from={at(10, "cinco")} to={BOLA - 3} text="5.000" y={420} size={170} />
      <Ono from={BOLA + 2} to={REDE - 3} text="NHAC!" x={540} y={460} size={150} color="#ff8fab" />
      <Bubble from={GOL10 - 2} to={COMEMORA - 3} text="GOL DO TAMANDUÁ!" x={540} y={560} size={56} />
      <Ono from={COMEMORA} to={L(11) - 2} text="UHUUUU!" x={540} y={420} size={140} color="#ffd21f" />
      {/* 4 */}
      <Ono from={FIGURINHAS} to={BRASIL11 - 4} text="PLIM PLIM PLIM!" x={540} y={1120} size={90} color="#2ecc71" />
      <Tag from={SEMAFOROS - 2} to={E11 - 3} text="SEMÁFOROS" x={540} y={420} />
      <Tag from={SHOPPING - 2} to={L(12) - 2} text="SHOPPING" x={540} y={420} />
      {/* 5 */}
      <Ono from={DESLIGA + 2} to={LIGA - 2} text="ZZZ…" x={540} y={420} size={140} color="#ffffff" />
      <Ono from={LIGA + 2} to={L(14) - 2} text="PLIM!" x={540} y={420} size={150} color="#2ecc71" />
      {/* 6 */}
      <BigNum from={at(15, "cinco")} to={LUA15 - 3} text="5G" y={420} size={200} />
      <Bubble from={at(15, "astronauta") + 6} to={PANTANAL - 3} text="PARA COM AS FORMIGAS!" x={540} y={420} size={46} />
      <MapBR from={PANTANAL - 2} to={at(15, "mil") - 3} mode="pantanal" />
      <BigNum from={at(15, "mil")} to={CAPIVARA15 - 3} text="1.000" y={420} size={170} />
      <Tag from={CAPIVARA15 - 2} to={L(16) - 2} text="CAPIVARA" x={540} y={420} />
      {/* 7 */}
      <Ono from={ESPIRRA - 26} to={ESPIRRA - 1} text="AAA…" x={540} y={420} size={140} color="#ffffff" />
      <Ono from={ESPIRRA} to={L(17) + 20} text="ATCHIM!!!" x={540} y={420} size={160} color="#ffd21f" />
      <Tag from={at(17, "tudo") - 2} to={L(18) - 2} text="TUDO" x={540} y={1100} />
      <Tag from={TORRE - 2} to={EGITO - 4} text="FRANÇA" x={540} y={420} />
      <Tag from={EGITO - 2} to={ANTARTIDA - 4} text="EGITO" x={540} y={420} />
      <Tag from={ANTARTIDA - 2} to={PEIXINHO18 - 4} text="ANTÁRTIDA" x={540} y={420} />
      <Ono from={PEIXINHO18 + 4} to={VIZINHO18 - 6} text="TCHIBUM!" x={540} y={420} size={140} color="#3fb6ff" />
      <Tag from={VIZINHO18 - 2} to={L(19) - 2} text="DE ROUPÃO" x={540} y={420} />
      <Bubble from={SPA - 2} to={L(20) - 2} text="MELHOR SPA DA MINHA VIDA." x={540} y={420} size={44} />
      {/* 8 */}
      <Confetti from={PB} to={PB + 120} />
      <Ono from={PB} to={at(21, "voce") - 2} text="PARABÉNS!" x={540} y={380} size={130} color="#ff4d6d" rot={-4} />
      <BigNum from={MIL21} to={L(22) - 3} text="1.000 + 1" y={420} size={140} />
      <Sticker from={at(21, "vizinho")} to={MIL21 - 3} x={190} y={430} rot={-6} label="VIZINHO NOVO">
        <g transform="translate(152,105)">
          <circle r={50} fill="#f1c08f" />
          <ellipse cy={-30} rx={56} ry={30} fill="#ff8fab" />
          <circle cx={-16} cy={0} r={6} fill="#101018" />
          <circle cx={16} cy={0} r={6} fill="#101018" />
        </g>
      </Sticker>
      <Sticker from={at(21, "aviao")} to={MIL21 - 3} x={540} y={400} rot={4} label="AVIÃO NO SHOPPING">
        <g transform="translate(152,105)">
          <text x={0} y={30} textAnchor="middle" fontSize={110}>✈️</text>
        </g>
      </Sticker>
      <Sticker from={at(21, "franca")} to={MIL21 - 3} x={890} y={430} rot={6} label="MEIAS NA FRANÇA">
        <g transform="translate(152,105)">
          <text x={0} y={30} textAnchor="middle" fontSize={100}>🧦</text>
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_TAMANDUA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("voztamandua.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"b" + x} src="sfx7/boing.mp3" from={x + 3} dur={32} v={FXV * 0.7} />
      ))}
      {[...ITEMS.map((i) => i.w), TAPETE, PORTA, TELHADO, VIZINHO3].map((w, i) => (
        <SND key={"sl" + i} src="sfx10/bubble.mp3" from={w + 2} dur={20} v={FXV * 0.45} />
      ))}
      <SND src="sfx8/sniff.mp3" from={ENTAO0 + 6} dur={TAMANDUA0 - ENTAO0} v={FXV * 0.35} />
      <SND src="sfx10/plim.mp3" from={L(4) + 4} dur={25} v={FXV * 0.4} />
      <SND src="sfx3/swing.mp3" from={PULA} dur={30} v={FXV * 0.35} />
      <SND src="sfx2/steps.mp3" from={L(7)} dur={L(9) - L(7)} v={FXV * 0.25} />
      <SND src="sfx14/buzina.mp3" from={CAMINHAO7} dur={30} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={AVIAO7 - 4} dur={50} v={FXV * 0.3} />
      <SND src="sfx3/crowd.mp3" from={MARACANA} dur={L(10) - MARACANA} v={FXV * 0.25} />
      <SND src="sfx3/whistle.mp3" from={GOL10 - 8} dur={30} v={FXV * 0.4} />
      <SND src="sfx2/cheer.mp3" from={COMEMORA} dur={L(11) - COMEMORA} v={FXV * 0.4} />
      {[0, 8, 16, 24, 32].map((d) => (
        <SND key={"pl" + d} src="sfx10/plim.mp3" from={FIGURINHAS + d} dur={14} v={FXV * 0.3} />
      ))}
      <SND src="sfx2/plane.mp3" from={POUSA - 6} dur={SHOPPING - POUSA + 20} v={FXV * 0.35} />
      <SND src="sfx2/crate.mp3" from={SHOPPING} dur={30} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={at(13, "atravessa")} dur={DESLIGA - at(13, "atravessa") - 10} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={DESLIGA + 2} dur={15} v={FXV * 0.6} />
      <SND src="sfx7/snore.mp3" from={DESLIGA + 4} dur={LIGA - DESLIGA - 2} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={LIGA + 2} dur={15} v={FXV * 0.6} />
      <SND src="sfx11/whistle.mp3" from={L(15) + 6} dur={30} v={FXV * 0.25} />
      <SND src="sfx2/steps.mp3" from={PANTANAL} dur={L(16) - PANTANAL} v={FXV * 0.25} />
      <SND src="sfx9/bigsneeze.mp3" from={ESPIRRA - 20} dur={50} v={FXV * 0.5} />
      <SND src="sfx12/throw.mp3" from={L(17)} dur={40} v={FXV * 0.4} />
      <SND src="sfx12/poof.mp3" from={TORRE} dur={25} v={FXV * 0.3} />
      <SND src="sfx14/papel.mp3" from={MUMIA18} dur={30} v={FXV * 0.3} />
      <SND src="sfx11/water.mp3" from={PEIXINHO18 + 4} dur={30} v={FXV * 0.35} />
      <SND src="sfx2/land.mp3" from={VIZINHO18 + 6} dur={25} v={FXV * 0.35} />
      <SND src="sfx11/wind.mp3" from={L(19)} dur={SPA - L(19)} v={FXV * 0.25} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FXV * 0.45} />
      {["vizinho", "aviao", "franca"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(21, w)} dur={22} v={FXV * 0.45} />
      ))}
      <SND src="sfx10/bubble.mp3" from={L(22) + 40} dur={20} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
