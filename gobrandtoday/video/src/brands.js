// Example brands for the promo shorts. All illustrative and labelled EXAMPLE on screen.
// Each brand: palette, a logo(parent, size, color) drawing, a symbol for icons, and a few looks.
const BRANDS = {
  loopa: { name: "Loopa", idea: "A thrift app for college students", pal: ["#121212", "#3DDC97", "#FF7AB6", "#FFE58A", "#FFF8EE"] },
  pawse: { name: "Pawse", idea: "A dog café with a reading corner", pal: ["#3B2A20", "#E0703A", "#F6D58E", "#A9C29B", "#FFF7EC"] },
  mello: { name: "Mello", idea: "A calm-sleep tea brand", pal: ["#1D1B3A", "#B9A7F5", "#F4C26B", "#EEF0FA", "#FFFFFF"] },
  ojas: { name: "Ojas", idea: "An Ayurvedic skincare brand", pal: ["#0F4C4A", "#E3A72F", "#C8643B", "#F3E9D8", "#FFFDF8"] },
};

function svgEl(markup, css) {
  const d = document.createElement("span");
  d.innerHTML = markup;
  const s = d.firstChild;
  if (css) s.style.cssText = css;
  return s;
}

// Loopa: "loopa" in Syne where the double o is two interlocking rings, mint and pink
BRANDS.loopa.logo = (parent, size, color = "#121212", ringA = "#3DDC97", ringB = "#FF7AB6") => {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Syne", fontWeight: 700, fontSize: size + "px", color, letterSpacing: "-0.02em" });
  d.appendChild(document.createTextNode("l"));
  d.appendChild(svgEl(`<svg viewBox="0 0 110 56" style="overflow:visible"><circle cx="28" cy="28" r="22" fill="none" stroke="${ringA}" stroke-width="11"/><circle cx="74" cy="28" r="22" fill="none" stroke="${ringB}" stroke-width="11"/><path d="M50 18 A22 22 0 0 1 52 34" fill="none" stroke="${ringA}" stroke-width="11"/></svg>`,
    "display:inline-block;width:1.06em;height:0.54em;vertical-align:-0.02em;margin:0 0.02em"));
  d.appendChild(document.createTextNode("pa"));
  return d;
};
BRANDS.loopa.symbol = (parent, s) => svgEl(`<svg viewBox="0 0 110 56" style="overflow:visible"><circle cx="28" cy="28" r="22" fill="none" stroke="#3DDC97" stroke-width="11"/><circle cx="74" cy="28" r="22" fill="none" stroke="#FF7AB6" stroke-width="11"/><path d="M50 18 A22 22 0 0 1 52 34" fill="none" stroke="#3DDC97" stroke-width="11"/></svg>`, `width:${s}px;height:${s * 0.51}px`);

// Pawse: "pawse" in Fraunces with a paw print as its full stop
const PAW = (c) => `<svg viewBox="0 0 40 40" style="overflow:visible"><ellipse cx="20" cy="27" rx="10" ry="8.5" fill="${c}"/><ellipse cx="8" cy="15" rx="4.2" ry="5.4" fill="${c}"/><ellipse cx="16" cy="8" rx="4.2" ry="5.6" fill="${c}"/><ellipse cx="25" cy="8" rx="4.2" ry="5.6" fill="${c}"/><ellipse cx="33" cy="15" rx="4.2" ry="5.4" fill="${c}"/></svg>`;
BRANDS.pawse.logo = (parent, size, color = "#3B2A20", paw = "#E0703A") => {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Fraunces", fontWeight: 600, fontSize: size + "px", color, letterSpacing: "-0.02em" });
  d.appendChild(document.createTextNode("pawse"));
  d.appendChild(svgEl(PAW(paw), "display:inline-block;width:0.36em;height:0.36em;margin-left:0.05em;vertical-align:0"));
  return d;
};
BRANDS.pawse.symbol = (parent, s, c = "#E0703A") => svgEl(PAW(c), `width:${s}px;height:${s}px`);

// Mello: "mello" in Fraunces with a crescent moon hung over the first l
const MOON = (c) => `<svg viewBox="0 0 40 40" style="overflow:visible"><path d="M27 4 A16 16 0 1 0 36 30 A13 13 0 1 1 27 4Z" fill="${c}"/></svg>`;
BRANDS.mello.logo = (parent, size, color = "#1D1B3A", moon = "#F4C26B") => {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Fraunces", fontWeight: 600, fontSize: size + "px", color, letterSpacing: "-0.01em" });
  d.appendChild(svgEl(MOON(moon), "display:inline-block;width:0.42em;height:0.42em;margin-right:0.08em;vertical-align:0.32em"));
  d.appendChild(document.createTextNode("mello"));
  return d;
};
BRANDS.mello.symbol = (parent, s, c = "#F4C26B") => svgEl(MOON(c), `width:${s}px;height:${s}px`);

// Ojas: Latin "ojas" in Rozha One under a shirorekha, the Devanagari headline bar
BRANDS.ojas.logo = (parent, size, color = "#0F4C4A", bar = "#E3A72F") => {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Rozha One", fontSize: size + "px", color, letterSpacing: "0.02em", paddingTop: "0.1em" });
  const inner = el("span", "", d);
  inner.style.cssText = "display:inline-block;position:relative";
  inner.appendChild(document.createTextNode("ojas"));
  const b = el("i", "", inner);
  b.className = "ojas-bar";
  b.style.cssText = `position:absolute;left:-0.06em;right:-0.06em;top:0.29em;height:0.085em;border-radius:0.04em;background:${bar};display:block;transform-origin:0% 50%`;
  return d;
};
BRANDS.ojas.symbol = (parent, s) => svgEl(`<svg viewBox="0 0 40 40"><rect x="4" y="9" width="32" height="4" rx="2" fill="#E3A72F"/><text x="20" y="34" text-anchor="middle" font-family="Tiro Devanagari Hindi" font-size="26" fill="#0F4C4A">ओ</text></svg>`, `width:${s}px;height:${s}px`);

// ---- generic mockups (B = brand)
function mTile(parent, w, h, bg) {
  const t = el("div", "tile", parent);
  Object.assign(t.style, { width: w + "px", height: h + "px", background: bg });
  return t;
}
function mCenterLogo(t, B, size, color, ...rest) {
  const l = B.logo(t, size, color, ...rest);
  Object.assign(l.style, { position: "absolute", left: "0", width: "100%", textAlign: "center" });
  return l;
}
function mockTote2(parent, w, h, B) {
  const t = mTile(parent, w, h, B.pal[3]);
  const s = Math.min(w, h) * 0.8;
  const bag = el("div", "", t);
  bag.style.cssText = `position:absolute;left:${(w - s * 0.8) / 2}px;top:${(h - s) / 2}px;width:${s * 0.8}px;height:${s}px`;
  bag.innerHTML = `<svg viewBox="0 0 80 100" width="100%" height="100%" style="overflow:visible"><path d="M24 30 C24 6 56 6 56 30" fill="none" stroke="${B.pal[0]}" stroke-width="4"/><path d="M6 28 H74 L70 98 H10 Z" fill="${B.pal[0]}"/></svg>`;
  const l = mCenterLogo(bag, B, s * 0.15, B.pal[4]);
  l.style.top = (s * 0.56) + "px";
  return t;
}
function mockApp2(parent, w, h, B) {
  const t = mTile(parent, w, h, B.pal[4]);
  const s = Math.min(w, h) * 0.52;
  const icon = el("div", "", t);
  icon.style.cssText = `position:absolute;left:${(w - s) / 2}px;top:${(h - s) / 2 - h * 0.06}px;width:${s}px;height:${s}px;border-radius:${s * 0.24}px;background:${B.pal[0]};display:flex;align-items:center;justify-content:center;box-shadow:0 ${s * 0.08}px ${s * 0.2}px rgba(0,0,0,0.22)`;
  icon.appendChild(B.symbol(icon, s * 0.56));
  const lab = el("div", "", t, B.name.toLowerCase());
  lab.style.cssText = `position:absolute;left:0;width:100%;text-align:center;top:${(h + s) / 2 - h * 0.02}px;font:600 ${Math.max(18, s * 0.15)}px Manrope;color:${B.pal[0]}`;
  return t;
}
function mockPost2(parent, w, h, B, line) {
  const t = mTile(parent, w, h, B.pal[0]);
  const q = el("div", "", t, line);
  q.style.cssText = `position:absolute;left:${w * 0.1}px;top:${h * 0.14}px;width:${w * 0.8}px;font:700 ${Math.min(w, h) * 0.12}px "Space Grotesk";letter-spacing:-0.02em;line-height:1.02;color:${B.pal[4]}`;
  const l = B.logo(t, Math.min(w, h) * 0.1, B.pal[4]);
  Object.assign(l.style, { position: "absolute", left: (w * 0.1) + "px", bottom: (h * 0.1) + "px" });
  return t;
}
function mockCup2(parent, w, h, B) {
  const t = mTile(parent, w, h, B.pal[2]);
  const s = Math.min(w, h) * 0.82;
  const cup = el("div", "", t);
  cup.style.cssText = `position:absolute;left:${(w - s * 0.62) / 2}px;top:${(h - s) / 2}px;width:${s * 0.62}px;height:${s}px`;
  cup.innerHTML = `<svg viewBox="0 0 62 100" width="100%" height="100%" style="overflow:visible"><rect x="2" y="6" width="58" height="10" rx="4" fill="${B.pal[0]}"/><path d="M6 16 H56 L50 98 H12 Z" fill="${B.pal[4]}"/><path d="M8.5 44 H53.5 L51.6 72 H10.4 Z" fill="${B.pal[1]}"/></svg>`;
  const l = mCenterLogo(cup, B, s * 0.11, B.pal[4]);
  l.style.top = (s * 0.5) + "px";
  return t;
}
function mockSign2(parent, w, h, B) {
  const t = mTile(parent, w, h, B.pal[3]);
  const s = Math.min(w * 0.8, h * 0.9);
  const sign = el("div", "", t);
  sign.style.cssText = `position:absolute;left:${(w - s) / 2}px;top:${(h - s * 0.62) / 2}px;width:${s}px;height:${s * 0.62}px`;
  sign.innerHTML = `<svg viewBox="0 0 100 62" width="100%" height="100%" style="overflow:visible"><path d="M0 4 H86" stroke="${B.pal[0]}" stroke-width="3"/><path d="M30 4 V18 M70 4 V18" stroke="${B.pal[0]}" stroke-width="2"/><rect x="10" y="18" width="80" height="40" rx="20" fill="${B.pal[0]}"/></svg>`;
  const l = mCenterLogo(sign, B, s * 0.13, B.pal[4]);
  l.style.top = (s * 0.62 * 0.42) + "px";
  return t;
}
function mockBottle(parent, w, h, B) {
  const t = mTile(parent, w, h, B.pal[3]);
  const s = Math.min(w, h) * 0.86;
  const b = el("div", "", t);
  b.style.cssText = `position:absolute;left:${(w - s * 0.46) / 2}px;top:${(h - s) / 2}px;width:${s * 0.46}px;height:${s}px`;
  b.innerHTML = `<svg viewBox="0 0 46 100" width="100%" height="100%" style="overflow:visible"><rect x="16" y="2" width="14" height="10" rx="2" fill="${B.pal[0]}"/><rect x="12" y="11" width="22" height="9" rx="3" fill="${B.pal[1]}"/><rect x="3" y="20" width="40" height="78" rx="10" fill="${B.pal[4]}" stroke="${B.pal[0]}" stroke-width="2"/></svg>`;
  const l = mCenterLogo(b, B, s * 0.12);
  l.style.top = (s * 0.5) + "px";
  return t;
}
function mockPalette2(parent, w, h, B) {
  const t = mTile(parent, w, h, "#FFFFFF");
  const pad = Math.min(w, h) * 0.08, sw = (w - pad * 2) / 5;
  B.pal.forEach((c, k) => {
    const s = el("div", "", t);
    s.style.cssText = `position:absolute;left:${pad + k * sw}px;top:${pad}px;width:${sw - 6}px;height:${h - pad * 2 - h * 0.2}px;border-radius:${sw * 0.12}px;background:${c};border:2px solid rgba(0,0,0,0.08)`;
    const hx = el("div", "mono", t, c.slice(1));
    hx.style.cssText = `position:absolute;left:${pad + k * sw}px;width:${sw - 6}px;text-align:center;bottom:${pad * 0.8}px;font-size:${Math.max(14, sw * 0.15)}px;letter-spacing:0;color:#16161A`;
  });
  return t;
}
