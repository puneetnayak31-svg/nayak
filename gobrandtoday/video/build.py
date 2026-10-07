"""Builds the GoBrandToday compositions: one self-contained HTML file per video and format.

    python3 build.py            # writes projects/<video>-16x9/ and projects/<video>-9x16/

Each project is a HyperFrames project (one root index.html each) whose assets/ links to the shared
assets folder here. Render one with: npx hyperframes render projects/<video>-<format>

Sources live in src/: common.css and common.js are inlined into each template, and {{W}}, {{H}}
and {{FMT}} are filled in per format. The score comes from ../audio (python3 ../audio/sound.py).
"""
import base64
import io
import os
import json
import shutil

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
FORMATS = {"16x9": (1920, 1080, "H"), "9x16": (1080, 1920, "V")}
VIDEOS = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith(".html"))


def grain():
    """A 256 px tileable film-grain texture, seeded so every build is identical."""
    rng = np.random.default_rng(5)
    g = rng.normal(128, 38, (256, 256)).clip(0, 255).astype("uint8")
    Image.fromarray(g, "L").save(os.path.join(HERE, "assets", "grain.png"))


def main():
    os.makedirs(os.path.join(HERE, "assets", "audio"), exist_ok=True)
    grain()
    out = os.path.join(HERE, "..", "audio", "out")
    for f in sorted(os.listdir(out)):
        if f.endswith(".wav"):
            shutil.copy(os.path.join(out, f), os.path.join(HERE, "assets", "audio", f))
    shorts = os.path.join(out, "shorts")
    os.makedirs(os.path.join(HERE, "assets", "audio", "shorts"), exist_ok=True)
    for f in sorted(os.listdir(shorts)) if os.path.isdir(shorts) else []:
        if f.endswith(".wav") and not f.endswith("-music.wav") and ".raw." not in f:
            shutil.copy(os.path.join(shorts, f), os.path.join(HERE, "assets", "audio", "shorts", f))
    css = open(os.path.join(SRC, "common.css")).read()
    js = open(os.path.join(SRC, "common.js")).read()
    wickd = open(os.path.join(SRC, "wickd.js")).read()
    kit_css = open(os.path.join(SRC, "kit.css")).read()
    kit_js = open(os.path.join(SRC, "kit.js")).read()
    brands = open(os.path.join(SRC, "brands.js")).read()
    looks = open(os.path.join(SRC, "looks.js")).read()
    jobs = []
    for v in VIDEOS:
        tpl = open(os.path.join(SRC, v + ".html")).read()
        variants = os.path.join(SRC, v + "s.json")      # e.g. naming-rule.html + naming-rules.json -> one video per entry
        if os.path.exists(variants):
            for slug, params in json.load(open(variants)).items():
                jobs.append((slug, tpl.replace("{{PARAMS}}", json.dumps(params)).replace("{{SLUG}}", slug)))
        else:
            jobs.append((v, tpl))
    for v, tpl in jobs:
        for name, (w, h, fmt) in FORMATS.items():
            html = (tpl.replace("{{COMMON_CSS}}", css).replace("{{COMMON_JS}}", js).replace("{{WICKD_JS}}", wickd)
                    .replace("{{KIT_CSS}}", kit_css).replace("{{KIT_JS}}", kit_js).replace("{{BRANDS_JS}}", brands).replace("{{LOOKS_JS}}", looks)
                    .replace("{{W}}", str(w)).replace("{{H}}", str(h)).replace("{{FMT}}", fmt))
            proj = os.path.join(HERE, "projects", f"{v}-{name}")
            os.makedirs(proj, exist_ok=True)
            link = os.path.join(proj, "assets")
            if not os.path.islink(link):
                os.symlink(os.path.join("..", "..", "assets"), link)
            open(os.path.join(proj, "index.html"), "w").write(html)
            json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                       "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
                       "media": {"autoProxy": True}}, open(os.path.join(proj, "hyperframes.json"), "w"), indent=2)
            json.dump({"id": f"gobrandtoday-{v}-{name}", "name": f"gobrandtoday {v} {name}"},
                      open(os.path.join(proj, "meta.json"), "w"), indent=2)
            print("wrote", os.path.relpath(proj, HERE))


if __name__ == "__main__":
    main()
