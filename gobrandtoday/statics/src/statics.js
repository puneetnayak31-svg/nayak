// Helpers for the static marketing pieces. Each page builds one or more .frame elements; the
// renderer screenshots every frame at its exact size (data-name = file name, data-scale = DPR).
function frame(name, w, h, opts = {}) {
  const f = el("div", "frame" + (opts.dark ? " dark" : ""), document.body);
  Object.assign(f.style, { width: w + "px", height: h + "px" });
  if (opts.bg) f.style.background = opts.bg;
  f.dataset.name = name;
  if (opts.scale) f.dataset.scale = String(opts.scale);
  f.W = w; f.H = h;
  return f;
}
function finish(f) { if (!f.dataset.nograin) el("div", "grainov", f); return f; }

// The field of full stops, still: dots with a few sparks, optionally fading out of a clear zone.
function dotField(f, o = {}) {
  const gap = o.gap || 54, r = rng(o.seed || 3);
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "dotfield"); svg.setAttribute("width", f.W); svg.setAttribute("height", f.H);
  let out = "";
  const col = o.color || "rgba(109,74,255,0.22)", sp = o.spark || "rgba(109,74,255,0.55)";
  for (let y = gap / 2; y < f.H; y += gap) for (let x = gap / 2; x < f.W; x += gap) {
    if (o.clear && o.clear.some(z => x > z[0] && x < z[0] + z[2] && y > z[1] && y < z[1] + z[3])) continue;
    if (r() < (o.sparkShare || 0.06)) {
      const s = (o.sparkSize || 9) * (0.7 + r() * 0.6);
      out += `<path d="${sparkD(2)}" transform="translate(${x} ${y}) scale(${s})" fill="${sp}"/>`;
    } else out += `<circle cx="${x}" cy="${y}" r="${o.dot || 2.6}" fill="${col}"/>`;
  }
  svg.innerHTML = out;
  f.appendChild(svg);
  return svg;
}

function sparkIcon(parent, size, color = "var(--violet)") {
  const s = sparkSVG(color, 2, "spark-svg");
  s.svg.style.cssText = `display:inline-block;width:${size}px;height:${size}px;overflow:visible`;
  parent.appendChild(s.svg);
  return s.svg;
}

// gobrandtoday wordmark at (x, y) (top-left), or centred on x when o.center
function wordmarkAt(f, size, x, y, o = {}) {
  const wm = buildWordmark(f, size, { color: o.color || "var(--graphite)", spark: o.spark || "var(--violet)", m: 2 });
  const g = wm.place();
  if (o.noTwin) wm.twin.svg.style.display = "none";
  wm.wm.style.left = (o.center ? x - g.width / 2 : o.right ? x - g.width : x) + "px";
  wm.wm.style.top = y + "px";
  return { ...wm, width: g.width };
}

// a small footer strip: wordmark left, url right
function footer(f, o = {}) {
  const y = o.y != null ? o.y : f.H - (o.pad || 70) - 34;
  const x = o.x != null ? o.x : (o.pad || 70);
  wordmarkAt(f, o.size || 34, x, y, { color: o.color, spark: o.spark });
  const u = el("div", "lbl abs", f, o.url || "gobrandtoday.com");
  Object.assign(u.style, { right: (o.pad || 70) + "px", top: (y + 6) + "px", fontSize: (o.urlSize || 20) + "px", color: o.urlColor || "var(--violet-d)" });
  return u;
}

function exTag(f, x, y, text = "Example") {
  const p = el("div", "pill ex abs", f, text);
  Object.assign(p.style, { left: x + "px", top: y + "px", fontSize: "16px", padding: "7px 14px" });
  return p;
}

function swipeHint(f, x, y, text = "Swipe", color) {
  const s = el("div", "swipe", f);
  Object.assign(s.style, { right: x + "px", top: y + "px", color: color || "var(--violet-d)" });
  s.appendChild(document.createTextNode(text));
  s.insertAdjacentHTML("beforeend", `<svg width="44" height="20" viewBox="0 0 44 20"><path d="M2 10 H40 M30 2 L40 10 L30 18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  return s;
}

// absolutely placed text: txt(parent, "Hello", "left:70px;top:90px;font:700 64px 'Space Grotesk'")
function txt(parent, text, css, cls = "") {
  const t = el("div", "abs " + cls, parent, text);
  t.style.cssText += css;
  return t;
}
function box(parent, css, cls = "") {
  const b = el("div", "abs " + cls, parent);
  b.style.cssText += css;
  return b;
}
// a full-stop spark at the end of a block of text (inline, sits on the baseline)
function endSpark(parent, color = "var(--violet)", em = 0.42) {
  const s = sparkSVG(color, 2, "spark-svg");
  s.svg.style.cssText = `display:inline-block;width:${em}em;height:${em}em;margin-left:0.06em;vertical-align:0.02em;overflow:visible`;
  parent.appendChild(s.svg);
  return s.svg;
}
// GoBrand Score from the eight weighted parts (weights from the product; values are examples)
const SCORE_PARTS = [["Brandability", 18], ["Memorability", 15], ["Pronunciation", 13], ["Domain", 13], ["Distinctiveness", 12], ["SEO potential", 11], ["Global use", 9], ["Social", 9]];
const scoreOf = (v) => (SCORE_PARTS.reduce((s, p, k) => s + p[1] * v[k], 0) / 100).toFixed(1);
