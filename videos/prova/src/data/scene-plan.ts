// Plano de cenas v3 (sem sentido) — "Isso vai cair na prova?" (AGUARDANDO APROVAÇÃO)
// Frames a 30 fps, intervalos [início, fim); estimativas até existir a voz.

export type VideoConfig = {width: number; height: number; fps: number; durationInFrames: number; theme: "sala-de-aula"; language: "pt-BR"};
export type Vec3 = [number, number, number];
export type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";
export type CameraKey = {f: number; target: Vec3; radius: number; az: number; el: number; fov?: number};
export type SceneObject = {id: string; kind: string; position?: Vec3; note?: string};
export type Animation = {target: string; from: number | string; to: number | string; unit: "u3d" | "deg" | "frac" | "count" | "state" | "hz" | "timescale"; f0: number; f1: number; fn: "linear" | "easeOut" | "spring" | "sine" | "set" | "random"};
export type Badge = {kind: "pill" | "title" | "card" | "fact" | "follow" | "notify" | "badge" | "exam" | "vhs" | "dica" | "counter" | "fx"; tone?: "problem" | "solution" | "neutral" | "attention"; text: string; f: number; anchor?: string; out?: number};
export type AudioCue = {kind: "sfx" | "music"; name: string; f: number; status: "planned" | "made"};
export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: string | null;
  narration: string;
  delivery: string;
  set: "sala";
  camera: CameraKey[];
  objects: SceneObject[];
  animations: Animation[];
  badges: Badge[];
  highlights: string[];
  captions: "word-by-word";
  audioCues: AudioCue[];
  moods: {prof: {f: number; mood: Mood}[]; students?: {f: number; mood: "feliz" | "surpreso"}[]};
};

export const videoConfig: VideoConfig = {width: 1080, height: 1920, fps: 30, durationInFrames: 2229, theme: "sala-de-aula", language: "pt-BR"};
export const tts = {provider: "elevenlabs", voiceName: "Will - Deep", voiceId: "CstacWqMhJQlnfLPxRG4", model: "eleven_v4", settings: {stability: 0.5, similarity_boost: 0.75}} as const;

const same = (t: string) => ({narration: t, delivery: t});

export const scenes: ScenePlan[] = [
  {
    id: "s1", startFrame: 0, durationInFrames: 225, voKey: "s1", set: "sala",
    ...same("Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez."),
    camera: [{f: 0, target: [-0.4, 2.8, -0.8], radius: 26, az: 4, el: 14}, {f: 225, target: [-1.4, 3.15, -3.0], radius: 5.6, az: 14, el: 6}],
    objects: [{id: "prof", kind: "professor"}, {id: "asker", kind: "aluno-de-bone"}],
    animations: [{target: "asker.handUp", from: 0, to: 1, unit: "frac", f0: 40, f1: 55, fn: "spring"}, {target: "prof.turn", from: 180, to: 0, unit: "deg", f0: 140, f1: 160, fn: "spring"}],
    badges: [{kind: "title", text: "Isso vai cair na|[prova]?", f: 0, out: 90}, {kind: "pill", tone: "neutral", text: "VAI CAIR NA PROVA?", f: 70, anchor: "asker.head", out: 128}, {kind: "pill", tone: "problem", text: "TALVEZ.", f: 200, anchor: "prof.head"}],
    highlights: ["prova", "talvez"], captions: "word-by-word",
    audioCues: [{kind: "music", name: "trilha", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 120, status: "made"}, {kind: "sfx", name: "pop", f: 200, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], students: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s2", startFrame: 225, durationInFrames: 270, voKey: "s2", set: "sala",
    ...same("Porque o talvez é contagioso. Em trinta segundos, a sala inteira fala talvez, inclusive a janela, que nem estava na aula."),
    camera: [{f: 0, target: [-2.4, 2.0, 1.5], radius: 11, az: 180, el: 24}, {f: 160, target: [2.4, 2.0, 1.5], radius: 11, az: 180, el: 24}, {f: 161, target: [-5.0, 4.3, -4.4], radius: 9, az: 10, el: 4}, {f: 270, target: [-5.0, 4.3, -4.4], radius: 8, az: 4, el: 4}],
    objects: [{id: "talvezBubbles", kind: "baloes-talvez"}, {id: "windowFace", kind: "janela-com-rosto"}],
    animations: [{target: "talvezBubbles.hop", from: 0, to: 6, unit: "count", f0: 0, f1: 70, fn: "linear"}, {target: "windowFace.bubble", from: 0, to: 1, unit: "frac", f0: 165, f1: 180, fn: "spring"}],
    badges: [{kind: "pill", tone: "problem", text: "CONTAGIOSO", f: 30, anchor: "asker.head", out: 150}, {kind: "pill", tone: "attention", text: "A JANELA TAMBÉM", f: 180, anchor: "window"}],
    highlights: ["contagioso", "janela", "talvez"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 30, status: "made"}, {kind: "sfx", name: "pop", f: 170, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s3", startFrame: 495, durationInFrames: 213, voKey: "s3", set: "sala",
    ...same("Isso é chamado de pânico acadêmico coletivo, e a única cura conhecida é um pato de gravata."),
    camera: [{f: 0, target: [-0.6, 2.2, -0.8], radius: 15, az: 0, el: 28}, {f: 120, target: [-0.6, 2.2, -0.8], radius: 14, az: 8, el: 28}, {f: 121, target: [5.2, 1.6, -0.6], radius: 8, az: -40, el: 10}, {f: 213, target: [4.8, 1.6, -0.6], radius: 7, az: -30, el: 10}],
    objects: [{id: "papers", kind: "folhas-voando"}, {id: "duck", kind: "pato-de-gravata"}, {id: "spot", kind: "holofote"}, {id: "smoke", kind: "fumaca"}],
    animations: [{target: "spot.opacity", from: 0, to: 0.5, unit: "frac", f0: 120, f1: 135, fn: "easeOut"}, {target: "duck.x", from: 6.5, to: 4.5, unit: "u3d", f0: 125, f1: 213, fn: "linear"}, {target: "time.scale", from: 0.4, to: 0.4, unit: "timescale", f0: 125, f1: 213, fn: "set"}],
    badges: [{kind: "card", text: "DEFINIÇÃO TÉCNICA|PÂNICO ACADÊMICO COLETIVO", f: 10, out: 118}, {kind: "pill", tone: "solution", text: "CURA: PATO DE GRAVATA", f: 140, anchor: "duck"}],
    highlights: ["pânico", "pato", "gravata"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 10, status: "made"}, {kind: "sfx", name: "aaah", f: 122, status: "made"}, {kind: "sfx", name: "quack", f: 180, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s4", startFrame: 708, durationInFrames: 258, voKey: "s4", set: "sala",
    ...same("Então você chama o pato. O pato corrige a prova em trinta segundos e dá nota sete pra todo mundo, inclusive pro relógio."),
    camera: [{f: 0, target: [2.9, 2.4, -2.2], radius: 9, az: -8, el: 30}, {f: 150, target: [0, 2.4, 1.0], radius: 12, az: 180, el: 26}, {f: 210, target: [0, 2.4, 1.0], radius: 11, az: 186, el: 26}, {f: 211, target: [4.6, 6.7, -4.3], radius: 5, az: 0, el: 0}, {f: 258, target: [4.6, 6.7, -4.3], radius: 4.5, az: 0, el: 0}],
    objects: [{id: "duck", kind: "pato-de-gravata", note: "caneta vermelha"}, {id: "exams", kind: "pilha-de-provas"}, {id: "flyingPapers", kind: "folhas"}, {id: "sevens", kind: "adesivos-7"}, {id: "clock", kind: "relogio-com-rosto"}],
    animations: [{target: "flyingPapers.rate", from: 0, to: 1, unit: "frac", f0: 40, f1: 150, fn: "random"}, {target: "sevens.count", from: 0, to: 6, unit: "count", f0: 150, f1: 200, fn: "linear"}, {target: "clock.seven", from: 0, to: 1, unit: "frac", f0: 220, f1: 235, fn: "spring"}],
    badges: [{kind: "pill", tone: "solution", text: "NOTA 7 PRA TODOS ✓", f: 160, anchor: "asker.head", out: 210}, {kind: "pill", tone: "attention", text: "RELÓGIO: 7", f: 225, anchor: "clock"}],
    highlights: ["sete", "relógio", "pato"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "quack", f: 10, status: "made"}, {kind: "sfx", name: "whoosh", f: 40, status: "made"}, {kind: "sfx", name: "pop", f: 160, status: "made"}, {kind: "sfx", name: "pop", f: 225, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}, {f: 150, mood: "feliz"}]},
  },
  {
    id: "s5", startFrame: 966, durationInFrames: 213, voKey: "s5", set: "sala",
    ...same("O relógio fica tão feliz que começa a andar ao contrário, e a aula volta pra segunda-feira passada."),
    camera: [{f: 0, target: [4.6, 6.7, -4.3], radius: 5, az: 0, el: 0}, {f: 90, target: [4.6, 6.7, -4.3], radius: 4.4, az: 0, el: 0}, {f: 91, target: [0, 2.8, -0.6], radius: 20, az: 0, el: 16}, {f: 213, target: [0, 2.8, -0.6], radius: 22, az: -6, el: 16}],
    objects: [{id: "clock", kind: "relogio-com-rosto"}, {id: "vhs", kind: "efeito-rebobinar"}],
    animations: [{target: "clock.hands", from: 0, to: -720, unit: "deg", f0: 30, f1: 213, fn: "easeOut"}, {target: "vhs.opacity", from: 0, to: 1, unit: "frac", f0: 60, f1: 70, fn: "set"}],
    badges: [{kind: "vhs", text: "◀◀ SEGUNDA-FEIRA PASSADA", f: 60}],
    highlights: ["contrário", "segunda-feira", "feliz"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "rebobinar", f: 60, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s6", startFrame: 1179, durationInFrames: 105, voKey: "s6", set: "sala",
    ...same("Esse fenômeno é conhecido como recuperação temporal."),
    camera: [{f: 0, target: [-1.4, 3.15, -3.0], radius: 9, az: 18, el: 6}, {f: 105, target: [-1.4, 3.15, -3.0], radius: 8, az: 8, el: 6}],
    objects: [{id: "sepia", kind: "filtro-sepia"}],
    animations: [{target: "sepia.amount", from: 0.3, to: 0.3, unit: "frac", f0: 0, f1: 105, fn: "set"}],
    badges: [{kind: "card", text: "DEFINIÇÃO TÉCNICA|RECUPERAÇÃO TEMPORAL", f: 8}],
    highlights: ["recuperação", "temporal"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 8, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s7", startFrame: 1284, durationInFrames: 192, voKey: "s7", set: "sala",
    ...same("Na segunda-feira passada, você descobre que o giz era um dinossauro disfarçado o tempo todo."),
    camera: [{f: 0, target: [2.9, 1.9, -2.2], radius: 4.5, az: -10, el: 24}, {f: 192, target: [2.9, 2.1, -2.2], radius: 4.0, az: 6, el: 20}],
    objects: [{id: "chalk", kind: "giz-com-rosto"}, {id: "smoke", kind: "fumaca"}, {id: "dino", kind: "dinossauro-de-giz"}],
    animations: [{target: "chalk.shake", from: 0, to: 20, unit: "hz", f0: 50, f1: 110, fn: "sine"}, {target: "dino.scale", from: 0, to: 1, unit: "frac", f0: 110, f1: 125, fn: "spring"}],
    badges: [{kind: "pill", tone: "problem", text: "DISFARÇADO O TEMPO TODO", f: 130, anchor: "dino"}],
    highlights: ["dinossauro", "disfarçado", "giz"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "puf", f: 110, status: "planned"}, {kind: "sfx", name: "rugido", f: 125, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s8", startFrame: 1476, durationInFrames: 225, voKey: "s8", set: "sala",
    ...same("Ele não aceita perder e desafia o diretor pra uma partida de xadrez usando pão de queijo como peças."),
    camera: [{f: 0, target: [4.0, 2.4, -1.4], radius: 13, az: -20, el: 14}, {f: 150, target: [2.9, 2.0, -2.2], radius: 6, az: -4, el: 30}, {f: 151, target: [2.4, 2.0, -2.2], radius: 2.6, az: -90, el: 2}, {f: 170, target: [3.8, 3.2, -2.2], radius: 3.2, az: 90, el: 2}, {f: 190, target: [2.9, 2.0, -2.2], radius: 7, az: 0, el: 26}, {f: 225, target: [2.9, 2.0, -2.2], radius: 6.5, az: 6, el: 26}],
    objects: [{id: "director", kind: "diretor"}, {id: "chessboard", kind: "tabuleiro"}, {id: "paoDeQueijo", kind: "paes-de-queijo", note: "16"}],
    animations: [{target: "director.x", from: 6.5, to: 4.0, unit: "u3d", f0: 0, f1: 60, fn: "easeOut"}, {target: "chessboard.scale", from: 0, to: 1, unit: "frac", f0: 90, f1: 105, fn: "spring"}, {target: "paoDeQueijo.drop", from: 0, to: 16, unit: "count", f0: 110, f1: 145, fn: "linear"}],
    badges: [{kind: "pill", tone: "problem", text: "NÃO ACEITA PERDER", f: 20, anchor: "dino", out: 90}, {kind: "pill", tone: "neutral", text: "DESAFIO ACEITO", f: 100, anchor: "director.head"}],
    highlights: ["xadrez", "pão", "queijo", "perder"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 95, status: "made"}, {kind: "sfx", name: "ventofaroeste", f: 150, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s9", startFrame: 1701, durationInFrames: 192, voKey: "s9", set: "sala",
    ...same("O diretor perde, o dinossauro vira diretor, e o pato agora é coordenador pedagógico."),
    camera: [{f: 0, target: [3.2, 2.2, -2.0], radius: 9, az: -6, el: 14}, {f: 192, target: [3.2, 2.2, -2.0], radius: 8, az: 6, el: 14}],
    objects: [{id: "badges3d", kind: "crachas"}],
    animations: [{target: "director.sad", from: 0, to: 1, unit: "frac", f0: 10, f1: 30, fn: "spring"}, {target: "badges.show", from: 0, to: 1, unit: "frac", f0: 60, f1: 75, fn: "spring"}],
    badges: [{kind: "badge", text: "DIRETOR|Espécie: dinossauro de giz", f: 60, out: 125}, {kind: "badge", text: "COORDENADOR PEDAGÓGICO|Espécie: pato", f: 125}],
    highlights: ["diretor", "coordenador", "pedagógico"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "tum", f: 12, status: "made"}, {kind: "sfx", name: "plim", f: 62, status: "made"}, {kind: "sfx", name: "plim", f: 127, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s10", startFrame: 1893, durationInFrames: 156, voKey: "s10", set: "sala",
    ...same("No dia da prova, a única questão é: por que você disse talvez?"),
    camera: [{f: 0, target: [0, 1.6, 0.0], radius: 6, az: 160, el: 40}, {f: 156, target: [0, 1.6, 0.0], radius: 5, az: 170, el: 44}],
    objects: [{id: "examSheet", kind: "folha-de-prova"}],
    animations: [{target: "examSheet.slide", from: 0, to: 1, unit: "frac", f0: 10, f1: 25, fn: "spring"}],
    badges: [{kind: "exam", text: "PROVA|QUESTÃO 1 (10 pontos)|Por que você disse talvez?", f: 20}],
    highlights: ["talvez", "questão"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 20, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s11", startFrame: 2049, durationInFrames: 180, voKey: "s11", set: "sala",
    ...same("Moral da história: nunca diga talvez. Diga pato."),
    camera: [{f: 0, target: [0.5, 2.6, -1.0], radius: 20, az: -8, el: 14}, {f: 180, target: [0.5, 2.6, -1.0], radius: 23, az: 8, el: 16}],
    objects: [{id: "duck", kind: "pato-coordenador"}, {id: "dino", kind: "dinossauro-diretor"}],
    animations: [{target: "duck.wings", from: 0, to: 1, unit: "frac", f0: 60, f1: 75, fn: "spring"}, {target: "follow.state", from: "Seguir", to: "Seguindo ✓", unit: "state", f0: 140, f1: 141, fn: "set"}],
    badges: [{kind: "follow", text: "@professorpowerguido", f: 100}],
    highlights: ["talvez", "pato", "moral"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "quack", f: 62, status: "made"}, {kind: "sfx", name: "pop", f: 100, status: "made"}, {kind: "sfx", name: "pop", f: 140, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], students: [{f: 0, mood: "feliz"}]},
  },
];

(() => {
  let f = 0;
  for (const s of scenes) {
    if (s.startFrame !== f) throw new Error(`cena ${s.id} começa em ${s.startFrame}, esperado ${f}`);
    f += s.durationInFrames;
  }
  if (f !== videoConfig.durationInFrames) throw new Error(`soma ${f} ≠ ${videoConfig.durationInFrames}`);
})();
