// Plano de cenas v2 (comédia) — "Vai na padaria comprar pão?" (AGUARDANDO APROVAÇÃO)
// Contrato de dados para a Fase 2 (vira src/data/scene-plan.ts). Frames a 30 fps, intervalos [início, fim).
// Os frames são estimativas: os cortes finais seguem a voz real (src/data/timeline.ts).

export type VideoConfig = {width: number; height: number; fps: number; durationInFrames: number; theme: "padaria"; language: "pt-BR"};
export type Vec3 = [number, number, number];
export type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";
export type CameraKey = {f: number; target: Vec3; radius: number; az: number; el: number; fov?: number};
export type SceneObject = {id: string; kind: string; position?: Vec3; note?: string};
export type Animation = {target: string; from: number | string; to: number | string; unit: "u3d" | "deg" | "frac" | "kg" | "count" | "state" | "timescale"; f0: number; f1: number; fn: "linear" | "easeOut" | "spring" | "sine" | "set" | "random"};
export type Badge = {kind: "dica" | "pill" | "title" | "counter" | "fact" | "follow" | "fx"; tone?: "problem" | "solution" | "neutral" | "attention"; text: string; f: number; anchor?: string; out?: number};
export type AudioCue = {kind: "sfx" | "music"; name: string; f: number; status: "planned" | "made"};
export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: string | null;
  narration: string;
  camera: CameraKey[];
  objects: SceneObject[];
  animations: Animation[];
  badges: Badge[];
  highlights: string[];
  captions: "word-by-word";
  audioCues: AudioCue[];
  moods: {prof: {f: number; mood: Mood}[]; baker?: {f: number; mood: "feliz" | "bravo" | "surpreso"}[]};
};

export const videoConfig: VideoConfig = {width: 1080, height: 1920, fps: 30, durationInFrames: 2025, theme: "padaria", language: "pt-BR"};
export const tts = {provider: "elevenlabs", voiceName: "Will - Social media", voiceId: "r3KkFedJ4n8aabIZ0RFQ", model: "eleven_multilingual_v2", speed: 1.05} as const;

export const scenes: ScenePlan[] = [
  {
    id: "s1", startFrame: 0, durationInFrames: 147, voKey: "s1",
    narration: "Vai na padaria comprar pão? Então segue essas quatro dicas.",
    camera: [{f: 0, target: [1.9, 2.4, 0.3], radius: 30, az: 20, el: 20, fov: 24}, {f: 147, target: [1.6, 2.4, 0.4], radius: 26, az: 12, el: 17, fov: 24}],
    objects: [{id: "prof", kind: "professor"}, {id: "baker", kind: "padeiro"}],
    animations: [{target: "prof.x", from: 8.5, to: 3.1, unit: "u3d", f0: 0, f1: 70, fn: "easeOut"}],
    badges: [{kind: "title", text: "Vai na padaria|comprar [pão]?", f: 0, out: 95}, {kind: "counter", tone: "neutral", text: "4 DICAS", f: 100, anchor: "prof.head"}],
    highlights: ["pão"], captions: "word-by-word",
    audioCues: [{kind: "music", name: "trilha", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 100, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s2", startFrame: 147, durationInFrames: 189, voKey: "s2",
    narration: "Primeiro: ao entrar, não diga bom dia. Olhe fundo nos olhos do padeiro e fale a senha secreta:",
    camera: [{f: 0, target: [3.1, 3.9, 1.2], radius: 12, az: -30, el: 4}, {f: 120, target: [3.1, 3.9, 1.2], radius: 8, az: -30, el: 4}, {f: 150, target: [-0.5, 3.6, -1.2], radius: 7, az: 0, el: 4}, {f: 189, target: [3.1, 3.9, 1.2], radius: 7.5, az: -30, el: 4}],
    objects: [{id: "glint", kind: "brilho-oculos"}],
    animations: [
      {target: "cam.radius", from: 12, to: 8, unit: "u3d", f0: 0, f1: 120, fn: "linear"},
      {target: "glint.scale", from: 0, to: 1, unit: "frac", f0: 90, f1: 105, fn: "sine"},
    ],
    badges: [{kind: "dica", text: "DICA 1", f: 0}, {kind: "pill", tone: "problem", text: "BOM DIA ✖", f: 40, anchor: "prof.head", out: 120}],
    highlights: ["senha", "secreta"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 2, status: "made"}, {kind: "sfx", name: "plim", f: 92, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}], baker: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s3", startFrame: 336, durationInFrames: 177, voKey: "s3",
    narration: "\"O pão é francês, mas eu sou brasileiro.\" Ele vai saber que você é profissional.",
    camera: [{f: 0, target: [1.3, 2.8, 0.4], radius: 15, az: -8, el: 10}, {f: 177, target: [0.9, 2.8, 0.2], radius: 13.5, az: 8, el: 10}],
    objects: [{id: "flour", kind: "farinha", note: "30 partículas"}, {id: "papers", kind: "papeis", note: "6 folhas"}],
    animations: [
      {target: "prof.armR.slam", from: 0, to: 1, unit: "frac", f0: 4, f1: 12, fn: "spring"},
      {target: "cam.shake", from: 0.08, to: 0, unit: "u3d", f0: 10, f1: 25, fn: "sine"},
      {target: "flour.t", from: 0, to: 1, unit: "frac", f0: 10, f1: 60, fn: "easeOut"},
      {target: "baker.salute", from: 0, to: 1, unit: "frac", f0: 60, f1: 75, fn: "spring"},
    ],
    badges: [
      {kind: "pill", tone: "problem", text: "O PÃO É FRANCÊS, MAS EU SOU BRASILEIRO!", f: 5, anchor: "prof.head", out: 100},
      {kind: "pill", tone: "solution", text: "PROFISSIONAL ✓", f: 110, anchor: "baker.head"},
    ],
    highlights: ["francês", "brasileiro", "profissional"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "tum", f: 10, status: "made"}, {kind: "sfx", name: "pop", f: 110, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}, {f: 100, mood: "feliz"}], baker: [{f: 0, mood: "surpreso"}, {f: 60, mood: "feliz"}]},
  },
  {
    id: "s4", startFrame: 513, durationInFrames: 219, voKey: "s4",
    narration: "Segundo: se o pão vier clarinho, desafie o padeiro pra uma partida de pingue-pongue com pão de forma.",
    camera: [{f: 0, target: [-1.15, 2.4, 0.3], radius: 10, az: 6, el: 14}, {f: 110, target: [-1.15, 2.4, 0.3], radius: 9.5, az: 12, el: 14}, {f: 111, target: [0.8, 2.9, 0], radius: 17, az: -6, el: 12}, {f: 219, target: [0.8, 2.9, 0], radius: 16, az: 6, el: 12}],
    objects: [{id: "breadPale", kind: "pao-branquelo"}, {id: "slices", kind: "fatias-pao-de-forma", note: "2, uma em cada mão"}, {id: "baguetteNet", kind: "baguete-rede"}, {id: "ball", kind: "bolinha"}],
    animations: [
      {target: "breadPale.lift", from: 0, to: 0.4, unit: "u3d", f0: 20, f1: 50, fn: "spring"},
      {target: "prof.armR", from: "idle", to: "point", unit: "state", f0: 100, f1: 110, fn: "spring"},
      {target: "slices.scale", from: 0, to: 1, unit: "frac", f0: 120, f1: 135, fn: "spring"},
      {target: "baguetteNet.y", from: 6, to: 1.95, unit: "u3d", f0: 140, f1: 155, fn: "spring"},
    ],
    badges: [{kind: "dica", text: "DICA 2", f: 0}, {kind: "pill", tone: "problem", text: "CLARINHO ✖", f: 30, anchor: "breadPale", out: 110}],
    highlights: ["clarinho", "pingue-pongue"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 30, status: "made"}, {kind: "sfx", name: "pop", f: 120, status: "made"}, {kind: "sfx", name: "tum", f: 152, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}], baker: [{f: 0, mood: "feliz"}, {f: 120, mood: "bravo"}]},
  },
  {
    id: "s5", startFrame: 732, durationInFrames: 177, voKey: "s5",
    narration: "Ele vai aceitar. Padeiro acorda antes do sol, não tem medo de nada.",
    camera: [{f: 0, target: [0.8, 2.9, 0], radius: 15, az: -10, el: 10}, {f: 120, target: [0.8, 2.9, 0], radius: 13, az: 8, el: 10}, {f: 177, target: [0.0, 3.3, -0.6], radius: 9, az: 14, el: 8}],
    objects: [{id: "ball", kind: "bolinha"}, {id: "trail", kind: "rastro"}, {id: "bakerHat", kind: "chapeu-voando"}],
    animations: [
      {target: "ball.rally", from: 0, to: 4, unit: "count", f0: 0, f1: 120, fn: "linear"},
      {target: "time.scale", from: 1, to: 0.3, unit: "timescale", f0: 120, f1: 177, fn: "set"},
      {target: "bakerHat.y", from: 0, to: 1.5, unit: "u3d", f0: 150, f1: 177, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "neutral", text: "DESAFIO ACEITO", f: 5, anchor: "baker.head", out: 115}, {kind: "pill", tone: "attention", text: "CÂMERA LENTA", f: 120, anchor: "ball"}],
    highlights: ["aceitar", "medo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "toc", f: 10, status: "planned"}, {kind: "sfx", name: "toc", f: 30, status: "planned"}, {kind: "sfx", name: "toc", f: 50, status: "planned"}, {kind: "sfx", name: "toc", f: 70, status: "planned"}, {kind: "sfx", name: "toc", f: 90, status: "planned"}, {kind: "sfx", name: "whooshlento", f: 120, status: "planned"}],
    moods: {prof: [{f: 0, mood: "bravo"}], baker: [{f: 0, mood: "bravo"}, {f: 150, mood: "surpreso"}]},
  },
  {
    id: "s6", startFrame: 909, durationInFrames: 156, voKey: "s6",
    narration: "Terceiro: quando ele perguntar \"mais alguma coisa?\", responda: \"só a felicidade\".",
    camera: [{f: 0, target: [-0.5, 3.6, -1.2], radius: 8, az: 8, el: 4}, {f: 90, target: [-0.5, 3.6, -1.2], radius: 7.5, az: 2, el: 4}, {f: 91, target: [3.1, 3.9, 1.2], radius: 8, az: -34, el: 4}, {f: 156, target: [3.1, 3.9, 1.2], radius: 7.5, az: -26, el: 4}],
    objects: [],
    animations: [{target: "prof.handOnChest", from: 0, to: 1, unit: "frac", f0: 95, f1: 110, fn: "spring"}],
    badges: [
      {kind: "dica", text: "DICA 3", f: 0},
      {kind: "pill", tone: "neutral", text: "MAIS ALGUMA COISA?", f: 40, anchor: "baker.head", out: 90},
      {kind: "pill", tone: "problem", text: "SÓ A FELICIDADE.", f: 100, anchor: "prof.head"},
    ],
    highlights: ["felicidade"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 2, status: "made"}, {kind: "sfx", name: "pop", f: 40, status: "made"}, {kind: "sfx", name: "pop", f: 100, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 95, mood: "sereno"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s7", startFrame: 1065, durationInFrames: 165, voKey: "s7",
    narration: "Ele vai te entregar um sonho. Que, convenhamos, é quase a mesma coisa.",
    camera: [{f: 0, target: [1.8, 3.0, 0.6], radius: 12, az: -12, el: 8}, {f: 165, target: [2.2, 3.2, 0.8], radius: 10, az: 2, el: 8}],
    objects: [{id: "sonho", kind: "sonho", note: "doce redondo, açúcar e creme"}, {id: "rays", kind: "raios-de-luz"}, {id: "sparkles", kind: "brilhos"}],
    animations: [
      {target: "sonho.path", from: 0, to: 1, unit: "frac", f0: 10, f1: 40, fn: "spring"},
      {target: "rays.rot", from: 0, to: 55, unit: "deg", f0: 0, f1: 165, fn: "linear"},
    ],
    badges: [{kind: "pill", tone: "solution", text: "SONHO ✓", f: 20, anchor: "sonho"}],
    highlights: ["sonho", "mesma"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "aaah", f: 12, status: "planned"}, {kind: "sfx", name: "pop", f: 20, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}, {f: 45, mood: "sereno"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s8", startFrame: 1230, durationInFrames: 144, voKey: "s8",
    narration: "Quarto: suba na balança e peça o seu peso em pão.",
    camera: [{f: 0, target: [1.6, 3.6, 0.3], radius: 16, az: -10, el: 10}, {f: 144, target: [1.6, 3.8, 0.3], radius: 14, az: 6, el: 10}],
    objects: [{id: "scale", kind: "balanca"}],
    animations: [
      {target: "prof.climb", from: 0, to: 1, unit: "frac", f0: 15, f1: 35, fn: "spring"},
      {target: "scale.display", from: 0, to: 72, unit: "kg", f0: 40, f1: 90, fn: "random"},
    ],
    badges: [{kind: "dica", text: "DICA 4", f: 0}, {kind: "pill", tone: "problem", text: "72 KG DE PÃO, POR FAVOR", f: 60, anchor: "prof.head"}],
    highlights: ["balança", "peso"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 2, status: "made"}, {kind: "sfx", name: "tum", f: 35, status: "made"}, {kind: "sfx", name: "plim", f: 90, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 35, mood: "eureka"}], baker: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s9", startFrame: 1374, durationInFrames: 219, voKey: "s9",
    narration: "Parece loucura, mas o pão francês só pode ser vendido a peso. É regra do Inmetro, de verdade.",
    camera: [{f: 0, target: [2.4, 3.2, 0.8], radius: 17, az: -6, el: 8}, {f: 219, target: [1.6, 3.2, 0.5], radius: 19, az: 8, el: 12}],
    objects: [{id: "stamp", kind: "carimbo", note: "face 'A PESO ✓'"}, {id: "rain", kind: "chuva-de-pao", note: "60 pães"}],
    animations: [
      {target: "stamp.y", from: 10, to: 1.15, unit: "u3d", f0: 10, f1: 25, fn: "spring"},
      {target: "rain.t", from: 0, to: 1, unit: "frac", f0: 80, f1: 190, fn: "random"},
    ],
    badges: [{kind: "fact", tone: "attention", text: "FATO REAL · INMETRO", f: 5}],
    highlights: ["Inmetro", "peso", "verdade"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "tum", f: 25, status: "made"}, {kind: "sfx", name: "chuvapao", f: 80, status: "planned"}],
    moods: {prof: [{f: 0, mood: "eureka"}, {f: 80, mood: "surpreso"}], baker: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s10", startFrame: 1593, durationInFrames: 252, voKey: "s10",
    narration: "Pronto: você saiu com setenta quilos de pão. E dentro do sonho tem um bilhete do padeiro pedindo revanche no pingue-pongue.",
    camera: [{f: 0, target: [0.1, 2.8, 0], radius: 14, az: -8, el: 12}, {f: 110, target: [0.1, 2.8, 0], radius: 12, az: 6, el: 12}, {f: 111, target: [0.2, 2.6, 1.2], radius: 5, az: 0, el: 6}, {f: 150, target: [0.2, 2.6, 1.2], radius: 5.5, az: 0, el: 6}, {f: 151, target: [0.5, 3.4, -1.0], radius: 9, az: -6, el: 6}, {f: 252, target: [0.5, 3.4, -1.0], radius: 8, az: 6, el: 6}],
    objects: [{id: "homePile", kind: "montanha-de-pao"}, {id: "sonho", kind: "sonho-aberto"}, {id: "note", kind: "bilhete", note: "'REVANCHE. AMANHÃ, 6H. — PADEIRO'"}, {id: "slices", kind: "fatia-pao-de-forma"}],
    animations: [
      {target: "note.path", from: 0, to: 1, unit: "frac", f0: 110, f1: 140, fn: "spring"},
      {target: "prof.slice.lift", from: 0, to: 1, unit: "frac", f0: 170, f1: 185, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "solution", text: "70 KG DE PÃO ✓", f: 20, anchor: "homePile", out: 105}, {kind: "pill", tone: "problem", text: "REVANCHE", f: 150, anchor: "prof.head"}],
    highlights: ["setenta", "revanche", "pingue-pongue"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 20, status: "made"}, {kind: "sfx", name: "whoosh", f: 110, status: "made"}, {kind: "sfx", name: "tum", f: 150, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 110, mood: "surpreso"}, {f: 150, mood: "bravo"}]},
  },
  {
    id: "s11", startFrame: 1845, durationInFrames: 180, voKey: "s11",
    narration: "E você, pede o pão moreninho ou clarinho?",
    camera: [{f: 0, target: [0.8, 2.9, 0.2], radius: 19, az: -14, el: 12}, {f: 180, target: [0.8, 2.9, 0.2], radius: 18, az: 16, el: 12}],
    objects: [{id: "ball", kind: "bolinha"}, {id: "confetti", kind: "confete"}],
    animations: [{target: "ball.rally", from: 0, to: 9, unit: "count", f0: 0, f1: 180, fn: "linear"}, {target: "follow.state", from: "Seguir", to: "Seguindo ✓", unit: "state", f0: 120, f1: 121, fn: "set"}],
    badges: [{kind: "follow", text: "@professorpowerguido", f: 80}],
    highlights: ["moreninho", "clarinho"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "toc", f: 10, status: "planned"}, {kind: "sfx", name: "toc", f: 30, status: "planned"}, {kind: "sfx", name: "pop", f: 80, status: "made"}, {kind: "sfx", name: "pop", f: 120, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}], baker: [{f: 0, mood: "bravo"}]},
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
