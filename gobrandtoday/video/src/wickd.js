// Wickd: the example brand in the announcement ("A cosy candle brand for Gen Z").
// Illustrative only; every scene that shows it carries an EXAMPLE label.
// Its logo is a lowercase Syne wordmark whose dotless i wears a flame for a tittle.
const WK = { plum: "#241332", ember: "#FF5A36", lilac: "#CDB8FF", peach: "#FFB38A", cream: "#FFF6EC" };
const FLAME_D = "M0 -1 C0.34 -0.58 0.64 -0.3 0.62 0.16 C0.6 0.62 0.32 0.96 0 0.96 C-0.32 0.96 -0.6 0.62 -0.62 0.16 C-0.64 -0.3 -0.34 -0.58 0 -1Z";
const FLAMES = [];  // every flame drawn, so the composition can make them flicker

function flameSVG(outer = WK.ember, inner = WK.peach) {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "-1 -1 2 2");
  svg.innerHTML = `<path d="${FLAME_D}" fill="${outer}"/><path d="${FLAME_D}" fill="${inner}" transform="translate(0 0.38) scale(0.48)"/>`;
  svg.style.overflow = "visible";
  FLAMES.push(svg);
  return svg;
}

function wickdLogo(parent, size, color = WK.plum, outer = WK.ember, inner = WK.peach) {
  const d = el("div", "wk-logo", parent);
  d.style.fontSize = size + "px";
  d.style.color = color;
  d.appendChild(document.createTextNode("w"));
  const i = el("span", "wk-i", d, "ı");
  const f = flameSVG(outer, inner);
  f.setAttribute("class", "wk-flame");
  i.appendChild(f);
  d.appendChild(document.createTextNode("ckd"));
  return d;
}

function tile(parent, w, h, bg, cls = "") {
  const t = el("div", "tile " + cls, parent);
  Object.assign(t.style, { width: w + "px", height: h + "px", background: bg });
  return t;
}

function centerIn(t, child) {
  t.style.display = "flex"; t.style.alignItems = "center"; t.style.justifyContent = "center";
  t.appendChild(child);
  return child;
}

// ---- mockups (each fills a w x h tile)
function mockLogo(parent, w, h) {
  const t = tile(parent, w, h, WK.cream);
  const l = wickdLogo(t, Math.min(w * 0.2, h * 0.34));
  centerIn(t, l);
  return t;
}

function mockJar(parent, w, h) {
  const t = tile(parent, w, h, WK.lilac);
  const s = Math.min(w, h) * 0.8;
  const jar = el("div", "", t);
  jar.style.cssText = `position:absolute;left:${(w - s * 0.62) / 2}px;top:${(h - s) / 2 + s * 0.08}px;width:${s * 0.62}px;height:${s * 0.86}px`;
  jar.innerHTML = `<svg viewBox="0 0 62 86" width="100%" height="100%" style="overflow:visible">
    <rect x="4" y="12" width="54" height="72" rx="12" fill="${WK.cream}" stroke="${WK.plum}" stroke-width="2"/>
    <rect x="9" y="4" width="44" height="12" rx="4" fill="${WK.plum}"/>
    <rect x="4" y="36" width="54" height="28" fill="${WK.plum}"/>
    <rect x="10" y="70" width="42" height="6" rx="3" fill="${WK.peach}" opacity="0.7"/></svg>`;
  const l = wickdLogo(jar, s * 0.15, WK.cream);
  Object.assign(l.style, { position: "absolute", left: "0", width: "100%", textAlign: "center", top: (s * 0.86 * 0.47) + "px" });
  return t;
}

function mockTote(parent, w, h) {
  const t = tile(parent, w, h, WK.peach);
  const s = Math.min(w, h) * 0.78;
  const bag = el("div", "", t);
  bag.style.cssText = `position:absolute;left:${(w - s * 0.8) / 2}px;top:${(h - s) / 2}px;width:${s * 0.8}px;height:${s}px`;
  bag.innerHTML = `<svg viewBox="0 0 80 100" width="100%" height="100%" style="overflow:visible">
    <path d="M24 30 C24 6 56 6 56 30" fill="none" stroke="${WK.plum}" stroke-width="4"/>
    <path d="M6 28 H74 L70 98 H10 Z" fill="${WK.ember}"/></svg>`;
  const l = wickdLogo(bag, s * 0.17, WK.cream, WK.cream, WK.ember);
  Object.assign(l.style, { position: "absolute", left: "0", width: "100%", textAlign: "center", top: (s * 0.56) + "px" });
  return t;
}

function mockApp(parent, w, h) {
  const t = tile(parent, w, h, WK.cream);
  const s = Math.min(w, h) * 0.5;
  const icon = el("div", "", t);
  icon.style.cssText = `position:absolute;left:${(w - s) / 2}px;top:${(h - s) / 2 - h * 0.06}px;width:${s}px;height:${s}px;border-radius:${s * 0.24}px;background:${WK.plum};box-shadow:0 ${s * 0.08}px ${s * 0.2}px rgba(36,19,50,0.28)`;
  const f = flameSVG(WK.ember, WK.peach);
  f.style.cssText = `position:absolute;left:${s * 0.3}px;top:${s * 0.2}px;width:${s * 0.4}px;height:${s * 0.6}px;overflow:visible`;
  icon.appendChild(f);
  const lab = el("div", "", t, "wickd");
  lab.style.cssText = `position:absolute;left:0;width:100%;text-align:center;top:${(h + s) / 2 - h * 0.02}px;font:600 ${Math.max(18, s * 0.16)}px Manrope;color:${WK.plum}`;
  return t;
}

function mockSign(parent, w, h) {
  const t = tile(parent, w, h, "#EDE6DA");
  const s = Math.min(w * 0.8, h * 0.9);
  const sign = el("div", "", t);
  sign.style.cssText = `position:absolute;left:${(w - s) / 2}px;top:${(h - s * 0.62) / 2}px;width:${s}px;height:${s * 0.62}px`;
  sign.innerHTML = `<svg viewBox="0 0 100 62" width="100%" height="100%" style="overflow:visible">
    <path d="M0 4 H86" stroke="${WK.plum}" stroke-width="3"/><path d="M30 4 V18 M70 4 V18" stroke="${WK.plum}" stroke-width="2"/>
    <rect x="14" y="18" width="72" height="40" rx="20" fill="${WK.plum}"/></svg>`;
  const l = wickdLogo(sign, s * 0.14, WK.cream);
  Object.assign(l.style, { position: "absolute", left: "0", width: "100%", textAlign: "center", top: (s * 0.62 * 0.43) + "px" });
  return t;
}

function mockPost(parent, w, h) {
  const t = tile(parent, w, h, WK.plum);
  const q = el("div", "", t, "Burn bright. Stay cosy.");
  q.style.cssText = `position:absolute;left:${w * 0.1}px;top:${h * 0.16}px;width:${w * 0.8}px;font:700 ${Math.min(w, h) * 0.13}px Syne;line-height:1.02;color:${WK.cream}`;
  const l = wickdLogo(t, Math.min(w, h) * 0.1, WK.lilac, WK.ember, WK.peach);
  Object.assign(l.style, { position: "absolute", left: (w * 0.1) + "px", bottom: (h * 0.1) + "px" });
  return t;
}

function mockCard(parent, w, h) {
  const t = tile(parent, w, h, WK.ember);
  const c = el("div", "", t);
  const cw = Math.min(w * 0.74, h * 1.1), ch = cw * 0.58;
  c.style.cssText = `position:absolute;left:${(w - cw) / 2}px;top:${(h - ch) / 2}px;width:${cw}px;height:${ch}px;border-radius:${cw * 0.04}px;background:${WK.cream};box-shadow:0 ${cw * 0.04}px ${cw * 0.1}px rgba(36,19,50,0.25)`;
  const l = wickdLogo(c, cw * 0.14);
  Object.assign(l.style, { position: "absolute", left: (cw * 0.09) + "px", top: (ch * 0.18) + "px" });
  const ln = el("div", "", c, "Founder");
  ln.style.cssText = `position:absolute;left:${cw * 0.09}px;bottom:${ch * 0.14}px;font:500 ${cw * 0.06}px Manrope;color:${WK.plum}`;
  return t;
}

function mockPalette(parent, w, h, withHex = true) {
  const t = tile(parent, w, h, "#FFFFFF");
  const cols = [["Plum", WK.plum], ["Ember", WK.ember], ["Peach", WK.peach], ["Lilac", WK.lilac], ["Cream", WK.cream]];
  const pad = Math.min(w, h) * 0.08, sw = (w - pad * 2) / 5;
  cols.forEach(([n, c], k) => {
    const s = el("div", "", t);
    s.style.cssText = `position:absolute;left:${pad + k * sw}px;top:${pad}px;width:${sw - 6}px;height:${h - pad * 2 - (withHex ? h * 0.2 : 0)}px;border-radius:${sw * 0.12}px;background:${c};border:2px solid rgba(36,19,50,0.12)`;
    if (withHex) {
      const hx = el("div", "mono", t, c.slice(1));
      hx.style.cssText = `position:absolute;left:${pad + k * sw}px;width:${sw - 6}px;text-align:center;bottom:${pad * 0.8}px;font-size:${Math.max(15, sw * 0.16)}px;letter-spacing:0;color:${WK.plum}`;
    }
  });
  return t;
}

function mockType(parent, w, h) {
  const t = tile(parent, w, h, WK.cream);
  const a = el("div", "", t, "Aa");
  a.style.cssText = `position:absolute;left:${w * 0.1}px;top:${h * 0.08}px;font:700 ${h * 0.5}px Syne;color:${WK.plum};line-height:1`;
  const n = el("div", "mono", t, "Syne · Manrope");
  n.style.cssText = `position:absolute;left:${w * 0.1}px;bottom:${h * 0.12}px;font-size:${Math.max(16, h * 0.07)}px;color:${WK.plum}`;
  return t;
}

// ---- the four looks
function lookSticker(stage, w, h) {
  const tag = el("div", "", stage, "WICKD");
  tag.style.cssText = `position:absolute;left:50%;top:50%;margin:${-h * 0.17}px 0 0 ${-w * 0.32}px;width:${w * 0.64}px;height:${h * 0.34}px;display:flex;align-items:center;justify-content:center;background:${WK.ember};color:#fff;font:${h * 0.24}px Anton;letter-spacing:0.02em;border-radius:${h * 0.04}px;box-shadow:${h * 0.03}px ${h * 0.03}px 0 ${WK.plum};rotate:-5deg`;
}
function lookLetter(stage, w, h) {
  const sq = el("div", "", stage, "W");
  const s = h * 0.3;
  sq.style.cssText = `position:absolute;left:${w * 0.12}px;top:${(h - s) / 2}px;width:${s}px;height:${s}px;border-radius:${s * 0.22}px;background:${WK.plum};color:${WK.cream};font:600 ${s * 0.62}px Fraunces;display:flex;align-items:center;justify-content:center`;
  const n = el("div", "", stage, "Wickd");
  n.style.cssText = `position:absolute;left:${w * 0.12 + s * 1.2}px;top:${(h - s) / 2}px;height:${s}px;display:flex;align-items:center;font:600 ${s * 0.6}px Fraunces;color:${WK.plum}`;
}
function lookSignet(stage, w, h) {
  const s = h * 0.34;
  const c = el("div", "", stage);
  c.style.cssText = `position:absolute;left:${w * 0.12}px;top:${(h - s) / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${WK.peach};border:${s * 0.06}px solid ${WK.plum}`;
  const f = flameSVG(WK.plum, WK.ember);
  f.style.cssText = `position:absolute;left:${s * 0.3}px;top:${s * 0.18}px;width:${s * 0.34}px;height:${s * 0.5}px;overflow:visible`;
  c.appendChild(f);
  const n = el("div", "", stage, "WICKD");
  n.style.cssText = `position:absolute;left:${w * 0.12 + s * 1.22}px;top:${(h - s) / 2}px;height:${s}px;display:flex;align-items:center;font:${s * 0.4}px "Rozha One";letter-spacing:0.18em;color:${WK.plum}`;
}
function lookFlame(stage, w, h) {
  const l = wickdLogo(stage, h * 0.3);
  l.style.position = "absolute";
  l.style.left = "0"; l.style.width = "100%"; l.style.textAlign = "center";
  l.style.top = (h * 0.32) + "px";
  return l;
}
const LOOKS = [
  { name: "Sticker stack", fonts: "Anton · Manrope", draw: lookSticker, pal: [WK.plum, WK.ember, "#FFFFFF", WK.peach, WK.cream] },
  { name: "Lettermark", fonts: "Fraunces · DM Sans", draw: lookLetter, pal: [WK.plum, "#6E3B7A", WK.cream, "#E9D8C4", "#FFFFFF"] },
  { name: "Signet badge", fonts: "Rozha One · Mukta", draw: lookSignet, pal: [WK.plum, WK.peach, WK.ember, "#F6E7D6", "#FFFFFF"] },
  { name: "Symbol + wordmark", fonts: "Syne · Manrope", draw: lookFlame, pal: [WK.plum, WK.ember, WK.peach, WK.lilac, WK.cream] },
];
