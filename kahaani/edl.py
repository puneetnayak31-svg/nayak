"""The edit decision list: every visual beat, timed to Vikrant's words (source timeline, seconds).

Times come from a word-level Hindi transcript of the master (Whisper large-v3-turbo). Each beat
names the line it serves so the plan can be checked against the voice.
"""
import os

from gfx import AMBER, ASSETS, LIME, PAPER, WHITE
from treatments import (DepthTitle, FullBleed, InfoCard, KineticPhrase, Matchup, NameSuper, QuestionStack,
                        RunShare, Scoreboard, SideList, SplitScreen, TitleCard)

# Burned into the master and sold/branded: never covered by a treatment (checked by check_edl()).
PROTECTED = [
    (0.00, 11.96, "Pizza Hut pre-roll"),
    (24.24, 30.28, "Kahaani promo L-band"),
    (122.60, 132.92, "Nova Ghee L-band"),
    (387.44, 402.52, "Pizza Hut L-bands"),
    (524.88, 535.20, "Nova Ghee L-band"),
    (592.32, 596.56, "Kahaani promo L-band"),
    (663.64, 693.07, "Sports Tak app end card"),
]

# Photo inserts already in the master (the presenter is not on screen underneath these).
SOURCE_INSERTS = [
    (30.28, 36.32, "IPL owners launch photo"), (141.16, 145.48, "Dhoni, 2007"),
    (248.92, 259.72, "IPL owners launch photo"), (294.60, 299.60, "Richard Madley, auction"),
    (308.68, 313.68, "SRK & Ganguly, KKR launch"), (466.40, 471.40, "McCullum, KKR 2008"),
    (504.80, 508.76, "McCullum roar"), (569.12, 574.12, "SRK celebrating"),
    (587.32, 592.32, "Rajasthan Royals, 2008 champions"),
]


def credit(key):
    """Attribution string for a Commons image, from assets/sourced/CREDITS.json."""
    import json
    p = os.path.join(ASSETS, "sourced", "CREDITS.json")
    if not os.path.exists(p):
        return ""
    c = json.load(open(p)).get(key)
    if not c:
        return ""
    author = c["author"].split("\n")[0][:48]
    return f"Photo: {author} / Wikimedia Commons, {c['licence']}"


def sourced(key, fallback):
    """Path (relative to assets/) of a Commons image if it was downloaded, else a fallback."""
    import glob
    hits = glob.glob(os.path.join(ASSETS, "sourced", key + ".*"))
    hits = [h for h in hits if not h.endswith(".json")]
    if hits:
        return os.path.relpath(hits[0], ASSETS), credit(key)
    return fallback, ""


def beats():
    B = []

    # ---------------------------------------------------------------- COLD OPEN (0:11 – 0:46)
    # 0:00–0:11 Pizza Hut pre-roll: untouched.

    # "अठारह अप्रैल दो हज़ार आठ" — the date lands behind him, word by word.
    B.append(DepthTitle(11.96, 15.30, align="left", x=80, y=110, gap=6, tracking=4,
                        lines=[("18", "display", 250, WHITE, 0.12),
                               ("APRIL", "display", 160, WHITE, 0.94),
                               ("2008", "display", 250, LIME, 1.52)],
                        kicker="BENGALURU", kicker_at=2.1))

    # "एक ऐसा अध्याय शुरू हुआ जिसे आज आप इंडियन प्रीमियर लीग … के नाम से जानते हैं"
    img, cr = sourced("chinnaswamy_night", "from_source/kkr_batter.png")
    B.append(FullBleed(15.30, 20.30, image=img, credit=cr, archive=True,
                       move=(1.02, 1.12, (0.5, 0.55), (0.55, 0.5)),
                       kick="THE VENUE · M. CHINNASWAMY STADIUM", title="INDIAN PREMIER LEAGUE",
                       title_font="display", title_size=150, title_at=2.4))

    # back on Vikrant: his name super, rebuilt in the new style over the original one
    B.append(NameSuper(20.30, 24.20, role="KAHAANI  ·  SPORTS TAK", animate_in=False))

    # 24.24–30.28 Kahaani promo L-band: untouched.

    # The questions he asks become the film's chapters (first two land over the owners' photo
    # that the original edit already cut to; the dolly continues when the picture returns to him).
    B.append(QuestionStack(30.30, 41.10, y=250, size=70,
                           questions=[("IPL लाना इतना आसान था?", 0.10),
                                      ("इसके पीछे की कहानी क्या थी?", 1.12),
                                      ("क्या डर थे, क्या वहम थे?", 7.10),
                                      ("और वो पहली रात…", 9.98)]))

    # "…जिसने IPL को IPL बना दिया। आज वो आपसे शेयर करता हूँ।"
    B.append(TitleCard(41.05, 46.45, image="from_source/kkr_batter.png", focus=(0.62, 0.42),
                       kick="KAHAANI · VIKRANT GUPTA", title="IPL की पहली रात",
                       sub="THE NIGHT THAT MADE THE IPL"))

    # ---------------------------------------------------------------- ACT 5: THE FIRST NIGHT (7:20 – 9:52)
    # "18 तारीख़ सुबह… सुबह तीन या चार बजे मीटिंग ख़त्म हुई… न्यूज़ चैनल को हम कवरेज देंगे"
    B.append(InfoCard(446.40, 459.00, x=60, bottom=70, font1="cond", size1=54,
                      states=[(0.2, "18.04.2008 · ~3–4 AM", "IPL v NEWS CHANNELS", "The meeting ends before dawn"),
                              (6.6, "18.04.2008 · MORNING", "BOYCOTT CALLED OFF",
                               "News channels get coverage, within limits")]))

    # "शायद वो एक मैच न होता, ब्रेंडन मैकलम की वो एक पारी न होती…"
    B.append(FullBleed(466.00, 472.10, image="from_source/mccullum_kkr_2008.png",
                       move=(1.03, 1.12, (0.55, 0.4), (0.5, 0.35)),
                       kick="18.04.2008 · MATCH 1", title="BRENDON McCULLUM", title_font="display",
                       title_size=130, title_at=1.8))

    # "चिन्नास्वामी स्टेडियम… बैंगलोर और कोलकाता… कप्तान राहुल द्रविड़… सौरव गांगुली कप्तान"
    B.append(Matchup(473.90, 483.80, kick="MATCH 1 · M. CHINNASWAMY STADIUM · 8 PM",
                     teams=[("ROYAL\nCHALLENGERS\nBANGALORE", "RAHUL DRAVID", 1.4, 5.4),
                            ("KOLKATA\nKNIGHT\nRIDERS", "SOURAV GANGULY", 2.1, 6.3)]))

    # "सौरव गांगुली और ब्रेंडन मैकलम ओपन करने जाते हैं… नंबर तीन रिकी पोंटिंग… ध्यान सौरव और रिकी पर"
    B.append(SideList(483.90, 504.60, kick="KKR · BATTING ORDER", y=400, size=66, gap=34,
                      font="cond", numbered=True,
                      items=[("SOURAV GANGULY", 0.1), ("BRENDON McCULLUM", 0.8), ("RICKY PONTING", 8.9)],
                      highlight=[(12.2, {0, 2})], notes=[(19.3, 0, "10")]))

    # "…ब्रेंडन मैकलम ने आगाज़ इस तरह से किया कि वो बस पटाखे ही फोड़ते रहे"
    B.append(FullBleed(504.60, 510.50, image="from_source/kkr_batter.png",
                       move=(1.02, 1.14, (0.6, 0.4), (0.62, 0.35)),
                       kick="BRENDON McCULLUM · KKR", title="बस पटाखे ही फोड़ते रहे", title_font="hindi",
                       title_size=104, title_at=2.9))

    # "कोलकाता ने 222 रन बनाए, जिसमें से 158 अकेले मैकलम… 10 दादा के… 20 पोंटिंग… 10 चौके, 13 छक्के"
    B.append(RunShare(510.50, 524.80, at_total=0.2, at_mc=2.2, at_sg=4.8, at_rp=5.8, at_4=8.5, at_6=9.3))

    # 524.88–535.20 Nova Ghee L-band: untouched (Mallya's "I have Test players" lands here).

    # "…वसीम जाफ़र, राहुल द्रविड़, विराट कोहली… कैलिस… ज़हीर ख़ान… अनिल कुंबले"
    B.append(SideList(535.30, 542.60, kick="ROYAL CHALLENGERS · 2008", y=300, size=56, gap=20,
                      font="cond", numbered=False,
                      items=[("WASIM JAFFER", 0.0), ("RAHUL DRAVID", 0.05), ("VIRAT KOHLI", 0.3),
                             ("JACQUES KALLIS", 1.6), ("ZAHEER KHAN", 2.3), ("ANIL KUMBLE", 4.5)]))

    # "बैंगलोर की टीम 82… एक टीम 222 बनाती है, दूसरी टीम 82…"
    B.append(Scoreboard(542.70, 557.00, foot_at=9.8, name_size=60,
                        rows=[("KOLKATA KNIGHT RIDERS", 222, 3, "20 OV", 0.4),
                              ("ROYAL CHALLENGERS", 82, None, "15.1 OV · ALL OUT", 1.3)]))

    # "जाइंट स्क्रीन पर शाहरुख़ ख़ान को… नाचते देखकर… स्पेक्टेटर्स भी झूम रहे थे"
    B.append(FullBleed(564.60, 574.12, image="from_source/srk_celebration.png",
                       move=(1.03, 1.15, (0.35, 0.4), (0.3, 0.35)),
                       kick="SHAH RUKH KHAN · KKR CO-OWNER"))

    # "उसी वक़्त ये क्लियर हो गया कि ये IPL हिट है, सुपर हिट"
    B.append(KineticPhrase(574.20, 579.20, x=110, size=104, accent=2,
                           words=[("IPL", 2.6), ("हिट है।", 3.0), ("सुपर हिट।", 3.6)]))

    # "उस IPL को जीता किसने? सबसे लो प्रोफ़ाइल राजस्थान रॉयल्स… कप्तान शेन वॉर्न… कोचिंग भी"
    B.append(FullBleed(585.30, 592.30, image="from_source/rr_champions_2008.png",
                       move=(1.02, 1.1, (0.5, 0.45), (0.5, 0.4)), fout=0.25,
                       kick="IPL 2008 · CHAMPIONS", title="RAJASTHAN ROYALS", title_font="display",
                       title_size=130, title_at=0.5, sub="CAPTAIN AND COACH: SHANE WARNE", sub_at=2.5))

    return B


def check_edl():
    """Fail loudly if any beat covers a protected sponsor/promo window."""
    bad = []
    for b in beats():
        for p0, p1, name in PROTECTED:
            if b.start < p1 - 0.02 and b.end > p0 + 0.02:
                bad.append(f"{type(b).__name__} {b.start:.2f}-{b.end:.2f} overlaps {name} {p0}-{p1}")
    return bad


if __name__ == "__main__":
    probs = check_edl()
    print("\n".join(probs) if probs else f"EDL ok: {len(beats())} beats, no protected window touched")
