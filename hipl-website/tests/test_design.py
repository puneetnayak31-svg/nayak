"""The Sabha brand rules that code can check: palette, fonts, no shadows or glows on the brand.

See docs/DESIGN-SYSTEM.md. If a test here fails, use a token from :root in
assets/css/site.css instead of a new value, or ask the owner before adding one.
"""

import os
import re
import unittest

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(SITE, "assets", "css", "site.css")
JS = os.path.join(SITE, "assets", "js", "site.js")

# Brand palette (guidelines §05) plus the tints and inks derived from it in :root.
PALETTE = {"#14123A", "#2A2650", "#3B3670", "#FF8A1F", "#B4530A", "#FFC93C", "#FF6FA3", "#F7F3EC",
           "#E9E3D7", "#FFFFFF", "#DDD5C6", "#5B577A", "#C9C3E8", "#DCD7F2", "#A0153E", "#B0124F", "#FFF4E5"}
RGB = {(20, 18, 58), (247, 243, 236), (255, 201, 60), (255, 138, 31), (255, 111, 163), (255, 255, 255), (0, 0, 0)}
FONTS = {"Unbounded", "Instrument Sans", "Mukta"}


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def split_root(css):
    start = css.index(":root")
    end = css.index("}", start)
    return css[start:end], css[:start] + css[end:]


class DesignTest(unittest.TestCase):
    def test_root_tokens_are_the_palette(self):
        root, _ = split_root(read(CSS))
        used = {h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}\b", root)}
        self.assertEqual(used - PALETTE, set(), "new colour token: check it against the brand palette")

    def test_css_uses_tokens_not_raw_hex(self):
        _, rest = split_root(read(CSS))
        raw = set(re.findall(r"#[0-9A-Fa-f]{3,8}\b", rest))
        self.assertEqual(raw, set(), "use var(--token) from :root instead of raw hex colours")

    def test_transparent_colours_derive_from_the_palette(self):
        for r, g, b in re.findall(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", read(CSS)):
            self.assertIn((int(r), int(g), int(b)), RGB)

    def test_canvas_and_share_images_use_the_palette(self):
        raw = {h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}\b", read(JS))}
        self.assertEqual(raw - PALETTE, set())

    def test_templates_and_renderers_use_the_palette(self):
        # The public site only. The admin app (cms/admin) is an internal tool with its own status colours.
        paths = [os.path.join(SITE, "build.py")] + [os.path.join(SITE, "sitekit", f) for f in os.listdir(os.path.join(SITE, "sitekit")) if f.endswith(".py")]
        for d, _, files in os.walk(os.path.join(SITE, "src", "pages")):
            paths += [os.path.join(d, f) for f in files if f.endswith(".html")]
        for path in paths:
            raw = {h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}\b", read(path))}
            self.assertEqual(raw - PALETTE, set(), os.path.relpath(path, SITE))

    def test_only_brand_fonts(self):
        css = read(CSS) + read(os.path.join(SITE, "assets", "fonts", "fonts.css"))
        families = set(re.findall(r'font-family:\s*"([^"]+)"', css))
        self.assertEqual(families - FONTS, set())

    def test_square_corners(self):
        # Circles (50%) and pills (999px) are fine; cards, buttons and inputs stay square.
        allowed_exceptions = {".orbit-node"}  # In Person orbit labels, approved by the owner as built
        for sel, radius in re.findall(r"([^{}]+)\{[^}]*border-radius:\s*([^;}]+)", read(CSS)):
            if radius.strip() in ("50%", "999px", "0"):
                continue
            self.assertIn(sel.strip().split()[0], allowed_exceptions, f"rounded corners on {sel.strip()}: the brand uses square corners")

    def test_no_glows_or_text_shadows(self):
        css = read(CSS)
        self.assertNotIn("text-shadow", css)
        self.assertNotRegex(css, r"filter:\s*drop-shadow")


if __name__ == "__main__":
    unittest.main()
