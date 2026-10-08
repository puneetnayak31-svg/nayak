// Renders every .frame on each built page to PNG (and data-pdf frames to PDF) with Chromium.
// usage: node render.js PAGES_DIR OUT_DIR piece [piece ...]
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const [pagesDir, outDir, ...pieces] = process.argv.slice(2);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".ttf": "font/ttf", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(pagesDir, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const browser = await chromium.launch();
  for (const piece of pieces) {
    const dir = path.join(outDir, piece);
    fs.mkdirSync(dir, { recursive: true });
    const probe = await browser.newPage();
    await probe.goto(`http://127.0.0.1:${port}/${piece}.html`);
    await probe.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
    const frames = await probe.$$eval(".frame", fs_ => fs_.map(f => ({ name: f.dataset.name, scale: +(f.dataset.scale || 1), pdf: !!f.dataset.pdf, w: f.offsetWidth, h: f.offsetHeight })));
    await probe.close();
    const scales = [...new Set(frames.map(f => f.scale))];
    for (const scale of scales) {
      const ctx = await browser.newContext({ viewport: { width: 3400, height: 2000 }, deviceScaleFactor: scale });
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${port}/${piece}.html`);
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
      await page.waitForTimeout(300);
      const els = await page.$$(".frame");
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].scale !== scale) continue;
        await els[i].screenshot({ path: path.join(dir, frames[i].name + ".png") });
        console.log("  " + piece + "/" + frames[i].name + ".png", frames[i].w * scale + "x" + frames[i].h * scale);
      }
      await ctx.close();
    }
    for (const f of frames.filter(f => f.pdf)) {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${port}/${piece}.html`);
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
      await page.evaluate((name) => {
        document.body.style.cssText = "margin:0;padding:0;display:block;background:none";
        document.querySelectorAll(".frame").forEach(x => { if (x.dataset.name !== name) x.remove(); });
      }, f.name);
      await page.pdf({ path: path.join(dir, f.name + ".pdf"), width: f.w + "px", height: f.h + "px", printBackground: true, pageRanges: "1" });
      console.log("  " + piece + "/" + f.name + ".pdf");
      await page.close();
    }
  }
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
