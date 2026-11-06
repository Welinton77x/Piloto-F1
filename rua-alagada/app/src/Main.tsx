import React from "react";
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {VO_OFFSET, config, finalCut, hasVO, timed} from "./data/scenes";
import {World} from "./components/World";
import {Overlay} from "./components/Overlay";
import {FOV, poseAt} from "./lib/camera";
import {track} from "./lib/track";
import {clamp01, mixHex} from "./lib/anim";
import {SFX, musicVolume, rainVolume} from "./lib/audio";

// fontes locais (Montserrat 800/900), sem depender de rede no render
const fontHandle = delayRender("fonts");
const css = `
@font-face{font-family:"Montserrat";font-weight:800;src:url(${staticFile("fonts/montserrat-latin-800-normal.woff2")}) format("woff2");}
@font-face{font-family:"Montserrat";font-weight:900;src:url(${staticFile("fonts/montserrat-latin-900-normal.woff2")}) format("woff2");}`;
if (typeof document !== "undefined") {
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  Promise.all([document.fonts.load('900 40px "Montserrat"'), document.fonts.load('800 40px "Montserrat"')]).then(() => continueRender(fontHandle), () => continueRender(fontHandle));
} else continueRender(fontHandle);

const CamRig: React.FC = () => {
  const gf = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const {pos, target} = poseAt(gf);
  camera.position.copy(pos);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
};

const Background: React.FC = () => {
  const gf = useCurrentFrame();
  const dark = track("sky.darkness", gf, 0);
  const under = track("bgGradient.mix", gf, 0);
  const brand = clamp01((gf - finalCut) / 15);
  let top = mixHex("#9db7d3", "#3d4a5e", dark);
  let bot = mixHex("#5f7d9e", "#1d2533", dark);
  top = mixHex(top, "#17325c", under);
  bot = mixHex(bot, "#0b1730", under);
  top = mixHex(top, "#3d8bff", brand);
  bot = mixHex(bot, "#0b2a66", brand);
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`}} />;
};

const Scene3D: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <ThreeCanvas width={config.width} height={config.height} camera={{fov: FOV, near: 0.1, far: 400, position: [0, 2, 40]}}>
      <CamRig />
      <World gf={gf} />
    </ThreeCanvas>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#101820"}}>
    <Background />
    <Scene3D />
    {timed.map((s) => (
      <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames} name={s.id}>
        <Overlay s={s} />
        {hasVO(s.voKey) && (
          <Sequence from={VO_OFFSET} name={`vo-${s.id}`}>
            <Audio src={staticFile(`vo/${s.voKey}.mp3`)} />
          </Sequence>
        )}
        {s.audioCues
          .filter((c) => c.kind === "sfx" && SFX(c.id))
          .map((c, i) => (
            <Sequence key={i} from={c.f} durationInFrames={90} name={c.id}>
              <Audio src={staticFile(`sfx/${SFX(c.id)}`)} volume={0.35} />
            </Sequence>
          ))}
      </Sequence>
    ))}
    <Audio src={staticFile("sfx/rain.wav")} loop volume={(f) => rainVolume(f)} />
    <Audio src={staticFile("sfx/music.wav")} loop volume={(f) => musicVolume(f)} />
  </AbsoluteFill>
);
