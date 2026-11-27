// node render-avatar.mjs [saida.png]
import {chromium} from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.dirname(new URL(import.meta.url).pathname);
const types = {".html": "text/html", ".js": "text/javascript"};
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) return r.writeHead(404).end();
  r.writeHead(200, {"content-type": types[path.extname(f)] ?? "application/octet-stream"}).end(fs.readFileSync(f));
}).listen(0);
const browser = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader"]});
const page = await browser.newPage({viewport: {width: 1080, height: 1080}, deviceScaleFactor: 1});
await page.goto(`http://localhost:${srv.address().port}/avatar.html`);
await page.waitForFunction(() => window.__done, null, {timeout: 120000});
await page.screenshot({path: process.argv[2] ?? path.join(root, "professor-perfil.png")});
await browser.close();
srv.close();
