// Pós-processamento para ficar com o acabamento do vídeo de referência:
// fundo desfocado (profundidade de campo focada no alvo da câmera), tons de cinema (ACES) e bordas suaves (SMAA).
import {useEffect, useMemo} from "react";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {BokehPass} from "three/examples/jsm/postprocessing/BokehPass.js";
import {SMAAPass} from "three/examples/jsm/postprocessing/SMAAPass.js";
import {OutputPass} from "three/examples/jsm/postprocessing/OutputPass.js";

export const Post: React.FC<{focus: number}> = ({focus}) => {
  const {gl, scene, camera, size} = useThree();
  const {composer, bokeh} = useMemo(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const b = new BokehPass(scene, camera, {focus: 10, aperture: 0.01, maxblur: 0.016});
    c.addPass(b);
    c.addPass(new SMAAPass());
    c.addPass(new OutputPass());
    return {composer: c, bokeh: b};
  }, [gl, scene, camera]);
  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);
  useFrame(() => {
    const u = (bokeh as unknown as {uniforms: Record<string, {value: number}>}).uniforms;
    u.focus.value = focus;
    // perto (close nas peças) → abertura maior, fundo bem desfocado; longe → quase tudo nítido
    u.aperture.value = Math.min(0.03, 0.07 / Math.max(1.5, focus));
    composer.render();
  }, 1);
  return null;
};
