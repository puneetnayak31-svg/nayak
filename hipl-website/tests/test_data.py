"""Content files in src/data are valid and consistent with the CMS content model."""

import json
import os
import re
import sys
import unittest

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SITE)
sys.path.insert(0, os.path.join(SITE, "cms"))
import content_model as CM  # noqa: E402
from sitekit import blocks as BK  # noqa: E402

DATA = os.path.join(SITE, "src", "data")
PAGES = os.path.join(SITE, "src", "pages")


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as fh:
        return json.load(fh)


class DataTest(unittest.TestCase):
    def test_every_json_file_parses(self):
        for fn in os.listdir(DATA):
            if fn.endswith(".json"):
                load(fn)

    def test_collection_keys_are_unique(self):
        for col in CM.COLLECTIONS:
            if col.get("single"):
                continue
            items = load(col["file"]).get(col["path"], [])
            keys = [str(it.get(col["key"])) for it in items]
            dupes = {k for k in keys if keys.count(k) > 1}
            self.assertFalse(dupes, f"{col['id']}: duplicate {col['key']} {dupes}")

    def test_slugs_are_url_safe(self):
        for col in CM.COLLECTIONS:
            if col.get("single") or col.get("key") != "slug":
                continue
            for it in load(col["file"]).get(col["path"], []):
                self.assertRegex(it["slug"], r"^[a-z0-9]+(-[a-z0-9]+)*$", col["id"])

    def test_published_explorations_are_clean(self):
        for e in load("explorations.json")["entries"]:
            if e.get("status") == "published" and e.get("blocks"):
                self.assertEqual(BK.validate(e), [], f"entry {e['n']}")

    def test_explorations_reference_known_series(self):
        data = load("explorations.json")
        series = {s["slug"] for s in data["series"]}
        numbers = {e["n"] for e in data["entries"]}
        for e in data["entries"]:
            self.assertIn(e["series"], series, e["n"])
            for r in e.get("related") or []:
                self.assertIn(r, numbers, f"entry {e['n']} relates to missing {r}")

    def test_events_have_dates_or_labels(self):
        for ev in load("events.json")["events"]:
            if ev.get("status") == "upcoming":
                self.assertTrue(ev.get("date") or ev.get("date_label"), ev["slug"])
                if ev.get("date"):
                    self.assertRegex(ev["date"], r"^\d{4}-\d{2}-\d{2}$", ev["slug"])

    def test_pages_start_with_meta(self):
        for d, _, files in os.walk(PAGES):
            for fn in files:
                if fn.endswith(".html"):
                    with open(os.path.join(d, fn), encoding="utf-8") as fh:
                        head = fh.read(400)
                    m = re.match(r"\s*<!--meta (\{.*?\}) -->", head, re.S)
                    self.assertTrue(m, fn)
                    json.loads(m.group(1))

    def test_content_model_files_exist(self):
        for col in CM.COLLECTIONS:
            self.assertTrue(os.path.isfile(os.path.join(DATA, col["file"])), col["id"])


if __name__ == "__main__":
    unittest.main()
