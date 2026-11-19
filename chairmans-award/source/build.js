// 3C Project — Chairman's Award 2026 (Team) nomination deck
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const [, , OUT, IMG, ASSETS] = process.argv;
const RED = "D3332B", INK = "111111", GREY = "F2F2F2", MUTE = "5A5A5A", WHITE = "FFFFFF", DIM = "BDBDBD";
const HEAD = "Impact", BODY = "Arial";
const THEME = {
  name: "3C", headFontFace: HEAD, bodyFontFace: BODY,
  colors: { dk1: INK, lt1: WHITE, dk2: "2B2B2B", lt2: GREY, accent1: RED, accent2: "8C1F19", accent3: "F26B5E",
    accent4: "5A5A5A", accent5: "A0A0A0", accent6: "E8B4AE", hlink: RED, folHlink: "8C1F19" },
};

async function icon(Comp, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
  pres.title = "The 3C Project — Chairman's Award 2026 (Team)";

  const logo = path.join(ASSETS, "logo.png"), logoW = path.join(ASSETS, "logo_white.png");
  const LOGO_AR = 347 / 696;
  const titlePh = (color) => ({ placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.05, w: 10.6, h: 0.95,
    fontFace: HEAD, fontSize: 40, color, align: "left", valign: "middle", margin: 0 }, text: "" } });

  pres.defineSlideMaster({ title: "LIGHT", background: { color: WHITE },
    objects: [{ image: { path: logo, x: 11.55, y: 0.35, w: 1.2, h: 1.2 * LOGO_AR } }, titlePh(INK)],
    slideNumber: { x: 12.4, y: 6.95, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTE, align: "right" } });
  pres.defineSlideMaster({ title: "DARK", background: { color: INK },
    objects: [{ image: { path: logoW, x: 11.55, y: 0.35, w: 1.2, h: 1.2 * LOGO_AR } }, titlePh(WHITE)],
    slideNumber: { x: 12.4, y: 6.95, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 10, color: DIM, align: "right" } });
  pres.defineSlideMaster({ title: "BLANK_DARK", background: { color: INK }, objects: [] });

  // Slanted red tag — the logo's motif
  const tag = (s, txt, x, y, w, h = 0.42, size = 16, rot = -3) => {
    s.addShape(pres.shapes.PARALLELOGRAM, { x, y, w, h, fill: { color: RED }, line: { color: RED, width: 0 }, rotate: rot,
      objectName: "Tag " + txt });
    s.addText(txt, { x, y, w, h, fontFace: HEAD, fontSize: size, color: WHITE, align: "center", valign: "middle",
      margin: 0, rotate: rot, charSpacing: 1, isTextBox: true, objectName: "Tag text " + txt });
  };
  const kicker = (s, txt) => tag(s, txt, 0.6, 0.48, Math.max(1.6, 0.16 * txt.length + 0.7));
  const T = (s, txt, o) => s.addText(txt, Object.assign({ isTextBox: true, margin: 0, fontFace: BODY, valign: "top" }, o));
  const iconCircle = async (s, Comp, x, y, d, bg, fg) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
    s.addImage({ data: await icon(Comp, fg), x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5 });
  };
  const photo = (s, file, x, y, w, h, alt) =>
    s.addImage({ path: path.join(IMG, file), x, y, w, h, sizing: { type: "cover", w, h }, altText: alt });

  // ---------- 1. Cover ----------
  pres.addSection({ title: "Cover" });
  let s = pres.addSlide({ masterName: "BLANK_DARK", sectionTitle: "Cover" });
  photo(s, "1.jpg", 7.6, 0, 5.733, 7.5, "A 3C conversation on stage, live with an audience");
  tag(s, "CHAIRMAN'S AWARD 2026  ·  TEAM", 0.7, 0.9, 4.6, 0.5, 18);
  s.addImage({ path: logoW, x: 0.6, y: 1.85, w: 6.4, h: 6.4 * LOGO_AR, altText: "Candid Constructive Conversations logo" });
  T(s, "THE 3C PROJECT", { x: 0.7, y: 5.3, w: 6.5, h: 0.6, fontFace: HEAD, fontSize: 30, color: WHITE });
  T(s, "An India Today Group initiative  ·  Poulomi Saha & Puneet Nayak", { x: 0.7, y: 5.95, w: 6.6, h: 0.4, fontSize: 15, color: DIM });
  s.addNotes("The 3C Project — Candid Constructive Conversations. Nomination for the Chairman's Award 2026, Team category.");

  // ---------- 2. Team ----------
  pres.addSection({ title: "Team" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Team" });
  kicker(s, "THE TEAM");
  s.addText("TWO PEOPLE. A WHOLE GROUP BEHIND THEM", { placeholder: "title" });
  const people = [["Poulomi Saha", "Emp ID: [to be added]"], ["Puneet Nayak", "Emp ID: [to be added]"]];
  for (let i = 0; i < 2; i++) {
    const y = 2.4 + i * 1.25;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 6.4, h: 1.05, fill: { color: GREY }, line: { color: GREY, width: 0 } });
    await iconCircle(s, fa.FaUser, 0.85, y + 0.17, 0.7, RED, WHITE);
    T(s, people[i][0], { x: 1.8, y: y + 0.17, w: 5, h: 0.42, fontFace: HEAD, fontSize: 24, color: INK });
    T(s, people[i][1], { x: 1.8, y: y + 0.6, w: 5, h: 0.3, fontSize: 14, color: RED, italic: true });
  }
  T(s, [
    { text: "Team Name:  ", options: { bold: true, color: INK } }, { text: "The 3C Project — Candid Constructive Conversations", options: { color: INK, breakLine: true } },
    { text: "SBU & Department:  ", options: { bold: true, color: INK } }, { text: "[to be added]", options: { color: RED, italic: true, breakLine: true } },
    { text: "HOD:  ", options: { bold: true, color: INK } }, { text: "[to be added]", options: { color: RED, italic: true } },
  ], { x: 0.6, y: 5.0, w: 6.6, h: 1.1, fontSize: 15, paraSpaceAfter: 6 });
  T(s, "Powered by ITG's video editing, shoot, camera and studio teams — and many more",
    { x: 0.6, y: 6.35, w: 6.6, h: 0.35, fontSize: 12.5, color: MUTE, italic: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.75, y: 2.4, w: 5.0, h: 4.3, fill: { color: GREY }, line: { color: DIM, width: 1.5, dashType: "dash" },
    objectName: "Team photo placeholder" });
  await iconCircle(s, fa.FaCamera, 9.85, 3.9, 0.8, WHITE, MUTE);
  T(s, "Team group picture", { x: 7.75, y: 4.85, w: 5.0, h: 0.4, fontSize: 16, color: MUTE, align: "center" });
  s.addNotes("Two-member core team — Poulomi Saha and Puneet Nayak — supported by video editing, shoot, camera and studio teams across ITG. Still to add: Employee IDs, SBU & Department, HOD, and the team photo.");

  // ---------- 3. Situation ----------
  pres.addSection({ title: "Situation" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Situation" });
  kicker(s, "SITUATION");
  s.addText("INDIA IS TALKING LOUDER — AND LISTENING LESS", { placeholder: "title" });
  const sit = [
    [fa.FaBolt, "A polarised public square", "Caste, faith, youth and justice divide families, campuses and timelines."],
    [fa.FaTv, "Debate TV rewards noise", "Politicians, experts and anchors perform for their side. The middlemen own the conversation."],
    [fa.FaUsers, "Real people go unheard", "Those whose lives are shaped by these issues rarely get to speak to each other."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 2.45 + i * 1.45;
    await iconCircle(s, sit[i][0], 0.6, y, 0.75, RED, WHITE);
    T(s, sit[i][1], { x: 1.6, y: y - 0.02, w: 5.3, h: 0.42, fontSize: 18, bold: true, color: INK });
    T(s, sit[i][2], { x: 1.6, y: y + 0.42, w: 5.3, h: 0.75, fontSize: 14, color: MUTE });
  }
  s.addShape(pres.shapes.RECTANGLE, { x: 7.4, y: 2.4, w: 5.35, h: 4.3, fill: { color: INK }, line: { color: INK, width: 0 } });
  T(s, [{ text: "THIS IS NOT A DEBATE.", options: { color: WHITE, breakLine: true } },
        { text: "THIS IS NOT A SHOUTING MATCH.", options: { color: RED } }],
    { x: 7.85, y: 2.75, w: 4.5, h: 1.9, fontFace: HEAD, fontSize: 32, lineSpacingMultiple: 1.0 });
  T(s, "So we built 3C: common people with divergent views, grounded in lived experience, in a focussed, solution-oriented conversation — to find the common ground we've lost in the noise.",
    { x: 7.85, y: 4.8, w: 4.5, h: 1.6, fontSize: 14, color: WHITE });
  s.addNotes("The problem: polarised discourse and a debate culture that rewards noise. 3C removes the middlemen and puts people with lived experience in conversation with each other.");

  // ---------- 4. Challenges ----------
  pres.addSection({ title: "Challenges" });
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Challenges" });
  kicker(s, "CHALLENGES");
  s.addText("BUILT FROM ZERO", { placeholder: "title" });
  const zeros = [["dedicated team"], ["budget"], ["additional resources"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 2.35;
    T(s, "0", { x, y: 2.15, w: 2.1, h: 1.35, fontFace: HEAD, fontSize: 96, color: RED, valign: "middle" });
    T(s, zeros[i][0].toUpperCase(), { x, y: 3.5, w: 2.1, h: 0.7, fontFace: HEAD, fontSize: 18, color: WHITE });
  }
  T(s, "3C launched as a new IP with no team, no budget and no extra resources of its own.",
    { x: 0.6, y: 4.4, w: 6.6, h: 0.4, fontSize: 14, color: DIM, italic: true });
  const ch = [
    [fa.FaUserCheck, "Finding the right people", "Participants who fit each archetype — checking every stance and background."],
    [fa.FaHandshake, "Getting a yes", "Persuading them to speak candidly, on camera, about India's most contentious issues."],
    [fa.FaCalendarAlt, "Aligning everyone's calendars", "Coordinating each participant's availability, all the way to the shoot."],
    [fa.FaVideo, "Borrowing the crew", "Video editing, shoot, camera and studio teams don't usually have this show — fitting their time into our workflow."],
  ];
  // operational challenges as a column on the right
  for (let i = 0; i < 4; i++) {
    const y = 2.25 + i * 1.12;
    await iconCircle(s, ch[i][0], 7.6, y, 0.65, RED, WHITE);
    T(s, ch[i][1], { x: 8.45, y: y - 0.04, w: 4.3, h: 0.36, fontSize: 16, bold: true, color: WHITE });
    T(s, ch[i][2], { x: 8.45, y: y + 0.32, w: 4.3, h: 0.7, fontSize: 12.5, color: DIM });
  }
  T(s, "Every episode also had to stay civil on India's most sensitive topics — with no anchor or expert to steer.",
    { x: 0.6, y: 5.0, w: 6.3, h: 0.9, fontSize: 18, color: WHITE, bold: true });
  s.addNotes("No dedicated team, no budget, no additional resources. The hardest part of every episode: finding participants who fit the archetype (stance and background), getting them to agree, coordinating everyone's availability through to the shoot — and borrowing video editing, shoot, camera and studio teams who don't normally have this show.");

  // ---------- 5. Action: playbook ----------
  pres.addSection({ title: "Action" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Action" });
  kicker(s, "ACTION");
  s.addText("AN 8-STEP PLAYBOOK FOR EVERY EPISODE", { placeholder: "title" });
  const steps = [
    ["Topic Selection", "Identifying relevant and timely societal issues."],
    ["Archetype Formulation", "Defining the characteristics and experiences of potential participants."],
    ["Candidate Sourcing", "Actively searching for individuals with diverse and contrasting viewpoints."],
    ["Vetting & Finalisation", "Ensuring participants are articulate, open to dialogue and genuine."],
    ["Shoot Planning & Logistics", "Organising every aspect of the recording process."],
    ["Filming", "Capturing the candid conversation."],
    ["Post-Production", "Editing, adding visuals and preparing content for distribution."],
    ["Release", "Launching the episode across platforms."],
  ];
  for (let i = 0; i < 8; i++) {
    const x = 0.6 + (i % 4) * 3.07, y = 2.3 + Math.floor(i / 4) * 2.3;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.87, h: 2.1, fill: { color: GREY }, line: { color: GREY, width: 0 } });
    tag(s, String(i + 1).padStart(2, "0"), x + 0.25, y + 0.25, 0.75, 0.42, 18);
    T(s, steps[i][0], { x: x + 0.25, y: y + 0.8, w: 2.45, h: 0.55, valign: "bottom", fontSize: 14, bold: true, color: i < 4 ? RED : INK });
    T(s, steps[i][1], { x: x + 0.25, y: y + 1.42, w: 2.45, h: 0.6, fontSize: 12, color: MUTE });
  }
  s.addNotes("The repeatable 3C process. Steps 1-4 (red) are the hardest and most time-consuming: picking the topic, defining archetypes, sourcing and vetting real participants.");

  // ---------- 6. Action: synergy & delivery ----------
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Action" });
  kicker(s, "ACTION");
  s.addText("UNLOCKING SYNERGY ACROSS ITG", { placeholder: "title" });
  T(s, "With no team of its own, 3C ran on collaboration: we brought ITG's video editing, shoot, camera and studio teams into the project around their existing work — and kept the show moving.",
    { x: 0.6, y: 2.3, w: 7.0, h: 1.05, fontSize: 15, color: INK });
  const del = [["5", "in-person episodes"], ["1", "live college debate"], ["3+", "X Spaces sessions with the public"], ["2", "TV discussion sessions"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + (i % 2) * 3.55, y = 3.6 + Math.floor(i / 2) * 1.5;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 3.35, h: 1.3, fill: { color: GREY }, line: { color: GREY, width: 0 } });
    T(s, del[i][0], { x: x + 0.2, y: y + 0.12, w: 1.15, h: 1.05, fontFace: HEAD, fontSize: 54, color: RED, valign: "middle" });
    T(s, del[i][1], { x: x + 1.4, y: y + 0.12, w: 1.85, h: 1.05, fontSize: 15, bold: true, color: INK, valign: "middle" });
  }
  T(s, "Plus social media extensions and marketing activities around every release.",
    { x: 0.6, y: 6.6, w: 7.0, h: 0.35, fontSize: 13, color: MUTE, italic: true });
  photo(s, "2.jpg", 8.15, 2.3, 4.6, 4.35, "Audience raising hands at a live 3C debate");
  T(s, "The audience joins the conversation", { x: 8.15, y: 6.72, w: 4.6, h: 0.3, fontSize: 12, color: MUTE, italic: true });
  s.addNotes("How it got done: by unlocking synergy across departments. Delivered 5 in-person episodes, one live debate at a college, X Spaces sessions with the general audience, TV discussion sessions and marketing activities.");

  // ---------- 7. Impact ----------
  pres.addSection({ title: "Impact" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Impact" });
  kicker(s, "IMPACT");
  s.addText("A NEW IP — LAUNCHED, SUSTAINED, HEARD", { placeholder: "title" });
  const stats = [["~2.7M+", "cumulative views*"], ["~1.48M+", "views for Ep 1: Caste Reservations"], ["~4.7K", "live X Spaces tune-ins*"], ["6–7K+", "views per Reddit thread"]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.07;
    T(s, stats[i][0], { x, y: 2.2, w: 2.9, h: 0.95, fontFace: HEAD, fontSize: 50, color: RED, valign: "middle" });
    T(s, stats[i][1], { x, y: 3.15, w: 2.7, h: 0.55, fontSize: 13, color: MUTE });
  }
  const imp = [
    [fa.FaRocket, "A new IP, launched and sustained", "Unlike any usual format in the market — kept going, episode after episode."],
    [fa.FaPiggyBank, "No major resources deployed", "Delivered on goodwill and synergy, not budget."],
    [fa.FaBalanceScale, "The hardest topics, handled civilly", "Common ground found on several points across many episodes."],
    [fa.FaGlobe, "One conversation, every platform", "Episodes, social media, and X Spaces with the general audience."],
  ];
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.95, w: 12.15, h: 2.65, fill: { color: GREY }, line: { color: GREY, width: 0 } });
  for (let i = 0; i < 4; i++) {
    const x = 0.85 + (i % 2) * 6.0, y = 4.2 + Math.floor(i / 2) * 1.2;
    await iconCircle(s, imp[i][0], x, y, 0.65, RED, WHITE);
    T(s, imp[i][1], { x: x + 0.85, y: y - 0.02, w: 4.95, h: 0.36, fontSize: 15.5, bold: true, color: INK });
    T(s, imp[i][2], { x: x + 0.85, y: y + 0.36, w: 4.95, h: 0.6, fontSize: 12.5, color: MUTE });
  }
  T(s, "*First three episodes, YouTube + Instagram + X, directional. X Spaces: Ep 1 ~1K, Ep 2 ~2.5K, Ep 3 ~1.2K live.",
    { x: 0.6, y: 6.75, w: 11.3, h: 0.3, fontSize: 10, color: MUTE, italic: true });
  s.addNotes("Impact: launched and sustained a new IP unlike the usual ones in the market, with no major resources. Tackled the most contentious topics civilly and found common ground on several points. Reach numbers are for the first three episodes; update with episodes 4 and 5 when available.");

  // ---------- 8. Award criteria ----------
  pres.addSection({ title: "Award criteria" });
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Award criteria" });
  kicker(s, "WHY 3C");
  s.addText("AGAINST THE AWARD CRITERIA", { placeholder: "title" });
  const crit = [
    ["INDUSTRY / MEDIA IMPACT", ["A new IP unlike anything in the market: no politicians, experts or anchors — only lived experience",
      "~2.7M+ views and thousands of live participants on India's most divisive topics",
      "Rebuilds trust in ITG through human-centred storytelling"]],
    ["HIGHEST STANDARDS OF DELIVERY", ["5 in-person episodes, a college debate and X Spaces sessions — with zero budget",
      "A repeatable 8-step playbook, from topic to release",
      "Sensitive subjects delivered with editorial care and civility"]],
    ["OUT OF THE BOX + SYNERGY", ["Conversation, not debate; common ground, not winning",
      "A two-person core team powered by video editing, shoot, camera and studio teams",
      "One idea carried across digital, social, X Spaces and TV"]],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.12;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.35, w: 3.9, h: 4.35, fill: { color: "222222" }, line: { color: "222222", width: 0 } });
    tag(s, crit[i][0], x + 0.25, 2.6, 3.4, 0.5, 16);
    T(s, crit[i][1].map((t, j) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < 2 } })),
      { x: x + 0.3, y: 3.35, w: 3.35, h: 3.2, fontSize: 14, color: WHITE, paraSpaceAfter: 12 });
  }
  s.addNotes("Maps 3C to the three Chairman's Award - Team parameters.");

  // ---------- 9. Video ----------
  pres.addSection({ title: "Video" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Video" });
  kicker(s, "WATCH");
  s.addText("3C IN ACTION", { placeholder: "title" });
  s.addShape(pres.shapes.RECTANGLE, { x: 2.65, y: 2.25, w: 8.03, h: 4.52, fill: { color: INK }, line: { color: INK, width: 0 },
    objectName: "Video placeholder" });
  await iconCircle(s, fa.FaPlay, 6.17, 3.85, 1.0, RED, WHITE);
  T(s, "Video to be added", { x: 2.65, y: 5.1, w: 8.03, h: 0.4, fontSize: 16, color: DIM, align: "center" });
  s.addNotes("Placeholder: insert the 3C video here (Insert > Video), sized to the black frame.");

  // ---------- 10. Thank you ----------
  pres.addSection({ title: "Close" });
  s = pres.addSlide({ masterName: "BLANK_DARK", sectionTitle: "Close" });
  s.addImage({ path: logoW, x: 3.67, y: 1.1, w: 6.0, h: 6.0 * LOGO_AR, altText: "Candid Constructive Conversations logo" });
  T(s, "THANK YOU", { x: 0.6, y: 4.4, w: 12.13, h: 0.9, fontFace: HEAD, fontSize: 48, color: WHITE, align: "center", valign: "middle" });
  T(s, "Poulomi Saha  ·  Puneet Nayak  ·  The 3C Project, India Today Group",
    { x: 0.6, y: 5.35, w: 12.13, h: 0.4, fontSize: 15, color: DIM, align: "center" });

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
