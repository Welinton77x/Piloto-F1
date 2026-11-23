import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import * as THREE from "three";
import {Sky, SunLight, Town} from "./Sets5";
import {Toy} from "./Toy";
import {Post} from "./Post";

const CamSet: React.FC = () => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(0, 1.5, 6.2);
  c.fov = 50;
  c.updateProjectionMatrix();
  c.lookAt(0, 1.0, 0);
  return null;
};
const BOY = {hoodie: true, lowpoly: true};
export const BlockTest: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={1080} height={1920} shadows dpr={1}>
        <CamSet />
        <Sky />
        <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
        <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
        <group position={[0, 0, -3]}>
          <Town t={t} galo={false} variant="nova" flat clouds />
        </group>
        <Toy look={BOY} pose={{pos: [-1.2, 0, 0.5], rotY: 0.3, smile: 1}} />
        <Toy look={BOY} pose={{pos: [0, 0, 0.8], rotY: 0, rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2, mouthOpen: 0.7, eyeWide: 1, brow: 1}} />
        <Toy look={BOY} pose={{pos: [1.2, 0, 0.5], rotY: -0.6, walk: 1.0, walkAmt: 1, rShoulder: [-0.8, 0, -0.15], rElbow: -1.2, lShoulder: [0.8, 0, 0.15], lElbow: -1.2, blink: 1}} />
        <Post bloom={0.4} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
