"""Fetch freely-licensed reference images from Wikimedia Commons, with licence + attribution.

Usage:  python3 source_images.py            # downloads everything in WANTED into assets/sourced/
Every file's licence, author and source page are written to assets/sourced/CREDITS.json, and the
render burns a small credit line onto the frame while the image is on screen.
Only public-domain / CC0 / CC BY / CC BY-SA files are accepted.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets", "sourced")
UA = "KahaaniResearch/0.1 (sports documentary research)"
API = "https://commons.wikimedia.org/w/api.php"
OK_LICENCES = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)", re.I)

# key -> exact Commons file title (picked by hand after searching; see README for why each is used)
WANTED = json.load(open(os.path.join(HERE, "sourced_wanted.json"))) if os.path.exists(
    os.path.join(HERE, "sourced_wanted.json")) else {}


def api(params, tries=5):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:  # 429 from shared egress: back off
            if i == tries - 1:
                raise
            time.sleep(4 * (i + 1))


def search(q, n=15):
    r = api({"action": "query", "list": "search", "srsearch": q, "srnamespace": 6, "srlimit": n})
    return [s["title"] for s in r["query"]["search"]]


def info(title, width=2400):
    r = api({"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata|size",
             "iiurlwidth": width})
    page = next(iter(r["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    md = ii.get("extmetadata", {})
    strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
    return {
        "title": title,
        "url": ii.get("thumburl") or ii["url"],
        "page": ii["descriptionurl"],
        "licence": strip(md.get("LicenseShortName", {}).get("value")),
        "author": strip(md.get("Artist", {}).get("value")),
        "date": strip(md.get("DateTimeOriginal", {}).get("value")),
        "description": strip(md.get("ImageDescription", {}).get("value"))[:300],
        "size": [ii["width"], ii["height"]],
    }


def download(key, title):
    meta = info(title)
    if not OK_LICENCES.match(meta["licence"]):
        print(f"SKIP {key}: licence '{meta['licence']}' not accepted")
        return None
    ext = os.path.splitext(urllib.parse.urlparse(meta["url"]).path)[1].lower() or ".jpg"
    path = os.path.join(OUT, key + ext)
    req = urllib.request.Request(meta["url"], headers={"User-Agent": UA})
    for i in range(5):
        try:
            open(path, "wb").write(urllib.request.urlopen(req, timeout=60).read())
            break
        except Exception:
            time.sleep(4 * (i + 1))
    meta["file"] = os.path.basename(path)
    print(f"OK   {key}: {meta['licence']} — {meta['author'][:60]}")
    return meta


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 2 and sys.argv[1] == "search":
        for t in search(" ".join(sys.argv[2:])):
            print(t)
        sys.exit()
    credits_path = os.path.join(OUT, "CREDITS.json")
    credits = json.load(open(credits_path)) if os.path.exists(credits_path) else {}
    for key, title in WANTED.items():
        if key in credits and os.path.exists(os.path.join(OUT, credits[key]["file"])):
            continue
        try:
            m = download(key, title)
        except Exception as e:          # rate-limited: leave it for the next run
            print(f"WAIT {key}: {e}")
            time.sleep(20)
            continue
        if m:
            credits[key] = m
            json.dump(credits, open(credits_path, "w"), indent=1, ensure_ascii=False)
        time.sleep(3)
    json.dump(credits, open(credits_path, "w"), indent=1, ensure_ascii=False)
