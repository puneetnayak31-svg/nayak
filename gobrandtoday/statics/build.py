"""Builds the static marketing pages, then renders every frame to PNG.

    python3 build.py              # build pages/ and render ../output/statics/<piece>/*.png
    python3 build.py cards        # just one piece

Pieces live in src/pieces/<piece>.html. The brand code (fonts, wordmark, sparks, example brands,
logo looks) is inlined from ../video/src so the statics match the videos exactly. render.js opens
each page in Chromium and screenshots every .frame at its exact size; frames with data-pdf are
also printed as vector PDFs (the print poster).
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
VSRC = os.path.join(HERE, "..", "video", "src")
PAGES = os.path.join(HERE, "pages")
OUT = os.path.join(HERE, "..", "output", "statics")


def read(*p):
    return open(os.path.join(*p)).read()


def main(only):
    os.makedirs(PAGES, exist_ok=True)
    link = os.path.join(PAGES, "assets")
    if not os.path.islink(link):
        os.symlink(os.path.join("..", "..", "video", "assets"), link)
    css = read(VSRC, "common.css") + read(SRC, "statics.css")
    js = "\n".join(read(VSRC, f) for f in ("common.js", "wickd.js", "brands.js", "looks.js")) + read(SRC, "statics.js") + read(SRC, "deck.js")
    pieces = sorted(f[:-5] for f in os.listdir(os.path.join(SRC, "pieces")) if f.endswith(".html"))
    pieces = [p for p in pieces if not only or p in only]
    for p in pieces:
        body = read(SRC, "pieces", p + ".html")
        html = f"""<!doctype html><html><head><meta charset="utf-8"><title>{p}</title><style>{css}</style></head>
<body><script>{js}</script><script>
fontsLoaded().then(() => {{
{body}
document.querySelectorAll(".frame").forEach(finish);
window.__ready = true;
}});
</script></body></html>"""
        open(os.path.join(PAGES, p + ".html"), "w").write(html)
    subprocess.run(["node", os.path.join(HERE, "render.js"), PAGES, OUT] + pieces, check=True)


if __name__ == "__main__":
    main(sys.argv[1:])
