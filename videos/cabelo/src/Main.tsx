import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, interpolate} from "remotion";
import {Scene3D} from "./Scene3D";
import {Overlay} from "./Overlay";
import {cuts, timing, planById, TOTAL, FPS} from "./data/timeline";
import {L} from "./three/animate";

// intervalos de fala (para abaixar a trilha sob a voz)
const voice = cuts.filter((c) => c.voKey).map((c) => [c.voStart, c.voStart + Math.round(timing[c.voKey!].duration * FPS)]);
const musicVolume = (f: number) => {
  const talking = voice.some(([a, b]) => f >= a - 4 && f <= b + 4);
  const base = talking ? 0.07 : 0.16;
  const fadeOut = interpolate(f, [TOTAL - 30, TOTAL - 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return base * fadeOut;
};

const SFX_VOL: Record<string, number> = {rugido: 0.75, quack: 0.6, sirene: 0.35, tlim: 0.5, ventofaroeste: 0.45, chuva: 0.4, trovao: 0.7, aspirador: 0.3, pop: 0.45, whoosh: 0.35, tsss: 0.35, plim: 0.5, croc: 0.8, tum: 0.7, confete: 0.45, toc: 0.6, whooshlento: 0.5, aaah: 0.45, chuvapao: 0.6};
const COMPUTED = new Set<string>();

/** music: volume da trilha (1 = original da v2, 0.25 = bem baixa, 0 = sem trilha). */
export const Main: React.FC<{music?: number}> = ({music = 0.25}) => (
  <AbsoluteFill style={{background: "#cfe3f5"}}>
    <Scene3D />
    <Overlay />
    {music > 0 ? <Audio src={staticFile("sfx/trilha.wav")} volume={(f) => musicVolume(f) * music} /> : null}
    {cuts.map((c) =>
      c.voKey ? (
        <Sequence key={c.id} from={c.voStart} durationInFrames={Math.ceil(timing[c.voKey].duration * FPS) + 2} layout="none">
          <Audio src={staticFile(`vo/${c.voKey}.mp3`)} />
        </Sequence>
      ) : null,
    )}
    {cuts.flatMap((c) =>
      planById[c.id].audioCues
        .filter((a) => a.kind === "sfx" && !COMPUTED.has(a.name))
        .map((a, i) => (
          <Sequence key={c.id + i} from={c.start + L(c.id, a.f)} durationInFrames={60} layout="none">
            <Audio src={staticFile(`sfx/${a.name}.wav`)} volume={SFX_VOL[a.name] ?? 0.4} />
          </Sequence>
        )),
    )}
  </AbsoluteFill>
);
