#!/usr/bin/env python3
"""Check that every internal link and asset in a built site resolves.

    python3 tools/check_links.py dist

Exit code 1 if anything is broken. External links (http, mailto, tel) are not fetched.
"""

import html.parser
import os
import sys
import urllib.parse

SKIP = ("http://", "https://", "mailto:", "tel:", "data:", "javascript:", "#", "//")


class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.found = []

    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ("href", "src") and v and tag != "base":
                self.found.append(v)


def resolves(root, page, link):
    path = urllib.parse.unquote(link.split("#")[0].split("?")[0])
    if not path:
        return True
    target = os.path.normpath(os.path.join(root, path.lstrip("/")) if path.startswith("/")
                              else os.path.join(os.path.dirname(page), path))
    return any(os.path.isfile(t) for t in (target, target + ".html", os.path.join(target, "index.html")))


def broken_links(root):
    """[(page, link)] for every internal link that doesn't resolve."""
    bad, total = [], 0
    for d, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".html") or fn == "_preview.html":
                continue
            page = os.path.join(d, fn)
            p = Links()
            with open(page, encoding="utf-8") as fh:
                p.feed(fh.read())
            for link in p.found:
                if link.startswith(SKIP) or "{{" in link:
                    continue
                total += 1
                if not resolves(root, page, link):
                    bad.append((os.path.relpath(page, root), link))
    return bad, total


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
    bad, total = broken_links(root)
    for page, link in bad:
        print(f"BROKEN  {page}  ->  {link}")
    print(f"{total} internal links checked, {len(bad)} broken")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
