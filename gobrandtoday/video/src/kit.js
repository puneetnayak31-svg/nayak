// Shared building blocks for the promo shorts: layout boxes (Instagram-safe for 9:16), headline
// and typing helpers, odometer scores, wipes, the cursor and the branded end card.
function makeKit(tl, W, H) {
  const V = H > W;
  const root = document.getElementById("root");
  const K = { V, W, H, root };
  // text stays inside the Reels safe area (x 90-930, y 270-1480) in 9:16; title-safe in 16:9
  K.SAFE = V ? { x: 90, y: 270, w: 840, h: 1210 } : { x: 120, y: 90, w: 1680, h: 900 };
  K.CA = V ? { x: 102, y: 300, w: 816, h: 1160 } : { x: 120, y: 110, w: 1680, h: 860 };

  K.toDark = (at) => tl.to("#bgdark", { opacity: 1, duration: 0.001 }, at);
  K.toLight = (at) => tl.to("#bgdark", { opacity: 0, duration: 0.001 }, at);
  K.fieldTo = (at, op, dur = 0.4) => tl.to("#field", { opacity: op, duration: dur }, at);

  K.wipe = (color, at, dur, from) => {
    const w = el("div", "", document.getElementById("wipes"));
    const Rr = Math.hypot(W, H);
    const [fx, fy] = from || [W / 2, H / 2];
    w.style.cssText = `position:absolute;left:${fx - Rr}px;top:${fy - Rr}px;width:${2 * Rr}px;height:${2 * Rr}px;border-radius:50%;background:${color}`;
    appear(tl, w, at, at + dur + 0.05);
    tl.fromTo(w, { scale: 0 }, { scale: 1, duration: dur, ease: "power3.inOut" }, at);
  };
  K.glow = (at, x, y, size, op, until) => {
    const g = el("div", "", document.getElementById("glows"));
    g.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(closest-side, rgba(109,74,255,0.5), rgba(109,74,255,0))`;
    appear(tl, g, at, until);
    tl.fromTo(g, { opacity: 0, scale: 0.5 }, { opacity: op, scale: 1, duration: 0.6, ease: "sine.out" }, at);
    return g;
  };
  K.odo = (parent, text) => {
    const o = el("span", "odo", parent);
    const cols = [];
    for (const ch of text) {
      if (/[0-9]/.test(ch)) {
        const c = el("span", "col", o), s = el("span", "strip", c);
        for (let d = 0; d <= 9; d++) el("span", "", s, String(d));
        cols.push({ s, d: +ch });
      } else el("span", "", o, ch);
    }
    return { o, cols };
  };
  K.roll = (od, at, dur = 0.7) => od.cols.forEach((c, k) =>
    tl.fromTo(c.s, { yPercent: 0 }, { yPercent: -c.d * 10, duration: dur + k * 0.12, ease: "power3.out" }, at));
  K.words = (parent, text, cls) => text.split(" ").map(w => {
    const s = el("span", cls || "", parent, w);
    s.style.display = "inline-block"; s.style.marginRight = "0.24em";
    return s;
  });
  // eyebrow + headline block; returns the parts so they can be animated
  K.head = (sc, eyebrow, title, o = {}) => {
    const box = el("div", "abs", sc);
    const x = o.x != null ? o.x : K.CA.x, y = o.y != null ? o.y : K.CA.y, w = o.w || K.CA.w;
    Object.assign(box.style, { left: x + "px", top: y + "px", width: w + "px", textAlign: o.align || "left" });
    const e = el("div", "eyebrow mono", box, eyebrow);
    if (o.light) e.style.color = "var(--violet-m)";
    const h = el("div", "hl" + (o.light ? " light" : ""), box);
    h.style.fontSize = (o.size || (V ? 76 : 84)) + "px";
    h.style.marginTop = "16px";
    const ws = K.words(h, title);
    return { box, e, h, ws };
  };
  K.headIn = (hd, at) => {
    tl.fromTo(hd.e, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power3.out" }, at);
    tl.fromTo(hd.ws, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.06 }, at + 0.05);
  };
  K.out = (targets, at) => {
    if (V) tl.to(targets, { y: -40, opacity: 0, duration: 0.28, ease: "power2.in", stagger: 0.02 }, at);
    else tl.to(targets, { x: -80, opacity: 0, duration: 0.28, ease: "power2.in", stagger: 0.02 }, at);
  };
  K.exPill = (parent, x, y) => {
    const p = el("div", "pill ex abs", parent, "Example");
    Object.assign(p.style, { left: x + "px", top: y + "px" });
    return p;
  };
  // typed text with an optional violet full stop; wraps between words only
  K.typed = (sc, text, o, t0, step = 0.0625) => {
    const box = el("div", (o.cls || "hl") + " abs", sc);
    Object.assign(box.style, { left: o.x + "px", top: o.y + "px", width: o.w + "px", fontSize: o.size + "px", textAlign: o.align || "left" });
    const tw = typeWords(box, text);
    let stop = null;
    if (o.stop) {
      stop = el("span", "", tw.last);
      stop.style.cssText = "display:inline-block;width:0.2em;height:0.2em;border-radius:50%;background:var(--violet);margin-left:0.06em";
    }
    const slot = o.slot ? o.slot(tw.last) : null;      // e.g. a spark that replaces the full stop
    const caret = o.caret === false ? null : el("span", "caret", box);
    const pos = stop ? posIn(stop, root) : null;
    const slotPos = slot ? posIn(slot, root) : null;
    tw.chars.forEach((c, i) => tl.fromTo(c, { display: "none" }, { display: "inline", duration: 0.001 }, t0 + i * step));
    const end = t0 + tw.chars.length * step;
    if (stop) {
      tl.fromTo(stop, { display: "none" }, { display: "inline-block", duration: 0.001 }, end + 0.125);
      tl.fromTo(stop, { scale: 2.4 }, { scale: 1, duration: 0.35, ease: "elastic.out(1,0.4)" }, end + 0.125);
    }
    if (caret) [[0, 0], [t0 - 0.2, 1], [end + (o.caretHold || 0.4), 0]].forEach(([t, v]) => tl.set(caret, { opacity: v }, Math.max(0, t)));
    return { box, chars: tw.chars, stop, pos, slot, slotPos, end };
  };
  K.cursor = (sc, x, y, at, light) => {
    const c = el("div", "abs", sc);
    c.innerHTML = `<svg width="56" height="56" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 13.8 L19 13.8 Z" fill="${light ? "#FAFAF7" : "#16161A"}" stroke="${light ? "#16161A" : "#FFFFFF"}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    Object.assign(c.style, { left: x + "px", top: y + "px", zIndex: 40 });
    tl.fromTo(c, { x: 240, y: 220, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, at - 0.5);
    tl.to(c, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1 }, at - 0.02);
    return c;
  };
  K.flicker = (start, end, seed) => {
    const r = rng(seed);
    FLAMES.forEach((f) => {
      let t = start + r() * 0.3;
      while (t < end - 0.3) {
        tl.to(f, { scaleY: 0.9 + r() * 0.25, scaleX: 0.95 + r() * 0.1, skewX: (r() - 0.5) * 10, duration: 0.18 + r() * 0.12, ease: "sine.inOut" }, t);
        t += 0.22 + r() * 0.15;
      }
    });
  };

  // ---- the branded end card: dark wipe, the wordmark's dot becomes the spark on the sting,
  // then the call to action and the address. Sting cues: dot t0+0.5, diamond +1.0, spark +1.5, twin +2.0.
  K.endCard = (sc, t0, o = {}) => {
    K.wipe("var(--graphite)", t0 - 0.05, 0.4);
    K.toDark(t0 + 0.36);
    K.fieldTo(t0 + 0.4, 0.28, 0.6);
    const size = V ? 112 : 140;
    const wm = buildWordmark(sc, size, { color: "var(--paper)", spark: "var(--violet-s)", m: 0 });
    const g = wm.place();
    const wy = V ? 600 : 300;
    const wx = (W - g.width) / 2;
    Object.assign(wm.wm.style, { left: wx + "px", top: wy + "px" });
    const sx = wx + g.cx, sy = wy + g.cy;
    const eb = el("div", "mono abs", sc, o.eyebrow || "AI brand studio");
    Object.assign(eb.style, { left: "0px", width: W + "px", textAlign: "center", top: (wy - 70) + "px", fontSize: "24px", color: "var(--violet-m)", letterSpacing: "0.12em" });
    tl.fromTo(wm.chars, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.02 }, t0 + 0.2);
    tl.fromTo(eb, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 0.3);
    const mk = wm.mark.svg;
    wm.mark.path.setAttribute("d", sparkD(0));
    appear(tl, mk, t0 + 0.32);
    appear(tl, wm.twin.svg, t0 + 2.0);
    tl.fromTo(mk, { y: -260, scaleX: 0.34, scaleY: 0.6 }, { y: 0, scaleX: 0.42, scaleY: 0.42, duration: 0.18, ease: "power3.in" }, t0 + 0.32);
    tl.to(mk, { keyframes: [{ scaleX: 0.6, scaleY: 0.28, duration: 0.06 }, { scaleX: 0.42, scaleY: 0.42, duration: 0.3, ease: "elastic.out(1,0.4)" }] }, t0 + 0.5);
    morph(tl, wm.mark.path, 0, 1, t0 + 0.9, 0.3, "back.out(2)");
    tl.to(mk, { scale: 0.62, duration: 0.3, ease: "back.out(2)" }, t0 + 0.9);
    morph(tl, wm.mark.path, 1, 2, t0 + 1.44, 0.16, "power3.in");
    tl.to(mk, { keyframes: [{ scale: 1.5, rotation: 90, duration: 0.16 }, { scale: 1, rotation: 90, duration: 0.45, ease: "elastic.out(1,0.45)" }] }, t0 + 1.46);
    burst(tl, el("div", "layer", sc), sx, sy, t0 + 1.5, { rays: 12, len: 120, r0: 30, r1: 200, ringScale: 6, color: "var(--violet-s)" });
    K.glow(t0 + 0.9, sx, sy, 900, 0.45, t0 + 6);
    tl.fromTo(wm.twin.svg, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(4)" }, t0 + 2.0);
    // call to action
    const cta = el("div", "hl light abs", sc);
    cta.style.cssText += `;left:${K.SAFE.x}px;width:${K.SAFE.w}px;text-align:center;top:${wy + size + (V ? 70 : 60)}px;font-size:${V ? 58 : 66}px`;
    const cw = K.words(cta, o.cta || "Your idea deserves a brand.");
    tl.fromTo(cw, { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.06 }, t0 + 2.05);
    const ub = el("div", "urlbar", sc);
    const uw = V ? 800 : 860, uh = V ? 104 : 112;
    const ctaH = cta.offsetHeight;
    const uy = wy + size + (V ? 70 : 60) + ctaH + (V ? 50 : 44);
    Object.assign(ub.style, { left: (W - uw) / 2 + "px", top: uy + "px", width: uw + "px", height: uh + "px" });
    ub.innerHTML = `<svg width="28" height="34" viewBox="0 0 30 36"><rect x="3" y="15" width="24" height="19" rx="4" fill="#16161A"/><path d="M8 15 V10 a7 7 0 0 1 14 0 V15" fill="none" stroke="#16161A" stroke-width="3.5"/></svg><span class="txt">gobrandtoday.com</span>`;
    const go = el("div", "btn", ub);
    go.style.cssText += `;margin-left:auto;height:${uh - 28}px;padding:0 24px;background:var(--violet);color:#fff;font-size:${V ? 22 : 24}px`;
    go.textContent = o.button || "Start free";
    tl.fromTo(ub, { y: 40, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, t0 + 2.3);
    tl.to(go, { keyframes: [{ scale: 1.08, duration: 0.15 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }] }, t0 + 3.0);
    let lib = null;
    if (V && o.lib !== false) {
      lib = el("div", "pill vi abs", sc, o.lib || "Link in bio");
      lib.style.top = (uy + uh + 40) + "px";
      const lw = lib.offsetWidth;
      lib.style.left = (W / 2 - lw / 2) + "px";
      tl.fromTo(lib, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(3)" }, t0 + 2.6);
    }
    return { wm, cta, ub, lib, sx, sy };
  };
  return K;
}
