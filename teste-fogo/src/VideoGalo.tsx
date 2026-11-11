import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import {Boy, Pose, Look} from "./Boy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {
  Sky, SunDisc, Clouds, SunLight, Town, groundY, groundAng, CANS, NEIGHBOR_POST, Rooster, RPose, Bicycle, Bill, Ticket, Melon, MelonTruck, PILE,
  Mini, SHIRTS, SKINS, HAIRS, Sea, Sand, sandY, SandWall, WALL_Z, Hotel, Umbrella, Towel, BeachChair, PalmTree, House, Bucket, Shovel, Bus, Bedroom, Blanket, SILL, TrashCan, lp, V3,
} from "./Sets5";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut, rng} from "./util";
import W from "./timingGalo.json";

type Wd = {w: string; s: number; e: number; line: number};
const words = W as Wd[];

/* ---------- linha do tempo amarrada na narração ---------- */
const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_GALO = F(words[words.length - 1].e + 1.6);

/* ---------- personagem: estilo low-poly, cabeção, camiseta amarela, bermuda azul ---------- */
const KID: Look = {lowpoly: true, headScale: 1.38, skin: "#f3c193", shirt: "#ffc928", trim: "#e9a514", pants: "#2f6bd1", shorts: true, hair: "#5a3418", hairStyle: "spiky"};

const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const walkP = (f: number, a: number, rate = 1.6): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * rate;
  return {walk: ph, walkAmt: 1, rShoulder: [Math.sin(ph) * 0.4, 0, -0.1], lShoulder: [-Math.sin(ph) * 0.4, 0, 0.1], rElbow: -0.4, lElbow: -0.4};
};
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
/** mãos juntas implorando */
const plead = (f: number): Pose => ({rShoulder: [-1.05 + 0.08 * Math.sin(f / 4), 0.0, -0.42], lShoulder: [-1.05 + 0.08 * Math.sin(f / 4), 0, 0.42], rElbow: -1.15, lElbow: -1.15, rWrist: [0, 0, 0.4], lWrist: [0, 0, -0.4], brow: 0.8, smile: 0.2});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

/* ---------- câmera com "soco" de zoom no corte ---------- */
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

/** coloca filhos na palma da mão */
const AtPalm: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.set(v.x + offset[0], v.y + offset[1], v.z + offset[2]);
  }, -1);
  return <group ref={g}>{children}</group>;
};

/* ---------- ambientes ---------- */
const DayTown: React.FC<{t: number; target: V3; cans?: number[]; front?: boolean; ext?: number}> = ({t, target, cans, front, ext = 10}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 35, 120]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.15]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.7} ext={ext} />
    <Town t={t} cans={cans} frontHouses={front} />
  </>
);

/* praia: areia, mar, rua da orla com casas, guarda-sóis */
const UMBS = (() => {
  const r = rng(31);
  const cols: [string, string][] = [["#e74c3c", "#ffffff"], ["#3498db", "#ffffff"], ["#f1c40f", "#e67e22"], ["#9b59b6", "#ffffff"], ["#1abc9c", "#ffffff"], ["#ff6f91", "#ffe066"]];
  const out: {p: V3; c: [string, string]; towel: string}[] = [];
  for (let i = 0; i < 16; i++) {
    const x = -11 + (i % 8) * 3.1 + (r() - 0.5) * 1.2;
    const z = i < 8 ? 3 + r() * 2.5 : 10.5 + r() * 4;
    if (Math.abs(x + 2.5) < 1.6 && z > 9 && z < 12.5) continue;
    if (Math.abs(x - 2) < 1.5 && z > 9.5 && z < 12.5) continue;
    if (x > 2.6 && x < 7.6 && z > 11.5) continue;
    if (Math.abs(x - 1) < 1.6 && z > 9 && z < 11.5) continue;
    out.push({p: [x, sandY(z), z], c: cols[i % cols.length], towel: SHIRTS[(i * 3) % SHIRTS.length]});
  }
  return out;
})();
const Beach: React.FC<{t: number; sea?: number; wall?: number; target?: V3; dir?: V3; ext?: number; sun?: number; hemi?: number; noUmb?: boolean}> = ({t, sea = 0, wall = 0, target = [0, 0, 8], dir = [-5, 11, 6], ext = 14, sun = 2.7, hemi = 1.15, noUmb}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 40, 140]} />
    <SunDisc p={[-30, 40, -120]} r={6} />
    <hemisphereLight args={["#d6ecff", "#c9a874", hemi]} />
    <SunLight target={target} dir={dir} intensity={sun} ext={ext} />
    <Sand />
    <Sea t={t} y={sea} />
    <SandWall h={wall} />
    <Hotel p={[5.0, sandY(14), 14]} />
    {/* rua da orla */}
    <mesh position={[0, sandY(18.5) + 0.08, 18.5]} material={lp("#5b5f69", 0.9)} receiveShadow>
      <boxGeometry args={[120, 0.16, 3.4]} />
    </mesh>
    <mesh position={[0, sandY(16.4) + 0.12, 16.4]} material={lp("#dcd5c6")} receiveShadow>
      <boxGeometry args={[120, 0.24, 1.0]} />
    </mesh>
    {[-24, -19, -14, -9, -4.5, 0.5, 5.5, 14, 19, 24].map((x, i) => (
      <House key={i} p={[x, sandY(23.5), 23.5]} rotY={Math.PI} wall={["#f7d08a", "#a9d9ee", "#f4a6a0", "#c5e8a8", "#fbe3c0", "#c3b4e4"][i % 6]} roof={["#d9534f", "#e67e22", "#c0392b"][i % 3]} h={i % 2 ? 4.2 : 2.7} />
    ))}
    {[-13, -7.5, 12.5, 17].map((x, i) => (
      <PalmTree key={i} p={[x, sandY(15), 15]} lean={i % 2 ? -0.22 : 0.22} s={1.15} />
    ))}
    {!noUmb &&
      UMBS.map((u, i) => (
        <group key={i}>
          <Umbrella p={[u.p[0], u.p[1] - 0.05, u.p[2]]} a={u.c[0]} b={u.c[1]} />
          <Towel p={[u.p[0] + 0.7, u.p[1] + 0.02, u.p[2] + 0.4]} c={u.towel} r={0.2} />
        </group>
      ))}
    <Clouds t={t} z={-70} y={18} />
  </>
);

const RoomScene: React.FC<{t: number; night?: number; clock?: number}> = ({t, night = 0, clock = 0}) => (
  <>
    {night > 0.5 ? <Sky top="#18234f" bottom="#f0a060" /> : <Sky />}
    <hemisphereLight args={[night > 0.5 ? "#8fa2e0" : "#fff4e0", night > 0.5 ? "#3a3050" : "#b08a60", night > 0.5 ? 1.1 : 1.05]} />
    <pointLight position={[1.2, 3.4, 1.0]} intensity={night > 0.5 ? 8 : 9} distance={9} decay={1.4} color={night > 0.5 ? "#9fb0ff" : "#fff1d6"} />
    <SunLight target={[-0.3, 0.6, -1.4]} dir={night > 0.5 ? [1.5, 3, -8] : [2.5, 6, -8]} intensity={night > 0.5 ? 1.2 : 2.4} color={night > 0.5 ? "#ffb070" : "#fff1d6"} ext={4} />
    <Bedroom t={t} night={night} clock={clock} />
  </>
);

/* menino deitado na cama */
const LIE_ROT = -(Math.PI / 2 - 0.3);
const LIE_POS: V3 = [-0.3, 0.42, -0.39];
const sleepPose = (f: number): Pose => ({blink: 1, mouthOpen: 0.12 + 0.1 * Math.sin(f / 9), breathe: Math.sin(f / 9), head: [0.1, 0, 0.12], rShoulder: [0.05, 0, -0.15], lShoulder: [0.05, 0, 0.15], rElbow: -0.1, lElbow: -0.1});
const Sleeping: React.FC<{f: number; pose?: Pose}> = ({f, pose}) => (
  <group position={LIE_POS} rotation={[LIE_ROT, 0, 0]}>
    <Boy pose={pose ?? sleepPose(f)} look={KID} />
  </group>
);

/* ======================= os planos ======================= */

/* 0 — dormindo; o relógio sonha com meio-dia */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, at(0, "primeiro"));
  return (
    <>
      <Cam pos={[lerp(0.75, 0.6, k), lerp(2.7, 2.5, k), lerp(2.7, 2.1, k)]} look={[-0.1, 1.15, -1.75]} fov={50} f={f} a={a} />
      <RoomScene t={t} clock={7 + 5 * easeInOut(ramp(f, a + 8, at(0, "meio") + 14))} />
      <Sleeping f={f} />
      <Blanket />
    </>
  );
};

/* galo no poste da cerca do vizinho; menino implorando */
const FenceShot: React.FC<ShotProps & {cam?: 0 | 1; bubbleAt: number; tired?: boolean; glassesAt?: number}> = ({f, a, t, cam = 0, bubbleAt, tired, glassesAt}) => {
  const boyPos: V3 = [-2.25, 0.08, -2.3];
  const pose = physics("fence" + a, (fr) => ({...idle(fr), ...plead(fr), pos: [boyPos[0], boyPos[1] + 0.03 * Math.abs(Math.sin(fr / 5)), boyPos[2]], rotY: -1.15, mouthOpen: talk(fr, a + 6, a + 40), bags: tired ? 1 : 0, blink: tired ? 0.35 + 0.65 * blinkCurve(fr) : blinkCurve(fr), torso: [0.12, 0, 0]}), a, f);
  const turn = ramp(f, bubbleAt - 6, bubbleAt + 6);
  const rp: RPose = {pos: NEIGHBOR_POST, rotY: 0.85, wingFwd: 0.85 * (1 - turn), headYaw: lerp(-0.9, 0.2, turn), headTilt: -0.15 * (1 - turn) + 0.1 * Math.sin(f / 7) * turn, blink: blinkCurve(f + 30), t, chest: 0.4, glasses: glassesAt ? pop(f, glassesAt, 8) : 0};
  const P = cam === 0 ? {pos: [-2.45, 1.65, 2.6] as V3, look: [-2.85, 1.3, -2.6] as V3, fov: 44} : {pos: [-2.3, 1.55, 1.2] as V3, look: [-2.85, 1.3, -2.65] as V3, fov: 44};
  return (
    <>
      <Cam pos={[P.pos[0] + 0.15 * ramp(f, a, a + 120), P.pos[1], P.pos[2] - 0.4 * ramp(f, a, a + 120)]} look={P.look} fov={P.fov} f={f} a={a} />
      <DayTown t={t} target={[-3, 0, -2.5]} ext={6} />
      <Boy pose={pose} look={KID} />
      <Rooster p={rp} s={1.25} />
    </>
  );
};
const S1: React.FC<ShotProps> = (p) => <FenceShot {...p} bubbleAt={at(0, "ferias")} />;

/* galo sem dinheiro: dá de ombros */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const sh = ramp(f, at(1, "nao") - 4, at(1, "nao") + 4) * (1 - ramp(f, at(1, "viajar") + 6, at(1, "viajar") + 14));
  const rp: RPose = {pos: NEIGHBOR_POST, rotY: 0.35, shrug: sh, headYaw: 0.35 * Math.sin((f - a) / 3) * ramp(f, at(1, "tem"), at(1, "tem") + 4) * (1 - ramp(f, at(1, "viajar"), at(1, "viajar") + 8)), blink: blinkCurve(f), t, beakOpen: talk(f, at(1, "dinheiro"), at(1, "viajar")) * 0.6, headTilt: 0.15 * sh};
  return (
    <>
      <Cam pos={[-2.45, 1.75, -1.0]} look={[-3.4, 1.6, -3.0]} fov={40} f={f} a={a} />
      <DayTown t={t} target={[-3, 0, -2.5]} ext={5} />
      <Rooster p={rp} s={1.25} />
    </>
  );
};

/* vende a bicicleta */
const BUYER = {shirt: "#2ecc71", pants: "#3b3b4a", skin: "#c68a5a", hair: "#1a1a1a", cap: "#e74c3c"};
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const sell = at(1, "vende");
  const cash = at(1, "bicicleta");
  const push = ramp(f, sell, sell + 10);
  const leave = ramp(f, cash + 12, cash + 40);
  const bx = lerp(-7.75, -7.05, push) + leave * 2.5;
  const pose = physics("sell" + a, (fr) => {
    const give = ramp(fr, sell - 2, sell + 8) * (1 - ramp(fr, cash - 2, cash + 4));
    const hold = ramp(fr, cash, cash + 6);
    return {
      ...idle(fr),
      pos: [-8.3, 0.08, -1.95],
      rotY: 0.95,
      rShoulder: [-0.6 - 0.6 * give - 1.6 * hold, 0, -0.15 - 0.3 * hold],
      lShoulder: [-0.6 - 0.6 * give, 0, 0.15],
      rElbow: -0.5 + 0.2 * hold,
      lElbow: -0.5,
      rFist: hold,
      smile: 0.4 + 0.5 * hold,
      eyeWide: 0.6 * pop(fr, cash, 8) * (1 - ramp(fr, cash + 10, cash + 20)),
      mouthOpen: talk(fr, a + 4, sell) + 0.5 * pop(fr, cash, 8) * (1 - ramp(fr, cash + 10, cash + 18)),
    };
  }, a, f);
  const bills = Array.from({length: 7}, (_, i) => {
    const k = clamp((f - cash - i) / 18);
    if (k <= 0) return null;
    const r = rng(i * 13 + 5);
    const x0 = -6.7;
    const x1 = -8.1 + (r() - 0.5) * 0.6;
    return <Bill key={i} p={[lerp(x0, x1, k), 1.4 + Math.sin(k * Math.PI) * (0.9 + r() * 0.5), -1.9 + (r() - 0.5) * 0.4]} r={[k * 6 + i, k * 4, k * 3 + i]} s={1.1} />;
  });
  return (
    <>
      <Cam pos={[-7.35, 1.55, 3.5]} look={[-7.35, 1.15, -1.9]} fov={44} f={f} a={a} />
      <DayTown t={t} target={[-7.5, 0, -2]} ext={6} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      {f >= cash + 6 && (
        <AtPalm palm={palm}>
          {[0, 1, 2].map((i) => (
            <Bill key={i} p={[0.02 * i, 0.06 + 0.02 * i, 0.03]} r={[0.3, 0.2, 0.7 - i * 0.35]} s={0.9} />
          ))}
        </AtPalm>
      )}
      <Bicycle p={[bx, 0.08, -1.55]} rotY={0} spin={leave * 9} />
      <Mini p={[-6.55 + leave * 2.5, 0.08, -2.0]} rotY={leave > 0.02 ? Math.PI / 2 : -1.35} {...BUYER} ph={(f - a) / 3} amt={leave > 0.02 ? 1 : 0} arms={0.25 * ramp(f, sell, sell + 8) * (1 - ramp(f, cash + 8, cash + 14))} s={1.12} t={t} />
      {bills}
    </>
  );
};

/* entrega a passagem pro galo */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const tk = at(1, "passagem");
  const pose = physics("give" + a, (fr) => {
    const reach = ramp(fr, a + 4, tk) * (1 - ramp(fr, tk + 10, tk + 22));
    return {...idle(fr), pos: [-2.25, 0.08, -2.3], rotY: -1.15, rShoulder: [-0.5 - 1.1 * reach, 0, -0.1], rElbow: -0.6 + 0.4 * reach, rFist: 0.6, smile: 0.6, mouthOpen: talk(fr, a + 2, tk)};
  }, a, f);
  const has = f >= tk + 2;
  const rp: RPose = {pos: NEIGHBOR_POST, rotY: 0.85, headYaw: 0.1, wingFwd: has ? 0.5 : 0, flap: has ? 0.35 * (1 - ramp(f, tk + 6, tk + 24)) : 0, flapPh: f * 1.4, blink: blinkCurve(f), t, ticket: has, chest: 0.3 + 0.4 * ramp(f, tk, tk + 10)};
  return (
    <>
      <Cam pos={[-2.25, 1.55, 1.0]} look={[-2.85, 1.3, -2.65]} fov={42} f={f} a={a} />
      <DayTown t={t} target={[-3, 0, -2.5]} ext={5} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      {!has && (
        <AtPalm palm={palm} offset={[0, 0.02, 0]}>
          <Ticket r={[0.3, 0.6, 0.2]} />
        </AtPalm>
      )}
      <Rooster p={rp} s={1.25} />
    </>
  );
};

/* investimento avícola: galo orgulhoso com a passagem */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const rp: RPose = {pos: NEIGHBOR_POST, rotY: 0.25, ticket: true, wingFwd: 0.55, chest: 1, glasses: pop(f, a + 18, 8), headTilt: -0.12, headYaw: 0.15 * Math.sin((f - a) / 9), blink: blinkCurve(f), t, flap: 0.25 * (0.5 + 0.5 * Math.sin((f - a) / 4)) * (1 - ramp(f, a + 30, a + 40)), flapPh: f * 1.2};
  return (
    <>
      <Cam pos={[-2.7, 1.75, -0.75]} look={[-3.4, 1.85, -3.0]} fov={42} f={f} a={a} />
      <DayTown t={t} target={[-3, 0, -2.5]} ext={5} />
      <Rooster p={rp} s={1.25} />
    </>
  );
};

/* sem bicicleta: andando com o galo na cabeça; placa da rodoviária */
const RIDE_HEAD = 2.08;
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const x0 = -21.5;
  const bx = x0 + (f - a) * 0.042;
  const pose = physics("walk" + a, (fr) => {
    const w = walkP(fr, a, 1.25);
    return {...idle(fr), ...w, pos: [x0 + (fr - a) * 0.042, 0.08, 1.95], rotY: Math.PI / 2, torso: [0.22, 0, 0], head: [0.2, 0, 0], brow: 0.6, mouthOpen: 0.15 + 0.1 * Math.abs(Math.sin(fr / 6)), blink: 0.25 + 0.75 * blinkCurve(fr)};
  }, a, f);
  const walk = pose.walk ?? 0;
  const bob = 0.025 * (Math.cos(2 * walk) - 1);
  const drops = [0, 1, 2].map((i) => {
    const k = (((f - a) / 16 + i / 3) % 1);
    return (
      <mesh key={i} position={[bx + 0.42 + 0.05 * i, 1.85 - k * 0.6, 1.95 + 0.3]} scale={[0.04, 0.06, 0.04]} material={lp("#7fd0ff", 0.2)}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    );
  });
  return (
    <>
      <Cam pos={[bx + 0.3, 1.75, 7.6]} look={[bx + 0.1, 1.65, -1.0]} fov={46} f={f} a={a} />
      <DayTown t={t} target={[bx, 0, 0]} ext={7} />
      <Boy pose={pose} look={KID} />
      {/* o galo sentado na cabeça, balançando junto */}
      <group position={[bx + 0.06, RIDE_HEAD + bob, 1.95]}>
        <Rooster p={{rotY: Math.PI / 2, sit: 1, t, blink: blinkCurve(f + 11), glasses: 1, ticket: true, wingFwd: 0.5, lean: -0.05 * Math.sin(walk * 2), chest: 0.5}} s={0.95} />
      </group>
      {drops}
    </>
  );
};

/* carona no caminhão de melancia */
const TRUCK_STOP_G = -13.6;
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const arrive = at(3, "caminhao") - 4;
  const k = ramp(f, a, arrive, easeOut);
  const tx = lerp(TRUCK_STOP_G - 16, TRUCK_STOP_G, k);
  const thumbs = ramp(f, at(3, "pega") - 4, at(3, "pega") + 4);
  const pose = physics("hitch" + a, (fr) => ({
    ...idle(fr),
    pos: [-11.2, 0.08, 2.05],
    rotY: -0.75 + 0.35 * ramp(fr, arrive, arrive + 10),
    rShoulder: [-0.3 * thumbs, 0, -0.15 - 1.25 * thumbs],
    rElbow: -0.25,
    rFist: thumbs,
    rWrist: [0, -0.8 * thumbs, 0],
    smile: 0.3 + 0.6 * ramp(fr, arrive, arrive + 8),
    eyeWide: 0.6 * ramp(fr, at(3, "melancia"), at(3, "melancia") + 6),
    mouthOpen: 0.4 * ramp(fr, at(3, "melancia"), at(3, "melancia") + 6),
    brow: 0.6,
  }), a, f);
  const zoom = ramp(f, at(3, "melancia") - 2, at(3, "melancia") + 14, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-9.0, -11.0, zoom), lerp(1.8, 2.2, zoom), lerp(6.8, 4.0, zoom)]} look={[lerp(-12.6, -13.6, zoom), lerp(1.3, 1.25, zoom), lerp(0.4, 0.1, zoom)]} fov={48} f={f} a={a} />
      <DayTown t={t} target={[-12, 0, 0]} ext={8} />
      <MelonTruck p={[tx, 0, 0]} spin={-(tx / 0.4)} />
      <Boy pose={pose} look={KID} />
      <group position={[-11.2 + 0.0, RIDE_HEAD, 2.05]}>
        <Rooster p={{rotY: -0.6, sit: 1, t, blink: blinkCurve(f + 11), glasses: 1, ticket: true, wingFwd: 0.5, chest: 0.5, headYaw: -0.5 * ramp(f, arrive - 10, arrive)}} s={0.95} />
      </group>
    </>
  );
};

/* caminhão andando (logística frutífera) e depois freando na descida */
const BRAKE = at(5, "freia");
const T_STOP = 2.2;
const truckX = (f: number) => (f < BRAKE ? T_STOP - 0.7 - (3.4 * (BRAKE - f)) / 30 : T_STOP - 0.7 + 0.7 * easeOut(clamp((f - BRAKE) / 12)));
const truckTilt = (f: number) => groundAng(truckX(f)) - 0.09 * Math.sin(Math.PI * clamp((f - BRAKE) / 16)) * (f > BRAKE ? 1 : 0);
/* simulação das melancias pulando por cima da cabine e rolando ladeira abaixo */
const NM = 40;
const SIM0 = BRAKE + 4;
const SIM1 = L(7) + 4;
const MR = 0.24;
type MS = {x: number; y: number; z: number; roll: number};
const MELONS: (MS | null)[][] = (() => {
  const out: (MS | null)[][] = [];
  const dt = 1 / FPS;
  for (let i = 0; i < NM; i++) {
    const r = rng(i * 31 + 7);
    const L0 = SIM0 + Math.floor(i * 1.6);
    let x = T_STOP + 0.2 + (r() - 0.5) * 1.6;
    let z = (r() - 0.5) * 1.1;
    let y = groundY(x) + 1.7 + r() * 0.5;
    let vx = 4.6 + r() * 2.2;
    let vy = 2.4 + r() * 1.8;
    let vz = (r() - 0.5) * 1.4;
    let roll = r() * 6;
    const arr: (MS | null)[] = [];
    for (let fr = SIM0; fr <= SIM1; fr++) {
      if (fr < L0) {
        arr.push(null);
        continue;
      }
      vy -= 9.8 * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      const gy = groundY(x) + MR;
      const sl = Math.tan(groundAng(x));
      if (y <= gy) {
        y = gy;
        const vn = vy - sl * vx;
        if (vn < -1.2) vy = sl * vx - 0.38 * vn;
        else vy = sl * vx;
        vx += (-9.8 * sl) / (1 + sl * sl) * 0.65 * dt;
        vx *= 0.997;
      }
      if (Math.abs(z) > 1.3) {
        z = Math.sign(z) * 1.3;
        vz = -vz * 0.5;
      }
      roll += (vx * dt) / MR;
      arr.push({x, y, z, roll});
    }
    out.push(arr);
  }
  return out;
})();
const melonAt = (i: number, f: number) => {
  const k = Math.round(f) - SIM0;
  if (k < 0) return null;
  return MELONS[i][Math.min(k, MELONS[i].length - 1)];
};
const launched = (f: number) => MELONS.filter((m) => {
  const k = Math.round(f) - SIM0;
  return k >= 0 && m[Math.min(k, m.length - 1)] !== null;
}).length;

const Riders: React.FC<{f: number; t: number; a: number; brace?: number}> = ({f, t, a, brace = 0}) => {
  const wind = Math.sin(f / 2.5);
  const pose: Pose = {
    ...idle(f),
    pos: [-0.75, 1.48, -0.25],
    rotY: Math.PI / 2 - 0.25,
    legLift: 1.25,
    torso: [-0.15 + 0.5 * brace, 0, 0],
    rShoulder: [-0.4 - 1.6 * brace, 0, -0.3 - 0.8 * (1 - brace) * (0.5 + 0.5 * Math.sin(f / 6))],
    lShoulder: [-0.4 - 1.6 * brace, 0, 0.3],
    rElbow: -0.3,
    lElbow: -0.3,
    smile: 0.9 * (1 - brace),
    mouthOpen: 0.25 * (1 - brace) + 0.7 * brace,
    eyeWide: brace,
    hair: [-0.25 + 0.05 * wind, 0.05 * wind],
    hairLift: 0.3,
  };
  return (
    <>
      <Boy pose={pose} look={KID} />
      <Rooster p={{pos: [-0.05, 1.5, 0.35], rotY: Math.PI / 2 - 0.2, sit: 1, t, glasses: 1, ticket: true, wingFwd: 0.4 + 0.5 * brace, chest: 0.6, lean: 0.35 * brace, blink: blinkCurve(f + 11), flap: 0.6 * brace, flapPh: f * 2}} s={0.95} />
    </>
  );
};

const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const tx = truckX(f);
  return (
    <>
      <Cam pos={[tx + 0.6, groundY(tx) + 3.0, 7.8]} look={[tx - 0.4, groundY(tx) + 2.3, 0]} fov={46} f={f} a={a} />
      <DayTown t={t} target={[tx, groundY(tx), 0]} ext={8} />
      <MelonTruck p={[tx, groundY(tx), 0]} tilt={truckTilt(f)} spin={-(tx / 0.4)}>
        <Riders f={f} t={t} a={a} />
      </MelonTruck>
    </>
  );
};

const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const tx = truckX(f);
  const brace = ramp(f, BRAKE, BRAKE + 5);
  const jump = pop(f, BRAKE + 1, 10) * (1 - ramp(f, BRAKE + 10, BRAKE + 24));
  const left = Math.max(0, PILE.length - Math.round((launched(f) / NM) * PILE.length));
  const sh = shake(f, 0.05 * Math.exp(-Math.max(0, f - BRAKE) / 10) * (f > BRAKE ? 1 : 0));
  return (
    <>
      <Cam pos={[tx + 4.4 + sh[0], groundY(tx) + 2.5 + sh[1], 5.6]} look={[tx + 0.3, groundY(tx) + 1.3, 0]} fov={50} f={f} a={a} />
      <DayTown t={t} target={[tx + 2, groundY(tx + 2), 0]} ext={9} />
      <MelonTruck p={[tx, groundY(tx), 0]} tilt={truckTilt(f)} spin={-(tx / 0.4)} melons={left} jump={jump}>
        <Riders f={f} t={t} a={a} brace={brace} />
      </MelonTruck>
      {Array.from({length: NM}, (_, i) => {
        const m = melonAt(i, f);
        return m ? <Melon key={i} p={[m.x, m.y, m.z]} roll={m.roll} /> : null;
      })}
    </>
  );
};

/* melancias descendo a ladeira em direção à câmera */
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const tx = truckX(f);
  const left = Math.max(0, PILE.length - Math.round((launched(f) / NM) * PILE.length));
  const cx = lerp(15.5, 17.5, ramp(f, a, a + 110));
  return (
    <>
      <Cam pos={[cx, groundY(cx) + 1.05, 2.6]} look={[cx - 9, groundY(cx - 9) + 0.9, -0.2]} fov={50} f={f} a={a} />
      <DayTown t={t} target={[cx - 5, groundY(cx - 5), 0]} ext={12} />
      <MelonTruck p={[tx, groundY(tx), 0]} tilt={truckTilt(f)} melons={left}>
        <Riders f={f} t={t} a={a} brace={1} />
      </MelonTruck>
      {Array.from({length: NM}, (_, i) => {
        const m = melonAt(i, f);
        return m ? <Melon key={i} p={[m.x, m.y, m.z]} roll={m.roll} /> : null;
      })}
    </>
  );
};

/* efeito dominó: uma melancia sobe na calçada e derruba as lixeiras */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const hit = a + 16;
  const kx = f < hit ? lerp(3.0, CANS[0] - 0.5, clamp((f - a) / 16)) : CANS[0] - 0.5 - 0.4 * easeOut(clamp((f - hit) / 10));
  const cans = CANS.map((_, i) => {
    const s = hit + i * 5;
    const k = clamp((f - s) / 9);
    return k * k;
  });
  const cx = lerp(9.2, 11.4, ramp(f, a, b2(a)));
  const fg = Array.from({length: 10}, (_, i) => {
    const m = melonAt(i + 20, f - 40);
    return m ? <Melon key={i} p={[m.x, m.y, m.z]} roll={m.roll} /> : null;
  });
  return (
    <>
      <Cam pos={[cx, groundY(cx) + 1.9, 4.6]} look={[cx - 0.2, groundY(cx) + 0.5, -2.1]} fov={48} f={f} a={a} />
      <DayTown t={t} target={[cx, groundY(cx), -1]} cans={cans} ext={8} />
      <Melon p={[kx, groundY(kx) + 0.08 + MR, -2.05]} roll={(kx - 3) / MR} />
      {fg}
    </>
  );
};
const b2 = (a: number) => a + 80;

/* praia: melancias chegam e param; a cidade vem atrás */
const MELON_STOP = (i: number) => {
  const r = rng(i * 17 + 3);
  const col = i % 8;
  const row = Math.floor(i / 8);
  return {x: -4.4 + col * 0.52 + (r() - 0.5) * 0.25, z: 9.4 + row * 0.5 + (r() - 0.5) * 0.2, y: row % 2 ? 0.36 : 0, t0: L(7) + Math.floor(r() * 18), d: 18 + Math.floor(r() * 14), x0: -3 + (r() - 0.5) * 3, z0: 19 + r() * 2};
};
const beachMelon = (i: number, f: number) => {
  const m = MELON_STOP(i);
  const k = clamp((f - m.t0) / m.d);
  if (f < m.t0) return null;
  const e = easeOut(k);
  const x = lerp(m.x0, m.x, e);
  const z = lerp(m.z0, m.z, e);
  const y = sandY(z) + MR + m.y * e + 0.25 * Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k);
  return {x, y, z, roll: -(m.z0 - z) / MR};
};
const BeachMelons: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: NM}, (_, i) => {
      const m = beachMelon(i, f);
      return m ? <Melon key={i} p={[m.x, m.y, m.z]} roll={m.roll} yaw={Math.PI / 2} /> : null;
    })}
  </>
);

/* gente correndo pra água */
const CROWD = Array.from({length: 38}, (_, i) => {
  const r = rng(i * 7 + 101);
  return {
    x: (r() - 0.5) * 18,
    z0: 20.5 + r() * 2,
    zEnd: -1.5 - r() * 9,
    s: at(7, "cidade") - 6 + Math.floor(r() * 60),
    v: 6.5 + r() * 2,
    shirt: SHIRTS[i % SHIRTS.length],
    skin: SKINS[(i * 3) % SKINS.length],
    hair: HAIRS[(i * 5) % HAIRS.length],
    pants: ["#3b4a6b", "#2c2c34", "#7a5a3a", "#1f6fb2", "#c0392b"][i % 5],
    sc: 1.0 + r() * 0.18,
    wph: r() * 6,
    drift: (r() - 0.5) * 3,
  };
});
const Crowd: React.FC<{f: number; t: number; look?: number; only?: number}> = ({f, t, look = 0, only = CROWD.length}) => (
  <>
    {CROWD.slice(0, only).map((c, i) => {
      if (f < c.s - 2) return null;
      const run = Math.max(0, (f - c.s) / FPS) * c.v;
      const z = Math.max(c.zEnd, c.z0 - run);
      const moving = z > c.zEnd;
      const k = clamp((c.z0 - z) / (c.z0 - c.zEnd));
      const x = c.x + c.drift * k;
      const y = Math.max(sandY(z), z > 16 ? sandY(16.4) + 0.24 : -99);
      return (
        <Mini key={i} p={[x, y, z]} rotY={moving ? Math.PI : Math.PI + 0.5 * Math.sin(c.wph)} shirt={c.shirt} pants={c.pants} skin={c.skin} hair={c.hair} ph={f / 2.6 + c.wph} amt={moving ? 1 : 0} arms={moving ? 0.35 * (i % 3 === 0 ? 1 : 0) : 0.9 * (i % 2)} wave={moving ? 0 : 1} look={look} s={c.sc} t={t + c.wph} />
      );
    })}
  </>
);

const S12: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[1.6, 1.35, 5.8]} look={[-2.2, 0.6, 12.5]} fov={46} f={f} a={a} />
    <Beach t={t} target={[-2, 0, 11]} />
    <BeachMelons f={f} />
  </>
);
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.8, 1.15, 6.4]} look={[0.2, 1.5, 17]} fov={50} f={f} a={a} />
    <Beach t={t} target={[0, 0, 12]} ext={16} />
    <BeachMelons f={f} />
    <Crowd f={f} t={t} />
  </>
);
/* migração de verão: vista alta */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 80);
  return (
    <>
      <Cam pos={[lerp(2, 0, k), lerp(10, 11.5, k), lerp(20.5, 19.5, k)]} look={[0, 0, lerp(-1, -3, k)]} fov={50} f={f} a={a} />
      <Beach t={t} target={[0, 0, 6]} ext={20} />
      <BeachMelons f={f} />
      <Crowd f={f} t={t} />
    </>
  );
};
/* o mar sobe */
const SEA_UP = at(9, "sobe");
const seaLevel = (f: number) => 0.3 * easeInOut(ramp(f, SEA_UP - 10, SEA_UP + 22));
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const sh = shake(f, 0.04 * ramp(f, SEA_UP - 8, SEA_UP) * (1 - ramp(f, SEA_UP + 20, SEA_UP + 30)));
  return (
    <>
      <Cam pos={[1.4 + sh[0], 1.25 + sh[1], 10.5]} look={[-0.3, 0.2, -2]} fov={48} f={f} a={a} />
      <Beach t={t} sea={seaLevel(f)} target={[0, 0, 4]} ext={16} noUmb />
      {UMBS.filter((u) => u.p[2] < 7).map((u, i) => (
        <Umbrella key={i} p={[u.p[0], u.p[1] - 0.05, u.p[2]]} a={u.c[0]} b={u.c[1]} />
      ))}
      <BeachMelons f={f} />
      <Crowd f={f} t={t} />
    </>
  );
};

/* o muro de areia: o menino com pá e balde; muro cresce até a altura do prédio */
const WALL_H = 10;
const wallH = (f: number) => {
  const k = clamp((f - at(9, "constroi") + 4) / (at(9, "predio") + 8 - at(9, "constroi") + 4));
  const steps = 7;
  const s = Math.floor(k * steps);
  return WALL_H * Math.min(1, (s + easeOut((k * steps) % 1)) / steps);
};
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("dig" + a, (fr) => {
    const c = ((fr - a) % 14) / 14;
    const up = c < 0.5 ? easeInOut(c * 2) : 1 - easeInOut((c - 0.5) * 2);
    return {...idle(fr), pos: [0.6, sandY(10.0), 10.0], rotY: 2.55, rShoulder: [-0.4 - 1.6 * up, 0, -0.2], lShoulder: [-0.4 - 1.6 * up, 0, 0.2], rElbow: -0.5 + 0.3 * up, lElbow: -0.5 + 0.3 * up, rFist: 1, torso: [0.35 - 0.45 * up, 0, 0], smile: 0.5, brow: 0.5, mouthOpen: 0.2 * up};
  }, a, f);
  const pull = ramp(f, at(9, "tamanho") - 4, at(9, "predio") + 12, easeInOut);
  const puffs = Array.from({length: 6}, (_, i) => {
    const k = (((f - a) / 14 + i / 6) % 1);
    return (
      <mesh key={i} position={[0.3 + Math.sin(i * 2) * 0.8, sandY(8.6) + wallH(f) * 0.6 + k * 1.2, 8.4]} scale={0.25 * (1 - k) + 0.05} material={lp("#f3d697", 1)}>
        <icosahedronGeometry args={[1, 0]} />
      </mesh>
    );
  });
  return (
    <>
      <Cam pos={[lerp(4.5, 3.2, pull), lerp(1.7, 6.5, pull), lerp(13.4, 21, pull)]} look={[lerp(0.5, 1.6, pull), lerp(1.4, 5.0, pull), lerp(8.5, 7.5, pull)]} fov={48} f={f} a={a} />
      <Beach t={t} sea={0.3} wall={wallH(f)} target={[0, 0, 9]} ext={16} />
      <BeachMelons f={f} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      <AtPalm palm={palm}>
        <Shovel r={[0.4, 0, 0.3]} s={1.6} />
      </AtPalm>
      <Bucket p={[1.2, sandY(10.2) + 0.2, 10.3]} s={1.4} />
      {puffs}
    </>
  );
};

/* engenharia de balde: o menino no topo do muro */
const TOP = sandY(WALL_Z) + WALL_H;
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("top" + a, (fr) => ({...idle(fr), pos: [0.3, TOP, WALL_Z + 0.05], rotY: 0.35, rShoulder: [-2.6 + 0.15 * Math.sin(fr / 5), 0, -0.3], rElbow: -0.2, rFist: 1, lShoulder: [-0.2, 0, 0.5], lElbow: -1.4, smile: 1, brow: 0.6, hair: [0.1 * Math.sin(fr / 3), 0.08 * Math.sin(fr / 4)]}), a, f);
  const k = ramp(f, a, a + 70);
  return (
    <>
      <Cam pos={[lerp(2.0, 1.6, k), TOP + lerp(1.0, 1.6, k), WALL_Z + lerp(4.6, 3.8, k)]} look={[0.25, TOP + 1.0, WALL_Z - 0.4]} fov={48} f={f} a={a} />
      <Beach t={t} sea={0.3} wall={WALL_H} target={[0, TOP, WALL_Z]} dir={[-4, 9, 7]} ext={8} />
      <Boy pose={pose} look={KID} palmRef={palm} />
      <AtPalm palm={palm}>
        <Shovel r={[Math.PI, 0, 0.2]} s={1.6} />
      </AtPalm>
      <Bucket p={[-0.45, TOP + 0.2, WALL_Z + 0.35]} s={1.4} />
    </>
  );
};

/* a sombra do muro cobre a praia */
const SHADE = (f: number) => ramp(f, at(11, "sombra") - 10, at(11, "inteira") + 10, easeInOut);
const shadeDir = (k: number): V3 => [lerp(-3, 0, k), lerp(16, 9, k), lerp(5, -16, k)];
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const k = SHADE(f);
  return (
    <>
      <Cam pos={[-6.5, 9, 21]} look={[0.5, 0.5, 8.5]} fov={50} f={f} a={a} />
      <Beach t={t} sea={0.3} wall={WALL_H} target={[0, 0, 13]} dir={shadeDir(k)} ext={22} sun={lerp(2.7, 2.2, k)} hemi={lerp(1.15, 0.9, k)} />
      <BeachMelons f={f} />
      {CROWD.slice(0, 14).map((c, i) => (
        <Mini key={i} p={[-9 + (i % 7) * 3 + (i > 6 ? 1.4 : 0), sandY(10 + (i > 6 ? 3 : 0)), 10 + (i > 6 ? 3 : 0)]} rotY={Math.PI + 0.3 * Math.sin(i)} shirt={c.shirt} pants={c.pants} skin={c.skin} hair={c.hair} look={0.6 * k} arms={i % 3 === 0 ? 0.4 * k : 0} s={c.sc} t={t} />
      ))}
    </>
  );
};

/* o galo tomando sol de óculos — e o frio */
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const shadeK = ramp(f, at(11, "oculos") + 6, at(11, "fica") + 2, easeInOut);
  const cold = ramp(f, at(11, "fica") - 2, at(11, "frio"));
  const chair: V3 = [2.0, sandY(10.8), 10.8];
  const rp: RPose = {pos: [chair[0], chair[1] + 0.3, chair[2] - 0.05], rotY: 0, sit: 1, lean: -0.35 * (1 - cold), glasses: 1, glassesUp: cold > 0.5, shiver: cold, t, wingFwd: lerp(-0.4, 1.1, cold), shrug: 0.6 * (1 - cold), blink: cold > 0.5 ? blinkCurve(f) : 0, chest: 0.6 * (1 - cold), beakOpen: cold * 0.3 * Math.abs(Math.sin(f * 1.6)), headTilt: -0.25 * (1 - cold)};
  return (
    <>
      <Cam pos={[2.8, 1.45, 13.3]} look={[2.0, 0.95, 10.8]} fov={44} f={f} a={a} />
      <Beach t={t} sea={0.3} wall={WALL_H} target={chair} dir={shadeDir(lerp(0.15, 1, shadeK))} ext={7} sun={lerp(2.9, 2.0, shadeK)} hemi={lerp(1.15, 0.75, shadeK)} />
      <BeachChair p={chair} c="#ff7f50" />
      <Rooster p={rp} s={1.3} />
      <Towel p={[0.7, sandY(11.2) + 0.02, 11.2]} c="#3498db" r={0.1} />
    </>
  );
};

/* ônibus de volta */
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const stop = at(12, "onibus") - 4;
  const k = ramp(f, a, stop, easeOut);
  const bx = lerp(16, 0, k);
  const door = ramp(f, stop + 2, stop + 8);
  const hopS = stop + 8;
  const hk = clamp((f - hopS) / 16);
  const startP: V3 = [-1.0, sandY(16.4) + 0.24, 16.9];
  const doorP: V3 = [-2.25, 1.45, 18.0];
  const rx = lerp(startP[0], doorP[0], hk);
  const rz = lerp(startP[2], doorP[2], hk);
  const ry = lerp(startP[1], doorP[1], hk) + Math.sin(hk * Math.PI) * 0.6;
  const inside = hk >= 1;
  return (
    <>
      <Cam pos={[2.6, 2.0, 10.6]} look={[-1.5, 1.4, 17.8]} fov={46} f={f} a={a} />
      <Beach t={t} sea={0.3} wall={WALL_H} target={[0, 0, 17]} dir={[-5, 11, 6]} ext={10} />
      <Bus p={[bx, sandY(18.5) + 0.16, 18.5]} rotY={Math.PI} spin={bx / 0.45} door={door} />
      {!inside && <Rooster p={{pos: [rx, ry, rz], rotY: -2.6, t, glasses: 1, glassesUp: true, shiver: 0.4, walk: f / 2.5, walkAmt: hk > 0 ? 0 : 1, flap: hk > 0 && hk < 1 ? 1 : 0, flapPh: f * 2.4, blink: blinkCurve(f)}} s={1.2} />}
    </>
  );
};
/* sentado do lado do motorista */
const S21: React.FC<ShotProps> = ({f, a, t}) => {
  const bx = -24 - (f - a) * 0.12;
  return (
    <>
      <Cam pos={[bx - 9.5, 2.2, 0.25]} look={[bx, 1.8, -0.1]} fov={42} f={f} a={a} />
      <DayTown t={t} target={[bx, 0, 0]} ext={9} front />
      <Bus p={[bx, 0, -0.1]} rotY={Math.PI} spin={-bx / 0.45}>
        <Mini p={[2.05, 0.93, -0.5]} rotY={Math.PI / 2} shirt="#f2f2f2" pants="#2c3e50" skin="#c68a5a" hair="#1a1a1a" cap="#2d7dd2" sit={1} arms={0.45} t={t} />
        <Rooster p={{pos: [2.05, 1.76, 0.5], rotY: Math.PI / 2 + 0.25 * Math.sin((f - a) / 18), sit: 1, t, glasses: 1, glassesUp: true, chest: 0.4, blink: blinkCurve(f + 5), headYaw: 0.4 * Math.sin((f - a) / 14)}} s={1.3} />
      </Bus>
    </>
  );
};

/* 05:00 — o galo pousa na janela */
const S22: React.FC<ShotProps> = ({f, a, t}) => {
  const land = at(13, "pousa") + 2;
  const k = clamp((f - (land - 26)) / 26);
  const e = easeOut(k);
  const p0: V3 = [2.4, 3.6, -6];
  const pos: V3 = [lerp(p0[0], SILL[0], e), lerp(p0[1], SILL[1], e) + Math.sin(k * Math.PI) * 0.4, lerp(p0[2], SILL[2], e)];
  const flying = f < land;
  return (
    <>
      <Cam pos={[0.75, 2.0, 1.55]} look={[-0.2, 1.35, -2.0]} fov={52} f={f} a={a} />
      <RoomScene t={t} night={1} clock={5} />
      <Sleeping f={f} />
      <Blanket />
      {f > land - 27 && <Rooster p={{pos, rotY: flying ? -0.5 : 0, flap: flying ? 1 : 0.4 * (1 - ramp(f, land, land + 12)), flapPh: f * 2.6, t, blink: blinkCurve(f), chest: 0.3, glasses: 1, glassesUp: true}} s={1.1} />}
    </>
  );
};
/* enche o peito... e canta */
const CANTA = at(13, "canta");
const S23: React.FC<ShotProps> = ({f, a, t}) => {
  const chest = ramp(f, at(13, "enche"), at(13, "peito") + 20, easeInOut);
  const wind = ramp(f, at(13, "e", 1) - 4, CANTA - 1);
  const crow = ramp(f, CANTA - 2, CANTA + 3) * (1 - ramp(f, CANTA + 30, CANTA + 40));
  const sh = shake(f, 0.03 * crow);
  const k = ramp(f, a, CANTA, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.3, 0.0, k) + sh[0], lerp(1.8, 1.9, k) + sh[1], lerp(0.5, -0.3, k)]} look={[-0.3, 2.0, -2.4]} fov={48} f={f} a={a} />
      <RoomScene t={t} night={1} clock={5} />
      <Rooster p={{pos: SILL, rotY: 0, chest: chest * (1 - 0.3 * crow), lean: 0.3 * wind * (1 - crow) - 0.15 * crow, crow, flap: crow * 0.9, flapPh: f * 1.8, t, blink: crow > 0.5 ? 1 : wind * 0.6, glasses: 1, glassesUp: true, beakOpen: crow}} s={1.1} />
      <Blanket />
    </>
  );
};
/* o menino pula da cama */
const S24: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(clamp((f - a) / 7));
  const pose = (fr: number): Pose => {
    const kk = easeOut(clamp((fr - a) / 7));
    return {
      blink: 0,
      eyeWide: 1,
      mouthOpen: 0.9,
      brow: 1,
      hairLift: 1,
      hair: [0.25 * Math.sin(fr / 2), 0.2 * Math.cos(fr / 2.5)],
      rShoulder: [-2.6 * kk, 0, -0.6],
      lShoulder: [-2.6 * kk, 0, 0.6],
      rElbow: -0.3,
      lElbow: -0.3,
      legLift: 0.6 * (1 - kk),
      squash: -0.12 * pop(fr, a, 8) * (1 - ramp(fr, a + 8, a + 14)),
    };
  };
  const p = physics("jump" + a, pose, a, f);
  const yUp = 0.46 + 0.6 * Math.sin(Math.PI * clamp((f - a) / 14)) * (f - a < 14 ? 1 : 0);
  const rot = lerp(LIE_ROT, 0, k);
  const pos: V3 = [lerp(LIE_POS[0], -0.3, k), lerp(LIE_POS[1], yUp, k), lerp(LIE_POS[2], -1.25, k)];
  const sh = shake(f, 0.04 * (1 - ramp(f, a + 6, a + 20)));
  return (
    <>
      <Cam pos={[0.7 + sh[0], 2.1 + sh[1], 3.1]} look={[-0.3, 1.7, -1.3]} fov={52} f={f} a={a} />
      <RoomScene t={t} night={1} clock={5} />
      <pointLight position={[0.3, 2.0, 1.4]} intensity={4} distance={5} color="#ffe2c0" />
      <group position={pos} rotation={[rot, 0, 0]}>
        <Boy pose={p} look={KID} />
      </group>
      <Blanket />
      <Rooster p={{pos: SILL, rotY: 0, crow: 1 - ramp(f, a + 6, a + 16), flap: 0.6, flapPh: f * 2, t, glasses: 1, glassesUp: true, beakOpen: 1 - ramp(f, a + 6, a + 16), chest: 0.6}} s={1.1} />
    </>
  );
};

/* parabéns: descabelado, olheiras */
const S25: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("parab" + a, (fr) => ({
    breathe: Math.sin(fr / 14),
    pos: [-0.3, -0.29, -0.05],
    rotY: 0,
    legLift: 1.55,
    torso: [0.28, 0, 0.05 * Math.sin(fr / 30)],
    head: [0.12, 0, 0.12 + 0.05 * Math.sin(fr / 25)],
    blink: 0.45 + 0.55 * blinkCurve(fr) + 0.3 * ramp(fr, a + 150, a + 170) * (1 - ramp(fr, a + 180, a + 190)),
    bags: 1,
    hairLift: 0.9,
    hair: [0.22, -0.2],
    rShoulder: [-0.25, 0, -0.18],
    lShoulder: [-0.25, 0, 0.18],
    rElbow: -0.7,
    lElbow: -0.7,
    mouthOpen: 0,
    smile: 0,
    brow: -0.2,
  }), a, f);
  const k = ramp(f, a, a + 240);
  return (
    <>
      <Cam pos={[lerp(0.15, 0.05, k), lerp(1.5, 1.45, k), lerp(4.3, 3.7, k)]} look={[-0.3, 1.15, -0.6]} fov={46} f={f} a={a} />
      <RoomScene t={t} night={1} clock={5} />
      <pointLight position={[0.3, 1.9, 1.6]} intensity={5} distance={5} color="#ffe2c0" />
      <Blanket />
      <Boy pose={pose} look={KID} />
      <Rooster p={{pos: SILL, rotY: 0, t, chest: 0.8, glasses: 1, glassesUp: true, blink: blinkCurve(f + 40), headYaw: 0.25 * Math.sin((f - a) / 20)}} s={1.1} />
    </>
  );
};
/* volta a deitar */
const S26: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 100);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.7, k), lerp(2.4, 2.2, k), lerp(1.8, 1.3, k)]} look={[-0.2, 1.15, -1.9]} fov={52} f={f} a={a} />
      <RoomScene t={t} night={1} clock={5} />
      <Sleeping f={f} pose={{...sleepPose(f), bags: 1, blink: f < a + 30 ? 0.5 + 0.5 * ramp(f, a + 10, a + 30) : 1}} />
      <Blanket />
      <Rooster p={{pos: SILL, rotY: 0.2, t, chest: 0.5, glasses: 1, glassesUp: true, blink: blinkCurve(f + 40), headTilt: 0.2 * Math.sin((f - a) / 10)}} s={1.1} />
    </>
  );
};
/* de novo: implorando pro galo */
const S27: React.FC<ShotProps> = (p) => <FenceShot {...p} cam={1} bubbleAt={at(15, "ferias")} tired glassesAt={at(15, "novo") - 2} />;

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: L(1), Comp: S2},
  {from: at(1, "entao"), Comp: S3},
  {from: at(1, "pra", 1), Comp: S4},
  {from: L(2), Comp: S5},
  {from: L(3), Comp: S6},
  {from: at(3, "entao"), Comp: S7},
  {from: L(4), Comp: S8},
  {from: L(5), Comp: S9},
  {from: at(5, "e", 0) + 0, Comp: S10},
  {from: L(6), Comp: S11},
  {from: L(7), Comp: S12},
  {from: at(7, "e", 0), Comp: S13},
  {from: L(8), Comp: S14},
  {from: L(9), Comp: S15},
  {from: at(9, "entao"), Comp: S16},
  {from: L(10), Comp: S17},
  {from: L(11), Comp: S18},
  {from: at(11, "e", 0), Comp: S19},
  {from: L(12), Comp: S20},
  {from: at(12, "sentado"), Comp: S21},
  {from: L(13), Comp: S22},
  {from: at(13, "enche"), Comp: S23},
  {from: CANTA + 18, Comp: S24},
  {from: L(14), Comp: S25},
  {from: L(15), Comp: S26},
  {from: at(15, "convencer"), Comp: S27},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_GALO} t={f / FPS} />
      <Post bloom={0.6} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const STROKE = {WebkitTextStroke: "14px #101018", paintOrder: "stroke fill" as const};
const KEY = new Set(
  ["meiodia", "galo", "ferias", "dinheiro", "bicicleta", "passagem", "investimento", "avicola", "rodoviaria", "caminhao", "melancia", "logistica", "frutifera", "freia", "quarenta", "melancias", "ladeira", "efeito", "domino", "tropical", "praia", "cidade", "migracao", "verao", "mar", "sobe", "muro", "areia", "predio", "engenharia", "balde", "sombra", "sol", "oculos", "frio", "onibus", "motorista", "cinco", "manha", "janela", "canta", "parabens", "madrugada", "novo"],
);

/** legenda de UMA palavra por vez */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let i = -1;
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    const next = words[k + 1];
    const end = next && next.s - w.e < 0.7 ? next.s : w.e + 0.3;
    if (t >= w.s - 0.03 && t < end - 0.03) i = k;
  }
  if (i < 0) return null;
  const w = words[i];
  const sc = pop(f, Math.round(w.s * FPS) - 1, 6);
  const txt = w.w.replace(/[.,!?…]+$/g, "").replace(/\.\.\.$/, "");
  const key = KEY.has(clean(w.w));
  return (
    <div style={{position: "absolute", top: 1235, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: txt.length > 10 ? 118 : 138, lineHeight: 1, textTransform: "uppercase", color: key ? "#FFD21F" : "#FFFFFF", ...STROKE, textShadow: "0 10px 22px rgba(0,0,0,0.5)", transform: `scale(${0.7 + 0.3 * sc}) rotate(${key ? -2 : 0}deg)`}}>
      {txt}
    </div>
  );
};

/** faixa amarela em arco no topo (nome da etapa) */
const Banner: React.FC<{from: number; to: number; text: string; n: number}> = ({from, to, text, n}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const inn = pop(f, from, 12);
  const out = ramp(f, to - 7, to);
  const wob = Math.sin((f - from) / 5) * 1.2 * (1 - ramp(f, from, from + 40));
  const size = text.length > 19 ? 70 : 80;
  return (
    <div style={{position: "absolute", top: 120, left: 0, right: 0, height: 420, transform: `scale(${inn * (1 - 0.3 * out)}) rotate(${wob}deg)`, opacity: 1 - out, transformOrigin: "50% 40%"}}>
      <svg width={1080} height={420} viewBox="0 0 1080 420">
        <defs>
          <path id={"arc" + n} d="M 95 300 Q 540 105 985 300" />
        </defs>
        {/* pontas da fita */}
        <path d="M 40 330 L 120 300 L 105 360 Z" fill="#c98f00" stroke="#101018" strokeWidth={8} strokeLinejoin="round" />
        <path d="M 1040 330 L 960 300 L 975 360 Z" fill="#c98f00" stroke="#101018" strokeWidth={8} strokeLinejoin="round" />
        <use href={"#arc" + n} stroke="#101018" strokeWidth={150} fill="none" strokeLinecap="round" />
        <use href={"#arc" + n} stroke="#FFD21F" strokeWidth={132} fill="none" strokeLinecap="round" />
        <use href={"#arc" + n} stroke="#FFE680" strokeWidth={20} fill="none" strokeLinecap="round" transform="translate(0,-40)" opacity={0.55} />
        <text fontFamily={fontFamily} fontWeight={900} fontSize={size} fill="#1b1430" letterSpacing={2} dy={size * 0.35}>
          <textPath href={"#arc" + n} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </svg>
      <div style={{position: "absolute", top: 30, left: 0, right: 0, textAlign: "center"}}>
        <span style={{fontFamily, fontWeight: 900, fontSize: 40, color: "#fff", background: "#101018", padding: "6px 22px", borderRadius: 30, letterSpacing: 4}}>ETAPA {n}</span>
      </div>
    </div>
  );
};

const Chip: React.FC<{from: number; to: number; text: string; bg: string; top?: number; size?: number; rot?: number}> = ({from, to, text, bg, top = 300, size = 84, rot = -3}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{transform: `scale(${pop(f, from, 10)}) rotate(${rot}deg)`, background: bg, color: "#fff", fontFamily, fontWeight: 900, fontSize: size, padding: "10px 44px", borderRadius: 22, border: "7px solid #101018", boxShadow: "0 10px 0 rgba(0,0,0,0.35)", WebkitTextStroke: "5px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

/** contador de melancias */
const MelonCount: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const n = Math.min(40, Math.round(40 * easeOut(clamp((f - from) / 40))));
  return <Chip from={from} to={to} text={`${n} MELANCIAS`} bg="#2fa84f" top={300} />;
};

/** balão de pensamento com a praia (férias) */
const Bubble: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 6, to));
  const sw = Math.sin(f / 6) * 3;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      <g transform={`translate(${x},${y}) scale(${s})`}>
        <circle cx={-150} cy={175} r={16} fill="#fff" stroke="#101018" strokeWidth={7} />
        <circle cx={-110} cy={120} r={26} fill="#fff" stroke="#101018" strokeWidth={7} />
        <ellipse cx={0} cy={0} rx={210} ry={150} fill="#fff" stroke="#101018" strokeWidth={9} />
        <clipPath id="bub">
          <ellipse cx={0} cy={0} rx={190} ry={132} />
        </clipPath>
        <g clipPath="url(#bub)">
          <rect x={-210} y={-150} width={420} height={170} fill="#8fd8ff" />
          <circle cx={110} cy={-60} r={42} fill="#ffd21f" />
          <rect x={-210} y={10} width={420} height={60} fill="#2bb0e0" />
          <rect x={-210} y={60} width={420} height={100} fill="#f3d697" />
          <path d={`M -80 95 Q -70 10 ${-50 + sw} -50`} stroke="#8a5a33" strokeWidth={16} fill="none" strokeLinecap="round" />
          {[-2.6, -1.9, -1.2, -0.5, 0.2].map((ang, i) => (
            <path key={i} d={`M ${-50 + sw} -50 q ${Math.cos(ang) * 40} ${Math.sin(ang) * 40 - 10} ${Math.cos(ang) * 80} ${Math.sin(ang) * 60 + 20}`} stroke="#3f9a3a" strokeWidth={16} fill="none" strokeLinecap="round" />
          ))}
          <path d="M 40 110 L 130 110 L 85 40 Z" fill="#e74c3c" />
          <rect x={83} y={40} width={5} height={70} fill="#fff" />
        </g>
      </g>
    </svg>
  );
};

/** "Zzz" saindo do menino dormindo */
const Zzz: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = (((f - from) / 45 + i / 3) % 1);
        return (
          <div key={i} style={{position: "absolute", left: x + k * 140 + Math.sin(k * 6) * 20, top: y - k * 260, fontFamily, fontWeight: 900, fontSize: 60 + k * 60, color: "#ffffff", ...STROKE, WebkitTextStroke: "9px #101018", opacity: Math.min(1, k * 5) * (1 - k), transform: `rotate(${-10 + k * 20}deg)`}}>
            Z
          </div>
        );
      })}
    </>
  );
};

const Rings: React.FC<{from: number; to: number; x: number; y: number; color?: string; speed?: number}> = ({from, to, x, y, color = "#ffffff", speed = 14}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 4), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = ((f - from) / speed + i / 4) % 1;
        return <circle key={i} cx={x} cy={y} r={lerp(40, 700, k)} fill="none" stroke={color} strokeWidth={16 * (1 - k) + 3} opacity={1 - k} />;
      })}
    </svg>
  );
};

/** estrelinhas de brilho */
const Sparkles: React.FC<{from: number; to: number; x: number; y: number; r?: number}> = ({from, to, x, y, r = 260}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 7}, (_, i) => {
        const k = (((f - from) / 22 + i / 7) % 1);
        const ang = i * 2.4;
        const s = Math.sin(k * Math.PI) * (26 + (i % 3) * 10);
        const cx = x + Math.cos(ang) * r * (0.6 + 0.4 * ((i * 37) % 10) / 10);
        const cy = y + Math.sin(ang) * r * 0.8;
        return <path key={i} d={`M ${cx} ${cy - s} L ${cx + s * 0.3} ${cy - s * 0.3} L ${cx + s} ${cy} L ${cx + s * 0.3} ${cy + s * 0.3} L ${cx} ${cy + s} L ${cx - s * 0.3} ${cy + s * 0.3} L ${cx - s} ${cy} L ${cx - s * 0.3} ${cy - s * 0.3} Z`} fill="#fff6a8" stroke="#101018" strokeWidth={4} />;
      })}
    </svg>
  );
};

/** confete */
const Confetti: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const cols = ["#ff4d6d", "#ffd21f", "#2ecc71", "#3498db", "#9b59b6", "#ff9f1c", "#ffffff"];
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: 1 - ramp(f, to - 12, to)}}>
      {Array.from({length: 110}, (_, i) => {
        const r = rng(i * 9 + 1);
        const t = (f - from) / FPS;
        const vx = (r() - 0.5) * 900;
        const vy = -900 - r() * 900;
        const side = i % 2 ? 1 : -1;
        const x0 = side > 0 ? 1080 : 0;
        const x = x0 - side * Math.abs(vx) * 0.6 * Math.min(t, 1.2) + Math.sin(t * 5 + i) * 30;
        const y = 1500 + vy * t + 900 * t * t;
        const rot = t * (300 + r() * 500) * (r() > 0.5 ? 1 : -1);
        return <rect key={i} x={x - 12} y={y - 7} width={24} height={14} rx={3} fill={cols[i % cols.length]} transform={`rotate(${rot} ${x} ${y}) scale(1 ${Math.cos(t * 9 + i)})`} />;
      })}
    </svg>
  );
};

/** figurinhas do "parabéns": bicicleta x, 40 melancias, muro, sol x */
const Sticker: React.FC<{from: number; x: number; y: number; rot: number; children: React.ReactNode; label: string; to: number}> = ({from, x, y, rot, children, label, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 160, top: y - 150, width: 320, height: 300, transform: `scale(${s}) rotate(${rot}deg)`}}>
      <div style={{position: "absolute", inset: 0, background: "#fff", border: "8px solid #101018", borderRadius: 34, boxShadow: "0 12px 0 rgba(0,0,0,0.3)", overflow: "hidden"}}>
        <svg width={304} height={210} viewBox="0 0 304 210">
          {children}
        </svg>
        <div style={{position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 46, color: "#101018"}}>{label}</div>
      </div>
    </div>
  );
};
const Cross: React.FC = () => (
  <g stroke="#e8262d" strokeWidth={20} strokeLinecap="round">
    <line x1={60} y1={30} x2={244} y2={185} />
    <line x1={244} y1={30} x2={60} y2={185} />
  </g>
);

/* ======================= vídeo ======================= */
export const VideoGalo: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const cold = ramp(f, at(11, "fica") - 2, at(11, "frio") + 4) * (f < L(12) ? 1 : 0);
  const pb = L(14);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      {cold > 0 && <AbsoluteFill style={{background: "radial-gradient(circle at 50% 45%, rgba(150,200,255,0.05), rgba(110,170,255,0.45))", opacity: cold}} />}

      <Banner from={L(2) + 4} to={L(3) - 3} text="INVESTIMENTO AVÍCOLA" n={1} />
      <Banner from={L(4) + 4} to={L(5) - 3} text="LOGÍSTICA FRUTÍFERA" n={2} />
      <Banner from={L(6) + 4} to={L(7) - 3} text="EFEITO DOMINÓ TROPICAL" n={3} />
      <Banner from={L(8) + 4} to={L(9) - 3} text="MIGRAÇÃO DE VERÃO" n={4} />
      <Banner from={L(10) + 4} to={L(11) - 3} text="ENGENHARIA DE BALDE" n={5} />

      <Zzz from={0} to={at(0, "primeiro") - 2} x={600} y={720} />
      <Zzz from={L(15) + 30} to={at(15, "convencer") - 2} x={520} y={700} />
      <Bubble from={at(0, "ferias") - 2} to={L(1) - 2} x={560} y={430} />
      <Bubble from={at(15, "ferias") - 2} to={TOTAL_GALO} x={560} y={430} />
      <Chip from={at(1, "dinheiro") - 2} to={at(1, "entao") - 2} text="R$ 0,00" bg="#e8412c" top={300} />
      <Sparkles from={L(2)} to={L(3) - 2} x={560} y={900} />
      <MelonCount from={at(5, "quarenta") - 2} to={L(6) - 2} />
      <Chip from={at(11, "frio") - 4} to={L(12) - 2} text="BRRR!" bg="#3a86ff" top={1450} rot={3} />
      <Chip from={at(13, "cinco") - 3} to={at(13, "enche") - 2} text="⏰ 05:00" bg="#ff6b35" top={1450} size={96} />
      <Rings from={CANTA - 1} to={CANTA + 18} x={560} y={700} />
      <Confetti from={pb} to={pb + 100} />
      <Chip from={pb + 1} to={at(14, "sem") - 2} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      {/* figurinhas */}
      <Sticker from={at(14, "sem")} to={L(15) - 2} x={250} y={420} rot={-6} label="SEM BIKE">
        <g transform="translate(152,110) scale(1.3)" stroke="#101018" strokeWidth={6} fill="none">
          <circle cx={-55} cy={20} r={34} />
          <circle cx={55} cy={20} r={34} />
          <path d="M -55 20 L -15 -25 L 35 -25 L 55 20 M -15 -25 L 0 20 L 35 -25 M 30 -38 L 45 -38" stroke="#e8412c" />
        </g>
        <Cross />
      </Sticker>
      <Sticker from={at(14, "quarenta")} to={L(15) - 2} x={830} y={430} rot={5} label="40 NA PRAIA">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${82 + i * 70},${120 - (i === 1 ? 30 : 0)})`}>
            <ellipse rx={50} ry={40} fill="#79c447" stroke="#101018" strokeWidth={6} />
            {[-30, -10, 10, 30].map((x) => (
              <path key={x} d={`M ${x} -38 Q ${x + 6} 0 ${x} 38`} stroke="#2d6e1e" strokeWidth={8} fill="none" />
            ))}
          </g>
        ))}
      </Sticker>
      <Sticker from={at(14, "muro")} to={L(15) - 2} x={250} y={1060} rot={4} label="MURO">
        <rect x={40} y={40} width={224} height={150} fill="#e9c27c" stroke="#101018" strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={46 + i * 58} y={18} width={40} height={30} fill="#dcb26a" stroke="#101018" strokeWidth={6} />
        ))}
        <line x1={40} y1={90} x2={264} y2={90} stroke="#c49a52" strokeWidth={6} />
        <line x1={40} y1={140} x2={264} y2={140} stroke="#c49a52" strokeWidth={6} />
      </Sticker>
      <Sticker from={at(14, "lugar")} to={L(15) - 2} x={830} y={1060} rot={-5} label="SEM SOL">
        <g transform="translate(152,108)">
          {Array.from({length: 8}, (_, i) => (
            <line key={i} x1={Math.cos((i * Math.PI) / 4) * 55} y1={Math.sin((i * Math.PI) / 4) * 55} x2={Math.cos((i * Math.PI) / 4) * 85} y2={Math.sin((i * Math.PI) / 4) * 85} stroke="#ffb000" strokeWidth={12} strokeLinecap="round" />
          ))}
          <circle r={45} fill="#ffd21f" stroke="#101018" strokeWidth={6} />
        </g>
        <Cross />
      </Sticker>

      <Captions />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozgalo.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => 0.13 * clamp(fr / 20) * (1 - ramp(fr, TOTAL_GALO - 30, TOTAL_GALO))} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={25}>
          <Audio src={staticFile("sfx7/whoosh.mp3")} volume={0.18} />
        </Sequence>
      ))}
      {[L(2), L(4), L(6), L(8), L(10)].map((b) => (
        <Sequence key={"b" + b} from={b + 3} durationInFrames={32}>
          <Audio src={staticFile("sfx7/boing.mp3")} volume={0.75} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at(0, "primeiro")}>
        <Audio src={staticFile("sfx7/snore.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={L(15) + 20} durationInFrames={at(15, "convencer") - L(15) - 20}>
        <Audio src={staticFile("sfx7/snore.mp3")} volume={0.35} />
      </Sequence>
      {[at(0, "ferias") - 2, at(15, "ferias") - 2, at(1, "passagem") + 2, at(13, "pousa") + 2, at(14, "sem"), at(14, "quarenta"), at(14, "muro"), at(14, "lugar")].map((p, i) => (
        <Sequence key={"p" + i} from={p} durationInFrames={22}>
          <Audio src={staticFile("sfx7/pof.mp3")} volume={0.55} />
        </Sequence>
      ))}
      <Sequence from={at(1, "bicicleta") - 1} durationInFrames={37}>
        <Audio src={staticFile("sfx7/cash.mp3")} volume={0.75} />
      </Sequence>
      <Sequence from={at(1, "bicicleta") + 14} durationInFrames={37}>
        <Audio src={staticFile("sfx7/bell.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={at(3, "entao") - 2} durationInFrames={L(5) - at(3, "entao") + 2}>
        <Audio src={staticFile("sfx7/truck.mp3")} volume={(fr) => 0.38 * clamp(fr / 15)} loop />
      </Sequence>
      <Sequence from={L(5)} durationInFrames={BRAKE - L(5) + 30}>
        <Audio src={staticFile("sfx7/truck.mp3")} volume={(fr) => 0.38 * (1 - ramp(fr, BRAKE - L(5), BRAKE - L(5) + 25))} />
      </Sequence>
      <Sequence from={at(3, "caminhao") - 14} durationInFrames={50}>
        <Audio src={staticFile("sfx7/brake.mp3")} volume={0.22} />
      </Sequence>
      <Sequence from={BRAKE - 2} durationInFrames={61}>
        <Audio src={staticFile("sfx7/brake.mp3")} volume={0.6} />
      </Sequence>
      {[0, 18, 34, 52, 70, 90].map((d, i) => (
        <Sequence key={"bo" + i} from={SIM0 + 10 + d} durationInFrames={150}>
          <Audio src={staticFile("sfx7/bounce.mp3")} volume={0.55 - i * 0.04} />
        </Sequence>
      ))}
      {[0, 12, 24].map((d, i) => (
        <Sequence key={"cr" + i} from={L(6) + 16 + d} durationInFrames={60}>
          <Audio src={staticFile("sfx7/crash.mp3")} volume={0.5 - i * 0.1} />
        </Sequence>
      ))}
      <Sequence from={L(7) - 2} durationInFrames={L(12) - L(7) + 2}>
        <Audio src={staticFile("sfx7/beach.mp3")} volume={(fr) => 0.3 * clamp(fr / 10)} loop />
      </Sequence>
      <Sequence from={at(7, "param") + 8} durationInFrames={22}>
        <Audio src={staticFile("sfx7/pof.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={at(7, "e", 0) - 4} durationInFrames={L(9) - at(7, "e", 0) + 4}>
        <Audio src={staticFile("sfx5/crowdday.mp3")} volume={(fr) => 0.4 * clamp(fr / 10)} loop />
      </Sequence>
      <Sequence from={L(9) - 2} durationInFrames={L(11) - L(9)}>
        <Audio src={staticFile("sfx7/waves.mp3")} volume={0.32} loop />
      </Sequence>
      <Sequence from={SEA_UP - 14} durationInFrames={90}>
        <Audio src={staticFile("sfx7/rumble.mp3")} volume={0.45} />
      </Sequence>
      {Array.from({length: 6}, (_, i) => (
        <Sequence key={"sh" + i} from={at(9, "constroi") + i * 14} durationInFrames={30}>
          <Audio src={staticFile("sfx7/shovel.mp3")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={at(9, "tamanho") - 6} durationInFrames={90}>
        <Audio src={staticFile("sfx7/rumble.mp3")} volume={0.35} />
      </Sequence>
      <Sequence from={at(11, "frio") - 6} durationInFrames={61}>
        <Audio src={staticFile("sfx7/brr.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={L(12) - 2} durationInFrames={L(13) - L(12)}>
        <Audio src={staticFile("sfx7/bus.mp3")} volume={0.45} loop />
      </Sequence>
      <Sequence from={CANTA - 2} durationInFrames={91}>
        <Audio src={staticFile("sfx7/rooster.mp3")} volume={0.9} />
      </Sequence>
      <Sequence from={pb - 2} durationInFrames={61}>
        <Audio src={staticFile("sfx7/confetti.mp3")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
