import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Toy} from "./Toy";
import {HER_CASUAL, HER_BRIDE, GROOM, Bouquet} from "./Sets10";
import {ChefHat, Shades} from "./Sets11";
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
              <Toy pose={{...r.pose, rotY: r.rotY}} look={i === 3 || i === 2 ? {hoodie: true, backpack: "#2f6fd6"} : {hoodie: true}} />
            </group>
          ))}
        </ThreeCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 5 || f === 6) {
    /* quadro 5: o cozinheiro de corpo inteiro (chapéu, avental branco, óculos escuro); quadro 6: rosto de perto */
    const CHEF = {hoodie: true, apron: true};
    const extra = (
      <>
        <ChefHat />
        <Shades />
      </>
    );
    const crossed: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
    const row: {x: number; rotY: number; pose: Pose}[] = [
      {x: -3.6, rotY: 0, pose: {...base, smile: 0.7}},
      {x: -1.8, rotY: 0.6, pose: {...base, ...crossed, smile: 0.9, brow: -0.3}},
      {x: 0, rotY: Math.PI / 2, pose: {...base}},
      {x: 1.8, rotY: Math.PI, pose: {...base}},
      {x: 3.6, rotY: -0.45, pose: {...base, smile: 1, mouthOpen: 0.4, rShoulder: [-2.6, 0, -0.4], rElbow: -0.3, lShoulder: [-0.4, 0, 0.3], lElbow: -1.0}},
    ];
    const faces = f === 6;
    return (
      <AbsoluteFill>
        <ThreeCanvas width={2000} height={700} shadows gl={{antialias: true}} dpr={1}>
          {faces ? <Cam pos={[0, 1.8, 3.6]} look={[0, 1.72, 0]} fov={26} /> : <Cam pos={[0, 1.25, 9.6]} look={[0, 1.12, 0]} fov={30} />}
          <Lights />
          {faces
            ? [
                {x: -0.75, rotY: 0, pose: {...base, smile: 0.8} as Pose},
                {x: 0.75, rotY: 0.65, pose: {...base, smile: 1, brow: 0.8, mouthOpen: 0.35} as Pose},
              ].map((r, i) => (
                <group key={i} position={[r.x, 0, 0]}>
                  <Toy pose={{...r.pose, rotY: r.rotY}} look={CHEF} headExtra={extra} />
                </group>
              ))
            : row.map((r, i) => (
                <group key={i} position={[r.x, 0, 0]}>
                  <Toy pose={{...r.pose, rotY: r.rotY}} look={CHEF} headExtra={extra} />
                </group>
              ))}
        </ThreeCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 3 || f === 4) {
    /* quadro 3: corpo inteiro (ela com a roupa da foto, de noiva, e o noivo); quadro 4: rostos */
    const hold: Pose = {rShoulder: [-0.62, 0, 0.38], rElbow: -1.05, lShoulder: [-0.62, 0, -0.38], lElbow: -1.05};
    const row: {x: number; rotY: number; look: typeof HER_CASUAL; pose: Pose; bq?: boolean}[] = [
      {x: -4.4, rotY: 0.0, look: HER_CASUAL, pose: {...base, smile: 0.7}},
      {x: -2.7, rotY: 0.55, look: HER_CASUAL, pose: {...base, smile: 0.7, rShoulder: [-1.8, 0, 0.35], rElbow: -1.9} as Pose},
      {x: -0.85, rotY: 0.0, look: HER_BRIDE, pose: {...base, ...hold, smile: 0.9}, bq: true},
      {x: 1.05, rotY: Math.PI * 0.82, look: HER_BRIDE, pose: {...base, ...hold, smile: 0.9}, bq: true},
      {x: 2.85, rotY: 0.0, look: GROOM, pose: {...base, smile: 0.8}},
      {x: 4.45, rotY: -0.5, look: GROOM, pose: {...base, smile: 1, rShoulder: [-1.2, 0, -0.1], rElbow: -0.4}},
    ];
    const faces = f === 4;
    return (
      <AbsoluteFill>
        <ThreeCanvas width={2000} height={700} shadows gl={{antialias: true}} dpr={1}>
          {faces ? <Cam pos={[0, 1.72, 4.2]} look={[0, 1.62, 0]} fov={26} /> : <Cam pos={[0, 1.15, 9.6]} look={[0, 1.0, 0]} fov={30} />}
          <Lights />
          {faces
            ? [
                {x: -1.0, rotY: 0, look: HER_CASUAL},
                {x: 0, rotY: 0.6, look: HER_CASUAL},
                {x: 1.0, rotY: -0.25, look: GROOM},
              ].map((r, i) => (
                <group key={i} position={[r.x, 0, 0]}>
                  <Toy pose={{...base, smile: 0.8, rotY: r.rotY}} look={r.look} />
                </group>
              ))
            : row.map((r, i) => (
                <group key={i} position={[r.x, 0, 0]}>
                  <Toy pose={{...r.pose, rotY: r.rotY}} look={r.look} />
                  {r.bq && (
                    <group rotation={[0, r.rotY, 0]}>
                      <Bouquet p={[0, 0.86, 0.36]} r={[0.35, 0, 0]} s={1.15} />
                    </group>
                  )}
                </group>
              ))}
        </ThreeCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 2) {
    const styles = ["spiky", "curly", "ponytail", "pigtails", "buzz", "long", "bun"] as const;
    const hairs = ["#1a1a1a", "#2a170d", "#7a3a1a", "#d9b56a", "#1a1a1a", "#5a3418", "#1a1a1a"];
    const shirts = ["#e74c3c", "#3498db", "#ff6f91", "#9b59b6", "#2ecc71", "#1abc9c", "#f39c12"];
    return (
      <AbsoluteFill>
        <ThreeCanvas width={2000} height={700} shadows gl={{antialias: true}} dpr={1}>
          <Cam pos={[0, 1.4, 9.6]} look={[0, 1.1, 0]} fov={30} />
          <Lights />
          {styles.map((st, i) => (
            <group key={i} position={[(i - 3) * 1.5, 0, 0]} rotation={[0, i % 2 ? 0.5 : -0.5, 0]}>
              <Toy pose={{...base, smile: 0.8}} look={{hairStyle: st, hair: hairs[i], shirt: shirts[i]}} />
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
            <Toy pose={{...p, head: [0, (i - 2) * -0.12, 0]}} look={{hoodie: true}} />
          </group>
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
