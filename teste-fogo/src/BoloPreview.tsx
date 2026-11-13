import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Toy} from "./Toy";
import {Post} from "./Post";
import {BakeKitchen, Oven, Fridge, OVEN_P, FRIDGE_P, ISLAND, ISLAND_TOP, EggBowl, FlourSack, ChefHat, Shades, Penguin, Chick, Batter, Podium, FlourSnowman, UFO, FlyingKitchen, ColdMist} from "./Sets11";
import {Alien} from "./Sets9";

const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.near = 0.03;
  c.far = 200;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const CHEF = {hoodie: true, apron: true};
export const BoloPreview: React.FC = () => {
  const f = useCurrentFrame();
  const t = 1.3;
  if (f === 0)
    return (
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
          <Cam pos={[0.3, 1.9, 4.6]} look={[0.2, 1.3, -1.2]} fov={52} />
          <color attach="background" args={["#fff"]} />
          <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
          <pointLight position={[0.3, 3.2, 1.2]} intensity={12} distance={12} decay={1.4} castShadow />
          <BakeKitchen />
          <Oven p={OVEN_P} o={{mood: 1, rage: 0.4, t}} />
          <Fridge p={FRIDGE_P} f={{love: 1, open: 0.6, t}} />
          <ColdMist p={[FRIDGE_P[0], 0, FRIDGE_P[2] + 0.6]} k={1} t={t} dir={[0.5, 0, 0.8]} />
          <EggBowl p={[ISLAND[0] - 0.6, ISLAND_TOP, ISLAND[2]]} />
          <FlourSack p={[ISLAND[0] + 0.7, ISLAND_TOP, ISLAND[2]]} />
          <Toy pose={{pos: [ISLAND[0], 0, ISLAND[2] - 0.85], rotY: 0, smile: 0.8, rShoulder: [-0.6, 0, -0.2], rElbow: -1.0}} look={CHEF} headExtra={<><ChefHat /><Shades /></>} />
          <Post bloom={0.5} />
        </ThreeCanvas>
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill>
      <ThreeCanvas width={2200} height={800} shadows gl={{antialias: true}} dpr={1}>
        <Cam pos={[0, 1.4, 11]} look={[0, 1.0, 0]} fov={30} />
        <color attach="background" args={["#cfe3f7"]} />
        <hemisphereLight args={["#ffffff", "#9ab0c8", 1.3]} />
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <Oven p={[-6.2, 0, 0]} o={{mood: 1, rage: 1, t}} />
        <Fridge p={[-4.6, 0, 0]} f={{love: 1, open: 0.5, t}} />
        <Penguin p={[-3.1, 0, 0.3]} phone t={t} />
        <FlourSnowman p={[-1.8, 0, 0]} t={t} />
        <group position={[-0.4, 0, 0.6]}>
          <Chick c={{pos: [-0.3, 0, 0], inst: "pandeiro", hat: true, t, s: 2.2}} />
          <Chick c={{pos: [0.25, 0, 0], inst: "cavaco", t, s: 2.2, peep: 1}} />
          <Chick c={{pos: [0.75, 0, 0], inst: "mic", t, s: 2.2}} />
        </group>
        <Podium p={[1.5, 0, 0]} s={1.6} />
        <Batter b={{pos: [1.5, 0.62, -0.1], sash: true, t, s: 1.6, arms: "wave"}} />
        <Batter b={{pos: [2.8, 0, 0.2], crown: 1, t, s: 1.8, mouth: 0.5, arms: "up"}} />
        <Alien a={{pos: [3.9, 0, 0], rotY: -0.3, t}} />
        <UFO p={[5.4, 1.6, 0]} t={t} beam={1} s={0.9} />
        <FlyingKitchen p={[5.6, -0.2, -3]} s={0.5} flame={1} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
