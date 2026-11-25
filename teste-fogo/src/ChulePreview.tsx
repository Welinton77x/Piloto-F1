import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Toy} from "./Toy";
import {Post} from "./Post";
import {WeddingPigeon} from "./Sets10";
import {Octopus, CarRobot, DAD, DadHead} from "./Sets12";
import {Shades} from "./Sets11";
import {Sneaker, Chinelo, Chule, SunFace, Backyard, SkyDome, SILL, Perfume, Mist, TalentStage, Plaque, Trophy, MoneyPile, Skate, FireTruck, WaterJet, Rain, Umbrella, FireHelmet, NoseClip, WeatherStudio, Runway, ShoeStore, ShoeBox} from "./Sets13";

const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.near = 0.03;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const L = (x: number) => <hemisphereLight args={["#ffffff", "#9ab0c8", 1.2 * x]} />;
export const ChulePreview: React.FC = () => {
  const f = useCurrentFrame();
  const t = 1.3;
  const scenes: Record<number, React.ReactNode> = {
    0: (
      <>
        <Cam pos={[1.6, 1.7, 3.6]} look={[-1.0, 1.6, -3.0]} fov={55} />
        <SkyDome night={0} />
        {L(1)}
        <directionalLight position={[3, 8, 5]} intensity={2.2} castShadow />
        <Backyard t={t} />
        <SunFace p={[4, 16, -70]} r={5} t={t} />
        <Sneaker p={[SILL[0], SILL[1], SILL[2] - 0.2]} r={[0, 1.2, 0]} s={0.36} />
        <Sneaker p={[SILL[0], SILL[1], SILL[2] + 0.2]} r={[0, 1.4, 0]} s={0.36} />
        <Toy pose={{pos: [-0.9, 0, -1.4], rotY: 0.4, smile: 0.6}} look={{hoodie: true, socks: "#ffffff"}} />
        <Chule c={{pos: [-1.4, 2.2, -2.2], s: 0.6, t}} />
      </>
    ),
    1: (
      <>
        <Cam pos={[0, 1.0, 6.5]} look={[0, 0.7, 0]} fov={40} />
        <color attach="background" args={["#cfe3f7"]} />
        {L(1)}
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <Sneaker p={[-1.3, 0, 0.6]} r={[0, 0.5, 0]} s={0.9} />
        <Sneaker p={[0, 0, 0.6]} r={[0, 0.2, 0]} s={0.9} c={{alive: 1, mood: 1, arms: "crossed", t}} />
        <Sneaker p={[1.3, 0, 0.6]} r={[0, -0.3, 0]} s={0.9} c={{alive: 1, smile: 1, arms: "up", bowtie: true, tongue: 1, t}} />
        <Chinelo p={[-1.0, 1.0, -1]} s={1.1} c={{alive: 1, veil: 1, smile: 1}} />
        <Chinelo p={[0.2, 1.0, -1]} s={1.1} stand={false} />
        <Chule c={{pos: [1.2, 1.9, -1], s: 0.8, t, pink: 1, mustache: 1, arms: "opera", mouth: 0.7}} />
        <Chule c={{pos: [-0.3, 2.4, -1.5], s: 0.6, t, arms: "mic", smile: 1}} />
      </>
    ),
    2: (
      <>
        <Cam pos={[0, 0, 26]} look={[0, 0, 0]} fov={40} />
        <SkyDome night={0.6} t={t} />
        <SunFace p={[0, 4.5, 0]} r={3} t={t} sniff={1} />
        <SunFace p={[0, -4.5, 0]} r={3} t={t} faint={1} green={0.8} band />
      </>
    ),
    3: (
      <>
        <Cam pos={[2.6, 2.4, 6.2]} look={[0, 1.4, -1.5]} fov={55} />
        {L(0.7)}
        <pointLight position={[0, 4, 0]} intensity={20} distance={14} decay={1.4} castShadow />
        <TalentStage t={t} />
        <Chule c={{pos: [0, 1.6, -3.0], s: 0.8, t, pink: 1, mustache: 1, arms: "mic", mouth: 0.6}} />
        <WeddingPigeon p={{pos: [-1.5, 0.9, 2.1], rotY: Math.PI, t}} s={2.4} />
        <Octopus o={{pos: [0, 0.1, 2.6], rotY: Math.PI, t, shades: true, s: 0.9, wrench: false}} />
        <CarRobot p={[1.6, 0, 2.5]} rotY={Math.PI} t={t} s={0.45} mic={false} />
        <Plaque p={[0.7, 1.2, 1.9]} r={[0, Math.PI, 0]} />
        <Trophy p={[-0.6, 0.9, 1.95]} s={1.2} />
      </>
    ),
    4: (
      <>
        <Cam pos={[2, 2.5, 11]} look={[0, 1.4, 0]} fov={55} />
        <color attach="background" args={["#cfe3f7"]} />
        {L(1)}
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <FireTruck p={[-2.2, 0, -1]} rotY={0.6} t={t} />
        <WaterJet a={[-0.5, 1.6, 0.5]} b={[2.5, 3.0, -0.5]} k={1} t={t} />
        <Rain c={[2.5, 0, 1.5]} size={[3, 5, 2]} t={t} />
        <Toy pose={{pos: [2.6, 0, 1.5], rotY: -0.4, rShoulder: [-1.2, 0, 0.3], rElbow: -1.2}} look={{shirt: "#ff6fb1", hairStyle: "ponytail"}} headExtra={<NoseClip color="#3a86ff" />} />
        <Umbrella p={[2.5, 1.3, 1.9]} />
        <Toy pose={{pos: [0.4, 0, 1.6], rotY: 0.2}} look={{shirt: "#2b2e3b", pants: "#2b2e3b"}} headExtra={<FireHelmet />} />
        <Toy pose={{pos: [-0.8, 0, 2.6], rotY: 0.3, smile: 1}} look={{hoodie: true, suit: true, shoe: "#15161d", sole: "#15161d"}} headExtra={<><Shades /><NoseClip gold /></>} />
        <Toy pose={{pos: [-2.6, 0, 2.6], rotY: 0.3, smile: 0.2}} look={{...DAD, bareR: true}} headExtra={<DadHead />} />
        <Perfume p={[1.2, 0, 3.4]} s={1.4} />
        <Mist p={[1.2, 0.8, 3.4]} dir={[0.5, 0.6, 0]} k={1} t={t} />
        <Skate p={[-0.1, 0, 3.4]} r={[0, 1, 0]} />
        <MoneyPile p={[3.6, 0, -1.5]} s={1} />
        <ShoeBox p={[0.3, 0, 4.0]} open={0.6} />
      </>
    ),
    5: (
      <>
        <Cam pos={[0, 1.7, 4.8]} look={[0, 1.6, -2]} fov={55} />
        {L(0.9)}
        <pointLight position={[0, 3, 2]} intensity={14} distance={12} decay={1.4} />
        <WeatherStudio />
        <Toy pose={{pos: [1.3, 0, -0.6], rotY: -0.5, rShoulder: [-1.5, -0.6, 0], rElbow: 0}} look={{shirt: "#ff6fb1", hairStyle: "long", hair: "#5a2a14", lashes: true, lips: "#d4486a"}} />
      </>
    ),
    6: (
      <>
        <Cam pos={[2.2, 2.4, 5.5]} look={[0, 1, -2]} fov={55} />
        {L(0.8)}
        <pointLight position={[0, 4, 1]} intensity={16} distance={14} decay={1.4} castShadow />
        <Runway t={t} />
        <Toy pose={{pos: [0, 0.4, 0], rotY: 0, smile: 1}} look={{shirt: "#ffd21f", hairStyle: "bun", lashes: true}} headExtra={<NoseClip color="#ff4d6d" />} />
      </>
    ),
    7: (
      <>
        <Cam pos={[1.5, 1.7, 4.5]} look={[0, 1.4, -2]} fov={55} />
        {L(1)}
        <pointLight position={[0, 3.6, 1]} intensity={12} distance={12} decay={1.4} castShadow />
        <ShoeStore />
        <Toy pose={{pos: [0.6, 0, 0.3], rotY: -0.2, smile: 1}} look={{hoodie: true, shoe: "#ffd21f", sole: "#ffffff"}} />
      </>
    ),
  };
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        {scenes[f] ?? scenes[0]}
        <Post bloom={0.5} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
