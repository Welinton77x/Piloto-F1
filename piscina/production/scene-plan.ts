// Contrato de dados da Fase 1 — vídeo 3, roteiro v4 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
// Mesmos tipos dos vídeos 1 e 2 para reaproveitar o pipeline (voz por palavra, selos com palavra-âncora, câmera orbital).
export type Kind = "problem" | "solution" | "neutral" | "attention";
export type CamKey = { f: number; az: number; el: number; dist: number; target: [number, number, number]; atWord?: string; wordOffset?: number };
export type Anim = { target: string; unit: string; from: number | string; to: number | string; f0: number; f1: number; fn: "linear" | "easeInOut" | "easeOut" | "easeIn" | "spring" | "sin" | "seeded" };
export type Badge = { text: string; kind: Kind; f0: number; f1?: number; anchorWord?: string; untilWord?: string };
export type AudioCue = { id: string; f: number; kind: "sfx" | "music"; status: "planned" };
export type ScenePlan = {
  id: string; voKey: string; startFrame: number; durationInFrames: number; narration: string;
  camera: CamKey[]; objects: string[]; animations: Anim[]; badges: Badge[]; highlights: string[];
  captions: { mode: "one-word-at-a-time"; status: "provisional" }; audioCues: AudioCue[];
};
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 4919; theme: "smooth-3d-backyard-pool"; language: "pt-BR" };
export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 4919, theme: "smooth-3d-backyard-pool", language: "pt-BR" };
const cap = { mode: "one-word-at-a-time", status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do quintal em corte (u3d, esquemático). Frente do corte em z = 1.
export const layout = { house: [-9, -4], pool: { x: [-1.5, 4.5], z: [-1.5, 1.5], depth: 1.5 }, machineRoom: { x: [6, 7.6], depth: 1.2 }, wallBack: -4 } as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 348,
    narration: "Dia quente, sol rachando, e você ali derretendo. Do nada, bate a ideia: abrir um buraco no quintal e encher de água. Pronto, você fez uma piscina! Será?",
    camera: [{ f: 0, az: 20, el: 22, dist: 13, target: [1.5, 0, 0] }, { f: 348, az: 8, el: 10, dist: 8, target: [0.5, 0.6, 0.5] }],
    objects: ["dirtPile", "floaty", "grass", "hole", "hose", "house", "mascot", "shovel", "wall", "yard"],
    animations: [{ target: "camera", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 99, fn: "easeInOut" }, { target: "mascot.emotion", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 99, fn: "easeInOut" }, { target: "hole.depth", unit: "ver roteiro", from: 0, to: 1, f0: 99, f1: 348, fn: "easeInOut" }, { target: "dirtPile.scale", unit: "ver roteiro", from: 0, to: 1, f0: 99, f1: 348, fn: "easeInOut" }, { target: "hose.flow", unit: "ver roteiro", from: 0, to: 1, f0: 99, f1: 348, fn: "easeInOut" }],
    badges: [{ text: "COMO UM BURACO VIRA UMA PISCINA?", kind: "attention", f0: 0, anchorWord: "Dia" }], highlights: ["dia"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 348, durationInFrames: 417,
    narration: "No outro dia, cadê a água? A terra é cheia de espacinhos, então ela sumiu no chão. E as paredes de barro desmoronaram: virou um lamaçal. Imagina pular aí dentro. Nem pensar! Volta tudo.",
    camera: [{ f: 0, az: -10, el: 14, dist: 7, target: [1.5, 0, 0.5] }, { f: 417, az: 6, el: 8, dist: 6, target: [1.0, -0.2, 0.8] }],
    objects: ["mascot", "mud", "mudSplash", "overlay", "soilDrops", "wallCollapse", "waterInHole"],
    animations: [{ target: "waterInHole.level", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 319, fn: "easeInOut" }, { target: "soilDrops", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 319, fn: "easeInOut" }, { target: "wallCollapse.t", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 319, fn: "easeInOut" }, { target: "imagine", unit: "ver roteiro", from: 0, to: 1, f0: 319, f1: 417, fn: "easeInOut" }, { target: "mascot.jump", unit: "ver roteiro", from: 0, to: 1, f0: 319, f1: 417, fn: "easeInOut" }, { target: "mascot.muddy", unit: "ver roteiro", from: 0, to: 1, f0: 319, f1: 417, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 319, f1: 417, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA SOME NA TERRA", kind: "problem", f0: 0, anchorWord: "sumiu" }, { text: "PAREDES DESMORONAM", kind: "problem", f0: 0, anchorWord: "desmoronaram" }], highlights: ["desmoronaram", "sumiu"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 765, durationInFrames: 657,
    narration: "E aqui começa o jeito certo. Primeiro vem o projeto: define o tamanho, a profundidade e por onde passam os canos. Aí a máquina cava, o fundo é socado e recebe uma camada de concreto magro, a base. E se pular essa parte? O chão cede com o peso, o fundo afunda e racha. Volta!",
    camera: [{ f: 0, az: 0, el: 45, dist: 11, target: [1.5, 0, 0] }, { f: 230, az: 10, el: 30, dist: 10, target: [1.5, -0.3, 0] }, { f: 657, az: -8, el: 12, dist: 8, target: [1.5, -0.6, 0.5] }],
    objects: ["blueprintLines", "compactor", "crackLine", "depthRuler", "excavator", "leanConcrete", "overlay", "pit", "pitFloor"],
    animations: [{ target: "blueprint.draw", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 251, fn: "easeInOut" }, { target: "depthRuler.h", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 251, fn: "easeInOut" }, { target: "pit.depth", unit: "ver roteiro", from: 0, to: 1, f0: 251, f1: 454, fn: "easeInOut" }, { target: "compactor.bob", unit: "ver roteiro", from: 0, to: 1, f0: 251, f1: 454, fn: "easeInOut" }, { target: "leanConcrete.h", unit: "ver roteiro", from: 0, to: 1, f0: 251, f1: 454, fn: "easeInOut" }, { target: "floor.sink", unit: "ver roteiro", from: 0, to: 1, f0: 454, f1: 657, fn: "easeInOut" }, { target: "crack.draw", unit: "ver roteiro", from: 0, to: 1, f0: 454, f1: 657, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 454, f1: 657, fn: "easeInOut" }],
    badges: [{ text: "PROJETO", kind: "neutral", f0: 0, anchorWord: "projeto" }, { text: "CONCRETO MAGRO", kind: "solution", f0: 0, anchorWord: "magro" }, { text: "FUNDO AFUNDA E RACHA", kind: "problem", f0: 0, anchorWord: "racha" }], highlights: ["magro", "projeto", "racha"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1422, durationInFrames: 737,
    narration: "Sabe por que tanto cuidado? Água pesa demais. Cada metro cúbico tem mil quilos. Uma piscina de seis por três, com um metro e quarenta de fundo, carrega umas vinte e cinco toneladas empurrando as paredes pra fora. Se fosse só concreto, a parede trincava. Por isso se monta uma gaiola de vergalhões e o concreto envolve tudo: é o concreto armado.",
    camera: [{ f: 0, az: 15, el: 10, dist: 6, target: [-2.5, 0.5, 1.2] }, { f: 221, az: 0, el: 15, dist: 10, target: [1.5, -0.5, 0] }, { f: 737, az: 15, el: 12, dist: 8, target: [1.5, -0.5, 0.3] }],
    objects: ["concreteMixer", "concreteShell", "crack", "leak", "plainConcreteWall", "pressureArrows", "rebarCage", "scale", "waterCube", "waterCubes"],
    animations: [{ target: "waterCube.scale", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 166, fn: "easeInOut" }, { target: "scale.value", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 166, fn: "easeInOut" }, { target: "cubes.count", unit: "ver roteiro", from: 0, to: 1, f0: 166, f1: 452, fn: "easeInOut" }, { target: "arrows.len", unit: "ver roteiro", from: 0, to: 1, f0: 166, f1: 452, fn: "easeInOut" }, { target: "crack.draw", unit: "ver roteiro", from: 0, to: 1, f0: 452, f1: 535, fn: "easeInOut" }, { target: "leak", unit: "ver roteiro", from: 0, to: 1, f0: 452, f1: 535, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 535, f1: 737, fn: "easeInOut" }, { target: "rebar.build", unit: "ver roteiro", from: 0, to: 1, f0: 535, f1: 737, fn: "easeInOut" }, { target: "concrete.fill", unit: "ver roteiro", from: 0, to: 1, f0: 535, f1: 737, fn: "easeInOut" }],
    badges: [{ text: "1 m³ = 1.000 kg", kind: "neutral", f0: 0, anchorWord: "mil" }, { text: "≈ 25 TONELADAS", kind: "attention", f0: 0, anchorWord: "toneladas" }, { text: "PAREDE TRINCA", kind: "problem", f0: 0, anchorWord: "trinca" }, { text: "VERGALHÕES", kind: "neutral", f0: 0, anchorWord: "vergalhões" }, { text: "CONCRETO ARMADO", kind: "solution", f0: 0, anchorWord: "armado" }], highlights: ["armado", "mil", "toneladas", "trinca", "vergalhões"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 2159, durationInFrames: 669,
    narration: "Mas tem um detalhe que quase ninguém sabe: o concreto é cheio de poros. Sem proteção, a água vaza, a piscina esvazia sozinha e a conta de água dispara. Por isso entra a impermeabilização, uma camada que veda tudo. Depois enche e espera uns dias pra ver se o nível baixa: é o teste de estanqueidade.",
    camera: [{ f: 0, az: -5, el: 8, dist: 5, target: [-1.2, -0.6, 1] }, { f: 334, az: 10, el: 18, dist: 8, target: [1.5, -0.6, 0] }, { f: 669, az: -6, el: 14, dist: 9, target: [1.5, -0.3, 0] }],
    objects: ["leakDrops", "lens", "levelMark", "roller", "sky", "testWater", "waterBill", "waterLevel", "waterproofLayer"],
    animations: [{ target: "lens.scale", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 346, fn: "easeInOut" }, { target: "waterLevel", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 346, fn: "easeInOut" }, { target: "bill.value", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 346, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 346, f1: 466, fn: "easeInOut" }, { target: "waterproof.cover", unit: "ver roteiro", from: 0, to: 1, f0: 346, f1: 466, fn: "easeInOut" }, { target: "testWater.level", unit: "ver roteiro", from: 0, to: 1, f0: 466, f1: 669, fn: "easeInOut" }, { target: "sky.cycle", unit: "ver roteiro", from: 0, to: 1, f0: 466, f1: 669, fn: "easeInOut" }],
    badges: [{ text: "VAZAMENTO", kind: "problem", f0: 0, anchorWord: "vaza" }, { text: "CONTA SOBE", kind: "problem", f0: 0, anchorWord: "conta" }, { text: "IMPERMEABILIZAÇÃO", kind: "solution", f0: 0, anchorWord: "impermeabilização" }, { text: "TESTE DE ESTANQUEIDADE", kind: "solution", f0: 0, anchorWord: "estanqueidade" }], highlights: ["conta", "estanqueidade", "impermeabilização", "vaza"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 2828, durationInFrames: 257,
    narration: "Agora vem a parte bonita, o acabamento: pastilha ou azulejo com argamassa e rejunte, e na borda uma pedra antiderrapante.",
    camera: [{ f: 0, az: 12, el: 20, dist: 7, target: [0, -0.5, 0] }, { f: 257, az: -12, el: 10, dist: 7, target: [3, 0, 0.5] }],
    objects: ["borderStones", "groutLines", "tiles"],
    animations: [{ target: "tiles.reveal", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 257, fn: "easeInOut" }, { target: "border.reveal", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 257, fn: "easeInOut" }],
    badges: [{ text: "ACABAMENTO", kind: "neutral", f0: 0, anchorWord: "acabamento" }, { text: "BORDA ANTIDERRAPANTE", kind: "solution", f0: 0, anchorWord: "antiderrapante" }], highlights: ["acabamento", "antiderrapante"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 3085, durationInFrames: 634,
    narration: "Pronto, piscina cheia! Mas repara: em poucos dias caem folhas e poeira, e a água parada fica verde. Aí entra a parte escondida: o ralo de fundo e o skimmer puxam a água, a bomba manda pro filtro de areia, e ela volta limpinha pelos bocais. Tudo isso fica na casa de máquinas.",
    camera: [{ f: 0, az: 0, el: 20, dist: 9, target: [1.5, 0, 0] }, { f: 222, az: 10, el: 12, dist: 10, target: [3, -0.6, 0] }, { f: 634, az: 18, el: 10, dist: 6, target: [6.8, -0.5, 1] }],
    objects: ["flowArrows", "leaves", "machineRoom", "mainDrain", "pipes", "poolWater", "pump", "returnJets", "sandFilter", "skimmer", "sky"],
    animations: [{ target: "poolWater.color", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 215, fn: "easeInOut" }, { target: "leaves", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 215, fn: "easeInOut" }, { target: "pipes.lit", unit: "ver roteiro", from: 0, to: 1, f0: 215, f1: 550, fn: "easeInOut" }, { target: "poolWater.color", unit: "ver roteiro", from: 0, to: 1, f0: 215, f1: 550, fn: "easeInOut" }, { target: "machineRoom.lid", unit: "ver roteiro", from: 0, to: 1, f0: 550, f1: 634, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA PARADA FICA VERDE", kind: "problem", f0: 0, anchorWord: "verde" }, { text: "SKIMMER", kind: "solution", f0: 0, anchorWord: "skimmer" }, { text: "FILTRO DE AREIA", kind: "solution", f0: 0, anchorWord: "areia" }, { text: "CASA DE MÁQUINAS", kind: "neutral", f0: 0, anchorWord: "máquinas" }], highlights: ["areia", "máquinas", "skimmer", "verde"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 3719, durationInFrames: 566,
    narration: "E olha que curioso: o filtro segura a sujeira, mas não mata micróbios. Isso é trabalho do cloro. Só que o cloro depende do pH. Imagina nadar com ele fora do ponto: o cloro perde força e a água arde no olho. Por isso se mede sempre.",
    camera: [{ f: 0, az: -8, el: 10, dist: 6, target: [1.5, -0.4, 1] }, { f: 566, az: 6, el: 8, dist: 4.5, target: [-1.2, 0.5, 1.2] }],
    objects: ["chlorineDrops", "lens", "mascot", "olhos", "phGauge", "phKit"],
    animations: [{ target: "microbes.pop", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 217, fn: "easeInOut" }, { target: "phGauge.needle", unit: "ver roteiro", from: 0, to: 1, f0: 217, f1: 506, fn: "easeInOut" }, { target: "mascot.emotion", unit: "ver roteiro", from: 0, to: 1, f0: 217, f1: 506, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 506, f1: 566, fn: "easeInOut" }, { target: "phGauge.needle", unit: "ver roteiro", from: 0, to: 1, f0: 506, f1: 566, fn: "easeInOut" }],
    badges: [{ text: "CLORO", kind: "solution", f0: 0, anchorWord: "cloro" }, { text: "ARDE NO OLHO", kind: "problem", f0: 0, anchorWord: "arde" }, { text: "pH EQUILIBRADO", kind: "solution", f0: 0, anchorWord: "mede" }], highlights: ["arde", "cloro", "mede"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
  { id: "s9", voKey: "s9", startFrame: 4285, durationInFrames: 634,
    narration: "Agora sim: pode pular! Parabéns, agora você sabe como um buraco no quintal vira uma piscina! E aí, teria coragem de fazer uma na sua casa? Comenta aí e segue o Por Dentro Lab pra ver como funciona por dentro tudo o que você usa no dia a dia.",
    camera: [{ f: 0, az: 0, el: 25, dist: 12, target: [1.5, -0.3, 0] }, { f: 285, az: 10, el: 12, dist: 7, target: [1.5, 0.2, 0.5] }, { f: 634, az: 4, el: 6, dist: 4, target: [1.5, 0.5, 1.4] }],
    objects: ["confetti", "floaty", "mascot", "piscina", "splash"],
    animations: [{ target: "layers.explode", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 52, fn: "easeInOut" }, { target: "mascot.jump", unit: "ver roteiro", from: 0, to: 1, f0: 52, f1: 207, fn: "easeInOut" }, { target: "splash", unit: "ver roteiro", from: 0, to: 1, f0: 52, f1: 207, fn: "easeInOut" }, { target: "confetti", unit: "ver roteiro", from: 0, to: 1, f0: 52, f1: 207, fn: "easeInOut" }, { target: "mascot.rArm", unit: "ver roteiro", from: 0, to: 1, f0: 207, f1: 634, fn: "easeInOut" }],
    badges: [{ text: "BURACO → PISCINA", kind: "neutral", f0: 0, anchorWord: "Agora" }, { text: "AGORA VOCÊ SABE!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["agora", "parabéns"], captions: cap,
    audioCues: [cue("whoosh-s9", 0)] },
];
// Integridade: 9 cenas contíguas, soma 4919 frames.
