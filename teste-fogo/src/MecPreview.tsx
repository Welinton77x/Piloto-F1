import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Toy} from "./Toy";
import {Post} from "./Post";
import {WeddingPigeon} from "./Sets10";
import {Car, Cup, FruitStall, Pan, Workshop, Octopus, CarRobot, Receipt, Fly, Sponge, Scissors, DAD, DadHead, Melon} from "./Sets12";

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
export const MecPreview: React.FC = () => {
  const f = useCurrentFrame();
  const t = 1.3;
  if (f === 0)
    return (
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
          <Cam pos={[0.5, 2.2, 6.2]} look={[0, 1.4, -1.5]} fov={55} />
          <color attach="background" args={["#fff"]} />
          <hemisphereLight args={["#fff6e6", "#8a8f99", 1.0]} />
          <pointLight position={[0.3, 3.8, 1.5]} intensity={12} distance={14} decay={1.4} castShadow />
          <Workshop />
          <Car p={[-1.2, 0, -1.5]} rotY={0.5} c={{t, mood: 0.5, smile: 1}} s={1.6} />
          <Octopus o={{pos: [1.3, 0, -0.5], rotY: -0.3, t, tools: true, work: 1, s: 1.1}} />
          <Toy pose={{pos: [0.3, 0, 0.6], rotY: 0.2, smile: 0.8}} look={{hoodie: true, hairStyle: "mohawk"}} />
          <Receipt p={[2.6, 2.4, 0.5]} len={3.0} hang={2.4} />
          <Post bloom={0.5} />
        </ThreeCanvas>
      </AbsoluteFill>
    );
  const views: Record<number, {pos: [number, number, number]; look: [number, number, number]; fov: number}> = {
    1: {pos: [0, 1.5, 5.2], look: [0, 1.15, 0], fov: 40},
    2: {pos: [3.3, 1.5, 4.4], look: [3.1, 1.05, 0], fov: 45},
    3: {pos: [4.5, 9.5, 5.5], look: [0, 8.0, -2], fov: 45},
    5: {pos: [-2.5, 2.2, 4.5], look: [-3.5, 2.0, -2], fov: 50},
    4: {pos: [7.5, 1.7, 6], look: [7.5, 1.2, 0], fov: 50},
  };
  const v = views[f] ?? views[1];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Cam pos={v.pos} look={v.look} fov={v.fov} />
        <color attach="background" args={["#cfe3f7"]} />
        <hemisphereLight args={["#ffffff", "#9ab0c8", 1.3]} />
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <Toy pose={{pos: [-0.7, 0, 0], rotY: 0.3, smile: 0.4, brow: -0.3}} look={DAD} headExtra={<DadHead />} />
        <Toy pose={{pos: [0.7, 0, 0], rotY: -0.3, smile: 0.8}} look={{hoodie: true, hairStyle: "mohawk"}} />
        <Octopus o={{pos: [3.0, 0, 0], rotY: 0.15, t, s: 1.1, mouth: 0}} />
        <group position={[0, 6, -2]}>
          <WeddingPigeon p={{pos: [0, 0, 0], rotY: 0.6, t, flap: 1}} s={7} />
          <Toy pose={{pos: [0, 1.9, 0], rotY: 0.6, legLift: 1, smile: 0.8, head: [0, 1.2, 0], rShoulder: [-0.5, 0, 0.3], lShoulder: [-0.5, 0, -0.3]}} look={{hoodie: true}} />
        </group>
        <CarRobot p={[-3.5, 0, -2]} rotY={0.3} t={t} dance={1} mouth={0.6} s={0.95} />
        <FruitStall p={[7.5, 0, -1]} kind="melancia" />
        <Car p={[7.6, 0, 1.4]} rotY={0.3} c={{t, melon: 1, blink: 0.3}} s={1.2} />
        <Toy pose={{pos: [9.0, 0, 0.4], rotY: -0.5, smile: 0.6, rShoulder: [-1.4, 0, 0.3], rElbow: -0.2}} look={{shirt: "#2ecc71", apron: true, hairStyle: "buzz", skin: "#c98f62"}} />
        <Pan p={[8.0, 1.2, 2.5]} s={1.5} t={t} />
        <Scissors p={[2.0, 1.6, 1]} t={t} s={2} />
        <Sponge p={[4.0, 1.6, 1]} s={2} />
        <Fly p={[3.0, 2.2, 1]} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
