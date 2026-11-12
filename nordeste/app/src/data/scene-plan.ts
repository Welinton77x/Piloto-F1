// Contrato de dados da Fase 1 — vídeo 6 (calor no Nordeste), roteiro v4 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
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
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 4625; theme: "smooth-3d-sertao-heat"; language: "pt-BR" };
export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 4625, theme: "smooth-3d-sertao-heat", language: "pt-BR" };
const cap = { mode: "one-word-at-a-time", status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do quintal em corte (u3d, esquemático). Frente do corte em z = 1.
export const layout = { sertao: { x: [-20, 20] }, map: { scale: 1 } } as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 211,
    narration: "Por que o Nordeste tá tão quente? Se você quer fazer um calorão, começa pelo sol.",
    camera: [{ f: 0, az: 15, el: 8, dist: 6.44, target: [0, 1.5, 0.6] }, { f: 0, az: 10, el: 6, dist: 7.13, target: [0, 1.55, 0.6], atWord: "Se", wordOffset: -6 }, { f: 0, az: 9, el: -12, dist: 14, target: [-0.5, 2.5, 0], atWord: "sol", wordOffset: -8 }, { f: 211, az: 10, el: -12, dist: 13.5, target: [-0.5, 2.5, 0] }],
    objects: ["caatinga", "cactos", "mascote", "sertão", "sol"],
    animations: [{ target: "mascot.sweat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }, { target: "heatWaves", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }],
    badges: [], highlights: [], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 211, durationInFrames: 463,
    narration: "O Nordeste fica pertinho da linha do Equador. Lá, o sol passa quase em cima da sua cabeça o ano todo, e os raios chegam retinhos, concentrados num pedaço pequeno do chão. Esse é o sol a pino.",
    camera: [{ f: 0, az: 18, el: 6, dist: 45, target: [71.5, 3.8, -1.5] }, { f: 0, az: 22, el: 6, dist: 42, target: [71.5, 3.8, -1.5], atWord: "raios", wordOffset: -6 }, { f: 0, az: 24, el: 6, dist: 41, target: [71.5, 3.8, -1.5], atWord: "Esse", wordOffset: -5 }, { f: 0, az: 10, el: -12, dist: 7.47, target: [0, 1.75, 0.6], atWord: "Esse", wordOffset: -4 }, { f: 463, az: 15, el: -10, dist: 7.13, target: [0, 1.75, 0.6] }],
    objects: ["equatorLine", "globe", "mascotShadow", "sunRays"],
    animations: [{ target: "rays", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }, { target: "shadow", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }],
    badges: [{ text: "PERTO DO EQUADOR", kind: "neutral", f0: 0, anchorWord: "Equador" }, { text: "SOL A PINO", kind: "solution", f0: 0, anchorWord: "pino" }], highlights: ["equador", "pino"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 674, durationInFrames: 394,
    narration: "Mas só sol não basta. No litoral, o mar e a brisa ainda refrescam. Então você vai pro interior, longe do mar, onde quase não chove. Esse é o sertão, o semiárido.",
    camera: [{ f: 0, az: 25, el: 8, dist: 7.47, target: [9.6, 1.5, 1.0] }, { f: 0, az: 20, el: 8, dist: 7.47, target: [9.6, 1.5, 1.0], atWord: "Então", wordOffset: -4 }, { f: 0, az: 10, el: 10, dist: 8.05, target: [0.4, 1.5, 0.6], atWord: "interior", wordOffset: 40 }, { f: 394, az: 5, el: 10, dist: 7.47, target: [0.2, 1.5, 0.6] }],
    objects: ["breezeArrows", "coast", "nordesteMap", "sertão"],
    animations: [{ target: "map", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 394, fn: "easeInOut" }, { target: "mascot", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 394, fn: "easeInOut" }],
    badges: [{ text: "LITORAL: BRISA DO MAR", kind: "neutral", f0: 0, anchorWord: "litoral" }, { text: "SERTÃO / SEMIÁRIDO", kind: "solution", f0: 0, anchorWord: "sertão" }], highlights: ["litoral", "sertão"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1068, durationInFrames: 508,
    narration: "E repara: quando tem água no chão, parte do calor vai pra evaporar essa água, igual o suor esfria a sua pele. Mas a terra do sertão tá seca. Então toda a energia vai direto pra esquentar o chão e o ar.",
    camera: [{ f: 0, az: 0, el: 26, dist: 8.62, target: [0, 1.05, 1.3] }, { f: 0, az: -10, el: 22, dist: 7.47, target: [-0.8, 1.05, 1.3], atWord: "água", wordOffset: -6 }, { f: 0, az: -4, el: 20, dist: 7.47, target: [-0.6, 1.1, 1.3], atWord: "seca", wordOffset: -6 }, { f: 0, az: 10, el: 16, dist: 6.9, target: [1.5, 1.35, 1.3], atWord: "seca", wordOffset: 14 }, { f: 508, az: 15, el: 14, dist: 7.47, target: [1.3, 1.35, 1.2] }],
    objects: ["drySoil", "heatArrows", "steam", "wetSoil"],
    animations: [{ target: "soil.heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "mascot", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }],
    badges: [{ text: "SEM ÁGUA, TUDO VIRA CALOR", kind: "problem", f0: 0, anchorWord: "energia" }], highlights: ["energia"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 1576, durationInFrames: 382,
    narration: "Agora junta isso com a cidade. Asfalto e concreto guardam o calor do dia e soltam de noite. Essa é a ilha de calor. Por isso, a noite quase não refresca.",
    camera: [{ f: 0, az: 15, el: 22, dist: 8.05, target: [-69.6, 1.45, 2] }, { f: 0, az: 10, el: 10, dist: 20, target: [-70, 2.6, -2], atWord: "Asfalto", wordOffset: -6 }, { f: 0, az: 15, el: 22, dist: 7.47, target: [-69.6, 1.45, 2], atWord: "noite", wordOffset: -8 }, { f: 382, az: 20, el: 22, dist: 7.47, target: [-69.6, 1.45, 2] }],
    objects: ["asphalt", "bed", "city", "heatWaves", "mascot", "moon"],
    animations: [{ target: "day→night", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 382, fn: "easeInOut" }, { target: "heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 382, fn: "easeInOut" }],
    badges: [{ text: "ILHA DE CALOR", kind: "solution", f0: 0, anchorWord: "ilha" }], highlights: ["ilha"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 1958, durationInFrames: 463,
    narration: "E esse ano ainda tem El Niño. Lá longe, no oceano Pacífico, perto do Peru, a água do mar fica bem mais quente que o normal. Em outubro, ele bateu recorde e virou um El Niño muito forte.",
    camera: [{ f: 0, az: 0, el: 58, dist: 36, target: [139, 0, 0] }, { f: 0, az: -15, el: 45, dist: 16, target: [132, 0, -4.2], atWord: "água", wordOffset: -8 }, { f: 0, az: -10, el: 48, dist: 19, target: [133, 0, -3.5], atWord: "recorde", wordOffset: -4 }, { f: 463, az: -8, el: 48, dist: 20, target: [133, 0, -3.5] }],
    objects: ["pacific", "seaThermometer", "southAmericaMap", "warmPatch"],
    animations: [{ target: "patch", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }],
    badges: [{ text: "EL NIÑO", kind: "attention", f0: 0, anchorWord: "Niño" }, { text: "MUITO FORTE: RECORDE EM OUTUBRO", kind: "problem", f0: 0, anchorWord: "recorde" }], highlights: ["niño", "recorde"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 2421, durationInFrames: 657,
    narration: "Essa água quente faz o ar subir lá no Pacífico. Só que todo ar que sobe precisa descer em algum lugar. E ele desce justo em cima do Norte e do Nordeste. Ar descendo segura as nuvens, então não chove. Céu limpo, sol direto e chão ainda mais seco. É o calorão ficando ainda maior.",
    camera: [{ f: 0, az: 90, el: 42, dist: 30, target: [138, 2.5, -3.5] }, { f: 0, az: 90, el: 40, dist: 30, target: [138, 3.0, -3.5], atWord: "desce", wordOffset: -6 }, { f: 0, az: 70, el: 45, dist: 16, target: [145.4, 1.5, -3.2], atWord: "segura", wordOffset: -6 }, { f: 0, az: 64, el: 47, dist: 15, target: [145.4, 1.5, -3.2], atWord: "calorão", wordOffset: -11 }, { f: 0, az: 15, el: 6, dist: 6.44, target: [0, 1.5, 0.6], atWord: "calorão", wordOffset: -10 }, { f: 657, az: 10, el: 6, dist: 6.21, target: [0, 1.5, 0.6] }],
    objects: ["arrowArc", "arrowDown", "arrowUp", "clouds", "nordeste"],
    animations: [{ target: "clouds", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 657, fn: "easeInOut" }, { target: "map", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 657, fn: "easeInOut" }],
    badges: [{ text: "AR QUE DESCE = SEM NUVEM", kind: "neutral", f0: 0, anchorWord: "desce" }], highlights: ["desce"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 3078, durationInFrames: 508,
    narration: "Aí muita gente liga o ventilador achando que ele esfria o ar. Ao contrário do que muita gente pensa, ventilador não esfria nada: ele só sopra o ar pra secar o seu suor mais rápido. Sem água no corpo, nem ele ajuda.",
    camera: [{ f: 0, az: 18, el: 8, dist: 9.4, target: [-140.05, 1.4, 0.6] }, { f: 0, az: 14, el: 8, dist: 9.2, target: [-140.05, 1.4, 0.6], atWord: "contrário", wordOffset: 8 }, { f: 0, az: 10, el: 6, dist: 5.98, target: [-139.5, 1.65, 0.9], atWord: "suor", wordOffset: -10 }, { f: 508, az: 5, el: 6, dist: 5.98, target: [-139.5, 1.65, 0.9] }],
    objects: ["fan", "roomThermometer", "sweat"],
    animations: [{ target: "pause", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "sweat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }],
    badges: [{ text: "VENTILADOR NÃO ESFRIA O AR", kind: "problem", f0: 0, anchorWord: "contrário" }, { text: "SÓ SECA O SUOR", kind: "neutral", f0: 0, anchorWord: "suor" }], highlights: ["contrário", "suor"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
  { id: "s9", voKey: "s9", startFrame: 3586, durationInFrames: 520,
    narration: "Então bebe água antes de sentir sede, foge do sol entre dez da manhã e quatro da tarde, usa roupa clara e leve e fica de olho nos idosos e nas crianças, que sentem mais. E acompanha os alertas de onda de calor.",
    camera: [{ f: 0, az: 10, el: 6, dist: 6.21, target: [0, 1.6, 0.6] }, { f: 0, az: 15, el: 8, dist: 7.47, target: [-0.6, 1.5, 0.6], atWord: "foge", wordOffset: -4 }, { f: 0, az: 12, el: 8, dist: 7.47, target: [-4.0, 1.5, 0.6], atWord: "sol", wordOffset: 22 }, { f: 0, az: 10, el: 8, dist: 7.47, target: [-4.2, 1.5, 0.6], atWord: "roupa", wordOffset: -6 }, { f: 520, az: 5, el: 8, dist: 7.47, target: [-4.2, 1.5, 0.6] }],
    objects: ["bottle", "clock", "grandma", "kid", "phoneAlert", "shade"],
    animations: [{ target: "checks", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 520, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA ANTES DA SEDE", kind: "solution", f0: 0, anchorWord: "água" }, { text: "SOMBRA DAS 10H ÀS 16H", kind: "solution", f0: 0, anchorWord: "dez" }, { text: "ROUPA CLARA E LEVE", kind: "solution", f0: 0, anchorWord: "roupa" }], highlights: ["dez", "roupa", "água"], captions: cap,
    audioCues: [cue("whoosh-s9", 0)] },
  { id: "s10", voKey: "s10", startFrame: 4106, durationInFrames: 519,
    narration: "Parabéns, agora você sabe por que o Nordeste tá tão quente! E aí, qual foi a temperatura mais alta que você já pegou na sua cidade? Comenta aí embaixo, e diz o que você quer ver no próximo vídeo.",
    camera: [{ f: 0, az: 10, el: 8, dist: 7.47, target: [-4.2, 1.55, 0.6] }, { f: 0, az: 5, el: 8, dist: 8.97, target: [-4.2, 1.85, 0.6], atWord: "Parabéns", wordOffset: -4 }, { f: 0, az: 0, el: 6, dist: 7.47, target: [-4.2, 1.55, 0.6], atWord: "Comenta", wordOffset: -4 }, { f: 519, az: 0, el: 6, dist: 7.47, target: [-4.2, 1.55, 0.6] }],
    objects: ["confetti", "mascot", "tree"],
    animations: [{ target: "confetti", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 519, fn: "easeInOut" }],
    badges: [{ text: "AGORA VOCÊ SABE!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["parabéns"], captions: cap,
    audioCues: [cue("whoosh-s10", 0)] },
];
// Integridade: 10 cenas contíguas, soma 4625 frames.
