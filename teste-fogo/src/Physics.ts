import type {Pose} from "./Boy";

/* Física genérica: molas com sobra de movimento + cabelo com inércia, para qualquer função de pose. */
type V3 = [number, number, number];
type Key = "pos" | "head" | "torso" | "rShoulder" | "lShoulder" | "rWrist";
const DEF: Record<Key, V3> = {pos: [0, 0, 0], head: [0, 0, 0], torso: [0, 0, 0], rShoulder: [0, 0, -0.08], lShoulder: [0, 0, 0.08], rWrist: [0, 0, 0]};
type Chan = {get: (p: Pose) => number; set: (p: Pose, v: number) => void; k: number; c: number};
const vec = (key: Key, i: number, k: number, c: number): Chan => ({
  get: (p) => (p[key] ?? DEF[key])[i],
  set: (p, v) => {
    const a = [...(p[key] ?? DEF[key])] as V3;
    a[i] = v;
    p[key] = a;
  },
  k,
  c,
});
const num = (key: "rElbow" | "lElbow", k: number, c: number): Chan => ({get: (p) => p[key] ?? -0.15, set: (p, v) => (p[key] = v), k, c});

const CHANNELS: Chan[] = [
  ...[0, 1, 2].map((i) => vec("torso", i, 0.3, 0.42)),
  ...[0, 1, 2].map((i) => vec("head", i, 0.22, 0.32)),
  ...[0, 1, 2].map((i) => vec("rShoulder", i, 0.32, 0.36)),
  ...[0, 1, 2].map((i) => vec("lShoulder", i, 0.26, 0.3)),
  num("rElbow", 0.24, 0.3),
  num("lElbow", 0.2, 0.26),
  ...[0, 2].map((i) => vec("rWrist", i, 0.35, 0.4)),
];

const cache = new Map<string, Pose>();

/** Pose no quadro f, simulando as molas desde `start` (início do plano). `key` identifica o personagem/plano. */
export const physics = (key: string, poseAt: (f: number) => Pose, start: number, f: number): Pose => {
  const ck = key + ":" + f;
  const hit = cache.get(ck);
  if (hit) return hit;
  const p0 = poseAt(start);
  const x = CHANNELS.map((ch) => ch.get(p0));
  const v = CHANNELS.map(() => 0);
  let hairX = 0, hairZ = 0, hvX = 0, hvZ = 0;
  let prevHead = [...(p0.head ?? [0, 0, 0])];
  let prevY = (p0.pos ?? [0, 0, 0])[1];
  let prevVy = 0;
  let out: Pose = p0;
  for (let fr = start; fr <= f; fr++) {
    const goalPose = fr === start ? p0 : poseAt(fr);
    const pose: Pose = {...goalPose};
    CHANNELS.forEach((ch, i) => {
      v[i] += (ch.get(goalPose) - x[i]) * ch.k;
      v[i] *= 1 - ch.c;
      x[i] += v[i];
      ch.set(pose, x[i]);
    });
    const head = pose.head ?? [0, 0, 0];
    const y = (pose.pos ?? [0, 0, 0])[1];
    const vy = y - prevY;
    const ay = vy - prevVy;
    hvX += (-hairX - (head[0] - prevHead[0]) * 6 + Math.max(-0.02, Math.min(0.02, ay)) * 25) * 0.25;
    hvZ += (-hairZ - (head[2] - prevHead[2]) * 6) * 0.25;
    hvX *= 0.78;
    hvZ *= 0.78;
    hairX += hvX;
    hairZ += hvZ;
    prevHead = [...head];
    prevY = y;
    prevVy = vy;
    hairX = Math.max(-0.3, Math.min(0.3, hairX));
    hairZ = Math.max(-0.3, Math.min(0.3, hairZ));
    pose.hair = [hairX, hairZ];
    out = pose;
  }
  cache.set(ck, out);
  return out;
};
