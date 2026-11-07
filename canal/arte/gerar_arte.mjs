// Gera avatar.png (800x800) e banner.png (2560x1440) a partir dos HTML desta pasta.
// Uso: node canal/arte/gerar_arte.mjs   (precisa do Playwright: npm i -g playwright)
import {createRequire} from "node:module";
import {fileURLToPath, pathToFileURL} from "node:url";
import path from "node:path";

const {chromium} = createRequire(import.meta.url)("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const jobs = [
  {html: "avatar.html", out: "avatar.png", w: 800, h: 800},
  {html: "banner.html", out: "banner.png", w: 2560, h: 1440},
];

const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({viewport: {width: j.w, height: j.h}, deviceScaleFactor: 1});
  await page.goto(pathToFileURL(path.join(dir, j.html)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path: path.join(dir, j.out)});
  console.log("gerado:", j.out);
  await page.close();
}
await browser.close();
