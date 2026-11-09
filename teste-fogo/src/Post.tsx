import {useEffect, useMemo} from "react";
import {useFrame, useThree} from "@react-three/fiber";
import * as THREE from "three";
import {BloomEffect, BlendFunction, EffectComposer, EffectPass, NoiseEffect, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect, SMAAEffect} from "postprocessing";

/** Pós-processamento síncrono (Remotion renderiza 1 quadro por chamada): brilho, tom de cinema, vinheta, grão */
export const Post: React.FC<{bloom?: number}> = ({bloom = 1.1}) => {
  const {gl, scene, camera, size} = useThree();
  const {composer, bloomFx} = useMemo(() => {
    gl.toneMapping = THREE.NoToneMapping;
    const c = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType});
    c.addPass(new RenderPass(scene, camera));
    const b = new BloomEffect({mipmapBlur: true, intensity: bloom, luminanceThreshold: 0.85, luminanceSmoothing: 0.2, radius: 0.7});
    const noise = new NoiseEffect({premultiply: true, blendFunction: BlendFunction.SOFT_LIGHT});
    noise.blendMode.opacity.value = 0.22;
    c.addPass(
      new EffectPass(
        camera,
        b,
        new ToneMappingEffect({mode: ToneMappingMode.ACES_FILMIC}),
        new VignetteEffect({offset: 0.28, darkness: 0.6}),
        noise,
        new SMAAEffect(),
      ),
    );
    return {composer: c, bloomFx: b};
  }, [gl, scene, camera]);
  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);
  bloomFx.intensity = bloom;
  useFrame((_, dt) => composer.render(dt), 1);
  return null;
};
