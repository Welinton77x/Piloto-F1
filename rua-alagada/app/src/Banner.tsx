// Banner do canal (2560×1440), versão do usuário refeita no 3D liso dos vídeos:
// personagem cacheado de macacão com chave inglesa, lâmpada no logo, slogan "Descubra, Construa e Aprenda!".
// Área segura (aparece em todos os aparelhos): 1546×423 no centro.
import React from "react";
import * as THREE from "three";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {Scene3D} from "./Main";
import {Mascot} from "./components/Mascot";
import type {MascotPose} from "./components/Mascot";
import {FONT} from "./components/Overlay";
import {totalFrames} from "./data/scenes";
import {FOV, mapX} from "./lib/camera";

export const SAFE = {w: 1546, h: 423};
const AT = totalFrames - 10; // mundo completo, rua seca

// personagem em pé no gramado do lote; câmera montada para o busto dele ficar à esquerda da área segura
const FEET = new THREE.Vector3(mapX(-3.0) - 0.9, 0.06, 0.2);
const DIST = 9.0;
const AZ = 0.42, EL = 0.07;
const back = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
const right = new THREE.Vector3(0, 1, 0).cross(back).normalize();
const up = back.clone().cross(right).normalize();
const unitsPerPx = (2 * DIST * Math.tan(((FOV / 2) * Math.PI) / 180)) / 1440;
const SCALE = 1.0;
const TARGET = FEET.clone().add(right.clone().multiplyScalar(560 * unitsPerPx)).add(up.clone().multiplyScalar(545 * unitsPerPx));
const POS = TARGET.clone().add(back.clone().multiplyScalar(DIST));

const pose: MascotPose = {emotion: "grin", talk: 0, lArm: [6, 20], rArm: [-100, 28], umbrella: "none", umbrellaTilt: 0, jump: 0, shiver: 0, walking: false};

const Bulb: React.FC = () => (
  <svg width={160} height={144} viewBox="0 0 120 108">
    {[-60, -30, 0, 30, 60].map((a) => (
      <rect key={a} x={57} y={2} width={6} height={18} rx={3} fill="#FFD400" stroke="#101820" strokeWidth={2} transform={`rotate(${a} 60 58)`} />
    ))}
    <circle cx={60} cy={56} r={26} fill="#FFE14D" stroke="#101820" strokeWidth={4} />
    <circle cx={52} cy={48} r={7} fill="#fffbe0" />
    <path d="M50 62 l5 8 l5 -8 l5 8 l5 -8" fill="none" stroke="#c48a00" strokeWidth={3} strokeLinejoin="round" />
    <rect x={47} y={80} width={26} height={16} rx={4} fill="#9aa3ad" stroke="#101820" strokeWidth={4} />
    <line x1={47} y1={88} x2={73} y2={88} stroke="#101820" strokeWidth={3} />
  </svg>
);

export const Banner: React.FC<{guide?: boolean}> = ({guide}) => {
  const {width, height} = useVideoConfig();
  const sx = (width - SAFE.w) / 2, sy = (height - SAFE.h) / 2;
  const stroke = {WebkitTextStroke: "14px #101820", paintOrder: "stroke fill"} as const;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #4f9fe8 0%, #a9d6fa 45%, #e6f4fd 70%)"}} />
      <Scene3D at={AT} sunny hideMascot fixed={{pos: [POS.x, POS.y, POS.z], target: [TARGET.x, TARGET.y, TARGET.z]}}>
        <Mascot position={[FEET.x, FEET.y, FEET.z]} scale={SCALE} pose={pose} gf={0} look={{hair: "curly", outfit: "overall", wrench: true}} />
      </Scene3D>
      {/* brilho atrás do logo para leitura */}
      <div style={{position: "absolute", left: sx + 480, top: sy - 40, width: 980, height: SAFE.h + 80, background: "radial-gradient(ellipse at center, rgba(16,40,90,0.55) 0%, rgba(16,40,90,0) 68%)"}} />
      <div style={{position: "absolute", left: sx + 480, top: sy, width: 980, height: SAFE.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff"}}>
        <div style={{marginBottom: -40, zIndex: 1}}>
          <Bulb />
        </div>
        <div style={{fontSize: 112, lineHeight: 0.95, ...stroke}}>Por Dentro</div>
        <div style={{fontSize: 150, lineHeight: 0.9, color: "#FFD400", ...stroke}}>Lab</div>
        <div style={{marginTop: 10, padding: "8px 30px", borderRadius: 40, background: "#14306b", border: "5px solid #101820", fontSize: 42, fontWeight: 800, whiteSpace: "nowrap"}}>
          Descubra, Construa e <span style={{color: "#FFD400"}}>Aprenda!</span>
        </div>
      </div>
      {guide && <div style={{position: "absolute", left: sx, top: sy, width: SAFE.w, height: SAFE.h, outline: "6px dashed #ff00ff"}} />}
    </AbsoluteFill>
  );
};
