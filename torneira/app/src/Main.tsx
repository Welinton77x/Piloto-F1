import React from "react";
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {VO_OFFSET, config, finalCut, hasVO, sceneAt, timed, wordLocal} from "./data/scenes";
import {WaterWorld} from "./components/WaterWorld";
import {Overlay, imagineAmount} from "./components/Overlay";
import {Rings3D} from "./components/Rings3D";
import {FOV, poseAt} from "./lib/camera";
import {track} from "./lib/track";
import {clamp01, mixHex} from "./lib/anim";
import {SFX, musicVolume} from "./lib/audio";

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

export type FixedPose = {pos: [number, number, number]; target: [number, number, number]};
const CamRig: React.FC<{at?: number; fixed?: FixedPose}> = ({at, fixed}) => {
  const cur = useCurrentFrame();
  const gf = at ?? cur;
  const camera = useThree((s) => s.camera);
  const p0 = poseAt(gf);
  const pos = fixed ? new THREE.Vector3(...fixed.pos) : p0.pos;
  const target = fixed ? new THREE.Vector3(...fixed.target) : p0.target;
  camera.position.copy(pos);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
};

export const Background: React.FC<{at?: number}> = ({at}) => {
  const cur = useCurrentFrame();
  const gf = at ?? cur;
  const dark = track("sky.darkness", gf, 0);
  const under = track("bgGradient.mix", gf, 0);
  const brand = clamp01((gf - finalCut) / 15);
  // céu claro de chuva leve → temporal escuro; azul profundo no subsolo; pôr do sol quando a chuva passa
  let top = mixHex("#86b4e0", "#3d4a5e", dark);
  let bot = mixHex("#d9e9f5", "#5a6576", dark);
  top = mixHex(top, "#17325c", under);
  bot = mixHex(bot, "#0b1730", under);
  top = mixHex(top, "#c97b9a", brand);
  bot = mixHex(bot, "#ffcf9e", brand);
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bot} 70%)`}} />;
};

export const Scene3D: React.FC<{at?: number; fixed?: FixedPose; sunny?: boolean; hideMascot?: boolean; children?: React.ReactNode}> = ({at, fixed, sunny, hideMascot, children}) => {
  const cur = useCurrentFrame();
  const gf = at ?? cur;
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows={{type: THREE.PCFSoftShadowMap}} camera={{fov: FOV, near: 0.1, far: 400, position: [0, 2, 40]}}>
      <CamRig at={at} fixed={fixed} />
      <WaterWorld gf={gf} />
      {!fixed && <Rings3D gf={gf} />}
      {children}
    </ThreeCanvas>
  );
};

/** s2 "imagina beber...": a cena fica com cor de lembrança/imaginação até o rebobinar */
const World: React.FC = () => {
  const gf = useCurrentFrame();
  const s = sceneAt(gf);
  const k = imagineAmount(s, gf - s.startFrame);
  const filter = k > 0.01 ? `saturate(${1 - 0.7 * k}) sepia(${0.45 * k}) contrast(${1 + 0.06 * k})` : undefined;
  return (
    <AbsoluteFill style={{filter}}>
      <Background />
      <Scene3D />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#101820"}}>
    <World />
    {timed.map((s) => (
      <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames} name={s.id}>
        <Overlay s={s} />
        {hasVO(s.voKey) && (
          <Sequence from={VO_OFFSET} name={`vo-${s.id}`}>
            <Audio src={staticFile(`vo/${s.voKey}.mp3`)} />
          </Sequence>
        )}
        {s.id === "s2" && wordLocal(s, "Por") !== undefined && (
          <Sequence from={wordLocal(s, "Por")!} durationInFrames={40} name="rewind">
            <Audio src={staticFile("sfx/rewind.wav")} volume={0.45} />
          </Sequence>
        )}
        {s.id === "s2" && wordLocal(s, "imagina") !== undefined && (
          <Sequence from={wordLocal(s, "imagina")! - 8} durationInFrames={30} name="pause">
            <Audio src={staticFile("sfx/tick.wav")} volume={0.5} />
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
    <Audio src={staticFile("sfx/music.wav")} loop volume={(f) => musicVolume(f)} />
  </AbsoluteFill>
);
