/* HIPL CMS admin. Vanilla JS, no build step.
   Forms are generated from the content model served by /api/schema.
   All text from the server is inserted with textContent (never innerHTML),
   so submissions from the public website can't inject markup here. */
(function () {
  "use strict";
  var S = { schema: null, dash: null };
  var $ = function (s, c) { return (c || document).querySelector(s); };

  /* ---------- tiny DOM builder ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    kids.forEach(function (c) { add(el, c); });
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function toast(msg, err) {
    var t = h("div", { class: "toast" + (err ? " err" : ""), text: msg });
    $("#toasts").appendChild(t); setTimeout(function () { t.remove(); }, err ? 6000 : 3000);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o === undefined ? null : o)); }

  /* ---------- API ---------- */
  function api(method, path, body) {
    var opt = { method: method, headers: { "X-HIPL": "1" }, credentials: "same-origin" };
    if (body !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    return fetch(path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { showLogin(); throw new Error(j.error || "Please sign in."); }
        if (!r.ok) throw new Error(j.error || ("Request failed (" + r.status + ")"));
        return j;
      });
    });
  }
  function fail(e) { toast(e.message || String(e), true); }
  function readFile(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res({ name: file.name, type: file.type || "application/octet-stream", data: String(r.result).split(",")[1] }); };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  /* ---------- auth ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; $("#pw").focus(); }
  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("#pw").value }) })
      .then(function (r) { if (!r.ok) throw new Error("Wrong password."); return boot(); })
      .catch(function (err) { $("#login-msg").textContent = err.message; });
  });
  $("#logout").addEventListener("click", function () { api("POST", "/api/logout", {}).then(function () { location.hash = ""; showLogin(); }); });

  function boot() {
    return Promise.all([api("GET", "/api/schema"), api("GET", "/api/dashboard")]).then(function (r) {
      S.schema = r[0]; S.dash = r[1];
      S.cols = {}; S.schema.collections.forEach(function (c) { S.cols[c.id] = c; });
      $("#login").hidden = true; $("#app").hidden = false;
      route();
    });
  }

  /* ---------- navigation ---------- */
  function nav() {
    var n = clear($("#nav")), hash = location.hash || "#/";
    var newCount = Object.keys(S.dash.inbox).reduce(function (a, k) { return a + S.dash.inbox[k]; }, 0);
    function link(href, label, count) {
      var on = hash === href || (href !== "#/" && hash.indexOf(href + "/") === 0);
      return h("a", { href: href, class: on ? "on" : "" }, h("span", { text: label }), count ? h("span", { class: "count", text: count }) : null);
    }
    add(n, [link("#/", "Dashboard"), link("#/inbox", "Inbox", newCount), link("#/composer", "AI Composer")]);
    var groups = {};
    S.schema.collections.forEach(function (c) { (groups[c.group] = groups[c.group] || []).push(c); });
    Object.keys(groups).forEach(function (g) {
      add(n, h("div", { class: "grp", text: g }));
      groups[g].forEach(function (c) { add(n, link(c.single ? "#/s/" + c.id : "#/c/" + c.id, c.label)); });
    });
    add(n, [h("div", { class: "grp", text: "Publishing" }), link("#/pages", "Page text (HTML)"), link("#/media", "Media library"), link("#/publish", "Preview & publish"), link("#/settings", "Settings")]);
  }
  window.addEventListener("hashchange", route);
  function route() {
    if (!S.schema) return;
    nav();
    var parts = (location.hash || "#/").slice(2).split("/").map(decodeURIComponent);
    var v = clear($("#view")); v.focus();
    var r = {
      "": dashboard, inbox: inbox, composer: composer, c: listView, e: editView, s: singleView,
      pages: pagesView, media: mediaView, publish: publishView, settings: settingsView, history: historyView
    }[parts[0]];
    (r || dashboard)(v, parts.slice(1));
  }
  function header(v, title, sub, actions, crumbs) {
    add(v, h("div", { class: "head" },
      h("div", null, crumbs ? h("div", { class: "crumb" }, crumbs) : null, h("h1", { text: title }), sub ? h("p", { text: sub }) : null),
      h("div", { class: "row" }, actions || [])));
  }

  /* ---------- dashboard ---------- */
  function dashboard(v) {
    api("GET", "/api/dashboard").then(function (d) {
      S.dash = d; nav();
      if (d.first_password) add(v, h("div", { class: "banner" }, "Welcome! You signed in with the first-time password ", h("code", { text: d.first_password }), ". ", h("a", { href: "#/settings", text: "Set your own password →" })));
      header(v, "Dashboard", "Everything on the HIPL website is edited here. Changes go live when you press Publish.",
        [h("a", { class: "btn saffron", href: "#/composer", text: "Draft an Exploration with AI" }), h("a", { class: "btn ghost", href: "#/publish", text: "Preview & publish" })]);
      var inboxTotal = Object.keys(d.inbox).reduce(function (a, k) { return a + d.inbox[k]; }, 0);
      var g = h("div", { class: "grid" });
      add(g, h("a", { class: "card dark", href: "#/inbox", style: "text-decoration:none" }, h("h3", { text: "Inbox" }), h("span", { class: "big", text: inboxTotal }), h("span", { text: "new submissions: questions, RSVPs, pitches, comments" })));
      add(g, h("div", { class: "card" }, h("h3", { text: "Upcoming events" }),
        d.upcoming.length ? d.upcoming.map(function (e) { return h("a", { href: "#/e/events/" + encodeURIComponent(e.slug), text: (e.date || "TBA") + " · " + e.title }); }) : h("span", { class: "hint", text: "None scheduled." }),
        h("a", { class: "btn small ghost", href: "#/e/events/new", text: "Add an event" })));
      var wf = d.workflow, order = ["draft", "fact-check", "expert-review", "ready", "published", "sample", "planned"];
      add(g, h("div", { class: "card" }, h("h3", { text: "Explorations workflow" }),
        order.filter(function (k) { return wf[k]; }).map(function (k) { return h("div", { class: "row", style: "justify-content:space-between" }, h("span", { class: "pill " + k, text: k }), h("b", { text: wf[k] })); }),
        h("a", { class: "btn small ghost", href: "#/c/explorations", text: "Open the library" })));
      add(g, h("div", { class: "card" }, h("h3", { text: "AI Composer" }),
        h("span", { text: !d.ai.sdk ? "Needs the Anthropic SDK: run  pip install anthropic" : (!d.ai.key ? "Add your Anthropic API key in Settings to switch it on." : "Ready · model " + d.ai.model) }),
        h("a", { class: "btn small ghost", href: d.ai.key ? "#/composer" : "#/settings", text: d.ai.key ? "Open the Composer" : "Settings" })));
      add(g, h("div", { class: "card" }, h("h3", { text: "Quick links" }),
        h("a", { href: "#/s/settings", text: "Homepage headline & announcement bar" }), h("a", { href: "#/c/questions", text: "Answer a question" }),
        h("a", { href: "#/c/dispatch", text: "Write this week's Dispatch" }), h("a", { href: "#/c/team", text: "Team & founders" })));
      add(g, h("div", { class: "card" }, h("h3", { text: "Website" }), h("span", { text: d.built ? "Built and being served at /." : "Not built yet." }),
        h("a", { class: "btn small", href: "/", target: "_blank", text: "Open the website ↗" })));
      add(v, g);
    }).catch(fail);
  }

  /* ---------- list ---------- */
  function previewPath(col, it) {
    if (!it) return "index.html";
    switch (col.id) {
      case "events": return "events/" + it.slug + ".html";
      case "explorations": return it.slug ? "explorations/" + it.series + "/" + it.slug + ".html" : "explorations.html";
      case "questions": return "questions/" + String(it.n).padStart(3, "0") + ".html";
      case "interviews": return "interviews/" + it.slug + ".html";
      case "voices": return "voices/" + it.slug + ".html";
      case "dispatch": return "dispatch/issue-" + String(it.number).padStart(2, "0") + ".html";
      case "circle": return "reading-circle.html";
      case "programmes": case "inperson_intro": return "in-person.html";
      case "team": return "about.html";
      case "concepts": return "explorations.html";
      default: return "index.html";
    }
  }
  function listView(v, args) {
    var col = S.cols[args[0]]; if (!col) return dashboard(v);
    header(v, col.label, col.help, [
      h("a", { class: "btn saffron", href: "#/e/" + col.id + "/new", text: "Add new" }),
      col.studio ? h("a", { class: "btn ghost", href: "#/composer", text: "Draft with AI" }) : null,
      h("a", { class: "btn ghost", href: "#/history/" + col.file.replace(".json", ""), text: "History" })]);
    var search = h("input", { type: "search", placeholder: "Search " + col.label.toLowerCase() + "…", "aria-label": "Search" });
    var statusSel = col.statuses ? h("select", { "aria-label": "Status" }, h("option", { value: "", text: "All statuses" }), col.statuses.map(function (s) { return h("option", { value: s, text: s }); })) : null;
    add(v, h("div", { class: "row", style: "margin-bottom:14px" }, h("div", { style: "flex:1;min-width:220px" }, search), statusSel));
    var wrap = h("div"); add(v, wrap);
    api("GET", "/api/content/" + col.id).then(function (items) {
      function draw() {
        var q = search.value.toLowerCase(), st = statusSel ? statusSel.value : "";
        var rows = items.filter(function (it) { return (!q || JSON.stringify(it).toLowerCase().indexOf(q) > -1) && (!st || it.status === st); });
        var t = h("table", { class: "list" }, h("thead", null, h("tr", null, h("th", { text: col.key === "n" ? "#" : "" }), h("th", { text: "Title" }), (col.summary || []).map(function (s) { return h("th", { text: s }); }))));
        var tb = h("tbody");
        rows.forEach(function (it) {
          var key = it[col.key];
          add(tb, h("tr", { onclick: function () { location.hash = "#/e/" + col.id + "/" + encodeURIComponent(key); } },
            h("td", { text: col.key === "n" || col.key === "number" ? String(key).padStart(2, "0") : "" }),
            h("td", { class: "t" }, h("a", { href: "#/e/" + col.id + "/" + encodeURIComponent(key), text: it[col.title] || key || "(untitled)" }),
              col.id === "explorations" && (it.blocks || []).length ? h("span", { class: "hint", text: "  · " + it.blocks.length + " blocks" }) : null,
              it.built ? h("span", { class: "hint", text: "  · hand-built sample page" }) : null),
            (col.summary || []).map(function (s) { var val = it[s]; return h("td", null, s === "status" ? h("span", { class: "pill " + val, text: val || "" }) : String(val === undefined ? "" : val)); })));
        });
        add(t, tb); add(clear(wrap), rows.length ? t : h("p", { class: "hint", text: "Nothing matches." }));
      }
      search.addEventListener("input", draw); if (statusSel) statusSel.addEventListener("change", draw); draw();
    }).catch(fail);
  }

  /* ---------- field renderers ---------- */
  function fieldsUI(fields, obj, opts) {
    return fields.map(function (fd) { return fieldUI(fd, obj, opts || {}); });
  }
  function labelFor(fd) { return fd.label || fd.name; }
  var uid = 0;
  function fieldUI(fd, obj, opts) {
    var id = "f" + (++uid), k = fd.name, v = obj[k], kind = fd.kind;
    var set = function (val) { obj[k] = val; if (opts.onChange) opts.onChange(); };
    if (kind === "group") {
      if (!obj[k] || typeof obj[k] !== "object") obj[k] = {};
      return h("fieldset", { class: "grp" }, h("legend", { text: labelFor(fd) }), fieldsUI(fd.fields, obj[k], opts));
    }
    if (kind === "list") return listUI(fd, obj, opts);
    if (kind === "blocks") return blocksUI(fd, obj, opts);
    var input;
    if (kind === "md") input = h("textarea", { id: id, class: "md", value: v || "", oninput: function (e) { set(e.target.value); } });
    else if (kind === "paragraphs") input = h("textarea", { id: id, class: "md", value: (v || []).join("\n\n"), oninput: function (e) { set(e.target.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean)); } });
    else if (kind === "select" || kind === "claim") {
      var options = kind === "claim" ? Object.keys(S.schema.claims) : fd.options;
      input = h("select", { id: id, onchange: function (e) { set(e.target.value); } },
        options.map(function (o) { return h("option", { value: o, text: kind === "claim" ? S.schema.claims[o] : (o === "" ? "—" : o) }); }));
      if (v !== undefined && v !== null && options.indexOf(String(v)) < 0) add(input, h("option", { value: v, text: v }));
      input.value = v === undefined || v === null ? (options[0] || "") : String(v);
      if (v === undefined) obj[k] = input.value;
    }
    else if (kind === "bool") return h("div", { class: "field" }, h("label", { class: "check" }, h("input", { type: "checkbox", checked: !!v, onchange: function (e) { set(e.target.checked); } }), labelFor(fd)));
    else if (kind === "number") input = h("input", { id: id, type: "number", step: "any", value: v === undefined || v === null ? "" : v, oninput: function (e) { set(e.target.value === "" ? null : Number(e.target.value)); } });
    else if (kind === "password") input = h("input", { id: id, type: "password", autocomplete: "off", value: v || "", oninput: function (e) { set(e.target.value); } });
    else if (kind === "date") input = h("input", { id: id, type: "date", value: v || "", oninput: function (e) { set(e.target.value); } });
    else if (kind === "time") input = h("input", { id: id, type: "time", value: v || "", oninput: function (e) { set(e.target.value); } });
    else if (kind === "strings") return stringsUI(fd, obj, opts);
    else if (kind === "numbers") input = h("input", { id: id, type: "text", value: (v || []).join(", "), placeholder: "e.g. 2, 13, 25", oninput: function (e) { set(e.target.value.split(/[ ,]+/).filter(Boolean).map(Number).filter(function (x) { return !isNaN(x); })); } });
    else if (kind === "image") return imageUI(fd, obj, opts, id);
    else input = h("input", { id: id, type: "text", value: v === undefined || v === null ? "" : v, oninput: function (e) { set(e.target.value); } });
    return h("div", { class: "field" }, h("label", { for: id, text: labelFor(fd) }), input,
      kind === "md" ? h("p", { class: "hint", text: "**bold**, *italic*, [link](url), [[dharma]] for a glossary pop-up, [^1] for source 1, [VERIFY] for anything still to check." }) : null,
      fd.help ? h("p", { class: "hint", text: fd.help }) : null);
  }
  function stringsUI(fd, obj, opts) {
    if (!Array.isArray(obj[fd.name])) obj[fd.name] = [];
    var arr = obj[fd.name], box = h("div", { class: "strings" });
    function draw() {
      clear(box);
      arr.forEach(function (s, i) {
        add(box, h("div", { class: "s-row" },
          h("input", { type: "text", value: s, "aria-label": labelFor(fd) + " " + (i + 1), oninput: function (e) { arr[i] = e.target.value; if (opts.onChange) opts.onChange(); } }),
          h("div", { class: "tools" }, h("button", { type: "button", title: "Remove", "aria-label": "Remove", text: "×", onclick: function () { arr.splice(i, 1); draw(); } }))));
      });
      add(box, h("button", { type: "button", class: "btn small ghost", text: "+ Add", onclick: function () { arr.push(""); draw(); var ins = box.querySelectorAll("input"); ins[ins.length - 1].focus(); } }));
    }
    draw();
    return h("div", { class: "field" }, h("span", { class: "lab", text: labelFor(fd) }), box);
  }
  function imageUI(fd, obj, opts, id) {
    var input = h("input", { id: id, type: "text", value: obj[fd.name] || "", placeholder: "assets/uploads/…", oninput: function (e) { obj[fd.name] = e.target.value; prev(); } });
    var img = h("img", { class: "img-prev", alt: "" });
    function prev() { var u = obj[fd.name]; img.hidden = !u; if (u) img.src = "/" + u.replace(/^\//, ""); }
    var file = h("input", { type: "file", accept: "image/*", hidden: true, onchange: function () {
      if (!file.files[0]) return;
      readFile(file.files[0]).then(function (f) { return api("POST", "/api/upload", f); }).then(function (r) { obj[fd.name] = r.url; input.value = r.url; prev(); toast("Uploaded " + r.name); }).catch(fail);
    } });
    prev();
    return h("div", { class: "field" }, h("label", { for: id, text: labelFor(fd) }),
      h("div", { class: "img-field" }, input, h("button", { type: "button", class: "btn small ghost", text: "Upload…", onclick: function () { file.click(); } })), file, img);
  }
  function summaryOf(row) {
    var keys = ["title", "label", "name", "q", "tab", "question", "when", "time", "text", "kicker"];
    for (var i = 0; i < keys.length; i++) if (row[keys[i]]) return String(row[keys[i]]).slice(0, 90);
    return "(empty)";
  }
  function listUI(fd, obj, opts) {
    if (!Array.isArray(obj[fd.name])) obj[fd.name] = [];
    var arr = obj[fd.name], box = h("div", { class: "lst" });
    function blank() { var o = {}; fd.fields.forEach(function (f) { o[f.name] = f.kind === "list" || f.kind === "strings" ? [] : (f.kind === "bool" ? false : ""); }); return o; }
    function draw(openIdx) {
      clear(box);
      arr.forEach(function (row, i) {
        var item = h("div", { class: "lst-item" + (i === openIdx ? "" : " closed") });
        var title = h("b", { text: (i + 1) + ". " + summaryOf(row) });
        add(item, h("div", { class: "lst-head", onclick: function (e) { if (!e.target.closest("button")) item.classList.toggle("closed"); } }, title,
          h("div", { class: "tools" },
            h("button", { type: "button", title: "Move up", "aria-label": "Move up", text: "↑", onclick: function () { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(i - 1); } } }),
            h("button", { type: "button", title: "Move down", "aria-label": "Move down", text: "↓", onclick: function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(i + 1); } } }),
            h("button", { type: "button", title: "Remove", "aria-label": "Remove", text: "×", onclick: function () { arr.splice(i, 1); draw(); } }))));
        add(item, h("div", { class: "lst-body" }, fieldsUI(fd.fields, row, { onChange: function () { title.textContent = (i + 1) + ". " + summaryOf(row); if (opts.onChange) opts.onChange(); } })));
        add(box, item);
      });
      add(box, h("button", { type: "button", class: "btn small ghost", text: "+ Add " + labelFor(fd).toLowerCase().replace(/s$/, ""), onclick: function () { arr.push(blank()); draw(arr.length - 1); } }));
    }
    draw();
    return h("div", { class: "field" }, h("span", { class: "lab", text: labelFor(fd) }), fd.help ? h("p", { class: "hint", text: fd.help }) : null, box);
  }

  /* ---------- Explorations blocks (the Studio) ---------- */
  var INTERACTIVE = ["knowledge_cards", "meaning_layers", "scenarios", "dilemma", "compare", "characters", "map", "timeline", "poll"];
  function blankBlock(type) {
    var b = { type: type };
    S.schema.blocks[type].fields.forEach(function (f) { b[f.name] = f.kind === "list" ? [] : (f.kind === "bool" ? false : (f.kind === "number" ? null : "")); });
    return b;
  }
  function blocksUI(fd, obj, opts) {
    if (!Array.isArray(obj.blocks)) obj.blocks = [];
    var arr = obj.blocks, box = h("div", { class: "blocks" });
    function draw(openIdx) {
      clear(box);
      arr.forEach(function (b, i) {
        var def = S.schema.blocks[b.type] || { label: b.type, fields: [] };
        var el = h("div", { class: "block" + (i === openIdx ? "" : " closed") });
        var title = h("span", { class: "block-title", text: summaryOf(b) });
        add(el, h("div", { class: "block-head", onclick: function (e) { if (!e.target.closest("button")) el.classList.toggle("closed"); } },
          h("span", { class: "block-type" + (INTERACTIVE.indexOf(b.type) > -1 ? " interactive" : ""), text: def.label }), title,
          h("div", { class: "tools" },
            h("button", { type: "button", title: "Move up", "aria-label": "Move block up", text: "↑", onclick: function () { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(i - 1); } } }),
            h("button", { type: "button", title: "Move down", "aria-label": "Move block down", text: "↓", onclick: function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(i + 1); } } }),
            h("button", { type: "button", title: "Duplicate", "aria-label": "Duplicate block", text: "⧉", onclick: function () { arr.splice(i + 1, 0, clone(b)); draw(i + 1); } }),
            h("button", { type: "button", title: "Delete", "aria-label": "Delete block", text: "×", onclick: function () { arr.splice(i, 1); draw(); } }))));
        var instr = h("input", { type: "text", placeholder: "Ask AI to change this block, e.g. \"shorter\", \"add two more cards\", \"make it a dilemma about work\"" });
        var aiBtn = h("button", { type: "button", class: "btn small ghost", text: "Ask AI", onclick: function () {
          if (!instr.value.trim()) { instr.focus(); return; }
          aiBtn.disabled = true; aiBtn.textContent = "Working…";
          api("POST", "/api/ai/assist", { block: b, instruction: instr.value, context: { title: obj.title, hook: obj.hook } })
            .then(function (nb) { arr[i] = nb; draw(i); toast("Block updated. Review it, then Save."); })
            .catch(fail).then(function () { aiBtn.disabled = false; aiBtn.textContent = "Ask AI"; });
        } });
        add(el, h("div", { class: "block-body" }, h("p", { class: "hint", text: def.help }), h("div", { class: "block-ai" }, instr, aiBtn),
          fieldsUI(def.fields, b, { onChange: function () { title.textContent = summaryOf(b); } })));
        add(box, el);
      });
      var picker = h("div", { class: "adder-grid", hidden: true });
      Object.keys(S.schema.blocks).forEach(function (t) {
        var d = S.schema.blocks[t];
        add(picker, h("button", { type: "button", onclick: function () { arr.push(blankBlock(t)); draw(arr.length - 1); } }, h("b", { text: d.label }), h("span", { text: d.help })));
      });
      add(box, h("div", { class: "adder" }, h("button", { type: "button", class: "btn small saffron", text: "+ Add a block", onclick: function () { picker.hidden = !picker.hidden; } }),
        h("span", { class: "hint", text: "  " + arr.length + " blocks · " + arr.filter(function (b) { return INTERACTIVE.indexOf(b.type) > -1; }).length + " interactive" }), picker));
    }
    draw();
    return h("div", { class: "field" }, h("span", { class: "lab", text: "Page blocks" }),
      h("p", { class: "hint", text: "Build the page from blocks in reading order. The website turns them into the same interactive layout as the sample entries." }), box);
  }

  /* ---------- editor ---------- */
  function editView(v, args) {
    var col = S.cols[args[0]]; if (!col) return dashboard(v);
    var isNew = args[1] === "new", key = args[1];
    var load = isNew ? Promise.resolve(null) : api("GET", "/api/content/" + col.id);
    load.then(function (items) {
      var item;
      if (isNew) { item = {}; col.fields.forEach(function (f) { if (f.kind === "list" || f.kind === "strings" || f.kind === "numbers" || f.kind === "blocks") item[f.name] = []; }); if (col.statuses) item.status = col.statuses[0] === "upcoming" ? "planned" : col.statuses[0]; }
      else {
        item = items.filter(function (x) { return String(x[col.key]) === key; })[0];
        if (!item) { add(v, h("p", { text: "Not found." })); return; }
        item = clone(item);
      }
      var dirty = false, onChange = function () { dirty = true; };
      var crumbs = [h("a", { href: "#/c/" + col.id, text: col.label }), " / "];
      header(v, isNew ? "New " + col.label.toLowerCase().replace(/s$/, "") : (item[col.title] || key), null, [], crumbs);
      var form;
      if (col.studio) {
        // Studio layout: the page blocks lead; details fold away once an entry has content.
        var later = ["sources", "related"], main = ["blocks"];
        var details = col.fields.filter(function (f) { return main.indexOf(f.name) < 0 && later.indexOf(f.name) < 0; });
        var det = h("details", { class: "grp-details", open: isNew || !(item.blocks || []).length },
          h("summary", { text: "Entry details · " + (item.series || "") + " · " + (item.type || "") + " · " + (item.status || "") }),
          h("div", { class: "two-col" }, fieldsUI(details, item, { onChange: onChange })));
        form = h("div", null, det,
          fieldsUI(col.fields.filter(function (f) { return main.indexOf(f.name) > -1; }), item, { onChange: onChange }),
          fieldsUI(col.fields.filter(function (f) { return later.indexOf(f.name) > -1; }), item, { onChange: onChange }));
      } else {
        form = h("div", null, fieldsUI(col.fields, item, { onChange: onChange }));
      }
      var side = h("div", { class: "editor-side" });
      var saveBtn = h("button", { type: "button", class: "btn saffron", text: isNew ? "Create" : "Save" });
      var previewBtn = h("button", { type: "button", class: "btn ghost", text: "Save & preview" });
      var problems = h("div");
      function save() {
        saveBtn.disabled = true;
        var req = isNew ? api("POST", "/api/content/" + col.id, item) : api("PUT", "/api/content/" + col.id + "/" + encodeURIComponent(key), item);
        return req.then(function (saved) {
          dirty = false; toast("Saved. Press Publish when you're ready to put it live.");
          if (isNew || String(saved[col.key]) !== key) { location.hash = "#/e/" + col.id + "/" + encodeURIComponent(saved[col.key]); }
          checkProblems(saved);
          return saved;
        }).catch(function (e) { fail(e); throw e; }).finally(function () { saveBtn.disabled = false; });
      }
      function checkProblems(it) {
        if (col.id !== "explorations" || !it || !it.n) return;
        api("GET", "/api/validate/" + it.n).then(function (r) {
          clear(problems);
          add(problems, r.problems.length ? [h("b", { text: "Before publishing" }), h("ul", { class: "problems" }, r.problems.map(function (p) { return h("li", { text: p }); }))] : h("span", { class: "ok", text: "✓ Ready to publish" }));
        });
      }
      saveBtn.addEventListener("click", function () { save(); });
      previewBtn.addEventListener("click", function () {
        var w = window.open("about:blank", "_blank");
        save().then(function (saved) {
          return api("POST", "/api/build", { preview: true }).then(function () { if (w) w.location = "/preview/" + previewPath(col, saved); });
        }).catch(function () { if (w) w.close(); });
      });
      add(side, h("div", { class: "card" }, h("div", { class: "row" }, saveBtn, previewBtn),
        h("p", { class: "hint", text: "Saving keeps a version in History. The live site changes only when you Publish." })));
      if (col.statuses && col.id === "explorations") {
        var flow = ["draft", "fact-check", "expert-review", "ready", "published"];
        add(side, h("div", { class: "card" }, h("h3", { text: "Workflow" }),
          h("p", { class: "hint", text: "Writer drafts → fact-checker checks every quote, verse and date → outside expert for sensitive entries → editor publishes." }),
          h("div", { class: "row" }, flow.map(function (st) {
            return h("button", { type: "button", class: "btn small " + (item.status === st ? "saffron" : "ghost"), text: st, onclick: function () { item.status = st; save().then(function () { route(); }); } });
          })), problems));
      }
      if (!isNew) {
        var conf = h("span", { class: "confirm", hidden: true }, "Delete for good? ",
          h("button", { type: "button", class: "btn small danger", text: "Yes, delete", onclick: function () { api("DELETE", "/api/content/" + col.id + "/" + encodeURIComponent(key)).then(function () { toast("Deleted."); location.hash = "#/c/" + col.id; }).catch(fail); } }),
          h("button", { type: "button", class: "btn small ghost", text: "Cancel", onclick: function () { conf.hidden = true; } }));
        add(side, h("div", { class: "card" }, h("a", { href: "/preview/" + previewPath(col, item), target: "_blank", text: "Open last preview ↗" }),
          h("button", { type: "button", class: "btn small danger", text: "Delete…", onclick: function () { conf.hidden = false; } }), conf));
        checkProblems(item);
      }
      if (item.made_with === "ai-composer") add(side, h("div", { class: "card" }, h("h3", { text: "Drafted by the AI Composer" }), h("p", { class: "hint", text: "Check every claim against its source. Clear each VERIFY marker only after checking it." }), item.editor_notes ? h("p", { text: item.editor_notes }) : null));
      add(v, h("div", { class: "editor" }, form, side));
      window.onbeforeunload = function () { return dirty ? "You have unsaved changes." : undefined; };
    }).catch(fail);
  }
  function singleView(v, args) {
    var col = S.cols[args[0]]; if (!col) return dashboard(v);
    api("GET", "/api/content/" + col.id).then(function (obj) {
      header(v, col.label, col.help, [h("a", { class: "btn ghost", href: "#/history/" + col.file.replace(".json", ""), text: "History" })]);
      var save = h("button", { type: "button", class: "btn saffron", text: "Save", onclick: function () {
        api("PUT", "/api/content/" + col.id, obj).then(function () { toast("Saved. Publish to put it live."); }).catch(fail);
      } });
      var prev = h("button", { type: "button", class: "btn ghost", text: "Save & preview", onclick: function () {
        var w = window.open("about:blank", "_blank");
        api("PUT", "/api/content/" + col.id, obj).then(function () { return api("POST", "/api/build", { preview: true }); }).then(function () { if (w) w.location = "/preview/" + previewPath(col); }).catch(function (e) { if (w) w.close(); fail(e); });
      } });
      add(v, h("div", { class: "editor" }, h("div", null, fieldsUI(col.fields, obj)), h("div", { class: "editor-side" }, h("div", { class: "card" }, h("div", { class: "row" }, save, prev)))));
    }).catch(fail);
  }

  /* ---------- AI Composer ---------- */
  function composer(v) {
    header(v, "AI Composer", "Give a topic and whatever you have (notes, an article, links, images or PDFs). The Composer can research the web, then drafts a full interactive Explorations page from the site's blocks. Every draft arrives as \"draft\" for your writer, fact-checker and editor.");
    if (!S.dash.ai.sdk || !S.dash.ai.key) add(v, h("div", { class: "banner" }, !S.dash.ai.sdk ? "Install the Anthropic SDK first: open a terminal, run  pip install anthropic  and restart the CMS. " : "Add your Anthropic API key under Settings to switch the Composer on. ", h("a", { href: "#/settings", text: "Settings →" })));
    var b = { topic: "", series: "hindu-universe", type: "explainer", level: "Beginner", read: 10, element: "", notes: "", article: "", links: "", deep_research: true, attachments: [] };
    var planned = h("select", null, h("option", { value: "", text: "A new entry (next free number)" }));
    api("GET", "/api/content/explorations").then(function (list) {
      list.filter(function (e) { return !e.built && !(e.blocks || []).length; }).forEach(function (e) {
        add(planned, h("option", { value: e.n, text: String(e.n).padStart(2, "0") + " · " + e.title }));
      });
      planned.addEventListener("change", function () {
        var e = list.filter(function (x) { return String(x.n) === planned.value; })[0];
        if (!e) return;
        b.topic = e.title; b.series = e.series; b.type = e.type; b.level = e.level; b.read = e.read; b.element = e.element || "";
        add(clear(formBox), fieldsUI(FIELDS, b));
      });
    });
    var FIELDS = [
      { name: "topic", kind: "text", label: "Topic or working title" },
      { name: "series", kind: "select", label: "Series", options: ["hindu-universe", "stories-that-stay", "ancient-ideas-modern-life"] },
      { name: "type", kind: "select", label: "Page type", options: ["explainer", "story", "interactive"] },
      { name: "level", kind: "select", label: "Level", options: ["Beginner", "Deeper"] },
      { name: "read", kind: "number", label: "Target read time (minutes)" },
      { name: "element", kind: "text", label: "Interactive element you'd like (optional), e.g. \"a map of temples\", \"a workplace dilemma\"" },
      { name: "notes", kind: "md", label: "Your notes, angle and must-includes" },
      { name: "article", kind: "md", label: "Paste an article, transcript or draft (optional)" },
      { name: "links", kind: "md", label: "Links to sources you trust (one per line)" },
      { name: "deep_research", kind: "bool", label: "Deep research: let the Composer search and read the web first (slower, better sourced)" }
    ];
    var formBox = h("div", { class: "two-col", style: "padding:0" }, fieldsUI(FIELDS, b));
    var files = h("input", { type: "file", multiple: true, accept: "image/*,.pdf,.txt,.md", hidden: true });
    var fileList = h("div", { class: "files-list" });
    var drop = h("div", { class: "drop" }, "Drop images, PDFs or text files here, or ", h("button", { type: "button", class: "btn small ghost", text: "choose files", onclick: function () { files.click(); } }),
      h("p", { class: "hint", text: "Images are added to the media library and can be placed on the page. PDFs and text are read as sources." }), fileList, files);
    function addFiles(fl) {
      Array.prototype.forEach.call(fl, function (f) {
        if (f.size > 15 * 1024 * 1024) { toast(f.name + " is larger than 15 MB.", true); return; }
        readFile(f).then(function (r) { b.attachments.push(r); add(fileList, h("span", { text: f.name })); });
      });
    }
    files.addEventListener("change", function () { addFiles(files.files); });
    drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
    drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); addFiles(e.dataTransfer.files); });
    var go = h("button", { type: "button", class: "btn saffron", text: "Draft the page" });
    var log = h("div", { class: "log", hidden: true }), result = h("div");
    go.addEventListener("click", function () {
      if (!b.topic.trim()) { toast("Give the Composer a topic.", true); return; }
      go.disabled = true; go.textContent = "Working… this can take a few minutes"; log.hidden = false; log.textContent = "Starting…"; clear(result);
      api("POST", "/api/ai/compose", b).then(function (r) { poll(r.job); }).catch(function (e) { fail(e); go.disabled = false; go.textContent = "Draft the page"; });
    });
    function poll(id) {
      api("GET", "/api/jobs/" + id).then(function (j) {
        log.textContent = j.log.join("\n") || "Working…";
        if (j.status === "running") return setTimeout(function () { poll(id); }, 2500);
        go.disabled = false; go.textContent = "Draft again";
        if (j.status === "error") { toast(j.error, true); log.textContent += "\n" + j.error; return; }
        showResult(j.result);
      }).catch(function (e) { fail(e); go.disabled = false; });
    }
    function showResult(entry) {
      var types = (entry.blocks || []).map(function (x) { return (S.schema.blocks[x.type] || {}).label || x.type; });
      add(clear(result), h("div", { class: "card", style: "margin-top:18px" },
        h("h2", { text: entry.title }), h("p", { text: entry.hook }),
        h("p", { class: "hint", text: types.length + " blocks: " + types.join(" · ") }),
        h("p", { class: "hint", text: (entry.sources || []).length + " sources" }),
        entry.editor_notes ? h("div", null, h("b", { text: "Notes for the fact-checker" }), h("p", { text: entry.editor_notes })) : null,
        h("div", { class: "row" },
          h("button", { type: "button", class: "btn saffron", text: planned.value ? "Save into entry " + planned.value : "Save as a new draft entry", onclick: function () {
            entry.series = b.series; entry.type = b.type; entry.priority = "later"; entry.status = "draft";
            var req = planned.value ? api("GET", "/api/content/explorations").then(function (list) {
              var cur = list.filter(function (x) { return String(x.n) === planned.value; })[0];
              var merged = Object.assign({}, cur, entry, { n: cur.n, priority: cur.priority, title: entry.title || cur.title });
              return api("PUT", "/api/content/explorations/" + cur.n, merged);
            }) : api("POST", "/api/content/explorations", entry);
            req.then(function (saved) { toast("Saved as a draft."); location.hash = "#/e/explorations/" + saved.n; }).catch(fail);
          } }))));
    }
    add(v, h("div", { class: "editor" }, h("div", null, h("div", { class: "field" }, h("label", { text: "Fill a planned entry, or start a new one" }), planned), formBox, drop),
      h("div", { class: "editor-side" }, h("div", { class: "card" }, go, h("p", { class: "hint", text: "Uses Claude with your API key. Costs depend on length and research; check usage in your Anthropic console." })), log)));
    add(v, result);
  }

  /* ---------- inbox ---------- */
  function inbox(v, args) {
    var kind = args[0] || "";
    header(v, "Inbox", "Everything people send through the website. Nothing appears on the site until you approve it.",
      kind ? [h("a", { class: "btn ghost", href: "/api/inbox.csv?kind=" + encodeURIComponent(kind), text: "Download CSV" })] : []);
    var tabs = h("div", { class: "tabs" }, h("a", { href: "#/inbox", class: kind ? "" : "on", text: "All" }),
      Object.keys(S.schema.forms).map(function (k) { return h("a", { href: "#/inbox/" + k, class: kind === k ? "on" : "", text: S.schema.forms[k] + (S.dash.inbox[k] ? " (" + S.dash.inbox[k] + ")" : "") }); }));
    add(v, tabs);
    var list = h("div", { class: "grid", style: "--cols:1" }); add(v, list);
    api("GET", "/api/inbox" + (kind ? "?kind=" + encodeURIComponent(kind) : "")).then(function (recs) {
      if (!recs.length) { add(list, h("p", { class: "hint", text: "Nothing here yet. Submissions from the website arrive here when the site is served by this CMS (or by your server running it)." })); return; }
      recs.forEach(function (r) {
        var dl = h("dl");
        Object.keys(r.data).forEach(function (k) {
          var val = r.data[k];
          add(dl, [h("dt", { text: k }), h("dd", null, val && typeof val === "object" ? h("a", { href: "/api/inbox/file/" + encodeURIComponent(val.file), text: "Download " + val.name }) : String(val))]);
        });
        var status = h("span", { class: "pill " + r.status, text: r.status });
        function act(a, label, cls) {
          return h("button", { type: "button", class: "btn small " + (cls || "ghost"), text: label, onclick: function () {
            api("POST", "/api/inbox/" + r.kind + "/" + r.id + "/" + a, {}).then(function (res) { toast(res.message); status.textContent = { approve: "approved", done: "done", archive: "archived", new: "new" }[a]; status.className = "pill " + status.textContent; }).catch(fail);
          } });
        }
        add(list, h("div", { class: "inbox-item" },
          h("div", { class: "row", style: "justify-content:space-between" }, h("b", { text: S.schema.forms[r.kind] || r.kind }), h("span", { class: "hint", text: r.at }), status),
          dl,
          h("div", { class: "row" },
            r.kind === "question" ? act("approve", "Publish as a question", "saffron") : null,
            r.kind === "comment" ? act("approve", "Approve comment", "saffron") : null,
            act("done", "Mark done"), act("archive", "Archive"))));
      });
    }).catch(fail);
  }

  /* ---------- pages ---------- */
  function pagesView(v, args) {
    if (args.length) return pageEdit(v, args.join("/"));
    header(v, "Page text (HTML)", "Long-form pages such as About, Write for HIPL and Privacy. Sections marked {{like_this}} are filled from the other CMS sections.");
    api("GET", "/api/pages").then(function (ps) {
      add(v, h("table", { class: "list" }, h("tbody", null, ps.map(function (p) {
        return h("tr", { onclick: function () { location.hash = "#/pages/" + p; } }, h("td", { class: "t" }, h("a", { href: "#/pages/" + p, text: p })));
      }))));
    }).catch(fail);
  }
  function pageEdit(v, path) {
    api("GET", "/api/pages/" + path).then(function (pg) {
      header(v, path, "Edit carefully: this is the page's HTML. Keep the first <!--meta …--> line. Use {{root}} at the start of links to other pages.", [], [h("a", { href: "#/pages", text: "Pages" }), " / "]);
      var ta = h("textarea", { class: "code", value: pg.html, spellcheck: "false", "aria-label": "Page HTML" });
      var save = h("button", { type: "button", class: "btn saffron", text: "Save", onclick: function () { api("PUT", "/api/pages/" + path, { html: ta.value }).then(function () { toast("Saved."); }).catch(fail); } });
      var prev = h("button", { type: "button", class: "btn ghost", text: "Save & preview", onclick: function () {
        var w = window.open("about:blank", "_blank");
        api("PUT", "/api/pages/" + path, { html: ta.value }).then(function () { return api("POST", "/api/build", { preview: true }); }).then(function () { if (w) w.location = "/preview/" + path; }).catch(function (e) { if (w) w.close(); fail(e); });
      } });
      add(v, h("div", { class: "row", style: "margin-bottom:10px" }, save, prev), ta);
    }).catch(fail);
  }

  /* ---------- media ---------- */
  function mediaView(v) {
    var input = h("input", { type: "file", multiple: true, accept: "image/*,.pdf", hidden: true });
    header(v, "Media library", "Images and PDFs used on the site. Always write a description (alt text) where you place an image.", [h("button", { type: "button", class: "btn saffron", text: "Upload…", onclick: function () { input.click(); } })]);
    add(v, input);
    var grid = h("div", { class: "media-grid" }); add(v, grid);
    function load() {
      api("GET", "/api/media").then(function (ms) {
        clear(grid);
        if (!ms.length) add(grid, h("p", { class: "hint", text: "No uploads yet." }));
        ms.forEach(function (m) {
          add(grid, h("figure", null, /\.pdf$/i.test(m.name) ? h("div", { style: "height:110px;display:grid;place-items:center;background:#E9E3D7", text: "PDF" }) : h("img", { src: "/" + m.url, alt: "", loading: "lazy" }),
            h("figcaption", null, h("span", { text: m.url }), h("div", { class: "row" },
              h("button", { type: "button", class: "btn small ghost", text: "Copy path", onclick: function () { navigator.clipboard.writeText(m.url).then(function () { toast("Copied " + m.url); }, function () { toast(m.url); }); } }),
              h("button", { type: "button", class: "btn small danger", text: "Delete", onclick: function () { api("DELETE", "/api/media/" + encodeURIComponent(m.name)).then(load).catch(fail); } })))));
        });
      }).catch(fail);
    }
    input.addEventListener("change", function () {
      Promise.all(Array.prototype.map.call(input.files, function (f) { return readFile(f).then(function (r) { return api("POST", "/api/upload", r); }); }))
        .then(function () { toast("Uploaded."); load(); }).catch(fail);
    });
    load();
  }

  /* ---------- publish ---------- */
  function publishView(v) {
    header(v, "Preview & publish", "Preview shows drafts too, only to you. Publish rebuilds the public website from the published content.");
    var log = h("div", { class: "log", text: "Ready." });
    function run(label, path, body, after) {
      log.textContent = label + "…";
      api("POST", path, body).then(function (r) { log.textContent = r.log || "Done."; toast(label + " done."); if (after) after(r); })
        .catch(function (e) { log.textContent = e.message; fail(e); });
    }
    add(v, h("div", { class: "grid" },
      h("div", { class: "card" }, h("h3", { text: "1 · Preview" }), h("p", { class: "hint", text: "Builds a private copy including drafts and entries in fact-check." }),
        h("button", { type: "button", class: "btn ghost", text: "Build preview", onclick: function () { run("Preview build", "/api/build", { preview: true }, function () { window.open("/preview/index.html", "_blank"); }); } })),
      h("div", { class: "card" }, h("h3", { text: "2 · Publish" }), h("p", { class: "hint", text: "Rebuilds the public site served by this CMS at /." }),
        h("button", { type: "button", class: "btn saffron", text: "Publish website", onclick: function () { run("Publish", "/api/build", {}); } })),
      h("div", { class: "card" }, h("h3", { text: "3 · Deploy (optional)" }), h("p", { class: "hint", text: "If the public site is hosted elsewhere (e.g. Vercel), trigger your deploy hook from Settings." }),
        h("button", { type: "button", class: "btn", text: "Publish & deploy", onclick: function () { run("Publish & deploy", "/api/deploy", {}); } }))));
    add(v, h("div", { style: "margin-top:16px" }, log));
  }

  /* ---------- history ---------- */
  function historyView(v, args) {
    var name = args[0];
    header(v, "History: " + name, "Every save keeps the previous version (the last 60). Restoring replaces the current content; it is itself saved in history.");
    api("GET", "/api/history/" + encodeURIComponent(name)).then(function (vs) {
      if (!vs.length) { add(v, h("p", { class: "hint", text: "No earlier versions yet." })); return; }
      add(v, h("table", { class: "list" }, h("tbody", null, vs.map(function (ver) {
        return h("tr", null, h("td", { text: ver.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2}).*/, "$1-$2-$3 $4:$5:$6") }),
          h("td", null, h("button", { type: "button", class: "btn small ghost", text: "Restore this version", onclick: function () {
            api("POST", "/api/history/" + encodeURIComponent(name) + "/restore", { version: ver }).then(function () { toast("Restored."); }).catch(fail);
          } })));
      }))));
    }).catch(fail);
  }

  /* ---------- settings ---------- */
  function settingsView(v) {
    header(v, "Settings");
    api("GET", "/api/settings").then(function (st) {
      var pw = { current_password: "", new_password: "" }, ai = { api_key: "", model: st.model, deploy_hook: st.deploy_hook };
      add(v, h("div", { class: "grid", style: "--cols:2" },
        h("div", { class: "card" }, h("h2", { text: "Password" }),
          fieldsUI([{ name: "current_password", kind: "password", label: "Current password" }, { name: "new_password", kind: "password", label: "New password (10+ characters)" }], pw),
          h("button", { type: "button", class: "btn saffron", text: "Change password", onclick: function () { api("POST", "/api/settings", pw).then(function () { toast("Password changed."); }).catch(fail); } })),
        h("div", { class: "card" }, h("h2", { text: "AI Composer" }),
          h("p", { class: "hint", text: st.api_key_set ? "An API key is saved." : (st.env_key ? "Using the ANTHROPIC_API_KEY environment variable." : "No API key yet. Create one at console.anthropic.com.") }),
          fieldsUI([{ name: "api_key", kind: "password", label: "Anthropic API key (stored only on this computer)" }, { name: "model", kind: "select", label: "Model", options: ["claude-opus-5-5", "claude-sonnet-5-5"] }], ai),
          h("div", { class: "row" }, h("button", { type: "button", class: "btn saffron", text: "Save", onclick: function () { api("POST", "/api/settings", ai).then(function () { toast("Saved."); return api("GET", "/api/dashboard"); }).then(function (d) { S.dash = d; }).catch(fail); } }),
            st.api_key_set ? h("button", { type: "button", class: "btn ghost", text: "Remove key", onclick: function () { api("POST", "/api/settings", { clear_api_key: true }).then(function () { toast("Key removed."); route(); }).catch(fail); } }) : null)),
        h("div", { class: "card" }, h("h2", { text: "Deploy hook" }), h("p", { class: "hint", text: "Optional. If the public site is hosted on Vercel or Netlify, paste its deploy hook URL; Publish & deploy will call it." }),
          fieldsUI([{ name: "deploy_hook", kind: "text", label: "Deploy hook URL" }], ai),
          h("button", { type: "button", class: "btn", text: "Save", onclick: function () { api("POST", "/api/settings", { deploy_hook: ai.deploy_hook }).then(function () { toast("Saved."); }).catch(fail); } }))));
    }).catch(fail);
  }

  /* ---------- start ---------- */
  api("GET", "/api/status").then(function (s) { if (s.signed_in) return boot(); showLogin(); }).catch(function () { showLogin(); });
})();
