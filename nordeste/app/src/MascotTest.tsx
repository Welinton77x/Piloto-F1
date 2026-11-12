// Composição de teste: o mascote novo (estilo da referência) em várias poses e ângulos.
import React from "react";
import {AbsoluteFill} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {MascotRef} from "./components/MascotRef";
import type {RefLook} from "./components/MascotRef";
import type {MascotPose} from "./components/Mascot";

const P = (p: Partial<MascotPose>): MascotPose => ({emotion: "happy", talk: 0, lArm: [4, 12], rArm: [4, 12], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false, ...p});
const CASES: {az: number; pose: MascotPose; look: RefLook; label: string}[] = [
  {az: 0, pose: P({emotion: "sick", rArm: [-150, -30], lArm: [-10, 25]}), look: {hot: 1, tongue: true}, label: "calor"},
  {az: 40, pose: P({emotion: "happy"}), look: {}, label: "3/4"},
  {az: 90, pose: P({emotion: "happy"}), look: {}, label: "lado"},
  {az: 0, pose: P({emotion: "curious", lArm: [-80, -40], rArm: [-80, -40]}), look: {}, label: "lápis"},
  {az: 0, pose: P({emotion: "joy", jump: 0.35, rArm: [-10, 160], lArm: [-10, 70]}), look: {}, label: "pulo"},
];
const Cam: React.FC<{az: number}> = ({az}) => {
  const camera = useThree((s) => s.camera);
  const r = 6.2, a = (az * Math.PI) / 180;
  camera.position.set(Math.sin(a) * r, 1.3, Math.cos(a) * r);
  camera.lookAt(0, 1.05, 0);
  camera.updateProjectionMatrix();
  return null;
};
export const MascotTest: React.FC = () => (
  <AbsoluteFill style={{background: "#cfe8ff", flexDirection: "row"}}>
    {CASES.map((c, i) => (
      <div key={i} style={{width: 360, height: 800, position: "relative"}}>
        <ThreeCanvas width={360} height={800} camera={{fov: 24, position: [0, 1.4, 3]}}>
          <Cam az={c.az} />
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#ffffff", "#7a6a5a", 0.8]} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <MascotRef pose={c.pose} gf={30} look={c.look} />
        </ThreeCanvas>
      </div>
    ))}
  </AbsoluteFill>
);
