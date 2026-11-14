// Composição de teste: o mascote novo (estilo da referência) em várias poses e ângulos.
import React from "react";
import {AbsoluteFill} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {MascotRef} from "./components/MascotRef";
import type {RefLook} from "./components/MascotRef";
import type {MascotPose} from "./components/Mascot";

const P = (p: Partial<MascotPose>): MascotPose => ({emotion: "happy", talk: 0, lArm: [4, 12], rArm: [4, 12], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false, ...p});
const HY = 2.16, SY = 1.72;
const CASES: {az: number; pose: MascotPose; look: RefLook; label: string; r?: number; y?: number}[] = [
  {az: 0, pose: P({emotion: "sick", rArm: [-10, 25], lArm: [-10, 25]}), look: {hot: 1, tongue: true, rReach: [0.36, HY - 0.05, 0.42], lReach: [-0.3, SY + 0.02, 0.32]}, label: "abana"},
  {az: 35, pose: P({emotion: "happy", rArm: [4, 12], lArm: [4, 12]}), look: {}, label: "3/4"},
  {az: 90, pose: P({emotion: "happy", rArm: [4, 12], lArm: [4, 12]}), look: {}, label: "lado"},
  {az: 8, pose: P({emotion: "relieved", rArm: [-25, 8]}), look: {bottle: 0.6, drink: 1}, label: "bebendo", r: 4.6, y: 1.7},
  {az: 50, pose: P({emotion: "relieved", rArm: [-25, 8]}), look: {bottle: 0.6, drink: 1}, label: "bebendo 3/4", r: 4.6, y: 1.7},
  {az: 0, pose: P({emotion: "sick", lArm: [-95, 28]}), look: {rReach: [0.15, HY + 0.14, 0.45]}, label: "testa", r: 4.6, y: 1.7},
  {az: 160, pose: P({emotion: "happy"}), look: {}, label: "costas"},
];
const Cam: React.FC<{az: number; r?: number; y?: number}> = ({az, r = 8.5, y = 1.3}) => {
  const camera = useThree((s) => s.camera);
  const a = (az * Math.PI) / 180;
  camera.position.set(Math.sin(a) * r, y + 0.25, Math.cos(a) * r);
  camera.lookAt(0, y, 0);
  camera.updateProjectionMatrix();
  return null;
};
export const MascotTest: React.FC = () => (
  <AbsoluteFill style={{background: "#cfe8ff", flexDirection: "row"}}>
    {CASES.map((c, i) => (
      <div key={i} style={{width: 360, height: 800, position: "relative"}}>
        <ThreeCanvas width={360} height={800} camera={{fov: 24, position: [0, 1.4, 3]}}>
          <Cam az={c.az} r={c.r} y={c.y} />
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#ffffff", "#7a6a5a", 0.8]} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <MascotRef pose={c.pose} gf={30} look={c.look} />
        </ThreeCanvas>
      </div>
    ))}
  </AbsoluteFill>
);
