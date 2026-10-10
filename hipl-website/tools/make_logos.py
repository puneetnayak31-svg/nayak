"""Export the HIPL Sabha logo family as standalone SVG files.

The geometry is copied from the master artwork in the Sabha brand guidelines
(symbol: 24 bars + bindu on a 200x200 grid; horizontal lockup: 860x232;
stacked lockup: 572x476). The wordmark and full name are converted to
outlines with fontTools so the files render the same everywhere, without
the Unbounded or Instrument Sans fonts installed.

Run:  python3 tools/make_logos.py   (needs: pip install fonttools brotli)
"""

import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "brand")

MIDNIGHT, SAFFRON, MARIGOLD, LOTUS, CHALK = "#14123A", "#FF8A1F", "#FFC93C", "#FF6FA3", "#F7F3EC"

# (y, height, colour-slot) for each bar, every 15 degrees, from the master symbol.
BARS = [
    (16, 44, 1), (30, 30, 2), (8, 52, 1), (36, 24, 1), (20, 40, 3), (4, 56, 1),
    (32, 28, 2), (12, 48, 1), (24, 36, 1), (1, 59, 3), (34, 26, 1), (16, 44, 2),
    (10, 50, 1), (28, 32, 1), (2, 58, 3), (38, 22, 1), (14, 46, 2), (22, 38, 1),
    (6, 54, 1), (32, 28, 3), (18, 42, 1), (26, 34, 2), (4, 56, 1), (30, 30, 1),
]


def symbol(c1, c2, c3, core, transform=""):
    slot = {1: c1, 2: c2, 3: c3}
    parts = [f'<g{f" transform={chr(34)}{transform}{chr(34)}" if transform else ""}>']
    for i, (y, h, s) in enumerate(BARS):
        parts.append(
            f'<rect x="96" y="{y}" width="8" height="{h}" rx="4" fill="{slot[s]}" '
            f'transform="rotate({i * 15} 100 100)"/>'
        )
    parts.append(f'<circle cx="100" cy="100" r="24" fill="{core}"/>')
    parts.append("</g>")
    return "".join(parts)


def justified_text(font, text, size, left, right, baseline):
    """Outline `text` so its ink runs exactly from `left` to `right` (a justified block)."""
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    s = size / upm
    names = [cmap[ord(ch)] for ch in text]
    glyf = font["glyf"] if "glyf" in font else None
    advances, xmins, xmaxs = [], [], []
    for n in names:
        advances.append(font["hmtx"][n][0])
        if glyf is not None and hasattr(glyf[n], "xMin") and glyf[n].numberOfContours:
            xmins.append(glyf[n].xMin)
            xmaxs.append(glyf[n].xMax)
        else:
            xmins.append(0)
            xmaxs.append(advances[-1])
    natural = []
    x = 0
    for a in advances:
        natural.append(x)
        x += a
    n = len(names)
    # ink_left = offset + xmin0*s ; ink_right = offset + (natural[-1] + (n-1)*d)*s + xmax_last*s
    offset = left - xmins[0] * s
    span = (right - offset) / s - natural[-1] - xmaxs[-1]
    d = span / (n - 1)
    paths = []
    for i, name in enumerate(names):
        if text[i] == " ":
            continue
        pen = SVGPathPen(gs)
        ox = offset + (natural[i] + i * d) * s
        tpen = TransformPen(pen, (s, 0, 0, -s, ox, baseline))
        gs[name].draw(tpen)
        paths.append(pen.getCommands())
    return " ".join(paths)


def main():
    unb = TTFont(os.path.join(HERE, "unbounded800.woff2"))
    ins = TTFont(os.path.join(HERE, "instrument600.woff2"))
    os.makedirs(OUT, exist_ok=True)

    # Horizontal lockup geometry (from the master: text block x 288..860).
    h_word = justified_text(unb, "HIPL", 196, 288, 860, 150)
    h_name = justified_text(ins, "HINDUISM IN PUBLIC LIFE", 31, 288, 860, 226)
    # Stacked lockup: text block x 0..572, symbol centred above.
    s_word = justified_text(unb, "HIPL", 196, 0, 572, 394)
    s_name = justified_text(ins, "HINDUISM IN PUBLIC LIFE", 31, 0, 572, 470)
    # Compact symbol + HIPL (for small sizes, under 240px wide).
    c_word = justified_text(unb, "HIPL", 196, 288, 860, 166)

    def write(name, vb, body, label):
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{label}">'
            f"<title>{label}</title>{body}</svg>\n"
        )
        with open(os.path.join(OUT, name), "w") as f:
            f.write(svg)

    def lockup_h(name, c1, c2, c3, core, wm, rule, label):
        body = (
            f'<svg x="0" y="0" width="232" height="232" viewBox="0 0 200 200">{symbol(c1, c2, c3, core)}</svg>'
            f'<path fill="{wm}" d="{h_word}"/>'
            f'<rect x="288" y="174" width="572" height="5" fill="{rule}"/>'
            f'<path fill="{wm}" d="{h_name}"/>'
        )
        write(name, "0 0 860 232", body, label)

    def lockup_s(name, c1, c2, c3, core, wm, rule, label):
        body = (
            f'<svg x="170" y="0" width="232" height="232" viewBox="0 0 200 200">{symbol(c1, c2, c3, core)}</svg>'
            f'<path fill="{wm}" d="{s_word}"/>'
            f'<rect x="0" y="418" width="572" height="5" fill="{rule}"/>'
            f'<path fill="{wm}" d="{s_name}"/>'
        )
        write(name, "0 0 572 476", body, label)

    def compact(name, c1, c2, c3, core, wm, label):
        body = (
            f'<svg x="0" y="0" width="232" height="232" viewBox="0 0 200 200">{symbol(c1, c2, c3, core)}</svg>'
            f'<path fill="{wm}" d="{c_word}"/>'
        )
        write(name, "0 0 860 232", body, label)

    def sym(name, c1, c2, c3, core, label):
        write(name, "0 0 200 200", symbol(c1, c2, c3, core), label)

    full = (SAFFRON, MARIGOLD, LOTUS)
    lockup_h("hipl-lockup-horizontal-on-light.svg", *full, MIDNIGHT, MIDNIGHT, SAFFRON, "HIPL — Hinduism in Public Life")
    lockup_h("hipl-lockup-horizontal-on-dark.svg", *full, CHALK, CHALK, SAFFRON, "HIPL — Hinduism in Public Life")
    lockup_h("hipl-lockup-mono-midnight.svg", *(MIDNIGHT,) * 3, MIDNIGHT, MIDNIGHT, MIDNIGHT, "HIPL — Hinduism in Public Life")
    lockup_h("hipl-lockup-mono-chalk.svg", *(CHALK,) * 3, CHALK, CHALK, CHALK, "HIPL — Hinduism in Public Life")
    lockup_s("hipl-lockup-stacked-on-dark.svg", *full, CHALK, CHALK, SAFFRON, "HIPL — Hinduism in Public Life")
    lockup_s("hipl-lockup-stacked-on-light.svg", *full, MIDNIGHT, MIDNIGHT, SAFFRON, "HIPL — Hinduism in Public Life")
    compact("hipl-compact-on-light.svg", *full, MIDNIGHT, MIDNIGHT, "HIPL")
    compact("hipl-compact-on-dark.svg", *full, CHALK, CHALK, "HIPL")
    sym("hipl-symbol-on-light.svg", *full, MIDNIGHT, "HIPL symbol")
    sym("hipl-symbol-on-dark.svg", *full, CHALK, "HIPL symbol")
    sym("hipl-symbol-mono-midnight.svg", MIDNIGHT, MIDNIGHT, MIDNIGHT, CHALK, "HIPL symbol")
    sym("hipl-symbol-mono-chalk.svg", CHALK, CHALK, CHALK, MIDNIGHT, "HIPL symbol")

    # Social avatar: midnight circle, full-colour symbol.
    write(
        "hipl-avatar.svg", "0 0 120 120",
        f'<circle cx="60" cy="60" r="60" fill="{MIDNIGHT}"/>'
        f'<svg x="14" y="14" width="92" height="92" viewBox="0 0 200 200">{symbol(*full, CHALK)}</svg>',
        "HIPL",
    )
    # App icon / favicon: midnight rounded square, saffron symbol.
    write(
        "hipl-favicon.svg", "0 0 48 48",
        f'<rect width="48" height="48" rx="10" fill="{MIDNIGHT}"/>'
        f'<svg x="5" y="5" width="38" height="38" viewBox="0 0 200 200">{symbol(SAFFRON, SAFFRON, SAFFRON, CHALK)}</svg>',
        "HIPL",
    )
    print("wrote", len(os.listdir(OUT)), "files to", os.path.normpath(OUT))


if __name__ == "__main__":
    sys.exit(main())
