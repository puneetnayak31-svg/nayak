#!/usr/bin/env python3
"""Run every check a contributor (or an AI agent) should run before committing.

    python3 tools/check.py           # compile, tests (build, links, data, CMS API)
    python3 tools/check.py --dist    # also fail if the committed dist/ is out of date

Standard library only. Exit code 0 means everything passed.
"""

import compileall
import os
import subprocess
import sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def step(name, ok):
    print(("  ok    " if ok else "  FAIL  ") + name)
    return ok


def main():
    results = []
    quiet = 1
    results.append(step("python files compile", all(
        compileall.compile_dir(os.path.join(SITE, d), quiet=quiet, force=True, legacy=False)
        for d in ("sitekit", "cms", "tools", "tests")) and compileall.compile_file(os.path.join(SITE, "build.py"), quiet=quiet)))
    p = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "tests"], cwd=SITE)
    results.append(step("unit and integration tests", p.returncode == 0))
    if "--dist" in sys.argv:
        b = subprocess.run([sys.executable, "build.py"], cwd=SITE, capture_output=True, text=True)
        d = subprocess.run(["git", "status", "--porcelain", "--", "dist"], cwd=SITE, capture_output=True, text=True)
        fresh = b.returncode == 0 and not d.stdout.strip()
        if not fresh:
            print(d.stdout or b.stderr)
        results.append(step("dist/ matches the sources (run python3 build.py and commit dist/)", fresh))
    print("\nAll checks passed." if all(results) else "\nSome checks failed.")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
