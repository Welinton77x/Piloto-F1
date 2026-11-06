// Capa do Short (1080×1920): quadro do próprio vídeo (sem legendas) + título grande.
// Texto na faixa central: não é cortado no recorte 3:4 do Instagram nem fica sob os botões do app.
import React from "react";
import {AbsoluteFill} from "remotion";
import {Background, Scene3D} from "./Main";
import {FONT} from "./components/Overlay";

export const COVER_FRAME = 40; // s1: mascote assustado com a rua alagada

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Background at={COVER_FRAME} />
    <AbsoluteFill style={{transform: "translateY(150px)"}}>
      <Scene3D at={COVER_FRAME} />
    </AbsoluteFill>
    {/* leve escurecido no topo para o título ler bem */}
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(16,24,32,0.55) 0%, rgba(16,24,32,0) 42%)"}} />
    <div style={{position: "absolute", top: 300, left: 60, right: 60, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "16px #101820", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,0.25)"}}>
      <div style={{fontSize: 118}}>POR QUE</div>
      <div style={{fontSize: 118}}>A RUA</div>
      <div style={{fontSize: 156, color: "#FFD400"}}>ALAGA?</div>
    </div>
    <div style={{position: "absolute", top: 1420, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 14, background: "#1E88E5", color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: 46, padding: "12px 30px", borderRadius: 26, border: "4px solid rgba(0,0,0,0.35)", boxShadow: "0 6px 0 rgba(0,0,0,0.3)"}}>
        A CIDADE EM RAIO-X 3D
      </div>
    </div>
    <div style={{position: "absolute", top: 1530, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#fff", WebkitTextStroke: "9px #101820", paintOrder: "stroke fill"}}>
      POR DENTRO <span style={{color: "#4DD0FF"}}>LAB</span>
    </div>
  </AbsoluteFill>
);
