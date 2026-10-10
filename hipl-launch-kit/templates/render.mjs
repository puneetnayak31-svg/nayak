// Render the launch-kit artboards and logo PNGs.
// Usage (from the repo root, with a static server on the repo root):
//   python3 -m http.server 8790 &
//   node hipl-launch-kit/templates/render.mjs http://localhost:8790
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require("/opt/node22/lib/node_modules/playwright"); }

const here = path.dirname(fileURLToPath(import.meta.url));
const kit = path.resolve(here, "..");
const repo = path.resolve(kit, "..");
const base = (process.argv[2] || "http://localhost:8790").replace(/\/$/, "");

const browser = await playwright.chromium.launch();

// 1. Social artboards
const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(base + "/hipl-launch-kit/templates/social.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync(path.join(kit, "social"), { recursive: true });
const boards = await page.$$("[data-name]");
for (const b of boards) {
  const name = await b.getAttribute("data-name");
  const transparent = name === "profile-avatar";
  await b.screenshot({ path: path.join(kit, "social", name + ".png"), omitBackground: transparent });
  console.log("social/" + name + ".png");
}
fs.copyFileSync(path.join(kit, "social", "og-default.png"), path.join(repo, "hipl-website", "assets", "img", "og-default.png"));

// 2. Logo PNGs (transparent), from the outlined master SVGs
const brandDir = path.join(repo, "hipl-website", "assets", "brand");
fs.mkdirSync(path.join(kit, "logos", "svg"), { recursive: true });
fs.mkdirSync(path.join(kit, "logos", "png"), { recursive: true });
const lp = await browser.newPage({ viewport: { width: 2400, height: 2400 }, deviceScaleFactor: 1 });
for (const f of fs.readdirSync(brandDir).filter((f) => f.endsWith(".svg"))) {
  fs.copyFileSync(path.join(brandDir, f), path.join(kit, "logos", "svg", f));
  const svg = fs.readFileSync(path.join(brandDir, f), "utf8");
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const width = f.includes("favicon") ? 512 : f.includes("symbol") || f.includes("avatar") ? 1024 : 2000;
  const height = Math.round(width * vb[3] / vb[2]);
  await lp.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${width}" height="${height}" `)}</body></html>`);
  const el = await lp.$("svg");
  await el.screenshot({ path: path.join(kit, "logos", "png", f.replace(".svg", ".png")), omitBackground: true });
  console.log("logos/png/" + f.replace(".svg", ".png"));
}
// Favicon set for the website
for (const [size, name] of [[32, "favicon-32.png"], [180, "apple-touch-icon.png"], [512, "icon-512.png"]]) {
  const svg = fs.readFileSync(path.join(brandDir, "hipl-favicon.svg"), "utf8");
  await lp.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  await (await lp.$("svg")).screenshot({ path: path.join(repo, "hipl-website", "assets", "img", name), omitBackground: true });
  fs.copyFileSync(path.join(repo, "hipl-website", "assets", "img", name), path.join(kit, "logos", "png", name));
  console.log("favicon " + name);
}
await browser.close();
