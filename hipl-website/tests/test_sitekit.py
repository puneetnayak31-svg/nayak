"""Markdown safety, the Explorations block renderer and the shared block schema."""

import html.parser
import json
import os
import sys
import unittest

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SITE)
from sitekit import blocks as BK, md as MD  # noqa: E402
from sitekit.schema import BLOCKS, CLAIMS, entry_json_schema  # noqa: E402

class Tags(html.parser.HTMLParser):
    """Collects the element names and any on* event-handler attributes in a page."""

    def __init__(self):
        super().__init__()
        self.names, self.handlers = set(), []

    def handle_starttag(self, tag, attrs):
        self.names.add(tag)
        self.handlers += [k for k, _ in attrs if k.startswith("on")]


XSS = '<script>alert(1)</script><img src=x onerror=alert(2)>'


def sample_value(fd, text):
    k = fd["kind"]
    if k == "number":
        return 20
    if k == "bool":
        return True
    if k == "claim":
        return "text"
    if k == "select":
        return fd["options"][0]
    if k == "image":
        return ""
    if k == "list":
        return [{c["name"]: sample_value(c, text) for c in fd["fields"]} for _ in range(2)]
    return text


def sample_block(t, text="Sample **text** about [[dharma]] [^1]"):
    b = {"type": t}
    for fd in BLOCKS[t]["fields"]:
        b[fd["name"]] = sample_value(fd, text)
    return b


def entry(blocks, **extra):
    e = {"n": 99, "title": "Test entry", "slug": "test", "series": "hindu-universe", "type": "explainer",
         "level": "Beginner", "read": 5, "hook": "A hook", "status": "draft", "blocks": blocks,
         "sources": [{"text": "A source", "url": "", "verify": False}]}
    e.update(extra)
    return e


def render(e):
    return BK.render_entry(e, {"name": "The Hindu Universe"}, "../../", lambda ns: "", {"explainer": "Explainer"})


class MarkdownTest(unittest.TestCase):
    def test_html_is_escaped(self):
        out = MD.render(XSS)
        self.assertNotIn("<script", out)
        self.assertNotIn("<img", out)

    def test_inline_formatting(self):
        out = MD.inline("**bold** and *it*")
        self.assertIn("<b>bold</b>", out)
        self.assertIn("<i>it</i>", out)

    def test_javascript_links_are_not_rendered(self):
        self.assertNotIn('href="javascript:', MD.render("[x](javascript:alert(1))"))


class BlockTest(unittest.TestCase):
    def test_every_block_type_renders(self):
        html = render(entry([sample_block(t) for t in BLOCKS]))
        self.assertIn("Test entry", html)
        self.assertGreater(len(html), 5000)

    def test_block_text_is_escaped(self):
        html = render(entry([sample_block(t, XSS) for t in BLOCKS], title=XSS, hook=XSS))
        tags = Tags()
        tags.feed(html)
        self.assertNotIn("script", tags.names)
        self.assertNotIn("img", tags.names)
        self.assertEqual(tags.handlers, [])

    def test_empty_blocks_do_not_crash(self):
        render(entry([{"type": t} for t in BLOCKS]))

    def test_validate_flags_editorial_problems(self):
        problems = BK.validate(entry([{"type": "pull_quote", "text": "Q [VERIFY]", "source": ""},
                                      {"type": "image", "src": "assets/uploads/x.png", "alt": ""},
                                      {"type": "nonsense"}], sources=[]))
        joined = " | ".join(problems)
        for needle in ["pull quote has no source", "alt text", "unknown type", "VERIFY", "No sources"]:
            self.assertIn(needle, joined)

    def test_validate_passes_clean_entry(self):
        self.assertEqual(BK.validate(entry([sample_block("hook", "Plain text")])), [])


class SchemaTest(unittest.TestCase):
    def test_field_kinds_are_known(self):
        kinds = {"text", "md", "select", "claim", "number", "bool", "image", "list"}

        def walk(fields):
            for fd in fields:
                self.assertIn(fd["kind"], kinds, fd["name"])
                if fd["kind"] == "list":
                    walk(fd["fields"])
                if fd["kind"] == "select":
                    self.assertTrue(fd["options"])
        for t, b in BLOCKS.items():
            self.assertTrue(b["label"] and b["help"], t)
            walk(b["fields"])

    def test_entry_schema_covers_every_block(self):
        schema = entry_json_schema()
        json.dumps(schema)  # serialisable for the API
        variants = schema["properties"]["blocks"]["items"]["anyOf"]
        self.assertEqual({v["properties"]["type"]["const"] for v in variants}, set(BLOCKS))
        for v in variants:
            self.assertFalse(v["additionalProperties"])
            self.assertEqual(sorted(v["required"]), sorted(v["properties"]))

    def test_claim_labels(self):
        self.assertIn("", CLAIMS)
        self.assertIn("debate", CLAIMS)


if __name__ == "__main__":
    unittest.main()
