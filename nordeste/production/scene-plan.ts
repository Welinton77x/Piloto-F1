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
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 211, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["caatinga", "cactos", "mascote", "sertão", "sol"],
    animations: [{ target: "mascot.sweat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }, { target: "heatWaves", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }],
    badges: [], highlights: [], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 211, durationInFrames: 463,
    narration: "O Nordeste fica pertinho da linha do Equador. Lá, o sol passa quase em cima da sua cabeça o ano todo, e os raios chegam retinhos, concentrados num pedaço pequeno do chão. Esse é o sol a pino.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 463, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["equatorLine", "globe", "mascotShadow", "sunRays"],
    animations: [{ target: "rays", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }, { target: "shadow", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }],
    badges: [{ text: "PERTO DO EQUADOR", kind: "neutral", f0: 0, anchorWord: "Equador" }, { text: "SOL A PINO", kind: "solution", f0: 0, anchorWord: "pino" }], highlights: ["equador", "pino"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 674, durationInFrames: 394,
    narration: "Mas só sol não basta. No litoral, o mar e a brisa ainda refrescam. Então você vai pro interior, longe do mar, onde quase não chove. Esse é o sertão, o semiárido.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 394, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["breezeArrows", "coast", "nordesteMap", "sertão"],
    animations: [{ target: "map", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 394, fn: "easeInOut" }, { target: "mascot", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 394, fn: "easeInOut" }],
    badges: [{ text: "LITORAL: BRISA DO MAR", kind: "neutral", f0: 0, anchorWord: "litoral" }, { text: "SERTÃO / SEMIÁRIDO", kind: "solution", f0: 0, anchorWord: "sertão" }], highlights: ["litoral", "sertão"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1068, durationInFrames: 508,
    narration: "E repara: quando tem água no chão, parte do calor vai pra evaporar essa água, igual o suor esfria a sua pele. Mas a terra do sertão tá seca. Então toda a energia vai direto pra esquentar o chão e o ar.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 508, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["drySoil", "heatArrows", "steam", "wetSoil"],
    animations: [{ target: "soil.heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "mascot", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }],
    badges: [{ text: "SEM ÁGUA, TUDO VIRA CALOR", kind: "problem", f0: 0, anchorWord: "energia" }], highlights: ["energia"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 1576, durationInFrames: 382,
    narration: "Agora junta isso com a cidade. Asfalto e concreto guardam o calor do dia e soltam de noite. Essa é a ilha de calor. Por isso, a noite quase não refresca.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 382, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["asphalt", "bed", "city", "heatWaves", "mascot", "moon"],
    animations: [{ target: "day→night", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 382, fn: "easeInOut" }, { target: "heat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 382, fn: "easeInOut" }],
    badges: [{ text: "ILHA DE CALOR", kind: "solution", f0: 0, anchorWord: "ilha" }], highlights: ["ilha"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 1958, durationInFrames: 463,
    narration: "E esse ano ainda tem El Niño. Lá longe, no oceano Pacífico, perto do Peru, a água do mar fica bem mais quente que o normal. Em outubro, ele bateu recorde e virou um El Niño muito forte.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 463, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["pacific", "seaThermometer", "southAmericaMap", "warmPatch"],
    animations: [{ target: "patch", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 463, fn: "easeInOut" }],
    badges: [{ text: "EL NIÑO", kind: "attention", f0: 0, anchorWord: "Niño" }, { text: "MUITO FORTE: RECORDE EM OUTUBRO", kind: "problem", f0: 0, anchorWord: "recorde" }], highlights: ["niño", "recorde"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 2421, durationInFrames: 657,
    narration: "Essa água quente faz o ar subir lá no Pacífico. Só que todo ar que sobe precisa descer em algum lugar. E ele desce justo em cima do Norte e do Nordeste. Ar descendo segura as nuvens, então não chove. Céu limpo, sol direto e chão ainda mais seco. É o calorão ficando ainda maior.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 657, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["arrowArc", "arrowDown", "arrowUp", "clouds", "nordeste"],
    animations: [{ target: "clouds", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 657, fn: "easeInOut" }, { target: "map", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 657, fn: "easeInOut" }],
    badges: [{ text: "AR QUE DESCE = SEM NUVEM", kind: "neutral", f0: 0, anchorWord: "desce" }], highlights: ["desce"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 3078, durationInFrames: 508,
    narration: "Aí muita gente liga o ventilador achando que ele esfria o ar. Ao contrário do que muita gente pensa, ventilador não esfria nada: ele só sopra o ar pra secar o seu suor mais rápido. Sem água no corpo, nem ele ajuda.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 508, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["fan", "roomThermometer", "sweat"],
    animations: [{ target: "pause", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }, { target: "sweat", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 508, fn: "easeInOut" }],
    badges: [{ text: "VENTILADOR NÃO ESFRIA O AR", kind: "problem", f0: 0, anchorWord: "contrário" }, { text: "SÓ SECA O SUOR", kind: "neutral", f0: 0, anchorWord: "suor" }], highlights: ["contrário", "suor"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
  { id: "s9", voKey: "s9", startFrame: 3586, durationInFrames: 520,
    narration: "Então bebe água antes de sentir sede, foge do sol entre dez da manhã e quatro da tarde, usa roupa clara e leve e fica de olho nos idosos e nas crianças, que sentem mais. E acompanha os alertas de onda de calor.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 520, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["bottle", "clock", "grandma", "kid", "phoneAlert", "shade"],
    animations: [{ target: "checks", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 520, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA ANTES DA SEDE", kind: "solution", f0: 0, anchorWord: "água" }, { text: "SOMBRA DAS 10H ÀS 16H", kind: "solution", f0: 0, anchorWord: "dez" }, { text: "ROUPA CLARA E LEVE", kind: "solution", f0: 0, anchorWord: "roupa" }], highlights: ["dez", "roupa", "água"], captions: cap,
    audioCues: [cue("whoosh-s9", 0)] },
  { id: "s10", voKey: "s10", startFrame: 4106, durationInFrames: 519,
    narration: "Parabéns, agora você sabe por que o Nordeste tá tão quente! E aí, qual foi a temperatura mais alta que você já pegou na sua cidade? Comenta aí embaixo, e diz o que você quer ver no próximo vídeo.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 519, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["confetti", "mascot", "tree"],
    animations: [{ target: "confetti", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 519, fn: "easeInOut" }],
    badges: [{ text: "AGORA VOCÊ SABE!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["parabéns"], captions: cap,
    audioCues: [cue("whoosh-s10", 0)] },
];
// Integridade: 10 cenas contíguas, soma 4625 frames.
