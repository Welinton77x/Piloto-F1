import React from "react";
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {VO_OFFSET, config, finalCut, hasVO, sceneAt, timed, wordLocal} from "./data/scenes";
import {NeWorld} from "./components/NeWorld";
import {Post} from "./components/Post";
import {Overlay} from "./components/Overlay";
import {REWINDS, W, heat, imagineAmount, skyDark, start} from "./lib/story";
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
  const dark = skyDark(gf);
  const under = 0;
  const brand = clamp01((gf - finalCut) / 15);
  // céu claro de chuva leve → temporal escuro; azul profundo no subsolo; pôr do sol quando a chuva passa
  const h = heat(gf);
  let top = mixHex(mixHex("#86c4f0", "#ffb347", h * 0.7), "#14213f", dark);
  let bot = mixHex(mixHex("#dff0fb", "#ffe0a3", h * 0.8), "#2c3d66", dark);
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
      <NeWorld gf={gf} />
      <Post focus={poseAt(gf).pos.distanceTo(poseAt(gf).target)} />
      {/* círculos vermelhos removidos a pedido do usuário */}
      {children}
    </ThreeCanvas>
  );
};

/** s2 "imagina beber...": a cena fica com cor de lembrança/imaginação até o rebobinar */
const World: React.FC = () => {
  const gf = useCurrentFrame();
  const k = imagineAmount(gf);
  const filter = k > 0.01 ? `saturate(${1 - 0.7 * k}) sepia(${0.45 * k}) contrast(${1 + 0.06 * k})` : undefined;
  return (
    <AbsoluteFill style={{filter}}>
      <Background />
      <Scene3D />
    </AbsoluteFill>
  );
};

// efeitos pontuais amarrados às palavras (frames globais)
const SFX_AT: [number, string, number][] = [
  [start("s1") + 4, "calor.wav", 0.4],
  [W("s1", "sol"), "pop.wav", 0.3],
  [W("s2", "raios"), "whoosh.wav", 0.3],
  [W("s3", "Então") - 4, "steps.wav", 0.35],
  [W("s3", "interior") + 30, "calor.wav", 0.35],
  [W("s4", "seca") - 4, "steps.wav", 0.3],
  [W("s4", "seca") + 18, "sizzle.wav", 0.35],
  [W("s4", "seca") + 18, "ohno.wav", 0.4],
  [start("s5"), "whoosh.wav", 0.25],
  [W("s6", "água") - 4, "bubble.wav", 0.3],
  [W("s7", "subir"), "whoosh.wav", 0.3],
  [W("s7", "desce"), "whoosh.wav", 0.3],
  [W("s7", "calorão") - 10, "ohno.wav", 0.35],
  [W("s7", "calorão") + 4, "calor.wav", 0.4],
  [start("s8"), "fan.wav", 0.3],
  [start("s8") + 20, "calor.wav", 0.35],
  [W("s8", "suor"), "enxuga.wav", 0.4],
  [W("s8", "suor") + 10, "drip.wav", 0.25],
  [W("s9", "bebe") - 4, "gulp.wav", 0.45],
  [W("s9", "sede") + 8, "alivio.wav", 0.35],
  [W("s9", "foge") - 4, "steps.wav", 0.35],
  [W("s9", "sol") + 34, "alivio.wav", 0.4],
  [W("s10", "Parabéns"), "cheer.wav", 0.5],
  [W("s10", "Parabéns"), "confete.wav", 0.45],
  [W("s10", "Parabéns") + 4, "brilho.wav", 0.35],
  [W("s10", "Parabéns") + 22, "hop.wav", 0.3],
  [W("s10", "Parabéns") + 48, "hop.wav", 0.3],
];

export const Main: React.FC<{audioOnly?: boolean}> = ({audioOnly}) => (
  <AbsoluteFill style={{backgroundColor: "#101820"}}>
    {!audioOnly && <World />}
    {timed.map((s) => (
      <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames} name={s.id}>
        {!audioOnly && <Overlay s={s} />}
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
    {SFX_AT.map(([f, file, v], i) => (
      <Sequence key={"fx" + i} from={f} durationInFrames={90} name={file}>
        <Audio src={staticFile(`sfx/${file}`)} volume={v} />
      </Sequence>
    ))}
    {REWINDS.map((r) => (
      <React.Fragment key={r.id}>
        <Sequence from={r.P} durationInFrames={30} name={`pausa-${r.id}`}>
          <Audio src={staticFile("sfx/tick.wav")} volume={0.5} />
        </Sequence>
        <Sequence from={r.R} durationInFrames={40} name={`rebobinar-${r.id}`}>
          <Audio src={staticFile("sfx/rewind.wav")} volume={0.45} />
        </Sequence>
      </React.Fragment>
    ))}
    <Audio src={staticFile("sfx/music.wav")} loop volume={(f) => musicVolume(f)} />
  </AbsoluteFill>
);
