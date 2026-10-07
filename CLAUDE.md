# Video tooling

Three ways to make animated video live here. Use the one the task asks for:

- `reels/`: the Python pipeline (Pillow, numpy, ffmpeg) behind the existing painting reels. Changes to those reels stay in it; see `reels/README.md`.
- Remotion (React): `npx remotion studio` / `npx remotion render`. Skills: `/remotion-best-practices`.
- HyperFrames (HTML): `npx hyperframes init`, `check`, `render`. Skills: `/hyperframes`.

All three tools and their skills are installed for this repo only (`package.json`, `.claude/skills/`). The session hook installs dependencies in cloud sessions.

## Cloud session limits
- cdn.jsdelivr.net is blocked, so a composition can't load GSAP or other libraries from a CDN. Copy them from `node_modules` into the project (for example `node_modules/gsap/dist/gsap.min.js`) and reference the local file.
- remotion.media is blocked, so `remotion.config.ts` uses the container's preinstalled headless Chromium.
- `HYPERFRAMES_SKIP_SKILLS=1` keeps `hyperframes init` from installing skills outside this repo.
