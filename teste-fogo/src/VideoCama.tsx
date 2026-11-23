import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3, House} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Pigeon} from "./Sets6";
import {BigPhone} from "./Sets17";
import {Bg} from "./Sets20";
import {Cama, BaldePipoca, Escada, PlacaHotel} from "./Sets39";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingCama.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_CAMA = F(words[words.length - 1].e + 1.2);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const NEIGHBORS: ToyLook[] = [
  {shirt: "#e8414f", pants: "#101018", hairStyle: "spiky", hair: "#2a1a10"},
  {shirt: "#2ecc71", pants: "#2e86de", hairStyle: "ponytail", hair: "#5a3a20", lips: "#c0392b"},
  {shirt: "#9b59b6", pants: "#101018", hairStyle: "curly", hair: "#101018"},
  {shirt: "#ff8a1f", pants: "#5a4a3a", hairStyle: "bun", hair: "#d9d9d9"},
  {shirt: "#2e86de", pants: "#ffffff", hairStyle: "mohawk", hair: "#101018"},
  {shirt: "#f06292", pants: "#3a3f4a", hairStyle: "long", hair: "#2a1a10", lips: "#c0392b"},
];

const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HOLD: Pose = {rShoulder: [-1.0, 0.35, 0.05], rElbow: -1.3};
const SIP: Pose = {rShoulder: [-1.15, 0.12, 0.05], rElbow: -1.8, head: [-0.18, 0, 0]};
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
const RONCOU1 = at(1, "roncou");
const POMBOS1 = at(1, "pombos");
const BANDO2 = at(2, "bando");
const HOTEL2 = at(2, "hotel");
const GERENTE4 = at(4, "gerente");
const DIARIA4 = at(4, "diaria", 1);
const PADARIA5 = at(5, "padaria");
const TRES5 = at(5, "tres");
const BATENDO6 = at(6, "batendo");
const ESCADA6 = at(6, "escada");
const PIPOCA6 = at(6, "pipoca");
const ATACAM7 = at(7, "atacam");
const CORRENDO7 = at(7, "correndo");
const DESFILE7 = at(7, "desfile");
const ESCORREGA9 = at(9, "escorrega");
const JANELA9 = at(9, "janela");
const CAI9 = at(9, "cai");
const PARABENS10 = at(10, "parabens");
const ALUGUEL10 = at(10, "aluguel");
const SEGUIR11 = at(11, "seguir");
const TRAVESSEIRO11 = at(11, "travesseiro");

/* ---------- física e utilidades ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook}> = ({id, a, f, pose, item, look = BOY}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} /> : <Toy pose={p} look={look} />;
};
const PJ: ToyLook = {hoodie: false, shirt: "#7fb8e8", pants: "#7fb8e8"};
const VIZ: ToyLook = {shirt: "#f2d04a", pants: "#f2d04a", hairStyle: "bald", skin: "#d9a173", belly: 0.8};
/* casas: a do vizinho (com a cama no telhado) e a sua (com a janela) */
const NB: V3 = [0.8, 0, -1.0];
const MY: V3 = [-3.6, 0, -1.0];
const HW = 3.4;
const HH = 2.7;
const PEAK = HH + HW * 0.4;
const ROOF_BED: V3 = [NB[0], PEAK - 0.35, NB[2]];
/* menino deitado dentro da cama */
const LyingBoy: React.FC<{id: string; a: number; f: number; awake?: number; snore?: number}> = ({id, a, f, awake = 0, snore = 0}) => (
  <group position={[0, 0.5, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
    <PBoy id={id} a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], blink: awake > 0 ? blinkCurve(fr) : 1, mouthOpen: snore > 0 ? 0.3 + 0.4 * Math.abs(Math.sin(tf(fr) * 3)) : awake > 0 ? 0.4 : 0, eyeWide: awake, brow: awake})} />
  </group>
);
const Bando: React.FC<{c: V3; t: number; n?: number; r?: number; s?: number}> = ({c, t, n = 8, r = 1.2, s = 1}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2 + t * 0.8;
      return <Pigeon key={i} p={{pos: [c[0] + Math.cos(a) * r, c[1] + Math.sin(t * 6 + i) * 0.15, c[2] + Math.sin(a) * r * 0.6], rotY: -a, flap: 1, flapPh: t * 22 + i, t}} s={s} />;
    })}
  </>
);
const Bairro: React.FC<{t: number; night?: boolean; lit?: boolean}> = ({t, night = false, lit = false}) => (
  <>
    {night ? (
      <>
        <Bg c="#101836" />
        <hemisphereLight args={["#8fa0ff", "#2a2a40", 0.8]} />
        <directionalLight position={[-4, 8, 6]} intensity={0.7} color="#bfc8ff" />
      </>
    ) : (
      <DayOut />
    )}
    <group position={[0, 0, -7]}>
      <Town t={t} galo={false} variant="nova" flat clouds={!night} dark={night} lit={lit ? () => true : undefined} lamps />
    </group>
    <House p={NB} w={HW} h={HH} d={3} wall="#cfe8f6" roof="#3a6ad0" lit={lit} dark={night && !lit} />
    <House p={MY} w={HW} h={HH} d={3} wall="#f6d9a8" roof="#e8412c" lit={lit} dark={night && !lit} />
  </>
);

/* 0 — você acorda no telhado do vizinho */
const C0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[1.4, PEAK + 1.6, 4.6]} look={[NB[0], PEAK - 0.2, NB[2]]} fov={54} f={f} a={a} />
    <Bairro t={t} />
    <Cama p={ROOF_BED} r={[0, 0.3, 0]} s={1}>
      <LyingBoy id="c0" a={a} f={f} awake={f >= a + 30 ? 1 : 0} />
    </Cama>
    {[0, 1, 2].map((i) => (
      <Pigeon key={i} p={{pos: [NB[0] - 1 + i * 1.0, PEAK + 0.05, NB[2] + 1.1], rotY: 0.2 * i, peck: Math.abs(Math.sin(t * 3 + i)) * 0.5, t}} s={1.2} />
    ))}
    <PlacaHotel p={[NB[0] + 1.3, PEAK - 0.3, NB[2] - 0.3]} r={[0, -0.3, 0]} s={0.9} />
  </>
);
/* 1 — você ronca tão alto que os pombos chegam */
const C1: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 2.2, 3.8]} look={[0, 0.8, -0.8]} fov={54} f={f} a={a} />
    <Bg c="#1a2244" />
    <KitchenLights night />
    <mesh position={[0, 2, -2.0]}>
      <boxGeometry args={[10, 4, 0.1]} />
      <meshStandardMaterial color="#6a76a8" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 8]} />
      <meshStandardMaterial color="#8a6a4a" />
    </mesh>
    <mesh position={[1.2, 1.8, -1.94]}>
      <planeGeometry args={[1.1, 0.9]} />
      <meshBasicMaterial color="#0c1230" />
    </mesh>
    <Cama p={[-0.3, 0, -0.6]} s={1}>
      <LyingBoy id="c1" a={a} f={f} snore={1} />
    </Cama>
    {f >= POMBOS1 &&
      [0, 1, 2].map((i) => (
        <Pigeon key={i} p={{pos: [0.9 + i * 0.3, 1.45 + Math.sin(t * 5 + i) * 0.05, -1.8], rotY: 0, headTilt: 0.4 * Math.sin(t * 3 + i), t}} s={1.1} />
      ))}
  </>
);
/* 2–3 — os pombos levam a cama pro telhado (hotel) */
const C2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = f >= BANDO2 ? easeInOut(clamp((f - BANDO2) / 110)) : 0;
  const p: V3 = [lerp(MY[0], ROOF_BED[0], k), lerp(0.8, ROOF_BED[1], k) + Math.sin(k * Math.PI) * 2.2, lerp(MY[2] + 1.8, ROOF_BED[2], k)];
  const day = f >= HOTEL2;
  return (
    <>
      <Cam pos={[-1.2, 4.0, 9.5]} look={[-1.2, 2.8, -1]} fov={58} f={f} a={day ? HOTEL2 : a} />
      <Bairro t={t} night={!day} />
      <Cama p={p} r={[0, 0.3, Math.sin(t * 3) * 0.05 * (k < 1 ? 1 : 0)]}>
        <LyingBoy id="c2" a={a} f={f} snore={1} />
      </Cama>
      {k < 1 && <Bando c={[p[0], p[1] + 1.2, p[2]]} t={t} n={10} r={1.1} s={1.2} />}
      {day && <PlacaHotel p={[NB[0] + 1.3, PEAK - 0.3, NB[2] - 0.3]} r={[0, -0.3, 0]} s={0.9} />}
    </>
  );
};
/* 4–5 — o pombo gerente cobra a diária; o padeiro dormindo */
const C4: React.FC<ShotProps> = ({f, a, t}) => {
  const phone = f >= PADARIA5 - 4;
  return (
    <>
      <Cam pos={[2.0, PEAK + 1.5, 4.4]} look={[NB[0], PEAK, NB[2] + 0.3]} fov={52} f={f} a={phone ? PADARIA5 - 4 : a} />
      <Bairro t={t} night={false} />
      <Cama p={ROOF_BED} r={[0, 0.3, 0]} />
      <group position={[NB[0] + 0.55, PEAK + 0.15, NB[2] + 0.7]}>
        <Pigeon p={{pos: [0, 0, 0], rotY: -0.6, chest: 1, bob: Math.sin(t * 4) * 0.3, t, hat: true}} s={1.6} />
        <group position={[0.02, 0.33, 0.12]} rotation={[0.3, -0.6, 0]}>
          <mesh geometry={rbox(0.05, 0.04, 0.02, 0.01)} material={sm("#e8262d", 0.5)} />
          <mesh position={[0, -0.07, 0]} rotation={[0, 0, Math.PI]} material={sm("#e8262d", 0.5)}>
            <coneGeometry args={[0.03, 0.1, 4]} />
          </mesh>
        </group>
      </group>
      <group position={[ROOF_BED[0], ROOF_BED[1] + 0.5, ROOF_BED[2] + 0.2]} rotation={[0, 0.3, 0]}>
        <PBoy id="c4" a={a} f={f} look={PJ} item={phone ? <BigPhone p={[0, 0.02, 0.06]} r={[-Math.PI / 2 + 0.2, Math.PI, 0]} s={0.36} screen={callTex()} key2="padaria-call" /> : undefined} pose={(fr) => ({...idle(fr), pos: [0, -0.4, 0], rotY: 0.2, legLift: 1, eyeWide: 0.9, brow: 1, ...(phone ? {rShoulder: [-1.2, 0.5, 0.05], rElbow: -1.6, head: [0, 0.3, 0]} : {})} as Pose)} />
      </group>
    </>
  );
};
const callTex = () =>
  canvasTex("padaria-call", 440, 860, (c) => {
    c.fillStyle = "#1d2a3a";
    c.fillRect(0, 0, 440, 860);
    c.fillStyle = "#ffffff";
    c.textAlign = "center";
    c.font = "700 40px sans-serif";
    c.fillText("Chamando...", 220, 300);
    c.font = "900 64px sans-serif";
    c.fillText("PADARIA", 220, 400);
    c.fillStyle = "#e8262d";
    c.beginPath();
    c.arc(220, 680, 60, 0, Math.PI * 2);
    c.fill();
  });
/* 6 — você bate no telhado e o vizinho sobe com a pipoca */
const C6: React.FC<ShotProps> = ({f, a, t}) => {
  const climb = f >= ESCADA6 ? clamp((f - ESCADA6) / 70) : 0;
  const LAD: V3 = [NB[0] + HW / 2 + 0.25, 0, NB[2] + 0.8];
  return (
    <>
      <Cam pos={[4.6, 2.6, 6.4]} look={[NB[0] + 0.8, 2.2, NB[2]]} fov={56} f={f} a={a} />
      <Bairro t={t} night={false} />
      <Cama p={ROOF_BED} r={[0, 0.3, 0]} />
      <Escada p={LAD} r={[0, 0, 0.12]} h={3.2} />
      <PBoy id="c6v" a={a} f={f} look={VIZ} item={<BaldePipoca p={[0, -0.05, 0.08]} s={1.3} />} pose={(fr) => ({...idle(fr), pos: [LAD[0] + 0.25, climb * 2.4, LAD[2] + 0.35], rotY: Math.PI * 0.85, walk: tf(fr) * 6, walkAmt: climb > 0 && climb < 1 ? 1 : 0, rShoulder: [-1.2, 0.3, 0], rElbow: -1.0, smile: 1, eyeWide: 0.6})} />
      <group position={[ROOF_BED[0], ROOF_BED[1] + 0.5, ROOF_BED[2] + 0.2]} rotation={[0, 0.3, 0]}>
        <PBoy id="c6" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0, -0.4, 0], rotY: 0.5, legLift: 1, rShoulder: [-1.2 + (fr >= BATENDO6 && fr < ESCADA6 ? 0.8 * Math.abs(Math.sin(tf(fr) * 12)) : 0), 0.3, -0.2], rElbow: -0.4, eyeWide: 0.8} as Pose)} />
      </group>
    </>
  );
};
/* 7–8 — perseguição pipoqueira pela rua */
const C7: React.FC<ShotProps> = ({f, a, t}) => {
  const run = f >= CORRENDO7 - 4 ? (f - CORRENDO7 + 4) / FPS : 0;
  const vx = lerp(3, -3.5, clamp(run / 7));
  const lit = f >= DESFILE7 - 4;
  return (
    <>
      <Cam pos={[0, 2.4, 9]} look={[0, 1.4, 0]} fov={58} f={f} a={a} />
      <Bairro t={t} night={false} lit={lit} />
      {run > 0 ? (
        <>
          <PBoy id="c7" a={CORRENDO7 - 4} f={f} look={VIZ} item={<BaldePipoca p={[0, -0.05, 0.08]} s={1.3} />} pose={(fr) => ({...idle(fr), ...RUN(tf(fr), 0), pos: [vx, 0, 1.2], rotY: -1.57, eyeWide: 1, mouthOpen: 0.7, brow: 1, rShoulder: [-2.4, 0.2, -0.3], rElbow: -0.3})} />
          <SpeedLines p={[vx + 0.4, 0, 1.2]} dir={1} />
          <Bando c={[vx + 1.6, 1.8, 1.2]} t={t * 1.5} n={14} r={1.4} s={1.1} />
        </>
      ) : (
        <Bando c={[NB[0], PEAK + 0.8, NB[2]]} t={t} n={10} r={1.0} s={1.1} />
      )}
      {lit &&
        [0, 1, 2, 3].map((i) => (
          <Toy key={i} look={NEIGHBORS[i]} pose={{...idle(f + i * 9), pos: [-3 + i * 2.0, Math.abs(Math.sin(t * 7 + i)) * 0.12, 2.6], rotY: 0, ...ARMS_UP, smile: 1, mouthOpen: 0.5}} />
        ))}
    </>
  );
};
/* 9 — a cama escorrega do telhado e entra pela sua janela */
const C9: React.FC<ShotProps> = ({f, a, t}) => {
  const s1 = f >= ESCORREGA9 ? clamp((f - ESCORREGA9) / 30) : 0;
  const s2 = f >= JANELA9 - 4 ? Math.pow(clamp((f - JANELA9 + 4) / 26), 2) : 0;
  const WIN: V3 = [MY[0] + 0.6, 1.4, MY[2] + 1.6];
  const pos: V3 = s2 > 0 ? [lerp(NB[0] - HW / 2 - 0.5, WIN[0], s2), lerp(HH - 0.2, WIN[1], s2) + Math.sin(s2 * Math.PI) * 1.0, lerp(NB[2] + 0.4, WIN[2], s2)] : [lerp(ROOF_BED[0], NB[0] - HW / 2 - 0.5, s1), lerp(ROOF_BED[1], HH - 0.2, s1), NB[2] + 0.4 * s1];
  return (
    <>
      <Cam pos={[-1.3, 3.2, 9.5]} look={[-1.3, 2.2, -1]} fov={58} f={f} a={a} />
      <Bairro t={t} />
      {s2 < 1 && (
        <Cama p={pos} r={[0, 0.3 + s2 * 1.2, s1 > 0 && s2 === 0 ? 0.55 : s2 * 6]} s={1 - s2 * 0.4}>
          <group position={[0, 0.5, 0.2]}>
            <PBoy id="c9" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0, -0.4, 0], ...ARMS_UP, legLift: 1, eyeWide: 1, mouthOpen: 0.7, brow: 1} as Pose)} />
          </group>
        </Cama>
      )}
      {s1 > 0 && s2 < 1 && <SpeedLines p={[pos[0] + 0.8, pos[1], pos[2]]} dir={1} />}
    </>
  );
};
/* 10–11 — de volta na cama, agora patrimônio dos pombos */
const C10: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= SEGUIR11 - 4;
  return (
    <>
      <Cam pos={threat ? [0.6, 1.9, 2.4] : [0.3, 2.2, 3.8]} look={threat ? [-0.3, 0.9, -1.2] : [-0.2, 0.9, -0.8]} fov={52} f={f} a={threat ? SEGUIR11 - 4 : a} />
      <Bg c="#9fd8ff" />
      <KitchenLights />
      <mesh position={[0, 2, -2.0]}>
        <boxGeometry args={[10, 4, 0.1]} />
        <meshStandardMaterial color="#f6d9a8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#c99a6a" />
      </mesh>
      <Cama p={[-0.3, 0, -0.6]} s={1}>
        <group position={[0, 0.5, 0.2]}>
          <PBoy id="c10" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0, -0.4, 0], legLift: 1, smile: threat ? 0 : 1, eyeWide: threat ? 1 : 0.4, mouthOpen: threat ? 0.6 : 0.2, brow: threat ? 1 : 0, ...(fr >= PARABENS10 && fr < ALUGUEL10 ? ARMS_UP : {})} as Pose)} />
        </group>
        {[-0.4, 0, 0.4].map((x, i) => (
          <Pigeon key={i} p={{pos: [x, 1.27, -1.03], rotY: 0, peck: Math.abs(Math.sin(t * 3 + i)) * 0.3, t, hat: i === 1}} s={1.0} />
        ))}
        {threat &&
          Array.from({length: 7}, (_, i) => (
            <mesh key={i} position={[-0.25 + (i % 4) * 0.15, 0.66 + Math.floor(i / 4) * 0.05, -0.72]} rotation={[0, i * 0.7, Math.PI / 2]} material={sm("#8a6a4a", 0.8)}>
              <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
            </mesh>
          ))}
      </Cama>
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: C0},
  {from: L(1), Comp: C1},
  {from: L(2), Comp: C2},
  {from: L(4), Comp: C4},
  {from: L(6), Comp: C6},
  {from: L(7), Comp: C7},
  {from: L(9), Comp: C9},
  {from: L(10), Comp: C10},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CAMA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["cama", "telhado", "vizinho", "roncou", "pombos", "pombo", "gigante", "bando", "hotel", "estrelas", "suite", "presidencial", "sequestro", "hoteleiro", "gerente", "gravata", "diaria", "quinhentas", "migalhas", "padaria", "padeiro", "tres", "escada", "pijama", "pipoca", "show", "atacam", "quarenta", "desfile", "perseguicao", "pipoqueira", "escorrega", "janela", "quarto", "parabens", "patrimonio", "aluguel", "seguir", "travesseiro"]);
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


/* ---------- título amarelo no topo (igual à referência) ---------- */
const TopTitle: React.FC<{from: number; to: number; text: string; size?: number}> = ({from, to, text, size = 88}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: 250, width: 980, transform: `translate(-50%,-50%) scale(${s})`, textAlign: "center", fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.0, color: "#ffd21f", WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", textTransform: "uppercase"}}>
      {text}
    </div>
  );
};
/* ---------- plaquinha amarela ---------- */
const Plaque: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number}> = ({from, to, text, x = 540, y = 600, size = 46}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(-3deg)`, background: "#ffd21f", border: "6px solid #101018", fontFamily, fontWeight: 900, fontSize: size, color: "#101018", padding: "10px 22px", textAlign: "center", whiteSpace: "pre", lineHeight: 1.05}}>
      {text}
    </div>
  );
};
/* ---------- relógio do fiado (3:00 → 0:00) ---------- */
const FiadoClock: React.FC<{from: number; to: number; end: number; start?: number}> = ({from, to, end, start = 1}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const k = clamp((f - from) / (end - from));
  const secs = Math.max(0, Math.round(180 * start * (1 - k)));
  const txt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div style={{position: "absolute", left: 830, top: 560, transform: `translate(-50%,-50%) scale(${s})`, width: 230, height: 230, borderRadius: 115, background: "#ffffff", border: "10px solid #101018", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 70, color: secs < 30 ? "#e8262d" : "#101018"}}>
      {txt}
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
const TITLES: [number, number, string[]][] = [
  [L(3), L(4), ["SEQUESTRO", "HOTELEIRO"]],
  [L(8), L(9), ["PERSEGUIÇÃO", "PIPOQUEIRA"]],
];
const Zzz: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const k = ((f - from) / 40 + i * 0.2) % 1;
        return <div key={i} style={{position: "absolute", left: 380 + i * 90 + k * 60, top: 760 - k * 320, fontFamily, fontWeight: 900, fontSize: 70 + k * 70, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill", opacity: 1 - k}}>Z</div>;
      })}
    </>
  );
};
const FOLLOW_FROM = SEGUIR11 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoCama: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, nx, lines], i) => (
        <StageTitle key={i} from={x + 2} to={nx - 3} lines={lines} />
      ))}
      <Zzz from={L(1)} to={L(2) - 2} />
      <Ono from={RONCOU1} to={POMBOS1 - 2} text="RONC!" size={150} color="#ffffff" />
      <Plaque from={DIARIA4} to={L(5) - 2} text={"DIÁRIA:\n500 MIGALHAS 🍞"} x={540} y={420} size={60} />
      <BigNum from={TRES5} to={L(6) - 2} text="🕒 3:00" size={130} />
      <Ono from={BATENDO6} to={ESCADA6 - 2} text="TOC TOC!" size={130} color="#ffffff" />
      <Ono from={ATACAM7} to={CORRENDO7 - 2} text="PRUUU!" size={140} color="#ffd21f" />
      <Ono from={CAI9} to={L(10) - 2} text="PLOFT!" size={150} color="#ffd21f" />
      <Plaque from={ALUGUEL10} to={L(11) - 2} text={"🐦 ALUGUEL\nVENCE HOJE"} x={540} y={420} size={60} />
      <Confetti from={PARABENS10} to={PARABENS10 + 50} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_CAMA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (estilo dos vídeos antigos) ---------- */}
      <Audio src={staticFile("vozcama.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 2} dur={40} v={FXV * 0.25} />
      ))}
      <SND src="sfx7/snore.mp3" from={L(1)} dur={L(2) - L(1)} v={FXV * 0.4} />
      <SND src="sfx8/flock.mp3" from={BANDO2} dur={90} v={FXV * 0.4} />
      <SND src="sfx8/coo.mp3" from={GERENTE4} dur={40} v={FXV * 0.45} />
      <SND src="sfx3/ring.mp3" from={PADARIA5} dur={50} v={FXV * 0.3} />
      <SND src="sfx5/knock.mp3" from={BATENDO6} dur={30} v={FXV * 0.5} />
      <SND src="sfx8/wings.mp3" from={ATACAM7} dur={50} v={FXV * 0.45} />
      <SND src="sfx5/run.mp3" from={CORRENDO7} dur={60} v={FXV * 0.35} />
      <SND src="sfx3/crowd.mp3" from={DESFILE7 - 6} dur={60} v={FXV * 0.3} />
      <SND src="sfx12/slip.mp3" from={ESCORREGA9} dur={30} v={FXV * 0.45} />
      <SND src="sfx7/crash.mp3" from={CAI9} dur={30} v={FXV * 0.4} />
      <SND src="sfx7/confetti.mp3" from={PARABENS10} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
