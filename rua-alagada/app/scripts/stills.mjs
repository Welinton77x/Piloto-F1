// Gera stills (frames globais) com um único bundle. Uso: node scripts/stills.mjs out/dir 10 200 350 ...
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
import path from "node:path";
const [dir, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve("src/index.ts")});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const chromiumOptions = {gl: "swangle"};
const composition = await selectComposition({serveUrl, id: "RuaAlagada", browserExecutable, chromiumOptions});
console.log("total", composition.durationInFrames);
for (const f of frames.map(Number)) {
  await renderStill({serveUrl, composition, frame: f, output: path.join(dir, `f${String(f).padStart(5, "0")}.png`), scale: 0.5, browserExecutable, chromiumOptions});
  process.stdout.write(f + " ");
}
