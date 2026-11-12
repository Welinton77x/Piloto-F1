// Pose de câmera determinística (usada pelo 3D e pela projeção dos rótulos 2D).
import * as THREE from "three";
import {Easing, interpolate} from "remotion";
import type {CamKey} from "../data/scene-plan";
import {config, sceneAt} from "../data/scenes";
import {rad} from "./anim";

export const FOV = 24;

// O plano usa o layout largo da Fase 1 (x de −7 a 7,8). Para caber em 9:16, o diorama foi
// comprimido no eixo x; este mapa converte as coordenadas do plano para o diorama real.
export const mapX = (x: number) => x; // vídeo 2: coordenadas do plano = diorama
// Profundidades do plano para o diorama real (rio e piscinão mais fundos para a água descer por gravidade)
export const mapY = (y: number) => y;

export type Pose = {pos: THREE.Vector3; target: THREE.Vector3};

export const poseAt = (gf: number): Pose => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const keys = s.camera;
  const g = (fn: (k: CamKey) => number) =>
    keys.length === 1
      ? fn(keys[0])
      : interpolate(f, keys.map((k) => k.f), keys.map(fn), {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  // câmera sempre em movimento (pedido do usuário): órbita lenta contínua + respiração de zoom + leve flutuação.
  // Em cada cena a órbita avança num sentido, então nunca há um quadro parado.
  const sceneIdx = Number(s.id.slice(1)) || 0;
  const dir = sceneIdx % 2 ? 1 : -1;
  const orbit = dir * (f / Math.max(1, s.durationInFrames)) * 7 + Math.sin(gf / 55) * 2.2;
  const az = rad(g((k) => k.az) + orbit);
  const el = rad(g((k) => k.el) + Math.sin(gf / 70) * 1.5);
  const d = g((k) => k.dist) * (1 - 0.05 * (f / Math.max(1, s.durationInFrames)) + 0.015 * Math.sin(gf / 40));
  const tx = mapX(g((k) => k.target[0])); // vídeo 5: cenário fixo (casa em corte)
  const ty = mapY(g((k) => k.target[1])) + Math.sin(gf / 47) * 0.03;
  const tz = g((k) => k.target[2]);
  const shake = 0;
  const sx = shake * Math.sin(gf * 2.3), sy = shake * Math.cos(gf * 3.1);
  const pos = new THREE.Vector3(tx + sx + d * Math.sin(az) * Math.cos(el), ty + sy + d * Math.sin(el), tz + d * Math.cos(az) * Math.cos(el));
  return {pos, target: new THREE.Vector3(tx + sx, ty + sy, tz)};
};

const cam = new THREE.PerspectiveCamera(FOV, config.width / config.height, 0.1, 400);
/** projeta um ponto 3D para pixels da tela 1080×1920 (null se atrás da câmera) */
export const project = (gf: number, p: [number, number, number]) => {
  const {pos, target} = poseAt(gf);
  cam.position.copy(pos);
  cam.lookAt(target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  if (v.z > 1) return null;
  return {x: ((v.x + 1) / 2) * config.width, y: ((1 - v.y) / 2) * config.height};
};
