// Renderiza quadros soltos: node scripts/stills.mjs 10 200 400 ...  (sem args: meio de cada cena)
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const serveUrl = await bundle({entryPoint: path.join(root, "src/index.ts")});
const chromiumOptions = {gl: "angle"};
const browserExecutable = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const comp = await selectComposition({serveUrl, id: "Prova", chromiumOptions, browserExecutable});
let frames = process.argv.slice(2).map(Number);
for (const f of frames) {
  await renderStill({serveUrl, composition: comp, frame: f, output: path.join(root, `out/stills/f${String(f).padStart(4, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 80, chromiumOptions, browserExecutable, scale: 0.5});
  console.log("ok", f);
}
