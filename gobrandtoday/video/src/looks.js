// Logo looks for the example brands: vector constructions with a real idea behind each one.
// Every look: { name (the product's construction), fonts, pal, draw(stage, w, h) } and draws centred.
const SPIN = [];   // elements the composition should rotate slowly (emblem rings)

function svgAt(stage, w, h, vb, markup, scale = 0.78, dy = 0) {
  const [vw, vh] = vb;
  const s = Math.min(w / vw, h / vh) * scale;
  const d = document.createElement("div");
  d.style.cssText = `position:absolute;left:${(w - vw * s) / 2}px;top:${(h - vh * s) / 2 + dy}px;width:${vw * s}px;height:${vh * s}px`;
  d.innerHTML = `<svg viewBox="0 0 ${vw} ${vh}" width="100%" height="100%" style="overflow:visible">${markup}</svg>`;
  stage.appendChild(d);
  return d;
}
function wordUnder(stage, w, h, text, font, size, color, top, ls = "-0.02em") {
  const t = el("div", "", stage, text);
  t.style.cssText = `position:absolute;left:0;width:100%;text-align:center;top:${top}px;font:${font.replace("SIZE", size + "px")};color:${color};letter-spacing:${ls};line-height:1;white-space:nowrap`;
  return t;
}
let _pid = 0;
function ringText(r, text, size, color, font = "Space Mono", weight = 700) {
  const id = "rp" + (++_pid);
  return `<defs><path id="${id}" d="M80 ${80 - r} A${r} ${r} 0 1 1 79.99 ${80 - r}"/></defs>
    <text font-family="${font}" font-weight="${weight}" font-size="${size}" letter-spacing="2.2" fill="${color}"><textPath href="#${id}">${text}</textPath></text>`;
}

// ------------------------------------------------------------------ LOOPA (thrift app for students)
const LOOPA_LOOKS = [
  { name: "Sticker stack", fonts: "Anton · Space Mono", pal: ["#121212", "#3DDC97", "#FF7AB6", "#FFE58A", "#FFF8EE"], draw: (st, w, h) => {
    const tag = (c, rot) => `<g transform="rotate(${rot} 100 70)"><path d="M34 22 H178 Q190 22 190 34 V106 Q190 118 178 118 H34 L8 70 Z" fill="${c}" stroke="#121212" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="70" r="7" fill="#FBFAF8" stroke="#121212" stroke-width="3"/></g>`;
    svgAt(st, w, h, [200, 140], `${tag("#FFE58A", -16)}${tag("#FF7AB6", -6)}${tag("#3DDC97", 4)}
      <g transform="rotate(4 100 70)"><text x="112" y="84" text-anchor="middle" font-family="Anton" font-size="44" fill="#121212" letter-spacing="1">LOOPA</text>
      <text x="112" y="102" text-anchor="middle" font-family="Space Mono" font-weight="700" font-size="9" fill="#121212" letter-spacing="1.5">SWAP · WEAR · REPEAT</text></g>
      <path d="M33 66 C14 40 18 14 46 8" fill="none" stroke="#121212" stroke-width="2.5" stroke-linecap="round"/>`, 0.82);
  } },
  { name: "Lettermark", fonts: "Fraunces · Manrope", pal: ["#121212", "#3DDC97", "#FFF8EE", "#FF7AB6", "#E9F9F1"], draw: (st, w, h) => {
    svgAt(st, w, h, [260, 100], `<rect x="0" y="0" width="100" height="100" rx="26" fill="#3DDC97"/>
      <path d="M34 14 V64 C34 76 40 80 50 80 H62 C78 80 80 60 69 59 C58 58 58 78 74 80 H86" fill="none" stroke="#121212" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="86" cy="80" r="5" fill="#FF7AB6"/>
      <text x="118" y="68" font-family="Fraunces" font-weight="600" font-size="52" fill="#121212">Loopa</text>`, 0.82);
  } },
  { name: "Emblem", fonts: "Space Mono · Fraunces", pal: ["#121212", "#FFF8EE", "#FF7AB6", "#3DDC97", "#FFE58A"], draw: (st, w, h) => {
    const d = svgAt(st, w, h, [160, 160], `<circle cx="80" cy="80" r="76" fill="#121212"/><circle cx="80" cy="80" r="50" fill="#FFF8EE"/>
      <g class="spin">${ringText(62, "SWAP · WEAR · REPEAT · SWAP · WEAR · REPEAT · ", 11.5, "#FFF8EE")}</g>
      <path d="M58 70 A24 24 0 0 1 98 64" fill="none" stroke="#FF7AB6" stroke-width="7" stroke-linecap="round"/><path d="M92 56 L100 66 L88 68 Z" fill="#FF7AB6"/>
      <path d="M102 90 A24 24 0 0 1 62 96" fill="none" stroke="#3DDC97" stroke-width="7" stroke-linecap="round"/><path d="M68 104 L60 94 L72 92 Z" fill="#3DDC97"/>
      <text x="80" y="92" text-anchor="middle" font-family="Fraunces" font-weight="600" font-size="34" fill="#121212">L</text>`, 0.86);
    SPIN.push(d.querySelector(".spin"));
  } },
  { name: "Symbol + wordmark", fonts: "Space Grotesk · Manrope", pal: ["#121212", "#3DDC97", "#FF7AB6", "#FFE58A", "#FFF8EE"], winner: true, draw: (st, w, h) => {
    svgAt(st, w, h, [120, 84], `<circle cx="60" cy="13" r="9" fill="none" stroke="#3DDC97" stroke-width="6"/>
      <path d="M60 22 V30" stroke="#121212" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 30 L12 64 Q5 70 14 72 H106 Q115 70 108 64 Z" fill="none" stroke="#121212" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="96" cy="72" r="5" fill="#FF7AB6"/>`, 0.5, -h * 0.14);
    wordUnder(st, w, h, "loopa", "700 SIZE Space Grotesk", h * 0.2, "#121212", h * 0.64, "-0.04em");
  } },
];

// ------------------------------------------------------------------ MELLO (calm-sleep tea)
const MELLO_LOOKS = [
  { name: "Symbol + wordmark", fonts: "Fraunces · Manrope", pal: ["#1D1B3A", "#B9A7F5", "#F4C26B", "#EEF0FA", "#FFFFFF"], draw: (st, w, h) => {
    svgAt(st, w, h, [120, 112], `<path d="M44 46 C36 36 54 30 46 20" fill="none" stroke="#B9A7F5" stroke-width="4" stroke-linecap="round"/>
      <path d="M70 6 A14 14 0 1 0 82 28 A11 11 0 1 1 70 6Z" fill="#F4C26B"/>
      <path d="M20 54 H92 C92 82 76 96 56 96 C36 96 20 82 20 54Z" fill="#1D1B3A"/>
      <path d="M92 60 C106 60 106 82 88 82" fill="none" stroke="#1D1B3A" stroke-width="6"/>
      <path d="M10 106 H102" stroke="#1D1B3A" stroke-width="5" stroke-linecap="round"/>`, 0.5, -h * 0.14);
    wordUnder(st, w, h, "mello", "600 SIZE Fraunces", h * 0.2, "#1D1B3A", h * 0.64);
  } },
  { name: "Lettermark", fonts: "Fraunces · Manrope", pal: ["#1D1B3A", "#B9A7F5", "#F4C26B", "#EEF0FA", "#FFFFFF"], draw: (st, w, h) => {
    const lash = (x) => `<path d="M${x} 60 l-3 7 M${x + 9} 62 l0 8 M${x + 18} 60 l3 7" stroke="#B9A7F5" stroke-width="3" stroke-linecap="round"/>`;
    svgAt(st, w, h, [100, 100], `<rect width="100" height="100" rx="28" fill="#1D1B3A"/>
      <path d="M22 72 V50 C22 34 47 34 47 50 V56 M47 50 C47 34 72 34 72 50 V72" fill="none" stroke="#B9A7F5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      ${lash(25)}${lash(50)}
      <path d="M80 22 A8 8 0 1 0 86 34 A6 6 0 1 1 80 22Z" fill="#F4C26B"/>`, 0.7);
  } },
  { name: "Emblem", fonts: "Space Mono · Fraunces", pal: ["#B9A7F5", "#1D1B3A", "#F4C26B", "#EEF0FA", "#FFFFFF"], draw: (st, w, h) => {
    const star = (x, y, s) => `<path d="${sparkD(2)}" transform="translate(${x} ${y}) scale(${s})" fill="#1D1B3A"/>`;
    const d = svgAt(st, w, h, [160, 160], `<circle cx="80" cy="80" r="76" fill="#B9A7F5"/><circle cx="80" cy="80" r="50" fill="#1D1B3A"/>
      <g class="spin">${ringText(62, "STEEP · SIP · SLEEP · MELLO · STEEP · SIP · SLEEP · ", 11, "#1D1B3A")}</g>
      <path d="M84 52 A26 26 0 1 0 104 92 A20 20 0 1 1 84 52Z" fill="#F4C26B"/>
      <path d="${sparkD(2)}" transform="translate(64 66) scale(5)" fill="#EEF0FA"/><path d="${sparkD(2)}" transform="translate(58 92) scale(3.4)" fill="#EEF0FA"/>
      <path d="${sparkD(2)}" transform="translate(76 104) scale(2.4)" fill="#EEF0FA"/>`, 0.86);
    SPIN.push(d.querySelector(".spin"));
  } },
  { name: "Editorial serif", fonts: "Fraunces · Space Mono", pal: ["#1D1B3A", "#F4C26B", "#B9A7F5", "#EEF0FA", "#FFFFFF"], draw: (st, w, h) => {
    const row = el("div", "", st);
    const fs = h * 0.3;
    row.style.cssText = `position:absolute;left:0;width:100%;top:${h * 0.26}px;text-align:center;font:600 ${fs}px Fraunces;color:#1D1B3A;line-height:1;white-space:nowrap`;
    row.appendChild(document.createTextNode("mell"));
    const moon = el("span", "", row);
    moon.style.cssText = `display:inline-block;position:relative;width:0.5em;height:0.5em;border-radius:50%;background:#F4C26B;margin-left:0.04em;vertical-align:0`;
    ["z", "z"].forEach((z, k) => {
      const s = el("span", "zz", moon, z);
      s.style.cssText = `position:absolute;left:${0.42 + k * 0.2}em;top:${-0.34 - k * 0.24}em;font:700 ${0.22 - k * 0.04}em "Space Mono";color:#B9A7F5`;
    });
    const rule = el("div", "", st);
    rule.style.cssText = `position:absolute;left:30%;width:40%;top:${h * 0.66}px;height:2px;background:#1D1B3A`;
    wordUnder(st, w, h, "SLEEP TEA", "700 SIZE Space Mono", h * 0.07, "#1D1B3A", h * 0.72, "0.3em");
  } },
];

// ------------------------------------------------------------------ PAWSE (dog café), OJAS (Ayurvedic skincare)
const PAWSE_SYMBOL = `<ellipse cx="9" cy="24" rx="6.4" ry="8.2" fill="#E0703A"/><ellipse cx="22" cy="11" rx="6.4" ry="8.6" fill="#E0703A"/>
  <ellipse cx="38" cy="11" rx="6.4" ry="8.6" fill="#E0703A"/><ellipse cx="51" cy="24" rx="6.4" ry="8.2" fill="#E0703A"/>
  <path d="M30 28 C44 28 54 40 54 50 C54 60 44 62 30 58 C16 62 6 60 6 50 C6 40 16 28 30 28Z" fill="#E0703A"/>
  <rect x="21" y="38" width="6" height="15" rx="2.5" fill="#FFF7EC"/><rect x="33" y="38" width="6" height="15" rx="2.5" fill="#FFF7EC"/>`;
function pawseLogo(parent, size, color = "#3B2A20") {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Fraunces", fontWeight: 600, fontSize: size + "px", color, letterSpacing: "-0.02em" });
  const s = document.createElement("span");
  s.innerHTML = `<svg viewBox="0 0 60 62" style="overflow:visible;display:inline-block;width:0.78em;height:0.8em;vertical-align:-0.08em;margin-right:0.16em">${PAWSE_SYMBOL}</svg>`;
  d.appendChild(s.firstChild);
  d.appendChild(document.createTextNode("pawse"));
  return d;
}
BRANDS.pawse.logo = pawseLogo;
BRANDS.pawse.symbol = (parent, s) => svgEl(`<svg viewBox="0 0 60 62">${PAWSE_SYMBOL}</svg>`, `width:${s}px;height:${s}px`);
// Mello and Loopa use their winning constructions as their logo everywhere else
BRANDS.loopa.symbol = (parent, s) => svgEl(`<svg viewBox="0 0 120 84" style="overflow:visible"><circle cx="60" cy="13" r="9" fill="none" stroke="#3DDC97" stroke-width="6"/><path d="M60 22 V30" stroke="#FFF8EE" stroke-width="6" stroke-linecap="round"/><path d="M60 30 L12 64 Q5 70 14 72 H106 Q115 70 108 64 Z" fill="none" stroke="#FFF8EE" stroke-width="6" stroke-linejoin="round"/><circle cx="96" cy="72" r="5" fill="#FF7AB6"/></svg>`, `width:${s}px;height:${s * 0.7}px`);
BRANDS.loopa.logo = (parent, size, color = "#121212") => {
  const d = el("div", "logo", parent);
  Object.assign(d.style, { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: size + "px", color, letterSpacing: "-0.04em" });
  const s = document.createElement("span");
  const stroke = color;
  s.innerHTML = `<svg viewBox="0 0 120 84" style="overflow:visible;display:inline-block;width:0.95em;height:0.66em;vertical-align:-0.02em;margin-right:0.14em"><circle cx="60" cy="13" r="9" fill="none" stroke="#3DDC97" stroke-width="7"/><path d="M60 22 V30" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/><path d="M60 30 L12 64 Q5 70 14 72 H106 Q115 70 108 64 Z" fill="none" stroke="${stroke}" stroke-width="7" stroke-linejoin="round"/><circle cx="96" cy="72" r="5" fill="#FF7AB6"/></svg>`;
  d.appendChild(s.firstChild);
  d.appendChild(document.createTextNode("loopa"));
  return d;
};
BRANDS.ojas.sunDrop = `<path d="M30 6 C40 20 46 30 46 40 C46 50 39 57 30 57 C21 57 14 50 14 40 C14 30 20 20 30 6Z" fill="#E3A72F"/>
  <circle cx="30" cy="41" r="7" fill="#0F4C4A"/>`;

// ------------------------------------------------------------------ the feature rail: two rows of capabilities, drifting
const FEATURES_A = ["10 naming modes", "12 one-tap refinements", "13 personality picks", "Meaning checks in 7+ languages", "Look-alike brand flags",
  ".com · .in · .ai + 7 more", "Domain prices", "10 social platforms", "Core 5 at a glance", "GoBrand Score · 8 parts"];
const FEATURES_B = ["4 looks per brand", "10 logo constructions", "13 symbol families", "AI-drawn symbols", "Brand strategy & archetype",
  "WCAG-checked colours", "9 mockups", "Launch kit & 30 days of ideas", "Website copy & SEO", "AI Brand Assistant", "PDF · PNG · SVG · JSON · MD", "Version history"];
function featureRail(K, tl, sc, t0, t1, y, light) {
  const box = el("div", "abs", sc);
  const x = K.V ? K.SAFE.x : K.SAFE.x, w = K.V ? K.SAFE.w : K.SAFE.w;
  Object.assign(box.style, { left: x + "px", top: y + "px", width: w + "px", height: "112px", overflow: "hidden",
    maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", webkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" });
  const rows = [FEATURES_A, FEATURES_B].map((list, k) => {
    const r = el("div", "abs", box);
    r.style.cssText = `left:0;top:${k * 58}px;display:flex;gap:12px;white-space:nowrap`;
    list.concat(list).forEach(f => {
      const c = el("div", "pill", r, f);
      c.style.cssText += light ? ";background:#2A2A33;color:#E6E1F7;font-size:17px" : ";background:#FFFFFF;color:#16161A;border:2px solid #DCD8E8;font-size:17px";
    });
    return r;
  });
  tl.fromTo(box, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, t0);
  tl.fromTo(rows[0], { x: 0 }, { x: -700, duration: t1 - t0, ease: "none" }, t0);
  tl.fromTo(rows[1], { x: -700 }, { x: 0, duration: t1 - t0, ease: "none" }, t0);
  return box;
}
