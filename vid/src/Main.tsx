import React from "react";
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {CAMS, FOV} from "./data/cameras";
import type {Cam} from "./data/cameras";
import {VO_OFFSET, config, hasVO, timed} from "./data/scenes";
import type {TimedScene} from "./data/scenes";
import {Lights} from "./components/Parts";
import {STAGES} from "./components/Stages";
import {Overlay} from "./components/Overlay";
import {rad} from "./lib/anim";

// Fundo em degradê por cena (céu/pista -> azul profundo no raio-x -> marca no fecho)
const BG: Record<string, [string, string]> = {
  s1: ["#7cc4ff", "#2b3a55"],
  s2: ["#7cc4ff", "#10305a"],
  s3: ["#4a7fb8", "#14284a"],
  s4: ["#17325c", "#0b1730"],
  s5: ["#1b2f5e", "#0b1730"],
  s6: ["#3a2a4f", "#0b1730"],
  s7: ["#17325c", "#0b1730"],
  s8: ["#1b2f5e", "#08102a"],
  s9: ["#2a6b7a", "#0b2230"],
  s10: ["#2f6fb5", "#0b1730"],
  s11: ["#3d8bff", "#0b2a66"],
};

const CamRig: React.FC<{keys: Cam[]; shake?: number}> = ({keys, shake = 0}) => {
  const f = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const fs = keys.map((k) => k.f);
  const g = (fn: (k: Cam) => number) =>
    interpolate(f, fs, keys.map(fn), {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
  const drift = Math.sin(f / 90) * 1.5; // nunca parada
  const az = rad(g((k) => k.az) + drift);
  const el = rad(g((k) => k.el));
  const d = g((k) => k.h) / (2 * Math.tan(rad(FOV / 2)));
  const tx = g((k) => k.target[0]);
  const ty = g((k) => k.target[1]);
  const tz = g((k) => k.target[2]);
  const sx = shake ? (random("shx" + f) - 0.5) * 2 * shake : 0;
  const sy = shake ? (random("shy" + f) - 0.5) * 2 * shake : 0;
  camera.position.set(tx + d * Math.sin(az) * Math.cos(el) + sx, ty + d * Math.sin(el) + sy, tz + d * Math.cos(az) * Math.cos(el));
  camera.lookAt(tx, ty, tz);
  camera.updateProjectionMatrix();
  return null;
};

const SFX_FILE = (id: string) => {
  if (/pop/.test(id)) return "pop.wav";
  if (/whoosh/.test(id)) return "whoosh.wav";
  if (/heart/.test(id)) return "beat.wav";
  if (/engine/.test(id)) return "engine.wav";
  if (/squeal/.test(id)) return "squeal.wav";
  if (/sizzle|drips/.test(id)) return "sizzle.wav";
  if (/belt|click/.test(id)) return "click.wav";
  if (/boing|band/.test(id)) return "boing.wav";
  if (/metal|ping|sparkle/.test(id)) return "sparkle.wav";
  if (/thud|brake/.test(id)) return "thud.wav";
  return "tick.wav";
};

const SceneBlock: React.FC<{s: TimedScene}> = ({s}) => {
  const Stage = STAGES[s.id];
  const [a, b] = BG[s.id] ?? ["#3d8bff", "#0b1730"];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${a} 0%, ${b} 100%)`}} />
      <ThreeCanvas width={config.width} height={config.height} camera={{fov: FOV, near: 0.1, far: 200, position: [0, 1, 4]}}>
        <Lights />
        <CamRig keys={CAMS[s.id] ?? ([] as Cam[])} shake={s.id === "s1" ? 0.012 : 0} />
        <Stage />
      </ThreeCanvas>
      <Overlay s={s} />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#0b1730"}}>
    {timed.map((s) => (
      <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames} name={s.id}>
        <SceneBlock s={s} />
        {hasVO(s.voKey) && (
          <Sequence from={VO_OFFSET}>
            <Audio src={staticFile(`vo/${s.voKey}.mp3`)} />
          </Sequence>
        )}
        {/* whoosh na troca de cena + motor nas cenas do carro */}
        {s.id !== "s1" && (
          <Sequence from={0} durationInFrames={30}>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
          </Sequence>
        )}
        {(s.id === "s2" || s.id === "s3") && (
          <Sequence from={4} durationInFrames={60}>
            <Audio src={staticFile("sfx/engine.wav")} volume={0.22} />
          </Sequence>
        )}
        {/* som em cada selo: ding (solução), alerta (problema), pop (demais) */}
        {s.badges.map((b, i) => (
          <Sequence key={"bs" + i} from={b.f0} durationInFrames={45}>
            <Audio src={staticFile(`sfx/${b.kind === "solution" ? "ding" : b.kind === "problem" ? "alert" : "pop"}.wav`)} volume={0.3} />
          </Sequence>
        ))}
        {s.audioCues
          .filter((c) => c.kind === "sfx")
          .map((c) => (
            <Sequence key={c.id + c.f} from={c.f} durationInFrames={45}>
              <Audio src={staticFile(`sfx/${SFX_FILE(c.id)}`)} volume={0.4} />
            </Sequence>
          ))}
      </Sequence>
    ))}
    {/* trilha leve, baixa sob a voz */}
    <Audio src={staticFile("sfx/music.wav")} loop volume={0.1} />
  </AbsoluteFill>
);
