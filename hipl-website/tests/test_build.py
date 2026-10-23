"""The site builds, every page is complete, and every internal link resolves."""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(SITE, "tools"))
from check_links import broken_links  # noqa: E402


def build(*flags):
    out = tempfile.mkdtemp(prefix="hipl-build-")
    p = subprocess.run([sys.executable, os.path.join(SITE, "build.py"), "--out", out, *flags],
                       cwd=SITE, capture_output=True, text=True, timeout=300)
    if p.returncode != 0:
        shutil.rmtree(out, ignore_errors=True)
        raise AssertionError("build failed:\n" + p.stdout + p.stderr)
    return out


def pages(root):
    for d, _, files in os.walk(root):
        for fn in files:
            if fn.endswith(".html") and fn != "_preview.html":
                yield os.path.join(d, fn)


class BuildTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = build()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.out, ignore_errors=True)

    def test_core_pages_exist(self):
        for rel in ["index.html", "about.html", "dialogues.html", "in-person.html", "questions.html",
                    "explorations.html", "voices.html", "write.html", "events/launch-2026.html",
                    "sitemap.xml", "robots.txt", "assets/css/site.css", "assets/js/site.js"]:
            self.assertTrue(os.path.isfile(os.path.join(self.out, rel)), rel)

    def test_page_count(self):
        self.assertGreaterEqual(len(list(pages(self.out))), 40)

    def test_no_unrendered_tokens(self):
        for page in pages(self.out):
            with open(page, encoding="utf-8") as fh:
                text = fh.read()
            rel = os.path.relpath(page, self.out)
            self.assertNotRegex(text, r"\{\{[a-z_]+(:[^}]*)?\}\}", rel)
            self.assertNotIn("<!--sabha", text, rel)
            self.assertNotIn("<!--meta", text, rel)

    def test_every_page_has_title_and_one_h1(self):
        for page in pages(self.out):
            with open(page, encoding="utf-8") as fh:
                text = fh.read()
            rel = os.path.relpath(page, self.out)
            self.assertRegex(text, r"<title>[^<]+</title>", rel)
            if rel != "components.html":  # the component library shows several headings on purpose
                self.assertEqual(len(re.findall(r"<h1[\s>]", text)), 1, rel)

    def test_internal_links_resolve(self):
        bad, total = broken_links(self.out)
        self.assertGreater(total, 500)
        self.assertEqual(bad, [])

    def test_hosted_build_posts_forms_to_cms(self):
        with open(os.path.join(self.out, "index.html"), encoding="utf-8") as fh:
            self.assertIn('data-forms="/api/forms/"', fh.read())


class OfflineBuildTest(unittest.TestCase):
    def test_offline_build_inlines_assets(self):
        out = build("--offline")
        try:
            with open(os.path.join(out, "about.html"), encoding="utf-8") as fh:
                text = fh.read()
            self.assertIn("<style>", text)
            self.assertNotIn('href="assets/css/site.css"', text)
        finally:
            shutil.rmtree(out, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
