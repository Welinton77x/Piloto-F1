import React, {useMemo, useState, useEffect} from "react";
import {ThreeCanvas} from "@remotion/three";
import {useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile} from "remotion";
import {useThree} from "@react-three/fiber";
import * as THREE from "three";
// @ts-ignore módulo JS
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";
// @ts-ignore módulo JS
import {buildWorld} from "./three/world.js";
import {applyFrame, cameraAt, background, keyLight} from "./three/animate";

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera, gl, scene} = useThree();
  const {world, refs} = useMemo(() => buildWorld(), []);
  const sun = useMemo(() => {
    const s = new THREE.DirectionalLight("#ffffff", 2.3);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    Object.assign(s.shadow.camera, {left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50});
    s.shadow.radius = 4;
    s.shadow.bias = -0.0004;
    return s;
  }, []);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
  }, [gl, scene]);
  const hemi = useMemo(() => new THREE.HemisphereLight("#ffffff", "#9fb0c6", 1.15), []);
  scene.background = new THREE.Color(background(frame));
  const kl = keyLight(frame);
  sun.intensity = 2.3 * kl;
  hemi.intensity = 1.15 * kl;
  applyFrame(refs, frame);
  const pose = cameraAt(frame);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(pose.pos);
  cam.fov = pose.fov;
  cam.near = 0.1;
  cam.far = 200;
  cam.lookAt(pose.target);
  cam.updateProjectionMatrix();
  sun.position.set(pose.target.x - 6, 14, pose.target.z + 9);
  sun.target.position.copy(pose.target);
  sun.target.updateMatrixWorld();
  return (
    <>
      <primitive object={hemi} />
      <primitive object={sun} />
      <primitive object={sun.target} />
      <primitive object={world} />
    </>
  );
};

export const Scene3D: React.FC = () => {
  const {width, height} = useVideoConfig();
  // as texturas com texto (PADARIA, preço) precisam da fonte carregada antes de montar o cenário
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fonte das texturas 3D"));
  useEffect(() => {
    const face = new FontFace("MontserratLocal", `url(${staticFile("fonts/montserrat.woff2")}) format("woff2")`, {weight: "700 900"});
    face.load().then((f) => {
      (document.fonts as any).add(f);
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  if (!ready) return null;
  return (
    <ThreeCanvas width={width} height={height} shadows gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}} camera={{fov: 24, position: [0, 3, 20]}}>
      <Rig />
    </ThreeCanvas>
  );
};
