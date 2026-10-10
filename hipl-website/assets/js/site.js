/* HIPL site behaviour. No dependencies. Every widget is progressive:
   the page reads completely without this script. */
(function () {
  "use strict";
  var D = window.HIPL_DATA || { entries: [], concepts: [], series: [] };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rootEl = $("[data-root]");
  var ROOT = rootEl ? rootEl.getAttribute("data-root") : "";
  var C = { midnight: "#14123A", m2: "#2A2650", saffron: "#FF8A1F", marigold: "#FFC93C", lotus: "#FF6FA3", chalk: "#F7F3EC", line: "#3B3670" };
  var ACCENT = { "hindu-universe": C.saffron, "stories-that-stay": C.marigold, "ancient-ideas-modern-life": C.lotus };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("hipl:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("hipl:" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  // Cookieless analytics hook (spec 8.6). Wire to Plausible/Umami in production.
  function track(name, props) { try { if (window.plausible) window.plausible(name, { props: props || {} }); } catch (e) { /* no analytics */ } }

  /* ---------- Menu ---------- */
  var menuBtn = $(".menu-btn"), nav = $("#site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      menuBtn.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", open);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) menuBtn.click(); });
  }

  /* ---------- Seeded generative art (flat, warm, no figures) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sizeCanvas(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    cv.width = w * dpr; cv.height = h * dpr;
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g: g, w: w, h: h };
  }
  function bars(g, cx, cy, r0, r1, n, rand, cols, width) {
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2, len = r0 + (r1 - r0) * (0.35 + rand() * 0.65);
      g.save(); g.translate(cx, cy); g.rotate(a);
      g.fillStyle = cols[Math.floor(rand() * cols.length)];
      roundRect(g, -width / 2, -len, width, len - r0 * 0.6, width / 2); g.fill(); g.restore();
    }
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function circle(g, x, y, r, col) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); }

  function drawCover(cv, n, accent) {
    var s = sizeCanvas(cv), g = s.g, w = s.w, h = s.h, rand = rng(n * 7919);
    g.fillStyle = accent; g.fillRect(0, 0, w, h);
    var ink = [C.midnight, C.chalk, accent === C.saffron ? C.marigold : C.saffron];
    var mode = n % 5, m = Math.min(w, h);
    if (mode === 0) { // rising sun from a corner
      bars(g, w * 0.85, h * 1.05, m * 0.22, m * 0.95, 30, rand, ink, Math.max(5, m * 0.03));
      circle(g, w * 0.85, h * 1.05, m * 0.2, C.midnight);
    } else if (mode === 1) { // bindu field
      var step = m / 7;
      for (var y = step / 2; y < h; y += step) for (var x = step / 2; x < w; x += step) {
        var r = rand(); circle(g, x, y, step * (r > 0.86 ? 0.36 : 0.1), r > 0.86 ? ink[Math.floor(rand() * 3)] : "rgba(20,18,58,.35)");
      }
    } else if (mode === 2) { // horizon bands and a setting circle
      circle(g, w * (0.3 + rand() * 0.4), h * 0.62, m * 0.3, C.midnight);
      for (var i = 0; i < 4; i++) { g.fillStyle = i % 2 ? C.chalk : ink[2]; g.fillRect(0, h * (0.62 + i * 0.1), w, h * 0.1); }
    } else if (mode === 3) { // many voices: overlapping circles
      for (var k = 0; k < 5; k++) { g.globalAlpha = 0.9; circle(g, w * (0.2 + rand() * 0.6), h * (0.2 + rand() * 0.6), m * (0.12 + rand() * 0.2), ink[k % 3]); }
      g.globalAlpha = 1;
    } else { // sabha fragment, off-centre
      bars(g, w * 0.3, h * 0.45, m * 0.14, m * 0.6, 24, rand, ink, Math.max(5, m * 0.035));
      circle(g, w * 0.3, h * 0.45, m * 0.12, C.chalk);
    }
  }

  function drawScene(cv, k) {
    var s = sizeCanvas(cv), g = s.g, w = s.w, h = s.h, m = Math.min(w, h), rand = rng(k * 131);
    g.fillStyle = C.m2; g.fillRect(0, 0, w, h);
    // ground
    g.fillStyle = C.line; g.fillRect(0, h * 0.72, w, h * 0.28);
    if (k === 1) { // the gift: a row of worn, uneven offerings
      for (var i = 0; i < 6; i++) { var bw = w * 0.1, bh = h * (0.12 + rand() * 0.1); g.fillStyle = i === 5 ? C.marigold : "rgba(247,243,236," + (0.35 + rand() * 0.3) + ")"; roundRect(g, w * 0.1 + i * w * 0.13, h * 0.72 - bh, bw, bh, bw / 2); g.fill(); }
      circle(g, w * 0.82, h * 0.25, m * 0.08, C.saffron);
    } else if (k === 2) { // the question, asked again and again: echoing arcs
      for (var j = 0; j < 6; j++) { g.beginPath(); g.arc(w * 0.3, h * 0.5, m * (0.1 + j * 0.08), -0.9, 0.9); g.strokeStyle = j === 0 ? C.marigold : "rgba(255,201,60," + (0.7 - j * 0.1) + ")"; g.lineWidth = m * 0.02; g.stroke(); }
      circle(g, w * 0.3, h * 0.5, m * 0.06, C.chalk);
      circle(g, w * 0.78, h * 0.5, m * 0.12, C.lotus);
    } else if (k === 3) { // three nights: three moons over a door
      for (var n = 0; n < 3; n++) { circle(g, w * (0.25 + n * 0.25), h * 0.26, m * 0.07, C.chalk); circle(g, w * (0.25 + n * 0.25) + m * (0.02 + n * 0.02), h * 0.24, m * 0.065, C.m2); }
      g.fillStyle = C.midnight; roundRect(g, w * 0.42, h * 0.42, w * 0.16, h * 0.3, 0); g.fill();
      g.fillStyle = C.saffron; g.fillRect(w * 0.42, h * 0.42, w * 0.16, h * 0.02);
      circle(g, w * 0.3, h * 0.66, m * 0.04, C.marigold);
    } else if (k === 4) { // three boons: three lights
      var cols = [C.marigold, C.saffron, C.lotus];
      for (var b = 0; b < 3; b++) { var cx = w * (0.22 + b * 0.28), cy = h * 0.46; bars(g, cx, cy, m * 0.06, m * 0.2, 16, rand, [cols[b]], Math.max(3, m * 0.015)); circle(g, cx, cy, m * 0.05, C.chalk); }
    } else if (k === 5) { // the temptation: a shower of gold, one still point
      for (var c = 0; c < 70; c++) circle(g, rand() * w, rand() * h * 0.72, m * (0.008 + rand() * 0.02), rand() > 0.5 ? C.marigold : C.saffron);
      circle(g, w * 0.5, h * 0.6, m * 0.07, C.chalk);
    } else { // the answer: a chariot wheel and the reins of the mind
      var wx = w * 0.5, wy = h * 0.52, R = m * 0.26;
      g.lineWidth = m * 0.025; g.strokeStyle = C.marigold; g.beginPath(); g.arc(wx, wy, R, 0, Math.PI * 2); g.stroke();
      for (var sp = 0; sp < 12; sp++) { var a = sp / 12 * Math.PI * 2; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R); g.lineWidth = m * 0.012; g.strokeStyle = sp % 3 ? "rgba(247,243,236,.6)" : C.saffron; g.stroke(); }
      circle(g, wx, wy, m * 0.05, C.chalk);
    }
  }

  function drawFace(cv, k, accent) {
    var s = sizeCanvas(cv), g = s.g, w = s.w, h = s.h, m = Math.min(w, h), rand = rng(k * 977);
    g.fillStyle = accent; g.fillRect(0, 0, w, h);
    bars(g, w / 2, h * 0.55, m * 0.2, m * 0.48, 20, rand, [C.midnight, C.chalk, k === 3 ? C.lotus : C.saffron], Math.max(4, m * 0.03));
    circle(g, w / 2, h * 0.55, m * 0.17, C.midnight);
  }

  var artQueue = [];
  function paintAll() {
    $$("canvas[data-art]").forEach(function (cv) {
      var n = +cv.getAttribute("data-art"), e = D.entries.filter(function (x) { return x.n === n; })[0];
      var acc = cv.getAttribute("data-accent") || (e ? ACCENT[e.series] : C.saffron);
      artQueue.push(function () { drawCover(cv, n, acc); });
    });
    $$("canvas[data-scene]").forEach(function (cv) { artQueue.push(function () { drawScene(cv, +cv.getAttribute("data-scene")); }); });
    $$("canvas[data-face]").forEach(function (cv) { artQueue.push(function () { drawFace(cv, +cv.getAttribute("data-face"), cv.getAttribute("data-accent") || C.marigold); }); });
    artQueue.forEach(function (f) { f(); });
  }
  paintAll();
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { artQueue.forEach(function (f) { f(); }); drawMaps(); }, 150); });

  /* ---------- Live Sabha: bars lean toward the pointer ---------- */
  $$(".sabha.live.interactive").forEach(function (svg) {
    var rects = $$("rect", svg);
    function onMove(ev) {
      var r = svg.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = ev.clientX - cx, dy = ev.clientY - cy, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r.width * 0.9) { leave(); return; }
      svg.classList.add("engaged");
      var ang = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      rects.forEach(function (rc) {
        var a = +rc.getAttribute("data-i") * 15, d = Math.abs(((ang - a) + 540) % 360 - 180);
        var k = d < 50 ? 1 + (1 - d / 50) * 0.32 : 0.9;
        rc.style.transform = "scaleY(" + k.toFixed(3) + ")";
      });
    }
    function leave() { svg.classList.remove("engaged"); rects.forEach(function (rc) { rc.style.transform = ""; }); }
    if (!reduce) { window.addEventListener("pointermove", onMove, { passive: true }); }
  });

  /* ---------- Count-up numbers ---------- */
  $$("[data-count]").forEach(function (el) {
    var to = +el.getAttribute("data-count"), pad = +(el.getAttribute("data-pad") || 3);
    var fmt = function (v) { return String(v).padStart(pad, "0"); };
    el.firstChild.nodeValue = fmt(to);
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.disconnect();
        var t0 = performance.now();
        (function step(t) { var p = Math.min(1, (t - t0) / 1100); el.firstChild.nodeValue = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(t0);
      });
    });
    io.observe(el);
  });

  /* ---------- Forms ---------- */
  var MSG = {
    dispatch: "You're on the list. Check your inbox to confirm your subscription.",
    question: "Thank you. Your question has been received. The team reviews every question before it appears on the list; hard and uncomfortable questions stay.",
    rsvp: "Your seat request is in. We'll email the venue details and a calendar invite.",
    "dialogue-question": "Your question for the speakers has been received. The moderator picks from all questions on the night.",
    circle: "You're signed up for this month's Reading Circle. We'll email the reading guide and the session link or address.",
    pitch: "Pitch received. The editor replies to every pitch within 10 working days. A confirmation email is on its way.",
    guest: "Thank you for the suggestion. The interviews team reads every one.",
    comment: "Thank you. Your comment has been received and will appear once a moderator has reviewed it.",
    correction: "Thank you. An editor will check this against the source and log any correction on the corrections page."
  };
  $$(".js-form").forEach(function (form) {
    var kind = form.getAttribute("data-kind");
    var under = $("[name=age]", form), guardian = $(".guardian", form);
    if (under && guardian) {
      var sync = function () { var u = under.value === "under-18"; guardian.hidden = !u; $$("input", guardian).forEach(function (i) { i.required = u; }); };
      under.addEventListener("change", sync); sync();
    }
    $$("textarea[data-words]", form).forEach(function (ta) {
      var lim = ta.getAttribute("data-words").split("-"), out = ta.parentNode.querySelector(".counter-hint");
      var upd = function () { var n = (ta.value.trim().match(/\S+/g) || []).length; if (out) out.textContent = n + " words (" + lim[0] + "–" + lim[1] + ")"; };
      ta.addEventListener("input", upd); upd();
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var old = $(".form-msg", form); if (old) old.remove();
      $$(".err-text", form).forEach(function (e) { e.remove(); });
      if ($("[name=website]", form) && $("[name=website]", form).value) return; // honeypot
      var bad = null;
      $$("input, select, textarea", form).forEach(function (f) {
        if (f.closest("[hidden]") || f.type === "hidden" || f.name === "website") return;
        var msg = "";
        if (f.required && f.type === "checkbox" && !f.checked) msg = "Please tick this box to continue.";
        else if (f.required && f.type === "radio") { if (!$("[name='" + f.name + "']:checked", form)) msg = "Please choose one."; }
        else if (f.required && !f.value.trim()) msg = "This field is required.";
        else if (f.type === "email" && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) msg = "Enter an email address like name@example.com.";
        else if (f.type === "file" && f.files && f.files[0]) {
          var file = f.files[0];
          if (file.size > 5 * 1024 * 1024) msg = "That file is larger than 5 MB. Please upload a smaller file.";
          else if (!/\.(docx|pdf)$/i.test(file.name)) msg = "Upload a .docx or .pdf file.";
        } else if (f.hasAttribute("data-words") && f.value.trim()) {
          var n = (f.value.trim().match(/\S+/g) || []).length, lim = f.getAttribute("data-words").split("-");
          if (n < +lim[0] || n > +lim[1]) msg = "Please write between " + lim[0] + " and " + lim[1] + " words (now " + n + ").";
        }
        if (msg && !(f.type === "radio" && f !== $("[name='" + f.name + "']", form))) {
          var p = document.createElement("p"); p.className = "err-text"; p.textContent = msg;
          var host = f.closest(".field, .check, fieldset") || f.parentNode; host.appendChild(p);
          if (!bad) bad = f;
        }
      });
      if (bad) { bad.focus(); return; }
      // Production: POST to /api/forms/<kind> (Turnstile token + consent flags), then confirmation email via Resend.
      var ok = document.createElement("div"); ok.className = "form-msg"; ok.setAttribute("role", "status");
      ok.textContent = MSG[kind] || "Thank you. We've received this.";
      form.appendChild(ok);
      track("Form submitted", { kind: kind });
      form.querySelectorAll("button[type=submit]").forEach(function (b) { b.disabled = true; b.textContent = "Sent"; });
    });
  });

  /* ---------- Generic filters (cards with data-* attributes) ---------- */
  $$("[data-filter-scope]").forEach(function (scope) {
    var items = $$(scope.getAttribute("data-filter-scope"), document);
    var controls = $$("[data-filter]", scope);
    var count = $(".result-count", scope), empty = $(".filter-empty");
    var keys = controls.map(function (c) { return c.getAttribute("data-filter"); });
    // Read shareable state from the URL (spec 8.1).
    try {
      var qs = new URLSearchParams(location.search);
      controls.forEach(function (c) {
        var k = c.getAttribute("data-filter"), v = qs.get(k);
        if (v == null) return;
        if (c.tagName === "DIV") $$("button", c).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-value") === v); });
        else c.value = v;
      });
    } catch (e) { /* no query string available */ }
    function val(c) {
      if (c.tagName === "DIV") { var on = $("button[aria-pressed=true]", c); return on ? on.getAttribute("data-value") : ""; }
      return c.value.trim().toLowerCase();
    }
    function apply(push) {
      var state = {}; controls.forEach(function (c) { state[c.getAttribute("data-filter")] = val(c); });
      var shown = 0;
      items.forEach(function (it) {
        var ok = keys.every(function (k) {
          var v = state[k]; if (!v) return true;
          if (k === "q") return (it.getAttribute("data-title") || it.textContent).toLowerCase().indexOf(v) > -1;
          var a = (it.getAttribute("data-" + k) || "").toLowerCase().split("|");
          return a.indexOf(v.toLowerCase()) > -1;
        });
        it.hidden = !ok; if (ok) shown++;
      });
      if (count) count.textContent = shown + (shown === 1 ? " result" : " results");
      if (empty) empty.hidden = shown !== 0;
      if (push) {
        try {
          var p = new URLSearchParams(); Object.keys(state).forEach(function (k) { if (state[k]) p.set(k, state[k]); });
          history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
        } catch (e) { /* history unavailable in this frame */ }
        track("Filter used", state);
      }
    }
    controls.forEach(function (c) {
      if (c.tagName === "DIV") {
        c.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          var was = b.getAttribute("aria-pressed") === "true";
          $$("button", c).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", String(!was || b.getAttribute("data-value") === ""));
          apply(true);
        });
      } else {
        c.addEventListener(c.tagName === "INPUT" ? "input" : "change", function () { apply(true); });
      }
    });
    var reset = $("[data-filter-reset]", scope) || $("[data-filter-reset]");
    if (reset) reset.addEventListener("click", function () {
      controls.forEach(function (c) { if (c.tagName === "DIV") $$("button", c).forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === 0 && b.getAttribute("data-value") === "")); }); else c.value = ""; });
      apply(true);
    });
    apply(false);
  });

  /* ---------- Upvotes ---------- */
  var votes = store.get("upvotes", {});
  $$(".upvote").forEach(function (b) {
    var id = b.getAttribute("data-id"), base = +b.getAttribute("data-base"), n = $(".n", b);
    function render() { var on = !!votes[id]; b.setAttribute("aria-pressed", on); n.textContent = base + (on ? 1 : 0); b.setAttribute("aria-label", "Upvote this question, " + (base + (on ? 1 : 0)) + " votes"); }
    b.addEventListener("click", function () { votes[id] = !votes[id]; store.set("upvotes", votes); render(); track("Upvote", { id: id }); });
    render();
  });

  /* ---------- Claim labels ---------- */
  var CLAIMS = {
    text: ["The text says", "Taken directly from a named text and edition."],
    tradition: ["Tradition holds", "The belief or practice of a named tradition or community."],
    historians: ["Historians find", "Evidence-based historical scholarship."],
    debate: ["Scholars debate", "A live disagreement among experts. Both sides are shown."],
    asks: ["HIPL asks", "HIPL's own reflection or question to you, the reader."]
  };
  function closeTips() { $$(".tip").forEach(function (t) { t.remove(); }); }
  function initClaims(scope) { $$(".claim", scope).forEach(initClaim); }
  function initClaim(c) {
    var k = c.getAttribute("data-kind"), def = CLAIMS[k]; if (!def) return;
    if (!c.textContent.trim()) c.textContent = def[0];
    c.setAttribute("aria-label", def[0] + ": " + def[1]);
    if (c.tagName !== "BUTTON") { c.setAttribute("tabindex", "0"); c.setAttribute("role", "note"); }
    function show() { closeTips(); var t = document.createElement("span"); t.className = "tip"; t.setAttribute("role", "tooltip"); t.textContent = def[1]; c.appendChild(t); }
    c.addEventListener("mouseenter", show); c.addEventListener("focus", show);
    c.addEventListener("mouseleave", closeTips); c.addEventListener("blur", closeTips);
    c.addEventListener("click", function (e) { e.preventDefault(); if ($(".tip", c)) closeTips(); else show(); });
  }
  initClaims(document);

  /* ---------- Concept pop-ups ---------- */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(btn) {
    var key = btn.getAttribute("data-concept"), c = D.concepts.filter(function (x) { return x.term === key; })[0];
    if (!c) return;
    closePop();
    pop = document.createElement("div"); pop.className = "popover"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", c.iast);
    pop.innerHTML = "<b>" + c.iast + ' <span lang="sa">' + c.deva + "</span></b><p></p>" +
      (c.page ? '<a href="' + ROOT + "explorations/concepts/" + c.term + '.html">Read the full concept page →</a>' : '<span class="tiny" style="color:var(--on-dark-muted)">Full concept page coming soon</span>');
    $("p", pop).textContent = c.short;
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), pw = pop.offsetWidth;
    var left = Math.min(Math.max(16, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - pw - 16);
    pop.style.left = left + "px"; pop.style.top = (r.bottom + window.scrollY + 10) + "px";
    var link = $("a", pop); (link || pop).setAttribute("tabindex", link ? "0" : "-1");
    track("Concept pop-up", { term: key });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".concept, .concept-btn");
    if (b) { e.preventDefault(); if (pop && pop.getAttribute("aria-label") === (D.concepts.filter(function (x) { return x.term === b.getAttribute("data-concept"); })[0] || {}).iast) closePop(); else openPop(b); return; }
    if (pop && !e.target.closest(".popover")) closePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closePop(); closeTips(); closeModal(); } });

  /* ---------- Tabs (meaning layers, scenarios, boons) ---------- */
  $$("[role=tablist]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      var rings = list.parentNode.querySelector(".layers-rings");
      if (rings) $$("circle", rings).forEach(function (c, i) { c.classList.toggle("on", i <= tabs.indexOf(t)); });
      track("Tab", { id: t.id });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % tabs.length;
        if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
        if (k === "Home") j = 0; if (k === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    select(tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0]);
  });

  /* ---------- What would you do? / polls (no score, anonymous results) ---------- */
  function initChoice(box, isPoll) {
    var id = box.getAttribute("data-id"), btns = $$(isPoll ? ".poll-opts button" : ".options button", box);
    var base = btns.map(function (b) { return +(b.getAttribute("data-base") || 0); });
    var saved = store.get("choice:" + id, null);
    function reveal(i, fresh) {
      var tot = base.reduce(function (a, b) { return a + b; }, 0) + 1;
      btns.forEach(function (b, j) {
        var v = base[j] + (j === i ? 1 : 0), pct = Math.round(v / tot * 100);
        b.setAttribute("aria-pressed", j === i);
        var fill = $(isPoll ? ".fill" : ".share-bar i", b), p = $(".pct", b);
        if (fill) fill.style.width = pct + "%";
        if (p) p.textContent = pct + "%";
        if (isPoll) b.setAttribute("aria-disabled", "true");
      });
      box.classList.add(isPoll ? "voted" : "revealed");
      $$(".persp", box).forEach(function (p) { p.hidden = false; p.classList.toggle("picked", +p.getAttribute("data-opt") === i); });
      var after = $(".after-choice", box); if (after) after.hidden = false;
      if (fresh) {
        var picked = $(".persp.picked", box); if (picked && !isPoll) picked.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        track(isPoll ? "Poll vote" : "Dilemma choice", { id: id, option: i });
      }
    }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (isPoll && box.classList.contains("voted")) return;
        store.set("choice:" + id, i); reveal(i, true);
      });
    });
    if (saved !== null && saved < btns.length) reveal(saved, false);
  }
  $$(".dilemma[data-id]").forEach(function (b) { initChoice(b, false); });
  $$(".poll[data-id]").forEach(function (b) { initChoice(b, true); });

  /* ---------- Character cards ---------- */
  $$(".char").forEach(function (c) {
    c.addEventListener("click", function () { var o = c.getAttribute("aria-expanded") !== "true"; c.setAttribute("aria-expanded", o); $(".more", c).hidden = !o; });
  });

  /* ---------- Knowledge cards ---------- */
  $$(".kcards").forEach(function (k) {
    var track_ = $(".kcards-track", k), prev = $("[data-k=prev]", k), next = $("[data-k=next]", k), pos = $(".k-pos", k);
    var cards = $$(".kcard", k);
    function step(d) { var w = cards[0].getBoundingClientRect().width + 14; track_.scrollBy({ left: d * w, behavior: reduce ? "auto" : "smooth" }); }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    track_.addEventListener("scroll", function () {
      var w = cards[0].getBoundingClientRect().width + 14, i = Math.round(track_.scrollLeft / w);
      if (pos) pos.textContent = "Card " + Math.min(cards.length, i + 1) + " of " + cards.length;
    }, { passive: true });
    var save = $("[data-k=save]", k);
    if (save) save.addEventListener("click", function () {
      var w = cards[0].getBoundingClientRect().width + 14, i = Math.min(cards.length - 1, Math.round(track_.scrollLeft / w));
      shareCard(cards[i]);
    });
  });
  function wrapText(g, text, x, y, maxW, lh) {
    var words = text.split(" "), line = "", lines = [];
    words.forEach(function (w) { var t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { g.fillText(l, x, y + i * lh); });
    return y + lines.length * lh;
  }
  function shareCard(card) {
    // 1080 x 1350 image for Instagram (spec 3.3).
    var cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    var g = cv.getContext("2d"), bg = getComputedStyle(card).backgroundColor, fg = getComputedStyle(card).color;
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = fg;
    g.font = "600 30px Unbounded, sans-serif"; g.fillText(($(".k-n span", card) || {}).textContent || "HIPL Explorations", 80, 120);
    g.font = "800 92px Unbounded, sans-serif";
    var y = wrapText(g, $("h4", card).textContent, 80, 520, 920, 100);
    g.font = "400 40px 'Instrument Sans', sans-serif";
    wrapText(g, $("p", card).textContent, 80, y + 40, 920, 58);
    var rand = rng(5); bars(g, 980, 1250, 26, 70, 24, rand, [C.saffron, C.marigold, C.lotus], 9); circle(g, 980, 1250, 22, C.chalk);
    g.fillStyle = fg; g.font = "800 44px Unbounded, sans-serif"; g.fillText("HIPL", 80, 1265);
    openModal('<h3 style="font-family:var(--f-display)">Card image ready</h3><img alt="Knowledge card image" src="' + cv.toDataURL("image/png") + '"><p class="small">Long-press or right-click the image to save it, then share it on Instagram (1080 × 1350).</p><button class="btn dark" type="button" data-close>Close</button>');
    track("Share card image", {});
  }
  var modal = null, lastFocus = null;
  function openModal(inner) {
    closeModal(); lastFocus = document.activeElement;
    modal = document.createElement("div"); modal.className = "modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<div class="modal-box">' + inner + "</div>";
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.hasAttribute("data-close")) closeModal(); });
    document.body.appendChild(modal); var b = $("[data-close]", modal); if (b) b.focus();
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; if (lastFocus) lastFocus.focus(); } }

  /* ---------- Reading progress, chapter menu ---------- */
  var bar = $(".read-progress span"), toc = $(".toc"), tocBtn = $(".toc-sheet-btn");
  if (bar) {
    var main = $(".entry-main") || document.body;
    var links = toc ? $$("a", toc) : [];
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var tick = function () {
      var r = main.getBoundingClientRect(), total = r.height - window.innerHeight * 0.6;
      bar.style.width = Math.max(0, Math.min(100, (-r.top + window.innerHeight * 0.2) / Math.max(1, total) * 100)) + "%";
      var cur = null; targets.forEach(function (t) { if (t.getBoundingClientRect().top < window.innerHeight * 0.35) cur = t; });
      links.forEach(function (a) { a.classList.toggle("active", cur && a.getAttribute("href") === "#" + cur.id); });
    };
    window.addEventListener("scroll", tick, { passive: true }); tick();
    var reached = {};
    window.addEventListener("scroll", function () { targets.forEach(function (t) { if (!reached[t.id] && t.getBoundingClientRect().top < window.innerHeight * 0.5) { reached[t.id] = 1; track("Chapter reached", { id: t.id }); } }); }, { passive: true });
  }
  if (toc && tocBtn) {
    tocBtn.addEventListener("click", function () { var o = toc.classList.toggle("open"); tocBtn.setAttribute("aria-expanded", o); });
    $$("a", toc).forEach(function (a) { a.addEventListener("click", function () { toc.classList.remove("open"); tocBtn.setAttribute("aria-expanded", "false"); }); });
  }

  /* ---------- Share buttons (WhatsApp first) ---------- */
  $$(".share").forEach(function (s) {
    var url = location.href.split("#")[0], title = document.title;
    var map = {
      whatsapp: "https://wa.me/?text=" + encodeURIComponent(title + " " + url),
      x: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url)
    };
    $$("a[data-share]", s).forEach(function (a) { a.href = map[a.getAttribute("data-share")]; a.target = "_blank"; a.rel = "noopener"; a.addEventListener("click", function () { track("Share", { to: a.getAttribute("data-share") }); }); });
    var copy = $("[data-share=copy]", s);
    if (copy) copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "Link copied"; setTimeout(function () { copy.textContent = "Copy link"; }, 2000); };
      try { navigator.clipboard.writeText(url).then(done, function () { copy.textContent = url; }); } catch (e) { copy.textContent = url; }
    });
  });

  /* ---------- Video: loads YouTube only on click ---------- */
  $$(".video").forEach(function (v) {
    v.addEventListener("click", function () {
      var id = v.getAttribute("data-youtube");
      if (id && !/^\[/.test(id)) {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
        f.title = v.getAttribute("aria-label") || "Video"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
        f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
        v.appendChild(f);
      } else if (!$(".video-note", v)) {
        var n = document.createElement("div"); n.className = "video-note";
        n.textContent = "Sample episode: the video appears here once an editor adds its YouTube ID in the CMS.";
        v.appendChild(n);
      }
    });
  });

  /* ---------- Map: dot-matrix South and Southeast Asia ---------- */
  var LAND = [
    [[68.2,23.7],[70,20.8],[72.8,19],[73.5,15.5],[74.8,12.8],[76.3,9.5],[77.5,8.1],[78.2,8.9],[79.9,10.3],[80.3,13],[80.2,15.6],[82.3,16.6],[84.8,19.2],[86.9,20.8],[88.2,21.8],[89.5,22],[91.8,22.4],[92.6,21.2],[93.5,25],[95,28],[97,28],[94,29.4],[91,27.9],[88.5,27.5],[85,28.5],[81,30.3],[79,32.5],[77.5,35.4],[74,35],[72,32.5],[70,28],[69.5,26]],
    [[92.6,21.2],[94,16],[97.6,16.5],[98.5,13],[99,10],[100.4,7],[101,4],[103.5,1.4],[104.2,1.6],[103.4,4],[103,5.5],[102,6.4],[100.9,12.6],[102.5,12],[103,10.6],[105,8.6],[106.8,10.4],[109.2,12],[109,15],[106.5,17.5],[106,20],[108,21.6],[104,22.5],[100,21.5],[98,24],[97,28],[95,28],[93.5,25]],
    [[105.2,-6.8],[106.5,-6],[108.5,-6.4],[111,-6.4],[112.7,-6.9],[114.5,-7.8],[111,-8.2],[108,-7.8],[105.5,-6.8]],
    [[79.8,6.2],[79.9,8.5],[80.2,9.8],[81.4,8.5],[81.9,7],[81,6],[80,6]],
    [[95.3,5.6],[98,4],[100.5,1.5],[104,-1.8],[106,-3],[105.8,-5.8],[104.5,-5.9],[102,-4],[100.3,-0.8],[98.5,1.8],[95.5,4.5]],
    [[109.5,1.5],[111,2.6],[113,3.2],[115.5,5.2],[117.5,6.8],[119,5],[118,0.8],[116.5,-2.2],[116,-3.8],[114.5,-3.5],[111,-3],[110,-1.5],[109,0.3]]
  ];
  var BOX = { lon0: 66, lon1: 122, lat0: -10, lat1: 36 };
  function inPoly(x, y, p) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c; } return c; }
  function drawMaps() {
    $$(".map-canvas canvas").forEach(function (cv) {
      var s = sizeCanvas(cv), g = s.g, w = s.w, h = s.h;
      g.fillStyle = C.midnight; g.fillRect(0, 0, w, h);
      var step = Math.max(7, w / 70);
      for (var y = step / 2; y < h; y += step) for (var x = step / 2; x < w; x += step) {
        var lon = BOX.lon0 + x / w * (BOX.lon1 - BOX.lon0), lat = BOX.lat1 - y / h * (BOX.lat1 - BOX.lat0);
        var land = LAND.some(function (p) { return inPoly(lon, lat, p); });
        circle(g, x, y, land ? step * 0.3 : step * 0.09, land ? "rgba(247,243,236,.55)" : "rgba(201,195,232,.18)");
      }
    });
  }
  $$(".map").forEach(function (map) {
    var pts = $$(".map-pt, .offmap button", map), side = $(".map-side", map);
    $$(".map-pt", map).forEach(function (p) {
      var lon = +p.getAttribute("data-lon"), lat = +p.getAttribute("data-lat");
      p.style.left = ((lon - BOX.lon0) / (BOX.lon1 - BOX.lon0) * 100) + "%";
      p.style.top = ((BOX.lat1 - lat) / (BOX.lat1 - BOX.lat0) * 100) + "%";
    });
    function pick(p) {
      pts.forEach(function (x) { x.setAttribute("aria-pressed", x === p); });
      var tpl = document.getElementById(p.getAttribute("data-card"));
      if (tpl && side) { side.innerHTML = tpl.innerHTML; initClaims(side); }
      track("Map point", { id: p.getAttribute("data-card") });
    }
    pts.forEach(function (p) { p.addEventListener("click", function () { pick(p); }); });
  });
  drawMaps();

  /* ---------- Small screens: let wide hero copy breathe ---------- */
  var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
})();
