#!/usr/bin/env python3
"""List every [PLACEHOLDER] and VERIFY marker left in the content, for the launch checklist.

    python3 tools/find_placeholders.py            # summary by marker
    python3 tools/find_placeholders.py --where    # every occurrence with file and line
"""

import collections
import os
import re
import sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATTERN = re.compile(r"\[(?:VERIFY[^\]]*|[A-Z][A-Z0-9 ,'’&/-]{2,})\]")


def scan():
    for top in ("src/data", "src/pages"):
        for d, _, files in os.walk(os.path.join(SITE, top)):
            for fn in sorted(files):
                if fn.endswith((".json", ".html")):
                    path = os.path.join(d, fn)
                    with open(path, encoding="utf-8") as fh:
                        for i, line in enumerate(fh, 1):
                            for m in PATTERN.finditer(line):
                                yield os.path.relpath(path, SITE), i, m.group(0)


def main():
    hits = list(scan())
    if "--where" in sys.argv:
        for path, line, marker in hits:
            print(f"{path}:{line}  {marker}")
    else:
        for marker, n in collections.Counter(h[2] if not h[2].startswith("[VERIFY") else "[VERIFY …]" for h in hits).most_common():
            print(f"{n:4}  {marker}")
    print(f"\n{len(hits)} markers in {len({h[0] for h in hits})} files. Sample content (status \"sample\") may keep them; real content must not.")


if __name__ == "__main__":
    main()
