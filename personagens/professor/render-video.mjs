// Grava animado.html quadro a quadro e monta MP4: node render-video.mjs [saida.mp4]
import {chromium} from "playwright";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
const root = path.dirname(new URL(import.meta.url).pathname);
const types = {".html": "text/html", ".js": "text/javascript"};
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) return r.writeHead(404).end();
  r.writeHead(200, {"content-type": types[path.extname(f)] ?? "application/octet-stream"}).end(fs.readFileSync(f));
}).listen(0);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prof-"));
const browser = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader"]});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.on("pageerror", (e) => console.log("[erro]", e.message));
await page.goto(`http://localhost:${srv.address().port}/animado.html?manual`);
await page.waitForFunction(() => window.__ready);
const total = await page.evaluate(() => window.TOTAL);
for (let i = 0; i < total; i++) {
  await page.evaluate((n) => window.frame(n), i);
  await page.screenshot({path: path.join(tmp, `f${String(i).padStart(4, "0")}.png`)});
}
await browser.close();
srv.close();
const out = process.argv[2] ?? path.join(root, "professor-jaleco.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "30", "-i", path.join(tmp, "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", out]);
fs.rmSync(tmp, {recursive: true});
console.log("ok", out);
