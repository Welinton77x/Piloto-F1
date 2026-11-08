// Contrato de dados da Fase 1 — vídeo 4 (carro), roteiro v4 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
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
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 5060; theme: "smooth-3d-city-car"; language: "pt-BR" };
export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 5060, theme: "smooth-3d-city-car", language: "pt-BR" };
const cap = { mode: "one-word-at-a-time", status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do quintal em corte (u3d, esquemático). Frente do corte em z = 1.
export const layout = { street: { x: [-60, 60], z: [-3, 3] }, sidewalk: 1.5, buildingsZ: -6 } as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 394,
    narration: "Você quer viajar com a família e as malas sem se cansar. Pega uma carroça de madeira, tira o cavalo, e quem empurra agora é você. Cinco minutos depois, acabou o fôlego.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 394, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["buildings", "mascot", "street", "suitcases", "trees", "woodenCart"],
    animations: [{ target: "cart.x", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 320, fn: "easeInOut" }, { target: "mascot.walking", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 320, fn: "easeInOut" }, { target: "camera", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 320, fn: "easeInOut" }, { target: "mascot.emotion", unit: "ver roteiro", from: 0, to: 1, f0: 320, f1: 394, fn: "easeInOut" }, { target: "mascot.shiver", unit: "ver roteiro", from: 0, to: 1, f0: 320, f1: 394, fn: "easeInOut" }, { target: "cart.x", unit: "ver roteiro", from: 0, to: 1, f0: 320, f1: 394, fn: "easeInOut" }],
    badges: [{ text: "VOCÊ CONSTRUIU UM CARRO DO ZERO?", kind: "attention", f0: 0, anchorWord: "viajar" }, { text: "CANSA", kind: "problem", f0: 0, anchorWord: "fôlego" }], highlights: ["fôlego", "viajar"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 394, durationInFrames: 646,
    narration: "Então você precisa de uma força que não cansa. Você mistura gasolina com ar num cilindro, aperta e solta uma faísca. Ela explode e empurra uma peça pra baixo. Esse é o pistão. Uma barra torta transforma esse sobe e desce em giro. Esse é o virabrequim. E o conjunto todo é o motor.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 646, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["connectingRod", "crankshaft", "cylinder", "engineBlock", "flash", "fuelMist", "mascot", "piston", "sparkPlug", "woodenCart"],
    animations: [{ target: "piston.y", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 395, fn: "easeInOut" }, { target: "spark", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 395, fn: "easeInOut" }, { target: "flash", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 395, fn: "easeInOut" }, { target: "crank.rot", unit: "ver roteiro", from: 0, to: 1, f0: 395, f1: 646, fn: "easeInOut" }, { target: "engine.install", unit: "ver roteiro", from: 0, to: 1, f0: 395, f1: 646, fn: "easeInOut" }, { target: "cart.x", unit: "ver roteiro", from: 0, to: 1, f0: 395, f1: 646, fn: "easeInOut" }],
    badges: [{ text: "GASOLINA + AR", kind: "neutral", f0: 0, anchorWord: "gasolina" }, { text: "PISTÃO", kind: "solution", f0: 0, anchorWord: "pistão" }, { text: "VIRABREQUIM", kind: "solution", f0: 0, anchorWord: "virabrequim" }, { text: "MOTOR", kind: "solution", f0: 0, anchorWord: "motor" }], highlights: ["gasolina", "motor", "pistão", "virabrequim"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 1040, durationInFrames: 360,
    narration: "Só que com um cilindro só, o carro anda aos trancos e treme inteiro. Então você coloca quatro, explodindo um de cada vez, revezando. Agora o giro fica lisinho.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 360, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["cart", "engine4", "flashes", "mascot", "suitcases"],
    animations: [{ target: "cart.jolt", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 174, fn: "easeInOut" }, { target: "suitcases.bounce", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 174, fn: "easeInOut" }, { target: "cyl.fire", unit: "ver roteiro", from: 0, to: 1, f0: 174, f1: 360, fn: "easeInOut" }],
    badges: [{ text: "TREME", kind: "problem", f0: 0, anchorWord: "treme" }, { text: "4 CILINDROS", kind: "neutral", f0: 0, anchorWord: "quatro" }], highlights: ["quatro", "treme"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1400, durationInFrames: 428,
    narration: "Mas cada explosão esquenta tanto que o motor pode até travar. Então você passa água por dentro dele e leva essa água pra uma grade na frente, onde o vento esfria. Esse é o radiador.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 428, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["engine", "fan", "flowArrows", "radiator", "smoke", "tempGauge", "waterPipes"],
    animations: [{ target: "engine.heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 135, fn: "easeInOut" }, { target: "smoke", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 135, fn: "easeInOut" }, { target: "gauge", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 135, fn: "easeInOut" }, { target: "pipes.reveal", unit: "ver roteiro", from: 0, to: 1, f0: 135, f1: 428, fn: "easeInOut" }, { target: "flow", unit: "ver roteiro", from: 0, to: 1, f0: 135, f1: 428, fn: "easeInOut" }, { target: "engine.heat", unit: "ver roteiro", from: 0, to: 1, f0: 135, f1: 428, fn: "easeInOut" }, { target: "gauge", unit: "ver roteiro", from: 0, to: 1, f0: 135, f1: 428, fn: "easeInOut" }],
    badges: [{ text: "SUPERAQUECE", kind: "problem", f0: 0, anchorWord: "esquenta" }, { text: "RADIADOR", kind: "solution", f0: 0, anchorWord: "radiador" }], highlights: ["esquenta", "radiador"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 1828, durationInFrames: 829,
    narration: "Agora o motor gira sem parar. Mas ligado direto nas rodas, o carro não para no semáforo. Então você coloca dois discos apertados um no outro, que se separam quando você pisa num pedal. Essa é a embreagem. E pra sair do lugar precisa de força, mas na estrada, de velocidade. Então você põe engrenagens de tamanhos diferentes. Primeira: forte e devagar. Quinta: leve e rápida. Esse é o câmbio.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 829, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["car", "clutchDiscs", "gearbox", "gears", "mascot", "pedal", "shifter", "speedometer", "trafficLight"],
    animations: [{ target: "light", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 201, fn: "easeInOut" }, { target: "car.x", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 201, fn: "easeInOut" }, { target: "mascot.emotion", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 201, fn: "easeInOut" }, { target: "disc.gap", unit: "ver roteiro", from: 0, to: 1, f0: 201, f1: 450, fn: "easeInOut" }, { target: "rot", unit: "ver roteiro", from: 0, to: 1, f0: 201, f1: 450, fn: "easeInOut" }, { target: "shift", unit: "ver roteiro", from: 0, to: 1, f0: 450, f1: 829, fn: "easeInOut" }, { target: "speed.needle", unit: "ver roteiro", from: 0, to: 1, f0: 450, f1: 829, fn: "easeInOut" }],
    badges: [{ text: "NÃO PARA", kind: "problem", f0: 0, anchorWord: "semáforo" }, { text: "EMBREAGEM", kind: "solution", f0: 0, anchorWord: "embreagem" }, { text: "1ª = FORÇA", kind: "neutral", f0: 0, anchorWord: "Primeira" }, { text: "5ª = VELOCIDADE", kind: "neutral", f0: 0, anchorWord: "Quinta" }, { text: "CÂMBIO", kind: "solution", f0: 0, anchorWord: "câmbio" }], highlights: ["câmbio", "embreagem", "primeira", "quinta", "semáforo"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 2657, durationInFrames: 577,
    narration: "Mas na primeira curva o pneu de fora arrasta e chia. Olha que curioso: na curva, a roda de fora anda mais que a de dentro. Então você põe no meio do eixo umas engrenagens que deixam uma roda girar mais que a outra. Esse é o diferencial.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 577, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["car", "curveTracks", "differential", "rearAxle", "tireSmoke"],
    animations: [{ target: "tracks.draw", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 313, fn: "easeInOut" }, { target: "smoke", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 313, fn: "easeInOut" }, { target: "planet", unit: "ver roteiro", from: 0, to: 1, f0: 313, f1: 577, fn: "easeInOut" }, { target: "wheel", unit: "ver roteiro", from: 0, to: 1, f0: 313, f1: 577, fn: "easeInOut" }],
    badges: [{ text: "PNEU DE FORA ARRASTA", kind: "problem", f0: 0, anchorWord: "arrasta" }, { text: "DIFERENCIAL", kind: "solution", f0: 0, anchorWord: "diferencial" }], highlights: ["arrasta", "diferencial"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 3234, durationInFrames: 394,
    narration: "E pra virar, se o eixo da frente inteiro gira, o carro pode tombar. Então cada roda da frente ganha sua articulação, ligada por barras a um volante. Essa é a direção.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 394, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["car", "frontAxle", "knuckles", "steeringWheel", "tieRods"],
    animations: [{ target: "axle.rot", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 172, fn: "easeInOut" }, { target: "car.roll", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 172, fn: "easeInOut" }, { target: "wheel.rot", unit: "ver roteiro", from: 0, to: 1, f0: 172, f1: 394, fn: "easeInOut" }],
    badges: [{ text: "TOMBA", kind: "problem", f0: 0, anchorWord: "tombar" }, { text: "DIREÇÃO", kind: "solution", f0: 0, anchorWord: "direção" }], highlights: ["direção", "tombar"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 3628, durationInFrames: 554,
    narration: "Só que cada buraco vai direto na sua coluna. Então você prende as rodas em molas, que absorvem a pancada, e em amortecedores, que seguram o balanço. Essa é a suspensão. E troca as rodas de madeira por borracha cheia de ar. Esse é o pneu.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 554, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["dampers", "mascot", "pothole", "springs", "tires"],
    animations: [{ target: "spring.compress", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 373, fn: "easeInOut" }, { target: "car.body", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 373, fn: "easeInOut" }, { target: "wheel.swap", unit: "ver roteiro", from: 0, to: 1, f0: 373, f1: 554, fn: "easeInOut" }],
    badges: [{ text: "SUSPENSÃO", kind: "solution", f0: 0, anchorWord: "suspensão" }, { text: "PNEU", kind: "solution", f0: 0, anchorWord: "pneu" }], highlights: ["pneu", "suspensão"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
  { id: "s9", voKey: "s9", startFrame: 4182, durationInFrames: 451,
    narration: "Agora o carro corre demais. Então você põe um disco de metal em cada roda, e duas pastilhas apertam ele quando você pisa no pedal. Esse é o freio. No fim, frear é transformar velocidade em calor.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 451, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["boxes", "brakeDisc", "pads", "speedLines", "speedometer"],
    animations: [{ target: "speed", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 451, fn: "easeInOut" }, { target: "disc.heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 451, fn: "easeInOut" }, { target: "car", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 451, fn: "easeInOut" }],
    badges: [{ text: "FREIO", kind: "solution", f0: 0, anchorWord: "freio" }, { text: "VELOCIDADE → CALOR", kind: "neutral", f0: 0, anchorWord: "calor" }], highlights: ["calor", "freio"], captions: cap,
    audioCues: [cue("whoosh-s9", 0)] },
  { id: "s10", voKey: "s10", startFrame: 4633, durationInFrames: 427,
    narration: "Coloque faróis, limpador e cinto de segurança. Parabéns, você construiu um carro! Comente vrum se você não sabia dessa, e comenta aí embaixo o que você quer ver no próximo vídeo.",
    camera: [{ f: 0, az: 10, el: 10, dist: 9, target: [0, 0.8, 0] }, { f: 427, az: -6, el: 8, dist: 7, target: [0.6, 0.7, 0] }],
    objects: ["confetti", "finalCar", "headlights", "seatbelt", "wipers"],
    animations: [{ target: "lights", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 427, fn: "easeInOut" }, { target: "wiper", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 427, fn: "easeInOut" }, { target: "belt", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 427, fn: "easeInOut" }, { target: "car", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 427, fn: "easeInOut" }],
    badges: [{ text: "CARRO PRONTO!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["parabéns"], captions: cap,
    audioCues: [cue("whoosh-s10", 0)] },
];
// Integridade: 10 cenas contíguas, soma 5060 frames.
