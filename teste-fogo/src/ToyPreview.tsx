import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Toy} from "./Toy";
import type {Pose} from "./Boy";

/* Folha de apresentação do boneco novo (quadro 0: corpo inteiro; quadro 1: expressões) */
const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.near = 0.05;
  c.far = 100;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const Lights: React.FC = () => (
  <>
    <color attach="background" args={["#cfe3f7"]} />
    <hemisphereLight args={["#ffffff", "#9ab0c8", 1.4]} />
    <directionalLight position={[3, 6, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={4} shadow-camera-bottom={-2} />
    <directionalLight position={[-4, 3, 2]} intensity={0.6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 20]} />
      <shadowMaterial opacity={0.18} />
    </mesh>
  </>
);
const base: Pose = {rShoulder: [0, 0, -0.12], lShoulder: [0, 0, 0.12], rElbow: -0.15, lElbow: -0.15};
export const ToyPreview: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) {
    const row: {x: number; rotY: number; pose: Pose}[] = [
      {x: -4.2, rotY: 0, pose: {...base, smile: 0.6}},
      {x: -2.5, rotY: 0.6, pose: {...base, smile: 0.9, rShoulder: [-0.4, 0, -0.25], rElbow: -0.9}},
      {x: -0.8, rotY: Math.PI / 2, pose: {...base}},
      {x: 0.9, rotY: Math.PI, pose: {...base}},
      {x: 2.6, rotY: 0.4, pose: {walk: 0.9, walkAmt: 1, rShoulder: [0.35, 0, -0.1], lShoulder: [-0.35, 0, 0.1], rElbow: -0.4, lElbow: -0.4, smile: 0.7}},
      {x: 4.3, rotY: -0.3, pose: {...base, eyeWide: 1, mouthOpen: 0.8, brow: 1, rShoulder: [-2.6, 0, -0.5], lShoulder: [-2.6, 0, 0.5]}},
    ];
    return (
      <AbsoluteFill>
        <ThreeCanvas width={2000} height={700} shadows gl={{antialias: true}} dpr={1}>
          <Cam pos={[0, 1.15, 9.2]} look={[0, 1.0, 0]} fov={30} />
          <Lights />
          {row.map((r, i) => (
            <group key={i} position={[r.x, 0, 0]}>
              <Toy pose={{...r.pose, rotY: r.rotY}} look={i === 3 || i === 2 ? {backpack: "#2f6fd6"} : {}} />
            </group>
          ))}
        </ThreeCanvas>
      </AbsoluteFill>
    );
  }
  const faces: Pose[] = [
    {...base, smile: 1},
    {...base, eyeWide: 1, mouthOpen: 0.9, brow: 1},
    {...base, brow: -0.8, smile: 0, mouthOpen: 0},
    {...base, blink: 0.45, bags: 1, smile: 0.1, hairLift: 1},
    {...base, smile: 0.4, blink: 1},
  ];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={2000} height={700} shadows gl={{antialias: true}} dpr={1}>
        <Cam pos={[0, 1.72, 6.2]} look={[0, 1.6, 0]} fov={22} />
        <Lights />
        {faces.map((p, i) => (
          <group key={i} position={[(i - 2) * 0.82, 0, 0]}>
            <Toy pose={{...p, head: [0, (i - 2) * -0.12, 0]}} />
          </group>
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
