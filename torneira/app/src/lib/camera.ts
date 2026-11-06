// Pose de câmera determinística (usada pelo 3D e pela projeção dos rótulos 2D).
import * as THREE from "three";
import {Easing, interpolate} from "remotion";
import type {CamKey} from "../data/scene-plan";
import {config, sceneAt} from "../data/scenes";
import {rad} from "./anim";

export const FOV = 24;

// O plano usa o layout largo da Fase 1 (x de −7 a 7,8). Para caber em 9:16, o diorama foi
// comprimido no eixo x; este mapa converte as coordenadas do plano para o diorama real.
const OX = [-7, -3.5, -2.5, 2.5, 2.6, 3.6, 6.2, 7.8, 9];
const NX = [-4.6, -3.0, -2.2, 2.2, 2.3, 3.0, 4.8, 6.2, 7.4];
export const mapX = (x: number) => interpolate(x, OX, NX, {extrapolateLeft: "extend", extrapolateRight: "extend"});
// Profundidades do plano para o diorama real (rio e piscinão mais fundos para a água descer por gravidade)
export const mapY = (y: number) => (y < -1.5 ? interpolate(y, [-4, -1.5], [-3.2, -1.5]) : y);

export type Pose = {pos: THREE.Vector3; target: THREE.Vector3};

export const poseAt = (gf: number): Pose => {
  const s = sceneAt(gf);
  const f = gf - s.startFrame;
  const keys = s.camera;
  const g = (fn: (k: CamKey) => number) =>
    keys.length === 1
      ? fn(keys[0])
      : interpolate(f, keys.map((k) => k.f), keys.map(fn), {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
  const drift = Math.sin(gf / 85) * 1.2; // deriva lenta: nunca parada
  const az = rad(g((k) => k.az) + drift);
  const el = rad(g((k) => k.el));
  const d = g((k) => k.dist);
  const tx = mapX(g((k) => k.target[0]));
  const ty = mapY(g((k) => k.target[1]));
  const tz = g((k) => k.target[2]);
  const pos = new THREE.Vector3(tx + d * Math.sin(az) * Math.cos(el), ty + d * Math.sin(el), tz + d * Math.cos(az) * Math.cos(el));
  return {pos, target: new THREE.Vector3(tx, ty, tz)};
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
