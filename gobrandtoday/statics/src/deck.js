
// The example brands as a collectible set. All illustrative: every piece that shows them says so.
// v = the eight GoBrand Score parts (SCORE_PARTS order), example values.
const DECK = [
  { key: "wickd", name: "Wickd", idea: "A cosy candle brand for Gen Z", types: ["Bold", "Youthful"], mode: "Short & Punchy",
    logoIdea: "The dot on the i is a flame.", watch: "Some people will type “wicked”. Own it in your bio.",
    dark: WK.plum, ink: WK.cream, acc: WK.ember, art: WK.cream, pal: [WK.plum, WK.ember, WK.lilac, WK.peach, WK.cream],
    v: [9.4, 9.6, 8.6, 8.0, 9.4, 8.0, 9.2, 9.0],
    logo: (st, w, h) => { const l = wickdLogo(st, h * 0.36); centerAbs(l, w, h, 0.06); } },
  { key: "loopa", name: "Loopa", idea: "A thrift app for college students", types: ["Playful", "Youthful"], mode: "Invented",
    logoIdea: "A hanger that's also a loop.", watch: "Close to the word “loop”. A clear tagline keeps it yours.",
    dark: "#121212", ink: "#FFF8EE", acc: "#3DDC97", art: "#FFE58A", pal: BRANDS.loopa.pal,
    v: [9.2, 9.4, 9.6, 7.8, 8.6, 7.4, 9.4, 8.6],
    logo: (st, w, h) => LOOPA_LOOKS[3].draw(st, w, h) },
  { key: "pawse", name: "Pawse", idea: "A dog café with a reading corner", types: ["Human", "Playful"], mode: "Human",
    logoIdea: "A paw print with a pause button in it.", watch: "Out loud it's “pause”. That's the joke, so keep the paw.",
    dark: "#3B2A20", ink: "#FFF7EC", acc: "#E0703A", art: "#F6D58E", pal: BRANDS.pawse.pal,
    v: [9.4, 9.4, 8.8, 8.2, 9.0, 8.4, 8.6, 8.8],
    logo: (st, w, h) => { const l = pawseLogo(st, h * 0.27); centerAbs(l, w, h); } },
  { key: "ojas", name: "Ojas", idea: "An Ayurvedic skincare brand", types: ["Traditional", "Premium"], mode: "India-Inspired",
    logoIdea: "Shirorekha: the Devanagari headline bar.", watch: "Outside India, put the meaning (vitality) in your bio.",
    dark: "#0F4C4A", ink: "#FFFDF8", acc: "#E3A72F", art: "#F3E9D8", pal: BRANDS.ojas.pal,
    v: [9.4, 9.2, 9.0, 7.6, 8.8, 7.6, 8.4, 8.6],
    logo: (st, w, h) => { const l = BRANDS.ojas.logo(st, h * 0.4); centerAbs(l, w, h, -0.02); } },
  { key: "mello", name: "Mello", idea: "A calm-sleep tea brand", types: ["Minimal", "Human"], mode: "Global",
    logoIdea: "The o is a moon, drifting off to sleep.", watch: "Sounds like “mellow”. Spell it once in every bio.",
    dark: "#1D1B3A", ink: "#EEF0FA", acc: "#F4C26B", art: "#EEF0FA", pal: BRANDS.mello.pal,
    v: [8.6, 8.8, 9.2, 7.0, 7.4, 7.6, 9.0, 8.2],
    logo: (st, w, h) => MELLO_LOOKS[3].draw(st, w, h) },
];
DECK.forEach(d => { d.score = scoreOf(d.v); });
const DK = Object.fromEntries(DECK.map(d => [d.key, d]));

function centerAbs(l, w, h, dy = 0) {
  l.style.position = "absolute";
  l.style.left = (w - l.offsetWidth) / 2 + "px";
  l.style.top = (h - l.offsetHeight) / 2 + h * dy + "px";
  return l;
}

// a trading card, 800 x 1110, top-left at (x, y), optionally rotated
const CARD_W = 800, CARD_H = 1110;
function tradingCard(parent, D, x, y, o = {}) {
  const c = box(parent, `left:${x}px;top:${y}px;width:${CARD_W}px;height:${CARD_H}px;border-radius:46px;transform-origin:50% 50%;
    background:linear-gradient(135deg,#8F75FF 0%,#19C3B4 34%,#ECE7FF 52%,#FF7AB6 70%,#6D4AFF 100%);
    box-shadow:0 30px 60px rgba(22,22,26,0.28),0 6px 14px rgba(22,22,26,0.18);transform:rotate(${o.rot || 0}deg) scale(${o.scale || 1})`);
  const k = box(c, `left:12px;top:12px;right:12px;bottom:12px;border-radius:36px;background:${D.dark};color:${D.ink};overflow:hidden`);
  const P = 34, IW = CARD_W - 24 - P * 2;
  // header: name + score
  txt(k, D.name, `left:${P}px;top:30px;font:700 60px 'Space Grotesk';letter-spacing:-0.035em;line-height:1`);
  const sc = txt(k, D.score, `right:${P}px;top:26px;font:700 62px 'Space Mono';letter-spacing:-0.02em;line-height:1;color:${D.acc}`);
  txt(k, "GoBrand Score", `right:${P}px;top:94px;font:700 14px 'Space Mono';letter-spacing:0.12em;text-transform:uppercase;opacity:0.72`);
  const types = box(k, `left:${P}px;top:104px;display:flex;gap:8px`);
  D.types.forEach(t => { const p = el("div", "", types, t); p.style.cssText = `font:700 14px 'Space Mono';letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;border:2px solid ${D.ink};opacity:0.85`; });
  // art window
  const art = box(k, `left:${P}px;top:152px;width:${IW}px;height:400px;border-radius:24px;background:${D.art};overflow:hidden`);
  D.logo(art, IW, 400);
  const ex = txt(art, "Example", `left:16px;top:16px;font:700 14px 'Space Mono';letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;background:rgba(22,22,26,0.78);color:#FFFFFF`);
  // born from
  txt(k, "Born from one sentence", `left:${P}px;top:578px;font:700 15px 'Space Mono';letter-spacing:0.12em;text-transform:uppercase;color:${D.acc}`);
  txt(k, "“" + D.idea + ".”", `left:${P}px;top:604px;width:${IW}px;font:700 36px 'Space Grotesk';letter-spacing:-0.025em;line-height:1.1`);
  txt(k, "Logo idea: " + D.logoIdea, `left:${P}px;top:654px;width:${IW}px;font:500 22px Manrope;opacity:0.82`);
  // stats: the eight parts, two columns
  const colW = (IW - 40) / 2;
  SCORE_PARTS.forEach((p, i) => {
    const cx = P + (i % 2) * (colW + 40), cy = 714 + Math.floor(i / 2) * 50;
    txt(k, p[0], `left:${cx}px;top:${cy}px;font:700 15px 'Space Mono';letter-spacing:0.06em;text-transform:uppercase;opacity:0.82`);
    txt(k, D.v[i].toFixed(1), `left:${cx}px;width:${colW}px;text-align:right;top:${cy - 2}px;font:700 18px 'Space Mono'`);
    box(k, `left:${cx}px;top:${cy + 26}px;width:${colW}px;height:8px;border-radius:4px;background:rgba(255,255,255,0.14)`);
    box(k, `left:${cx}px;top:${cy + 26}px;width:${colW * D.v[i] / 10}px;height:8px;border-radius:4px;background:${D.acc}`);
  });
  // watch-out
  const w = box(k, `left:${P}px;top:922px;width:${IW - 40}px;padding:14px 20px;border-radius:18px;background:rgba(255,255,255,0.08);font:500 21px/1.3 Manrope`);
  const wl = el("span", "", w, "Honest watch-out  ");
  wl.style.cssText = `font:700 15px 'Space Mono';letter-spacing:0.1em;text-transform:uppercase;color:${D.acc}`;
  w.appendChild(document.createTextNode(D.watch));
  // footer: palette + mode + wordmark
  const pal = box(k, `left:${P}px;top:1030px;display:flex;gap:6px`);
  D.pal.forEach(col => { const s = el("i", "", pal); s.style.cssText = `display:block;width:26px;height:26px;border-radius:8px;background:${col};border:2px solid rgba(255,255,255,0.3)`; });
  txt(k, "Mode: " + D.mode, `left:${P + 182}px;top:1034px;font:700 15px 'Space Mono';letter-spacing:0.1em;text-transform:uppercase;opacity:0.8`);
  const wm = buildWordmark(k, 24, { color: D.ink, spark: "var(--violet-s)", m: 2 });
  const g = wm.place();
  wm.wm.style.left = (CARD_W - 24 - P - g.width) + "px";
  wm.wm.style.top = "1030px";
  return c;
}

// the back of a card: the spark pattern and the wordmark
function cardBack(parent, x, y, o = {}) {
  const c = box(parent, `left:${x}px;top:${y}px;width:${CARD_W}px;height:${CARD_H}px;border-radius:46px;transform-origin:50% 50%;
    background:linear-gradient(135deg,#8F75FF 0%,#19C3B4 34%,#ECE7FF 52%,#FF7AB6 70%,#6D4AFF 100%);
    box-shadow:0 30px 60px rgba(0,0,0,0.35);transform:rotate(${o.rot || 0}deg) scale(${o.scale || 1})`);
  const k = box(c, `left:12px;top:12px;right:12px;bottom:12px;border-radius:36px;background:#6D4AFF;overflow:hidden`);
  k.W = CARD_W - 24; k.H = CARD_H - 24;
  dotField(k, { gap: 64, seed: 9, color: "rgba(255,255,255,0.22)", spark: "rgba(255,255,255,0.5)", sparkShare: 0.1, sparkSize: 12 });
  const s = sparkSVG("#FFFFFF", 2, "spark-svg");
  s.svg.style.cssText = `position:absolute;left:${k.W / 2 - 140}px;top:${k.H / 2 - 140}px;width:280px;height:280px;overflow:visible`;
  k.appendChild(s.svg);
  const t = sparkSVG("#19C3B4", 2, "spark-svg");
  t.svg.style.cssText = `position:absolute;left:${k.W / 2 + 120}px;top:${k.H / 2 - 210}px;width:110px;height:110px;overflow:visible`;
  k.appendChild(t.svg);
  return c;
}
