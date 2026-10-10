# HIPL launch kit

Open `index.html` for the visual overview.

- `logos/` — outlined SVGs and transparent PNGs of the whole logo family, plus favicon sizes.
- `social/` — 21 ready-to-post images: Instagram launch post, 8-slide carousel, Question 001, Dialogue 01 poster, Exploration card, Write for HIPL, two stories, website share image, YouTube thumbnail, X header, LinkedIn banner, newsletter header, profile picture.
- `copy/launch-copy.md` — bios, captions, LinkedIn post, WhatsApp message, launch-week plan, post templates, Dispatch Issue 01 draft, press note.
- `LAUNCH-CHECKLIST.md` — content, technical, social, launch-day and week-one checks.
- `DEPLOY.md` — hosting, forms, analytics, and the path to Next.js + Payload CMS.
- `templates/` — source artboards (`social.html`) and `render.mjs` to re-export every image after editing placeholders.

Re-export images: from the repo root, run `python3 -m http.server 8790` and then `node hipl-launch-kit/templates/render.mjs http://localhost:8790`.
