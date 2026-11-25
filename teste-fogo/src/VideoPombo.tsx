import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import {Boy, Pose, Look} from "./Boy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, TOWN_HOUSES, Bicycle, Mini, Bedroom, lp, V3} from "./Sets5";
import {Pigeon, PPose, Flock, Bird, Dish, DISH_RIM, UtilityPole, poleTop, Wire, Sparks, CornCart, CornSack, Kernels, Console, Router, Phone, BikeStand, Cable, Smell} from "./Sets6";
import {Captions, Banner, Chip, Sparkles, Confetti, Sticker, Cross, Wd, clean, STROKE} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut, rng} from "./util";
import W from "./timingPombo.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_POMBO = F(words[words.length - 1].e + 1.6);

/* ---------- o mesmo menino do vídeo do galo ---------- */
const KID: Look = {lowpoly: true, blocky: true, headScale: 1.12, skin: "#f0c49a", shirt: "#ffc928", trim: "#e9a514", pants: "#2f5fc4", hair: "#6b4426", hairStyle: "bowl"};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.05;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
/** prende o objeto na mão: copia posição e giro da palma */
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.matrixWorld.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};

/* ---------- lugar: a casa do menino, a antena, os postes ---------- */
const HOUSE = TOWN_HOUSES[8];
const HX = HOUSE.x;
const APEX = HOUSE.h + HOUSE.w * 0.4;
const DISH_DX = HOUSE.w * 0.2;
const DISH_BASE: V3 = [HX + DISH_DX, APEX - 0.4 * HOUSE.w * (DISH_DX / (HOUSE.w / 2 + 0.28)) - 0.05, -5.35];
const DS = 1.2;
const DROT = 0.3;
const PERCH: V3 = [DISH_BASE[0] + DISH_RIM[2] * DS * Math.sin(DROT), DISH_BASE[1] + DISH_RIM[1] * DS, DISH_BASE[2] + DISH_RIM[2] * DS * Math.cos(DROT)];
const POLES: V3[] = [[-3.2, 0.08, -2.62], [4.2, 0.08, -2.62]];
const ARMS = [-0.6, 0, 0.6];
const BIKE: V3 = [HX + 0.4, 0.08, -1.9];
const ROUTER: V3 = [HX + 1.5, 0.62, -2.15];

/* dia, fim de tarde e noite */
const DayTown: React.FC<{t: number; target: V3; ext?: number}> = ({t, target, ext = 9}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 35, 120]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.15]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.7} ext={ext} />
    <Town t={t} galo={false} />
  </>
);
const DuskTown: React.FC<{t: number; target: V3; ext?: number; lit: (i: number) => boolean; lamps: boolean; dark: number}> = ({t, target, ext = 10, lit, lamps, dark}) => (
  <>
    <Sky top={dark > 0.5 ? "#0c1233" : "#3b3f86"} bottom={dark > 0.5 ? "#2a2f5c" : "#ff9a5a"} />
    <fog attach="fog" args={[dark > 0.5 ? "#1a2040" : "#f0a070", 35, 120]} />
    <hemisphereLight args={[dark > 0.5 ? "#5a6aa8" : "#ffb88a", dark > 0.5 ? "#1a1a2a" : "#6a4a5a", lerp(1.0, 0.55, dark)]} />
    <SunLight target={target} dir={[-9, 4, 6]} intensity={lerp(1.9, 0.5, dark)} color={dark > 0.5 ? "#8fa8ff" : "#ffb070"} ext={ext} />
    <Town t={t} galo={false} lit={lit} dark lamps={lamps} clouds={false} />
  </>
);
const NightTown: React.FC<{t: number; target: V3; ext?: number}> = ({t, target, ext = 9}) => (
  <>
    <Sky top="#0b1030" bottom="#26305c" />
    <fog attach="fog" args={["#141a36", 30, 110]} />
    <SunDisc p={[30, 40, -110]} r={4} color="#e8eeff" k={1.6} />
    <hemisphereLight args={["#5a6aa8", "#1a1a2a", 0.75]} />
    <SunLight target={target} dir={[6, 10, 7]} intensity={0.9} color="#9fb4ff" ext={ext} />
    <Town t={t} galo={false} dark lamps={false} clouds={false} />
  </>
);
const RoomScene: React.FC<{t: number; night?: boolean}> = ({t, night}) => (
  <>
    {night ? <Sky top="#0b1030" bottom="#26305c" /> : <Sky />}
    <hemisphereLight args={[night ? "#8fa2e0" : "#fff4e0", night ? "#3a3050" : "#b08a60", night ? 1.1 : 1.05]} />
    <pointLight position={[1.2, 3.4, 1.0]} intensity={night ? 7 : 9} distance={9} decay={1.4} color={night ? "#9fb0ff" : "#fff1d6"} />
    <SunLight target={[-0.3, 0.6, -1.4]} dir={night ? [1.5, 3, -8] : [2.5, 6, -8]} intensity={night ? 0.8 : 2.4} color={night ? "#9fb4ff" : "#fff1d6"} ext={4} />
    <Bedroom t={t} night={night ? 1 : 0} clock={night ? 23 : 15} />
  </>
);

/* ---------- o pombo e a antena ---------- */
const PS = 2.3; // pombo gordo, bem visível
const RoofPigeon: React.FC<{f: number; t: number; extra?: PPose}> = ({f, t, extra = {}}) => (
  <Pigeon p={{pos: PERCH, rotY: 0.35, sit: 1, blink: blinkCurve(f + 33), bob: 0.5 * Math.sin(f / 5), t, chest: 0.4, ...extra}} s={PS} />
);

/* ---------- pombos: 300 (revoada, poleiros, pouso no menino) ---------- */
const NB = 300;
const BIRD = Array.from({length: NB}, (_, i) => {
  const r = rng(i * 13 + 11);
  return {a: r(), b: r(), c: r(), d: r(), e: r(), g: r()};
});
/** poleiros: fios, telhados e na antena */
const perchOf = (i: number, bend: number): V3 => {
  const q = BIRD[i];
  if (i < 120) {
    // nos três fios entre os postes
    const w = i % 3;
    const k = 0.06 + 0.88 * ((Math.floor(i / 3) + q.a * 0.5) / 40);
    const A = poleTop(POLES[0], 0, ARMS[w]);
    const B = poleTop(POLES[1], bend, ARMS[w]);
    const sag = wireSag(bend);
    return [lerp(A[0], B[0], k), lerp(A[1], B[1], k) - sag * 4 * k * (1 - k) + 0.02, lerp(A[2], B[2], k)];
  }
  // nos telhados das casas vizinhas (cumeeira)
  const hi = 5 + (i % 8);
  const h = TOWN_HOUSES[hi];
  const ap = h.h + h.w * 0.4;
  return [h.x + (q.a - 0.5) * 0.5, ap + 0.02, -5.9 + (q.b - 0.5) * 3.2];
};
const wireSag = (bend: number) => 0.35 + 1.4 * bend;
/** ponto no céu de onde cada pombo chega */
const skyFrom = (i: number): V3 => {
  const q = BIRD[i];
  return [30 + q.a * 40, 12 + q.b * 14, -30 + q.c * 40];
};
/** revoada girando em cima do bairro */
const swirl = (i: number, f: number): V3 => {
  const q = BIRD[i];
  const ang = q.d * 6.28 + f * (0.03 + q.e * 0.02);
  const rad = 3 + q.a * 6;
  return [-1 + Math.cos(ang) * rad, 7 + q.b * 5 + Math.sin(f / 9 + i) * 0.3, -4 + Math.sin(ang) * rad * 0.6];
};
const flapOf = (i: number, f: number, amp = 0.9) => amp * Math.sin(f * 1.3 + i * 1.7);
const lookYaw = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const arc = (A: V3, B: V3, k: number, h = 2): V3 => [lerp(A[0], B[0], k), lerp(A[1], B[1], k) + Math.sin(k * Math.PI) * h, lerp(A[2], B[2], k)];

/* ======================= os planos ======================= */

/* 0 — no quarto: celular carregando */
const sitPhone = (f: number, a: number, sad = 0): Pose => ({
  ...idle(f),
  pos: [-0.3, -0.29, -0.05],
  rotY: 0,
  legLift: 1.55,
  torso: [0.22, 0, 0],
  head: [0.35, 0, 0.06 * Math.sin(f / 20)],
  rShoulder: [-0.75, 0, -0.25],
  rElbow: -1.55,
  rWrist: [0.2, 0, 0],
  rFist: 1,
  lShoulder: [-0.2, 0, 0.18],
  lElbow: -0.6,
  brow: -0.6 * sad,
  mouthOpen: 0,
  smile: 0,
});
const Room: React.FC<ShotProps & {night?: boolean}> = ({f, a, t, night}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("room" + a, (fr) => sitPhone(fr, a, 1), a, f);
  const k = ramp(f, a, a + 70);
  return (
    <>
      <Cam pos={[lerp(0.2, 0.05, k), lerp(1.55, 1.5, k), lerp(3.6, 3.0, k)]} look={[-0.3, 1.2, -0.6]} fov={46} f={f} a={a} />
      <RoomScene t={t} night={night} />
      <pointLight position={[0.2, 1.8, 1.5]} intensity={4} distance={5} color="#ffe2c0" />
      <Boy pose={pose} look={KID} palmRef={palm} />
      <InHand palm={palm}>
        <group rotation={[-1.2, 0, 0]} position={[0, -0.02, -0.04]}>
          <Phone s={1.2} />
        </group>
      </InHand>
    </>
  );
};
const S0: React.FC<ShotProps> = (p) => <Room {...p} />;

/* 1 — o pombo gordo sentado na antena */
const roofCam = (f: number, a: number, pull = 0): {pos: V3; look: V3} => ({
  pos: [PERCH[0] + 1.7 + pull * 0.6, PERCH[1] - 0.3 + pull * 0.3, PERCH[2] + 3.6 + pull * 2],
  look: [PERCH[0] - 0.1, PERCH[1] + 0.2, PERCH[2]],
});
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 90, easeInOut);
  const c = roofCam(f, a, 1 - k);
  const coo = at(0, "pombo");
  return (
    <>
      <Cam pos={c.pos} look={c.look} fov={44} f={f} a={a} />
      <DayTown t={t} target={PERCH} ext={6} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <RoofPigeon f={f} t={t} extra={{chest: 0.4 + 0.5 * pop(f, coo, 10) * (1 - ramp(f, coo + 12, coo + 22)), headTilt: -0.2 * pop(f, coo, 10)}} />
    </>
  );
};
/* 2 — "não sai de graça": nega com a cabeça, asas cruzadas */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const no = ramp(f, at(1, "nao") - 4, at(1, "nao") + 2) * (1 - ramp(f, at(1, "graca") + 8, at(1, "graca") + 16));
  return (
    <>
      <Cam pos={[PERCH[0] + 1.0, PERCH[1] + 0.25, PERCH[2] + 2.3]} look={[PERCH[0] - 0.05, PERCH[1] + 0.5, PERCH[2]]} fov={42} f={f} a={a} />
      <DayTown t={t} target={PERCH} ext={5} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <RoofPigeon f={f} t={t} extra={{rotY: 0.45, wingFwd: 0.9, headYaw: 0.6 * Math.sin((f - a) / 2.6) * no, headTilt: -0.15, chest: 0.8, bob: 0}} />
    </>
  );
};

/* 3 — troca o videogame por um saco de milho */
const CART: V3 = [12.6, 0.08, -2.25];
const VENDOR = {shirt: "#e74c3c", pants: "#2c2c34", skin: "#c68a5a", hair: "#1a1a1a", cap: "#ffd23a"};
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const give = at(1, "troca");
  const got = at(1, "milho") - 4;
  const walkIn = ramp(f, a, give - 2, easeOut);
  const bx = lerp(9.4, 11.2, walkIn);
  const pose = physics("troca" + a, (fr) => {
    const wk = ramp(fr, a, give - 2, easeOut) < 1;
    const ph = ((fr - a) / FPS) * Math.PI * 2 * 1.6;
    const reach = ramp(fr, give - 2, give + 8) * (1 - ramp(fr, at(1, "videogame") + 10, at(1, "videogame") + 18));
    const hold = ramp(fr, got, got + 8);
    return {
      ...idle(fr),
      pos: [lerp(9.4, 11.2, ramp(fr, a, give - 2, easeOut)), 0.08, -2.0],
      rotY: Math.PI / 2,
      walk: wk ? ph : 0,
      walkAmt: wk ? 1 : 0,
      rShoulder: [-0.5 - 0.7 * reach - 0.6 * hold, 0, -0.15],
      lShoulder: [-0.5 - 0.7 * reach - 0.6 * hold, 0, 0.15],
      rElbow: -0.9 + 0.4 * reach,
      lElbow: -0.9 + 0.4 * reach,
      smile: 0.3 + 0.6 * hold,
      mouthOpen: talk(fr, give, give + 20),
    };
  }, a, f);
  const hasConsole = f < at(1, "videogame") + 12;
  return (
    <>
      <Cam pos={[11.9, 1.6, 3.6]} look={[11.9, 1.1, -2.2]} fov={44} f={f} a={a} />
      <DayTown t={t} target={[12, 0, -2]} ext={6} />
      <CornCart p={CART} t={t} rotY={-0.25} />
      <Mini p={[13.3, 0.08, -2.75]} rotY={-1.2} {...VENDOR} s={1.1} arms={0.35 * ramp(f, give, give + 8)} t={t} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      {hasConsole && (
        <group position={[bx + 0.45, 1.0, -1.95]}>
          <Console s={1.3} r={[0, -0.3, 0]} />
        </group>
      )}
      {!hasConsole && f < got && <Console p={[12.75, 1.0, -2.05]} s={1.3} r={[0, 0.2, 0]} />}
      {f >= got && <CornSack p={[bx + 0.42, 0.62 + 0.2 * (1 - ramp(f, got, got + 6)), -1.95]} s={1.1} />}
    </>
  );
};

/* 4 — escambo urbano: segurando o saco de milho */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("escambo" + a, (fr) => ({...idle(fr), pos: [11.2, 0.08, -2.0], rotY: 0.5, rShoulder: [-1.0, 0, -0.35], lShoulder: [-1.0, 0, 0.35], rElbow: -0.7, lElbow: -0.7, smile: 1, brow: 0.6, head: [-0.12, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[12.5, 1.25, 1.9]} look={[11.4, 1.35, -2.0]} fov={46} f={f} a={a} />
      <DayTown t={t} target={[11, 0, -2]} ext={5} />
      <CornCart p={CART} t={t} rotY={-0.25} />
      <Boy pose={pose} look={KID} />
      <CornSack p={[11.2 + Math.sin(0.5) * 0.38, 0.75, -2.0 + Math.cos(0.5) * 0.38]} s={1.1} />
    </>
  );
};

/* 5 — o pombo come o milho (na calçada) e vai embora */
const KERN: V3 = [HX + 1.7, 0.09, -2.0];
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const eatA = at(3, "come");
  const leave = at(3, "vai");
  const pecking = f >= eatA - 4 && f < leave;
  const peck = pecking ? Math.max(0, Math.sin((f - eatA) * 0.9)) : 0;
  const eaten = ramp(f, eatA, leave);
  const kf = clamp((f - leave) / 26);
  const startP: V3 = [KERN[0] - 0.5, 0.08, KERN[2] + 0.05];
  const fly = arc(startP, [startP[0] - 10, startP[1] + 8, startP[2] - 5], easeInOut(kf), 1.2);
  const pose = physics("milho" + a, (fr) => ({...idle(fr), pos: [HX - 0.4, 0.08, -2.1], rotY: 1.1, rShoulder: [-0.3, 0, -0.15], lShoulder: [-0.3, 0, 0.15], smile: 0.5, head: [0.25, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[KERN[0] + 0.4, 0.95, 1.2]} look={[KERN[0] - 0.6, 0.55, -2.0]} fov={46} f={f} a={a} />
      <DayTown t={t} target={KERN} ext={6} />
      <Boy pose={pose} look={KID} />
      <CornSack p={[HX + 0.35, 0.08, -1.7]} s={1.0} r={[0, 0, 0.25]} />
      <Kernels p={KERN} n={60} r={0.4} eaten={eaten} />
      <Pigeon p={{pos: kf > 0 ? fly : startP, rotY: kf > 0 ? lookYaw(startP, fly) : 1.4, peck, flap: kf > 0 ? 1 : 0, flapPh: f * 2.4, blink: blinkCurve(f), chest: 0.3 + eaten * 0.6, t, bob: pecking ? 0 : 0.4 * Math.sin(f / 4)}} s={PS} />
    </>
  );
};

/* 6 — volta com a família inteira: 300 pombos */
const BACK = at(3, "volta");
const arrive = (i: number) => BACK + 4 + Math.floor(BIRD[i].c * 70);
const birdSky = (i: number, f: number): Bird => {
  const s0 = arrive(i);
  const A = skyFrom(i);
  const k = clamp((f - s0) / 40);
  if (f < s0) return {p: A, yaw: 0, flap: flapOf(i, f), s: 1.4};
  const S = swirl(i, f);
  const p = k < 1 ? arc(A, S, easeOut(k), 0) : S;
  const nxt = k < 1 ? arc(A, S, easeOut(Math.min(1, k + 0.05)), 0) : swirl(i, f + 2);
  return {p, yaw: lookYaw(p, nxt), flap: flapOf(i, f), s: 1.4, pitch: 0.1};
};
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const birds = Array.from({length: NB}, (_, i) => birdSky(i, f));
  const kHero = clamp((f - BACK + 6) / 30);
  const heroA: V3 = [PERCH[0] - 14, PERCH[1] + 9, PERCH[2] - 8];
  const hero = arc(heroA, PERCH, easeOut(kHero), 1);
  const sh = shake(f, 0.03 * ramp(f, at(3, "trezentos") - 4, at(3, "trezentos") + 6) * (1 - ramp(f, at(3, "pombos", 1) + 10, at(3, "pombos", 1) + 20)));
  return (
    <>
      <Cam pos={[HX + 4 + sh[0], 1.3 + sh[1], 4.5]} look={[HX + 0.5, 6.5, -4]} fov={54} f={f} a={a} />
      <DayTown t={t} target={[HX, 0, -4]} ext={12} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      {POLES.map((p, i) => (
        <UtilityPole key={i} p={p} />
      ))}
      {ARMS.map((arm) => (
        <Wire key={arm} a={poleTop(POLES[0], 0, arm)} b={poleTop(POLES[1], 0, arm)} sag={wireSag(0)} />
      ))}
      <Pigeon p={{pos: hero, rotY: kHero < 1 ? lookYaw(heroA, PERCH) : 0.35, flap: kHero < 1 ? 1 : 0, flapPh: f * 2.4, sit: kHero >= 1 ? 1 : 0, chest: 0.8, t}} s={PS} />
      <Flock birds={birds} />
    </>
  );
};

/* 7 — reunião emplumada: pombos nos fios e telhados */
const perched = (f: number, bend = 0, scatter = 0): Bird[] =>
  Array.from({length: NB}, (_, i) => {
    const P = perchOf(i, bend);
    const q = BIRD[i];
    if (scatter > 0 && i < 120) {
      const k = clamp(scatter * 1.2 - q.d * 0.2);
      const U: V3 = [P[0] + (q.a - 0.5) * 6, P[1] + 3 + q.b * 4, P[2] + (q.c - 0.5) * 4];
      return {p: arc(P, U, k, 0.5), yaw: q.e * 6, flap: flapOf(i, f), s: 1.25};
    }
    return {p: P, yaw: (q.e - 0.5) * 1.2, flap: 0.05 * Math.sin(f / 6 + i), s: 1.25, pitch: 0.05 * Math.sin(f / 9 + i)};
  });
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 70);
  return (
    <>
      <Cam pos={[lerp(0.8, 0.2, k), 3.4, lerp(8.0, 7.2, k)]} look={[0.0, 3.6, -3.5]} fov={50} f={f} a={a} />
      <DayTown t={t} target={[0, 0, -3]} ext={11} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <RoofPigeon f={f} t={t} />
      {POLES.map((p, i) => (
        <UtilityPole key={i} p={p} />
      ))}
      {ARMS.map((arm) => (
        <Wire key={arm} a={poleTop(POLES[0], 0, arm)} b={poleTop(POLES[1], 0, arm)} sag={wireSag(0)} />
      ))}
      <Flock birds={perched(f)} />
    </>
  );
};

/* 8 — o poste entorta, o fio arrebenta, o bairro apaga */
const BEND0 = at(5, "entorta") - 4;
const SNAP = at(5, "arrebenta");
const OFF0 = at(5, "bairro");
const OFF1 = at(5, "luz") + 2;
const bendAt = (f: number) => 0.06 * ramp(f, L(5), BEND0) + 0.2 * easeInOut(ramp(f, BEND0, BEND0 + 14));
const houseOff = (i: number) => OFF0 + ((i * 7) % 13) / 13 * (OFF1 - OFF0);
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const bend = bendAt(f);
  const cutK = clamp((f - SNAP) / 10);
  const dark = ramp(f, OFF0, OFF1 + 6);
  const lit = (i: number) => f < houseOff(i);
  const sh = shake(f, 0.05 * (ramp(f, SNAP - 2, SNAP) * (1 - ramp(f, SNAP + 8, SNAP + 20))));
  const k = ramp(f, a, b8(a));
  return (
    <>
      <Cam pos={[lerp(1.2, 1.6, k) + sh[0], lerp(2.4, 2.7, k) + sh[1], lerp(6.6, 6.0, k)]} look={[3.2, 3.3, -2.4]} fov={52} f={f} a={a} />
      <DuskTown t={t} target={[0, 0, -3]} ext={11} lit={lit} lamps={f < OFF1} dark={dark} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <RoofPigeon f={f} t={t} extra={{glow: dark}} />
      <UtilityPole p={POLES[0]} />
      <UtilityPole p={POLES[1]} bend={bend} />
      {ARMS.map((arm) => (
        <Wire key={arm} a={poleTop(POLES[0], 0, arm)} b={poleTop(POLES[1], bend, arm)} sag={wireSag(bend)} cut={arm === 0 ? cutK : 0} swing={0.2 * Math.sin(f / 3) * (1 - clamp((f - SNAP) / 40))} />
      ))}
      <Sparks p={(() => {
        const A = poleTop(POLES[0], 0, 0);
        const B = poleTop(POLES[1], bend, 0);
        return [lerp(A[0], B[0], 0.5), lerp(A[1], B[1], 0.5) - wireSag(bend), lerp(A[2], B[2], 0.5)] as V3;
      })()} k={(f - SNAP) / 18} />
      <Flock birds={perched(f, bend, clamp((f - SNAP) / 20))} glow={dark} />
    </>
  );
};
const b8 = (a: number) => a + 190;

/* 9 — apagão de penas: só os olhinhos brilhando */
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const birds = perched(f, bendAt(SNAP + 40), 1).map((b, i) => (i < 120 ? {...b, p: perchOf(120 + (i % 180), 0)} : b));
  return (
    <>
      <Cam pos={[HX + 2.5, 2.6, 6.5]} look={[HX + 1, 4.2, -5]} fov={50} f={f} a={a} />
      <NightTown t={t} target={[HX, 0, -4]} ext={12} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <RoofPigeon f={f} t={t} extra={{glow: 1}} />
      <UtilityPole p={POLES[0]} />
      <UtilityPole p={POLES[1]} bend={bendAt(SNAP + 40)} />
      <Flock birds={birds} glow={1} />
    </>
  );
};

/* 10/11 — bicicleta ligada no roteador: usina de pedal */
const PEDAL = at(7, "pedala");
const ON = PEDAL + 8;
const bikePose = (f: number, a: number, speed: number, extra: Pose = {}): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * speed;
  return {
    ...idle(f),
    pos: [BIKE[0] - 0.2, 0.3, BIKE[2]],
    rotY: Math.PI / 2,
    legLift: 0.75,
    walk: ph,
    walkAmt: speed > 0 ? 0.8 : 0,
    torso: [0.35, 0, 0],
    rShoulder: [-0.95, 0, -0.22],
    lShoulder: [-0.95, 0, 0.22],
    rElbow: -0.35,
    lElbow: -0.35,
    head: [-0.2, 0, 0],
    ...extra,
  };
};
const BikeSet: React.FC<{f: number; t: number; spin: number; on: number}> = ({f, t, spin, on}) => (
  <>
    <BikeStand p={[BIKE[0] - 0.52, BIKE[1], BIKE[2]]} />
    <Bicycle p={[BIKE[0], BIKE[1] + 0.06, BIKE[2]]} spin={spin} />
    <mesh position={[ROUTER[0], ROUTER[1] / 2, ROUTER[2]]} material={lp("#8a5a33", 0.9)} castShadow>
      <boxGeometry args={[0.5, ROUTER[1], 0.4]} />
    </mesh>
    <Router p={ROUTER} on={on} t={t} rotY={-0.4} s={1.4} />
    <Cable a={[BIKE[0] - 0.52, 0.45, BIKE[2]]} b={[ROUTER[0] - 0.15, ROUTER[1] + 0.05, ROUTER[2]]} sag={0.4} />
  </>
);
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const speed = f < PEDAL ? 0 : 1.4 * ramp(f, PEDAL, PEDAL + 15);
  const pose = physics("bike" + a, (fr) => bikePose(fr, PEDAL, fr < PEDAL ? 0 : 1.4, {smile: fr > ON ? 0.9 : 0.2, brow: 0.5}), a, f);
  const spin = f < PEDAL ? 0 : ((f - PEDAL) / FPS) * 9;
  return (
    <>
      <Cam pos={[BIKE[0] + 1.7, 1.55, BIKE[2] + 3.6]} look={[BIKE[0] + 0.4, 1.0, BIKE[2] - 0.2]} fov={48} f={f} a={a} />
      <NightTown t={t} target={BIKE} ext={6} />
      <pointLight position={[BIKE[0] + 0.6, 2.6, BIKE[2] + 1.6]} intensity={3} distance={6} color="#cfd8ff" />
      <BikeSet f={f} t={t} spin={spin} on={f >= ON ? 1 : 0} />
      <Boy pose={pose} look={KID} />
    </>
  );
};
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("usina" + a, (fr) => bikePose(fr, PEDAL, 2.2, {smile: 0.9, brow: 0.6, mouthOpen: 0.25 + 0.15 * Math.abs(Math.sin(fr / 3)), hair: [0.08 * Math.sin(fr / 2), 0]}), a, f);
  const spin = ((f - PEDAL) / FPS) * 14;
  const drops = [0, 1, 2].map((i) => {
    const k = (((f - a) / 14 + i / 3) % 1);
    return (
      <mesh key={i} position={[BIKE[0] - 0.05 + 0.08 * i, 2.0 - k * 0.6, BIKE[2] + 0.32]} scale={[0.035, 0.05, 0.035]} material={lp("#7fd0ff", 0.2)}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    );
  });
  return (
    <>
      <Cam pos={[BIKE[0] + 1.6, 0.9, BIKE[2] + 2.0]} look={[BIKE[0] - 0.1, 1.45, BIKE[2]]} fov={50} f={f} a={a} />
      <NightTown t={t} target={BIKE} ext={6} />
      <pointLight position={[BIKE[0] + 0.6, 2.6, BIKE[2] + 1.6]} intensity={3} distance={6} color="#cfd8ff" />
      <BikeSet f={f} t={t} spin={spin} on={1} />
      <Boy pose={pose} look={KID} />
      {drops}
    </>
  );
};

/* 12 — cheiro de milho... e os pombos pousam nele */
const STAND: V3 = [BIKE[0] + 0.9, 0.08, BIKE[2] + 0.5];
/** lugares em cima do menino (braços abertos) e em volta */
const spotOf = (i: number): V3 => {
  const q = BIRD[i];
  if (i < 6) return [STAND[0] + (i - 2.5) * 0.12, 2.12 + (i % 2) * 0.05, STAND[2] + (q.a - 0.5) * 0.15]; // cabeça
  if (i < 26) {
    const sd = i % 2 ? 1 : -1;
    const k = (Math.floor((i - 6) / 2) + 0.5) / 10;
    return [STAND[0] + sd * (0.28 + k * 0.62), 1.32 + 0.03 * Math.sin(i), STAND[2] + (q.b - 0.5) * 0.06];
  }
  if (i < 40) return [STAND[0] + (q.a - 0.5) * 0.5, 1.0 + q.b * 0.3, STAND[2] + 0.18]; // peito
  // chão: pros lados e pra trás (não tampa o menino)
  const ang = Math.PI * (1.05 + q.c * 0.9);
  const d = 0.7 + q.d * 2.8;
  return [STAND[0] + Math.cos(ang) * d * 1.3, 0.1, STAND[2] + Math.sin(ang) * d * 0.8 + 0.25];
};
const LAND = at(9, "pousam") - 6;
const landK = (i: number, f: number) => clamp((f - LAND - Math.floor(BIRD[i].e * 40)) / 22);
const birdsLanding = (f: number): Bird[] =>
  Array.from({length: NB}, (_, i) => {
    const A = perchOf(120 + (i % 180), 0);
    const B = spotOf(i);
    const k = landK(i, f);
    if (k <= 0) return {p: A, yaw: (BIRD[i].e - 0.5) * 1.2, flap: 0.05 * Math.sin(f / 6 + i), s: 1.25};
    const p = arc(A, B, easeInOut(k), 1.5);
    return {p, yaw: k < 1 ? lookYaw(A, B) : (BIRD[i].e - 0.5) * 2, flap: k < 1 ? flapOf(i, f) : 0.1 * Math.sin(f / 5 + i), s: 1.25};
  });
const scarecrow = (f: number, k: number, cover: number): Pose => ({
  ...idle(f),
  pos: STAND,
  rotY: 0.2,
  rShoulder: [0, 0, -0.08 - 1.45 * k],
  lShoulder: [0, 0, 0.08 + 1.45 * k],
  rElbow: -0.05,
  lElbow: -0.05,
  eyeWide: 0.7 * cover,
  mouthOpen: 0.35 * cover,
  brow: 0.8 * cover,
});
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const sniff = at(9, "cheiro");
  const turn = ramp(f, at(9, "e", 0) - 2, at(9, "e", 0) + 8);
  const armsUp = ramp(f, LAND + 10, LAND + 30);
  const pose = physics("cheiro" + a, (fr) => {
    const sn = ramp(fr, sniff - 6, sniff + 2) * (1 - ramp(fr, sniff + 18, sniff + 26));
    const base = scarecrow(fr, ramp(fr, LAND + 10, LAND + 30), ramp(fr, LAND, LAND + 20));
    return {...base, head: [0.35 * sn, 0.4 * sn, 0], torso: [0.15 * sn, 0, 0], lShoulder: sn > 0.01 ? [-0.6 * sn, 0, 0.3] : base.lShoulder, lElbow: sn > 0.01 ? -1.6 * sn : base.lElbow};
  }, a, f);
  const k = ramp(f, LAND - 20, LAND + 30, easeInOut);
  return (
    <>
      <Cam pos={[STAND[0] + lerp(1.2, 2.2, k), lerp(1.6, 2.2, k), STAND[2] + lerp(3.2, 5.0, k)]} look={[STAND[0] - 0.1, lerp(1.4, 1.6, k), STAND[2] - 0.5]} fov={50} f={f} a={a} />
      <NightTown t={t} target={STAND} ext={8} />
      <pointLight position={[STAND[0] + 0.6, 2.8, STAND[2] + 1.6]} intensity={3} distance={6} color="#cfd8ff" />
      <BikeSet f={f} t={t} spin={0} on={1} />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      <Boy pose={pose} look={KID} />
      <Smell p={[STAND[0], 1.15, STAND[2] + 0.2]} k={ramp(f, sniff - 8, sniff) * (1 - ramp(f, LAND, LAND + 10))} t={t} />
      <Flock birds={birdsLanding(f).map((b, i) => (landK(i, f) <= 0 ? {...b, yaw: b.yaw + turn * (lookYaw(b.p, STAND) - b.yaw)} : b))} glow={1 - ramp(f, LAND + 10, LAND + 40)} />
    </>
  );
};
/* 13 — espantalho ao contrário */
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("espant" + a, (fr) => scarecrow(fr, 1, 1), a, f);
  const k = ramp(f, a, a + 80);
  return (
    <>
      <Cam pos={[STAND[0] + lerp(0.6, 0.4, k), lerp(1.0, 0.9, k), STAND[2] + lerp(4.2, 3.8, k)]} look={[STAND[0], 1.55, STAND[2]]} fov={50} f={f} a={a} />
      <NightTown t={t} target={STAND} ext={8} />
      <pointLight position={[STAND[0] + 0.6, 2.8, STAND[2] + 1.6]} intensity={3} distance={6} color="#cfd8ff" />
      <BikeSet f={f} t={t} spin={0} on={1} />
      <Boy pose={pose} look={KID} />
      <Flock birds={birdsLanding(f + 200)} />
    </>
  );
};

/* 14 — parabéns: internet rápida, sem videogame, no escuro, 300 pombos */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("parab" + a, (fr) => ({
    ...scarecrow(fr, 0, 0),
    pos: STAND,
    rotY: 0.2,
    rShoulder: [-0.75, 0, -0.25],
    rElbow: -1.55,
    rFist: 1,
    lShoulder: [0, 0, 0.3],
    head: [0.15, 0, 0.12],
    bags: 1,
    blink: 0.4 + 0.6 * blinkCurve(fr),
    smile: 0.2,
    eyeWide: 0,
    mouthOpen: 0,
  }), a, f);
  const k = ramp(f, a, a + 200);
  return (
    <>
      <Cam pos={[STAND[0] + lerp(0.3, 0.2, k), 1.6, STAND[2] + lerp(4.6, 4.0, k)]} look={[STAND[0], 1.4, STAND[2]]} fov={48} f={f} a={a} />
      <NightTown t={t} target={STAND} ext={8} />
      <pointLight position={[STAND[0] + 0.6, 2.8, STAND[2] + 1.6]} intensity={3} distance={6} color="#cfd8ff" />
      <BikeSet f={f} t={t} spin={0} on={1} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      <InHand palm={palm}>
        <group rotation={[-1.2, 0, 0]} position={[0, -0.02, -0.04]}>
          <Phone s={1.2} />
        </group>
      </InHand>
      <Flock
        birds={birdsLanding(f + 400).map((b, i) =>
          i >= 6 && i < 12
            ? {...b, p: [STAND[0] + (i % 2 ? 1 : -1) * (0.26 + 0.05 * (i - 6)), 1.44, STAND[2] - 0.05] as V3}
            : i >= 12 && i < 40
              ? {...b, p: spotOf(40 + ((i * 37) % 250))}
              : b,
        )}
      />
    </>
  );
};

/* 15 — o primeiro pombo volta pra antena */
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const back = at(12, "voltou");
  const kf = clamp((f - (back - 24)) / 26);
  const A: V3 = [PERCH[0] + 8, PERCH[1] + 5, PERCH[2] + 2];
  const p = arc(A, PERCH, easeOut(kf), 1);
  const c = roofCam(f, a, 0.4);
  return (
    <>
      <Cam pos={c.pos} look={c.look} fov={46} f={f} a={a} />
      <NightTown t={t} target={PERCH} ext={6} />
      <pointLight position={[PERCH[0] + 1.5, PERCH[1] + 1.5, PERCH[2] + 2.5]} intensity={5} distance={7} color="#b8c8ff" />
      <Dish p={DISH_BASE} s={DS} rotY={DROT} />
      {kf > 0 && <Pigeon p={{pos: p, rotY: kf < 1 ? lookYaw(A, PERCH) : 0.35, flap: kf < 1 ? 1 : 0.3 * (1 - ramp(f, back + 2, back + 14)), flapPh: f * 2.4, sit: kf >= 1 ? 1 : 0, chest: 0.6, glow: 1, t, blink: blinkCurve(f)}} s={PS} />}
    </>
  );
};
const S16: React.FC<ShotProps> = (p) => <Room {...p} night />;

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: L(1), Comp: S2},
  {from: at(1, "entao"), Comp: S3},
  {from: L(2), Comp: S4},
  {from: L(3), Comp: S5},
  {from: at(3, "mas"), Comp: S6},
  {from: L(4), Comp: S7},
  {from: L(5), Comp: S8},
  {from: L(6), Comp: S9},
  {from: L(7), Comp: S10},
  {from: L(8), Comp: S11},
  {from: L(9), Comp: S12},
  {from: L(10), Comp: S13},
  {from: L(11), Comp: S14},
  {from: L(12), Comp: S15},
  {from: L(13), Comp: S16},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_POMBO} t={f / FPS} />
      <Post bloom={0.6} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["internet", "rapida", "pombo", "pombos", "antena", "graca", "videogame", "milho", "escambo", "urbano", "familia", "trezentos", "reuniao", "emplumada", "poste", "entorta", "arrebenta", "luz", "apagao", "penas", "roteador", "bicicleta", "pedala", "energia", "usina", "pedal", "cheiro", "pousam", "espantalho", "contrario", "parabens", "escuro", "cabeca", "voltou", "novo"]);

/** ícone de Wi-Fi com risquinhos */
const WifiChip: React.FC<{from: number; to: number; level: (f: number) => number; label?: (f: number) => string; top?: number}> = ({from, to, level, label, top = 1450}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const lv = level(f);
  const lb = label ? label(f) : "";
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const col = lv >= 3 ? "#2ecc71" : lv >= 1 ? "#ffb31a" : "#e8412c";
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${s})`}}>
      <div style={{display: "flex", alignItems: "center", gap: 18, background: "#101018", borderRadius: 30, padding: "14px 34px", border: `6px solid ${col}`}}>
        <svg width={92} height={70} viewBox="0 0 92 70">
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M ${46 - 14 - k * 14} ${52 - 12 - k * 13} Q 46 ${52 - 32 - k * 16} ${46 + 14 + k * 14} ${52 - 12 - k * 13}`} stroke={k < lv ? col : "#3a3a48"} strokeWidth={9} fill="none" strokeLinecap="round" />
          ))}
          <circle cx={46} cy={58} r={7} fill={lv > 0 ? col : "#3a3a48"} />
          {lv === 0 && <line x1={14} y1={8} x2={78} y2={64} stroke="#e8412c" strokeWidth={8} strokeLinecap="round" />}
        </svg>
        {lb && <span style={{fontFamily, fontWeight: 900, fontSize: 54, color: "#fff"}}>{lb}</span>}
      </div>
    </div>
  );
};
const loading = (f: number) => "CARREGANDO" + ".".repeat(1 + (Math.floor(f / 8) % 3));
const Counter: React.FC<{from: number; to: number; n: number; text: string; bg: string}> = ({from, to, n, text, bg}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const v = Math.min(n, Math.round(n * easeOut(clamp((f - from) / 30))));
  return <Chip from={from} to={to} text={`${v} ${text}`} bg={bg} top={300} />;
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
export const VideoPombo: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const pb = L(11);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <Banner from={L(2) + 4} to={L(3) - 3} text="ESCAMBO URBANO" n={1} />
      <Banner from={L(4) + 4} to={L(5) - 3} text="REUNIÃO EMPLUMADA" n={2} />
      <Banner from={L(6) + 4} to={L(7) - 3} text="APAGÃO DE PENAS" n={3} />
      <Banner from={L(8) + 4} to={L(9) - 3} text="USINA DE PEDAL" n={4} />
      <Banner from={L(10) + 4} to={L(11) - 3} text="ESPANTALHO AO CONTRÁRIO" n={5} />

      <WifiChip from={4} to={L(1) - 2} level={() => 1} label={loading} />
      <WifiChip from={at(7, "roteador")} to={L(9) - 2} level={(fr) => (fr < ON ? 0 : Math.min(3, 1 + Math.floor((fr - ON) / 12)))} label={(fr) => (fr < ON ? "SEM LUZ" : fr < ON + 30 ? "CONECTANDO..." : "INTERNET RÁPIDA!")} />
      <WifiChip from={at(12, "e", 0)} to={L(13) - 2} level={(fr) => (fr < at(12, "antena") ? 3 : 0)} label={(fr) => (fr < at(12, "antena") ? "INTERNET RÁPIDA!" : "SEM SINAL")} />
      <WifiChip from={L(13) + 2} to={TOTAL_POMBO} level={() => 0} label={loading} />
      <Chip from={at(1, "graca") - 4} to={at(1, "entao") - 2} text="NÃO SAI DE GRAÇA" bg="#e8412c" top={300} size={70} />
      <Sparkles from={L(2)} to={L(3) - 2} x={540} y={900} />
      <Counter from={at(3, "trezentos") - 3} to={L(4) - 2} n={300} text="POMBOS" bg="#5a6b8a" />
      <Confetti from={pb} to={pb + 100} />
      <Chip from={pb + 1} to={at(11, "sem") - 2} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(11, "sem")} to={L(12) - 2} x={250} y={420} rot={-6} label="SEM GAME">
        <g transform="translate(152,105)">
          <rect x={-80} y={-28} width={160} height={56} rx={10} fill="#1d1f26" stroke="#101018" strokeWidth={6} />
          <rect x={-40} y={-4} width={80} height={6} fill="#58b8ff" />
        </g>
        <Cross />
      </Sticker>
      <Sticker from={at(11, "escuro")} to={L(12) - 2} x={830} y={430} rot={5} label="NO ESCURO">
        <g transform="translate(152,100)">
          <circle cx={0} cy={-15} r={48} fill="#3a3f4a" stroke="#101018" strokeWidth={6} />
          <rect x={-22} y={30} width={44} height={30} rx={6} fill="#7a808a" stroke="#101018" strokeWidth={6} />
        </g>
        <Cross />
      </Sticker>
      <Sticker from={at(11, "trezentos")} to={L(12) - 2} x={540} y={1050} rot={-3} label="300 POMBOS">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${50 + i * 52},${110 + (i % 2) * 18}) scale(0.9)`}>
            <ellipse rx={30} ry={22} fill="#8f97a5" stroke="#101018" strokeWidth={5} />
            <circle cx={22} cy={-20} r={13} fill="#a1a9b6" stroke="#101018" strokeWidth={5} />
            <circle cx={26} cy={-22} r={4} fill="#ff8a1e" />
          </g>
        ))}
      </Sticker>

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozpombo.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 20) * (1 - ramp(fr, TOTAL_POMBO - 30, TOTAL_POMBO))} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={25}>
          <Audio src={staticFile("sfx7/whoosh.mp3")} volume={FX * 0.18} />
        </Sequence>
      ))}
      {[L(2), L(4), L(6), L(8), L(10)].map((b) => (
        <Sequence key={"b" + b} from={b + 3} durationInFrames={32}>
          <Audio src={staticFile("sfx7/boing.mp3")} volume={FX * 0.75} />
        </Sequence>
      ))}
      <Sequence from={at(0, "pombo") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx8/coo.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={at(1, "nao") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx8/coo.mp3")} volume={FX * 0.45} />
      </Sequence>
      <Sequence from={at(1, "milho") - 2} durationInFrames={37}>
        <Audio src={staticFile("sfx7/cash.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={at(1, "videogame")} durationInFrames={22}>
        <Audio src={staticFile("sfx7/pof.mp3")} volume={FX * 0.5} />
      </Sequence>
      <Sequence from={at(3, "come") - 2} durationInFrames={at(3, "vai") - at(3, "come") + 2}>
        <Audio src={staticFile("sfx8/peck.mp3")} volume={FX * 0.9} loop />
      </Sequence>
      <Sequence from={at(3, "vai")} durationInFrames={45}>
        <Audio src={staticFile("sfx8/wings.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={BACK} durationInFrames={L(5) - BACK}>
        <Audio src={staticFile("sfx8/flock.mp3")} volume={(fr) => FX * 0.9 * (1 - ramp(fr, L(4) - BACK, L(5) - BACK))} loop />
      </Sequence>
      <Sequence from={L(4) - 4} durationInFrames={L(6) - L(4)}>
        <Audio src={staticFile("sfx8/crowdcoo.mp3")} volume={(fr) => FX * 0.7 * clamp(fr / 10)} loop />
      </Sequence>
      <Sequence from={BEND0 - 8} durationInFrames={90}>
        <Audio src={staticFile("sfx8/creak.mp3")} volume={FX * 0.9} />
      </Sequence>
      <Sequence from={SNAP - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx8/snap.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={SNAP + 2} durationInFrames={45}>
        <Audio src={staticFile("sfx8/flock.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={OFF1 - 10} durationInFrames={60}>
        <Audio src={staticFile("sfx8/poweroff.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={PEDAL} durationInFrames={L(9) - PEDAL + 6}>
        <Audio src={staticFile("sfx8/pedal.mp3")} volume={(fr) => FX * 1.1 * clamp(fr / 10) * (1 - ramp(fr, L(9) - PEDAL - 4, L(9) - PEDAL + 6))} loop />
      </Sequence>
      <Sequence from={ON} durationInFrames={30}>
        <Audio src={staticFile("sfx8/beep.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={at(9, "cheiro") - 6} durationInFrames={30}>
        <Audio src={staticFile("sfx8/sniff.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={LAND} durationInFrames={L(11) - LAND}>
        <Audio src={staticFile("sfx8/flock.mp3")} volume={(fr) => FX * 0.9 * (1 - ramp(fr, 60, L(11) - LAND))} loop />
      </Sequence>
      <Sequence from={L(10)} durationInFrames={L(12) - L(10)}>
        <Audio src={staticFile("sfx8/crowdcoo.mp3")} volume={FX * 0.5} loop />
      </Sequence>
      {[at(11, "sem"), at(11, "escuro"), at(11, "trezentos")].map((p, i) => (
        <Sequence key={"p" + i} from={p} durationInFrames={22}>
          <Audio src={staticFile("sfx7/pof.mp3")} volume={FX * 0.55} />
        </Sequence>
      ))}
      <Sequence from={pb - 2} durationInFrames={61}>
        <Audio src={staticFile("sfx7/confetti.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={at(12, "voltou") - 20} durationInFrames={45}>
        <Audio src={staticFile("sfx8/wings.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={at(12, "antena")} durationInFrames={60}>
        <Audio src={staticFile("sfx8/coo.mp3")} volume={FX * 0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
