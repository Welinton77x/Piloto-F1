// Capa do Short (1080×1920) no padrão das capas de referência: cena clara, título branco com
// palavras-chave em amarelo e vermelho, mascote reagindo e círculo vermelho no objeto principal.
import React from "react";
import * as THREE from "three";
import {AbsoluteFill} from "remotion";
import {Background, Scene3D} from "./Main";
import type {FixedPose} from "./Main";
import {FONT} from "./components/Overlay";
import {FOV} from "./lib/camera";

type P = {at: number; dy?: number; fixed?: FixedPose; ring?: [number, number, number]; ringR?: number};

const projectFixed = (fixed: FixedPose, p: [number, number, number]) => {
  const cam = new THREE.PerspectiveCamera(FOV, 1080 / 1920, 0.1, 400);
  cam.position.set(...fixed.pos);
  cam.lookAt(new THREE.Vector3(...fixed.target));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return {x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920};
};

const W: React.FC<{c?: string; children: React.ReactNode}> = ({c = "#fff", children}) => <span style={{color: c}}>{children}</span>;

export const Cover: React.FC<P> = ({at, dy = 0, fixed, ring, ringR = 150}) => {
  const rp = fixed && ring ? projectFixed(fixed, ring) : null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: "brightness(1.12) saturate(1.2)"}}>
        <Background at={at} />
        <AbsoluteFill style={{transform: `translateY(${dy}px)`}}>
          <Scene3D at={at} fixed={fixed} />
        </AbsoluteFill>
      </AbsoluteFill>
      {rp && (
        <svg width={1080} height={1920} style={{position: "absolute", left: 0, top: 0}}>
          <circle cx={rp.x} cy={rp.y + dy} r={ringR} fill="none" stroke="#fff" strokeWidth={22} />
          <circle cx={rp.x} cy={rp.y + dy} r={ringR} fill="none" stroke="#E0201B" strokeWidth={13} />
        </svg>
      )}
      <div style={{position: "absolute", top: 210, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: "#fff", WebkitTextStroke: "16px #101820", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div>DE ONDE VEM</div>
        <div>
          A <W c="#FFD400">ÁGUA</W> DA
        </div>
        <div>
          SUA <W c="#FF2B2B">TORNEIRA</W>?
        </div>
      </div>
    </AbsoluteFill>
  );
};
