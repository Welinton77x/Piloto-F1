// Banner do canal (2560×1440). Área segura (aparece em todos os aparelhos): 1546×423 no centro.
// Mascote e textos dentro dela; o bairro em 3D preenche o resto.
import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {Scene3D} from "./Main";
import {FONT} from "./components/Overlay";
import {totalFrames} from "./data/scenes";
import {mapX} from "./lib/camera";

export const SAFE = {w: 1546, h: 423};
const AT = totalFrames - 10; // mundo completo (rua seca, soluções verdes) e mascote acenando
const mx = mapX(-3.0);

export const Banner: React.FC<{guide?: boolean}> = ({guide}) => {
  const {width, height} = useVideoConfig();
  const sx = (width - SAFE.w) / 2, sy = (height - SAFE.h) / 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: "linear-gradient(180deg, #6fb0ec 0%, #bfe0fa 45%, #e6f4fd 70%)"}} />
      <Scene3D at={AT} sunny fixed={{pos: [mx + 1.9 + 9.6 * Math.sin(0.30), 0.78 + 1.1, 0.4 + 9.6 * Math.cos(0.30)], target: [mx + 1.9, 0.78, 0.4]}} />
      {/* faixa suave atrás do texto para leitura */}
      <div style={{position: "absolute", left: sx + 470, top: sy + 20, width: SAFE.w - 470, height: SAFE.h - 40, background: "radial-gradient(ellipse at center, rgba(16,24,32,0.35) 0%, rgba(16,24,32,0) 70%)"}} />
      <div style={{position: "absolute", left: sx + 470, top: sy, width: SAFE.w - 470, height: SAFE.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff"}}>
        <div style={{fontSize: 104, lineHeight: 1, whiteSpace: "nowrap", WebkitTextStroke: "13px #101820", paintOrder: "stroke fill"}}>
          POR DENTRO <span style={{color: "#4DD0FF"}}>LAB</span>
        </div>
        <div style={{marginTop: 20, fontSize: 56, fontWeight: 800, WebkitTextStroke: "9px #101820", paintOrder: "stroke fill"}}>
          A gente abre. <span style={{color: "#FFD400"}}>Você entende.</span>
        </div>
        <div style={{marginTop: 22, padding: "8px 30px", borderRadius: 16, background: "#FFD400", color: "#101820", fontSize: 34, letterSpacing: 3, border: "4px solid rgba(0,0,0,0.3)"}}>CURIOSIDADES · TODA SEMANA</div>
      </div>
      {guide && <div style={{position: "absolute", left: sx, top: sy, width: SAFE.w, height: SAFE.h, outline: "6px dashed #ff00ff"}} />}
    </AbsoluteFill>
  );
};
