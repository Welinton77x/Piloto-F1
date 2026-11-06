// Composição de teste: o mascote visto de frente, de lado e em 3/4 (conferir boné e proporções).
import React from "react";
import {AbsoluteFill} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {Mascot} from "./components/Mascot";
import type {MascotPose} from "./components/Mascot";

const pose: MascotPose = {emotion: "happy", talk: 0, lArm: [4, 12], rArm: [4, 12], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false};
const Cam: React.FC<{az: number}> = ({az}) => {
  const camera = useThree((s) => s.camera);
  const r = 3.2, a = (az * Math.PI) / 180;
  camera.position.set(Math.sin(a) * r, 1.45, Math.cos(a) * r);
  camera.lookAt(0, 1.35, 0);
  camera.updateProjectionMatrix();
  return null;
};
export const MascotTest: React.FC = () => (
  <AbsoluteFill style={{background: "#cfe8ff", flexDirection: "row"}}>
    {[0, 45, 90].map((az) => (
      <div key={az} style={{width: 600, height: 800, position: "relative"}}>
        <ThreeCanvas width={600} height={800} camera={{fov: 22, position: [0, 1.4, 3]}}>
          <Cam az={az} />
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#ffffff", "#7a6a5a", 0.8]} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <Mascot position={[0, 0, 0]} scale={1} pose={pose} gf={10} look={{}} />
        </ThreeCanvas>
      </div>
    ))}
  </AbsoluteFill>
);
